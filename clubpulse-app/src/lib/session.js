import {
  createSessionCookie as createFirebaseSessionCookie,
  verifyIdToken,
  verifySessionCookie as verifyFirebaseSessionCookie,
} from "@/lib/firebaseAdmin";

export const SESSION_COOKIE = "clubpulse_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 5;
const SESSION_TTL_MS = SESSION_TTL_SECONDS * 1000;

function createTokenError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

export async function createSessionFromIdToken(idToken) {
  if (!idToken || typeof idToken !== "string") {
    throw createTokenError("A Firebase ID token is required.", "auth/invalid-id-token");
  }

  const decoded = await verifyIdToken(idToken, true);
  const now = Math.floor(Date.now() / 1000);
  const authTime = Number(decoded?.auth_time);

  if (
    !(decoded?.uid || decoded?.sub) ||
    typeof decoded?.email !== "string" ||
    !decoded.email.trim() ||
    !Number.isFinite(authTime)
  ) {
    throw createTokenError("Firebase ID token is missing required claims.", "auth/invalid-id-token");
  }

  if (authTime > now || now - authTime > 5 * 60) {
    throw createTokenError("Please sign in again to start a new ClubPulse session.", "auth/recent-sign-in-required");
  }

  const sessionCookie = await createFirebaseSessionCookie(idToken, { expiresIn: SESSION_TTL_MS });
  return { decoded, sessionCookie };
}

function readCookie(request, cookieName) {
  const cookieHeader = request.headers.get("cookie") || "";
  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) continue;
    const name = part.slice(0, separator).trim();
    if (name === cookieName) return part.slice(separator + 1).trim();
  }
  return null;
}

export async function getSessionFromRequest(request) {
  const sessionCookie = readCookie(request, SESSION_COOKIE);
  if (!sessionCookie) return null;

  try {
    return await verifyFirebaseSessionCookie(sessionCookie, true);
  } catch {
    return null;
  }
}

export function setSessionCookie(response, sessionCookie) {
  response.cookies.set(SESSION_COOKIE, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return response;
}

export function clearSessionCookie(response) {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
  return response;
}
