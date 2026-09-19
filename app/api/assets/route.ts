import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireMember } from '@/lib/auth';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
export const runtime='nodejs';
async function saveFile(file:File){const ext=path.extname(file.name).toLowerCase()||'.bin';const safe=`${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;const dir=path.join(process.cwd(),'public','uploads','media');await mkdir(dir,{recursive:true});await writeFile(path.join(dir,safe),Buffer.from(await file.arrayBuffer()));return `/uploads/media/${safe}`;}
export async function GET(req:Request){try{const campaignId=new URL(req.url).searchParams.get('campaignId')||'';const {membership}=await requireMember(campaignId);if(membership.role!=='GM')throw new Error('FORBIDDEN');return NextResponse.json(await db.asset.findMany({where:{campaignId},orderBy:{name:'asc'}}));}catch(e:any){return NextResponse.json({error:e.message},{status:e.message==='FORBIDDEN'?403:401});}}
export async function POST(req:Request){try{const form=await req.formData();const campaignId=String(form.get('campaignId')||'');const {membership}=await requireMember(campaignId);if(membership.role!=='GM')throw new Error('FORBIDDEN');const file=form.get('file') as File|null;if(!file||!file.size)return NextResponse.json({error:'Choose an image.'},{status:400});const type=String(form.get('type')||'IMAGE'); const folder=String(form.get('folder')||'OTHER');const name=String(form.get('name')||file.name).trim()||file.name;const url=await saveFile(file);const asset=await db.asset.create({data:{campaignId,name,url,type,folder}});return NextResponse.json(asset,{status:201});}catch(e:any){return NextResponse.json({error:e.message},{status:e.message==='FORBIDDEN'?403:400});}}
