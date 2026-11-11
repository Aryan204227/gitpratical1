import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { ensureDatabase, getPool } from '@/lib/db';
import { consumeRateLimit, requestClientAddress } from '@/lib/rate-limit';

const schema = z.object({
  token: z.string().min(10).max(200),
  newPassword: z
    .string()
    .min(12, 'Use at least 12 characters.')
    .max(128)
    .refine((v) => /[A-Za-z]/.test(v), 'Include at least one letter.')
    .refine((v) => /[0-9]/.test(v), 'Include at least one number.'),
});

function digest(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export async function POST(request: Request) {
  try {
    const ip = requestClientAddress(request);
    const allowed = await consumeRateLimit('pwd-apply', ip, 5, 15 * 60);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again shortly.' },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid reset submission.' },
        { status: 400 }
      );
    }

    await ensureDatabase();
    const pool = getPool();
    const tokenHash = digest(parsed.data.token);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const resetRes = await client.query(
        `SELECT r.id, r.user_id, r.expires_at, r.used, u.email
         FROM password_resets r
         JOIN users u ON u.id = r.user_id
         WHERE r.token_hash = $1
         FOR UPDATE`,
        [tokenHash]
      );

      if (!resetRes.rowCount) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: 'Invalid or expired password reset link. Please request a new one.' },
          { status: 400 }
        );
      }

      const resetRow = resetRes.rows[0];
      if (resetRow.used || new Date(resetRow.expires_at).getTime() < Date.now()) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: 'This password reset link has expired or has already been used.' },
          { status: 400 }
        );
      }

      const salt = await bcrypt.genSalt(12);
      const hash = await bcrypt.hash(parsed.data.newPassword, salt);

      // Update password
      await client.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, resetRow.user_id]);

      // Mark reset token as used
      await client.query('UPDATE password_resets SET used = TRUE WHERE id = $1', [resetRow.id]);

      // Revoke all existing sessions for this user for security
      await client.query('DELETE FROM sessions WHERE user_id = $1', [resetRow.user_id]);

      await client.query('COMMIT');

      return NextResponse.json({
        ok: true,
        message: 'Password successfully updated. You may now sign in with your new password.',
      });
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Password reset failure:', error);
    return NextResponse.json(
      { error: 'Could not reset password. Please try again.' },
      { status: 500 }
    );
  }
}
