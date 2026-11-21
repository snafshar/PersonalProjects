import { defaultSettings as defaults, settingsGroups as groups } from "../public/press/site-theme.mjs";
import { fail, plain } from "./store";
import type { Bindings } from "./types";

export type SiteSettings = {
  revision:number;
  name:string; tagline:string; author:string; location:string; description:string; footerText:string;
  background:string; nameColor:string; textColor:string; mutedColor:string; linkColor:string; dividerColor:string;
  nameFont:string; nameSize:number; excerptSize:number;
  contentWidth:number; postSpacing:number; postsPerPage:number; photoLayout:string; photoStyle:string;
  showCaptions:boolean; showLocations:boolean; showDates:boolean; showAuthor:boolean; showSeparators:boolean;
  menuAbout:boolean; menuNews:boolean; menuContact:boolean; contactForm:boolean;
};
type SettingField = {
  name:string; label:string; type:string; value:string|number|boolean;
  maxLength?:number; required?:boolean; min?:number; max?:number; options?:string[][];
};
export const settingsGroups:{title:string;fields:SettingField[]}[]=groups;
export const defaultSettings=defaults as SiteSettings;

export function validateSettings(input:unknown):SiteSettings {
  if(!input||typeof input!=="object")return fail(422,"Check the site settings.");
  const raw=input as Record<string,unknown>;
  if(typeof raw.revision!=="number"||!Number.isSafeInteger(raw.revision)||raw.revision<0||raw.revision>2147483646)fail(422,"Reload the settings before saving.");
  const values:Record<string,unknown>={revision:raw.revision};
  for(const group of settingsGroups)for(const field of group.fields){
    const value=raw[field.name];
    if(field.type==="checkbox"){
      if(typeof value!=="boolean")fail(422,`Check ${field.label.toLowerCase()}.`);
      values[field.name]=value;
    }else if(field.type==="number"){
      if(typeof value!=="number"||!Number.isSafeInteger(value)||value<field.min!||value>field.max!)fail(422,`${field.label} must be between ${field.min} and ${field.max}.`);
      values[field.name]=value;
    }else{
      const text=plain(value,field.maxLength||100,field.label.toLowerCase()).trim();
      if(field.required&&!text)fail(422,`Enter ${field.label.toLowerCase()}.`);
      if(field.type==="color"&&!/^#[a-f\d]{6}$/i.test(text))fail(422,`Use a six-digit hex colour for ${field.label.toLowerCase()}.`);
      if(field.type==="select"&&!field.options?.some(([key])=>key===text))fail(422,`Choose a valid ${field.label.toLowerCase()}.`);
      values[field.name]=field.type==="color"?text.toLowerCase():text;
    }
  }
  return values as SiteSettings;
}

export async function siteSettings(env:Bindings):Promise<SiteSettings> {
  const value=await env.DB.prepare("SELECT value FROM journal_settings WHERE name='site_settings'").first<string>("value");
  return value?validateSettings({...defaultSettings,...JSON.parse(value)}):{...defaultSettings};
}

export async function saveSiteSettings(env:Bindings,input:unknown):Promise<SiteSettings> {
  const settings=validateSettings(input),revision=settings.revision;
  settings.revision++;
  const serialized=JSON.stringify(settings);
  const query=revision===0
    ?env.DB.prepare("INSERT INTO journal_settings(name,value) VALUES('site_settings',?) ON CONFLICT(name) DO NOTHING").bind(serialized)
    :env.DB.prepare("UPDATE journal_settings SET value=? WHERE name='site_settings' AND json_extract(value,'$.revision')=?").bind(serialized,revision);
  const result=await query.run();
  if(result.meta.changes!==1){
    const current=await env.DB.prepare("SELECT value FROM journal_settings WHERE name='site_settings'").first<string>("value");
    if(current!==serialized)fail(409,"The settings changed in another tab. Copy your changes before reloading.");
  }
  return settings;
}
