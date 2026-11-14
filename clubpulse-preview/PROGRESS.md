# ClubPulse Engineering Progress

Base: `main` at `972b1fd3e7d3f39d7c792b6559a217f7eb81a0b9`
Working branch: `step-0-baseline-progress`
Production database/deployment: untouched.

## Step 0 — Baseline

Status: **Verified through GitHub Actions; not run locally in this environment.**

GitHub Actions run: [43584406260](https://github.com/Aryan204227/gitpratical1/actions/runs/43584406260)
Commit: `972b1fd3e7d3f39d7c792b6559a217f7eb81a0b9`
Node: 22.23.4; npm: 10.9.9.

Completed successfully:
- Dependency installation (root and React SPA)
- `node --check scripts/verify-task-clubid.mjs`
- `npm test`: 34 passed, 0 failed
- Type-check Next.js and React applications
- React SPA production build (Vite 7.3.7)
- Next.js production build (Next.js 16.4.4, webpack)

Warnings observed:
- React SPA bundle has a 543.95 kB minified JS chunk (>500 kB warning).
- Vite reports removable PURE-comment annotation warnings in Zod.
- Next.js reports Edge Runtime deprecation and no build cache.
- Node reports the deprecated `punycode` module.
- Current `npm run lint` is only `tsc --noEmit`; ESLint is not configured.

Local execution limitation: this environment cannot resolve github.com for `git clone`; no local npm run is claimed.

## Step 1 — Versioned migrations and backup

Status: **Not started.**

Safety reason: production has real data and the existing `ensureDatabase()` includes a one-time cleanup transaction. A baseline migration must be tested against a disposable/dev PostgreSQL database before switching startup behavior. No production migration or seed was run.

## Known blockers carried forward

- Club-scoped authorization is inconsistent across API routes.
- Feedback privacy and one-per-period identity ledger are incomplete.
- Task/contribution ownership is name-based.
- Recruitment capacity/deadline/decision notes and transactional acceptance are incomplete.
- Contribution review and append-only status/review history are incomplete.
- Per-club Pulse/Ghost settings and exact workload formula are incomplete.
- CSV report export is missing.
- Seed script contains destructive deletes and must not run against production.
- Render is two commits behind main at the time of audit; no deployment was triggered.

## Next safe actions

1. Create and test versioned baseline migrations on disposable PostgreSQL.
2. Add a verified `pg_dump` backup script and document restore.
3. Do not switch production startup to migrations until the baseline is verified.
4. Proceed to authorization only after migration foundation passes checks.
