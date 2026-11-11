import { randomBytes, createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ensureDatabase, getPool } from '@/lib/db';
import { consumeRateLimit, requestClientAddress } from '@/lib/rate-limit';
import { sendMail } from '@/lib/mail';

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

    let devToken: string | null = null;

    if (userRes.rowCount && userRes.rows[0]) {
      const user = userRes.rows[0];
      const token = randomBytes(32).toString('base64url');
      const tokenHash = digest(token);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      const insertRes = await pool.query(
        'INSERT INTO password_resets(user_id, token_hash, expires_at) VALUES($1, $2, $3) RETURNING id',
        [user.id, tokenHash, expiresAt]
      );
      const resetId = insertRes.rows[0]?.id;

      // Construct reset URL
      const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const resetUrl = `${appUrl}/forgot-password?token=${token}`;

      // Email notification
      const mailSent = await sendMail(
        user.email,
        'ClubPulse Account Recovery',
        `<div style="font-family:sans-serif;background:#0d0f1b;color:#f3f4fc;padding:24px;border-radius:12px;">
          <h2 style="color:#c6ff3d;">ClubPulse Account Recovery</h2>
          <p>Hello ${user.name || 'Member'},</p>
          <p>We received a request to reset your password. Use the link below to set a new password:</p>
          <p><a href="${resetUrl}" style="display:inline-block;background:#a097ff;color:#10111f;padding:10px 20px;border-radius:8px;font-weight:bold;text-decoration:none;">Reset Password</a></p>
          <p style="color:#9b9db9;font-size:12px;">This link will expire in 1 hour. If you did not request this, you can safely ignore this email.</p>
        </div>`
      );

      // In production, if email delivery fails, invalidate token
      if (!mailSent && process.env.NODE_ENV === 'production' && resetId) {
        await pool.query('UPDATE password_resets SET used = TRUE WHERE id = $1', [resetId]);
      }

      // Safe development fallback: expose token only when explicitly enabled for local dev
      if (process.env.NODE_ENV !== 'production' && process.env.ALLOW_DEV_PASSWORD_RESET_TOKEN === 'true') {
        devToken = token;
      }
    }

    // Generic outward-facing response for both existing and non-existing accounts
    if (devToken) {
      return NextResponse.json({
        ok: true,
        message: 'If an account exists for this email address, password-reset instructions will be sent.',
        devToken,
      });
    }

    return NextResponse.json({
      ok: true,
      message: 'If an account exists for this email address, password-reset instructions will be sent.',
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json(
      { error: 'Could not process password recovery request. Please try again.' },
      { status: 500 }
    );
  }
}
