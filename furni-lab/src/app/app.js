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
const WS=Object.assign({speed:2,zoom:innerWidth<600?2:3,dens:.6,pool:28,dir:0,check:false,draw:5,par:3,every:2.5,renew:true,src:"random",pal:"marca",palette:PRESETS.marca.slice(),palAll:false,hue:0,alpha:1},store.W||{});
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
function buildPanel(){P=allP[type];const f=FURNI[type];$("ptitle").textContent="Parámetros · "+f.name;
  const h=$("params");h.innerHTML="";(f.params||[]).forEach(a=>slider(h,a,P,schedule));(f.selects||[]).forEach(a=>select(h,a,P,schedule));(f.toggles||[]).forEach(a=>toggle(h,a,P,schedule));
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
function schedule(){save();if(current!=="laboratorio")return;cancelAnimationFrame(pending);pending=requestAnimationFrame(()=>setTimeout(drawLab,0))}
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
  cama:{c1:"wood",c2:"light",c3:"fabric",c4:"light"},alfombra:{c1:"fabric",c2:"fabric",c3:"fabric"}};
const WEIGHT=[["silla",4],["planta",4],["mesa",3],["sofa",3],["lampara",2],["estante",2],["cama",2],["alfombra",3]];
const CAP={mesa:{w:2,d:1},sofa:{n:2},estante:{n:1,h:64},lampara:{h:58},planta:{size:1.3},cama:{n:2},alfombra:{w:2,d:2}};
const mixHex=(a,b,k)=>{const A=parseInt(a.slice(1),16),B=parseInt(b.slice(1),16);return hex([16,8,0].map(s=>Math.round(((A>>s)&255)*(1-k)+((B>>s)&255)*k)))};
// Colorimetría del usuario: decide qué colores puede usar cada rol de material.
function palFor(role){const U=WS.palette;
  switch(role){case"fabric":case"pot":return U;case"shade":return U.map(c=>mixHex(c,"#ffffff",.35));case"light":return U.map(c=>mixHex(c,"#ffffff",.78));
    case"wood":return WS.palAll?U.map(c=>mixHex(c,"#000000",.3)):PAL.wood;case"metal":return WS.palAll?U.map(c=>mixHex(c,"#9aa3ad",.3)):PAL.metal;
    case"leaf":return WS.palAll?U:PAL.leaf;default:return U}}
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
function specFor(i,g){const r=rng(Math.floor(h32(seed,i,g)*2147483646)+1);r();
  const list=srcList();
  if(list){if(!list.length)return null;const it=list[Math.floor(r()*list.length)];
    if(it.type==="supra"){const[fw,fd]=supraFoot(it);return{t:"supra",it:JSON.parse(JSON.stringify(it)),p:null,rot:it.rot,fw,fd,item:it.id,name:it.name}}
    const keep=G;G=WG;const f=FURNI[it.type].build(it.params);G=keep;
    return{t:it.type,p:JSON.parse(JSON.stringify(it.params)),rot:it.rot,f,fw:it.rot%2?f.footprint[1]:f.footprint[0],fd:it.rot%2?f.footprint[0]:f.footprint[1],item:it.id,name:it.name}}
  let tot=WEIGHT.reduce((a,w)=>a+w[1],0),pick=r()*tot,t=WEIGHT[0][0];for(const[k,w]of WEIGHT){if((pick-=w)<0){t=k;break}}
  const p=randomize(t,defaults(t),r),cap=CAP[t]||{};for(const k in cap)p[k]=Math.min(p[k],cap[k]);
  if(t==="silla")p.slats=Math.min(p.slats,5);if(t==="planta"||t==="estante")p.seed=(r()*500|0)+1;
  const used=new Set();for(const[k,role]of Object.entries(ROLE[t]||{})){const L=palFor(role);let j=Math.floor(r()*L.length);
    if(role==="fabric")for(let n=0;n<L.length&&used.has(L[j]);n++)j=(j+1)%L.length;p[k]=L[j];used.add(L[j])}
  if(t==="lampara")p.glow=r()<.8;
  const rr=r()<.5?0:1,keep=G;G=WG;const f=FURNI[t].build(p);G=keep;
  return{t,p,rot:rr,f,fw:rr%2?f.footprint[1]:f.footprint[0],fd:rr%2?f.footprint[0]:f.footprint[1]}}
