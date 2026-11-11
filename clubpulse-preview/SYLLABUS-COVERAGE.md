# Syllabus Coverage & Academic Architecture Matrix — ClubPulse P18 (INT252 + INT257)

**Project Identifier:** P18  
**Project Title:** Ghost Members and Burnout Leads: Club Contribution Management  
**University Courses:** INT252 (React) & INT257 (Next.js) — Academic Session 2026–27  
**Architecture:** Shared PostgreSQL database, dual-frontend system:
1. **Next.js Full-Stack App Router Product** (`clubpulse-preview/` at `/`)
2. **React 19 + Vite SPA** (`clubpulse-preview/react-app/` at `/react/index.html#/`)

Both applications consume the same backend API Route Handlers, Server Actions, PostgreSQL persistence layer, and security models.

---

## 1. Official INT252 Course Outcomes (CO4, CO5, CO6) Verification

| Course Outcome | Official Syllabus Definition | Implementation & Code Evidence | Verified File Path & Line Reference |
|---|---|---|---|
| **CO4** | **React forms with client-side validation** | Controlled and uncontrolled forms with multi-field validation, disabled state during pending mutations, and Zod schema validation. Implemented across recruitment applications, task creation, member feedback, and an interactive forms lab comparing controlled state vs direct DOM access. | `react-app/src/pages/WorkspacePages.tsx` (lines 61–65, 95–96, 130–133, 156–159, 185–190, 203–205)<br>`lib/schemas.ts` (lines 1–45)<br>`react-app/src/components/Primitives.tsx` (lines 53–61) |
| **CO5** | **Client-side routing and API-based data fetching** | Declarative client routing using React Router v7 (`HashRouter`, `Routes`, `Route`, `useParams`) with dynamic paths (`#/clubs/:id`, `#/tasks/:id`). Asynchronous data fetching using native Fetch API and Axios (`axios.create`) orchestrated by TanStack React Query (`useQuery`, `useMutation`, optimistic rollback, background cache revalidation). | `react-app/src/App.tsx` (lines 20–30, 35–50)<br>`react-app/src/pages/WorkspacePages.tsx` (lines 73–82, 98–109, 201–209)<br>`react-app/src/hooks/useWorkspaceQuery.ts` (lines 3–12)<br>`react-app/src/api/client.ts` (lines 1–6) |
| **CO6** | **Shared state management in React** | Multi-paradigm shared state architecture: React Context API (`createContext`, `useContext`) for cross-cutting theme and authentication sessions; Redux Toolkit (`configureStore`, `createSlice`, typed dispatch, selectors) for global task filter state; and Zustand (`create`) for lightweight UI layout preferences. | `react-app/src/state/theme.tsx` (lines 3–10)<br>`react-app/src/state/auth.tsx` (lines 6–16)<br>`react-app/src/state/store.ts` (lines 1–5)<br>`react-app/src/state/taskFilterSlice.ts` (lines 1–18)<br>`react-app/src/state/uiStore.ts` (lines 1–3)<br>`react-app/src/pages/WorkspacePages.tsx` (lines 175, 187) |

---

## 2. INT252 — React Detailed Syllabus Compliance Matrix (Units I – VI)

