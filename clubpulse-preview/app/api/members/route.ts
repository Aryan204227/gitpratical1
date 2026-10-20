import { NextResponse } from 'next/server';
import { isSameOriginRequest } from '@/lib/request-origin';
import { ensureDatabase,getPool } from '@/lib/db';
import { authorizeResponse, getUserFromRequest } from '@/lib/auth';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export async function GET(request: Request){
  try{
    const denied = authorizeResponse(await getUserFromRequest(request), ['admin','lead']);
    if (denied) return denied;
    await ensureDatabase();
    const r=await getPool().query(`SELECT m.id,m.name,m.email,m.role,m.active,COALESCE(c.name,'No club') AS club,COUNT(e.id)::int AS contribution_count
      FROM members m LEFT JOIN clubs c ON c.id=m.club_id LEFT JOIN contribution_events e ON LOWER(e.member_name)=LOWER(m.name)
      GROUP BY m.id,c.name ORDER BY m.name`);
    return NextResponse.json({members:r.rows,count:r.rowCount},{headers:{'Cache-Control':'no-store'}});
  }catch(error){const message=error instanceof Error?error.message:'Could not load members.';return NextResponse.json({error:message},{status:503});}
}
export async function POST(request:Request){
  try{
    const denied = authorizeResponse(await getUserFromRequest(request), ['admin','lead']);
    if (denied) return denied;
    if (!isSameOriginRequest(request)) return NextResponse.json({ error: 'Cross-origin requests are not accepted.' }, { status: 403 });
    await ensureDatabase();
    const body=await request.json().catch(()=>null) as Record<string,unknown>|null;
    const name=typeof body?.name==='string'?body.name.trim():'';
    const email=typeof body?.email==='string'?body.email.trim().toLowerCase():'';
    const role=typeof body?.role==='string'?body.role:'Member';
    const clubId=body?.clubId===undefined||body?.clubId===null||body.clubId===''?null:Number(body.clubId);
    if(name.length<2||name.length>100)return NextResponse.json({error:'Member name must contain 2–100 characters.'},{status:400});
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)return NextResponse.json({error:'Enter a valid email address.'},{status:400});
    if(!['Member','Lead','Coordinator'].includes(role))return NextResponse.json({error:'Choose a valid member role.'},{status:400});
    if(clubId!==null&&(!Number.isInteger(clubId)||clubId<1))return NextResponse.json({error:'Select a valid club.'},{status:400});
    const pool=getPool();
    if(clubId!==null){const exists=await pool.query('SELECT 1 FROM clubs WHERE id=$1',[clubId]);if(!exists.rowCount)return NextResponse.json({error:'Selected club does not exist.'},{status:400});}
    const r=await pool.query('INSERT INTO members(name,email,club_id,role) VALUES($1,$2,$3,$4) RETURNING id,name,email,role,active,club_id,created_at',[name,email,clubId,role]);
    return NextResponse.json({member:r.rows[0]},{status:201,headers:{'Cache-Control':'no-store'}});
  }catch(error){const message=error instanceof Error?error.message:'';if(message.includes('duplicate key'))return NextResponse.json({error:'A member with that email already exists.'},{status:409});return NextResponse.json({error:message||'Could not add member.'},{status:503});}
}
