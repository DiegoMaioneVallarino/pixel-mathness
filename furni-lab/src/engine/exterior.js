// Alias legibles de las primitivas base
const cylinder=cyl,ellipsoid=ell,capsule=caps,smoothUnion=smooth,sphere=(cx,cy,cz,r)=>(x,y,z)=>H2(x-cx,y-cy,z-cz)-r;
// =====================================================================
// EXTERIOR — primitivas extra, materiales por zona y 30 generadores
// =====================================================================
const N3=v=>{const l=H2(v[0],v[1],v[2])||1;return[v[0]/l,v[1]/l,v[2]/l]};
const add3=(a,b,k=1)=>[a[0]+b[0]*k,a[1]+b[1]*k,a[2]+b[2]*k];
const cross3=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
function perp(d){const t=Math.abs(d[2])<.9?[0,0,1]:[1,0,0],u=N3(cross3(d,t));return[u,cross3(d,u)]}
/** Cono redondeado entre dos puntos (ramas, tallos, briznas). */
function rcone(a,b,r1,r2){const bx=b[0]-a[0],by=b[1]-a[1],bz=b[2]-a[2],l2=bx*bx+by*by+bz*bz||1e-6,rr=r1-r2,a2=l2-rr*rr,il2=1/l2;
  return(x,y,z)=>{const px=x-a[0],py=y-a[1],pz=z-a[2],yv=px*bx+py*by+pz*bz,zv=yv-l2,qx=px*l2-bx*yv,qy=py*l2-by*yv,qz=pz*l2-bz*yv,
    x2=qx*qx+qy*qy+qz*qz,y2=yv*yv*l2,z2=zv*zv*l2,k=Math.sign(rr)*rr*rr*x2;
    if(Math.sign(zv)*a2*z2>k)return Math.sqrt(x2+z2)*il2-r2;if(Math.sign(yv)*a2*y2<k)return Math.sqrt(x2+y2)*il2-r1;
    return(Math.sqrt(x2*a2*il2)+yv*rr)*il2-r1}}
/** Cilindro de tapas planas entre dos puntos (troncos, leña, vigas). */
function capCyl(a,b,r){const bx=b[0]-a[0],by=b[1]-a[1],bz=b[2]-a[2],bb=bx*bx+by*by+bz*bz;
  return(x,y,z)=>{const px=x-a[0],py=y-a[1],pz=z-a[2],pb=px*bx+py*by+pz*bz,X=H2(px*bb-bx*pb,py*bb-by*pb,pz*bb-bz*pb)-r*bb,Y=Math.abs(pb-bb*.5)-bb*.5,
    x2=X*X,y2=Y*Y*bb,d=Math.max(X,Y)<0?-Math.min(x2,y2):(X>0?x2:0)+(Y>0?y2:0);return Math.sign(d)*Math.sqrt(Math.abs(d))/bb}}
function frameOf(o,dir){const w=N3(dir),[u,v]=perp(w);return(x,y,z)=>{const px=x-o[0],py=y-o[1],pz=z-o[2];
  return[px*u[0]+py*u[1]+pz*u[2],px*v[0]+py*v[1]+pz*v[2],px*w[0]+py*w[1]+pz*w[2]]}}
/** Prisma hexagonal con punta (cristales). */
function crystal(o,dir,r,len){const F=frameOf(o,dir),tip=r*1.8;return(x,y,z)=>{const[u,v,w]=F(x,y,z),qx=Math.abs(u),qy=Math.abs(v),
  R=w>len-tip?r*Math.max(0,(len-w)/tip):r;return Math.max((Math.max(qx*.866+qy*.5,qy)-R)*.75,-w,w-len)}}
/** Roca facetada: poliedro convexo de planos al azar (sombreado plano natural). */
function rockShape(c,rad,flat,irr,nf,r){const pl=[];for(let i=0;i<nf;i++){const zz=1-2*(i+.5)/nf,s=Math.sqrt(1-zz*zz),ph=i*2.399+r()*.8;
    pl.push([...N3([s*Math.cos(ph)+(r()-.5)*.3,s*Math.sin(ph)+(r()-.5)*.3,zz]),1-irr*r()*.38])}
  const sx=rad,sy=rad*(.8+r()*.4),sz=rad*flat,m=Math.min(sx,sy,sz);
  return(x,y,z)=>{const px=(x-c[0])/sx,py=(y-c[1])/sy,pz=(z-c[2])/sz;let d=-1e9;for(const p of pl){const e=p[0]*px+p[1]*py+p[2]*pz-p[3];if(e>d)d=e}return Math.max(d*m,-z)}}
const SNOW=()=>mat("#eef3f8",{step:.05,shift:.04});
const snowPick=(on,base)=>{if(!on)return null;const sm=SNOW();return(x,y,z,nx,ny,nz)=>nz>.48+(noise3(x*.3,y*.3,z*.3,5)-.5)*.5?sm:base}
const ringPat=(cx,cy)=>(x,y,z)=>(H2(x-cx,y-cy)%2.4)<.8?-1:0;
const barkPat=(x,y,z)=>Math.sin(Math.atan2(y-16,x-16)*11+z*.15)>.7?-1:0;
const leafPat=(x,y,z)=>{const n=noise3(x/2.4,y/2.4,z/2.4,11);return n>.66?1:n<.32?-1:0};
const roughen=(f,amt,s=.4,seed=7)=>amt?(x,y,z)=>(f(x,y,z)+(noise3(x*s,y*s,z*s,seed)-.5)*amt)*.8:f;
const groundCut=f=>(x,y,z)=>Math.max(f(x,y,z),-z);

// ---------- árboles ----------
/** Caja envolvente de una lista de esferas [x,y,z,r]: envuelve un SDF caro para no evaluarlo lejos. */
function boundSpheres(f,list,pad=1.5){let a=[1e9,1e9,1e9],b=[-1e9,-1e9,-1e9];for(const[x,y,z,r]of list){a=[Math.min(a[0],x-r),Math.min(a[1],y-r),Math.min(a[2],z-r)];b=[Math.max(b[0],x+r),Math.max(b[1],y+r),Math.max(b[2],z+r)]}
  return list.length?bounded(f,a[0]-pad,a[1]-pad,a[2]-pad,b[0]+pad,b[1]+pad,b[2]+pad):f}
// ---------- hojas vectoriales ----------
/** Una hoja es un contorno vectorial: media anchura en función de t∈[0,1] a lo largo del nervio.
 *  skew mueve el punto más ancho (≈ base <1 … punta >1), tip afila la punta, lobes hace lóbulos, notch abre la base. */
const LEAF_SHAPES={oval:{name:"Ovalada",skew:1,tip:.85},lanceolada:{name:"Lanceolada",skew:.85,tip:1.25,wmul:.6},corazon:{name:"Acorazonada",skew:.6,tip:.9,notch:.2},
  lobulada:{name:"Lobulada (arce)",skew:.8,tip:.6,lobes:3,wmul:1.3},redonda:{name:"Redonda",skew:1,tip:.45,wmul:1.3},aguja:{name:"Aguja",skew:1,tip:2.2,wmul:.35},
  flor:{name:"Flor",skew:1,tip:.3,wmul:1.6,lobes:2.5}};
function leafHalf(sh,t){if(t<=0||t>=1)return 0;let v=Math.pow(Math.sin(Math.PI*Math.pow(t,sh.skew)),sh.tip)*.5;if(sh.lobes)v*=.55+.45*Math.abs(Math.cos(sh.lobes*Math.PI*t));return v}
const stampCache=new Map();
/** Rasteriza la hoja vectorial (supermuestreo 3×3) a un sello de píxeles con su propio sombreado:
 *  1 cuerpo · 2 borde iluminado · 3 borde en sombra · 4 nervio central. Se cachea por forma/tamaño/ángulo. */
