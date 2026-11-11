import { NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOriginRequest } from '@/lib/request-origin';
import { ensureDatabase, getPool } from '@/lib/db';
import { authorizeResponse, getUserFromRequest } from '@/lib/auth';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const createSchema = z.object({
  name: z.string().trim().min(2).max(120),
  category: z.string().trim().max(60).default('General'),
  description: z.string().trim().max(1200).default(''),
  meeting_schedule: z.string().trim().max(240).default(''),
  contact_email: z.string().trim().max(254).refine(v => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)),
  website_url: z.string().trim().max(500).refine(v => !v || /^https?:\/\/\S+$/i.test(v)),
});

export async function GET(request: Request) {
  try {
    const denied = authorizeResponse(await getUserFromRequest(request));
    if (denied) return denied;
    await ensureDatabase();
    const result = await getPool().query(`
      SELECT c.id,c.name,c.category,c.description,c.meeting_schedule,c.contact_email,c.website_url,
        c.status,c.created_at,c.owner_user_id,COALESCE(owner.name,'Unassigned') AS lead_name,
        COUNT(DISTINCT m.id)::int AS member_count,
        COUNT(DISTINCT t.id)::int AS task_count,
        COUNT(DISTINCT t.id) FILTER(WHERE t.status='Completed')::int AS completed_count,
        COUNT(DISTINCT o.id) FILTER(WHERE o.status='Open')::int AS open_roles
      FROM clubs c
      LEFT JOIN users owner ON owner.id=c.owner_user_id
      LEFT JOIN members m ON m.club_id=c.id AND m.active=TRUE
      LEFT JOIN tasks t ON t.club_id=c.id
      LEFT JOIN recruitment_openings o ON o.club_id=c.id
      GROUP BY c.id,owner.name
      ORDER BY c.name
    `);
    return NextResponse.json({ clubs: result.rows, count: result.rowCount }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[clubs] Failed to load clubs:', error);
    return NextResponse.json({ error: 'Could not load clubs right now.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    const denied = authorizeResponse(user, ['admin', 'lead']);
    if (denied) return denied;
    if (!isSameOriginRequest(request)) return NextResponse.json({ error: 'Cross-origin requests are not accepted.' }, { status: 403 });
    const body = await request.json().catch(() => null);
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid club profile.' }, { status: 400 });
    await ensureDatabase();
    const result = await getPool().query(
      `INSERT INTO clubs(name,category,description,meeting_schedule,contact_email,website_url,owner_user_id)
       VALUES($1,$2,$3,$4,$5,$6,$7)
       RETURNING id,name,category,description,meeting_schedule,contact_email,website_url,status,created_at,owner_user_id`,
      [parsed.data.name, parsed.data.category || 'General', parsed.data.description, parsed.data.meeting_schedule,
       parsed.data.contact_email, parsed.data.website_url, user?.role === 'lead' ? user.id : null],
    );
    return NextResponse.json({ club: result.rows[0] }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('duplicate key')) return NextResponse.json({ error: 'A club with this name already exists.' }, { status: 409 });
    console.error('[clubs] Failed to create club:', error);
    return NextResponse.json({ error: 'Could not create the club. Please retry.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
