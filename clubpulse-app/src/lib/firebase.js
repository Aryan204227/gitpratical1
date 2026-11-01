import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if valid Firebase configuration is present
export function isFirebaseConfigured() {
  const key = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!key) return false;
  if (
    key === "your_firebase_api_key" ||
    key.includes("Simulated") ||
    key.includes("your_") ||
    key.length < 25
  ) {
    return false;
  }
  return true;
}

// Initialize Firebase App singleton safely
let app = null;
let auth = null;
let googleProvider = null;

if (typeof window !== "undefined") {
  try {
    if (isFirebaseConfigured()) {
      app = getApps().length ? getApp() : initializeApp(firebaseConfig);
      auth = getAuth(app);
      setPersistence(auth, browserLocalPersistence).catch((err) => {
        console.warn("Could not set Firebase persistence:", err);
      });
      googleProvider = new GoogleAuthProvider();
      googleProvider.setCustomParameters({ prompt: "select_account" });
    }
  } catch (err) {
    console.warn("Firebase client initialization warning:", err);
  }
}

export { app, auth, googleProvider };

/**
 * Friendly error mapper for Firebase Auth error codes
 */
export function getFriendlyAuthErrorMessage(error) {
  if (!error) return "An unexpected authentication error occurred.";
  const code = error.code || "";
  const msg = error.message || "";

  switch (code) {
    case "auth/invalid-email":
      return "The email address entered is not valid.";
    case "auth/user-disabled":
      return "This campus account has been disabled. Please contact the Dean's Office.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Invalid email or password. Please verify your campus credentials.";
    case "auth/email-already-in-use":
      return "An account with this email already exists. Try signing in or reset your password.";
    case "auth/weak-password":
      return "Password is too weak. Please use at least 6 characters with mixed numbers/letters.";
    case "auth/popup-closed-by-user":
      return "Google Sign-In popup was closed before completing authentication.";
    case "auth/cancelled-popup-request":
      return "Authentication popup was cancelled. Please try again.";
    case "auth/popup-blocked":
      return "The Google login popup was blocked by your browser. Please allow popups for this site.";
    case "auth/network-request-failed":
      return "Network error. Please check your internet connection.";
    case "auth/too-many-requests":
      return "Too many unsuccessful attempts. Access has been temporarily locked for security. Please try again later or reset your password.";
    case "auth/account-exists-with-different-credential":
      return "An account already exists with this email using a different sign-in method (e.g. Email/Password instead of Google).";
    case "auth/requires-recent-login":
      return "This action requires recent authentication. Please sign in again.";
    default:
      if (msg.includes("Firebase: Error")) {
        return msg.replace("Firebase: Error", "").replace(/\(auth\/.*?\)\.?/, "").trim();
      }
      return msg || "Authentication failed. Please try again.";
  }
}

/**
 * Sign in with Google via Firebase Popup
 */
export async function signInWithGoogleAuth() {
  if (!isFirebaseConfigured() || !auth || !googleProvider) {
    throw new Error("Google sign-in is not configured. Add Firebase web configuration and enable Google Authentication in Firebase Console.");
  }
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    return { isBackendAuth: false, user: { uid: user.uid, email: user.email, displayName: user.displayName, photoURL: user.photoURL, emailVerified: user.emailVerified }, idToken: await user.getIdToken() };
  } catch (error) {
    throw new Error(getFriendlyAuthErrorMessage(error));
  }
}

export async function signInWithEmailPasswordAuth(email, password) {
  if (!isFirebaseConfigured() || !auth) {
    console.warn("Firebase not configured. Using backend API fallback.");
    return { isBackendAuth: true, email };
  }

  try {
    const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
    const user = credential.user;
    const idToken = await user.getIdToken();
    return {
      isBackendAuth: false,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
      },
      idToken,
    };
  } catch (error) {
    throw new Error(getFriendlyAuthErrorMessage(error));
  }
}

/**
 * Register new user with Email and Password via Firebase
 */
export async function registerWithEmailPasswordAuth(name, email, password) {
  if (!isFirebaseConfigured() || !auth) {
    console.warn("Firebase not configured. Using backend API fallback.");
    return { isBackendAuth: true, name, email };
  }

  try {
    const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const user = credential.user;

    // Set user display name
    await updateProfile(user, { displayName: name.trim() });

    // Send verification email
    try {
      await sendEmailVerification(user);
    } catch (verifErr) {
      console.warn("Could not dispatch verification email:", verifErr);
    }

    const idToken = await user.getIdToken();
    return {
      isBackendAuth: false,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: name.trim(),
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
      },
      idToken,
    };
  } catch (error) {
    throw new Error(getFriendlyAuthErrorMessage(error));
  }
}

/**
 * Send password reset email via Firebase
 */
export async function sendPasswordReset(email) {
  if (!isFirebaseConfigured() || !auth) {
    throw new Error("Password reset email is unavailable until Firebase Authentication is configured.");
  }
  try {
    await sendPasswordResetEmail(auth, email.trim());
    return { success: true, message: `Password reset instructions sent to ${email}. Please check your inbox.` };
  } catch (error) {
    throw new Error(getFriendlyAuthErrorMessage(error));
  }
}

export async function signOutAuth() {
  if (auth) {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn("Firebase sign out error:", err);
    }
  }
}