function leafStamp(shName,len,wid,ang){const sh=LEAF_SHAPES[shName]||LEAF_SHAPES.oval,A=((Math.round(ang/(Math.PI*2)*32)%32)+32)%32,Ln=Math.max(1.5,Math.round(len*2)/2),Wd=Math.round(wid*20)/20,key=shName+"|"+Ln+"|"+Wd+"|"+A;
  let s=stampCache.get(key);if(s)return s;
  const a=A/32*Math.PI*2,ca=Math.cos(a),sa=Math.sin(a),R=Math.ceil(Ln)+1,w=2*R+1,d=new Uint8Array(w*w),hw=Wd*(sh.wmul||1)*Ln,inside=(px,py)=>{const u=px*ca+py*sa,v=-px*sa+py*ca,t=u/Ln,hh=leafHalf(sh,t)*hw;
      return Math.abs(v)<=hh&&!(sh.notch&&t<sh.notch*(1-Math.abs(v)/(hh+1e-6)))};
  for(let y=0;y<w;y++)for(let x=0;x<w;x++){let c=0;for(let sy=0;sy<3;sy++)for(let sx=0;sx<3;sx++)if(inside(x-R+(sx+.5)/3-.5,y-R+(sy+.5)/3-.5))c++;if(c>=4)d[y*w+x]=1}
  if(!d.some(v=>v))d[R*w+R]=1;
  const e=new Uint8Array(w*w);for(let y=0;y<w;y++)for(let x=0;x<w;x++){const k=y*w+x;if(!d[k])continue;
    const up=y>0&&d[k-w],dn=y<w-1&&d[k+w],rt=x<w-1&&d[k+1];const px=x-R,py=y-R,u=px*ca+py*sa,v=-px*sa+py*ca,t=u/Ln;
    e[k]=!up&&Ln>=3.5?2:(!dn||!rt)&&Ln>=3?3:Ln>=6&&!sh.lobes&&Math.abs(v)<.5&&t>.12&&t<.8?4:1}
  s={w,x0:-R,y0:-R,d:e,R};stampCache.set(key,s);if(stampCache.size>6000)stampCache.clear();return s}
const leafMix=(a,b)=>{const A=parseInt(a.slice(1),16),B=parseInt(b.slice(1),16),c=s=>Math.round(((A>>s&255)+(B>>s&255))/2);return"#"+((1<<24)|(c(16)<<16)|(c(8)<<8)|c(0)).toString(16).slice(1)};
const darkRamp=m=>({...m,ramp:[m.ramp[0],m.ramp[0],m.ramp[0],m.ramp[1],m.ramp[1],m.ramp[2]]});
/** Follaje: reparte hojas sobre la superficie de cada masa de la copa (espiral de Fibonacci + jitter),
 *  más una capa interior más oscura para que los huecos tengan profundidad. env: [cx,cy,cz,rx,ry,rz]. */
function leafCanopy(env,o){const r=rng(((o.seed|0)*7919+13)||1),items=[],sz=o.size,la=Math.max(1.2,sz*sz*Math.max(.25,o.wid*(LEAF_SHAPES[o.shape]?.wmul||1))*.45);
  const mats=[mat(o.c2,{shift:.09}),mat(leafMix(o.c2,o.c3),{shift:.09}),mat(o.c3,{shift:.09})];const SN=o.snow?mats.push(SNOW())-1:-1;
  const FL=o.flowers>0&&o.cf?mats.push(mat(o.cf,{step:.06}))-1:-1;
  env.forEach((c,ei)=>{const area=4*Math.PI*((c[3]*c[4]+c[3]*c[5]+c[4]*c[5])/3),n=Math.min(700,Math.round(o.dens*area/la*.8));
    for(let k=0;k<n;k++){const zz=1-2*(k+.5)/n,rad=Math.sqrt(1-zz*zz),ph=k*2.39996+r()*.6;let dir=[rad*Math.cos(ph)+(r()-.5)*.15,rad*Math.sin(ph)+(r()-.5)*.15,zz];
      const inner=k%3===0,rf=inner?.7+r()*.14:.9+r()*.18,x=c[0]+dir[0]*c[3]*rf,y=c[1]+dir[1]*c[4]*rf,z=c[2]+dir[2]*c[5]*rf;if(z<.6)continue;
      let hid=false;for(let ej=0;ej<env.length;ej++){if(ej===ei)continue;const d=env[ej],q=((x-d[0])/d[3])**2+((y-d[1])/d[4])**2+((z-d[2])/d[5])**2;if(q<.55){hid=true;break}}if(hid)continue;
      const nn=N3([dir[0]/c[3],dir[1]/c[4],dir[2]/c[5]]),dd=N3([nn[0]+(r()-.5)*1.1,nn[1]+(r()-.5)*1.1,nn[2]+(r()-.5)*1.1-(o.droop||0)*2.2]);
      const cn=noise3(x*.18,y*.18,z*.18,17)+(r()-.5)*.35,ci=o.mix<=0?0:cn<.5-o.mix*.35?0:cn>.5+o.mix*.35?2:o.mix>.15?1:0;
      let m=ci,sh=null,len=sz*(.75+r()*.5),wid=o.wid*(.8+r()*.4);
      if(SN>=0&&nn[2]>.45+(noise3(x*.3,y*.3,z*.3,5)-.5)*.5&&!inner)m=SN;
      if(FL>=0&&!inner&&r()<o.flowers*.22){m=FL;sh="flor";len=Math.max(2,sz*.7);wid=.6}
      items.push({x,y,z,nx:nn[0],ny:nn[1],nz:nn[2],dx:dd[0],dy:dd[1],dz:dd[2],len,wid,m,sh,e:ei,dl:inner?-1:0})}});
  return{items,mats,shape:o.shape,env}}
const LEAF_PARAMS=[["lsize","Tamaño de hoja (px)",2,9,.5,4.5],["lwid","Anchura de hoja",.25,1.2,.05,.55],["ldens","Densidad de follaje",.3,2,.05,1],["lmix","Mezcla de color",0,1,.05,.35]];
const LEAF_SELECT=["lshape","Forma de hoja",Object.entries(LEAF_SHAPES).filter(([k])=>k!=="flor").map(([k,s])=>[k,s.name]),"oval"];
function treeParts(p,leaves){const r=rng((p.seed|0)||1);r();const segs=[],tips=[];
  const pts=[],bpts=[];const grow=(a,dir,len,rad,lvl)=>{if(segs.length>=46)return;const b=add3(a,dir,len);segs.push(rcone(a,b,rad,Math.max(.55,rad*.72)));pts.push([...a,rad],[...b,rad]);
    if(lvl<=0){tips.push(b);return}const[u,v]=perp(dir);
    for(let i=0;i<p.branches;i++){const az=i/p.branches*Math.PI*2+r()*1.2+(p.twist||0)*lvl*1.3,sp=p.spread*(.7+r()*.6)*Math.PI/180;
      let nd=add3(add3(dir.map(q=>q*Math.cos(sp)),u,Math.sin(sp)*Math.cos(az)),v,Math.sin(sp)*Math.sin(az));
      nd[2]-=(p.droop||0)*.9*(1-lvl/(p.levels+1));grow(b,N3(nd),len*(.6+r()*.2),rad*.66,lvl-1)}};
  grow([16,16,0],N3([(r()-.5)*.25,(r()-.5)*.25,1]),p.h*.62,p.trunk,p.levels);
  let ext=0,top=0;const blobs=[],env=[];
  if(leaves)for(const t of tips){if(r()>p.leaf)continue;const s=(3.6+r()*2.6)*p.canopy,dr=p.droop||0,c=[t[0]+(r()-.5)*2,t[1]+(r()-.5)*2,t[2]-s*dr*.6];
    blobs.push(ellipsoid(c[0],c[1],c[2],s,s,s*(1+dr*.9)));env.push([c[0],c[1],c[2],s,s,s*(1+dr*.9)]);bpts.push([c[0],c[1],c[2],s*(1+dr*.9)+2]);ext=Math.max(ext,Math.abs(c[0]-16)+s,Math.abs(c[1]-16)+s);top=Math.max(top,c[2]+s)}
  for(const t of tips){ext=Math.max(ext,Math.abs(t[0]-16)+1,Math.abs(t[1]-16)+1);top=Math.max(top,t[2]+1)}
  return{segs,blobs,ext,top,pts,bpts,env}}
