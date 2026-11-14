import Link from 'next/link';
import {
  Activity, ArrowRight, BarChart3, CheckCircle2, ClipboardList, Flame, Ghost,
  HeartPulse, MessageSquareText, PauseCircle, Shield, ShieldAlert, Target, Users,
  Workflow, CheckSquare, Calendar, Sparkles, Clock3, AlertTriangle, UserCheck
} from 'lucide-react';
import { getDashboardSnapshot, getMemberDashboard, getLeadDashboard } from '@/lib/read-model';
import { getCurrentUser } from '@/lib/auth';
import { NextPageHeading, NextPanel, NextStatus, NextEmpty } from '@/components/NextPrimitives';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const role = user?.role || 'member';

  if (role === 'member') {
    const mData = await getMemberDashboard(user?.id ?? 0);
    return (
      <div className="next-page-stack">
        <NextPageHeading
          eyebrow="STUDENT WORKSPACE"
          title={<>Welcome back, <em>{user?.name}!</em></>}
          description="Your personal workspace — assignments, contribution history, club memberships and open applications."
          action={<span className="next-live-pill"><i />ACTIVE CONTRIBUTOR</span>}
        />

        <div className="next-metric-grid">
          <article className="next-metric-card">
            <div className="next-metric-label">Open Tasks <span><ClipboardList size={17} /></span></div>
            <strong>{mData.openTasks}</strong>
            <small>{mData.completedTasks} completed of {mData.totalTasks}</small>
          </article>
          <article className="next-metric-card">
            <div className="next-metric-label">Contribution Points <span><Sparkles size={17} /></span></div>
            <strong>{mData.totalPoints}</strong>
            <small>Earned from verified completed tasks</small>
          </article>
          <article className="next-metric-card">
            <div className="next-metric-label">My Club <span><Users size={17} /></span></div>
            <strong>{mData.member?.club || '—'}</strong>
            <small>{mData.member?.role || 'Not yet assigned'}</small>
          </article>
          <article className="next-metric-card">
            <div className="next-metric-label">Applications <span><Calendar size={17} /></span></div>
            <strong>{mData.applications?.length ?? 0}</strong>
            <small>
              {mData.applications?.some((a: any) => a.status === 'Reviewing')
                ? 'Under active review'
                : mData.applications?.length
                  ? 'Submitted to clubs'
                  : 'No active applications'}
            </small>
          </article>
        </div>

        <div className="next-two-col">
          <NextPanel
            title="My Assigned Tasks"
            description="Tasks assigned to your account. Update your progress as you work."
            action={<Link href="/tasks" className="next-inline-link">All tasks <ArrowRight size={13} /></Link>}
          >
            {mData.tasks.length === 0 ? (
              <NextEmpty
                title="No tasks assigned yet"
                description="You are currently unblocked. Check with your club lead or browse open recruitment opportunities."
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {mData.tasks.slice(0, 6).map((t: any) => (
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
                        Priority: {t.priority} · Due: {t.due_date || 'No deadline'} · {t.club}
                      </div>
                    </div>
                    <NextStatus status={t.status} />
                  </article>
                ))}
              </div>
            )}
          </NextPanel>

          <NextPanel
            title="Contribution Timeline"
            description="Verified records of your completed tasks and earned points."
          >
            {mData.events.length === 0 ? (
              <NextEmpty
                title="No recorded events yet"
                description="Events appear here automatically when tasks you complete are verified."
              />
            ) : (
              <div className="next-process-list">
                {mData.events.map((e: any) => (
                  <div key={e.id}>
                    <span><CheckCircle2 size={14} /></span>
                    <p>
                      <b>{e.task || e.event_type.replaceAll('_', ' ').toUpperCase()}</b>
                      <small>+{e.points} pts · {new Date(e.created_at).toLocaleDateString()}</small>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </NextPanel>
        </div>

        {(mData.applications?.length ?? 0) > 0 && (
          <NextPanel
            title="My Applications"
            description="Recruitment applications you have submitted."
            action={<Link href="/recruitment" className="next-inline-link">Browse openings <ArrowRight size={13} /></Link>}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {mData.applications.map((a: any) => (
                <div
                  key={a.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.7rem 1rem',
                    background: 'rgba(21,44,59,0.35)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '7px',
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#e4f8ff' }}>{a.opening}</span>
                  <NextStatus status={a.status} />
                </div>
              ))}
            </div>
          </NextPanel>
        )}

        <div className="next-module-cards">
          <Link href="/clubs">
            <Users size={19} />
            <span><b>Browse Clubs</b><small>Explore clubs and open positions</small></span>
            <ArrowRight size={15} />
          </Link>
          <Link href="/feedback">
            <MessageSquareText size={19} />
            <span><b>Submit Feedback</b><small>Share feedback or submit weekly mood check-in</small></span>
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    );
  }

  // CLUB LEAD DASHBOARD
  if (role === 'lead') {
    const lData = await getLeadDashboard(user?.id ?? 0);
    return (
      <div className="next-page-stack">
        <NextPageHeading
          eyebrow="CLUB LEAD OPERATIONS"
          title={<>Operational Hub — <em>{lData.clubName}</em></>}
          description="Manage team assignments, identify overloaded members, review submitted work and keep deliverables on track."
          action={<span className="next-live-pill"><i />CLUB LEAD ACTIVE</span>}
        />

        <div className="next-metric-grid">
          <article className="next-metric-card">
            <div className="next-metric-label">My Assignments <span><ClipboardList size={17} /></span></div>
            <strong>{lData.myOpenTasks}</strong>
            <small>{lData.myCompletedTasks} completed tasks</small>
          </article>
          <article className="next-metric-card">
            <div className="next-metric-label">Team Members <span><Users size={17} /></span></div>
            <strong>{lData.teamMembers.length}</strong>
            <small>Active club contributors</small>
          </article>
          <article className="next-metric-card">
            <div className="next-metric-label">Awaiting Assignment <span><Clock3 size={17} /></span></div>
            <strong className={lData.unassignedTasks.length > 0 ? 'text-cp-amber' : ''}>{lData.unassignedTasks.length}</strong>
            <small>{lData.overdueTasks.length} overdue tasks</small>
          </article>
          <article className="next-metric-card">
            <div className="next-metric-label">Applicant Pipeline <span><Target size={17} /></span></div>
            <strong>{lData.applicationsToReview.length}</strong>
            <small>Candidates awaiting review</small>
          </article>
        </div>

        <div className="next-hero-actions" style={{ marginBottom: '1rem', display: 'flex', gap: '10px' }}>
          <Link href="/tasks" className="next-primary-btn">Assign &amp; Manage Tasks <ArrowRight size={15} /></Link>
          <Link href="/recruitment" className="next-secondary-btn">Review Candidates <Target size={15} /></Link>
          <Link href="/fairwork" className="next-secondary-btn">FairWork Rebalance <Flame size={15} /></Link>
        </div>

        <div className="next-two-col">
          <NextPanel
            title="Operational Task Queue"
            description="Tasks in progress, awaiting assignment, or needing immediate attention."
            action={<Link href="/tasks" className="next-inline-link">Open task board <ArrowRight size={13} /></Link>}
          >
            {lData.unassignedTasks.length === 0 && lData.overdueTasks.length === 0 && lData.inProgressTasks.length === 0 ? (
              <NextEmpty
                title="All tasks on track"
                description="No unassigned or overdue tasks found in your operational queue."
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {lData.overdueTasks.map((t: any) => (
                  <article
                    key={`overdue-${t.id}`}
                    style={{
                      background: 'rgba(242, 160, 188, 0.08)',
                      border: '1px solid rgba(242, 160, 188, 0.25)',
                      borderRadius: '8px',
                      padding: '0.75rem 1rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: '#f2a0bc', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase' }}>OVERDUE</span>
                        <Link href={`/tasks/${t.id}`} style={{ color: '#f3f4fc', fontWeight: 600, fontSize: '0.88rem' }}>{t.title}</Link>
                      </div>
                      <small style={{ color: '#9b9db9', fontSize: '0.78rem' }}>Owner: {t.owner} · Due: {t.due_date}</small>
                    </div>
                    <NextStatus status="High" />
                  </article>
                ))}
                {lData.unassignedTasks.map((t: any) => (
                  <article
                    key={`unassigned-${t.id}`}
                    style={{
                      background: 'rgba(255, 203, 122, 0.08)',
                      border: '1px solid rgba(255, 203, 122, 0.25)',
                      borderRadius: '8px',
                      padding: '0.75rem 1rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: '#ffcb7a', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase' }}>UNASSIGNED</span>
                        <Link href={`/tasks/${t.id}`} style={{ color: '#f3f4fc', fontWeight: 600, fontSize: '0.88rem' }}>{t.title}</Link>
                      </div>
                      <small style={{ color: '#9b9db9', fontSize: '0.78rem' }}>Priority: {t.priority} · Due: {t.due_date || 'No deadline'}</small>
                    </div>
                    <Link href="/tasks" className="next-inline-link" style={{ fontSize: '0.78rem' }}>Assign →</Link>
                  </article>
                ))}
                {lData.inProgressTasks.slice(0, 4).map((t: any) => (
                  <article
                    key={`inprogress-${t.id}`}
                    style={{
                      background: 'rgba(21, 44, 59, 0.4)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      padding: '0.75rem 1rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <Link href={`/tasks/${t.id}`} style={{ color: '#e4f8ff', fontWeight: 600, fontSize: '0.88rem' }}>{t.title}</Link>
                      <div style={{ color: '#9b9db9', fontSize: '0.78rem', marginTop: '0.15rem' }}>Owner: {t.owner} · Due: {t.due_date || 'No deadline'}</div>
                    </div>
                    <NextStatus status="In progress" />
                  </article>
                ))}
              </div>
            )}
          </NextPanel>

          <NextPanel
            title="Team Workload &amp; Capacity"
            description="Active members and their current task concentration."
            action={<Link href="/fairwork" className="next-inline-link">Workload analysis <ArrowRight size={13} /></Link>}
          >
            {lData.teamMembers.length === 0 ? (
              <NextEmpty
                title="No members listed"
                description="Members assigned to your club will appear here with live task loads."
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {lData.teamMembers.map((m: any) => (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem',
                      background: 'rgba(32, 33, 57, 0.5)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                      <span className="next-avatar small">{m.name.slice(0, 1).toUpperCase()}</span>
                      <div>
                        <strong style={{ fontSize: '0.85rem' }}>{m.name}</strong>
                        <div style={{ fontSize: '0.75rem', color: '#9b9db9' }}>
                          {m.on_break ? 'On approved break' : `${m.committed_hours || 4}h weekly · ${m.role}`}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: m.open_tasks > 4 ? '#ff9a5c' : '#f3f4fc' }}>
                        {m.open_tasks} {m.open_tasks === 1 ? 'task' : 'tasks'}
                      </span>
                      {m.on_break && <NextStatus status="Inactive" />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </NextPanel>
        </div>

        <div className="next-module-cards">
          <Link href="/tasks">
            <CheckSquare size={19} />
            <span><b>Task Board</b><small>Create, assign, and update deliverables</small></span>
            <ArrowRight size={15} />
          </Link>
          <Link href="/fairwork">
            <Flame size={19} />
            <span><b>FairWork Rebalancer</b><small>Redistribute overloaded assignments</small></span>
            <ArrowRight size={15} />
          </Link>
          <Link href="/recruitment">
            <Target size={19} />
            <span><b>Recruitment</b><small>Review applicants and onboard new talent</small></span>
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    );
  }

  // CLUB ADMIN DASHBOARD (Strategic club oversight & administration)
  const d = await getDashboardSnapshot();
  const total = Number(d.tasks.total) || 0;
  const completed = Number(d.tasks.completed) || 0;
  const pct = total ? Math.round((completed / total) * 100) : null;
  const stats = [
    { label: 'Active members', value: String(d.members), description: 'Verified member records', icon: Users },
    { label: 'Task completion', value: pct === null ? '—' : pct + '%', description: completed + ' completed of ' + total, icon: CheckCircle2 },
    { label: 'Open tasks', value: String(d.tasks.open), description: 'Needs ownership & tracking', icon: ClipboardList },
    { label: 'Applications to review', value: String(d.applications), description: 'Awaiting decision', icon: Target },
  ];
  const max = Math.max(1, ...d.trend.map((p) => Math.max(Number(p.assigned) || 0, Number(p.completed) || 0)));
  const maxWorkload = Math.max(1, ...d.workload.map((item: any) => Number(item.open_tasks) || 0));

  return (
    <div className="next-page-stack">
      <NextPageHeading
        eyebrow="CLUB ADMINISTRATOR WORKSPACE"
        title={<>Executive Overview — <em>{user?.name || 'Administrator'}</em></>}
        description="A live, server-rendered view of recruitment conversion, member participation recency, task completion and burnout alerts."
        action={<span className="next-live-pill"><i />POSTGRESQL · REAL DATA</span>}
      />
      <section className="next-hero next-hero-simple">
        <div className="next-hero-copy">
          <span className="next-eyebrow">CLUB CONTRIBUTION MANAGEMENT</span>
          <h2>Make club work <em>visible and shared.</em></h2>
          <p>Bring recruitment, task ownership and member feedback into one workspace. Use recorded activity to spot uneven workloads early and agree on practical handovers.</p>
          <div className="next-hero-actions">
            <Link href="/tasks" className="next-primary-btn">Review tasks <ArrowRight size={15}/></Link>
            <Link href="/fairwork" className="next-secondary-btn">Review FairWork <Flame size={15}/></Link>
          </div>
        </div>
        <div className="next-hero-summary" aria-label="Current workspace summary">
          <div><span>ACTIVE MEMBERS</span><strong>{d.members}</strong></div>
          <div><span>OPEN TASKS</span><strong>{d.tasks.open}</strong></div>
          <div><span>WORKLOAD GINI</span><strong>{Math.round(d.workloadGini * 100)}<small>/100</small></strong></div>
        </div>
      </section>

      <div className="next-metric-grid">
        {stats.map((s) => (
          <article className="next-metric-card" key={s.label}>
            <div className="next-metric-label">{s.label}<span><s.icon size={17} /></span></div>
            <strong>{s.value}</strong>
            <small>{s.description}</small>
          </article>
        ))}
      </div>

      <div className="next-two-col next-pulse-panels">
        <NextPanel title="Ghost Radar (Inactivity Signal)" description="A supportive recency signal based on 21-day activity decay. Explicit breaks are excluded.">
          <div className="next-pulse-counts">
            <span className="pulse-count active"><b>{d.pulseCounts.active}</b><small>Active</small></span>
            <span className="pulse-count drifting"><b>{d.pulseCounts.drifting}</b><small>Drifting</small></span>
            <span className="pulse-count ghost"><b>{d.pulseCounts.ghost}</b><small>Ghost</small></span>
            <span className="pulse-count on-break"><b>{d.pulseCounts.onBreak}</b><small>On break</small></span>
          </div>
          <div className="next-pulse-list">
            {d.memberSignals.filter((member) => member.status !== 'Active').slice(0, 6).map((member) => (
              <article className={`next-pulse-member ${member.status === 'Ghost' ? 'is-ghost' : member.status === 'Drifting' ? 'is-drifting' : 'is-break'}`} key={member.id}>
                <span className="next-pulse-avatar">{member.status === 'On Break' ? <PauseCircle size={15} /> : member.status === 'Ghost' ? <Ghost size={15} /> : <Activity size={15} />}</span>
                <div className="next-pulse-member-main">
                  <strong>{member.name}</strong>
                  <small>{member.status === 'On Break' ? `On break · returns ${member.returnDate || 'date not set'}` : member.daysSinceContribution < 0 ? 'No activity recorded' : member.daysSinceContribution === 0 ? 'Contributed today' : `${member.daysSinceContribution} days since contribution`}</small>
                </div>
                <span className="next-pulse-score"><b>{member.pulseScore}</b><small>PULSE</small></span>
              </article>
            ))}
            {!d.memberSignals.some((member) => member.status !== 'Active') && (
              <NextEmpty title="All members have an active pulse" description="No member currently requires an inactivity follow-up." />
            )}
          </div>
          <p className="next-pulse-footnote">Pulse uses recorded contribution points with a 14-day half-life, normalized to declared weekly hours. Supportive intervention, not surveillance.</p>
        </NextPanel>

        <NextPanel title="Burnout Watch &amp; Lead Overload" description="Detect work concentration, overdue tasks and excessive task volume before club leads burn out." action={<Link href="/fairwork" className="next-inline-link">FairWork Engine <ArrowRight size={13} /></Link>}>
          <div className={`next-concentration-banner ${d.topTwoShare >= 60 ? 'is-alert' : ''}`}>
            <span><HeartPulse size={18} /></span>
            <div>
              <small>TOP TWO OWNERS CARRY</small>
              <strong>{d.topTwoShare}% <em>of all open tasks</em></strong>
              <p>{d.topTwoShare >= 60 ? 'Workload concentration exceeds the 60% threshold. Recommend redistributing tasks to available members.' : 'Workload is distributed within acceptable balance thresholds.'}</p>
            </div>
          </div>
          <div className="next-concentration-stats">
            <span><small>Workload Gini</small><b>{Math.round(d.workloadGini * 100)}<i>/100</i></b></span>
            <span><small>Open tasks</small><b>{Number(d.tasks.open) || 0}</b></span>
            <span><small>Overdue tasks</small><b className="ember-value">{d.memberSignals.reduce((sum, member) => sum + member.overdueTasks, 0)}</b></span>
          </div>
          <div className="next-risk-list">
            {d.memberSignals.filter((member) => member.status !== 'On Break' && (member.role.toLowerCase().includes('lead') || (member.burnoutScore !== null && member.burnoutScore >= 35))).sort((a, b) => (b.burnoutScore || 0) - (a.burnoutScore || 0)).slice(0, 4).map((member) => (
              <article className="next-risk-row" key={member.id}>
                <span className={`next-risk-indicator ${member.burnoutLevel === 'At Risk' ? 'risk-hot' : member.burnoutLevel === 'Watch' ? 'risk-watch' : 'risk-calm'}`}><Flame size={14} /></span>
                <div>
                  <strong>{member.name}<small>{member.role === 'Lead' ? 'LEAD' : 'CONTRIBUTOR'}</small></strong>
                  <p>{member.openTasks} open · {member.overdueTasks} overdue · {member.urgentTasks} urgent</p>
                </div>
                <span className={`next-risk-pill ${member.burnoutLevel === 'At Risk' ? 'risk-hot' : member.burnoutLevel === 'Watch' ? 'risk-watch' : 'risk-calm'}`}>{member.burnoutLevel === 'At Risk' ? 'AT RISK' : member.burnoutLevel === 'Watch' ? 'WATCH' : 'HEALTHY'} · {member.burnoutScore ?? '—'}</span>
              </article>
            ))}
            {!d.memberSignals.some((member) => member.status !== 'On Break' && (member.role.toLowerCase().includes('lead') || (member.burnoutScore !== null && member.burnoutScore >= 35))) && (
              <NextEmpty title="No high-risk load pattern" description="Workload across club leaders and members is currently balanced." />
            )}
          </div>
          <p className="next-pulse-footnote"><ShieldAlert size={13} /> Risk is a planning signal to protect volunteer sustainability.</p>
        </NextPanel>
      </div>

      <div className="next-two-col">
        <NextPanel title="Contribution Pulse" description="Weekly task assignment and completion history">
          <div className="next-chart">
            <div className="next-chart-grid"><i /><i /><i /><i /></div>
            <div className="next-chart-bars">
              {d.trend.map((point, index) => {
                const assigned = Number(point.assigned) || 0;
                const done = Number(point.completed) || 0;
                return (
                  <div key={point.week + index} className="next-chart-day">
                    <div className="next-bar-pair">
                      <span className="assigned" style={{ height: Math.max(3, (assigned / max) * 100) + '%' }} title={assigned + ' assigned events'} />
                      <span className="completed" style={{ height: Math.max(3, (done / max) * 100) + '%' }} title={done + ' completed events'} />
                    </div>
                    <small>{point.week}</small>
                  </div>
                );
              })}
              {!d.trend.length && <div className="next-no-trend">Complete tasks to populate weekly contribution velocity.</div>}
            </div>
          </div>
          <div className="next-chart-legend">
            <span><i />Assigned</span>
            <span><i />Completed</span>
            <small>Stored database contribution events</small>
          </div>
        </NextPanel>

        <NextPanel title="Club Health Overview" description="Task completion velocity across university clubs" action={<Link href="/clubs" className="next-inline-link">All clubs <ArrowRight size={13} /></Link>}>
          <div className="next-health-list">
            {d.clubs.map((c: any) => (
              <div key={c.id} className="next-health-row">
                <span className="next-club-mark">{c.name.slice(0, 1)}</span>
                <div className="next-health-main">
                  <div>
                    <strong>{c.name}</strong>
                    <span>{c.task_count ? Math.round((c.completed_count / c.task_count) * 100) + '%' : '—'}</span>
                  </div>
                  <div className="next-progress"><i style={{ width: (c.task_count ? Math.round((c.completed_count / c.task_count) * 100) : 0) + '%' }} /></div>
                  <small>{c.member_count} members · {c.task_count} tasks</small>
                </div>
              </div>
            ))}
            {!d.clubs.length && <NextEmpty title="No clubs yet" description="Create a club profile to start tracking participation." />}
          </div>
        </NextPanel>
      </div>

      <NextPanel title="Workload Visibility" description="Open tasks by owner, identifying overloaded volunteers. Use this pattern to offer support." action={<Link href="/fairwork" className="next-inline-link">Rebalance tasks <ArrowRight size={13} /></Link>}>
        <div className="next-workload-list">
          {d.workload.map((w: any) => {
            const open = Number(w.open_tasks) || 0;
            const width = Math.round((open / maxWorkload) * 100);
            return (
              <article className="next-workload-item" key={w.owner}>
                <div className="next-workload-head">
                  <div className="next-workload-person">
                    <span className="next-avatar">{String(w.owner).slice(0, 1).toUpperCase()}</span>
                    <span>
                      <strong>{w.owner}</strong>
                      <small>{w.priority_tasks} high-priority {Number(w.priority_tasks) === 1 ? 'task' : 'tasks'} · {w.nearest_due ? 'Next due ' + w.nearest_due : 'No upcoming due date'}</small>
                    </span>
                  </div>
                  <span className="next-workload-count"><b>{open}</b><small>open</small></span>
                </div>
                <div className="next-progress"><i style={{ width: width + '%' }} /></div>
              </article>
            );
          })}
          {!d.workload.length && <NextEmpty title="No open tasks" description="Create tasks to monitor team workload." />}
        </div>
      </NextPanel>

      <div className="next-module-cards">
        <Link href="/clubs"><Users size={19} /><span><b>Clubs &amp; Members</b><small>Directory, member history, and leadership</small></span><ArrowRight size={15} /></Link>
        <Link href="/tasks"><ClipboardList size={19} /><span><b>Tasks &amp; Board</b><small>Assign work, track deadlines, record completion</small></span><ArrowRight size={15} /></Link>
        <Link href="/analytics"><BarChart3 size={19} /><span><b>Insights &amp; FairWork</b><small>Burnout risk, Gini index, and feedback trends</small></span><ArrowRight size={15} /></Link>
      </div>
    </div>
  );
}
