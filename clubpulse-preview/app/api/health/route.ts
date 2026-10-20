import { NextResponse } from 'next/server';
import { ensureDatabase, getPool } from '@/lib/db';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export async function GET() {
  try {
    await ensureDatabase();
    const result = await getPool().query('SELECT NOW() AS database_time');
    return NextResponse.json({ application: 'ClubPulse', status: 'ok', database: 'connected', storage: 'postgresql', databaseTime: result.rows[0].database_time, timestamp: new Date().toISOString() }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Database connection failed.';
    return NextResponse.json({ application: 'ClubPulse', status: 'degraded', database: 'disconnected', storage: 'postgresql', error: message, timestamp: new Date().toISOString() }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
