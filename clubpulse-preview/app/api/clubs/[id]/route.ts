import { NextResponse } from 'next/server';
import { z } from 'zod';
import { isTrustedMutationRequest } from '@/lib/request-origin';
import { ensureDatabase, getPool } from '@/lib/db';
import { authorizeResponse, getUserFromRequest } from '@/lib/auth';
import { canManageClub } from '@/lib/club-access';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const updateSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  category: z.string().trim().max(60).optional(),
  description: z.string().trim().max(1200).optional(),
  meeting_schedule: z.string().trim().max(240).optional(),
  contact_email: z.string().trim().max(254).refine(v => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)).optional(),
  website_url: z.string().trim().max(500).refine(v => !v || /^https?:\/\/\S+$/i.test(v)).optional(),
  status: z.enum(['Active', 'Inactive', 'Recruiting', 'Archived']).optional(),
}).refine(value => Object.keys(value).length > 0, 'Provide at least one field to update.');

async function parseClubId(context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const clubId = Number(id);
  return Number.isInteger(clubId) && clubId > 0 ? clubId : null;
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const denied = authorizeResponse(await getUserFromRequest(request));
    if (denied) return denied;
    const clubId = await parseClubId(context);
    if (!clubId) return NextResponse.json({ error: 'Invalid club id.' }, { status: 400 });
    await ensureDatabase();
    const result = await getPool().query(`
      SELECT c.id,c.name,c.category,c.description,c.meeting_schedule,c.contact_email,c.website_url,
        c.status,c.created_at,COALESCE(owner.name,'Unassigned') AS lead_name,
        COUNT(DISTINCT m.id)::int AS member_count,
        COUNT(DISTINCT t.id)::int AS task_count,
        COUNT(DISTINCT t.id) FILTER(WHERE t.status='Completed')::int AS completed_count
      FROM clubs c
      LEFT JOIN users owner ON owner.id=c.owner_user_id
      LEFT JOIN members m ON m.club_id=c.id AND m.active=TRUE
      LEFT JOIN tasks t ON t.club_id=c.id
      WHERE c.id=$1
      GROUP BY c.id,owner.name
    `, [clubId]);
    if (!result.rowCount) return NextResponse.json({ error: 'Club not found.' }, { status: 404 });
    return NextResponse.json({ club: result.rows[0] }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[clubs] Failed to load club:', error);
    return NextResponse.json({ error: 'Could not load this club.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUserFromRequest(request);
    const denied = authorizeResponse(user);
    if (denied) return denied;
    if (!isTrustedMutationRequest(request)) return NextResponse.json({ error: 'Request origin could not be verified.' }, { status: 403 });
    const clubId = await parseClubId(context);
    if (!clubId) return NextResponse.json({ error: 'Invalid club id.' }, { status: 400 });
    if (!await canManageClub(user, clubId)) return NextResponse.json({ error: 'You do not have permission to manage this club.' }, { status: 403 });
    const parsed = updateSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid club update.' }, { status: 400 });
    await ensureDatabase();
    const current = await getPool().query(
      'SELECT id,name,category,description,meeting_schedule,contact_email,website_url,status FROM clubs WHERE id=$1',
      [clubId],
    );
    if (!current.rowCount) return NextResponse.json({ error: 'Club not found.' }, { status: 404 });
    const next = { ...current.rows[0], ...parsed.data };
    const updated = await getPool().query(
      `UPDATE clubs SET name=$1,category=$2,description=$3,meeting_schedule=$4,contact_email=$5,website_url=$6,status=$7
       WHERE id=$8
       RETURNING id,name,category,description,meeting_schedule,contact_email,website_url,status,created_at`,
      [next.name,next.category,next.description,next.meeting_schedule,next.contact_email,next.website_url,next.status,clubId],
    );
    return NextResponse.json({ club: updated.rows[0] }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('duplicate key')) return NextResponse.json({ error: 'A club with that name already exists.' }, { status: 409 });
    console.error('[clubs] Failed to update club:', error);
    return NextResponse.json({ error: 'Could not update the club.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUserFromRequest(request);
    const denied = authorizeResponse(user);
    if (denied) return denied;
    if (!isTrustedMutationRequest(request)) return NextResponse.json({ error: 'Request origin could not be verified.' }, { status: 403 });
    const clubId = await parseClubId(context);
    if (!clubId) return NextResponse.json({ error: 'Invalid club id.' }, { status: 400 });
    if (!await canManageClub(user, clubId)) return NextResponse.json({ error: 'You do not have permission to manage this club.' }, { status: 403 });
    await ensureDatabase();
    const result = await getPool().query(
      `UPDATE clubs SET status='Archived' WHERE id=$1 AND status<>'Archived'
       RETURNING id,name,status`,
      [clubId],
    );
    if (!result.rowCount) return NextResponse.json({ error: 'Club not found or already archived.' }, { status: 404 });
    // DELETE is retained for API compatibility but archives only; no linked data is deleted.
    return NextResponse.json({ archived: true, club: result.rows[0] }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[clubs] Failed to archive club:', error);
    return NextResponse.json({ error: 'Could not archive this club.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
