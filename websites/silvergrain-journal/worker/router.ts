import {aboutPage, archive, article, contactPage, home, missing, newsPage} from "./views/readers";
import {acceptLetter, challenge, contactInput, inbox} from "./letters";
import {aboutEditor,editorPage,inboxPage,mediaPage,overview,settingsPage} from "./views/studio";
import {about,contacts,editable,fail,gallery,isOwner,jsonInput,liveEntries,liveEntry,neighbors,Problem,saveAbout,saveContacts,saveEntry,usedGallery,usedIds,validId,verifyWrite} from "./store";
import {serveMedia,upload} from "./media";
import type {Bindings} from "./types";
import studioCode from "../studio/editor.mjs?raw";
const policy="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; media-src 'self' blob:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'";
const headers=(privatePage=false)=>({"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff","Referrer-Policy":"strict-origin-when-cross-origin","Content-Security-Policy":policy+(privatePage?"; frame-ancestors 'self' https://chatgpt.com":""),...(privatePage?{"X-Robots-Tag":"noindex, nofollow, noarchive","Vary":"Cookie"}:{})});
const html=(s:string,status=200,priv=false)=>new Response(s,{status,headers:{...headers(priv),"Content-Type":"text/html; charset=utf-8"}});
const data=(v:unknown,status=200)=>Response.json(v,{status,headers:headers(true)});
export async function journal(req:Request,env:Bindings):Promise<Response>{
  const url=new URL(req.url),path=url.pathname.replace(/\/$/,"")||"/",priv=path==="/cntrladmin"||path.startsWith("/cntrladmin/"),api=path.startsWith("/cntrladmin/api/");
  try {
    if(priv){
      if(!await isOwner(req,env)){
        if(!req.headers.get("oai-authenticated-user-id")&&req.method==="GET"&&path==="/cntrladmin")return new Response(null,{status:302,headers:{...headers(true),Location:"/signin-with-chatgpt?return_to=%2Fcntrladmin"}});
        return api?data({error:"Page not found."},404):html(missing(),404,true);
      }
      if(api){
        if(req.method!=="POST")return data({error:"Method not allowed."},405);
        verifyWrite(req);
        if(path==="/cntrladmin/api/entry")return data(await saveEntry(env,await jsonInput(req)));
        if(path==="/cntrladmin/api/contacts")return data(await saveContacts(env,await jsonInput(req)));
        if(path==="/cntrladmin/api/about")return data(await saveAbout(env,await jsonInput(req)));
        if(path==="/cntrladmin/api/media")return data(await upload(req,env),201);
        return data({error:"Page not found."},404);
      }
      if(req.method!=="GET")return html(missing(),405,true);
      if(path==="/cntrladmin/studio.mjs")return new Response(studioCode,{headers:{...headers(true),"Content-Type":"text/javascript; charset=utf-8"}});
      if(path==="/cntrladmin"||path==="/cntrladmin/news")return html(overview(await editable(env),path==="/cntrladmin/news"),200,true);
      if(path==="/cntrladmin/about")return html(aboutEditor(await about(env)),200,true);
      if(path==="/cntrladmin/contacts")return html(settingsPage(await contacts(env)),200,true);
      if(path==="/cntrladmin/inbox"){
        const before=Number(url.searchParams.get("before")||Number.MAX_SAFE_INTEGER);
        if(!Number.isSafeInteger(before)||before<1)return html(missing(),404,true);
        return html(inboxPage(await inbox(env,before)),200,true);
      }
      if(path==="/cntrladmin/gallery")return html(mediaPage(await gallery(env)),200,true);
      if(path==="/cntrladmin/new")return html(editorPage(null,await gallery(env),url.searchParams.get("section")==="news"),200,true);
      const match=/^\/cntrladmin\/(edit|preview)\/([a-z0-9-]+)$/.exec(path);
      if(match){const row=(await editable(env)).find(r=>r.id===match[2]);if(!row)return html(missing(),404,true);
        if(match[1]==="edit")return html(editorPage(row,await gallery(env)),200,true);
        return html(article(row.draft,await usedGallery(env,usedIds(row.draft)),true),200,true);}
      return html(missing(),404,true);
    }
    if(path==="/contact" && req.method==="POST"){
      const form=await contactInput(req);
      try { await acceptLetter(req,env,form); }
      catch(err){
        if(!(err instanceof Problem))throw err;
        return html(contactPage(await contacts(env),await challenge(env),false,err.message,form),err.status);
      }
      return new Response(null,{status:303,headers:{...headers(),Location:"/contact?sent=1#letter-heading"}});
    }
    if(req.method!=="GET" && req.method!=="HEAD")return html(missing(),405);
    if(path.startsWith("/media/")){const id=path.slice(7);if(!validId(id))fail(404,"Page not found.");return await serveMedia(req,env,id);}
    if(path==="/robots.txt")return new Response("User-agent: *\nAllow: /\n",{headers:{"Content-Type":"text/plain"}});
    if(path==="/contact")return html(contactPage(await contacts(env),await challenge(env),url.searchParams.get("sent")==="1"));
    if(path==="/about")return html(aboutPage(await about(env)));
    if(path==="/news")return html(newsPage((await liveEntries(env)).filter(d=>d.section==="news"),url));
    if(path==="/"||path==="/archive"){
      const posts=(await liveEntries(env)).filter(d=>d.section!=="news"),assets=await usedGallery(env,posts.map(p=>p.cover));
      if(path==="/archive")return html(archive(posts,assets,url));
      return html(home(posts,assets,await contacts(env),Math.max(1,parseInt(url.searchParams.get("page")||"1")||1)));
    }
    if(path.startsWith("/story/")||path.startsWith("/news/")){
      const section=path.startsWith("/news/")?"news":"journal";
      const id=path.slice(section==="news"?6:7);
      if(!validId(id))return html(missing(),404);
      const doc=await liveEntry(env,id);
      return doc&&(doc.section||"journal")===section?html(article(doc,await usedGallery(env,usedIds(doc)),false,await neighbors(env,id,section))):html(missing(),404);
    }
    return html(missing(),404);
  }catch(err){
    if(err instanceof Problem)return api?data({error:err.message},err.status):html(missing(),err.status,priv);
    console.error("Journal request failed",err instanceof Error?err.name+": "+err.message:"Unrecognized error");
    return api?data({error:"Could not complete the request. Your edits are still here."},503):new Response("The journal is temporarily unavailable. Please try again.",{status:503,headers:headers(priv)});
  }
}
