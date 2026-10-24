import { NextResponse } from 'next/server';
import { ensureDatabase, getPool } from '@/lib/db';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export async function GET() {
  try {
    // The one-time legacy demo cleanup runs inside ensureDatabase before this check.
    await ensureDatabase();
    const pool = getPool();
    const [clock, migration, synthetic] = await Promise.all([
      pool.query('SELECT NOW() AS database_time'),
      pool.query(
        'SELECT EXISTS (SELECT 1 FROM clubpulse_migrations WHERE id = $1) AS applied',
        ['remove-synthetic-demo-seed-v1'],
      ),
      pool.query(`
        SELECT (
          EXISTS(SELECT 1 FROM members WHERE LOWER(email) LIKE '%@clubpulse.invalid')
          OR EXISTS(SELECT 1 FROM recruitment_applications WHERE LOWER(email) LIKE '%@clubpulse.invalid')
          OR EXISTS(SELECT 1 FROM tasks WHERE title LIKE 'Demo task %'
            OR (title='Workshop planning' AND owner='Priya Sharma')
            OR (title='Website updates' AND owner='Rahul Kumar')
            OR (title='Event report' AND owner='Neha Mehta'))
          OR EXISTS(SELECT 1 FROM feedback_entries
            WHERE (topic='Event planning clarity' AND comment='More clarity on ownership would help.')
               OR (topic='Task distribution' AND comment='Task ownership felt balanced this month.'))
        ) AS known_synthetic_records_remaining
      `),
    ]);
    const demoCleanupApplied = Boolean(migration.rows[0]?.applied);
    const knownSyntheticRecordsRemain = Boolean(synthetic.rows[0]?.known_synthetic_records_remaining);
    return NextResponse.json({
      application: 'ClubPulse',
      status: 'ok',
      database: 'connected',
      storage: 'postgresql',
      googleSignInConfigured: Boolean(process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID),
      googleBrowserConfigured: Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID),
      dataIntegrity: {
        legacyDemoCleanup: demoCleanupApplied ? 'applied' : 'pending',
        knownSyntheticRecordsRemain,
      },
      databaseTime: clock.rows[0].database_time,
      timestamp: new Date().toISOString(),
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    // Keep raw driver/connection details in private deployment logs, not a public endpoint.
    console.error('[health] Database connection or integrity check failed:', error);
    return NextResponse.json({
      application: 'ClubPulse',
      status: 'degraded',
      database: 'disconnected',
      storage: 'postgresql',
      googleSignInConfigured: Boolean(process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID),
      googleBrowserConfigured: Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID),
      error: 'Database connection failed. Check service logs for details.',
      timestamp: new Date().toISOString(),
    }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
