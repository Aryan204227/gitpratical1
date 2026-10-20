import { NextResponse } from 'next/server';
import { ensureDatabase, getPool } from '@/lib/db';
export const runtime = 'nodejs';
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const origin = request.headers.get('origin');
    if (origin && new URL(origin).origin !== new URL(request.url).origin) return NextResponse.json({ error: 'Cross-origin requests are not accepted.' }, { status: 403 });
    const { id } = await context.params;
    if (!/^\d+$/.test(id)) return NextResponse.json({ error: 'Invalid task id.' }, { status: 400 });
    const body = await request.json().catch(() => null) as { status?: unknown } | null;
    const statuses = new Set(['To do','In progress','In review','Completed','Blocked']);
    if (!body || typeof body.status !== 'string' || !statuses.has(body.status)) return NextResponse.json({ error: 'Unsupported task status.' }, { status: 400 });
    await ensureDatabase();
    const pool = getPool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const updated = await client.query(`UPDATE tasks SET status=$1,updated_at=NOW() WHERE id=$2 RETURNING id,title,owner,to_char(due_date,'YYYY-MM-DD') AS due_date,status,priority,club_id`, [body.status, Number(id)]);
      if (!updated.rowCount) { await client.query('ROLLBACK'); return NextResponse.json({ error: 'Task not found.' }, { status: 404 }); }
      if (body.status === 'Completed') await client.query('INSERT INTO contribution_events(task_id,club_id,member_name,event_type,points) VALUES($1,$2,$3,$4,$5)', [updated.rows[0].id, updated.rows[0].club_id, updated.rows[0].owner, 'task_completed', 1]);
      await client.query('COMMIT');
      return NextResponse.json({ task: updated.rows[0] }, { headers: { 'Cache-Control': 'no-store' } });
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  } catch (error) { const message = error instanceof Error ? error.message : 'Request failed.'; return NextResponse.json({ error: message.includes('DATABASE_URL') ? message : 'Could not update task.' }, { status: message.includes('DATABASE_URL') ? 503 : 500 }); }
}
