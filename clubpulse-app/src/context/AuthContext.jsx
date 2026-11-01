"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import {
  auth,
  isFirebaseConfigured,
  signInWithGoogleAuth,
  signInWithEmailPasswordAuth,
  registerWithEmailPasswordAuth,
  sendPasswordReset,
  signOutAuth,
} from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load active session on mount
  useEffect(() => {
    let unsubscribeAuth = null;

    const initAuth = async () => {
      try {
        // 1. Check server-side session cookie first
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.success && data.authenticated && data.user) {
          setCurrentUser(data.user);
          setIsLoading(false);
          return;
        }
      } catch {
        // continue
      }

      // 2. No seedData fallback - if no session found, user is not authenticated
      setIsLoading(false);
    };

    initAuth();

    // 3. Listen to Firebase Auth state if configured
    if (isFirebaseConfigured() && auth) {
      try {
        unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            try {
              const idToken = await firebaseUser.getIdToken();
              const syncRes = await fetch("/api/auth/firebase-sync", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  idToken,
                  email: firebaseUser.email,
                  name: firebaseUser.displayName,
                  avatar: firebaseUser.photoURL,
                  uid: firebaseUser.uid,
                }),
              });
              const syncData = await syncRes.json();
              if (syncData.success && syncData.user) {
                setCurrentUser(syncData.user);
              }
            } catch (syncErr) {
              console.warn("Background Firebase sync warning:", syncErr);
            }
          }
        });
      } catch (err) {
        console.warn("Could not register onAuthStateChanged listener:", err);
      }
    }

    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
    };
  }, []);

  // Notifications polling
  const refreshNotifications = async () => {
    if (!currentUser?.id) {
      setNotifications([]);
      return;
    }
    try {
      const res = await fetch(`/api/notifications?userId=${currentUser.id}`);
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error("Failed to load notifications", err);
    }
  };

  useEffect(() => {
    refreshNotifications();
    const interval = setInterval(refreshNotifications, 15000);
    return () => clearInterval(interval);
  }, [currentUser]);

  /**
   * Helper: Sync authenticated Firebase user with backend to verify permissions
   */
  const syncWithBackend = async (payload) => {
    const res = await fetch("/api/auth/firebase-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Failed to synchronize campus session.");
    }

    setCurrentUser(data.user);
    try {
      localStorage.setItem("clubpulse_active_user_id", data.user.id);
    } catch {
      // ignore
    }
    return data;
  };

  /**
   * Sign In with Google via Firebase
   */
  const loginWithFirebaseGoogle = async (requestedRole = "student") => {
    setIsLoading(true);
    try {
      const fbResult = await signInWithGoogleAuth(requestedRole);
      const syncResult = await syncWithBackend({
        idToken: fbResult.idToken,
        email: fbResult.user.email,
        name: fbResult.user.displayName,
        avatar: fbResult.user.photoURL,
        uid: fbResult.user.uid,
        requestedRole,
      });
      return syncResult;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sign In with Email & Password
   */
  const loginWithFirebaseEmail = async (email, password, requestedRole = "student") => {
    setIsLoading(true);
    try {
      const fbResult = await signInWithEmailPasswordAuth(email, password);

      if (fbResult.isBackendAuth) {
        // Fallback to internal password verification
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, requestedRole }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Authentication failed. Check your email & password.");
        }
        setCurrentUser(data.user);
        try {
          localStorage.setItem("clubpulse_active_user_id", data.user.id);
        } catch {}

        const redirectUrl =
          data.user.role === "admin" ? "/dashboard/admin" : data.user.role === "leader" ? "/dashboard/leader" : "/dashboard/student";
        return { success: true, user: data.user, role: data.user.role, redirectUrl };
      }

      // Real Firebase credentials
      const syncResult = await syncWithBackend({
        idToken: fbResult.idToken,
        email: fbResult.user.email,
        name: fbResult.user.displayName,
        avatar: fbResult.user.photoURL,
        uid: fbResult.user.uid,
        requestedRole,
      });
      return syncResult;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Register with Email & Password
   */
  const registerWithFirebaseEmail = async ({
    name,
    email,
    password,
    year,
    department,
    bio,
    role = "student",
  }) => {
    setIsLoading(true);
    try {
      const fbResult = await registerWithEmailPasswordAuth(name, email, password);

      if (fbResult.isBackendAuth) {
        // Fallback to internal registration endpoint
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password, year, department, bio, role }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Registration failed.");
        }
        setCurrentUser(data.user);
        try {
          localStorage.setItem("clubpulse_active_user_id", data.user.id);
        } catch {}

        const redirectUrl =
          data.user.role === "admin" ? "/dashboard/admin" : data.user.role === "leader" ? "/dashboard/leader" : "/dashboard/student";
        return { success: true, user: data.user, role: data.user.role, redirectUrl };
      }

      // Real Firebase account created: sync profile & enforce requested role on backend
      const syncResult = await syncWithBackend({
        idToken: fbResult.idToken,
        email: fbResult.user.email,
        name: name.trim(),
        avatar: fbResult.user.photoURL,
        uid: fbResult.user.uid,
        year,
        department,
        bio,
        requestedRole: role || "student",
      });
      return syncResult;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Password Reset
   */
  const requestPasswordReset = async (email) => {
    return await sendPasswordReset(email);
  };

  /**
   * Standard Logout
   */
  const logout = async () => {
    await signOutAuth();
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    setCurrentUser(null);
    setNotifications([]);
    try {
      localStorage.setItem("clubpulse_active_user_id", "logged_out");
    } catch {
      // ignore
    }
  };

  const markNotificationAsRead = async (id) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "mark_read" }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_all_read" }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        isLoading,
        loginWithFirebaseGoogle,
        loginWithFirebaseEmail,
        registerWithFirebaseEmail,
        requestPasswordReset,
        logout,
        notifications,
        unreadCount,
        refreshNotifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
