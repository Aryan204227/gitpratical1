import { db } from "@/lib/db";

export async function canManageClub(session, clubId) {
  if (!session || !clubId) return false;
  if (session.role === "admin") return true;
  if (session.role !== "leader") return false;
  const club = await db.getClubById(String(clubId));
  return Boolean(club && String(club.presidentId) === String(session.userId));
}
