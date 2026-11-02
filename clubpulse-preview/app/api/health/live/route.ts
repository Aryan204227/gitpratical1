import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Process liveness only. Use /api/health for the database/integrity check. */
export async function GET() {
  return NextResponse.json(
    {
      application: 'ClubPulse',
      status: 'ok',
      runtime: 'nodejs',
      timestamp: new Date().toISOString(),
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
