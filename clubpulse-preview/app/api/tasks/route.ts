import { NextResponse } from 'next/server';
import { isSameOriginRequest } from '@/lib/request-origin';
import { ensureDatabase, getPool } from '@/lib/db';
import { authorizeResponse, getUserFromRequest } from '@/lib/auth';
import { isValidIsoDate, parsePositiveId } from '@/lib/task-validation.mjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const priorities = new Set(['Low', 'Medium', 'High', 'Urgent']);

function fail(error: unknown) {
  console.error('[tasks] API request failed:', error);
  return NextResponse.json(
    { error: 'The request could not be completed. Please retry later.' },
    { status: 503, headers: { 'Cache-Control': 'no-store' } },
  );
}

export async function GET(request: Request) {
  try {
    const denied = authorizeResponse(await getUserFromRequest(request));
    if (denied) return denied;

    await ensureDatabase();
    const result = await getPool().query(`
      SELECT t.id, t.club_id AS "clubId", t.title, t.description, t.owner,
             to_char(t.due_date, 'YYYY-MM-DD') AS due_date, t.status, t.priority,
             t.created_at, c.name AS club
      FROM tasks t
      LEFT JOIN clubs c ON c.id = t.club_id
      ORDER BY CASE WHEN t.status = 'Completed' THEN 1 ELSE 0 END,
               t.due_date NULLS LAST, t.created_at DESC
      LIMIT 250
    `);

    return NextResponse.json(
      { tasks: result.rows, count: result.rowCount },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const denied = authorizeResponse(await getUserFromRequest(request), ['admin', 'lead']);
    if (denied) return denied;
    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: 'Cross-origin requests are not accepted.' }, { status: 403 });
    }

    await ensureDatabase();
    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Send a valid JSON object.' }, { status: 400 });
    }

    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const owner = typeof body.owner === 'string' ? body.owner.trim().slice(0, 80) : 'Unassigned';
    const dueDate = typeof body.dueDate === 'string' ? body.dueDate : '';
    const priority = typeof body.priority === 'string' ? body.priority : 'Medium';
    const clubId = parsePositiveId(body.clubId);

    if (title.length < 3 || title.length > 160) {
      return NextResponse.json({ error: 'Task title must contain 3–160 characters.' }, { status: 400 });
    }
    if (owner.length < 1) {
      return NextResponse.json({ error: 'Please provide an owner or use Unassigned.' }, { status: 400 });
    }
    if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      return NextResponse.json({ error: 'Due date must use YYYY-MM-DD.' }, { status: 400 });
    }
    if (!priorities.has(priority)) {
      return NextResponse.json({ error: 'Unsupported task priority.' }, { status: 400 });
    }
    if (clubId === null) {
      return NextResponse.json({ error: 'A valid clubId is required.' }, { status: 400 });
    }

    const client = await getPool().connect();
    try {
      await client.query('BEGIN');
      const clubResult = await client.query(
        'SELECT id FROM clubs WHERE id = $1 FOR KEY SHARE',
        [clubId],
      );
      if (!clubResult.rowCount) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'The selected club does not exist.' }, { status: 400 });
      }

      const created = await client.query(`
        INSERT INTO tasks(title, owner, due_date, status, priority, club_id)
        VALUES($1, $2, $3, 'To do', $4, $5)
        RETURNING id, title, description, owner,
                  to_char(due_date, 'YYYY-MM-DD') AS due_date,
                  status, priority, created_at, club_id AS "clubId"
      `, [title, owner, dueDate || null, priority, clubId]);

      await client.query(
        'INSERT INTO contribution_events(task_id, club_id, member_name, event_type, points) VALUES($1, $2, $3, $4, $5)',
        [created.rows[0].id, clubId, owner, 'task_assigned', 0],
      );
      await client.query('COMMIT');

      return NextResponse.json(
        { task: created.rows[0] },
        { status: 201, headers: { 'Cache-Control': 'no-store' } },
      );
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    return fail(error);
  }
}
