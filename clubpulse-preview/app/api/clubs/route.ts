import { NextResponse } from 'next/server';
import { ensureDatabase, getPool } from '@/lib/db';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export async function GET() {
  try {
    await ensureDatabase();
    const r = await getPool().query(`
      SELECT c.id,c.name,c.category,c.status,COUNT(DISTINCT m.id)::int AS member_count,
      COUNT(DISTINCT t.id)::int AS task_count,COUNT(DISTINCT t.id) FILTER(WHERE t.status='Completed')::int AS completed_count
      FROM clubs c LEFT JOIN members m ON m.club_id=c.id AND m.active=TRUE LEFT JOIN tasks t ON t.club_id=c.id
      GROUP BY c.id ORDER BY c.name
    `);
    return NextResponse.json({ clubs:r.rows, count:r.rowCount },{headers:{'Cache-Control':'no-store'}});
  } catch(error){const message=error instanceof Error?error.message:'Could not load clubs.';return NextResponse.json({error:message},{status:503});}
}
export async function POST(request:Request) {
  try {
    const origin=request.headers.get('origin'); if(origin&&new URL(origin).origin!==new URL(request.url).origin)return NextResponse.json({error:'Cross-origin requests are not accepted.'},{status:403});
    await ensureDatabase();
    const body=await request.json().catch(()=>null) as Record<string,unknown>|null;
    const name=typeof body?.name==='string'?body.name.trim():'';
    const category=typeof body?.category==='string'?body.category.trim().slice(0,60):'General';
    if(name.length<2||name.length>120)return NextResponse.json({error:'Club name must contain 2–120 characters.'},{status:400});
    const r=await getPool().query('INSERT INTO clubs(name,category) VALUES($1,$2) RETURNING id,name,category,status,created_at',[name,category||'General']);
    return NextResponse.json({club:r.rows[0]},{status:201,headers:{'Cache-Control':'no-store'}});
  } catch(error){const message=error instanceof Error?error.message:'';if(message.includes('duplicate key'))return NextResponse.json({error:'A club with this name already exists.'},{status:409});return NextResponse.json({error:message||'Could not create club.'},{status:503});}
}
