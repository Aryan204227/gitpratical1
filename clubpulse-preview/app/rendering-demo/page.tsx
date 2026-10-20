import Link from 'next/link';
import type { Metadata } from 'next';
import { RefreshCw,ArrowLeft } from 'lucide-react';
export const metadata:Metadata={title:'ISR Rendering Demo | ClubPulse',description:'A public example of incremental static regeneration in Next.js.'};
export const revalidate=60;
export default function RenderingDemoPage(){return <main className="next-public-lab"><Link href="/labs/rendering" className="next-back-link"><ArrowLeft size={14}/> Back to rendering lab</Link><span className="next-eyebrow">PUBLIC · ISR EXAMPLE</span><h1>Incremental static <em>regeneration.</em></h1><p>This route is configured with a 60-second revalidation interval to demonstrate ISR. The timestamp is generated at render/revalidation time; it is a teaching signal, not business data.</p><div className="next-isr-card"><RefreshCw size={24}/><div><small>GENERATED / REVALIDATED AT</small><strong>{new Date().toISOString()}</strong><span>Export const revalidate = 60</span></div></div><div className="next-code-box"><pre>{`export const revalidate = 60;

export default function RenderingDemoPage() {
  return <main>
    <h1>Incremental Static Regeneration</h1>
    <p>Public content is revalidated in a bounded interval.</p>
  </main>;
}`}</pre></div><p className="next-subtle">Private dashboard pages use dynamic server rendering and are not shared-cached. Never put session-specific or private member data into public static pages.</p></main>;}
