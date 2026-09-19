import { NextResponse } from 'next/server';
import { requireMember } from '@/lib/auth';
import { db } from '@/lib/db';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const existing = await db.character.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Character not found.' }, { status: 404 });
    const { membership } = await requireMember(existing.campaignId);
    if (membership.role !== 'GM') throw new Error('FORBIDDEN');
    const form = await req.formData();
    const data: any = {
      name: String(form.get('name') || existing.name).trim(),
      title: nullable(form.get('title')),
      description: nullable(form.get('description')),
      publicInfo: nullable(form.get('publicInfo')),
      gmInfo: nullable(form.get('gmInfo')),
      currentLocationName: nullable(form.get('currentLocationName')),
    };
    const file = form.get('portrait');
    if (file instanceof File && file.size > 0) data.portraitUrl = await savePortrait(file, data.name);
    const updated = await db.character.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.message === 'FORBIDDEN' ? 403 : 401 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const existing = await db.character.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Character not found.' }, { status: 404 });
    const { membership } = await requireMember(existing.campaignId);
    if (membership.role !== 'GM') throw new Error('FORBIDDEN');
    await db.mapMarker.deleteMany({ where: { entityId: id } });
    await db.character.delete({ where: { id } });
    return NextResponse.json({ ok: true });
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
