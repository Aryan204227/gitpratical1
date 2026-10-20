import { NextResponse } from 'next/server';
import { isSameOriginRequest } from '@/lib/request-origin';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { ensureDatabase, getPool } from '@/lib/db';
import { createSession, sessionCookie } from '@/lib/auth';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const schema=z.object({
  email:z.string().trim().toLowerCase().email('Enter a valid email address.').max(254),
  password:z.string().min(1,'Password is required.').max(128),
});
export async function POST(request:Request){
  try{
    if(!isSameOriginRequest(request))return NextResponse.json({error:'Cross-origin request rejected.'},{status:403});
    await ensureDatabase();
    const input=schema.safeParse(await request.json().catch(()=>null));
    if(!input.success)return NextResponse.json({error:input.error.issues[0]?.message||'Invalid sign-in details.'},{status:400});
    const result=await getPool().query('SELECT id,name,email,role,password_hash FROM users WHERE LOWER(email)=LOWER($1) LIMIT 1',[input.data.email]);
    const row=result.rows[0];
    if(!row||!(await bcrypt.compare(input.data.password,row.password_hash)))return NextResponse.json({error:'Email or password is incorrect.'},{status:401});
    await getPool().query('DELETE FROM sessions WHERE expires_at<=NOW()');
    const session=await createSession(row.id);
    const user={id:row.id,name:row.name,email:row.email,role:row.role};
    const response=NextResponse.json({user});
    response.headers.append('Set-Cookie',sessionCookie(session.token));
    return response;
  }catch(error){
    const message=error instanceof Error?error.message:'Could not sign in.';
    return NextResponse.json({error:message.includes('DATABASE_URL')?message:'Sign-in failed. Check the database connection and try again.'},{status:503});
  }
}