FURNI.arbol={name:"Árbol",cat:"arboles",params:[["seed","Semilla",1,500,1,11],["h","Altura del tronco",12,60,1,30],["trunk","Grosor del tronco",1.2,5,.2,2.6],["levels","Niveles de ramas",1,3,1,2],
  ["branches","Ramas por nivel",2,4,1,3],["spread","Apertura (°)",10,75,1,38],["twist","Torsión",0,1,.05,.3],["droop","Caída (sauce)",0,1,.05,0],["canopy","Tamaño de copa",.5,1.8,.05,1.1],["leaf","Masas de copa",.3,1,.05,1],...LEAF_PARAMS],
  selects:[LEAF_SELECT],toggles:[["hojas","Hojas vectoriales",true],["snow","Nieve",false]],colors:[["c1","Corteza","#6b4a2f"],["c2","Hojas","#4f9e3a"],["c3","Hojas 2","#8cc63f"]],
  build(p){const T0=treeParts(p,true),bark=mat(p.c1,{pattern:barkPat}),lf=mat(p.c2,{shift:.09,pattern:leafPat});
    const parts=[{sdf:boundSpheres(union(...T0.segs),T0.pts),mat:bark,pick:snowPick(p.snow,null)}];
    if(p.hojas&&T0.env.length){// núcleo oscuro raymarcheado + hojas sueltas encima
      const core=T0.env.map(c=>ellipsoid(c[0],c[1],c[2],c[3]*.78,c[4]*.78,c[5]*.78));
      parts.push({sdf:boundSpheres(smoothUnion(2,...core),T0.env.map(c=>[c[0],c[1],c[2],Math.max(c[3],c[5])]),1),mat:darkRamp(lf)});
      const leaves=leafCanopy(T0.env,{seed:p.seed,size:p.lsize,wid:p.lwid,dens:p.ldens,mix:p.lmix,shape:p.lshape||"oval",droop:p.droop,c2:p.c2,c3:p.c3||p.c2,snow:p.snow});
      return{footprint:[1,1],height:Math.ceil(T0.top+p.lsize+3),slack:Math.ceil(Math.max(10,T0.ext+p.lsize-12)),parts,leaves}}
    if(T0.blobs.length)parts.push({sdf:boundSpheres(roughen(smoothUnion(2.2,...T0.blobs),1.6),T0.bpts,2),mat:lf,pick:snowPick(p.snow,null)});
    return{footprint:[1,1],height:Math.ceil(T0.top+3),slack:Math.ceil(Math.max(10,T0.ext-12)),parts}},stack:p=>p.h};
FURNI.arbol_muerto={name:"Árbol seco",cat:"arboles",params:[["seed","Semilla",1,500,1,5],["h","Altura",12,60,1,34],["trunk","Grosor",1.2,5,.2,2.4],["levels","Niveles",1,3,1,3],
  ["branches","Ramas por nivel",2,4,1,2],["spread","Apertura (°)",10,80,1,42],["twist","Torsión",0,1,.05,.6]],toggles:[["snow","Nieve",false]],colors:[["c1","Corteza","#5c4a3a"]],
  build(p){const T0=treeParts({...p,droop:0},false);return{footprint:[1,1],height:Math.ceil(T0.top+3),slack:Math.ceil(Math.max(10,T0.ext-12)),
    parts:[{sdf:boundSpheres(union(...T0.segs),T0.pts),mat:mat(p.c1,{pattern:barkPat}),pick:snowPick(p.snow,null)}]}},stack:p=>p.h};
FURNI.pino={name:"Pino",cat:"arboles",params:[["h","Altura",24,90,1,52],["tiers","Pisos de ramas",2,8,1,5],["rad","Radio",6,16,.5,11],["jag","Dentado",0,1,.05,.6],["trunk","Grosor del tronco",1,4,.2,2]],
  toggles:[["snow","Nieve",false]],colors:[["c1","Corteza","#5c3d26"],["c2","Agujas","#2f6b3f"]],
  build(p){const tiers=[],th=p.h*.78/p.tiers*1.7;
    for(let i=0;i<p.tiers;i++){const zb=p.h*.18+i*(p.h*.78/p.tiers)*.82,ri=p.rad*(1-i/p.tiers*.72),ph=i*1.7;
      tiers.push((x,y,z)=>{const dx=x-16,dy=y-16,t=Math.min(Math.max((z-zb)/th,0),1),rad=ri*(1-t)*(1-p.jag*.3*(.5+.5*Math.sin(Math.atan2(dy,dx)*9+ph)));
        return Math.max((H2(dx,dy)-rad)*.7,zb-z,z-zb-th)})}
    const lf=mat(p.c2,{shift:.08,pattern:leafPat});
    return{footprint:[1,1],height:Math.ceil(p.h*.18+(p.tiers-1)*(p.h*.78/p.tiers)*.82+th+2),slack:Math.ceil(Math.max(10,p.rad-12)),
      parts:[{sdf:cylinder(16,16,p.trunk,0,p.h*.4),mat:mat(p.c1,{pattern:barkPat})},{sdf:bounded(union(...tiers),16-p.rad-1,16-p.rad-1,p.h*.15,16+p.rad+1,16+p.rad+1,p.h*1.25),mat:lf,pick:snowPick(p.snow,null)}]}},stack:p=>p.h};
FURNI.palmera={name:"Palmera",cat:"arboles",params:[["seed","Semilla",1,500,1,3],["h","Altura",24,80,1,48],["curve","Curvatura",0,16,.5,8],["segs","Segmentos",4,12,1,8],
  ["fronds","Hojas",4,10,1,7],["flen","Largo de hoja",8,22,1,15],["droop","Caída de hojas",0,1,.05,.6],["coco","Cocos",0,5,1,3]],colors:[["c1","Tronco","#8a6a45"],["c2","Hojas","#5fa83a"],["c3","Cocos","#6b4a2f"]],
  build(p){const r=rng((p.seed|0)||1);r();const az=r()*Math.PI*2,P=t=>[16+Math.cos(az)*p.curve*t*t,16+Math.sin(az)*p.curve*t*t,p.h*t];
    const trunk=[];for(let i=0;i<p.segs;i++){const a=P(i/p.segs),b=P((i+1)/p.segs),r0=3-1.3*i/p.segs;trunk.push(rcone(a,b,r0,r0*.8))}
    const T0=P(1),fr=[];for(let k=0;k<p.fronds;k++){const a=k/p.fronds*Math.PI*2+r()*.4;let prev=T0;
      for(let j=1;j<=4;j++){const d=j/4*p.flen,q=[T0[0]+Math.cos(a)*d,T0[1]+Math.sin(a)*d,T0[2]+3*Math.sin(Math.PI*j/4*.9)-p.droop*(d/p.flen)**2*p.flen*.7];
        fr.push(rcone(prev,q,1.9-j*.3,1.6-j*.3));prev=q}}
    const parts=[{sdf:union(...trunk),mat:mat(p.c1,{pattern:(x,y,z)=>(z%(p.h/p.segs))<1?-1:0})},{sdf:union(...fr),mat:mat(p.c2,{shift:.08,pattern:leafPat})}];
    if(p.coco>0)parts.push({sdf:union(...Array.from({length:p.coco},(_,i)=>{const a=i/p.coco*Math.PI*2;return sphere(T0[0]+Math.cos(a)*2,T0[1]+Math.sin(a)*2,T0[2]-1.5,1.5)})),mat:mat(p.c3)});
    return{footprint:[1,1],height:Math.ceil(T0[2]+6),slack:Math.ceil(Math.max(10,p.flen+p.curve-10)),parts}},stack:p=>p.h};
FURNI.tocon={name:"Tocón",cat:"arboles",params:[["r","Radio",3,11,.5,6],["h","Altura",2,14,1,6],["roots","Raíces",0,7,1,4],["seed","Semilla",1,500,1,2]],
  colors:[["c1","Corteza","#6b4a2f"],["c2","Madera","#d9b07a"]],
  build(p){const r=rng((p.seed|0)||1),roots=[];for(let i=0;i<p.roots;i++){const a=i/p.roots*Math.PI*2+r()*.6;
      roots.push(rcone([16+Math.cos(a)*p.r*.6,16+Math.sin(a)*p.r*.6,1.8],[16+Math.cos(a)*(p.r+4+r()*3),16+Math.sin(a)*(p.r+4+r()*3),0],1.9,.7))}
    const wood=mat(p.c2,{step:.06,pattern:ringPat(16,16)});
    return{footprint:[1,1],height:p.h+3,parts:[{sdf:groundCut(union(cylinder(16,16,p.r,0,p.h),...roots)),mat:mat(p.c1,{pattern:barkPat}),pick:(x,y,z,nx,ny,nz)=>nz>.8&&z>p.h-.8?wood:null}]}},
  stack:p=>p.h};
FURNI.tronco={name:"Tronco caído",cat:"arboles",params:[["len","Largo",12,30,1,24],["r","Radio",2.5,8,.5,4.5],["moss","Musgo",0,1,.05,.4],["stubs","Muñones de rama",0,3,1,1],["seed","Semilla",1,500,1,4]],
  colors:[["c1","Corteza","#6b4a2f"],["c2","Madera","#d9b07a"],["c3","Musgo","#5f8f3a"]],
  build(p){const r=rng((p.seed|0)||1),a=[16-p.len/2,16,p.r],b=[16+p.len/2,16,p.r],st=[];
    for(let i=0;i<p.stubs;i++){const x=16+(r()-.5)*p.len*.7,az=r()*Math.PI;st.push(rcone([x,16,p.r],[x+Math.cos(az)*2,16+Math.sin(az)*(p.r+3),p.r+2+r()*3],1.2,.7))}
    const wood=mat(p.c2,{step:.06,pattern:(x,y,z)=>(H2(y-16,z-p.r)%2.2)<.7?-1:0}),moss=mat(p.c3,{pattern:leafPat});
    return{footprint:[1,1],height:p.r*2+6,slack:Math.ceil(Math.max(10,p.len/2-12)),parts:[{sdf:groundCut(union(capCyl(a,b,p.r),...st)),mat:mat(p.c1,{pattern:barkPat}),
      pick:(x,y,z,nx,ny,nz)=>Math.abs(nx)>.85?wood:nz>.55&&noise3(x*.3,y*.3,z*.3,8)<p.moss?moss:null}]}},stack:p=>p.r*2};

