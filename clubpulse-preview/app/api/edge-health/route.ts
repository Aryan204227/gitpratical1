import { NextResponse } from 'next/server';
export const runtime='edge';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 const requestId=crypto.randomUUID();
 return NextResponse.json({
  service:'ClubPulse Edge Runtime Lab',
  runtime:'edge',
  ok:true,
  requestId,
  acceptedAt:new Date().toISOString(),
  note:'This route is intentionally stateless. Database queries use the Node.js runtime route handlers.',
  regionHint:request.headers.get('x-vercel-id')??'Not provided by this host'
 },{headers:{'Cache-Control':'no-store','X-ClubPulse-Runtime':'edge'}});
}
