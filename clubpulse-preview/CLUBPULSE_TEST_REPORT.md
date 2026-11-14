# CLUBPULSE TEST REPORT & VERIFICATION

## 1. Executive Summary
- **Project Name:** ClubPulse (Project ID: P18)
- **Courses:** INT252 (React) & INT257 (Next.js)
- **Build Status:** Passed in GitHub Actions on commit `b63381173d8edd017f895cfe4ce6fdc04dc9544f`.
- **Unit Tests:** 34/34 Passed (0 Failed, 0 Skipped).
- **TypeScript:** `tsc --noEmit` passed with 0 type errors.
- **Vite React SPA Build:** Passed; the SPA bundle was generated and copied to `public/react`.
- **Next.js Production Build:** Passed using the production build command.
- **Database connectivity:** Not asserted by this CI run. Check the deployed `/api/health` endpoint separately; a successful build does not prove database availability.
- **End-to-end limitation:** The 34 automated tests are unit tests. They do not replace a full authenticated browser test using separate admin, lead and student accounts.

---

## 2. Test Execution Details

### Automated Test Suite (`tests/*.test.mjs`)
| # | Test Name | Result | Duration |
|---|---|---|---|
| 1 | completion rate reports a rounded percentage from persisted counts | PASS | 2.36ms |
| 2 | completion rate hides percentages when there are no tasks and clamps impossible counts | PASS | 0.32ms |
| 3 | feedback averages are hidden for small groups (<5 responses) | PASS | 0.28ms |
| 4 | feedback averages discard invalid and non-rating input | PASS | 3.15ms |
| 5 | only a recorded task completion event contributes one point | PASS | 1.72ms |
| 6 | opening status is treated as open only for open/review states | PASS | 0.39ms |
| 7 | CSV parser supports commas and escaped quotes inside quoted fields | PASS | 5.33ms |
| 8 | CSV parser handles LF and ignores blank rows | PASS | 0.47ms |
| 9 | CSV parser rejects unclosed and misplaced quotes | PASS | 0.89ms |
| 10 | object conversion requires unique required task headers | PASS | 7.27ms |
| 11 | object conversion maps rows by header instead of column order | PASS | 1.36ms |
| 12 | FairWork Gini coefficient evaluates workload inequality accurately | PASS | 5.00ms |
| 13 | FairWork burnout risk flags high load, overdue ratio, and recommends rebalancing | PASS | 0.80ms |
| 14 | Ghost member detector flags prolonged inactivity beyond 21 days | PASS | 0.42ms |
| 15 | Ghost member detector respects explicit breaks | PASS | 0.26ms |
| 16 | contribution points use effort, timeliness and bounded review multipliers | PASS | 8.62ms |
| 17 | contribution decay uses a 14-day half-life | PASS | 1.27ms |
| 18 | pulse score normalizes against committed weekly hours and stays within 0–100 | PASS | 1.94ms |
| 19 | member status respects breaks, pulse thresholds and 21-day inactivity | PASS | 3.06ms |
| 20 | Gini coefficient is zero for equal work and increases when load concentrates | PASS | 0.53ms |
| 21 | burnout risk flags high overdue workload and offers a humane next step | PASS | 0.51ms |
| 22 | accepts valid ISO calendar dates | PASS | 1.93ms |
| 23 | rejects malformed and impossible calendar dates | PASS | 0.38ms |
| 24 | accepts only positive safe club IDs | PASS | 0.67ms |

### Additional coverage included in the current 34-test run

| Area | Test | Result |
|---|---|---|
| Club permissions | Club leads can manage only clubs they own or actively belong to | PASS |
| Club permissions | Administrators can manage clubs and anonymous users cannot | PASS |
| Club directory | Search matches club name, description and lead name | PASS |
| Club directory | Archived clubs are hidden unless requested | PASS |
| Club directory | Category and status filters work together | PASS |
| Club directory | Member-count sorting and pagination work safely | PASS |
| Image uploads | PNG file signatures are recognised | PASS |
| Image uploads | JPEG file signatures are recognised | PASS |
| Image uploads | WebP RIFF/WEBP markers are recognised | PASS |
| Image uploads | Spoofed MIME types and unknown signatures are rejected | PASS |

