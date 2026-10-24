import test from 'node:test';
import assert from 'node:assert/strict';
import { contributionPoints, pulseScoreFromDecay, decayedContributionPoints, classifyMember, giniCoefficient, burnoutRisk } from '../lib/scoring.mjs';

const now = Date.parse('2026-10-24T12:00:00Z');

test('contribution points use effort, timeliness and bounded review multipliers', () => {
  assert.equal(contributionPoints({ effortWeight: 4, onTime: true, reviewMultiplier: 1.1 }), 4.4);
  assert.equal(contributionPoints({ effortWeight: 4, onTime: false, reviewMultiplier: 1 }), 2.4);
  assert.equal(contributionPoints({ effortWeight: 9, reviewMultiplier: 2 }), 6);
});

test('contribution decay uses a 14-day half-life', () => {
  assert.equal(decayedContributionPoints([{ points: 8, createdAt: now - 14 * 86400000 }], now), 4);
  assert.equal(decayedContributionPoints([{ points: 8, createdAt: now }], now), 8);
});

test('pulse score normalizes against committed weekly hours and stays within 0–100', () => {
  assert.equal(pulseScoreFromDecay(5, 4), 100);
  assert.equal(pulseScoreFromDecay(2.5, 4), 50);
  assert.equal(pulseScoreFromDecay(0, 4), 0);
});

test('member status respects breaks, pulse thresholds and 21-day inactivity', () => {
  assert.equal(classifyMember({ pulseScore: 90, joinedAt: now - 60 * 86400000, lastContributionAt: now - 2 * 86400000, now }), 'Active');
  assert.equal(classifyMember({ pulseScore: 45, joinedAt: now - 60 * 86400000, lastContributionAt: now - 2 * 86400000, now }), 'Drifting');
  assert.equal(classifyMember({ pulseScore: 80, joinedAt: now - 60 * 86400000, lastContributionAt: now - 22 * 86400000, now }), 'Ghost');
  assert.equal(classifyMember({ pulseScore: 0, joinedAt: now - 2 * 86400000, onBreak: true, now }), 'On Break');
});

test('Gini coefficient is zero for equal work and increases when load concentrates', () => {
  assert.equal(giniCoefficient([2, 2, 2, 2]), 0);
  assert.ok(giniCoefficient([0, 0, 0, 8]) > 0.7);
});

test('burnout risk flags high overdue workload and offers a humane next step', () => {
  const result = burnoutRisk({ openTasks: 6, medianOpenTasks: 1, overdueRatio: 0.8, weeklyLoadChange: 0.8, daysWithoutBreak: 30, moodTrend: 1.5 });
  assert.equal(result.level, 'At Risk');
  assert.ok(result.actions.some((action) => action.includes('handover') || action.includes('blockers')));
  assert.equal(burnoutRisk({ openTasks: 1, medianOpenTasks: 1 }).level, 'Healthy');
});
