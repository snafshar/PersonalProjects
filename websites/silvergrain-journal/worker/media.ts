import type { Asset, Bindings } from "./types";
import { fail, isOwner } from "./store";

const limits:Record<string,number>={"image/jpeg":16,"image/png":16,"image/webp":16,"video/mp4":80,"video/webm":80};
function matches(bytes:Uint8Array,mime:string){
  const ascii=(start:number,len:number)=>String.fromCharCode(...bytes.slice(start,start+len));
  if(mime==="image/jpeg")return bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
  if(mime==="image/png")return ascii(0,8)==="\x89PNG\r\n\x1a\n";
  if(mime==="image/webp")return ascii(0,4)==="RIFF"&&ascii(8,4)==="WEBP";
  if(mime==="video/mp4")return ascii(4,4)==="ftyp";
  return bytes[0]===26&&bytes[1]===69&&bytes[2]===223&&bytes[3]===163;
}
export async function upload(req:Request,env:Bindings):Promise<Asset>{
  const mime=(req.headers.get("content-type")||"").split(";")[0].toLowerCase();
  if(!limits[mime])return fail(415,"Choose a JPEG, PNG, WebP, MP4, or WebM file.");
  const bytes=Number(req.headers.get("content-length")||req.headers.get("x-file-size"));
  if(!Number.isSafeInteger(bytes)||bytes<=0)return fail(411,"The file length is missing.");
  if(bytes>limits[mime]*1024*1024)return fail(413,`This file exceeds the ${limits[mime]} MB limit.`);
  const u=new URL(req.url), width=Number(u.searchParams.get("width")),height=Number(u.searchParams.get("height"));
  if(!Number.isInteger(width)||width<1||width>50000||!Number.isInteger(height)||height<1||height>50000)return fail(422,"The media dimensions could not be read.");
  const rawName=u.searchParams.get("name")||"Untitled",name=rawName.replace(/[\x00-\x1f\x7f]/g,"").slice(0,180)||"Untitled";
  const id="m-"+crypto.randomUUID(),key="media/"+id,kind=mime.startsWith("video/")?"video":"image";
  if(!req.body)return fail(400,"No file was received.");
  // Preserve streaming throughout the upload, including requests without an HTTP content length.
  const pipe=new FixedLengthStream(bytes);
  const streaming=req.body.pipeTo(pipe.writable);
  try {
    const outcomes = await Promise.allSettled([
      env.BUCKET.put(key, pipe.readable, {httpMetadata:{contentType:mime}}),
      streaming,
    ]);
    const rejected = outcomes.find(outcome => outcome.status === "rejected");
    if (rejected?.status === "rejected") throw rejected.reason;
    const head=await env.BUCKET.get(key,{range:{offset:0,length:Math.min(bytes,64)}});
    if(!head || !matches(new Uint8Array(await head.arrayBuffer()),mime))fail(415,"The file contents do not match its stated format.");
    await env.DB.prepare("INSERT INTO journal_media(id,name,kind,mime,width,height,bytes,created) VALUES(?,?,?,?,?,?,?,?)").bind(id,name,kind,mime,width,height,bytes,Date.now()).run();
  }catch(err){await env.BUCKET.delete(key);throw err;}
  return {id,name,kind,width,height,url:"/media/"+id,thumb:"/media/"+id,alt:""};
}
export async function serveMedia(req:Request,env:Bindings,id:string):Promise<Response> {
  const exposed=await env.DB.prepare("SELECT 1 AS ok FROM journal_entries WHERE live IS NOT NULL AND (json_extract(live,'$.cover')=? OR EXISTS (SELECT 1 FROM json_each(json_extract(live,'$.frames')) f WHERE json_extract(f.value,'$.asset')=?)) LIMIT 1").bind(id,id).first();
  if(!exposed && !await isOwner(req,env))return fail(404,"Page not found.");
  const meta=await env.DB.prepare("SELECT bytes,mime FROM journal_media WHERE id=?").bind(id).first<{bytes:number;mime:string}>();
  if(!meta)return fail(404,"Page not found.");
  const headers=new Headers({"Content-Type":meta.mime,"Accept-Ranges":"bytes","Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"});
  const range=req.headers.get("range");let offset=0,end=meta.bytes-1;
  if(range){
    const m=/^bytes=(\d*)-(\d*)$/.exec(range);
    if(!m || (!m[1]&&!m[2])){headers.set("Content-Range","bytes */"+meta.bytes);return new Response(null,{status:416,headers});}
    offset=m[1]?Number(m[1]):Math.max(0,meta.bytes-Number(m[2]));end=m[1]&&m[2]?Math.min(Number(m[2]),end):end;
    if(offset>end||offset>=meta.bytes){headers.set("Content-Range","bytes */"+meta.bytes);return new Response(null,{status:416,headers});}
    headers.set("Content-Range",`bytes ${offset}-${end}/${meta.bytes}`);
  }
  const len=end-offset+1;headers.set("Content-Length",String(len));
  if(req.method==="HEAD")return new Response(null,{status:range?206:200,headers});
  const object=await env.BUCKET.get("media/"+id,range?{range:{offset,length:len}}:undefined);
  if(!object)return fail(404,"Page not found.");
  return new Response(object.body,{status:range?206:200,headers});
}
