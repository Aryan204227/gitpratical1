import { NextResponse } from 'next/server';
import { isSameOriginRequest } from '@/lib/request-origin';
import { ensureDatabase, getPool } from '@/lib/db';
import { authorizeResponse, getUserFromRequest } from '@/lib/auth';
import { canManageClub } from '@/lib/club-access';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    const denied = authorizeResponse(user);
    if (denied) return denied;

    const view = new URL(request.url).searchParams.get('view') || 'openings';
    await ensureDatabase();
    const pool = getPool();

    if (view === 'applications') {
      if (!['admin', 'superadmin', 'lead'].includes(user!.role)) {
        return NextResponse.json({ error: 'Only club leads can review applications.' }, { status: 403 });
      }

      const result = user!.role === 'admin' || user!.role === 'superadmin'
        ? await pool.query(`
            SELECT a.id,a.applicant_name AS label,a.email AS detail,o.title AS activity,
              a.status,a.statement,COALESCE(c.name,'Club') AS club
            FROM recruitment_applications a
            JOIN recruitment_openings o ON o.id=a.opening_id
            LEFT JOIN clubs c ON c.id=o.club_id
            ORDER BY a.created_at DESC LIMIT 200
          `)
        : await pool.query(`
            SELECT a.id,a.applicant_name AS label,a.email AS detail,o.title AS activity,
              a.status,a.statement,COALESCE(c.name,'Club') AS club
            FROM recruitment_applications a
            JOIN recruitment_openings o ON o.id=a.opening_id
            JOIN clubs c ON c.id=o.club_id
            WHERE c.owner_user_id=$1 OR EXISTS (
              SELECT 1 FROM members lead_member
              WHERE lead_member.club_id=c.id AND lead_member.active=TRUE AND lead_member.role IN ('Lead','Club Lead')
                AND LOWER(BTRIM(lead_member.email))=LOWER(BTRIM($2))
            )
            ORDER BY a.created_at DESC LIMIT 200
          `, [user!.id, user!.email]);

      return NextResponse.json(
        { view, items: result.rows, count: result.rowCount },
        { headers: { 'Cache-Control': 'no-store' } },
      );
    }

    const result = user!.role === 'admin' || user!.role === 'superadmin'
      ? await pool.query(`
          SELECT o.id,o.title AS label,COALESCE(c.name,'Club') AS detail,
            COUNT(a.id)::int AS applicant_count,o.status
          FROM recruitment_openings o
          LEFT JOIN clubs c ON c.id=o.club_id
          LEFT JOIN recruitment_applications a ON a.opening_id=o.id
          GROUP BY o.id,c.name ORDER BY o.created_at DESC
        `)
      : user!.role === 'lead'
        ? await pool.query(`
            SELECT o.id,o.title AS label,COALESCE(c.name,'Club') AS detail,
              COUNT(a.id)::int AS applicant_count,o.status
            FROM recruitment_openings o
            LEFT JOIN clubs c ON c.id=o.club_id
            LEFT JOIN recruitment_applications a ON a.opening_id=o.id
            WHERE c.owner_user_id=$1 OR EXISTS (
              SELECT 1 FROM members lead_member
              WHERE lead_member.club_id=c.id AND lead_member.active=TRUE AND lead_member.role IN ('Lead','Club Lead')
                AND LOWER(BTRIM(lead_member.email))=LOWER(BTRIM($2))
            )
            GROUP BY o.id,c.name ORDER BY o.created_at DESC
          `, [user!.id, user!.email])
        : await pool.query(`
            SELECT o.id,o.title AS label,COALESCE(c.name,'Club') AS detail,
              COUNT(a.id)::int AS applicant_count,o.status
            FROM recruitment_openings o
            JOIN clubs c ON c.id=o.club_id
            LEFT JOIN recruitment_applications a ON a.opening_id=o.id
            WHERE o.status IN ('Open','Review') AND c.status<>'Archived'
            GROUP BY o.id,c.name ORDER BY o.created_at DESC
          `);

    return NextResponse.json(
      { view: 'openings', items: result.rows, count: result.rowCount },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error('[recruitment] Failed to load recruitment:', error);
    return NextResponse.json(
      { error: 'Could not load recruitment right now.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}

export async function POST(request: Request) {
  try {
    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: 'Cross-origin requests are not accepted.' }, { status: 403 });
    }

    const actor = await getUserFromRequest(request);
    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    const kind = typeof body?.kind === 'string' ? body.kind : 'opening';
    const denied = authorizeResponse(actor, kind === 'opening' ? ['admin', 'superadmin', 'lead'] : undefined);
    if (denied) return denied;

    await ensureDatabase();
    const pool = getPool();

    if (kind === 'opening') {
      const title = typeof body?.title === 'string' ? body.title.trim() : '';
      const clubId = Number(body?.clubId);
      if (title.length < 3 || title.length > 120) {
        return NextResponse.json({ error: 'Role title must contain 3–120 characters.' }, { status: 400 });
      }
      if (!Number.isInteger(clubId) || clubId < 1) {
        return NextResponse.json({ error: 'Choose a club for this opening.' }, { status: 400 });
      }
      if (!await canManageClub(actor, clubId)) {
        return NextResponse.json({ error: 'You can only publish roles for a club you manage.' }, { status: 403 });
      }
      const club = await pool.query("SELECT id FROM clubs WHERE id=$1 AND status<>'Archived'", [clubId]);
      if (!club.rowCount) return NextResponse.json({ error: 'Choose an active club.' }, { status: 400 });

      const result = await pool.query(
        'INSERT INTO recruitment_openings(title,club_id,status,applicant_count) VALUES($1,$2,$3,0) RETURNING id,title,club_id,status,created_at',
        [title, clubId, 'Open'],
      );
      return NextResponse.json({ opening: result.rows[0] }, { status: 201 });
    }

    if (kind === 'application') {
      if (!actor || actor.role !== 'member') {
        return NextResponse.json({ error: 'Sign in with a student account to apply.' }, { status: 403 });
      }
      const openingId = Number(body?.openingId);
      const statement = typeof body?.statement === 'string' ? body.statement.trim().slice(0, 1500) : '';
      if (!Number.isInteger(openingId) || openingId < 1) {
        return NextResponse.json({ error: 'Choose a valid open role.' }, { status: 400 });
      }
      const opening = await pool.query(
        `SELECT o.id,c.id AS club_id
         FROM recruitment_openings o
         JOIN clubs c ON c.id=o.club_id
         WHERE o.id=$1 AND o.status IN ('Open','Review') AND c.status<>'Archived'`,
        [openingId],
      );
      if (!opening.rowCount) {
        return NextResponse.json({ error: 'This role is not accepting applications.' }, { status: 409 });
      }
      const result = await pool.query(
        'INSERT INTO recruitment_applications(opening_id,applicant_name,email,statement,status) VALUES($1,$2,$3,$4,$5) RETURNING id,opening_id,applicant_name,email,status,created_at',
        [openingId, actor.name, actor.email, statement, 'Applied'],
      );
      return NextResponse.json({ application: result.rows[0] }, { status: 201 });
    }

    return NextResponse.json({ error: 'Unsupported recruitment request.' }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('duplicate key')) {
      return NextResponse.json({ error: 'This application has already been recorded.' }, { status: 409 });
    }
    console.error('[recruitment] Failed to save recruitment record:', error);
    return NextResponse.json(
      { error: 'Could not save the recruitment record. Please retry.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
