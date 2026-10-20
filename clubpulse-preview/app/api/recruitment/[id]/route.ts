import { NextResponse } from 'next/server';
import { ensureDatabase,getPool } from '@/lib/db';
export const runtime='nodejs';
export async function PATCH(request:Request,context:{params:Promise<{id:string}>}){
 try{
  const origin=request.headers.get('origin');if(origin&&new URL(origin).origin!==new URL(request.url).origin)return NextResponse.json({error:'Cross-origin requests are not accepted.'},{status:403});
  const {id}=await context.params;if(!/^\d+$/.test(id))return NextResponse.json({error:'Invalid application id.'},{status:400});
  const body=await request.json().catch(()=>null) as {status?:unknown}|null;
  const allowed=new Set(['Applied','Reviewing','Accepted','Rejected']);
  if(!body||typeof body.status!=='string'||!allowed.has(body.status))return NextResponse.json({error:'Choose Applied, Reviewing, Accepted or Rejected.'},{status:400});
  await ensureDatabase();
  const r=await getPool().query('UPDATE recruitment_applications SET status=$1 WHERE id=$2 RETURNING id,applicant_name,status',[body.status,Number(id)]);
  if(!r.rowCount)return NextResponse.json({error:'Application not found.'},{status:404});
  return NextResponse.json({application:r.rows[0]},{headers:{'Cache-Control':'no-store'}});
 }catch(error){const message=error instanceof Error?error.message:'Could not update application.';return NextResponse.json({error:message},{status:503});}
}
