import { getApp, getApps, initializeApp } from "firebase/app";
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const FIREBASE_SETUP_MESSAGE = "Firebase is not configured, see README setup.";

function isPlaceholder(value) {
  return !value || /your_|placeholder|simulated|example/i.test(value);
}

export function isFirebaseConfigured() {
  return Object.values(firebaseConfig).every((value) => !isPlaceholder(value));
}

let app = null;
let auth = null;
let googleProvider = null;

if (typeof window !== "undefined" && isFirebaseConfigured()) {
  try {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    setPersistence(auth, browserLocalPersistence).catch(() => {});
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: "select_account" });
  } catch {
    app = null;
    auth = null;
    googleProvider = null;
  }
}

export { app, auth, googleProvider };

function requireFirebaseAuth() {
  if (!isFirebaseConfigured() || !auth) {
    throw new Error(FIREBASE_SETUP_MESSAGE);
  }
  return auth;
}

export function getFriendlyAuthErrorMessage(error) {
  if (!error) return "An unexpected authentication error occurred.";
  const code = error.code || "";
  const message = error.message || "";

  switch (code) {
    case "auth/invalid-email":
      return "The email address entered is not valid.";
    case "auth/user-disabled":
      return "This campus account has been disabled. Please contact the administrator.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Invalid email or password.";
    case "auth/email-already-in-use":
      return "An account with this email already exists. Try signing in or reset your password.";
    case "auth/weak-password":
      return "Password is too weak. Use at least 6 characters.";
    case "auth/popup-closed-by-user":
      return "Google sign-in was closed before completing authentication.";
    case "auth/cancelled-popup-request":
      return "The Google sign-in popup was cancelled. Please try again.";
    case "auth/popup-blocked":
      return "The Google sign-in popup was blocked. Allow popups for this site.";
    case "auth/network-request-failed":
      return "Network error. Please check your internet connection.";
    case "auth/too-many-requests":
      return "Too many unsuccessful attempts. Please try again later or reset your password.";
    case "auth/account-exists-with-different-credential":
      return "An account already exists with this email using a different sign-in method.";
    case "auth/requires-recent-login":
      return "This action requires a recent sign-in. Please sign in again.";
    default:
      return message || "Authentication failed. Please try again.";
  }
}

export async function signInWithGoogleAuth() {
  const firebaseAuth = requireFirebaseAuth();
  try {
    const result = await signInWithPopup(firebaseAuth, googleProvider);
    const user = result.user;
    return { user, idToken: await user.getIdToken() };
  } catch (error) {
    throw new Error(getFriendlyAuthErrorMessage(error));
  }
}

export async function signInWithEmailPasswordAuth(email, password) {
  const firebaseAuth = requireFirebaseAuth();
  try {
    const credential = await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
    return { user: credential.user, idToken: await credential.user.getIdToken() };
  } catch (error) {
    throw new Error(getFriendlyAuthErrorMessage(error));
  }
}

export async function registerWithEmailPasswordAuth(name, email, password) {
  const firebaseAuth = requireFirebaseAuth();
  try {
    const credential = await createUserWithEmailAndPassword(firebaseAuth, email.trim(), password);
    const user = credential.user;
    await updateProfile(user, { displayName: name.trim() });
    await sendEmailVerification(user);
    return { user, idToken: await user.getIdToken(true) };
  } catch (error) {
    throw new Error(getFriendlyAuthErrorMessage(error));
  }
}

export async function resendEmailVerification(user) {
  requireFirebaseAuth();
  if (!user) throw new Error("Sign in again before requesting another verification email.");
  try {
    await sendEmailVerification(user);
    return { success: true, message: "Verification email sent. Check your inbox." };
  } catch (error) {
    throw new Error(getFriendlyAuthErrorMessage(error));
  }
}

export async function sendPasswordReset(email) {
  const firebaseAuth = requireFirebaseAuth();
  try {
    await sendPasswordResetEmail(firebaseAuth, email.trim());
    return { success: true, message: `Password reset instructions sent to ${email}.` };
  } catch (error) {
    throw new Error(getFriendlyAuthErrorMessage(error));
  }
}

export async function updateFirebaseProfile(user, profile) {
  requireFirebaseAuth();
  if (!user) throw new Error("Sign in before updating your profile.");

  const updates = {};
  if (typeof profile?.name === "string" && profile.name.trim()) {
    updates.displayName = profile.name.trim();
  }
  if (typeof profile?.avatar === "string" && profile.avatar.trim()) {
    updates.photoURL = profile.avatar.trim();
  }

  if (Object.keys(updates).length > 0) {
    await updateProfile(user, updates);
  }
}

export async function signOutAuth() {
  if (auth) await signOut(auth);
}
