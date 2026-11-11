'use server';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { ensureDatabase,getPool } from '@/lib/db';
import { getCurrentUser, type AppRole } from '@/lib/auth';
import { canManageClub } from '@/lib/club-access';
import { isValidIsoDate, parsePositiveId } from '@/lib/task-validation.mjs';

const taskSchema=z.object({title:z.string().trim().min(3).max(160),owner:z.string().trim().min(1).max(80),dueDate:z.string().refine(isValidIsoDate,'Enter a valid calendar date.'),priority:z.enum(['Low','Medium','High','Urgent']),clubId:z.number().int().positive()});
const clubSchema=z.object({
 name:z.string().trim().min(2).max(120),
 category:z.string().trim().max(60),
 description:z.string().trim().max(1200),
 meetingSchedule:z.string().trim().max(240),
 contactEmail:z.string().trim().max(254).refine(v=>!v||/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),'Enter a valid contact email.'),
 websiteUrl:z.string().trim().max(500).refine(v=>!v||/^https?:\/\/\S+$/i.test(v),'Enter a valid http or https website URL.'),
});
const clubProfileSchema=clubSchema.extend({
 clubId:z.coerce.number().int().positive(),
 status:z.enum(['Active','Inactive','Recruiting','Archived']),
});
const openingSchema=z.object({title:z.string().trim().min(3).max(120),clubId:z.coerce.number().int().positive()});
const feedbackSchema=z.object({topic:z.string().trim().min(3).max(120),clubId:z.preprocess(v=>v===''||v==null?null:Number(v),z.number().int().positive().nullable()),rating:z.preprocess(v=>v===''||v==null?null:Number(v),z.number().int().min(1).max(5).nullable()),comment:z.string().trim().max(1800),anonymous:z.enum(['yes','no'])});
async function requireRole(allowed:AppRole[]){const user=await getCurrentUser();if(!user)redirect('/login');if(!allowed.includes(user.role))redirect('/dashboard?error=forbidden');return user;}
export async function createTaskAction(formData:FormData){
 const user=await requireRole(['admin','superadmin','lead']);
 const clubId=parsePositiveId(formData.get('clubId'));
 if(clubId===null)redirect('/tasks?error=invalid-club');
 const parsed=taskSchema.safeParse({title:formData.get('title'),owner:formData.get('owner')||'Unassigned',dueDate:formData.get('dueDate'),priority:formData.get('priority')||'Medium',clubId});
 if(!parsed.success)redirect('/tasks?error=invalid-task');
 if(!await canManageClub(user,parsed.data.clubId))redirect('/tasks?error=forbidden');
 await ensureDatabase();const client=await getPool().connect();let missingClub=false;let invalidOwner=false;
 try{
  await client.query('BEGIN');
  const club=await client.query(`SELECT id FROM clubs WHERE id=$1 AND status<>'Archived' FOR KEY SHARE`,[parsed.data.clubId]);
  if(!club.rowCount){await client.query('ROLLBACK');missingClub=true;}
  else{
   if(parsed.data.owner!=='Unassigned'){
    const assigned=await client.query(
     'SELECT id FROM members WHERE club_id=$1 AND active=TRUE AND LOWER(BTRIM(name))=LOWER(BTRIM($2)) LIMIT 1 FOR KEY SHARE',
     [parsed.data.clubId,parsed.data.owner],
    );
    if(!assigned.rowCount){await client.query('ROLLBACK');invalidOwner=true;}
   }
   if(!missingClub&&!invalidOwner){
    const created=await client.query(`INSERT INTO tasks(title,owner,due_date,status,priority,club_id) VALUES($1,$2,$3,'To do',$4,$5) RETURNING id`,[parsed.data.title,parsed.data.owner,parsed.data.dueDate,parsed.data.priority,parsed.data.clubId]);
    await client.query('INSERT INTO contribution_events(task_id,club_id,member_name,event_type,points) VALUES($1,$2,$3,$4,$5)',[created.rows[0].id,parsed.data.clubId,parsed.data.owner,'task_assigned',0]);
    await client.query('COMMIT');
   }
  }
 }catch(error){await client.query('ROLLBACK').catch(()=>{});throw error;}finally{client.release();}
 if(missingClub)redirect('/tasks?error=invalid-club');
 if(invalidOwner)redirect('/tasks?error=invalid-owner');
 redirect('/tasks?created=1');
}
export async function createClubAction(formData:FormData){
 const user=await requireRole(['admin','superadmin','lead']);
 const parsed=clubSchema.safeParse({
  name:formData.get('name'),
  category:formData.get('category')||'General',
  description:formData.get('description')||'',
  meetingSchedule:formData.get('meetingSchedule')||'',
  contactEmail:formData.get('contactEmail')||'',
  websiteUrl:formData.get('websiteUrl')||'',
 });
 if(!parsed.success)redirect('/clubs?error=invalid-club');
 try{
  await ensureDatabase();
  await getPool().query(
   `INSERT INTO clubs(name,category,description,meeting_schedule,contact_email,website_url,owner_user_id)
    VALUES($1,$2,$3,$4,$5,$6,$7)`,
   [parsed.data.name,parsed.data.category||'General',parsed.data.description,parsed.data.meetingSchedule,
    parsed.data.contactEmail,parsed.data.websiteUrl,user.role==='lead'?user.id:null],
  );
 }catch(error){if(error instanceof Error&&error.message.includes('duplicate key'))redirect('/clubs?error=duplicate');throw error;}
 redirect('/clubs?created=1');
}
export async function updateClubProfileAction(formData:FormData){
 const user=await getCurrentUser();
 if(!user)redirect('/login');
 const rawId=Number(formData.get('clubId'));
 const parsed=clubProfileSchema.safeParse({
  clubId:formData.get('clubId'),
  name:formData.get('name'),
  category:formData.get('category')||'General',
  description:formData.get('description')||'',
  meetingSchedule:formData.get('meetingSchedule')||'',
  contactEmail:formData.get('contactEmail')||'',
  websiteUrl:formData.get('websiteUrl')||'',
  status:formData.get('status'),
 });
 if(!parsed.success)redirect('/clubs/'+(Number.isInteger(rawId)?rawId:'')+'?error=invalid-profile');
 if(!await canManageClub(user,parsed.data.clubId))redirect('/clubs/'+parsed.data.clubId+'?error=forbidden');
 await ensureDatabase();
 await getPool().query(
  `UPDATE clubs
   SET name=$1,category=$2,description=$3,meeting_schedule=$4,contact_email=$5,website_url=$6,status=$7
   WHERE id=$8`,
  [parsed.data.name,parsed.data.category||'General',parsed.data.description,parsed.data.meetingSchedule,
   parsed.data.contactEmail,parsed.data.websiteUrl,parsed.data.status,parsed.data.clubId],
 );
 redirect('/clubs/'+parsed.data.clubId+'?updated=1');
}
export async function archiveClubAction(formData:FormData){
 const user=await getCurrentUser();
 if(!user)redirect('/login');
 const clubId=Number(formData.get('clubId'));
 if(!Number.isInteger(clubId)||clubId<1)redirect('/clubs?error=invalid-profile');
 if(!await canManageClub(user,clubId))redirect('/clubs/'+clubId+'?error=forbidden');
 await ensureDatabase();
 await getPool().query(`UPDATE clubs SET status='Archived' WHERE id=$1`,[clubId]);
 // Archiving deliberately preserves tasks, contributions, recruitment history and members.
 redirect('/clubs?archived=1');
}
export async function createOpeningAction(formData:FormData){
 const user=await requireRole(['admin','superadmin','lead']);
 const parsed=openingSchema.safeParse({title:formData.get('title'),clubId:formData.get('clubId')});
 if(!parsed.success)redirect('/recruitment?error=invalid-opening');
 if(!await canManageClub(user,parsed.data.clubId))redirect('/recruitment?error=forbidden');
 await ensureDatabase();
 const club=await getPool().query("SELECT id FROM clubs WHERE id=$1 AND status<>'Archived'",[parsed.data.clubId]);
 if(!club.rowCount)redirect('/recruitment?error=invalid-opening');
 await getPool().query('INSERT INTO recruitment_openings(title,club_id,status) VALUES($1,$2,$3)',[parsed.data.title,parsed.data.clubId,'Open']);
 redirect('/recruitment?created=1');
}
export async function createFeedbackAction(formData:FormData){
 const user=await requireRole(['admin','lead','member']);
 const parsed=feedbackSchema.safeParse({topic:formData.get('topic'),clubId:formData.get('clubId'),rating:formData.get('rating'),comment:formData.get('comment')||'',anonymous:formData.get('anonymous')?'yes':'no'});
 if(!parsed.success)redirect('/feedback?error=invalid-feedback');
 await ensureDatabase();
 await getPool().query('INSERT INTO feedback_entries(club_id,topic,rating,comment,is_anonymous,status) VALUES($1,$2,$3,$4,$5,$6)',[parsed.data.clubId,parsed.data.topic,parsed.data.rating,parsed.data.comment,parsed.data.anonymous==='yes','Needs review']);
 redirect('/feedback?submitted=1');
}
export async function updateTaskStatusAction(formData:FormData){
 const user=await getCurrentUser();
 if(!user)redirect('/login');
 const taskId=Number(formData.get('taskId'));const status=String(formData.get('status')||'');
 const allowed=new Set(['To do','In progress','In review','Completed','Blocked']);
 if(!Number.isInteger(taskId)||taskId<1||!allowed.has(status))redirect('/tasks?error=invalid-status');
 await ensureDatabase();const client=await getPool().connect();
 try{
  await client.query('BEGIN');
  const before=await client.query('SELECT id,status,club_id,owner FROM tasks WHERE id=$1 FOR UPDATE',[taskId]);
  if(!before.rowCount){await client.query('ROLLBACK');redirect('/tasks?error=missing-task');}
  const task=before.rows[0];
  const isAdmin=user.role==='admin'||user.role==='superadmin';
  const isLeadForClub=user.role==='lead'&&await canManageClub(user,Number(task.club_id));
  const ownerAccounts=await client.query('SELECT COUNT(*)::int AS count FROM users WHERE LOWER(BTRIM(name))=LOWER(BTRIM($1))',[task.owner||'']);
  const ownsByAccountName=String(task.owner||'').trim().toLowerCase()===user.name.trim().toLowerCase()&&Number(ownerAccounts.rows[0]?.count)===1;
  const rosterOwnership=await client.query(
   `SELECT 1 FROM members
    WHERE club_id=$1 AND active=TRUE
      AND LOWER(BTRIM(email))=LOWER(BTRIM($2))
      AND LOWER(BTRIM(name))=LOWER(BTRIM($3))
    LIMIT 1`,
   [task.club_id,user.email,task.owner||''],
  );
  if(!isAdmin&&!isLeadForClub&&!ownsByAccountName&&!rosterOwnership.rowCount){
   await client.query('ROLLBACK');redirect('/tasks?error=forbidden');
  }
  await client.query('UPDATE tasks SET status=$1,updated_at=NOW() WHERE id=$2',[status,taskId]);
  if(status==='Completed'&&task.status!=='Completed'){
   await client.query('INSERT INTO contribution_events(task_id,club_id,member_name,event_type,points) VALUES($1,$2,$3,$4,$5)',[taskId,task.club_id,task.owner,'task_completed',1]);
  }
  await client.query('COMMIT');
 }catch(error){await client.query('ROLLBACK').catch(()=>{});throw error;}finally{client.release();}
 redirect('/tasks?updated=1');
}

