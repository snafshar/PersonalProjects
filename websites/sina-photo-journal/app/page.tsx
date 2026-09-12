import Link from 'next/link';
import { ArrowUpRight, Aperture } from 'lucide-react';
import { publicPhotos } from '@/lib/server';
import { demoPhotos } from '@/lib/content';
import { PhotoCard } from '@/components/photo-card';
export const dynamic = 'force-dynamic';
export default async function Home() {
  const { photos, unavailable } = await publicPhotos();
  const shown=photos.length?photos:demoPhotos;
  return <main id="main" className="page journal-home">
    <div className="intro"><div><p className="eyebrow">Sina Afshar / A photographic journal</p><h1>Look a little<br/><em>longer.</em></h1></div><div className="intro-note"><span className="tiny-line"/><p>Photographs, the stories behind them,<br className="desktop-only"/> and the art of getting the shot.</p><a href="#journal" className="text-link">Explore the journal <ArrowUpRight size={17}/></a></div></div>
    {unavailable&&<p role="status" className="notice">The journal is temporarily unavailable. You can still explore Photo Lab.</p>}
    {!photos.length&&<p className="sample-note">Sample gallery · AI-generated examples, not photographs by Sina. Sina’s photographs will appear here when published.</p>}
    <section id="journal" aria-label="Latest photographs" className="editorial-grid">{shown.slice(0,3).map((p,i)=><PhotoCard key={p.id} photo={p} index={i} featured={i===0}/>)}</section>
    {shown.length>3&&<section aria-label="More photographs" className="photo-grid">{shown.slice(3).map((p,i)=><PhotoCard key={p.id} photo={p} index={i+3}/>)}</section>}
    <section className="lab-banner"><div className="lab-symbol"><Aperture strokeWidth={1} size={72}/></div><div><p className="eyebrow">Behind the photograph</p><h2>Make your next frame <em>intentional.</em></h2><p>Explore 26 shooting scenarios and the exposure triangle in Photo Lab.</p></div><Link className="button light" href="/lab">Enter Photo Lab <ArrowUpRight size={18}/></Link></section>
    <section className="section-heading" style={{marginBottom:65,gap:30,flexWrap:'wrap'}}><div><p className="eyebrow">Have something in mind?</p><h2 style={{margin:'10px 0'}}>Let’s make a frame <em>of your own.</em></h2><p className="muted">A personal commission, an image edit or a licence shaped around your idea.</p></div><Link className="button secondary" href="/custom-orders">Explore custom orders <ArrowUpRight size={18}/></Link></section>
  </main>;
}
