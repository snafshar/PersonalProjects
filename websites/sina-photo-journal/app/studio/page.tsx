import {requireChatGPTUser} from '@/app/chatgpt-auth';
import {db,isOwner,commerceStatus,photoColumns,mapPhoto} from '@/lib/server';
import {notFound} from 'next/navigation';
import {CustomOrdersPanel} from '@/components/custom-orders-panel';
import {Studio} from '@/components/studio';
export const dynamic='force-dynamic';
export const metadata={title:'Photographer studio',robots:{index:false,follow:false}};
export default function StudioPage(){return <StudioContent/>}
async function StudioContent(){const u=await requireChatGPTUser('/studio');if(!isOwner(u))notFound();const [photos,requests,customOrders]=await Promise.all([db().prepare(`SELECT ${photoColumns} FROM photos ORDER BY created_at DESC LIMIT 200`).all(),db().prepare('SELECT r.*,r.contact_email AS email FROM customer_requests r ORDER BY r.created_at DESC LIMIT 100').all(),db().prepare('SELECT * FROM custom_orders ORDER BY created_at DESC LIMIT 100').all()]);const status=commerceStatus();return <main id="main" className="page content-page"><header className="page-heading"><div><p className="eyebrow">Photographer dashboard</p><h1>Your <em>studio.</em></h1><p>Publish photographs, tell their stories and manage your original collection.</p></div></header><Studio photos={photos.results.map(mapPhoto)} requests={requests.results as never} missing={status.missing} enabled={status.enabled}/><CustomOrdersPanel orders={customOrders.results as never} owner/></main>}
