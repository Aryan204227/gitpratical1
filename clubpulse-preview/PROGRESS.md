# ClubPulse Engineering Progress

Base: `main` at `972b1fd3e7d3f39d7c792b6559a217f7eb81a0b9`
Working branch: `step-1-migrations`
Production database/deployment: untouched.

## Step 0 — Baseline

Status: **Verified through GitHub Actions; not run locally in this environment.**

GitHub Actions run: [43584406260](https://github.com/Aryan204227/gitpratical1/actions/runs/43584406260)
Commit: `972b1fd3e7d3f39d7c792b6559a217f7eb81a0b9`
Node: 22.23.4; npm: 10.9.9.

- `npm test`: 34 passed, 0 failed.
- Next.js and React type-checks passed.
- React SPA production build passed (Vite 7.3.7).
- Next.js production build passed (Next.js 16.4.4, webpack).
- CI dependency installation and task verifier syntax check passed.
- `npm run lint` is currently only `tsc --noEmit`; real ESLint remains outstanding.
- React bundle warning: 543.95 kB minified JS chunk (>500 kB).
- Vite Zod PURE annotation warnings; Next Edge Runtime deprecation/no build cache; Node `punycode` deprecation.
- Local npm execution was unavailable because this environment could not resolve github.com for git clone.

## Step 1 — Versioned migrations and backup

Status: **Partially implemented; baseline migration blocked by missing safe schema source.**

Changes on this branch:
- Added `scripts/backup-database.mjs`.
- Added `npm run backup:db`.
- Added `migrations/README.md` documenting the safe baseline/adoption process and why the baseline must be captured from an exact database schema rather than guessed from `ensureDatabase()`.

Verification:
- Not yet run. This environment has no checked-out repository, PostgreSQL instance, `pg_dump` binary or development database connection.
- No migration runner, `0001_baseline.sql`, or startup switch has been added.
- Reason: `ensureDatabase()` contains both DDL and data mutations (including a synthetic-data cleanup transaction and owner backfill). Copying it blindly into a baseline would risk data loss or schema drift. The actual current database schema must be captured and compared on a disposable clone first.

## Carried-forward blockers

- Club-scoped authorization is inconsistent across API routes (C1).
- Feedback privacy and one-per-period identity ledger are incomplete (C2).
- Task/contribution ownership is name-based (C3).
- Recruitment seats/deadlines/decision notes and transactional acceptance are incomplete.
- Contribution review and append-only status/review history are incomplete.
- Per-club Pulse/Ghost settings and exact workload formula are incomplete.
- CSV report export is missing.
- Seed script contains destructive deletes and must not run against production.
- Render was observed two commits behind main during the baseline audit; no deployment was triggered.

## Next

1. Capture schema from a disposable PostgreSQL clone and complete/test migration 0001 plus the runner.
2. Then proceed to Step 2 authorization and Zod validation.
3. Stop at the Step 2, Step 3 and Step 4 checkpoints as required by the work order.
4. Final deployment plan only; do not deploy without explicit approval.
