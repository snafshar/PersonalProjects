import {fail,isOwner,liveEntry,readText} from "./store";
import type {Bindings} from "./types";

export type VisitSettings={revision:number;enabled:boolean;retentionDays:number;ipMode:"full"|"masked"|"none"};
export const defaultVisitSettings:VisitSettings={revision:0,enabled:true,retentionDays:30,ipMode:"full"};
const DAY=86400, now=()=>Math.floor(Date.now()/1000);
const uuid=(s:unknown):s is string=>typeof s==="string"&&/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(s);
export const visitPolicy=(s:VisitSettings)=>`1:${s.ipMode}:${s.retentionDays}`;
export function validateVisitSettings(input:unknown):VisitSettings {
  if(!input||typeof input!=="object")return fail(422,"Check the statistics settings.");
  const p=input as VisitSettings;
  if(!Number.isSafeInteger(p.revision)||p.revision<0||p.revision>2147483646||typeof p.enabled!=="boolean"||![7,30,90].includes(p.retentionDays)||!["full","masked","none"].includes(p.ipMode))fail(422,"Choose valid statistics settings.");
  return {revision:p.revision,enabled:p.enabled,retentionDays:p.retentionDays,ipMode:p.ipMode};
}
export async function visitSettings(env:Bindings):Promise<VisitSettings> {
  const raw=await env.DB.prepare("SELECT value FROM journal_settings WHERE name='visit_settings'").first<string>("value");
  return raw?validateVisitSettings(JSON.parse(raw)):{...defaultVisitSettings};
}
export async function pruneVisits(env:Bindings,cfg:VisitSettings){
  const cutoff=now()-cfg.retentionDays*DAY;
  await env.DB.batch([
    env.DB.prepare("DELETE FROM journal_visit_events WHERE created<?").bind(cutoff),
    env.DB.prepare("DELETE FROM journal_visit_sessions WHERE last_seen<?").bind(cutoff),
    env.DB.prepare("DELETE FROM journal_visit_visitors WHERE last_seen<?").bind(cutoff),
    env.DB.prepare("DELETE FROM journal_visit_rates WHERE window<?").bind(now()-DAY),
  ]);
}
export async function saveVisitSettings(env:Bindings,input:unknown){
  const cfg=validateVisitSettings(input),revision=cfg.revision;cfg.revision++;
  const serialized=JSON.stringify(cfg);
  const result=await (revision===0?env.DB.prepare("INSERT INTO journal_settings(name,value) VALUES('visit_settings',?) ON CONFLICT(name) DO NOTHING").bind(serialized):env.DB.prepare("UPDATE journal_settings SET value=? WHERE name='visit_settings' AND json_extract(value,'$.revision')=?").bind(serialized,revision)).run();
  if(result.meta.changes!==1&&await env.DB.prepare("SELECT value FROM journal_settings WHERE name='visit_settings'").first<string>("value")!==serialized)fail(409,"Statistics settings changed in another tab. Reload before saving.");
  // A more private IP mode also removes previously collected IP detail.
  if(cfg.ipMode==="none")await env.DB.prepare("UPDATE journal_visit_events SET ip='' WHERE ip<>''").run();
  if(cfg.ipMode==="masked"){
    const rows=(await env.DB.prepare("SELECT DISTINCT ip FROM journal_visit_events WHERE ip<>''").all<{ip:string}>()).results;
    for(let i=0;i<rows.length;i+=80)await env.DB.batch(rows.slice(i,i+80).map(r=>env.DB.prepare("UPDATE journal_visit_events SET ip=? WHERE ip=?").bind(maskIP(r.ip),r.ip)));
  }
  await pruneVisits(env,cfg);return cfg;
}
const cookieValue=(req:Request,name:string)=>req.headers.get("cookie")?.split(";").map(s=>s.trim()).find(s=>s.startsWith(name+"="))?.slice(name.length+1)||"";
function visitCookies(req:Request,visitor="",session=""){
  const secure=new URL(req.url).protocol==="https:"?"; Secure":"";
  return [["mps_v",visitor,180*DAY],["mps_s",session,1800]].map(([key,value,age])=>`${key}=${value}; Path=/; Max-Age=${value?age:0}; HttpOnly; SameSite=Lax${secure}`);
}
function response(req:Request,value:unknown,visitor?:string,session?:string){
  const headers=new Headers({"Content-Type":"application/json; charset=utf-8","Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"});
  if(visitor!==undefined)for(const c of visitCookies(req,visitor,session))headers.append("Set-Cookie",c);
  return new Response(JSON.stringify(value),{headers});
}
function sameOrigin(req:Request){
  if(req.method!=="POST")fail(405,"Use POST.");
  if(req.headers.get("origin")!==new URL(req.url).origin||req.headers.get("x-journal-visit")!=="1"||req.headers.get("sec-fetch-site")==="cross-site")fail(403,"This visit request was not accepted.");
}
function clientIP(req:Request){
  const value=(req.headers.get("cf-connecting-ip")||"").trim();
  if(value.length>45||value.includes(",")||value.includes("%"))return "";
  if(/^\d{1,3}(\.\d{1,3}){3}$/.test(value))return value.split(".").every(x=>Number(x)<=255)?value:"";
  if(value.includes(":"))try{
    const v=new URL(`http://[${value}]/`).hostname.slice(1,-1);
    return v==="2a06:98c0:3600::103"?"":v;
  }catch{return "";}
  return "";
}
function maskIP(ip:string){
  if(!ip)return "";
  if(ip.includes("."))return ip.split(".").slice(0,3).join(".")+".0";
  const [left,right=""]=ip.split("::"),a=left?left.split(":"):[],b=right?right.split(":"):[];
  const parts=ip.includes("::")?[...a,...Array(8-a.length-b.length).fill("0"),...b]:a;
  return parts.slice(0,3).map(v=>v||"0").join(":")+"::";
}
const clean=(v:unknown,max=100)=>typeof v==="string"?v.replace(/[\u0000-\u001f\u007f]/g,"").slice(0,max):"";
export function deviceInfo(agent:string){
  const ua=agent.slice(0,1500);
  const device=/ipad|tablet|playbook|silk/i.test(ua)||(/android/i.test(ua)&&!/mobile/i.test(ua))?"Tablet":/mobile|iphone|ipod/i.test(ua)?"Mobile":ua?"Desktop":"Unknown";
  const browser=/edg(e|a|ios)?\//i.test(ua)?"Edge":/opr\/|opera/i.test(ua)?"Opera":/firefox|fxios/i.test(ua)?"Firefox":/chrome|crios/i.test(ua)?"Chrome":/safari/i.test(ua)?"Safari":"Other";
  const os=/iphone|ipad|ipod/i.test(ua)?"iOS":/android/i.test(ua)?"Android":/windows/i.test(ua)?"Windows":/macintosh|mac os/i.test(ua)?"macOS":/linux/i.test(ua)?"Linux":"Unknown";
  return {device,browser,os};
}
export function attribution(url:URL,ref:string){
  let host="";try{const u=new URL(ref);if(["http:","https:"].includes(u.protocol)&&u.host!==url.host)host=u.hostname.toLowerCase().slice(0,253);}catch{}
  const campaign=clean(url.searchParams.get("utm_campaign"),100);
  const sourceParam=clean(url.searchParams.get("utm_source"),80).trim().toLowerCase();
  const known=(value:string)=>/^(ig|instagram)$/.test(value)?"Instagram":/^(wa|whatsapp)$/.test(value)?"WhatsApp":/^(tg|telegram)$/.test(value)?"Telegram":value==="google"?"Google":value==="facebook"||value==="fb"?"Facebook":value==="bing"?"Bing":"";
  if(sourceParam)return {source:known(sourceParam)||sourceParam,referrer:host,campaign};
  const domain=(name:string)=>host===name||host.endsWith("."+name);
  const source=domain("instagram.com")?"Instagram":domain("whatsapp.com")||domain("wa.me")?"WhatsApp":domain("t.me")||domain("telegram.org")?"Telegram":domain("facebook.com")||domain("fb.com")?"Facebook":domain("bing.com")?"Bing":/^([\w-]+\.)*google\.(com|[a-z]{2}|com\.[a-z]{2}|co\.[a-z]{2})$/.test(host)?"Google":host||"Direct / unknown";
  return {source,referrer:host,campaign};
}
async function rateLimit(req:Request,env:Bindings,visitor:string){
  const ip=clientIP(req),raw=new TextEncoder().encode(`${Math.floor(now()/DAY)}:${ip||visitor||"unknown"}`),digest=await crypto.subtle.digest("SHA-256",raw);
  const key=Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,"0")).join(""),window=Math.floor(now()/60)*60;
  const row=await env.DB.prepare("INSERT INTO journal_visit_rates(key,window,count) VALUES(?,?,1) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN window=excluded.window THEN count+1 ELSE 1 END,window=excluded.window RETURNING count").bind(key,window).first<{count:number}>();
  if(row!.count>120)fail(429,"Too many visit requests. Try again later.");
}
async function publicPage(env:Bindings,value:unknown,origin:string){
  if(typeof value!=="string"||value.length>2500)fail(422,"Check the visited page.");
  let url:URL;try{url=new URL(value as string,origin);}catch{return fail(422,"Check the visited page.");}
  if(url.origin!==origin)fail(422,"Use a page on this website.");
  const path=url.pathname.replace(/\/$/,"")||"/",names:Record<string,string>={"/":"Home","/archive":"Journal","/about":"About me","/news":"News","/contact":"Contact","/privacy":"Privacy"};
  let title=names[path],kind="page";
  if(!title){
    const match=/^\/(story|news)\/([a-z0-9][a-z0-9-]{0,89})$/.exec(path);if(!match)fail(422,"This page is not included in visit statistics.");
    const d=await liveEntry(env,match![2]);if(!d||((d.section||"journal")==="news")!==(match![1]==="news"))fail(422,"This post is not published.");
    title=d!.title;kind=match![1]==="news"?"news":"post";
  }
  const p=url.searchParams.get("page"),page=p&&/^\d{1,5}$/.test(p)&&Number(p)>1&&["/","/archive","/news"].includes(path)?"?page="+Number(p):"";
  return {path:path+page,title,kind,url};
}
export async function forgetVisits(req:Request,env:Bindings){
  const visitor=cookieValue(req,"mps_v");
  if(uuid(visitor))await env.DB.batch([
    env.DB.prepare("DELETE FROM journal_visit_events WHERE visitor=?").bind(visitor),
    env.DB.prepare("DELETE FROM journal_visit_sessions WHERE visitor=?").bind(visitor),
    env.DB.prepare("DELETE FROM journal_visit_visitors WHERE id=?").bind(visitor),
  ]);
  return response(req,{recorded:false,forgotten:true},"","");
}
export async function collectVisit(req:Request,env:Bindings){
  sameOrigin(req);
  if(!/^application\/json(?:;|$)/i.test(req.headers.get("content-type")||""))fail(415,"Use JSON.");
  let p:Record<string,unknown>;try{p=JSON.parse(await readText(req,8000));}catch(e){if(e instanceof SyntaxError)return fail(400,"Could not read this visit.");throw e;}
  if(!p||typeof p!=="object"||!["allow","deny","view"].includes(String(p.action)))fail(422,"Choose a visit preference.");
  if(p.action==="deny")return forgetVisits(req,env);
  const cfg=await visitSettings(env);
  if(!cfg.enabled||req.headers.get("sec-gpc")==="1"||req.headers.get("dnt")==="1")return response(req,{recorded:false});
  const ua=req.headers.get("user-agent")||"";
  if(/bot\b|crawler|spider|headless|preview|facebookexternalhit|slurp/i.test(ua)||/prefetch|prerender/i.test(req.headers.get("purpose")||req.headers.get("sec-purpose")||""))return response(req,{recorded:false});
  if(req.headers.get("oai-authenticated-user-id")&&await isOwner(req,env))return response(req,{recorded:false,owner:true});
  const policy=visitPolicy(cfg);
  if(p.policy!==policy)return response(req,{recorded:false,needsConsent:true});
  let visitor=cookieValue(req,"mps_v");
  let saved=uuid(visitor)?await env.DB.prepare("SELECT consented,policy FROM journal_visit_visitors WHERE id=?").bind(visitor).first<{consented:number;policy:string}>():null;
  if(p.action!=="allow"&&(!saved||saved.policy!==policy||saved.consented<now()-180*DAY))return response(req,{recorded:false,needsConsent:true});
  if(!uuid(p.eventId))fail(422,"Check the visit identifier.");
  const page=await publicPage(env,p.page,new URL(req.url).origin);
  await rateLimit(req,env,saved?visitor:"");
  await pruneVisits(env,cfg);
  if(!saved){visitor=crypto.randomUUID();saved={consented:now(),policy};}
  let session=cookieValue(req,"mps_s");
  const active=uuid(session)?await env.DB.prepare("SELECT id FROM journal_visit_sessions WHERE id=? AND visitor=? AND last_seen>=?").bind(session,visitor,now()-1800).first():null;
  if(!active)session=crypto.randomUUID();
  const source=attribution(page.url,clean(p.referrer,2500)),device=deviceInfo(ua),cf=(req as Request & {cf?:Record<string,unknown>}).cf;
  const rawIP=clientIP(req),ip=cfg.ipMode==="none"?"":cfg.ipMode==="masked"?maskIP(rawIP):rawIP;
  const suppliedCountry=clean(cf?.country||req.headers.get("cf-ipcountry"),2).toUpperCase();
  const country=/^[A-Z]{2}$/.test(suppliedCountry)&&suppliedCountry!=="XX"?suppliedCountry:"";
  const time=now(),region=clean(cf?.region),city=clean(cf?.city);
  const consented=p.action==="allow"?time:saved.consented;
  const result=await env.DB.batch([
    env.DB.prepare("INSERT INTO journal_visit_visitors(id,consented,policy,last_seen) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET consented=excluded.consented,policy=excluded.policy,last_seen=excluded.last_seen").bind(visitor,consented,policy,time),
    env.DB.prepare("INSERT INTO journal_visit_sessions(id,visitor,started,last_seen,source,referrer,campaign) VALUES(?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET last_seen=excluded.last_seen").bind(session,visitor,time,time,source.source,source.referrer,source.campaign),
    env.DB.prepare("INSERT OR IGNORE INTO journal_visit_events(event_key,visitor,session,created,path,title,kind,ip,country,region,city,device,browser,os) SELECT ?,?,?,?,?,?,?,?,?,?,?,?,?,? WHERE coalesce((SELECT json_extract(value,'$.revision') FROM journal_settings WHERE name='visit_settings'),0)=?").bind(p.eventId,visitor,session,time,page.path,page.title,page.kind,ip,country,region,city,device.device,device.browser,device.os,cfg.revision),
  ]);
  return response(req,{recorded:result[2].meta.changes===1},visitor,session);
}
export type VisitRow={id:number;visitor:string;session:string;created:number;path:string;title:string;kind:string;ip:string;country:string;region:string;city:string;device:string;browser:string;os:string;source:string;referrer:string;campaign:string};
export type VisitFilters={from:string;to:string;source:string;device:string;q:string;before:number};
const iso=(seconds:number)=>new Date(seconds*1000).toISOString().slice(0,10);
export function visitFilters(url:URL,cfg:VisitSettings):VisitFilters{
  const today=iso(now()),oldest=iso(now()-cfg.retentionDays*DAY),p=url.searchParams;
  const date=(name:string,fallback:string)=>{const s=p.get(name)||fallback;if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||!Number.isFinite(Date.parse(s))||new Date(s).toISOString().slice(0,10)!==s)fail(422,"Choose valid report dates.");return s;};
  const from=date("from",iso(now()-(Math.min(7,cfg.retentionDays)-1)*DAY)),to=date("to",today);
  if(from<oldest||to>today||to<from)fail(422,`Choose dates between ${oldest} and ${today}.`);
  const device=clean(p.get("device"),20);if(device&&!["Mobile","Desktop","Tablet","Unknown"].includes(device))fail(422,"Choose a valid device.");
  const before=Number(p.get("before")||0);if(!Number.isSafeInteger(before)||before<0)fail(422,"Check the log page.");
  return {from,to,source:clean(p.get("source"),80),device,q:clean(p.get("q"),100).trim(),before};
}
function filtered(f:VisitFilters,cfg:VisitSettings){
  const sql=["e.created>=?","e.created<?"],args:(number|string)[]=[Math.max(Date.parse(f.from)/1000,now()-cfg.retentionDays*DAY),Date.parse(f.to)/1000+DAY];
  if(f.source){sql.push("s.source=?");args.push(f.source);}
  if(f.device){sql.push("e.device=?");args.push(f.device);}
  if(f.q){sql.push("(instr(lower(e.path||' '||e.title||' '||e.ip||' '||e.country||' '||e.city||' '||e.region||' '||s.source||' '||s.referrer||' '||s.campaign),lower(?))>0)");args.push(f.q);}
  return {sql:sql.join(" AND "),args};
}
const joined=" FROM journal_visit_events e JOIN journal_visit_sessions s ON s.id=e.session ";
export async function visitReport(env:Bindings,url:URL){
  const cfg=await visitSettings(env);await pruneVisits(env,cfg);
  const filters=visitFilters(url,cfg),w=filtered(filters,cfg),query=(q:string,args=w.args)=>env.DB.prepare(q).bind(...args);
  const results=await env.DB.batch([
    query("SELECT count(*) views,count(DISTINCT e.visitor) visitors,count(DISTINCT e.session) sessions,coalesce(sum(CASE WHEN e.kind IN ('post','news') THEN 1 ELSE 0 END),0) postViews,count(DISTINCT CASE WHEN e.kind IN ('post','news') THEN e.path END) posts"+joined+"WHERE "+w.sql),
    query("SELECT date(e.created,'unixepoch') day,count(*) views"+joined+"WHERE "+w.sql+" GROUP BY day ORDER BY day"),
    query("SELECT e.path,e.title,count(*) views,count(DISTINCT e.visitor) visitors"+joined+"WHERE "+w.sql+" AND e.kind IN ('post','news') GROUP BY e.path ORDER BY views DESC,e.path LIMIT 15"),
    query("SELECT e.path,e.title,count(*) views"+joined+"WHERE "+w.sql+" GROUP BY e.path ORDER BY views DESC,e.path LIMIT 15"),
    query("SELECT s.source label,count(DISTINCT e.session) sessions,count(*) views"+joined+"WHERE "+w.sql+" GROUP BY s.source ORDER BY sessions DESC,label LIMIT 20"),
    query("SELECT e.country label,count(*) views"+joined+"WHERE "+w.sql+" GROUP BY e.country ORDER BY views DESC,label LIMIT 15"),
    query("SELECT e.device label,count(*) views"+joined+"WHERE "+w.sql+" GROUP BY e.device ORDER BY views DESC,label"),
    query("SELECT e.browser label,count(*) views"+joined+"WHERE "+w.sql+" GROUP BY e.browser ORDER BY views DESC,label"),
    query("SELECT e.*,s.source,s.referrer,s.campaign"+joined+"WHERE "+w.sql+(filters.before?" AND e.id<?":"")+" ORDER BY e.id DESC LIMIT 51",[...w.args,...(filters.before?[filters.before]:[])]),
  ]);
  return {cfg,filters,totals:results[0].results[0] as {views:number;visitors:number;sessions:number;postViews:number;posts:number},days:results[1].results as {day:string;views:number}[],posts:results[2].results as {path:string;title:string;views:number;visitors:number}[],pages:results[3].results as {path:string;title:string;views:number}[],sources:results[4].results as {label:string;sessions:number;views:number}[],countries:results[5].results as {label:string;views:number}[],devices:results[6].results as {label:string;views:number}[],browsers:results[7].results as {label:string;views:number}[],rows:results[8].results as VisitRow[]};
}
export async function visitSession(env:Bindings,id:string){
  if(!uuid(id))fail(404,"Visit not found.");
  const cfg=await visitSettings(env);await pruneVisits(env,cfg);
  const rows=(await env.DB.prepare("SELECT e.*,s.source,s.referrer,s.campaign"+joined+"WHERE e.session=? AND e.created>=? ORDER BY e.id LIMIT 1001").bind(id,now()-cfg.retentionDays*DAY).all<VisitRow>()).results;
  if(!rows.length)fail(404,"Visit not found.");return rows;
}
export async function exportVisits(env:Bindings,url:URL){
  const cfg=await visitSettings(env);await pruneVisits(env,cfg);const w=filtered(visitFilters(url,cfg),cfg);
  const rows=(await env.DB.prepare("SELECT e.*,s.source,s.referrer,s.campaign"+joined+"WHERE "+w.sql+" ORDER BY e.id DESC LIMIT 5001").bind(...w.args).all<VisitRow>()).results;
  if(rows.length>5000)fail(422,"Choose a smaller date range or filter to export up to 5,000 rows.");
  const cell=(v:unknown)=>{let s=String(v??"");if(/^[\s]*[=+\-@]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
  const lines=[["Time (UTC)","Visitor ID","Session ID","Page","Title","Type","IP","Country","Region","City","Device","Browser","OS","Source","Referring host","Campaign"],...rows.map(r=>[new Date(r.created*1000).toISOString(),r.visitor,r.session,r.path,r.title,r.kind,r.ip,r.country,r.region,r.city,r.device,r.browser,r.os,r.source,r.referrer,r.campaign])];
  return "\uFEFF"+lines.map(row=>row.map(cell).join(",")).join("\r\n");
}
export async function clearVisits(env:Bindings,input:unknown){
  if((input as {confirmation?:string})?.confirmation!=="DELETE VISIT LOGS")fail(422,"Type DELETE VISIT LOGS to clear the history.");
  await env.DB.batch([env.DB.prepare("DELETE FROM journal_visit_events"),env.DB.prepare("DELETE FROM journal_visit_sessions"),env.DB.prepare("DELETE FROM journal_visit_visitors"),env.DB.prepare("DELETE FROM journal_visit_rates")]);
  return {cleared:true};
}
