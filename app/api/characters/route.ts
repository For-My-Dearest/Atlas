import { NextResponse } from 'next/server';
import { requireMember } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  const campaignId = new URL(req.url).searchParams.get('campaignId');
  if (!campaignId) return NextResponse.json({ error: 'campaignId required' }, { status: 400 });
  try {
    const { membership } = await requireMember(campaignId);
    const chars = await db.character.findMany({
      where: { campaignId, archived: false },
      orderBy: { name: 'asc' },
      select: {
        id: true, name: true, title: true, portraitUrl: true, description: true,
        publicInfo: true, currentLocationName: true,
        ...(membership.role === 'GM' ? { gmInfo: true } : {}),
      },
    });
    return NextResponse.json(chars.map(c => membership.role === 'GM' ? c : { ...c, description: c.publicInfo }));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.message === 'FORBIDDEN' ? 403 : 401 });
  }
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const campaignId = String(form.get('campaignId') || '');
    const { membership } = await requireMember(campaignId);
    if (membership.role !== 'GM') throw new Error('FORBIDDEN');
    const name = String(form.get('name') || '').trim();
    if (!name) return NextResponse.json({ error: 'Name is required.' }, { status: 400 });

    const file = form.get('portrait');
    let portraitUrl: string | null = null;
    if (file instanceof File && file.size > 0) {
      portraitUrl = await savePortrait(file, name);
    }

    const character = await db.character.create({
      data: {
        campaignId,
        name,
        title: nullable(form.get('title')),
        portraitUrl,
        description: nullable(form.get('description')),
        publicInfo: nullable(form.get('publicInfo')),
        gmInfo: nullable(form.get('gmInfo')),
        currentLocationName: nullable(form.get('currentLocationName')),
      },
    });
    return NextResponse.json(character, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.message === 'FORBIDDEN' ? 403 : 401 });
  }
}

function nullable(value: FormDataEntryValue | null) {
  const text = String(value || '').trim();
  return text || null;
}

async function savePortrait(file: File, name: string) {
  const allowed = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
  if (!allowed.has(file.type)) throw new Error('Portrait must be JPG, PNG, WEBP, or GIF.');
  if (file.size > 5 * 1024 * 1024) throw new Error('Portrait must be 5 MB or smaller.');
  const { writeFile, mkdir } = await import('node:fs/promises');
  const path = await import('node:path');
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : file.type === 'image/gif' ? 'gif' : 'jpg';
  const safe = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'character';
  const filename = `${Date.now()}-${safe}.${ext}`;
  const dir = path.join(process.cwd(), 'public', 'uploads', 'characters');
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));
  return `/uploads/characters/${filename}`;
}