// ---------- vegetación ----------
FURNI.arbusto={name:"Arbusto",cat:"vegetacion",params:[["seed","Semilla",1,500,1,9],["size","Tamaño",.5,1.8,.05,1],["n","Masas",3,14,1,7],["rough","Rugosidad",0,1,.05,.5],["flowers","Flores",0,1,.05,.3],
    ["lsize","Tamaño de hoja (px)",2,9,.5,3.5],["lwid","Anchura de hoja",.25,1.2,.05,.6],["ldens","Densidad de follaje",.3,2,.05,1.1],["lmix","Mezcla de color",0,1,.05,.3]],
  selects:[[...LEAF_SELECT.slice(0,3),"redonda"]],toggles:[["hojas","Hojas vectoriales",true]],
  colors:[["c1","Hojas","#3f8a34"],["c2","Flores","#ff3fcd"],["c3","Hojas 2","#6fae3a"]],
  build(p){const r=rng((p.seed|0)||1),s=p.size,bl=[],bp=[],env=[];for(let i=0;i<p.n;i++){const a=r()*Math.PI*2,d=Math.sqrt(r())*7*s,rr=(3.6+r()*3)*s;const cz=rr*.75+r()*4*s;bl.push(sphere(16+Math.cos(a)*d,16+Math.sin(a)*d,cz,rr));bp.push([16+Math.cos(a)*d,16+Math.sin(a)*d,rr*.75,rr+4*s+2]);env.push([16+Math.cos(a)*d,16+Math.sin(a)*d,cz,rr,rr,rr])}
    const fl=mat(p.c2,{step:.06});
    if(p.hojas){const lf=mat(p.c1,{shift:.09}),core=env.map(c=>sphere(c[0],c[1],c[2],c[3]*.8));
      return{footprint:[1,1],height:Math.ceil(16*s+p.lsize+6),slack:Math.ceil(Math.max(10,12*s+p.lsize-12)),parts:[{sdf:groundCut(boundSpheres(smoothUnion(2,...core),bp,2)),mat:darkRamp(lf)}],
        leaves:leafCanopy(env,{seed:p.seed,size:p.lsize,wid:p.lwid,dens:p.ldens,mix:p.lmix,shape:p.lshape||"redonda",c2:p.c1,c3:p.c3||p.c1,flowers:p.flowers,cf:p.c2})}}
    return{footprint:[1,1],height:Math.ceil(16*s+6),slack:Math.ceil(Math.max(10,12*s-12)),parts:[{sdf:groundCut(boundSpheres(roughen(smoothUnion(2.4,...bl),2.4*p.rough+.4,.45),bp,2.5)),mat:mat(p.c1,{shift:.09,pattern:leafPat}),
      pick:p.flowers>0?(x,y,z)=>noise3(x*.8,y*.8,z*.8,3)>1-p.flowers*.28?fl:null:null}]}},stack:p=>10*p.size};
FURNI.seto={name:"Seto",cat:"vegetacion",params:[["n","Largo (baldosas)",1,3,1,2],["h","Altura",6,26,1,14],["depth","Grosor",5,16,1,10],["rough","Rugosidad",0,1,.05,.5],["flowers","Flores",0,1,.05,0]],
  colors:[["c1","Hojas","#3f8a34"],["c2","Flores","#ffffff"]],
  build(p){const D=p.n*T,fl=mat(p.c2,{step:.06});return{footprint:[1,p.n],height:p.h+4,parts:[{sdf:groundCut(roughen(box(16-p.depth/2,2,0,16+p.depth/2,D-2,p.h,Math.min(3,p.depth/2-.5)),1.8*p.rough+.3,.5)),
    mat:mat(p.c1,{shift:.09,pattern:leafPat}),pick:p.flowers>0?(x,y,z)=>noise3(x*.8,y*.8,z*.8,4)>1-p.flowers*.28?fl:null:null}]}},stack:p=>p.h};
FURNI.hierba={name:"Hierba / juncos",cat:"vegetacion",walk:true,params:[["seed","Semilla",1,500,1,6],["blades","Briznas",4,40,1,18],["h","Altura",3,26,1,8],["bend","Curvatura",0,1,.05,.5],
  ["spread","Extensión",2,13,.5,7],["wind","Viento",-1,1,.05,.2]],toggles:[["spike","Espigas (juncos)",false]],colors:[["c1","Hierba","#5fae3a"],["c2","Espiga","#a8874a"]],
  build(p){const r=rng((p.seed|0)||1),bl=[],sp=[];
    for(let i=0;i<p.blades;i++){const a=r()*Math.PI*2,d=Math.sqrt(r())*p.spread,b=[16+Math.cos(a)*d,16+Math.sin(a)*d,0],hh=p.h*(.55+r()*.55),ba=r()*Math.PI*2,
        off=[Math.cos(ba)*p.bend*hh*.5+p.wind*hh*.45,Math.sin(ba)*p.bend*hh*.5-p.wind*hh*.2],Q=t=>[b[0]+off[0]*t*t,b[1]+off[1]*t*t,hh*t-(p.bend*hh*.15)*t*t];
      const ts=[0,.4,.75,1],rs=[1,.8,.55,.32];for(let j=0;j<3;j++)bl.push(rcone(Q(ts[j]),Q(ts[j+1]),rs[j],rs[j+1]));
      if(p.spike)sp.push(ellipsoid(...Q(1),.9,.9,2.2))}
    const parts=[{sdf:bounded(union(...bl),16-p.spread-p.h,16-p.spread-p.h,0,16+p.spread+p.h,16+p.spread+p.h,p.h*1.2+2),mat:mat(p.c1,{shift:.09})}];
    if(sp.length)parts.push({sdf:union(...sp),mat:mat(p.c2)});
    return{footprint:[1,1],height:Math.ceil(p.h*1.15+5),slack:Math.ceil(Math.max(10,p.spread+p.h*.6-12)),parts}},stack:()=>0};
FURNI.flores={name:"Flores",cat:"vegetacion",walk:true,params:[["seed","Semilla",1,500,1,8],["n","Cantidad",1,14,1,6],["h","Altura",3,14,1,7],["petals","Pétalos",3,8,1,5],["ps","Tamaño de pétalo",.6,2.2,.1,1.3],["spread","Extensión",2,12,.5,7]],
  colors:[["c1","Tallo","#4f9e3a"],["c2","Pétalos","#ff3fcd"],["c3","Centro","#ffd23f"]],
  build(p){const r=rng((p.seed|0)||1),st=[],pe=[],ce=[];
    for(let i=0;i<p.n;i++){const a=r()*Math.PI*2,d=Math.sqrt(r())*p.spread,b=[16+Math.cos(a)*d,16+Math.sin(a)*d,0],t=[b[0]+(r()-.5)*2,b[1]+(r()-.5)*2,p.h*(.65+r()*.5)];
      st.push(rcone(b,t,.55,.45));const ph=r()*6;for(let j=0;j<p.petals;j++){const q=ph+j/p.petals*Math.PI*2;pe.push(sphere(t[0]+Math.cos(q)*p.ps,t[1]+Math.sin(q)*p.ps,t[2]+.2,p.ps*.62))}
      ce.push(sphere(t[0],t[1],t[2]+.6,p.ps*.5))}
    const B=f=>bounded(union(...f),16-p.spread-4,16-p.spread-4,0,16+p.spread+4,16+p.spread+4,p.h*1.3+4);
    return{footprint:[1,1],height:Math.ceil(p.h*1.25+5),parts:[{sdf:B(st),mat:mat(p.c1)},{sdf:B(pe),mat:mat(p.c2,{step:.07})},{sdf:B(ce),mat:mat(p.c3,{step:.06})}]}},stack:()=>0};
