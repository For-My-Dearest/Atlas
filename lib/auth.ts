import { cookies } from 'next/headers';
import { db } from './db';
export async function getSession() { const token=(await cookies()).get('atlas_session')?.value; if(!token)return null; const s=await db.session.findUnique({where:{id:token},include:{user:{include:{memberships:true}}}}); if(!s||s.expiresAt<new Date()){ if(s) await db.session.delete({where:{id:s.id}}).catch(()=>{}); return null;} return s; }
export async function requireMember(campaignId:string){ const s=await getSession(); if(!s) throw new Error('UNAUTHENTICATED'); const m=s.user.memberships.find(x=>x.campaignId===campaignId); if(!m) throw new Error('FORBIDDEN'); return {session:s,membership:m}; }
