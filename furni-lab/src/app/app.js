const GLOBAL=[["alpha","Opacidad del interior",.1,1,.05,1],["light","Ángulo de la luz",-90,90,5,0],["step","Contraste de rampa",.05,.13,.005,.085],["shift","Giro de tono (sombras → violeta)",0,.16,.01,.07]];
const GTOG=[["self","Sombras propias",true],["floor","Sombra en el piso",true],["tex","Texturas (veta, motas)",true]];
const GSEL=[["outline","Contorno",[["material","Oscuro del material"],["black","Negro"],["none","Sin contorno"]],"material"]];

// ============================ ESTADO ===============================
const $=id=>document.getElementById(id);
const defaults=t=>{const f=FURNI[t],o={};(f.params||[]).forEach(a=>o[a[0]]=a[5]);(f.selects||[]).forEach(a=>o[a[0]]=a[3]);(f.toggles||[]).forEach(a=>o[a[0]]=a[2]);(f.colors||[]).forEach(a=>o[a[0]]=a[2]);return o};
const gdef=()=>{const o={};GLOBAL.forEach(a=>o[a[0]]=a[5]);GTOG.forEach(a=>o[a[0]]=a[2]);GSEL.forEach(a=>o[a[0]]=a[3]);return o};
let store={};try{store=JSON.parse(localStorage.getItem("furnilab2")||"{}")}catch(e){}
let type=FURNI[store.type]?store.type:"silla",rot=0,P={};
G=Object.assign(gdef(),store.G||{});
const allP={};for(const t in FURNI)allP[t]=Object.assign(defaults(t),(store.P||{})[t]||{});
const PRESETS={marca:["#0894ff","#c959dd","#ff2e54","#ff9004","#0066ff","#ff3fcd"],pastel:["#a8d8ff","#ffc4e1","#c9f2c7","#fff1a8","#d9c8ff","#ffd6b0"],
  atardecer:["#ff5e5b","#ff9e44","#ffd166","#8a4fc4","#3d2c8d","#ef476f"],bosque:["#2f5d3a","#6b8f4e","#a3b18a","#8b5e34","#d4a373","#3a4a3f"],
  oceano:["#023e8a","#0077b6","#00b4d8","#90e0ef","#caf0f8","#03045e"],mono:["#151515","#4c4c4c","#707070","#999999","#c9c9c9","#f2f2f2"]};
