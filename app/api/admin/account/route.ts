import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { getSession, requireMember } from '@/lib/auth';
import { db } from '@/lib/db';

const schema = z.object({
  userId: z.string().min(1),
  displayName: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().email().max(160),
  password: z.string().optional(),
});

export async function PATCH(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
    const gmMembership = session.user.memberships.find((m) => m.role === 'GM');
    if (!gmMembership) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    await requireMember(gmMembership.campaignId);

    const body = schema.parse(await req.json());
    const target = await db.user.findUnique({ where: { id: body.userId }, include: { memberships: true } });
    if (!target) return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    const targetMembership = target.memberships.find((m) => m.campaignId === gmMembership.campaignId);
    if (!targetMembership) return NextResponse.json({ error: 'User is not part of this campaign.' }, { status: 403 });
    if (body.password && body.password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });

    const owner = await db.user.findUnique({ where: { email: body.email } });
    if (owner && owner.id !== target.id) return NextResponse.json({ error: 'That email is already in use.' }, { status: 409 });

    const data: { displayName: string; email: string; passwordHash?: string } = { displayName: body.displayName, email: body.email };
    if (body.password) data.passwordHash = await bcrypt.hash(body.password, 12);
    const updated = await db.user.update({ where: { id: target.id }, data, select: { id: true, displayName: true, email: true } });

    if (body.password || body.email !== target.email) {
      await db.session.deleteMany({ where: { userId: target.id, ...(target.id === session.userId ? { NOT: { id: session.id } } : {}) } });
    }
    return NextResponse.json(updated);
  } catch (e: any) {
    if (e?.name === 'ZodError') return NextResponse.json({ error: 'Please enter a valid name and email.' }, { status: 400 });
    return NextResponse.json({ error: e?.message || 'Could not update account.' }, { status: 500 });
  }
}
