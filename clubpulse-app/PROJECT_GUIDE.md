# ClubPulse — University Project Guide (P18)

**Project ID:** P18  
**Project Title:** Ghost Members and Burnout Leads: Club Contribution Management  
**Product Name:** ClubPulse  
**Target Architecture:** Next.js 16 (App Router), React 19, MongoDB Atlas (`clubpulse_v2`), Firebase Authentication, Tailwind CSS v4  

---

## 1. Executive Summary & Problem Solved

College student clubs and organizations suffer from three systematic structural failures that ClubPulse directly resolves:

### Problem 1: Ghost Members
- **The Issue:** Students register during high-energy recruitment cycles (e.g., orientation week), but gradually drop off and become unreachable without formal communication.
- **Why It Matters:** Club presidents plan large events assuming 40 active members, only to discover on event day that only 5 members are actually contributing.
- **ClubPulse Solution:** The **FairWork Engine** continuously audits member activity timestamps (`lastActiveAt`), meeting attendance, and task engagements. When activity drops beyond 14 or 30 days, the platform alerts the leader with an empathetic check-in recommendation, distinguishing between disengagement and an approved academic leave of absence.

### Problem 2: Burnout Leads
- **The Issue:** In 90% of university clubs, 80%+ of all deliverables fall on 1 to 3 hyper-dedicated executive officers (e.g., President, Tech Lead).
- **Why It Matters:** Academic distress, exhaustion, dropped GPAs, and eventual club collapse when that student graduates.
- **ClubPulse Solution:** Workload Concentration Indexing tracks pending task hours per student. If any member holds $\ge 45\%$ of total club work or $\ge 24$ estimated task hours, a **Critical Burnout Alert** is flagged with 1-click recommendations to redistribute work to low-workload members who declared available capacity.

### Problem 3: Opaque Contribution Management & WhatsApp Chaos
- **The Issue:** Responsibilities, deadlines, and submissions are informally tossed across unorganized WhatsApp/Discord chats. Students claim contributions during CV season that cannot be validated.
- **Why It Matters:** Inability for university administration (Dean of Student Affairs) to verify authentic student leadership for scholarships, honors, or official certificates.
- **ClubPulse Solution:** Formalized task assignments, cryptographic-style evidence submissions (links, documents, repos), leader verification workflows, and an immutable administrative audit log.

---

## 2. The Three Core University Modules

### Module 1: Club & Recruitment Service
- **Club Directory (`/clubs`):** Browse active and recruiting chapters by category (Technical, Cultural, Sports, Social).
- **Club Creation & Admin Clearance:** New club registrations start in a `pending` state and require approval from the university administrator.
- **Recruitment Cycles (`/recruitment`):** Leaders toggle recruitment status, customize applicant questionnaires, and review inbound student applications.
- **Application Processing:** Approvals automatically generate an active `Membership` document in MongoDB with initial 0% artificial inflation (zero fake defaults).

### Module 2: Task & Contribution Service
- **Task Delegation (`/dashboard/leader`):** Officers create tasks with estimated completion hours, priority level (urgent/high/medium/low), deadline, and designated assignee.
- **Evidence Submission (`/my-activity`):** Assigned students submit evidence (GitHub pull requests, Drive assets, event photography, budget sheets) with reflective notes.
- **Leader Verification:** Leaders review submissions and accept or request revisions. Accepted evidence atomically increments member completion counts and refreshes activity timestamps.

### Module 3: Club Feedback & Analytics
- **Private Feedback System:** Members submit candid feedback regarding club culture, meeting lengths, and workload pressure. Anonymous aggregated metrics protect members from retaliation.
- **FairWork Intelligence Engine (`src/lib/fairwork.js`):** Rule-based workload and burnout telemetry (explained in detail in `FAIRWORK_EXPLANATION.md`).
- **Academic Accommodation & Leave Management:** Students request study breaks (midterms, final exams, family emergencies). Approved breaks excuse members and prevent false "ghost" flags.

---

## 3. Production Data and Authentication

The dashboards are configured for live MongoDB-backed records only. Fictional persona data and simulated Google identities are not loaded by production pages. Empty database states remain empty until users create real records through application workflows.

Authentication is Firebase-only. The browser uses Firebase Authentication for email/password and Google sign-in; the server verifies ID tokens and creates five-day HttpOnly Firebase session cookies with Firebase Admin. MongoDB stores application profile and role data, not passwords. New accounts receive the student role. Protected API routes resolve the current role from MongoDB using the verified Firebase UID.

## 4. How to Run the Application

### Prerequisites
- Node.js 22 or newer (Firebase Admin SDK requirement)
- npm or pnpm
- Valid MongoDB connection string (`MONGODB_URI`)

### Setup Instructions
1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your real MongoDB Atlas URI and Firebase credentials
   ```
3. Test MongoDB connection (optional):
   ```bash
   npm run test:db
   ```
4. Run automated test suite:
   ```bash
   npm test
   ```
5. Run development server:
   ```bash
   npm run dev
   ```
6. Open your browser at `http://localhost:3000`.

---

## 5. Summary Checklist of Fixed Items
- [x] Removed all legacy JSON database files (`.data/clubpulse_store.json`).
- [x] Zero pre-seeded or fake records in MongoDB `clubpulse_v2`.
- [x] Removed fake `attendanceRate: 100` and `contributionScore: 75` schema defaults.
- [x] Leader dashboard connected to real API routes and FairWork engine.
- [x] Student dashboard connected to real API routes with genuine empty states.
- [x] Removed persona impersonation (`switchPersona`) from authentication layers.
- [x] FairWork algorithm and live-data isolation tests passing.
- [ ] Run lint and production build after installing dependencies.
- [ ] Configure real MongoDB and Firebase environment values and verify end-to-end login/persistence.
