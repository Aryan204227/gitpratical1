import { NextResponse } from 'next/server';
import { isSameOriginRequest } from '@/lib/request-origin';
import { z } from 'zod';
import { ensureDatabase,getPool } from '@/lib/db';
import { authorizeResponse,getUserFromRequest } from '@/lib/auth';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const schema=z.object({role:z.enum(['member','lead','admin']).optional(),active:z.boolean().optional()}).refine(v=>Object.keys(v).length>0);
export async function PATCH(request:Request,context:{params:Promise<{id:string}>}){
 try{
  const denied=authorizeResponse(await getUserFromRequest(request),['admin','lead']);if(denied)return denied;
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: 'Cross-origin requests are not accepted.' }, { status: 403 });
  const {id}=await context.params;const memberId=Number(id);if(!Number.isInteger(memberId)||memberId<1)return NextResponse.json({error:'Invalid member id.'},{status:400});
  const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:parsed.error.issues[0]?.message||'Invalid member update.'},{status:400});
  const actor=await getUserFromRequest(request);
  if(parsed.data.role==='admin'&&actor?.role!=='admin')return NextResponse.json({error:'Only an administrator can grant administrator access.'},{status:403});
  if(parsed.data.role==='admin'&&actor?.id===memberId)return NextResponse.json({error:'You cannot change your own administrator role here.'},{status:409});
  await ensureDatabase();
  const current=await getPool().query('SELECT id,name,email,role,active FROM members WHERE id=$1',[memberId]);if(!current.rowCount)return NextResponse.json({error:'Member not found.'},{status:404});
  const next={...current.rows[0],...parsed.data};
  const updated=await getPool().query('UPDATE members SET role=$1,active=$2 WHERE id=$3 RETURNING id,name,email,role,active',[next.role,next.active,memberId]);
  return NextResponse.json({member:updated.rows[0]},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Could not update the member record.'},{status:503});}
}
export async function DELETE(request:Request,context:{params:Promise<{id:string}>}){
 try{
  const denied=authorizeResponse(await getUserFromRequest(request),['admin']);if(denied)return denied;
  const {id}=await context.params;const memberId=Number(id);if(!Number.isInteger(memberId)||memberId<1)return NextResponse.json({error:'Invalid member id.'},{status:400});
  await ensureDatabase();const r=await getPool().query('UPDATE members SET active=FALSE WHERE id=$1 RETURNING id,name,active',[memberId]);if(!r.rowCount)return NextResponse.json({error:'Member not found.'},{status:404});
  return NextResponse.json({member:r.rows[0],message:'Member deactivated; historical contribution events are preserved.'});
 }catch{return NextResponse.json({error:'Could not deactivate this member.'},{status:503});}
}
