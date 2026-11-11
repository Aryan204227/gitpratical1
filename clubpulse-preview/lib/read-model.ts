import { pulseScoreFromDecay, classifyMember, burnoutRisk, giniCoefficient } from '@/lib/scoring.mjs';
import { ensureDatabase,getPool } from '@/lib/db';
export async function getLandingStats(){
 if(!process.env.DATABASE_URL)return null;
 await ensureDatabase();
 const result=await getPool().query(`SELECT
   (SELECT COUNT(*)::int FROM clubs) AS clubs,
   (SELECT COUNT(*)::int FROM tasks) AS tasks,
   (SELECT COUNT(*)::int FROM contribution_events) AS events`);
 const row=result.rows[0]||{};
 return {clubs:Number(row.clubs)||0,tasks:Number(row.tasks)||0,events:Number(row.events)||0};
}
export async function getDashboardSnapshot(){
 await ensureDatabase();const pool=getPool();
 const [clubs,members,tasks,applications,feedback,trend,workload,memberActivity]=await Promise.all([
  pool.query(`SELECT c.id,c.name,c.category,c.status,COUNT(DISTINCT m.id)::int AS member_count,COUNT(DISTINCT t.id)::int AS task_count,COUNT(DISTINCT t.id) FILTER(WHERE t.status='Completed')::int AS completed_count FROM clubs c LEFT JOIN members m ON m.club_id=c.id AND m.active=TRUE LEFT JOIN tasks t ON t.club_id=c.id GROUP BY c.id ORDER BY c.name`),
  pool.query('SELECT COUNT(*)::int AS total FROM members WHERE active=TRUE'),
  pool.query(`SELECT COUNT(*)::int AS total,COUNT(*) FILTER(WHERE status='Completed')::int AS completed,COUNT(*) FILTER(WHERE status NOT IN ('Completed','Blocked'))::int AS open FROM tasks`),
  pool.query(`SELECT COUNT(*)::int AS total FROM recruitment_applications WHERE status IN ('Applied','Reviewing')`),
  pool.query('SELECT COUNT(*)::int AS total,CASE WHEN COUNT(*)>=5 THEN ROUND(AVG(rating)::numeric,1) ELSE NULL END AS average FROM feedback_entries WHERE rating BETWEEN 1 AND 5'),
  pool.query(`SELECT TO_CHAR(date_trunc('week',created_at),'Mon DD') AS week,COUNT(*) FILTER(WHERE event_type='task_assigned')::int AS assigned,COUNT(*) FILTER(WHERE event_type='task_completed')::int AS completed FROM contribution_events WHERE created_at>=NOW()-INTERVAL '8 weeks' GROUP BY date_trunc('week',created_at) ORDER BY date_trunc('week',created_at)`),
  pool.query(`SELECT CASE WHEN COALESCE(BTRIM(owner),'')='' THEN 'Unassigned' ELSE BTRIM(owner) END AS owner,
    COUNT(*)::int AS open_tasks,
    COUNT(*) FILTER(WHERE priority IN ('High','Urgent'))::int AS priority_tasks,
    TO_CHAR(MIN(due_date) FILTER(WHERE due_date>=CURRENT_DATE),'Mon DD') AS nearest_due
    FROM tasks WHERE status NOT IN ('Completed','Blocked')
    GROUP BY CASE WHEN COALESCE(BTRIM(owner),'')='' THEN 'Unassigned' ELSE BTRIM(owner) END
    ORDER BY COUNT(*) DESC,COUNT(*) FILTER(WHERE priority IN ('High','Urgent')) DESC,owner ASC LIMIT 8`),
  pool.query(`WITH event_rollup AS (
      SELECT LOWER(member_name) AS member_key,
        SUM(points * POWER(0.5, GREATEST(0,EXTRACT(EPOCH FROM (NOW()-created_at))/86400.0)/14.0))::float AS decayed_points,
        MAX(created_at) AS last_contribution,COUNT(*)::int AS contribution_count
      FROM contribution_events
      WHERE event_type IN ('task_completed','event_attended','mentoring')
      GROUP BY LOWER(member_name)
    ), task_rollup AS (
      SELECT LOWER(owner) AS owner_key,
        COUNT(*) FILTER(WHERE status NOT IN ('Completed','Blocked'))::int AS open_tasks,
        COUNT(*) FILTER(WHERE status NOT IN ('Completed','Blocked') AND due_date<CURRENT_DATE)::int AS overdue_tasks,
        COUNT(*) FILTER(WHERE priority IN ('High','Urgent') AND status NOT IN ('Completed','Blocked'))::int AS urgent_tasks,
        COUNT(*) FILTER(WHERE created_at>=NOW()-INTERVAL '7 days')::int AS recent_tasks,
        COUNT(*) FILTER(WHERE created_at>=NOW()-INTERVAL '14 days' AND created_at<NOW()-INTERVAL '7 days')::int AS prior_tasks
      FROM tasks GROUP BY LOWER(owner)
    )
    SELECT m.id,m.name,m.role,m.active,m.on_break,m.committed_hours,m.created_at AS joined_at,m.last_break_at,m.return_date,
      COALESCE(e.decayed_points,0)::float AS decayed_points,e.last_contribution,
      COALESCE(e.contribution_count,0)::int AS contribution_count,
      COALESCE(t.open_tasks,0)::int AS open_tasks,COALESCE(t.overdue_tasks,0)::int AS overdue_tasks,
      COALESCE(t.urgent_tasks,0)::int AS urgent_tasks,COALESCE(t.recent_tasks,0)::int AS recent_tasks,
      COALESCE(t.prior_tasks,0)::int AS prior_tasks
    FROM members m
    LEFT JOIN event_rollup e ON e.member_key=LOWER(m.name)
    LEFT JOIN task_rollup t ON t.owner_key=LOWER(m.name)
    ORDER BY COALESCE(e.decayed_points,0) ASC,m.name ASC LIMIT 120`)
 ]);
 const activityRows=memberActivity.rows;
 const openLoads=activityRows.map((row:any)=>Number(row.open_tasks)||0).sort((a:number,b:number)=>a-b);
 const medianOpenTasks=openLoads.length?openLoads[Math.floor((openLoads.length-1)/2)]:1;
 const now=Date.now();
 const memberSignals=activityRows.map((row:any)=>{
   const score=pulseScoreFromDecay(Number(row.decayed_points)||0,Number(row.committed_hours)||4);
   const status=classifyMember({pulseScore:score,lastContributionAt:row.last_contribution,joinedAt:row.joined_at,onBreak:Boolean(row.on_break),now});
   const openTasks=Number(row.open_tasks)||0;
   const overdueTasks=Number(row.overdue_tasks)||0;
   const priorTasks=Number(row.prior_tasks)||0;
   const recentTasks=Number(row.recent_tasks)||0;
   const weeklyLoadChange=priorTasks>0?(recentTasks-priorTasks)/priorTasks:(recentTasks>0?Math.min(1,recentTasks):0);
   const daysWithoutBreak=row.last_break_at?Math.max(0,(now-new Date(row.last_break_at).getTime())/86400000):Math.max(0,(now-new Date(row.joined_at).getTime())/86400000);
   const risk=burnoutRisk({openTasks,medianOpenTasks,overdueRatio:openTasks?overdueTasks/openTasks:0,weeklyLoadChange,daysWithoutBreak,moodTrend:null});
   const daysSinceContribution=row.last_contribution?Math.floor((now-new Date(row.last_contribution).getTime())/86400000):Math.floor((now-new Date(row.joined_at).getTime())/86400000);
   return {id:Number(row.id),name:String(row.name),role:String(row.role),active:Boolean(row.active),onBreak:Boolean(row.on_break),returnDate:row.return_date?String(row.return_date):null,committedHours:Number(row.committed_hours)||4,pulseScore:score,status,contributionCount:Number(row.contribution_count)||0,daysSinceContribution,openTasks,overdueTasks:Number(row.overdue_tasks)||0,urgentTasks:Number(row.urgent_tasks)||0,burnoutScore:status==='On Break'?null:risk.score,burnoutLevel:status==='On Break'?'On break':risk.level,burnoutActions:risk.actions};
 });
 const openTaskLoads=memberSignals.map((member)=>member.openTasks).sort((a,b)=>b-a);
 const totalOpenTasks=openTaskLoads.reduce((sum,value)=>sum+value,0);
 const topTwoShare=totalOpenTasks?Math.round(openTaskLoads.slice(0,2).reduce((sum,value)=>sum+value,0)/totalOpenTasks*100):0;
 const participation=memberSignals.filter((member)=>member.status!=='On Break');
 const pulseCounts={active:participation.filter((member)=>member.status==='Active').length,drifting:participation.filter((member)=>member.status==='Drifting').length,ghost:participation.filter((member)=>member.status==='Ghost').length,onBreak:memberSignals.filter((member)=>member.status==='On Break').length};
 const workloadGini=giniCoefficient(memberSignals.filter((member)=>member.status!=='On Break').map((member)=>member.openTasks));
 return {clubs:clubs.rows,members:members.rows[0].total as number,tasks:tasks.rows[0],applications:applications.rows[0].total as number,feedback:feedback.rows[0],trend:trend.rows,workload:workload.rows,memberSignals,pulseCounts,workloadGini,topTwoShare};
}
export async function getClub(id:number){
 await ensureDatabase();const r=await getPool().query(`SELECT c.id,c.name,c.category,c.status,c.created_at,COUNT(DISTINCT m.id)::int AS member_count,COUNT(DISTINCT t.id)::int AS task_count,COUNT(DISTINCT t.id) FILTER(WHERE t.status='Completed')::int AS completed_count FROM clubs c LEFT JOIN members m ON m.club_id=c.id AND m.active=TRUE LEFT JOIN tasks t ON t.club_id=c.id WHERE c.id=$1 GROUP BY c.id`,[id]);
 return r.rows[0]??null;
}
export async function getTasks(limit=200){
 await ensureDatabase();const r=await getPool().query(`SELECT t.id,t.title,t.description,t.owner,TO_CHAR(t.due_date,'YYYY-MM-DD') AS due_date,t.status,t.priority,t.created_at,c.name AS club FROM tasks t LEFT JOIN clubs c ON c.id=t.club_id ORDER BY CASE WHEN t.status='Completed' THEN 1 ELSE 0 END,t.due_date NULLS LAST,t.created_at DESC LIMIT $1`,[limit]);return r.rows;
}
export async function getTasksForUser(user: { id: number; name: string; email: string; role: string }, limit = 200) {
 await ensureDatabase();
 const pool = getPool();
 if (user.role === 'admin' || user.role === 'superadmin') return getTasks(limit);
 if (user.role === 'lead') {
  const result = await pool.query(`
   SELECT t.id,t.title,t.description,t.owner,TO_CHAR(t.due_date,'YYYY-MM-DD') AS due_date,t.status,t.priority,t.created_at,c.name AS club
   FROM tasks t LEFT JOIN clubs c ON c.id=t.club_id
   WHERE c.owner_user_id=$1 OR EXISTS (
     SELECT 1 FROM members lead_member
     WHERE lead_member.club_id=t.club_id AND lead_member.active=TRUE AND lead_member.role IN ('Lead','Club Lead')
       AND LOWER(BTRIM(lead_member.email))=LOWER(BTRIM($2))
   )
   ORDER BY CASE WHEN t.status='Completed' THEN 1 ELSE 0 END,t.due_date NULLS LAST,t.created_at DESC LIMIT $3
  `, [user.id, user.email, limit]);
  return result.rows;
 }
 const result = await pool.query(`
  SELECT t.id,t.title,t.description,t.owner,TO_CHAR(t.due_date,'YYYY-MM-DD') AS due_date,t.status,t.priority,t.created_at,c.name AS club
  FROM tasks t LEFT JOIN clubs c ON c.id=t.club_id
  WHERE LOWER(BTRIM(t.owner)) IN (LOWER(BTRIM($1)),LOWER(BTRIM($2)))
     OR EXISTS (
       SELECT 1 FROM members own_member
       WHERE own_member.club_id=t.club_id AND own_member.active=TRUE
         AND LOWER(BTRIM(own_member.email))=LOWER(BTRIM($2))
         AND LOWER(BTRIM(own_member.name))=LOWER(BTRIM(t.owner))
     )
  ORDER BY CASE WHEN t.status='Completed' THEN 1 ELSE 0 END,t.due_date NULLS LAST,t.created_at DESC LIMIT $3
 `, [user.name, user.email, limit]);
 return result.rows;
}
export async function getClubs(){
 await ensureDatabase();
 const r=await getPool().query(`
  SELECT c.id,c.name,c.category,c.description,c.meeting_schedule,c.contact_email,c.website_url,
    c.status,c.created_at,c.owner_user_id,COALESCE(owner.name,'Unassigned') AS lead_name,
    COUNT(DISTINCT m.id)::int AS member_count,
    COUNT(DISTINCT t.id)::int AS task_count,
    COUNT(DISTINCT t.id) FILTER(WHERE t.status='Completed')::int AS completed_count,
    COUNT(DISTINCT o.id) FILTER(WHERE o.status='Open')::int AS open_roles
  FROM clubs c
  LEFT JOIN users owner ON owner.id=c.owner_user_id
  LEFT JOIN members m ON m.club_id=c.id AND m.active=TRUE
  LEFT JOIN tasks t ON t.club_id=c.id
  LEFT JOIN recruitment_openings o ON o.club_id=c.id
  GROUP BY c.id,owner.name
  ORDER BY c.name
 `);
 return r.rows;
}
export async function getMembers(user: { id: number; email: string; role: string }) {
 await ensureDatabase();
 if (user.role === 'member') {
  const own = await getPool().query(`SELECT m.id,m.name,m.email,m.role,m.active,m.created_at,m.club_id,COALESCE(c.name,'No club') AS club,(account.id IS NOT NULL) AS has_account,COUNT(DISTINCT e.id)::int AS contribution_count FROM members m LEFT JOIN clubs c ON c.id=m.club_id LEFT JOIN users account ON LOWER(BTRIM(account.email))=LOWER(BTRIM(m.email)) LEFT JOIN contribution_events e ON e.club_id=m.club_id AND LOWER(BTRIM(e.member_name))=LOWER(BTRIM(m.name)) WHERE LOWER(BTRIM(m.email))=LOWER(BTRIM($1)) GROUP BY m.id,c.name,account.id ORDER BY m.name LIMIT 1`, [user.email]);
  return own.rows;
 }
 const isLead = user.role === 'lead';
 const scope = isLead ? `WHERE (
   c.owner_user_id = $1 OR EXISTS (
     SELECT 1 FROM members lead_member
     WHERE lead_member.club_id = c.id
       AND lead_member.active = TRUE
       AND lead_member.role IN ('Lead','Club Lead')
       AND LOWER(BTRIM(lead_member.email)) = LOWER(BTRIM($2))
   )
 )` : '';
 const values = isLead ? [user.id, user.email] : [];
 const result = await getPool().query(`
   SELECT m.id,m.name,m.email,m.role,m.active,m.created_at,m.club_id,
     COALESCE(c.name,'No club') AS club,
     (account.id IS NOT NULL) AS has_account,
     COUNT(DISTINCT e.id)::int AS contribution_count
   FROM members m
   LEFT JOIN clubs c ON c.id=m.club_id
   LEFT JOIN users account ON LOWER(BTRIM(account.email))=LOWER(BTRIM(m.email))
   LEFT JOIN contribution_events e ON e.club_id=m.club_id AND LOWER(BTRIM(e.member_name))=LOWER(BTRIM(m.name))
   ${scope}
   GROUP BY m.id,c.name,account.id
   ORDER BY m.name
 `, values);
 return result.rows;
}
export async function getOpenings(){
 await ensureDatabase();const r=await getPool().query(`SELECT o.id,o.title,o.status,o.created_at,c.name AS club,COUNT(a.id)::int AS applicant_count FROM recruitment_openings o LEFT JOIN clubs c ON c.id=o.club_id LEFT JOIN recruitment_applications a ON a.opening_id=o.id GROUP BY o.id,c.name ORDER BY o.created_at DESC`);return r.rows;
}
export async function getApplications(){
 await ensureDatabase();const r=await getPool().query(`SELECT a.id,a.applicant_name,a.email,a.status,a.statement,a.created_at,o.title AS opening,c.name AS club FROM recruitment_applications a JOIN recruitment_openings o ON o.id=a.opening_id LEFT JOIN clubs c ON c.id=o.club_id ORDER BY a.created_at DESC LIMIT 250`);return r.rows;
}
export async function getOpeningsForUser(user: { id: number; email: string; role: string }) {
 await ensureDatabase();
 const pool = getPool();
 if (user.role === 'admin' || user.role === 'superadmin') return getOpenings();
 const result = user.role === 'lead'
  ? await pool.query(`
     SELECT o.id,o.title,o.status,o.created_at,c.name AS club,COUNT(a.id)::int AS applicant_count
     FROM recruitment_openings o
     LEFT JOIN clubs c ON c.id=o.club_id
     LEFT JOIN recruitment_applications a ON a.opening_id=o.id
     WHERE c.owner_user_id=$1 OR EXISTS (
       SELECT 1 FROM members lead_member
       WHERE lead_member.club_id=c.id AND lead_member.active=TRUE
         AND LOWER(BTRIM(lead_member.email))=LOWER(BTRIM($2))
     )
     GROUP BY o.id,c.name ORDER BY o.created_at DESC
    `, [user.id, user.email])
  : await pool.query(`
     SELECT o.id,o.title,o.status,o.created_at,c.name AS club,COUNT(a.id)::int AS applicant_count
     FROM recruitment_openings o
     LEFT JOIN clubs c ON c.id=o.club_id
     LEFT JOIN recruitment_applications a ON a.opening_id=o.id
     WHERE o.status IN ('Open','Review') AND c.status<>'Archived'
     GROUP BY o.id,c.name ORDER BY o.created_at DESC
    `);
 return result.rows;
}

