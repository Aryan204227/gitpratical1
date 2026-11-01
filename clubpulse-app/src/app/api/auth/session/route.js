import { NextResponse } from "next/server";
import { connectMongoose, db } from "@/lib/db";
import { createSessionFromIdToken, setSessionCookie } from "@/lib/session";

function cleanText(value, maxLength) {
  if (typeof value !== "string") return undefined;
  const cleaned = value.trim().slice(0, maxLength);
  return cleaned || undefined;
}

function safeUser(user) {
  return {
    id: String(user._id || user.id),
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar || "",
    department: user.department,
    year: user.year,
    bio: user.bio || "",
    clubsJoined: user.clubsJoined || [],
  };
}

function errorResponse(error) {
  if (error?.code === "FIREBASE_ADMIN_NOT_CONFIGURED") {
    return NextResponse.json(
      { success: false, code: error.code, error: "Firebase Admin is not configured. See the Firebase setup section in README." },
      { status: 503 }
    );
  }

  if (error?.code === "auth/argument-error" || error?.code === "auth/invalid-argument" ||
      error?.code === "auth/invalid-id-token" || error?.code === "auth/id-token-expired" ||
      error?.code === "auth/id-token-revoked" || error?.code === "auth/user-disabled" ||
      error?.code === "auth/user-not-found" || error?.code === "auth/recent-sign-in-required") {
    return NextResponse.json(
      { success: false, code: error.code, error: "Firebase sign-in is invalid, expired, or needs to be repeated." },
      { status: 401 }
    );
  }

  return NextResponse.json(
    { success: false, code: "AUTH_SERVICE_UNAVAILABLE", error: "Authentication service or database is unavailable." },
    { status: 503 }
  );
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, code: "INVALID_TOKEN", error: "A valid Firebase ID token is required." },
      { status: 401 }
    );
  }

  if (typeof body?.idToken !== "string" || !body.idToken.trim()) {
    return NextResponse.json(
      { success: false, code: "INVALID_TOKEN", error: "A valid Firebase ID token is required." },
      { status: 401 }
    );
  }

  let firebaseSession;
  try {
    firebaseSession = await createSessionFromIdToken(body.idToken);
  } catch (error) {
    return errorResponse(error);
  }

  try {
    await connectMongoose();
    const { decoded, sessionCookie } = firebaseSession;
    const firebaseUid = String(decoded.uid || decoded.sub);
    const email = decoded.email.trim().toLowerCase();
    const emailVerified = decoded.email_verified === true;
    const provider = decoded.firebase?.sign_in_provider || "unknown";
    const profile = {
      name: cleanText(body.profile?.name, 100),
      department: cleanText(body.profile?.department, 100),
      year: cleanText(body.profile?.year, 40),
    };

    let user = await db.getUserByFirebaseUid(firebaseUid);
    let linkedByVerifiedEmail = false;

    if (!user && emailVerified) {
      user = await db.getUserByEmail(email);
      linkedByVerifiedEmail = Boolean(user);
    }

    if (user?.firebaseUid && String(user.firebaseUid) !== firebaseUid) {
      return NextResponse.json(
        { success: false, code: "ACCOUNT_LINKED_TO_ANOTHER_FIREBASE_USER", error: "This account is linked to another Firebase identity." },
        { status: 409 }
      );
    }

    if (user) {
      const updates = {
        authProvider: "firebase",
        ...(linkedByVerifiedEmail ? { firebaseUid } : {}),
        ...(profile.name ? { name: profile.name } : {}),
        ...(profile.department ? { department: profile.department } : {}),
        ...(profile.year ? { year: profile.year } : {}),
      };
      user = await db.updateUser(String(user._id || user.id), updates);
    } else {
      user = await db.createUser({
        name: profile.name || cleanText(decoded.name, 100) || email.split("@")[0],
        email,
        role: "student",
        avatar: cleanText(decoded.picture, 500) || "",
        department: profile.department || "General",
        year: profile.year || "1st Year",
        bio: "",
        firebaseUid,
        authProvider: "firebase",
        clubsJoined: [],
      });
    }

    if (provider === "password" && !emailVerified) {
      return NextResponse.json(
        { success: false, code: "EMAIL_NOT_VERIFIED", error: "Verify your email before signing in." },
        { status: 403 }
      );
    }

    const response = NextResponse.json({ success: true, authenticated: true, user: safeUser(user) });
    return setSessionCookie(response, sessionCookie);
  } catch (error) {
    // An unverified password account may already own this email; do not link it by email.
    if (error?.code === 11000 && firebaseSession.decoded.firebase?.sign_in_provider === "password" && firebaseSession.decoded.email_verified !== true) {
      return NextResponse.json(
        { success: false, code: "EMAIL_NOT_VERIFIED", error: "Verify your email before signing in." },
        { status: 403 }
      );
    }
    return errorResponse(error);
  }
}
