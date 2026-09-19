import {NextResponse} from 'next/server'; import {cookies} from 'next/headers'; import {db} from '@/lib/db';
export async function POST(req:Request){const c=await cookies(); const id=c.get('atlas_session')?.value; if(id) await db.session.delete({where:{id}}).catch(()=>{}); c.delete('atlas_session'); return NextResponse.redirect(new URL('/login',req.url));}