export async function getApplicationsForUser(user: { id: number; email: string; role: string }) {
 await ensureDatabase();
 const pool = getPool();
 if (user.role === 'admin' || user.role === 'superadmin') return getApplications();
 if (user.role !== 'lead') return [];
 const result = await pool.query(`
   SELECT a.id,a.applicant_name,a.email,a.status,a.statement,a.created_at,
     o.title AS opening,c.name AS club
   FROM recruitment_applications a
   JOIN recruitment_openings o ON o.id=a.opening_id
   JOIN clubs c ON c.id=o.club_id
   WHERE c.owner_user_id=$1 OR EXISTS (
     SELECT 1 FROM members lead_member
     WHERE lead_member.club_id=c.id AND lead_member.active=TRUE AND lead_member.role IN ('Lead','Club Lead')
       AND LOWER(BTRIM(lead_member.email))=LOWER(BTRIM($2))
   )
   ORDER BY a.created_at DESC LIMIT 250
 `, [user.id, user.email]);
 return result.rows;
}
export async function getContributions(user: { id: number; email: string; role: string }) {
 await ensureDatabase();
 const pool = getPool();
 if (user.role === 'admin' || user.role === 'superadmin') {
  const result = await pool.query(`SELECT e.id,e.event_type,e.member_name,e.points,e.created_at,COALESCE(c.name,'Club') AS club,t.title AS task FROM contribution_events e LEFT JOIN clubs c ON c.id=e.club_id LEFT JOIN tasks t ON t.id=e.task_id ORDER BY e.created_at DESC LIMIT 500`);
  return result.rows;
 }
 if (user.role !== 'lead') return [];
 const result = await pool.query(`
  SELECT e.id,e.event_type,e.member_name,e.points,e.created_at,COALESCE(c.name,'Club') AS club,t.title AS task
  FROM contribution_events e
  JOIN clubs c ON c.id=e.club_id
  LEFT JOIN tasks t ON t.id=e.task_id
  WHERE c.owner_user_id=$1 OR EXISTS (
    SELECT 1 FROM members lead_member
    WHERE lead_member.club_id=c.id AND lead_member.active=TRUE
      AND LOWER(BTRIM(lead_member.email))=LOWER(BTRIM($2))
  )
  ORDER BY e.created_at DESC LIMIT 500
 `, [user.id, user.email]);
 return result.rows;
}
export async function getFeedback(){
 await ensureDatabase();const r=await getPool().query(`SELECT f.id,f.topic,f.rating,f.comment,f.is_anonymous,f.status,f.created_at,COALESCE(c.name,'General') AS club FROM feedback_entries f LEFT JOIN clubs c ON c.id=f.club_id ORDER BY f.created_at DESC LIMIT 200`);return r.rows;
}
export async function getFeedbackForUser(user: { id: number; email: string; role: string }) {
 await ensureDatabase();
 const pool = getPool();
 if (user.role === 'admin' || user.role === 'superadmin') return getFeedback();
 if (user.role !== 'lead') return [];
 const result = await pool.query(`
   SELECT f.id,f.topic,f.rating,f.comment,f.is_anonymous,f.status,f.created_at,
     COALESCE(c.name,'General') AS club
   FROM feedback_entries f
   JOIN clubs c ON c.id=f.club_id
   WHERE c.owner_user_id=$1 OR EXISTS (
     SELECT 1 FROM members lead_member
     WHERE lead_member.club_id=c.id AND lead_member.active=TRUE AND lead_member.role IN ('Lead','Club Lead')
       AND LOWER(BTRIM(lead_member.email))=LOWER(BTRIM($2))
   )
   ORDER BY f.created_at DESC LIMIT 200
 `, [user.id, user.email]);
 return result.rows;
}

