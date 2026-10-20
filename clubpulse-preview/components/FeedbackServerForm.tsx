import { createFeedbackAction } from '@/app/actions';
import { ensureDatabase,getPool } from '@/lib/db';
export async function FeedbackServerForm(){
 await ensureDatabase();
 const r=await getPool().query('SELECT id,name FROM clubs ORDER BY name');
 return <form action={createFeedbackAction} className="next-form">
  <label>Feedback topic<input name="topic" minLength={3} maxLength={120} required placeholder="Task distribution clarity"/></label>
  <label>Club<select name="clubId" defaultValue=""><option value="">General experience</option>{r.rows.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
  <label>Rating (optional)<select name="rating" defaultValue=""><option value="">No rating</option><option value="5">5 — Excellent</option><option value="4">4 — Good</option><option value="3">3 — Okay</option><option value="2">2 — Needs work</option><option value="1">1 — Poor</option></select></label>
  <label>Comment<textarea name="comment" rows={4} maxLength={1800} placeholder="Share a constructive suggestion…"/></label>
  <label className="next-checkbox"><input type="checkbox" name="anonymous" defaultChecked/> Submit anonymously</label>
  <button className="next-primary-btn" type="submit">Submit feedback</button>
 </form>;
}