| Unit & Topic | Academic Scope | Implementation Details in ClubPulse | Verified File Path & Exact Lines |
|---|---|---|---|
| **Unit I: JavaScript & React Fundamentals** | ES6+ syntax, arrow functions, immutability, array transformations (`map`, `filter`, spread/rest), shallow vs deep copying, referential equality, Virtual DOM and reconciliation. | Pure scoring functions use immutable operations and mathematical decay. Dedicated interactive lab displays live shallow vs deep cloning and tests referential equality dynamically (`shallowCopy.settings === baseProfile.settings` vs `deepCopy.settings === baseProfile.settings`). React 19 functional components render cleanly with JSX. | `lib/scoring.mjs` (lines 1–137)<br>`react-app/src/pages/WorkspacePages.tsx` (lines 188–201)<br>`react-app/src/App.tsx` (lines 20–56) |
| **Unit II: Component Design & Styling** | Component composition, atomic primitives, semantic data tables, dialog modals, responsive layouts, Tailwind CSS v4 utility patterns, theme design tokens. | Reusable atomic primitives (`PageHeading`, `Button`, `StatusPill`, `LoadingState`, `ErrorState`, `EmptyState`, `SearchInput`, `Panel`, `InlineAlert`) styled with Tailwind CSS v4 utility classes and theme tokens (`--bg`, `--violet`, `--amber`, `--pink`). Accessible Modal component with Escape key listener and backdrop click dismiss. | `react-app/src/components/Primitives.tsx` (lines 4–86)<br>`react-app/src/components/Modal.tsx` (lines 1–22)<br>`react-app/src/styles.css` (lines 1–25)<br>`react-app/src/components/WorkspaceLayout.tsx` (lines 1–65) |
| **Unit III: State, Events & Lifecycle Hooks** | `useState`, `useEffect` with cleanup, `useCallback`, `useMemo`, custom hooks, Rules of Hooks, event handlers. | `useState` and `useCallback` for memoized handlers; `useMemo` for derived member roster filtering and workload calculations; `useEffect` with cleanup (timer clearance and AbortController request aborting). Custom hooks: `useWorkspaceQuery` (React Query wrapper), `useApiHealth` (AbortController cleanup), `useTheme`, `useAuth`, `useUiStore`. | `react-app/src/pages/WorkspacePages.tsx` (lines 176–184)<br>`react-app/src/hooks/useWorkspaceQuery.ts` (lines 3–12)<br>`react-app/src/hooks/useApiHealth.ts` (lines 4–15)<br>`react-app/src/state/theme.tsx` (line 10)<br>`react-app/src/state/auth.tsx` (line 16) |
| **Unit IV: Forms, Validation & Controlled/Uncontrolled Inputs** | Controlled forms, uncontrolled forms (`useRef`), multi-field state, submit workflows, client-side validation using Zod. | Controlled forms validate applicant submissions, task assignments, and club profiles with Zod schemas and inline alerts. Uncontrolled form implementation uses `useRef<HTMLInputElement>` to read DOM values on submit without causing component re-renders. | `react-app/src/pages/WorkspacePages.tsx` (lines 61–65, 95–96, 130–133, 156–159, 185–190, 203–205)<br>`lib/schemas.ts` (lines 1–45) |
| **Unit V: APIs, Client Routing & Data Fetching** | Native Fetch API, Axios client, TanStack React Query, caching, optimistic rollback, React Router dynamic routes. | Native `fetch('/api/health')` tested in parallel with `axios.create` client. React Query manages query caches, background refetching, and optimistic updates (`onMutate`, `onError`, `onSettled`). React Router v7 routes handle dynamic parameters (`/clubs/:id`, `/tasks/:id`). | `react-app/src/App.tsx` (lines 35–50)<br>`react-app/src/pages/WorkspacePages.tsx` (lines 73–82, 98–109, 201–209)<br>`react-app/src/api/client.ts` (lines 1–6) |
| **Unit VI: Shared State, React Profiler & Production Build** | React Context, Redux Toolkit (`createSlice`, selectors), Zustand, React Profiler, Vite production compilation. | Multi-store architecture: Context for auth/theme, Redux Toolkit for task filters, Zustand for sidebar state. React `Profiler` (`<Profiler id="ReactLabProfiler" onRender={...}>`) measures and displays live component commit times in milliseconds. Node build script bundles SPA into Next.js `/public/react/`. | `react-app/src/state/theme.tsx` (lines 1–10)<br>`react-app/src/state/auth.tsx` (lines 1–16)<br>`react-app/src/state/store.ts` (lines 1–5)<br>`react-app/src/state/taskFilterSlice.ts` (lines 1–18)<br>`react-app/src/state/uiStore.ts` (lines 1–3)<br>`react-app/src/pages/WorkspacePages.tsx` (lines 1, 191–194, 212)<br>`scripts/build-react.mjs` (lines 1–20) |

---

## 3. INT257 — Next.js Detailed Syllabus Compliance Matrix (Units I – VI)

