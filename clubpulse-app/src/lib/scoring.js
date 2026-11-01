/**
 * Calculates ghost member inactivity level and explainable rationale.
 * Non-punitive and supportive.
 */
export function calculateMemberInactivity(membership, recentClubMeetingsCount = 4) {
    if (membership.leaveDetails?.onLeave) {
        return {
            status: "on_leave",
            riskLevel: "none",
            explanation: `Approved academic/personal break until ${membership.leaveDetails.endDate || "specified date"} (${membership.leaveDetails.reason || "personal"}).`,
            recommendation: "Member is excused from participation. Respect break period.",
        };
    }
    const lastActive = new Date(membership.lastActiveAt).getTime();
    const now = new Date().getTime();
    const daysSinceActive = Math.round((now - lastActive) / (1000 * 60 * 60 * 24));
    const lowAttendance = membership.attendanceRate < 40;
    const noRecentTasks = membership.tasksCompleted === 0 && membership.tasksPending === 0;
    if (daysSinceActive > 30 || (lowAttendance && daysSinceActive > 20)) {
        return {
            status: "inactive",
            riskLevel: "action_needed",
            explanation: `No logged activity for ${daysSinceActive} days. Attendance rate is ${membership.attendanceRate}% across recent sessions, with 0 active tasks.`,
            recommendation: "Send friendly check-in reminder to explore if they need academic accommodation or lower-demand micro-tasks.",
        };
    }
    if (daysSinceActive > 14 || lowAttendance) {
        return {
            status: "low_activity",
            riskLevel: "watch",
            explanation: `Activity dipping (${daysSinceActive} days since last interaction). Attendance rate is ${membership.attendanceRate}%.`,
            recommendation: "Pair with a sub-team buddy or suggest an upcoming workshop suited to their stated skills.",
        };
    }
    return {
        status: "active",
        riskLevel: "none",
        explanation: `Consistently active. Recent check-in ${daysSinceActive} days ago with ${membership.attendanceRate}% attendance.`,
        recommendation: "Well engaged. Eligible for leadership task delegation.",
    };
}
/**
 * Calculates burnout risk for leaders and coordinators.
 * Evaluates individual hours and workload concentration across the team.
 */
export function calculateBurnoutRisk(estimatedHours, pendingTasks, percentageOfClubWorkload) {
    if (estimatedHours >= 24 || percentageOfClubWorkload >= 45 || pendingTasks >= 7) {
        return {
            riskLevel: "critical",
            color: "text-red-600 dark:text-red-400",
            badgeBg: "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-red-200 dark:border-red-900",
            warning: "Extreme workload concentration! Overloaded by 2x recommended student-leader threshold.",
        };
    }
    if (estimatedHours >= 14 || percentageOfClubWorkload >= 30 || pendingTasks >= 4) {
        return {
            riskLevel: "high",
            color: "text-amber-600 dark:text-amber-400",
            badgeBg: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900",
            warning: "Elevated burnout risk. Heavy responsibility concentration.",
        };
    }
    if (estimatedHours >= 8 || pendingTasks >= 2) {
        return {
            riskLevel: "medium",
            color: "text-blue-600 dark:text-blue-400",
            badgeBg: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-900",
            warning: "Moderate workload within manageable capacity.",
        };
    }
    return {
        riskLevel: "low",
        color: "text-emerald-600 dark:text-emerald-400",
        badgeBg: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900",
    };
}
/**
 * Computes Club Trust Score (0 - 100) based on verified evidence vs promised deliverables.
 */
export function computeClubTrustScore(promises, evidenceList, activeMemberRatio = 0.75) {
    const totalPromises = promises.length || 1;
    const deliveredPromises = promises.filter((p) => p.delivered).length;
    const promiseCompletionRate = Math.round((deliveredPromises / totalPromises) * 100);
    const totalEvidence = evidenceList.length || 1;
    const verifiedEvidence = evidenceList.filter((e) => e.status === "verified").length;
    const verifiedEvidenceRate = Math.round((verifiedEvidence / totalEvidence) * 100);
    // 45% weight on delivered promises, 35% on verified evidence, 20% on active member retention
    const promisesWeight = (promiseCompletionRate * 0.45);
    const evidenceWeight = (verifiedEvidenceRate * 0.35);
    const retentionWeight = (Math.min(activeMemberRatio * 100, 100) * 0.20);
    const score = Math.round(promisesWeight + evidenceWeight + retentionWeight);
    let tier = "Under Review";
    if (score >= 85)
        tier = "Tier 1 - Gold";
    else if (score >= 70)
        tier = "Tier 2 - Silver";
    else if (score >= 50)
        tier = "Tier 3 - Bronze";
    return {
        score,
        tier,
        promiseCompletionRate,
        verifiedEvidenceRate,
        breakdown: {
            promisesDeliveredScore: Math.round(promisesWeight),
            evidenceVerifiedScore: Math.round(evidenceWeight),
            memberRetentionScore: Math.round(retentionWeight),
        },
    };
}
