import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { NextResponse } from "next/server";

vi.mock("@/lib/firebaseAdmin", () => ({
  verifyIdToken: vi.fn(),
  createSessionCookie: vi.fn(),
  verifySessionCookie: vi.fn(),
}));

import { verifyIdToken, createSessionCookie, verifySessionCookie } from "@/lib/firebaseAdmin";
import { POST as createSession } from "@/app/api/auth/session/route";
import { GET as getMe } from "@/app/api/auth/me/route";
import { PATCH as updateMeProfile } from "@/app/api/auth/profile/route";
import { POST as logout } from "@/app/api/auth/logout/route";
import { getSessionFromRequest, setSessionCookie, SESSION_COOKIE, SESSION_TTL_SECONDS } from "@/lib/session";
import { analyzeClubWorkload } from "@/lib/fairwork";
import UserModel from "@/models/User";
import {
  clearTestDatabase,
  disconnectTestDatabase,
  reconnectTestDatabase,
  startTestDatabase,
  stopTestDatabase,
} from "./helpers/database.js";
import { makeRequest } from "./helpers/request.js";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const currentAuthTime = () => Math.floor(Date.now() / 1000);

function makeDecodedToken(overrides = {}) {
  return {
    uid: "firebase-user-1",
    sub: "firebase-user-1",
    email: "student@example.edu",
    email_verified: true,
    name: "Student Example",
    picture: "",
    auth_time: currentAuthTime(),
    firebase: { sign_in_provider: "password" },
    ...overrides,
  };
}

function makeSessionRequest(overrides = {}) {
  return makeRequest("/api/auth/session", {
    method: "POST",
    body: { idToken: "valid-id-token", ...overrides },
  });
}

beforeAll(async () => {
  process.env.NODE_ENV = "test";
  await startTestDatabase();
});

beforeEach(async () => {
  await clearTestDatabase();
  vi.resetAllMocks();
  process.env.FIREBASE_SERVICE_ACCOUNT_JSON = "test-service-account-is-mocked";
  verifyIdToken.mockResolvedValue(makeDecodedToken());
  createSessionCookie.mockResolvedValue("firebase-session-cookie-value");
  verifySessionCookie.mockResolvedValue(makeDecodedToken());
});

afterAll(async () => {
  delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  await stopTestDatabase();
});

