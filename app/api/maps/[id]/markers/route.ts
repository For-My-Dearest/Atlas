import { NextResponse } from 'next/server';
import { requireMember } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const map = await db.map.findUnique({ where: { id } });
    if (!map) return NextResponse.json({ error: 'Map not found.' }, { status: 404 });
    const { membership } = await requireMember(map.campaignId);
    if (membership.role !== 'GM') throw new Error('FORBIDDEN');
    const b = await req.json();
    const characterId = String(b.characterId || '');
    const character = await db.character.findFirst({ where: { id: characterId, campaignId: map.campaignId, archived: false } });
    if (!characterId || !character) return NextResponse.json({ error: 'Choose a valid campaign character.' }, { status: 400 });
    const x = Math.max(0, Math.min(1, Number(b.x)));
    const y = Math.max(0, Math.min(1, Number(b.y)));
    if (!Number.isFinite(x) || !Number.isFinite(y)) return NextResponse.json({ error: 'Invalid coordinates.' }, { status: 400 });

    const marker = await db.mapMarker.upsert({
      where: { mapId_entityId: { mapId: id, entityId: characterId } },
      update: { x, y, type: 'CHARACTER', label: character.name, icon: character.portraitUrl || null, visibleToPlayers: true },
      create: { mapId: id, type: 'CHARACTER', label: character.name, x, y, entityId: characterId, visibleToPlayers: true, icon: character.portraitUrl || null },
    });
    return NextResponse.json({ ...marker, placedByRole: membership.role }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.message === 'FORBIDDEN' ? 403 : 401 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const markerId = new URL(req.url).searchParams.get('markerId');
    if (!markerId) return NextResponse.json({ error: 'markerId required' }, { status: 400 });
    const map = await db.map.findUnique({ where: { id } });
    if (!map) return NextResponse.json({ error: 'Map not found.' }, { status: 404 });
    const { membership } = await requireMember(map.campaignId);
    if (membership.role !== 'GM') throw new Error('FORBIDDEN');
    const b = await req.json();
    const marker = await db.mapMarker.update({ where: { id: markerId }, data: { x: Number(b.x), y: Number(b.y) } });
    return NextResponse.json(marker);
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: e.message === 'FORBIDDEN' ? 403 : 401 }); }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const markerId = new URL(req.url).searchParams.get('markerId');
    if (!markerId) return NextResponse.json({ error: 'markerId required' }, { status: 400 });
    const map = await db.map.findUnique({ where: { id } });
    if (!map) return NextResponse.json({ error: 'Map not found.' }, { status: 404 });
    const { membership } = await requireMember(map.campaignId);
    if (membership.role !== 'GM') throw new Error('FORBIDDEN');
    await db.mapMarker.delete({ where: { id: markerId } });
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: e.message === 'FORBIDDEN' ? 403 : 401 }); }
}
