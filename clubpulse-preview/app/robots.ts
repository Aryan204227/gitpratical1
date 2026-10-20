import type { MetadataRoute } from 'next';
export default function robots():MetadataRoute.Robots{
 const base=process.env.NEXT_PUBLIC_APP_URL||'https://clubpulse-live.onrender.com';
 return {rules:{userAgent:'*',allow:['/','/en','/hi','/rendering-demo'],disallow:['/dashboard','/clubs','/members','/recruitment','/tasks','/contributions','/feedback','/analytics','/api','/login','/register']},sitemap:base+'/sitemap.xml'};
}
