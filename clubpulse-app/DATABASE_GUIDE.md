# ClubPulse — Database Schema & Mongoose Architecture Reference

**Target Database:** MongoDB Atlas (`clubpulse_v2`)  
**ORM / ODM:** Mongoose 9.11.3  
**Data Access Layer:** `src/lib/db.js`  

---

## 1. Principles of the Data Layer

1. **Clean Slate Start:** The production database begins with ZERO pre-seeded users, clubs, tasks, or memberships. All data originates through genuine application workflows.
2. **Credential Safety:** Passwords are managed only by Firebase Authentication and are not stored in the MongoDB `User` document. Firebase Admin verifies ID tokens and issues HttpOnly Firebase session cookies.
3. **No Fabricated Defaults:** Schema fields like `attendanceRate` and `contributionScore` default to `0`, ensuring that students and clubs genuinely build their records through activity.
4. **Lean Execution:** All read operations leverage `.lean()` for optimal performance and plain JSON object compatibility.
5. **Connection Caching:** `connectMongoose()` caches the active connection promise to avoid socket exhaustion during Next.js Hot Module Reloading (HMR).

---

## 2. Collection Schemas & Models

### 2.1 `User` Collection (`src/models/User.js`)
Stores authenticated student, club officer, and university administrator profiles.
```javascript
{
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  firebaseUid: { type: String, index: true, sparse: true, unique: true },
  authProvider: { type: String, enum: ["password", "google", "firebase"], default: "firebase" },
  role: { type: String, enum: ["student", "leader", "admin"], default: "student", index: true },
  avatar: { type: String },
  department: { type: String },
  year: { type: String },
  bio: { type: String },
  createdAt: { type: Date, default: Date.now }
}
```

### 2.2 `Club` Collection (`src/models/Club.js`)
Stores registered campus organizations and their transparency accreditation tier.
```javascript
{
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true, index: true },
  description: { type: String, required: true },
  tagLine: { type: String },
  category: { type: String, required: true }, // Technical, Cultural, Sports, Social
  presidentId: { type: String, required: true, index: true },
  presidentName: { type: String },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "approved" },
  memberCount: { type: Number, default: 0 },
  trustScore: { type: Number, default: 0 }, // 0 to 100
  transparencyTier: { type: String, default: "Under Review" },
  recruitmentOpen: { type: Boolean, default: false },
  recruitmentDeadline: { type: String }
}
```

### 2.3 `Membership` Collection (`src/models/Membership.js`)
Tracks the relationship between a user and a club, including participation metrics.
```javascript
{
  userId: { type: String, required: true, index: true },
  clubId: { type: String, required: true, index: true },
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  clubRole: { type: String, enum: ["president", "coordinator", "core_team", "member"], default: "member" },
  status: { type: String, enum: ["active", "low_activity", "inactive", "on_leave"], default: "active", index: true },
  joinedAt: { type: String, required: true },
  lastActiveAt: { type: String, required: true },
  attendanceRate: { type: Number, default: 0, min: 0, max: 100 },
  tasksCompleted: { type: Number, default: 0 },
  tasksPending: { type: Number, default: 0 },
  estimatedWeeklyHours: { type: Number, default: 0 },
  contributionScore: { type: Number, default: 0, min: 0, max: 100 },
  leaveDetails: {
    onLeave: { type: Boolean, default: false },
    reason: { type: String },
    startDate: { type: String },
    endDate: { type: String },
    approvedAt: { type: String }
  }
}
// Compound unique index:
MembershipSchema.index({ userId: 1, clubId: 1 }, { unique: true });
```

### 2.4 `Task` Collection (`src/models/Task.js`)
Tracks assigned deliverables, estimated hours, deadlines, and completion statuses.
```javascript
{
  clubId: { type: String, required: true, index: true },
  clubName: { type: String },
  title: { type: String, required: true },
  description: { type: String },
  assigneeId: { type: String, required: true, index: true },
  assigneeName: { type: String, required: true },
  estimatedHours: { type: Number, default: 2 },
  priority: { type: String, enum: ["low", "medium", "high", "urgent"], default: "medium" },
  status: { type: String, enum: ["pending", "in_progress", "completed", "overdue", "blocked"], default: "pending" },
  dueDate: { type: String },
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
}
```

### 2.5 `Contribution` Collection (`src/models/Contribution.js`)
Holds student evidence submissions and leader approval states.
```javascript
{
  clubId: { type: String, required: true, index: true },
  clubName: { type: String },
  userId: { type: String, required: true, index: true },
  userName: { type: String, required: true },
  taskId: { type: String, index: true },
  taskTitle: { type: String },
  title: { type: String, required: true },
  description: { type: String, required: true },
  evidenceUrl: { type: String },
  evidenceType: { type: String, enum: ["github_pr", "document", "link", "media", "other"], default: "link" },
  status: { type: String, enum: ["submitted", "approved", "rejected"], default: "submitted" },
  hoursSpent: { type: Number, default: 0 },
  submittedAt: { type: Date, default: Date.now },
  verifiedAt: { type: Date },
  reviewerNotes: { type: String }
}
```

### 2.6 `Availability` Collection (`src/models/Availability.js`)
Student-declared commitment hours and exam periods for intelligent task redistribution.
```javascript
{
  userId: { type: String, required: true, unique: true, index: true },
  weeklyAvailableHours: { type: Number, default: 10, min: 0, max: 40 },
  preferredDays: [{ type: String }],
  skills: [{ type: String }],
  isCurrentlyOnBreak: { type: Boolean, default: false },
  breakReason: { type: String },
  breakEndDate: { type: Date },
  lastUpdatedAt: { type: Date, default: Date.now }
}
```

### 2.7 `Feedback` Collection (`src/models/Feedback.js`)
Anonymous club feedback to monitor leadership culture and member satisfaction.
```javascript
{
  clubId: { type: String, required: true, index: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  category: { type: String, enum: ["workload", "culture", "events", "leadership", "general"], default: "general" },
  comments: { type: String, required: true },
  isAnonymous: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
}
```

---

## 3. Database Indexes Summary

| Collection | Indexed Fields | Index Type | Purpose |
|---|---|---|---|
| `users` | `email` | Unique | Enforce unique student email |
| `users` | `role` | Standard | Fast role filtering (students vs leaders) |
| `clubs` | `slug` | Unique | Clean SEO URL lookup |
| `clubs` | `presidentId` | Standard | Query clubs owned by a leader |
| `memberships`| `{ userId: 1, clubId: 1 }` | Compound Unique | Prevent duplicate enrollments |
| `tasks` | `clubId`, `assigneeId` | Standard | Fast dashboard task loading |
| `contributions`| `clubId`, `userId` | Standard | Evidence verification filtering |
| `availability` | `userId` | Unique | 1:1 availability record per student |
