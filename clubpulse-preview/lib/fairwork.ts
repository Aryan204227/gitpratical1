import { ensureDatabase, getPool } from '@/lib/db';
import { giniCoefficient, burnoutRisk, pulseScoreFromDecay } from '@/lib/scoring.mjs';

type FairWorkUser = { id: number; email: string; role: string };

export type FairWorkRecommendation = {
  overloadedMember: string;
  overloadedRole: string;
  currentOpenTasks: number;
  priorityTasks: number;
  burnoutLevel: string;
  candidateTask: { id: number; title: string; priority: string; club: string } | null;
  suggestedAssignee: { name: string; currentOpen: number; committedHours: number } | null;
  reason: string;
};

export type FairWorkAnalysis = {
  giniScore: number;
  totalOpenTasks: number;
  averageLoad: number;
  medianLoad: number;
  overloadedMembers: Array<{
    name: string;
    role: string;
    clubId: number | null;
    openTasks: number;
    priorityTasks: number;
    overdueTasks: number;
    burnoutScore: number | null;
    burnoutLevel: string;
  }>;
  availableMembers: Array<{
    name: string;
    role: string;
    clubId: number | null;
    openTasks: number;
    committedHours: number;
    pulseScore: number;
  }>;
  recommendations: FairWorkRecommendation[];
};

function computeMedian(sorted: number[]): number {
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 !== 0) return sorted[mid];
  return Math.round(((sorted[mid - 1] + sorted[mid]) / 2) * 10) / 10;
}

const emptyAnalysis = (): FairWorkAnalysis => ({
  giniScore: 0,
  totalOpenTasks: 0,
  averageLoad: 0,
  medianLoad: 0,
  overloadedMembers: [],
  availableMembers: [],
  recommendations: [],
});

