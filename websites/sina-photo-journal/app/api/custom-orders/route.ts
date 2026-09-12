import {identity,isOwner,readJson,checkOrigin,db,json,fail,HttpError,limitAction} from '@/lib/server';
import {customInput,ownerTransitions,type CustomOrder,type CustomStatus} from '@/lib/custom-orders';
import {TERMS_VERSION} from '@/lib/content';
async function find(id:unknown,user:{userId:string;email:string;displayName:string;fullName:string|null}){if(typeof id!=='string')throw new HttpError(400,'Choose a request.');const row=await db().prepare('SELECT * FROM custom_orders WHERE id=?').bind(id).first<CustomOrder>();if(!row||(!isOwner(user)&&row.user_id!==user.userId))throw new HttpError(404,'Request not found.');return row}
export async function GET(request:Request){try{const u=await identity(),id=new URL(request.url).searchParams.get('id');if(id){const order=await find(id,u);const messages=await db().prepare('SELECT id,author_role,body,created_at FROM custom_order_messages WHERE custom_order_id=? ORDER BY created_at ASC LIMIT 200').bind(id).all();return json({order,messages:messages.results})}const rows=await db().prepare('SELECT * FROM custom_orders WHERE user_id=? ORDER BY created_at DESC LIMIT 100').bind(u.userId).all();return json({orders:rows.results})}catch(e){return fail(e)}}
export async function POST(request:Request){try{
  checkOrigin(request);const u=await identity();await limitAction(u.userId,'custom-submit',3);const parsed=customInput.safeParse(await readJson(request));if(!parsed.success)throw new HttpError(400,'Check the brief, project details, budget and terms.');const b=parsed.data;
  if(b.target_date&&(b.target_date<new Date().toISOString().slice(0,10)||!Number.isFinite(Date.parse(b.target_date))||new Date(b.target_date).toISOString().slice(0,10)!==b.target_date))throw new HttpError(400,'Choose a valid future date, or leave the date open.');
  const id=crypto.randomUUID(),now=new Date().toISOString();
  await db().batch([db().prepare('INSERT INTO profiles (user_id,email,name,accepted_version,created_at) VALUES (?,?,?,?,?) ON CONFLICT(user_id) DO NOTHING').bind(u.userId,u.email,u.fullName||u.email.split('@')[0],TERMS_VERSION,now),db().prepare('INSERT INTO custom_orders (id,user_id,contact_email,title,service,intended_use,brief,location,target_date,budget_cents,status,proposal,created_at,updated_at,terms_version) VALUES (?,?,?,?,?,?,?,?,?,?,?,\'\',?,?,?)').bind(id,u.userId,u.email,b.title,b.service,b.intended_use,b.brief,b.location,b.target_date,b.budget_cents,'submitted',now,now,TERMS_VERSION)]);
  return json({id,received_at:now},201);
}catch(e){return fail(e)}}
export async function PATCH(request:Request){try{
  checkOrigin(request);const u=await identity();await limitAction(u.userId,'custom-update',20);const b=await readJson(request),order=await find(b.id,u);
  if(b.action==='message'){
    if(typeof b.body!=='string'||b.body.trim().length<3||b.body.length>4000)throw new HttpError(400,'Write a message of 3–4,000 characters.');
    const count=await db().prepare('SELECT count(*) AS n FROM custom_order_messages WHERE custom_order_id=?').bind(order.id).first<{n:number}>();if((count?.n||0)>=200)throw new HttpError(409,'This conversation is full. Please contact the photographer by email.');
    await db().prepare('INSERT INTO custom_order_messages (id,custom_order_id,author_id,author_role,body,created_at) VALUES (?,?,?,?,?,?)').bind(crypto.randomUUID(),order.id,u.userId,isOwner(u)?'photographer':'customer',b.body.trim(),new Date().toISOString()).run();return json({saved:true});
  }
  if(b.updated_at!==order.updated_at)throw new HttpError(409,'This request changed. Close it and open the latest version before continuing.');
  let status:CustomStatus,price=order.quote_cents,proposal=order.proposal;
  if(isOwner(u)){
    if(typeof b.status!=='string'||!ownerTransitions[order.status].includes(b.status as CustomStatus))throw new HttpError(400,'This status change is unavailable.');status=b.status as CustomStatus;
    if(typeof b.proposal!=='string'||b.proposal.length>8000)throw new HttpError(400,'Write a proposal under 8,000 characters.');proposal=b.proposal.trim();
    if(b.quote_cents!==null&&(typeof b.quote_cents!=='number'||!Number.isInteger(b.quote_cents)||b.quote_cents<100||b.quote_cents>10000000))throw new HttpError(400,'The estimate must be at least €1 or left empty.');price=b.quote_cents as number|null;
    if(status==='quoted'&&(price===null||proposal.length<20))throw new HttpError(400,'Add an estimate and describe the scope, deliverables, usage and timing.');
  }else if(b.action==='interest'&&order.status==='quoted'){status='interested'}
  else if(b.action==='cancel'&&['submitted','reviewing','quoted','interested'].includes(order.status)){status='cancelled'}
  else throw new HttpError(403,'This action is unavailable.');
  const result=await db().prepare('UPDATE custom_orders SET status=?,quote_cents=?,proposal=?,updated_at=? WHERE id=? AND updated_at=?').bind(status,price,proposal,new Date(Math.max(Date.now(),Date.parse(order.updated_at)+1)).toISOString(),order.id,order.updated_at).run();
  if(!result.meta.changes)throw new HttpError(409,'The request changed. Reopen it and try again.');return json({saved:true});
}catch(e){return fail(e)}}
