// ============================ MOTOR =================================
const T=32, H2=Math.hypot;
const box=(x0,y0,z0,x1,y1,z1,r=0)=>{const cx=(x0+x1)/2,cy=(y0+y1)/2,cz=(z0+z1)/2,hx=(x1-x0)/2-r,hy=(y1-y0)/2-r,hz=(z1-z0)/2-r;
  return(x,y,z)=>{const qx=Math.abs(x-cx)-hx,qy=Math.abs(y-cy)-hy,qz=Math.abs(z-cz)-hz;return H2(Math.max(qx,0),Math.max(qy,0),Math.max(qz,0))+Math.min(Math.max(qx,qy,qz),0)-r}};
const cyl=(cx,cy,R,z0,z1,r=0)=>{const cz=(z0+z1)/2,hz=(z1-z0)/2-r,rr=R-r;return(x,y,z)=>{const dx=H2(x-cx,y-cy)-rr,dz=Math.abs(z-cz)-hz;return Math.min(Math.max(dx,dz),0)+H2(Math.max(dx,0),Math.max(dz,0))-r}};
const cone=(cx,cy,r0,z0,r1,z1)=>{const h=z1-z0,s=(r1-r0)/h,k=1/Math.sqrt(1+s*s);return(x,y,z)=>Math.max((H2(x-cx,y-cy)-(r0+s*Math.min(Math.max(z-z0,0),h)))*k,z0-z,z-z1)};
const ell=(cx,cy,cz,rx,ry,rz)=>{const m=Math.min(rx,ry,rz);return(x,y,z)=>(H2((x-cx)/rx,(y-cy)/ry,(z-cz)/rz)-1)*m};
const torus=(cx,cy,cz,R,r)=>(x,y,z)=>H2(H2(x-cx,y-cy)-R,z-cz)-r;
const caps=(a,b,r)=>{const bx=b[0]-a[0],by=b[1]-a[1],bz=b[2]-a[2],bb=bx*bx+by*by+bz*bz||1;return(x,y,z)=>{const px=x-a[0],py=y-a[1],pz=z-a[2],h=Math.min(Math.max((px*bx+py*by+pz*bz)/bb,0),1);return H2(px-bx*h,py-by*h,pz-bz*h)-r}};
const union=(...s)=>(x,y,z)=>{let d=1e9;for(const f of s){const e=f(x,y,z);if(e<d)d=e}return d};
const sub=(a,...b)=>(x,y,z)=>{let d=a(x,y,z);for(const f of b)d=Math.max(d,-f(x,y,z));return d};
const smooth=(k,...s)=>(x,y,z)=>{let d=s[0](x,y,z);for(let i=1;i<s.length;i++){const e=s[i](x,y,z),h=Math.max(k-Math.abs(d-e),0)/k;d=Math.min(d,e)-h*h*k*.25}return d};
const bounded=(f,x0,y0,z0,x1,y1,z1)=>{const b=box(x0-1,y0-1,z0-1,x1+1,y1+1,z1+1);return(x,y,z)=>{const d=b(x,y,z);return d>.5?d:f(x,y,z)}};
function hash3(x,y,z,s){let h=(x*374761393+y*668265263+z*2147483647+s*144665)|0;h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967295}
function noise3(x,y,z,s=1){const xi=Math.floor(x),yi=Math.floor(y),zi=Math.floor(z),fx=x-xi,fy=y-yi,fz=z-zi,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy),w=fz*fz*(3-2*fz),L=(a,b,t)=>a+(b-a)*t,c=(a,b,d)=>hash3(xi+a,yi+b,zi+d,s);
  return L(L(L(c(0,0,0),c(1,0,0),u),L(c(0,1,0),c(1,1,0),u),v),L(L(c(0,0,1),c(1,0,1),u),L(c(0,1,1),c(1,1,1),u),v),w)}
