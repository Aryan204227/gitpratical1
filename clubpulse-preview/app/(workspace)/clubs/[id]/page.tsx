import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, ArrowRight, BriefcaseBusiness, CheckCircle2, CheckSquare, Users, CalendarDays, Globe2, Mail, Activity, MessageSquareText } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { getClubWithDetails } from '@/lib/read-model';
import { canManageClub } from '@/lib/club-access';
import { ClubProfileManager } from '@/components/ClubProfileManager';
import { NextPageHeading, NextPanel, NextStatus, NextEmpty, NextNotice } from '@/components/NextPrimitives';

export const dynamic = 'force-dynamic';

export default async function ClubDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ updated?: string; error?: string }>;
}) {
  const [user, { id }, query] = await Promise.all([getCurrentUser(), params, searchParams]);
  if (!user) redirect('/login');

  const clubId = Number(id);
  if (!Number.isInteger(clubId) || clubId < 1) notFound();

  const club = await getClubWithDetails(clubId);
  if (!club) notFound();
  const canManage = await canManageClub(user, clubId);
  const taskPct = club.task_count > 0 ? Math.round((club.completed_count / club.task_count) * 100) : null;

  return (
    <div className="next-page-stack">
      <Link href="/clubs" className="club-back-link"><ArrowLeft size={14}/> Back to clubs directory</Link>
      {query.updated && <NextNotice tone="success">Club profile changes saved.</NextNotice>}
      {query.error === 'forbidden' && <NextNotice tone="error">You do not have permission to manage this club.</NextNotice>}
      {query.error === 'invalid-profile' && <NextNotice tone="error">Please check the profile fields and try again.</NextNotice>}

      <NextPageHeading
        eyebrow={`CLUB PROFILE · ${String(club.category || 'GENERAL').toUpperCase()}`}
        title={club.name}
        description={club.description || 'A student club workspace connecting people, recruitment, tasks and contribution history.'}
        action={<NextStatus status={club.status}/>}
      />

      <div className="club-profile-facts">
        <span><Users size={15}/> Lead: <strong>{club.lead_name || 'Not assigned'}</strong></span>
        {club.meeting_schedule && <span><CalendarDays size={15}/> {club.meeting_schedule}</span>}
        {club.contact_email && <span><Mail size={15}/><a href={'mailto:'+club.contact_email}>{club.contact_email}</a></span>}
        {club.website_url && <span><Globe2 size={15}/><a href={club.website_url} target="_blank" rel="noopener noreferrer">Club website</a></span>}
      </div>

      <div className="next-metric-grid">
        <article className="next-metric-card"><div className="next-metric-label">Active Members <span><Users size={17}/></span></div><strong>{club.member_count}</strong><small>Active roster records</small></article>
        <article className="next-metric-card"><div className="next-metric-label">Tasks Total <span><CheckSquare size={17}/></span></div><strong>{club.task_count}</strong><small>{club.completed_count} marked completed</small></article>
        <article className="next-metric-card"><div className="next-metric-label">Completion Rate <span><CheckCircle2 size={17}/></span></div><strong>{taskPct === null ? '—' : taskPct+'%'}</strong><small>Based on saved records</small></article>
        <article className="next-metric-card"><div className="next-metric-label">Open Roles <span><BriefcaseBusiness size={17}/></span></div><strong>{club.openings.filter((opening: any)=>opening.status==='Open').length}</strong><small>Recruitment positions</small></article>
        <article className="next-metric-card"><div className="next-metric-label">Contributions <span><Activity size={17}/></span></div><strong>{club.contributionSummary?.total_events ?? 0}</strong><small>{club.contributionSummary?.contributors ?? 0} recorded contributors</small></article>
        <article className="next-metric-card"><div className="next-metric-label">Member Feedback <span><MessageSquareText size={17}/></span></div><strong>{club.feedbackSummary?.averageRating ?? 'Private'}</strong><small>{club.feedbackSummary?.isPrivate ? 'Average hidden until 5 rated responses' : 'Group average rating'}</small></article>
      </div>

      <NextPanel title="About this club" description="Profile information maintained by the club's authorized lead or an administrator.">
        <p className="club-about-description">{club.description || 'No club description has been added yet.'}</p>
        <div className="club-about-meta">
          <span><CalendarDays size={14}/> {club.meeting_schedule || 'Meeting schedule not added'}</span>
          <span><span className="club-meta-dot"/> Created {new Date(club.created_at).toLocaleDateString()}</span>
        </div>
      </NextPanel>

      <div className="next-two-col">
        <NextPanel title="Club Members" description="Names and club roles are visible to signed-in workspace users. Personal email addresses are not shown here." action={<Link href="/members" className="next-inline-link">All members <ArrowRight size={13}/></Link>}>
          {club.members.length === 0 ? <NextEmpty title="No members yet" description="Onboard candidates through recruitment or assign existing members to this club."/> : (
            <div className="next-table-wrap"><table className="next-table"><thead><tr><th>Member</th><th>Role</th><th>Status</th></tr></thead><tbody>
              {club.members.map((member: any)=><tr key={member.id}>
                <td><div className="next-member-cell"><span className="next-avatar">{member.name.slice(0,1)}</span><span><strong>{member.name}</strong><small>Club member</small></span></div></td>
                <td><NextStatus status={member.role}/></td><td><NextStatus status={member.on_break?'On Break':member.active?'Active':'Inactive'}/></td>
              </tr>)}
            </tbody></table></div>
          )}
        </NextPanel>

        <NextPanel title="Club Tasks" description="Tasks assigned within this club." action={<Link href="/tasks" className="next-inline-link">Manage tasks <ArrowRight size={13}/></Link>}>
          {club.tasks.length === 0 ? <NextEmpty title="No tasks recorded" description="Create a task linked to this club to start tracking progress."/> : (
            <div className="club-task-list">{club.tasks.map((task: any)=><article className="club-task-item" key={task.id}>
              <div><Link href={'/tasks/'+task.id}>{task.title}</Link><small>Owner: {task.owner} · Due: {task.due_date || 'No date'}</small></div><NextStatus status={task.status}/>
            </article>)}</div>
          )}
        </NextPanel>
      </div>

      <NextPanel title="Recruitment Openings" description="Roles advertised by this club." action={<Link href="/recruitment" className="next-inline-link">Recruitment portal <ArrowRight size={13}/></Link>}>
        {club.openings.length === 0 ? <NextEmpty title="No open positions" description="Publish a new opening from the recruitment service to accept applications."/> : (
          <div className="next-role-grid">{club.openings.map((opening: any)=><article className="next-role-card" key={opening.id}>
            <div className="next-role-head"><span className="next-role-icon"><BriefcaseBusiness size={18}/></span><NextStatus status={opening.status}/></div>
            <h3>{opening.title}</h3><div className="next-role-foot"><span><Users size={14}/> {opening.applicant_count} applicants</span><small>Created {new Date(opening.created_at).toLocaleDateString()}</small></div>
          </article>)}</div>
        )}
      </NextPanel>

      {canManage && <ClubProfileManager club={club}/>}
    </div>
  );
}
