import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidIsoDate } from '../lib/task-validation.mjs';

test('accepts valid ISO calendar dates', () => {
  assert.equal(isValidIsoDate('2026-10-24'), true);
  assert.equal(isValidIsoDate('2024-02-29'), true);
  assert.equal(isValidIsoDate('2026-01-01'), true);
});

test('rejects malformed and impossible calendar dates', () => {
  assert.equal(isValidIsoDate(''), false);
  assert.equal(isValidIsoDate('24-10-2026'), false);
  assert.equal(isValidIsoDate('2026-2-04'), false);
  assert.equal(isValidIsoDate('2026-02-29'), false);
  assert.equal(isValidIsoDate('2026-02-31'), false);
  assert.equal(isValidIsoDate('2026-13-01'), false);
  assert.equal(isValidIsoDate('2026-00-10'), false);
  assert.equal(isValidIsoDate(null), false);
});
