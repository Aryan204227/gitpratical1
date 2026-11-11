import { createClubAction } from '@/app/actions';

export function ClubServerForm(){
 return (
  <form action={createClubAction} className="next-inline-form club-create-form">
   <label>Club name<input name="name" minLength={2} maxLength={120} required placeholder="AI Builders Society"/></label>
   <label>Category<select name="category" defaultValue="Technology"><option>Technology</option><option>Design</option><option>Engineering</option><option>Culture</option><option>Community</option><option>Sports</option><option>Other</option></select></label>
   <label className="club-form-wide">Description<textarea name="description" rows={3} maxLength={1200} placeholder="What does this club do? Who should join?"/></label>
   <label>Meeting schedule<input name="meetingSchedule" maxLength={240} placeholder="Every Wednesday · 5:00 PM"/></label>
   <label>Public contact email<input name="contactEmail" type="email" maxLength={254} placeholder="club@example.edu"/></label>
   <label className="club-form-wide">Website / public link<input name="websiteUrl" type="url" maxLength={500} placeholder="https://example.edu/club"/></label>
   <div className="club-form-wide"><button className="next-primary-btn" type="submit">Create club profile</button></div>
  </form>
 );
}
