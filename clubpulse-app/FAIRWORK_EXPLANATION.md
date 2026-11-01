# FairWork Intelligence Engine — Technical Mathematical Reference

**Module:** `src/lib/fairwork.js`  
**Application:** ClubPulse University Club Management  

---

## 1. Engine Objective

FairWork provides automated telemetry for university club leadership committees. Its dual mission is:
1. **Prevent Leader Burnout** by detecting disproportionate task load concentration.
2. **Prevent Member Churn (Ghost Members)** by identifying early participation decline while strictly respecting academic leave exemptions.

FairWork is completely **rule-based, explainable, and deterministic**.

---

## 2. Configurable System Thresholds

| Parameter | Identifier | Value | Description |
|---|---|---|---|
| Inactivity Limit | `INACTIVE_DAYS` | `30 days` | Threshold beyond which a member is flagged for intervention. |
| Early Warning Limit | `LOW_ACTIVITY_DAYS` | `14 days` | Threshold for early decline warning. |
| Attendance Floor | `LOW_ATTENDANCE_RATE` | `40%` | Meeting attendance rate below which concern is flagged. |
| Critical Hours | `CRITICAL_HOURS` | `24 hours` | Active pending task hours indicating extreme burnout risk. |
| High Hours | `HIGH_HOURS` | `14 hours` | Pending hours indicating elevated workload risk. |
| Moderate Hours | `MODERATE_HOURS` | `8 hours` | Manageable but notable workload. |
| Critical Concentration | `CRITICAL_CONCENTRATION`| `45%` | Proportion of total club work held by 1 person triggering critical alarm. |
| High Concentration | `HIGH_CONCENTRATION` | `30%` | Proportion of total club work held by 1 person triggering warning. |

---

## 3. Algorithm 1: Ghost Member & Participation Telemetry

### Function Signature
```javascript
getParticipationStatus(membership: MembershipDocument): {
  status: "active" | "activity_declining" | "check_in_suggested" | "on_approved_break",
  riskLevel: "none" | "watch" | "action_needed",
  explanation: string,
  recommendation: string
}
```

### Mathematical Flowchart & Decision Tree
```
1. Is membership.leaveDetails.onLeave === true?
   ├── YES ➔ Status: "on_approved_break", Risk: "none"
   │         Explanation: "Member is on an approved break until [endDate]."
   │         Recommendation: "Respect break period. No action needed."
   │
   └── NO ➔ Compute:
             Δt = (current_timestamp - membership.lastActiveAt) in days
             lowAttendance = (membership.attendanceRate < 40%)

             IF (Δt > 30) OR (lowAttendance AND Δt > 20):
               ➔ Status: "check_in_suggested", Risk: "action_needed"
               ➔ Recommendation: "Send friendly personal check-in."

             ELSE IF (Δt > 14) OR (lowAttendance):
               ➔ Status: "activity_declining", Risk: "watch"
               ➔ Recommendation: "Pair with a sub-team buddy or suggest workshop."

             ELSE:
               ➔ Status: "active", Risk: "none"
               ➔ Recommendation: "Well engaged. Eligible for task delegation."
```

---

## 4. Algorithm 2: Individual Burnout Risk Telemetry

### Function Signature
```javascript
getBurnoutRisk(
  assignedHours: number,
  pendingTaskCount: number,
  percentageOfClubWorkload: number
): {
  riskLevel: "critical" | "high" | "moderate" | "low",
  warning: string | null,
  color: string,
  badgeColor: string
}
```

### Decision Matrix
```
IF (assignedHours >= 24) OR (percentageOfClubWorkload >= 45) OR (pendingTaskCount >= 7):
  ➔ riskLevel = "critical"
  ➔ color = "text-red-600"
  ➔ badgeColor = "bg-red-100 text-red-700 border-red-200"
  ➔ warning = "Extreme workload. Assigned Xh of estimated work (Y% of club total)."

ELSE IF (assignedHours >= 14) OR (percentageOfClubWorkload >= 30) OR (pendingTaskCount >= 4):
  ➔ riskLevel = "high"
  ➔ color = "text-amber-600"
  ➔ badgeColor = "bg-amber-100 text-amber-700 border-amber-200"

ELSE IF (assignedHours >= 8) OR (pendingTaskCount >= 2):
  ➔ riskLevel = "moderate"
  ➔ color = "text-blue-600"

ELSE:
  ➔ riskLevel = "low"
  ➔ color = "text-emerald-600"
```

---

## 5. Algorithm 3: Club-Wide Workload Concentration & Redistribution

### Function Signature
```javascript
analyzeClubWorkload(
  memberships: MembershipDocument[],
  tasks: TaskDocument[]
): AnalysisSummary
```

### Processing Steps:
1. **Filter Active Tasks:** Filter out all tasks where `status === 'completed'` or `status === 'rejected'`.
2. **Compute Total Club Workload:**
   $$H_{\text{total}} = \sum_{t \in \text{activeTasks}} t.\text{estimatedHours}$$
3. **Per-Member Allocation:**
   $$H_i = \sum_{t \in \text{activeTasks}, \text{assignee} = i} t.\text{estimatedHours}$$
   $$P_i = \begin{cases} \text{round}\left(\frac{H_i}{H_{\text{total}}} \times 100\right), & H_{\text{total}} > 0 \\ 0, & H_{\text{total}} = 0 \end{cases}$$
4. **Workload Concentration Index ($WCI$):**
   $$WCI = \max_{i} (P_i)$$
   If $WCI \ge 45\%$, the club is flagged as structurally unbalanced (`isHealthy = false`).
5. **Capacity Matching & Redistribution Recommendations:**
   - Detect members with $P_i < 20\%$ and declared `weeklyAvailableHours` $> 5\text{ hours}$.
   - For every member with `critical` or `high` burnout risk, generate a structured recommendation:
     - `suggestedFromId`: Overloaded member ID.
     - `suggestedToIds`: Available member IDs.
     - `explanation`: Exact breakdown of hours and capacity.
     - `guardrail`: *"Leader approval required before any reassignment."*

---

## 6. What FairWork Does NOT Do (Ethical Safeguards)

1. **No Automated Punishment:** The engine never deducts grades, locks student accounts, or kicks members from clubs.
2. **No Bot Messaging:** Students are not spammed by automated system bots; rather, club officers receive private reminders to initiate human check-ins.
3. **No Unilateral Reassignments:** Tasks are never re-assigned without the explicit click and authorization of the club leader.
