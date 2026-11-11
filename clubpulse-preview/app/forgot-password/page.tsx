'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, CheckCircle2, KeyRound, ShieldAlert } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState<'request' | 'reset' | 'success'>('request');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    setBusy(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to request password reset.');

      if (data.resetToken) {
        setResetToken(data.resetToken);
        setStep('reset');
        setMessage('Recovery token generated for your workspace account.');
      } else {
        setMessage(data.message || 'If an account exists with this email, recovery steps have been started.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed.');
    } finally {
      setBusy(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    setBusy(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password.');

      setStep('success');
      setMessage(data.message || 'Password successfully updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="next-auth-layout">
      <section className="next-auth-story">
        <Link href="/" className="next-brand">
          <span className="next-brand-mark">✳</span>
          <span>ClubPulse<small>RECOVERY & SECURITY</small></span>
        </Link>
        <div className="next-story-copy">
          <span className="next-eyebrow">ACCOUNT RECOVERY</span>
          <h1>Regain access.<br /><em>Protect your club.</em></h1>
          <p>Secure password recovery with server-side token hashes and automatic session invalidation to keep your club workspace safe.</p>
        </div>
      </section>

      <section className="next-auth-panel">
        <div className="next-auth-card">
          <span className="next-eyebrow">CREDENTIAL MANAGEMENT</span>
          <h2>{step === 'request' ? 'Reset password' : step === 'reset' ? 'Choose new password' : 'Password updated'}</h2>
          <p>
            {step === 'request'
              ? 'Enter your registered email address to initiate password recovery.'
              : step === 'reset'
              ? 'Provide a strong password with at least 12 characters.'
              : 'Your password has been securely reset. You can now log in.'}
          </p>

          {error && <div className="next-error" role="alert"><ShieldAlert size={16} /> {error}</div>}
          {message && !error && <div className="next-notice" role="status"><CheckCircle2 size={16} /> {message}</div>}

          {step === 'request' && (
            <form onSubmit={handleRequest} className="next-form">
              <label>
                Email address
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </label>
              <button className="next-primary-btn" type="submit" disabled={busy}>
                {busy ? 'Verifying…' : 'Generate recovery link'} <ArrowRight size={16} />
              </button>
            </form>
          )}

          {step === 'reset' && (
            <form onSubmit={handleReset} className="next-form">
              <label>
                Recovery Token
                <input
                  type="text"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  required
                />
              </label>
              <label>
                New Password
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 12 characters with letters and numbers"
                  minLength={12}
                  maxLength={128}
                  required
                />
                <small className="cp-password-hint">Must include letters and numbers.</small>
              </label>
              <button className="next-primary-btn" type="submit" disabled={busy}>
                {busy ? 'Updating password…' : 'Update password'} <KeyRound size={16} />
              </button>
            </form>
          )}

          {step === 'success' && (
            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Link href="/login" className="next-primary-btn">
                Sign in with new password <ArrowRight size={16} />
              </Link>
            </div>
          )}

          <div className="next-auth-switch">
            <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <ArrowLeft size={14} /> Back to sign in
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
