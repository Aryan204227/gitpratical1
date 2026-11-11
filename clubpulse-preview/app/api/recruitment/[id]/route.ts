import { NextResponse } from 'next/server';
import { isSameOriginRequest } from '@/lib/request-origin';
import { ensureDatabase, getPool } from '@/lib/db';
import { authorizeResponse, getUserFromRequest } from '@/lib/auth';
import { canManageClub } from '@/lib/club-access';

export const runtime = 'nodejs';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUserFromRequest(request);
    const denied = authorizeResponse(user, ['admin', 'superadmin', 'lead']);
    if (denied) return denied;
    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: 'Cross-origin requests are not accepted.' }, { status: 403 });
    }

    const { id } = await context.params;
    if (!/^\d+$/.test(id)) {
      return NextResponse.json({ error: 'Invalid application id.' }, { status: 400 });
    }
    const body = await request.json().catch(() => null) as { status?: unknown } | null;
    const allowed = new Set(['Applied', 'Reviewing', 'Accepted', 'Rejected']);
    if (!body || typeof body.status !== 'string' || !allowed.has(body.status)) {
      return NextResponse.json({ error: 'Choose Applied, Reviewing, Accepted or Rejected.' }, { status: 400 });
    }

    await ensureDatabase();
    const client = await getPool().connect();
    try {
      await client.query('BEGIN');
      const current = await client.query(
        `SELECT a.id,a.applicant_name,a.email,a.status,a.opening_id,o.club_id
         FROM recruitment_applications a
         JOIN recruitment_openings o ON o.id=a.opening_id
         WHERE a.id=$1 FOR UPDATE OF a`,
        [Number(id)],
      );
      if (!current.rowCount) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
      }

      const application = current.rows[0];
      if (!await canManageClub(user, Number(application.club_id))) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'You can only review applications for a club you manage.' }, { status: 403 });
      }

      let onboarded = false;
      if (body.status === 'Accepted' && application.status !== 'Accepted') {
        const existing = await client.query(
          'SELECT id,name,club_id FROM members WHERE LOWER(BTRIM(email))=LOWER(BTRIM($1)) LIMIT 1 FOR UPDATE',
          [application.email],
        );

        if (
          existing.rowCount
          && existing.rows[0].club_id !== null
          && Number(existing.rows[0].club_id) !== Number(application.club_id)
        ) {
          await client.query('ROLLBACK');
          return NextResponse.json(
            { error: 'This student is already listed in another club. Their existing membership was not changed.' },
            { status: 409 },
          );
        }

        let member: any;
        if (existing.rowCount) {
          const updatedMember = await client.query(
            'UPDATE members SET active=TRUE,club_id=$1 WHERE id=$2 RETURNING id,name,club_id',
            [application.club_id, existing.rows[0].id],
          );
          member = updatedMember.rows[0];
        } else {
          const createdMember = await client.query(
            "INSERT INTO members(name,email,club_id,role,active) VALUES($1,$2,$3,'Member',TRUE) RETURNING id,name,club_id",
            [application.applicant_name, application.email, application.club_id],
          );
          member = createdMember.rows[0];
          await client.query(
            "INSERT INTO contribution_events(club_id,member_name,event_type,points) VALUES($1,$2,'membership_joined',0)",
            [member.club_id, member.name],
          );
        }
        onboarded = true;
      }

      const updated = await client.query(
        'UPDATE recruitment_applications SET status=$1 WHERE id=$2 RETURNING id,applicant_name,email,status,opening_id',
        [body.status, Number(id)],
      );
      await client.query('COMMIT');

      return NextResponse.json(
        { application: updated.rows[0], onboarded },
        { headers: { 'Cache-Control': 'no-store' } },
      );
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('[recruitment] Failed to update application:', error);
    return NextResponse.json(
      { error: 'Could not update the application. Please retry.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
