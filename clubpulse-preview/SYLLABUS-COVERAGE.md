# Syllabus Coverage Matrix — ClubPulse P18 (INT252 + INT257)

This workspace intentionally includes two complementary apps:
- Native Next.js App Router product at `/`
- React + Vite SPA at `/react/index.html#/`

Both use the same same-origin Route Handlers and database schema. Keep demo records synthetic until an appropriate campus deployment has been reviewed.

## INT252 — React
| Unit | Implemented evidence |
|---|---|
| I · JavaScript + React fundamentals | React/Vite project, JSX/functional components, immutable array transformations, spread/destructuring/referential equality lab |
| II · Component design + styling | reusable Primitives, Modal, Panel, semantic forms/tables, Tailwind CSS v4 integration, responsive accessible design system |
| III · State/events/hooks | useState, useEffect + cleanup explanation, useCallback/useMemo, Context theme, custom hooks, rules-of-hooks patterns |
| IV · Forms + validation | controlled forms, submit workflows, Zod schemas and server-side validation |
| V · APIs + routing | Axios/Fetch, React Query loading/error/empty, cache invalidation, React Router routes including `/clubs/:id` |
| VI · Global state + deploy | Context, Redux Toolkit slice + selectors, Zustand, production Vite build bundled into Render Next.js service, React DevTools/Profiler guidance |

## INT257 — Next.js
| Unit | Implemented evidence |
|---|---|
| I · App Router + navigation | file-based workspace routes, nested route group layout, dynamic club/task IDs, loading/error/not-found UI and proxy-based redirect |
| II · rendering + data | server-rendered private data pages, statically pre-rendered landing/localized pages, `/rendering-demo` ISR example, React CSR SPA, no-store private APIs |
| III · API + actions | Route Handlers for GET/POST/PATCH/DELETE, dynamic handlers, Zod form validation, Server Actions, bounded CSV upload, transactional import and optimistic/client-side async interaction |
| IV · auth + database | hashed passwords, HttpOnly session cookie, session hashes in PostgreSQL, RBAC, parameterized CRUD queries, env-based DB URL |
| V · performance + SEO | Metadata API, route splitting, semantic UI, production build, environment variables, health API and operational caveats |
| VI · advanced + industry practice | Edge-runtime stateless API, EN/HI static routes, proxy, a real @insights parallel slot and intercepted club modal |

## Pulse & Ghost specification coverage

| Requirement | Current evidence | Notes |
|---|---|---|
| Ink-navy + lime + ember + ghost visual system | `app/globals.css`, `app/page.tsx`, `react-app/src/styles.css` | Applied to the Next.js homepage/workspace and React/Vite SPA. |
| Weighted contribution scoring + 14-day decay | `lib/scoring.mjs`, `tests/scoring.test.mjs` | Pure functions with unit tests. |
| Active / Drifting / Ghost thresholds, break override | `lib/scoring.mjs`, `lib/read-model.ts`, dashboard Ghost Radar | Uses persisted contribution timestamps and member break metadata. |
| Workload Gini, top-two share and risk signal | `lib/scoring.mjs`, dashboard Burnout Watch | Uses persisted open/overdue task records and break date. |
| Weekly one-tap mood pulse, per-user update and privacy threshold | `app/api/mood/route.ts`, `components/MoodPulseForm.tsx`, `mood_pulses` table in `lib/db.ts` | One response per user/week; group averages are suppressed until 5 responses. |
| Seeded scenario for demonstration | `lib/db.ts` | Six clubs, ~70 synthetic members, 105 tasks and 90-day history. |
| Mood history in the burnout risk formula | Partially implemented | Weekly pulse is collected and group-private; the current dashboard risk formula intentionally does not incorporate mood trend history yet. |
| Drag/drop task board, task comments/attachments/subtasks and automated email | Not yet implemented | Existing task status editing, CSV import and contribution events remain the implemented workflow. |

## Important implementation notes
- A build passing does not prove the database is connected. `/api/health` must report `database: "connected"` after `DATABASE_URL` is set.
- The default seed records are synthetic demonstration data.
- The first registered user on a fresh schema is assigned administrator role as a bootstrap convenience. For a real campus deployment, disable public administrator bootstrap and review identity verification, rate limiting, CSRF, audit retention and access policies.
- Edge runtime route deliberately makes no database calls. PostgreSQL handlers use the Node.js runtime.
- ISR/static rendering is only for public non-sensitive content. Member and feedback data is dynamically server-rendered and protected by authorization.
- Free hosting can sleep and has usage caps. There is no provider-independent lifetime uptime guarantee.
