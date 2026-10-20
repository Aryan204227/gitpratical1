import { createOpeningAction } from '@/app/actions';
import { ensureDatabase,getPool } from '@/lib/db';
export async function OpeningServerForm(){
 await ensureDatabase();const r=await getPool().query('SELECT id,name FROM clubs ORDER BY name');
 return <form action={createOpeningAction} className="next-inline-form"><label>Role title<input name="title" minLength={3} maxLength={120} required placeholder="e.g. Event coordinator"/></label><label>Club<select name="clubId" defaultValue="" required><option value="">Select a club</option>{r.rows.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><button className="next-primary-btn" type="submit">Publish opening</button></form>;
}
