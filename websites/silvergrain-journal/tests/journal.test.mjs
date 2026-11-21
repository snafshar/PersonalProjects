import {before,after,test} from "node:test";
import assert from "node:assert/strict";
import {readFile,readdir} from "node:fs/promises";
import {build} from "esbuild";
import {Miniflare, convertV4MiniflareOptions} from "miniflare";
import path from "node:path";
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
