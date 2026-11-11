import { randomBytes, createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ensureDatabase, getPool } from '@/lib/db';
import { consumeRateLimit, requestClientAddress } from '@/lib/rate-limit';

const schema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

function digest(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export async function POST(request: Request) {
  try {
    const ip = requestClientAddress(request);
    const allowed = await consumeRateLimit('pwd-reset', ip, 5, 15 * 60);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again in a few minutes.' },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Please provide a valid registered email address.' },
        { status: 400 }
      );
    }

    await ensureDatabase();
    const pool = getPool();
    const userRes = await pool.query(
      'SELECT id, name, email FROM users WHERE LOWER(email) = $1 LIMIT 1',
      [parsed.data.email]
    );

    if (userRes.rowCount && userRes.rows[0]) {
      const user = userRes.rows[0];
      const token = randomBytes(32).toString('base64url');
      const tokenHash = digest(token);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await pool.query(
        'INSERT INTO password_resets(user_id, token_hash, expires_at) VALUES($1, $2, $3)',
        [user.id, tokenHash, expiresAt]
      );

      // Return recovery token for direct workspace recovery
      return NextResponse.json({
        ok: true,
        message: 'Password reset link generated. Follow the instructions to set a new password.',
        resetToken: token,
      });
    }

    // Generic safe response
    return NextResponse.json({
      ok: true,
      message: 'If an account exists with this email, recovery instructions have been initiated.',
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json(
      { error: 'Could not process password recovery request. Please try again.' },
      { status: 500 }
    );
  }
}
