import Link from 'next/link';
import {ArrowUpRight} from 'lucide-react';
import {Photo,money} from '@/lib/content';
export function PhotoCard({photo:p,index=0,featured=false}:{photo:Photo;index?:number;featured?:boolean}){
return <article className={`photo-card ${featured?'featured':''}`}><Link className="photo-image" href={`/journal/${p.slug}`} aria-label={`Read ${p.title}`}><img src={p.preview} alt={p.alt} width={p.width||1600} height={p.height||1100} loading={featured?'eager':'lazy'} fetchPriority={featured?'high':'auto'}/><span className="photo-tag">{p.category}</span><span className="image-open"><ArrowUpRight size={20}/></span></Link><div className="photo-caption"><span className="photo-number">{String(index+1).padStart(2,'0')}</span><div><p className="eyebrow">{p.location||'Field notes'}{p.demo?' · Sample':''}</p><h2><Link href={`/journal/${p.slug}`}>{p.title}</Link></h2>{featured&&<p className="caption-excerpt">{p.caption.slice(0,160)}</p>}</div>{!p.demo&&p.price_cents>0&&<span className="price">{money(p.price_cents)}</span>}</div></article>;
}
