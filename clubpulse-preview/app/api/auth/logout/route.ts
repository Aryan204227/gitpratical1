import { NextResponse } from 'next/server';
import { clearSessionCookie, destroySessionFromRequest } from '@/lib/auth';
export const runtime='nodejs';
export async function POST(request:Request){
  try{await destroySessionFromRequest(request);}catch{/* still clear a stale browser cookie */}
  const response=NextResponse.json({ok:true});
  response.headers.append('Set-Cookie',clearSessionCookie());
  return response;
}
