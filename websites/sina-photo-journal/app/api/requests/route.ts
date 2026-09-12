import {identity,readJson,checkOrigin,db,json,fail,HttpError,limitAction,runtime} from '@/lib/server';
type SupportRequest={id:string;user_id:string;order_id:string|null;type:string;message:string;created_at:string;contact_email:string;acknowledged_at:string|null};
async function acknowledge(r:SupportRequest){
  if(r.acknowledged_at)return true;
  const e=runtime();if(!e.RESEND_API_KEY||!e.RECEIPT_FROM_EMAIL||!r.contact_email)return false;
  try{
    const result=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+e.RESEND_API_KEY,'Content-Type':'application/json','Idempotency-Key':'request-'+r.id},body:JSON.stringify({from:e.RECEIPT_FROM_EMAIL,to:[r.contact_email],reply_to:e.SELLER_EMAIL,subject:r.type==='withdrawal'?'Your withdrawal notice was received':'Your Photo Journal request was received',text:['PHOTO JOURNAL — REQUEST ACKNOWLEDGEMENT','Reference: '+r.id,'Received: '+r.created_at,'Type: '+r.type,'Order: '+(r.order_id||'Not specified'),'','Your notice:',r.message,'','The receipt of your notice is recorded at the timestamp above. This acknowledgement does not itself determine any refund outcome.','Contact: '+e.SELLER_EMAIL].join('\n')})});
    if(!result.ok){console.error('Request acknowledgement email was not accepted',r.id,result.status);return false}
    await db().prepare('UPDATE customer_requests SET acknowledged_at=? WHERE id=?').bind(new Date().toISOString(),r.id).run();return true;
  }catch{console.error('Request acknowledgement awaits retry',r.id);return false}
}
export async function POST(request:Request){try{
  checkOrigin(request);const u=await identity();await limitAction(u.userId,'support',3);const b=await readJson(request);
  if(typeof b.type!=='string'||!['withdrawal','refund','privacy','issue'].includes(b.type)||typeof b.message!=='string'||b.message.trim().length<3||b.message.length>4000)throw new HttpError(400,'Choose a request type and write a message (3–4,000 characters).');
  if(b.order_id!==undefined&&typeof b.order_id!=='string')throw new HttpError(400,'Invalid order reference.');
  const orderId=typeof b.order_id==='string'&&b.order_id?b.order_id:null;
  if(orderId&&!await db().prepare('SELECT id FROM orders WHERE id=? AND user_id=?').bind(orderId,u.userId).first())throw new HttpError(404,'Order not found.');
  const r:SupportRequest={id:crypto.randomUUID(),user_id:u.userId,order_id:orderId,type:b.type,message:b.message.trim(),created_at:new Date().toISOString(),contact_email:u.email,acknowledged_at:null};
  await db().prepare('INSERT INTO customer_requests (id,user_id,order_id,type,message,created_at,contact_email) VALUES (?,?,?,?,?,?,?)').bind(r.id,r.user_id,r.order_id,r.type,r.message,r.created_at,r.contact_email).run();
  const emailSent=await acknowledge(r);
  return json({id:r.id,received_at:r.created_at,email_sent:emailSent,message:'Your request has been received. Keep this reference as your confirmation.'},201);
}catch(e){return fail(e)}}
export async function PATCH(request:Request){try{
  checkOrigin(request);const u=await identity(true);await limitAction(u.userId,'support-admin',15);const b=await readJson(request);
  if(typeof b.id!=='string')throw new HttpError(400,'Check the request.');
  if(b.retry_acknowledgement===true){const r=await db().prepare('SELECT * FROM customer_requests WHERE id=?').bind(b.id).first<SupportRequest>();if(!r)throw new HttpError(404,'Request not found.');if(!await acknowledge(r))throw new HttpError(503,'Email was not accepted. Check the sender settings and retry.');return json({saved:true})}
  if(typeof b.status!=='string'||!['open','resolved'].includes(b.status))throw new HttpError(400,'Check the request.');
  await db().prepare('UPDATE customer_requests SET status=? WHERE id=?').bind(b.status,b.id).run();return json({saved:true});
}catch(e){return fail(e)}}
