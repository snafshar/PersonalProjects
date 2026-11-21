import type { Asset, Entry, Frame, Paragraph } from "../types";
export const esc=(value:unknown)=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]!));
export const json=(value:unknown)=>JSON.stringify(value).replace(/[<>&\u2028\u2029]/g,c=>"\\u"+c.charCodeAt(0).toString(16).padStart(4,"0"));
const paths:Record<string,string>={
 aperture:'<circle cx="12" cy="12" r="9.2"/><path d="m13.5 3 5.1 8.8m2.3 1-10.2.1m7.5 6.7-5.1-8.8m-2.6 10.3-5.1-8.8m-2.4-1 10.2-.1M5.8 4.5l5.1 8.8"/>',
 search:'<circle cx="10.5" cy="10.5" r="6.3"/><path d="m15.4 15.4 4.8 4.8"/>',
 pin:'<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.3"/>',
 book:'<path d="M3 4.5c3.5-.8 6.6-.1 9 1.6 2.4-1.7 5.5-2.4 9-1.6v14c-3.5-.8-6.6-.1-9 1.6-2.4-1.7-5.5-2.4-9-1.6zM12 6.1v14"/>',
 grid:'<rect x="3.5" y="3.5" width="6.5" height="6.5"/><rect x="14" y="3.5" width="6.5" height="6.5"/><rect x="3.5" y="14" width="6.5" height="6.5"/><rect x="14" y="14" width="6.5" height="6.5"/>',
 email:'<rect x="2.5" y="5" width="19" height="14" rx="1.5"/><path d="m3 6 9 7 9-7"/>',
 phone:'<path d="M5 3h4l1.3 5.3-2.4 1.9a14.6 14.6 0 0 0 6 6l2-2.4L21 15v4a2 2 0 0 1-2.2 2C10.4 20.2 3.8 13.7 3 5.2A2 2 0 0 1 5 3Z"/>',
 instagram:'<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.3"/><circle cx="17.5" cy="6.8" r=".8" fill="currentColor"/>',
 whatsapp:'<path d="M4 18.2 3 21l3.8-.9A9 9 0 1 0 4 18.2Z"/><path d="M8.5 7.6c.4-.2.8.2 1.2 1.1l.4 1c.1.5-.6.9-.8 1.2.8 1.5 2.4 2.9 3.9 3.4.4-.2.8-1.1 1.2-1.2.4-.2 1.8.6 2.3 1 .6.5-.2 1.8-.9 2.1-2.7 1.1-8.7-3.4-8.9-6.7 0-.9.7-1.7 1.6-1.9Z"/>',
 telegram:'<path d="m3 11 18-7-3.2 16-6-4.7-3.4 3 .4-5.4L17 7l-10 5.4z"/>',
 print:'<path d="M6 9V3h12v6M6 17H3V9h18v8h-3M6 14h12v7H6z"/>',
};
export const icon=(name:string)=>`<svg class="icon" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${paths[name]??""}</svg>`;
export const dateText=(date:string)=>new Date(date+"T12:00:00Z").toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric",timeZone:"UTC"});
export const pathFor=(d:Pick<Entry,"id"|"section">)=>(d.section==="news"?"/news/":"/story/")+d.id;
export const assetsMap=(assets:Asset[])=>new Map(assets.map(a=>[a.id,a]));
export function mediaElement(m:Asset,alt:string,mode:"hero"|"card"|"body"="body"){
  if(m.kind==="video")return `<video ${mode==="body"?"controls":"muted"} playsinline preload="metadata" aria-label="${esc(alt||m.name)}" src="${esc(m.url)}#t=0.01"></video>`;
  const thumb=m.thumb!==m.url;
  return `<img src="${esc(mode==="card"?m.thumb:m.url)}"${thumb?` srcset="${esc(m.thumb)} 720w, ${esc(m.url)} 1536w" sizes="${mode==="card"?"(max-width: 700px) 92vw, 32vw":"(max-width: 740px) 94vw, 70vw"}"`:""} width="${m.width}" height="${m.height}" alt="${esc(alt||m.alt)}"${mode==="hero"?' fetchpriority="high"':' loading="lazy"'} decoding="async">`;
}
export function coverMedia(d:Entry, m:Asset, mode:"hero"|"card"|"body") {
  const overlay = d.coverOverlay ? `<span class="on-photo ${esc(d.coverOverlayAt || "bottom")}">${esc(d.coverOverlay)}</span>` : "";
  return `<div class="cover-visual">${mediaElement(m,d.coverAlt,mode)}${overlay}</div>`;
}
export function rich(p:Paragraph){
  const tag=p.kind==="h2"?"h2":p.kind==="quote"?"blockquote":"p";
  return `<${tag}>${p.runs.map(r=>{let t=esc(r.text);if(r.bold)t="<strong>"+t+"</strong>";if(r.italic)t="<em>"+t+"</em>";if(r.underline)t="<u>"+t+"</u>";return t;}).join("")}</${tag}>`;
}
export function figure(f:Frame,m:Asset){
  return `<figure class="flow-figure"><div class="media-wrap">${mediaElement(m,f.alt)}${f.overlay?`<span class="on-photo ${f.overlayAt}">${esc(f.overlay)}</span>`:""}</div>${f.caption?`<figcaption>${esc(f.caption)}</figcaption>`:""}</figure>`;
}
export function shell(title:string,body:string,active="",scripts:string[]=[],privatePage=false,description="A personal journal of photographs and stories by Sina Afshar."){
  const nav=[["/","Home"],["/archive","Journal"],["/about","About me"],["/news","News"],["/contact","Contact"]];
  const brand=`<a class="brand" href="/" aria-label="MyPhotoStories home"><span class="brand-mark" aria-hidden="true"></span><span class="brand-word">MyPhotoStories</span></a>`;
  const header=privatePage?`<header class="studio-mast wrap"><a class="mini-brand" href="/">MyPhotoStories</a><span>Private studio</span><a class="quiet-link" href="/signout-with-chatgpt?return_to=%2F" target="_top">Sign out</a></header>`:
  `<header class="site-header${active==="Home"?" cover-header":""}"><div class="wrap header-inner">${brand}<nav class="site-nav" aria-label="Main navigation">${nav.map(([url,label])=>`<a href="${url}"${active===label?' aria-current="page"':""}>${label}</a>`).join("")}</nav></div></header>`;
  const footer=privatePage?"":`<footer class="site-footer"><div class="wrap footer-inner">${brand}<p>© ${new Date().getUTCFullYear()} Sina Afshar</p><a class="quiet-link" href="/contact">Contact</a></div></footer>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#f3eddf"><meta name="description" content="${esc(description)}">${privatePage?'<meta name="robots" content="noindex,nofollow">':""}<title>${title?esc(title)+" · ":""}MyPhotoStories</title><link rel="icon" href="/favicon.svg"><link rel="preload" href="/press/fonts/InstrumentSerif-Regular.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="/press/journal.css">${privatePage?'<link rel="stylesheet" href="/press/studio.css">':'<link rel="stylesheet" href="/press/magazine.css">'}${scripts.map(s=>`<script type="module" src="${s}"></script>`).join("")}</head><body class="${privatePage?"studio-body":"public-body"}"><a class="skip" href="#main">Skip to content</a>${header}${body}${footer}</body></html>`;
}
