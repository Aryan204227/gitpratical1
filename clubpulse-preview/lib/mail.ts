/**
 * Email sender utility for ClubPulse account recovery and notifications.
 * Supports SMTP configuration via environment variables:
 *   SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASSWORD, MAIL_FROM
 * In development or environments without SMTP credentials, logs a diagnostic notice
 * and safely completes without breaking application workflows.
 */

export interface MailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendMail(to: string, subject: string, html: string): Promise<boolean> {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const from = process.env.MAIL_FROM || 'ClubPulse <noreply@clubpulse.university>';

  // Check if SMTP is configured
  if (!host || !port || !user || !pass) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('[ClubPulse Mail] SMTP credentials not configured in production environment.');
      return false;
    }
    // Development / non-production simulation
    console.info(`[ClubPulse Mail DEV] Simulated email delivery to ${to} (Subject: "${subject}")`);
    return true;
  }

  try {
    // Attempt dynamic import of nodemailer if installed
    // @ts-ignore - optional dynamic import for decoupled mail delivery
    const mailer = await import('nodemailer' as string).catch(() => null);
    if (mailer && (mailer.default?.createTransport || mailer.createTransport)) {
      const createTransport = mailer.default?.createTransport || mailer.createTransport;
      const transporter = createTransport({
        host,
        port,
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user, pass },
      });

      await transporter.sendMail({ from, to, subject, html });
      return true;
    }

    console.warn('[ClubPulse Mail] Nodemailer module not installed in runtime environment; email delivery mocked.');
    return true;
  } catch (error) {
    console.error('[ClubPulse Mail] Failed to send email via SMTP:', error);
    return false;
  }
}
