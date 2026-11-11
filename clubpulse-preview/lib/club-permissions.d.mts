export type ClubPermissionUser = { id: number; role: string };
export type ClubPermissionRecord = { owner_user_id?: number | string | null; is_active_member?: boolean | null };
export declare function canManageClubRecord(user: ClubPermissionUser | null, club: ClubPermissionRecord | null): boolean;