export async function getFeedbackClubs(user: { id: number; email: string; role: string }) {
 await ensureDatabase();
 const pool = getPool();
 if (user.role === 'admin' || user.role === 'superadmin') {
   const result = await pool.query("SELECT id,name FROM clubs WHERE status<>'Archived' ORDER BY name");
   return result.rows;
 }
 if (user.role === 'lead') {
   const result = await pool.query(`
     SELECT c.id,c.name FROM clubs c
     WHERE c.status<>'Archived' AND (
       c.owner_user_id=$1 OR EXISTS (
         SELECT 1 FROM members lead_member
         WHERE lead_member.club_id=c.id AND lead_member.active=TRUE AND lead_member.role IN ('Lead','Club Lead')
           AND LOWER(BTRIM(lead_member.email))=LOWER(BTRIM($2))
       )
     )
     ORDER BY c.name
   `, [user.id, user.email]);
   return result.rows;
 }
 const result = await pool.query(`
   SELECT c.id,c.name FROM members m
   JOIN clubs c ON c.id=m.club_id
   WHERE m.active=TRUE AND c.status<>'Archived'
     AND LOWER(BTRIM(m.email))=LOWER(BTRIM($1))
   ORDER BY c.name
 `, [user.email]);
 return result.rows;
}
export async function getTask(id:number){
 await ensureDatabase();const pool=getPool();
 const [taskRes,eventsRes]=await Promise.all([
  pool.query(`SELECT t.id,t.title,t.description,t.owner,TO_CHAR(t.due_date,'YYYY-MM-DD') AS due_date,t.status,t.priority,COALESCE(t.effort_weight,3)::int AS effort_weight,t.club_id,t.created_at,t.updated_at,COALESCE(c.name,'No club') AS club FROM tasks t LEFT JOIN clubs c ON c.id=t.club_id WHERE t.id=$1`,[id]),
  pool.query(`SELECT e.id,e.event_type,e.member_name,e.points,e.created_at FROM contribution_events e WHERE e.task_id=$1 ORDER BY e.created_at DESC`,[id])
 ]);
 if(!taskRes.rowCount)return null;
 return {...taskRes.rows[0],events:eventsRes.rows};
}
export async function getClubWithDetails(id:number){
 await ensureDatabase();
 const pool=getPool();
 const [clubRes,membersRes,tasksRes,openingsRes,contributionsRes,feedbackRes]=await Promise.all([
  pool.query(`SELECT c.id,c.name,c.category,c.description,c.meeting_schedule,c.contact_email,c.website_url,
    c.status,c.created_at,c.owner_user_id,COALESCE(owner.name,'Unassigned') AS lead_name,
    COUNT(DISTINCT m.id)::int AS member_count,
    COUNT(DISTINCT t.id)::int AS task_count,
    COUNT(DISTINCT t.id) FILTER(WHERE t.status='Completed')::int AS completed_count
    FROM clubs c
    LEFT JOIN users owner ON owner.id=c.owner_user_id
    LEFT JOIN members m ON m.club_id=c.id AND m.active=TRUE
    LEFT JOIN tasks t ON t.club_id=c.id
    WHERE c.id=$1
    GROUP BY c.id,owner.name`,[id]),
  // Deliberately exclude personal email addresses from the club roster read model.
  pool.query(`SELECT m.id,m.name,m.role,m.active,m.on_break,m.committed_hours
    FROM members m WHERE m.club_id=$1 ORDER BY m.name ASC`,[id]),
  pool.query(`SELECT t.id,t.title,t.owner,TO_CHAR(t.due_date,'YYYY-MM-DD') AS due_date,t.status,t.priority
    FROM tasks t WHERE t.club_id=$1
    ORDER BY CASE WHEN t.status='Completed' THEN 1 ELSE 0 END,t.due_date NULLS LAST`,[id]),
  pool.query(`SELECT o.id,o.title,o.status,o.created_at,COUNT(a.id)::int AS applicant_count
    FROM recruitment_openings o
    LEFT JOIN recruitment_applications a ON a.opening_id=o.id
    WHERE o.club_id=$1 GROUP BY o.id ORDER BY o.created_at DESC`,[id]),
  pool.query(`SELECT COUNT(*)::int AS total_events,
      COUNT(DISTINCT NULLIF(BTRIM(member_name),''))::int AS contributors,
      COALESCE(SUM(points),0)::numeric(10,2) AS points
    FROM contribution_events
    WHERE club_id=$1 AND event_type IN ('task_completed','event_attended','mentoring','membership_joined')`,[id]),
  pool.query(`SELECT
      CASE WHEN COUNT(*) FILTER(WHERE rating BETWEEN 1 AND 5)>=5
        THEN COUNT(*) FILTER(WHERE rating BETWEEN 1 AND 5)::int ELSE NULL END AS visible_rating_count,
      CASE WHEN COUNT(*) FILTER(WHERE rating BETWEEN 1 AND 5)>=5
        THEN ROUND(AVG(rating) FILTER(WHERE rating BETWEEN 1 AND 5)::numeric,1) ELSE NULL END AS average_rating
    FROM feedback_entries WHERE club_id=$1`,[id])
 ]);
 if(!clubRes.rowCount)return null;
 return {
  ...clubRes.rows[0],
  members:membersRes.rows,
  tasks:tasksRes.rows,
  openings:openingsRes.rows,
  contributionSummary:contributionsRes.rows[0],
  feedbackSummary:{
    visibleRatingCount:feedbackRes.rows[0]?.visible_rating_count??null,
    averageRating:feedbackRes.rows[0]?.average_rating??null,
    isPrivate:feedbackRes.rows[0]?.visible_rating_count===null,
  },
 };
}
export async function getMemberDashboard(userId:number){
 await ensureDatabase();const pool=getPool();
 const userRes=await pool.query(`SELECT name,email FROM users WHERE id=$1 LIMIT 1`,[userId]);
 const userName:string=userRes.rows[0]?.name||'';
 const userEmail:string=userRes.rows[0]?.email||'';
 const memberRes=await pool.query(`SELECT m.id,m.name,m.role,m.active,m.on_break,m.committed_hours,m.return_date,COALESCE(c.name,'No assigned club') AS club
   FROM members m LEFT JOIN clubs c ON c.id=m.club_id
   WHERE LOWER(BTRIM(m.email))=LOWER(BTRIM($1))
   ORDER BY m.id DESC LIMIT 1`,[userEmail]);
 const linkedMemberName:string=memberRes.rows[0]?.name||'';
 const [tasksRes,eventsRes,applicationsRes]=await Promise.all([
  pool.query(`SELECT t.id,t.title,t.status,t.priority,TO_CHAR(t.due_date,'YYYY-MM-DD') AS due_date,COALESCE(c.name,'General') AS club
    FROM tasks t LEFT JOIN clubs c ON c.id=t.club_id
    WHERE LOWER(BTRIM(t.owner))=LOWER(BTRIM($1))
      AND $2::int IS NOT NULL
      AND t.club_id=$2
    ORDER BY CASE WHEN t.status='Completed' THEN 1 ELSE 0 END,t.due_date NULLS LAST`,[linkedMemberName,memberRes.rows[0]?.club_id ?? null]),
  pool.query(`SELECT e.id,e.event_type,e.points,e.created_at,t.title AS task
    FROM contribution_events e LEFT JOIN tasks t ON t.id=e.task_id
    WHERE $2::int IS NOT NULL
      AND e.club_id=$2
      AND LOWER(BTRIM(e.member_name))=LOWER(BTRIM($1))
    ORDER BY e.created_at DESC LIMIT 10`,[linkedMemberName,memberRes.rows[0]?.club_id === null || memberRes.rows[0]?.club_id === undefined ? null : Number(memberRes.rows[0].club_id)]),
  pool.query(`SELECT ra.id,ra.status,ro.title AS opening FROM recruitment_applications ra
    JOIN recruitment_openings ro ON ro.id=ra.opening_id
    WHERE LOWER(BTRIM(ra.email))=LOWER(BTRIM($1))
    ORDER BY ra.created_at DESC LIMIT 5`,[userEmail])
 ]);
 const tasks=tasksRes.rows;const events=eventsRes.rows;
 const total=tasks.length;const completed=tasks.filter((t:any)=>t.status==='Completed').length;const open=tasks.filter((t:any)=>!['Completed','Blocked'].includes(t.status)).length;
 const totalPoints=events.reduce((sum:number,e:any)=>sum+Number(e.points||0),0);
 return {tasks,events,member:memberRes.rows[0]||null,applications:applicationsRes.rows,totalTasks:total,completedTasks:completed,openTasks:open,totalPoints};
}

