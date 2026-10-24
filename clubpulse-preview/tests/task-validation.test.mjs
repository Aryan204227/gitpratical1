import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidIsoDate, parsePositiveId } from '../lib/task-validation.mjs';

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

test('accepts only positive safe club IDs', () => {
  assert.equal(parsePositiveId(7), 7);
  assert.equal(parsePositiveId('7'), 7);
  assert.equal(parsePositiveId(' 007 '), 7);
  assert.equal(parsePositiveId(1), 1);
  assert.equal(parsePositiveId(0), null);
  assert.equal(parsePositiveId(-1), null);
  assert.equal(parsePositiveId(''), null);
  assert.equal(parsePositiveId('1.5'), null);
  assert.equal(parsePositiveId('1e3'), null);
  assert.equal(parsePositiveId('1abc'), null);
  assert.equal(parsePositiveId(null), null);
  assert.equal(parsePositiveId(Number.MAX_SAFE_INTEGER + 1), null);
});
