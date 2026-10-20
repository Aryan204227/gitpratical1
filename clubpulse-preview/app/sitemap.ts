import type { MetadataRoute } from 'next';
export default function sitemap():MetadataRoute.Sitemap{
 const base=process.env.NEXT_PUBLIC_APP_URL||'https://clubpulse-live.onrender.com';
 const now=new Date();
 return [
  {url:base, lastModified:now, changeFrequency:'monthly', priority:1},
  {url:base+'/en', lastModified:now, changeFrequency:'monthly', priority:0.8},
  {url:base+'/hi', lastModified:now, changeFrequency:'monthly', priority:0.8},
  {url:base+'/rendering-demo', lastModified:now, changeFrequency:'yearly', priority:0.3}
 ];
}
