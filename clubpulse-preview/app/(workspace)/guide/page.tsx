import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { NextPageHeading, NextPanel } from '@/components/NextPrimitives';

export const dynamic = 'force-dynamic';

export default async function GuidePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const canManage = ['admin', 'superadmin', 'lead'].includes(user.role);
  const roleLabel = user.role === 'superadmin' ? 'Super Admin' : user.role === 'admin' ? 'Club Admin' : user.role === 'lead' ? 'Club Lead' : 'Student';

  return (
    <div className="next-page-stack">
      <NextPageHeading
        eyebrow="HELP"
        title={<>ClubPulse <em>at a glance</em></>}
        description={`Signed in as ${roleLabel}. Use the links below to get straight to the work you need to do.`}
      />

      {canManage ? (
        <NextPanel title="Club management" description="The usual flow for running a club.">
          <div className="next-quick-links">
            <Link href="/clubs"><strong>Clubs</strong><span>Create or update a club profile, meeting details and contact information.</span></Link>
            <Link href="/members"><strong>Members</strong><span>Maintain the club roster and connect student accounts.</span></Link>
            <Link href="/recruitment"><strong>Recruitment</strong><span>Publish openings and review student applications.</span></Link>
            <Link href="/tasks"><strong>Tasks</strong><span>Assign work, set deadlines and follow progress.</span></Link>
            <Link href="/fairwork"><strong>FairWork</strong><span>Review workload concentration and decide whether a task should be reassigned.</span></Link>
            <Link href="/analytics"><strong>Analytics</strong><span>Review participation and task completion based on saved records.</span></Link>
          </div>
        </NextPanel>
      ) : (
        <NextPanel title="Your student workspace" description="Your workspace focuses on your own club activity.">
          <div className="next-quick-links">
            <Link href="/clubs"><strong>Find a club</strong><span>Explore club profiles and see which teams are recruiting.</span></Link>
            <Link href="/recruitment"><strong>Apply for a role</strong><span>Send an application to a club with an open position.</span></Link>
            <Link href="/tasks"><strong>My tasks</strong><span>Check deadlines and update the status of your assigned work.</span></Link>
            <Link href="/feedback"><strong>Feedback</strong><span>Share feedback about your club experience.</span></Link>
          </div>
        </NextPanel>
      )}

      <div className="next-notice info">
        <span>Changes made in the Live Workspace are saved to the connected database. The public Demo is separate and uses sample records; demo actions do not change real club data.</span>
      </div>
    </div>
  );
}
