import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  ArrowRight, BookOpen, Building2, CheckCircle2, ClipboardList,
  MessageSquareText, UserPlus, Users,
} from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { NextPageHeading, NextPanel } from '@/components/NextPrimitives';

export const dynamic = 'force-dynamic';

function GuideStep({
  number,
  title,
  children,
  href,
  linkLabel,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <article style={{
      display: 'grid',
      gridTemplateColumns: '34px minmax(0, 1fr)',
      gap: 12,
      padding: '14px 0',
      borderBottom: '1px solid var(--n-line)',
    }}>
      <span style={{
        display: 'grid',
        placeItems: 'center',
        width: 30,
        height: 30,
        borderRadius: 9,
        background: 'var(--n-panel2)',
        border: '1px solid var(--n-line)',
        color: 'var(--n-violet)',
        fontSize: 12,
        fontWeight: 800,
      }}>{number}</span>
      <div>
        <strong style={{ display: 'block', fontSize: 13, marginBottom: 5 }}>{title}</strong>
        <div style={{ color: 'var(--n-muted)', fontSize: 12, lineHeight: 1.75 }}>{children}</div>
        {href && (
          <Link href={href} className="next-inline-link" style={{ display: 'inline-flex', marginTop: 8 }}>
            {linkLabel || 'Open page'} <ArrowRight size={13}/>
          </Link>
        )}
      </div>
    </article>
  );
}

export default async function GuidePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const isAdmin = user.role === 'admin' || user.role === 'superadmin';
  const isLead = user.role === 'lead';
  const canManage = isAdmin || isLead;

  return (
    <div className="next-page-stack">
      <NextPageHeading
        eyebrow="HELP & WORKFLOW"
        title={<>How to use <em>ClubPulse.</em></>}
        description="A simple guide for running a college club, adding students, assigning work and recording contributions."
        action={<span className="next-count-pill">Your role: {user.role === 'superadmin' ? 'Super Admin' : user.role === 'admin' ? 'Admin' : user.role === 'lead' ? 'Club Lead' : 'Student'}</span>}
      />

      <NextPanel title="The whole process" description="ClubPulse follows one simple path from joining a club to recording completed work.">
        <div className="next-workflow-rail">
          <div><span>01</span><strong>Club</strong><small>Create a club</small></div>
          <i>→</i>
          <div><span>02</span><strong>Students</strong><small>Add or recruit</small></div>
          <i>→</i>
          <div><span>03</span><strong>Tasks</strong><small>Assign the work</small></div>
          <i>→</i>
          <div><span>04</span><strong>Progress</strong><small>Complete and review</small></div>
        </div>
      </NextPanel>

      {canManage ? (
        <NextPanel title="For club leads and administrators" description="Set up your club first, then bring students into the team.">
          <GuideStep number="1" title="Create a club">
            Add the club name, category and basic information. A lead-created club is linked to that lead's account. For an administrator-created club, mark the responsible person as Club Lead on the Members page and give their registered account Club Lead access in People & Roles.
          </GuideStep>
          <GuideStep number="2" title="Add students or assign a lead" href="/members" linkLabel="Open Members">
            Open Members, enter the student's name, college email and club, then select Add student. This saves a membership record. If the student already has an account with that email, it connects automatically.
          </GuideStep>
          <GuideStep number="3" title="Ask a new student to register">
            Share the website's Register page with the student. They must create their own password and use the exact same email address that you added. The Members list will then show their account as Registered. Do not ask students to share passwords.
            {' '}<Link href="/register">Open registration</Link>.
          </GuideStep>
          <GuideStep number="4" title="Create an opening (optional)" href="/recruitment" linkLabel="Open Recruitment">
            Publish a role such as Designer or Event Coordinator. Students can apply from their accounts. When a lead accepts an applicant, the system adds the student to the club roster.
          </GuideStep>
          <GuideStep number="5" title="Assign a task" href="/tasks" linkLabel="Open Tasks">
            Choose the club, write a short task title, pick a student from that club's saved member list, and set a deadline and priority. The task is saved in PostgreSQL.
          </GuideStep>
          <GuideStep number="6" title="Review real progress" href="/fairwork" linkLabel="Open FairWork">
            Check whether work is overdue or concentrated on a few people. FairWork can suggest a task handover. Review the suggestion before applying it.
          </GuideStep>
        </NextPanel>
      ) : (
        <NextPanel title="For students" description="Your account is your personal workspace. You do not need to create tasks or manage other students.">
          <GuideStep number="1" title="Register with your college email">
            If your lead added you already, use that exact email address on the Register page. Create your own password, sign in and your club membership should appear in your workspace. If you are not on a club roster yet, browse clubs and apply for an open role.
            {' '}<Link href="/register">Create your account</Link>.
          </GuideStep>
          <GuideStep number="2" title="Find a club or opening" href="/clubs" linkLabel="Browse clubs">
            Read the club profile, meeting information and published roles. Use Recruitment to apply for an opening.
          </GuideStep>
          <GuideStep number="3" title="Check your assigned work" href="/tasks" linkLabel="Open My Tasks">
            Open a task to read its deadline and priority. When you start, change the status to In Progress. When you finish, choose Completed.
          </GuideStep>
          <GuideStep number="4" title="Share feedback" href="/feedback" linkLabel="Open Feedback">
            Submit feedback about club activities or send your weekly mood check-in. Your individual weekly mood response is not shown to club leads.
          </GuideStep>
        </NextPanel>
      )}

      <NextPanel title="What gets saved?" description="These actions write to the connected PostgreSQL database in the Live Workspace.">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10 }}>
          {[
            { icon: Building2, title: 'Club profiles', text: 'Name, category, club details and status.' },
            { icon: Users, title: 'Memberships', text: 'Student name, email, club and membership status.' },
            { icon: ClipboardList, title: 'Tasks', text: 'Owner, deadline, priority and progress.' },
            { icon: CheckCircle2, title: 'Contributions', text: 'Recorded assignment and completion events.' },
            { icon: UserPlus, title: 'Applications', text: 'Role applications and review decisions.' },
            { icon: MessageSquareText, title: 'Feedback', text: 'Ratings, comments and review status.' },
          ].map((item) => (
            <div key={item.title} style={{ padding: 13, border: '1px solid var(--n-line)', borderRadius: 10, background: 'var(--n-panel2)' }}>
              <item.icon size={17} color="var(--n-violet)"/>
              <strong style={{ display: 'block', fontSize: 12, marginTop: 8 }}>{item.title}</strong>
              <p style={{ margin: '4px 0 0', fontSize: 11, lineHeight: 1.65, color: 'var(--n-muted)' }}>{item.text}</p>
            </div>
          ))}
        </div>
      </NextPanel>

      <div className="next-notice info">
        <BookOpen size={16}/>
        <span><strong>Live Workspace vs Demo:</strong> The Live Workspace saves the records listed above. The Interactive Demo uses separate sample data; resetting the demo clears only those temporary changes. In this version, one student email can be linked to one primary club.</span>
      </div>
    </div>
  );
}
