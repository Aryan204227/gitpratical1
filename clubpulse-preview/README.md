# ClubPulse — See who's showing up. Protect who's burning out. (INT252 + INT257 · P18)

ClubPulse uses the Pulse & Ghost concept to address “Ghost Members and Burnout Leads”: it makes participation recency visible, highlights concentrated task ownership, gives students a route to check in, and helps clubs compare recorded delivery with what they promise.

The product workflow is:

**Club profile & recruitment → applications → member onboarding → task assignment → contribution events → feedback & club analytics**

## Pulse & Ghost scoring

The dashboard computes the member signal from saved contribution events and declared weekly hours. The code lives in `lib/scoring.mjs`; `tests/scoring.test.mjs` tests its boundaries.

- **Contribution points** = effort weight (1–5) × timeliness (on-time 1.0, late 0.6) × review multiplier (clamped to 0.8–1.2).
- **Pulse score** = decayed contribution points ÷ (declared weekly hours × 1.25) × 100, rounded and clamped to 0–100. Each event uses a 14-day half-life: `points × 0.5^(ageDays / 14)`.
- **Member signal:** Active ≥ 60; Drifting 30–59; Ghost < 30 or no contribution for 21 days; On Break overrides these labels while the declared break is active.
- **Workload concentration:** the dashboard calculates Gini across recorded open tasks and shows the top-two share. A share of 60% or more is a nudge to offer a handover.
- **Burnout Watch:** combines load vs median, overdue ratio, recent task-load change and days since a break. It is explicitly a planning signal, not a diagnosis; the current app does not yet collect a real mood-pulse series, so mood strain is not included in the live risk calculation.

The application no longer auto-populates clubs, members, tasks, applications, contributions, or feedback with invented campus records. A new workspace starts empty and should be populated with records created through the app or a verified CSV import. During initialization, a one-time migration removes identifiable synthetic records created by older versions (reserved `@clubpulse.invalid` emails and explicit demo-task labels) while preserving unrelated user-entered records. The repository-root `index.html` is a design-only preview, not the database-backed application.

## Architecture

This repository deliberately has two complementary frontends sharing the same Next.js API routes and PostgreSQL tables:

- **Native Next.js App Router** at `/`: server-rendered protected workspace, Server Actions, metadata, dynamic pages, loading/error UI, parallel and intercepted routes, public SSG/ISR examples, and REST Route Handlers.
- **React + Vite SPA** at `/react/index.html#/`: reusable React components, React Router, hooks, Context, Redux Toolkit, Zustand, Axios, TanStack Query, Zod and optimistic task updates.
- **Backend**: Next.js Route Handlers, PostgreSQL using parameterized SQL, Zod validation, bcrypt password hashing, hashed HTTP-only session tokens, and server-side role checks.
- **Storage**: PostgreSQL schema for users, sessions, clubs, members, tasks, recruitment openings/applications, feedback entries and contribution events.
- **Tests**: Node.js unit tests for analytics/privacy guardrails and CSV parsing. The deployment build runs the tests and both frontend builds.

## Quick links

- App: https://clubpulse-live.onrender.com
- Health endpoint: https://clubpulse-live.onrender.com/api/health
- React + Vite: https://clubpulse-live.onrender.com/react/index.html#/
- Rendering lab: https://clubpulse-live.onrender.com/labs/rendering
- Performance & SEO lab: https://clubpulse-live.onrender.com/labs/performance
- Syllabus map: [SYLLABUS-COVERAGE.md](./SYLLABUS-COVERAGE.md)
- Free hosting setup: [FREE-HOSTING-HINGLISH.md](./FREE-HOSTING-HINGLISH.md)

## Run locally

Requirements: Node.js 22+ and a PostgreSQL connection string.

1. Copy `.env.example` to `.env.local`.
2. Put your own PostgreSQL connection string in `DATABASE_URL`. Keep it secret; never commit environment files.
3. From this folder run:

