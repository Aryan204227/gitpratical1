/**
 * src/lib/fairwork.js
 * ClubPulse FairWork Engine
 * 
 * Calculates workload distribution, burnout risk indicators, and ghost member
 * participation status. All calculations use real data from the database.
 * 
 * This is rule-based logic, NOT machine learning or AI.
 * Every result includes a plain English explanation.
 */

// ─── Thresholds (configurable) ────────────────────────────────────────────────
const THRESHOLDS = {
  // Ghost member detection
  INACTIVE_DAYS: 30,          // > 30 days without any activity = "inactive"
  LOW_ACTIVITY_DAYS: 14,      // > 14 days = "low activity warning"
  LOW_ATTENDANCE_RATE: 40,    // < 40% attendance = concern

  // Burnout risk (based on hours assigned)
  CRITICAL_HOURS: 24,         // >= 24 hours pending = critical
  HIGH_HOURS: 14,             // >= 14 hours pending = high risk
  MODERATE_HOURS: 8,          // >= 8 hours pending = moderate

  // Workload concentration (% of club's total work held by 1 person)
  CRITICAL_CONCENTRATION: 45, // >= 45% = critical imbalance
  HIGH_CONCENTRATION: 30,     // >= 30% = high imbalance
};

/**
 * Calculate ghost member participation status for a single member.
 * Uses their membership record (lastActiveAt, attendanceRate, leaveDetails).
 * 
 * @param {Object} membership - Membership document
 * @returns {Object} { status, riskLevel, explanation, recommendation }
 */
export function getParticipationStatus(membership) {
  // 1. Respect declared breaks - never penalize someone on approved leave
  if (membership.leaveDetails?.onLeave) {
    return {
      status: "on_approved_break",
      riskLevel: "none",
      explanation: `Member is on an approved break until ${membership.leaveDetails.endDate || "a specified date"} (${membership.leaveDetails.reason || "personal reason"}).`,
      recommendation: "Respect the break period. No action needed.",
    };
  }

  // 2. Calculate days since last recorded activity
  const lastActiveDate = new Date(membership.lastActiveAt);
  const today = new Date();
  const daysSinceActive = Math.round((today - lastActiveDate) / (1000 * 60 * 60 * 24));
  const lowAttendance = membership.attendanceRate < THRESHOLDS.LOW_ATTENDANCE_RATE;

  // 3. Check if member has any task engagement at all
  const noTaskEngagement = membership.tasksCompleted === 0 && membership.tasksPending === 0;

  // 4. Determine status based on actual data
  if (daysSinceActive > THRESHOLDS.INACTIVE_DAYS || (lowAttendance && daysSinceActive > 20)) {
    return {
      status: "check_in_suggested",
      riskLevel: "action_needed",
      explanation: `No logged activity for ${daysSinceActive} days. Attendance rate is ${membership.attendanceRate}%.${noTaskEngagement ? " No tasks assigned or completed." : ""}`,
      recommendation: "Send a friendly personal check-in to understand if they need academic accommodation or prefer smaller micro-tasks.",
    };
  }

  if (daysSinceActive > THRESHOLDS.LOW_ACTIVITY_DAYS || lowAttendance) {
    return {
      status: "activity_declining",
      riskLevel: "watch",
      explanation: `Activity is dipping (${daysSinceActive} days since last interaction). Attendance rate: ${membership.attendanceRate}%.`,
      recommendation: "Pair with a sub-team buddy or suggest an upcoming workshop suited to their stated skills.",
    };
  }

  return {
    status: "active",
    riskLevel: "none",
    explanation: `Consistently active. Last check-in was ${daysSinceActive} days ago with ${membership.attendanceRate}% attendance rate.`,
    recommendation: "Well engaged. Eligible for leadership task delegation.",
  };
}

/**
 * Calculate burnout risk for a single member based on their task load.
 * 
 * @param {number} assignedHours - Total estimated hours for pending tasks
 * @param {number} pendingTaskCount - Number of pending tasks
 * @param {number} percentageOfClubWorkload - What % of the club's total work this person holds
 * @returns {Object} { riskLevel, warning, color }
 */
export function getBurnoutRisk(assignedHours, pendingTaskCount, percentageOfClubWorkload) {
  if (
    assignedHours >= THRESHOLDS.CRITICAL_HOURS ||
    percentageOfClubWorkload >= THRESHOLDS.CRITICAL_CONCENTRATION ||
    pendingTaskCount >= 7
  ) {
    return {
      riskLevel: "critical",
      warning: `Extreme workload. Assigned ${assignedHours}h of estimated work (${percentageOfClubWorkload}% of club total). Well above recommended student-leader capacity.`,
      color: "text-red-600",
      badgeColor: "bg-red-100 text-red-700 border-red-200",
    };
  }
  if (
    assignedHours >= THRESHOLDS.HIGH_HOURS ||
    percentageOfClubWorkload >= THRESHOLDS.HIGH_CONCENTRATION ||
    pendingTaskCount >= 4
  ) {
    return {
      riskLevel: "high",
      warning: `Elevated workload. ${assignedHours}h assigned (${percentageOfClubWorkload}% of club work). Consider redistributing some tasks.`,
      color: "text-amber-600",
      badgeColor: "bg-amber-100 text-amber-700 border-amber-200",
    };
  }
  if (assignedHours >= THRESHOLDS.MODERATE_HOURS || pendingTaskCount >= 2) {
    return {
      riskLevel: "moderate",
      warning: `Moderate workload (${assignedHours}h pending). Manageable but worth monitoring.`,
      color: "text-blue-600",
      badgeColor: "bg-blue-100 text-blue-700 border-blue-200",
    };
  }
  return {
    riskLevel: "low",
    warning: null,
    color: "text-emerald-600",
    badgeColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
  };
}