const PRESET_NAMES=[["marca","Marca Pairtial"],["pastel","Pastel"],["atardecer","Atardecer"],["bosque","Bosque"],["oceano","Océano"],["mono","Monocromo"],["custom","Personalizada"]];
const WS=Object.assign({veg:.7,speed:2,zoom:innerWidth<600?2:3,dens:.8,pool:160,dir:0,check:false,draw:5,par:8,every:2.5,renew:true,src:"random",pal:"marca",palette:PRESETS.marca.slice(),palAll:false,hue:0,alpha:1,light:0,bio:"mixto",fauna:.5,species:null},store.W||{});if(!WS.v12){WS.v12=1;WS.par=Math.max(WS.par,8)}
if(!Array.isArray(WS.palette)||WS.palette.length!==6||!WS.palette.every(c=>/^#[0-9a-f]{6}$/i.test(c)))WS.palette=PRESETS.marca.slice();
if(!PRESET_NAMES.some(p=>p[0]===WS.pal))WS.pal="marca";
const save=()=>{try{localStorage.setItem("furnilab2",JSON.stringify({type,G,P:allP,W:WS}))}catch(e){}};
const fmt=v=>Number.isInteger(+v)?String(+v):(+v).toFixed(v<1?3:2).replace(/0+$/,"").replace(/\.$/,"");
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

// ============================ VISTAS ===============================
let current="mundo";
function show(v){current=["laboratorio","catalogo","supra"].includes(v)?v:"mundo";
  document.querySelectorAll("nav .pt-nav-item").forEach(b=>b.classList.toggle("is-selected",b.dataset.view===current));
  for(const k of["mundo","laboratorio","catalogo","supra"])$("v-"+k).hidden=current!==k;
  if(current==="laboratorio")schedule();else if(current==="catalogo")renderCatalog();else if(current==="supra"){seRefresh();seDraw()}else{sizeWorld();loop.last=0}}
document.querySelectorAll("nav .pt-nav-item").forEach(b=>b.addEventListener("click",()=>{location.hash=b.dataset.view}));
addEventListener("hashchange",()=>show(location.hash.slice(1)));

// ========================== LABORATORIO ============================
function slider(host,[k,lab,mn,mx,st],obj,on){const id="s_"+Math.random().toString(36).slice(2,8),d=document.createElement("div");d.className="param";
  d.innerHTML=`<label for="${id}">${esc(lab)}</label><span class="pt-exp-param-value"></span><input class="pt-exp-param-range" type="range" id="${id}" min="${mn}" max="${mx}" step="${st}">`;
  const i=d.querySelector("input"),o=d.querySelector("span");i.value=obj[k];o.textContent=fmt(obj[k]);
  i.addEventListener("input",()=>{obj[k]=+i.value;o.textContent=fmt(i.value);on()});host.appendChild(d)}
function toggle(host,[k,lab],obj,on){const l=document.createElement("label");l.className="sw";l.innerHTML=`<span>${esc(lab)}</span><input type="checkbox" class="pt-toggle">`;
  const i=l.querySelector("input");i.checked=!!obj[k];i.addEventListener("change",()=>{obj[k]=i.checked;on()});host.appendChild(l)}
function select(host,[k,lab,opts],obj,on){const d=document.createElement("div");d.className="field";
  d.innerHTML=`<span>${esc(lab)}</span><div class="pt-input"><select>${opts.map(([v,t])=>`<option value="${v}">${esc(t)}</option>`).join("")}</select></div>`;
  const s=d.querySelector("select");s.value=obj[k];s.addEventListener("change",()=>{obj[k]=s.value;on()});host.appendChild(d)}
const CATS=[["interior","Interior"],["arboles","Árboles"],["vegetacion","Vegetación"],["rocas","Rocas y relieve"],["vallas","Vallas y muros"],["exterior","Estructuras"],["granja","Granja"],["bloques","Bloques"],["construcciones","Construcciones"],["fauna","Fauna"]];
let curCat=(FURNI[type]&&FURNI[type].cat)||"interior";
function buildCats(){const h=$("typeCats");h.innerHTML="";CATS.forEach(([k,n])=>{const b=document.createElement("button");b.className="chip";
  b.textContent=`${n} · ${Object.values(FURNI).filter(f=>f.cat===k).length}`;b.setAttribute("aria-pressed",k===curCat);
  b.addEventListener("click",()=>{curCat=k;buildCats();filterTypes()});h.appendChild(b)})}
function filterTypes(){document.querySelectorAll("#types button").forEach(b=>b.hidden=FURNI[b.dataset.t].cat!==curCat)}
function buildPanel(){P=allP[type];const f=FURNI[type];if(f.cat&&f.cat!==curCat){curCat=f.cat}buildCats();filterTypes();$("ptitle").textContent="Parámetros · "+f.name;
  const h=$("params");h.innerHTML="";(f.params||[]).forEach(a=>slider(h,a,P,schedule));(f.selects||[]).forEach(a=>select(h,a,P,()=>{if(f.onSelect){f.onSelect(a[0],P[a[0]],P);buildPanel()}schedule()}));(f.toggles||[]).forEach(a=>toggle(h,a,P,schedule));
  if("lshape"in P){const d=document.createElement("div");d.className="leafprev";d.innerHTML=`<div class="leafprev-h"><span>Hoja vectorial → píxeles</span><span class="pt-exp-param-value">${esc(LEAF_SHAPES[P.lshape]?.name||"")}</span></div><canvas id="leafprev" width="300" height="96"></canvas>`;h.prepend(d);drawLeafPrev()}
  const c=$("colors");c.innerHTML="";(f.colors||[]).forEach(([k,lab])=>{const l=document.createElement("label");l.className="pt-ring color";
    l.innerHTML=`<span class="pt-ring__inner"><span class="pt-ring__face"><input type="color"><span>${esc(lab)}</span></span></span>`;const i=l.querySelector("input");i.value=P[k];
    i.addEventListener("input",()=>{P[k]=i.value;schedule()});c.appendChild(l)});
  document.querySelectorAll("#types button").forEach(b=>b.setAttribute("aria-pressed",b.dataset.t===type))}
function buildGlobal(){const h=$("global");h.innerHTML="";GLOBAL.forEach(a=>slider(h,a,G,schedule));GSEL.forEach(a=>select(h,a,G,schedule));GTOG.forEach(a=>toggle(h,a,G,schedule))}
function compose(s,withTile){let x0=0,y0=0,x1=s.width,y1=s.height;
  if(withTile){x0=Math.min(0,s.originX-s.D-1);x1=Math.max(s.width,s.originX+s.W+1);y1=Math.max(s.height,s.originY+(s.W+s.D)/2+1);y0=Math.min(0,s.originY-1)}
  const w=x1-x0,h=y1-y0,img=new ImageData(w,h),d=img.data;
  if(withTile)for(let j=0;j<h;j++)for(let i=0;i<w;i++){const sx=i+x0+.5-s.originX,sy=j+y0+.5-s.originY,x=sy+sx/2,y=sy-sx/2;
    if(x>=0&&y>=0&&x<s.W&&y<s.D){const c=(x%T)<1||(y%T)<1?[255,255,255]:(x%T)>T-1||(y%T)>T-1?[170,170,170]:[214,214,214],k=(j*w+i)*4;d[k]=c[0];d[k+1]=c[1];d[k+2]=c[2];d[k+3]=255}}
  for(let j=0;j<s.height;j++)for(let i=0;i<s.width;i++){const si=(j*s.width+i)*4,a=s.rgba[si+3]/255;if(!a)continue;const k=((j-y0)*w+(i-x0))*4;
    if(d[k+3]===0){d[k]=s.rgba[si];d[k+1]=s.rgba[si+1];d[k+2]=s.rgba[si+2];d[k+3]=s.rgba[si+3]}else for(let c=0;c<3;c++)d[k+c]=Math.round(s.rgba[si+c]*a+d[k+c]*(1-a))}
  const cv=document.createElement("canvas");cv.width=w;cv.height=h;cv.getContext("2d").putImageData(img,0,0);return cv}
const spriteCanvas=s=>compose(s,false);
let cur=null,pending=0;
/** Vista de la hoja: el contorno vectorial (izquierda) y sus sellos rasterizados a varios ángulos con el tamaño actual. */
function drawLeafPrev(){const cv=$("leafprev");if(!cv||!("lshape"in P))return;const x=cv.getContext("2d"),sh=LEAF_SHAPES[P.lshape]||LEAF_SHAPES.oval,W=cv.width,H=cv.height;
  x.clearRect(0,0,W,H);x.imageSmoothingEnabled=false;const col=P.c2&&P.c2[0]==="#"&&type!=="arbusto"?P.c2:P.c1,m=mat(col,{shift:.09}),rgb=c=>`rgb(${c[0]},${c[1]},${c[2]})`;
  const Lp=80,hw=(P.lwid||.5)*(sh.wmul||1)*Lp,x0=10,y0=H/2,pts=[];for(let i=0;i<=60;i++){const u=i/60;pts.push([x0+u*Lp,leafHalf(sh,u)*hw])}
  x.beginPath();x.moveTo(x0,y0);pts.forEach(([px,w])=>x.lineTo(px,y0-w));for(let i=pts.length-1;i>=0;i--)x.lineTo(pts[i][0],y0+pts[i][1]);x.closePath();
  x.fillStyle=rgb(m.ramp[3]);x.fill();x.lineWidth=1.5;x.strokeStyle=rgb(m.outline);x.stroke();x.beginPath();x.moveTo(x0,y0);x.lineTo(x0+Lp*.85,y0);x.strokeStyle=rgb(m.ramp[1]);x.stroke();
  x.fillStyle="rgba(127,127,127,.5)";x.fillRect(x0+Lp+12,8,1,H-16);
  // sellos recortados a su caja, ampliados para que se vea cada píxel
  const angs=[-90,-30,0,45,135],Z=Math.max(4,Math.min(9,Math.floor(34/P.lsize)));let ox=x0+Lp+24;
  for(const a of angs){const s=leafStamp(P.lshape,P.lsize,P.lwid,a*Math.PI/180);let i0=s.w,i1=-1,j0=s.w,j1=-1;
    for(let j=0;j<s.w;j++)for(let i=0;i<s.w;i++)if(s.d[j*s.w+i]){i0=Math.min(i0,i);i1=Math.max(i1,i);j0=Math.min(j0,j);j1=Math.max(j1,j)}
    const bw=(i1-i0+1)*Z;if(ox+bw>W-4)break;const top=y0-((j1-j0+1)*Z)/2;
    for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const v=s.d[j*s.w+i];if(!v)continue;x.fillStyle=rgb(m.ramp[v===2?4:v===1?3:2]);x.fillRect(ox+(i-i0)*Z,top+(j-j0)*Z,Z,Z)}
    ox+=bw+8}
  const lab=cv.parentNode.querySelector(".pt-exp-param-value");if(lab)lab.textContent=sh.name}
function schedule(){save();drawLeafPrev();if(current!=="laboratorio")return;cancelAnimationFrame(pending);pending=requestAnimationFrame(()=>setTimeout(drawLab,0))}
function drawLab(){const t0=performance.now();cur=render(FURNI[type].build(P),rot);const ms=Math.round(performance.now()-t0);
  const comp=compose(cur,$("tile").checked),st=$("stage"),fit=Math.max(1,Math.floor(Math.min((st.clientWidth-24)/comp.width,(st.clientHeight-24)/comp.height)));
  const z=Math.min(fit,12),v=$("view");v.width=comp.width*z;v.height=comp.height*z;const g=v.getContext("2d");g.imageSmoothingEnabled=false;g.drawImage(comp,0,0,v.width,v.height);
  $("stat").textContent=`${cur.width} × ${cur.height} px · origen (${cur.originX}, ${cur.originY}) · ×${z} · ${ms} ms`;$("thumb").src=spriteCanvas(cur).toDataURL()}
const th=$("types");Object.entries(FURNI).forEach(([k,f])=>{const b=document.createElement("button");b.className="pt-exp-ring pt-exp-scene";b.dataset.t=k;
  b.innerHTML=`<span class="pt-exp-face"><canvas width="1" height="1"></canvas><span class="nm">${esc(f.name)}</span></span>`;
  b.addEventListener("click",()=>{type=k;buildPanel();schedule()});th.appendChild(b)});
function thumbs(){const ks=Object.keys(FURNI);let i=0,job=null,k=null;const S=gdef();
  const tick=()=>{if(!job){if(i>=ks.length)return;k=ks[i++];const keep=G;G=S;job=makeJob(FURNI[k].build(defaults(k)),0,S);G=keep}
    job.step(Infinity,performance.now()+5);
    if(job.done){const c=spriteCanvas(job.finish()),t=th.querySelector(`[data-t="${k}"] canvas`);t.width=c.width;t.height=c.height;t.getContext("2d").drawImage(c,0,0);job=null}
    setTimeout(tick,16)};tick()}
function setRot(r){rot=r;document.querySelectorAll("#dirs .pt-nav-item").forEach(x=>x.classList.toggle("is-selected",+x.dataset.r===r))}
document.querySelectorAll("#dirs .pt-nav-item").forEach(b=>b.addEventListener("click",()=>{setRot(+b.dataset.r);schedule()}));
$("tile").addEventListener("change",schedule);
$("reset").addEventListener("click",()=>{allP[type]=defaults(type);buildPanel();schedule()});
function randomize(t,p,r=Math.random){const f=FURNI[t];(f.params||[]).forEach(([k,,mn,mx,st])=>{p[k]=+fmt(Math.round((mn+r()*(mx-mn))/st)*st)});
  (f.selects||[]).forEach(([k,,o])=>p[k]=o[Math.floor(r()*o.length)][0]);return p}
const hex=c=>"#"+c.map(v=>v.toString(16).padStart(2,"0")).join("");
$("rand").addEventListener("click",()=>{randomize(type,P);(FURNI[type].colors||[]).forEach(([k])=>{P[k]=hex(hsl2rgb(Math.random()*360,.45+Math.random()*.35,.38+Math.random()*.22))});buildPanel();schedule()});
const note=t=>{$("note").textContent=t;clearTimeout(note.t);note.t=setTimeout(()=>$("note").textContent="",4000)};
$("copy").addEventListener("click",async()=>{try{await navigator.clipboard.writeText(JSON.stringify({furni:type,direccion:rot,params:P,render:G},null,2));note("Parámetros copiados como JSON.")}catch(e){note("No se pudo copiar en esta vista.")}});
const dirNames=["SE","SO","NO","NE"];
async function offerFile(data,name,say=note){const dl=window.claude&&claude.use?await claude.use("downloads"):null;
  if(!dl){if(typeof data==="string"){try{await navigator.clipboard.writeText(data);say("La descarga no está disponible aquí: copié el JSON al portapapeles.")}catch(e){say("La descarga no está disponible en esta vista.")}}
    else say("La descarga no está disponible aquí: usa clic derecho sobre la imagen a tamaño real.");return}
  try{await dl.save({filename:name,data});say("Descargado: "+name)}catch(e){say(e&&e.code==="declined"?"Descarga cancelada.":"No se pudo descargar ("+(e&&e.code||"error")+").")}}
async function offer(canvas,name){const blob=await new Promise(r=>canvas.toBlob(r,"image/png"));offerFile(blob,name)}
$("dl").addEventListener("click",()=>{if(cur)offer(spriteCanvas(cur),`${type}_${dirNames[rot]}.png`)});
$("dl4").addEventListener("click",()=>{const f=FURNI[type].build(P),ss=[0,1,2,3].map(r=>render(f,r)),gap=4,w=ss.reduce((a,s)=>a+s.width+gap,-gap),h=Math.max(...ss.map(s=>s.height)),c=document.createElement("canvas");
  c.width=w;c.height=h;const g=c.getContext("2d");let x=0;ss.forEach(s=>{g.drawImage(spriteCanvas(s),x,h-s.height);x+=s.width+gap});offer(c,`${type}_4dir.png`)});

// ============================ MUNDO ================================
// Paletas para los furnis del mundo: telas con el espectro de la marca.
const PAL={fabric:["#0894ff","#c959dd","#ff2e54","#ff9004","#0066ff","#ff3fcd","#ffbc00","#4c4c4c","#e0e0e0"],
  wood:["#b0703c","#7a4a2a","#c98f55","#5c3a24","#d9d2c4","#2c2c2c"],metal:["#9aa3ad","#c9c9c9","#4c4c4c","#d9b25a"],
  pot:["#c9643b","#e0e0e8","#2c2c2c","#0894ff","#ff9004","#c959dd"],leaf:["#3f9e3a","#2f8a54","#6cae3a","#1f7a6a"],
  shade:["#f3c64a","#82d7ff","#ff93f4","#fad07d","#ffffff"]};
const ROLE={mesa:{c1:"wood",c2:"wood"},silla:{c1:"wood",c2:"fabric"},sofa:{c1:"fabric",c2:"wood"},lampara:{c1:"shade",c2:"metal"},planta:{c1:"leaf",c2:"pot",c3:"wood"},estante:{c1:"wood",c2:"fabric",c3:"fabric",c4:"fabric"},
  cama:{c1:"wood",c2:"light",c3:"fabric",c4:"light"},alfombra:{c1:"fabric",c2:"fabric",c3:"fabric"},
  arbol:{c1:"bark",c2:"leaf"},arbol_muerto:{c1:"bark"},pino:{c1:"bark",c2:"conifer"},palmera:{c1:"palmbark",c2:"palm",c3:"bark"},tocon:{c1:"bark",c2:"cutwood"},tronco:{c1:"bark",c2:"cutwood",c3:"moss"},
  arbusto:{c1:"leaf",c2:"flower"},seto:{c1:"leaf",c2:"flower"},hierba:{c1:"grass",c2:"spike"},flores:{c1:"grass",c2:"flower",c3:"center"},seta:{c1:"light",c2:"flower",c3:"light"},cactus:{c1:"cactus",c2:"flower"},
  roca:{c1:"rock",c2:"moss",c3:"ore"},cristales:{c1:"crystal",c2:"rock"},bloque:{c1:"grass",c2:"dirt",c3:"rock"},valla:{c1:"wood"},muro:{c1:"stone",c2:"mortar"},empalizada:{c1:"wood"},
  banco:{c1:"wood",c2:"metal"},farola:{c1:"darkmetal",c2:"lamp"},letrero:{c1:"wood",c2:"cutwood"},barril:{c1:"wood",c2:"darkmetal"},caja:{c1:"cutwood",c2:"wood"},hoguera:{c1:"bark",c2:"rock"},
  lena:{c1:"bark",c2:"cutwood"},pozo:{c1:"stone",c2:"wood",c3:"fabric",c4:"water"},tienda:{c1:"fabric",c2:"wood"},fuente:{c1:"stone",c2:"water"},cultivo:{c1:"dirt",c2:"leaf",c3:"flower"},pajar:{c1:"hay",c2:"wood"}};
// Paletas naturales por defecto (cada bioma puede sobrescribirlas)
const NAT={bark:["#6b4a2f","#5a3d26","#7a5535","#4a3426"],palmbark:["#8a6a45","#9a7a52"],leaf:["#4f9e3a","#3f8a34","#6cae3a","#2f7a4a"],conifer:["#2f6b3f","#25593a","#3a7a4a"],palm:["#5fa83a","#4f9a3a","#6cb84a"],
  cutwood:["#d9b07a","#c99a63","#e0bd8a"],grass:["#5fae3a","#4f9e3a","#7cbf4a"],spike:["#c9a85a","#a8874a"],center:["#ffd23f","#ff9004","#ffffff"],cactus:["#4f8f3a","#5c9e48","#3f7a34"],
  rock:["#8a8f96","#7d7a74","#9a9590","#6f747a"],stone:["#9a9590","#c9c4b8","#8a8f96"],moss:["#5f8f3a","#6b9a3f"],ore:["#ffd23f","#00c4ff","#ff3fcd","#ff9004"],dirt:["#8b5e34","#7a5230"],
  mortar:["#5f5a55","#4c4c4c"],hay:["#e0b84a","#d4a83f"],water:["#4aa8e0","#3f9ad4"],darkmetal:["#2c2c2c","#4c4c4c","#3a3f44"],lamp:["#ffd27a","#fff1a8","#82d7ff"]};
const INTERIOR_W={silla:4,planta:4,mesa:3,sofa:3,lampara:2,estante:2,cama:2,alfombra:3};
const roofs=["#a33b2f","#7a3b2f","#3a4a6a","#5a4a3a","#2f5a4a","#6b2f4a"];NAT.roof=roofs;
const walls=(t,p,m)=>{if(["casa","torre","muralla"].includes(t)&&FURNI[t].onSelect)FURNI[t].onSelect("m",m,p)};
const BIOMES={
  mixto:{name:"Mixto (zonas de todos los biomas)"},
  interior:{name:"Interior (piso plata)",w:INTERIOR_W},
  pradera:{name:"Pradera",main:"grass",patch:"dirt",patchT:.14,shore:"sand",
    w:{conjunto:7,arbol:7,arbol:4,arbusto:4,hierba:7,flores:6,roca:2,valla:2,muro:1,banco:1,farola:1,letrero:1,cultivo:2,pajar:1.5,tronco:1,tocon:1,seta:1,pozo:.6,fuente:.4,seto:1.2,casa:1.4,torre:.4,muralla:.5}},
  bosque:{name:"Bosque",main:"grassDark",patch:"dirt",patchT:.18,shore:"dirt",
    w:{conjunto:8,pino:10,arbol:7,pino:6,arbol:4,arbol_muerto:1,tocon:2,tronco:2,seta:3,arbusto:3,hierba:4,flores:1,roca:3,hoguera:.8,lena:1,tienda:.8,empalizada:.6,casa:.7,torre:.4},
    pal:{leaf:["#3f7a34","#2f6a30","#4f8a3a","#5a8f2f"],grass:["#3f7a34","#4b8a3e","#5a9a42"]},tweak:(t,p)=>walls(t,p,"madera")},
  desierto:{name:"Desierto",main:"sand",patch:"rock",patchT:.15,shore:"sand",
    w:{conjunto:5,cactus:7,palmera:1.5,roca:5,cristales:1,arbol_muerto:2,hierba:2,barril:1,caja:1,tienda:1,hoguera:.5,casa:.8,torre:.6,muralla:.4},
    pal:{grass:["#c9b86a","#b8a85a","#d4c27a"],leaf:["#8a9a4a","#9aa85a"],rock:["#c98f55","#b07a45","#d9a86a"],dirt:["#d9b07a","#c99a63"],bark:["#8a6a45","#7a5a3a"],roof:["#c98f55","#a8703f"]},
    tweak:(t,p)=>{if(t==="roca")p.moss=0;walls(t,p,"arena");if(t==="casa")p.roof="plano"}},
  nieve:{name:"Nieve",main:"snow",patch:"rock",patchT:.06,shore:"ice",
    w:{conjunto:6,pino:10,pino:7,roca:4,arbol_muerto:2,tronco:1,cristales:2,hoguera:1,lena:2,valla:1,tienda:.7,empalizada:.6,casa:.9,torre:.4},
    pal:{conifer:["#1f4a35","#2a5a40","#24503a"],rock:["#9aa3ad","#b5bcc4","#8a939d"]},tweak:(t,p)=>{if("snow"in p)p.snow=true;walls(t,p,"madera")}},
  pantano:{name:"Pantano",main:"grassDark",patch:"mud",patchT:.4,shore:"mud",
    w:{conjunto:5,arbol:5,arbol:3,arbol_muerto:3,hierba:7,seta:4,tronco:2,roca:1,tocon:2,arbusto:1,casa:.4},
    pal:{leaf:["#5a7a3a","#4a6a35","#6a7a3f"],grass:["#6a7a3a","#5a6a35","#7a8a45"],bark:["#4a3f2f","#3f352a"]},
    tweak:(t,p)=>{if(t==="arbol")p.droop=Math.max(p.droop,.65);if(t==="hierba"){p.spike=true;p.h=Math.max(p.h,14);p.bend=Math.min(p.bend,.3)}walls(t,p,"madera")}},
  costa:{name:"Costa",main:"sand",patch:"grass",patchT:.25,shore:"sand",
    w:{conjunto:5,palmera:8,palmera:6,roca:4,barril:2,caja:2,hierba:3,banco:.6,farola:.6,hoguera:.6,tienda:.6,casa:.6,torre:.3},
    pal:{rock:["#b5ab9a","#9a9080","#c9c0b0"]},tweak:(t,p)=>walls(t,p,"madera")}};
const MIX=["pradera","bosque","desierto","nieve","pantano","costa"];
const GROUND={grass:["#5fae3a","#529e33","#6ebd47"],grassDark:["#3f7a34","#376c2f","#4b8a3e"],dirt:["#8b6a48","#7c5d3f","#9a7754"],sand:["#e6cf8f","#d8bf7e","#f0dca2"],
  snow:["#eef3f8","#dde6ef","#ffffff"],ice:["#bfe0f2","#a9d2ea","#d6eef9"],mud:["#5e4a35","#523f2d","#6b5640"],water:["#3f8fd0","#357fbf","#6cb6e6"],rock:["#8a8f96","#7b8087","#989da4"]};
const WEIGHT=[["silla",4],["planta",4],["mesa",3],["sofa",3],["lampara",2],["estante",2],["cama",2],["alfombra",3]];
const CAP={mesa:{w:2,d:1},sofa:{n:2},estante:{n:1,h:64},lampara:{h:58},planta:{size:1.3},cama:{n:2},alfombra:{w:2,d:2},
  bloque:{w:2,d:2},valla:{n:2},muro:{n:2},empalizada:{n:2},seto:{n:2},banco:{n:2},tienda:{w:2},cultivo:{w:2,d:2},fuente:{n:1},farola:{h:64},pino:{h:80},arbol:{spread:60},arbol_muerto:{spread:55},hierba:{blades:28},torre:{n:2,floors:4},casa:{w:2,d:2},muralla:{n:2},bloquem:{w:2,d:2},rampa:{w:2,d:2}};
const mixHex=(a,b,k)=>{const A=parseInt(a.slice(1),16),B=parseInt(b.slice(1),16);return hex([16,8,0].map(s=>Math.round(((A>>s)&255)*(1-k)+((B>>s)&255)*k)))};
// Colorimetría del usuario: decide qué colores puede usar cada rol de material.
let curBio=null;
function palFor(role){const U=WS.palette,B=(BIOMES[curBio||WS.bio]||{}).pal||{};
  switch(role){case"fabric":case"pot":return U;case"shade":return U.map(c=>mixHex(c,"#ffffff",.35));case"light":return U.map(c=>mixHex(c,"#ffffff",.78));
    case"wood":return WS.palAll?U.map(c=>mixHex(c,"#000000",.3)):PAL.wood;case"metal":return WS.palAll?U.map(c=>mixHex(c,"#9aa3ad",.3)):PAL.metal;
    case"leaf":return WS.palAll?U:B.leaf||PAL.leaf;case"flower":case"crystal":return U;
    default:if(WS.palAll&&["conifer","palm","grass","cactus","moss"].includes(role))return U;if(WS.palAll&&["bark","palmbark","cutwood","dirt","hay"].includes(role))return U.map(c=>mixHex(c,"#000000",.3));
      return B[role]||NAT[role]||U}}
const SPECTRUM=[[8,148,255],[201,89,221],[255,46,84],[255,144,4]]; // --pt-grad-brand
const spectrum=u=>{const x=Math.min(.999,Math.max(0,u))*3,i=Math.floor(x),f=x-i,a=SPECTRUM[i],b=SPECTRUM[i+1];return[0,1,2].map(c=>Math.round(a[c]+(b[c]-a[c])*f))};
const BAYER=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
const WG=gdef(); // ajustes de render fijos para el mundo
const wcv=$("world"),wctx=wcv.getContext("2d"),low=document.createElement("canvas"),lctx=low.getContext("2d");
let seed=(Math.random()*1e6)|0,layout=(Math.random()*1e6)|0,slots=[],cam={x:0,y:0},paused=matchMedia("(prefers-reduced-motion: reduce)").matches,drawn=[],visible=new Set(),lastRenew=0,generation=0;
function h32(a,b,c){let h=(a*374761393+b*668265263+c*1442695041)|0;h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296}
const mk=(w,h)=>{const c=document.createElement("canvas");c.width=w;c.height=h;return c};

// Una "ranura" de la variedad: en cola → construyendo → lista → borrando → en cola (nueva semilla)
function srcList(){if(WS.src==="cat")return cat.items;if(String(WS.src).startsWith("fam:")){const id=WS.src.slice(4);return cat.items.filter(x=>x.families.includes(id))}return null}
// Parámetros aleatorios de un tipo para un bioma (paleta, topes y ajustes del bioma).
function genParams(t,r,bio,extra){const BIO=BIOMES[bio]&&BIOMES[bio].w?BIOMES[bio]:BIOMES.interior;curBio=bio;
  const p=randomize(t,defaults(t),r),cap=Object.assign({},CAP[t]||{},extra||{});for(const k in cap)p[k]=Math.min(p[k],cap[k]);
  if(FURNI[t].onSelect)(FURNI[t].selects||[]).forEach(([k])=>FURNI[t].onSelect(k,p[k],p));
  if(t==="silla")p.slats=Math.min(p.slats,5);if(["planta","estante"].includes(t))p.seed=(r()*500|0)+1;
  const used=new Set();for(const[k,role]of Object.entries(ROLE[t]||{})){const L=palFor(role);let j=Math.floor(r()*L.length);
    if(role==="fabric")for(let n=0;n<L.length&&used.has(L[j]);n++)j=(j+1)%L.length;p[k]=L[j];used.add(L[j])}
  if(t==="lampara")p.glow=r()<.8;if(BIO.tweak)BIO.tweak(t,p,r);
  if("lshape"in p){// follaje del mundo: formas naturales, tamaño de hoja proporcional y segundo tono derivado del primero
    const base=t==="arbusto"?p.c1:p.c2,n=parseInt(base.slice(1),16),[hh,ss,ll]=rgb2hsl(n>>16&255,n>>8&255,n&255);
    p.c3=hex(hsl2rgb(hh+(r()-.3)*40,Math.min(1,ss+.08),Math.min(.8,ll+.08+r()*.1)));
    p.lshape=p.droop>.5?"lanceolada":pickR(r,t==="arbusto"?["redonda","oval","oval","corazon","lobulada"]:["oval","oval","lobulada","corazon","redonda","lanceolada"]);
    p.lsize=Math.min(Math.max(3,p.lsize),t==="arbusto"?2.5+(p.size||1)*2:6.5);p.ldens=Math.max(.8,Math.min(1.4,p.ldens));p.lwid=Math.max(.45,p.lwid);p.hojas=true}
  curBio=null;return p}
// ---------- Conjuntos: suprafurnis generados por tema ----------
const pickR=(r,a)=>a[Math.floor(r()*a.length)],nR=(r,a,b)=>Array.from({length:a+Math.floor(r()*(b-a+1))});
const THEMES={
  arboleda:{name:"Arboleda",bio:{pradera:3,bosque:6,nieve:5,pantano:4},make:(r,b)=>{const tr=b==="nieve"?["pino"]:b==="bosque"?["pino","arbol","arbol"]:b==="pantano"?["arbol","arbol_muerto"]:["arbol","arbol","pino"];
    return[...nR(r,2,4).map(()=>pickR(r,tr)),...nR(r,1,3).map(()=>b==="nieve"?"roca":"arbusto"),...nR(r,2,4).map(()=>b==="pantano"||b==="nieve"?"hierba":pickR(r,["hierba","flores"]))]}},
  jardin:{name:"Jardín",bio:{pradera:2},make:r=>["seto","banco","arbol",...nR(r,2,4).map(()=>"flores"),r()<.5?"farola":"fuente"]},
  huerto:{name:"Huerto",bio:{pradera:2},make:r=>["cultivo","pajar","valla",r()<.5?"pozo":"hierba","hierba"]},
  campamento:{name:"Campamento",bio:{bosque:2,nieve:2,desierto:1},make:()=>["tienda","hoguera","lena","tronco","hierba"]},
  ruinas:{name:"Ruinas",bio:{pradera:1,bosque:1,desierto:2,pantano:1},make:r=>["muro","bloquem","bloquem","roca",...nR(r,2,3).map(()=>"hierba")]},
  casita:{name:"Casita con jardín",bio:{pradera:2,nieve:1,costa:1,bosque:1},make:r=>["casa","arbusto","flores","flores",r()<.6?"arbol":"seto"]},
  playa:{name:"Playa",bio:{costa:5},make:r=>["palmera","palmera","roca","barril",...nR(r,1,2).map(()=>"hierba")]},
  oasis:{name:"Rincón del desierto",bio:{desierto:5},make:r=>[...nR(r,2,4).map(()=>"cactus"),"roca","roca","hierba"]}};
const BIG=["casa","tienda","cultivo","muro","seto","valla","banco","muralla","torre","fuente","pozo"];
const COMP_CAP={casa:{w:1,d:2,floors:1},cultivo:{w:2,d:1},muro:{n:2},seto:{n:1},valla:{n:2},banco:{n:1},fuente:{n:1},arbol:{h:40,canopy:1.2},pino:{h:64},palmera:{h:56},
  hierba:{blades:16,spread:6,h:10},flores:{n:5,spread:5},arbusto:{size:1},roca:{size:7,n:2},bloquem:{w:1,d:1},cactus:{h:34}};
/** Compone un conjunto 2×2 sin encimar piezas sólidas (rejilla de medias baldosas). */
function genComposition(theme,r,bio){const TH=THEMES[theme],types=TH.make(r,bio).sort((a,b)=>BIG.includes(b)-BIG.includes(a)),occ=new Uint8Array(16),kids=[];
  types.forEach((t,i)=>{if(!FURNI[t])return;const p=genParams(t,r,bio,COMP_CAP[t]),rot=r()<.5?0:1,fp=buildWG(t,p).footprint,fw=rot%2?fp[1]:fp[0],fd=rot%2?fp[0]:fp[1];if(fw>2||fd>2)return;
    const pos=[];for(let x=0;x<=2-fw+1e-6;x+=.5)for(let y=0;y<=2-fd+1e-6;y+=.5)pos.push([x,y]);for(let k=pos.length-1;k>0;k--){const j=Math.floor(r()*(k+1));[pos[k],pos[j]]=[pos[j],pos[k]]}
    const cells=(x,y)=>{const c=[];for(let a=x*2;a<(x+fw)*2-1e-6;a++)for(let b=y*2;b<(y+fd)*2-1e-6;b++)c.push(b*4+a);return c};
    for(const[x,y]of pos){const c=cells(x,y);if(c.some(q=>occ[q]))continue;c.forEach(q=>occ[q]=1);kids.push({ref:null,name:FURNI[t].name,type:t,rot,params:p,x,y,dz:0,born:i});break}});
  if(!kids.length)kids.push({ref:null,name:"Árbol",type:"arbol",rot:0,params:genParams("arbol",r,bio),x:.5,y:.5,dz:0,born:0});
  return{type:"supra",name:TH.name,rot:0,params:{},children:kids}}
function pickTheme(bio,r){const L=Object.entries(THEMES).filter(([,v])=>v.bio[bio]);if(!L.length)return"arboleda";let tot=L.reduce((a,[,v])=>a+v.bio[bio],0),q=r()*tot;for(const[k,v]of L)if((q-=v.bio[bio])<0)return k;return L[0][0]}
function specFor(i,g,bio){const r=rng(Math.floor(h32(seed,i,g)*2147483646)+1);r();
  const list=srcList();
  if(list){if(!list.length)return null;const it=list[Math.floor(r()*list.length)];
    if(it.type==="supra"){const[fw,fd]=supraFoot(it);return{t:"supra",it:JSON.parse(JSON.stringify(it)),p:null,rot:it.rot,fw,fd,item:it.id,name:it.name}}
    const keep=G;G=WG;const f=FURNI[it.type].build(it.params);G=keep;
    return{t:it.type,p:JSON.parse(JSON.stringify(it.params)),rot:it.rot,f,fw:it.rot%2?f.footprint[1]:f.footprint[0],fd:it.rot%2?f.footprint[0]:f.footprint[1],item:it.id,name:it.name}}
  const BIO=BIOMES[bio]&&BIOMES[bio].w?BIOMES[bio]:BIOMES.interior;
  const WT=Object.entries(BIO.w).filter(([k])=>FURNI[k]||k==="conjunto");
  let tot=WT.reduce((a,w)=>a+w[1],0),pick=r()*tot,t=WT[0][0];for(const[k,w]of WT){if((pick-=w)<0){t=k;break}}
  if(t==="conjunto"){const it=genComposition(pickTheme(bio,r),r,bio),[fw,fd]=supraFoot(it);return{t:"supra",it,p:null,rot:0,fw,fd,name:it.name}}
  const p=genParams(t,r,bio),rr=r()<.5?0:1,f=buildWG(t,p);
  return{t,p,rot:rr,f,fw:rr%2?f.footprint[1]:f.footprint[0],fd:rr%2?f.footprint[0]:f.footprint[1]}}
// En modo mixto cada ranura pertenece a un bioma; cada zona del mundo elige entre las ranuras de su bioma.
// Cada casilla del mundo tiene SU propio objeto (semilla = casilla + generación): nunca hay dos iguales.
// Las instancias que salen de la vista se reciclan para casillas nuevas (WS.pool = memoria máxima).
const cellSlot=new Map();let frameNo=0;
const cellHash=(gx,gy)=>Math.floor(h32(gx,gy,9001)*2147483646);
function ensureSlots(){if(slots.length>WS.pool){for(const s of slots.splice(WS.pool))if(s.key)cellSlot.delete(s.key)}}
function resetCells(){slots.length=0;cellSlot.clear();closePick()}
function slotForCell(key,bio,hash){let sl=cellSlot.get(key);if(sl)return sl;
  if(slots.length<WS.pool){sl={i:slots.length,g:0,state:"queued"};slots.push(sl)}
  else{let best=null;for(const s of slots)if(!s.locked&&(s.seen??-1)<frameNo-1&&(!best||(s.seen??-1)<(best.seen??-1)))best=s;if(!best)return null;sl=best;cellSlot.delete(sl.key)}
  Object.assign(sl,{key,bio,hash,g:(sl.g||0)+1,state:"queued",job:null,jcv:null,s:null,cv:null,ecv:null,thr:null,eimg:null,spec:null,locked:false});cellSlot.set(key,sl);return sl}
// Los objetos del catálogo se dibujan una sola vez por sesión: si ya existe su sprite, aparece directo.
const spriteMem=new Map();
const specKey=sp=>sp.item?(sp.t==="supra"?itemKey(sp.it):itemKey({type:sp.t,rot:sp.rot,params:sp.p})):null;
function beginAppear(sl,now){beginErase(sl,0);sl.e=1.12;sl.state="appearing";sl.born=now}
function startBuild(sl,now){sl.spec=specFor(sl.hash,sl.g,sl.bio);if(!sl.spec){sl.state="void";return}
  const k=specKey(sl.spec);if(k&&spriteMem.has(k)){sl.s=spriteMem.get(k);sl.cv=viewCanvas(sl.s);beginAppear(sl,now);return}sl.job=sl.spec.t==="supra"?makeSupraJob(sl.spec.it,WG):makeJob(sl.spec.f,sl.spec.rot,WG);sl.jcv=mk(sl.job.w,sl.job.h);sl.state="building"}
function paintJob(sl){const ctx=sl.jcv.getContext("2d");if(sl.job.paint)sl.job.paint(ctx,viewCanvas);else ctx.putImageData(viewPreview(sl.job.img),0,0)}
function finishBuild(sl,now){sl.s=sl.job.finish();{const k=specKey(sl.spec);if(k)spriteMem.set(k,sl.s)}sl.cv=viewCanvas(sl.s);sl.job=null;sl.jcv=null;sl.state="ready";sl.born=now}
function beginErase(sl,delay=0){const s=sl.s,n=s.width*s.height,thr=new Float32Array(n);
  for(let y=0;y<s.height;y++)for(let x=0;x<s.width;x++)thr[y*s.width+x]=BAYER[(y&3)*4+(x&3)]/16*.55+(y/s.height)*.45;
  sl.thr=thr;sl.eview=viewRGBA(s);sl.eimg=new ImageData(s.width,s.height);sl.ecv=mk(s.width,s.height);sl.e=-delay;sl.state="erasing"}
function paintErase(sl){const s=sl.s,src=sl.eview,d=sl.eimg.data,e=Math.max(0,sl.e),band=.12;
  for(let k=0,n=s.width*s.height;k<n;k++){const th=sl.thr[k],o=k*4;
    if(th<e||src[o+3]===0){d[o+3]=0;continue}
    if(th<e+band&&s.mask[k]){const c=spectrum((k%s.width)/s.width);d[o]=c[0];d[o+1]=c[1];d[o+2]=c[2];d[o+3]=255}
    else{d[o]=src[o];d[o+1]=src[o+1];d[o+2]=src[o+2];d[o+3]=src[o+3]}}
  sl.ecv.getContext("2d").putImageData(sl.eimg,0,0)}

function update(now,dt){frameNo++;ensureSlots();if(isExterior())faunaUpdate(now,dt);
  let building=slots.filter(s=>s.state==="building").length;
  const order=slots.filter(s=>s.state==="queued").sort((a,b)=>(visible.has(b.i)-visible.has(a.i))||a.i-b.i);
  // atraso: huecos visibles sin objeto. Con atraso se dibuja más rápido y en más sitios a la vez
  const backlog=order.filter(s=>visible.has(s.i)).length+slots.filter(s=>s.state==="building"&&visible.has(s.i)).length,rush=backlog>3;
  const par=WS.par+(rush?Math.min(8,backlog>>1):0);
  for(const sl of order){if(building>=par)break;startBuild(sl,now);if(sl.state==="building")building++}
  // presupuesto: 6 ms por cuadro (11 ms con atraso) repartidos entre las construcciones activas
  const deadline=performance.now()+(rush?11:6),ppf=Math.round(8*2**(WS.draw-1))*(rush?4:1);
  for(const sl of slots){if(sl.state!=="building")continue;
    const n=sl.job.step(ppf,deadline);if(n)paintJob(sl);
    if(sl.job.done)finishBuild(sl,now);if(performance.now()>deadline)break}
  for(const sl of slots){if(sl.state!=="appearing")continue;sl.e-=dt/.7;if(sl.e<=0){sl.state="ready";sl.thr=sl.eimg=sl.ecv=null}else paintErase(sl)}
  for(const sl of slots){if(sl.state!=="erasing")continue;sl.e+=dt/.9;
    if(sl.e>=1+.12){sl.state="queued";sl.g++;generation++;sl.s=sl.cv=sl.ecv=sl.thr=sl.eimg=null}else if(sl.e>0)paintErase(sl)}
  const queued=slots.some(s=>s.state==="queued"&&visible.has(s.i));
  if(WS.renew&&!queued&&building<WS.par&&now-lastRenew>WS.every*1000){let old=null;
    for(const sl of slots)if(sl.state==="ready"&&!sl.locked&&(!old||(visible.has(sl.i)-visible.has(old.i))*1e12+(old.born-sl.born)>0))old=sl;
    if(old){beginErase(old);lastRenew=now}}
  update.n=(update.n||0)+1;if(update.n%15===0){const c={ready:0,building:0,erasing:0,queued:0,void:0,appearing:0};slots.forEach(s=>c[s.state]++);
    $("wcount").textContent=`${c.ready} objetos únicos`+(c.building?` · ${c.building} dibujando`:"")+(c.erasing?` · ${c.erasing} borrando`:"")+(c.appearing?` · ${c.appearing} apareciendo`:"");
    if(c.void===slots.length)$("wcount").textContent="Sin objetos en esta selección";
    $("wgen").textContent="renovados: "+generation}}

// baldosa de piso 64×32 (plata de la marca)
function floorTile(base,dark){const c=mk(64,33),g=c.getContext("2d"),img=g.createImageData(64,33),d=img.data;
  for(let j=0;j<33;j++)for(let i=0;i<64;i++){const sx=i+.5-32,sy=j+.5,x=sy+sx/2,y=sy-sx/2;if(x<0||y<0||x>=32||y>=32)continue;
    const col=x>=31||y>=31?dark:base,k=(j*64+i)*4;d[k]=col[0];d[k+1]=col[1];d[k+2]=col[2];d[k+3]=255}
  g.putImageData(img,0,0);return c}
const TILES=[floorTile([222,222,222],[196,196,196]),floorTile([208,208,208],[186,186,186])];
function sizeWorld(){const box=$("worldBox"),z=WS.zoom,w=Math.max(1,Math.ceil(box.clientWidth/z)),h=Math.max(1,Math.ceil(box.clientHeight/z));
  if(low.width!==w||low.height!==h){low.width=w;low.height=h}wcv.width=w*z;wcv.height=h*z;wcv.style.width=w*z+"px";wcv.style.height=h*z+"px"}
new ResizeObserver(()=>{if(current==="mundo")sizeWorld()}).observe($("worldBox"));
// ===================== SUELO PROCEDURAL (biomas) ====================
// Material por ruido de baja frecuencia (con distorsión) → transiciones naturales sin autotiling.
// ======================= TERRENO CON ALTURAS ========================
// Altura por ESQUINA, cuantizada a semibloques de 8 px. Las baldosas vecinas comparten esquinas,
// así que los desniveles siempre son pendientes planas en diagonal (nunca escalones ni curvas).
const STEP=8,SEA=.36,LV=.085,BEACH=.035;
const isExterior=()=>WS.bio!=="interior";
const c01x=v=>Math.min(1,Math.max(0,v));
function fieldsAt(X,Y){const w=noise3(X/150,Y/150,0,layout+3);
  return[c01x((.78*noise3(X/380+w*.7,Y/380,0,layout+1)+.22*noise3(X/170,Y/170,0,layout+2)-.5)*2.5+.5),
    c01x((noise3(X/520,Y/520,0,layout+11)-.5)*2.6+.5),c01x((noise3(X/440+5,Y/440,0,layout+12)-.5)*2.6+.5)]}
function climate(t,h){if(WS.bio!=="mixto")return WS.bio;if(t<.24)return"nieve";if(t>.7&&h<.5)return"desierto";if(h>.7&&t>.4)return"pantano";if(h>.52)return"bosque";return"pradera"}
function biomeAt(e,t,h){const b=climate(t,h);if(e<SEA+BEACH&&WS.bio==="mixto")return b==="nieve"||b==="pantano"?b:"costa";return b}
function surfaceOf(e,t,h,d){if(e<SEA)return"water";const b=climate(t,h),B=BIOMES[b];
  if(e<SEA+BEACH)return WS.bio==="mixto"?(b==="nieve"?"ice":b==="pantano"?"mud":"sand"):B.shore;return d<B.patchT?B.patch:B.main}
const cornerMem=new Map();
function cornerLevel(cx,cy){const k=cx+","+cy;let v=cornerMem.get(k);
  if(v===undefined){const e=fieldsAt(cx*T,cy*T)[0];v=e<SEA?0:Math.min(12,Math.floor((e-SEA)/LV));cornerMem.set(k,v);if(cornerMem.size>60000)cornerMem.clear()}return v}
const RAMPS={};const rampOf=m=>RAMPS[m]||(RAMPS[m]=mat(GROUND[m][0],{step:.05,shift:.05}).ramp);
let LN=[0,0,1];
function setLight(deg){const az=deg*Math.PI/180,bx=.35,by=.75,x=bx*Math.cos(az)-by*Math.sin(az),y=bx*Math.sin(az)+by*Math.cos(az),l=H2(x,y,1);LN=[x/l,y/l,1/l]}
function triNormal(a,b,c){const u=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],v=[c[0]-a[0],c[1]-a[1],c[2]-a[2]],n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],l=H2(...n)||1;return n[2]<0?[-n[0]/l,-n[1]/l,-n[2]/l]:[n[0]/l,n[1]/l,n[2]/l]}
const shadeLv=n=>{const s=n[0]*LN[0]+n[1]*LN[1]+n[2]*LN[2];return s>.795?4:s>.745?3:s>.66?2:1};
/** Geometría de una baldosa: alturas de esquina, triangulación, normales y centros (en unidades de mundo). */
function tileGeom(tx,ty){const h=[cornerLevel(tx,ty),cornerLevel(tx+1,ty),cornerLevel(tx+1,ty+1),cornerLevel(tx,ty+1)].map(l=>l*STEP),UV=[[0,0],[1,0],[1,1],[0,1]],
  P=UV.map(([u,v],i)=>[(tx+u)*T,(ty+v)*T,h[i]]),tris=Math.abs(h[0]-h[2])<=Math.abs(h[1]-h[3])?[[0,1,2],[0,2,3]]:[[0,1,3],[1,2,3]];
  return{h,P,tris,N:tris.map(([a,b,c])=>triNormal(P[a],P[b],P[c])),C:tris.map(q=>[0,1,2].map(k=>(P[q[0]][k]+P[q[1]][k]+P[q[2]][k])/3))}}
