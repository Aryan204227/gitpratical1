import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { ensureDatabase, getPool } from '@/lib/db';
import { createSession, sessionCookie } from '@/lib/auth';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const schema=z.object({
  name:z.string().trim().min(2,'Name must contain at least 2 characters.').max(80),
  email:z.string().trim().toLowerCase().email('Enter a valid email address.').max(254),
  password:z.string().min(10,'Password must contain at least 10 characters.').max(128),
});
export async function POST(request:Request){
  try{
    const origin=request.headers.get('origin');
    if(origin&&new URL(origin).origin!==new URL(request.url).origin)return NextResponse.json({error:'Cross-origin request rejected.'},{status:403});
    await ensureDatabase();
    const input=schema.safeParse(await request.json().catch(()=>null));
    if(!input.success)return NextResponse.json({error:input.error.issues[0]?.message||'Invalid registration details.'},{status:400});
    const client=await getPool().connect();
    let user;
    try{
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock($1)', [824773301]);
      const exists=await client.query('SELECT id FROM users WHERE LOWER(email)=LOWER($1)',[input.data.email]);
      if(exists.rowCount){await client.query('ROLLBACK');return NextResponse.json({error:'An account with this email already exists.'},{status:409});}
      const count=await client.query('SELECT COUNT(*)::int AS count FROM users');
      const role=count.rows[0].count===0?'admin':'member';
      const hash=await bcrypt.hash(input.data.password,12);
      const inserted=await client.query('INSERT INTO users(name,email,password_hash,role) VALUES($1,$2,$3,$4) RETURNING id,name,email,role',[input.data.name,input.data.email,hash,role]);
      user=inserted.rows[0];
      await client.query('COMMIT');
    }catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}
    const session=await createSession(user.id);
    const response=NextResponse.json({user,notice:user.role==='admin'?'The first registered account is the initial workspace administrator.':'Account created. Ask a workspace administrator to grant elevated access if needed.'},{status:201});
    response.headers.append('Set-Cookie',sessionCookie(session.token));
    return response;
  }catch(error){
    const message=error instanceof Error?error.message:'Could not create the account.';
    return NextResponse.json({error:message.includes('DATABASE_URL')?message:'Account creation failed. Check the database connection and try again.'},{status:503});
  }
}
