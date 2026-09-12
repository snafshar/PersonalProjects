import type {MetadataRoute} from 'next';
import {origin,publicPhotos} from '@/lib/server';
export const dynamic='force-dynamic';
export default async function sitemap():Promise<MetadataRoute.Sitemap>{const {photos}=await publicPhotos();return [{url:origin(),changeFrequency:'weekly',priority:1},{url:origin()+'/originals',changeFrequency:'weekly',priority:.8},{url:origin()+'/custom-orders',changeFrequency:'monthly',priority:.8},{url:origin()+'/lab',changeFrequency:'monthly',priority:.8},...photos.map(p=>({url:origin()+'/journal/'+p.slug,lastModified:p.created_at,changeFrequency:'monthly' as const,priority:.7}))]}
