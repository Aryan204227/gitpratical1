import { NextResponse } from 'next/server';
import { isSameOriginRequest } from '@/lib/request-origin';
import { ensureDatabase, getPool } from '@/lib/db';
import { authorizeResponse, getUserFromRequest } from '@/lib/auth';
import { getTasksForUser } from '@/lib/read-model';
import { canManageClub } from '@/lib/club-access';
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
    const user = await getUserFromRequest(request);
    const denied = authorizeResponse(user);
    if (denied) return denied;

    const tasks = await getTasksForUser(user!);
    return NextResponse.json(
      { tasks, count: tasks.length },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    const denied = authorizeResponse(user, ['admin', 'superadmin', 'lead']);
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
    const effortWeight = body.effortWeight === undefined ? 3 : Number(body.effortWeight);
    const clubId = parsePositiveId(body.clubId);

    if (title.length < 3 || title.length > 160) {
      return NextResponse.json({ error: 'Task title must contain 3–160 characters.' }, { status: 400 });
    }
    if (owner.length < 1) {
      return NextResponse.json({ error: 'Please provide an owner or use Unassigned.' }, { status: 400 });
    }
    if (dueDate && !isValidIsoDate(dueDate)) {
      return NextResponse.json({ error: 'Due date must be a real calendar date in YYYY-MM-DD format.' }, { status: 400 });
    }
    if (!priorities.has(priority)) {
      return NextResponse.json({ error: 'Unsupported task priority.' }, { status: 400 });
    }
    if (!Number.isInteger(effortWeight) || effortWeight < 1 || effortWeight > 5) {
      return NextResponse.json({ error: 'Task effort must be between 1 and 5.' }, { status: 400 });
    }
    if (clubId === null) {
      return NextResponse.json({ error: 'A valid clubId is required.' }, { status: 400 });
    }
    if (!await canManageClub(user!, clubId)) {
      return NextResponse.json({ error: 'You can only create tasks for a club you manage.' }, { status: 403 });
    }

    const client = await getPool().connect();
    try {
      await client.query('BEGIN');
      const clubResult = await client.query(
        "SELECT id FROM clubs WHERE id = $1 AND status <> 'Archived' FOR KEY SHARE",
        [clubId],
      );
      if (!clubResult.rowCount) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Choose an active club.' }, { status: 400 });
      }

      if (owner !== 'Unassigned') {
        const assigned = await client.query(
          `SELECT id,name FROM members
           WHERE club_id=$1 AND active=TRUE
             AND LOWER(BTRIM(name))=LOWER(BTRIM($2))
           LIMIT 1 FOR KEY SHARE`,
          [clubId, owner],
        );
        if (!assigned.rowCount) {
          await client.query('ROLLBACK');
          return NextResponse.json({ error: 'Choose a student from this club or leave the task unassigned.' }, { status: 400 });
        }
      }

      const created = await client.query(
        `INSERT INTO tasks(title,owner,due_date,status,priority,club_id,effort_weight)
         VALUES($1,$2,$3,'To do',$4,$5,$6)
         RETURNING id,title,description,owner,to_char(due_date,'YYYY-MM-DD') AS due_date,
                   status,priority,effort_weight,created_at,club_id AS "clubId"`,
        [title, owner, dueDate || null, priority, clubId, effortWeight],
      );

      await client.query(
        'INSERT INTO contribution_events(task_id,club_id,member_name,event_type,points) VALUES($1,$2,$3,$4,$5)',
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
