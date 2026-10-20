import { NextRequest,NextResponse } from 'next/server';
const protectedPrefixes=['/dashboard','/clubs','/members','/recruitment','/tasks','/contributions','/feedback','/analytics','/labs'];
export function proxy(request:NextRequest){
 const path=request.nextUrl.pathname;
 if(!protectedPrefixes.some(prefix=>path===prefix||path.startsWith(prefix+'/')))return NextResponse.next();
 if(request.cookies.has('clubpulse_session'))return NextResponse.next();
 const url=new URL('/login',request.url);url.searchParams.set('next',path);
 return NextResponse.redirect(url);
}
export const config={matcher:['/dashboard/:path*','/clubs/:path*','/members/:path*','/recruitment/:path*','/tasks/:path*','/contributions/:path*','/feedback/:path*','/analytics/:path*','/labs/:path*']};
