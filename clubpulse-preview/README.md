# ClubPulse — See who's showing up. Protect who's burning out. (INT252 + INT257 · P18)

ClubPulse uses the Pulse & Ghost concept to address “Ghost Members and Burnout Leads”: it makes participation recency visible, highlights concentrated task ownership, gives students a route to check in, and helps clubs compare recorded delivery with what they promise.

The product workflow is:

**Create a club → add students or publish an opening → student registers with the same email → assign a task with a clear work brief → update progress → attach real work photos → record completion → review feedback and workload.**

### How to add real students in the Live Workspace

1. Sign in as a club lead or administrator and open **Members**.
2. Enter the student's name, college email and club, then choose **Add student to club**. This saves the membership in PostgreSQL; it does not create a password.
3. Ask the student to open **Register** and create their own account using the exact same email address. If the account already exists for that email, it links to the member record.
4. Administrators can assign account access from **People & Roles**. A Club Lead is given access only to clubs where their roster role is **Club Lead** or which they created themselves.
5. Open **Tasks**, choose the club, select that saved student, set the deadline, priority and effort (1–5), then save.
6. The student signs in, opens **My Tasks**, changes the status as work progresses and marks it **Completed** when finished. The completion creates an effort-based contribution event in PostgreSQL.

A student email can have one primary club membership in this version. Demo Mode is separate and uses temporary sample data; its changes do not update PostgreSQL.

### Task work evidence

Students assigned to a task, the club lead and administrators can attach real progress or completion photos to that task. JPG, PNG and WebP files up to 2 MB are checked against their file signatures and stored as private PostgreSQL records. Images are served only to signed-in users who can access the task; no stock photos or fabricated activity images are inserted.

---

## Academic Course Outcomes (INT252)

- **CO4 (React forms with client-side validation):**  
  Controlled and uncontrolled forms with multi-field validation, disabled state during pending mutations, and Zod schema validation across recruitment, task, and feedback flows (`react-app/src/pages/WorkspacePages.tsx`, `lib/schemas.ts`).
- **CO5 (Client-side routing and API-based data fetching):**  
  Client routing using React Router v7 (`#/clubs/:id`, `#/tasks/:id`) and data fetching using native Fetch API and Axios, orchestrated by TanStack React Query for caching and optimistic rollback (`react-app/src/App.tsx`, `react-app/src/api/client.ts`).
- **CO6 (Shared state management in React):**  
  Multi-store shared state architecture: React Context for auth/theme, Redux Toolkit for task filters, and Zustand for UI layout preferences (`react-app/src/state/`).

---

## Pulse & Ghost Scoring & FairWork Engine

The dashboard computes member signals from saved contribution events and declared weekly hours (`lib/scoring.mjs`, `lib/read-model.ts`). FairWork separately analyses recorded task workload (`lib/fairwork.ts`):

- **Contribution points** = task effort (1–5) × timeliness (on-time 1.0, late 0.6) × review multiplier (clamped to 0.8–1.2). The current task completion flow uses a review multiplier of 1.0 because a separate review score is not yet captured.
- **Pulse score** = decayed contribution points ÷ (declared weekly hours × 1.25) × 100, rounded and clamped to 0–100. Each event uses a 14-day half-life: `points × 0.5^(ageDays / 14)`.
- **Member signal:** Active ≥ 60; Drifting 30–59; Ghost < 30 or no contribution for 21 days; On Break overrides these labels while active.
- **FairWork Workload Gini & Burnout Watch:** Quantifies task inequality on a 0–100 scale, flags overloaded leads ($>2\times$ median load + overdue ratio), and suggests rebalancing.
- **Feedback Privacy:** Group averages are suppressed until at least 5 ratings exist to protect member anonymity.

---

## Architecture

This repository has two complementary frontends sharing the same Next.js Route Handlers and PostgreSQL database:

- **Native Next.js App Router** at `/`: server-rendered protected workspace, Server Actions, metadata, dynamic pages, loading/error UI, parallel and intercepted routes, public SSG/ISR examples, and REST Route Handlers.
- **React + Vite SPA** at `/react/index.html#/`: reusable React components, React Router, hooks, Context, Redux Toolkit, Zustand, Axios, TanStack Query, Zod and optimistic updates.
- **Backend & Database:** Next.js Route Handlers, PostgreSQL using parameterized SQL (`pg.Pool`), session-level advisory locks (`SELECT pg_advisory_lock(982341)`), Zod validation, bcrypt password hashing, and hashed HTTP-only session cookies.
- **Database Architecture Note:** The project intentionally uses direct parameterized SQL queries rather than an ORM binary (e.g. Prisma) to eliminate serverless cold-start delays on free hosting tiers, ensure complete mathematical transparency in Gini/decay formulas, and guarantee SQL injection immunity.

---

## Quick Links

- Production App: https://clubpulse-live.onrender.com
- Health endpoint: https://clubpulse-live.onrender.com/api/health
- React + Vite SPA: https://clubpulse-live.onrender.com/react/index.html#/
- Rendering lab: https://clubpulse-live.onrender.com/labs/rendering
- Performance & SEO lab: https://clubpulse-live.onrender.com/labs/performance
- Syllabus map: [SYLLABUS-COVERAGE.md](./SYLLABUS-COVERAGE.md)
- Free hosting guide: [FREE-HOSTING-HINGLISH.md](./FREE-HOSTING-HINGLISH.md)

---

## Run Locally

Requirements: Node.js 22+ and a PostgreSQL database.

1. Copy `.env.example` to `.env.local`.
2. Add your PostgreSQL connection string in `DATABASE_URL`.
3. Run:

```bash
npm install
npm test
npm run build
npm start
```

Open http://localhost:10000. To develop with hot reload, run `npm run dev` in one terminal and `npm --prefix react-app run dev` in another.

---

## External Integrations & Configuration Status

| Integration | Implementation | Status | Note |
|---|---|---|---|
| **PostgreSQL Database** | Implemented via `pg.Pool` with advisory locks | **Active** | `/api/health` validates connection. |
| **Google OAuth Sign-In** | Code complete in `app/api/auth/google/route.ts` | **Externally Blocked** | Requires valid `NEXT_PUBLIC_GOOGLE_CLIENT_ID` in Google Cloud Console. |
| **SMTP Password Delivery** | Reset workflow implemented | **Externally Blocked** | Requires configured SMTP credentials. Until configured, production password-reset emails cannot be delivered. |

---

## Account Roles

- **Admin**: Workspace administration and member role changes.
- **Lead**: Club, task, recruitment, feedback management, FairWork engine, and analytics.
- **Member**: Submit feedback, view club details, track personal tasks, and apply to openings using their authenticated account identity.