function rgb2hsl(r,g,b){r/=255;g/=255;b/=255;const M=Math.max(r,g,b),m=Math.min(r,g,b),l=(M+m)/2;if(M===m)return[0,0,l];const d=M-m,s=l>.5?d/(2-M-m):d/(M+m);let h=M===r?(g-b)/d+(g<b?6:0):M===g?(b-r)/d+2:(r-g)/d+4;return[h*60,s,l]}
function hsl2rgb(h,s,l){h=((h%360)+360)%360;const c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((h/60)%2-1)),m=l-c/2;const[r,g,b]=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];return[Math.round((r+m)*255),Math.round((g+m)*255),Math.round((b+m)*255)]}
const toward=(h,t,a)=>h+(((t-h+540)%360)-180)*a, c01=v=>Math.min(1,Math.max(0,v));
let G={}; // ajustes globales de render
function mat(hex,o={}){const n=parseInt(hex.slice(1),16),[h,s,l]=rgb2hsl(n>>16&255,n>>8&255,n&255),st=o.step??G.step,sh=o.shift??G.shift,ramp=[];
  for(let i=0;i<6;i++){const k=i-3;ramp.push(hsl2rgb(k<0?toward(h,255,-k*sh):toward(h,55,k*sh*.8),c01(s+(k<0?-k*.04:-k*.05)),c01(l+k*st+(k===2?st*.4:0))))}
  const outline=G.outline==="black"?[22,18,28]:hsl2rgb(toward(h,260,.35),c01(s*.7),Math.max(.07,l*.28));
  return{ramp,outline,emissive:o.emissive,pattern:G.tex?o.pattern:null}}
const grain=(x,y,z)=>Math.sin((y+z*.3)*.9+noise3(x*.08,y*.3,z*.3,3)*6)>.82?-1:0;
const speck=(x,y,z)=>{const n=noise3(x/2.6,y/2.6,z/2.6,11);return n>.68?1:n<.3?-1:0};

