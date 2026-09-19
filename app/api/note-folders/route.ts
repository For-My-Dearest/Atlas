import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireMember } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const campaignId = new URL(req.url).searchParams.get('campaignId') || '';
    const { membership } = await requireMember(campaignId);
    const folders = await db.noteFolder.findMany({ where: { campaignId }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] });
    if (membership.role === 'GM') return NextResponse.json(folders);
    const visibleNotes = await db.note.findMany({ where: { campaignId, archived: false, OR: [{ userId: membership.userId }, { visibility: 'PUBLIC' }] }, select: { folderId: true } });
    const visible = new Set(visibleNotes.map(n => n.folderId).filter(Boolean) as string[]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const folder of folders) if (folder.parentId && visible.has(folder.id) && !visible.has(folder.parentId)) { visible.add(folder.parentId); changed = true; }
    }
    return NextResponse.json(folders.filter(f => visible.has(f.id)));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.message === 'FORBIDDEN' ? 403 : 401 });
  }
}

export async function POST(req: Request) {
  try {
    const b = await req.json();
    const campaignId = String(b.campaignId || '');
    const { membership } = await requireMember(campaignId);
    if (membership.role !== 'GM') throw new Error('FORBIDDEN');
    const name = String(b.name || '').trim();
    if (!name) return NextResponse.json({ error: 'Folder name is required.' }, { status: 400 });
    const parentId = String(b.parentId || '') || null;
    if (parentId && !(await db.noteFolder.findFirst({ where: { id: parentId, campaignId } }))) return NextResponse.json({ error: 'Invalid parent folder.' }, { status: 400 });
    const folder = await db.noteFolder.create({ data: { campaignId, name, parentId, sortOrder: Number(b.sortOrder) || 0 } });
    return NextResponse.json(folder, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.message === 'FORBIDDEN' ? 403 : 400 });
  }
}