// borde de esta baldosa → [vecino dx, dy, índices locales del mismo borde en el vecino]
const BORDER={"0,1":[0,-1,3,2],"1,2":[1,0,0,3],"2,3":[0,1,1,0],"0,3":[-1,0,2,1]};
/** Rasteriza una baldosa de terreno (dos triángulos) con material por píxel, sombreado por pendiente,
 *  textura y aristas: brillo en los bordes convexos (cima de la pendiente) y sombra en los cóncavos (pie). */
function makeTerrainTile(tx,ty){const G0=tileGeom(tx,ty),h=G0.h,hmax=Math.max(...h),hmin=Math.min(...h),tris=G0.tris;
  const Wd=64,Hd=33+hmax-hmin,c=mk(Wd,Hd),g=c.getContext("2d"),img=g.createImageData(Wd,Hd),d=img.data;
  const V=[[0,0,h[0]],[1,0,h[1]],[1,1,h[2]],[0,1,h[3]]],S=V.map(([u,v,z])=>[32+32*(u-v),16*(u+v)-z+hmax]);
  const tn=G0.N.map(shadeLv),creases=[[],[]];
  for(let q=0;q<2;q++){const tq=tris[q];for(const[i,j]of[[tq[0],tq[1]],[tq[1],tq[2]],[tq[0],tq[2]]]){let n2,c2;
      if(tris[1-q].includes(i)&&tris[1-q].includes(j)){n2=G0.N[1-q];c2=G0.C[1-q]}
      else{const bk=Math.min(i,j)+","+Math.max(i,j),bd=BORDER[bk];if(!bd)continue;const ng=tileGeom(tx+bd[0],ty+bd[1]),k=ng.tris.findIndex(z=>z.includes(bd[2])&&z.includes(bd[3]));if(k<0)continue;n2=ng.N[k];c2=ng.C[k]}
      const n1=G0.N[q],c1=G0.C[q];if(n1[0]*n2[0]+n1[1]*n2[1]+n1[2]*n2[2]>.995)continue;const l1=tn[q],l2=shadeLv(n2);if(l1>l2)continue;
      const conv=(n1[0]-n2[0])*(c1[0]-c2[0])+(n1[1]-n2[1])*(c1[1]-c2[1])+(n1[2]-n2[2])*(c1[2]-c2[2])>0;
      creases[q].push({A:S[i],B:S[j],lv:conv?Math.min(5,Math.max(l1,l2)+1):Math.max(0,Math.min(l1,l2)-1)})}}
  const G5=[];for(let j=0;j<=4;j++)for(let i=0;i<=4;i++)G5.push(fieldsAt(tx*T+i*8,ty*T+j*8));
  const samp=(u,v)=>{const x=Math.min(3.999,Math.max(0,u*4)),y=Math.min(3.999,Math.max(0,v*4)),i=Math.floor(x),j=Math.floor(y),fx=x-i,fy=y-j,a=G5[j*5+i],b=G5[j*5+i+1],cc=G5[j*5+i+5],dd=G5[j*5+i+6];
    return[0,1,2].map(k=>(a[k]*(1-fx)+b[k]*fx)*(1-fy)+(cc[k]*(1-fx)+dd[k]*fx)*fy)};
  const foam=[214,238,249],grid=WS.check;
  for(let py=0;py<Hd;py++)for(let px=0;px<Wd;px++){const X0=px+.5,Y0=py+.5;
    for(let q=0;q<2;q++){const[a,b,cc]=tris[q],A=S[a],B=S[b],C=S[cc],den=(B[1]-C[1])*(A[0]-C[0])+(C[0]-B[0])*(A[1]-C[1]);if(!den)continue;
      const w1=((B[1]-C[1])*(X0-C[0])+(C[0]-B[0])*(Y0-C[1]))/den,w2=((C[1]-A[1])*(X0-C[0])+(A[0]-C[0])*(Y0-C[1]))/den,w3=1-w1-w2;
      if(w1<-.002||w2<-.002||w3<-.002)continue;
      const u=w1*V[a][0]+w2*V[b][0]+w3*V[cc][0],v=w1*V[a][1]+w2*V[b][1]+w3*V[cc][1],X=tx*T+u*T,Y=ty*T+v*T;
      let[e,tt,hh]=samp(u,v);e+=(noise3(X/14,Y/14,0,layout+7)-.5)*.022;
      const dd=c01x((noise3(X/38,Y/38,0,layout+5)-.5)*2.2+.5),m=surfaceOf(e,tt,hh,dd);let col;
      if(m==="water"){if(e>SEA-.012)col=foam;else{const w=noise3(X/9,Y/3.5,0,21),C3=GROUND.water;col=C3[w>.68?2:w<.3?1:0];if(typeof col==="string"){const n=parseInt(col.slice(1),16);col=[n>>16&255,n>>8&255,n&255]}}}
      else{let lv=-1;for(const e2 of creases[q]){const ex=e2.B[0]-e2.A[0],ey=e2.B[1]-e2.A[1];if(Math.abs(ex*(Y0-e2.A[1])-ey*(X0-e2.A[0]))/H2(ex,ey)<.75){lv=e2.lv;break}}
        const s=noise3(X/3.1,Y/3.1,0,9);col=rampOf(m)[lv>=0?lv:Math.max(1,Math.min(5,tn[q]+(s>.68?1:s<.3?-1:0)))]}
      const k=(py*Wd+px)*4,f=grid&&(u>.97||v>.97)?.88:1;d[k]=col[0]*f;d[k+1]=col[1]*f;d[k+2]=col[2]*f;d[k+3]=255;break}}
  g.putImageData(img,0,0);return{c,hmax}}
