import { redirect } from 'next/navigation';
import { ArrowRight, Flame, HeartPulse, Scale, ShieldAlert, Sparkles, UserCheck, Users, CheckCircle2 } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { getFairWorkAnalysis } from '@/lib/fairwork';
import { reassignTaskAction } from '@/app/actions';
import { NextPageHeading, NextPanel, NextEmpty, NextNotice, NextStatus } from '@/components/NextPrimitives';

export const dynamic = 'force-dynamic';

export default async function FairWorkPage({
  searchParams,
}: {
  searchParams: Promise<{ rebalanced?: string; error?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!['admin', 'superadmin', 'lead'].includes(user.role)) redirect('/dashboard?error=forbidden');

  const [analysis, params] = await Promise.all([getFairWorkAnalysis(user), searchParams]);

  return (
    <div className="next-page-stack">
      <NextPageHeading
        eyebrow="FAIRWORK WORKLOAD ENGINE"
        title={<>Share the work <em>fairly.</em></>}
        description="See which members have many open or overdue tasks. ClubPulse suggests a possible handover for the lead to review. These are workload signals, not health assessments."
        action={<span className="next-live-pill"><i />GINI {Math.round(analysis.giniScore * 100)} / 100</span>}
      />

      {params.rebalanced && (
        <NextNotice tone="success">
          Task ownership successfully rebalanced. Updated in database and recorded in event history.
        </NextNotice>
      )}
      {params.error && (
        <NextNotice tone="error">
          Rebalancing action failed validation or permissions ({params.error}).
        </NextNotice>
      )}

      <div className="next-metric-grid">
        <article className="next-metric-card">
          <div className="next-metric-label">Workload balance (Gini) <span><Scale size={17} /></span></div>
          <strong>{Math.round(analysis.giniScore * 100)}<i>/100</i></strong>
          <small>{analysis.giniScore <= 0.3 ? 'Work is distributed fairly' : analysis.giniScore <= 0.5 ? 'Some tasks are concentrated' : 'Work is unevenly shared'}</small>
        </article>
        <article className="next-metric-card">
          <div className="next-metric-label">Total Open Tasks <span><HeartPulse size={17} /></span></div>
          <strong>{analysis.totalOpenTasks}</strong>
          <small>Active & pending tasks</small>
        </article>
        <article className="next-metric-card">
          <div className="next-metric-label">Median open tasks <span><Users size={17} /></span></div>
          <strong>{analysis.medianLoad}</strong>
          <small>Avg: {analysis.averageLoad} tasks / member</small>
        </article>
        <article className="next-metric-card">
          <div className="next-metric-label">Members with high workload <span><Flame size={17} /></span></div>
          <strong className={analysis.overloadedMembers.length > 0 ? 'ember-value' : ''}>
            {analysis.overloadedMembers.length}
          </strong>
          <small>{analysis.overloadedMembers.length === 0 ? 'No high-workload flags' : 'Action recommended'}</small>
        </article>
      </div>

      <div className="next-two-col">
        <NextPanel
          title="Possible task handovers"
          description="Based on open tasks, deadlines and the available members in the same club. Review each suggestion before moving a task."
        >
          {analysis.recommendations.length === 0 ? (
            <NextEmpty
              title="Workload is currently balanced"
              description="No members exceed the concentration threshold. Check back as new assignments are created."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {analysis.recommendations.map((rec, i) => (
                <article
                  key={i}
                  style={{
                    background: 'var(--n-panel2)',
                    border: '1px solid var(--n-line)',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--cp-lime, #c6ff3d)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Sparkles size={14} /> POSSIBLE TASK HANDOVER
                    </span>
                    <span className={`next-risk-pill ${rec.burnoutLevel === 'At Risk' ? 'risk-hot' : 'risk-watch'}`}>
                      {rec.burnoutLevel.toUpperCase()}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--n-text)', lineHeight: 1.5 }}>
                    {rec.reason}
                  </p>
                  {rec.candidateTask && rec.suggestedAssignee && (
                    <form action={reassignTaskAction} style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <input type="hidden" name="taskId" value={rec.candidateTask.id} />
                      <input type="hidden" name="newOwner" value={rec.suggestedAssignee.name} />
                      <button type="submit" className="next-primary-btn" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                        Reassign "{rec.candidateTask.title}" to {rec.suggestedAssignee.name} <ArrowRight size={14} />
                      </button>
                    </form>
                  )}
                </article>
              ))}
            </div>
          )}
        </NextPanel>

        <NextPanel
          title="Members with high workloads"
          description="Members who have several active, urgent or overdue tasks."
        >
          {analysis.overloadedMembers.length === 0 ? (
            <NextEmpty
              title="No high workload flags"
              description="The current open-task counts do not cross the workload thresholds."
            />
          ) : (
            <div className="next-risk-list">
              {analysis.overloadedMembers.map((m) => (
                <article className="next-risk-row" key={m.name}>
                  <span className={`next-risk-indicator ${m.burnoutLevel === 'At Risk' ? 'risk-hot' : 'risk-watch'}`}>
                    <Flame size={14} />
                  </span>
                  <div>
                    <strong>{m.name} <small>{m.role.toUpperCase()}</small></strong>
                    <p>{m.openTasks} open · {m.priorityTasks} priority · {m.overdueTasks} overdue</p>
                  </div>
                  <span className={`next-risk-pill ${m.burnoutLevel === 'At Risk' ? 'risk-hot' : 'risk-watch'}`}>
                    {m.burnoutLevel.toUpperCase()} · {m.burnoutScore ?? '—'}
                  </span>
                </article>
              ))}
            </div>
          )}
        </NextPanel>
      </div>

      <NextPanel
        title="Members with capacity"
        description="Students with fewer open tasks who may be able to take another assignment."
      >
        {analysis.availableMembers.length === 0 ? (
          <NextEmpty
            title="No spare capacity found"
            description="Consider recruiting more students or wait for current tasks to finish."
          />
        ) : (
          <div className="next-table-wrap">
            <table className="next-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Role</th>
                  <th>Current Open Tasks</th>
                  <th>Committed Weekly Hours</th>
                  <th>Capacity Status</th>
                </tr>
              </thead>
              <tbody>
                {analysis.availableMembers.map((av) => (
                  <tr key={av.name}>
                    <td>
                      <div className="next-member-cell">
                        <span className="next-avatar">{av.name.slice(0, 1)}</span>
                        <strong>{av.name}</strong>
                      </div>
                    </td>
                    <td><NextStatus status={av.role} /></td>
                    <td><strong>{av.openTasks}</strong></td>
                    <td>{av.committedHours} hrs / week</td>
                    <td>
                      <span className="next-success-inline">
                        <CheckCircle2 size={14} /> May be able to help
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </NextPanel>
    </div>
  );
}
