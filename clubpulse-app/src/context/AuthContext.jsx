"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  auth,
  isFirebaseConfigured,
  signInWithGoogleAuth,
  signInWithEmailPasswordAuth,
  registerWithEmailPasswordAuth,
  resendEmailVerification,
  sendPasswordReset,
  signOutAuth,
  updateFirebaseProfile,
  FIREBASE_SETUP_MESSAGE,
} from "@/lib/firebase";

const AuthContext = createContext(undefined);

function createAuthError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [pendingVerificationUser, setPendingVerificationUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadSession() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await response.json();
        if (active && response.ok && data.authenticated && data.user) {
          setCurrentUser(data.user);
        }
      } catch {
        if (active) setCurrentUser(null);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadSession();
    return () => {
      active = false;
    };
  }, []);

  async function syncWithBackend(idToken, profile) {
    const response = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken, profile }),
    });
    const data = await response.json();

    if (!response.ok) {
      throw createAuthError(data.error || "Could not create a ClubPulse session.", data.code);
    }

    // The role and application profile come from the database-backed /me endpoint.
    const meResponse = await fetch("/api/auth/me", { cache: "no-store" });
    const meData = await meResponse.json();
    if (!meResponse.ok || !meData.authenticated || !meData.user) {
      throw new Error("Your Firebase sign-in succeeded, but ClubPulse could not load your account profile.");
    }

    setCurrentUser(meData.user);
    setPendingVerificationUser(null);
    return { success: true, user: meData.user };
  }

  async function loginWithFirebaseGoogle() {
    if (!isFirebaseConfigured() || !auth) throw new Error(FIREBASE_SETUP_MESSAGE);
    setIsLoading(true);
    try {
      const firebaseResult = await signInWithGoogleAuth();
      return await syncWithBackend(firebaseResult.idToken, undefined);
    } finally {
      setIsLoading(false);
    }
  }

  async function loginWithFirebaseEmail(email, password) {
    if (!isFirebaseConfigured() || !auth) throw new Error(FIREBASE_SETUP_MESSAGE);
    setIsLoading(true);
    try {
      const firebaseResult = await signInWithEmailPasswordAuth(email, password);
      try {
        return await syncWithBackend(firebaseResult.idToken, undefined);
      } catch (error) {
        if (error.code === "EMAIL_NOT_VERIFIED") {
          setPendingVerificationUser(firebaseResult.user);
        }
        throw error;
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function registerWithFirebaseEmail({ name, email, password, department, year }) {
    if (!isFirebaseConfigured() || !auth) throw new Error(FIREBASE_SETUP_MESSAGE);
    setIsLoading(true);
    try {
      const firebaseResult = await registerWithEmailPasswordAuth(name, email, password);
      setPendingVerificationUser(firebaseResult.user);
      try {
        return await syncWithBackend(firebaseResult.idToken, { name, department, year });
      } catch (error) {
        if (error.code === "EMAIL_NOT_VERIFIED") {
          return { success: true, needsEmailVerification: true, email: firebaseResult.user.email };
        }
        throw error;
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function resendVerificationEmail() {
    if (!isFirebaseConfigured() || !auth) throw new Error(FIREBASE_SETUP_MESSAGE);
    if (!pendingVerificationUser) {
      throw new Error("Sign in again before requesting another verification email.");
    }
    return resendEmailVerification(pendingVerificationUser);
  }

  async function requestPasswordReset(email) {
    if (!isFirebaseConfigured() || !auth) throw new Error(FIREBASE_SETUP_MESSAGE);
    return sendPasswordReset(email);
  }

  async function updateProfile(profile) {
    if (!isFirebaseConfigured() || !auth) throw new Error(FIREBASE_SETUP_MESSAGE);
    if (!auth.currentUser) throw new Error("Sign in again before updating your profile.");

    await updateFirebaseProfile(auth.currentUser, profile);
    const response = await fetch("/api/auth/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    const data = await response.json();

    if (!response.ok || !data.success || !data.user) {
      throw new Error(data.error || "Could not save your profile.");
    }

    setCurrentUser(data.user);
    return data.user;
  }

  async function logout() {
    try {
      await signOutAuth();
    } finally {
      try {
        await fetch("/api/auth/logout", { method: "POST" });
      } catch {
        // The client state is still cleared even if the network is unavailable.
      }
      setCurrentUser(null);
      setPendingVerificationUser(null);
      setNotifications([]);
      if (typeof window !== "undefined") window.location.assign("/");
    }
  }

  async function refreshNotifications() {
    if (!currentUser?.id) {
      setNotifications([]);
      return;
    }
    try {
      const response = await fetch("/api/notifications");
      const data = await response.json();
      if (response.ok && data.success) setNotifications(data.notifications || []);
    } catch {
      setNotifications([]);
    }
  }

  useEffect(() => {
    refreshNotifications();
    const interval = setInterval(refreshNotifications, 15000);
    return () => clearInterval(interval);
  }, [currentUser?.id]);

  async function markNotificationAsRead(id) {
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "mark_read" }),
      });
      if (response.ok) {
        setNotifications((previous) => previous.map((item) => item.id === id ? { ...item, read: true } : item));
      }
    } catch {
      // Leave the current notification state unchanged on network errors.
    }
  }

  async function markAllNotificationsAsRead() {
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_all_read" }),
      });
      if (response.ok) setNotifications((previous) => previous.map((item) => ({ ...item, read: true })));
    } catch {
      // Leave the current notification state unchanged on network errors.
    }
  }

  const isAuthenticated = Boolean(currentUser);
  const unreadCount = notifications.filter((item) => !item.read).length;

  return (
    <AuthContext.Provider value={{
      currentUser,
      isAuthenticated,
      setCurrentUser,
      isLoading,
      loginWithFirebaseGoogle,
      loginWithFirebaseEmail,
      registerWithFirebaseEmail,
      resendVerificationEmail,
      requestPasswordReset,
      updateProfile,
      logout,
      notifications,
      unreadCount,
      refreshNotifications,
      markNotificationAsRead,
      markAllNotificationsAsRead,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