// Render INCREMENTAL: makeJob() prepara el trabajo; job.step(n,deadline) procesa
// hasta n píxeles (de abajo hacia arriba) y escribe una vista previa en job.img;
// job.finish() hace la pasada de bordes y devuelve el sprite recortado.
function makeJob(f,rot=0,S=G){
  const az=(S.light||0)*Math.PI/180,bx=.35,by=.75,Lx0=bx*Math.cos(az)-by*Math.sin(az),Ly0=bx*Math.sin(az)+by*Math.cos(az),ln=H2(Lx0,Ly0,1),L=[Lx0/ln,Ly0/ln,1/ln];
  const W0=f.footprint[0]*T,D0=f.footprint[1]*T,sw=rot%2===1,W=sw?D0:W0,D=sw?W0:D0;
  const toObj=rot===1?(x,y)=>[y,W-x]:rot===2?(x,y)=>[W0-x,D0-y]:rot===3?(x,y)=>[D-y,x]:(x,y)=>[x,y];
  const toObjN=rot===1?(x,y)=>[y,-x]:rot===2?(x,y)=>[-x,-y]:rot===3?(x,y)=>[-y,x]:(x,y)=>[x,y];
  const P=f.parts,np=P.length;
  const dist=(x,y,z)=>{const o=toObj(x,y);let d=1e9;for(let i=0;i<np;i++){const e=P[i].sdf(o[0],o[1],z);if(e<d)d=e}return d};
  const partAt=(x,y,z)=>{const o=toObj(x,y);let b=0,bd=1e9;for(let i=0;i<np;i++){const e=P[i].sdf(o[0],o[1],z);if(e<bd){bd=e;b=i}}return b};
  const Hh=f.height,sl=f.slack||10,ox=D+sl,oy=Hh+sl,w=W+D+sl*2,h=Math.ceil(Hh+(W+D)/2+sl*2),N=w*h;
  const pm=new Array(N),hit=new Int16Array(N).fill(-1),dep=new Float32Array(N),nr=new Float32Array(N*3),ps=new Float32Array(N*3),lev=new Int8Array(N),fl=new Uint8Array(N);
  const img=new ImageData(w,h),pv=img.data,dmin=new Float32Array(N).fill(1e9);
  // ---- hojas vectoriales: sellos rasterizados colocados sobre la copa (se componen en el G-buffer) ----
  const Pall=f.leaves?P.concat(f.leaves.mats.map(m=>({mat:m}))):P,isLeaf=new Uint8Array(N);
  const fromObj=rot===1?(a,b)=>[W-b,a]:rot===2?(a,b)=>[W0-a,D0-b]:rot===3?(a,b)=>[b,D-a]:(a,b)=>[a,b];
  const fromObjN=rot===1?(a,b)=>[-b,a]:rot===2?(a,b)=>[-a,-b]:rot===3?(a,b)=>[b,-a]:(a,b)=>[a,b];
  let LQ=null,lqi=0;
  if(f.leaves){const LF=f.leaves,Lo=toObjN(L[0],L[1]),env=LF.env||[];LQ=[];
    for(const q of LF.items){const[wx,wy]=fromObj(q.x,q.y),[nx,ny]=fromObjN(q.nx,q.ny),[ddx,ddy]=fromObjN(q.dx,q.dy);
      const ci=Math.round(wx-wy+ox),cj=Math.round((wx+wy)/2-q.z+oy),sdx=ddx-ddy,sdy=(ddx+ddy)/2-q.dz,pl=H2(sdx,sdy);
      const st=leafStamp(q.sh||LF.shape,q.len*Math.min(1,.3+pl*.7),q.wid,Math.atan2(sdy,sdx));
      const s=nx*L[0]+ny*L[1]+q.nz*L[2];let lv=(s>.74?4:s>.5?3:s>.2?2:1)+(q.dl||0);
      // sombra propia: ¿otra masa de la copa tapa la luz?
      if(s>.2)for(let ei=0;ei<env.length;ei++){if(ei===q.e)continue;const c=env[ei],
          ox_=(q.x+q.nx*.5-c[0])/c[3],oy_=(q.y+q.ny*.5-c[1])/c[4],oz_=(q.z+q.nz*.5-c[2])/c[5],dx_=Lo[0]/c[3],dy_=Lo[1]/c[4],dz_=L[2]/c[5];
        const A=dx_*dx_+dy_*dy_+dz_*dz_,B=ox_*dx_+oy_*dy_+oz_*dz_,C=ox_*ox_+oy_*oy_+oz_*oz_-.72,disc=B*B-A*C;if(disc>0&&(-B+Math.sqrt(disc))/A>0){lv--;break}}
      LQ.push({i0:ci+st.x0,j0:cj+st.y0,st,dep:wx+wy+q.z,lv:Math.max(0,Math.min(4,lv)),m:np+q.m,n:[nx,ny,q.nz]})}
    LQ.sort((a,b)=>b.j0-a.j0)}
  function stampLeaf(q){const st=q.st,m=Pall[q.m].mat;
    for(let y=0;y<st.w;y++){const j=q.j0+y;if(j<0||j>=h)continue;
      for(let x=0;x<st.w;x++){const v=st.d[y*st.w+x];if(!v)continue;const i=q.i0+x;if(i<0||i>=w)continue;const k=j*w+i;
        if(hit[k]>=0&&dep[k]>=q.dep)continue;
        const lv=Math.max(0,Math.min(5,q.lv+(v===2?1:v===3||v===4?-1:0)));
        const sx=i+.5-ox,sy=j+.5-oy,ss=(sy+q.dep)/1.5;
        hit[k]=q.m;pm[k]=m;dep[k]=q.dep;lev[k]=lv;isLeaf[k]=1;dmin[k]=0;nr[k*3]=q.n[0];nr[k*3+1]=q.n[1];nr[k*3+2]=q.n[2];
        ps[k*3]=(ss+sx)/2;ps[k*3+1]=(ss-sx)/2;ps[k*3+2]=q.dep-ss;
        const c=m.ramp[lv];pv[k*4]=c[0];pv[k*4+1]=c[1];pv[k*4+2]=c[2];pv[k*4+3]=255}}}
  const toLight=(x,y,z)=>{let t=.6;for(let i=0;i<160&&t<140;i++){const d=dist(x+L[0]*t,y+L[1]*t,z+L[2]*t);if(d<.02)return true;t+=Math.max(d*.9,.05)}return false};
  const E=.12;
  function pixel(i,j){
    const sx=i+.5-ox,sy=j+.5-oy,x0=sy+sx/2,y0=sy-sx/2,k=j*w+i;
    const tHi=Math.min(Hh+2,W+sl-x0,D+sl-y0),tLo=Math.max(-.5,-sl-x0,-sl-y0);
    // Salto conservador: si los rayos vecinos (izquierda y abajo, ya calculados) pasaron a más de
    // 2.4 unidades de toda superficie, este rayo (a ≤1.3 unidades de ellos) también falla.
    const dl=i>0?dmin[k-1]:1e9,db=j<h-1?dmin[k+w]:1e9;if(i>0&&j<h-1&&dl>2.4&&db>2.4){dmin[k]=Math.min(dl,db)-1.3;return}
    let t=tHi,ok=false,md=1e9;
    while(t>=tLo){const d=dist(x0+t,y0+t,t);if(d<md)md=d;if(d<.01){ok=true;break}t-=Math.max(d*.55,.03)}
    dmin[k]=ok?0:md;if(!ok)return;
    const px=x0+t,py=y0+t,pz=t;
    let nx=dist(px+E,py,pz)-dist(px-E,py,pz),ny=dist(px,py+E,pz)-dist(px,py-E,pz),nz=dist(px,py,pz+E)-dist(px,py,pz-E);const nl=H2(nx,ny,nz)||1;nx/=nl;ny/=nl;nz/=nl;
    const p=partAt(px,py,pz);let m=P[p].mat;if(P[p].pick){const o=toObj(px,py),on=toObjN(nx,ny),mm=P[p].pick(o[0],o[1],pz,on[0],on[1],nz);if(mm)m=mm}pm[k]=m;hit[k]=p;dep[k]=px+py+pz;nr[k*3]=nx;nr[k*3+1]=ny;nr[k*3+2]=nz;ps[k*3]=px;ps[k*3+1]=py;ps[k*3+2]=pz;
    const s=nx*L[0]+ny*L[1]+nz*L[2];let lv=s>.74?4:s>.5?3:s>.2?2:1;
    if(S.self&&s>.2&&toLight(px+nx*.5,py+ny*.5,pz+nz*.5))lv=Math.max(1,lv-2);
    if(m.pattern){const o=toObj(px,py);lv=Math.max(1,Math.min(4,lv+Math.round(m.pattern(o[0],o[1],pz))))}
    if(m.emissive)lv=Math.min(5,lv+1);lev[k]=lv;
    const c=m.ramp[lv];pv[k*4]=c[0];pv[k*4+1]=c[1];pv[k*4+2]=c[2];pv[k*4+3]=255}
  const job={w,h,ox,oy,W,D,img,row:h-1,col:0,done:false,total:N,count:0,
    step(n=Infinity,deadline=Infinity){let c=0;
      while(job.row>=0&&c<n){pixel(job.col,job.row);c++;job.count++;if(++job.col>=w){job.col=0;job.row--}
        if((c&31)===0&&performance.now()>deadline)break}
      if(LQ){while(lqi<LQ.length&&(job.row<0||LQ[lqi].j0>job.row))stampLeaf(LQ[lqi++])}
      if(job.row<0)job.done=true;return c},
    finish(){
  if(S.floor){const lz=Math.max(.15,L[2]);
    for(let k=0;k<N;k++){if(hit[k]<0)continue;const pz=ps[k*3+2];
      for(let f=0;f<=1;f++){const zz=pz*(f?1:.5),qx=ps[k*3]-L[0]*(zz/lz),qy=ps[k*3+1]-L[1]*(zz/lz),i=Math.floor(qx-qy+ox),j=Math.floor((qx+qy)/2+oy);
        if(i>=0&&j>=0&&i<w-1&&j<h-1){const q=j*w+i;if(hit[q]<0)fl[q]=1;if(hit[q+1]<0)fl[q+1]=1;if(hit[q+w]<0)fl[q+w]=1}}}
    // cerrar huecos de 1 píxel en la sombra
    for(let j=1;j<h-1;j++)for(let i=1;i<w-1;i++){const q=j*w+i;if(fl[q]||hit[q]>=0)continue;let c=0;if(fl[q-1])c++;if(fl[q+1])c++;if(fl[q-w])c++;if(fl[q+w])c++;if(c>=3)fl[q]=2}}
  const JUMP=4,oo=new Int16Array(N).fill(-1),od=new Float32Array(N).fill(-1e9),cr=new Int8Array(N).fill(-1),NB=[[1,0],[-1,0],[0,1],[0,-1]];
  for(let j=0;j<h;j++)for(let i=0;i<w;i++){const p=j*w+i;if(hit[p]<0)continue;
    for(const[dx,dy]of NB){const qi=i+dx,qj=j+dy;if(qi<0||qj<0||qi>=w||qj>=h)continue;const q=qj*w+qi;
      if(hit[q]<0||dep[p]-dep[q]>JUMP){if(dep[p]>od[q]){od[q]=dep[p];oo[q]=hit[p]}continue}
      if(Math.abs(dep[p]-dep[q])>JUMP||(isLeaf[p]&&isLeaf[q]))continue;
      const dn=nr[p*3]*nr[q*3]+nr[p*3+1]*nr[q*3+1]+nr[p*3+2]*nr[q*3+2],seam=hit[p]!==hit[q]&&Pall[hit[p]].mat!==Pall[hit[q]].mat;
      if(dn>.7&&!seam)continue;if(lev[p]>lev[q]||(lev[p]===lev[q]&&dep[p]>dep[q]))continue;
      const cv=(nr[p*3]-nr[q*3])*(ps[p*3]-ps[q*3])+(nr[p*3+1]-nr[q*3+1])*(ps[p*3+1]-ps[q*3+1])+(nr[p*3+2]-nr[q*3+2])*(ps[p*3+2]-ps[q*3+2]);
      const lv=seam?1:cv>0?Math.min(5,Math.max(lev[p],lev[q])+1):Math.max(0,Math.min(lev[p],lev[q])-1);if(lv>cr[p])cr[p]=lv}}
  const px=new Uint8ClampedArray(N*4),mk8=new Uint8Array(N),IA=Math.round(Math.min(1,Math.max(0,S.alpha??1))*255),put=(k,c,a=255)=>{px[k*4]=c[0];px[k*4+1]=c[1];px[k*4+2]=c[2];px[k*4+3]=a};
  // máscara: 1 = contorno, 2 = interior (0 = vacío o sombra)
  for(let k=0;k<N;k++){if(oo[k]>=0&&S.outline!=="none"){put(k,Pall[oo[k]].mat.outline);mk8[k]=1;continue}
    if(hit[k]>=0){const m=pm[k];put(k,m.ramp[cr[k]>=0?cr[k]:lev[k]],IA);mk8[k]=2;continue}if(fl[k])put(k,[0,0,0],70)}
  let a=w,b=h,c=-1,d=-1;for(let j=0;j<h;j++)for(let i=0;i<w;i++)if(px[(j*w+i)*4+3]){a=Math.min(a,i);c=Math.max(c,i);b=Math.min(b,j);d=Math.max(d,j)}
  if(c<0){a=b=0;c=d=1}a--;b--;c++;d++;const cw=c-a+1,ch=d-b+1,out=new Uint8ClampedArray(cw*ch*4),mask=new Uint8Array(cw*ch);
  for(let j=0;j<ch;j++)for(let i=0;i<cw;i++){const si=j+b,sj=i+a;if(si<0||sj<0||si>=h||sj>=w)continue;out.set(px.subarray((si*w+sj)*4,(si*w+sj)*4+4),(j*cw+i)*4);mask[j*cw+i]=mk8[si*w+sj]}
  return{width:cw,height:ch,rgba:out,mask,originX:Math.round(ox-a),originY:Math.round(oy-b),W,D}},
    scan(){return{x:ox-D,y:job.row,w:W+D}}};
  return job}
