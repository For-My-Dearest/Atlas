import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireMember } from '@/lib/auth';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';

async function saveImage(file: File | null) {
  if (!file || !file.size) return null;
  const ext = path.extname(file.name).toLowerCase() || '.bin';
  const safe = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
  const dir = path.join(process.cwd(), 'public', 'uploads', 'locations');
  await mkdir(dir, { recursive: true }); await writeFile(path.join(dir, safe), Buffer.from(await file.arrayBuffer()));
  return `/uploads/locations/${safe}`;
}

export async function GET(req: Request) {
  try { const campaignId=new URL(req.url).searchParams.get('campaignId')||''; const {membership}=await requireMember(campaignId); const rows=await db.location.findMany({where:{campaignId,archived:false},orderBy:[{parentId:'asc'},{name:'asc'}]}); return NextResponse.json(membership.role==='GM'?rows:rows.map(x=>({...x,gmInfo:null}))); }
  catch(e:any){return NextResponse.json({error:e.message},{status:e.message==='FORBIDDEN'?403:401});}
}

export async function POST(req: Request) {
  try { const form=await req.formData(); const campaignId=String(form.get('campaignId')||''); const {membership}=await requireMember(campaignId); if(membership.role!=='GM')throw new Error('FORBIDDEN'); const name=String(form.get('name')||'').trim(); if(!name)return NextResponse.json({error:'Name is required.'},{status:400}); const parentId=String(form.get('parentId')||'')||null; if(parentId && !(await db.location.findFirst({where:{id:parentId,campaignId,archived:false}})))return NextResponse.json({error:'Invalid parent folder.'},{status:400}); const imageUrl=await saveImage(form.get('image') as File|null); const loc=await db.location.create({data:{campaignId,name,type:String(form.get('type')||'PLACE'),description:String(form.get('description')||'')||null,gmInfo:String(form.get('gmInfo')||'')||null,parentId,imageUrl}}); return NextResponse.json(loc,{status:201}); }
  catch(e:any){return NextResponse.json({error:e.message},{status:e.message==='FORBIDDEN'?403:400});}
}
