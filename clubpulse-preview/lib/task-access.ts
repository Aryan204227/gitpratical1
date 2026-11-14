import { ensureDatabase, getPool } from '@/lib/db';
import { canManageClub } from '@/lib/club-access';
import type { CurrentUser } from '@/lib/auth';

export async function getTaskIfAccessible(taskId: number, user: CurrentUser) {
  await ensureDatabase();
  const result = await getPool().query(
    'SELECT id,club_id,owner,status FROM tasks WHERE id=$1 LIMIT 1',
    [taskId],
  );
  if (!result.rowCount) return null;
  const task = result.rows[0];

  if (user.role === 'admin' || user.role === 'superadmin') return task;
  if (user.role === 'lead' && await canManageClub(user, Number(task.club_id))) return task;

  const [accountMatch, rosterMatch] = await Promise.all([
    getPool().query(
      'SELECT COUNT(*)::int AS count FROM users WHERE LOWER(BTRIM(name))=LOWER(BTRIM($1))',
      [task.owner || ''],
    ),
    getPool().query(
      `SELECT 1 FROM members
       WHERE club_id=$1 AND active=TRUE
         AND LOWER(BTRIM(email))=LOWER(BTRIM($2))
         AND LOWER(BTRIM(name))=LOWER(BTRIM($3))
       LIMIT 1`,
      [task.club_id, user.email, task.owner || ''],
    ),
  ]);
  const ownsUniqueAccount = String(task.owner || '').trim().toLowerCase() === user.name.trim().toLowerCase()
    && Number(accountMatch.rows[0]?.count) === 1;
  if (!ownsUniqueAccount && !rosterMatch.rowCount) return null;
  return task;
}
