import { ensureDatabase,getPool } from '@/lib/db';
export async function getDashboardSnapshot(){
 await ensureDatabase();const pool=getPool();
 const [clubs,members,tasks,applications,feedback,trend]=await Promise.all([
  pool.query(`SELECT c.id,c.name,c.category,c.status,COUNT(DISTINCT m.id)::int AS member_count,COUNT(DISTINCT t.id)::int AS task_count,COUNT(DISTINCT t.id) FILTER(WHERE t.status='Completed')::int AS completed_count FROM clubs c LEFT JOIN members m ON m.club_id=c.id AND m.active=TRUE LEFT JOIN tasks t ON t.club_id=c.id GROUP BY c.id ORDER BY c.name`),
  pool.query('SELECT COUNT(*)::int AS total FROM members WHERE active=TRUE'),
  pool.query(`SELECT COUNT(*)::int AS total,COUNT(*) FILTER(WHERE status='Completed')::int AS completed,COUNT(*) FILTER(WHERE status NOT IN ('Completed','Blocked'))::int AS open FROM tasks`),
  pool.query(`SELECT COUNT(*)::int AS total FROM recruitment_applications WHERE status IN ('Applied','Reviewing')`),
  pool.query('SELECT COUNT(*)::int AS total,CASE WHEN COUNT(*)>=5 THEN ROUND(AVG(rating)::numeric,1) ELSE NULL END AS average FROM feedback_entries WHERE rating BETWEEN 1 AND 5'),
  pool.query(`SELECT TO_CHAR(date_trunc('week',created_at),'Mon DD') AS week,COUNT(*) FILTER(WHERE event_type='task_assigned')::int AS assigned,COUNT(*) FILTER(WHERE event_type='task_completed')::int AS completed FROM contribution_events WHERE created_at>=NOW()-INTERVAL '8 weeks' GROUP BY date_trunc('week',created_at) ORDER BY date_trunc('week',created_at)`)
 ]);
 return {clubs:clubs.rows,members:members.rows[0].total as number,tasks:tasks.rows[0],applications:applications.rows[0].total as number,feedback:feedback.rows[0],trend:trend.rows};
}
export async function getClub(id:number){
 await ensureDatabase();const r=await getPool().query(`SELECT c.id,c.name,c.category,c.status,c.created_at,COUNT(DISTINCT m.id)::int AS member_count,COUNT(DISTINCT t.id)::int AS task_count,COUNT(DISTINCT t.id) FILTER(WHERE t.status='Completed')::int AS completed_count FROM clubs c LEFT JOIN members m ON m.club_id=c.id AND m.active=TRUE LEFT JOIN tasks t ON t.club_id=c.id WHERE c.id=$1 GROUP BY c.id`,[id]);
 return r.rows[0]??null;
}
export async function getTasks(limit=200){
 await ensureDatabase();const r=await getPool().query(`SELECT t.id,t.title,t.description,t.owner,TO_CHAR(t.due_date,'YYYY-MM-DD') AS due_date,t.status,t.priority,t.created_at,c.name AS club FROM tasks t LEFT JOIN clubs c ON c.id=t.club_id ORDER BY CASE WHEN t.status='Completed' THEN 1 ELSE 0 END,t.due_date NULLS LAST,t.created_at DESC LIMIT $1`,[limit]);return r.rows;
}
export async function getClubs(){
 await ensureDatabase();const r=await getPool().query(`SELECT c.id,c.name,c.category,c.status,c.created_at,COUNT(DISTINCT m.id)::int AS member_count,COUNT(DISTINCT t.id)::int AS task_count,COUNT(DISTINCT t.id) FILTER(WHERE t.status='Completed')::int AS completed_count FROM clubs c LEFT JOIN members m ON m.club_id=c.id AND m.active=TRUE LEFT JOIN tasks t ON t.club_id=c.id GROUP BY c.id ORDER BY c.name`);return r.rows;
}
export async function getMembers(){
 await ensureDatabase();const r=await getPool().query(`SELECT m.id,m.name,m.email,m.role,m.active,m.created_at,COALESCE(c.name,'No club') AS club,COUNT(e.id)::int AS contribution_count FROM members m LEFT JOIN clubs c ON c.id=m.club_id LEFT JOIN contribution_events e ON LOWER(e.member_name)=LOWER(m.name) GROUP BY m.id,c.name ORDER BY m.name`);return r.rows;
}
export async function getOpenings(){
 await ensureDatabase();const r=await getPool().query(`SELECT o.id,o.title,o.status,o.created_at,c.name AS club,COUNT(a.id)::int AS applicant_count FROM recruitment_openings o LEFT JOIN clubs c ON c.id=o.club_id LEFT JOIN recruitment_applications a ON a.opening_id=o.id GROUP BY o.id,c.name ORDER BY o.created_at DESC`);return r.rows;
}
export async function getApplications(){
 await ensureDatabase();const r=await getPool().query(`SELECT a.id,a.applicant_name,a.email,a.status,a.statement,a.created_at,o.title AS opening,c.name AS club FROM recruitment_applications a JOIN recruitment_openings o ON o.id=a.opening_id LEFT JOIN clubs c ON c.id=o.club_id ORDER BY a.created_at DESC LIMIT 250`);return r.rows;
}
export async function getContributions(){
 await ensureDatabase();const r=await getPool().query(`SELECT e.id,e.event_type,e.member_name,e.points,e.created_at,COALESCE(c.name,'Club') AS club,t.title AS task FROM contribution_events e LEFT JOIN clubs c ON c.id=e.club_id LEFT JOIN tasks t ON t.id=e.task_id ORDER BY e.created_at DESC LIMIT 500`);return r.rows;
}
export async function getFeedback(){
 await ensureDatabase();const r=await getPool().query(`SELECT f.id,f.topic,f.rating,f.comment,f.is_anonymous,f.status,f.created_at,COALESCE(c.name,'General') AS club FROM feedback_entries f LEFT JOIN clubs c ON c.id=f.club_id ORDER BY f.created_at DESC LIMIT 200`);return r.rows;
}
