import { ensureDatabase, getPool } from '@/lib/db';
import { burnoutRisk, classifyMember, pulseScoreFromDecay } from '@/lib/scoring.mjs';

/**
 * Member-safe dashboard read model.
 * A member receives only personally attributable task and contribution records.
 * Ownership fails closed when multiple accounts share the same display name.
 */
export async function getMemberDashboardSnapshot(user: { name: string; email: string }) {
  await ensureDatabase();
  const pool = getPool();
  const [profileResult, ownerIdentity] = await Promise.all([
    pool.query('SELECT id,name,role,active,on_break,committed_hours,created_at,last_break_at,return_date FROM members WHERE LOWER(email)=LOWER($1) LIMIT 1', [user.email]),
    pool.query('SELECT COUNT(*)::int AS count FROM users WHERE LOWER(BTRIM(name))=LOWER(BTRIM($1))', [user.name]),
  ]);
  const profile = profileResult.rows[0] ?? null;
  const ownerIsUnique = Number(ownerIdentity.rows[0]?.count) === 1;
  const ownerName = String(user.name || '').trim();

  const [taskStatsResult, eventSummaryResult, trendResult, workloadResult, clubsResult, applicationsResult] = await Promise.all([
    pool.query("SELECT COUNT(*)::int AS total, COUNT(*) FILTER(WHERE status='Completed')::int AS completed, COUNT(*) FILTER(WHERE status NOT IN ('Completed','Blocked'))::int AS open, COUNT(*) FILTER(WHERE status NOT IN ('Completed','Blocked') AND due_date<CURRENT_DATE)::int AS overdue, COUNT(*) FILTER(WHERE priority IN ('High','Urgent') AND status NOT IN ('Completed','Blocked'))::int AS urgent, COUNT(*) FILTER(WHERE created_at>=NOW()-INTERVAL '7 days')::int AS recent_tasks, COUNT(*) FILTER(WHERE created_at>=NOW()-INTERVAL '14 days' AND created_at<NOW()-INTERVAL '7 days')::int AS prior_tasks FROM tasks WHERE LOWER(BTRIM(owner))=LOWER(BTRIM($1)) AND $2::boolean=TRUE", [ownerName, ownerIsUnique]),
    pool.query("SELECT COALESCE(SUM(points * POWER(0.5,GREATEST(0,EXTRACT(EPOCH FROM (NOW()-created_at))/86400.0)/14.0)),0)::float AS decayed_points, MAX(created_at) FILTER(WHERE event_type IN ('task_completed','event_attended','mentoring')) AS last_contribution, COUNT(*) FILTER(WHERE event_type IN ('task_completed','event_attended','mentoring'))::int AS contribution_count FROM contribution_events WHERE LOWER(BTRIM(member_name))=LOWER(BTRIM($1)) AND $2::boolean=TRUE", [ownerName, ownerIsUnique]),
    pool.query("SELECT TO_CHAR(date_trunc('week',created_at),'Mon DD') AS week, COUNT(*) FILTER(WHERE event_type='task_assigned')::int AS assigned, COUNT(*) FILTER(WHERE event_type='task_completed')::int AS completed FROM contribution_events WHERE LOWER(BTRIM(member_name))=LOWER(BTRIM($1)) AND created_at>=NOW()-INTERVAL '8 weeks' AND $2::boolean=TRUE GROUP BY date_trunc('week',created_at) ORDER BY date_trunc('week',created_at)", [ownerName, ownerIsUnique]),
    pool.query("SELECT $1::text AS owner, COUNT(*) FILTER(WHERE status NOT IN ('Completed','Blocked'))::int AS open_tasks, COUNT(*) FILTER(WHERE priority IN ('High','Urgent') AND status NOT IN ('Completed','Blocked'))::int AS priority_tasks, TO_CHAR(MIN(due_date) FILTER(WHERE due_date>=CURRENT_DATE),'Mon DD') AS nearest_due FROM tasks WHERE LOWER(BTRIM(owner))=LOWER(BTRIM($1)) AND $2::boolean=TRUE HAVING COUNT(*) FILTER(WHERE status NOT IN ('Completed','Blocked'))>0", [ownerName, ownerIsUnique]),
    pool.query("SELECT c.id,c.name,c.category,c.status,COUNT(DISTINCT m.id)::int AS member_count,COUNT(DISTINCT t.id)::int AS task_count,COUNT(DISTINCT t.id) FILTER(WHERE t.status='Completed')::int AS completed_count FROM members self JOIN clubs c ON c.id=self.club_id LEFT JOIN members m ON m.club_id=c.id AND m.active=TRUE LEFT JOIN tasks t ON t.club_id=c.id WHERE self.id=$1 GROUP BY c.id ORDER BY c.name", [profile?.id ?? null]),
    pool.query("SELECT COUNT(*)::int AS total FROM recruitment_applications WHERE LOWER(email)=LOWER($1) AND status IN ('Applied','Reviewing')", [user.email]),
  ]);

  const taskStats = taskStatsResult.rows[0] ?? { total: 0, completed: 0, open: 0, overdue: 0, urgent: 0, recent_tasks: 0, prior_tasks: 0 };
  const eventSummary = eventSummaryResult.rows[0] ?? { decayed_points: 0, last_contribution: null, contribution_count: 0 };
  const openTasks = Number(taskStats.open) || 0;
  const overdueTasks = Number(taskStats.overdue) || 0;
  const recentTasks = Number(taskStats.recent_tasks) || 0;
  const priorTasks = Number(taskStats.prior_tasks) || 0;
  const weeklyLoadChange = priorTasks > 0 ? (recentTasks - priorTasks) / priorTasks : (recentTasks > 0 ? Math.min(1, recentTasks) : 0);
  const joinedAt = profile?.created_at ?? new Date();
  const now = Date.now();
  const committedHours = Number(profile?.committed_hours) || 4;
  const score = pulseScoreFromDecay(Number(eventSummary.decayed_points) || 0, committedHours);
  const status = classifyMember({ pulseScore: score, lastContributionAt: eventSummary.last_contribution, joinedAt, onBreak: Boolean(profile?.on_break), now });
  const daysWithoutBreak = profile?.last_break_at ? Math.max(0, (now - new Date(profile.last_break_at).getTime()) / 86400000) : Math.max(0, (now - new Date(joinedAt).getTime()) / 86400000);
  const risk = burnoutRisk({ openTasks, medianOpenTasks: Math.max(1, openTasks), overdueRatio: openTasks ? overdueTasks / openTasks : 0, weeklyLoadChange, daysWithoutBreak, moodTrend: null });
  const daysSinceContribution = eventSummary.last_contribution ? Math.floor((now - new Date(eventSummary.last_contribution).getTime()) / 86400000) : Math.floor((now - new Date(joinedAt).getTime()) / 86400000);
  const hasPersonalActivity = Boolean(profile) || Number(taskStats.total) > 0 || Number(eventSummary.contribution_count) > 0;
  const memberSignals = hasPersonalActivity ? [{
    id: Number(profile?.id) || 0,
    name: ownerName,
    role: String(profile?.role || 'Member'),
    active: profile ? Boolean(profile.active) : true,
    onBreak: Boolean(profile?.on_break),
    returnDate: profile?.return_date ? String(profile.return_date) : null,
    committedHours,
    pulseScore: score,
    status,
    contributionCount: Number(eventSummary.contribution_count) || 0,
    daysSinceContribution,
    openTasks,
    overdueTasks,
    urgentTasks: Number(taskStats.urgent) || 0,
    burnoutScore: status === 'On Break' ? null : risk.score,
    burnoutLevel: status === 'On Break' ? 'On break' : risk.level,
    burnoutActions: risk.actions,
  }] : [];

  return {
    clubs: clubsResult.rows,
    members: profile && profile.active ? 1 : 0,
    tasks: { total: Number(taskStats.total) || 0, completed: Number(taskStats.completed) || 0, open: openTasks },
    applications: Number(applicationsResult.rows[0]?.total) || 0,
    feedback: { total: 0, average: null },
    trend: trendResult.rows,
    workload: workloadResult.rows,
    memberSignals,
    pulseCounts: {
      active: memberSignals.filter((member) => member.status === 'Active').length,
      drifting: memberSignals.filter((member) => member.status === 'Drifting').length,
      ghost: memberSignals.filter((member) => member.status === 'Ghost').length,
      onBreak: memberSignals.filter((member) => member.status === 'On Break').length,
    },
    workloadGini: 0,
    topTwoShare: 0,
    selfProfileExists: Boolean(profile),
    selfProfileActive: Boolean(profile?.active),
  };
}