const terrainCache=new Map(),cellMem=new Map();
function resetGround(){terrainCache.clear();cellMem.clear();if(typeof tileMem!=="undefined")tileMem.clear()}
function cellInfo(gx,gy,CELL){const k=gx+","+gy;let v=cellMem.get(k);if(!v){const f=fieldsAt((gx+.5)*CELL*T,(gy+.5)*CELL*T);v={f,bio:biomeAt(...f)};cellMem.set(k,v);if(cellMem.size>20000)cellMem.clear()}return v}
function placeholderTile(tx,ty){const L=[cornerLevel(tx,ty),cornerLevel(tx+1,ty),cornerLevel(tx+1,ty+1),cornerLevel(tx,ty+1)],h=L.map(l=>l*STEP),hmax=Math.max(...h);
  const f=fieldsAt((tx+.5)*T,(ty+.5)*T),m=surfaceOf(f[0],f[1],f[2],.5),c=rampOf(m==="water"?"water":m)[3];return{h,hmax,col:`rgb(${c[0]},${c[1]},${c[2]})`}}
function drawObj(d){if(sel&&sel.halo&&d.sl===sel.sl&&d.gx===sel.gx&&d.gy===sel.gy&&d.sl.state==="ready")lctx.drawImage(sel.halo,d.dx-1,d.dy-1);
  lctx.drawImage(d.im,d.dx,d.dy);
  if(d.sl.state==="building"){const sc=d.sl.job.scan();if(sc){lctx.fillStyle="#00c4ff";lctx.fillRect(d.dx+sc.x,d.dy+sc.y,sc.w,1)}}}
function objImage(sl){if(sl.state==="building")return[sl.jcv,sl.job.ox,sl.job.oy,sl.job.w,sl.job.h];
  return[(sl.state==="erasing"&&sl.e>0)||sl.state==="appearing"?sl.ecv:sl.cv,sl.s.originX,sl.s.originY,sl.s.width,sl.s.height]}
// ---------- Vegetación decorativa (por baldosa, independiente de los objetos) ----------
const DECOR={pradera:["hierba","hierba","flores","flores","arbusto","hierba"],bosque:["hierba","seta","arbusto","hierba","tocon","flores"],desierto:["hierba","roca","roca","cactus"],
  nieve:["roca","hierba","roca"],pantano:["hierba","hierba","seta","hierba"],costa:["hierba","roca","hierba"]};
const DECOR_CAP={hierba:{blades:12,h:9,spread:5},flores:{n:4,spread:4,h:7},arbusto:{size:.75,n:5},roca:{size:4,n:1},seta:{n:2,size:1},tocon:{r:5,h:5},cactus:{h:16,arms:1}};
// Cada baldosa tiene su propia planta (semilla = baldosa): ninguna se repite.
const decorMem=new Map(),decorQ=[];let decorJob=null;
function decorAt(tx,ty,bio){const key=tx+","+ty;if(decorMem.has(key))return decorMem.get(key);const L=DECOR[bio]||[];if(!L.length){decorMem.set(key,null);return null}
  const r=rng(Math.floor(h32(tx,ty,layout+7919+seed)*2147483646)+1);r();const t2=pickR(r,L),p=genParams(t2,r,bio,DECOR_CAP[t2]);decorMem.set(key,null);decorQ.push({key,t:t2,p,rot:r()<.5?0:1});
  if(decorMem.size>1600){let n=0;for(const k of decorMem.keys()){if(n++>400)break;decorMem.delete(k)}}return null}
function pumpDecor(deadline){while(performance.now()<deadline){if(!decorJob){const q=decorQ.shift();if(!q)return;if(!decorMem.has(q.key))continue;const keep=G;G=WG;decorJob={q,job:makeJob(FURNI[q.t].build(q.p),q.rot,WG)};G=keep}
  decorJob.job.step(Infinity,deadline);if(decorJob.job.done){const s=decorJob.job.finish();s.cv=spriteCanvas(s);if(decorMem.has(decorJob.q.key))decorMem.set(decorJob.q.key,s);decorJob=null}}}
const tileMem=new Map();
function tileInfo(tx,ty){const k=tx+","+ty;let v=tileMem.get(k);if(!v){const f=fieldsAt((tx+.5)*T,(ty+.5)*T),L=[cornerLevel(tx,ty),cornerLevel(tx+1,ty),cornerLevel(tx+1,ty+1),cornerLevel(tx,ty+1)];
  v={bio:biomeAt(...f),water:f[0]<SEA+.004,flat:L.every(l=>l===L[0])};tileMem.set(k,v);if(tileMem.size>30000)tileMem.clear()}return v}
// ---------- Orden de profundidad isométrico ----------
// Cada elemento tiene su huella en el plano (rectángulo en baldosas) y su caja en pantalla.
// Solo se ordenan los pares que se solapan en pantalla: A va antes que B si su huella queda
// completamente detrás (menor x o menor y). Si las huellas se cruzan, el suelo va primero.
function isoSort(items){const n=items.length,adj=Array.from({length:n},()=>[]),indeg=new Int32Array(n);
  const behind=(a,b)=>a.r[1]<=b.r[0]+1e-6||a.r[3]<=b.r[2]+1e-6;
  // cubetas de 64 px en pantalla: solo se comparan elementos cercanos
  const B=64,grid=new Map(),seen=new Set();
  items.forEach((it,i)=>{for(let gx=Math.floor(it.b[0]/B);gx<=Math.floor((it.b[1]-1)/B);gx++)for(let gy=Math.floor(it.b[2]/B);gy<=Math.floor((it.b[3]-1)/B);gy++){const k=gx*65536+gy;let c=grid.get(k);if(!c)grid.set(k,c=[]);c.push(i)}});
  for(const cell of grid.values())for(let x=0;x<cell.length;x++){const i=cell[x],A=items[i];for(let y=x+1;y<cell.length;y++){const j=cell[y];if(j===i)continue;
    const pk=Math.min(i,j)*n+Math.max(i,j);if(seen.has(pk))continue;seen.add(pk);const Bt=items[j];
    if(A.b[0]>=Bt.b[1]||Bt.b[0]>=A.b[1]||A.b[2]>=Bt.b[3]||Bt.b[2]>=A.b[3])continue;
    const ab=behind(A,Bt),ba=behind(Bt,A);let first;
    if(ab&&!ba)first=0;else if(ba&&!ab)first=1;else if(A.k===0&&Bt.k!==0)first=0;else if(Bt.k===0&&A.k!==0)first=1;
    else{const da=A.r[0]+A.r[1]+A.r[2]+A.r[3],db=Bt.r[0]+Bt.r[1]+Bt.r[2]+Bt.r[3];first=da<db-1e-6?0:db<da-1e-6?1:(A.ord||0)<=(Bt.ord||0)?0:1}
    if(first===0){adj[i].push(j);indeg[j]++}else{adj[j].push(i);indeg[i]++}}}
  // Kahn con montículo por profundidad (estable y sin re-ordenar listas)
  const key=i=>items[i].r[0]+items[i].r[2]+(items[i].k===0?0:.001),heap=[];
  const push=i=>{heap.push(i);let c=heap.length-1;while(c){const p=(c-1)>>1;if(key(heap[p])<=key(heap[c]))break;[heap[p],heap[c]]=[heap[c],heap[p]];c=p}};
  const pop=()=>{const top=heap[0],last=heap.pop();if(heap.length){heap[0]=last;let c=0;for(;;){const l=2*c+1,r=l+1;let m=c;if(l<heap.length&&key(heap[l])<key(heap[m]))m=l;if(r<heap.length&&key(heap[r])<key(heap[m]))m=r;if(m===c)break;[heap[m],heap[c]]=[heap[c],heap[m]];c=m}}return top};
  for(let i=0;i<n;i++)if(!indeg[i])push(i);const out=[],used=new Uint8Array(n);
  while(out.length<n){if(!heap.length){let b=-1;for(let i=0;i<n;i++)if(!used[i]&&(b<0||key(i)<key(b)))b=i;indeg[b]=0;push(b)}
    const i=pop();if(used[i])continue;used[i]=1;out.push(items[i]);for(const j of adj[i])if(--indeg[j]===0&&!used[j])push(j)}
  return out}
function drawWorld(){const W=low.width,H=low.height,cx=Math.floor(cam.x),cy=Math.floor(cam.y),exterior=isExterior();
  lctx.fillStyle="#1c1c1c";lctx.fillRect(0,0,W,H);
  const inv=(sx,sy)=>[((sy+cy)/16+(sx+cx)/32)/2,((sy+cy)/16-(sx+cx)/32)/2];
  const cs=[inv(0,-40),inv(W,-40),inv(0,H+200),inv(W,H+200)],CELL=exterior?2:3;
  view={W,H,cx,cy};const tx0=Math.floor(Math.min(...cs.map(c=>c[0])))-2,tx1=Math.ceil(Math.max(...cs.map(c=>c[0])))+2,ty0=Math.floor(Math.min(...cs.map(c=>c[1])))-2,ty1=Math.ceil(Math.max(...cs.map(c=>c[1])))+2;
  drawn=[];visible=new Set();const items=[],top=[],occupied=new Set();
  // objetos
  for(let gx=Math.floor(tx0/CELL)-1;gx<=Math.ceil(tx1/CELL);gx++)for(let gy=Math.floor(ty0/CELL)-1;gy<=Math.ceil(ty1/CELL);gy++){
    if(h32(gx,gy,layout)>WS.dens)continue;
    const gsx0=32*(gx-gy)*CELL-cx,gsy0=16*(gx+gy)*CELL-cy;if(gsx0<-160||gsx0>W+160||gsy0<-120||gsy0>H+260)continue;
    const sl=slotForCell(gx+","+gy,exterior?cellInfo(gx,gy,CELL).bio:"interior",cellHash(gx,gy));if(!sl)continue;sl.seen=frameNo;
    {const gsx=32*(gx-gy)*CELL-cx,gsy=16*(gx+gy)*CELL-cy;if(gsx>-120&&gsx<W+120&&gsy>-60&&gsy<H+200)visible.add(sl.i)}
    if(sl.state==="queued"||sl.state==="void")continue;
    const sp=sl.spec,ax=gx*CELL+Math.floor(h32(gx,gy,layout+31)*Math.max(1,CELL-sp.fw+1)),ay=gy*CELL+Math.floor(h32(gx,gy,layout+47)*Math.max(1,CELL-sp.fd+1));
    let z=0;
    if(exterior){const l0=cornerLevel(ax,ay);let flat=true;for(let i=0;i<=sp.fw&&flat;i++)for(let j=0;j<=sp.fd;j++)if(cornerLevel(ax+i,ay+j)!==l0){flat=false;break}
      if(!flat)continue;const f=fieldsAt((ax+sp.fw/2)*T,(ay+sp.fd/2)*T);if(f[0]<SEA+.004)continue;z=l0*STEP}
    const[im,ox,oy,iw,ih]=objImage(sl),dx=32*(ax-ay)-cx-ox,dy=16*(ax+ay)-cy-oy-z;if(dx>W||dy>H||dx+iw<0||dy+ih<0)continue;
    const o={sl,im,dx,dy,gx,gy,k:1,r:[ax,ax+sp.fw,ay,ay+sp.fd],b:[dx,dx+iw,dy,dy+ih]};drawn.push(o);items.push(o);
    for(let i=0;i<sp.fw;i++)for(let j=0;j<sp.fd;j++)occupied.add((ax+i)+","+(ay+j))}
  // suelo (+ vegetación decorativa)
  for(let tx=tx0;tx<=tx1;tx++)for(let ty=ty0;ty<=ty1;ty++){const sx=32*(tx-ty)-cx,sy=16*(tx+ty)-cy;if(sx<-32||sx>W+32||sy<-34||sy>H+120)continue;
    const key=tx+","+ty,hm=exterior?Math.max(cornerLevel(tx,ty),cornerLevel(tx+1,ty),cornerLevel(tx+1,ty+1),cornerLevel(tx,ty+1))*STEP:0;
    items.push({k:0,tx,ty,sx,sy,key,r:[tx,tx+1,ty,ty+1],b:[sx-32,sx+32,sy-hm,sy+33]});
    if(exterior&&WS.veg>0&&!occupied.has(key)&&h32(tx,ty,layout+101)<WS.veg*.85){const ti=tileInfo(tx,ty);if(ti.water)continue;
      const s=decorAt(tx,ty,ti.bio);if(!s)continue;const u=.2+h32(tx,ty,layout+107)*.6,v=.2+h32(tx,ty,layout+109)*.6,X=(tx+u)*T,Y=(ty+v)*T;
      if(fieldsAt(X,Y)[0]<SEA+.006)continue;const g=heightAt(X,Y),X0=X-16,Y0=Y-16,ddx=Math.round(X0-Y0-cx-s.originX),ddy=Math.round((X0+Y0)/2-g-cy-s.originY);
      items.push({k:1,r:[tx+u-.15,tx+u+.15,ty+v-.15,ty+v+.15],b:[ddx,ddx+s.width,ddy,ddy+s.height],draw:()=>lctx.drawImage(s.cv,ddx,ddy)})}}
  if(exterior)faunaItems(items,top,cx,cy);
  // baldosas que faltan: presupuesto propio (6 ms, mínimo 2 por cuadro), primero las del centro
  if(exterior){const miss=items.filter(it=>it.k===0&&!terrainCache.has(it.key)).sort((a,b)=>Math.abs(a.sx-W/2)+Math.abs(a.sy-H/2)-Math.abs(b.sx-W/2)-Math.abs(b.sy-H/2));
    const t0=performance.now();let made=0;for(const it of miss){if(made>=2&&performance.now()-t0>6)break;terrainCache.set(it.key,makeTerrainTile(it.tx,it.ty));made++}
    if(terrainCache.size>5000)for(const k of[...terrainCache.keys()].slice(0,1200))terrainCache.delete(k)}
  for(const it of isoSort(items)){if(it.draw){it.draw();continue}if(it.k===1){drawObj(it);continue}
    if(!exterior){lctx.drawImage(TILES[WS.check?((it.tx+it.ty)&1):0],it.sx-32,it.sy);continue}
    const tt=terrainCache.get(it.key);
    if(tt){lctx.drawImage(tt.c,it.sx-32,it.sy-tt.hmax);continue}
    const ph=placeholderTile(it.tx,it.ty);lctx.fillStyle=ph.col;lctx.beginPath();
    [[0,0,0],[1,0,1],[1,1,2],[0,1,3]].forEach(([u,v,i],n)=>{const X=it.sx+32*(u-v),Y=it.sy+16*(u+v)-ph.h[i];n?lctx.lineTo(X,Y):lctx.moveTo(X,Y)});lctx.closePath();lctx.fill()}
  for(const it of top)it.draw();
  wctx.imageSmoothingEnabled=false;wctx.drawImage(low,0,0,wcv.width,wcv.height)}
const DIRV=[[2,1],[-2,1],[0,1],[1,0]];
function loop(t){requestAnimationFrame(loop);if(current!=="mundo")return;const dt=loop.last?Math.min(.05,(t-loop.last)/1000):0;loop.last=t;
  if(!paused){update(t,dt);if(!drag){const[vx,vy]=DIRV[WS.dir],n=Math.hypot(vx,vy),sp=WS.speed*14;cam.x+=vx/n*sp*dt;cam.y+=vy/n*sp*dt}}
  drawWorld()}
// arrastre + clic para abrir en el laboratorio
let drag=null;
const toLow=e=>{const r=wcv.getBoundingClientRect();return[(e.clientX-r.left)/r.width*low.width,(e.clientY-r.top)/r.height*low.height]};
function pickAt(lx,ly){for(let i=drawn.length-1;i>=0;i--){const d=drawn[i];if(d.sl.state!=="ready")continue;const s=d.sl.s,x=Math.floor(lx-d.dx),y=Math.floor(ly-d.dy);
  if(x<0||y<0||x>=s.width||y>=s.height)continue;if(s.mask[y*s.width+x])return d}return null}