describe("Firebase session route", () => {
  it("creates a new student record and sets a five-day HttpOnly cookie for a valid token", async () => {
    const response = await createSession(makeSessionRequest());
    const data = await response.json();
    const user = await UserModel.findOne({ firebaseUid: "firebase-user-1" }).lean();
    const setCookie = response.headers.get("set-cookie") || "";

    expect(response.status).toBe(200);
    expect(data.user.role).toBe("student");
    expect(data.user.email).toBe("student@example.edu");
    expect(user).not.toBeNull();
    expect(user.firebaseUid).toBe("firebase-user-1");
    expect(user.password).toBeUndefined();
    expect(UserModel.schema.path("password")).toBeUndefined();
    expect(verifyIdToken).toHaveBeenCalledWith("valid-id-token", true);
    expect(createSessionCookie).toHaveBeenCalledWith("valid-id-token", { expiresIn: 5 * 24 * 60 * 60 * 1000 });
    expect(setCookie).toContain(`${SESSION_COOKIE}=firebase-session-cookie-value`);
    expect(setCookie.toLowerCase()).toContain("httponly");
    expect(setCookie.toLowerCase()).toContain("samesite=lax");
    expect(setCookie.toLowerCase()).toContain("path=/");
    expect(setCookie.toLowerCase()).toContain(`max-age=${SESSION_TTL_SECONDS}`);
  });

  it.each([
    ["invalid", "auth/invalid-id-token"],
    ["invalid argument", "auth/invalid-argument"],
    ["expired", "auth/id-token-expired"],
  ])("returns 401 for an %s Firebase ID token", async (_label, code) => {
    const error = new Error("Token rejected");
    error.code = code;
    verifyIdToken.mockRejectedValue(error);

    const response = await createSession(makeSessionRequest());
    expect(response.status).toBe(401);
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("rejects a token whose auth_time is older than five minutes", async () => {
    verifyIdToken.mockResolvedValue(makeDecodedToken({ auth_time: currentAuthTime() - 301 }));
    const response = await createSession(makeSessionRequest());
    expect(response.status).toBe(401);
    expect(createSessionCookie).not.toHaveBeenCalled();
  });

  it("creates or keeps an unverified password user but returns 403 without setting a cookie", async () => {
    verifyIdToken.mockResolvedValue(makeDecodedToken({ email_verified: false }));
    const response = await createSession(makeSessionRequest({ profile: { name: "Unverified Student" } }));
    const data = await response.json();
    const user = await UserModel.findOne({ firebaseUid: "firebase-user-1" }).lean();

    expect(response.status).toBe(403);
    expect(data.code).toBe("EMAIL_NOT_VERIFIED");
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(user).not.toBeNull();
    expect(user.name).toBe("Unverified Student");
  });

  it("finds an existing user by Firebase UID and retains the database role", async () => {
    await UserModel.create({
      name: "Existing Leader",
      email: "leader@example.edu",
      firebaseUid: "firebase-user-1",
      authProvider: "firebase",
      role: "leader",
      department: "Engineering",
      year: "3rd Year",
    });
    verifyIdToken.mockResolvedValue(makeDecodedToken({ email: "leader@example.edu" }));

    const response = await createSession(makeSessionRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.user.role).toBe("leader");
    expect(await UserModel.countDocuments({ firebaseUid: "firebase-user-1" })).toBe(1);
  });

  it("links by email only when Firebase marks the email as verified", async () => {
    await UserModel.create({
      name: "Existing Member",
      email: "member@example.edu",
      authProvider: "firebase",
      role: "leader",
      department: "Engineering",
      year: "2nd Year",
    });
    verifyIdToken.mockResolvedValue(makeDecodedToken({
      uid: "verified-new-uid",
      sub: "verified-new-uid",
      email: "member@example.edu",
      email_verified: true,
    }));

    const response = await createSession(makeSessionRequest());
    const linkedUser = await UserModel.findOne({ email: "member@example.edu" }).lean();

    expect(response.status).toBe(200);
    expect(linkedUser.firebaseUid).toBe("verified-new-uid");
    expect(linkedUser.role).toBe("leader");
  });

  it("keeps an existing Firebase UID user but does not issue a cookie for an unverified password identity", async () => {
    await UserModel.create({
      name: "Unverified Existing",
      email: "student@example.edu",
      firebaseUid: "firebase-user-1",
      authProvider: "firebase",
      role: "student",
      department: "Engineering",
      year: "1st Year",
    });
    verifyIdToken.mockResolvedValue(makeDecodedToken({ email_verified: false }));

    const response = await createSession(makeSessionRequest());
    const user = await UserModel.findOne({ firebaseUid: "firebase-user-1" }).lean();

    expect(response.status).toBe(403);
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(await UserModel.countDocuments({ firebaseUid: "firebase-user-1" })).toBe(1);
    expect(user.role).toBe("student");
  });

  it("does not link an existing email to an unverified password identity", async () => {
    await UserModel.create({
      name: "Existing Account",
      email: "student@example.edu",
      authProvider: "firebase",
      role: "leader",
      department: "Engineering",
      year: "2nd Year",
    });
    verifyIdToken.mockResolvedValue(makeDecodedToken({ email_verified: false }));

    const response = await createSession(makeSessionRequest());
    const existingUser = await UserModel.findOne({ email: "student@example.edu" }).lean();
    expect(response.status).toBe(403);
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(existingUser.firebaseUid).toBeUndefined();
    expect(existingUser.role).toBe("leader");
  });

  it("ignores body role and requestedRole values and creates a student", async () => {
    const response = await createSession(makeSessionRequest({
      role: "admin",
      requestedRole: "admin",
      profile: { name: "No Admin", department: "Computer Science", year: "3rd Year", role: "admin" },
    }));
    const data = await response.json();
    const user = await UserModel.findOne({ firebaseUid: "firebase-user-1" }).lean();

    expect(response.status).toBe(200);
    expect(data.user.role).toBe("student");
    expect(user.role).toBe("student");
  });

  it("returns 503 rather than a fake success when Firebase Admin is not configured", async () => {
    const error = new Error("Missing Firebase Admin config");
    error.code = "FIREBASE_ADMIN_NOT_CONFIGURED";
    verifyIdToken.mockRejectedValue(error);

    const response = await createSession(makeSessionRequest());
    const data = await response.json();
    expect(response.status).toBe(503);
    expect(data.code).toBe("FIREBASE_ADMIN_NOT_CONFIGURED");
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("returns 503 when MongoDB is not configured, without using a real database", async () => {
    const originalUri = process.env.MONGODB_URI;
    await disconnectTestDatabase();
    process.env.MONGODB_URI = "";

    try {
      const response = await createSession(makeSessionRequest());
      const data = await response.json();
      expect(response.status).toBe(503);
      expect(data.code).toBe("AUTH_SERVICE_UNAVAILABLE");
      expect(response.headers.get("set-cookie")).toBeNull();
    } finally {
      process.env.MONGODB_URI = originalUri;
      await reconnectTestDatabase();
    }
  });

  it("returns 503 when MongoDB is unreachable at a local test-only address", async () => {
    const originalUri = process.env.MONGODB_URI;
    await disconnectTestDatabase();
    process.env.MONGODB_URI = "mongodb://127.0.0.1:1/clubpulse_test?serverSelectionTimeoutMS=300";

    try {
      const response = await createSession(makeSessionRequest());
      const data = await response.json();
      expect(response.status).toBe(503);
      expect(data.code).toBe("AUTH_SERVICE_UNAVAILABLE");
      expect(response.headers.get("set-cookie")).toBeNull();
    } finally {
      process.env.MONGODB_URI = originalUri;
      await reconnectTestDatabase();
    }
  });
});

describe("session cookie and logout", () => {
  it("returns null when the session cookie is missing", async () => {
    const session = await getSessionFromRequest(makeRequest("/api/auth/me"));
    expect(session).toBeNull();
    expect(verifySessionCookie).not.toHaveBeenCalled();
  });

  it("returns null when the session cookie is tampered with", async () => {
    verifySessionCookie.mockRejectedValue(new Error("Invalid session cookie"));
    const session = await getSessionFromRequest(makeRequest("/api/auth/me", { cookie: `${SESSION_COOKIE}=tampered` }));
    expect(session).toBeNull();
    expect(verifySessionCookie).toHaveBeenCalledWith("tampered", true);
  });

  it("loads the current application user from MongoDB in GET /api/auth/me", async () => {
    await UserModel.create({
      name: "Mongo Profile",
      email: "mongo@example.edu",
      firebaseUid: "firebase-user-1",
      authProvider: "firebase",
      role: "leader",
      department: "Computing",
      year: "3rd Year",
    });
    verifySessionCookie.mockResolvedValue(makeDecodedToken({ email: "mongo@example.edu" }));

    const response = await getMe(makeRequest("/api/auth/me", { cookie: `${SESSION_COOKIE}=valid-session` }));
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.authenticated).toBe(true);
    expect(data.user.id).toBeTruthy();
    expect(data.user.role).toBe("leader");
    expect(data.user.email).toBe("mongo@example.edu");
  });

  it("updates the existing user's profile without accepting a role change", async () => {
    const user = await UserModel.create({
      name: "Profile Before",
      email: "profile@example.edu",
      firebaseUid: "firebase-user-1",
      authProvider: "firebase",
      role: "student",
      department: "Computing",
      year: "2nd Year",
    });
    verifySessionCookie.mockResolvedValue(makeDecodedToken({ email: "profile@example.edu" }));

    const response = await updateMeProfile(makeRequest("/api/auth/profile", {
      method: "PATCH",
      cookie: `${SESSION_COOKIE}=valid-session`,
      body: { name: "Profile After", department: "Computer Science", year: "3rd Year", role: "admin" },
    }));
    const data = await response.json();
    const updated = await UserModel.findById(user._id).lean();

    expect(response.status).toBe(200);
    expect(data.user.id).toBe(String(user._id));
    expect(data.user.name).toBe("Profile After");
    expect(updated.role).toBe("student");
  });

  it("clears the session cookie on logout", async () => {
    const response = await logout();
    const setCookie = response.headers.get("set-cookie") || "";
    expect(response.status).toBe(200);
    expect(setCookie).toContain(`${SESSION_COOKIE}=`);
    expect(setCookie.toLowerCase()).toContain("max-age=0");
    expect(setCookie.toLowerCase()).toContain("httponly");
  });

  it("sets Secure only for production session cookies", () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    try {
      const response = setSessionCookie(NextResponse.json({ success: true }), "session-cookie");
      expect(response.headers.get("set-cookie")?.toLowerCase()).toContain("secure");
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });
});

describe("removed legacy authentication routes", () => {
  it.each([
    "src/app/api/auth/firebase-sync/route.js",
    "src/app/api/auth/google/route.js",
    "src/app/api/auth/login/route.js",
    "src/app/api/auth/register/route.js",
  ])("no longer contains %s", (relativePath) => {
    expect(existsSync(path.join(projectRoot, relativePath))).toBe(false);
  });
});

describe("real FairWork integration", () => {
  it("analyzes the existing FairWork engine using its exported function", () => {
    const memberships = [
      { userId: "u-1", userName: "Overloaded Lead", clubRole: "president", lastActiveAt: new Date().toISOString(), attendanceRate: 95, estimatedWeeklyHours: 10 },
      { userId: "u-2", userName: "Available Member", clubRole: "member", lastActiveAt: new Date().toISOString(), attendanceRate: 85, estimatedWeeklyHours: 15 },
      { userId: "u-3", userName: "Ghost Candidate", clubRole: "member", lastActiveAt: "2026-08-01", attendanceRate: 15, estimatedWeeklyHours: 5, tasksCompleted: 0, tasksPending: 0 },
    ];
    const tasks = [
      { id: "t-1", title: "Task 1", assigneeId: "u-1", estimatedHours: 15, status: "in_progress" },
      { id: "t-2", title: "Task 2", assigneeId: "u-1", estimatedHours: 12, status: "pending" },
      { id: "t-3", title: "Task 3", assigneeId: "u-2", estimatedHours: 3, status: "pending" },
    ];

    const analysis = analyzeClubWorkload(memberships, tasks);
    expect(analysis.totalClubHours).toBe(30);
    expect(analysis.workloadConcentrationIndex).toBeGreaterThanOrEqual(80);
    expect(analysis.isHealthy).toBe(false);
    expect(analysis.recommendations.length).toBeGreaterThan(0);
  });
});
