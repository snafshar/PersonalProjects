import {runtime,db,json,fail,HttpError} from '@/lib/server';
import {verifyStripeSignature,settle,type StripeSession} from '@/lib/payments';
export async function POST(request:Request){try{const secret=runtime().STRIPE_WEBHOOK_SECRET;if(!secret)throw new HttpError(503,'Webhook is not configured.');if(Number(request.headers.get('content-length'))>1024*1024)throw new HttpError(413,'Payload too large.');const text=await request.text();if(text.length>1024*1024)throw new HttpError(413,'Payload too large.');if(!await verifyStripeSignature(text,request.headers.get('stripe-signature'),secret))throw new HttpError(400,'Invalid webhook signature.');const event=JSON.parse(text);const s=event.data?.object;
if(['checkout.session.completed','checkout.session.async_payment_succeeded'].includes(event.type)){await settle(s as StripeSession)}
if(event.type==='checkout.session.expired'){await db().prepare("UPDATE orders SET status='expired' WHERE stripe_session_id=? AND status='pending'").bind(s.id).run()}
if(event.type==='checkout.session.async_payment_failed'){await db().prepare("UPDATE orders SET status='failed' WHERE stripe_session_id=? AND status='pending'").bind(s.id).run()}
if(event.type==='charge.refunded'&&s.refunded===true&&typeof s.payment_intent==='string'){await db().prepare("UPDATE orders SET status='refunded' WHERE payment_intent=?").bind(s.payment_intent).run()}
if(event.type==='charge.dispute.created'&&typeof s.payment_intent==='string'){await db().prepare("UPDATE orders SET status='disputed' WHERE payment_intent=?").bind(s.payment_intent).run()}
return json({received:true})}catch(e){return fail(e)}}
