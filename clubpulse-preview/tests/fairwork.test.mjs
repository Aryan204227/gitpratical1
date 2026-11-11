import test from 'node:test';
import assert from 'node:assert/strict';
import {
  giniCoefficient,
  burnoutRisk,
  classifyMember,
  pulseScoreFromDecay,
  contributionPoints,
} from '../lib/scoring.mjs';

test('FairWork Gini coefficient evaluates workload inequality accurately', () => {
  // Equal load -> 0
  assert.equal(giniCoefficient([2, 2, 2, 2]), 0);
  // Extremely unequal load -> high Gini
  const concentratedGini = giniCoefficient([0, 0, 0, 10]);
  assert.ok(concentratedGini >= 0.7, `Expected Gini >= 0.7, got ${concentratedGini}`);
});

test('FairWork burnout risk flags high load, overdue ratio, and recommends rebalancing', () => {
  const highRisk = burnoutRisk({
    openTasks: 8,
    medianOpenTasks: 2,
    overdueRatio: 0.5,
    weeklyLoadChange: 0.4,
    daysWithoutBreak: 30,
  });
  assert.equal(highRisk.level, 'At Risk');
  assert.ok(highRisk.score >= 60);
  assert.ok(highRisk.actions.some((a) => a.includes('handover') || a.includes('rebalance')));

  const calm = burnoutRisk({
    openTasks: 1,
    medianOpenTasks: 2,
    overdueRatio: 0,
    weeklyLoadChange: 0,
    daysWithoutBreak: 5,
  });
  assert.equal(calm.level, 'Healthy');
  assert.ok(calm.score < 35);
});

test('Ghost member detector flags prolonged inactivity beyond 21 days regardless of points', () => {
  const now = Date.now();
  const twentyFiveDaysAgo = now - 25 * 86_400_000;
  const status = classifyMember({
    pulseScore: 85, // High previous points
    lastContributionAt: twentyFiveDaysAgo,
    now,
  });
  assert.equal(status, 'Ghost');
});

test('Ghost member detector respects explicit breaks', () => {
  const status = classifyMember({
    pulseScore: 10,
    lastContributionAt: Date.now() - 40 * 86_400_000,
    onBreak: true,
  });
  assert.equal(status, 'On Break');
});
