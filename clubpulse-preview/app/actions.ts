'use server';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { ensureDatabase,getPool } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { isValidIsoDate, parsePositiveId } from '@/lib/task-validation.mjs';

const taskSchema=z.object({title:z.string().trim().min(3).max(160),owner:z.string().trim().min(1).max(80),dueDate:z.string().refine(isValidIsoDate,'Enter a valid calendar date.'),priority:z.enum(['Low','Medium','High','Urgent']),clubId:z.number().int().positive()});
const clubSchema=z.object({name:z.string().trim().min(2).max(120),category:z.string().trim().max(60)});
const openingSchema=z.object({title:z.string().trim().min(3).max(120),clubId:z.coerce.number().int().positive()});
const feedbackSchema=z.object({topic:z.string().trim().min(3).max(120),clubId:z.preprocess(v=>v===''||v==null?null:Number(v),z.number().int().positive().nullable()),rating:z.preprocess(v=>v===''||v==null?null:Number(v),z.number().int().min(1).max(5).nullable()),comment:z.string().trim().max(1800),anonymous:z.enum(['yes','no'])});
async function requireRole(allowed:('admin'|'lead'|'member')[]){const user=await getCurrentUser();if(!user)redirect('/login');if(!allowed.includes(user.role))redirect('/dashboard?error=forbidden');return user;}
export async function createTaskAction(formData:FormData){
 await requireRole(['admin','lead']);
 const clubId=parsePositiveId(formData.get('clubId'));
 if(clubId===null)redirect('/tasks?error=invalid-club');
 const parsed=taskSchema.safeParse({title:formData.get('title'),owner:formData.get('owner')||'Unassigned',dueDate:formData.get('dueDate'),priority:formData.get('priority')||'Medium',clubId});
 if(!parsed.success)redirect('/tasks?error=invalid-task');
 await ensureDatabase();const client=await getPool().connect();let missingClub=false;
 try{
  await client.query('BEGIN');
  const club=await client.query('SELECT id FROM clubs WHERE id=$1 FOR KEY SHARE',[parsed.data.clubId]);
  if(!club.rowCount){await client.query('ROLLBACK');missingClub=true;}
  else{
   const created=await client.query(`INSERT INTO tasks(title,owner,due_date,status,priority,club_id) VALUES($1,$2,$3,'To do',$4,$5) RETURNING id`,[parsed.data.title,parsed.data.owner,parsed.data.dueDate,parsed.data.priority,parsed.data.clubId]);
   await client.query('INSERT INTO contribution_events(task_id,club_id,member_name,event_type,points) VALUES($1,$2,$3,$4,$5)',[created.rows[0].id,parsed.data.clubId,parsed.data.owner,'task_assigned',0]);
   await client.query('COMMIT');
  }
 }catch(error){await client.query('ROLLBACK').catch(()=>{});throw error;}finally{client.release();}
 if(missingClub)redirect('/tasks?error=invalid-club');
 redirect('/tasks?created=1');
}
export async function createClubAction(formData:FormData){
 await requireRole(['admin','lead']);
 const parsed=clubSchema.safeParse({name:formData.get('name'),category:formData.get('category')||'General'});
 if(!parsed.success)redirect('/clubs?error=invalid-club');
 try{await ensureDatabase();await getPool().query('INSERT INTO clubs(name,category) VALUES($1,$2)',[parsed.data.name,parsed.data.category||'General']);}
 catch(error){if(error instanceof Error&&error.message.includes('duplicate key'))redirect('/clubs?error=duplicate');throw error;}
 redirect('/clubs?created=1');
}
export async function createOpeningAction(formData:FormData){
 await requireRole(['admin','lead']);
 const parsed=openingSchema.safeParse({title:formData.get('title'),clubId:formData.get('clubId')});
 if(!parsed.success)redirect('/recruitment?error=invalid-opening');
 await ensureDatabase();await getPool().query('INSERT INTO recruitment_openings(title,club_id,status) VALUES($1,$2,$3)',[parsed.data.title,parsed.data.clubId,'Open']);
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
  const canManageAnyTask=user.role==='admin'||user.role==='lead';
  const ownerAccounts=await client.query('SELECT COUNT(*)::int AS count FROM users WHERE LOWER(BTRIM(name))=LOWER(BTRIM($1))',[task.owner||'']);
  const ownsTask=String(task.owner||'').trim().toLocaleLowerCase()===user.name.trim().toLocaleLowerCase()&&Number(ownerAccounts.rows[0]?.count)===1;
  if(!canManageAnyTask&&!ownsTask){await client.query('ROLLBACK');redirect('/tasks?error=forbidden');}
  await client.query('UPDATE tasks SET status=$1,updated_at=NOW() WHERE id=$2',[status,taskId]);
  if(status==='Completed'&&task.status!=='Completed'){
   await client.query('INSERT INTO contribution_events(task_id,club_id,member_name,event_type,points) VALUES($1,$2,$3,$4,$5)',[taskId,task.club_id,task.owner,'task_completed',1]);
  }
  await client.query('COMMIT');
 }catch(error){await client.query('ROLLBACK').catch(()=>{});throw error;}finally{client.release();}
 redirect('/tasks?updated=1');
}

export async function updateApplicationStatusAction(formData:FormData){
 await requireRole(['admin','lead']);
 const id=Number(formData.get('applicationId'));const status=String(formData.get('status')||'');
 if(!Number.isInteger(id)||id<1||!['Applied','Reviewing','Accepted','Rejected'].includes(status))redirect('/recruitment?error=invalid-application');
 await ensureDatabase();const client=await getPool().connect();
 try{
  await client.query('BEGIN');
  const found=await client.query(`SELECT a.id,a.applicant_name,a.email,a.status,a.opening_id,o.club_id FROM recruitment_applications a JOIN recruitment_openings o ON o.id=a.opening_id WHERE a.id=$1 FOR UPDATE OF a`,[id]);
  if(!found.rowCount){await client.query('ROLLBACK');redirect('/recruitment?error=missing-application');}
  const app=found.rows[0];
  await client.query('UPDATE recruitment_applications SET status=$1 WHERE id=$2',[status,id]);
  if(status==='Accepted'&&app.status!=='Accepted'){
   const member=await client.query(`INSERT INTO members(name,email,club_id,role,active) VALUES($1,$2,$3,'Member',TRUE) ON CONFLICT(email) DO UPDATE SET active=TRUE,club_id=COALESCE(EXCLUDED.club_id,members.club_id) RETURNING id,name,club_id`,[app.applicant_name,app.email,app.club_id]);
   await client.query(`INSERT INTO contribution_events(club_id,member_name,event_type,points) VALUES($1,$2,'membership_joined',0)`,[member.rows[0].club_id,member.rows[0].name]);
  }
  await client.query('COMMIT');
 }catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}
 redirect('/recruitment?updated=1');
}
export async function updateFeedbackStatusAction(formData:FormData){
 await requireRole(['admin','lead']);
 const id=Number(formData.get('feedbackId'));const status=String(formData.get('status')||'');
 if(!Number.isInteger(id)||id<1||!['Needs review','Action proposed','Reviewed','Resolved'].includes(status))redirect('/feedback?error=invalid-feedback-status');
 await ensureDatabase();await getPool().query('UPDATE feedback_entries SET status=$1 WHERE id=$2',[status,id]);redirect('/feedback?updated=1');
}
