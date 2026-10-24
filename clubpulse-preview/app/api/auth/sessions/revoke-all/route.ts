import { NextResponse } from 'next/server';
import { getUserFromRequest,clearSessionCookie } from '@/lib/auth';
import { ensureDatabase,getPool } from '@/lib/db';
import { isTrustedMutationRequest } from '@/lib/request-origin';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function POST(request:Request){
 if(!isTrustedMutationRequest(request))return NextResponse.json({error:'Request origin could not be verified.'},{status:403});
 const user=await getUserFromRequest(request);
 if(!user)return NextResponse.json({error:'Sign in required.'},{status:401});
 try{
  await ensureDatabase();await getPool().query('DELETE FROM sessions WHERE user_id=$1',[user.id]);
  const response=NextResponse.json({ok:true,message:'All sessions revoked. Sign in again on this device.'},{headers:{'Cache-Control':'no-store'}});
  response.headers.append('Set-Cookie',clearSessionCookie());return response;
 }catch{return NextResponse.json({error:'Could not revoke sessions right now.'},{status:503});}
}