FURNI.seta={name:"Setas",cat:"vegetacion",walk:true,params:[["seed","Semilla",1,500,1,4],["n","Cantidad",1,6,1,3],["size","Tamaño",.6,2.2,.05,1.2],["flat","Sombrero plano",.3,1,.05,.6]],
  toggles:[["spots","Manchas",true]],colors:[["c1","Pie","#f2ead8"],["c2","Sombrero","#e0353a"],["c3","Manchas","#ffffff"]],
  build(p){const r=rng((p.seed|0)||1),stems=[],caps=[];
    for(let i=0;i<p.n;i++){const s=p.size*(i?.55+r()*.5:1),a=r()*Math.PI*2,d=i?3+r()*6:0,x=16+Math.cos(a)*d,y=16+Math.sin(a)*d,h=5*s;
      stems.push(rcone([x,y,0],[x,y,h],1.2*s,.8*s));const e=ellipsoid(x,y,h,3.2*s,3.2*s,3.2*s*p.flat);caps.push((X,Y,Z)=>Math.max(e(X,Y,Z),h-.6-Z))}
    const sp=mat(p.c3,{step:.05});
    return{footprint:[1,1],height:Math.ceil(9*p.size+4),parts:[{sdf:union(...stems),mat:mat(p.c1,{step:.06})},
      {sdf:union(...caps),mat:mat(p.c2),pick:p.spots?(x,y,z,nx,ny,nz)=>nz>.1&&noise3(x*.9,y*.9,z*.9,6)>.72?sp:null:null}]}},stack:p=>5*p.size};
FURNI.cactus={name:"Cactus",cat:"vegetacion",params:[["seed","Semilla",1,500,1,7],["h","Altura",10,48,1,28],["thick","Grosor",2.5,6,.25,4],["arms","Brazos",0,4,1,2]],
  toggles:[["ribs","Costillas",true],["flower","Flor",true]],colors:[["c1","Cactus","#4f8f3a"],["c2","Flor","#ff3fcd"]],
  build(p){const r=rng((p.seed|0)||1),t=p.thick,body=[capsule([16,16,0],[16,16,p.h-t],t)];
    for(let k=0;k<p.arms;k++){const a=k/Math.max(1,p.arms)*Math.PI*2+r()*.7,z=p.h*(.3+r()*.35),L=t+3+r()*4,e=[16+Math.cos(a)*L,16+Math.sin(a)*L,z];
      body.push(rcone([16,16,z],e,t*.6,t*.6),capsule(e,[e[0],e[1],z+4+r()*9],t*.6))}
    const parts=[{sdf:groundCut(union(...body)),mat:mat(p.c1,{pattern:p.ribs?(x,y)=>Math.sin(Math.atan2(y-16,x-16)*10)>.55?-1:0:null})}];
    if(p.flower)parts.push({sdf:sphere(16,16,p.h,1.7),mat:mat(p.c2,{step:.06})});
    return{footprint:[1,1],height:p.h+4,parts}},stack:p=>p.h};

// ---------- rocas y relieve ----------
FURNI.roca={name:"Roca",cat:"rocas",params:[["seed","Semilla",1,500,1,12],["size","Tamaño",3,15,.5,8],["n","Piedras",1,4,1,1],["irr","Irregularidad",0,1,.05,.6],["facets","Facetas",6,20,1,11],
  ["flat","Achatado",.35,1,.05,.7],["moss","Musgo",0,1,.05,.2],["vein","Veta de mineral",0,1,.05,0]],toggles:[["snow","Nieve",false]],
  colors:[["c1","Roca","#8a8f96"],["c2","Musgo","#5f8f3a"],["c3","Mineral","#ffd23f"]],
  build(p){const r=rng((p.seed|0)||1),rs=[];let top=0;
    for(let i=0;i<p.n;i++){const s=p.size*(i?.45+r()*.4:1),a=r()*Math.PI*2,d=i?p.size*.7+r()*4:0,c=[16+Math.cos(a)*d,16+Math.sin(a)*d,s*p.flat*.45];
      rs.push(rockShape(c,s,p.flat,p.irr,p.facets,r));top=Math.max(top,c[2]+s*p.flat)}
    const moss=mat(p.c2,{pattern:leafPat}),ore=mat(p.c3,{emissive:true,step:.06}),sm=SNOW();
    return{footprint:[1,1],height:Math.ceil(top+4),slack:Math.ceil(Math.max(10,p.size*1.6-12)),parts:[{sdf:union(...rs),mat:mat(p.c1,{step:.075,shift:.05}),
      pick:(x,y,z,nx,ny,nz)=>{if(p.snow&&nz>.5)return sm;if(p.vein>0&&noise3(x*.55,y*.55,z*.55,13)>1-p.vein*.22)return ore;if(p.moss>0&&nz>.85-p.moss*.6+(noise3(x*.3,y*.3,z*.3,2)-.5)*.4)return moss;return null}}]}},
  stack:p=>p.size*p.flat*1.4};
FURNI.cristales={name:"Cristales",cat:"rocas",params:[["seed","Semilla",1,500,1,6],["n","Cristales",1,9,1,5],["len","Largo",6,30,1,16],["r","Grosor",1.2,4.5,.1,2.4],["spread","Apertura (°)",0,55,1,28]],
  toggles:[["base","Roca base",true]],colors:[["c1","Cristal","#82d7ff"],["c2","Roca","#6f747a"]],
  build(p){const r=rng((p.seed|0)||1),cs=[];let top=0;
    for(let i=0;i<p.n;i++){const a=r()*Math.PI*2,tl=i?p.spread*(.5+r()*.7)*Math.PI/180:p.spread*.15*Math.PI/180,dir=[Math.sin(tl)*Math.cos(a),Math.sin(tl)*Math.sin(a),Math.cos(tl)],
      L=p.len*(i?.55+r()*.45:1),o=[16+(r()-.5)*4,16+(r()-.5)*4,p.base?1.5:0];cs.push(crystal(o,dir,p.r*(i?.65+r()*.4:1),L));top=Math.max(top,o[2]+dir[2]*L)}
    const parts=[{sdf:groundCut(union(...cs)),mat:mat(p.c1,{emissive:true,step:.1,shift:.04})}];
    if(p.base)parts.push({sdf:union(rockShape([16,16,1],6,.45,.5,9,r),rockShape([19,13,.5],3.5,.5,.5,8,r)),mat:mat(p.c2,{step:.07})});
    return{footprint:[1,1],height:Math.ceil(top+4),slack:Math.ceil(Math.max(10,p.len*Math.sin(p.spread*Math.PI/180)-8)),parts}},stack:()=>0};
FURNI.bloque={name:"Bloque de terreno",cat:"rocas",params:[["w","Ancho (baldosas)",1,2,1,1],["d","Fondo (baldosas)",1,2,1,1],["h","Altura",6,44,1,20],["grass","Capa de césped",1,7,.5,3],
  ["irr","Irregularidad",0,1,.05,.5],["stones","Piedras incrustadas",0,14,1,6],["seed","Semilla",1,500,1,3]],toggles:[["hang","Hierba colgante",true],["snow","Nieve arriba",false]],
  colors:[["c1","Césped","#5fae3a"],["c2","Tierra","#8b5e34"],["c3","Roca","#7d7a74"]],
  build(p){const r=rng((p.seed|0)||1),W=p.w*T,D=p.d*T,h=p.h,grass=p.snow?SNOW():mat(p.c1,{shift:.09,pattern:leafPat}),dirt=mat(p.c2,{step:.07}),rock=mat(p.c3,{step:.07});
    const st=[],hg=[];
    for(let i=0;i<p.stones;i++){const f=Math.floor(r()*4),u=2+r()*((f<2?D:W)-4),z=1+r()*(h*.7-2),s=1.1+r()*1.8,c=f===0?[W,u,z]:f===1?[0,u,z]:f===2?[u,D,z]:[u,0,z];st.push(ellipsoid(c[0],c[1],c[2],s,s,s*.75))}
    if(p.hang){const per=Math.round((W+D)/3);for(let i=0;i<per*2;i++){const f=Math.floor(r()*4),u=1+r()*((f<2?D:W)-2),L=1.5+r()*3.5,
      a=f===0?[W+.4,u,h-.6]:f===1?[-.4,u,h-.6]:f===2?[u,D+.4,h-.6]:[u,-.4,h-.6];hg.push(rcone(a,[a[0]+(f===0?.6:f===1?-.6:0),a[1]+(f===2?.6:f===3?-.6:0),h-.6-L],.8,.4))}}
    const parts=[{sdf:box(0,0,0,W,D,h,.6),mat:dirt,pick:(x,y,z)=>{const gz=h-p.grass-(noise3(x*.25,y*.25,0,4)-.5)*3*p.irr*2;if(z>gz)return grass;
      return z>h*.45+(noise3(x*.2,y*.2,z*.1,6)-.5)*7*p.irr?null:rock}}];
    if(st.length)parts.push({sdf:union(...st),mat:mat(p.c3,{step:.08,shift:.05})});
    if(hg.length)parts.push({sdf:union(...hg),mat:p.snow?SNOW():mat(p.c1,{shift:.09})});
    return{footprint:[p.w,p.d],height:h+3,parts}},stack:p=>p.h};

