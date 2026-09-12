import {redirect} from 'next/navigation';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {AccountForm} from '@/components/account-form';
import {demoPhotos} from '@/lib/content';
export const metadata={title:'Sign in or join',robots:{index:false,follow:false}};
export const dynamic='force-dynamic';
export default async function Account(){if(await getChatGPTUser())redirect('/dashboard');return <main id="main" className="page"><div className="account-layout"><div className="account-art"><img src={demoPhotos[2].preview} alt="" /><p className="eyebrow">The collector’s corner</p><h2>Some frames<br/>stay with you.</h2><p>Keep the ones that do.</p><p style={{fontSize:'.7rem',marginTop:25}}>AI-generated sample image</p></div><AccountForm/></div></main>}
