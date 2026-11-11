import { archiveClubAction, updateClubProfileAction } from '@/app/actions';
import { NextPanel } from '@/components/NextPrimitives';

export function ClubProfileManager({ club }: { club: any }) {
  return (
    <NextPanel title="Club management" description="Update the public profile or archive this club without deleting its history.">
      <details className="club-edit-details">
        <summary>Edit club profile</summary>
        <form action={updateClubProfileAction} className="club-edit-grid">
          <input type="hidden" name="clubId" value={club.id} />
          <label>Club name<input name="name" required minLength={2} maxLength={120} defaultValue={club.name} /></label>
          <label>Category
            <select name="category" defaultValue={club.category || 'General'}>
              {!['Technology','Design','Engineering','Culture','Community','Sports','Other','General'].includes(club.category) && <option>{club.category}</option>}
              {['Technology','Design','Engineering','Culture','Community','Sports','Other','General'].map(value => <option key={value}>{value}</option>)}
            </select>
          </label>
          <label className="club-form-wide">Description<textarea name="description" rows={4} maxLength={1200} defaultValue={club.description || ''} /></label>
          <label>Meeting schedule<input name="meetingSchedule" maxLength={240} defaultValue={club.meeting_schedule || ''} placeholder="Every Wednesday · 5:00 PM" /></label>
          <label>Public contact email<input name="contactEmail" type="email" maxLength={254} defaultValue={club.contact_email || ''} /></label>
          <label className="club-form-wide">Website / public link<input name="websiteUrl" type="url" maxLength={500} defaultValue={club.website_url || ''} /></label>
          <label>Status
            <select name="status" defaultValue={club.status}>
              <option>Active</option><option>Recruiting</option><option>Inactive</option><option>Archived</option>
            </select>
          </label>
          <div className="club-form-wide"><button className="next-primary-btn" type="submit">Save profile changes</button></div>
        </form>
      </details>
      {club.status !== 'Archived' ? (
        <details className="club-archive-confirm">
          <summary>Archive this club</summary>
          <form action={archiveClubAction} className="club-archive-row">
            <input type="hidden" name="clubId" value={club.id} />
            <span>This hides the club from the current directory. Members, tasks, recruitment applications, feedback and contribution history are preserved.</span>
            <button className="club-archive-btn" type="submit">Confirm archive</button>
          </form>
        </details>
      ) : (
        <p className="club-archived-note">This club is archived. Use Edit club profile to restore it by setting its status to Active or Recruiting.</p>
      )}
    </NextPanel>
  );
}
