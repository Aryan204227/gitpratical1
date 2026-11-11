'use client';

import { useState } from 'react';
import { createTaskAction } from '@/app/actions';

type ClubOption = { id: number; name: string };
type MemberOption = { id: number; name: string; email: string; club_id: number | null; has_account: boolean; active: boolean };

export function TaskServerForm({ clubs, members }: { clubs: ClubOption[]; members: MemberOption[] }) {
 const [clubId, setClubId] = useState(String(clubs[0]?.id ?? ''));
 const [owner, setOwner] = useState('Unassigned');
 const clubMembers = members.filter(member =>
   member.active && member.club_id === Number(clubId)
 );

 function changeClub(value: string) {
   setClubId(value);
   setOwner('Unassigned');
 }

 return (
  <form action={createTaskAction} className="next-form next-task-form">
   <label>Task title
    <input name="title" required minLength={3} maxLength={160} placeholder="e.g. Prepare the coding workshop"/>
   </label>
   <label>Club
    <select name="clubId" required value={clubId} onChange={event => changeClub(event.target.value)} disabled={clubs.length === 0}>
     <option value="" disabled>Select a club</option>
     {clubs.map(club => <option key={club.id} value={club.id}>{club.name}</option>)}
    </select>
   </label>
   {clubs.length === 0 ? <p className="next-form-note">Create a club profile first. You can then add students to its team.</p> : null}
   <label>Assign to student
    <select name="owner" value={owner} onChange={event => setOwner(event.target.value)} required>
     <option value="Unassigned">Leave unassigned</option>
     {clubMembers.map(member => (
       <option key={member.id} value={member.name}>
         {member.name}{member.has_account ? '' : ' — account not registered yet'}
       </option>
     ))}
    </select>
   </label>
   <p className="next-form-note">
    Only students on this club's member list are shown. Students need to register with their listed email before they can update tasks.
   </p>
   <label>Deadline<input name="dueDate" type="date" required/></label>
   <label>Priority<select name="priority" defaultValue="Medium"><option>Low</option><option>Medium</option><option>High</option><option>Urgent</option></select></label>
   <label>Task effort<select name="effortWeight" defaultValue="3"><option value="1">1 — Very small</option><option value="2">2 — Small</option><option value="3">3 — Medium</option><option value="4">4 — Large</option><option value="5">5 — Very large</option></select></label>
   <p className="next-form-note">Effort is used for contribution points when the student completes the task. Priority and effort are different: priority is urgency; effort is how much work the task needs.</p>
   <button className="next-primary-btn" type="submit" disabled={clubs.length === 0}>Save task</button>
  </form>
 );
}