// ---------- vallas y muros ----------
FURNI.valla={name:"Valla de madera",cat:"vallas",params:[["n","Largo (baldosas)",1,3,1,2],["h","Altura",6,26,1,14],["posts","Postes por baldosa",1,3,1,1],["rails","Travesaños",1,3,1,2],["wear","Desgaste",0,1,.05,.3],["seed","Semilla",1,500,1,2]],
  toggles:[["pickets","Tablas verticales",false]],colors:[["c1","Madera","#9a6a3f"]],
  build(p){const r=rng((p.seed|0)||1),D=p.n*T,np=p.n*p.posts+1,ps=[],rl=[];
    for(let i=0;i<np;i++){const y=1.2+i*(D-2.4)/(np-1),hh=p.h+(r()-.5)*p.wear*4,ox=(r()-.5)*p.wear*1.2;ps.push(box(14.8+ox,y-1.2,0,17.2+ox,y+1.2,hh,.3))}
    for(let k=0;k<p.rails;k++){const z=p.h*(.3+.55*(p.rails===1?.5:k/(p.rails-1)))+(r()-.5)*p.wear*1.5;rl.push(box(15.3,1,z-.9,16.7,D-1,z+.9,.2))}
    if(p.pickets)for(let y=3;y<D-2;y+=3.2)rl.push(box(15.6,y-1,0,16.6,y+1,p.h-1+(r()-.5)*p.wear*2,.2));
    return{footprint:[1,p.n],height:p.h+4,parts:[{sdf:union(...ps,...rl),mat:mat(p.c1,{pattern:grain})}]}},stack:p=>p.h};
FURNI.muro={name:"Muro de piedra",cat:"vallas",params:[["n","Largo (baldosas)",1,3,1,2],["h","Altura",4,28,1,12],["thick","Grosor",4,14,1,8],["bw","Ancho de piedra",3,10,.5,6],["bh","Alto de piedra",2,6,.5,3],["jit","Variación",0,1,.05,.5]],
  colors:[["c1","Piedra","#9a9590"],["c2","Mortero","#5f5a55"]],
  build(p){const D=p.n*T,mort=mat(p.c2,{step:.05});
    const stone=mat(p.c1,{step:.07,pattern:(x,y,z)=>{const row=Math.floor(z/p.bh),u=x+y+(row%2)*p.bw/2,h=hash3(Math.floor(u/p.bw),row,7,3);return h<.3*p.jit?-1:h>1-.3*p.jit?1:0}});
    return{footprint:[1,p.n],height:p.h+3,parts:[{sdf:box(16-p.thick/2,.5,0,16+p.thick/2,D-.5,p.h,.4),mat:stone,pick:(x,y,z,nx,ny,nz)=>{
      if(nz>.6){const u=(x-16+p.thick)%p.bw;return u<.6?mort:null}
      const row=Math.floor(z/p.bh),u=(Math.abs(nx)>Math.abs(ny)?y:x)+(row%2)*p.bw/2;return(z%p.bh)<.6||(u%p.bw)<.6?mort:null}}]}},stack:p=>p.h};
FURNI.empalizada={name:"Empalizada",cat:"vallas",params:[["n","Largo (baldosas)",1,3,1,2],["h","Altura",12,48,1,26],["r","Grosor de tronco",1.4,3.4,.1,2],["jit","Variación de altura",0,1,.05,.4],["seed","Semilla",1,500,1,5]],
  toggles:[["tip","Puntas afiladas",true]],colors:[["c1","Madera","#7a5535"]],
  build(p){const r=rng((p.seed|0)||1),D=p.n*T,logs=[];
    for(let y=p.r+.3;y<=D-p.r-.3;y+=p.r*2){const hh=p.h*(1-p.jit*.25*r());logs.push(cylinder(16,y,p.r,0,hh));if(p.tip)logs.push(cone(16,y,p.r,hh,.2,hh+p.r*2.4))}
    return{footprint:[1,p.n],height:Math.ceil(p.h+p.r*2.4+3),parts:[{sdf:bounded(union(...logs),16-p.r,0,0,16+p.r,D,p.h+p.r*3),mat:mat(p.c1,{pattern:barkPat})}]}},stack:p=>p.h};

// ---------- estructuras ----------
FURNI.banco={name:"Banco",cat:"exterior",params:[["n","Largo (baldosas)",1,2,1,1],["seat","Altura del asiento",5,14,1,9]],toggles:[["back","Respaldo",true],["metal","Patas de metal",true]],
  colors:[["c1","Madera","#b0703c"],["c2","Metal","#4c4c4c"]],
  build(p){const D=p.n*T,s=p.seat,pl=[box(9,3,s,12.6,D-3,s+1.6,.3),box(13.2,3,s,16.8,D-3,s+1.6,.3),box(17.4,3,s,21,D-3,s+1.6,.3)],lg=[];
    for(const y of[5,D-7]){lg.push(box(9.5,y,0,11.5,y+2,s),box(18.5,y,0,20.5,y+2,s),box(9.5,y,s-2.2,20.5,y+2,s))}
    if(p.back){pl.push(box(6.6,3,s+3,8.4,D-3,s+5.6,.3),box(6.6,3,s+7,8.4,D-3,s+9.6,.3));for(const y of[5,D-7])lg.push(box(7,y,s,8.6,y+2,s+10))}
    return{footprint:[1,p.n],height:s+12,parts:[{sdf:union(...pl),mat:mat(p.c1,{pattern:grain})},{sdf:union(...lg),mat:p.metal?mat(p.c2,{step:.1,shift:.03}):mat(p.c1,{pattern:grain})}]}},stack:p=>p.seat+1.6};
FURNI.farola={name:"Farola",cat:"exterior",params:[["h","Altura",24,84,1,52],["lan","Tamaño del farol",2.5,7,.5,4],["pole","Grosor del poste",.8,2.4,.2,1.4]],
  selects:[["style","Estilo",[["clasica","Clásica"],["curva","Brazo curvo"],["doble","Doble"]],"clasica"]],toggles:[["glow","Encendida",true]],colors:[["c1","Metal","#2c2c2c"],["c2","Luz","#ffd27a"]],
  build(p){const h=p.h,l=p.lan,me=mat(p.c1,{step:.1,shift:.03}),li=mat(p.c2,{emissive:p.glow,step:.06}),metal=[cylinder(16,16,4,0,2.5,.6),cone(16,16,2.6,2.5,p.pole,7),cylinder(16,16,p.pole,2,h)],light=[];
    const lantern=(x,y,z)=>{light.push(box(x-l*.75,y-l*.75,z-l*1.4,x+l*.75,y+l*.75,z,.4));metal.push(cone(x,y,l*1.15,z,.4,z+l*.9),box(x-l*.85,y-l*.85,z-l*1.55,x+l*.85,y+l*.85,z-l*1.35))};
    if(p.style==="clasica")lantern(16,16,h+l*1.45);
    else{for(const sg of p.style==="doble"?[1,-1]:[1]){const pts=[[16,16,h-1],[16,16+sg*3,h+3],[16,16+sg*7,h+4.5],[16,16+sg*10,h+3]];for(let i=0;i<3;i++)metal.push(capsule(pts[i],pts[i+1],p.pole*.8));
      light.push(sphere(16,16+sg*10,h-l*.6,l*.7));metal.push(cone(16,16+sg*10,l*1.3,h-l*.4,.5,h+2.6))}}
    return{footprint:[1,1],height:Math.ceil(h+l*2.6+4),slack:p.style==="clasica"?10:14,parts:[{sdf:union(...metal),mat:me},{sdf:union(...light),mat:li}]}},stack:p=>p.h};
