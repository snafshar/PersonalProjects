import type {MetadataRoute} from 'next';
import {origin} from '@/lib/server';
export default function robots():MetadataRoute.Robots{return {rules:{userAgent:'*',allow:'/',disallow:['/api/','/dashboard','/studio','/account','/signin-with-chatgpt','/signout-with-chatgpt','/journal/sample-']},sitemap:origin()+'/sitemap.xml'}}
