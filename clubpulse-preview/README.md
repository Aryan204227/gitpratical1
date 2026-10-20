# ClubPulse — Club Contribution OS (INT252 + INT257 · P18)

ClubPulse addresses the “Ghost Members and Burnout Leads” problem: club work can get concentrated among a few active leads, while students cannot easily tell whether a club delivers what it promises.

The product workflow is:

**Club profile & recruitment → applications → member onboarding → task assignment → contribution events → feedback & club analytics**

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

The first successful authenticated database request creates the tables and synthetic seed records. The app does **not** report “connected” until it can actually connect to PostgreSQL. Visit `/api/health` after setting `DATABASE_URL`.

For $0/month demo hosting, use Neon Free for PostgreSQL and Render Free for the web service. Free services can sleep and usage limits/terms may change. Follow [FREE-HOSTING-HINGLISH.md](./FREE-HOSTING-HINGLISH.md); do not use Render's 30-day-expiring free database for a long-running demo. A Neon connection URL must be added as the Render Environment variable `DATABASE_URL`; never put credentials in GitHub, chat, or screenshots.

## Account roles

- **Admin**: workspace administration and member role changes.
- **Lead**: club/task/recruitment/feedback management and analytics.
- **Member**: submit feedback, view allowed club/task information, and apply to openings using their authenticated account identity.

For a fresh demo database, the first registered account becomes the initial administrator. This is a bootstrap convenience for coursework, **not a production identity policy**. For real campus use, replace the public first-user bootstrap with verified institution-admin provisioning, then review rate limiting, CSRF/origin protections, logging, retention, backup and authorization policy.

## Sample data and privacy

Seed records use clearly synthetic demonstration names and addresses. Do not place real student personal data, real feedback, passwords or campus-private material in this public demo. Feedback averages are hidden until at least five rated responses exist. Workload/activity indicators are supportive check-in prompts—not burnout diagnoses or a measure of personal worth.

## CSV task import

Lead/admin accounts can import up to 100 task rows from a CSV file (maximum 1 MB). Required headers:

```csv
title,owner,due_date,priority,club_id
Prepare workshop agenda,Demo Member,2026-11-03,Medium,
```

`club_id` is optional; blank values use the first existing club. The server validates all rows before writing and uses a transaction for task + contribution-event creation. Use synthetic data only. A downloadable template is available inside the task page.

## Important operational note

This is a course/demo implementation, not a production-certified campus SaaS. Authentication and role checks are implemented, but real deployment still needs verified institution identities, anti-abuse controls, security review, legal/privacy review, backups, monitoring and user validation. A successful build is not proof the database is connected; verify `/api/health`.
