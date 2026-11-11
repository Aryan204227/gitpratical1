import { ensureDatabase, getPool } from '@/lib/db';
import { giniCoefficient, burnoutRisk, pulseScoreFromDecay } from '@/lib/scoring.mjs';

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
    openTasks: number;
    priorityTasks: number;
    overdueTasks: number;
    burnoutScore: number | null;
    burnoutLevel: string;
  }>;
  availableMembers: Array<{
    name: string;
    role: string;
    openTasks: number;
    committedHours: number;
    pulseScore: number;
  }>;
  recommendations: FairWorkRecommendation[];
};

function computeMedian(sorted: number[]): number {
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 !== 0) {
    return sorted[mid];
  }
  return Math.round(((sorted[mid - 1] + sorted[mid]) / 2) * 10) / 10;
}

export async function getFairWorkAnalysis(): Promise<FairWorkAnalysis> {
  await ensureDatabase();
  const pool = getPool();

  const [membersRes, tasksRes] = await Promise.all([
    pool.query(`
      SELECT m.id, m.name, m.role, m.active, m.on_break, m.committed_hours, m.last_break_at, m.created_at,
        COUNT(DISTINCT t.id) FILTER (WHERE t.status NOT IN ('Completed', 'Blocked'))::int AS open_tasks,
        COUNT(DISTINCT t.id) FILTER (WHERE t.status NOT IN ('Completed', 'Blocked') AND t.priority IN ('High', 'Urgent'))::int AS priority_tasks,
        COUNT(DISTINCT t.id) FILTER (WHERE t.status NOT IN ('Completed', 'Blocked') AND t.due_date < CURRENT_DATE)::int AS overdue_tasks,
        COALESCE(SUM(ce.points), 0)::numeric AS recent_points
      FROM members m
      LEFT JOIN tasks t ON LOWER(BTRIM(t.owner)) = LOWER(BTRIM(m.name))
      LEFT JOIN contribution_events ce ON LOWER(BTRIM(ce.member_name)) = LOWER(BTRIM(m.name)) AND ce.created_at >= NOW() - INTERVAL '30 days'
      WHERE m.active = TRUE
      GROUP BY m.id, m.name, m.role, m.active, m.on_break, m.committed_hours, m.last_break_at, m.created_at
      ORDER BY open_tasks DESC, m.name ASC
    `),
    pool.query(`
      SELECT t.id, t.title, t.owner, t.priority, t.status, t.due_date, COALESCE(c.name, 'General') AS club
      FROM tasks t
      LEFT JOIN clubs c ON c.id = t.club_id
      WHERE t.status NOT IN ('Completed', 'Blocked')
      ORDER BY CASE WHEN t.priority = 'Urgent' THEN 1 WHEN t.priority = 'High' THEN 2 ELSE 3 END, t.due_date NULLS LAST
    `),
  ]);

  const members = membersRes.rows;
  const openTasks = tasksRes.rows;

  const loads = members.map((m: any) => Number(m.open_tasks) || 0).sort((a: number, b: number) => a - b);
  const totalOpen = openTasks.length;
  const count = members.length;
  const averageLoad = count > 0 ? Math.round((totalOpen / count) * 10) / 10 : 0;
  const medianLoad = computeMedian(loads);
  const giniScore = giniCoefficient(loads);

  const overloadedMembers: FairWorkAnalysis['overloadedMembers'] = [];
  const availableMembers: FairWorkAnalysis['availableMembers'] = [];
  const now = Date.now();

  for (const m of members) {
    const open = Number(m.open_tasks) || 0;
    const priority = Number(m.priority_tasks) || 0;
    const overdue = Number(m.overdue_tasks) || 0;
    const onBreak = Boolean(m.on_break);

    if (onBreak) continue;

    // Calculate days without break based on actual member record
    const breakRefDate = m.last_break_at ? new Date(m.last_break_at).getTime() : new Date(m.created_at || now).getTime();
    const daysWithoutBreak = Math.max(0, Math.floor((now - breakRefDate) / 86_400_000));

    // Calculate real pulse score from actual 30-day recorded points
    const committed = Number(m.committed_hours) || 4;
    const realPulse = pulseScoreFromDecay(Number(m.recent_points) || 0, committed);

    const risk = burnoutRisk({
      openTasks: open,
      medianOpenTasks: medianLoad || 1,
      overdueRatio: open > 0 ? overdue / open : 0,
      weeklyLoadChange: 0,
      daysWithoutBreak: Math.min(daysWithoutBreak, 60),
      moodTrend: null,
    });

    if (open > medianLoad + 1 || open >= 4 || (open >= 3 && priority >= 2)) {
      overloadedMembers.push({
        name: m.name,
        role: m.role,
        openTasks: open,
        priorityTasks: priority,
        overdueTasks: overdue,
        burnoutScore: risk.score,
        burnoutLevel: risk.level,
      });
    } else if (open <= Math.max(1, Math.floor(medianLoad))) {
      availableMembers.push({
        name: m.name,
        role: m.role,
        openTasks: open,
        committedHours: committed,
        pulseScore: realPulse,
      });
    }
  }

  const recommendations: FairWorkRecommendation[] = [];

  for (const over of overloadedMembers) {
    const candidateTasks = openTasks.filter(
      (t: any) => String(t.owner).trim().toLowerCase() === over.name.trim().toLowerCase()
    );
    const candidateTask = candidateTasks.length > 0 ? candidateTasks[candidateTasks.length - 1] : null;

    const bestAssignee = availableMembers
      .filter((av) => av.name.toLowerCase() !== over.name.toLowerCase())
      .sort((a, b) => a.openTasks - b.openTasks || b.committedHours - a.committedHours)[0] || null;

    if (candidateTask && bestAssignee) {
      recommendations.push({
        overloadedMember: over.name,
        overloadedRole: over.role,
        currentOpenTasks: over.openTasks,
        priorityTasks: over.priorityTasks,
        burnoutLevel: over.burnoutLevel,
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
        reason: `${over.name} currently holds ${over.openTasks} active tasks (${over.priorityTasks} high-priority) while workspace median is ${medianLoad}. Rebalancing "${candidateTask.title}" to ${bestAssignee.name} (${bestAssignee.openTasks} open tasks) will balance workload.`,
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