export async function reassignTaskAction(formData:FormData){
 const user=await requireRole(['admin','superadmin','lead']);
 const taskId=Number(formData.get('taskId'));const newOwner=String(formData.get('newOwner')||'').trim();
 if(!Number.isInteger(taskId)||taskId<1||!newOwner)redirect('/fairwork?error=invalid-reassign');
 await ensureDatabase();const client=await getPool().connect();
 try{
  await client.query('BEGIN');
  const tRes=await client.query('SELECT id,club_id,owner FROM tasks WHERE id=$1 FOR UPDATE',[taskId]);
  if(!tRes.rowCount){await client.query('ROLLBACK');redirect('/fairwork?error=missing-task');}
  const task=tRes.rows[0];
  if(!await canManageClub(user,Number(task.club_id))){await client.query('ROLLBACK');redirect('/fairwork?error=forbidden');}
  const assignee=await client.query(
   "SELECT id,name FROM members WHERE club_id=$1 AND active=TRUE AND LOWER(BTRIM(name))=LOWER(BTRIM($2)) LIMIT 1 FOR KEY SHARE",
   [task.club_id,newOwner],
  );
  if(!assignee.rowCount){await client.query('ROLLBACK');redirect('/fairwork?error=invalid-assignee');}
  await client.query('UPDATE tasks SET owner=$1,updated_at=NOW() WHERE id=$2',[assignee.rows[0].name,taskId]);
  await client.query('INSERT INTO contribution_events(task_id,club_id,member_name,event_type,points) VALUES($1,$2,$3,$4,0)',[taskId,task.club_id,assignee.rows[0].name,'task_assigned']);
  await client.query('COMMIT');
 }catch(err){await client.query('ROLLBACK').catch(()=>{});throw err;}finally{client.release();}
 redirect('/fairwork?rebalanced=1');
}

