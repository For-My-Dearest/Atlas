import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import importData from './campaign-import.json';

const db = new PrismaClient();

function cleanImportedText(input: string) {
  return input
    .replace(/\r\n?/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/<br\s*\/?>(?=\S)/gi, '\n')
    .replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, '$1')
    .replace(/^\[\^\d+\]:.*$/gm, '')
    .replace(/^\s*---\s*$/gm, '---')
    .replace(/^[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function isRtl(text: string) { return /[\u0590-\u08FF]/.test(text); }


async function upsertUser(email: string, displayName: string) {
  const passwordHash = await bcrypt.hash('change-me-now', 12);
  return db.user.upsert({
    where: { email },
    update: { displayName },
    create: { email, displayName, passwordHash },
  });
}

async function main() {
  const c = (await db.campaign.findFirst({ where: { name: 'The Living Atlas' } })) ??
    await db.campaign.create({ data: { name: 'The Living Atlas', description: 'Imported campaign workspace.' } });

  // Never overwrite existing account passwords/emails after the first seed.
  let gm = (await db.campaignMember.findFirst({ where: { campaignId: c.id, role: 'GM' } }))
    ? await db.user.findUniqueOrThrow({ where: { id: (await db.campaignMember.findFirstOrThrow({ where: { campaignId: c.id, role: 'GM' } })).userId } })
    : await upsertUser('gm@living-atlas.local', 'Game Master');
  let player = (await db.campaignMember.findFirst({ where: { campaignId: c.id, role: 'PLAYER' } }))
    ? await db.user.findUniqueOrThrow({ where: { id: (await db.campaignMember.findFirstOrThrow({ where: { campaignId: c.id, role: 'PLAYER' } })).userId } })
    : await upsertUser('player@living-atlas.local', 'Player');

  await db.campaignMember.upsert({ where: { userId_campaignId: { userId: gm.id, campaignId: c.id } }, update: { role: 'GM' }, create: { campaignId: c.id, userId: gm.id, role: 'GM' } });
  await db.campaignMember.upsert({ where: { userId_campaignId: { userId: player.id, campaignId: c.id } }, update: { role: 'PLAYER' }, create: { campaignId: c.id, userId: player.id, role: 'PLAYER' } });

  const maps = [
    ['The Aethdom', '/assets/maps/The Aethdom.png', 1200, 896, null],
    ['The Solaris Empire', '/assets/maps/Solaris.png', 1536, 1024, 'The Aethdom'],
    ['Arcadia', '/assets/maps/Solaris/Arcadia.png', 1254, 1254, 'The Solaris Empire'],
    ['The Kingdom of Sylvanus', '/assets/maps/Sylvanus.png', 1536, 1024, 'The Aethdom'],
    ['The Frostfell', '/assets/maps/Frostfell.png', 1536, 1024, 'The Aethdom'],
    ['The Drak-Garr Empire', '/assets/maps/The Dark Garr.png', 1536, 1024, 'The Aethdom'],
    ['The Etherium Archipelago', '/assets/maps/The Etherium Archipelago.png', 1536, 1024, 'The Aethdom'],
  ] as const;
  const mapIds = new Map<string,string>();
  for (const [name, imageUrl, width, height, parentName] of maps) {
    const existing = await db.map.findFirst({ where: { campaignId: c.id, OR: [{ name }, { imageUrl }] } });
    const parentId = parentName ? mapIds.get(parentName) ?? (await db.map.findFirst({where:{campaignId:c.id,name:parentName}}))?.id ?? null : null;
    const row = existing
      ? await db.map.update({ where: { id: existing.id }, data: { imageUrl, width, height, parentId } })
      : await db.map.create({ data: { campaignId: c.id, name, imageUrl, width, height, parentId } });
    mapIds.set(name, row.id);
  }

  // Import the campaign's world tree. The hierarchy is intentionally represented by Locations,
  // while the full source documents remain available as notes below.
  const locationByKey = new Map<string, string>();
  for (const item of importData.locations) {
    const parentId = item.parentKey ? locationByKey.get(item.parentKey) ?? null : null;
    const key = parentId ? `${item.parentKey}` : item.name;
    const existing = await db.location.findFirst({ where: { campaignId: c.id, name: item.name, parentId } });
    const loc = existing
      ? await db.location.update({ where: { id: existing.id }, data: { type: item.type, description: item.description ?? existing.description, archived: false } })
      : await db.location.create({ data: { campaignId: c.id, name: item.name, type: item.type, description: item.description ?? null, parentId } });
    // For child keys, use the logical imported path rather than generated ids.
    locationByKey.set(item.parentKey ? `${item.parentKey}/${item.name}` : item.name, loc.id);
  }

  // Import NPC/character documents without creating duplicates for the original starter characters.
  // Existing starter characters are preserved; their imported source is merged into GM-only notes.
  const characterAliases: Record<string, string> = {
    'Blackwood Family': 'Blackwood family',
    'Elara': 'Elara Moongate',
    'Gron': 'Gron Stonehammer',
    'Meriele Holymion': 'Meriele Holymion',
    'Rosie Bloom': 'Rosie',
    'Sir Kai': 'Sir Kai',
  };

  for (const item of importData.characters) {
    const cleaned = cleanImportedText(item.body);
    const targetName = characterAliases[item.name] || item.name;
    let target = await db.character.findFirst({ where: { campaignId: c.id, name: targetName } });
    const importedDuplicate = item.name !== targetName
      ? await db.character.findFirst({ where: { campaignId: c.id, name: item.name, sourcePath: item.sourcePath } })
      : null;

    if (!target) {
      target = await db.character.create({
        data: { campaignId: c.id, name: targetName, gmInfo: cleaned, sourcePath: item.sourcePath, publicInfo: null, description: null },
      });
    } else {
      // Preserve the character's existing portrait/public data. Only the DM file is refreshed and cleaned.
      target = await db.character.update({
        where: { id: target.id },
        data: { gmInfo: cleaned, sourcePath: item.sourcePath, archived: false },
      });
    }

    // v7 may already have created an alias-named duplicate. Merge any user data it accumulated,
    // then remove only the duplicate so the original character remains the canonical record.
    if (importedDuplicate && importedDuplicate.id !== target.id) {
      const duplicateDiscoveries = await db.characterDiscovery.findMany({ where: { characterId: importedDuplicate.id } });
      for (const d of duplicateDiscoveries) {
        await db.characterDiscovery.upsert({
          where: { characterId_userId: { characterId: target.id, userId: d.userId } },
          update: {}, create: { characterId: target.id, userId: d.userId },
        });
      }
      await db.note.updateMany({ where: { linkedCharacterId: importedDuplicate.id }, data: { linkedCharacterId: target.id } });
      const duplicateMarkers = await db.mapMarker.findMany({ where: { entityId: importedDuplicate.id } });
      for (const marker of duplicateMarkers) {
        const existingMarker = await db.mapMarker.findUnique({ where: { mapId_entityId: { mapId: marker.mapId, entityId: target.id } } });
        if (existingMarker) await db.mapMarker.delete({ where: { id: marker.id } });
        else await db.mapMarker.update({ where: { id: marker.id }, data: { entityId: target.id, label: target.name, icon: target.portraitUrl || null } });
      }
      await db.character.delete({ where: { id: importedDuplicate.id } });
    }
  }

  // Create a real hierarchy for campaign notes. Imported source paths are mapped into these folders.
  const folderSpecs = [
    ['World', null],
    ['Solaris', 'World'],
    ['Arcadia', 'Solaris'],
    ['Arcadia · Districts', 'Arcadia'],
    ['District of Coins', 'Arcadia · Districts'],
    ['Guild Quarter', 'Arcadia · Districts'],
    ['Old Arcadia', 'Arcadia · Districts'],
    ['Rest Mile', 'Arcadia · Districts'],
    ['Quests', null],
    ['E Rank', 'Quests'],
    ['Creatures', null],
    ['CR 0–1', 'Creatures'],
    ['CR 1–2', 'Creatures'],
    ['CR 2–3', 'Creatures'],
    ['Creature Reference', 'Creatures'],
    ['Player Reference', null],
    ['Spells', 'Player Reference'],
    ['Wild Shapes', 'Player Reference'],
    ['Player', 'Player Reference'],
    ['Food & Drinks', null],
    ['Items & Equipment', null],
    ['Unsorted', null],
  ] as const;
  const folderIds = new Map<string, string>();
  for (const [name, parentName] of folderSpecs) {
    const parentId = parentName ? folderIds.get(parentName) || null : null;
    const existing = await db.noteFolder.findFirst({ where: { campaignId: c.id, name, parentId } });
    const folder = existing
      ? existing
      : await db.noteFolder.create({ data: { campaignId: c.id, name, parentId, sortOrder: folderSpecs.findIndex(x => x[0] === name) } });
    folderIds.set(name, folder.id);
  }

  function folderForSource(sourcePath: string) {
    if (sourcePath.startsWith('Creatures/CR 0~1/')) return folderIds.get('CR 0–1');
    if (sourcePath.startsWith('Creatures/CR 1~2/')) return folderIds.get('CR 1–2');
    if (sourcePath.startsWith('Creatures/CR 2~3/')) return folderIds.get('CR 2–3');
    if (sourcePath.startsWith('Creatures/')) return folderIds.get('Creature Reference');
    if (sourcePath.startsWith('Quests/E rank/')) return folderIds.get('E Rank');
    if (sourcePath === 'Player/Spells.md') return folderIds.get('Spells');
    if (sourcePath === 'Player/Wild Shapes.md') return folderIds.get('Wild Shapes');
    if (sourcePath === 'Player/Player.md') return folderIds.get('Player');
    if (sourcePath.startsWith('Player/')) return folderIds.get('Player Reference');
    if (sourcePath === 'Foods and Drinks.md') return folderIds.get('Food & Drinks');
    if (sourcePath === 'Weapon & Armor Items.md') return folderIds.get('Items & Equipment');
    if (sourcePath === 'The world/') return folderIds.get('World');
    if (sourcePath.includes('/City Districts/District of coins/')) return folderIds.get('District of Coins');
    if (sourcePath.includes('/City Districts/Guild Quarter/')) return folderIds.get('Guild Quarter');
    if (sourcePath.includes('/City Districts/Old Arcadia/')) return folderIds.get('Old Arcadia');
    if (sourcePath.includes('/City Districts/Rest Mile/')) return folderIds.get('Rest Mile');
    if (sourcePath.startsWith('Solaris/Arcadia/')) return folderIds.get('Arcadia');
    if (sourcePath.startsWith('Solaris/')) return folderIds.get('Solaris');
    return folderIds.get('Unsorted');
  }

  // Import and clean every non-character source document, then place it into the appropriate folder.
  for (const item of importData.notes) {
    const body = cleanImportedText(item.body);
    const folderId = folderForSource(item.sourcePath) || null;
    const existing = await db.note.findFirst({ where: { campaignId: c.id, sourcePath: item.sourcePath } });
    if (existing) {
      await db.note.update({ where: { id: existing.id }, data: { title: item.title, body, direction: isRtl(body) ? 'RTL' : 'LTR', folderId, archived: false } });
    } else {
      await db.note.create({ data: { campaignId: c.id, userId: gm.id, title: item.title, body, direction: isRtl(body) ? 'RTL' : 'LTR', sourcePath: item.sourcePath, folderId, visibility: 'PRIVATE' } });
    }
  }

  // Keep manually-created GM/player notes, but put unfiled campaign notes into Unsorted so the page stays tidy.
  const unsortedFolder = folderIds.get('Unsorted');
  if (unsortedFolder) await db.note.updateMany({ where: { campaignId: c.id, folderId: null, archived: false }, data: { folderId: unsortedFolder } });

  // Remove the old flat starter locations now that the hierarchical world tree is imported.
  await db.location.updateMany({ where: { campaignId: c.id, parentId: null, name: { in: ['BLACKWOOD GENERAL STORE', "ADVENTURER'S GUILD", 'THE VERDION RIVER', 'THE SILVER BASIN', 'CITY GATES'] } }, data: { archived: true } });

  // Meriele is the existing player-character sheet shipped with the starter campaign, so keep it visible to the seeded player.
  const meriele = await db.character.findFirst({ where: { campaignId: c.id, name: 'Meriele Holymion' } });
  if (meriele) await db.characterDiscovery.upsert({ where: { characterId_userId: { characterId: meriele.id, userId: player.id } }, update: {}, create: { characterId: meriele.id, userId: player.id } });

  // Seed the media library from images already shipped with the app.
  const media = [
    ['/assets/maps/Solaris.png', 'The Solaris Empire map', 'MAP', 'MAPS'], ['/assets/maps/Sylvanus.png', 'The Kingdom of Sylvanus map', 'MAP', 'MAPS'],
    ['/assets/maps/Frostfell.png', 'The Frostfell map', 'MAP', 'MAPS'], ['/assets/maps/The Dark Garr.png', 'The Drak-Garr Empire map', 'MAP', 'MAPS'],
    ['/assets/maps/The Etherium Archipelago.png', 'The Etherium Archipelago map', 'MAP', 'MAPS'], ['/assets/maps/Solaris/Arcadia.png', 'Arcadia map', 'MAP', 'MAPS'],
    ['/assets/maps/The Aethdom.png', 'The Aethdom map', 'MAP', 'MAPS'],
    ['/assets/chars/Blackwood family.jpg', 'Blackwood family portrait', 'CHARACTER', 'CHARACTERS'], ['/assets/chars/Elara Moongate.jpg', 'Elara portrait', 'CHARACTER', 'CHARACTERS'],
    ['/assets/chars/Gron Stonehammer.jpg', 'Gron portrait', 'CHARACTER', 'CHARACTERS'], ['/assets/chars/Meriele Holymion - MC.jpg', 'Meriele portrait', 'CHARACTER', 'CHARACTERS'],
    ['/assets/chars/Rosie.jpg', 'Rosie portrait', 'CHARACTER', 'CHARACTERS'], ['/assets/chars/Sir Kai.jpg', 'Sir Kai portrait', 'CHARACTER', 'CHARACTERS'],
  ] as const;
  for (const [url, name, type, folder] of media) {
    const exists = await db.asset.findFirst({ where: { campaignId: c.id, url } });
    if (exists) await db.asset.update({ where: { id: exists.id }, data: { name, type, folder } });
    else await db.asset.create({ data: { campaignId: c.id, url, name, type, folder } });
  }

  console.log(`Seeded campaign ${c.id}: ${importData.characters.length} imported characters, ${importData.notes.length} imported notes, ${importData.locations.length} locations.`);
}

main().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => db.$disconnect());
