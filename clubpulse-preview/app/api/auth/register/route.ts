import {createHash,timingSafeEqual} from 'node:crypto';
import {NextResponse} from 'next/server';
import {isTrustedMutationRequest} from '@/lib/request-origin';
import bcrypt from 'bcryptjs';
import {z} from 'zod';
import {ensureDatabase,getPool} from '@/lib/db';
import {createSession,sessionCookie} from '@/lib/auth';
import {consumeRateLimit,requestClientAddress} from '@/lib/rate-limit';
export const runtime='nodejs';export const dynamic='force-dynamic';
const schema=z.object({name:z.string().trim().min(2,'Name must contain at least 2 characters.').max(80),email:z.string().trim().toLowerCase().email('Enter a valid email address.').max(254),password:z.string().min(12,'Use a password or passphrase with at least 12 characters.').max(128),bootstrapSecret:z.string().max(256).optional()});
function constantTimeSecretMatch(actual:string,expected:string){return timingSafeEqual(createHash('sha256').update(actual).digest(),createHash('sha256').update(expected).digest());}
export async function POST(request:Request){
 try{
  if(!isTrustedMutationRequest(request))return NextResponse.json({error:'Request origin could not be verified. Refresh the page and try again.'},{status:403});
  if(!await consumeRateLimit('register-ip',requestClientAddress(request),8,3600))return NextResponse.json({error:'Too many registration attempts. Try again in an hour.'},{status:429,headers:{'Retry-After':'3600'}});
  await ensureDatabase();
  const input=schema.safeParse(await request.json().catch(()=>null));
  if(!input.success)return NextResponse.json({error:input.error.issues[0]?.message||'Invalid registration details.'},{status:400});
  const client=await getPool().connect();let user:any;
  try{
   await client.query('BEGIN');await client.query('SELECT pg_advisory_xact_lock($1)',[824773301]);
   const exists=await client.query('SELECT id FROM users WHERE LOWER(email)=LOWER($1)',[input.data.email]);
   if(exists.rowCount){await client.query('ROLLBACK');return NextResponse.json({error:'An account with this email already exists.'},{status:409});}
   const admins=await client.query("SELECT COUNT(*) FILTER (WHERE role='admin')::int AS admins FROM users");
   const bootstrapEmail=(process.env.BOOTSTRAP_ADMIN_EMAIL||'').trim().toLowerCase();const expected=process.env.BOOTSTRAP_ADMIN_SECRET||'';const supplied=input.data.bootstrapSecret||'';
   const mayBootstrap=Number(admins.rows[0]?.admins||0)===0&&expected.length>=32&&bootstrapEmail===input.data.email&&supplied.length>0&&constantTimeSecretMatch(supplied,expected);
   const role=mayBootstrap?'admin':'member';const hash=await bcrypt.hash(input.data.password,12);
   user=(await client.query('INSERT INTO users(name,email,password_hash,role) VALUES($1,$2,$3,$4) RETURNING id,name,email,role',[input.data.name,input.data.email,hash,role])).rows[0];
   await client.query('COMMIT');
  }catch(error){await client.query('ROLLBACK').catch(()=>{});throw error;}finally{client.release();}
  const session=await createSession(user.id);
  const notice=user.role==='admin'?'Initial workspace administrator configured securely.':'Account created with member access. Ask an existing administrator for elevated permissions.';
  const response=NextResponse.json({user,notice},{status:201,headers:{'Cache-Control':'no-store'}});response.headers.append('Set-Cookie',sessionCookie(session.token));return response;
 }catch{return NextResponse.json({error:'Account creation is temporarily unavailable. Check the database connection and try again.'},{status:503,headers:{'Cache-Control':'no-store'}});}
}
