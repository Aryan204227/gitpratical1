# ClubPulse — Evaluation & Viva Guide

**Project:** P18 — Ghost Members and Burnout Leads: Club Contribution Management  
**Courses:** INT252 (React) and INT257 (Next.js)

## 1. Problem being solved

College club work can become concentrated among a few reliable students while other members gradually stop participating. Leads may also become overloaded because assignments, deadlines and contributions are tracked informally across chats and spreadsheets.

ClubPulse brings the workflow into one place:
- Club and recruitment records
- Task ownership, deadlines and progress
- Contribution history and participation recency
- Workload concentration signals and reviewed handover suggestions
- Member feedback and privacy-aware analytics

The product does not diagnose burnout or judge a student's personal value. It uses recorded workload and participation data to help a club lead start a supportive conversation and redistribute work.

## 2. The three required modules

### Module 1 — Club & Recruitment Service
- Create and maintain club profiles.
- Maintain a club roster and assign club leads.
- Publish recruitment openings.
- Let students apply with their registered email.
- Accepting an applicant creates or updates the club membership record.

### Module 2 — Task & Contribution Service
- Create tasks with a title, work brief, club, assignee, due date, priority and effort weight.
- Students update task status.
- Task completion creates a contribution event.
- Students can attach real work-progress photos to a task. Images are signature-checked, limited to 2 MB each and stored in PostgreSQL. Access is restricted to people who can access the task.
- CSV import supports bulk task creation.

### Module 3 — Club Feedback & Analytics
- Students submit club feedback and weekly check-ins.
- Leads review feedback only for clubs they manage.
- Group rating averages are hidden until at least five ratings exist.
- Analytics use saved records rather than hard-coded live dashboard totals.

## 3. Recommended live demonstration

Use real test accounts and your own club records. Do not present the public demo's fictional sample names as real students.

1. **Administrator:** Sign in, create a club, and assign a registered user as Club Lead from People & Roles.
2. **Club Lead:** Add two students to the club using their college email addresses.
3. **Students:** Register using the exact email addresses already added to the roster.
4. **Recruitment:** Publish an opening, apply as a student, then accept the application as the lead. Show the roster update.
5. **Task:** Create a task with a useful work brief, choose one of the saved club members, and set priority, effort and deadline.
6. **Student progress:** Sign in as the assigned student, move the task to In Progress, upload a real photo of the work, and then mark it Completed.
7. **Contribution:** Return to the task and contribution history to show the saved status and contribution event.
8. **FairWork:** Create a realistic uneven task distribution in your test club. Open FairWork, explain the workload signal and review a suggested handover before applying it.
9. **Feedback:** Submit feedback as a student and show the lead's review screen. Explain the five-response privacy threshold.
10. **Access control:** Demonstrate that a student cannot open administrator-only pages or change another student's task.

Do not create fake activity or ask classmates to upload photos that do not represent real work. If a module has no records yet, show its honest empty state and explain what action creates the first record.

## 4. Explain the core calculations

### Contribution points
`effort × timeliness × review multiplier`

- Effort weight is 1–5.
- On-time multiplier is 1.0; late multiplier is 0.6.
- Review multiplier is bounded between 0.8 and 1.2. The current task completion flow uses 1.0 because a separate review score is not captured yet.

### Pulse score
Recorded contribution points decay with a 14-day half-life, then are normalized against the member's declared weekly commitment. The displayed score is clamped to 0–100.

### Ghost signal
A member is labelled Ghost when their pulse score is below 30 or they have no contribution for 21 days. Drifting is 30–59; Active is 60 or above. An approved break overrides these labels.

### FairWork
The Gini coefficient measures how unevenly open tasks are distributed. FairWork also considers relative open-task load, urgent work, overdue tasks and recent workload change. A suggested reassignment is a recommendation for a lead to review, not an automatic decision.

## 5. INT252 / INT257 discussion points

| Topic | What to show |
|---|---|
| React components and hooks | React SPA workspace, reusable components and custom hooks |
| Forms and validation | Controlled forms, Zod validation and clear error states |
| Client routing and API data | React Router routes, Fetch/Axios client and React Query |
| Shared state | Context for auth/theme, Redux Toolkit for filters, Zustand for UI preferences |
| Next.js App Router | Route groups, layouts, dynamic routes, loading/error and not-found UI |
| Rendering | Server Components for protected workspace data; SSG/ISR examples in public labs |
| Route Handlers and Server Actions | Task, club, recruitment and feedback APIs plus server-side mutations |
| Authentication and RBAC | Hashed session tokens, HTTP-only cookies and server-side role/club checks |
| PostgreSQL | Relational records, foreign keys, parameterized queries and transactional updates |
| File uploads | Task evidence upload, file-signature validation, size limit and permission checks |
| Testing | Pure unit tests for scoring, Gini, inactivity, CSV parsing, dates and image signatures |
| SEO and reliability | Metadata, robots/sitemap, health endpoint and production build |

## 6. Be honest about current integration limits

- Google sign-in requires valid Google OAuth credentials in the deployment environment.
- Password-reset email delivery requires SMTP configuration.
- The task photo feature stores binary images in PostgreSQL; monitor database storage and keep a backup.
- The current task completion flow uses a neutral review multiplier of 1.0. Do not claim peer-review scoring is implemented.
- The public demo uses temporary fictional sample records and does not write to the live database.
- Unit tests and a production build do not replace a full end-to-end test with separate administrator, lead and student accounts.

## 7. Likely viva questions

**Why is ClubPulse needed if clubs already use WhatsApp?**  
WhatsApp is useful for communication but does not provide structured task ownership, contribution history, workload analysis or access-controlled club records.

**What is a Ghost member?**  
A member whose recorded contribution activity has been absent for at least 21 days or whose pulse score falls below the defined threshold, unless they are on an approved break.

**What does the Gini coefficient tell you?**  
It summarizes inequality in task distribution. A higher value means more work is concentrated among fewer people.

**Does FairWork automatically move tasks?**  
No. It proposes a possible handover. A lead reviews and confirms the reassignment.

**How do you stop students seeing other students' private data?**  
The server checks the signed-in session, role, club relationship and task ownership before returning protected records or images.

**How are uploaded photos protected?**  
Only JPG, PNG and WebP are accepted; the server checks the actual file signature, enforces a 2 MB limit, stores bytes in PostgreSQL and checks task access before returning an image.

**Why use PostgreSQL?**  
The data is relational: clubs have members, tasks, openings, applications, feedback and contribution events. Foreign keys and transactions help preserve relationships when a workflow changes.

**What would you improve next?**  
Configure and verify Google OAuth and SMTP, add a dedicated backup/retention process, run full end-to-end tests against a non-production database, and expand event-level attendance tracking if required by the next project phase.
