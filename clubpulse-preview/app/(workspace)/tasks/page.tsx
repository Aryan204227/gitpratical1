import { redirect } from 'next/navigation';
import { Clock3 } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { getClubs, getMembers, getTasksForUser } from '@/lib/read-model';
import { canManageClub } from '@/lib/club-access';
import { TaskServerForm } from '@/components/TaskServerForm';
import { TaskBoard } from '@/components/TaskBoard';
import { TaskCsvImport } from '@/components/TaskCsvImport';
import { NextPageHeading, NextPanel, NextEmpty, NextNotice } from '@/components/NextPrimitives';

export const dynamic = 'force-dynamic';

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; updated?: string; imported?: string; error?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const [tasks, allClubs, members, params] = await Promise.all([
    getTasksForUser(user),
    getClubs(),
    getMembers(user),
    searchParams,
  ]);
  const canManage = ['admin', 'superadmin', 'lead'].includes(user.role);
  const clubs = user.role === 'admin' || user.role === 'superadmin'
    ? allClubs.filter((club: any) => club.status !== 'Archived')
    : (await Promise.all(allClubs.map(async (club: any) => (
        await canManageClub(user, Number(club.id)) && club.status !== 'Archived' ? club : null
      )))).filter(Boolean) as Array<{ id: number; name: string; status: string }>;
  const linkedMember = members.find((member: any) =>
    String(member.email).trim().toLowerCase() === user.email.trim().toLowerCase()
  );

  return (
    <div className="next-page-stack">
      <NextPageHeading
        eyebrow="TASKS"
        title={<>Work, made <em>clear.</em></>}
        description={canManage
          ? 'Create a task, choose its club and select a student from that club. Update its status as the work moves forward.'
          : 'These are the tasks assigned to you. Update the status when you start or finish your work.'}
        action={<span className="next-count-pill">{tasks.length} saved tasks</span>}
      />

      {params.created && <NextNotice tone="success">Task saved. The assignment is now in the database.</NextNotice>}
      {params.imported && <NextNotice tone="success">Imported {params.imported} tasks from the CSV file.</NextNotice>}
      {params.updated && <NextNotice tone="success">Task status updated and contribution history refreshed.</NextNotice>}
      {params.error === 'invalid-owner' && <NextNotice tone="error">Choose a student who belongs to the selected club, or leave the task unassigned.</NextNotice>}
      {params.error === 'forbidden' && <NextNotice tone="error">You do not have permission to create tasks for that club.</NextNotice>}
      {params.error && !['invalid-owner', 'forbidden'].includes(params.error) && <NextNotice tone="error">The task could not be saved. Check the form and try again.</NextNotice>}

      {canManage ? (
        <NextPanel title="Create a task" description="Choose a club first, then select one of its saved students.">
          <TaskServerForm
            clubs={clubs.map((club: any) => ({ id: Number(club.id), name: String(club.name) }))}
            members={members.map((member: any) => ({
              id: Number(member.id),
              name: String(member.name),
              email: String(member.email),
              club_id: member.club_id === null ? null : Number(member.club_id),
              has_account: Boolean(member.has_account),
              active: Boolean(member.active),
            }))}
          />
        </NextPanel>
      ) : (
        <NextPanel title="Your task workflow" description="Work through your own assigned tasks. Your updates are saved for the club lead.">
          <div className="next-process-list">
            <div><span>01</span><p><b>To Do</b><small>Work has been assigned but not started.</small></p></div>
            <div><span>02</span><p><b>In Progress</b><small>Change the task status when you begin working.</small></p></div>
            <div><span>03</span><p><b>Completed</b><small>When you finish, mark it completed. ClubPulse records a contribution event.</small></p></div>
          </div>
        </NextPanel>
      )}

      {canManage && (
        <NextPanel title="How task tracking works" description="A simple three-step process.">
          <div className="next-process-list">
            <div><span>01</span><p><b>Assign</b><small>Choose a saved student from the selected club or leave the task unassigned.</small></p></div>
            <div><span>02</span><p><b>Follow progress</b><small>The student changes the task status after signing in with their registered email.</small></p></div>
            <div><span>03</span><p><b>Record contribution</b><small>The first move to Completed creates one contribution event in the database.</small></p></div>
          </div>
        </NextPanel>
      )}

      {canManage && (
        <NextPanel title="Import tasks from a spreadsheet" description="Use the CSV template if you have many tasks to add at once.">
          <TaskCsvImport />
        </NextPanel>
      )}

      <NextPanel title={canManage ? 'Club task board' : 'My tasks'} description={canManage ? 'Manage tasks for the clubs you are allowed to manage.' : 'You only see the tasks assigned to your account or matching club membership.'}>
        {tasks.length === 0
          ? <NextEmpty title="No tasks yet" description={canManage ? 'Create your first task above. It will appear here after saving.' : 'Your club lead has not assigned you a task yet.'} />
          : <TaskBoard initialTasks={tasks} userName={user.name} memberName={linkedMember?.name || ''} canManageAll={canManage} />}
      </NextPanel>
    </div>
  );
}