function render(f,rot=0,S=G){const j=makeJob(f,rot,S);j.step();return j.finish()}

// ========================= GENERADORES ==============================
const rng=s=>()=>((s=(s*16807)%2147483647)/2147483647);
const FURNI={
mesa:{name:"Mesa",params:[["w","Ancho (baldosas)",1,3,1,1],["d","Fondo (baldosas)",1,2,1,1],["h","Altura",10,40,1,24],["top","Grosor de la tapa",1,6,1,3],["leg","Grosor de pata",1,6,1,3],["inset","Entrada de las patas",0,10,1,3],["round","Redondeo de la tapa",0,3,.5,0]],
 selects:[["style","Patas",[["square","Cuadradas"],["round","Redondas"],["pedestal","Pedestal central"]],"square"]],
 colors:[["c1","Tapa","#b0703c"],["c2","Patas","#7a4a2a"]],
 build(p){const W=p.w*T,D=p.d*T,top=mat(p.c1,{pattern:grain}),lm=mat(p.c2,{pattern:grain}),lz=p.h-p.top;let legs;
  if(p.style==="pedestal")legs=union(cyl(W/2,D/2,p.leg*.9+1,0,lz),cyl(W/2,D/2,Math.min(W,D)/3.2,0,2.5,.8));
  else{const pts=[[p.inset,p.inset],[W-p.inset-p.leg,p.inset],[p.inset,D-p.inset-p.leg],[W-p.inset-p.leg,D-p.inset-p.leg]];
   legs=union(...pts.map(([x,y])=>p.style==="round"?cyl(x+p.leg/2,y+p.leg/2,p.leg/2+.3,0,lz):box(x,y,0,x+p.leg,y+p.leg,lz)))}
  return{footprint:[p.w,p.d],height:p.h+2,parts:[{sdf:box(1,1,lz,W-1,D-1,p.h,p.round),mat:top},{sdf:legs,mat:lm}]}}},
silla:{name:"Silla",params:[["seat","Altura del asiento",6,22,1,13],["back","Altura del respaldo",6,36,1,27],["slats","Listones (0 = panel)",0,7,1,3],["leg","Grosor de pata",2,5,1,3],["cush","Grosor del cojín",0,7,1,4]],
 colors:[["c1","Madera","#b0703c"],["c2","Cojín","#c8383f"]],
 build(p){const w=mat(p.c1,{pattern:grain}),s=p.seat,L=p.leg,top=s+p.back,parts=[];
  const legs=[[6,6],[26-L,6],[6,26-L],[26-L,26-L]].map(([x,y])=>box(x,y,0,x+L,y+L,s));
  const posts=[[6,6],[6,26-L]].map(([x,y])=>box(x,y,s,x+L,y+L,top));
  let back;if(p.slats===0)back=box(6.3,6+L,s+4,6+L-.3,26-L,top-1);
  else back=union(...Array.from({length:p.slats},(_,i)=>{const z=s+5+i*((p.back-8)/Math.max(1,p.slats-1));return box(6.5,6+L,Math.min(z,top-3),6+L-.5,26-L,Math.min(z+3,top))}));
  parts.push({sdf:union(...legs,...posts,back,box(5,5,s,28,28,s+2.5)),mat:w});
  if(p.cush>0)parts.push({sdf:box(6+L+.5,7,s+2,27,26,s+2+p.cush,Math.min(1.8,p.cush/2)),mat:mat(p.c2)});
  return{footprint:[1,1],height:top+4,parts}}},
sofa:{name:"Sofá",params:[["n","Plazas (baldosas)",1,4,1,2],["back","Altura del respaldo",12,32,1,18],["arm","Altura de los brazos",0,16,1,10],["soft","Redondez",.5,4,.5,2],["cush","Grosor de cojín",2,8,1,5]],
 colors:[["c1","Tela","#2f9e9a"],["c2","Patas","#7a4a2a"]],
 build(p){const D=p.n*T,m=mat(p.c1),cd=(D-14)/p.n,r=p.soft,parts=[
  {sdf:box(4,2,3,29,D-2,11,Math.min(r,3.5)),mat:m},{sdf:box(3,2,9,10,D-2,9+p.back,Math.min(r+.2,3.4)),mat:m},
  {sdf:repeatU(i=>box(10,7.5+i*cd,10,28.5,7+(i+1)*cd,10+p.cush,Math.min(r,p.cush/2)),p.n),mat:m},
  {sdf:union(...[[6,4],[6,D-7],[25,4],[25,D-7]].map(([x,y])=>box(x,y,0,x+3,y+3,4))),mat:mat(p.c2,{pattern:grain})}];
  if(p.arm>0)parts.push({sdf:union(box(4,2,9,29,8,9+p.arm,Math.min(r+.4,2.9)),box(4,D-8,9,29,D-2,9+p.arm,Math.min(r+.4,2.9))),mat:m});
  return{footprint:[1,p.n],height:Math.max(9+p.back,9+p.arm)+4,parts}}},
lampara:{name:"Lámpara",params:[["h","Altura del poste",14,72,1,46],["rb","Radio inferior pantalla",5,14,.5,10],["rt","Radio superior pantalla",2,12,.5,5.5],["sh","Alto de pantalla",5,22,1,13],["base","Radio de la base",3,10,.5,6.5],["pole","Grosor del poste",.8,3,.2,1.2]],
 toggles:[["glow","Pantalla encendida",true]],
 colors:[["c1","Pantalla","#f3c64a"],["c2","Metal","#9aa3ad"]],
 build(p){const me=mat(p.c2,{step:.1,shift:.03}),z0=p.h-4;
  return{footprint:[1,1],height:z0+p.sh+4,parts:[{sdf:cyl(16,16,p.base,0,2.5,.8),mat:me},{sdf:cyl(16,16,p.pole,2,p.h),mat:me},
  {sdf:sub(cone(16,16,p.rb,z0,p.rt,z0+p.sh),cyl(16,16,Math.max(1,p.rb-3),z0-1,z0+2)),mat:mat(p.c1,{emissive:p.glow})}]}}},
planta:{name:"Planta",params:[["seed","Semilla",1,500,1,7],["n","Hojas (masas)",3,30,1,14],["size","Tamaño del follaje",.6,1.6,.05,1],["stem","Altura del tallo",0,24,1,11],["potH","Alto de maceta",8,22,1,15],["potR","Radio de maceta",6,13,.5,10],["sway","Viento",-4,4,.25,0]],
 colors:[["c1","Hojas","#3f9e3a"],["c2","Maceta","#c9643b"],["c3","Tallo","#7a4a2a"]],
 build(p){const r=rng(p.seed|0||1),R=p.potR,fz=p.potH+p.stem,blobs=[];
  for(let i=0;i<p.n;i++){const a=r()*Math.PI*2,rr=r()*7*p.size,z=fz+r()*14*p.size,s=(4+r()*3.5)*p.size;blobs.push(ell(16+Math.cos(a)*rr,16+Math.sin(a)*rr,z,s,s,s*.8))}
  const leaves=smooth(2.5,...blobs),sw=p.sway,lf=sw?(x,y,z)=>{const k=Math.max(0,z-fz+4)/18;return leaves(x-sw*k,y+sw*k*.5,z)}:leaves;
  return{footprint:[1,1],height:fz+24*p.size+4,parts:[
   {sdf:sub(union(cone(16,16,R*.75,0,R,p.potH),torus(16,16,p.potH,R,1.4)),cone(16,16,R*.6,3,R-1.2,p.potH+5)),mat:mat(p.c2)},
   {sdf:cone(16,16,R*.62,2,R-1.6,p.potH-2.5),mat:mat("#5a3b28",{step:.06})},
   {sdf:caps([16,16,p.potH-4],[16,16,fz+4],1.3),mat:mat(p.c3,{pattern:grain})},
   {sdf:lf,mat:mat(p.c1,{shift:.09,pattern:speck})}]}}},
estante:{name:"Estante",params:[["n","Ancho (baldosas)",1,2,1,1],["h","Altura",24,84,1,52],["shelves","Repisas",1,6,1,3],["depth","Profundidad",8,26,1,14],["fill","Libros",0,1,.05,.8],["seed","Semilla de libros",1,500,1,4]],
 colors:[["c1","Madera","#9a5f33"],["c2","Libros A","#c23b3b"],["c3","Libros B","#3a68c4"],["c4","Libros C","#e0b13c"]],
 build(p){const D=p.n*T,X=2+p.depth,wd=mat(p.c1,{pattern:grain}),r=rng(p.seed|0||1),gap=(p.h-2)/p.shelves;
  const frame=[box(2,1,0,4,D-1,p.h),box(2,1,0,X,3,p.h),box(2,D-3,0,X,D-1,p.h),box(2,1,p.h-2,X,D-1,p.h)];
  const groups=[[],[],[]];
  for(let i=0;i<p.shelves;i++){const z=i*gap;frame.push(box(4,3,z,X,D-3,z+2));let y=3.4;
   while(y<D-4){const bw=1.6+r()*2.6,bh=Math.min(gap-3,(gap-2)*(.55+r()*.4)),g=Math.floor(r()*3),y1=Math.min(D-3.4,y+bw);
    if(r()<p.fill&&y1-y>1.2)groups[g].push(box(5,y,z+2,X-1-r()*2,y1,z+2+bh));y=y1+(r()<.15?2:0)}}
  const parts=[{sdf:union(...frame),mat:wd}];
  groups.forEach((g,i)=>{if(g.length)parts.push({sdf:bounded(union(...g),4,3,0,X,D-3,p.h),mat:mat([p.c2,p.c3,p.c4][i])})});
  return{footprint:[1,p.n],height:p.h+2,parts}}}};
