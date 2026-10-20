import { createTaskAction } from '@/app/actions';
export function TaskServerForm(){
 return <form action={createTaskAction} className="next-form next-task-form">
  <label>Task title<input name="title" required minLength={3} maxLength={160} placeholder="Plan the member onboarding session"/></label>
  <label>Assigned owner<input name="owner" required maxLength={80} placeholder="Exact name of the account owner"/></label>
  <p className="next-form-note">Students can update their own progress when the owner matches the name on their account. Leads can update any task.</p>
  <label>Deadline<input name="dueDate" type="date" required/></label>
  <label>Priority<select name="priority" defaultValue="Medium"><option>Low</option><option>Medium</option><option>High</option><option>Urgent</option></select></label>
  <button className="next-primary-btn" type="submit">Save task + contribution event</button>
 </form>;
}
