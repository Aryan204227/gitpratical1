import { NextResponse } from 'next/server';
import { ensureDatabase, getPool } from '@/lib/db';
import { authorizeResponse, getUserFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    const denied = authorizeResponse(user, ['admin', 'superadmin', 'lead']);
    if (denied) return denied;

    await ensureDatabase();
    const pool = getPool();
    const result = user!.role === 'admin' || user!.role === 'superadmin'
      ? await pool.query(`
          SELECT e.id,e.event_type,e.member_name,e.points,e.created_at,
            COALESCE(c.name,'Club') AS club,t.title AS task
          FROM contribution_events e
          LEFT JOIN clubs c ON c.id=e.club_id
          LEFT JOIN tasks t ON t.id=e.task_id
          ORDER BY e.created_at DESC LIMIT 500
        `)
      : await pool.query(`
          SELECT e.id,e.event_type,e.member_name,e.points,e.created_at,
            COALESCE(c.name,'Club') AS club,t.title AS task
          FROM contribution_events e
          JOIN clubs c ON c.id=e.club_id
          LEFT JOIN tasks t ON t.id=e.task_id
          WHERE c.owner_user_id=$1 OR EXISTS (
            SELECT 1 FROM members lead_member
            WHERE lead_member.club_id=c.id AND lead_member.active=TRUE AND lead_member.role IN ('Lead','Club Lead')
              AND LOWER(BTRIM(lead_member.email))=LOWER(BTRIM($2))
          )
          ORDER BY e.created_at DESC LIMIT 500
        `, [user!.id, user!.email]);

    return NextResponse.json(
      { events: result.rows, count: result.rowCount, method: 'Task assignment and completion events only; no claim of work not recorded.' },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error('[contributions] Failed to load contribution history:', error);
    return NextResponse.json(
      { error: 'Could not load contribution history right now.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
