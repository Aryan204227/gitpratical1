import { createOpeningAction } from '@/app/actions';

type ClubOption = { id: number; name: string };

export function OpeningServerForm({ clubs }: { clubs: ClubOption[] }) {
  return (
    <form action={createOpeningAction} className="next-inline-form">
      <label>
        Role title
        <input name="title" minLength={3} maxLength={120} required placeholder="e.g. Event coordinator"/>
      </label>
      <label>
        Club
        <select name="clubId" defaultValue="" required>
          <option value="" disabled>Select a club</option>
          {clubs.map(club => <option key={club.id} value={club.id}>{club.name}</option>)}
        </select>
      </label>
      <button className="next-primary-btn" type="submit">Publish role</button>
    </form>
  );
}
