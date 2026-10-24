import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ensureDatabase, getPool } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { isSameOriginRequest } from '@/lib/request-origin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const pulseSchema = z.object({
  mood: z.number().int().min(1).max(5),
  clubId: z.number().int().positive().nullable().optional(),
});

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Sign in to submit a weekly pulse.' }, { status: 401 });
    await ensureDatabase();
    const pool = getPool();
    const [own, team] = await Promise.all([
      pool.query(`SELECT mood,created_at FROM mood_pulses WHERE user_id=$1 AND week_start=date_trunc('week',CURRENT_DATE)::date LIMIT 1`, [user.id]),
      pool.query(`SELECT COUNT(*)::int AS response_count,
        CASE WHEN COUNT(*)>=5 THEN ROUND(AVG(mood)::numeric,1) ELSE NULL END AS average
        FROM mood_pulses WHERE week_start=date_trunc('week',CURRENT_DATE)::date`),
    ]);
    const responseCount = Number(team.rows[0]?.response_count) || 0;
    return NextResponse.json({
      submitted: Boolean(own.rowCount),
      mood: own.rows[0]?.mood ?? null,
      submittedAt: own.rows[0]?.created_at ?? null,
      teamPulse: {
        available: responseCount >= 5,
        average: responseCount >= 5 ? Number(team.rows[0].average) : null,
        label: responseCount >= 5 ? 'Based on 5+ responses' : 'Team pulse appears after 5 responses',
      },
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Could not load the weekly pulse right now.' }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Sign in to submit a weekly pulse.' }, { status: 401 });
    if (!isSameOriginRequest(request)) return NextResponse.json({ error: 'Cross-origin requests are not accepted.' }, { status: 403 });
    await ensureDatabase();
    const body = await request.json().catch(() => null);
    const parsed = pulseSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Choose a mood from 1 to 5.' }, { status: 400 });
    if (parsed.data.clubId != null) {
      const club = await getPool().query('SELECT 1 FROM clubs WHERE id=$1', [parsed.data.clubId]);
      if (!club.rowCount) return NextResponse.json({ error: 'Selected club does not exist.' }, { status: 400 });
    }
    const saved = await getPool().query(`INSERT INTO mood_pulses(user_id,club_id,week_start,mood)
      VALUES($1,$2,date_trunc('week',CURRENT_DATE)::date,$3)
      ON CONFLICT(user_id,week_start) DO UPDATE SET club_id=EXCLUDED.club_id,mood=EXCLUDED.mood,created_at=NOW()
      RETURNING mood,created_at`, [user.id, parsed.data.clubId ?? null, parsed.data.mood]);
    return NextResponse.json({
      saved: true,
      mood: Number(saved.rows[0].mood),
      submittedAt: saved.rows[0].created_at,
      message: 'Weekly pulse saved. Your individual response is not shown to club leads.',
    }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Could not save your weekly pulse. Please try again.' }, { status: 503 });
  }
}
