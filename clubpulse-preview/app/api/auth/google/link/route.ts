import { OAuth2Client } from 'google-auth-library';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserFromRequest } from '@/lib/auth';
import { ensureDatabase,getPool } from '@/lib/db';
import { isTrustedMutationRequest } from '@/lib/request-origin';
import { consumeRateLimit,requestClientAddress } from '@/lib/rate-limit';
export const runtime='nodejs';export const dynamic='force-dynamic';
const schema=z.object({credential:z.string().min(20).max(8192)});
const verifier=new OAuth2Client();
export async function POST(request:Request){
 try{
  if(!isTrustedMutationRequest(request))return NextResponse.json({error:'Request origin could not be verified.'},{status:403});
  const user=await getUserFromRequest(request);
  if(!user)return NextResponse.json({error:'Sign in before linking a Google account.'},{status:401});
  const clientId=process.env.GOOGLE_CLIENT_ID||process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if(!clientId)return NextResponse.json({error:'Google sign-in is not configured on this deployment yet.'},{status:503});
  if(!await consumeRateLimit('google-link-ip',requestClientAddress(request),10,900))return NextResponse.json({error:'Too many account-link attempts. Wait 15 minutes and retry.'},{status:429,headers:{'Retry-After':'900'}});
  const parsed=schema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:'Google credential is missing or invalid.'},{status:400});
  const ticket=await verifier.verifyIdToken({idToken:parsed.data.credential,audience:clientId});
  const payload=ticket.getPayload();
  if(!payload?.sub||!payload.email||payload.email_verified!==true)return NextResponse.json({error:'Google did not provide a verified email for this account.'},{status:401});
  if(payload.email.trim().toLowerCase()!==user.email.toLowerCase())return NextResponse.json({error:'Use a Google account with the same verified email as your ClubPulse account.'},{status:403});
  await ensureDatabase();const pool=getPool();
  const occupied=await pool.query('SELECT id FROM users WHERE google_sub=$1 AND id<>$2 LIMIT 1',[payload.sub,user.id]);
  if(occupied.rowCount)return NextResponse.json({error:'This Google account is already linked to another ClubPulse account.'},{status:409});
  const updated=await pool.query('UPDATE users SET google_sub=$1 WHERE id=$2 AND (google_sub IS NULL OR google_sub=$1) RETURNING id',[payload.sub,user.id]);
  if(!updated.rowCount)return NextResponse.json({error:'A different Google account is already linked. Contact your administrator to review the account.'},{status:409});
  return NextResponse.json({linked:true,message:'Google account linked. You can use it for future sign-ins.'},{headers:{'Cache-Control':'no-store'}});
 }catch(error){
  if(error instanceof Error&&/token|audience|credential|JWT|expired|invalid/i.test(error.message))return NextResponse.json({error:'Google sign-in could not verify this account. Try again.'},{status:401});
  return NextResponse.json({error:'Could not link Google right now. Try again later.'},{status:503,headers:{'Cache-Control':'no-store'}});
 }
}
