
// =====================================================================
// BLOQUES — pieles de material, bloque/semibloque, rampas y construcciones
// =====================================================================
const BLOCKMATS={cesped:["Césped","#5fae3a","#8b5e34"],tierra:["Tierra","#8b5e34","#6b4a2f"],piedra:["Piedra","#8a8f96","#6f747a"],
  ladrillo:["Ladrillo","#b5523b","#d9cfc0"],madera:["Madera","#a0652f","#6b4a2f"],arena:["Arena","#e6cf8f","#c9a86a"],
  nieve:["Nieve","#eef3f8","#8b5e34"],adoquin:["Adoquín","#9a9590","#5f5a55"],tejas:["Tejas","#a33b2f","#7a2b22"]};
const MATOPTS=Object.entries(BLOCKMATS).map(([k,v])=>[k,v[0]]);
const WALLOPTS=MATOPTS.filter(([k])=>["piedra","ladrillo","madera","arena","adoquin"].includes(k));
const setMat=(p,m)=>{p.m=m;p.c1=BLOCKMATS[m][1];p.c2=BLOCKMATS[m][2]};
const md=(a,m)=>((a%m)+m)%m;
/** Coordenadas de superficie: arriba usa (x,y); en paredes (horizontal, z). Torres redondas pasan su centro. */
const faceUV=(x,y,z,nx,ny,nz,rc)=>nz>.6?[x,y,1]:rc?[Math.atan2(y-rc[1],x-rc[0])*rc[2],z,0]:Math.abs(nx)>Math.abs(ny)?[y,z,0]:[x,z,0];
/** Piel de material: devuelve {mat, pick} para una parte. topZ(x,y) = altura superior local (césped/nieve). */
function skin(kind,c1,c2,topZ,rc){const A=mat(c1,{step:.07}),B=mat(c2,{step:.07});
  switch(kind){
    case"cesped":case"nieve":{const top=kind==="nieve"?mat(c1,{step:.04,shift:.03}):mat(c1,{shift:.09,pattern:leafPat}),
      dirt=mat(c2,{step:.07,pattern:(x,y,z)=>noise3(x*.5,y*.5,z*.5,3)>.7?-1:0});
      return{mat:dirt,pick:(x,y,z,nx,ny,nz)=>nz>.45||z>topZ(x,y)-2.4+(noise3(x*.45,y*.45,0,4)-.5)*2?top:null}}
    case"tierra":case"arena":return{mat:mat(c1,{step:.06,pattern:(x,y,z)=>{const n=noise3(x*.7,y*.7,z*.7,kind==="arena"?8:3);return n>.72?1:n<.28?-1:0}})};
    case"piedra":return{mat:A,pick:(x,y,z,nx,ny,nz)=>{const[u,v]=faceUV(x,y,z,nx,ny,nz,rc),row=Math.floor(v/8);return md(v,8)<.6||md(u+(row%2)*4,8)<.6?B:null}};
    case"ladrillo":return{mat:A,pick:(x,y,z,nx,ny,nz)=>{const[u,v,top]=faceUV(x,y,z,nx,ny,nz,rc);if(top)return null;const row=Math.floor(v/4);return md(v,4)<.6||md(u+(row%2)*4,8)<.6?B:null}};
    case"madera":return{mat:mat(c1,{pattern:grain}),pick:(x,y,z,nx,ny,nz)=>{const[u,v,top]=faceUV(x,y,z,nx,ny,nz,rc);return top?(md(u,5)<.55?B:null):(md(v,4)<.5?B:null)}};
    case"adoquin":return{mat:A,pick:(x,y,z,nx,ny,nz)=>{const[u,v]=faceUV(x,y,z,nx,ny,nz,rc),j=hash3(Math.floor(u/4),Math.floor(v/4),1,9);return md(u,4)<.55+j*.45||md(v,4)<.55+(1-j)*.45?B:null}};
    case"tejas":return{mat:mat(c1,{step:.07,pattern:(x,y,z)=>md(z+((Math.floor(x/3)+Math.floor(y/3))%2)*1.5,3)<.8?-1:0})};
    default:return{mat:A}}}

