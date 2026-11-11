import { ensureDatabase, getPool } from '@/lib/db';
import type { CurrentUser } from '@/lib/auth';
import { canManageClubRecord } from '@/lib/club-permissions.mjs';

/**
 * Admins can manage all clubs. Leads can manage only clubs they own or
 * where their authenticated email has an active member record.
 * Members cannot edit club profiles.
 */
export async function canManageClub(user: CurrentUser | null, clubId: number): Promise<boolean> {
  if (!user || !Number.isInteger(clubId) || clubId < 1) return false;
  if (user.role === 'admin' || user.role === 'superadmin') return true;
  if (user.role !== 'lead') return false;

  await ensureDatabase();
  const result = await getPool().query(
    `SELECT
       c.owner_user_id,
       EXISTS (
         SELECT 1 FROM members m
         WHERE m.club_id = c.id
           AND m.active = TRUE
           AND LOWER(BTRIM(m.email)) = LOWER(BTRIM($2))
       ) AS is_active_member
     FROM clubs c
     WHERE c.id = $1`,
    [clubId, user.email],
  );
  return Boolean(result.rows[0] && canManageClubRecord(user, result.rows[0]));
}