function ensureSlots(){while(slots.length<WS.pool)slots.push({i:slots.length,g:0,state:"queued"});slots.length=WS.pool}
function startBuild(sl){sl.spec=specFor(sl.i,sl.g);if(!sl.spec){sl.state="void";return}sl.job=sl.spec.t==="supra"?makeSupraJob(sl.spec.it,WG):makeJob(sl.spec.f,sl.spec.rot,WG);sl.jcv=mk(sl.job.w,sl.job.h);sl.state="building"}
function paintJob(sl){const ctx=sl.jcv.getContext("2d");if(sl.job.paint)sl.job.paint(ctx,viewCanvas);else ctx.putImageData(viewPreview(sl.job.img),0,0)}
function finishBuild(sl,now){sl.s=sl.job.finish();sl.cv=viewCanvas(sl.s);sl.job=null;sl.jcv=null;sl.state="ready";sl.born=now}
function beginErase(sl,delay=0){const s=sl.s,n=s.width*s.height,thr=new Float32Array(n);
  for(let y=0;y<s.height;y++)for(let x=0;x<s.width;x++)thr[y*s.width+x]=BAYER[(y&3)*4+(x&3)]/16*.55+(y/s.height)*.45;
  sl.thr=thr;sl.eview=viewRGBA(s);sl.eimg=new ImageData(s.width,s.height);sl.ecv=mk(s.width,s.height);sl.e=-delay;sl.state="erasing"}
function paintErase(sl){const s=sl.s,src=sl.eview,d=sl.eimg.data,e=Math.max(0,sl.e),band=.12;
  for(let k=0,n=s.width*s.height;k<n;k++){const th=sl.thr[k],o=k*4;
    if(th<e||src[o+3]===0){d[o+3]=0;continue}
    if(th<e+band&&s.mask[k]){const c=spectrum((k%s.width)/s.width);d[o]=c[0];d[o+1]=c[1];d[o+2]=c[2];d[o+3]=255}
    else{d[o]=src[o];d[o+1]=src[o+1];d[o+2]=src[o+2];d[o+3]=src[o+3]}}
  sl.ecv.getContext("2d").putImageData(sl.eimg,0,0)}

function update(now,dt){ensureSlots();
  let building=slots.filter(s=>s.state==="building").length;
  const order=slots.filter(s=>s.state==="queued").sort((a,b)=>(visible.has(b.i)-visible.has(a.i))||a.i-b.i);
  for(const sl of order){if(building>=WS.par)break;startBuild(sl);if(sl.state==="building")building++}
  // presupuesto: 6 ms por cuadro repartidos entre las construcciones activas
  const deadline=performance.now()+6,ppf=Math.round(8*2**(WS.draw-1));
  for(const sl of slots){if(sl.state!=="building")continue;
    const n=sl.job.step(ppf,deadline);if(n)paintJob(sl);
    if(sl.job.done)finishBuild(sl,now);if(performance.now()>deadline)break}
  for(const sl of slots){if(sl.state!=="erasing")continue;sl.e+=dt/.9;
    if(sl.e>=1+.12){sl.state="queued";sl.g++;generation++;sl.s=sl.cv=sl.ecv=sl.thr=sl.eimg=null}else if(sl.e>0)paintErase(sl)}
  const queued=slots.some(s=>s.state==="queued"&&visible.has(s.i));
  if(WS.renew&&!queued&&building<WS.par&&now-lastRenew>WS.every*1000){let old=null;
    for(const sl of slots)if(sl.state==="ready"&&!sl.locked&&(!old||(visible.has(sl.i)-visible.has(old.i))*1e12+(old.born-sl.born)>0))old=sl;
    if(old){beginErase(old);lastRenew=now}}
  update.n=(update.n||0)+1;if(update.n%15===0){const c={ready:0,building:0,erasing:0,queued:0,void:0};slots.forEach(s=>c[s.state]++);
    $("wcount").textContent=`${c.ready}/${WS.pool} listos`+(c.building?` · ${c.building} dibujando`:"")+(c.erasing?` · ${c.erasing} borrando`:"");
    if(c.void===slots.length)$("wcount").textContent="Sin objetos en esta selección";
    $("wgen").textContent="renovados: "+generation}}

