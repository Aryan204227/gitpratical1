import { NextResponse } from 'next/server';
import { isSameOriginRequest } from '@/lib/request-origin';
import { ensureDatabase, getPool } from '@/lib/db';
import { authorizeResponse, getUserFromRequest } from '@/lib/auth';
import { canManageClub } from '@/lib/club-access';
import { getMembers } from '@/lib/read-model';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    const denied = authorizeResponse(user, ['admin', 'superadmin', 'lead']);
    if (denied) return denied;

    const members = await getMembers(user!);
    return NextResponse.json(
      { members, count: members.length },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error('[members] Failed to load members:', error);
    return NextResponse.json(
      { error: 'Could not load members right now.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    const denied = authorizeResponse(user, ['admin', 'superadmin', 'lead']);
    if (denied) return denied;
    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: 'Refresh the page and try again.' }, { status: 403 });
    }

    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const clubId = Number(body?.clubId);

    if (name.length < 2 || name.length > 100) {
      return NextResponse.json({ error: 'Student name must contain 2–100 characters.' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return NextResponse.json({ error: 'Enter a valid student email address.' }, { status: 400 });
    }
    if (!Number.isInteger(clubId) || clubId < 1) {
      return NextResponse.json({ error: 'Choose a club for this student.' }, { status: 400 });
    }
    if (user!.role === 'lead' && !await canManageClub(user, clubId)) {
      return NextResponse.json({ error: 'You can only add students to a club you manage.' }, { status: 403 });
    }

    await ensureDatabase();
    const client = await getPool().connect();
    try {
      await client.query('BEGIN');
      const club = await client.query(
        "SELECT id, status FROM clubs WHERE id = $1 FOR KEY SHARE",
        [clubId],
      );
      if (!club.rowCount || club.rows[0].status === 'Archived') {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Choose an active club.' }, { status: 400 });
      }

      const account = await client.query(
        'SELECT name FROM users WHERE LOWER(BTRIM(email)) = LOWER(BTRIM($1)) LIMIT 1',
        [email],
      );
      const memberName = String(account.rows[0]?.name || name).trim();
      const inserted = await client.query(
        `INSERT INTO members(name, email, club_id, role, active)
         VALUES($1, $2, $3, 'Member', TRUE)
         RETURNING id, name, email, role, active, club_id, created_at`,
        [memberName, email, clubId],
      );
      const member = inserted.rows[0];

      await client.query(
        `INSERT INTO contribution_events(club_id, member_name, event_type, points)
         VALUES($1, $2, 'membership_joined', 0)`,
        [clubId, member.name],
      );

      await client.query('COMMIT');
      return NextResponse.json(
        { member, accountLinked: Boolean(account.rowCount) },
        { status: 201, headers: { 'Cache-Control': 'no-store' } },
      );
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('duplicate key')) {
      return NextResponse.json(
        { error: 'This email is already on the member list. Each student can have one primary club in this version.' },
        { status: 409 },
      );
    }
    console.error('[members] Failed to add member:', error);
    return NextResponse.json(
      { error: 'Could not add the student. Please check the details and try again.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
