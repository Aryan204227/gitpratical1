import { NextResponse } from 'next/server';
import { isSameOriginRequest } from '@/lib/request-origin';
import { z } from 'zod';
import { ensureDatabase,getPool } from '@/lib/db';
import { authorizeResponse,getUserFromRequest } from '@/lib/auth';
import { parseCsv,rowsToObjects } from '@/lib/csv.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const taskRow=z.object({
 title:z.string().trim().min(3).max(160),
 owner:z.string().trim().min(1).max(80).default('Unassigned'),
 due_date:z.string().regex(/^\\d{4}-\\d{2}-\\d{2}$/,'Use YYYY-MM-DD for due_date.').refine(value=>{
  const d=new Date(value+'T00:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===value;
 },'Enter a real calendar date.'),
 priority:z.enum(['Low','Medium','High','Urgent']),
 club_id:z.string().optional()
});
export async function POST(request:Request){
 try{
  const denied=authorizeResponse(await getUserFromRequest(request),['admin','lead']);if(denied)return denied;
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: 'Cross-origin requests are not accepted.' }, { status: 403 });
  const form=await request.formData().catch(()=>null);const file=form?.get('file');
  if(!(file instanceof File))return NextResponse.json({error:'Choose a CSV file.'},{status:400});
  if(!file.name.toLowerCase().endsWith('.csv'))return NextResponse.json({error:'Only .csv files are accepted.'},{status:415});
  if(file.size===0||file.size>1024*1024)return NextResponse.json({error:'CSV file must be between 1 byte and 1 MB.'},{status:413});
  await ensureDatabase();
  let objects:Record<string,string>[];
  try{objects=rowsToObjects(parseCsv(await file.text()));}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'CSV format is invalid.'},{status:400});}
  if(objects.length===0)return NextResponse.json({error:'The CSV has a header but no task rows.'},{status:400});
  if(objects.length>100)return NextResponse.json({error:'Import is limited to 100 tasks per file.'},{status:413});
  const parsed=objects.map((row,index)=>({line:index+2,result:taskRow.safeParse({...row,owner:row.owner||'Unassigned',priority:row.priority||'Medium'})}));
  const invalid=parsed.find(entry=>!entry.result.success);
  if(invalid&&!invalid.result.success)return NextResponse.json({error:'Row '+invalid.line+': '+(invalid.result.error.issues[0]?.message||'Invalid task data.')},{status:400});
  const valid=parsed.map(entry=>(entry.result as {success:true;data:z.infer<typeof taskRow>}).data);
  const pool=getPool();const client=await pool.connect();
  try{
   await client.query('BEGIN');
   const clubs=await client.query('SELECT id,name FROM clubs ORDER BY id');
   if(!clubs.rowCount){await client.query('ROLLBACK');return NextResponse.json({error:'Create a club before importing tasks.'},{status:409});}
   const clubIds=new Set(clubs.rows.map(row=>String(row.id)));
   const unknownClub=valid.findIndex(row=>row.club_id&& !clubIds.has(row.club_id));
   if(unknownClub>=0){await client.query('ROLLBACK');return NextResponse.json({error:'Row '+(unknownClub+2)+': club_id does not match an existing club.'},{status:400});}
   const defaultClubId=clubs.rows[0].id;const created=[];
   for(const row of valid){
    const clubId=row.club_id?Number(row.club_id):defaultClubId;
    const task=await client.query(`INSERT INTO tasks(title,owner,due_date,status,priority,club_id) VALUES($1,$2,$3,'To do',$4,$5) RETURNING id,title,owner,to_char(due_date,'YYYY-MM-DD') AS due_date,status,priority,club_id`,[row.title,row.owner,row.due_date,row.priority,clubId]);
    await client.query('INSERT INTO contribution_events(task_id,club_id,member_name,event_type,points) VALUES($1,$2,$3,$4,$5)',[task.rows[0].id,clubId,row.owner,'task_assigned',0]);
    created.push(task.rows[0]);
   }
   await client.query('COMMIT');
   return NextResponse.json({imported:created.length,tasks:created,message:'Imported tasks and recorded assignment events in a single transaction.'},{status:201,headers:{'Cache-Control':'no-store'}});
  }catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}
 }catch(error){const message=error instanceof Error?error.message:'';return NextResponse.json({error:message.includes('DATABASE_URL')?message:'The CSV import could not be completed.'},{status:503});}
}
