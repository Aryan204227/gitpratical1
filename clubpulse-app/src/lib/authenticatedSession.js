import { connectMongoose, db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/session";

// Firebase claims identify the account; MongoDB remains the source of app role and profile data.
export async function getAuthenticatedUserSession(request) {
  const claims = await getSessionFromRequest(request);
  if (!claims) return null;

  const firebaseUid = claims.uid || claims.sub;
  if (!firebaseUid) return null;

  await connectMongoose();
  const user = await db.getUserByFirebaseUid(firebaseUid);
  if (!user) return null;

  return {
    userId: String(user._id || user.id),
    role: user.role,
    email: user.email,
    user,
    claims,
  };
}
