'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CheckCircle2, UserPlus } from 'lucide-react';

type ClubOption = { id: number; name: string };

export function AddMemberForm({ clubs }: { clubs: ClubOption[] }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [clubId, setClubId] = useState(String(clubs[0]?.id ?? ''));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/members', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), clubId: Number(clubId) }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof result.error === 'string' ? result.error : 'Could not add this student.');

      setMessage(`${result.member?.name || name} has been added to the club roster. Ask the student to register with ${result.member?.email || email} so their account connects to this membership.`);
      setName('');
      setEmail('');
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not add this student. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  if (clubs.length === 0) {
    return (
      <div className="next-empty">
        <UserPlus size={20} />
        <strong>Create your club first</strong>
        <p>Once a club profile exists, you can add students to its team.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div style={{ border: '1px solid var(--n-line)', borderRadius: 10, padding: 14, background: 'var(--n-panel2)' }}>
        <strong style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>How student access works</strong>
        <p style={{ margin: 0, color: 'var(--n-muted)', fontSize: 12, lineHeight: 1.7 }}>
          1. Add the student here using their college email. 2. The student opens Register and creates their own password with that same email. 3. Their club and assigned tasks appear after they sign in. This form never creates or sets a student's password.
        </p>
      </div>

      <form onSubmit={submit} className="next-form" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', alignItems: 'end' }}>
        <label style={{ fontSize: 12 }}>
          Student full name
          <input
            value={name}
            onChange={event => setName(event.target.value)}
            required
            minLength={2}
            maxLength={100}
            autoComplete="name"
            placeholder="e.g. Rahul Sharma"
            style={{ fontSize: 13, padding: 12 }}
          />
        </label>
        <label style={{ fontSize: 12 }}>
          College email address
          <input
            type="email"
            value={email}
            onChange={event => setEmail(event.target.value)}
            required
            maxLength={254}
            autoComplete="email"
            placeholder="rahul@university.edu"
            style={{ fontSize: 13, padding: 12 }}
          />
        </label>
        <label style={{ fontSize: 12 }}>
          Add to club
          <select value={clubId} onChange={event => setClubId(event.target.value)} required style={{ fontSize: 13, padding: 12 }}>
            {clubs.map(club => <option key={club.id} value={club.id}>{club.name}</option>)}
          </select>
        </label>
        <button type="submit" className="next-primary-btn" disabled={busy || !clubId} style={{ gridColumn: '1 / -1', justifySelf: 'start', minHeight: 42, fontSize: 12 }}>
          <UserPlus size={15} /> {busy ? 'Adding student…' : 'Add student to club'}
        </button>
      </form>

      {error && <p className="next-notice error" role="alert">{error}</p>}
      {message && <p className="next-notice success" role="status"><CheckCircle2 size={15} />{message}</p>}
      <p style={{ margin: 0, color: 'var(--n-muted)', fontSize: 11, lineHeight: 1.65 }}>
        Already registered students can be added with the email on their account. A student email can have one primary club membership in this version.
      </p>
    </div>
  );
}
