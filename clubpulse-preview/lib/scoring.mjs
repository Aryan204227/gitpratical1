const clamp = (value, min, max) => Math.max(min, Math.min(max, Number.isFinite(Number(value)) ? Number(value) : min));
const daysBetween = (from, to = Date.now()) => Math.max(0, (to - new Date(from).getTime()) / 86_400_000);

export function contributionPoints({ effortWeight = 1, onTime = true, reviewMultiplier = 1 } = {}) {
  const effort = clamp(effortWeight, 1, 5);
  const timeliness = onTime ? 1 : 0.6;
  const review = clamp(reviewMultiplier, 0.8, 1.2);
  return Math.round(effort * timeliness * review * 100) / 100;
}

/** Decay recorded contribution points with a 14-day half-life, then normalize against the member's declared weekly commitment. */
export function pulseScoreFromDecay(decayedPoints, committedHours = 4) {
  const expected = Math.max(1, clamp(committedHours, 1, 40));
  return Math.round(clamp((Math.max(0, Number(decayedPoints) || 0) / (expected * 1.25)) * 100, 0, 100));
}

export function decayedContributionPoints(events = [], now = Date.now(), halfLifeDays = 14) {
  const safeHalfLife = Math.max(1, Number(halfLifeDays) || 14);
  return events.reduce((total, event) => {
    const timestamp = new Date(event.createdAt ?? event.created_at ?? now).getTime();
    if (!Number.isFinite(timestamp)) return total;
    const points = Math.max(0, Number(event.points) || 0);
    return total + points * Math.pow(0.5, daysBetween(timestamp, now) / safeHalfLife);
  }, 0);
}

export function classifyMember({ pulseScore = 0, lastContributionAt = null, joinedAt = Date.now(), onBreak = false, now = Date.now() } = {}) {
  if (onBreak) return 'On Break';
  const ageSinceJoin = daysBetween(joinedAt, now);
  const daysSinceContribution = lastContributionAt ? daysBetween(lastContributionAt, now) : ageSinceJoin;
  if (Number(pulseScore) < 30 || daysSinceContribution >= 21) return 'Ghost';
  if (Number(pulseScore) < 60) return 'Drifting';
  return 'Active';
}

export function giniCoefficient(values = []) {
  const positive = values.map((value) => Math.max(0, Number(value) || 0)).sort((a, b) => a - b);
  const count = positive.length;
  if (!count || positive.every((value) => value === 0)) return 0;
  const sum = positive.reduce((total, value) => total + value, 0);
  const weighted = positive.reduce((total, value, index) => total + (index + 1) * value, 0);
  return Math.round(((2 * weighted) / (count * sum) - (count + 1) / count) * 1000) / 1000;
}

/** A supportive risk signal, not a medical diagnosis or a performance rating. */
export function burnoutRisk({ openTasks = 0, medianOpenTasks = 1, overdueRatio = 0, weeklyLoadChange = 0, daysWithoutBreak = 0, moodTrend = null } = {}) {
  const median = Math.max(1, Number(medianOpenTasks) || 1);
  const relativeLoad = clamp(((Math.max(0, Number(openTasks) || 0) / median) - 1) * 50, 0, 100);
  const overdue = clamp((Number(overdueRatio) || 0) * 100, 0, 100);
  const increasingLoad = clamp((Number(weeklyLoadChange) || 0) * 100, 0, 100);
  const breakStrain = clamp(((Number(daysWithoutBreak) || 0) / 21) * 100, 0, 100);
  const moodStrain = moodTrend == null ? 0 : clamp((3 - Number(moodTrend)) * 50, 0, 100);
  const score = Math.round(relativeLoad * 0.30 + overdue * 0.25 + increasingLoad * 0.20 + breakStrain * 0.15 + moodStrain * 0.10);
  const level = score >= 65 ? 'At Risk' : score >= 35 ? 'Watch' : 'Healthy';
  const actions = [];
  if (relativeLoad >= 35) actions.push('Offer a task handover and rebalance ownership.');
  if (overdue >= 35) actions.push('Review deadlines and remove blockers together.');
  if (breakStrain >= 65) actions.push('Encourage a break and agree a sustainable workload.');
  if (moodTrend != null && moodStrain >= 50) actions.push('Arrange a private, supportive check-in.');
  if (!actions.length) actions.push('Keep checking workload and make it easy to ask for help.');
  return { score, level, actions };
}
