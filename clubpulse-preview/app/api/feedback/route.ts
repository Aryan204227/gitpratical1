import { NextResponse } from 'next/server';
import { isSameOriginRequest } from '@/lib/request-origin';
import { ensureDatabase,getPool } from '@/lib/db';
import { authorizeResponse, getUserFromRequest } from '@/lib/auth';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export async function GET(request: Request){
 try{
  const denied=authorizeResponse(await getUserFromRequest(request),['admin','lead']);
  if(denied)return denied;
  await ensureDatabase();
  const r=await getPool().query(`SELECT f.id,f.topic AS label,CASE WHEN f.is_anonymous THEN 'Anonymous feedback' ELSE 'Named feedback' END AS detail,
    CASE WHEN f.rating IS NULL THEN 'No rating' ELSE f.rating::text||'/5 rating' END AS activity,f.status,f.comment,
    COALESCE(c.name,'Club') AS club, f.is_anonymous
    FROM feedback_entries f LEFT JOIN clubs c ON c.id=f.club_id ORDER BY f.created_at DESC LIMIT 150`);
  return NextResponse.json({items:r.rows,count:r.rowCount},{headers:{'Cache-Control':'no-store'}});
 }catch(error){console.error('[feedback] Failed to load feedback:',error);return NextResponse.json({error:'Could not load feedback right now.'},{status:503,headers:{'Cache-Control':'no-store'}});}
}
export async function POST(request:Request){
 try{
  const denied=authorizeResponse(await getUserFromRequest(request));
  if(denied)return denied;
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: 'Cross-origin requests are not accepted.' }, { status: 403 });
  await ensureDatabase();
  const body=await request.json().catch(()=>null) as Record<string,unknown>|null;
  const topic=typeof body?.topic==='string'?body.topic.trim():'';
  const comment=typeof body?.comment==='string'?body.comment.trim().slice(0,1800):'';
  const rating=body?.rating===undefined||body.rating===null||body.rating===''?null:Number(body.rating);
  const clubId=body?.clubId===undefined||body.clubId===null||body.clubId===''?null:Number(body.clubId);
  const anonymous=body?.anonymous!==false;
  if(topic.length<3||topic.length>120)return NextResponse.json({error:'Feedback topic must contain 3–120 characters.'},{status:400});
  if(rating!==null&&(!Number.isInteger(rating)||rating<1||rating>5))return NextResponse.json({error:'Rating must be from 1 to 5.'},{status:400});
  if(clubId!==null&&(!Number.isInteger(clubId)||clubId<1))return NextResponse.json({error:'Select a valid club.'},{status:400});
  if(clubId!==null){const exists=await getPool().query('SELECT 1 FROM clubs WHERE id=$1',[clubId]);if(!exists.rowCount)return NextResponse.json({error:'Selected club does not exist.'},{status:400});}
  const r=await getPool().query('INSERT INTO feedback_entries(club_id,topic,rating,comment,is_anonymous,status) VALUES($1,$2,$3,$4,$5,$6) RETURNING id,topic,rating,is_anonymous,status,created_at',[clubId,topic,rating,comment,anonymous,'Needs review']);
  return NextResponse.json({feedback:r.rows[0]},{status:201});
 }catch(error){console.error('[feedback] Failed to submit feedback:',error);return NextResponse.json({error:'Could not submit feedback. Please retry.'},{status:503,headers:{'Cache-Control':'no-store'}});}
}
