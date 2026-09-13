export type Adjustments={exposure:number;contrast:number;highlights:number;shadows:number;temperature:number;tint:number;vibrance:number;saturation:number;sharpness:number;noise:number;vignette:number;grain:number};
export const neutral:Adjustments={exposure:0,contrast:0,highlights:0,shadows:0,temperature:0,tint:0,vibrance:0,saturation:0,sharpness:0,noise:0,vignette:0,grain:0};
export type PhotoPreset={id:string;name:string;group:string;description:string;settings:Partial<Adjustments>;fade?:number;mono?:number;shadowsRGB?:[number,number,number];highlightsRGB?:[number,number,number]};
export const photoPresets:PhotoPreset[]=[
{id:'clean',name:'Clean light',group:'Everyday',description:'A gentle lift, natural colour and a little definition.',settings:{exposure:.12,contrast:6,shadows:12,vibrance:10,sharpness:12}},
{id:'balanced',name:'Balanced range',group:'Everyday',description:'Open shadows and soften bright areas.',settings:{contrast:8,shadows:35,highlights:-35,vibrance:8}},
{id:'crisp',name:'Crisp detail',group:'Everyday',description:'Local edge definition with restrained colour.',settings:{contrast:10,sharpness:55,vibrance:8,noise:8}},
{id:'soft-noise',name:'Quiet detail',group:'Everyday',description:'Gentle, edge-aware smoothing for visible pixel noise.',settings:{noise:65,sharpness:12,shadows:10,saturation:-3}},
{id:'portrait',name:'Natural portrait',group:'Portrait',description:'Soft contrast, open shadows and subtle warmth.',settings:{contrast:-8,shadows:18,highlights:-15,temperature:8,noise:18,vibrance:5}},
{id:'warm-skin',name:'Warm portrait',group:'Portrait',description:'Warm midtones with a soft highlight roll-off.',settings:{temperature:23,tint:5,contrast:-5,highlights:-22,shadows:12,saturation:-4}},
{id:'studio',name:'Studio light',group:'Portrait',description:'Bright, neutral tones with clean definition.',settings:{exposure:.2,contrast:10,highlights:-12,shadows:8,sharpness:20}},
{id:'soft-editorial',name:'Soft editorial',group:'Portrait',description:'Lifted blacks and muted colour for a quiet portrait.',settings:{contrast:-12,saturation:-14,temperature:5,highlights:-18},fade:6},
{id:'landscape',name:'Landscape clarity',group:'Landscape',description:'Defined textures and fuller, controlled colour.',settings:{contrast:18,shadows:20,highlights:-26,vibrance:24,sharpness:34}},
{id:'forest',name:'Forest shade',group:'Landscape',description:'Cool shadows, rich greens and preserved highlights.',settings:{temperature:-8,tint:-12,vibrance:18,shadows:24,highlights:-18,contrast:10},shadowsRGB:[-.012,.012,.005]},
{id:'coast',name:'Coastal blue',group:'Landscape',description:'Cool, clear water tones and bright midtones.',settings:{temperature:-20,contrast:12,exposure:.08,vibrance:24,highlights:-12}},
{id:'golden',name:'Golden hour',group:'Landscape',description:'Amber light, soft shadows and gentle contrast.',settings:{temperature:34,tint:6,shadows:14,contrast:7,highlights:-18},highlightsRGB:[.028,.01,-.012]},
{id:'warm-film',name:'Warm film',group:'Film',description:'Warm highlights, lifted blacks and fine grain.',settings:{temperature:16,contrast:9,saturation:-12,grain:15},fade:5,shadowsRGB:[-.01,.006,.025]},
{id:'chrome',name:'Street chrome',group:'Film',description:'Crisp contrast, cool shadows and warm highlights.',settings:{contrast:25,saturation:-16,sharpness:18,grain:12},shadowsRGB:[-.02,.006,.035],highlightsRGB:[.025,.006,-.012]},
{id:'matte',name:'Matte colour',group:'Film',description:'Soft blacks and restrained colour with a matte curve.',settings:{contrast:6,saturation:-20,highlights:-20,grain:9},fade:12},
{id:'faded',name:'Faded afternoon',group:'Film',description:'A warm, faded print with subtle grain.',settings:{temperature:22,saturation:-28,contrast:-14,grain:18},fade:9,highlightsRGB:[.02,.012,-.02]},
{id:'silver',name:'Silver monochrome',group:'Monochrome',description:'A balanced black-and-white conversion with fine detail.',settings:{contrast:15,sharpness:22,shadows:12},mono:1},
{id:'dramatic-bw',name:'Dramatic monochrome',group:'Monochrome',description:'Deep contrast, defined edges and darker corners.',settings:{contrast:38,highlights:-12,sharpness:35,vignette:25},mono:1},
{id:'soft-bw',name:'Soft silver',group:'Monochrome',description:'Open, low-contrast black and white with lifted blacks.',settings:{contrast:-12,shadows:25,highlights:-20,grain:14},mono:1,fade:7},
{id:'sepia',name:'Sepia print',group:'Monochrome',description:'A monochrome base toned with warm brown highlights.',settings:{contrast:12,grain:14,vignette:15},mono:1,fade:4,shadowsRGB:[.02,.003,-.014],highlightsRGB:[.09,.025,-.05]},
{id:'night-city',name:'Night city',group:'Low light',description:'Controlled lights, cool shadows and richer colour.',settings:{highlights:-42,shadows:18,contrast:20,temperature:-12,vibrance:18,noise:24},shadowsRGB:[-.012,.005,.025]},
{id:'moon',name:'Lunar detail',group:'Low light',description:'Neutral colour, restrained brightness and strong edge detail.',settings:{contrast:28,highlights:-25,sharpness:58,saturation:-35,noise:12}},
{id:'blue-hour',name:'Blue hour',group:'Low light',description:'Cool blue light with lifted midtones and gentle grain.',settings:{exposure:.12,temperature:-28,tint:8,shadows:20,highlights:-18,grain:7}},
{id:'available-light',name:'Available light',group:'Low light',description:'Brighter shadows, gentle smoothing and warmer colour.',settings:{exposure:.25,shadows:28,highlights:-24,temperature:9,noise:40,sharpness:14}}
];
export const adjustmentControls:{key:keyof Adjustments;label:string;min:number;max:number;step:number}[]=[
{key:'exposure',label:'Exposure',min:-2,max:2,step:.05},{key:'contrast',label:'Contrast',min:-50,max:60,step:1},{key:'highlights',label:'Highlights',min:-100,max:100,step:1},{key:'shadows',label:'Shadows',min:-100,max:100,step:1},{key:'temperature',label:'Warmth',min:-100,max:100,step:1},{key:'tint',label:'Tint',min:-100,max:100,step:1},{key:'vibrance',label:'Vibrance',min:-100,max:100,step:1},{key:'saturation',label:'Saturation',min:-100,max:100,step:1},{key:'sharpness',label:'Sharpening',min:0,max:100,step:1},{key:'noise',label:'Noise smoothing',min:0,max:100,step:1},{key:'vignette',label:'Vignette',min:0,max:100,step:1},{key:'grain',label:'Grain',min:0,max:50,step:1}
];
export type EditRecipe={version:1;presetId:string;strength:number;adjustments:Adjustments};
export function parseRecipe(value:unknown):EditRecipe{
 if(!value||typeof value!=='object')throw new Error('Choose a Photo Lab settings file.');
 const v=value as Record<string,unknown>;
 if(v.version!==1||typeof v.presetId!=='string'||!(v.presetId==='original'||photoPresets.some(p=>p.id===v.presetId))||typeof v.strength!=='number'||!Number.isFinite(v.strength)||v.strength<0||v.strength>100||!v.adjustments||typeof v.adjustments!=='object')throw new Error('This settings file is not supported.');
 const a={...neutral};for(const c of adjustmentControls){const n=(v.adjustments as Record<string,unknown>)[c.key];if(typeof n!=='number'||!Number.isFinite(n)||n<c.min||n>c.max)throw new Error('The settings file contains an invalid adjustment.');a[c.key]=n;}
 return {version:1,presetId:v.presetId,strength:v.strength,adjustments:a};
}
const clamp=(v:number,min=0,max=1)=>Math.max(min,Math.min(max,v));
const linear=(v:number)=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4;
const encoded=(v:number)=>v<=.0031308?v*12.92:1.055*v**(1/2.4)-.055;
/** Deterministic sRGB pixel processing. The same engine powers thumbnails, previews and tiled exports. */
export function renderPhotoPixels(source:Uint8ClampedArray,width:number,height:number,recipe:EditRecipe,offsetY=0,fullHeight=height):Uint8ClampedArray{
 if(source.length!==width*height*4||width<1||height<1)throw new Error('Invalid image dimensions.');
 const p=photoPresets.find(p=>p.id===recipe.presetId),strength=clamp(recipe.strength/100),a={...neutral};
 for(const c of adjustmentControls)a[c.key]=clamp((p?.settings[c.key]||0)*strength+recipe.adjustments[c.key],c.min,c.max);
 const mono=(p?.mono||0)*strength,fade=(p?.fade||0)*strength/100;
 const lut=new Float32Array(256),exposure=2**a.exposure,contrast=1+a.contrast/100;
 for(let i=0;i<256;i++){
  let x=encoded(linear(i/255)*exposure);
  x+=a.shadows/100*.75*x*(1-clamp(x))**3+a.highlights/100*.22*clamp(x)**3;
  x=(x-.5)*contrast+.5;x=x+(1-x)*fade;lut[i]=x;
 }
 const out=new Uint8ClampedArray(source.length),denoise=a.noise/100,sharp=a.sharpness/100;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=(y*width+x)*4;out[i+3]=source[i+3];if(source[i+3]===0){out[i]=source[i];out[i+1]=source[i+1];out[i+2]=source[i+2];continue;}
  let r=source[i],g=source[i+1],b=source[i+2],detail=0;
  if(denoise||sharp){
   let sr=0,sg=0,sb=0,weight=0,blur=0,count=0;
   for(let k=0;k<4;k++){
    const j=k===0?i-4:k===1?i+4:k===2?i-width*4:i+width*4;
    if(j<0||j>=source.length||source[j+3]===0||(j===i-4&&x===0)||(j===i+4&&x===width-1))continue;
    const d=(Math.abs(r-source[j])+Math.abs(g-source[j+1])+Math.abs(b-source[j+2]))/3;
    const w=Math.exp(-d*d/450);sr+=source[j]*w;sg+=source[j+1]*w;sb+=source[j+2]*w;weight+=w;
    blur+=source[j]*.2126+source[j+1]*.7152+source[j+2]*.0722;count++;
   }
   if(weight){r+=(sr/weight-r)*denoise*.7;g+=(sg/weight-g)*denoise*.7;b+=(sb/weight-b)*denoise*.7;}
   if(count)detail=((source[i]*.2126+source[i+1]*.7152+source[i+2]*.0722)-blur/count)/255*sharp*.7;
  }
  r=lut[Math.round(r)];g=lut[Math.round(g)];b=lut[Math.round(b)];
  const warmth=a.temperature/100,tint=a.tint/100;
  r+=warmth*.09+tint*.025;g-=tint*.05;b-=warmth*.09;
  const luma=r*.2126+g*.7152+b*.0722,chroma=Math.max(r,g,b)-Math.min(r,g,b);
  const skin=r>g&&g>b&&r-b<.45?.65:1;
  const sat=Math.max(0,1+a.saturation/100+a.vibrance/100*(1-clamp(chroma))*skin);
  r=luma+(r-luma)*sat*(1-mono);g=luma+(g-luma)*sat*(1-mono);b=luma+(b-luma)*sat*(1-mono);
  const low=(1-clamp(luma))**2,high=clamp(luma)**2;
  r+=((p?.shadowsRGB?.[0]||0)*low+(p?.highlightsRGB?.[0]||0)*high)*strength;
  g+=((p?.shadowsRGB?.[1]||0)*low+(p?.highlightsRGB?.[1]||0)*high)*strength;
  b+=((p?.shadowsRGB?.[2]||0)*low+(p?.highlightsRGB?.[2]||0)*high)*strength;
  const dx=(x+.5)/width*2-1,dy=(y+offsetY+.5)/fullHeight*2-1;
  const shade=1-a.vignette/100*.6*clamp((dx*dx+dy*dy)/2)**1.4;
  let hash=Math.imul(x+1,374761393)^Math.imul(y+offsetY+1,668265263);hash=Math.imul(hash^(hash>>>13),1274126177);
  const grain=(((hash^(hash>>>16))>>>0)/4294967295-.5)*a.grain/100*.18;
  out[i]=(r*shade+detail+grain)*255;out[i+1]=(g*shade+detail+grain)*255;out[i+2]=(b*shade+detail+grain)*255;
 }
 return out;
}