FURNI.bloquem={name:"Bloque / semibloque",cat:"bloques",params:[["w","Ancho (baldosas)",1,2,1,1],["d","Fondo (baldosas)",1,2,1,1],["h","Altura (32 = bloque)",4,32,4,32],["bevel","Bisel",0,1.5,.25,.25]],
  selects:[["m","Material",MATOPTS,"cesped"]],colors:[["c1","Principal","#5fae3a"],["c2","Secundario","#8b5e34"]],
  onSelect(k,v,p){if(k==="m")setMat(p,v)},
  build(p){const W=p.w*T,D=p.d*T;return{footprint:[p.w,p.d],height:p.h+3,parts:[{sdf:box(0,0,0,W,D,p.h,Math.min(p.bevel,p.h/2-.1)),...skin(p.m,p.c1,p.c2,()=>p.h)}]}},
  stack:p=>p.h};
/** Rampa: superficie plana por triángulos entre las alturas de sus 4 esquinas (nunca escalonada). */
function rampSDF(W,D,hA,hB,hC,hD){const g1=H2((hB-hA)/W,(hC-hB)/D),g2=H2((hC-hD)/W,(hD-hA)/D),k1=1/Math.sqrt(1+g1*g1),k2=1/Math.sqrt(1+g2*g2);
  const top=(x,y)=>{const u=Math.min(1,Math.max(0,x/W)),v=Math.min(1,Math.max(0,y/D));return u>=v?hA+(hB-hA)*u+(hC-hB)*v:hA+(hC-hD)*u+(hD-hA)*v};
  return{top,sdf:(x,y,z)=>Math.max(-x,x-W,-y,y-D,-z,(z-top(x,y))*(x/W>=y/D?k1:k2))}}
FURNI.rampa={name:"Rampa / esquina",cat:"bloques",params:[["w","Ancho (baldosas)",1,2,1,1],["d","Fondo (baldosas)",1,2,1,1],["h0","Altura baja",0,28,4,0],["h1","Altura alta",4,32,4,16]],
  selects:[["shape","Forma",[["recta","Rampa recta"],["ext","Esquina exterior"],["int","Esquina interior"]],"recta"],["m","Material",MATOPTS,"cesped"]],
  colors:[["c1","Principal","#5fae3a"],["c2","Secundario","#8b5e34"]],onSelect(k,v,p){if(k==="m")setMat(p,v)},
  build(p){const W=p.w*T,D=p.d*T,hi=p.h1,lo=Math.min(p.h0,hi-1),c=p.shape==="ext"?[hi,lo,lo,lo]:p.shape==="int"?[hi,hi,lo,hi]:[hi,lo,lo,hi],R=rampSDF(W,D,...c);
    return{footprint:[p.w,p.d],height:hi+3,parts:[{sdf:R.sdf,...skin(p.m,p.c1,p.c2,R.top)}]}},stack:p=>p.h1};
FURNI.bloque.cat="bloques";

