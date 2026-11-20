import {test} from "node:test";
import assert from "node:assert/strict";
import {layoutHistory} from "../public/press/layout-history.mjs";
import {prepare,paginate,WIDTH,HEIGHT,GUTTER,openIntervals,resizeFrame} from "../public/press/composition.mjs";
const measure=(text,font)=>Array.from(text).length*(font.includes("13px")?6.5:8.2);
const body=[{kind:"p",runs:[{text:Array.from({length:3200},(_,i)=>"word"+i).join(" ")}]}];
const frame={id:"test",asset:"alpine-lake",page:0,x:370,y:110,w:220,h:159,caption:"A caption long enough to use more than one line below the photograph.",overlay:"Over the water",alt:"A lake",overlayAt:"top"};
for(const cols of [1,2,3,4])test("long justified story kept intact in "+cols+" column(s) around media",()=>{
  const doc={columns:cols,body,align:"justify",frames:[frame],pages:1};
  const pages=paginate(doc,prepare(body,measure),measure);assert.ok(pages.length>1);
  assert.equal(pages.flatMap(p=>p.lines.flatMap(l=>l.pieces.map(r=>r.text).join("").split(" "))).join(" "),body[0].runs[0].text);
  const box=pages[0].frames[0];assert.ok(box.totalH>box.h+18);
  for(const p of pages)for(const l of p.lines){
    assert.ok(l.x>=0&&l.x+l.room<=WIDTH+.001&&l.y+l.line<=HEIGHT);
    const intersects=l.x<box.x+box.w&&l.x+l.room>box.x&&l.y<box.y+box.totalH&&l.y+l.line>box.y;
    if(p===pages[0])assert.equal(intersects,false);
  }
  if(cols===2){
    const colW=(WIDTH-GUTTER)/2;
    assert.ok(box.x<colW&&box.x+box.w>colW+GUTTER);
    assert.ok(pages[0].lines.some(l=>l.y>=box.y&&l.y<box.y+box.h&&l.x===0&&l.room<colW));
    assert.ok(pages[0].lines.some(l=>l.y>=box.y&&l.y<box.y+box.h&&l.x>colW+GUTTER));
  }
});
test("overlapping exclusions and a central photo leave both text strips available",()=>{
  let holes=openIntervals(0,960,100,28,[{x:300,y:40,w:280,totalH:180},{x:500,y:60,w:130,totalH:110}]);
  assert.deepEqual(holes,[[0,288],[642,960]]);
});
test("mixed formatting, long unbroken words and a late media-only sheet survive pagination",()=>{
  const body=[{kind:"h2",runs:[{text:"Al",bold:true},{text:"pine",italic:true}]},{kind:"p",runs:[{text:"x".repeat(780)}]}];
  const doc={columns:4,frames:[{...frame,page:3}],pages:1,body};
  const result=paginate(doc,prepare(body,measure),measure);assert.equal(result.length,4);
  assert.equal(result.flatMap(p=>p.lines).flatMap(l=>l.pieces).map(r=>r.text).join(""),"Alpine"+"x".repeat(780));
  assert.equal(result[0].lines[0].pieces[1].italic,true);
  assert.equal(result[3].frames[0].id,"test");
});

test("a continuous frame edit undoes in one step without altering separately edited text",()=>{
  const doc={frames:[{...frame}],pages:1,columns:2,align:"justify",body:[]};
  const undo=layoutHistory(doc);
  doc.frames[0].x=340; undo.record("drag");
  doc.frames[0].x=315; undo.record("drag"); undo.end();
  doc.body.push({kind:"p",runs:[{text:"Keep this edit."}]});
  doc.columns=4; undo.record();
  assert.ok(undo.undo()); assert.equal(doc.columns,2); assert.equal(doc.frames[0].x,315);
  assert.ok(undo.undo()); assert.equal(doc.frames[0].x,frame.x); assert.ok(!undo.canUndo);
  assert.ok(undo.redo()); assert.equal(doc.frames[0].x,315);
  assert.equal(doc.body[0].runs[0].text,"Keep this edit.");
  doc.align="center"; undo.record(); assert.ok(!undo.canRedo);
});
test("free and proportional resize respect page limits",()=>{
  const box={x:540,y:490,w:240,h:120};
  assert.deepEqual(resizeFrame(box,80,10),{w:320,h:130});
  assert.deepEqual(resizeFrame(box,80,10,true),{w:320,h:160});
  assert.deepEqual(resizeFrame(box,1000,800,true),{w:420,h:210});
});