FURNI.letrero={name:"Letrero",cat:"exterior",params:[["h","Altura",8,32,1,18],["bw","Ancho del cartel",6,26,1,16],["bh","Alto del cartel",4,14,1,8],["lines","Líneas de texto",0,4,1,2],["seed","Semilla",1,500,1,4]],
  toggles:[["arrow","Flecha",true]],colors:[["c1","Madera","#8a5a35"],["c2","Cartel","#d9b07a"],["c3","Texto","#3a2a1f"]],
  build(p){const r=rng((p.seed|0)||1),y0=16-p.bw/2,y1=16+p.bw/2,z0=p.h-p.bh,txt=mat(p.c3,{step:.04});
    let board=box(15,y0,z0,17,y1,p.h,.3);if(p.arrow){const b=board,tipY=y1+p.bh*.55,zc=z0+p.bh/2;board=(x,y,z)=>Math.min(b(x,y,z),Math.max(Math.abs(x-16)-1,(Math.abs(z-zc)*p.bh*.55/(p.bh/2)+y-tipY)*.7,y1-.5-y))}
    const segs=Array.from({length:p.lines},(_,i)=>{const zc=p.h-1.8-i*(p.bh-2.4)/Math.max(1,p.lines);const cuts=[];let y=y0+1.6;while(y<y1-1.6){const L=1+r()*3;cuts.push([y,Math.min(y1-1.6,y+L),zc]);y+=L+.9+r()*.8}return cuts}).flat();
    return{footprint:[1,1],height:p.h+3,slack:p.arrow?12:10,parts:[{sdf:box(15,15,0,17,17,p.h-.5),mat:mat(p.c1,{pattern:grain})},{sdf:board,mat:mat(p.c2,{step:.06}),
      pick:(x,y,z,nx)=>Math.abs(nx)>.6&&segs.some(([a,b,zc])=>y>=a&&y<=b&&Math.abs(z-zc)<.55)?txt:null}]}},stack:p=>p.h};
FURNI.barril={name:"Barril",cat:"exterior",params:[["r","Radio",4,11,.5,7],["h","Altura",8,28,1,16],["bulge","Abombado",0,3,.1,1.4],["hoops","Aros",2,4,1,3]],
  colors:[["c1","Madera","#a0652f"],["c2","Aros","#4c4c4c"]],
  build(p){const R=z=>p.r+p.bulge*Math.sin(Math.PI*Math.min(Math.max(z/p.h,0),1)),hz=p.hoops===2?[.18,.82]:p.hoops===3?[.15,.5,.85]:[.12,.38,.62,.88];
    return{footprint:[1,1],height:p.h+3,parts:[{sdf:(x,y,z)=>Math.max((H2(x-16,y-16)-R(z))*.92,-z,z-p.h),mat:mat(p.c1,{pattern:(x,y,z)=>z>p.h-.6?ringPat(16,16)(x,y,z):Math.sin(Math.atan2(y-16,x-16)*14)>.86?-1:0})},
      {sdf:union(...hz.map(t=>torus(16,16,p.h*t,R(p.h*t)+.25,.75))),mat:mat(p.c2,{step:.1,shift:.03})}]}},stack:p=>p.h};
FURNI.caja={name:"Caja de madera",cat:"exterior",params:[["s","Tamaño",8,28,1,16],["h","Altura",6,28,1,14],["planks","Tablones",2,6,1,3]],toggles:[["frame","Marco",true]],
  colors:[["c1","Tablas","#c08a4f"],["c2","Marco","#8a5a35"]],
  build(p){const a=16-p.s/2,b=16+p.s/2,fr=mat(p.c2,{pattern:grain}),ph=p.h/p.planks;
    return{footprint:[1,1],height:p.h+3,parts:[{sdf:box(a,a,0,b,b,p.h,.3),mat:mat(p.c1,{pattern:(x,y,z)=>(z%ph)<.7?-1:0}),
      pick:p.frame?(x,y,z)=>{const e=v=>Math.min(Math.abs(v-a),Math.abs(v-b))<1.7;return(e(x)+e(y)+(z<1.7||z>p.h-1.7))>=2?fr:null}:null}]}},stack:p=>p.h};
FURNI.hoguera={name:"Hoguera",cat:"exterior",params:[["logs","Leños",3,7,1,4],["len","Largo de leño",7,16,.5,11],["flame","Altura de la llama",0,20,1,10],["seed","Semilla",1,500,1,3]],
  toggles:[["stones","Anillo de piedras",true]],colors:[["c1","Leña","#5c3d26"],["c2","Piedra","#8a8f96"],["c3","Fuego","#ff7300"]],
  build(p){const r=rng((p.seed|0)||1),lg=[],st=[],fl=[];
    for(let k=0;k<p.logs;k++){const a=k/p.logs*Math.PI*2+r()*.4;lg.push(rcone([16+Math.cos(a)*p.len*.55,16+Math.sin(a)*p.len*.55,.8],[16+Math.cos(a)*.8,16+Math.sin(a)*.8,p.len*.5],1.7,1.1))}
    if(p.stones)for(let k=0;k<10;k++){const a=k/10*Math.PI*2,R=p.len*.6+2.2;st.push(ellipsoid(16+Math.cos(a)*R,16+Math.sin(a)*R,.8,1.8,1.8,1.3))}
    const parts=[{sdf:union(...lg),mat:mat(p.c1,{pattern:barkPat})}];if(st.length)parts.push({sdf:union(...st),mat:mat(p.c2,{step:.07})});
    if(p.flame>0){const yel=mat("#ffd23f",{emissive:true,step:.05});fl.push(cone(16,16,p.flame*.38,1,.3,p.flame+1));
      for(let k=0;k<3;k++){const a=r()*Math.PI*2;fl.push(cone(16+Math.cos(a)*2,16+Math.sin(a)*2,p.flame*.22,1,.2,p.flame*(.5+r()*.35)+1))}
      parts.push({sdf:union(...fl),mat:mat(p.c3,{emissive:true,step:.06}),pick:(x,y,z)=>z>p.flame*.55+(noise3(x*.5,y*.5,z*.3,9)-.5)*3?yel:null})}
    return{footprint:[1,1],height:Math.ceil(Math.max(p.len*.5,p.flame)+5),parts}},stack:()=>0};
FURNI.lena={name:"Pila de leña",cat:"exterior",params:[["rows","Filas",1,4,1,3],["len","Largo",8,28,1,18],["r","Grosor",1.5,3.6,.1,2.4],["seed","Semilla",1,500,1,6]],
  colors:[["c1","Corteza","#6b4a2f"],["c2","Madera","#d9b07a"]],
  build(p){const r=rng((p.seed|0)||1),logs=[],wood=mat(p.c2,{step:.06,pattern:(x,y,z)=>noise3(x*1.4,y*.2,z*1.4,2)>.6?-1:0});
    for(let i=0;i<p.rows;i++){const cnt=p.rows-i+1;for(let j=0;j<cnt;j++){const x=16+(j-(cnt-1)/2)*p.r*2.05,z=p.r+i*p.r*1.75,jl=(r()-.5)*3;
      logs.push(capCyl([x,16-p.len/2+jl,z],[x,16+p.len/2+jl,z],p.r*(.85+r()*.2)))}}
    return{footprint:[1,1],height:Math.ceil(p.r*2+(p.rows-1)*p.r*1.75+4),parts:[{sdf:groundCut(union(...logs)),mat:mat(p.c1,{pattern:barkPat}),pick:(x,y,z,nx,ny)=>Math.abs(ny)>.8?wood:null}]}},
  stack:p=>p.r*2+(p.rows-1)*p.r*1.75};
FURNI.pozo={name:"Pozo",cat:"exterior",params:[["r","Radio",7,13,.5,10],["wall","Altura del brocal",5,14,1,8],["roofH","Altura del techo",0,24,1,16]],
  colors:[["c1","Piedra","#9a9590"],["c2","Madera","#7a5535"],["c3","Techo","#a33b2f"],["c4","Agua","#3f9ad4"]],
  build(p){const R=p.r,w=p.wall,mort=mat("#5f5a55",{step:.05}),parts=[
    {sdf:sub(cylinder(16,16,R,0,w),cylinder(16,16,R-2.4,1,w+1)),mat:mat(p.c1,{step:.07}),pick:(x,y,z,nx,ny,nz)=>{if(nz>.6)return null;const row=Math.floor(z/2.6),u=Math.atan2(y-16,x-16)*R+(row%2)*2.2;return(z%2.6)<.55||((u+100)%4.4)<.55?mort:null}},
    {sdf:cylinder(16,16,R-2.4,0,w-2.5),mat:mat(p.c4,{step:.05})}];
    if(p.roofH>0){const top=w+p.roofH,bw=R+2.5,rh=Math.max(4,R*.6);
      parts.push({sdf:union(box(15,16-R+.4,w-1,17,16-R+2.4,top),box(15,16+R-2.4,w-1,17,16+R-.4,top),capCyl([16,16-R+1,top-3],[16,16+R-1,top-3],.9)),mat:mat(p.c2,{pattern:grain})});
      const k=rh/bw,n=Math.sqrt(1+k*k);parts.push({sdf:(x,y,z)=>Math.max((Math.abs(x-16)*k+z-(top+rh))/n,top-.5-z,Math.abs(y-16)-(R+1.5)),mat:mat(p.c3,{pattern:(x,y,z)=>(z%2.2)<.6?-1:0})});
      parts.push({sdf:union(capsule([16,16,top-3],[16,16,w+3],.35),cylinder(16,16,1.6,w+1,w+3.4)),mat:mat("#5a4632")})}
    return{footprint:[1,1],height:Math.ceil(w+p.roofH+Math.max(4,R*.6)+4),slack:12,parts}},stack:p=>p.wall};
