import { createHash, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { ensureDatabase, getPool } from '@/lib/db';

export type AppRole = 'admin' | 'lead' | 'member';
export type CurrentUser = { id: number; name: string; email: string; role: AppRole };
const COOKIE_NAME = 'clubpulse_session';
const SESSION_DAYS = 7;

function digest(token: string) { return createHash('sha256').update(token).digest('hex'); }
function parseCookieHeader(header: string | null, key: string): string | null {
  if (!header) return null;
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i > -1 && part.slice(0, i).trim() === key) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return null;
}
function cookieOptions(maxAge: number) {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
}
export function sessionCookie(token: string, maxAgeSeconds = SESSION_DAYS * 24 * 60 * 60) {
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
}
export function clearSessionCookie() { return cookieOptions(0); }

export async function createSession(userId: number) {
  await ensureDatabase();
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await getPool().query(
    'INSERT INTO sessions(user_id,token_hash,expires_at) VALUES($1,$2,$3)',
    [userId, digest(token), expiresAt],
  );
  return { token, expiresAt };
}
async function resolveToken(token: string | null): Promise<CurrentUser | null> {
  if (!token || token.length > 200) return null;
  await ensureDatabase();
  const result = await getPool().query(
    `SELECT u.id,u.name,u.email,u.role
     FROM sessions s JOIN users u ON u.id=s.user_id
     WHERE s.token_hash=$1 AND s.expires_at>NOW()
     LIMIT 1`,
    [digest(token)],
  );
  return (result.rows[0] as CurrentUser | undefined) ?? null;
}
export async function getUserFromRequest(request: Request): Promise<CurrentUser | null> {
  return resolveToken(parseCookieHeader(request.headers.get('cookie'), COOKIE_NAME));
}
export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const jar = await cookies();
    return await resolveToken(jar.get(COOKIE_NAME)?.value ?? null);
  } catch { return null; }
}
export async function destroySessionFromRequest(request: Request) {
  const token = parseCookieHeader(request.headers.get('cookie'), COOKIE_NAME);
  if (!token) return;
  await ensureDatabase();
  await getPool().query('DELETE FROM sessions WHERE token_hash=$1', [digest(token)]);
}
export function authorizeResponse(user: CurrentUser | null, roles?: AppRole[]) {
  if (!user) return NextResponse.json({ error: 'Sign in required. Please log in and try again.' }, { status: 401 });
  if (roles && !roles.includes(user.role)) return NextResponse.json({ error: 'Your account role does not have permission for this action.' }, { status: 403 });
  return null;
}
export function roleLabel(role: AppRole) {
  return role === 'admin' ? 'Administrator' : role === 'lead' ? 'Club lead' : 'Member';
}
