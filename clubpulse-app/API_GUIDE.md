# ClubPulse API Guide

## Authentication

### `POST /api/auth/session`
Verifies a Firebase ID token issued within the last five minutes and creates a five-day Firebase session cookie.
- **Payload:** `{ idToken, profile?: { name, department, year } }`
- New accounts receive the `student` role. A browser-supplied role is ignored.
- Linking an existing account by email is allowed only when Firebase confirms `email_verified: true`.
- Password-provider accounts without a verified email receive `403 EMAIL_NOT_VERIFIED` and no session cookie.
- Returns safe MongoDB user fields and sets an HttpOnly, SameSite=Lax cookie (Secure in production).
- Returns `401` for invalid, expired, or stale-authentication tokens; `403 EMAIL_NOT_VERIFIED` for unverified password-provider accounts; and `503` when Firebase Admin or MongoDB is unavailable.

### `GET /api/auth/me`
Verifies the Firebase session cookie and loads the application user from MongoDB by Firebase UID. Returns `authenticated: false` when no valid account session exists.

### `POST /api/auth/logout`
Clears the HttpOnly session cookie with `Max-Age=0`.

Protected API routes resolve the current role and MongoDB user ID from the verified Firebase UID. The cookie does not contain a ClubPulse user ID or ClubPulse role.
