import {before,after,test} from "node:test";
import assert from "node:assert/strict";
import {readFile,readdir} from "node:fs/promises";
import {build} from "esbuild";
import {Miniflare, convertV4MiniflareOptions} from "miniflare";
import path from "node:path";
import {defaultSettings} from "../public/press/site-theme.mjs";
let runtime,db;
const origin="https://journal.example.test",owner={"oai-authenticated-user-id":"owner-test","oai-authenticated-user-email":"editor@example.test"},reader={"oai-authenticated-user-id":"reader-test","oai-authenticated-user-email":"reader@example.test"};
const request=(route,options={})=>runtime.dispatchFetch(new URL(route,origin),{redirect:"manual",...options});
const post=(url,v,who=owner)=>request("/cntrladmin/api/"+url,{method:"POST",headers:{...who,"X-Journal-Write":"studio","Content-Type":"application/json","Origin":origin},body:JSON.stringify(v)});
const extract=html=>JSON.parse(html.match(/id="(?:studio-data|article-data)"[^>]*>(.*?)<\/script>/s)[1]);
before(async()=>{
  const bundle=await build({stdin:{contents:'import {journal} from "./worker/router";export default {fetch:journal}',resolveDir:process.cwd()},plugins:[{name:"raw",setup(b){b.onResolve({filter:/\?raw$/},args=>({path:path.resolve(args.resolveDir,args.path.slice(0,-4)),namespace:"raw"}));b.onLoad({filter:/.*/,namespace:"raw"},async args=>({contents:await readFile(args.path,"utf8"),loader:"text"}));}}],bundle:true,format:"esm",platform:"neutral",write:false});
  runtime=new Miniflare(convertV4MiniflareOptions({modules:[{type:"ESModule",path:"worker.js",contents:bundle.outputFiles[0].text}],compatibilityDate:"2026-05-15",d1Databases:["DB"],r2Buckets:["BUCKET"],bindings:{JOURNAL_OWNER_EMAIL:"editor@example.test"}}));
  db=await runtime.getD1Database("DB");
  for(const name of (await readdir("drizzle")).filter(x=>x.endsWith(".sql")).sort())for(const s of (await readFile("drizzle/"+name,"utf8")).split("--> statement-breakpoint"))if(s.trim())await db.prepare(s.trim()).run();
});
after(async()=>runtime?.dispose());
test("readers see stories and archive without registration or management navigation",async()=>{
  const home=await (await request("/")).text();assert.match(home,/Where the/);assert.doesNotMatch(home,/cntrladmin|register|sign.?up/i);
  assert.equal((home.match(/class="magazine-spread/g)||[]).length,4);
  assert.doesNotMatch(home,/class="(?:lead|card-grid)"/);
  for(const url of ["/join","/register","/admin","/cntrladmin/gallery","/cntrladmin/studio.mjs"]){assert.equal((await request(url)).status,404,url);}
  assert.equal((await request("/cntrladmin")).status,302);
  assert.equal((await request("/cntrladmin",{headers:reader})).status,404);
  assert.equal((await request("/cntrladmin/new",{headers:owner})).status,200);
  const search=await (await request("/archive?q=arches")).text();assert.match(search,/1 story matching/);
  assert.match(await (await request("/contact")).text(),/Send a message/);
});
test("owner contact settings persist, normalize all three channels and remove cleared links",async()=>{
  const s=await post("contacts",{email:"desk@example.test",phone:"+39 012 345 6789",instagram:"@journal.test",whatsapp:"+39 333 123 4567",telegram:"@journal_test"});assert.equal(s.status,200);
  const t=await(await request("/contact")).text();for(const part of ["mailto:desk%40example.test","tel:+390123456789","instagram.com/journal.test/","wa.me/393331234567","t.me/journal_test"])assert.ok(t.includes(part));
  assert.ok((await(await request("/")).text()).includes("Contact me"));
  assert.equal((await post("contacts",{instagram:"",whatsapp:"",telegram:""},reader)).status,404);
  await post("contacts",{instagram:"",whatsapp:"",telegram:"@journal_test"});assert.doesNotMatch(await(await request("/contact")).text(),/wa\.me|instagram\.com/);
});
test("draft media, publication, range reads, independent draft snapshots, and unpublishing",async()=>{
  const base=extract(await(await request("/cntrladmin/edit/where-the-light-falls",{headers:owner})).text()).record.draft;
  const photo=await readFile("public/press/demo/arcade-small.webp");
  const upload=async(mime,buffer,name)=>{const r=await request("/cntrladmin/api/media?width=720&height=480&name="+name,{method:"POST",headers:{...owner,"X-Journal-Write":"studio","content-type":mime,"content-length":String(buffer.length)},body:buffer});const v=await r.json();assert.equal(r.status,201,JSON.stringify(v));return v;};
  const image=await upload("image/webp",photo,"arcade.webp");
  const vid=await upload("video/mp4",await readFile("tests/fixtures/short.mp4"),"short.mp4");
  assert.equal(vid.kind,"video");assert.equal((await request(image.url)).status,404);assert.equal((await request(vid.url,{headers:reader})).status,404);
  const doc={...base,id:"test-field-note",title:"A test field note",cover:image.id,coverOverlay:"High tide",coverOverlayAt:"top",frames:[{...base.frames[0],asset:vid.id,x:365,w:280,h:170,overlay:"On the film",caption:"Below the film"}]};
  const save=async(action,revision,d=doc)=>post("entry",{doc:d,action,revision});
  assert.equal((await save("draft",0)).status,200);
  const retry = await save("draft",0);
  assert.equal(retry.status,200);
  assert.equal((await retry.json()).revision,1);
  assert.equal((await request("/story/"+doc.id)).status,404);
  assert.equal((await request("/cntrladmin/preview/"+doc.id,{headers:owner})).status,200);assert.equal((await request("/cntrladmin/preview/"+doc.id,{headers:reader})).status,404);
  assert.equal((await save("publish",1)).status,200);
  const publishRetry = await save("publish",1);
  assert.equal(publishRetry.status,200);
  assert.equal((await publishRetry.json()).revision,2);
  let publicDoc=extract(await(await request("/story/"+doc.id)).text()).doc;assert.equal(publicDoc.coverOverlay,"High tide");assert.equal(publicDoc.coverOverlayAt,"top");assert.equal(publicDoc.frames[0].x,365);assert.equal(publicDoc.frames[0].overlay,"On the film");
  const range=await request(vid.url,{headers:{Range:"bytes=0-15"}});assert.equal(range.status,206);assert.equal((await range.arrayBuffer()).byteLength,16);assert.equal((await request(image.url,{method:"HEAD"})).status,200);
  assert.equal((await save("draft",2,{...doc,title:"Still drafting"})).status,200);
  assert.equal((await save("publish",2)).status,409);assert.equal(extract(await(await request("/story/"+doc.id)).text()).doc.title,"A test field note");
  assert.equal((await save("unpublish",3)).status,200);
  assert.equal((await request("/story/"+doc.id)).status,404);assert.equal((await request(vid.url)).status,404);
  assert.equal((await request(vid.url,{headers:owner})).status,200);
});


test("mutations reject foreign origins and stored markup stays inert",async()=>{
  const blocked=await request("/cntrladmin/api/contacts",{method:"POST",headers:{...owner,"X-Journal-Write":"studio","content-type":"application/json",Origin:"https://other.example.test"},body:JSON.stringify({instagram:"",whatsapp:"",telegram:""})});
  assert.equal(blocked.status,403);
  const noWriteHeader=await request("/cntrladmin/api/contacts",{method:"POST",headers:{...owner,"content-type":"application/json",Origin:origin},body:"{}"});
  assert.equal(noWriteHeader.status,403);
  const base=extract(await(await request("/cntrladmin/edit/where-the-light-falls",{headers:owner})).text()).record.draft;
  const text='<script>window.bad=true</script><img src=x onerror=alert(1)>';
  const doc={...base,id:"markup-check",title:text,cover:"",frames:[],body:[{kind:"p",runs:[{text}]}]};
  assert.equal((await post("entry",{doc,revision:0,action:"publish"})).status,200);
  const response=await request("/story/markup-check"),html=await response.text();
  assert.ok(html.includes("&lt;script&gt;"));
  assert.ok(!html.includes(text));
  assert.ok(response.headers.get("Content-Security-Policy").includes("script-src 'self'"));
  const before=(await db.prepare("SELECT count(*) AS n FROM journal_media").first()).n;
  const invalid=await request("/cntrladmin/api/media?width=10&height=10&name=wrong.webp",{method:"POST",headers:{...owner,"X-Journal-Write":"studio","content-type":"image/webp","x-file-size":"6"},body:"wrong!"});
  assert.equal(invalid.status,415);
  assert.equal((await db.prepare("SELECT count(*) AS n FROM journal_media").first()).n,before);
});

test("verified reader correspondence reaches only the owner's inbox", async () => {
  const page=await (await request("/contact")).text();
  const ticket=page.match(/name="ticket" value="([^"]+)"/)[1];
  const question=page.match(/What is (\d+) plus (\d+)\?/);
  const form=new URLSearchParams({name:"A Reader",email:"reader@example.test",body:"A private note about the lake.",ticket,answer:String(Number(question[1])+Number(question[2]))});
  const submit=()=>request("/contact",{method:"POST",headers:{Origin:origin,"Content-Type":"application/x-www-form-urlencoded"},body:form.toString()});
  const answer=form.get("answer"); form.set("answer","0");
  assert.equal((await submit()).status,422); form.set("answer",answer);
  const sent=await submit();assert.equal(sent.status,303);assert.match(sent.headers.get("Location"),/sent=1/);
  assert.equal((await submit()).status,303);
  const inbox=await (await request("/cntrladmin/inbox",{headers:owner})).text();
  assert.equal(inbox.split("A private note about the lake.").length,2);
  assert.equal((await request("/cntrladmin/inbox")).status,404);
  assert.equal((await request("/cntrladmin/inbox",{headers:reader})).status,404);
  assert.ok(!(await (await request("/contact")).text()).includes("A private note about the lake."));
});
test("newspaper stories follow the editorial order with touch and ordinary links", async () => {
  const first=await(await request("/story/where-the-light-falls")).text();
  assert.doesNotMatch(first,/class="article-cover"/);
  assert.match(first,/The ridgeline appeared first/);
  assert.match(first,/class="flow-figure"/);
  assert.match(first,/rel="next" href="\/story\/between-the-arches"/);
  assert.match(first,/\/press\/swipe.mjs/);
  const second=await(await request("/story/between-the-arches")).text();
  assert.match(second,/rel="prev" href="\/story\/where-the-light-falls"/);
  const preview=await(await request("/cntrladmin/preview/where-the-light-falls",{headers:owner})).text();
  assert.ok(!preview.includes('class="story-pager"'));
});

test("the owner can publish an escaped biography with retry and conflict protection", async () => {
  const front=await(await request("/")).text();
  assert.match(front,/href="\/about"/); assert.match(front,/href="\/news"/);
  assert.match(await(await request("/about")).text(),/Sina Afshar/);
  assert.equal((await request("/cntrladmin/about",{headers:reader})).status,404);
  const initial=extract(await(await request("/cntrladmin/about",{headers:owner})).text());
  const value={body:'A biography with <script>unsafe()</script>.\n\nA second paragraph.',revision:initial.revision};
  assert.equal((await post("about",value,reader)).status,404);
  assert.equal((await post("about",value)).status,200);
  const retry=await post("about",value);assert.equal(retry.status,200);assert.equal((await retry.json()).revision,1);
  assert.equal((await post("about",{body:"An older tab",revision:0})).status,409);
  const published=await(await request("/about")).text();
  assert.match(published,/&lt;script&gt;unsafe\(\)&lt;\/script&gt;/);
  assert.ok(!published.includes('<script>unsafe()'));
  assert.match(published,/<p>A second paragraph\.<\/p>/);
  const saved=extract(await(await request("/cntrladmin/about",{headers:owner})).text());
  assert.equal(saved.revision,1);
});
test("news drafts publish independently of the journal and keep news navigation", async () => {
  assert.match(await(await request("/news")).text(),/News and announcements will appear here/);
  assert.equal((await request("/cntrladmin/news",{headers:reader})).status,404);
  const editor=extract(await(await request("/cntrladmin/new?section=news",{headers:owner})).text());
  assert.equal(editor.section,"news");
  const base=extract(await(await request("/cntrladmin/edit/where-the-light-falls",{headers:owner})).text()).record.draft;
  const doc={...base,id:"news-fixture",section:"news",title:"A published test update",category:"News",cover:"",frames:[],order:0};
  const save=(action,revision,value=doc)=>post("entry",{doc:value,action,revision});
  assert.equal((await save("draft",0)).status,200);
  assert.equal((await request("/news/"+doc.id)).status,404);
  assert.ok(!(await(await request("/news")).text()).includes(doc.title));
  assert.equal((await request("/cntrladmin/preview/"+doc.id,{headers:owner})).status,200);
  assert.equal((await save("publish",1)).status,200);
  const article=await(await request("/news/"+doc.id)).text();
  assert.equal(extract(article).doc.section,"news");
  assert.match(article,/Back to news/);
  assert.equal((await request("/story/"+doc.id)).status,404);
  for(const route of ["/","/archive","/cntrladmin"]){
    assert.ok(!(await(await request(route,{headers:owner})).text()).includes(doc.title),route);
  }
  const list=await(await request("/cntrladmin/news",{headers:owner})).text();assert.ok(list.includes(doc.title));
  assert.ok((await(await request("/news")).text()).includes(doc.title));
  const revised={...doc,title:"A private revised update"};
  assert.equal((await save("draft",2,revised)).status,200);
  assert.ok(!(await(await request("/news")).text()).includes(revised.title));
  const next={...doc,id:"second-news-fixture",title:"The next test update",order:1};
  assert.equal((await post("entry",{doc:next,action:"publish",revision:0})).status,200);
  assert.match(await(await request("/news/"+doc.id)).text(),/rel="next" href="\/news\/second-news-fixture"/);
  assert.equal((await save("unpublish",3,revised)).status,200);
  assert.equal((await request("/news/"+doc.id)).status,404);
  assert.ok(!(await(await request("/news")).text()).includes(doc.title));
});

test("site settings persist across public pages with their configured visibility and pagination", async () => {
  const dashboard=await request("/cntrladmin/site-settings",{headers:owner});assert.equal(dashboard.status,200);
  const initial=extract(await dashboard.text());assert.equal(initial.settings.revision,0);
  assert.equal((await request("/cntrladmin/site-settings",{headers:reader})).status,404);
  const value={...initial.settings,name:"Frame and Field",background:"#f6e6c8",nameColor:"#6d302a",nameFont:"georgia",author:"The editor",tagline:"Notes from the field",footerText:"The editor",contentWidth:1100,postsPerPage:2,photoLayout:"left",menuNews:false,contactForm:false,showCaptions:false,showDates:false,showLocations:false};
  assert.equal((await post("site-settings",value,reader)).status,404);
  const saved=await post("site-settings",value);assert.equal(saved.status,200);assert.equal((await saved.json()).revision,1);
  const retry=await post("site-settings",value);assert.equal(retry.status,200);assert.equal((await retry.json()).revision,1);
  const front=await(await request("/")).text();
  assert.match(front,/<title>Frame and Field<\/title>/);assert.match(front,/--paper:#f6e6c8/);assert.match(front,/color:#6d302a/);
  assert.match(front,/Notes from the field/);assert.match(front,/max-width:1100px/);
  assert.equal((front.match(/class="magazine-spread/g)||[]).length,2);
  assert.ok(!front.includes('href="/news">News</a>'));
  assert.ok(!front.includes("Low cloud beneath the ridgeline, Dolomites."));
  for(const route of ["/about","/news","/contact","/archive","/story/where-the-light-falls"]){assert.ok((await(await request(route)).text()).includes("Frame and Field"),route);}
  const article=await(await request("/story/where-the-light-falls")).text();
  assert.doesNotMatch(article,/<time datetime=/);assert.ok(extract(article).doc.frames.every(f=>f.caption===""));
  const contact=await(await request("/contact")).text();assert.ok(!contact.includes('name="body"'));
  const closed=await request("/contact",{method:"POST",headers:{Origin:origin,"Content-Type":"application/x-www-form-urlencoded"},body:"name=Reader&body=Message"});assert.equal(closed.status,403);
  assert.equal((await post("site-settings",{...defaultSettings,revision:1})).status,200);
});
test("settings preview stays private and validation rejects unsafe or stale writes", async () => {
  assert.equal((await request("/cntrladmin/site-preview")).status,404);
  assert.equal((await request("/cntrladmin/settings.mjs",{headers:reader})).status,404);
  const value={...defaultSettings,revision:2,name:'A <script> preview'};
  const preview=await post("site-preview",value);assert.equal(preview.status,200);
  assert.match(preview.headers.get("Cache-Control"),/no-store/);
  const markup=(await preview.json()).html;assert.ok(markup.includes("A &lt;script&gt; preview"));assert.ok(!markup.includes("A <script> preview"));
  assert.match(await(await request("/")).text(),/<title>MyPhotoStories<\/title>/);
  for(const patch of [{background:"red;display:none"},{nameFont:"url(evil)"},{postsPerPage:0},{contentWidth:5000},{showDates:"false"}]){
    assert.equal((await post("site-settings",{...defaultSettings,revision:2,...patch})).status,422);
  }
  const old=await post("site-settings",{...defaultSettings,revision:1,name:"From an old tab"});assert.equal(old.status,409);
  const foreign=await request("/cntrladmin/api/site-settings",{method:"POST",headers:{...owner,"X-Journal-Write":"studio","Content-Type":"application/json",Origin:"https://elsewhere.example.test"},body:JSON.stringify({...defaultSettings,revision:2})});assert.equal(foreign.status,403);
  assert.equal(extract(await(await request("/cntrladmin/site-settings",{headers:owner})).text()).settings.revision,2);
});
test("concurrent settings edits preserve a single complete version", async () => {
  const results=await Promise.all([post("site-settings",{...defaultSettings,revision:2,background:"#eee2c9"}),post("site-settings",{...defaultSettings,revision:2,background:"#ece5d6"})]);
  assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);
  const current=extract(await(await request("/cntrladmin/site-settings",{headers:owner})).text()).settings;
  assert.equal(current.revision,3);assert.ok(["#eee2c9","#ece5d6"].includes(current.background));
  assert.equal((await post("site-settings",{...defaultSettings,revision:3})).status,200);
});
