import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { ensureDatabase, getPool } from '@/lib/db';
import { updateUserRoleAction } from '@/app/actions';
import { NextPageHeading, NextNotice, NextPanel, NextStatus, NextEmpty } from '@/components/NextPrimitives';
import { Shield, UserCog, Users } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string; error?: string }>;
}) {
  const actor = await getCurrentUser();
  if (!actor) redirect('/login');
  if (!['admin', 'superadmin'].includes(actor.role)) redirect('/dashboard?error=forbidden');

  await ensureDatabase();
  const [result, params] = await Promise.all([
    getPool().query(
      `SELECT id,name,email,role,created_at
       FROM users
       ORDER BY CASE role
         WHEN 'superadmin' THEN 0
         WHEN 'admin' THEN 1
         WHEN 'lead' THEN 2
         ELSE 3 END,
       LOWER(name)`,
    ),
    searchParams,
  ]);

  const errorMessages: Record<string, string> = {
    'invalid-role': 'Choose a valid role for this account.',
    self: 'You cannot change your own role while signed in.',
    'missing-user': 'This account could not be found.',
    'protected-user': 'This administrator account is protected.',
    'last-admin': 'At least one administrator account must remain.',
  };

  return (
    <div className="next-page-stack">
      <NextPageHeading
        eyebrow="ACCOUNT ACCESS"
        title={<>People & <em>roles.</em></>}
        description="Choose who can manage clubs and who uses ClubPulse as a student. Students create their own accounts; administrators only assign access levels."
        action={<span className="next-count-pill">{result.rowCount} accounts</span>}
      />

      {params.updated && <NextNotice tone="success">Account role updated and saved.</NextNotice>}
      {params.error && <NextNotice tone="error">{errorMessages[params.error] || 'The role could not be updated.'}</NextNotice>}

      <div className="next-role-help-grid">
        <article><span><Shield size={17}/></span><strong>Administrator</strong><p>Can manage every club, student and workspace setting.</p></article>
        <article><span><UserCog size={17}/></span><strong>Club Lead</strong><p>Can manage only clubs they own or are explicitly listed to lead.</p></article>
        <article><span><Users size={17}/></span><strong>Member</strong><p>Can browse clubs, apply for openings, update assigned tasks and send feedback.</p></article>
      </div>

      <NextPanel title="Registered accounts" description="Change a student's account role to Club Lead when they are responsible for a club. This does not create or reset their password.">
        {result.rows.length === 0 ? (
          <NextEmpty title="No accounts yet" description="Accounts will appear after users register."/>
        ) : (
          <div className="next-table-wrap">
            <table className="next-table">
              <thead><tr><th>Person</th><th>Current access</th><th>Change access</th><th>Joined</th></tr></thead>
              <tbody>
                {result.rows.map((person: any) => {
                  const protectedAccount = person.role === 'superadmin'
                    || person.id === actor.id
                    || (actor.role !== 'superadmin' && person.role === 'admin');
                  const choices = actor.role === 'superadmin'
                    ? ['member', 'lead', 'admin']
                    : ['member', 'lead'];
                  return (
                    <tr key={person.id}>
                      <td>
                        <div className="next-member-cell">
                          <span className="next-avatar">{String(person.name || person.email).slice(0, 1).toUpperCase()}</span>
                          <span><strong>{person.name}</strong><small>{person.email}</small></span>
                        </div>
                      </td>
                      <td><NextStatus status={person.role === 'superadmin' ? 'Super Admin' : person.role === 'admin' ? 'Administrator' : person.role === 'lead' ? 'Club Lead' : 'Member'}/></td>
                      <td>
                        {protectedAccount ? (
                          <span className="next-subtle">{person.id === actor.id ? 'Your signed-in account' : 'Protected account'}</span>
                        ) : (
                          <form action={updateUserRoleAction} className="next-role-change-form">
                            <input type="hidden" name="userId" value={person.id}/>
                            <select name="role" defaultValue={person.role} aria-label={`Access role for ${person.name}`}>
                              {choices.map(role => <option key={role} value={role}>{role === 'admin' ? 'Administrator' : role === 'lead' ? 'Club Lead' : 'Member'}</option>)}
                            </select>
                            <button type="submit" className="next-secondary-btn">Save</button>
                          </form>
                        )}
                      </td>
                      <td>{person.created_at ? new Date(person.created_at).toLocaleDateString() : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </NextPanel>

      <div className="next-notice info">
        <Shield size={16}/>
        <span><strong>Good practice:</strong> Give Club Lead access only to people who are responsible for a club. Adding someone to a club roster is separate from their account role. An email verification service is not configured yet, so use this prototype only with trusted college accounts.</span>
      </div>
    </div>
  );
}
