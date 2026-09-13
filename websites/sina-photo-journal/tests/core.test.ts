import {customInput} from '../lib/custom-orders.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {detectedImage,handheldStable,photoInput,presetInput,safeFilename} from '../lib/validation.ts';
import {generateRecommendation,defaultGear,defaultContext,calculateExposureValue} from '../lib/recommendation-engine.ts';
import {scenarios} from '../lib/scenarios.ts';
import {verifyStripeSignature,sessionMatches} from '../lib/payment-checks.ts';
import type {Order,StripeSession} from '../lib/payments.ts';
test('exposure matches Sunny 16 and a one-stop ISO change',()=>{const a=calculateExposureValue(16,1/125,100),b=calculateExposureValue(16,1/125,200);assert.ok(Math.abs(a.sceneEv-15)<.05);assert.equal(a.sceneEv-b.sceneEv,1)});
test('handheld check rejects a long telephoto exposure and accepts a fast one',()=>{assert.equal(handheldStable(1/30,200),false);assert.equal(handheldStable(1/500,200),true);assert.equal(handheldStable(1/200,200),true);assert.equal(handheldStable(1/200,200,1.5),false);assert.equal(handheldStable(1/100,200,1,1),true)});
test('all 26 recovered shooting scenarios generate finite, complete settings',()=>{assert.equal(scenarios.length,26);for(const s of scenarios){for(const light of ['bright','night'] as const){const r=generateRecommendation(s,{...defaultContext(s),light},{...defaultGear,focalLength:600,maxAperture:5.6});assert.ok(Number.isFinite(r.isoEstimate));assert.ok(r.groups.length>=6);assert.ok(!r.headline.includes('NaN'));assert.ok(r.checklist.length>=3)}}});
test('rendered shooting advice is identical across server and browser locales',()=>{
  const script=`
    import {generateRecommendation,defaultContext,defaultGear} from './lib/recommendation-engine.ts';
    import {scenarios} from './lib/scenarios.ts';
    console.log(JSON.stringify(scenarios.flatMap(s=>['bright','night'].map(light=>{
      const {generatedAt,...rendered}=generateRecommendation(s,{...defaultContext(s),light},defaultGear);
      return rendered;
    }))));`;
  const render=(locale:string)=>execFileSync(process.execPath,['--experimental-strip-types','--input-type=module','-e',script],{cwd:new URL('..',import.meta.url),env:{...process.env,LANG:locale,LC_ALL:locale},encoding:'utf8'});
  assert.equal(render('de_DE.UTF-8'),render('en_US.UTF-8'));
});
test('lens outside a scenario range never produces an inverted recommended interval',()=>{const r=generateRecommendation(scenarios[0],defaultContext(scenarios[0]),{...defaultGear,focalLength:600});const focal=r.groups.flatMap(g=>g.parameters).find(p=>p.label==='Focal length');assert.match(focal!.value,/50–135 mm/);assert.match(focal!.value,/600 mm/)});
test('flash recommendation respects unavailable gear',()=>{const r=generateRecommendation(scenarios[0],defaultContext(scenarios[0]),{...defaultGear,flashAvailable:false});assert.match(r.groups.flatMap(g=>g.parameters).find(p=>p.label==='Flash approach')!.value,/not selected/)});
test('upload type sniffs content rather than filename or claimed MIME',()=>{assert.equal(detectedImage(new Uint8Array([255,216,255,0])),'image/jpeg');assert.equal(detectedImage(new TextEncoder().encode('<svg onload=evil>')),null);assert.equal(detectedImage(new Uint8Array([137,80,78,71,13,10,26,10])),'image/png');assert.equal(safeFilename('../../photo\r\nX-Test: evil.jpg'),'.._.._photo__X-Test__evil.jpg')});
const photo={title:'Lake',caption:'Evening at the lake.',alt:'A lake at dusk',category:'Landscape',price_cents:1500,published:1,width:6000,height:4000,rights:true};
test('photo validation rejects missing rights, invalid money and missing alt text',()=>{assert.equal(photoInput.safeParse(photo).success,true);for(const patch of [{rights:false},{price_cents:-1},{price_cents:10},{price_cents:Infinity},{alt:''},{published:2},{width:0}])assert.equal(photoInput.safeParse({...photo,...patch}).success,false)});
test('saved setup rejects invalid input enum and focal length',()=>{const p={name:'Portrait',data:{scenarioId:scenarios[0].id,context:defaultContext(scenarios[0]),gear:defaultGear}};assert.equal(presetInput.safeParse(p).success,true);assert.equal(presetInput.safeParse({...p,data:{...p.data,gear:{...defaultGear,focalLength:0}}}).success,false)});
test('signed payment must match order, customer, photo, amount and currency',()=>{const o={id:'order-a',user_id:'buyer-a',photo_id:'photo-a',amount:1500,currency:'eur',stripe_session_id:'cs-a'} as Order;const s={id:'cs-a',payment_status:'paid',status:'complete',payment_intent:'pi_test',amount_total:1500,currency:'eur',metadata:{order_id:'order-a',user_id:'buyer-a',photo_id:'photo-a'}} as StripeSession;assert.equal(sessionMatches(o,s),true);for(const patch of [{payment_status:'unpaid'},{amount_total:1},{currency:'usd'},{id:'cs-b'},{metadata:{...s.metadata,user_id:'buyer-b'}},{metadata:{...s.metadata,photo_id:'photo-b'}}])assert.equal(sessionMatches(o,{...s,...patch} as StripeSession),false)});
test('webhook rejects forged, stale and altered signatures',async()=>{const now=Date.now(),t=Math.floor(now/1000),body='{"type":"checkout.session.completed"}',secret='test-webhook-secret';const key=await webcrypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);const sig=Buffer.from(await webcrypto.subtle.sign('HMAC',key,new TextEncoder().encode(t+'.'+body))).toString('hex');const header='t='+t+',v1='+sig;assert.equal(await verifyStripeSignature(body,header,secret,now),true);assert.equal(await verifyStripeSignature(body+' ',header,secret,now),false);assert.equal(await verifyStripeSignature(body,header,secret,now+301000),false);assert.equal(await verifyStripeSignature(body,null,secret,now),false);assert.equal(await verifyStripeSignature(body,'t=bad,v1='+sig,secret,now),false)});

test('custom enquiry validates consent, usage and money',()=>{const b={title:'Portrait',service:'Portrait or photo session',intended_use:'Personal',brief:'An outdoor portrait session with two final images.',location:'',target_date:'',budget_cents:20000,accept:true};assert.equal(customInput.safeParse(b).success,true);for(const patch of [{accept:false},{brief:'short'},{budget_cents:-1},{budget_cents:Infinity},{intended_use:'invalid'},{service:'invalid'}])assert.equal(customInput.safeParse({...b,...patch}).success,false)});
