import { createTaskAction } from '@/app/actions';

type ClubOption = { id: number; name: string };

export function TaskServerForm({ clubs }: { clubs: ClubOption[] }) {
 return <form action={createTaskAction} className="next-form next-task-form">
  <label>Task title<input name="title" required minLength={3} maxLength={160} placeholder="Plan the member onboarding session"/></label>
  <label>Assigned club
   <select name="clubId" required defaultValue="" disabled={clubs.length === 0}>
    <option value="" disabled>Select a club</option>
    {clubs.map((club) => <option key={club.id} value={club.id}>{club.name}</option>)}
   </select>
  </label>
  {clubs.length === 0 ? <p className="next-form-note">Create a club before assigning a task. No clubs are currently stored.</p> : null}
  <label>Assigned owner<input name="owner" required maxLength={80} placeholder="Exact name of the account owner"/></label>
  <p className="next-form-note">Students can update their own progress when the owner matches the name on their account. Leads can update any task.</p>
  <label>Deadline<input name="dueDate" type="date" required/></label>
  <label>Priority<select name="priority" defaultValue="Medium"><option>Low</option><option>Medium</option><option>High</option><option>Urgent</option></select></label>
  <button className="next-primary-btn" type="submit" disabled={clubs.length === 0}>Save task + contribution event</button>
 </form>;
}