export async function getLeadDashboard(userId: number) {
 await ensureDatabase();
 const pool = getPool();
 const userRes = await pool.query(`SELECT name, email FROM users WHERE id=$1 LIMIT 1`, [userId]);
 const userRow = userRes.rows[0];
 const userName: string = userRow?.name || '';
 const userEmail: string = userRow?.email || '';

 const [memberRes, ownedClubRes] = await Promise.all([
  pool.query(
   `SELECT m.id, m.name, m.role, m.club_id, COALESCE(c.name, 'All Clubs') as club_name
    FROM members m
    LEFT JOIN clubs c ON c.id=m.club_id
    WHERE m.role IN ('Lead','Club Lead') AND (LOWER(BTRIM(m.email))=LOWER(BTRIM($1)) OR LOWER(BTRIM(m.name))=LOWER(BTRIM($2)))
    ORDER BY CASE WHEN LOWER(BTRIM(m.email))=LOWER(BTRIM($1)) THEN 0 ELSE 1 END
    LIMIT 1`,
   [userEmail, userName]
  ),
  pool.query(
   `SELECT id AS club_id, name AS club_name
    FROM clubs WHERE owner_user_id=$1 AND status<>'Archived'
    ORDER BY created_at ASC LIMIT 1`,
   [userId]
  )
 ]);
 const memberRecord = memberRes.rows[0] || null;
 const ownedClub = ownedClubRes.rows[0] || null;
 const leadMember = memberRecord || (ownedClub ? {
  id: null, name: userName, role: 'Lead', club_id: ownedClub.club_id, club_name: ownedClub.club_name
 } : null);
 const clubId = memberRecord?.club_id ?? ownedClub?.club_id;

 const [myTasksRes, unassignedTasksRes, overdueTasksRes, inProgressRes, teamMembersRes, upcomingRes, applicationsRes] = await Promise.all([
  pool.query(
   `SELECT t.id, t.title, t.status, t.priority, TO_CHAR(t.due_date, 'YYYY-MM-DD') AS due_date, COALESCE(c.name, 'General') AS club
    FROM tasks t LEFT JOIN clubs c ON c.id=t.club_id
    WHERE LOWER(BTRIM(t.owner))=LOWER(BTRIM($1)) OR LOWER(BTRIM(t.owner))=LOWER(BTRIM($2))
    ORDER BY CASE WHEN t.status='Completed' THEN 1 ELSE 0 END, t.due_date NULLS LAST LIMIT 10`,
   [userName, userEmail]
  ),
  pool.query(
   `SELECT t.id, t.title, t.priority, TO_CHAR(t.due_date, 'YYYY-MM-DD') AS due_date, COALESCE(c.name, 'General') AS club
    FROM tasks t LEFT JOIN clubs c ON c.id=t.club_id
    WHERE (t.owner='Unassigned' OR t.owner IS NULL OR BTRIM(t.owner)='')
      AND t.status NOT IN ('Completed', 'Blocked')
      ${clubId ? 'AND t.club_id=$1' : ''}
    ORDER BY t.priority DESC, t.created_at DESC LIMIT 6`,
   clubId ? [clubId] : []
  ),
  pool.query(
   `SELECT t.id, t.title, t.owner, t.priority, TO_CHAR(t.due_date, 'YYYY-MM-DD') AS due_date, COALESCE(c.name, 'General') AS club
    FROM tasks t LEFT JOIN clubs c ON c.id=t.club_id
    WHERE t.due_date < CURRENT_DATE AND t.status NOT IN ('Completed', 'Blocked')
      ${clubId ? 'AND t.club_id=$1' : ''}
    ORDER BY t.due_date ASC LIMIT 6`,
   clubId ? [clubId] : []
  ),
  pool.query(
   `SELECT t.id, t.title, t.owner, t.priority, TO_CHAR(t.due_date, 'YYYY-MM-DD') AS due_date, COALESCE(c.name, 'General') AS club
    FROM tasks t LEFT JOIN clubs c ON c.id=t.club_id
    WHERE t.status = 'In progress' ${clubId ? 'AND t.club_id=$1' : ''}
    ORDER BY t.due_date NULLS LAST LIMIT 6`,
   clubId ? [clubId] : []
  ),
  pool.query(
   `SELECT m.id, m.name, m.email, m.role, m.active, m.on_break, m.committed_hours,
      COUNT(t.id) FILTER(WHERE t.status NOT IN ('Completed', 'Blocked'))::int AS open_tasks,
      COUNT(t.id) FILTER(WHERE t.due_date < CURRENT_DATE AND t.status NOT IN ('Completed', 'Blocked'))::int AS overdue_tasks
    FROM members m
    LEFT JOIN tasks t ON LOWER(BTRIM(t.owner)) = LOWER(BTRIM(m.name))
    WHERE m.active=TRUE ${clubId ? 'AND m.club_id=$1' : ''}
    GROUP BY m.id, m.name, m.email, m.role, m.active, m.on_break, m.committed_hours
    ORDER BY COUNT(t.id) DESC LIMIT 15`,
   clubId ? [clubId] : []
  ),
  pool.query(
   `SELECT t.id, t.title, t.owner, TO_CHAR(t.due_date, 'YYYY-MM-DD') AS due_date, t.priority, t.status
    FROM tasks t
    WHERE t.due_date >= CURRENT_DATE AND t.due_date <= CURRENT_DATE + INTERVAL '7 days'
      AND t.status NOT IN ('Completed', 'Blocked')
      ${clubId ? 'AND t.club_id=$1' : ''}
    ORDER BY t.due_date ASC LIMIT 6`,
   clubId ? [clubId] : []
  ),
  pool.query(
   `SELECT ra.id, ra.applicant_name, ra.status, ro.title AS opening, COALESCE(c.name, 'General') AS club
    FROM recruitment_applications ra
    JOIN recruitment_openings ro ON ro.id=ra.opening_id
    LEFT JOIN clubs c ON c.id=ro.club_id
    WHERE ra.status IN ('Applied', 'Reviewing') ${clubId ? 'AND ro.club_id=$1' : ''}
    ORDER BY ra.created_at DESC LIMIT 6`,
   clubId ? [clubId] : []
  )
 ]);

 const myTasks = myTasksRes.rows;
 const myOpenTasks = myTasks.filter((t: any) => !['Completed', 'Blocked'].includes(t.status)).length;
 const myCompletedTasks = myTasks.filter((t: any) => t.status === 'Completed').length;

 return {
  leadMember,
  clubName: leadMember?.club_name || 'My Club',
  myTasks,
  myOpenTasks,
  myCompletedTasks,
  unassignedTasks: unassignedTasksRes.rows,
  overdueTasks: overdueTasksRes.rows,
  inProgressTasks: inProgressRes.rows,
  teamMembers: teamMembersRes.rows,
  upcomingDeadlines: upcomingRes.rows,
  applicationsToReview: applicationsRes.rows,
 };
}
