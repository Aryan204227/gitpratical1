import test from 'node:test';
import assert from 'node:assert/strict';
import { canManageClubRecord } from '../lib/club-permissions.mjs';
import { filterClubDirectory } from '../lib/club-directory.mjs';

const clubs = [
  { id: 1, name: 'Tech Society', category: 'Technology', status: 'Active', description: 'Build projects', lead_name: 'Asha', member_count: 14, task_count: 20, completed_count: 10 },
  { id: 2, name: 'Design Guild', category: 'Design', status: 'Recruiting', description: 'Visual arts', lead_name: 'Ravi', member_count: 8, task_count: 5, completed_count: 4 },
  { id: 3, name: 'Old Robotics', category: 'Engineering', status: 'Archived', description: 'Robots', lead_name: 'Mira', member_count: 3, task_count: 10, completed_count: 10 },
];

test('club leads can manage only clubs they own or actively belong to', () => {
  assert.equal(canManageClubRecord({ id: 7, role: 'lead' }, { owner_user_id: 7 }), true);
  assert.equal(canManageClubRecord({ id: 7, role: 'lead' }, { owner_user_id: null, is_active_member: true }), true);
  assert.equal(canManageClubRecord({ id: 7, role: 'lead' }, { owner_user_id: 8, is_active_member: false }), false);
  assert.equal(canManageClubRecord({ id: 7, role: 'member' }, { owner_user_id: 7, is_active_member: true }), false);
});

test('administrators can manage clubs and anonymous users cannot', () => {
  assert.equal(canManageClubRecord({ id: 1, role: 'admin' }, { owner_user_id: 99 }), true);
  assert.equal(canManageClubRecord({ id: 1, role: 'superadmin' }, { owner_user_id: null }), true);
  assert.equal(canManageClubRecord(null, { owner_user_id: 1 }), false);
});

test('directory search matches club name, description and lead name', () => {
  assert.equal(filterClubDirectory(clubs, { query: 'asha' }).total, 1);
  assert.equal(filterClubDirectory(clubs, { query: 'visual' }).items[0].name, 'Design Guild');
});

test('current directory hides archived clubs unless requested', () => {
  assert.equal(filterClubDirectory(clubs).total, 2);
  assert.equal(filterClubDirectory(clubs, { status: 'all' }).total, 3);
  assert.equal(filterClubDirectory(clubs, { status: 'archived' }).items[0].id, 3);
});

test('directory filters category and status together', () => {
  const result = filterClubDirectory(clubs, { category: 'Design', status: 'recruiting' });
  assert.equal(result.total, 1);
  assert.equal(result.items[0].id, 2);
});

test('directory sorts by member count and paginates safely', () => {
  const sorted = filterClubDirectory(clubs, { status: 'all', sort: 'members', pageSize: 1, page: 2 });
  assert.equal(sorted.pageCount, 3);
  assert.equal(sorted.page, 2);
  assert.equal(sorted.items[0].id, 2);
  const clamped = filterClubDirectory(clubs, { page: 999, pageSize: 1 });
  assert.equal(clamped.page, 2);
});
