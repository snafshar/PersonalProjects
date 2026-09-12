import {getChatGPTUser} from '@/app/chatgpt-auth';
import {db} from '@/lib/server';
import {presetInput} from '@/lib/validation';
import {PhotoLab} from '@/components/photo-lab';
export const dynamic='force-dynamic';
export const metadata={title:'Photo Lab — camera settings & exposure calculator',description:'Plan your camera settings for 26 photographic scenarios. Explore aperture, shutter speed, ISO, focus, lighting and the exposure triangle.',alternates:{canonical:'/lab'}};
export default async function LabPage({searchParams}:{searchParams:Promise<{preset?:string}>}){const u=await getChatGPTUser();const q=await searchParams;let initial;if(u&&q.preset){const p=await db().prepare('SELECT name,data FROM presets WHERE id=? AND user_id=?').bind(q.preset,u.userId).first<{name:string;data:string}>();if(p){const parsed=presetInput.safeParse({name:p.name,data:JSON.parse(p.data)});if(parsed.success)initial=parsed.data.data}}
return <main id="main" className="page content-page"><header className="page-heading"><div><p className="eyebrow">FramePilot + Exposure Lab</p><h1>The Photo <em>Lab.</em></h1><p>Start with the scene. Understand your settings. Make the photograph yours.</p></div></header><PhotoLab signedIn={!!u} initial={initial}/></main>}
