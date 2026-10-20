import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ensureDatabase,getPool } from '@/lib/db';
import { authorizeResponse,getUserFromRequest } from '@/lib/auth';
export const runtime='nodejs';
const schema=z.object({status:z.enum(['Needs review','Action proposed','Reviewed','Resolved'])});
export async function PATCH(request:Request,context:{params:Promise<{id:string}>}){
 try{
  const denied=authorizeResponse(await getUserFromRequest(request),['admin','lead']);if(denied)return denied;
  const {id}=await context.params;const feedbackId=Number(id);if(!Number.isInteger(feedbackId)||feedbackId<1)return NextResponse.json({error:'Invalid feedback id.'},{status:400});
  const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:'Invalid feedback status.'},{status:400});
  await ensureDatabase();const r=await getPool().query('UPDATE feedback_entries SET status=$1 WHERE id=$2 RETURNING id,topic,status',[parsed.data.status,feedbackId]);
  if(!r.rowCount)return NextResponse.json({error:'Feedback not found.'},{status:404});
  return NextResponse.json({feedback:r.rows[0]},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Could not update feedback.'},{status:503});}
}
