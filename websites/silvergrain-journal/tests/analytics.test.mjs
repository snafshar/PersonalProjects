import {before,beforeEach,after,test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {build} from 'esbuild';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import path from 'node:path';

let runtime,db;
const origin='https://journal.example.test',owner={'oai-authenticated-user-id':'analytics-owner','oai-authenticated-user-email':'editor@example.test'},reader={'oai-authenticated-user-id':'reader','oai-authenticated-user-email':'reader@example.test'};
const ua='Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1';
const request=(route,options={})=>runtime.dispatchFetch(new URL(route,origin),{redirect:'manual',cf:{country:'IT',region:'Tuscany',city:'Pisa'},...options});
const post=(name,value,who=owner)=>request('/cntrladmin/api/'+name,{method:'POST',headers:{...who,Origin:origin,'X-Journal-Write':'studio','Content-Type':'application/json'},body:JSON.stringify(value)});
const event=(value={},headers={})=>request('/visit-event',{method:'POST',headers:{Origin:origin,'X-Journal-Visit':'1','Content-Type':'application/json','User-Agent':ua,'CF-Connecting-IP':'198.51.100.42','CF-IPCountry':'IT',...headers},body:JSON.stringify({action:'allow',policy:'1:full:30',eventId:crypto.randomUUID(),page:'/?utm_source=instagram&utm_campaign=field-notes',referrer:'https://l.instagram.com/?secret=do-not-store',...value})});
const cookies=response=>response.headers.getSetCookie().map(s=>s.split(';')[0]).join('; ');
const id=(jar,key)=>jar.split('; ').find(s=>s.startsWith(key+'=')).split('=')[1];
const state=html=>JSON.parse(html.match(/id="studio-data"[^>]*>(.*?)<\/script>/s)[1]);
const count=async(table='journal_visit_events')=>(await db.prepare('SELECT count(*) n FROM '+table).first()).n;
before(async()=>{
  const bundle=await build({stdin:{contents:'import {journal} from "./worker/router";export default {fetch:journal}',resolveDir:process.cwd()},plugins:[{name:'raw',setup(b){b.onResolve({filter:/\?raw$/},a=>({path:path.resolve(a.resolveDir,a.path.slice(0,-4)),namespace:'raw'}));b.onLoad({filter:/.*/,namespace:'raw'},async a=>({contents:await readFile(a.path,'utf8'),loader:'text'}));}}],bundle:true,format:'esm',platform:'neutral',write:false});
  runtime=new Miniflare(convertV4MiniflareOptions({modules:[{type:'ESModule',path:'analytics.js',contents:bundle.outputFiles[0].text}],compatibilityDate:'2026-05-15',d1Databases:['DB'],r2Buckets:['BUCKET'],bindings:{JOURNAL_OWNER_EMAIL:'editor@example.test'}}));
  db=await runtime.getD1Database('DB');
  for(const name of (await readdir('drizzle')).filter(n=>n.endsWith('.sql')).sort())for(const sql of (await readFile('drizzle/'+name,'utf8')).split('--> statement-breakpoint'))if(sql.trim())await db.prepare(sql.trim()).run();
});
beforeEach(async()=>{
  await db.batch(['journal_visit_events','journal_visit_sessions','journal_visit_visitors','journal_visit_rates'].map(t=>db.prepare('DELETE FROM '+t)));
  await db.prepare("DELETE FROM journal_settings WHERE name='visit_settings'").run();
});
after(async()=>runtime?.dispose());

test('statistics start empty and page loads or unconsented events do not create visit identifiers',async()=>{
  const home=await request('/');assert.equal(home.status,200);assert.equal(home.headers.get('Set-Cookie'),null);
  assert.match(await home.text(),/\/press\/visits.mjs/);
  const policy=await request('/visit-policy');assert.equal(policy.headers.get('Set-Cookie'),null);assert.equal((await policy.json()).ipMode,'full');
  const view=await event({action:'view'});assert.equal((await view.json()).needsConsent,true);assert.equal(view.headers.get('Set-Cookie'),null);
  assert.equal(await count(),0);assert.equal(await count('journal_visit_visitors'),0);
  const page=await request('/cntrladmin/statistics',{headers:owner});assert.equal(page.status,200);assert.match(await page.text(),/No visits recorded/);
});
test('consenting visits store network details and a cookie-based journey with first-arrival attribution and deduplication',async()=>{
  const first=await event();assert.equal(first.status,200);assert.equal((await first.json()).recorded,true);
  for(const cookie of first.headers.getSetCookie()){assert.match(cookie,/HttpOnly/);assert.match(cookie,/SameSite=Lax/);assert.match(cookie,/Secure/);}
  const jar=cookies(first),eventId=crypto.randomUUID();
  const next={action:'view',page:'/story/where-the-light-falls?secret=excluded',eventId,referrer:origin+'/'};
  const a=await event(next,{Cookie:jar}),b=await event(next,{Cookie:cookies(a)});assert.equal((await a.json()).recorded,true);assert.equal((await b.json()).recorded,false);
  await event({action:'view',page:'/story/between-the-arches',referrer:'https://google.com/'},{Cookie:jar});
  const rows=(await db.prepare('SELECT e.*,s.source,s.referrer,s.campaign FROM journal_visit_events e JOIN journal_visit_sessions s ON e.session=s.id ORDER BY e.id').all()).results;
  assert.equal(rows.length,3);assert.equal(new Set(rows.map(r=>r.session)).size,1);assert.equal(new Set(rows.map(r=>r.visitor)).size,1);
  assert.equal(rows[0].ip,'198.51.100.42');assert.equal(rows[0].country,'IT');assert.equal(rows[0].device,'Mobile');assert.equal(rows[0].browser,'Safari');assert.equal(rows[0].os,'iOS');
  assert.ok(rows.every(r=>r.source==='Instagram'));assert.equal(rows[0].referrer,'l.instagram.com');assert.equal(rows[0].campaign,'field-notes');assert.equal(rows[1].path,'/story/where-the-light-falls');
  const stats=await(await request('/cntrladmin/statistics',{headers:owner})).text();assert.match(stats,/3<\/strong><span>Page views/);assert.match(stats,/2<\/strong><span>Post views/);assert.match(stats,/2<\/strong><span>Different posts viewed/);
  const journey=await request('/cntrladmin/statistics/visit/'+id(jar,'mps_s'),{headers:owner});assert.equal(journey.status,200);assert.match(await journey.text(),/3 page views · 2 different posts viewed/);
});
test('sessions restart after inactivity and distinguish Google, Instagram and direct or unknown sources',async()=>{
  const first=await event(),jar=cookies(first);
  await db.prepare('UPDATE journal_visit_sessions SET last_seen=?').bind(Math.floor(Date.now()/1000)-1801).run();
  const google=await event({action:'view',page:'/archive',referrer:'https://www.google.it/search?q=private'},{Cookie:jar});
  assert.notEqual(id(cookies(google),'mps_s'),id(jar,'mps_s'));assert.equal(id(cookies(google),'mps_v'),id(jar,'mps_v'));
  await event({page:'/',referrer:''});
  const rows=(await db.prepare('SELECT source,referrer FROM journal_visit_sessions ORDER BY started,id').all()).results;
  assert.deepEqual(rows.map(r=>r.source).sort(),['Direct / unknown','Google','Instagram']);assert.equal(rows.find(r=>r.source==='Google').referrer,'www.google.it');
});
test('collector rejects CSRF, invalid input, private paths and unpublished or foreign pages',async()=>{
  assert.equal((await event({}, {Origin:'https://foreign.example.test'})).status,403);
  assert.equal((await event({}, {'X-Journal-Visit':''})).status,403);
  assert.equal((await event({}, {'Content-Type':'text/plain'})).status,415);
  for(const page of ['/cntrladmin','/cntrladmin/preview/where-the-light-falls','/story/not-published','/news/where-the-light-falls','https://other.test/'])assert.equal((await event({page})).status,422,page);
  assert.equal((await event({eventId:'not-a-uuid'})).status,422);
  assert.equal((await event({referrer:'x'.repeat(9000)})).status,413);
  assert.equal(await count(),0);assert.equal(await count('journal_visit_visitors'),0);
});
test('owner visits, recognised bots, prefetches and browser privacy opt-outs are excluded',async()=>{
  for(const headers of [owner,{'Sec-GPC':'1'},{DNT:'1'},{'User-Agent':'Googlebot/2.1'},{'Sec-Purpose':'prefetch'}]){
    const r=await event({},headers);assert.equal(r.status,200);assert.equal((await r.json()).recorded,false);assert.equal(r.headers.get('Set-Cookie'),null);
  }
  assert.equal((await(await request('/visit-policy',{headers:owner})).json()).excluded,true);
  assert.equal(await count(),0);assert.equal(await count('journal_visit_visitors'),0);
});
test('statistics, visit journeys, CSV exports and management writes are protected server-side',async()=>{
  const first=await event(),session=id(cookies(first),'mps_s');
  for(const route of ['/cntrladmin/statistics','/cntrladmin/statistics.csv','/cntrladmin/statistics.mjs','/cntrladmin/statistics/visit/'+session]){
    assert.equal((await request(route)).status,404);assert.equal((await request(route,{headers:reader})).status,404);
  }
  assert.equal((await post('visit-settings',{revision:0,enabled:false,retentionDays:30,ipMode:'full'},reader)).status,404);
  assert.equal((await post('clear-visits',{confirmation:'DELETE VISIT LOGS'},reader)).status,404);
  const page=await request('/cntrladmin/statistics',{headers:owner});assert.match(page.headers.get('Cache-Control'),/no-store/);assert.match(page.headers.get('X-Robots-Tag'),/noindex/);
  assert.equal((await request('/cntrladmin/statistics/visit/'+crypto.randomUUID(),{headers:owner})).status,404);
});
test('report filters, log pagination and exports cover the same recorded events',async()=>{
  const initial=await event(),jar=cookies(initial);
  for(let i=0;i<51;i++)assert.equal((await event({action:'view',page:i%2?'/story/between-the-arches':'/archive'},{Cookie:jar})).status,200);
  const html=await(await request('/cntrladmin/statistics',{headers:owner})).text();assert.match(html,/52<\/strong><span>Page views/);assert.match(html,/Older visits/);
  const older=html.match(/href="(\/cntrladmin\/statistics\?[^"]+before=\d+[^\"]*)"/)[1].replaceAll('&amp;','&');
  const oldPage=await(await request(older,{headers:owner})).text();assert.match(oldPage,/Newest visits/);
  const filtered=await(await request('/cntrladmin/statistics?source=Instagram&device=Mobile&q=between-the-arches',{headers:owner})).text();assert.match(filtered,/25<\/strong><span>Page views/);
  const csv=await request('/cntrladmin/statistics.csv?source=Instagram&device=Mobile&q=between-the-arches',{headers:owner});assert.equal(csv.status,200);assert.equal((await csv.text()).split('\r\n').length,26);
  assert.equal((await request('/cntrladmin/statistics?from=2026-02-30',{headers:owner})).status,422);
  assert.equal((await request('/cntrladmin/statistics?device=invalid',{headers:owner})).status,422);
});
test('logging settings validate revisions and mask or remove historical IP details',async()=>{
  const first=await event(),jar=cookies(first);
  const current=state(await(await request('/cntrladmin/statistics',{headers:owner})).text()).settings;
  assert.equal(current.revision,0);
  for(const patch of [{retentionDays:365},{ipMode:'anything'},{enabled:'true'}])assert.equal((await post('visit-settings',{...current,...patch})).status,422);
  const input={...current,ipMode:'masked'};
  assert.equal((await post('visit-settings',input)).status,200);assert.equal((await post('visit-settings',input)).status,200);
  assert.equal((await db.prepare('SELECT ip FROM journal_visit_events').first()).ip,'198.51.100.0');
  assert.equal((await(await event({action:'view',policy:'1:masked:30'},{Cookie:jar})).json()).needsConsent,true);
  await event({policy:'1:masked:30'},{Cookie:jar,'CF-Connecting-IP':'2001:db8::1234'});
  assert.ok((await db.prepare('SELECT ip FROM journal_visit_events').all()).results.some(r=>r.ip==='2001:db8:0::'));
  assert.equal((await post('visit-settings',{revision:1,enabled:true,retentionDays:30,ipMode:'none'})).status,200);
  assert.ok((await db.prepare('SELECT ip FROM journal_visit_events').all()).results.every(r=>r.ip===''));
  assert.equal((await post('visit-settings',{...current,enabled:false})).status,409);
});
test('shorter retention removes expired rows and pausing collection preserves remaining reports',async()=>{
  const a=await event(),jar=cookies(a),old=Math.floor(Date.now()/1000)-8*86400;
  await db.batch([db.prepare('UPDATE journal_visit_events SET created=?').bind(old),db.prepare('UPDATE journal_visit_visitors SET last_seen=?').bind(old),db.prepare('UPDATE journal_visit_sessions SET last_seen=?').bind(old)]);
  await event({page:'/about'});
  assert.equal((await post('visit-settings',{revision:0,enabled:false,retentionDays:7,ipMode:'full'})).status,200);
  assert.equal(await count(),1);assert.equal(await count('journal_visit_visitors'),1);assert.equal(await count('journal_visit_sessions'),1);
  assert.equal((await(await event({action:'view',policy:'1:full:7'},{Cookie:jar})).json()).recorded,false);assert.equal(await count(),1);
});
test('concurrent collection cannot restore IP detail after the owner disables IP storage',async()=>{
  const a=await event(),jar=cookies(a);
  const results=await Promise.all([
    ...Array.from({length:15},()=>event({action:'view',page:'/about'},{Cookie:jar})),
    post('visit-settings',{revision:0,enabled:true,retentionDays:30,ipMode:'none'}),
  ]);
  assert.ok(results.every(r=>r.status===200));
  assert.ok((await db.prepare('SELECT ip FROM journal_visit_events').all()).results.every(r=>r.ip===''));
});
test('CSV values cannot become formulas and untrusted referral labels remain escaped in the dashboard',async()=>{
  const label='=HYPERLINK("https://example.test")<img onerror=bad()>',params=new URLSearchParams({utm_source:label});
  await event({page:'/?'+params});
  const html=await(await request('/cntrladmin/statistics',{headers:owner})).text();assert.ok(html.includes('&lt;img onerror=bad()&gt;'));assert.ok(!html.includes('<img onerror=bad()>'));
  const csv=await request('/cntrladmin/statistics.csv',{headers:owner});assert.match(csv.headers.get('Content-Disposition'),/attachment/);assert.ok((await csv.text()).includes('"\'=hyperlink'));
});
test('visitor withdrawal deletes their browser history without affecting other visitors; owner clearing needs an explicit phrase',async()=>{
  const a=await event(),jar=cookies(a);await event({page:'/about'});
  const withdrawn=await event({action:'deny'},{Cookie:jar});assert.equal((await withdrawn.json()).forgotten,true);assert.ok(withdrawn.headers.getSetCookie().every(c=>c.includes('Max-Age=0')));
  assert.equal(await count(),1);assert.equal(await count('journal_visit_visitors'),1);
  assert.equal((await post('clear-visits',{confirmation:'yes'})).status,422);assert.equal(await count(),1);
  assert.equal((await post('clear-visits',{confirmation:'DELETE VISIT LOGS'})).status,200);assert.equal(await count(),0);assert.equal(await count('journal_visit_visitors'),0);assert.equal(await count('journal_visit_sessions'),0);
});
test('public collector is rate limited before creating analytics records',async()=>{
  const first=await event();assert.equal(first.status,200);
  await db.prepare('UPDATE journal_visit_rates SET count=120').run();
  assert.equal((await event()).status,429);assert.equal(await count(),1);
});
