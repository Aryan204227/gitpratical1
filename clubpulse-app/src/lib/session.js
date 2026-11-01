import jwt from "jsonwebtoken";
import crypto from "node:crypto";

const SESSION_COOKIE = "clubpulse_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET || process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be configured with at least 32 characters.");
  }
  return secret;
}

export function createSessionToken(user) {
  return jwt.sign(
    { sub: String(user._id || user.id), role: user.role, email: user.email },
    getSessionSecret(),
    { algorithm: "HS256", expiresIn: SESSION_TTL_SECONDS, issuer: "clubpulse" }
  );
}

export function verifySessionToken(token) {
  if (!token) return null;
  try {
    const payload = jwt.verify(token, getSessionSecret(), { algorithms: ["HS256"], issuer: "clubpulse" });
    if (!payload?.sub) return null;
    return { userId: String(payload.sub), role: payload.role, email: payload.email };
  } catch {
    return null;
  }
}

export function setSessionCookie(response, user) {
  response.cookies.set(SESSION_COOKIE, createSessionToken(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return response;
}

export function getSessionFromRequest(request) {
  return verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
}

export function clearSessionCookie(response) {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}

// Verify Firebase ID tokens against Google's published signing certificates.
// Never trust the email/role/UID sent separately by the browser.
let certificateCache = { certs: null, expiresAt: 0 };
async function getFirebaseCertificates() {
  if (certificateCache.certs && certificateCache.expiresAt > Date.now()) return certificateCache.certs;
  const response = await fetch("https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com", { cache: "no-store" });
  if (!response.ok) throw new Error("Unable to retrieve Firebase signing certificates.");
  const certs = await response.json();
  const cacheControl = response.headers.get("cache-control") || "";
  const maxAge = Number(cacheControl.match(/max-age=(\d+)/)?.[1] || 300);
  certificateCache = { certs, expiresAt: Date.now() + Math.min(maxAge, 3600) * 1000 };
  return certs;
}

export async function verifyFirebaseIdToken(token) {
  if (!token || typeof token !== "string") throw new Error("A Firebase ID token is required.");
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) throw new Error("Firebase project ID is not configured on the server.");
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid Firebase ID token.");
  const decode = (part) => JSON.parse(Buffer.from(part.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"));
  const header = decode(parts[0]);
  const payload = decode(parts[1]);
  if (header.alg !== "RS256" || !header.kid) throw new Error("Unsupported Firebase token signature.");
  const certs = await getFirebaseCertificates();
  const cert = certs[header.kid];
  if (!cert) throw new Error("Firebase token signing key is not recognized.");
  const signedContent = `${parts[0]}.${parts[1]}`;
  const signature = Buffer.from(parts[2].replace(/-/g, "+").replace(/_/g, "/"), "base64");
  const validSignature = crypto.verify("RSA-SHA256", Buffer.from(signedContent), cert, signature);
  const now = Math.floor(Date.now() / 1000);
  if (!validSignature || payload.aud !== projectId || payload.iss !== `https://securetoken.google.com/${projectId}` || !payload.sub || payload.exp <= now || payload.iat > now || !payload.email) {
    throw new Error("Firebase ID token is invalid or expired.");
  }
  return { uid: payload.sub, email: payload.email.trim().toLowerCase(), name: payload.name || "", avatar: payload.picture || "" };
}
