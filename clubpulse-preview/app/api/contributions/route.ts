import { NextResponse } from 'next/server';
import { ensureDatabase,getPool } from '@/lib/db';
import { authorizeResponse, getUserFromRequest } from '@/lib/auth';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export async function GET(request: Request){
 try{
  const denied=authorizeResponse(await getUserFromRequest(request),['admin','lead']);
  if(denied)return denied;
  await ensureDatabase();
  const r=await getPool().query(`SELECT e.id,e.event_type,e.member_name,e.points,e.created_at,COALESCE(c.name,'Club') AS club,t.title AS task
    FROM contribution_events e LEFT JOIN clubs c ON c.id=e.club_id LEFT JOIN tasks t ON t.id=e.task_id ORDER BY e.created_at DESC LIMIT 500`);
  return NextResponse.json({events:r.rows,count:r.rowCount,method:'Task assignment and completion events only; no claim of work not recorded.'},{headers:{'Cache-Control':'no-store'}});
 }catch(error){console.error('[contributions] Failed to load contribution history:',error);return NextResponse.json({error:'Could not load contribution history right now.'},{status:503,headers:{'Cache-Control':'no-store'}});}
}
