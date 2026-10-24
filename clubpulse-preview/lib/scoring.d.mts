export type MemberSignal = 'Active' | 'Drifting' | 'Ghost' | 'On Break';
export type BurnoutLevel = 'Healthy' | 'Watch' | 'At Risk';
export interface ContributionEvent { points: number | string; createdAt?: string | number | Date; created_at?: string | number | Date }
export function contributionPoints(input?: { effortWeight?: number; onTime?: boolean; reviewMultiplier?: number }): number;
export function pulseScoreFromDecay(decayedPoints: number | string, committedHours?: number | string): number;
export function decayedContributionPoints(events?: ContributionEvent[], now?: number, halfLifeDays?: number): number;
export function classifyMember(input?: { pulseScore?: number; lastContributionAt?: string | number | Date | null; joinedAt?: string | number | Date; onBreak?: boolean; now?: number }): MemberSignal;
export function giniCoefficient(values?: Array<number | string>): number;
export function burnoutRisk(input?: { openTasks?: number; medianOpenTasks?: number; overdueRatio?: number; weeklyLoadChange?: number; daysWithoutBreak?: number; moodTrend?: number | null }): { score: number; level: BurnoutLevel; actions: string[] };