export async function updateApplicationStatusAction(formData:FormData){
 const user=await requireRole(['admin','superadmin','lead']);
 const id=Number(formData.get('applicationId'));const status=String(formData.get('status')||'');
 if(!Number.isInteger(id)||id<1||!['Applied','Reviewing','Accepted','Rejected'].includes(status))redirect('/recruitment?error=invalid-application');
 await ensureDatabase();const client=await getPool().connect();
 try{
  await client.query('BEGIN');
  const found=await client.query(`SELECT a.id,a.applicant_name,a.email,a.status,a.opening_id,o.club_id
   FROM recruitment_applications a
   JOIN recruitment_openings o ON o.id=a.opening_id
   WHERE a.id=$1 FOR UPDATE OF a`,[id]);
  if(!found.rowCount){await client.query('ROLLBACK');redirect('/recruitment?error=missing-application');}
  const app=found.rows[0];
  if(!await canManageClub(user,Number(app.club_id))){await client.query('ROLLBACK');redirect('/recruitment?error=forbidden');}

  let onboardedMember: { id: number; name: string; club_id: number } | null = null;
  if(status==='Accepted'&&app.status!=='Accepted'){
   const existing=await client.query(
    'SELECT id,name,club_id FROM members WHERE LOWER(BTRIM(email))=LOWER(BTRIM($1)) LIMIT 1 FOR UPDATE',
    [app.email],
   );
   if(existing.rowCount&&existing.rows[0].club_id!==null&&Number(existing.rows[0].club_id)!==Number(app.club_id)){
    await client.query('ROLLBACK');
    redirect('/recruitment?error=already-member');
   }
   if(existing.rowCount){
    const updatedMember=await client.query(
     'UPDATE members SET active=TRUE,club_id=$1 WHERE id=$2 RETURNING id,name,club_id',
     [app.club_id,existing.rows[0].id],
    );
    onboardedMember=updatedMember.rows[0];
   }else{
    const createdMember=await client.query(
     "INSERT INTO members(name,email,club_id,role,active) VALUES($1,$2,$3,'Member',TRUE) RETURNING id,name,club_id",
     [app.applicant_name,app.email,app.club_id],
    );
    onboardedMember=createdMember.rows[0];
   }
   if(!existing.rowCount){
    await client.query(
     "INSERT INTO contribution_events(club_id,member_name,event_type,points) VALUES($1,$2,'membership_joined',0)",
     [onboardedMember!.club_id,onboardedMember!.name],
    );
   }
  }
  await client.query('UPDATE recruitment_applications SET status=$1 WHERE id=$2',[status,id]);
  await client.query('COMMIT');
 }catch(error){await client.query('ROLLBACK').catch(()=>{});throw error;}finally{client.release();}
 redirect('/recruitment?updated=1');
}
export async function updateFeedbackStatusAction(formData:FormData){
 await requireRole(['admin','lead']);
 const id=Number(formData.get('feedbackId'));const status=String(formData.get('status')||'');
 if(!Number.isInteger(id)||id<1||!['Needs review','Action proposed','Reviewed','Resolved'].includes(status))redirect('/feedback?error=invalid-feedback-status');
 await ensureDatabase();await getPool().query('UPDATE feedback_entries SET status=$1 WHERE id=$2',[status,id]);redirect('/feedback?updated=1');
}
