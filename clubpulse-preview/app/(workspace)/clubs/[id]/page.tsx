import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, ArrowRight, BriefcaseBusiness, CheckCircle2, CheckSquare, Clock3, Users, Workflow } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { getClubWithDetails } from '@/lib/read-model';
import { NextPageHeading, NextPanel, NextStatus, NextEmpty } from '@/components/NextPrimitives';

export const dynamic = 'force-dynamic';

export default async function ClubDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [user, { id }] = await Promise.all([getCurrentUser(), params]);
  if (!user) redirect('/login');

  const clubId = Number(id);
  if (!Number.isInteger(clubId) || clubId < 1) notFound();

  const club = await getClubWithDetails(clubId);
  if (!club) notFound();

  const taskPct = club.task_count > 0 ? Math.round((club.completed_count / club.task_count) * 100) : null;

  return (
    <div className="next-page-stack">
      <Link href="/clubs" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--cp-lime, #c6ff3d)', textDecoration: 'none', fontSize: '0.85rem' }}>
        <ArrowLeft size={14} /> Back to clubs directory
      </Link>

      <NextPageHeading
        eyebrow={`CLUB PROFILE · ${club.category.toUpperCase()}`}
        title={club.name}
        description={`Created on ${new Date(club.created_at).toLocaleDateString()} · Active operations and contribution workspace.`}
        action={<NextStatus status={club.status} />}
      />

      <div className="next-metric-grid">
        <article className="next-metric-card">
          <div className="next-metric-label">Active Members <span><Users size={17} /></span></div>
          <strong>{club.member_count}</strong>
          <small>Rostered in {club.name}</small>
        </article>
        <article className="next-metric-card">
          <div className="next-metric-label">Tasks Total <span><CheckSquare size={17} /></span></div>
          <strong>{club.task_count}</strong>
          <small>{club.completed_count} marked completed</small>
        </article>
        <article className="next-metric-card">
          <div className="next-metric-label">Completion Rate <span><CheckCircle2 size={17} /></span></div>
          <strong>{taskPct === null ? '—' : `${taskPct}%`}</strong>
          <small>Based on saved records</small>
        </article>
        <article className="next-metric-card">
          <div className="next-metric-label">Recruitment Roles <span><BriefcaseBusiness size={17} /></span></div>
          <strong>{club.openings.length}</strong>
          <small>Open positions</small>
        </article>
      </div>

      <div className="next-two-col">
        <NextPanel
          title="Club Members"
          description={`Members registered with ${club.name}`}
          action={<Link href="/members" className="next-inline-link">All members <ArrowRight size={13} /></Link>}
        >
          {club.members.length === 0 ? (
            <NextEmpty
              title="No members yet"
              description="Onboard candidates through recruitment or assign existing members to this club."
            />
          ) : (
            <div className="next-table-wrap">
              <table className="next-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Role</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {club.members.map((m: any) => (
                    <tr key={m.id}>
                      <td>
                        <div className="next-member-cell">
                          <span className="next-avatar">{m.name.slice(0, 1)}</span>
                          <span><strong>{m.name}</strong><small>{m.email}</small></span>
                        </div>
                      </td>
                      <td><NextStatus status={m.role} /></td>
                      <td><NextStatus status={m.on_break ? 'On Break' : m.active ? 'Active' : 'Inactive'} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </NextPanel>

        <NextPanel
          title="Club Tasks"
          description="Tasks assigned within this club."
          action={<Link href="/tasks" className="next-inline-link">Manage tasks <ArrowRight size={13} /></Link>}
        >
          {club.tasks.length === 0 ? (
            <NextEmpty
              title="No tasks recorded"
              description="Create a task linked to this club to start tracking progress."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {club.tasks.map((t: any) => (
                <article
                  key={t.id}
                  style={{
                    background: 'rgba(21, 44, 59, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    padding: '0.85rem 1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <Link
                      href={`/tasks/${t.id}`}
                      style={{ color: '#e4f8ff', fontWeight: 600, textDecoration: 'none', fontSize: '0.92rem' }}
                    >
                      {t.title}
                    </Link>
                    <div style={{ fontSize: '0.8rem', color: 'rgba(228, 248, 255, 0.6)', marginTop: '0.2rem' }}>
                      Owner: {t.owner} · Due: {t.due_date || 'No date'}
                    </div>
                  </div>
                  <NextStatus status={t.status} />
                </article>
              ))}
            </div>
          )}
        </NextPanel>
      </div>

      <NextPanel
        title="Recruitment Openings"
        description="Active recruitment roles for this club."
        action={<Link href="/recruitment" className="next-inline-link">Recruitment portal <ArrowRight size={13} /></Link>}
      >
        {club.openings.length === 0 ? (
          <NextEmpty
            title="No open positions"
            description="Publish a new opening from the recruitment service to accept applications."
          />
        ) : (
          <div className="next-role-grid">
            {club.openings.map((o: any) => (
              <article className="next-role-card" key={o.id}>
                <div className="next-role-head">
                  <span className="next-role-icon"><BriefcaseBusiness size={18} /></span>
                  <NextStatus status={o.status} />
                </div>
                <h3>{o.title}</h3>
                <div className="next-role-foot">
                  <span><Users size={14} /> {o.applicant_count} applicants</span>
                  <small>Created {new Date(o.created_at).toLocaleDateString()}</small>
                </div>
              </article>
            ))}
          </div>
        )}
      </NextPanel>
    </div>
  );
}
