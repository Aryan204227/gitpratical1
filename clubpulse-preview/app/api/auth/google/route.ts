import { OAuth2Client } from 'google-auth-library';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSession,sessionCookie } from '@/lib/auth';
import { ensureDatabase,getPool } from '@/lib/db';
import { isTrustedMutationRequest } from '@/lib/request-origin';
import { consumeRateLimit,requestClientAddress } from '@/lib/rate-limit';
export const runtime='nodejs';export const dynamic='force-dynamic';
const schema=z.object({credential:z.string().min(20).max(8192)});
const verifier=new OAuth2Client();
export async function POST(request:Request){
 try{
  if(!isTrustedMutationRequest(request))return NextResponse.json({error:'Request origin could not be verified.'},{status:403});
  const clientId=process.env.GOOGLE_CLIENT_ID||process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if(!clientId)return NextResponse.json({error:'Google sign-in is not configured on this deployment yet.'},{status:503});
  if(!await consumeRateLimit('google-ip',requestClientAddress(request),30,900))return NextResponse.json({error:'Too many Google sign-in attempts. Wait 15 minutes and retry.'},{status:429,headers:{'Retry-After':'900'}});
  const parsed=schema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:'Google credential is missing or invalid.'},{status:400});
  const ticket=await verifier.verifyIdToken({idToken:parsed.data.credential,audience:clientId});
  const payload=ticket.getPayload();
  if(!payload?.sub||!payload.email||payload.email_verified!==true)return NextResponse.json({error:'Google did not provide a verified email for this account.'},{status:401});
  const email=payload.email.trim().toLowerCase();
  if(!await consumeRateLimit('google-email',email,15,900))return NextResponse.json({error:'Too many attempts for this account. Wait 15 minutes and retry.'},{status:429,headers:{'Retry-After':'900'}});
  await ensureDatabase();
  const client=await getPool().connect();let user:any=null;
  try{
   await client.query('BEGIN');
   await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[email]);
   const linked=await client.query('SELECT id,name,email,role FROM users WHERE google_sub=$1 LIMIT 1',[payload.sub]);
   if(linked.rowCount)user=linked.rows[0];
   else{
    const sameEmail=await client.query('SELECT id,google_sub FROM users WHERE LOWER(email)=LOWER($1) LIMIT 1',[email]);
    if(sameEmail.rowCount){
     await client.query('ROLLBACK');
     return NextResponse.json({error:'This email already has a password account. Sign in with your password, then open Settings → Account security to link Google.'},{status:409});
    }
    const name=(payload.name||email.split('@')[0]).trim().slice(0,80)||'Google member';
    user=(await client.query("INSERT INTO users(name,email,password_hash,google_sub,role) VALUES($1,$2,NULL,$3,'member') RETURNING id,name,email,role",[name,email,payload.sub])).rows[0];
   }
   await client.query('COMMIT');
  }catch(error){await client.query('ROLLBACK').catch(()=>{});throw error;}finally{client.release();}
  const session=await createSession(Number(user.id));
  const response=NextResponse.json({user},{headers:{'Cache-Control':'no-store'}});
  response.headers.append('Set-Cookie',sessionCookie(session.token));return response;
 }catch(error){
  if(error instanceof Error&&/token|audience|credential|JWT|expired|invalid/i.test(error.message))return NextResponse.json({error:'Google sign-in could not verify this account. Try again or use your password.'},{status:401});
  return NextResponse.json({error:'Google sign-in is temporarily unavailable. Check deployment configuration and try again.'},{status:503,headers:{'Cache-Control':'no-store'}});
 }
}
