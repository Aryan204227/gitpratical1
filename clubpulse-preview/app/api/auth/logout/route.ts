import {NextResponse} from 'next/server';
import {clearSessionCookie,destroySessionFromRequest} from '@/lib/auth';
import {isTrustedMutationRequest} from '@/lib/request-origin';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function POST(request:Request){
 if(!isTrustedMutationRequest(request))return NextResponse.json({error:'Request origin could not be verified.'},{status:403});
 try{await destroySessionFromRequest(request);}catch{/* clear stale cookie even if DB is unavailable */}
 const response=NextResponse.json({ok:true},{headers:{'Cache-Control':'no-store'}});response.headers.append('Set-Cookie',clearSessionCookie());return response;
}