FURNI.tienda={name:"Tienda de campaña",cat:"exterior",params:[["w","Largo (baldosas)",1,2,1,1],["h","Altura",8,28,1,16],["half","Medio ancho",6,15,.5,12]],toggles:[["door","Entrada abierta",true]],
  colors:[["c1","Lona","#ff9004"],["c2","Palos","#5c3d26"]],
  build(p){const W=p.w*T,k=p.h/p.half,n=Math.sqrt(1+k*k),tri=(x,y,z)=>(Math.abs(y-16)*k+z-p.h)/n;
    let tent=(x,y,z)=>Math.max(tri(x,y,z),-z,Math.abs(x-W/2)-(W/2-3));
    if(p.door){const t0=tent,dk=p.h*.7/(p.half*.38),dn=Math.sqrt(1+dk*dk);tent=(x,y,z)=>Math.max(t0(x,y,z),-Math.max((Math.abs(y-16)*dk+z-p.h*.7)/dn,W-6.5-x))}
    return{footprint:[p.w,1],height:p.h+5,parts:[{sdf:tent,mat:mat(p.c1,{pattern:(x)=>(x%5)<.6?-1:0})},{sdf:union(capsule([3,16,0],[3,16,p.h+2.5],.6),capsule([W-3,16,0],[W-3,16,p.h+2.5],.6)),mat:mat(p.c2)}]}},
  stack:p=>p.h};
FURNI.fuente={name:"Fuente",cat:"exterior",params:[["n","Tamaño (baldosas)",1,2,1,1],["rim","Altura del borde",3,10,1,5],["tiers","Pisos",1,3,1,2]],toggles:[["jets","Chorros",true]],
  colors:[["c1","Piedra","#c9c4b8"],["c2","Agua","#4aa8e0"]],
  build(p){const S=p.n*T,c=S/2,R=c-2,rim=p.rim,st=[sub(cylinder(c,c,R,0,rim),cylinder(c,c,R-2.2,1.5,rim+1))],wa=[cylinder(c,c,R-2.2,0,rim-1.2)];let z=rim,r=R;
    for(let t=1;t<p.tiers;t++){const col=z+6+t;st.push(cylinder(c,c,1.8,0,col));r=r*.5;st.push(sub(cylinder(c,c,r,col,col+2.5),cylinder(c,c,r-1.5,col+1,col+3.5)),cone(c,c,1.6,col-3,r*.9,col));wa.push(cylinder(c,c,r-1.5,col+.5,col+1.8));z=col+2.5}
    st.push(sphere(c,c,z+2,1.4));
    if(p.jets)for(let k=0;k<4;k++){const a=k*Math.PI/2+.4,pts=[[c,c,z+3],[c+Math.cos(a)*2.5,c+Math.sin(a)*2.5,z+5],[c+Math.cos(a)*r*.7,c+Math.sin(a)*r*.7,z+3.5],[c+Math.cos(a)*r*.85,c+Math.sin(a)*r*.85,z-.5]];
      for(let i=0;i<3;i++)wa.push(capsule(pts[i],pts[i+1],.5))}
    return{footprint:[p.n,p.n],height:Math.ceil(z+8),parts:[{sdf:union(...st),mat:mat(p.c1,{step:.07})},{sdf:union(...wa),mat:mat(p.c2,{step:.05,emissive:true})}]}},stack:p=>p.rim};

// ---------- granja ----------
FURNI.cultivo={name:"Cultivo",cat:"granja",walk:true,params:[["w","Ancho (baldosas)",1,2,1,1],["d","Fondo (baldosas)",1,2,1,1],["fase","Fase (0 semilla – 3 fruto)",0,3,1,2],["rows","Surcos",2,5,1,3],["seed","Semilla",1,500,1,5]],
  selects:[["kind","Planta",[["trigo","Trigo"],["col","Col"],["tomate","Tomatera"]],"col"]],colors:[["c1","Tierra","#7a5230"],["c2","Planta","#5fae3a"],["c3","Fruto","#e0353a"]],
  build(p){const r=rng((p.seed|0)||1),W=p.w*T,D=p.d*T,pl=[],fr=[],f=p.fase;
    for(let i=0;i<p.rows;i++){const y=(i+.5)*D/p.rows;for(let x=4;x<=W-4;x+=4.5){const jx=x+(r()-.5),jy=y+(r()-.5);if(f===0)continue;
      if(f===1){pl.push(rcone([jx,jy,1.8],[jx+.5,jy,4],.8,.4));continue}
      if(p.kind==="trigo"){const hh=f===3?11:7;for(let b=0;b<3;b++){const t=[jx+(r()-.5)*2,jy+(r()-.5)*2,hh+r()*2];pl.push(rcone([jx,jy,1.8],t,.6,.35));if(f===3)fr.push(ellipsoid(t[0],t[1],t[2],.8,.8,1.8))}}
      else if(p.kind==="col"){const s=f===3?3.2:2.2;pl.push(sphere(jx,jy,1.8+s*.8,s));if(f===3)pl.push(sphere(jx+.8,jy-.6,1.8+s*1.2,s*.6))}
      else{const hh=f===3?10:7;pl.push(rcone([jx,jy,1.8],[jx,jy,hh],.6,.4),ellipsoid(jx,jy,hh*.75,2.2,2.2,2.6));if(f===3)for(let k=0;k<3;k++)fr.push(sphere(jx+(r()-.5)*3,jy+(r()-.5)*3,hh*.5+r()*3,.9))}}}
    const parts=[{sdf:box(1,1,0,W-1,D-1,2.2,.4),mat:mat(p.c1,{step:.06,pattern:(x,y)=>Math.sin(y/D*p.rows*Math.PI*2-Math.PI/2)>.2?0:-1})}];
    if(pl.length)parts.push({sdf:bounded(union(...pl),0,0,0,W,D,16),mat:mat(p.c2,{shift:.09,pattern:leafPat})});
    if(fr.length)parts.push({sdf:bounded(union(...fr),0,0,0,W,D,16),mat:mat(p.kind==="trigo"?"#e0b84a":p.c3,{step:.07})});
    return{footprint:[p.w,p.d],height:16,parts}},stack:()=>2.2};
FURNI.pajar={name:"Pajar",cat:"granja",params:[["size","Tamaño",.6,1.6,.05,1]],selects:[["shape","Forma",[["redondo","Rollo"],["fardo","Fardo"],["domo","Montón"]],"redondo"]],
  colors:[["c1","Paja","#e0b84a"],["c2","Cuerda","#8a5a35"]],
  build(p){const s=p.size,hay=mat(p.c1,{step:.07,pattern:(x,y,z)=>noise3(x*.9,y*.2,z*.9,4)>.65?-1:0}),tw=mat(p.c2,{step:.05});let sdf,pick=null,h;
    if(p.shape==="redondo"){const R=8*s;sdf=groundCut(capCyl([16-7*s,16,R],[16+7*s,16,R],R));h=R*2;pick=(x,y,z,nx)=>Math.abs(nx)>.8?mat(p.c1,{step:.07,pattern:(X,Y,Z)=>(H2(Y-16,Z-R)%2)<.6?-1:0}):null}
    else if(p.shape==="fardo"){h=9*s;sdf=box(16-9*s,16-5.5*s,0,16+9*s,16+5.5*s,h,.8);pick=(x)=>Math.abs(Math.abs(x-16)-4*s)<.8?tw:null}
    else{h=14*s;sdf=groundCut(roughen(ellipsoid(16,16,0,12*s,12*s,h),1.2,.6))}
    if(pick){const pk=pick;const cache=p.shape==="redondo"?pk(0,0,0,1):null;pick=p.shape==="redondo"?(x,y,z,nx)=>Math.abs(nx)>.8?cache:null:pk}
    return{footprint:[1,1],height:Math.ceil(h+4),parts:[{sdf,mat:hay,pick}]}},stack:p=>p.shape==="redondo"?16*p.size:p.shape==="fardo"?9*p.size:14*p.size};

// Interior también declara su categoría
for(const k of["mesa","silla","sofa","lampara","planta","estante","cama","alfombra"])FURNI[k].cat="interior";
FURNI.alfombra.walk=true;
