import {requireChatGPTUser} from '@/app/chatgpt-auth';
import {isOwner} from '@/lib/server';
import {studioData} from '@/lib/studio-data';
import {notFound} from 'next/navigation';
import {AdminDashboard} from '@/components/admin-dashboard';
import type {StudioView} from '@/lib/studio-model';
export const dynamic='force-dynamic';
export const metadata={title:'Photographer studio — posts, sales & customers',robots:{index:false,follow:false}};
export default function StudioPage({searchParams}:{searchParams:Promise<{section?:string}>}){return <StudioContent searchParams={searchParams}/>}
async function StudioContent({searchParams}:{searchParams:Promise<{section?:string}>}){const u=await requireChatGPTUser('/studio');if(!isOwner(u))notFound();const q=await searchParams;const section=(['overview','posts','create','sales','customers','custom','support','settings'].includes(q.section||'')?q.section:'overview') as StudioView;const initial=await studioData(new URLSearchParams({view:section==='create'?'overview':section}));return <main id="main" className="page content-page admin-page"><AdminDashboard initial={initial} initialView={section} name={u.fullName||'Sina'}/></main>}
