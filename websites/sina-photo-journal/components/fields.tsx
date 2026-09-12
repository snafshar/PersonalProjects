'use client';
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from '@/components/ui/select';
import {Checkbox} from '@/components/ui/checkbox';
import {useId} from 'react';
export function SelectField({label,value,onChange,options}:{label:string;value:string;onChange:(v:string)=>void;options:{value:string;label:string}[]}){const id=useId();return <div className="field"><label htmlFor={id}>{label}</label><Select value={value} onValueChange={onChange}><SelectTrigger id={id}><SelectValue/></SelectTrigger><SelectContent>{options.map(o=><SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></div>}
export function CheckField({checked,onChange,children}:{checked:boolean;onChange:(v:boolean)=>void;children:React.ReactNode}){const id=useId();return <label className="check-label" htmlFor={id}><Checkbox id={id} checked={checked} onCheckedChange={v=>onChange(v===true)}/><span>{children}</span></label>}