| Unit & Topic | Academic Scope | Implementation Details in ClubPulse | Verified File Path & Exact Lines |
|---|---|---|---|
| **Unit I: App Router & Navigation** | Directory structure, route group `(workspace)`, layout composition, loading, error, not-found UI, proxy protection, dynamic routes. | File-based App Router structure with nested workspace layout (`layout.tsx`), error boundaries (`error.tsx`), 404 handler (`not-found.tsx`), proxy-based session redirection (`proxy.ts`), and dynamic routes (`/clubs/[id]`, `/tasks/[id]`). | `app/layout.tsx` (lines 1–28)<br>`app/(workspace)/layout.tsx` (lines 1–27)<br>`app/error.tsx` (lines 1–18)<br>`app/not-found.tsx` (lines 1–20)<br>`proxy.ts` (lines 1–26)<br>`app/(workspace)/clubs/[id]/page.tsx` (lines 1–165)<br>`app/(workspace)/tasks/[id]/page.tsx` (lines 1–110) |
| **Unit II: Rendering Strategies & Data Fetching** | Server Components (RSC), Client Components (`"use client"`), SSR, SSG, ISR. | Private dashboard fetches database records on the server via RSC for zero client bundle bloat; localized landing routes pre-rendered via SSG (`generateStaticParams`); `/rendering-demo` implements ISR with `revalidate = 60`; interactive widgets marked with `"use client"`. | `app/(workspace)/dashboard/page.tsx` (lines 1–541)<br>`app/[locale]/page.tsx` (lines 1–40)<br>`app/rendering-demo/page.tsx` (lines 1–45)<br>`components/NextAppShell.tsx` (line 1)<br>`components/NextAuthForm.tsx` (line 1) |
| **Unit III: Route Handlers & Server Actions** | REST Route Handlers (GET/POST/PATCH/DELETE), Server Actions (`"use server"`), CSV upload, transactional import. | REST Route Handlers support full CRUD with Zod validation. Server Actions in `app/actions.ts` handle task reassignment (`reassignTaskAction`) and club creation. Bounded CSV upload stream parses headers and imports rows transactionally. | `app/api/tasks/route.ts` (lines 1–40)<br>`app/api/tasks/[id]/route.ts` (lines 1–35)<br>`app/api/clubs/route.ts` (lines 1–30)<br>`app/actions.ts` (lines 1–118)<br>`app/api/import/tasks/route.ts` (lines 1–58) |
| **Unit IV: Authentication, Security & Database Operations** | Hashed session cookies, bcrypt password hashing, RBAC, single-use password reset tokens, parameterized PostgreSQL SQL, ORM fundamentals. | SHA-256 session tokens stored in HttpOnly, SameSite=Lax, Secure cookies; bcrypt (12 rounds); RBAC enforcement; single-use password recovery tokens with session revocation; parameterized PostgreSQL operations with advisory locks. *(See Academic ORM Analysis below).* | `lib/auth.ts` (lines 1–120)<br>`lib/rate-limit.ts` (lines 1–60)<br>`lib/db.ts` (lines 1–187)<br>`app/api/auth/login/route.ts` (lines 1–62)<br>`app/api/auth/forgot-password/route.ts` (lines 1–64)<br>`app/api/auth/reset-password/route.ts` (lines 1–92) |
| **Unit V: Performance Optimization & SEO** | Metadata API, route splitting, semantic HTML5, `robots.ts`, `sitemap.ts`, health check. | Metadata API injects dynamic title/description tags; route-level bundle splitting verified by production build; `robots.ts` and `sitemap.ts` dynamic generators; `/api/health` system readiness probe checking live PostgreSQL clock. | `app/layout.tsx` (lines 8–18)<br>`app/robots.ts` (lines 1–16)<br>`app/sitemap.ts` (lines 1–22)<br>`app/api/health/route.ts` (lines 1–60) |
| **Unit VI: Advanced Routing & Enterprise Features** | Intercepting routes (`(.)`), parallel slots (`@insights`, `@modal`), Edge runtime, internationalization (i18n), concurrency locks. | Intercepted route modal at `@modal/(.)clubs/[id]/page.tsx` displays quick club previews; `@insights` parallel route slot; Edge runtime stateless endpoint at `/api/edge-health`; localized routing via `/[locale]`; PostgreSQL session advisory locks. | `app/(workspace)/@modal/(.)clubs/[id]/page.tsx` (lines 1–98)<br>`app/(workspace)/layout.tsx` (lines 10–25)<br>`app/(workspace)/@insights/dashboard/page.tsx` (lines 1–40)<br>`app/api/edge-health/route.ts` (lines 1–15)<br>`app/[locale]/page.tsx` (lines 1–40)<br>`lib/db.ts` (lines 25–35) |

---

## 4. Academic Deep-Dive: ORM Fundamentals vs Parameterized SQL Architecture

### Academic Concept & Design Patterns
An **Object-Relational Mapping (ORM)** system bridges the conceptual impedance mismatch between object-oriented programming languages and relational databases.

1. **Active Record Pattern (e.g., Prisma, Ruby on Rails ActiveRecord):**  
   An entity instance encapsulates both data row values and database operations (e.g., `user.save()`, `User.findUnique()`).
2. **Data Mapper Pattern (e.g., TypeORM, Hibernate):**  
   Separates domain entities from database persistence repositories, keeping business logic decoupled from SQL schema mechanics.

