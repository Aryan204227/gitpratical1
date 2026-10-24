import { NextResponse } from 'next/server';
import { isSameOriginRequest } from '@/lib/request-origin';
import { ensureDatabase,getPool } from '@/lib/db';
import { authorizeResponse, getUserFromRequest } from '@/lib/auth';
export const runtime='nodejs';
export async function PATCH(request:Request,context:{params:Promise<{id:string}>}){
 try{
  const denied=authorizeResponse(await getUserFromRequest(request),['admin','lead']);
  if(denied)return denied;
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: 'Cross-origin requests are not accepted.' }, { status: 403 });
  const {id}=await context.params;if(!/^\d+$/.test(id))return NextResponse.json({error:'Invalid application id.'},{status:400});
  const body=await request.json().catch(()=>null) as {status?:unknown}|null;
  const allowed=new Set(['Applied','Reviewing','Accepted','Rejected']);
  if(!body||typeof body.status!=='string'||!allowed.has(body.status))return NextResponse.json({error:'Choose Applied, Reviewing, Accepted or Rejected.'},{status:400});
  await ensureDatabase();
  const client=await getPool().connect();
  try{
    await client.query('BEGIN');
    const current=await client.query(`SELECT a.id,a.applicant_name,a.email,a.status,a.opening_id,o.club_id FROM recruitment_applications a JOIN recruitment_openings o ON o.id=a.opening_id WHERE a.id=$1 FOR UPDATE OF a`,[Number(id)]);
    if(!current.rowCount){await client.query('ROLLBACK');return NextResponse.json({error:'Application not found.'},{status:404});}
    const app=current.rows[0];
    const updated=await client.query('UPDATE recruitment_applications SET status=$1 WHERE id=$2 RETURNING id,applicant_name,email,status,opening_id',[body.status,Number(id)]);
    let onboarded=false;
    if(body.status==='Accepted'&&app.status!=='Accepted'){
      const member=await client.query(`INSERT INTO members(name,email,club_id,role,active) VALUES($1,$2,$3,'Member',TRUE)
        ON CONFLICT(email) DO UPDATE SET active=TRUE,club_id=COALESCE(EXCLUDED.club_id,members.club_id)
        RETURNING id,name,email,club_id`,[app.applicant_name,app.email,app.club_id]);
      await client.query(`INSERT INTO contribution_events(club_id,member_name,event_type,points) VALUES($1,$2,'membership_joined',0)`,[member.rows[0].club_id,member.rows[0].name]);
      onboarded=true;
    }
    await client.query('COMMIT');
    return NextResponse.json({application:updated.rows[0],onboarded},{headers:{'Cache-Control':'no-store'}});
  }catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}
 }catch(error){console.error('[recruitment] Failed to update application:',error);return NextResponse.json({error:'Could not update the application. Please retry.'},{status:503,headers:{'Cache-Control':'no-store'}});}
}