export async function getFairWorkAnalysis(user: FairWorkUser): Promise<FairWorkAnalysis> {
  await ensureDatabase();
  const pool = getPool();

  // Leads see only the clubs they own or are listed to lead. Admins see the workspace.
  let clubIds: number[] | null = null;
  if (user.role === 'lead') {
    const accessible = await pool.query(
      `SELECT c.id
       FROM clubs c
       WHERE c.status <> 'Archived'
         AND (
           c.owner_user_id = $1
           OR EXISTS (
             SELECT 1
             FROM members lead_member
             WHERE lead_member.club_id = c.id
               AND lead_member.active = TRUE
               AND lead_member.role IN ('Lead', 'Club Lead')
               AND LOWER(BTRIM(lead_member.email)) = LOWER(BTRIM($2))
           )
         )
       ORDER BY c.id`,
      [user.id, user.email],
    );
    clubIds = accessible.rows
      .map((row: any) => Number(row.id))
      .filter((id: number) => Number.isInteger(id) && id > 0);
    if (clubIds.length === 0) return emptyAnalysis();
  }

  // Aggregate tasks and contribution events independently. Joining both raw tables
  // would multiply rows and inflate contribution totals.
  const [membersRes, tasksRes] = await Promise.all([
    pool.query(
      `WITH task_rollup AS (
         SELECT
           club_id,
           LOWER(BTRIM(owner)) AS owner_key,
           COUNT(*) FILTER (WHERE status NOT IN ('Completed', 'Blocked'))::int AS open_tasks,
           COUNT(*) FILTER (
             WHERE status NOT IN ('Completed', 'Blocked')
               AND priority IN ('High', 'Urgent')
           )::int AS priority_tasks,
           COUNT(*) FILTER (
             WHERE status NOT IN ('Completed', 'Blocked')
               AND due_date < CURRENT_DATE
           )::int AS overdue_tasks,
           COUNT(*) FILTER (
             WHERE created_at >= NOW() - INTERVAL '7 days'
           )::int AS recent_tasks,
           COUNT(*) FILTER (
             WHERE created_at >= NOW() - INTERVAL '14 days'
               AND created_at < NOW() - INTERVAL '7 days'
           )::int AS prior_tasks
         FROM tasks
         WHERE ($1::int[] IS NULL OR club_id = ANY($1::int[]))
         GROUP BY club_id, LOWER(BTRIM(owner))
       ),
       event_rollup AS (
         SELECT
           club_id,
           LOWER(BTRIM(member_name)) AS member_key,
           SUM(
             points * POWER(
               0.5,
               GREATEST(0, EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400.0) / 14.0
             )
           )::numeric AS decayed_points
         FROM contribution_events
         WHERE created_at >= NOW() - INTERVAL '30 days'
           AND event_type IN ('task_completed', 'event_attended', 'mentoring')
           AND ($1::int[] IS NULL OR club_id = ANY($1::int[]))
         GROUP BY club_id, LOWER(BTRIM(member_name))
       )
       SELECT
         m.id, m.name, m.role, m.club_id, m.active, m.on_break,
         m.committed_hours, m.last_break_at, m.created_at,
         COALESCE(t.open_tasks, 0)::int AS open_tasks,
         COALESCE(t.priority_tasks, 0)::int AS priority_tasks,
         COALESCE(t.overdue_tasks, 0)::int AS overdue_tasks,
         COALESCE(t.recent_tasks, 0)::int AS recent_tasks,
         COALESCE(t.prior_tasks, 0)::int AS prior_tasks,
         COALESCE(e.decayed_points, 0)::numeric AS recent_points
       FROM members m
       LEFT JOIN task_rollup t ON t.club_id = m.club_id AND t.owner_key = LOWER(BTRIM(m.name))
       LEFT JOIN event_rollup e ON e.club_id = m.club_id AND e.member_key = LOWER(BTRIM(m.name))
       WHERE m.active = TRUE
         AND ($1::int[] IS NULL OR m.club_id = ANY($1::int[]))
       ORDER BY COALESCE(t.open_tasks, 0) DESC, m.name ASC`,
      [clubIds],
    ),
    pool.query(
      `SELECT
         t.id, t.club_id, t.title, t.owner, t.priority, t.status, t.due_date,
         COALESCE(c.name, 'General') AS club
       FROM tasks t
       LEFT JOIN clubs c ON c.id = t.club_id
       WHERE t.status NOT IN ('Completed', 'Blocked')
         AND ($1::int[] IS NULL OR t.club_id = ANY($1::int[]))
       ORDER BY
         CASE WHEN t.priority = 'Urgent' THEN 1
              WHEN t.priority = 'High' THEN 2
              WHEN t.priority = 'Medium' THEN 3 ELSE 4 END,
         t.due_date NULLS LAST`,
      [clubIds],
    ),
  ]);

  const members = membersRes.rows;
  const openTasks = tasksRes.rows;
  const loads = members.map((member: any) => Number(member.open_tasks) || 0).sort((a: number, b: number) => a - b);
  const totalOpen = openTasks.length;
  const averageLoad = members.length > 0 ? Math.round((totalOpen / members.length) * 10) / 10 : 0;
  const medianLoad = computeMedian(loads);
  const giniScore = giniCoefficient(loads);

  const overloadedMembers: FairWorkAnalysis['overloadedMembers'] = [];
  const availableMembers: FairWorkAnalysis['availableMembers'] = [];
  const now = Date.now();

  for (const member of members) {
    const open = Number(member.open_tasks) || 0;
    const priority = Number(member.priority_tasks) || 0;
    const overdue = Number(member.overdue_tasks) || 0;
    if (Boolean(member.on_break)) continue;

    // A missing break record is unknown, so it must not be treated as evidence of overwork.
    const daysWithoutBreak = member.last_break_at
      ? Math.max(0, Math.floor((now - new Date(member.last_break_at).getTime()) / 86_400_000))
      : 0;
    const committed = Number(member.committed_hours) || 4;
    const recentTasks = Number(member.recent_tasks) || 0;
    const priorTasks = Number(member.prior_tasks) || 0;
    const weeklyLoadChange = priorTasks > 0
      ? (recentTasks - priorTasks) / priorTasks
      : recentTasks > 0 ? 1 : 0;

    const risk = burnoutRisk({
      openTasks: open,
      medianOpenTasks: medianLoad || 1,
      overdueRatio: open > 0 ? overdue / open : 0,
      weeklyLoadChange,
      daysWithoutBreak: Math.min(daysWithoutBreak, 60),
      // Individual mood is intentionally not read in this team-level analysis.
      moodTrend: null,
    });

    const clubId = member.club_id === null ? null : Number(member.club_id);
    if (open > medianLoad + 1 || open >= 4 || (open >= 3 && priority >= 2)) {
      overloadedMembers.push({
        name: String(member.name),
        role: String(member.role),
        clubId,
        openTasks: open,
        priorityTasks: priority,
        overdueTasks: overdue,
        burnoutScore: risk.score,
        burnoutLevel: risk.level,
      });
    } else if (open <= Math.max(1, Math.floor(medianLoad))) {
      availableMembers.push({
        name: String(member.name),
        role: String(member.role),
        clubId,
        openTasks: open,
        committedHours: committed,
        pulseScore: pulseScoreFromDecay(Number(member.recent_points) || 0, committed),
      });
    }
  }

  const recommendations: FairWorkRecommendation[] = [];
  for (const overloaded of overloadedMembers) {
    // Reassign only a task and a student from the same club.
    const candidateTasks = openTasks.filter((task: any) =>
      Number(task.club_id) === Number(overloaded.clubId)
      && String(task.owner).trim().toLowerCase() === overloaded.name.trim().toLowerCase()
    );
    const candidateTask = candidateTasks.length > 0 ? candidateTasks[candidateTasks.length - 1] : null;
    const bestAssignee = availableMembers
      .filter(member => member.clubId === overloaded.clubId && member.name.toLowerCase() !== overloaded.name.toLowerCase())
      .sort((a, b) => a.openTasks - b.openTasks || b.committedHours - a.committedHours)[0] || null;

    if (candidateTask && bestAssignee) {
      recommendations.push({
        overloadedMember: overloaded.name,
        overloadedRole: overloaded.role,
        currentOpenTasks: overloaded.openTasks,
        priorityTasks: overloaded.priorityTasks,
        burnoutLevel: overloaded.burnoutLevel,
        candidateTask: {
          id: Number(candidateTask.id),
          title: String(candidateTask.title),
          priority: String(candidateTask.priority),
          club: String(candidateTask.club),
        },
        suggestedAssignee: {
          name: bestAssignee.name,
          currentOpen: bestAssignee.openTasks,
          committedHours: bestAssignee.committedHours,
        },
        reason: `${overloaded.name} has ${overloaded.openTasks} open tasks, including ${overloaded.priorityTasks} high-priority tasks. ${bestAssignee.name} has ${bestAssignee.openTasks} open tasks in the same club. Review whether "${candidateTask.title}" can be handed over.`,
      });
    }
  }

  return {
    giniScore,
    totalOpenTasks: totalOpen,
    averageLoad,
    medianLoad,
    overloadedMembers,
    availableMembers,
    recommendations,
  };
}