// baldosa de piso 64×32 (plata de la marca)
function floorTile(base,dark){const c=mk(64,33),g=c.getContext("2d"),img=g.createImageData(64,33),d=img.data;
  for(let j=0;j<33;j++)for(let i=0;i<64;i++){const sx=i+.5-32,sy=j+.5,x=sy+sx/2,y=sy-sx/2;if(x<0||y<0||x>=32||y>=32)continue;
    const col=x>=31||y>=31?dark:base,k=(j*64+i)*4;d[k]=col[0];d[k+1]=col[1];d[k+2]=col[2];d[k+3]=255}
  g.putImageData(img,0,0);return c}
const TILES=[floorTile([222,222,222],[196,196,196]),floorTile([208,208,208],[186,186,186])];
const CELL=3;
function sizeWorld(){const box=$("worldBox"),z=WS.zoom,w=Math.max(1,Math.ceil(box.clientWidth/z)),h=Math.max(1,Math.ceil(box.clientHeight/z));
  if(low.width!==w||low.height!==h){low.width=w;low.height=h}wcv.width=w*z;wcv.height=h*z;wcv.style.width=w*z+"px";wcv.style.height=h*z+"px"}
new ResizeObserver(()=>{if(current==="mundo")sizeWorld()}).observe($("worldBox"));
function drawWorld(){const W=low.width,H=low.height,cx=Math.floor(cam.x),cy=Math.floor(cam.y);
  lctx.fillStyle="#1c1c1c";lctx.fillRect(0,0,W,H);
  const inv=(sx,sy)=>[((sy+cy)/16+(sx+cx)/32)/2,((sy+cy)/16-(sx+cx)/32)/2];
  const cs=[inv(0,0),inv(W,0),inv(0,H+120),inv(W,H+120)];
  const tx0=Math.floor(Math.min(...cs.map(c=>c[0])))-2,tx1=Math.ceil(Math.max(...cs.map(c=>c[0])))+2,ty0=Math.floor(Math.min(...cs.map(c=>c[1])))-2,ty1=Math.ceil(Math.max(...cs.map(c=>c[1])))+2;
  for(let tx=tx0;tx<=tx1;tx++)for(let ty=ty0;ty<=ty1;ty++){const sx=32*(tx-ty)-cx-32,sy=16*(tx+ty)-cy;if(sx<-64||sx>W||sy<-33||sy>H)continue;
    lctx.drawImage(TILES[WS.check?((tx+ty)&1):0],sx,sy)}
  drawn=[];visible=new Set();
  for(let gx=Math.floor(tx0/CELL)-1;gx<=Math.ceil(tx1/CELL);gx++)for(let gy=Math.floor(ty0/CELL)-1;gy<=Math.ceil(ty1/CELL);gy++){
    if(h32(gx,gy,layout)>WS.dens)continue;const sl=slots[Math.floor(h32(gx,gy,layout+17)*WS.pool)];if(!sl)continue;
    {const gsx=32*(gx-gy)*CELL-cx,gsy=16*(gx+gy)*CELL-cy;if(gsx>-120&&gsx<W+120&&gsy>-40&&gsy<H+140)visible.add(sl.i)}
    if(sl.state==="queued")continue;
    const sp=sl.spec,ax=gx*CELL+Math.floor(h32(gx,gy,layout+31)*Math.max(1,CELL-sp.fw+1)),ay=gy*CELL+Math.floor(h32(gx,gy,layout+47)*Math.max(1,CELL-sp.fd+1));
    let im,ox,oy,iw,ih;
    if(sl.state==="building"){im=sl.jcv;ox=sl.job.ox;oy=sl.job.oy;iw=sl.job.w;ih=sl.job.h}
    else{im=sl.state==="erasing"&&sl.e>0?sl.ecv:sl.cv;ox=sl.s.originX;oy=sl.s.originY;iw=sl.s.width;ih=sl.s.height}
    const dx=32*(ax-ay)-cx-ox,dy=16*(ax+ay)-cy-oy;if(dx>W||dy>H||dx+iw<0||dy+ih<0)continue;
    drawn.push({sl,im,dx,dy,gx,gy,depth:ax+sp.fw/2+ay+sp.fd/2})}
  drawn.sort((a,b)=>a.depth-b.depth);
  for(const d of drawn){if(sel&&sel.halo&&d.sl===sel.sl&&d.gx===sel.gx&&d.gy===sel.gy&&d.sl.state==="ready")lctx.drawImage(sel.halo,d.dx-1,d.dy-1);
    lctx.drawImage(d.im,d.dx,d.dy);
    if(d.sl.state==="building"){const sc=d.sl.job.scan();if(sc){lctx.fillStyle="#00c4ff";lctx.fillRect(d.dx+sc.x,d.dy+sc.y,sc.w,1)}}}
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
wslider("wdens","dens",v=>Math.round(v*100)+" %");wslider("wpool","pool",v=>String(v));
wslider("whue","hue",v=>(v>0?"+":"")+v+"°",reView);wslider("walpha","alpha",v=>Math.round(v*100)+" %",reView);
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
  for(const sl of slots){if(sl.s&&(sl.state==="ready"||sl.state==="erasing")){sl.cv=viewCanvas(sl.s);if(sl.state==="erasing")sl.eview=viewRGBA(sl.s)}
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

// ======================= REINICIO DEL MUNDO ========================
function resetWorld(){closePick();for(const sl of slots){if(sl.state==="ready")beginErase(sl,Math.random()*.8);
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
  $("pickMeta").textContent=`${nameOf(sp.t)} · ${sp.fw}×${sp.fd} baldosas · altura ${fmt1(sp.t==="supra"?itemStack(sp.it):FURNI[sp.t].stack(sp.p))} · ${ARROWS[sp.rot]}`;
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
  return{format:"furnilab.furni",version:1,name:it.name,type:it.type,rotation:it.rot,footprint:f.footprint,stack:+FURNI[it.type].stack(it.params).toFixed(2),params:it.params,render:{...WG,alpha:WS.alpha},...fam}}
function persistCat(){const ok=CatalogStore.save({format:"furnilab.catalog",version:1,families:cat.families,items:cat.items});
  if(!ok)$("catNote").textContent="No se pudo guardar en este navegador: exporta el catálogo para no perderlo.";refreshSrc();renderCatalog();syncPickSave()}
function addItem({type:t,params,rot,name}){const it={id:uid(),name:String(name).slice(0,60),type:t,rot,params:sanitizeParams(t,JSON.parse(JSON.stringify(params))),families:[],created:Date.now()};
  if(catFilter!=="all"&&cat.families.some(f=>f.id===catFilter))it.families.push(catFilter);cat.items.push(it);persistCat();return it}
// miniaturas del catálogo: también por partes
const thumbCache=new Map(),thumbQ=[];let thumbBusy=false;
const itemKey=it=>it.type+"|"+it.rot+"|"+JSON.stringify(it.type==="supra"?it.children.map(c=>[c.type,c.rot,c.x,c.y,c.dz,c.born,c.params]):it.params);
function placeThumb(host,c){host.innerHTML="";const cv=mk(1,1),z=Math.max(1,Math.min(3,Math.floor(Math.min(196/c.width,120/c.height))));cv.width=c.width*z;cv.height=c.height*z;
  const g=cv.getContext("2d");g.imageSmoothingEnabled=false;g.drawImage(c,0,0,cv.width,cv.height);host.appendChild(cv)}
function requestThumb(it,host){const k=itemKey(it);if(thumbCache.has(k)){placeThumb(host,thumbCache.get(k));return}thumbQ.push({it,host,k});pumpThumbs()}
function pumpThumbs(){if(thumbBusy)return;thumbBusy=true;let job=null,cur=null;
  const tick=()=>{if(!job){cur=thumbQ.shift();if(!cur){thumbBusy=false;return}
      if(thumbCache.has(cur.k)){placeThumb(cur.host,thumbCache.get(cur.k));setTimeout(tick,0);return}
      job=makeItemJob(cur.it)}
    job.step(Infinity,performance.now()+5);
    if(job.done){const c=spriteCanvas(job.finish());thumbCache.set(cur.k,c);placeThumb(cur.host,c);job=null}
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

buildPanel();buildGlobal();setRot(0);buildPalUI();refreshSrc();show(location.hash.slice(1)||"mundo");requestAnimationFrame(loop);setTimeout(thumbs,1500);
