import { NextResponse } from 'next/server';
import { isSameOriginRequest } from '@/lib/request-origin';
import { ensureDatabase, getPool } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { canManageClub } from '@/lib/club-access';
import { parsePositiveId } from '@/lib/task-validation.mjs';
import { contributionPoints } from '@/lib/scoring.mjs';

export const runtime = 'nodejs';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Sign in required. Please log in and try again.' }, { status: 401 });
    }

    const { id } = await context.params;
    const taskId = parsePositiveId(id);
    if (taskId === null) return NextResponse.json({ error: 'Invalid task id.' }, { status: 400 });

    await ensureDatabase();
    const pool = getPool();
    const result = await pool.query(`
      SELECT t.id, t.club_id AS "clubId", t.title, t.description, t.owner,
             to_char(t.due_date, 'YYYY-MM-DD') AS due_date, t.status, t.priority,
             t.created_at, t.updated_at, t.effort_weight, c.name AS club
      FROM tasks t
      LEFT JOIN clubs c ON c.id = t.club_id
      WHERE t.id = $1
      LIMIT 1
    `, [taskId]);

    if (!result.rowCount) return NextResponse.json({ error: 'Task not found.' }, { status: 404 });
    const task = result.rows[0];

    const isAdmin = user.role === 'admin' || user.role === 'superadmin';
    const isLeadForClub = user.role === 'lead' && await canManageClub(user, Number(task.clubId));
    const ownsByAccountName = String(task.owner || '').trim().toLowerCase() === user.name.trim().toLowerCase();
    const rosterOwnership = await pool.query(
      `SELECT 1 FROM members
       WHERE club_id = $1 AND active = TRUE
         AND LOWER(BTRIM(email)) = LOWER(BTRIM($2))
         AND LOWER(BTRIM(name)) = LOWER(BTRIM($3))
       LIMIT 1`,
      [task.clubId, user.email, task.owner || ''],
    );

    if (!isAdmin && !isLeadForClub && !ownsByAccountName && !rosterOwnership.rowCount) {
      return NextResponse.json(
        { error: 'You can only view tasks assigned to you or tasks in a club you manage.' },
        { status: 403 },
      );
    }

    return NextResponse.json({ task }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[tasks] Failed to read task:', error);
    return NextResponse.json(
      { error: 'Could not read the task. Please retry later.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Sign in required. Please log in and try again.' }, { status: 401 });
    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: 'Cross-origin requests are not accepted.' }, { status: 403 });
    }

    const { id } = await context.params;
    const taskId = parsePositiveId(id);
    if (taskId === null) return NextResponse.json({ error: 'Invalid task id.' }, { status: 400 });

    const body = await request.json().catch(() => null) as { status?: unknown } | null;
    const statuses = new Set(['To do', 'In progress', 'In review', 'Completed', 'Blocked']);
    if (!body || typeof body.status !== 'string' || !statuses.has(body.status)) {
      return NextResponse.json({ error: 'Unsupported task status.' }, { status: 400 });
    }

    await ensureDatabase();
    const client = await getPool().connect();
    try {
      await client.query('BEGIN');
      const before = await client.query(
        'SELECT id, status, owner, club_id, effort_weight, (due_date IS NULL OR due_date >= CURRENT_DATE) AS on_time FROM tasks WHERE id = $1 FOR UPDATE',
        [taskId],
      );
      if (!before.rowCount) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Task not found.' }, { status: 404 });
      }

      const task = before.rows[0];
      const isAdmin = user.role === 'admin' || user.role === 'superadmin';
      const isLeadForClub = user.role === 'lead' && await canManageClub(user, Number(task.club_id));
      const ownerAccounts = await client.query(
        'SELECT COUNT(*)::int AS count FROM users WHERE LOWER(BTRIM(name)) = LOWER(BTRIM($1))',
        [task.owner || ''],
      );
      const ownsByAccountName = String(task.owner || '').trim().toLowerCase() === user.name.trim().toLowerCase()
        && Number(ownerAccounts.rows[0]?.count) === 1;
      const rosterOwnership = await client.query(
        `SELECT 1 FROM members
         WHERE club_id = $1 AND active = TRUE
           AND LOWER(BTRIM(email)) = LOWER(BTRIM($2))
           AND LOWER(BTRIM(name)) = LOWER(BTRIM($3))
         LIMIT 1`,
        [task.club_id, user.email, task.owner || ''],
      );

      if (!isAdmin && !isLeadForClub && !ownsByAccountName && !rosterOwnership.rowCount) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: 'Only the assigned student or the lead of this club can update the task.' },
          { status: 403 },
        );
      }

      const wasCompleted = task.status === 'Completed';
      const updated = await client.query(
        `UPDATE tasks
         SET status = $1, updated_at = NOW()
         WHERE id = $2
         RETURNING id,title,owner,to_char(due_date,'YYYY-MM-DD') AS due_date,status,priority,club_id`,
        [body.status, taskId],
      );
      if (!updated.rowCount) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Task not found.' }, { status: 404 });
      }

      if (body.status === 'Completed' && !wasCompleted) {
        // Prevent duplicate contribution credit if a completed task is reopened.
        // The task row lock above serializes status changes for this task.
        const alreadyRecorded = await client.query(
          "SELECT 1 FROM contribution_events WHERE task_id = $1 AND event_type = 'task_completed' LIMIT 1",
          [taskId],
        );
        if (!alreadyRecorded.rowCount) {
          await client.query(
            'INSERT INTO contribution_events(task_id,club_id,member_name,event_type,points) VALUES($1,$2,$3,$4,$5)',
            [updated.rows[0].id, updated.rows[0].club_id, updated.rows[0].owner, 'task_completed', contributionPoints({ effortWeight: Number(task.effort_weight) || 3, onTime: Boolean(task.on_time), reviewMultiplier: 1 })],
          );
        }
      }

      await client.query('COMMIT');
      return NextResponse.json({ task: updated.rows[0] }, { headers: { 'Cache-Control': 'no-store' } });
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('[tasks] Failed to update task:', error);
    return NextResponse.json(
      { error: 'Could not update the task. Please retry later.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
