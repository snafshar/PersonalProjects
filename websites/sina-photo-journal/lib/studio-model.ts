import type {Photo} from './content';
import type {CustomOrder} from './custom-orders';
export type StudioView='overview'|'posts'|'create'|'sales'|'customers'|'custom'|'support'|'settings';
export type StudioOrder={id:string;photo_id:string;photo_title:string;buyer_email:string;amount:number;currency:string;status:string;created_at:string;paid_at:string|null;downloaded_at:string|null;receipt_sent_at:string|null;stripe_session_id:string|null;payment_intent:string|null;license_text:string;terms_version:string};
export type StudioCustomer={user_id:string;name:string;email:string;created_at:string;paid_orders:number;spent:number};
export type StudioRequest={id:string;type:string;message:string;status:string;created_at:string;contact_email:string;acknowledged_at:string|null;order_id:string|null};
export type StudioStats={photos:number;published:number;for_sale:number;storage:number;customers:number;paid_orders:number;gross_paid:number;pending_orders:number;open_requests:number;active_custom:number};
export type StudioData={rows:(Photo|StudioOrder|StudioCustomer|StudioRequest|CustomOrder)[];total:number;page:number;pages:number;stats?:StudioStats;trend?:{month:string;amount:number;count:number}[];enabled?:boolean;missing?:string[];seller?:Record<string,string>};
export function csvText(rows:unknown[][]){return rows.map(row=>row.map(value=>{let s=String(value??'');if(/^[\s]*[=+\-@]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"'}).join(',')).join('\r\n')}
