import { createPrivateKey } from "node:crypto";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const APP_NAME = "clubpulse-admin";
let cachedAuth = null;

function notConfiguredError() {
  const error = new Error("Firebase Admin is not configured. Add FIREBASE_SERVICE_ACCOUNT_JSON in the server environment.");
  error.code = "FIREBASE_ADMIN_NOT_CONFIGURED";
  return error;
}

function getFirebaseAdminAuth() {
  if (cachedAuth) return cachedAuth;

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) throw notConfiguredError();

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(serviceAccountJson);
    if (
      typeof serviceAccount.project_id !== "string" ||
      !serviceAccount.project_id ||
      typeof serviceAccount.client_email !== "string" ||
      !serviceAccount.client_email ||
      typeof serviceAccount.private_key !== "string" ||
      !serviceAccount.private_key
    ) {
      throw new Error("Service account fields are missing.");
    }
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
    createPrivateKey(serviceAccount.private_key);
  } catch {
    throw notConfiguredError();
  }

  try {
    const existingApp = getApps().find((app) => app.name === APP_NAME);
    const app = existingApp || initializeApp(
      { credential: cert(serviceAccount), projectId: serviceAccount.project_id },
      APP_NAME
    );
    cachedAuth = getAuth(app);
    return cachedAuth;
  } catch {
    throw notConfiguredError();
  }
}

export function verifyIdToken(idToken, checkRevoked = true) {
  return getFirebaseAdminAuth().verifyIdToken(idToken, checkRevoked);
}

export function createSessionCookie(idToken, options) {
  return getFirebaseAdminAuth().createSessionCookie(idToken, options);
}

export function verifySessionCookie(sessionCookie, checkRevoked = true) {
  return getFirebaseAdminAuth().verifySessionCookie(sessionCookie, checkRevoked);
}