wcv.addEventListener("pointerdown",e=>{drag={x:e.clientX,y:e.clientY,cx:cam.x,cy:cam.y,moved:false};wcv.setPointerCapture(e.pointerId);wcv.style.cursor="grabbing"});
wcv.addEventListener("pointermove",e=>{if(drag){const z=wcv.getBoundingClientRect().width/low.width,dx=(e.clientX-drag.x)/z,dy=(e.clientY-drag.y)/z;if(Math.abs(dx)+Math.abs(dy)>2)drag.moved=true;cam.x=drag.cx-dx;cam.y=drag.cy-dy;return}
  const[lx,ly]=toLow(e);wcv.style.cursor=pickAt(lx,ly)?"pointer":"grab"});
wcv.addEventListener("pointerup",e=>{const d=drag;drag=null;wcv.style.cursor="grab";if(d&&!d.moved){const[lx,ly]=toLow(e),hit=pickAt(lx,ly);if(hit)openPick(hit);else closePick()}});
function wslider(id,key,fmtv,on){const i=$(id),o=$(id+"V");i.value=WS[key];o.textContent=fmtv(WS[key]);i.addEventListener("input",()=>{WS[key]=+i.value;o.textContent=fmtv(WS[key]);on&&on();save()})}
wslider("wspeed","speed",v=>v===0?"quieto":"×"+fmt(v));wslider("wzoom","zoom",v=>"×"+v,sizeWorld);
wslider("wdens","dens",v=>Math.round(v*100)+" %");wslider("wpool","pool",v=>v+" únicos");
wslider("whue","hue",v=>(v>0?"+":"")+v+"°",reView);wslider("walpha","alpha",v=>Math.round(v*100)+" %",reView);
wslider("wveg","veg",v=>Math.round(v*100)+" %");
// La luz cambia el sombreado de todo: terreno, objetos, vegetación y fauna se vuelven a dibujar.
let lightTimer=0;function applyLight(){WG.light=WS.light;setLight(WS.light);terrainCache.clear();decorMem.clear();decorQ.length=0;decorJob=null;
  faunaSprites.clear();faunaQ.length=0;faunaJob=null;spriteMem.clear();thumbCache.clear();resetWorld()}
wslider("wlight","light",v=>(v>0?"+":"")+v+"°",()=>{clearTimeout(lightTimer);lightTimer=setTimeout(applyLight,350)});
WG.light=WS.light;setLight(WS.light);
wslider("wdraw","draw",v=>Math.round(8*2**(v-1))+" px/cuadro");wslider("wpar","par",v=>String(v));wslider("wevery","every",v=>fmt(v)+" s");
$("wdir").value=WS.dir;$("wdir").addEventListener("change",e=>{WS.dir=+e.target.value;save()});
$("wcheck").checked=WS.check;$("wcheck").addEventListener("change",e=>{WS.check=e.target.checked;save()});
$("wrenew").checked=WS.renew;$("wrenew").addEventListener("change",e=>{WS.renew=e.target.checked;save()});
const pbtn=$("wpause");const syncP=()=>pbtn.textContent=paused?"Reanudar":"Pausar";syncP();
pbtn.addEventListener("click",()=>{paused=!paused;syncP()});
$("wnew").addEventListener("click",()=>{seed=(Math.random()*1e6)|0;$("wseed").textContent="semilla "+seed;resetWorld()});
$("wseed").textContent="semilla "+seed;



// =================== VISTA: GIRO DE TONO + OPACIDAD ==================
// Se aplica en vivo sobre los sprites ya construidos (no hay que re-renderizar).
const fmt1=v=>String(Math.round(v*10)/10);
let hueCache={deg:null,map:null};
function rotPix(r,g,b){if(hueCache.deg!==WS.hue)hueCache={deg:WS.hue,map:new Map()};const key=(r<<16)|(g<<8)|b;let c=hueCache.map.get(key);
  if(!c){const[h,s,l]=rgb2hsl(r,g,b);c=hsl2rgb(h+WS.hue,s,l);hueCache.map.set(key,c)}return c}
function viewRGBA(s){const hue=WS.hue,al=WS.alpha;if(!hue&&al>=1)return s.rgba;const o=new Uint8ClampedArray(s.rgba);
  for(let k=0,n=s.mask.length;k<n;k++){const m=s.mask[k];if(!m)continue;const q=k*4;
    if(hue){const c=rotPix(o[q],o[q+1],o[q+2]);o[q]=c[0];o[q+1]=c[1];o[q+2]=c[2]}if(m===2)o[q+3]=Math.round(o[q+3]*al)}return o}
function viewCanvas(s){const c=mk(s.width,s.height);c.getContext("2d").putImageData(new ImageData(viewRGBA(s),s.width,s.height),0,0);return c}
function viewPreview(img){const hue=WS.hue,al=WS.alpha;if(!hue&&al>=1)return img;const d=new Uint8ClampedArray(img.data);
  for(let q=0;q<d.length;q+=4){if(d[q+3]!==255)continue;if(hue){const c=rotPix(d[q],d[q+1],d[q+2]);d[q]=c[0];d[q+1]=c[1];d[q+2]=c[2]}d[q+3]=Math.round(255*al)}
  return new ImageData(d,img.width,img.height)}
const hexHue=h=>{if(!WS.hue)return h;const n=parseInt(h.slice(1),16),[a,s,l]=rgb2hsl(n>>16&255,n>>8&255,n&255);return hex(hsl2rgb(a+WS.hue,s,l))};
function hueParams(t,p){const o=JSON.parse(JSON.stringify(p));(FURNI[t].colors||[]).forEach(([k])=>{if(o[k])o[k]=hexHue(o[k])});return o}
/** Copia de un objeto con los colores tal como se ven (giro de tono aplicado). */
function hueItem(it){const o=JSON.parse(JSON.stringify(it));if(o.type==="supra")o.children.forEach(c=>c.params=hueParams(c.type,c.params));else o.params=hueParams(o.type,o.params);return o}
let reviewPending=false;
function reView(){if(reviewPending)return;reviewPending=true;requestAnimationFrame(()=>{reviewPending=false;
  for(const sl of slots){if(sl.s&&(sl.state==="ready"||sl.state==="erasing"||sl.state==="appearing")){sl.cv=viewCanvas(sl.s);if(sl.state!=="ready")sl.eview=viewRGBA(sl.s)}
    if(sl.state==="building")paintJob(sl)}
  if(sel){const c=$("pickCv"),g=c.getContext("2d");g.imageSmoothingEnabled=false;g.clearRect(0,0,c.width,c.height);g.drawImage(sel.sl.cv,0,0,c.width,c.height)}})}

// =========================== SUPRAFURNIS ============================
const nameOf=t=>t==="supra"?"Suprafurni":FURNI[t].name;
function buildWG(t,p){const keep=G;G=WG;try{return FURNI[t].build(p)}finally{G=keep}}
function kidFoot(k){const fp=buildWG(k.type,k.params).footprint;return k.rot%2?[fp[1],fp[0]]:[fp[0],fp[1]]}
const kidStack=k=>FURNI[k.type].stack(k.params);
// Apilado automático: cada pieza descansa sobre la superficie más alta de las piezas
// añadidas antes que pisan su huella. "dz" es un ajuste manual encima de eso.
function stackKids(kids){for(const k of kids){const f=kidFoot(k);k.fw=f[0];k.fd=f[1]}
  const order=kids.slice().sort((a,b)=>a.born-b.born);
  for(let i=0;i<order.length;i++){const k=order[i];let base=0;
    for(let j=0;j<i;j++){const o=order[j];if(k.x<o.x+o.fw-1e-6&&o.x<k.x+k.fw-1e-6&&k.y<o.y+o.fd-1e-6&&o.y<k.y+k.fd-1e-6)base=Math.max(base,o.z+kidStack(o))}
    k.z=Math.max(0,base+(k.dz||0))}
  return kids}
function supraLayout(it,extra=0){let kids=stackKids(it.children.map(c=>({...c})));
  let SW=Math.max(1,Math.ceil(Math.max(...kids.map(k=>k.x+k.fw))-1e-6)),SD=Math.max(1,Math.ceil(Math.max(...kids.map(k=>k.y+k.fd))-1e-6));
  for(let r=0;r<((it.rot||0)+extra)%4;r++){const sd=SD;kids=kids.map(k=>({...k,x:sd-k.y-k.fd,y:k.x,rot:(k.rot+1)%4,fw:k.fd,fd:k.fw}));[SW,SD]=[SD,SW]}
  return{kids,SW,SD}}
function supraFoot(it){const L=supraLayout(it);return[L.SW,L.SD]}
function itemStack(it){if(it.type!=="supra")return FURNI[it.type].stack(it.params);return Math.max(0,...stackKids(it.children.map(c=>({...c}))).map(k=>k.z+kidStack(k)))}
/** Trabajo compuesto: construye las piezas una por una (de atrás hacia adelante) y las une. */
function makeSupraJob(it,S=WG){const{kids,SW,SD}=supraLayout(it);
  for(const k of kids){k.job=makeJob(buildWG(k.type,k.params),k.rot,S);const X=k.x*T,Y=k.y*T;k.sx=Math.round(X-Y);k.sy=Math.round((X+Y)/2-k.z)}
  const x0=Math.min(...kids.map(k=>k.sx-k.job.ox)),y0=Math.min(...kids.map(k=>k.sy-k.job.oy)),
    x1=Math.max(...kids.map(k=>k.sx-k.job.ox+k.job.w)),y1=Math.max(...kids.map(k=>k.sy-k.job.oy+k.job.h));
  const w=x1-x0,h=y1-y0,ox=-x0,oy=-y0,tmp=mk(1,1);let idx=0;
  const job={w,h,ox,oy,W:SW*T,D:SD*T,done:false,
    step(n=Infinity,deadline=Infinity){let c=0;
      while(idx<kids.length&&c<n){const k=kids[idx];c+=k.job.step(n-c,deadline);if(k.job.done){k.s=k.job.finish();k.cv=null;idx++}if(performance.now()>deadline)break}
      job.done=idx>=kids.length;return c},
    scan(){const k=kids[idx];if(!k)return null;const s=k.job.scan();return{x:ox+k.sx-k.job.ox+s.x,y:oy+k.sy-k.job.oy+s.y,w:s.w}},
    paint(ctx,view){ctx.clearRect(0,0,w,h);
      for(let i=0;i<=idx&&i<kids.length;i++){const k=kids[i];
        if(i<idx){if(!k.cv)k.cv=view(k.s);ctx.drawImage(k.cv,ox+k.sx-k.s.originX,oy+k.sy-k.s.originY)}
        else{tmp.width=k.job.w;tmp.height=k.job.h;tmp.getContext("2d").putImageData(viewPreview(k.job.img),0,0);ctx.drawImage(tmp,ox+k.sx-k.job.ox,oy+k.sy-k.job.oy)}}},
    finish(){const cv=mk(w,h),g=cv.getContext("2d"),M=new Uint8Array(w*h);
      for(const k of kids){const bx=ox+k.sx-k.s.originX,by=oy+k.sy-k.s.originY;g.drawImage(spriteCanvas(k.s),bx,by);
        for(let j=0;j<k.s.height;j++)for(let i=0;i<k.s.width;i++){const m=k.s.mask[j*k.s.width+i];if(m){const X=bx+i,Y=by+j;if(X>=0&&Y>=0&&X<w&&Y<h)M[Y*w+X]=m}}}
      const data=g.getImageData(0,0,w,h).data;let a=w,b=h,c=-1,d=-1;
      for(let j=0;j<h;j++)for(let i=0;i<w;i++)if(data[(j*w+i)*4+3]){a=Math.min(a,i);c=Math.max(c,i);b=Math.min(b,j);d=Math.max(d,j)}
      if(c<0){a=b=0;c=d=0}const cw=c-a+1,ch=d-b+1,rgba=new Uint8ClampedArray(cw*ch*4),mask=new Uint8Array(cw*ch);
      for(let j=0;j<ch;j++){rgba.set(data.subarray(((j+b)*w+a)*4,((j+b)*w+a+cw)*4),j*cw*4);mask.set(M.subarray((j+b)*w+a,(j+b)*w+a+cw),j*cw)}
      return{width:cw,height:ch,rgba,mask,originX:ox-a,originY:oy-b,W:SW*T,D:SD*T}}};
  return job}
function makeItemJob(it,S=WG){return it.type==="supra"?makeSupraJob(it,S):makeJob(buildWG(it.type,it.params),it.rot,S)}

// ====================== EDITOR DE SUPRAFURNIS =======================
const SE={id:null,name:"Suprafurni 1",grid:4,step:.5,kids:[],sel:null,born:0,fam:"all"};
const seCache=new Map(),seLow=mk(1,1),seCv=$("seCv");let seGeom=null;
function seSprite(k){const key=k.type+"|"+k.rot+"|"+JSON.stringify(k.params);let s=seCache.get(key);
  if(!s){s=render(buildWG(k.type,k.params),k.rot,WG);s.cv=spriteCanvas(s);seCache.set(key,s)}return s}
function seClamp(k){const[fw,fd]=kidFoot(k);k.x=Math.min(Math.max(0,k.x),Math.max(0,SE.grid-fw));k.y=Math.min(Math.max(0,k.y),Math.max(0,SE.grid-fd))}
const seSelected=()=>SE.kids.find(k=>k.uid===SE.sel)||null;
function seDraw(){if(current!=="supra")return;stackKids(SE.kids);
  const N=SE.grid,top=Math.ceil(Math.max(90,...SE.kids.map(k=>k.z+seSprite(k).originY-16*(k.x+k.y)+8))),W=N*64+16,H=Math.ceil(top+N*32+16),ox=N*32+8,oy=top;
  seLow.width=W;seLow.height=H;const g=seLow.getContext("2d");g.clearRect(0,0,W,H);
  for(let tx=0;tx<N;tx++)for(let ty=0;ty<N;ty++)g.drawImage(TILES[(tx+ty)&1],ox+32*(tx-ty)-32,oy+16*(tx+ty));
  const sk=seSelected();
  if(sk){const pts=[[sk.x,sk.y],[sk.x+sk.fw,sk.y],[sk.x+sk.fw,sk.y+sk.fd],[sk.x,sk.y+sk.fd]].map(([x,y])=>[ox+(x-y)*32,oy+(x+y)*16]);
    g.fillStyle="rgba(0,102,255,.24)";g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fill()}
  seGeom={items:[]};
  for(const k of SE.kids){const s=seSprite(k),X=k.x*T,Y=k.y*T,dx=Math.round(ox+X-Y-s.originX),dy=Math.round(oy+(X+Y)/2-k.z-s.originY);
    if(k.uid===SE.sel){s.halo=s.halo||haloFor(s);g.drawImage(s.halo,dx-1,dy-1)}g.drawImage(s.cv,dx,dy);seGeom.items.push({k,s,dx,dy})}
  const st=$("seStage"),z=Math.max(1,Math.min(6,Math.floor(Math.min((st.clientWidth-20)/W,(st.clientHeight-20)/H))));
  seCv.width=W*z;seCv.height=H*z;const c=seCv.getContext("2d");c.imageSmoothingEnabled=false;c.drawImage(seLow,0,0,seCv.width,seCv.height);
  seLayers();seSelUI()}
function seThumb(host,s){const c=mk(s.width,s.height);c.getContext("2d").drawImage(s.cv,0,0);host.appendChild(c)}
function seLayers(){const host=$("seLayers");host.innerHTML="";
  if(!SE.kids.length){const p=document.createElement("p");p.className="note";p.textContent="Añade furnis desde el catálogo de la izquierda.";host.appendChild(p);return}
  for(let i=SE.kids.length-1;i>=0;i--){const k=SE.kids[i],row=document.createElement("div");row.className="layer"+(k.uid===SE.sel?" on":"");
    row.innerHTML='<div class="th"></div><div><div class="nm"></div><div class="z"></div></div><div class="b"><button class="ib" data-m="up" aria-label="Traer adelante">↑</button><button class="ib" data-m="down" aria-label="Enviar atrás">↓</button><button class="ib" data-m="del" aria-label="Quitar">×</button></div>';
    row.querySelector(".nm").textContent=k.name;row.querySelector(".z").textContent=`altura ${fmt1(k.z)} · capa ${i+1}`;seThumb(row.querySelector(".th"),seSprite(k));
    row.addEventListener("click",e=>{const m=e.target.closest("button")?.dataset.m,idx=SE.kids.indexOf(k);
      if(m==="up"){if(idx<SE.kids.length-1){SE.kids.splice(idx,1);SE.kids.splice(idx+1,0,k)}}
      else if(m==="down"){if(idx>0){SE.kids.splice(idx,1);SE.kids.splice(idx-1,0,k)}}
      else if(m==="del"){SE.kids.splice(idx,1);if(SE.sel===k.uid)SE.sel=null}
      else SE.sel=k.uid;seDraw()});
    host.appendChild(row)}}
function seSelUI(){const k=seSelected();["seRot","seDup","seDel","seDz"].forEach(id=>$(id).disabled=!k);document.querySelectorAll("[data-mv]").forEach(b=>b.disabled=!k);
  $("seDz").value=k?k.dz||0:0;$("seDzV").textContent=k?(k.dz>0?"+":"")+(k.dz||0)+" px":"—";
  if(SE.kids.length){const it={type:"supra",rot:0,children:SE.kids};const fp=supraFoot(it);$("seStat").textContent=`${SE.kids.length} piezas · ${fp[0]}×${fp[1]} baldosas · altura ${fmt1(itemStack(it))}`}
  else $("seStat").textContent="";$("seName").value=SE.name;
  $("seSave").querySelector(".pt-ring__face").textContent=SE.id&&cat.items.some(i=>i.id===SE.id)?"Actualizar en catálogo":"Guardar en catálogo"}
function seRefresh(){const f=$("seFam");f.innerHTML="";f.add(new Option("Todos los objetos","all"));cat.families.forEach(x=>f.add(new Option(x.name,x.id)));
  if(![...f.options].some(o=>o.value===SE.fam))SE.fam="all";f.value=SE.fam;
  const list=cat.items.filter(i=>i.type!=="supra"&&(SE.fam==="all"||i.families.includes(SE.fam))).sort((a,b)=>b.created-a.created),host=$("seList");host.innerHTML="";
  $("seListNote").textContent=list.length?"Con una pieza seleccionada, lo que añadas se coloca encima.":"No hay furnis aquí. Guárdalos desde el Mundo o el Laboratorio.";
  for(const it of list){const row=document.createElement("div");row.className="serow";
    row.innerHTML='<div class="th"></div><div class="nm"></div><button class="ib" aria-label="Añadir al plano">+</button>';
    row.querySelector(".nm").textContent=it.name;row.querySelector("button").addEventListener("click",()=>seAdd(it));host.appendChild(row);requestThumb(it,row.querySelector(".th"))}}
