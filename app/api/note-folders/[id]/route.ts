import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireMember } from '@/lib/auth';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const folder = await db.noteFolder.findUnique({ where: { id } });
    if (!folder) return NextResponse.json({ error: 'Folder not found.' }, { status: 404 });
    const { membership } = await requireMember(folder.campaignId);
    if (membership.role !== 'GM') throw new Error('FORBIDDEN');
    const b = await req.json();
    const name = String(b.name || '').trim();
    if (!name) return NextResponse.json({ error: 'Folder name is required.' }, { status: 400 });
    const parentId = String(b.parentId || '') || null;
    if (parentId === id) return NextResponse.json({ error: 'A folder cannot be its own parent.' }, { status: 400 });
    if (parentId && !(await db.noteFolder.findFirst({ where: { id: parentId, campaignId: folder.campaignId } }))) return NextResponse.json({ error: 'Invalid parent folder.' }, { status: 400 });
    const updated = await db.noteFolder.update({ where: { id }, data: { name, parentId, sortOrder: Number(b.sortOrder) || 0 } });
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.message === 'FORBIDDEN' ? 403 : 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const folder = await db.noteFolder.findUnique({ where: { id } });
    if (!folder) return NextResponse.json({ error: 'Folder not found.' }, { status: 404 });
    const { membership } = await requireMember(folder.campaignId);
    if (membership.role !== 'GM') throw new Error('FORBIDDEN');
    await db.$transaction([
      db.note.updateMany({ where: { folderId: id }, data: { folderId: folder.parentId } }),
      db.noteFolder.updateMany({ where: { parentId: id }, data: { parentId: folder.parentId } }),
      db.noteFolder.delete({ where: { id } }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.message === 'FORBIDDEN' ? 403 : 400 });
  }
}