### Architectural Comparison

| Dimension | Modern ORM Framework (e.g. Prisma / Drizzle) | Parameterized PostgreSQL SQL Pool (`pg`) in ClubPulse |
|---|---|---|
| **Abstraction Level** | High: queries generated by an intermediary engine. | Direct: explicit SQL queries with `$1, $2` bind parameters. |
| **SQL Injection Defense** | Handled automatically by query generation library. | Cryptographically enforced by PostgreSQL wire-protocol parameterization. |
| **Type Safety** | Automated: generated models from external schema files. | Explicit: TypeScript interfaces (`lib/types.ts`) paired with runtime Zod validation (`lib/schemas.ts`). |
| **Cold-Start Performance** | Binary engine overhead (Prisma) increases serverless cold-start latency on free hosting tiers. | Zero binary overhead; instantaneous connection pooling via lightweight `pg.Pool`. |
| **Complex Math Transparency** | Complex statistical aggregations (Gini coefficient, 14-day exponential half-life decay) require raw SQL escape hatches. | 100% transparent: Direct execution of window functions, CTEs, and mathematical formulas without abstraction loss. |
| **Database Migrations** | CLI migration tools (`prisma migrate dev`). | Programmatic schema initialization guarded by PostgreSQL session-level advisory locks (`SELECT pg_advisory_lock(982341)`) in `lib/db.ts`. |

### Architectural Decision for ClubPulse
ClubPulse uses **direct parameterized queries via `pg.Pool`** with PostgreSQL session advisory locks. This provides complete mathematical transparency, eliminates serverless cold-start penalties on Render and Neon free tiers, and guarantees total protection against SQL injection without unnecessary ORM dependencies.

---

## 5. Problem Statement P18: Three Core Modules Verification

### Module 1: Club & Recruitment Service
- **Club Management:** Club creation, categorization, leadership assignment, and dynamic club detail profiles (`/clubs/[id]`).
- **Recruitment Campaigns:** Open role publication, requirements, deadline tracking, and open/closed state management.
- **Application Review Pipeline:** Student application submission, multi-stage review (Pending -> Reviewing -> Accepted/Rejected).
- **Automated Member Onboarding:** Converting accepted applicants into active club members with role assignment (`lib/read-model.ts`, `app/actions.ts`).

### Module 2: Task & Contribution Service
- **Task Lifecycle:** Priority weighting (Low, Medium, High, Urgent), effort points (1–5), deadlines, and member assignment.
- **Contribution Points Engine:** Pure mathematical decay in `lib/scoring.mjs` applying effort weights and 14-day exponential half-life decay ($e^{-\lambda t}$).
- **Inactivity & Ghost Detection:** Inactivity tracking flags members with $>21$ days without a contribution event as `Ghost` (unless on an approved break).
- **FairWork Workload Distribution Engine:** Calculates Gini coefficient across active members, detects overloaded leads ($>2\times$ median load + overdue ratio), and provides automated task reassignment recommendations (`lib/fairwork.ts`, `app/(workspace)/fairwork/page.tsx`).

### Module 3: Club Feedback & Analytics
- **Member Experience Feedback:** Structured rating submission across satisfaction, leadership clarity, and workload fairness, with optional anonymity (`app/api/feedback/route.ts`).
- **Privacy Threshold:** Aggregated rating averages are cryptographically suppressed until at least 5 responses exist to prevent de-anonymization.
- **Burnout Watch & Radar:** Real-time visual metrics alerting leaders to overloaded leads and disengaged members before burnout occurs (`app/(workspace)/dashboard/page.tsx`).

---

## 6. Verification Status of External Integrations

| Integration | Implementation Status | Operational Status | Production Requirement |
|---|---|---|---|
| **PostgreSQL Database** | Fully implemented via `pg.Pool` with advisory locks | **Active & Verified** | Set `DATABASE_URL` in `.env.local` or hosting dashboard. `/api/health` verifies live connection. |
| **Google OAuth Sign-In** | Implemented in `app/api/auth/google/route.ts` & `components/GoogleAuthButton.tsx` | **Externally Blocked** | Requires provisioning a Google Cloud Client ID and Secret (`NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`). |
| **SMTP Password Recovery** | Token generation and reset handling implemented in `/api/auth/reset-password` | **Externally Blocked** | Requires configuring production SMTP server (`SMTP_HOST`, `SMTP_PORT`). Reset links are emitted in debug mode for local testing. |
