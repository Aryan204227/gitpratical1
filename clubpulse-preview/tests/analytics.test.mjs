import test from 'node:test';
import assert from 'node:assert/strict';
import { completionRate, feedbackAverage, contributionPoints, isApplicationOpen } from '../lib/analytics.mjs';

test('completion rate reports a rounded percentage from persisted counts',()=>{
 assert.equal(completionRate(3,4),75);
 assert.equal(completionRate(2,3),67);
});
test('completion rate hides percentages when there are no tasks and clamps impossible counts',()=>{
 assert.equal(completionRate(0,0),null);
 assert.equal(completionRate(99,10),100);
 assert.equal(completionRate(-1,10),0);
});
test('feedback averages are hidden for small groups',()=>{
 assert.equal(feedbackAverage([5,4,4,5]),null);
 assert.equal(feedbackAverage([5,4,4,5,3]),4.2);
});
test('feedback averages discard invalid and non-rating input',()=>{
 assert.equal(feedbackAverage([5,4,0,6,'bad',3],3),4);
 assert.equal(feedbackAverage([5,4,3],3),4);
});
test('only a recorded task completion event contributes one point',()=>{
 assert.equal(contributionPoints('task_completed'),1);
 assert.equal(contributionPoints('task_assigned'),0);
 assert.equal(contributionPoints('membership_joined'),0);
});
test('opening status is treated as open only for open/review states',()=>{
 assert.equal(isApplicationOpen('Open'),true);
 assert.equal(isApplicationOpen('Review'),true);
 assert.equal(isApplicationOpen('Closed'),false);
});
