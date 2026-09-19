import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { requireMember } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const campaignId = new URL(req.url).searchParams.get('campaignId') || '';
    const { membership } = await requireMember(campaignId);
    if (membership.role !== 'GM') throw new Error('FORBIDDEN');
    const members = await db.campaignMember.findMany({ where: { campaignId, role: 'PLAYER' }, include: { user: { select: { id: true, displayName: true, email: true } } }, orderBy: { user: { displayName: 'asc' } } });
    return NextResponse.json(members.map(m => ({ id: m.user.id, displayName: m.user.displayName, email: m.user.email })));
  } catch (e:any) { return NextResponse.json({ error: e.message }, { status: e.message === 'FORBIDDEN' ? 403 : 401 }); }
}

export async function POST(req: Request) {
  try {
    const b = await req.json(); const campaignId = String(b.campaignId || '');
    const { membership } = await requireMember(campaignId); if (membership.role !== 'GM') throw new Error('FORBIDDEN');
    const email = String(b.email || '').trim().toLowerCase(); const password = String(b.password || ''); const displayName = String(b.displayName || '').trim() || 'Player';
    if (!email || !email.includes('@')) return NextResponse.json({ error: 'Enter a valid email.' }, { status: 400 });
    if (password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: 'That email is already in use.' }, { status: 409 });
    const user = await db.user.create({ data: { email, displayName, passwordHash: await bcrypt.hash(password, 12) } });
    await db.campaignMember.create({ data: { campaignId, userId: user.id, role: 'PLAYER' } });
    return NextResponse.json({ id: user.id, displayName: user.displayName, email: user.email }, { status: 201 });
  } catch (e:any) { return NextResponse.json({ error: e.message }, { status: e.message === 'FORBIDDEN' ? 403 : 400 }); }
}

export async function PATCH(req: Request) {
  try {
    const b = await req.json(); const campaignId = String(b.campaignId || '');
    const { membership } = await requireMember(campaignId); if (membership.role !== 'GM') throw new Error('FORBIDDEN');
    const userId = String(b.id || ''); const user = await db.user.findUnique({ where: { id: userId } }); if (!user) return NextResponse.json({ error:'Player not found.' }, {status:404});
    const member = await db.campaignMember.findUnique({ where: { userId_campaignId: { userId, campaignId } } }); if (!member || member.role !== 'PLAYER') return NextResponse.json({ error:'Player not found in campaign.' }, {status:404});
    const email = String(b.email || '').trim().toLowerCase(); const displayName = String(b.displayName || '').trim() || 'Player';
    const emailOwner = await db.user.findUnique({ where: { email } }); if (emailOwner && emailOwner.id !== userId) return NextResponse.json({ error:'That email is already in use.' }, {status:409});
    const data:any = { email, displayName }; if (b.password) { if (String(b.password).length < 8) return NextResponse.json({error:'Password must be at least 8 characters.'},{status:400}); data.passwordHash = await bcrypt.hash(String(b.password),12); }
    const updated = await db.user.update({ where:{id:userId}, data });
    await db.session.deleteMany({ where:{ userId } });
    return NextResponse.json({ id:updated.id, displayName:updated.displayName, email:updated.email });
  } catch(e:any){ return NextResponse.json({error:e.message},{status:e.message==='FORBIDDEN'?403:400}); }
}

export async function DELETE(req: Request) {
  try {
    const b = await req.json(); const campaignId=String(b.campaignId||''); const {membership}=await requireMember(campaignId); if(membership.role!=='GM')throw new Error('FORBIDDEN');
    const userId=String(b.id||''); const member=await db.campaignMember.findUnique({where:{userId_campaignId:{userId,campaignId}}}); if(!member||member.role!=='PLAYER')return NextResponse.json({error:'Player not found.'},{status:404});
    await db.user.delete({where:{id:userId}}); return NextResponse.json({ok:true});
  } catch(e:any){return NextResponse.json({error:e.message},{status:e.message==='FORBIDDEN'?403:400});}
}
