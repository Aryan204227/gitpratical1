import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:Request){
  try{
    const user=await getUserFromRequest(request);
    return NextResponse.json({authenticated:Boolean(user),user},{headers:{'Cache-Control':'no-store'}});
  }catch{
    return NextResponse.json({authenticated:false,user:null,error:'Database is not configured or unavailable.'},{status:503,headers:{'Cache-Control':'no-store'}});
  }
}
