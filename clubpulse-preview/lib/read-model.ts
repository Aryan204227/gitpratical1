import { pulseScoreFromDecay, classifyMember, burnoutRisk, giniCoefficient } from '@/lib/scoring.mjs';
import { ensureDatabase,getPool } from '@/lib/db';
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
