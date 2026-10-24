import { NextResponse } from 'next/server';
import { isTrustedMutationRequest } from '@/lib/request-origin';
import { z } from 'zod';
import { ensureDatabase,getPool } from '@/lib/db';
import { authorizeResponse,getUserFromRequest } from '@/lib/auth';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const schema=z.object({name:z.string().trim().min(2).max(120).optional(),category:z.string().trim().max(60).optional(),status:z.enum(['Active','Inactive','Recruiting']).optional()}).refine(v=>Object.keys(v).length>0);
export async function GET(request:Request,context:{params:Promise<{id:string}>}){
 try{
  const denied=authorizeResponse(await getUserFromRequest(request));if(denied)return denied;
  const {id}=await context.params;const clubId=Number(id);if(!Number.isInteger(clubId)||clubId<1)return NextResponse.json({error:'Invalid club id.'},{status:400});
  await ensureDatabase();
  const result=await getPool().query(`SELECT c.id,c.name,c.category,c.status,c.created_at,COUNT(DISTINCT m.id)::int AS member_count,COUNT(DISTINCT t.id)::int AS task_count,COUNT(DISTINCT t.id) FILTER(WHERE t.status='Completed')::int AS completed_count FROM clubs c LEFT JOIN members m ON m.club_id=c.id AND m.active=TRUE LEFT JOIN tasks t ON t.club_id=c.id WHERE c.id=$1 GROUP BY c.id`,[clubId]);
  if(!result.rowCount)return NextResponse.json({error:'Club not found.'},{status:404});
  return NextResponse.json({club:result.rows[0]},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Could not load this club.'},{status:503});}
}
export async function PATCH(request:Request,context:{params:Promise<{id:string}>}){
 try{
  const denied=authorizeResponse(await getUserFromRequest(request),['admin','lead']);if(denied)return denied;
  if(!isTrustedMutationRequest(request))return NextResponse.json({error:'Request origin could not be verified.'},{status:403});
  const {id}=await context.params;const clubId=Number(id);if(!Number.isInteger(clubId)||clubId<1)return NextResponse.json({error:'Invalid club id.'},{status:400});
  const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:parsed.error.issues[0]?.message||'Invalid club update.'},{status:400});
  await ensureDatabase();const current=await getPool().query('SELECT id,name,category,status FROM clubs WHERE id=$1',[clubId]);if(!current.rowCount)return NextResponse.json({error:'Club not found.'},{status:404});
  const next={...current.rows[0],...parsed.data};
  const updated=await getPool().query('UPDATE clubs SET name=$1,category=$2,status=$3 WHERE id=$4 RETURNING id,name,category,status',[next.name,next.category,next.status,clubId]);
  return NextResponse.json({club:updated.rows[0]},{headers:{'Cache-Control':'no-store'}});
 }catch(error){const message=error instanceof Error?error.message:'';return NextResponse.json({error:message.includes('duplicate key')?'A club with that name already exists.':'Could not update the club.'},{status:message.includes('duplicate key')?409:503});}
}
export async function DELETE(request:Request,context:{params:Promise<{id:string}>}){
 try{
  const denied=authorizeResponse(await getUserFromRequest(request),['admin']);if(denied)return denied;
  if(!isTrustedMutationRequest(request))return NextResponse.json({error:'Request origin could not be verified.'},{status:403});
  const {id}=await context.params;const clubId=Number(id);if(!Number.isInteger(clubId)||clubId<1)return NextResponse.json({error:'Invalid club id.'},{status:400});
  await ensureDatabase();const r=await getPool().query('DELETE FROM clubs WHERE id=$1 RETURNING id,name',[clubId]);if(!r.rowCount)return NextResponse.json({error:'Club not found.'},{status:404});
  return NextResponse.json({deleted:r.rows[0]});
 }catch{return NextResponse.json({error:'Could not delete this club.'},{status:503});}
}
