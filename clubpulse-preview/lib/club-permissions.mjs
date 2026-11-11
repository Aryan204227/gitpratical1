export function canManageClubRecord(user, club) {
  if (!user || !club) return false;
  if (user.role === 'admin' || user.role === 'superadmin') return true;
  if (user.role !== 'lead') return false;
  return Number(club.owner_user_id) === Number(user.id) || club.is_active_member === true;
}