// ---------- construcciones hechas de bloques ----------
FURNI.torre={name:"Torre",cat:"construcciones",params:[["n","Base (baldosas)",1,2,1,1],["floors","Pisos",1,6,1,3],["fh","Altura por piso",10,32,1,18],["win","Ventanas por cara",0,3,1,1]],
  selects:[["shape","Planta",[["cuadrada","Cuadrada"],["redonda","Redonda"]],"cuadrada"],["roof","Remate",[["almenas","Almenas"],["cono","Tejado cónico"],["plano","Plano"]],"almenas"],["m","Material",WALLOPTS,"piedra"]],
  colors:[["c1","Muro","#8a8f96"],["c2","Juntas","#6f747a"],["c3","Tejado","#a33b2f"]],onSelect(k,v,p){if(k==="m")setMat(p,v)},
  build(p){const S=p.n*T,c=S/2,R=c-2,H=p.floors*p.fh,round=p.shape==="redonda",holes=[];
    for(let f=0;f<p.floors;f++){const z0=f*p.fh+p.fh*.38;for(let i=0;i<p.win;i++){const o=(i+1)/(p.win+1)*(S-8)+4;
      holes.push(box(S-4.5,o-1.1,z0,S+1,o+1.1,z0+5),box(o-1.1,S-4.5,z0,o+1.1,S+1,z0+5),box(-1,o-1.1,z0,4.5,o+1.1,z0+5),box(o-1.1,-1,z0,o+1.1,4.5,z0+5))}}
    const body=round?cylinder(c,c,R,0,H):box(2,2,0,S-2,S-2,H,.3),rc=round?[c,c,R]:null,wall=skin(p.m,p.c1,p.c2,()=>H,rc),parts=[];
    const pieces=[holes.length?sub(body,...holes):body];let top=H;
    if(p.roof==="almenas"){if(round){pieces.push(sub(cylinder(c,c,R+1,H-1,H+2.5),cylinder(c,c,R-1.6,H-2,H+3)));const n=Math.max(6,Math.round(2*Math.PI*R/5));
        for(let i=0;i<n;i+=1)if(i%2===0){const a=i/n*Math.PI*2,x=c+Math.cos(a)*(R-.2),y=c+Math.sin(a)*(R-.2);pieces.push(box(x-1.3,y-1.3,H+2,x+1.3,y+1.3,H+5))}}
      else{pieces.push(sub(box(1,1,H-1,S-1,S-1,H+2.5),box(3.6,3.6,H-2,S-3.6,S-3.6,H+3)));
        for(let u=1;u<S-2;u+=5){pieces.push(box(u,1,H+2,u+2.5,3.6,H+5),box(u,S-3.6,H+2,u+2.5,S-1,H+5),box(1,u,H+2,3.6,u+2.5,H+5),box(S-3.6,u,H+2,S-1,u+2.5,H+5))}}top=H+6}
    parts.push({sdf:union(...pieces),...wall});
    if(p.roof==="cono"){parts.push({sdf:cone(c,c,R+1.6,H,.4,H+S*.85),...skin("tejas",p.c3,p.c3)});top=H+S*.85+2}
    if(p.roof==="plano"){parts.push({sdf:round?cylinder(c,c,R+1,H,H+1.8):box(1,1,H,S-1,S-1,H+1.8,.3),...skin("tejas",p.c3,p.c3)});top=H+3}
    return{footprint:[p.n,p.n],height:Math.ceil(top+3),parts}},stack:p=>p.floors*p.fh};
FURNI.muralla={name:"Muralla",cat:"construcciones",params:[["n","Largo (baldosas)",1,3,1,2],["h","Altura",10,56,1,28],["t","Grosor",6,18,1,10]],
  toggles:[["merl","Almenas",true],["gate","Puerta en arco",false]],selects:[["m","Material",WALLOPTS,"piedra"]],
  colors:[["c1","Muro","#8a8f96"],["c2","Juntas","#6f747a"]],onSelect(k,v,p){if(k==="m")setMat(p,v)},
  build(p){const D=p.n*T,x0=16-p.t/2,x1=16+p.t/2;let wall=box(x0,.5,0,x1,D-.5,p.h,.3);
    if(p.gate){const gw=Math.min(10,D/2-3),gh=Math.min(p.h*.6,18);wall=sub(wall,union(box(x0-1,D/2-gw/2,-1,x1+1,D/2+gw/2,gh-gw/2),capCyl([x0-1,D/2,gh-gw/2],[x1+1,D/2,gh-gw/2],gw/2)))}
    const pieces=[wall];if(p.merl)for(let y=1;y<D-2;y+=5)pieces.push(box(x0,y,p.h-.5,x0+2.2,y+2.6,p.h+4),box(x1-2.2,y,p.h-.5,x1,y+2.6,p.h+4));
    return{footprint:[1,p.n],height:p.h+6,parts:[{sdf:union(...pieces),...skin(p.m,p.c1,p.c2,()=>p.h)}]}},stack:p=>p.h};
