import { NextResponse } from 'next/server';
import { ensureDatabase, getPool } from '@/lib/db';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export async function GET() {
  try {
    await ensureDatabase();
    const pool = getPool();
    const [clubs, members, tasks, openings, feedback, trends] = await Promise.all([
      pool.query(`SELECT c.id,c.name,c.category,c.status,COUNT(DISTINCT m.id)::int AS member_count,COUNT(DISTINCT t.id)::int AS task_count,COUNT(DISTINCT t.id) FILTER(WHERE t.status='Completed')::int AS completed_count FROM clubs c LEFT JOIN members m ON m.club_id=c.id AND m.active=TRUE LEFT JOIN tasks t ON t.club_id=c.id GROUP BY c.id ORDER BY c.name`),
      pool.query('SELECT COUNT(*)::int AS count FROM members WHERE active=TRUE'),
      pool.query(`SELECT COUNT(*)::int AS total,COUNT(*) FILTER(WHERE status='Completed')::int AS completed,COUNT(*) FILTER(WHERE status NOT IN ('Completed','Blocked'))::int AS open FROM tasks`),
      pool.query(`SELECT COUNT(*)::int AS count FROM recruitment_applications WHERE status IN ('Applied','Reviewing')`),
      pool.query('SELECT COUNT(*)::int AS count,CASE WHEN COUNT(*) >= 5 THEN ROUND(AVG(rating)::numeric,1) ELSE NULL END AS average FROM feedback_entries WHERE rating BETWEEN 1 AND 5'),
      pool.query(`SELECT TO_CHAR(date_trunc('week',created_at),'Mon DD') AS week,COUNT(*) FILTER(WHERE event_type='task_assigned')::int AS tasks,COUNT(*) FILTER(WHERE event_type='task_completed')::int AS completed FROM contribution_events WHERE created_at >= NOW()-INTERVAL '8 weeks' GROUP BY date_trunc('week',created_at) ORDER BY date_trunc('week',created_at)`)
    ]);
    const clubBars = clubs.rows.map((row) => ({ id: row.id, name: row.name, score: row.task_count ? Math.round(row.completed_count / row.task_count * 100) : null, isDemo: true }));
    return NextResponse.json({
      mode: 'demo', storage: 'postgresql',
      metrics: { clubs: clubs.rowCount, activeMembers: members.rows[0].count, tasksCompleted: tasks.rows[0].completed, totalTasks: tasks.rows[0].total, openTasks: tasks.rows[0].open, openApplications: openings.rows[0].count, feedbackCount: feedback.rows[0].count, averageRating: feedback.rows[0].average },
      clubs: clubs.rows, clubBars, trend: trends.rows,
      methodologicalNote: 'Seed records are synthetic demonstration data. Contribution events record task assignment/completion. Activity signals are planning aids, not burnout diagnoses.'
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Dashboard query failed.';
    return NextResponse.json({ error: message }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
