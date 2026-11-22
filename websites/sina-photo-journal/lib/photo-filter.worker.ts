import {renderPhotoPixels,photoPresets,neutral,type EditRecipe} from './photo-filters';
self.onmessage=(event:MessageEvent<{id:number;data:Uint8ClampedArray;width:number;height:number;recipe:EditRecipe;offsetY?:number;fullHeight?:number;thumbnails?:boolean}>)=>{
 const m=event.data;
 try{
  if(m.thumbnails){const results=photoPresets.map(p=>({id:p.id,data:renderPhotoPixels(m.data,m.width,m.height,{version:1,presetId:p.id,strength:100,adjustments:neutral})}));self.postMessage({id:m.id,thumbnails:results}, {transfer:results.map(r=>r.data.buffer)});}
  else {const data=renderPhotoPixels(m.data,m.width,m.height,m.recipe,m.offsetY,m.fullHeight);self.postMessage({id:m.id,data},{transfer:[data.buffer]});}
 }catch(error){self.postMessage({id:m.id,error:error instanceof Error?error.message:'Could not process this photograph.'});}
};