FURNI.casa={name:"Casa",cat:"construcciones",params:[["w","Ancho (baldosas)",1,2,1,1],["d","Fondo (baldosas)",1,2,1,2],["floors","Pisos",1,2,1,1],["fh","Altura por piso",12,26,1,18],["rh","Altura del tejado",4,26,1,14],["win","Ventanas por pared",0,3,1,1]],
  toggles:[["door","Puerta",true],["chim","Chimenea",true]],selects:[["roof","Tejado",[["dos","A dos aguas"],["cuatro","A cuatro aguas"],["plano","Plano"]],"dos"],["m","Muros",WALLOPTS,"madera"]],
  colors:[["c1","Muros","#a0652f"],["c2","Detalles","#6b4a2f"],["c3","Tejado","#a33b2f"],["c4","Puerta","#3a2a1f"]],onSelect(k,v,p){if(k==="m")setMat(p,v)},
  build(p){const W=p.w*T,D=p.d*T,H=p.floors*p.fh,x0=2,x1=W-2,y0=2,y1=D-2,cx=W/2,cy=D/2,holes=[],glass=[],door=[];
    for(let f=0;f<p.floors;f++){const z0=f*p.fh+p.fh*.38;
      for(let i=0;i<p.win;i++){const oy=y0+(i+1)/(p.win+1)*(y1-y0),ox=x0+(i+1)/(p.win+1)*(x1-x0);
        if(!(f===0&&p.door&&Math.abs(oy-cy)<6)){holes.push(box(x1-1.6,oy-2,z0,x1+1,oy+2,z0+4.6));glass.push(box(x1-1.4,oy-1.8,z0+.2,x1-1,oy+1.8,z0+4.4))}
        holes.push(box(ox-2,y1-1.6,z0,ox+2,y1+1,z0+4.6),box(x0-1,oy-2,z0,x0+1.6,oy+2,z0+4.6),box(ox-2,y0-1,z0,ox+2,y0+1.6,z0+4.6));glass.push(box(ox-1.8,y1-1.4,z0+.2,ox+1.8,y1-1,z0+4.4))}}
    if(p.door){holes.push(box(x1-1.6,cy-3,0,x1+1,cy+3,11.5));door.push(box(x1-1.4,cy-2.8,0,x1-1,cy+2.8,11.2))}
    const walls=[holes.length?sub(box(x0,y0,0,x1,y1,H,.3),...holes):box(x0,y0,0,x1,y1,H,.3)],roofP=[];let top=H;
    const alongY=D>=W,half=(alongY?W:D)/2,k=p.rh/(half+1),kn=Math.sqrt(1+k*k),dist=(x,y)=>alongY?Math.abs(x-cx):Math.abs(y-cy),len=(x,y)=>alongY?Math.abs(y-cy)-D/2:Math.abs(x-cx)-W/2;
    if(p.roof==="dos"){const prism=(x,y,z,o)=>(dist(x,y)*k+z-(H+p.rh+o))/kn;
      roofP.push((x,y,z)=>Math.max(prism(x,y,z,0),-prism(x,y,z,-2.2),len(x,y)-.8,H-1.2-z));
      walls.push((x,y,z)=>Math.max(prism(x,y,z,-2),len(x,y)+2,H-.5-z));top=H+p.rh}
    else if(p.roof==="cuatro"){const ex=Math.abs(D-W)/2;roofP.push((x,y,z)=>Math.max((z-(H+p.rh-k*Math.max(alongY?Math.abs(x-cx):Math.abs(x-cx)-ex,alongY?Math.abs(y-cy)-ex:Math.abs(y-cy))))/kn,H-1.2-z,Math.abs(x-cx)-W/2-.8,Math.abs(y-cy)-D/2-.8));top=H+p.rh}
    else{roofP.push(box(x0-1,y0-1,H,x1+1,y1+1,H+1.8,.3));top=H+2}
    const parts=[{sdf:union(...walls),...skin(p.m,p.c1,p.c2,()=>H)},{sdf:union(...roofP),...skin("tejas",p.c3,p.c3)}];
    if(p.chim&&p.roof!=="plano")parts.push({sdf:box(cx+W*.12,cy-D*.22,H,cx+W*.12+3.6,cy-D*.22+3.6,H+p.rh+3),...skin("ladrillo",p.c2,"#d9cfc0")});
    if(door.length)parts.push({sdf:union(...door),mat:mat(p.c4,{pattern:grain})});
    if(glass.length)parts.push({sdf:union(...glass),mat:mat("#9fd3f0",{step:.06})});
    return{footprint:[p.w,p.d],height:Math.ceil(top+(p.chim?6:4)),parts}},stack:p=>p.roof==="plano"?p.floors*p.fh+1.8:p.floors*p.fh+p.rh};