function repeatU(make,n){return union(...Array.from({length:n},(_,i)=>make(i)))}
const pmod=(a,p)=>((a%p)+p)%p;
/** Extrusión vertical de una distancia 2D (alfombras, tapetes, placas). */
const extrude=(d2,z0,z1)=>(x,y,z)=>{const a=d2(x,y),b=Math.abs(z-(z0+z1)/2)-(z1-z0)/2;return Math.min(Math.max(a,b),0)+H2(Math.max(a,0),Math.max(b,0))};
FURNI.cama={name:"Cama",params:[["n","Ancho (baldosas)",1,2,1,1],["len","Largo",40,62,1,60],["mh","Altura del colchón",6,16,1,11],["head","Altura de cabecera",4,36,1,20],["foot","Altura del piecero",0,18,1,6],["pil","Almohadas",0,2,1,1],["cover","Manta (cobertura)",0,1,.05,.6],["soft","Redondez",.5,3,.5,1.5]],
 colors:[["c1","Madera","#9a5f33"],["c2","Sábana","#f2f2f2"],["c3","Manta","#3a68c4"],["c4","Almohada","#ffffff"]],
 build(p){const D=p.n*T,X1=Math.min(62,2+p.len),mh=p.mh,wd=mat(p.c1,{pattern:grain}),r=Math.min(p.soft,2.5),parts=[];
  const legs=[[2,2],[X1-3,2],[2,D-5],[X1-3,D-5]].map(([x,y])=>box(x,y,0,x+3,y+3,3));
  const frame=[box(2,1.5,2.5,X1,D-1.5,Math.max(4,mh-4),.8),...legs,box(1,1,0,4.5,D-1,mh+p.head,Math.min(r,1.5))];
  if(p.foot>0)frame.push(box(X1-3,1,0,X1+.5,D-1,mh-3+p.foot,Math.min(r,1.2)));
  parts.push({sdf:union(...frame),mat:wd});
  parts.push({sdf:box(4.5,2.5,mh-5,X1-.6,D-2.5,mh,r),mat:mat(p.c2,{step:.06})});
  if(p.pil>0){const pw=(D-7)/p.pil;parts.push({sdf:union(...Array.from({length:p.pil},(_,k)=>box(5.5,3.5+k*pw+.5,mh-1,14,3.5+(k+1)*pw-.5,mh+3.5,1.7))),mat:mat(p.c4,{step:.06})})}
  if(p.cover>0){const bx=X1-.6-p.cover*(X1-.6-16);parts.push({sdf:box(bx,2,mh-4.5,X1+.2,D-2,mh+1.2,Math.min(r+.3,2)),mat:mat(p.c3)})}
  return{footprint:[2,p.n],height:mh+p.head+4,parts}}};
