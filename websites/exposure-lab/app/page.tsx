"use client";
import { useMemo, useState } from "react";
const apertures=[1.4,2,2.8,4,5.6,8,11,16];
const shutters=[1/4000,1/2000,1/1000,1/500,1/250,1/125,1/60,1/30,1/15,1/8,1/4,1/2,1];
const isos=[100,200,400,800,1600,3200,6400];
const presets=[{name:"Portrait",aperture:1.4,shutter:1/250,iso:400,focal:85},{name:"Street",aperture:4,shutter:1/500,iso:800,focal:35},{name:"Landscape",aperture:8,shutter:1/60,iso:100,focal:24},{name:"Action",aperture:2.8,shutter:1/2000,iso:1600,focal:200}];
const shutterLabel=(value:number)=>value>=1?`${value}s`:`1/${Math.round(1/value)}s`;
export default function Home(){
 const[aperture,setAperture]=useState(2.8),[shutter,setShutter]=useState(1/250),[iso,setIso]=useState(400),[focal,setFocal]=useState(85);
 const ev=useMemo(()=>Math.log2((aperture*aperture)/shutter)-Math.log2(iso/100),[aperture,shutter,iso]);
 const handheld=shutter>=1/Math.max(focal,1),light=ev<4?"Low light":ev<9?"Indoor / shade":ev<14?"Daylight":"Bright light";
 const apply=(p:typeof presets[number])=>{setAperture(p.aperture);setShutter(p.shutter);setIso(p.iso);setFocal(p.focal)};
 return <main><header><a className="logo" href="#top"><span>EL</span> Exposure Lab</a><nav><a href="#calculator">Calculator</a><a href="#guide">Guide</a></nav></header>
 <section className="hero" id="top"><div><p className="kicker">Interactive photography tool</p><h1>Balance light, motion, and depth—before the shutter clicks.</h1><p className="lead">A visual exposure planner for photographers who want to understand the trade-offs behind every setting.</p><a className="cta" href="#calculator">Open calculator <span>↘</span></a></div><div className="dial-card"><div className="dial"><div><small>Exposure value</small><strong>{ev.toFixed(1)}</strong><span>EV at ISO 100</span></div></div><div className="readout"><span>{light}</span><b>{handheld?"Handheld-friendly":"Stabilise camera"}</b></div></div></section>
 <section className="calculator" id="calculator"><div className="section-title"><p className="kicker">Exposure triangle</p><h2>Shape the photograph.</h2><p>Adjust one setting and watch the exposure guidance respond instantly.</p></div><div className="workspace"><div className="controls">
 <Control label="Aperture" value={`f/${aperture}`} hint="Depth of field"><input aria-label="Aperture" type="range" min="0" max={apertures.length-1} value={apertures.indexOf(aperture)} onChange={e=>setAperture(apertures[+e.target.value])}/><Scale left="Shallow" right="Deep"/></Control>
 <Control label="Shutter" value={shutterLabel(shutter)} hint="Motion rendering"><input aria-label="Shutter speed" type="range" min="0" max={shutters.length-1} value={shutters.indexOf(shutter)} onChange={e=>setShutter(shutters[+e.target.value])}/><Scale left="Freeze" right="Blur"/></Control>
 <Control label="ISO" value={`${iso}`} hint="Sensor sensitivity"><input aria-label="ISO" type="range" min="0" max={isos.length-1} value={isos.indexOf(iso)} onChange={e=>setIso(isos[+e.target.value])}/><Scale left="Clean" right="Grain"/></Control>
 <Control label="Focal length" value={`${focal}mm`} hint="Handheld guidance"><input aria-label="Focal length" type="range" min="16" max="600" value={focal} onChange={e=>setFocal(+e.target.value)}/><Scale left="Wide" right="Telephoto"/></Control>
 </div><aside className="result"><p>Current exposure</p><div className="triangle"><div><small>A</small><b>f/{aperture}</b></div><div><small>S</small><b>{shutterLabel(shutter)}</b></div><div><small>I</small><b>{iso}</b></div></div><hr/><dl><div><dt>Scene estimate</dt><dd>{light}</dd></div><div><dt>Handheld check</dt><dd className={handheld?"good":"warn"}>{handheld?"Likely stable":"Tripod or faster shutter"}</dd></div><div><dt>Suggested minimum</dt><dd>{shutterLabel(1/Math.max(focal,1))}</dd></div></dl></aside></div>
 <div className="presets"><p>Starting points</p>{presets.map(p=><button key={p.name} onClick={()=>apply(p)}><span>{p.name}</span><small>f/{p.aperture} · {shutterLabel(p.shutter)} · ISO {p.iso}</small></button>)}</div></section>
 <section className="guide" id="guide"><p className="kicker">The creative decision</p><h2>There is no “correct” exposure—only a deliberate one.</h2><div><article><span>01</span><h3>Choose the look</h3><p>Start with aperture for depth, or shutter speed for motion.</p></article><article><span>02</span><h3>Protect the shot</h3><p>Check focal length against shutter speed to reduce camera shake.</p></article><article><span>03</span><h3>Complete the balance</h3><p>Raise ISO only as far as the scene and your camera require.</p></article></div></section>
 <footer><span className="logo"><span>EL</span> Exposure Lab</span><p>Designed and implemented by Sina Afshar · Educational estimator</p></footer></main>
}
function Control({label,value,hint,children}:{label:string,value:string,hint:string,children:React.ReactNode}){return <section className="control"><div><div><p>{label}</p><small>{hint}</small></div><strong>{value}</strong></div>{children}</section>}
function Scale({left,right}:{left:string,right:string}){return <div className="scale"><span>{left}</span><span>{right}</span></div>}
