import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Clock3, Tag, User, Workflow, Calendar, Shield } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { getTask } from '@/lib/read-model';
import { updateTaskStatusAction } from '@/app/actions';
import { NextPageHeading, NextPanel, NextStatus, NextEmpty } from '@/components/NextPrimitives';

export const dynamic = 'force-dynamic';

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [user, { id }] = await Promise.all([getCurrentUser(), params]);
  if (!user) redirect('/login');

  const taskId = Number(id);
  if (!Number.isInteger(taskId) || taskId < 1) notFound();

  const task = await getTask(taskId);
  if (!task) notFound();

  const canManage = user.role === 'admin' || user.role === 'lead' || task.owner.toLowerCase().trim() === user.name.toLowerCase().trim();

  return (
    <div className="next-page-stack">
      <Link href="/tasks" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--cp-lime, #c6ff3d)', textDecoration: 'none', fontSize: '0.85rem' }}>
        <ArrowLeft size={14} /> Back to tasks board
      </Link>

      <NextPageHeading
        eyebrow={`TASK #${task.id} · ${task.club.toUpperCase()}`}
        title={task.title}
        description={task.description || 'No detailed description provided.'}
        action={<NextStatus status={task.status} />}
      />

      <div className="next-metric-grid">
        <article className="next-metric-card">
          <div className="next-metric-label">Assigned Owner <span><User size={17} /></span></div>
          <strong>{task.owner}</strong>
          <small>{task.owner === user.name ? 'Assigned to you' : 'Workspace member'}</small>
        </article>
        <article className="next-metric-card">
          <div className="next-metric-label">Priority <span><Tag size={17} /></span></div>
          <strong>{task.priority}</strong>
          <small>Effort weight: {task.effort_weight}/5</small>
        </article>
        <article className="next-metric-card">
          <div className="next-metric-label">Due Date <span><Calendar size={17} /></span></div>
          <strong>{task.due_date || 'No deadline'}</strong>
          <small>Created {new Date(task.created_at).toLocaleDateString()}</small>
        </article>
        <article className="next-metric-card">
          <div className="next-metric-label">Status <span><Clock3 size={17} /></span></div>
          <strong>{task.status}</strong>
          <small>Last updated {new Date(task.updated_at).toLocaleDateString()}</small>
        </article>
      </div>

      <div className="next-two-col">
        <NextPanel
          title="Update Task Status"
          description={canManage ? 'Progress this task across workflow stages. The server awards a contribution point when marked Completed.' : 'Only the assigned owner or a club lead may update this task.'}
        >
          {canManage ? (
            <form action={updateTaskStatusAction} className="next-form">
              <input type="hidden" name="taskId" value={task.id} />
              <label>
                Change workflow status
                <select name="status" defaultValue={task.status}>
                  <option value="To do">To do</option>
                  <option value="In progress">In progress</option>
                  <option value="In review">In review</option>
                  <option value="Completed">Completed</option>
                  <option value="Blocked">Blocked</option>
                </select>
              </label>
              <button type="submit" className="next-primary-btn">
                Update status <CheckCircle2 size={16} />
              </button>
            </form>
          ) : (
            <div className="next-empty">
              <Shield size={20} /> You do not have permission to modify this task.
            </div>
          )}
        </NextPanel>

        <NextPanel
          title="Recorded Contribution Events"
          description="Immutable timeline of database events recorded for this task."
        >
          {task.events.length === 0 ? (
            <NextEmpty
              title="No events yet"
              description="Events are recorded when the task is assigned or marked completed."
            />
          ) : (
            <div className="next-process-list">
              {task.events.map((e: any) => (
                <div key={e.id}>
                  <span><Workflow size={14} /></span>
                  <p>
                    <b>{e.event_type.replaceAll('_', ' ').toUpperCase()}</b>
                    <small>
                      Member: {e.member_name} · {e.points} points · {new Date(e.created_at).toLocaleString()}
                    </small>
                  </p>
                </div>
              ))}
            </div>
          )}
        </NextPanel>
      </div>
    </div>
  );
}