FURNI.alfombra={name:"Alfombra",params:[["w","Ancho (baldosas)",1,3,1,2],["d","Fondo (baldosas)",1,3,1,2],["th","Grosor",1,3,.5,1.5],["inset","Margen",0,10,1,2],["bw","Ancho del borde",0,8,1,3],["scale","Escala del patrón",4,16,1,8]],
 selects:[["shape","Forma",[["rect","Rectangular"],["oval","Ovalada"]],"rect"],["pattern","Patrón",[["none","Liso"],["stripes","Rayas"],["diamonds","Rombos"],["dots","Puntos"],["grid","Cuadrícula"]],"diamonds"]],
 colors:[["c1","Base","#c8383f"],["c2","Borde","#f3c64a"],["c3","Patrón","#2b2f6b"]],
 build(p){const W=p.w*T,D=p.d*T,m=p.inset,th=p.th,cx=W/2,cy=D/2,rx=W/2-m,ry=D/2-m,q=p.scale;
  const d2=p.shape==="oval"?(x,y)=>(H2((x-cx)/rx,(y-cy)/ry)-1)*Math.min(rx,ry)
    :(x,y)=>{const ax=Math.abs(x-cx)-(rx-2),ay=Math.abs(y-cy)-(ry-2);return H2(Math.max(ax,0),Math.max(ay,0))+Math.min(Math.max(ax,ay),0)-2};
  const PAT={stripes:(x,y)=>Math.abs(pmod(x,q)-q/2)-q/4,diamonds:(x,y)=>(Math.abs(pmod(x,q)-q/2)+Math.abs(pmod(y,q)-q/2)-q*.3)*.7,
    dots:(x,y)=>H2(pmod(x,q)-q/2,pmod(y,q)-q/2)-q*.24,grid:(x,y)=>Math.min(Math.abs(pmod(x,q)-q/2),Math.abs(pmod(y,q)-q/2))-q*.12};
  const parts=[{sdf:extrude(d2,0,th),mat:mat(p.c1,{step:.07})}];
  if(p.bw>0)parts.push({sdf:extrude((x,y)=>{const a=d2(x,y);return Math.max(a,-a-p.bw)},0,th+.5),mat:mat(p.c2,{step:.07})});
  const pf=PAT[p.pattern];if(pf)parts.push({sdf:extrude((x,y)=>Math.max(pf(x,y),d2(x,y)+p.bw+1.5),0,th+.5),mat:mat(p.c3,{step:.07})});
  return{footprint:[p.w,p.d],height:th+3,parts}}};


// Altura de apilado (z de la superficie donde se puede colocar otro furni encima).
FURNI.mesa.stack=p=>p.h;
FURNI.silla.stack=p=>p.seat+2+(p.cush>0?p.cush:.5);
FURNI.sofa.stack=p=>10+p.cush;
FURNI.lampara.stack=p=>p.h-4+p.sh;
FURNI.planta.stack=p=>p.potH;
FURNI.estante.stack=p=>p.h;
FURNI.cama.stack=p=>p.mh+(p.cover>0?1.2:0);
FURNI.alfombra.stack=p=>p.th+(p.bw>0||p.pattern!=="none"?.5:0);
