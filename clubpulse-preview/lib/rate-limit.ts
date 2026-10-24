import { createHash } from 'node:crypto';
import { ensureDatabase, getPool } from '@/lib/db';
export function requestClientAddress(request: Request): string {
  const direct=request.headers.get('x-real-ip')?.trim();
  if(direct)return direct.slice(0,128);
  return (request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown').slice(0,128);
}
/** Shared fixed-window rate limiter. Only hashed identifiers are stored. */
export async function consumeRateLimit(scope:string,identity:string,maxAttempts:number,windowSeconds:number):Promise<boolean>{
  await ensureDatabase();
  const key=createHash('sha256').update(scope+String.fromCharCode(0)+identity.trim().toLowerCase()).digest('hex');
  const sql=[
    'INSERT INTO auth_rate_limits(bucket_key,attempts,window_started_at) VALUES($1,1,NOW())',
    'ON CONFLICT(bucket_key) DO UPDATE SET',
    "attempts=CASE WHEN auth_rate_limits.window_started_at<=NOW()-($2::int*INTERVAL '1 second') THEN 1 ELSE auth_rate_limits.attempts+1 END,",
    "window_started_at=CASE WHEN auth_rate_limits.window_started_at<=NOW()-($2::int*INTERVAL '1 second') THEN NOW() ELSE auth_rate_limits.window_started_at END",
    'RETURNING attempts'
  ].join(' ');
  const result=await getPool().query(sql,[key,windowSeconds]);
  return Number(result.rows[0]?.attempts??(maxAttempts+1))<=maxAttempts;
}
