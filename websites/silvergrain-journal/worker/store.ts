import { sampleMedia, samples } from "./samples";
import type { About, Asset, Bindings, Contacts, EditEntry, Entry, Frame, Paragraph, Run, StoredEntry } from "./types";

export class Problem extends Error {
  constructor(public status:number, message:string) { super(message); }
}
export const fail = (status:number,message:string):never => {throw new Problem(status,message)};
export const validId = (s:unknown):s is string => typeof s==="string" && /^[a-z0-9][a-z0-9-]{0,89}$/.test(s);
export const plain = (value:unknown,limit:number,label:string):string => {
  if(typeof value!=="string" || value.length>limit || value.includes("\0")) return fail(422,`Check ${label} (up to ${limit.toLocaleString("en")} characters).`);
  return value;
};
function integer(v:unknown, min:number,max:number,label:string):number {
  if(typeof v!=="number"||!Number.isSafeInteger(v)||v<min||v>max) return fail(422,`Check ${label}.`);
  return v;
}
export async function isOwner(req:Request,env:Bindings) {
  const id=req.headers.get("oai-authenticated-user-id"), email=req.headers.get("oai-authenticated-user-email")?.trim().toLowerCase();
  if(!id||!email) return false;
  const saved=await env.DB.prepare("SELECT value FROM journal_settings WHERE name='owner_id'").first<string>("value");
  if(saved) return saved===id;
  if(!env.JOURNAL_OWNER_EMAIL || email!==env.JOURNAL_OWNER_EMAIL.trim().toLowerCase()) return false;
  await env.DB.prepare("INSERT OR IGNORE INTO journal_settings(name,value) VALUES('owner_id',?)").bind(id).run();
  return (await env.DB.prepare("SELECT value FROM journal_settings WHERE name='owner_id'").first<string>("value"))===id;
}
export function verifyWrite(req:Request) {
  const origin=req.headers.get("origin"),site=req.headers.get("sec-fetch-site");
  if(req.headers.get("x-journal-write")!=="studio" || (origin && origin!==new URL(req.url).origin) || (site && site!=="same-origin" && site!=="none"))
    fail(403,"Reload the editor and try again.");
}
export async function readText(req:Request,cap:number) {
  if(Number(req.headers.get("content-length")||0)>cap)fail(413,"The document is too large.");
  const reader=req.body?.getReader(); if(!reader) return fail(400,"No document was received.");
  const decoder=new TextDecoder(); let size=0,value="";
  for(;;){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>cap){await reader.cancel();return fail(413,"The document is too large.");}value+=decoder.decode(part.value,{stream:true});}
  return value + decoder.decode();
}
export async function jsonInput(req:Request) {
  if(!/^application\/json(?:;|$)/i.test(req.headers.get("content-type")||""))fail(415,"Send a JSON document.");
  const value = await readText(req, 2_000_000);
  try {return JSON.parse(value);} catch {return fail(400,"Could not read this document.");}
}
type MediaRow={id:string;name:string;kind:Asset["kind"];width:number;height:number;mime:string;bytes:number};
const assetRow=(m:MediaRow):Asset=>({id:m.id,name:m.name,kind:m.kind,width:m.width,height:m.height,url:"/media/"+m.id,thumb:"/media/"+m.id,alt:""});
export async function gallery(env:Bindings):Promise<Asset[]> {
  const r=await env.DB.prepare("SELECT id,name,kind,width,height FROM journal_media ORDER BY created DESC, id").all<MediaRow>();
  return [...r.results.map(assetRow),...sampleMedia];
}
export async function usedGallery(env:Bindings,ids:string[]):Promise<Asset[]> {
  const distinct=new Set(ids.filter(Boolean));
  const found=sampleMedia.filter(m=>distinct.delete(m.id));
  const keys=[...distinct];
  for(let i=0;i<keys.length;i+=60){const group=keys.slice(i,i+60);const res=await env.DB.prepare("SELECT id,name,kind,width,height FROM journal_media WHERE id IN ("+group.map(()=>"?").join(",")+")").bind(...group).all<MediaRow>();found.push(...res.results.map(assetRow));}
  return found;
}
export const usedIds=(e:Entry)=>[e.cover,...e.frames.map(f=>f.asset)].filter(Boolean);
const originals=new Map(samples.map(e=>[e.id,e]));
export const isSample=(id:string)=>originals.has(id);
const ordered=(a:Pick<Entry,"id"|"date"|"order">,b:Pick<Entry,"id"|"date"|"order">)=>a.order-b.order||b.date.localeCompare(a.date)||a.id.localeCompare(b.id);
export async function liveEntries(env:Bindings):Promise<Entry[]> {
  const entries=new Map(originals);
  const result=await env.DB.prepare("SELECT id,live FROM journal_entries").all<{id:string;live:string|null}>();
  for(const row of result.results){if(row.live)entries.set(row.id,JSON.parse(row.live));else entries.delete(row.id);}
  return [...entries.values()].sort(ordered);
}
type Neighbor = Pick<Entry,"id"|"title"|"date"|"order"|"section">;
export async function neighbors(env:Bindings,id:string,section:"journal"|"news"="journal") {
  const map = new Map<string, Neighbor>(section==="journal"?samples.map(d=>[d.id,d]):[]);
  const rows = await env.DB.prepare("SELECT id, json_extract(live,'$.title') AS title, json_extract(live,'$.date') AS date, json_extract(live,'$.order') AS position, json_extract(live,'$.section') AS section FROM journal_entries").all<{id:string; title:string|null; date:string; position:number; section:Entry["section"]}>();
  for(const r of rows.results){
    if(r.title===null||(r.section||"journal")!==section)map.delete(r.id);
    else map.set(r.id,{id:r.id,title:r.title,date:r.date,order:r.position,section:r.section});
  }
  const list=[...map.values()].sort(ordered), index=list.findIndex(n=>n.id===id);
  return index<0 ? {} : {previous:list[index-1],next:list[index+1]};
}
export async function liveEntry(env:Bindings,id:string):Promise<Entry|null> {
  const row=await env.DB.prepare("SELECT live FROM journal_entries WHERE id=?").bind(id).first<{live:string|null}>();
  return row ? (row.live?JSON.parse(row.live):null) : originals.get(id)??null;
}
export async function editable(env:Bindings):Promise<EditEntry[]> {
  const map=new Map<string,EditEntry>(samples.map(d=>[d.id,{id:d.id,revision:0,draft:d,published:true,pending:false,sample:true}]));
  const res=await env.DB.prepare("SELECT * FROM journal_entries").all<StoredEntry>();
  for(const r of res.results)map.set(r.id,{id:r.id,revision:r.revision,draft:JSON.parse(r.draft),published:!!r.live,pending:r.draft!==r.live,sample:isSample(r.id)});
  return [...map.values()].sort((a,b)=>ordered(a.draft,b.draft));
}
function cleanDoc(raw:any):Entry {
  if(!raw || !validId(raw.id))return fail(422,"The story address is invalid.");
  if(raw.section!==undefined&&!['journal','news'].includes(raw.section))fail(422,"Choose Journal or News for this publication.");
  const title=plain(raw.title,180,"the title").trim();
  if(!title)fail(422,"Give the story a title first.");
  const date=plain(raw.date,10,"the date");if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date)fail(422,"Choose a valid publication date.");
  const cover=plain(raw.cover,90,"the cover");if(cover&&!validId(cover))fail(422,"Choose a gallery item for the cover.");
  if(!Array.isArray(raw.body)||raw.body.length>4000||!Array.isArray(raw.frames)||raw.frames.length>250)fail(422,"Check the story length and number of media items.");
  let count=0;
  const body:Paragraph[]=raw.body.map((b:any)=>{
    if(!b||!["p","h2","quote"].includes(b.kind)||!Array.isArray(b.runs)||b.runs.length>16000) return fail(422,"A paragraph is invalid.");
    const runs:Run[]=b.runs.map((r:any)=>{
      if(!r)return fail(422,"Check the paragraph formatting.");
      const text=plain(r.text,150000,"the paragraph text");count+=text.length;
      return {text,...(r.bold===true?{bold:true}:{}),...(r.italic===true?{italic:true}:{}),...(r.underline===true?{underline:true}:{})};
    });
    return {kind:b.kind,runs};
  });
  if(count>240000)fail(422,"Please keep a story under 240,000 characters.");
  const seen=new Set<string>();
  const frames:Frame[]=raw.frames.map((f:any)=>{
    if(!f||!validId(f.id)||!validId(f.asset)||seen.has(f.id))return fail(422,"A media placement is invalid.");seen.add(f.id);
    const w=integer(f.w,64,960,"media width"),h=integer(f.h,40,760,"media height");
    const overlayAt=["top","center","bottom"].includes(f.overlayAt)?f.overlayAt:"bottom";
    return {id:f.id,asset:f.asset,page:integer(f.page,0,299,"the sheet number"),x:integer(f.x,0,960-w,"the horizontal position"),
      y:integer(f.y,0,800-h,"the vertical position"),w,h,caption:plain(f.caption,600,"the caption"),overlay:plain(f.overlay,200,"the overlay"),
      alt:plain(f.alt,600,"alternative text"),overlayAt};
  });
  return {id:raw.id,section:raw.section||"journal",title,deck:plain(raw.deck,1000,"the introduction"),category:plain(raw.category,70,"the category").trim()||"Journal",
    location:plain(raw.location,100,"the location"),date,cover,coverCaption:plain(raw.coverCaption,600,"the cover caption"),
    coverAlt:plain(raw.coverAlt,600,"the cover description"),coverOverlay:plain(raw.coverOverlay??"",200,"the cover overlay"),
    coverOverlayAt:["top","center","bottom"].includes(raw.coverOverlayAt)?raw.coverOverlayAt:"bottom",columns:integer(raw.columns,1,4,"the column count"),
    pages:integer(raw.pages,1,300,"the sheet count"),order:integer(raw.order,-2000000000,2000000000,"the reading order"),align:["justify","left","center","right"].includes(raw.align)?raw.align:"justify",body,frames};
}
export async function saveEntry(env:Bindings,input:any) {
  const doc=cleanDoc(input?.doc);
  const revision=integer(input.revision,0,2147483646,"the saved revision");const action=input.action;
  if(!["draft","publish","unpublish"].includes(action))fail(422,"Unknown publishing action.");
  if(action==="publish" && !doc.body.some(p=>p.runs.some(r=>r.text.trim())) && !doc.frames.length && !doc.cover)fail(422,"Add text or media before publishing.");
  const keys=[...new Set(usedIds(doc))];if((await usedGallery(env,keys)).length!==keys.length)fail(422,"A referenced item is missing from the gallery.");
  const serialized=JSON.stringify(doc);
  const seed=originals.get(doc.id);
  const live=action==="publish"?serialized:action==="unpublish"?null:seed?JSON.stringify(seed):null;
  const query=revision===0
    ?env.DB.prepare("INSERT INTO journal_entries(id,revision,draft,live) VALUES(?,1,?,?) ON CONFLICT(id) DO NOTHING").bind(doc.id,serialized,live)
    :env.DB.prepare("UPDATE journal_entries SET revision=revision+1,draft=?,live=CASE WHEN ?='draft' THEN live ELSE ? END WHERE id=? AND revision=?").bind(serialized,action,live,doc.id,revision);
  const result = await query.run();
  const row = await env.DB.prepare("SELECT * FROM journal_entries WHERE id=?")
    .bind(doc.id).first<StoredEntry>();
  if (result.meta.changes !== 1) {
    // A committed save can lose its response. An identical retry should recover
    // its revision without creating a second write or rejecting the editor.
    const sameWrite = row?.revision === revision + 1 && row.draft === serialized;
    const samePublication = action === "draft" ||
      (action === "publish" ? row?.live === serialized : row?.live === null);
    if (!sameWrite || !samePublication) {
      fail(409, "This story changed in another tab. Your edits are still here. Copy them before reloading.");
    }
  }
  return {id:doc.id,revision:revision+1,published:!!row?.live,pending:serialized!==row?.live};
}
export async function contacts(env:Bindings):Promise<Contacts> {
  const v=await env.DB.prepare("SELECT value FROM journal_settings WHERE name='contacts'").first<string>("value");
  return {instagram:"",whatsapp:"",telegram:"",email:"",phone:"",...(v ? JSON.parse(v) : {})};
}
export async function about(env:Bindings):Promise<About> {
  const value=await env.DB.prepare("SELECT value FROM journal_settings WHERE name='about'").first<string>("value");
  return value?JSON.parse(value):{
    body:"I'm Sina Afshar, a photographer based in Pisa, Italy.\n\nMyPhotoStories is where I share my photographs and the stories behind them.",
    revision:0,
  };
}
export async function saveAbout(env:Bindings,input:any):Promise<About> {
  const body=plain(input?.body,20000,"your biography").trim();
  const revision=integer(input?.revision,0,2147483646,"the saved revision");
  const value={body,revision:revision+1},serialized=JSON.stringify(value);
  const query=revision===0
    ?env.DB.prepare("INSERT INTO journal_settings(name,value) VALUES('about',?) ON CONFLICT(name) DO NOTHING").bind(serialized)
    :env.DB.prepare("UPDATE journal_settings SET value=? WHERE name='about' AND json_extract(value,'$.revision')=?").bind(serialized,revision);
  const result=await query.run();
  if(result.meta.changes!==1){
    const current=await env.DB.prepare("SELECT value FROM journal_settings WHERE name='about'").first<string>("value");
    if(current!==serialized)fail(409,"Your biography changed in another tab. Copy your edits before reloading.");
  }
  return value;
}
export function validEmail(value:string) {
  return value.length <= 254 && /^[^\s@<>,;:\\"\x00-\x1f\x7f]+@[^\s@<>,;:\\"\x00-\x1f\x7f]+\.[^\s@<>,;:\\"\x00-\x1f\x7f]+$/u.test(value);
}
export function normalizeContact(type:keyof Contacts,value:unknown) {
  let v=plain(value,400,type).trim();if(!v)return "";
  if(type==="email"){
    if(!validEmail(v))return fail(422,"Enter a valid email address.");
    return v;
  }
  if(type==="phone"){
    if(!/^\+?[\d\s().-]+$/.test(v) || !/^\d{3,15}$/.test(v.replace(/\D/g,"")))return fail(422,"Enter a valid phone number.");
    return v;
  }
  if(/^https?:\/\//i.test(v)){
    let u:URL;try{u=new URL(v);}catch{return fail(422,`Check the ${type} link.`);}
    const hosts={instagram:["instagram.com","www.instagram.com"],telegram:["t.me","telegram.me"],whatsapp:["wa.me","api.whatsapp.com"]};
    if(!hosts[type].includes(u.hostname.toLowerCase())||u.port||u.username||u.password) return fail(422,`Use a direct ${type} profile or chat link.`);
    v=type==="whatsapp"&&u.hostname==="api.whatsapp.com"?(u.searchParams.get("phone")??""):u.pathname.replace(/^\/|\/$/g,"");
    if(type==="whatsapp" && /^message\/[A-Z\d]{6,32}$/i.test(v))return "https://wa.me/"+v;
  }
  if(type==="whatsapp"){if(!/^\+?[\d\s()-]+$/.test(v)||!/^\d{7,15}$/.test(v.replace(/\D/g,"")))return fail(422,"Enter a WhatsApp number with country code, or a wa.me link.");return "https://wa.me/"+v.replace(/\D/g,"");}
  v=v.replace(/^@/,"");if(!(type==="instagram"?/^[A-Za-z\d._]{1,30}$/:/^[A-Za-z][A-Za-z\d_]{3,31}$/).test(v))return fail(422,`Enter a valid ${type} username or profile link.`);
  return type==="instagram"?"https://www.instagram.com/"+v+"/":"https://t.me/"+v;
}
export async function saveContacts(env:Bindings,raw:any){
  const current = await contacts(env);
  const value: Contacts = {
    instagram: normalizeContact("instagram", raw?.instagram),
    whatsapp: normalizeContact("whatsapp", raw?.whatsapp),
    telegram: normalizeContact("telegram", raw?.telegram),
    email: normalizeContact("email", raw?.email ?? current.email),
    phone: normalizeContact("phone", raw?.phone ?? current.phone),
  };
  await env.DB.prepare("INSERT INTO journal_settings(name,value) VALUES('contacts',?) ON CONFLICT(name) DO UPDATE SET value=excluded.value").bind(JSON.stringify(value)).run();return value;
}
