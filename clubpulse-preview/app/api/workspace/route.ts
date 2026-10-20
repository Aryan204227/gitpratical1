import { NextResponse } from 'next/server';
import { ensureDatabase, getPool } from '@/lib/db';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export async function GET(request: Request) {
  try {
    await ensureDatabase();
    const type = new URL(request.url).searchParams.get('type') || 'clubs';
    const pool = getPool();
    let items: unknown[] = [];
    if (type === 'clubs') {
      const r = await pool.query(`SELECT c.id,c.name AS label,c.category AS detail,COUNT(DISTINCT m.id)::int||' members' AS activity,c.status FROM clubs c LEFT JOIN members m ON m.club_id=c.id AND m.active=TRUE GROUP BY c.id ORDER BY c.name`);
      items = r.rows;
    } else if (type === 'members') {
      const r = await pool.query(`SELECT m.id,m.name AS label,COALESCE(c.name,'No club') AS detail,COUNT(e.id)::int||' contributions' AS activity,CASE WHEN m.active THEN 'Active' ELSE 'Inactive' END AS status FROM members m LEFT JOIN clubs c ON c.id=m.club_id LEFT JOIN contribution_events e ON e.member_name=m.name GROUP BY m.id,c.name ORDER BY m.name`);
      items = r.rows;
    } else if (type === 'recruitment') {
      const r = await pool.query(`SELECT o.id,o.title AS label,COALESCE(c.name,'Club') AS detail,o.applicant_count::text||' applicants' AS activity,o.status FROM recruitment_openings o LEFT JOIN clubs c ON c.id=o.club_id ORDER BY o.created_at DESC`);
      items = r.rows;
    } else if (type === 'feedback') {
      const r = await pool.query(`SELECT f.id,f.topic AS label,CASE WHEN f.is_anonymous THEN 'Anonymous feedback' ELSE 'Named feedback' END AS detail,CASE WHEN f.rating IS NULL THEN 'No rating' ELSE f.rating::text||'/5 rating' END AS activity,f.status FROM feedback_entries f ORDER BY f.created_at DESC LIMIT 100`);
      items = r.rows;
    } else if (type === 'contributions') {
      const r = await pool.query(`SELECT e.id,e.event_type AS label,e.member_name AS detail,e.points::text||' points' AS activity,TO_CHAR(e.created_at,'Mon DD') AS status FROM contribution_events e ORDER BY e.created_at DESC LIMIT 150`);
      items = r.rows;
    } else if (type === 'tasks') {
      const r = await pool.query(`SELECT t.id,t.title AS label,t.owner AS detail,COALESCE(TO_CHAR(t.due_date,'Mon DD'),'No deadline') AS activity,t.status FROM tasks t ORDER BY t.due_date NULLS LAST,t.created_at DESC`);
      items = r.rows;
    } else return NextResponse.json({ error: 'Unknown workspace view.' }, { status: 400 });
    return NextResponse.json({ type, items, count: items.length }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Workspace query failed.';
    return NextResponse.json({ error: message }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
