import type { Asset, Contacts, Entry } from "../types";
import type { Challenge } from "../letters";
import { isSample } from "../store";
import { assetsMap, coverMedia, dateText, esc, figure, icon, json, pathFor, rich, shell } from "./shared";

function spread(d:Entry,media:Map<string,Asset>,index:number){
  const m=media.get(d.cover),href=pathFor(d);
  const facts=[d.location,isSample(d.id)?"Sample":""].filter(Boolean);
  const opening=d.body.find(p=>p.kind==="p");
  const excerpt=d.deck?`<p>${esc(d.deck)}</p>`:opening?rich(opening):"";
  return `<article class="magazine-spread${m?"":" text-only"}">
    ${m?`<figure class="magazine-photograph"><a class="magazine-photo-link" href="${href}" aria-label="Read ${esc(d.title)}">${coverMedia(d,m,m.kind==="video"||index===0?"hero":"body")}</a>${d.coverCaption?`<figcaption>${esc(d.coverCaption)}</figcaption>`:""}</figure>`:""}
    <div class="magazine-text">${facts.length?`<p class="eyebrow magazine-location">${facts.map(esc).join(" / ")}</p>`:""}<h2><a href="${href}">${esc(d.title)}</a></h2>${excerpt?`<div class="magazine-story">${excerpt}</div>`:""}</div>
  </article>`;
}
function channels(c:Contacts) {
  const social = (["instagram","whatsapp","telegram"] as const).filter(key=>c[key]).map(key=>{
    const label = {instagram:"Instagram", whatsapp:"WhatsApp", telegram:"Telegram"}[key];
    return `<a class="channel" href="${esc(c[key])}" rel="noopener noreferrer" target="_blank">${icon(key)}<span>${label}</span></a>`;
  });
  if(c.email) social.unshift(`<a class="channel" href="mailto:${esc(encodeURIComponent(c.email))}">${icon("email")}<span>${esc(c.email)}</span></a>`);
  if(c.phone) social.push(`<a class="channel" href="tel:${esc(c.phone.replace(/[^\d+]/g,""))}">${icon("phone")}<span>${esc(c.phone)}</span></a>`);
  return social.join("");
}
function pager(page:number,total:number,base:string,query=new URLSearchParams()){
  if(total<=1)return "";
  const href=(n:number)=>{const q=new URLSearchParams(query);q.delete("focus");if(n>1)q.set("page",String(n));else q.delete("page");return base+(q.size?"?"+esc(q.toString()):"");};
  return `<nav class="pager" aria-label="Journal pages">${page>1?`<a rel="prev" href="${href(page-1)}">Previous page</a>`:""}<span>Page ${page} of ${total}</span>${page<total?`<a rel="next" href="${href(page+1)}">Next page</a>`:""}</nav>`;
}
export function home(entries:Entry[],assets:Asset[],contacts:Contacts,requested:number){
  const media=assetsMap(assets),pages=Math.max(1,Math.ceil(entries.length/10)),page=Math.min(pages,requested);
  const batch=entries.slice((page-1)*10,page*10);
  const links=channels(contacts);
  return shell("",`<main id="main" class="wrap magazine-page"><header class="magazine-heading"><div><h1>Silvergrain</h1><p>Photography by Sina Afshar</p></div></header>${batch.map((d,i)=>spread(d,media,i)).join("")}${!batch.length?'<p class="empty-note">The first story will appear here.</p>':""}${pager(page,pages,"/")}${links?`<section class="contact-strip"><h2>Contact me</h2><div class="channels">${links}</div></section>`:""}</main>`,"Home",pages>1?["/press/swipe.mjs"]:[]);
}
export function archive(entries:Entry[],assets:Asset[],u:URL){
  const media=assetsMap(assets),q=(u.searchParams.get("q")||"").slice(0,160),cat=(u.searchParams.get("category")||"").slice(0,70);
  const categories=[...new Set(entries.map(d=>d.category))].sort();
  const matches=entries.filter(d=>(!cat||d.category===cat)&&[d.title,d.deck,d.location,d.category,...d.body.map(p=>p.runs.map(r=>r.text).join(""))].join(" ").toLowerCase().includes(q.toLowerCase().trim()));
  const n=Math.max(1,Math.ceil(matches.length/10)),page=Math.max(1,Math.min(n,parseInt(u.searchParams.get("page")||"1")||1));
  const queryset=new URLSearchParams();if(cat)queryset.set("category",cat);if(q)queryset.set("q",q);
  const catLink=(s:string)=>{const args=new URLSearchParams();if(s)args.set("category",s);if(q)args.set("q",q);return "/archive"+(args.size?"?"+esc(args.toString()):"");};
  return shell("Journal",`<main id="main" class="wrap magazine-page archive-page"><div class="magazine-heading archive-title"><h1>Journal</h1><form action="/archive" role="search">${cat?`<input type="hidden" name="category" value="${esc(cat)}">`:""}<label class="search-box">${icon("search")}<input type="search" name="q" aria-label="Search stories" placeholder="Search stories" maxlength="160" value="${esc(q)}"${u.searchParams.get("focus")==="search"?" autofocus":""}></label><button class="action">Search</button></form></div><nav class="filters" aria-label="Filter stories by category">${["",...categories].map(s=>`<a href="${catLink(s)}"${s===cat?' aria-current="true"':""}>${esc(s||"All stories")}</a>`).join("")}</nav><p class="archive-count">${matches.length} ${matches.length===1?"story":"stories"}${q?" matching “"+esc(q)+"”":""}</p>${matches.length?matches.slice((page-1)*10,page*10).map((d,i)=>spread(d,media,i)).join(""):'<p class="empty-note">No stories match this search. <a href="/archive">View all stories</a></p>'}${pager(page,n,"/archive",queryset)}</main>`,"Journal",n>1?["/press/swipe.mjs"]:[]);
}
export function contactPage(c:Contacts, check:Challenge, sent=false, error="", form?:URLSearchParams) {
  const links=channels(c);
  const field=(name:string)=>esc(form?.get(name)||"");
  return shell("Contact",`<main id="main" class="wrap quiet-page contact-page"><p class="eyebrow">Correspondence</p><h1>Contact <em>me</em></h1><p class="contact-person">Sina Afshar <span>·</span> Pisa, Italy</p>${links?`<div class="channels">${links}</div>`:""}
  <section class="letter-section" aria-labelledby="letter-heading"><h2 id="letter-heading">Send a message</h2>
    ${sent?'<p role="status">Your message reached the editor.</p>':""}${error?`<p role="alert">${esc(error)}</p>`:""}
    <form method="post" action="/contact" class="letter-form">
      <div class="sender-fields"><label>Your name<input name="name" value="${field("name")}" autocomplete="name" maxlength="80" required></label>
      <label>Your email<input name="email" type="email" value="${field("email")}" autocomplete="email" maxlength="254" required></label></div>
      <label>Message<textarea name="body" rows="5" maxlength="3000" required>${field("body")}</textarea></label>
      <input type="hidden" name="ticket" value="${esc(check.ticket)}">
      <label class="trap" aria-hidden="true">Website<input tabindex="-1" autocomplete="off" name="website"></label>
      <label class="verification">Verification · ${esc(check.prompt)}<input name="answer" inputmode="numeric" maxlength="2" required autocomplete="off"></label>
      <button class="action">Send message</button>
    </form></section></main>`,"Contact");
}
type StoryLinks = {previous?:Pick<Entry,"id"|"title">; next?:Pick<Entry,"id"|"title">};
export function article(d:Entry,assets:Asset[],preview=false,links:StoryLinks={}){
  const storyNav = links.previous || links.next ? `<nav class="story-pager" aria-label="Browse stories">${links.previous?`<a rel="prev" href="/story/${links.previous.id}"><small>Previous story</small>${esc(links.previous.title)}</a>`:"<span></span>"}${links.next?`<a rel="next" href="/story/${links.next.id}"><small>Next story</small>${esc(links.next.title)}</a>`:""}</nav>` : "";
  const media=assetsMap(assets);
  const frames=[...d.frames].sort((a,b)=>a.page-b.page||a.y-b.y||a.x-b.x);
  const fallback=d.body.map((p,i)=>rich(p)+frames.filter((_f,j)=>Math.min(d.body.length-1,Math.floor((j+1)*d.body.length/(frames.length+1)))===i).map(f=>media.has(f.asset)?figure(f,media.get(f.asset)!):"").join("")).join("")+(!d.body.length?frames.map(f=>media.has(f.asset)?figure(f,media.get(f.asset)!):"").join(""):"");
  return shell(d.title,`<main id="main" class="wrap article-page"><article><header class="article-head"><div class="entry-meta"><span>${esc(d.category)}</span><i></i><time datetime="${d.date}">${dateText(d.date)}</time></div><h1>${esc(d.title)}</h1>${d.deck?`<p class="article-deck">${esc(d.deck)}</p>`:""}<div class="byline">${preview?"Private draft":isSample(d.id)?"Sample story":"Sina Afshar"}${d.location?" <b>·</b> "+esc(d.location):""}</div></header><div class="read-tools" id="read-tools" hidden><span>Reading view</span><div class="read-switch"><button data-view="paper">Newspaper</button><button data-view="flow">Single column</button></div><button id="print" aria-label="Print story" title="Print story">${icon("print")}</button></div><div id="article-fallback" class="reading-flow">${fallback}</div><div id="article-press" hidden></div><script type="application/json" id="article-data">${json({doc:d,assets})}</script></article>${storyNav}<div class="article-end"><a href="/archive" class="archive-link">${icon("grid")} Back to the journal</a></div></main>`,"Journal",preview?["/press/read.mjs"]:["/press/read.mjs","/press/swipe.mjs"],false,d.deck||d.title);
}
export function missing(){return shell("Page not found",'<main class="wrap quiet-page" id="main"><p class="eyebrow">404</p><h1>Page not found</h1><a class="quiet-link" href="/">Return to the journal</a></main>');}
