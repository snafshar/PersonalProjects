import type { Asset, Entry, Frame, Paragraph } from "./types";

const photo = (id: string, name: string, alt: string): Asset => ({
  id, name, kind:"image", width:1536, height:1024, alt,
  url:`/press/demo/${id}.webp`, thumb:`/press/demo/${id}-small.webp`,
});
export const sampleMedia = [
  photo("dolomites","Dolomites at dawn","Jagged mountain peaks above a valley filled with mist"),
  photo("arcade","Bologna portico","A small figure in a sequence of sunlit stone arches"),
  photo("coast","Ligurian coast","White surf against the rocks on the Ligurian coast"),
  photo("street","Tuscan street","A bicycle beside a stone wall on a narrow Italian street"),
  photo("alpine-lake","Alpine lake","Still water reflecting a mountain ridge and dark pines"),
];
const p = (text: string): Paragraph => ({ kind:"p", runs:[{text}] });
function sample(id:string,title:string,deck:string,category:string,location:string,date:string,cover:string,
  coverCaption:string,order:number,body:string[],picture?:{id:string;caption:string}):Entry {
  const media = sampleMedia.find(item=>item.id===cover)!;
  const frames:Frame[] = picture ? [{id:"sample-frame",asset:picture.id,page:0,x:315,y:100,w:335,h:184,
    caption:picture.caption,overlay:"",alt:sampleMedia.find(a=>a.id===picture.id)!.alt,overlayAt:"bottom"}] : [];
  return {id,title,deck,category,location,date,cover,coverCaption,coverAlt:media.alt,order,columns:2,align:"justify",pages:1,body:body.map(p),frames};
}
export const samples:Entry[] = [
  sample("where-the-light-falls","Where the light falls","Before sunrise in the Dolomites, the mountains appear one ridge at a time.","Landscape","Dolomites, Italy","2026-10-18","dolomites","Low cloud beneath the ridgeline, Dolomites.",100,[
    "The ridgeline appeared first. For a few minutes it was the only shape above the valley. The low cloud turned the slopes beneath it an even gray. At the edge of the frame, a strip of dark firs gave the eye somewhere to rest.",
    "A landscape like this changes while you are looking at it. One moment the peak stands clear of its surroundings. A minute later a cloud has caught on the shoulder of the mountain and the outline breaks apart. The photograph holds a little of that uncertainty.",
    "Down by the water, the same mountains almost disappear into their reflection. Trees cross the far shore in a single dark band. A few stones in the foreground interrupt the surface, and beyond them the water takes on the brightness of the sky.",
    "The two frames belong together. The first gives the mountain its weight and the second lets that weight dissolve. Seen side by side, the distance between them seems greater than the walk from the ridge to the lake.",
    "By the time the cloud began to lift, a narrow line of light was moving across the trees. The water went pale at one end. For a moment the opposite bank was visible in extraordinary detail, then the wind reached it and the reflection broke into small pieces.",
  ],{id:"alpine-lake",caption:"The same light, held in the surface of the lake."}),
  sample("between-the-arches","Between the arches","Late light and a solitary figure beneath Bologna’s porticoes.","Architecture","Bologna, Italy","2026-10-04","arcade","Afternoon light across a stone arcade in Bologna.",200,[
    "The arches turn a quiet stretch of pavement into a measure of distance. Each opening is a little narrower than the one before it. At the far end, where the dark and light bands have almost run together, a figure steps into view.",
    "Along the open edge of the portico, the sun reaches the stone at an angle. It picks out the uneven faces of the blocks and leaves the underside of each arch in shadow. The building offers two very different walks a few feet apart.",
    "The figure gives the passage its scale. Without that small interruption it would be easy to read the photograph as a pattern and forget how far the portico carries on."
  ]),
  sample("the-shape-of-water","The shape of water","A shifting white line along the dark edge of the Ligurian coast.","Seascape","Liguria, Italy","2026-09-21","coast","A breaking wave draws a white edge against the rock.",300,[
    "The swell kept changing the outline of the rock. A tongue of white water would reach the foot of the cliff, hang there a moment and pull away. The next wave never traced quite the same line.",
    "Farther out, the sea and the sky share a strip of gray. Only the folds of the headland mark the distance. Close to the shore, the water is full of small sharp details that vanish almost as soon as they appear.",
    "The photograph sets those two speeds beside one another. The headland has time to spare. The particular edge of foam in the foreground will never return."
  ]),
  sample("a-street-in-silence","A street in silence","A bicycle, shuttered windows, and the last strip of daylight.","Street","Tuscany, Italy","2026-09-09","street","A bicycle beside the last patch of light.",400,[
    "A narrow street held the day’s last light long after the square had gone gray. Sunlight had reached one wall and the stones at its foot. On the opposite side, even the open windows looked dark.",
    "Beside the wall stood a bicycle. Its shadow laid a second, less certain frame across the stone. It was the one detail that suggested someone would come back before the light was gone.",
    "At the far end, the arch opened onto a brighter street. The eye could follow it out of the picture, or stay with the ordinary things near at hand."
  ]),
];
