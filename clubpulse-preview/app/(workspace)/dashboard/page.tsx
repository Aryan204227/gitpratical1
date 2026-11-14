import Link from 'next/link';
import { ArrowRight, BarChart3, CheckCircle2, ClipboardList, Clock3, MessageSquareText, Target, Users } from 'lucide-react';
import { getDashboardSnapshot, getMemberDashboard, getLeadDashboard } from '@/lib/read-model';
import { getCurrentUser } from '@/lib/auth';
import { NextPageHeading, NextPanel, NextStatus, NextEmpty } from '@/components/NextPrimitives';

export const dynamic = 'force-dynamic';

function Metric({ label, value, note, icon: Icon }: { label: string; value: string | number; note: string; icon: typeof Users }) {
  return (
    <article className="next-metric-card">
      <div className="next-metric-label">{label}<span><Icon size={17}/></span></div>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}

function QuickLink({ href, title, description, icon: Icon }: { href: string; title: string; description: string; icon: typeof Users }) {
  return <Link href={href} className="next-module-link">
    <span className="next-module-link-icon"><Icon size={18}/></span>
    <span><b>{title}</b><small>{description}</small></span>
    <ArrowRight size={15}/>
  </Link>;
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const role = user?.role || 'member';

  if (role === 'member') {
    const data = await getMemberDashboard(user?.id ?? 0);
    return (
      <div className="next-page-stack">
        <NextPageHeading
          eyebrow="MY WORKSPACE"
          title={<>Hello, <em>{user?.name}</em></>}
          description="Your tasks, club details and contribution history in one place."
          action={<span className="next-count-pill">Student account</span>}
        />
        <div className="next-metric-grid">
          <Metric label="Open tasks" value={data.openTasks} note={`${data.completedTasks} completed of ${data.totalTasks}`} icon={ClipboardList}/>
          <Metric label="Contribution points" value={data.totalPoints} note="From recorded completed work" icon={CheckCircle2}/>
          <Metric label="My club" value={data.member?.club || 'Not joined'} note={data.member?.role || 'No club role yet'} icon={Users}/>
          <Metric label="Applications" value={data.applications?.length ?? 0} note="Applications submitted" icon={Target}/>
        </div>
        <div className="next-two-col">
          <NextPanel title="My tasks" description="Update a task when you start or finish the work." action={<Link href="/tasks" className="next-inline-link">Open task board <ArrowRight size={13}/></Link>}>
            {data.tasks.length === 0 ? <NextEmpty title="No tasks assigned" description="When your club lead assigns work to you, it will appear here."/> :
              <div className="dashboard-list">{data.tasks.slice(0,6).map((task: any)=><article className="dashboard-list-row" key={task.id}>
                <div><Link href={`/tasks/${task.id}`} className="dashboard-row-title">{task.title}</Link><small>{task.club} · Due {task.due_date || 'not set'}</small></div><NextStatus status={task.status}/>
              </article>)}</div>}
          </NextPanel>
          <NextPanel title="Recent contributions" description="A history of work recorded against your account.">
            {data.events.length === 0 ? <NextEmpty title="Nothing recorded yet" description="Completed tasks and other recorded activities will appear here."/> :
              <div className="dashboard-list">{data.events.slice(0,6).map((event: any)=><article className="dashboard-list-row" key={event.id}>
                <div><strong className="dashboard-row-title">{event.task || event.event_type.replaceAll('_',' ')}</strong><small>{new Date(event.created_at).toLocaleDateString()}</small></div><span className="dashboard-points">+{event.points} pts</span>
              </article>)}</div>}
          </NextPanel>
        </div>
        {(data.applications?.length ?? 0)>0 && <NextPanel title="My applications" description="Updates from club openings you applied to.">
          <div className="dashboard-list">{data.applications.map((application: any)=><article className="dashboard-list-row" key={application.id}><strong className="dashboard-row-title">{application.opening}</strong><NextStatus status={application.status}/></article>)}</div>
        </NextPanel>}
        <div className="next-module-cards">
          <QuickLink href="/clubs" title="Browse clubs" description="Find a club and see its open roles." icon={Users}/>
          <QuickLink href="/feedback" title="Share feedback" description="Tell your club what is working and what needs attention." icon={MessageSquareText}/>
        </div>
      </div>
    );
  }

  if (role === 'lead') {
    const data = await getLeadDashboard(user?.id ?? 0);
    return (
      <div className="next-page-stack">
        <NextPageHeading eyebrow="CLUB LEAD WORKSPACE" title={<>Your club, <em>in view.</em></>} description={data.clubName ? `Current work and team activity for ${data.clubName}.` : 'Your assigned club operations and team activity.'} action={<span className="next-count-pill">Club lead</span>}/>
        <div className="next-metric-grid">
          <Metric label="Open tasks" value={data.myOpenTasks} note={`${data.myCompletedTasks} completed`} icon={ClipboardList}/>
          <Metric label="Team members" value={data.teamMembers.length} note="Active club roster" icon={Users}/>
          <Metric label="Unassigned" value={data.unassignedTasks.length} note={`${data.overdueTasks.length} overdue tasks`} icon={Clock3}/>
          <Metric label="Applications to review" value={data.applicationsToReview.length} note="Waiting for a decision" icon={Target}/>
        </div>
        <div className="dashboard-actions">
          <Link href="/tasks" className="next-primary-btn">Manage tasks <ArrowRight size={14}/></Link>
          <Link href="/recruitment" className="next-secondary-btn">Review applications</Link>
          <Link href="/fairwork" className="next-secondary-btn">Review workload</Link>
        </div>
        <div className="next-two-col">
          <NextPanel title="Needs attention" description="Overdue and unassigned work appears first.">
            {data.overdueTasks.length + data.unassignedTasks.length === 0 ? <NextEmpty title="Nothing needs attention" description="There are no overdue or unassigned tasks right now."/> :
              <div className="dashboard-list">
                {data.overdueTasks.map((task: any)=><article className="dashboard-list-row" key={`overdue-${task.id}`}><div><Link href={`/tasks/${task.id}`} className="dashboard-row-title">{task.title}</Link><small>Overdue · {task.owner}</small></div><NextStatus status="High"/></article>)}
                {data.unassignedTasks.map((task: any)=><article className="dashboard-list-row" key={`unassigned-${task.id}`}><div><Link href={`/tasks/${task.id}`} className="dashboard-row-title">{task.title}</Link><small>Unassigned · {task.due_date || 'No deadline'}</small></div><Link href="/tasks" className="next-inline-link">Assign <ArrowRight size={12}/></Link></article>)}
              </div>}
          </NextPanel>
          <NextPanel title="Team workload" description="A quick view of open tasks for each active member." action={<Link href="/fairwork" className="next-inline-link">Open FairWork <ArrowRight size={13}/></Link>}>
            {data.teamMembers.length === 0 ? <NextEmpty title="No members on the roster" description="Add students to your club to see their workload here."/> :
              <div className="dashboard-list">{data.teamMembers.map((member: any)=><article className="dashboard-list-row" key={member.id}>
                <div className="dashboard-person"><span className="next-avatar small">{String(member.name).slice(0,1).toUpperCase()}</span><span><strong className="dashboard-row-title">{member.name}</strong><small>{member.on_break ? 'On approved break' : `${member.committed_hours || 4} committed hours / week`}</small></span></div>
                <span className="dashboard-points">{member.open_tasks} open</span>
              </article>)}</div>}
          </NextPanel>
        </div>
        <div className="next-module-cards">
          <QuickLink href="/members" title="Manage members" description="Add students and check account links." icon={Users}/>
          <QuickLink href="/recruitment" title="Recruitment" description="Review candidates and fill open roles." icon={Target}/>
          <QuickLink href="/feedback" title="Member feedback" description="Read feedback and agree follow-up actions." icon={MessageSquareText}/>
        </div>
      </div>
    );
  }

  const data = await getDashboardSnapshot();
  const total = Number(data.tasks.total) || 0;
  const completed = Number(data.tasks.completed) || 0;
  const completion = total ? Math.round((completed / total) * 100) + '%' : '—';
  const max = Math.max(1, ...data.trend.map((point: any) => Math.max(Number(point.assigned)||0,Number(point.completed)||0)));
  const maxLoad = Math.max(1, ...data.workload.map((item: any)=>Number(item.open_tasks)||0));

  return (
    <div className="next-page-stack">
      <NextPageHeading eyebrow="WORKSPACE OVERVIEW" title={<>Club activity, <em>at a glance.</em></>} description="A summary of saved club records, task progress, recruitment and workload distribution." action={<span className="next-count-pill">Administrator</span>}/>
      <section className="next-hero next-hero-simple">
        <div className="next-hero-copy">
          <span className="next-eyebrow">CLUB CONTRIBUTION MANAGEMENT · P18</span>
          <h2>Make the work <em>easier to share.</em></h2>
          <p>Keep club membership, recruitment and event tasks connected. Use the records below to see what needs attention and where a handover may help.</p>
          <div className="next-hero-actions"><Link href="/tasks" className="next-primary-btn">View tasks <ArrowRight size={14}/></Link><Link href="/fairwork" className="next-secondary-btn">Review workload</Link></div>
        </div>
        <div className="next-hero-summary">
          <div><span>ACTIVE MEMBERS</span><strong>{data.members}</strong></div>
          <div><span>OPEN TASKS</span><strong>{data.tasks.open}</strong></div>
          <div><span>WORKLOAD GINI</span><strong>{Math.round(data.workloadGini*100)}<small>/100</small></strong></div>
        </div>
      </section>
      <div className="next-metric-grid">
        <Metric label="Active members" value={data.members} note="Active roster records" icon={Users}/>
        <Metric label="Task completion" value={completion} note={`${completed} completed of ${total} tasks`} icon={CheckCircle2}/>
        <Metric label="Open tasks" value={data.tasks.open} note="Still in progress or awaiting work" icon={ClipboardList}/>
        <Metric label="Applications" value={data.applications} note="Awaiting review" icon={Target}/>
      </div>
      <div className="next-two-col">
        <NextPanel title="Participation check-in" description="A recency signal from recorded contributions. It is a prompt to check in, not a judgement about a student.">
          <div className="next-pulse-counts">
            <span className="pulse-count active"><b>{data.pulseCounts.active}</b><small>Active</small></span>
            <span className="pulse-count drifting"><b>{data.pulseCounts.drifting}</b><small>Drifting</small></span>
            <span className="pulse-count ghost"><b>{data.pulseCounts.ghost}</b><small>Ghost</small></span>
            <span className="pulse-count on-break"><b>{data.pulseCounts.onBreak}</b><small>On break</small></span>
          </div>
          <div className="next-pulse-list">
            {data.memberSignals.filter((member: any)=>member.status!=='Active').slice(0,5).map((member: any)=><article className="next-pulse-member" key={member.id}>
              <span className="next-pulse-avatar"><Users size={14}/></span>
              <div className="next-pulse-member-main"><strong>{member.name}</strong><small>{member.status==='On Break'?'On approved break':member.daysSinceContribution<0?'No contribution recorded':`${member.daysSinceContribution} days since last contribution`}</small></div>
              <span className="next-pulse-score"><b>{member.pulseScore}</b><small>PULSE</small></span>
            </article>)}
            {!data.memberSignals.some((member: any)=>member.status!=='Active')&&<NextEmpty title="No follow-up is flagged" description="No member currently falls outside the active range."/>}
          </div>
        </NextPanel>
        <NextPanel title="Workload distribution" description="Open work by member. A higher concentration can be a reason to review assignments." action={<Link href="/fairwork" className="next-inline-link">Open FairWork <ArrowRight size={13}/></Link>}>
          <div className="dashboard-list">
            {data.workload.slice(0,7).map((item: any)=>{
              const open=Number(item.open_tasks)||0;
              return <article className="dashboard-workload-row" key={item.owner}>
                <div className="dashboard-workload-label"><strong>{item.owner}</strong><span>{open} open</span></div>
                <div className="dashboard-progress"><i style={{width:`${Math.round(open/maxLoad*100)}%`}}/></div>
                <small>{item.priority_tasks} high-priority · {item.nearest_due ? `Next due ${item.nearest_due}` : 'No upcoming deadline'}</small>
              </article>;
            })}
            {!data.workload.length&&<NextEmpty title="No open tasks" description="Workload appears when tasks are assigned to club members."/>}
          </div>
          <p className="dashboard-note">Workload Gini: {Math.round(data.workloadGini*100)} / 100. This describes task distribution, not personal performance.</p>
        </NextPanel>
      </div>
      <div className="next-two-col">
        <NextPanel title="Weekly task activity" description="Assignments and completions recorded in the workspace.">
          {data.trend.length===0?<NextEmpty title="No activity to chart" description="Weekly activity will appear after tasks are created and updated."/>:
            <div className="next-chart">
              <div className="next-chart-grid"><i/><i/><i/><i/></div>
              <div className="next-chart-bars">{data.trend.map((point: any,index: number)=>{
                const assigned=Number(point.assigned)||0;const done=Number(point.completed)||0;
                return <div className="next-chart-day" key={String(point.week)+index}><div className="next-bar-pair"><span className="assigned" style={{height:`${Math.max(3,assigned/max*100)}%`}}/><span className="completed" style={{height:`${Math.max(3,done/max*100)}%`}}/></div><small>{point.week}</small></div>;
              })}</div>
            </div>}
          <div className="next-chart-legend"><span><i/>Assigned</span><span><i/>Completed</span></div>
        </NextPanel>
        <NextPanel title="Club overview" description="Saved clubs and their current task progress." action={<Link href="/clubs" className="next-inline-link">All clubs <ArrowRight size={13}/></Link>}>
          {data.clubs.length===0?<NextEmpty title="No clubs added" description="Create a club profile to start using the workspace."/>:
            <div className="dashboard-list">{data.clubs.slice(0,6).map((club: any)=>{
              const percent=Number(club.task_count)>0?Math.round(Number(club.completed_count)/Number(club.task_count)*100):0;
              return <article className="dashboard-workload-row" key={club.id}>
                <div className="dashboard-workload-label"><strong>{club.name}</strong><span>{percent}%</span></div>
                <div className="dashboard-progress"><i style={{width:`${percent}%`}}/></div>
                <small>{club.member_count} members · {club.task_count} tasks</small>
              </article>;
            })}</div>}
        </NextPanel>
      </div>
      <div className="next-module-cards">
        <QuickLink href="/clubs" title="Clubs & members" description="Manage club profiles, rosters and leads." icon={Users}/>
        <QuickLink href="/tasks" title="Task board" description="Assign work, follow deadlines and record completion." icon={ClipboardList}/>
        <QuickLink href="/analytics" title="Analytics" description="Review feedback and club-level patterns." icon={BarChart3}/>
      </div>
    </div>
  );
}