'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CheckCircle2, UserPlus } from 'lucide-react';

type ClubOption = { id: number; name: string };

export function AddMemberForm({
  clubs,
  canAssignLead = false,
}: {
  clubs: ClubOption[];
  canAssignLead?: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [clubId, setClubId] = useState(String(clubs[0]?.id ?? ''));
  const [clubRole, setClubRole] = useState<'Member' | 'Lead'>('Member');
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
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          clubId: Number(clubId),
          clubRole: canAssignLead ? clubRole : 'Member',
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof result.error === 'string' ? result.error : 'Could not add this student.');

      const who = result.member?.name || name;
      const roleNote = clubRole === 'Lead' && canAssignLead
        ? ' This person is marked as a club lead. If they do not already have an account, ask them to register first, then set their account role to Club Lead in People & Roles.'
        : '';
      setMessage(result.accountLinked
        ? `${who} is already registered and has been added to the club roster. They can sign in now.${roleNote}`
        : `${who} has been added to the club roster. Ask the student to register at /register with ${result.member?.email || email}. Their club membership will connect when they sign in.${roleNote}`);
      setName('');
      setEmail('');
      setClubRole('Member');
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
          Add the student's college email here. They create their own password from Register with that same email. Their club and assigned tasks appear after sign-in. This form never creates a password.
        </p>
      </div>

      <form onSubmit={submit} className="next-form" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', alignItems: 'end' }}>
        <label>
          Student full name
          <input value={name} onChange={event => setName(event.target.value)} required minLength={2} maxLength={100} autoComplete="name" placeholder="e.g. Rahul Sharma"/>
        </label>
        <label>
          College email address
          <input type="email" value={email} onChange={event => setEmail(event.target.value)} required maxLength={254} autoComplete="email" placeholder="rahul@university.edu"/>
        </label>
        <label>
          Add to club
          <select value={clubId} onChange={event => setClubId(event.target.value)} required>
            {clubs.map(club => <option key={club.id} value={club.id}>{club.name}</option>)}
          </select>
        </label>
        {canAssignLead && (
          <label>
            Club role
            <select value={clubRole} onChange={event => setClubRole(event.target.value as 'Member' | 'Lead')}>
              <option value="Member">Member</option>
              <option value="Lead">Club Lead</option>
            </select>
          </label>
        )}
        <button type="submit" className="next-primary-btn" disabled={busy || !clubId} style={{ gridColumn: '1 / -1', justifySelf: 'start', minHeight: 42 }}>
          <UserPlus size={15}/> {busy ? 'Adding student…' : 'Add student to club'}
        </button>
      </form>

      {error && <p className="next-notice error" role="alert">{error}</p>}
      {message && <p className="next-notice success" role="status"><CheckCircle2 size={15}/>{message}</p>}
      <p style={{ margin: 0, color: 'var(--n-muted)', fontSize: 11, lineHeight: 1.65 }}>
        Already registered students can be added with the email on their account. Each student can have one primary club membership in this version.
      </p>
    </div>
  );
}