function seAdd(it){const sk=seSelected(),k={uid:uid(),ref:it.id,name:it.name,type:it.type,rot:it.rot,params:JSON.parse(JSON.stringify(it.params)),x:sk?sk.x:0,y:sk?sk.y:0,dz:0,born:SE.born++};
  seClamp(k);SE.kids.push(k);SE.sel=k.uid;seDraw();$("seNote").textContent=sk?`«${it.name}» quedó encima de «${sk.name}».`:`«${it.name}» añadido. Arrástralo para moverlo.`}
function seMove(dx,dy){const k=seSelected();if(!k)return;k.x+=dx*SE.step;k.y+=dy*SE.step;seClamp(k);seDraw()}
document.querySelectorAll("[data-mv]").forEach(b=>b.addEventListener("click",()=>{const m=b.dataset.mv;seMove(m==="+x"?1:m==="-x"?-1:0,m==="+y"?1:m==="-y"?-1:0)}));
$("seRot").addEventListener("click",()=>{const k=seSelected();if(!k)return;k.rot=(k.rot+1)%4;seClamp(k);seDraw()});
$("seDup").addEventListener("click",()=>{const k=seSelected();if(!k)return;const n={...JSON.parse(JSON.stringify(k)),uid:uid(),born:SE.born++};
  if(n.x+n.fw+SE.step<=SE.grid)n.x+=SE.step;seClamp(n);SE.kids.push(n);SE.sel=n.uid;seDraw()});
$("seDel").addEventListener("click",()=>{const k=seSelected();if(!k)return;SE.kids=SE.kids.filter(x=>x!==k);SE.sel=null;seDraw()});
$("seDz").addEventListener("input",e=>{const k=seSelected();if(!k)return;k.dz=+e.target.value;seDraw()});
$("seStep").addEventListener("change",e=>{SE.step=+e.target.value});
{const i=$("seGrid");i.value=SE.grid;$("seGridV").textContent=SE.grid+"×"+SE.grid;i.addEventListener("input",()=>{SE.grid=+i.value;$("seGridV").textContent=SE.grid+"×"+SE.grid;SE.kids.forEach(seClamp);seDraw()})}
$("seName").addEventListener("change",e=>{SE.name=e.target.value.trim().slice(0,60)||"Suprafurni"});
$("seFam").addEventListener("change",e=>{SE.fam=e.target.value;seRefresh()});
$("seAuto").addEventListener("click",()=>{stackKids(SE.kids);SE.kids.sort((a,b)=>(a.x+a.fw/2+a.y+a.fd/2)-(b.x+b.fw/2+b.y+b.fd/2)||a.z-b.z);seDraw()});
$("seClear").addEventListener("click",()=>{SE.kids=[];SE.sel=null;SE.id=null;SE.name="Suprafurni "+(cat.items.filter(i=>i.type==="supra").length+1);seDraw()});
function seItem(){const mx=Math.min(...SE.kids.map(k=>k.x)),my=Math.min(...SE.kids.map(k=>k.y));
  return{type:"supra",name:SE.name,rot:0,params:{},children:SE.kids.map(k=>({ref:k.ref,name:k.name,type:k.type,rot:k.rot,params:JSON.parse(JSON.stringify(k.params)),x:k.x-mx,y:k.y-my,dz:k.dz||0,born:k.born}))}}
function seSave(asNew){if(!SE.kids.length){$("seNote").textContent="Añade al menos una pieza.";return}
  const ex=!asNew&&SE.id?cat.items.find(i=>i.id===SE.id):null,famIds=new Set(cat.families.map(f=>f.id));
  const it=sanitizeItem({...seItem(),id:ex?ex.id:uid(),families:ex?ex.families:(catFilter!=="all"?[catFilter]:[]),created:ex?ex.created:Date.now()},famIds);
  if(ex)cat.items[cat.items.indexOf(ex)]=it;else cat.items.push(it);SE.id=it.id;persistCat();seSelUI();
  $("seNote").textContent=(ex?"Actualizado":"Guardado")+" en el catálogo: «"+it.name+"». Ya puede aparecer en el mundo."}
$("seSave").addEventListener("click",()=>seSave(false));$("seSaveNew").addEventListener("click",()=>seSave(true));
$("seJson").addEventListener("click",()=>{if(!SE.kids.length)return;offerFile(JSON.stringify(furniJSON(seItem()),null,2),"suprafurni.json",m=>$("seNote").textContent=m)});
$("sePng").addEventListener("click",()=>{if(!SE.kids.length)return;const j=makeSupraJob(seItem());j.step();offer(spriteCanvas(j.finish()),"suprafurni.png")});
{const th=$("seTheme"),bi=$("seBio");Object.entries(THEMES).forEach(([k,v])=>th.add(new Option(v.name,k)));MIX.forEach(k=>bi.add(new Option(BIOMES[k].name,k)));
  const sync=()=>{const b=Object.entries(THEMES[th.value].bio).sort((a,c)=>c[1]-a[1])[0][0];bi.value=b};th.addEventListener("change",sync);sync();
  $("seGen").addEventListener("click",()=>{const r=rng((Math.random()*2e9|0)+1),it=genComposition(th.value,r,bi.value);
    SE.kids=it.children.map((c,i)=>({...c,uid:uid(),born:i}));SE.born=SE.kids.length;SE.id=null;SE.name=it.name;SE.sel=null;SE.grid=Math.max(SE.grid,3);
    $("seGrid").value=SE.grid;$("seGridV").textContent=SE.grid+"×"+SE.grid;seDraw();$("seNote").textContent=`Conjunto «${it.name}» generado con ${it.children.length} piezas. Ajusta, reordena capas o genera otro.`})}
function openSupraEditor(it){SE.id=cat.items.some(i=>i.id===it.id)?it.id:null;SE.name=it.name||"Suprafurni";
  SE.kids=it.children.map(c=>({...JSON.parse(JSON.stringify(c)),uid:uid()}));SE.born=Math.max(0,...SE.kids.map(k=>k.born+1));
  const fp=supraFoot({...it,rot:0});SE.grid=Math.min(6,Math.max(SE.grid,fp[0],fp[1]));$("seGrid").value=SE.grid;$("seGridV").textContent=SE.grid+"×"+SE.grid;
  SE.sel=null;location.hash="supra";if(current==="supra"){seRefresh();seDraw()}}
// arrastrar piezas en el plano
let seDrag=null,seRaf=0;
const seLowPt=e=>{const r=seCv.getBoundingClientRect();return[(e.clientX-r.left)/r.width*seLow.width,(e.clientY-r.top)/r.height*seLow.height]};
function seHit(x,y){if(!seGeom)return null;for(let i=seGeom.items.length-1;i>=0;i--){const it=seGeom.items[i],px=Math.floor(x-it.dx),py=Math.floor(y-it.dy);
  if(px>=0&&py>=0&&px<it.s.width&&py<it.s.height&&it.s.mask[py*it.s.width+px])return it.k}return null}
seCv.addEventListener("pointerdown",e=>{const[x,y]=seLowPt(e),k=seHit(x,y);SE.sel=k?k.uid:null;if(k){seDrag={k,x,y,x0:k.x,y0:k.y};seCv.setPointerCapture(e.pointerId)}seDraw()});
seCv.addEventListener("pointermove",e=>{const[x,y]=seLowPt(e);if(!seDrag){seCv.style.cursor=seHit(x,y)?"grab":"default";return}seCv.style.cursor="grabbing";
  const dsx=x-seDrag.x,dsy=y-seDrag.y,k=seDrag.k,st=SE.step,nx=Math.round((seDrag.x0+(dsy+dsx/2)/T)/st)*st,ny=Math.round((seDrag.y0+(dsy-dsx/2)/T)/st)*st;
  if(nx!==k.x||ny!==k.y){k.x=nx;k.y=ny;seClamp(k);if(!seRaf)seRaf=requestAnimationFrame(()=>{seRaf=0;seDraw()})}});
seCv.addEventListener("pointerup",()=>{seDrag=null;seCv.style.cursor="default"});
new ResizeObserver(()=>{if(current==="supra")seDraw()}).observe($("seStage"));
addEventListener("keydown",e=>{if(current!=="supra"||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)||!seSelected())return;
  const m={ArrowRight:[1,0],ArrowLeft:[-1,0],ArrowDown:[0,1],ArrowUp:[0,-1]}[e.key];if(m){e.preventDefault();seMove(...m)}
  if(e.key==="Delete"||e.key==="Backspace"){e.preventDefault();$("seDel").click()}});


// ===================== LABORATORIO: ALTERNATIVAS =====================
// Variantes del furni actual: muta parámetros (forma) y/o gira el tono y la luz (color).
let altToken=0;const altBox=$("altGrid");
{const i=$("altAmt"),o=$("altAmtV");const f=()=>o.textContent=Math.round(i.value*100)+" %";f();i.addEventListener("input",f)}
function variant(t,base,r,mode,amt){const f=FURNI[t],p=JSON.parse(JSON.stringify(base));
  if(mode!=="color"){(f.params||[]).forEach(([k,,mn,mx,st])=>{if(k==="seed"){p[k]=1+Math.floor(r()*499);return}
      p[k]=+fmt(Math.min(mx,Math.max(mn,Math.round((p[k]+(r()-.5)*2*amt*(mx-mn)*.5)/st)*st)))});
    (f.selects||[]).forEach(([k,,o])=>{if(r()<amt*.5)p[k]=o[Math.floor(r()*o.length)][0]});
    (f.toggles||[]).forEach(([k])=>{if(r()<amt*.25)p[k]=!p[k]})}
  if(mode!=="shape"){const dh=(r()-.5)*2*amt*180,dl=(r()-.5)*amt*.25;
    (f.colors||[]).forEach(([k])=>{const n=parseInt(p[k].slice(1),16),[h,s,l]=rgb2hsl(n>>16&255,n>>8&255,n&255);
      p[k]=hex(hsl2rgb(h+dh+(r()-.5)*amt*40,Math.min(1,Math.max(0,s+(r()-.5)*amt*.3)),Math.min(.92,Math.max(.08,l+dl))))})}
  return p}
function genAlternatives(){const tok=++altToken,t=type,base=JSON.parse(JSON.stringify(P)),mode=$("altMode").value,amt=+$("altAmt").value,r=rng((Math.random()*2e9|0)+1),S={...G};
  altBox.innerHTML="";const items=[];
  for(let i=0;i<8;i++){const p=variant(t,base,r,mode,amt),b=document.createElement("button");b.className="alt wait";b.setAttribute("aria-label","Alternativa "+(i+1));
    b.addEventListener("click",()=>{if(type!==t)return;allP[t]=JSON.parse(JSON.stringify(p));buildPanel();schedule();$("altNote").textContent="Alternativa "+(i+1)+" aplicada. Genera otras a partir de esta."});
    altBox.appendChild(b);items.push({p,b})}
  let k=0,job=null;const tick=()=>{if(tok!==altToken)return;if(!job){if(k>=items.length){$("altNote").textContent="Haz clic en una alternativa para tomarla.";return}
      const keep=G;G=S;job=makeJob(FURNI[t].build(items[k].p),rot,S);G=keep}
    job.step(Infinity,performance.now()+6);
    if(job.done){const s=job.finish(),c=spriteCanvas(s),cv=mk(1,1),z=Math.max(1,Math.min(3,Math.floor(Math.min(110/c.width,100/c.height))));cv.width=c.width*z;cv.height=c.height*z;
      const g=cv.getContext("2d");g.imageSmoothingEnabled=false;g.drawImage(c,0,0,cv.width,cv.height);items[k].b.classList.remove("wait");items[k].b.appendChild(cv);job=null;k++}
    setTimeout(tick,16)};
  $("altNote").textContent="Dibujando alternativas…";tick()}
$("altGen").addEventListener("click",genAlternatives);

// =================== LABORATORIO: TRASLADAR COLORIMETRÍA ===================
let clip=null;
const colorsOf=(t,p)=>(FURNI[t].colors||[]).map(([k])=>p[k]).filter(Boolean);
const lumOf=h=>{const n=parseInt(h.slice(1),16);return .2126*(n>>16&255)+.7152*(n>>8&255)+.0722*(n&255)};
function setClip(from,colors){clip={from,colors:[...new Set(colors.map(c=>c.toLowerCase()))]};const box=$("clipBox");box.innerHTML="";
  clip.colors.forEach(c=>{const i=document.createElement("i");i.style.background=c;i.title=c;box.appendChild(i)});
  const s=document.createElement("span");s.className="note";s.textContent="de «"+from+"»";box.appendChild(s);$("clipApply").disabled=false}
$("clipThis").addEventListener("click",()=>setClip(FURNI[type].name,colorsOf(type,P)));
function refreshClipCat(){const s=$("clipCat");s.innerHTML="";s.add(new Option("Elegir objeto…",""));cat.items.forEach(it=>s.add(new Option(it.name,it.id)))}
$("clipCat").addEventListener("change",e=>{const it=cat.items.find(i=>i.id===e.target.value);if(!it)return;
  setClip(it.name,it.type==="supra"?it.children.flatMap(c=>colorsOf(c.type,c.params)):colorsOf(it.type,it.params));e.target.value=""});
$("clipApply").addEventListener("click",()=>{if(!clip||!clip.colors.length)return;const keys=(FURNI[type].colors||[]).map(c=>c[0]);if(!keys.length)return;
  const src=clip.colors,byLum=$("clipMap").value==="lum",hueOnly=$("clipHue").checked;let pick;
  if(byLum){const s=src.slice().sort((a,b)=>lumOf(a)-lumOf(b)),order=keys.slice().sort((a,b)=>lumOf(P[a])-lumOf(P[b]));pick={};
    order.forEach((k,i)=>pick[k]=s[order.length===1?Math.floor(s.length/2):Math.round(i*(s.length-1)/(order.length-1))])}
  else{pick={};keys.forEach((k,i)=>pick[k]=src[i%src.length])}
  for(const k of keys){let c=pick[k];if(hueOnly){const a=parseInt(c.slice(1),16),b=parseInt(P[k].slice(1),16),[h,s]=rgb2hsl(a>>16&255,a>>8&255,a&255),[,,l]=rgb2hsl(b>>16&255,b>>8&255,b&255);c=hex(hsl2rgb(h,s,l))}P[k]=c}
  buildPanel();schedule();note("Colorimetría de «"+clip.from+"» aplicada a "+FURNI[type].name+".")});


// ============================== FAUNA (NPC) ==============================
// Cada especie: dónde aparece (bioma, agua/tierra), cómo se mueve y qué variante de color usa.
let view=null;const fauna=[];window.__faunaDbg=fauna;
const SPECIES={
  mariposa:{name:"Mariposas",fly:true,shadow:true,where:"land",bio:{pradera:5,bosque:1.5,costa:1.5,pantano:1},vars:()=>WS.palette.slice(0,4).map(c=>({c1:c}))},
  murcielago:{name:"Murciélagos",fly:true,shadow:true,where:"land",bio:{bosque:2.5,pantano:2.5,nieve:1,desierto:1},vars:()=>[{},{c1:"#4a3a2f",c2:"#6a5a4a"}]},
  conejo:{name:"Conejos",where:"land",bio:{pradera:4,bosque:2.5,nieve:3,desierto:1},vars:b=>b==="nieve"?[{c1:"#f2f2f2",c2:"#ffffff"}]:b==="desierto"?[{c1:"#c9a06a"}]:[{},{c1:"#8a8f96"}]},
  topo:{name:"Topos",where:"land",bio:{pradera:3,bosque:2},vars:()=>[{}]},
  pez:{name:"Peces",where:"water",bio:{pradera:3,bosque:3,costa:4,pantano:2,desierto:2,nieve:2},vars:()=>[{},{c1:"#9aa3ad",c2:"#cfe6f5"},{c1:"#ffd23f",c2:"#ff9004"}]},
  ave:{name:"Aves",fly:true,shadow:true,where:"any",bio:{pradera:3,bosque:3,costa:3,desierto:1,nieve:1.5,pantano:1.5},vars:()=>[{},{c1:"#c8383f",c2:"#9a2a30"},{c1:"#8a6a45",c2:"#6b4a2f",c3:"#e0b84a"},{c1:"#f2f2f2",c2:"#c9c9c9"}]},
  cocodrilo:{name:"Cocodrilos",where:"water",bio:{pantano:4,costa:1},vars:()=>[{}]},
  insectos:{name:"Insectos",where:"land",bio:{pantano:4,bosque:3,pradera:2,desierto:.5},vars:b=>b==="pantano"?[{kind:"mosquito"}]:[{kind:"luciernaga"},{kind:"mosquito"}]}};
if(!WS.species||typeof WS.species!=="object")WS.species=Object.fromEntries(Object.keys(SPECIES).map(k=>[k,true]));
for(const k in SPECIES)if(!(k in WS.species))WS.species[k]=true;
// sprites de fauna: 4 direcciones × 2 fotogramas, generados por partes y guardados
const faunaSprites=new Map(),faunaQ=[];let faunaJob=null;
const FS={...gdef(),self:false};
function faunaKey(sp,v,rot,fr,sub){return sp+"|"+JSON.stringify(v)+"|"+rot+"|"+fr+"|"+(sub?1:0)}
function faunaSprite(sp,v,rot,fr,sub){const k=faunaKey(sp,v,rot,fr,sub),s=faunaSprites.get(k);if(s)return s;if(!faunaSprites.has(k)){faunaSprites.set(k,null);faunaQ.unshift({k,sp,v,rot,fr,sub})}return null}
function pumpFauna(deadline){while(performance.now()<deadline){if(!faunaJob){const q=faunaQ.shift();if(!q)return;if(!faunaSprites.has(q.k))continue;
      const p=Object.assign(defaults(q.sp),q.v,{frame:q.fr});if(q.sp==="cocodrilo")p.sub=!!q.sub;const S={...FS,floor:!SPECIES[q.sp].fly&&q.sp!=="pez"&&!q.sub};
      const keep=G;G=S;faunaJob={q,job:makeJob(FURNI[q.sp].build(p),q.rot,S)};G=keep}
    faunaJob.job.step(Infinity,deadline);if(faunaJob.job.done){const s=faunaJob.job.finish();s.cv=spriteCanvas(s);if(faunaSprites.has(faunaJob.q.k))faunaSprites.set(faunaJob.q.k,s);faunaJob=null}}}
