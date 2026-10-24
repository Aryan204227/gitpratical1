'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarClock, CheckCircle2, CircleDashed, GripVertical, LayoutGrid, List, LoaderCircle, Search, ShieldAlert } from 'lucide-react';

type TaskStatus = 'To do' | 'In progress' | 'In review' | 'Completed' | 'Blocked';
type BoardTask = {
  id: number;
  title: string;
  description?: string;
  owner: string;
  due_date?: string | null;
  status: string;
  priority: string;
  club?: string | null;
};
const STATUSES: TaskStatus[] = ['To do', 'In progress', 'In review', 'Completed', 'Blocked'];
const statusClass: Record<TaskStatus, string> = {
  'To do': 'todo',
  'In progress': 'progress',
  'In review': 'review',
  Completed: 'completed',
  Blocked: 'blocked',
};

export function TaskBoard({ initialTasks, userName, canManageAll }: { initialTasks: BoardTask[]; userName: string; canManageAll: boolean }) {
  const router = useRouter();
  const [tasks, setTasks] = useState<BoardTask[]>(initialTasks);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [view, setView] = useState<'board' | 'list'>('board');
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => setTasks(initialTasks), [initialTasks]);

  const visibleTasks = useMemo(() => tasks.filter((task) => {
    const haystack = [task.title, task.owner, task.club || '', task.priority, task.status].join(' ').toLowerCase();
    return haystack.includes(query.trim().toLowerCase()) && (statusFilter === 'all' || task.status === statusFilter);
  }), [tasks, query, statusFilter]);

  const canUpdate = (task: BoardTask) => canManageAll || task.owner.trim().toLocaleLowerCase() === userName.trim().toLocaleLowerCase();

  async function updateStatus(taskId: number, nextStatus: TaskStatus) {
    const existing = tasks.find((task) => task.id === taskId);
    if (!existing || existing.status === nextStatus || busyId !== null) return;
    if (!canUpdate(existing)) {
      setError('Only the assigned owner or a club lead can update this task.');
      return;
    }
    const previousStatus = existing.status;
    setError('');
    setNotice('');
    setBusyId(taskId);
    setTasks((current) => current.map((task) => task.id === taskId ? { ...task, status: nextStatus } : task));
    try {
      const response = await fetch('/api/tasks/' + taskId, {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof result.error === 'string' ? result.error : 'Could not update this task.');
      setTasks((current) => current.map((task) => task.id === taskId ? { ...task, status: result.task?.status || nextStatus } : task));
      setNotice(nextStatus === 'Completed' && previousStatus !== 'Completed'
        ? 'Task completed. Its contribution event was saved.'
        : 'Task status saved.');
      router.refresh();
    } catch (cause) {
      setTasks((current) => current.map((task) => task.id === taskId ? { ...task, status: previousStatus } : task));
      setError(cause instanceof Error ? cause.message : 'Task update failed. Try again.');
    } finally {
      setBusyId(null);
      setDraggingId(null);
      setDragOverStatus(null);
    }
  }

  function handleDrop(event: React.DragEvent<HTMLElement>, status: TaskStatus) {
    event.preventDefault();
    setDragOverStatus(null);
    const id = Number(event.dataTransfer.getData('text/plain'));
    if (Number.isInteger(id) && id > 0) void updateStatus(id, status);
  }

  function taskCard(task: BoardTask) {
    const status = STATUSES.includes(task.status as TaskStatus) ? task.status as TaskStatus : 'To do';
    const overdue = Boolean(task.due_date && task.due_date < new Date().toISOString().slice(0, 10) && !['Completed', 'Blocked'].includes(status));
    const allowed = canUpdate(task);
    return (
      <article
        key={task.id}
        className={'task-kanban-card' + (draggingId === task.id ? ' is-dragging' : '') + (busyId === task.id ? ' is-saving' : '')}
        draggable={allowed && busyId === null}
        onDragStart={(event) => {
          if (!allowed) { event.preventDefault(); return; }
          setDraggingId(task.id);
          event.dataTransfer.setData('text/plain', String(task.id));
          event.dataTransfer.effectAllowed = 'move';
        }}
        onDragEnd={() => { setDraggingId(null); setDragOverStatus(null); }}
      >
        <div className="task-kanban-card-top">
          <span className={'task-priority priority-' + task.priority.toLowerCase()}>{task.priority}</span>
          {busyId === task.id ? <LoaderCircle className="task-saving-icon" size={14}/> : allowed ? <GripVertical size={14} className="task-grip" aria-hidden="true"/> : <span className="task-readonly"><ShieldAlert size={12}/> View only</span>}
        </div>
        <Link className="task-kanban-title" href={'/tasks/' + task.id}>{task.title}</Link>
        {task.description ? <p className="task-kanban-description">{task.description}</p> : null}
        <div className="task-kanban-meta"><span>{task.owner || 'Unassigned'}</span><span>{task.club || 'No club'}</span></div>
        <div className="task-kanban-footer">
          <span className={overdue ? 'task-deadline overdue' : 'task-deadline'}><CalendarClock size={12}/>{task.due_date || 'No deadline'}{overdue ? ' · Overdue' : ''}</span>
          <select aria-label={'Change status for ' + task.title} value={status} disabled={!allowed || busyId !== null} onChange={(event) => void updateStatus(task.id, event.target.value as TaskStatus)}>
            {STATUSES.map((item) => <option value={item} key={item}>{item}</option>)}
          </select>
        </div>
      </article>
    );
  }

  return (
    <div className="task-board-shell">
      <div className="task-board-toolbar">
        <label className="task-board-search"><Search size={15}/><input aria-label="Search tasks" placeholder="Search title, owner, club…" value={query} onChange={(event) => setQuery(event.target.value)}/></label>
        <select className="task-board-filter" aria-label="Filter by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="all">All statuses</option>{STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
        <div className="task-board-views" aria-label="Task view">
          <button type="button" className={view === 'board' ? 'active' : ''} onClick={() => setView('board')}><LayoutGrid size={14}/> Board</button>
          <button type="button" className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}><List size={14}/> List</button>
        </div>
        <span className="task-board-count">{visibleTasks.length} of {tasks.length} tasks</span>
      </div>
      {error ? <p className="task-board-message error" role="alert">{error}</p> : null}
      {notice ? <p className="task-board-message success" role="status"><CheckCircle2 size={14}/>{notice}</p> : null}
      {tasks.length === 0 ? (
        <div className="task-board-empty"><CircleDashed size={24}/><strong>No tasks yet</strong><p>Create the first task above. It will appear here after saving to PostgreSQL.</p></div>
      ) : visibleTasks.length === 0 ? (
        <div className="task-board-empty"><Search size={22}/><strong>No matching tasks</strong><p>Change your search or status filter to see more tasks.</p></div>
      ) : view === 'board' ? (
        <div className="task-kanban-grid">
          {STATUSES.map((status) => {
            const columnTasks = visibleTasks.filter((task) => task.status === status);
            return <section key={status} className={'task-kanban-column column-' + statusClass[status] + (dragOverStatus === status ? ' is-drop-target' : '')} onDragOver={(event) => { event.preventDefault(); setDragOverStatus(status); event.dataTransfer.dropEffect = 'move'; }} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragOverStatus(null); }} onDrop={(event) => handleDrop(event, status)}>
              <header className="task-kanban-column-head"><span className="task-status-mark"/><strong>{status}</strong><span>{columnTasks.length}</span></header>
              <div className="task-kanban-column-body">{columnTasks.map(taskCard)}{columnTasks.length === 0 ? <div className="task-kanban-empty">Drop a task here</div> : null}</div>
            </section>;
          })}
        </div>
      ) : (
        <div className="next-table-wrap"><table className="next-table task-board-list"><thead><tr><th>Task</th><th>Owner</th><th>Club</th><th>Deadline</th><th>Priority</th><th>Status</th></tr></thead><tbody>{visibleTasks.map((task) => <tr key={task.id}><td><Link className="next-task-link" href={'/tasks/' + task.id}>{task.title}</Link></td><td>{task.owner}</td><td>{task.club || '—'}</td><td>{task.due_date || '—'}</td><td><span className={'task-priority priority-' + task.priority.toLowerCase()}>{task.priority}</span></td><td><select aria-label={'Change status for ' + task.title} value={STATUSES.includes(task.status as TaskStatus) ? task.status : 'To do'} disabled={!canUpdate(task) || busyId !== null} onChange={(event) => void updateStatus(task.id, event.target.value as TaskStatus)}>{STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}</select></td></tr>)}</tbody></table></div>
      )}
      <p className="task-board-help">Drag a card to move it between columns, or use its status menu. Changes are saved to PostgreSQL and contribution events are recorded by the server.</p>
    </div>
  );
}
