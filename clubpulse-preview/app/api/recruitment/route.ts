import { NextResponse } from 'next/server';
import { ensureDatabase,getPool } from '@/lib/db';
import { authorizeResponse, getUserFromRequest } from '@/lib/auth';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export async function GET(request:Request){
  try{
    const user=await getUserFromRequest(request);
    const view=new URL(request.url).searchParams.get('view')||'openings';
    const denied=authorizeResponse(user, view==='applications'?['admin','lead']:undefined);
    if(denied)return denied;
    await ensureDatabase();
    if(view==='applications'){
      const r=await getPool().query(`SELECT a.id,a.applicant_name AS label,a.email AS detail,o.title AS activity,a.status,a.statement,COALESCE(c.name,'Club') AS club
        FROM recruitment_applications a JOIN recruitment_openings o ON o.id=a.opening_id LEFT JOIN clubs c ON c.id=o.club_id ORDER BY a.created_at DESC LIMIT 200`);
      return NextResponse.json({view,items:r.rows,count:r.rowCount},{headers:{'Cache-Control':'no-store'}});
    }
    const r=await getPool().query(`SELECT o.id,o.title AS label,COALESCE(c.name,'Club') AS detail,COUNT(a.id)::int AS applicant_count,o.status
      FROM recruitment_openings o LEFT JOIN clubs c ON c.id=o.club_id LEFT JOIN recruitment_applications a ON a.opening_id=o.id
      GROUP BY o.id,c.name ORDER BY o.created_at DESC`);
    return NextResponse.json({view:'openings',items:r.rows,count:r.rowCount},{headers:{'Cache-Control':'no-store'}});
  }catch(error){const message=error instanceof Error?error.message:'Could not load recruitment.';return NextResponse.json({error:message},{status:503});}
}
export async function POST(request:Request){
 try{
  const origin=request.headers.get('origin');if(origin&&new URL(origin).origin!==new URL(request.url).origin)return NextResponse.json({error:'Cross-origin requests are not accepted.'},{status:403});
  await ensureDatabase();
  const body=await request.json().catch(()=>null) as Record<string,unknown>|null;
  const kind=typeof body?.kind==='string'?body.kind:'opening';
  const denied=authorizeResponse(await getUserFromRequest(request),kind==='opening'?['admin','lead']:undefined);
  if(denied)return denied;
  const pool=getPool();
  if(kind==='opening'){
    const title=typeof body?.title==='string'?body.title.trim():'';
    const clubId=Number(body?.clubId);
    if(title.length<3||title.length>120)return NextResponse.json({error:'Role title must contain 3–120 characters.'},{status:400});
    if(!Number.isInteger(clubId)||clubId<1)return NextResponse.json({error:'Choose a club for this opening.'},{status:400});
    const r=await pool.query('INSERT INTO recruitment_openings(title,club_id,status,applicant_count) VALUES($1,$2,$3,0) RETURNING id,title,club_id,status,created_at',[title,clubId,'Open']);
    return NextResponse.json({opening:r.rows[0]},{status:201});
  }
  if(kind==='application'){
    const openingId=Number(body?.openingId);
    const name=typeof body?.name==='string'?body.name.trim():'';
    const email=typeof body?.email==='string'?body.email.trim().toLowerCase():'';
    const statement=typeof body?.statement==='string'?body.statement.trim().slice(0,1500):'';
    if(!Number.isInteger(openingId)||openingId<1)return NextResponse.json({error:'Choose a valid open role.'},{status:400});
    if(name.length<2||name.length>100||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return NextResponse.json({error:'Enter a valid name and email.'},{status:400});
    const opened=await pool.query(`SELECT id FROM recruitment_openings WHERE id=$1 AND status IN ('Open','Review')`,[openingId]);
    if(!opened.rowCount)return NextResponse.json({error:'This role is not accepting applications.'},{status:409});
    const r=await pool.query('INSERT INTO recruitment_applications(opening_id,applicant_name,email,statement,status) VALUES($1,$2,$3,$4,$5) RETURNING id,opening_id,applicant_name,email,status,created_at',[openingId,name,email,statement,'Applied']);
    return NextResponse.json({application:r.rows[0]},{status:201});
  }
  return NextResponse.json({error:'Unsupported recruitment request.'},{status:400});
 }catch(error){const message=error instanceof Error?error.message:'';if(message.includes('duplicate key'))return NextResponse.json({error:'This application has already been recorded.'},{status:409});return NextResponse.json({error:message||'Could not save recruitment record.'},{status:503});}
}