/**
 * Analyze workload distribution across all club members.
 * Identifies imbalance and generates recommendations.
 * 
 * @param {Array} memberships - Array of membership documents
 * @param {Array} tasks - Array of task documents for the club (non-completed)
 * @returns {Object} Full FairWork analysis result
 */
export function analyzeClubWorkload(memberships, tasks) {
  // Only consider pending / in-progress / blocked tasks for workload
  const activeTasks = tasks.filter(
    (t) => t.status !== "completed" && t.status !== "rejected"
  );

  // Total estimated hours across all active tasks
  const totalClubHours = activeTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);

  // Calculate each member's workload
  const memberWorkloads = memberships.map((m) => {
    const memberTasks = activeTasks.filter((t) => t.assigneeId === String(m.userId));
    const assignedHours = memberTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
    const percentageOfClubWorkload = totalClubHours > 0
      ? Math.round((assignedHours / totalClubHours) * 100)
      : 0;

    const burnoutRisk = getBurnoutRisk(assignedHours, memberTasks.length, percentageOfClubWorkload);
    const participationStatus = getParticipationStatus(m);

    return {
      userId: m.userId,
      name: m.userName,
      role: m.clubRole,
      pendingTasks: memberTasks.length,
      estimatedHours: assignedHours,
      percentageOfClubWorkload,
      weeklyAvailableHours: m.estimatedWeeklyHours || 0,
      utilizationRate: m.estimatedWeeklyHours > 0
        ? Math.round((assignedHours / m.estimatedWeeklyHours) * 100)
        : null,
      burnoutRisk,
      participationStatus,
    };
  });

  // Sort: most overloaded first
  memberWorkloads.sort((a, b) => b.estimatedHours - a.estimatedHours);

  // Identify the most overloaded member
  const maxConcentration = memberWorkloads.length > 0
    ? memberWorkloads[0].percentageOfClubWorkload
    : 0;

  // Find members with available capacity (low workload, available hours declared)
  const availableMembers = memberWorkloads.filter(
    (m) => m.percentageOfClubWorkload < 20 && (m.weeklyAvailableHours || 0) > 5
  );

  // Build recommendations
  const recommendations = [];

  // Check for workload imbalance
  const overloadedMembers = memberWorkloads.filter(
    (m) => m.burnoutRisk.riskLevel === "critical" || m.burnoutRisk.riskLevel === "high"
  );

  for (const overloaded of overloadedMembers) {
    if (availableMembers.length > 0) {
      recommendations.push({
        type: "task_redistribution",
        urgency: overloaded.burnoutRisk.riskLevel === "critical" ? "high" : "medium",
        message: `Consider redistributing tasks from ${overloaded.name} (${overloaded.estimatedHours}h pending) to members with available capacity.`,
        suggestedFromId: overloaded.userId,
        suggestedToIds: availableMembers.map((m) => m.userId),
        explanation: `${overloaded.name} is carrying ${overloaded.percentageOfClubWorkload}% of the club's workload. ${availableMembers.map((m) => m.name).join(", ")} have matching availability. Leader approval required before any reassignment.`,
      });
    }
  }

  // Check for ghost member / declining participation
  const decliningMembers = memberWorkloads.filter(
    (m) =>
      m.participationStatus.status === "check_in_suggested" ||
      m.participationStatus.status === "activity_declining"
  );

  for (const declining of decliningMembers) {
    recommendations.push({
      type: "participation_checkin",
      urgency: declining.participationStatus.riskLevel === "action_needed" ? "medium" : "low",
      message: `${declining.name}: ${declining.participationStatus.explanation}`,
      memberId: declining.userId,
      explanation: declining.participationStatus.recommendation,
    });
  }

  return {
    totalClubHours,
    totalActiveTasks: activeTasks.length,
    memberWorkloads,
    workloadConcentrationIndex: maxConcentration,
    isHealthy: maxConcentration < THRESHOLDS.CRITICAL_CONCENTRATION && overloadedMembers.length === 0,
    recommendations,
    generatedAt: new Date().toISOString(),
    note: "Recommendations require leader review and approval before any task reassignment.",
  };
}

export { THRESHOLDS };
