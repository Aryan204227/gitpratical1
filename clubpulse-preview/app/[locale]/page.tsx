import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowRight,Users,Workflow,BarChart3,Globe } from 'lucide-react';
const copy={
 en:{tag:'P18 · CLUB CONTRIBUTION MANAGEMENT',title:'Make every contribution count.',description:'Connect recruitment, task ownership, contribution history and member feedback in one transparent club workspace.',primary:'Open ClubPulse',secondary:'Rendering strategy lab',modules:[['Club & recruitment','Role openings, applications and onboarding.'],['Tasks & contribution','Ownership, deadlines and recorded task events.'],['Feedback & analytics','Group-level insights with privacy-aware safeguards.']]},
 hi:{tag:'P18 · क्लब योगदान प्रबंधन',title:'हर योगदान को मायने दें।',description:'भर्ती, कार्य-वितरण, योगदान इतिहास और सदस्य फीडबैक को एक पारदर्शी क्लब वर्कस्पेस में जोड़ें।',primary:'ClubPulse खोलें',secondary:'Rendering रणनीति लैब',modules:[['क्लब और भर्ती','भूमिकाएँ, आवेदन और सदस्य ऑनबोर्डिंग।'],['कार्य और योगदान','जिम्मेदारी, समय-सीमा और रिकॉर्ड किए गए कार्य।'],['फीडबैक और विश्लेषण','गोपनीयता का ध्यान रखने वाले समूह-स्तरीय संकेत।']]}
} as const;
export const dynamicParams=false;
export function generateStaticParams(){return [{locale:'en'},{locale:'hi'}];}
export async function generateMetadata({params}:{params:Promise<{locale:string}>}):Promise<Metadata>{
 const {locale}=await params;if(locale!=='en'&&locale!=='hi')return {title:'ClubPulse'};
 return {title:locale==='hi'?'ClubPulse — क्लब योगदान प्रबंधन':'ClubPulse — Club Contribution OS',description:copy[locale].description,alternates:{languages:{en:'/en',hi:'/hi'}}};
}
export default async function LocalizedLandingPage({params}:{params:Promise<{locale:string}>}){
 const {locale}=await params;if(locale!=='en'&&locale!=='hi')notFound();const t=copy[locale as keyof typeof copy];
 return <main className="next-landing"><header className="landing-top"><Link href="/" className="next-brand"><span className="next-brand-mark">✳</span><span>ClubPulse<small>CLUB CONTRIBUTION OS</small></span></Link><div><Link href={locale==='en'?'/hi':'/en'} className="next-secondary-btn"><Globe size={14}/>{locale==='en'?'हिन्दी':'English'}</Link><Link href="/login" className="landing-signin">Sign in</Link></div></header>
 <section className="landing-hero"><div className="landing-copy"><span className="next-eyebrow">{t.tag}</span><h1>{t.title}</h1><p>{t.description}</p><div className="landing-actions"><Link href="/dashboard" className="next-primary-btn">{t.primary}<ArrowRight size={15}/></Link><Link href="/labs/rendering" className="next-secondary-btn">{t.secondary}</Link></div></div><div className="landing-visual"><div className="landing-visual-glow"/><div className="visual-card card-top"><span className="visual-icon purple"><Users size={19}/></span><span><b>{t.modules[0][0]}</b><small>{t.modules[0][1]}</small></span><span className="visual-status">01</span></div><div className="visual-card card-middle"><span className="visual-icon cyan"><Workflow size={19}/></span><span><b>{t.modules[1][0]}</b><small>{t.modules[1][1]}</small></span><span className="visual-status">02</span></div><div className="visual-card card-bottom"><span className="visual-icon green"><BarChart3 size={19}/></span><span><b>{t.modules[2][0]}</b><small>{t.modules[2][1]}</small></span><span className="visual-status">03</span></div></div></section>
 <footer className="landing-footer"><span>ClubPulse · INT252 + INT257 · P18</span><span>Static metadata page · {locale.toUpperCase()} · Use synthetic data only</span></footer></main>;
}