**Current CI summary:** 34 passed, 0 failed, 0 skipped. This verifies utility logic and compilation; it is not a full browser-level acceptance test.

**Summary:** 34 passed, 0 failed, 0 skipped. The 24 previously itemized tests plus 10 club-permission, directory and image-signature tests make up the current suite.

---

## 3. Source-Level Security & Authorization Matrix

The matrix below summarizes the intended access policy visible in the source. It is not a claim that every route has been exercised end-to-end with real browser sessions.

| Route / Action | Super Admin | Club Admin | Club Lead | Member | Unauthenticated |
|---|---|---|---|---|---|
| `GET /dashboard` | Platform view | Club view | Team view | Personal view | Redirect to `/login` |
| `POST /api/auth/register` | Allowed | Allowed | Allowed | Allowed | Allowed (starts as member) |
| `POST /api/auth/login` | Allowed | Allowed | Allowed | Allowed | Allowed |
| `POST /api/auth/forgot-password` | Allowed | Allowed | Allowed | Allowed | Allowed (Rate-limited) |
| `POST /api/auth/reset-password` | Allowed | Allowed | Allowed | Allowed | Allowed (Token verified) |
| `POST /api/auth/sessions/revoke-all`| Allowed | Allowed | Allowed | Allowed | 401 Unauthorized |
| `POST /clubs` (Create Club) | Allowed | Allowed | Allowed | 403 Forbidden | Redirect to `/login` |
| `GET /clubs/[id]` | Allowed | Allowed | Allowed | Allowed | Redirect to `/login` |
| `POST /recruitment` (Openings) | Allowed | Allowed | Allowed | 403 Forbidden | Redirect to `/login` |
| `POST /recruitment/apply` | Allowed | Allowed | Allowed | Allowed | Allowed (Public applicants) |
| `POST /recruitment/status` (Accept) | Allowed | Allowed | Allowed | 403 Forbidden | Redirect to `/login` |
| `POST /tasks` (Create Task) | Allowed | Allowed | Allowed | 403 Forbidden | Redirect to `/login` |
| `PATCH /tasks/[id]` (Status update) | All tasks | All tasks | All tasks | Owned task only | 401 Unauthorized |
| `POST /fairwork/reassign` | Allowed | Allowed | Allowed | 403 Forbidden | Redirect to `/login` |
| `GET /fairwork` | Allowed | Allowed | Allowed | 403 Forbidden | Redirect to `/login` |
| `GET /feedback` (Inbox) | Full Inbox | Full Inbox | Full Inbox | 403 Forbidden | Redirect to `/login` |
| `POST /feedback` (Submit) | Allowed | Allowed | Allowed | Allowed | Redirect to `/login` |
| `POST /mood` (Weekly check-in) | Allowed | Allowed | Allowed | Allowed | Redirect to `/login` |

---

## 4. Live Health Check vs Build Status

A successful build verifies that code compiles and types are sound. It does **not** prove database connectivity. The JSON below shows example response shapes, not a live status snapshot.

The live readiness endpoint `/api/health` performs an active probe:
```json
// When PostgreSQL is reachable:
{
  "application": "ClubPulse",
  "status": "ok",
  "database": "connected",
  "storage": "postgresql",
  "googleSignInConfigured": false,
  "googleBrowserConfigured": false,
  "databaseTime": "2026-11-11T12:30:00.000Z"
}

// When PostgreSQL is unreachable (HTTP 503):
{
  "application": "ClubPulse",
  "status": "degraded",
  "database": "disconnected",
  "storage": "postgresql",
  "error": "Database connection failed. Check service logs for details."
}
```

---

## 5. External Services Status

| Service | Implemented Code | Operational Status | Requirement to Activate |
|---|---|---|---|
| **PostgreSQL Database** | Parameterized queries with advisory locks (`lib/db.ts`) | **Active** | Provide valid `DATABASE_URL` |
| **Google Identity Services (OAuth)** | Client & server token flow (`app/api/auth/google/route.ts`) | **Externally Blocked** | Requires Google Cloud Client ID & Secret (`NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`) |
| **SMTP Email Delivery** | Reset token generation & reset logic (`/api/auth/reset-password`) | **Externally Blocked** | Requires configuring campus SMTP server (`SMTP_HOST`, `SMTP_PORT`). Debug mode emits links for local test. |