// altura del terreno en cualquier punto (misma triangulación que las baldosas)
function heightAt(X,Y){const tx=Math.floor(X/T),ty=Math.floor(Y/T),u=X/T-tx,v=Y/T-ty,h=[cornerLevel(tx,ty),cornerLevel(tx+1,ty),cornerLevel(tx+1,ty+1),cornerLevel(tx,ty+1)].map(l=>l*STEP);
  if(Math.abs(h[0]-h[2])<=Math.abs(h[1]-h[3]))return u>=v?h[0]+(h[1]-h[0])*u+(h[2]-h[1])*v:h[0]+(h[2]-h[3])*u+(h[3]-h[0])*v;
  return u+v<=1?h[0]+(h[1]-h[0])*u+(h[3]-h[0])*v:h[2]+(h[3]-h[2])*(1-u)+(h[1]-h[2])*(1-v)}
const isWater=(X,Y)=>fieldsAt(X,Y)[0]<SEA-.004;
const rotOf=(vx,vy)=>Math.abs(vx)>=Math.abs(vy)?(vx>=0?0:2):(vy>=0?1:3);
function spawnFauna(){if(!view)return;const{W,H,cx,cy}=view;
  let sx=Math.random()*W+cx,sy=Math.random()*(H+40)+cy,X=sy+sx/2,Y=sy-sx/2,f=fieldsAt(X,Y);const water=f[0]<SEA-.004,b=biomeAt(...f);
  const opts=Object.entries(SPECIES).filter(([k,s])=>WS.species[k]&&(s.where==="any"||(s.where==="water")===water)&&s.bio[b]);
  let tot=opts.reduce((a,[,s])=>a+s.bio[b],0);if(!tot)return;let r=Math.random()*tot,sp=opts[0][0];for(const[k,s]of opts)if((r-=s.bio[b])<0){sp=k;break}
  const V=SPECIES[sp].vars(b),I=individual(sp,V[Math.floor(Math.random()*V.length)]),v=I.v,n={sp,v,tint:I.tint,tc:new Map(),last:null,X,Y,z:0,alt:0,head:Math.random()*Math.PI*2,t:0,timer:0,state:"idle",fr:0,seed:Math.random()*1000,sub:sp==="cocodrilo",born:0,fxCol:water?[170,215,245]:b==="nieve"?[235,242,250]:b==="desierto"?[226,204,150]:[120,170,80]};
  if(sp==="ave"){// las aves entran volando desde un borde, sin remolino
    const left=Math.random()<.5;sx=(left?-30:W+30)+cx;sy=Math.random()*H*.6+cy;n.X=sy+sx/2;n.Y=sy-sx/2;const dX=(W/2+cx-sx),dY=(H/2+cy-sy);n.head=Math.atan2(dY-dX/2,dY+dX/2)+(Math.random()-.5)*.6;
    n.alt=60+Math.random()*40;n.speed=46+Math.random()*20;n.born=9}
  if(sp==="mariposa")n.alt=8+Math.random()*10;if(sp==="murcielago")n.alt=22+Math.random()*18;if(sp==="topo")n.timer=1+Math.random()*3;if(sp==="insectos")n.alt=4+Math.random()*6;
  // precarga todas las poses: así nunca desaparece al girar o cambiar de fotograma
  if(sp!=="insectos")for(let r=0;r<(sp==="topo"?1:4);r++)for(let f=0;f<2;f++)faunaSprite(sp,v,r,f,n.sub&&sp==="cocodrilo");
  fauna.push(n)}
const FX_IN=.8,FX_OUT=.7;
/** Cada criatura es única: tamaño y colores con variación individual (tono, saturación, luz). */
/** Cada criatura es única sin renderizar 8 sprites propios: comparte la forma base (variante + talla en 3 escalones)
 *  y lleva su propio tinte (tono, saturación, luz) aplicado al vuelo sobre el sprite ya hecho. */
function individual(sp,base){const p=Object.assign({},base);if(sp==="insectos")return{v:p,tint:null};const d=defaults(sp);
  p.s=+((d.s||1)*[.86,1,1.14][Math.floor(Math.random()*3)]).toFixed(2);
  return{v:p,tint:[(Math.random()-.5)*40,(Math.random()-.5)*.18,(Math.random()-.5)*.12]}}
function tinted(n,s,key){let c=n.tc.get(key);if(c)return c;if(!n.tint){n.tc.set(key,s.cv);return s.cv}
  const[dh,ds,dl]=n.tint,w=s.cv.width,h=s.cv.height;c=document.createElement("canvas");c.width=w;c.height=h;const x=c.getContext("2d");x.drawImage(s.cv,0,0);
  const im=x.getImageData(0,0,w,h),d=im.data;for(let o=0;o<d.length;o+=4){if(!d[o+3])continue;const[hh,ss,ll]=rgb2hsl(d[o],d[o+1],d[o+2]);if(ll<.12)continue;
    const q=hsl2rgb(hh+dh,Math.min(1,Math.max(0,ss+ds)),Math.min(.95,Math.max(.04,ll+dl)));d[o]=q[0];d[o+1]=q[1];d[o+2]=q[2]}
  x.putImageData(im,0,0);n.tc.set(key,c);return c}
/** Cualquier pose ya lista de esta criatura (respaldo mientras llega la pose exacta). */
function anyPose(n){for(let r=0;r<4;r++)for(let f=0;f<2;f++){const s=faunaSprites.get(faunaKey(n.sp,n.v,r,f,n.sp==="cocodrilo"&&n.sub));if(s)return{s,key:r+"|"+f}}return null}
function faunaUpdate(now,dt){pumpFauna(performance.now()+(faunaQ.length>8?4:2));pumpDecor(performance.now()+(decorQ.length>40?5:3));if(!view)return;
  const target=Math.round(WS.fauna*28);if(fauna.filter(n=>n.dying==null).length<target&&Math.random()<.25)spawnFauna();
  let extra=fauna.filter(n=>n.dying==null).length-target;
  const{W,H,cx,cy}=view;
  for(let i=fauna.length-1;i>=0;i--){const n=fauna[i];n.t+=dt;n.born+=dt;
    const sx=n.X-n.Y-cx,sy=(n.X+n.Y)/2-cy;if(sx<-220||sx>W+220||sy<-280||sy>H+280){fauna.splice(i,1);continue}
    if(n.dying==null&&(extra>0||!WS.species[n.sp])){n.dying=0;extra--}
    if(n.dying!=null){n.dying+=dt;if(n.dying>FX_OUT){fauna.splice(i,1);continue}}
    // el remolino sigue girando hasta que la criatura tiene al menos un sprite listo
    if(n.sp!=="insectos"&&!n.last&&n.born>FX_IN*.5){const a=anyPose(n);if(a)n.last=a;else n.born-=FX_IN*.3}
    if(n.born<FX_IN*.55)continue;
    const step=(spd,turn)=>{n.head+=(noise3(n.t*.7,n.seed,0,3)-.5)*turn*dt;return[n.X+Math.cos(n.head)*spd*dt,n.Y+Math.sin(n.head)*spd*dt]};
    switch(n.sp){
      case"mariposa":{const[x,y]=step(12,9);n.X=x;n.Y=y;n.z=n.alt+Math.sin(n.t*3+n.seed)*3;n.fr=Math.floor(n.t*9)%2;break}
      case"murcielago":{if(Math.random()<dt*1.5)n.head+=(Math.random()-.5)*2.5;const[x,y]=step(30,6);n.X=x;n.Y=y;n.z=n.alt+Math.sin(n.t*5)*4;n.fr=Math.floor(n.t*11)%2;break}
      case"ave":{const[x,y]=step(n.speed,1.2);n.X=x;n.Y=y;n.z=n.alt;n.fr=(n.t%3)<1.8?Math.floor(n.t*7)%2:1;break}
      case"conejo":{if(n.state==="idle"){n.fr=0;n.z=0;if((n.timer-=dt)<=0){n.state="hop";n.hops=1+Math.floor(Math.random()*4);n.u=0;n.head=Math.random()*Math.PI*2}}
        else{n.u+=dt/.36;n.fr=1;const nx=n.X+Math.cos(n.head)*30*dt,ny=n.Y+Math.sin(n.head)*30*dt;if(isWater(nx,ny))n.head+=Math.PI;else{n.X=nx;n.Y=ny}
          n.z=Math.sin(Math.PI*Math.min(1,n.u))*6;if(n.u>=1){n.u=0;if(--n.hops<=0){n.state="idle";n.timer=.8+Math.random()*2.5}}}break}
      case"topo":{n.timer-=dt;if(n.timer<=0){n.fr=1-n.fr;n.timer=n.fr?1.2+Math.random()*1.5:2+Math.random()*4}break}
      case"pez":{if(n.state==="jump"){n.u+=dt/.8;n.z=Math.sin(Math.PI*n.u)*12;n.X+=Math.cos(n.head)*22*dt;n.Y+=Math.sin(n.head)*22*dt;if(n.u>=1){n.state="swim";n.z=0}}
        else{const[x,y]=step(14,3);if(isWater(x,y)){n.X=x;n.Y=y}else n.head+=Math.PI*(.6+Math.random()*.8);if(Math.random()<dt*.12&&isWater(n.X+Math.cos(n.head)*18,n.Y+Math.sin(n.head)*18)){n.state="jump";n.u=0}}
        n.fr=Math.floor(n.t*5)%2;break}
      case"cocodrilo":{if((n.timer-=dt)<=0){n.moving=!n.moving;n.timer=n.moving?2+Math.random()*4:2+Math.random()*5}
        if(n.moving){const[x,y]=step(6,1.5);if(isWater(x,y)){n.X=x;n.Y=y}else n.head+=Math.PI*.8}n.sub=isWater(n.X,n.Y);n.fr=Math.floor(n.t*(n.moving?2.5:.6))%2;break}
      case"insectos":{n.X+=Math.cos(n.t*.3+n.seed)*2*dt;n.Y+=Math.sin(n.t*.27+n.seed)*2*dt;break}}}}
/** Mini remolino: partículas en espiral que suben (aparición) o bajan (desaparición). */
function drawSwirl(gx,gy,u,col,reverse){const k=reverse?1-u:u;
  for(let i=0;i<20;i++){const a=u*16+i*.9,rad=(reverse?2+8*u:9*(1-u)+1.5)*(.6+(i%3)*.2),hgt=(i/20)*18*(reverse?1-u*.5:.4+u*.6),alpha=Math.min(1,(reverse?1-u:1.2-u))*(.55+.45*(i%2));
    const x=Math.round(gx+Math.cos(a)*rad),y=Math.round(gy+Math.sin(a)*rad*.5-hgt),big=i%3===0;
    lctx.fillStyle=`rgba(${col[0]},${col[1]},${col[2]},${Math.max(0,Math.min(1,alpha*1.3))})`;lctx.fillRect(x,y,big?2:1,big?2:1);
    if(big){lctx.fillStyle=`rgba(255,255,255,${Math.max(0,alpha*.8)})`;lctx.fillRect(x,y,1,1)}}}
function faunaItems(items,top,cx,cy){for(const n of fauna){const g=n.sp==="pez"||n.sp==="cocodrilo"&&n.sub?0:heightAt(n.X,n.Y),gx=n.X-n.Y-cx,gy=(n.X+n.Y)/2-g-cy,X=n.X/T,Y=n.Y/T,R=[X-.08,X+.08,Y-.08,Y+.08];
    const fxIn=n.born<FX_IN?n.born/FX_IN:1,fxOut=n.dying!=null?n.dying/FX_OUT:0,show=fxIn>.55&&fxOut<.5,alpha=Math.min(fxIn<1?(fxIn-.55)/.45:1,1-fxOut*2);
    if(fxIn<1||fxOut>0){const u=fxIn<1?fxIn:fxOut,rev=fxIn>=1;items.push({k:2,r:R,b:[gx-12,gx+12,gy-24,gy+6],ord:2,draw:()=>drawSwirl(gx,gy,u,n.fxCol,rev)})}
    if(!show)continue;
    if(n.sp==="insectos"){items.push({k:2,r:R,b:[gx-10,gx+10,gy-20,gy+6],draw:()=>{const glow=n.v.kind==="luciernaga";lctx.globalAlpha=alpha;
        for(let i=0;i<9;i++){const ox=(noise3(n.t*1.6,i*3.1,n.seed,1)-.5)*16,oy=(noise3(n.t*1.6,i*3.1+40,n.seed,1)-.5)*9,oz=n.alt+(noise3(n.t*1.3,i,n.seed+9,1)-.5)*8;
          if(glow){const a=.35+.65*Math.max(0,Math.sin(n.t*3+i*1.7));lctx.fillStyle=`rgba(255,241,168,${a*.35})`;lctx.fillRect(Math.round(gx+ox)-1,Math.round(gy+oy-oz)-1,3,3);lctx.fillStyle=`rgba(255,250,210,${a})`}
          else lctx.fillStyle="rgba(30,30,34,.85)";lctx.fillRect(Math.round(gx+ox),Math.round(gy+oy-oz),1,1)}lctx.globalAlpha=1}});continue}
    const rot=n.sp==="topo"?0:rotOf(Math.cos(n.head),Math.sin(n.head));let s=faunaSprite(n.sp,n.v,rot,n.fr,n.sp==="cocodrilo"&&n.sub),sp=SPECIES[n.sp];
    if(sp.shadow){const a=Math.max(.08,.28-n.z/400)*alpha;items.push({k:2,r:R,b:[gx-4,gx+4,gy-2,gy+2],ord:0,draw:()=>{lctx.fillStyle=`rgba(0,0,0,${a})`;lctx.fillRect(Math.round(gx)-3,Math.round(gy),7,1);lctx.fillRect(Math.round(gx)-2,Math.round(gy)-1,5,1);lctx.fillRect(Math.round(gx)-2,Math.round(gy)+1,5,1)}})}
    let cv;if(s){const key=rot+"|"+n.fr+"|"+(n.sub?1:0);cv=tinted(n,s,key);n.last={s,key}}else if(n.last){s=n.last.s;cv=tinted(n,s,n.last.key)}
    if(!s)continue;const X0=n.X-16,Y0=n.Y-16,sx=Math.round(X0-Y0-cx-s.originX),sy=Math.round((X0+Y0)/2-g-n.z-cy-s.originY),under=n.sp==="pez"&&n.z<.5;
    const it={k:2,r:R,b:[sx,sx+s.width,sy,sy+s.height],ord:1,draw:()=>{lctx.globalAlpha=(under?.55:1)*Math.max(0,alpha);lctx.drawImage(cv,sx,sy);lctx.globalAlpha=1}};
    if(sp.fly&&n.z>30)top.push(it);else items.push(it)}}
{const i=$("wfauna"),o=$("wfaunaV");const f=()=>o.textContent=WS.fauna?Math.round(WS.fauna*28)+" criaturas":"sin fauna";i.value=WS.fauna;f();
  i.addEventListener("input",()=>{WS.fauna=+i.value;f();save()});
  const h=$("wspecies");for(const[k,s]of Object.entries(SPECIES)){const b=document.createElement("button");b.className="chip";b.textContent=s.name;b.setAttribute("aria-pressed",!!WS.species[k]);
    b.addEventListener("click",()=>{WS.species[k]=!WS.species[k];b.setAttribute("aria-pressed",WS.species[k]);save()});h.appendChild(b)}}

// ======================= REINICIO DEL MUNDO ========================
function resetWorld(){closePick();for(const sl of slots){if(sl.state==="appearing"){sl.state="erasing";sl.e=Math.max(0,sl.e)}if(sl.state==="ready")beginErase(sl,Math.random()*.8);
  else if(sl.state==="building"){sl.state="queued";sl.g++;sl.job=sl.jcv=null}else if(sl.state==="void")sl.state="queued"}}

// ===================== PANEL DEL FURNI (clic) ======================
let sel=null;const ARROWS=["↘","↙","↖","↗"];
function haloFor(s){const w=s.width+2,h=s.height+2,c=mk(w,h),g=c.getContext("2d"),img=g.createImageData(w,h),d=img.data;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){let on=false;
    for(let dy=-1;dy<=1&&!on;dy++)for(let dx=-1;dx<=1;dx++){const sx=x-1+dx,sy=y-1+dy;if(sx>=0&&sy>=0&&sx<s.width&&sy<s.height&&s.mask[sy*s.width+sx]){on=true;break}}
    if(on){const k=(y*w+x)*4;d[k]=0;d[k+1]=102;d[k+2]=255;d[k+3]=255}}
  g.putImageData(img,0,0);return c}
function itemName(t){return nameOf(t)+" "+(cat.items.filter(i=>i.type===t).length+1)}
function openPick(d){if(sel&&sel.sl!==d.sl)sel.sl.locked=false;const sl=d.sl,sp=sl.spec;sl.locked=true;
  sel={sl,gx:d.gx,gy:d.gy,halo:haloFor(sl.s)};
  const c=$("pickCv"),z=Math.max(1,Math.min(3,Math.floor(Math.min(260/sl.s.width,190/sl.s.height))));c.width=sl.s.width*z;c.height=sl.s.height*z;
  const g=c.getContext("2d");g.imageSmoothingEnabled=false;g.drawImage(sl.cv,0,0,c.width,c.height);
  $("pickName").textContent=sp.name||nameOf(sp.t);
  $("pickMeta").textContent=`${nameOf(sp.t)} · ${sp.fw}×${sp.fd} baldosas · altura ${fmt1(sp.t==="supra"?itemStack(sp.it):FURNI[sp.t].stack(sp.p))}${sp.t!=="supra"&&FURNI[sp.t].walk?" · pasable":""} · ${ARROWS[sp.rot]}`;
  syncPickSave();$("pickNote").textContent="";$("pick").hidden=false}
function syncPickSave(){if(!sel)return;const saved=sel.sl.spec.item&&cat.items.some(i=>i.id===sel.sl.spec.item),b=$("pickSave");
  b.disabled=!!saved;b.querySelector(".pt-ring__face").textContent=saved?"Ya está en el catálogo":"Guardar en catálogo"}
