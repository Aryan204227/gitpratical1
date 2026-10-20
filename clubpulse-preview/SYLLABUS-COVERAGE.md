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
| III · API + actions | Route Handlers for GET/POST/PATCH/DELETE, dynamic handlers, Zod form validation, Server Actions, optimistic/client-side async interaction |
| IV · auth + database | hashed passwords, HttpOnly session cookie, session hashes in PostgreSQL, RBAC, parameterized CRUD queries, env-based DB URL |
| V · performance + SEO | Metadata API, route splitting, semantic UI, production build, environment variables, health API and operational caveats |
| VI · advanced + industry practice | Edge-runtime stateless API lab, EN/HI static routes, proxy, route handlers, testing docs, parallel/intercepting route extension patterns in architecture lab |

## Important implementation notes
- A build passing does not prove the database is connected. `/api/health` must report `database: "connected"` after `DATABASE_URL` is set.
- The default seed records are synthetic demonstration data.
- The first registered user on a fresh schema is assigned administrator role as a bootstrap convenience. For a real campus deployment, disable public administrator bootstrap and review identity verification, rate limiting, CSRF, audit retention and access policies.
- Edge runtime route deliberately makes no database calls. PostgreSQL handlers use the Node.js runtime.
- ISR/static rendering is only for public non-sensitive content. Member and feedback data is dynamically server-rendered and protected by authorization.
- Free hosting can sleep and has usage caps. There is no provider-independent lifetime uptime guarantee.
