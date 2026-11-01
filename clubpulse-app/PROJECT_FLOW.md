# ClubPulse — End-to-End Workflow & User Journeys

---

## 1. Journey 1: Firebase Enrollment & Club Joining

```mermaid
sequenceDiagram
    actor Student
    participant UI as Student Portal (/login)
    participant Firebase as Firebase Authentication
    participant Auth as /api/auth/session
    participant Admin as Firebase Admin
    participant DB as MongoDB (clubpulse_v2)
    participant Clubs as /api/clubs

    Student->>UI: Enters email/password or chooses Google
    UI->>Firebase: Firebase client SDK sign-in/create account
    Firebase-->>UI: Firebase ID token
    UI->>Auth: POST { idToken, profile? }
    Auth->>Admin: verifyIdToken(idToken, checkRevoked=true)
    Admin-->>Auth: Verified Firebase claims
    Auth->>DB: Find by firebaseUid / link verified email / create student
    DB-->>Auth: Application user record
    Auth->>Admin: createSessionCookie(idToken, five-day expiry)
    Admin-->>Auth: Firebase session cookie
    Auth-->>UI: Safe user profile + HttpOnly cookie
    UI-->>Student: Redirect by MongoDB role

    alt Password email is not verified
        Auth-->>UI: 403 EMAIL_NOT_VERIFIED (no cookie)
        UI-->>Student: Check email and resend verification
    else Verified password or Google sign-in
        Student->>UI: Navigates to /clubs
        UI->>Clubs: GET /api/clubs?recruitment=open
        Clubs-->>UI: Returns active recruiting clubs
        Student->>UI: Clicks "Apply to Join" & fills form
        UI->>DB: Application.create({ status: "pending" })
        DB-->>Student: Application Submitted notification
    end
```

---

## 2. Journey 2: Club Officer Application Review & Onboarding

```mermaid
sequenceDiagram
    actor Leader
    participant Dash as Leader Dashboard
    participant API as /api/applications
    participant DB as MongoDB (clubpulse_v2)

    Leader->>Dash: Reviews inbound applications
    Dash->>API: PATCH /api/applications (id, status="accepted")
    API->>DB: Application.updateOne({ status: "accepted" })
    API->>DB: Membership.create({ userId, clubId, tasksCompleted: 0, attendanceRate: 0 })
    API->>DB: Club.updateOne({ $inc: { memberCount: 1 } })
    API->>DB: Notification.create({ userId: applicant, title: "Accepted!" })
    DB-->>Dash: Updated member list loaded
```

---

## 3. Journey 3: Task Assignment, Evidence Submission & Verification

```mermaid
sequenceDiagram
    actor Leader
    actor Member
    participant LeaderDash as Leader Dashboard
    participant MemberDash as Student Portal (/my-activity)
    participant DB as MongoDB (clubpulse_v2)

    Leader->>LeaderDash: Creates task ("Design Hackathon Banner", 6 hours)
    LeaderDash->>DB: Task.create({ assigneeId, estimatedHours: 6, status: "pending" })
    DB-->>Member: In-app Notification: "New Task Assigned"
    Member->>MemberDash: Views pending task & completes work
    Member->>MemberDash: Submits Evidence (Figma Link, 5 hours spent)
    MemberDash->>DB: Contribution.create({ status: "submitted" })
    Leader->>LeaderDash: Reviews Contribution Evidence
    Leader->>LeaderDash: Clicks "Verify Contribution"
    LeaderDash->>DB: Contribution.updateOne({ status: "approved" })
    LeaderDash->>DB: Task.updateOne({ status: "completed" })
    LeaderDash->>DB: Membership.updateOne({ $inc: { tasksCompleted: 1 }, lastActiveAt: now })
```

---

## 4. Journey 4: FairWork Workload Rebalancing Workflow

```mermaid
sequenceDiagram
    participant Engine as FairWork Engine (fairwork.js)
    actor Leader
    participant Dash as Leader Dashboard
    participant TaskAPI as /api/tasks/[id]
    participant DB as MongoDB (clubpulse_v2)

    Engine->>Dash: Workload Concentration = 72% on Karan Singh (Critical Burnout)
    Engine->>Dash: Available Peers: Sneha Gupta (15h free) & Aryan Mehta (12h free)
    Dash-->>Leader: FairWork Recommendation Card displayed
    Leader->>Dash: Clicks "Reassign Task" to Sneha Gupta
    Dash->>TaskAPI: PATCH /api/tasks/[taskId] ({ assigneeId: "Sneha" })
    TaskAPI->>DB: Task.updateOne({ assigneeId: "Sneha", assigneeName: "Sneha Gupta" })
    TaskAPI->>DB: Notification.create("Task reassigned to you")
    DB-->>Dash: Recalculates: Workload now 42% (Health Restored)
```

---

## 5. Journey 5: Ghost Member Detection & Academic Leave Exemption

```mermaid
sequenceDiagram
    actor Student
    participant Engine as FairWork Engine (fairwork.js)
    actor Leader
    participant Dash as Leader Dashboard

    alt Scenario A: Academic Leave of Absence
        Student->>Dash: Submits Study Break (Midterms preparation)
        Dash->>Engine: leaveDetails: { onLeave: true, endDate: "2026-11-20" }
        Engine-->>Dash: Status: "on_approved_break" (Risk: None)
        Note over Dash: Student is NOT flagged as ghost member
    else Scenario B: Unexcused Inactivity > 30 Days
        Student--xDash: No login, tasks or meeting attendance for 34 days
        Dash->>Engine: lastActiveAt: 34 days ago
        Engine-->>Dash: Status: "check_in_suggested" (Risk: Action Needed)
        Dash-->>Leader: Alert: "Chloe Zhao inactive 34 days. Send check-in?"
        Leader->>Student: Reaches out personally to provide support
    end
```