function closePick(){if(sel)sel.sl.locked=false;sel=null;$("pick").hidden=true}
$("pickClose").addEventListener("click",closePick);
$("pickSave").addEventListener("click",()=>{if(!sel)return;const sp=sel.sl.spec;let it;
  if(sp.t==="supra"){it=sanitizeItem(Object.assign(hueItem(sp.it),{id:uid(),name:sp.name||"Suprafurni"}),new Set());cat.items.push(it);persistCat()}
  else it=addItem({type:sp.t,params:hueItem({type:sp.t,params:sp.p}).params,rot:sp.rot,name:itemName(sp.t)});
  sp.item=it.id;sp.name=it.name;$("pickName").textContent=it.name;syncPickSave();$("pickNote").textContent="Guardado en el catálogo como «"+it.name+"»."});
$("pickJson").addEventListener("click",()=>{if(!sel)return;const sp=sel.sl.spec,data=furniJSON(sp.t==="supra"?hueItem(sp.it):hueItem({name:sp.name||nameOf(sp.t),type:sp.t,rot:sp.rot,params:sp.p}));
  offerFile(JSON.stringify(data,null,2),`${sp.t}-${seed}-${sel.sl.i}.json`,m=>$("pickNote").textContent=m)});
$("pickLab").addEventListener("click",()=>{if(!sel)return;const v=sel.sl.spec;
  if(v.t==="supra"){const it=hueItem(v.it);closePick();openSupraEditor(it);return}
  v.p=hueItem({type:v.t,params:v.p}).params;type=v.t;allP[type]=Object.assign(defaults(type),JSON.parse(JSON.stringify(v.p)));setRot(v.rot);
  buildPanel();closePick();location.hash="laboratorio";note("Abierto desde el mundo: ajústalo y descárgalo.")});
addEventListener("keydown",e=>{if(e.key==="Escape")closePick()});

// ========================== COLORIMETRÍA ===========================
let palTimer=0;const palChanged=()=>{save();clearTimeout(palTimer);palTimer=setTimeout(()=>{if(WS.src==="random")resetWorld()},350)};
function buildPalUI(){const s=$("wpal");s.innerHTML="";PRESET_NAMES.forEach(([v,n])=>s.add(new Option(n,v)));s.value=WS.pal;
  const box=$("wsw");box.innerHTML="";WS.palette.forEach((c,i)=>{const inp=document.createElement("input");inp.type="color";inp.value=c;inp.setAttribute("aria-label","Color "+(i+1));
    inp.addEventListener("input",()=>{WS.palette[i]=inp.value;WS.pal="custom";s.value="custom";palChanged()});box.appendChild(inp)});
  $("wpalAll").checked=WS.palAll}
$("wpal").addEventListener("change",e=>{WS.pal=e.target.value;if(PRESETS[WS.pal])WS.palette=PRESETS[WS.pal].slice();buildPalUI();palChanged()});
$("wpalAll").addEventListener("change",e=>{WS.palAll=e.target.checked;palChanged()});

// ======================== ORIGEN DEL MUNDO =========================
function refreshSrc(){const s=$("wsrc");s.innerHTML="";s.add(new Option("Aleatorios (generados)","random"));
  s.add(new Option(`Todo el catálogo (${cat.items.length})`,"cat"));
  cat.families.forEach(f=>s.add(new Option(`Familia: ${f.name} (${cat.items.filter(i=>i.families.includes(f.id)).length})`,"fam:"+f.id)));
  if(![...s.options].some(o=>o.value===WS.src))WS.src="random";s.value=WS.src;
  const L=srcList();$("wsrcNote").textContent=L?(L.length?"Los furnis salen de tu catálogo, con sus colores guardados.":"No hay objetos en esta selección: guarda furnis desde el mundo o el laboratorio."):"La colorimetría se aplica a los furnis aleatorios."}
{const s=$("wbio");Object.entries(BIOMES).forEach(([k,b])=>s.add(new Option(b.name,k)));if(!BIOMES[WS.bio])WS.bio="interior";s.value=WS.bio;
  s.addEventListener("change",()=>{WS.bio=s.value;save();resetGround();resetCells()})}
$("wcheck").addEventListener("change",resetGround);
$("wsrc").addEventListener("change",e=>{WS.src=e.target.value;save();refreshSrc();resetWorld()});

// ============================ CATÁLOGO =============================
// Almacenamiento intercambiable: hoy usa este navegador (localStorage).
// Para guardado persistente, reemplaza load()/save() por tu backend; el resto no cambia.
const CAT_KEY="furnilab-catalog-v1";
const CatalogStore={load(){try{return JSON.parse(localStorage.getItem(CAT_KEY)||"null")}catch(e){return null}},
  save(data){try{localStorage.setItem(CAT_KEY,JSON.stringify(data));return true}catch(e){return false}}};
const uid=()=>"f"+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const okId=x=>typeof x==="string"&&/^[\w-]{1,40}$/.test(x);
function sanitizeParams(t,raw){const f=FURNI[t],o=defaults(t);raw=raw&&typeof raw==="object"?raw:{};
  (f.params||[]).forEach(([k,,mn,mx])=>{const v=+raw[k];if(raw[k]!==null&&raw[k]!==""&&Number.isFinite(v))o[k]=Math.min(mx,Math.max(mn,v))});
  (f.selects||[]).forEach(([k,,opts])=>{if(opts.some(x=>x[0]===raw[k]))o[k]=raw[k]});
  (f.toggles||[]).forEach(([k])=>{if(typeof raw[k]==="boolean")o[k]=raw[k]});
  (f.colors||[]).forEach(([k])=>{if(typeof raw[k]==="string"&&/^#[0-9a-f]{6}$/i.test(raw[k]))o[k]=raw[k].toLowerCase()});return o}
const numIn=(v,a,b,d)=>v!==null&&v!==""&&Number.isFinite(+v)?Math.min(b,Math.max(a,+v)):d;
function sanitizeKid(c,i){if(!c||typeof c!=="object"||!Object.prototype.hasOwnProperty.call(FURNI,c.type))return null;const r=c.rotation??c.rot;
  return{uid:uid(),ref:okId(c.ref)?c.ref:null,name:String(c.name||FURNI[c.type].name).slice(0,60),type:c.type,rot:[0,1,2,3].includes(r)?r:0,params:sanitizeParams(c.type,c.params),
    x:numIn(c.x,0,12,0),y:numIn(c.y,0,12,0),dz:numIn(c.dz,-64,96,0),born:numIn(c.born,0,1e6,i)}}
function sanitizeItem(o,famIds){if(!o||typeof o!=="object")return null;const r=o.rotation??o.rot;
  const base={id:okId(o.id)?o.id:uid(),rot:[0,1,2,3].includes(r)?r:0,families:Array.isArray(o.families)?o.families.filter(x=>famIds.has(x)):[],
    created:Number.isFinite(+o.created)&&+o.created>0?+o.created:Date.now()};
  if(o.type==="supra"){const children=(Array.isArray(o.children)?o.children:[]).slice(0,40).map(sanitizeKid).filter(Boolean);if(!children.length)return null;
    return{...base,name:String(o.name||"Suprafurni").slice(0,60),type:"supra",params:{},children}}
  if(!Object.prototype.hasOwnProperty.call(FURNI,o.type))return null;
  return{...base,name:String(o.name||FURNI[o.type].name).slice(0,60),type:o.type,params:sanitizeParams(o.type,o.params)}}
function sanitizeCatalog(d){if(!d||typeof d!=="object")return null;
  const families=(Array.isArray(d.families)?d.families:[]).filter(f=>f&&okId(f.id)).map(f=>({id:f.id,name:String(f.name||"Familia").slice(0,40)}));
  const ids=new Set(families.map(f=>f.id));return{families,items:(Array.isArray(d.items)?d.items:[]).map(i=>sanitizeItem(i,ids)).filter(Boolean)}}
const cat=Object.assign({items:[],families:[]},sanitizeCatalog(CatalogStore.load())||{});
function furniJSON(it){const fam=it.families?{families:it.families}:{};
  if(it.type==="supra"){const kids=stackKids(it.children.map(c=>({...c})));
    return{format:"furnilab.supra",version:1,name:it.name,type:"supra",rotation:it.rot,footprint:supraFoot(it),stack:+itemStack(it).toFixed(2),
      children:kids.map(k=>({name:k.name,ref:k.ref,type:k.type,rotation:k.rot,x:k.x,y:k.y,z:+k.z.toFixed(2),dz:k.dz||0,born:k.born,params:k.params})),render:{...WG,alpha:WS.alpha},...fam}}
  const f=buildWG(it.type,it.params);
  return{format:"furnilab.furni",version:1,name:it.name,type:it.type,rotation:it.rot,footprint:f.footprint,stack:+FURNI[it.type].stack(it.params).toFixed(2),pasable:!!FURNI[it.type].walk,categoria:FURNI[it.type].cat,params:it.params,render:{...WG,alpha:WS.alpha},...fam}}
function persistCat(){try{refreshClipCat()}catch(e){}const ok=CatalogStore.save({format:"furnilab.catalog",version:1,families:cat.families,items:cat.items});
  if(!ok)$("catNote").textContent="No se pudo guardar en este navegador: exporta el catálogo para no perderlo.";refreshSrc();renderCatalog();syncPickSave()}
function addItem({type:t,params,rot,name}){const it={id:uid(),name:String(name).slice(0,60),type:t,rot,params:sanitizeParams(t,JSON.parse(JSON.stringify(params))),families:[],created:Date.now()};
  if(catFilter!=="all"&&cat.families.some(f=>f.id===catFilter))it.families.push(catFilter);cat.items.push(it);persistCat();return it}
// miniaturas del catálogo: también por partes
const thumbCache=new Map(),thumbQ=[];let thumbBusy=false;
const itemKey=it=>it.type+"|"+it.rot+"|"+JSON.stringify(it.type==="supra"?it.children.map(c=>[c.type,c.rot,c.x,c.y,c.dz,c.born,c.params]):it.params);
function placeThumb(host,c){host.innerHTML="";const cv=mk(1,1),z=Math.max(1,Math.min(3,Math.floor(Math.min(196/c.width,120/c.height))));cv.width=c.width*z;cv.height=c.height*z;
  const g=cv.getContext("2d");g.imageSmoothingEnabled=false;g.drawImage(c,0,0,cv.width,cv.height);host.appendChild(cv)}
function requestThumb(it,host){const k=itemKey(it);if(!thumbCache.has(k)&&spriteMem.has(k))thumbCache.set(k,spriteCanvas(spriteMem.get(k)));if(thumbCache.has(k)){placeThumb(host,thumbCache.get(k));return}thumbQ.push({it,host,k});pumpThumbs()}
function pumpThumbs(){if(thumbBusy)return;thumbBusy=true;let job=null,cur=null;
  const tick=()=>{if(!job){cur=thumbQ.shift();if(!cur){thumbBusy=false;return}
      if(thumbCache.has(cur.k)){placeThumb(cur.host,thumbCache.get(cur.k));setTimeout(tick,0);return}
      job=makeItemJob(cur.it)}
    job.step(Infinity,performance.now()+5);
    if(job.done){const s=job.finish(),c=spriteCanvas(s);spriteMem.set(cur.k,s);thumbCache.set(cur.k,c);placeThumb(cur.host,c);job=null}
    setTimeout(tick,16)};tick()}
let catFilter="all";
function armConfirm(btn,label,fn){btn.addEventListener("click",()=>{if(btn.dataset.armed){fn();return}btn.dataset.armed="1";const old=btn.textContent;btn.textContent=label;
  setTimeout(()=>{delete btn.dataset.armed;btn.textContent=old},2500)})}
function renderCatalog(){if(current!=="catalogo")return;
  if(catFilter!=="all"&&!cat.families.some(f=>f.id===catFilter))catFilter="all";
  const fl=$("famList");fl.innerHTML="";
  const nav=(id,label,count)=>{const b=document.createElement("button");b.className="pt-nav-item"+(catFilter===id?" is-selected":"");
    b.innerHTML='<span class="pt-ring__inner"><span class="pt-ring__face"><span class="nm"></span><span class="cnt"></span></span></span>';
    b.querySelector(".nm").textContent=label;b.querySelector(".cnt").textContent=count;b.addEventListener("click",()=>{catFilter=id;renderCatalog()});fl.appendChild(b)};
  nav("all","Todos los objetos",cat.items.length);cat.families.forEach(f=>nav(f.id,f.name,cat.items.filter(i=>i.families.includes(f.id)).length));
  const fam=cat.families.find(f=>f.id===catFilter);$("famTools").hidden=!fam;if(fam)$("famRename").value=fam.name;
  $("toWorld").querySelector(".pt-ring__face").textContent=fam?"Ver solo esta familia en el mundo":"Ver todo el catálogo en el mundo";
  const list=(fam?cat.items.filter(i=>i.families.includes(fam.id)):cat.items).slice().sort((a,b)=>b.created-a.created);
  $("catTitle").textContent=(fam?fam.name:"Todos los objetos")+" · "+list.length;$("catEmpty").hidden=list.length>0;
  const grid=$("catGrid");grid.innerHTML="";
  for(const it of list){const c=document.createElement("article");c.className="pt-card item";
    c.innerHTML='<div class="th"></div><div class="pt-input"><input maxlength="60" aria-label="Nombre del objeto"></div><div class="meta"></div><div class="chips"></div>'+
      '<div class="acts"><button class="pt-btn" data-a="lab">Laboratorio</button><button class="pt-btn" data-a="json">JSON</button><button class="pt-btn" data-a="del">Eliminar</button></div>';
    const inp=c.querySelector("input");inp.value=it.name;inp.addEventListener("change",()=>{it.name=inp.value.trim().slice(0,60)||nameOf(it.type);persistCat()});
    const fp=it.type==="supra"?supraFoot(it):buildWG(it.type,it.params).footprint;
    c.querySelector(".meta").textContent=it.type==="supra"?`Suprafurni · ${it.children.length} piezas · ${fp[0]}×${fp[1]} baldosas · altura ${fmt1(itemStack(it))}`
      :`${nameOf(it.type)} · ${fp[0]}×${fp[1]} baldosas · altura ${fmt1(itemStack(it))} · ${ARROWS[it.rot]}`;
    if(it.type==="supra")c.querySelector('[data-a="lab"]').textContent="Editar";
    const chips=c.querySelector(".chips");
    if(!cat.families.length){const s=document.createElement("span");s.className="meta";s.textContent="Crea una familia para agruparlo.";chips.appendChild(s)}
    cat.families.forEach(f=>{const b=document.createElement("button");b.className="chip";b.textContent=f.name;b.setAttribute("aria-pressed",it.families.includes(f.id));
      b.addEventListener("click",()=>{it.families=it.families.includes(f.id)?it.families.filter(x=>x!==f.id):[...it.families,f.id];persistCat()});chips.appendChild(b)});
    c.querySelector('[data-a="lab"]').addEventListener("click",()=>{if(it.type==="supra"){openSupraEditor(it);return}type=it.type;allP[type]=Object.assign(defaults(type),JSON.parse(JSON.stringify(it.params)));setRot(it.rot);buildPanel();location.hash="laboratorio"});
    c.querySelector('[data-a="json"]').addEventListener("click",()=>offerFile(JSON.stringify(furniJSON(it),null,2),`${it.type}-${it.id}.json`,m=>$("catNote").textContent=m));
    armConfirm(c.querySelector('[data-a="del"]'),"¿Eliminar?",()=>{cat.items=cat.items.filter(x=>x!==it);persistCat()});
    grid.appendChild(c);requestThumb(it,c.querySelector(".th"))}}
$("famAdd").addEventListener("click",()=>{const n=$("famNew").value.trim().slice(0,40);if(!n)return;const f={id:uid(),name:n};cat.families.push(f);$("famNew").value="";catFilter=f.id;persistCat()});
$("famNew").addEventListener("keydown",e=>{if(e.key==="Enter")$("famAdd").click()});
$("famRenameBtn").addEventListener("click",()=>{const f=cat.families.find(x=>x.id===catFilter),n=$("famRename").value.trim().slice(0,40);if(f&&n){f.name=n;persistCat()}});
armConfirm($("famDel"),"¿Eliminar familia? (los objetos se conservan)",()=>{const id=catFilter;cat.families=cat.families.filter(f=>f.id!==id);
  cat.items.forEach(i=>i.families=i.families.filter(x=>x!==id));const was=WS.src==="fam:"+id;catFilter="all";persistCat();if(was){WS.src="random";save();refreshSrc();resetWorld()}});
$("toWorld").addEventListener("click",()=>{const fam=cat.families.find(f=>f.id===catFilter);WS.src=fam?"fam:"+fam.id:"cat";save();refreshSrc();resetWorld();location.hash="mundo"});
$("catExport").addEventListener("click",()=>offerFile(JSON.stringify({format:"furnilab.catalog",version:1,exported:new Date().toISOString(),families:cat.families,items:cat.items},null,2),"catalogo-furnilab.json",m=>$("catNote").textContent=m));
$("catFile").addEventListener("change",async e=>{const file=e.target.files[0];e.target.value="";if(!file)return;let d;
  try{d=JSON.parse(await file.text())}catch(err){$("catNote").textContent="Ese archivo no es un JSON válido.";return}
  let added=0,fams=0;
  if(d&&(d.format==="furnilab.catalog"||Array.isArray(d.items))){const s=sanitizeCatalog(d)||{families:[],items:[]};
    for(const f of s.families)if(!cat.families.some(x=>x.id===f.id)){cat.families.push(f);fams++}
    for(const it of s.items){if(cat.items.some(x=>x.id===it.id))it.id=uid();cat.items.push(it);added++}}
  else{const it=sanitizeItem(d,new Set(cat.families.map(f=>f.id)));if(it){if(cat.items.some(x=>x.id===it.id))it.id=uid();cat.items.push(it);added=1}}
  persistCat();$("catNote").textContent=added||fams?`Importado: ${added} objeto(s)`+(fams?` y ${fams} familia(s).`:"."):"No encontré furnis válidos en ese archivo."});
$("labSave").addEventListener("click",()=>{const it=addItem({type,params:P,rot,name:itemName(type)});note("Guardado en el catálogo como «"+it.name+"».")});

buildPanel();buildGlobal();setRot(0);buildPalUI();refreshSrc();refreshClipCat();show(location.hash.slice(1)||"mundo");requestAnimationFrame(loop);setTimeout(thumbs,1500);
}
