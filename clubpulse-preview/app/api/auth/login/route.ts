import { NextResponse } from 'next/server';
import { isTrustedMutationRequest } from '@/lib/request-origin';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { ensureDatabase,getPool } from '@/lib/db';
import { createSession,sessionCookie } from '@/lib/auth';
import { consumeRateLimit,requestClientAddress } from '@/lib/rate-limit';
export const runtime='nodejs';export const dynamic='force-dynamic';
const schema=z.object({email:z.string().trim().toLowerCase().email('Enter a valid email address.').max(254),password:z.string().min(1,'Password is required.').max(128)});
export async function POST(request:Request){
 try{
  if(!isTrustedMutationRequest(request))return NextResponse.json({error:'Request origin could not be verified. Refresh the page and try again.'},{status:403});
  await ensureDatabase();
  const input=schema.safeParse(await request.json().catch(()=>null));
  if(!input.success)return NextResponse.json({error:input.error.issues[0]?.message||'Invalid sign-in details.'},{status:400});
  const address=requestClientAddress(request);
  const [ipAllowed,emailAllowed]=await Promise.all([consumeRateLimit('login-ip',address,60,900),consumeRateLimit('login-email',input.data.email,10,900)]);
  if(!ipAllowed||!emailAllowed)return NextResponse.json({error:'Too many sign-in attempts. Wait 15 minutes and try again.'},{status:429,headers:{'Retry-After':'900'}});
  const result=await getPool().query('SELECT id,name,email,role,password_hash FROM users WHERE LOWER(email)=LOWER($1) LIMIT 1',[input.data.email]);
  const row=result.rows[0];
  if(!row||!row.password_hash||!(await bcrypt.compare(input.data.password,row.password_hash)))return NextResponse.json({error:'Email or password is incorrect.'},{status:401});
  await getPool().query('DELETE FROM sessions WHERE expires_at<=NOW()');
  const session=await createSession(row.id);
  const response=NextResponse.json({user:{id:row.id,name:row.name,email:row.email,role:row.role}},{headers:{'Cache-Control':'no-store'}});
  response.headers.append('Set-Cookie',sessionCookie(session.token));return response;
 }catch{return NextResponse.json({error:'Sign-in is temporarily unavailable. Check the database connection and try again.'},{status:503,headers:{'Cache-Control':'no-store'}});}
}