```bash
npm install
npm test
npm run build
npm start
```

Open http://localhost:10000. To develop with hot reload, run `npm run dev` in one terminal and `npm --prefix react-app run dev` in another. The Vite SPA development server is normally http://localhost:5173 and requests APIs from the same origin by default; for local split-port development, configure a Vite proxy or use the deployed same-origin app.

## Database setup

The first successful database request creates the tables and runs a one-time cleanup of identifiable legacy demo records. No synthetic clubs, members, tasks, or feedback are inserted. The app does **not** report “connected” until it can actually connect to PostgreSQL. Visit `/api/health` after setting `DATABASE_URL`.

For $0/month demo hosting, use Neon Free for PostgreSQL and Render Free for the web service. Free services can sleep and usage limits/terms may change. Follow [FREE-HOSTING-HINGLISH.md](./FREE-HOSTING-HINGLISH.md); do not use Render's 30-day-expiring free database for a long-running demo. A Neon connection URL must be added as the Render Environment variable `DATABASE_URL`; never put credentials in GitHub, chat, or screenshots.

## Account roles

- **Admin**: workspace administration and member role changes.
- **Lead**: club/task/recruitment/feedback management and analytics.
- **Member**: submit feedback, view allowed club/task information, and apply to openings using their authenticated account identity.

For a fresh demo database, the first registered account becomes the initial administrator. This is a bootstrap convenience for coursework, **not a production identity policy**. For real campus use, replace the public first-user bootstrap with verified institution-admin provisioning, then review rate limiting, CSRF/origin protections, logging, retention, backup and authorization policy.

## Sample data and privacy

Use records that you are authorized to enter. Do not place real student personal data, real feedback, passwords or campus-private material in this public demo unless your institution has approved the use and privacy controls. Feedback averages are hidden until at least five rated responses exist. Workload/activity indicators are supportive check-in prompts—not burnout diagnoses or a measure of personal worth.

## CSV task import

Lead/admin accounts can import up to 100 task rows from a CSV file (maximum 1 MB). Required headers:

```csv
title,owner,due_date,priority,club_id
Prepare workshop agenda,Demo Member,2026-11-03,Medium,
```

`club_id` is optional; blank values use the first existing club. The server validates all rows before writing and uses a transaction for task + contribution-event creation. Use synthetic data only. A downloadable template is available inside the task page.

## Important operational note

This is a course/demo implementation, not a production-certified campus SaaS. Authentication and role checks are implemented, but real deployment still needs verified institution identities, anti-abuse controls, security review, legal/privacy review, backups, monitoring and user validation. A successful build is not proof the database is connected; verify `/api/health`.


## Authentication and security configuration

- Password accounts use bcrypt hashes and a 12-character minimum; new accounts start with the `member` role, not administrator.
- Session tokens are random, stored as SHA-256 digests in PostgreSQL, and delivered in HttpOnly/SameSite cookies. Authentication endpoints use PostgreSQL-backed rate limits and stricter production Origin checks.
- Google sign-in verifies ID tokens server-side and requires a verified Google email. Set `GOOGLE_CLIENT_ID` and `NEXT_PUBLIC_GOOGLE_CLIENT_ID` for Next.js, and `VITE_GOOGLE_CLIENT_ID` for React/Vite. Use the same Web OAuth Client ID and add `https://clubpulse-live.onrender.com` as an authorized JavaScript origin in Google Cloud Console.
- Existing password accounts can link Google after signing in from **Account security**. That page also supports revoking all sessions.
- For a fresh database, initial admin provisioning requires `BOOTSTRAP_ADMIN_EMAIL` and a random `BOOTSTRAP_ADMIN_SECRET` of at least 32 characters. Enable the optional bootstrap field only during setup, then disable the public flags and remove/rotate the secret. Never commit actual secrets.
- These are application controls, not a formal security certification. Before production campus use, add verified email or institutional SSO/invites, monitoring, backups/retention, and a professional security review.
