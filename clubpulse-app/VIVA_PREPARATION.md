# ClubPulse — University Viva Preparation & Examiner Q&A Guide

**Project ID:** P18  
**Project Title:** Ghost Members and Burnout Leads: Club Contribution Management  

This document provides direct, technically precise answers to the most common questions university examiners, external evaluators, and department heads ask during computer science project defenses.

---

## High-Priority Viva Questions

### Q1: What is the core engineering problem solved by ClubPulse?
**Answer:**  
In university student organizations, leadership task distribution and student participation suffer from severe asymmetry. A small handful of officers (often just the President or Secretary) take on over 70% of the responsibilities, leading to academic burnout, while a large percentage of registered members become "ghost members" — students who remain listed on paper but contribute nothing for months. 

ClubPulse provides an algorithmic governance framework that monitors member inactivity timestamps, calculates task load concentration in real time, respects academic study leaves, and provides leaders with actionable, non-punitive rebalancing recommendations.

---

### Q2: Is the FairWork engine using Machine Learning or AI?
**Answer:**  
**No.** FairWork is an explainable, deterministic **rule-based algorithmic telemetry engine** implemented in `src/lib/fairwork.js`. 

We intentionally avoided black-box machine learning for three reasons:
1. **Explainability:** When an officer receives an alert that a peer is burning out or dropping off, the platform must explain the exact mathematical reasons (e.g., *"Assigned 28 hours across 6 tasks, representing 72% of club workload"*).
2. **Determinism & Trust:** College clubs lack thousands of labeled historical training datasets. Rule-based thresholding on actual timestamps and task hour estimations provides predictable, transparent results without algorithmic bias or hallucinations.
3. **No External API Dependencies:** The algorithm executes in milliseconds directly in Node.js serverless runtimes without external LLM API costs or token latencies.

---

### Q3: How does the Ghost Member detection algorithm work?
**Answer:**  
In `src/lib/fairwork.js`, the function `getParticipationStatus(membership)` executes the following logic:
1. **Academic Leave Check:** First, it checks `membership.leaveDetails?.onLeave`. If the student submitted a formal leave of absence (e.g., midterm preparation, medical leave), their risk level is set to `none`. They are excused from participation and **never flagged**.
2. **Elapsed Time Calculation:** If not on leave, it calculates $\Delta t = \text{today} - \text{membership.lastActiveAt}$ in days.
3. **Status Classification:**
   - If $\Delta t > 30 \text{ days}$ (or $\Delta t > 20 \text{ days}$ with $< 40\%$ meeting attendance): Status becomes `check_in_suggested` (Risk Level: `action_needed`).
   - If $\Delta t > 14 \text{ days}$ (or $< 40\%$ attendance): Status becomes `activity_declining` (Risk Level: `watch`).
   - Otherwise: Status remains `active`.
4. **Actionable Recommendation:** Rather than penalizing or automatically ejecting the student, the system suggests a personalized, empathetic check-in or offering smaller micro-tasks.

---

### Q4: How is Burnout Risk calculated?
**Answer:**  
In `src/lib/fairwork.js`, the function `getBurnoutRisk(assignedHours, pendingTaskCount, percentageOfClubWorkload)` evaluates:
- $\text{assignedHours} \ge 24\text{ hours}$ **OR** $\text{percentageOfClubWorkload} \ge 45\%$ **OR** $\text{pendingTaskCount} \ge 7 \rightarrow$ **Critical Risk (Red)**
- $\text{assignedHours} \ge 14\text{ hours}$ **OR** $\text{percentageOfClubWorkload} \ge 30\%$ **OR** $\text{pendingTaskCount} \ge 4 \rightarrow$ **High Risk (Amber)**
- $\text{assignedHours} \ge 8\text{ hours}$ **OR** $\text{pendingTaskCount} \ge 2 \rightarrow$ **Moderate Risk (Blue)**
- Otherwise $\rightarrow$ **Low / Healthy Load (Emerald)**

The club-wide health metric is summarized as the **Workload Concentration Index**, defined as the maximum percentage of pending hours held by a single officer.

---

### Q5: Explain the database design and why MongoDB was chosen.
**Answer:**  
We chose MongoDB with Mongoose ODM (`clubpulse_v2`) for several architectural reasons:
1. **Document Flexibility:** Club profiles, leave details, and evidence submissions have nested fields (e.g., `leaveDetails: { onLeave, reason, endDate }`) that fit naturally into polymorphic JSON-like BSON documents without excessive multi-table JOIN overhead.
2. **Indexing Strategy:** Compound unique indexes like `{ userId: 1, clubId: 1 }` on the `Membership` collection prevent duplicate enrollments, while `{ clubId: 1, status: 1 }` on `Task` optimizes fast dashboard querying.
3. **Lean Querying:** All database queries utilize `.lean()` in `src/lib/db.js` to return plain JavaScript objects, eliminating Mongoose hydration overhead and minimizing memory footprints.

---

### Q6: How does authentication and role authorization work?
**Answer:**  
ClubPulse uses Firebase Authentication for email/password and Google sign-in. The browser gets a Firebase ID token and sends it to `POST /api/auth/session`. Firebase Admin verifies the token, checks that authentication is recent, and issues a five-day HttpOnly Firebase session cookie. MongoDB stores the application profile and role, not the password. New accounts receive the `student` role; protected APIs resolve the current role from MongoDB using the verified Firebase UID. Unverified password-provider accounts receive `403 EMAIL_NOT_VERIFIED` and no session cookie.

---

### Q7: How does ClubPulse avoid displaying fake data?
**Answer:**  
The production dashboards call the application's MongoDB-backed API routes. They do not load sample personas or inject prefilled records. If the database has no clubs, tasks, or memberships yet, the interface displays genuine empty states. Automated tests use small in-memory test inputs only to verify the FairWork calculations; those inputs are not part of the production UI.

### Q8: How does task redistribution work? Does the system automatically reassign tasks?
**Answer:**  
**No, the system never reassigns tasks automatically.** Automatic reassignment would disrupt real human leadership relationships.

Instead:
1. The FairWork engine detects the imbalance (e.g., Karan is overloaded at 72%).
2. It queries members who hold $< 20\%$ of club work and have declared $> 5$ hours of weekly available time in their `Availability` profile (e.g., Sneha and Aryan).
3. It presents a **Recommendation Card** to the club president.
4. The president reviews the recommendation and approves the reassignment, which issues a `PATCH /api/tasks/[id]` request to safely update the task's `assigneeId` and notify both members.

---

### Q9: What security measures protect student data?
**Answer:**
1. **Authentication:** Firebase Authentication handles email/password and Google sign-in. The server verifies Firebase ID tokens and creates HttpOnly session cookies with Firebase Admin.
2. **Session Security:** HTTP-only cookies prevent JavaScript access and protect against cross-site scripting (XSS) session theft.
3. **Privacy by Design:** Member feedback submitted via `/api/feedback` is aggregated and anonymized to protect students from academic or interpersonal retribution by club officers.
4. **Audit Trail:** Critical administrative actions (such as evidence approvals or disputes) are logged into the `AuditLog` collection.
5. **Credential Isolation:** `.env.local` is strictly excluded from version control and compressed archives.
