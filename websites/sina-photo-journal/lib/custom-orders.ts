import {z} from 'zod';
export const customServices=['Portrait or photo session','Product or brand photography','Commissioned photograph','Editing or restoration','Custom print or image licence','Another photography project'] as const;
export const customStatuses=['submitted','reviewing','quoted','interested','completed','declined','cancelled'] as const;
export type CustomStatus=typeof customStatuses[number];
export const customInput=z.object({title:z.string().trim().min(3).max(140),service:z.enum(customServices),intended_use:z.enum(['Personal','Editorial','Commercial']),brief:z.string().trim().min(20).max(8000),location:z.string().trim().max(200).default(''),target_date:z.string().regex(/^$|^\d{4}-\d{2}-\d{2}$/).default(''),budget_cents:z.number().int().min(0).max(10000000).nullable(),accept:z.literal(true)});
export type CustomOrder={id:string;user_id:string;contact_email:string;title:string;service:string;intended_use:string;brief:string;location:string;target_date:string;budget_cents:number|null;status:CustomStatus;quote_cents:number|null;proposal:string;created_at:string;updated_at:string;terms_version:string};
export type CustomMessage={id:string;author_role:'photographer'|'customer';body:string;created_at:string};
export const statusLabel=(s:string)=>({submitted:'Request received',reviewing:'In review',quoted:'Proposal ready',interested:'Interest confirmed',completed:'Closed',declined:'Unavailable',cancelled:'Request cancelled'}[s]||s);
export const ownerTransitions:Record<CustomStatus,CustomStatus[]>={submitted:['reviewing','quoted','declined'],reviewing:['reviewing','quoted','declined'],quoted:['reviewing','quoted','declined'],interested:['reviewing','quoted','completed','declined'],completed:[],declined:[],cancelled:[]};
