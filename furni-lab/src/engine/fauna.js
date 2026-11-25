
// =====================================================================
// FAUNA — criaturas paramétricas (cabeza hacia +x) con 2 fotogramas
// =====================================================================
const eyeAt=(x,y,z,r)=>sphere(x,y,z,r);
FURNI.mariposa={name:"Mariposa",cat:"fauna",walk:true,params:[["s","Tamaño",.6,2,.05,1.1],["frame","Fotograma (aleteo)",0,1,1,0]],toggles:[["spots","Manchas",true]],
  colors:[["c1","Alas","#ff9004"],["c2","Cuerpo","#2c2c2c"],["c3","Manchas","#ffffff"]],
  build(p){const s=p.s,z=6,up=p.frame===1,W=[];
    for(const sg of[1,-1]){if(!up){W.push(ellipsoid(16+.8*s,16+sg*3.1*s,z+.2,2.3*s,2.9*s,.4),ellipsoid(16-1.5*s,16+sg*2.5*s,z,1.7*s,2.1*s,.4))}
      else{W.push(ellipsoid(16+.8*s,16+sg*1.1*s,z+2.7*s,2.3*s,.45,2.9*s),ellipsoid(16-1.5*s,16+sg*.9*s,z+1.9*s,1.7*s,.45,2.1*s))}}
    const sp=mat(p.c3,{step:.05});
    return{footprint:[1,1],height:Math.ceil(z+6*s+2),parts:[{sdf:union(capsule([16-2.4*s,16,z],[16+2.4*s,16,z],.7*s),rcone([16+2.2*s,16,z+.3],[16+4*s,16-1.2*s,z+1.6*s],.25,.2),rcone([16+2.2*s,16,z+.3],[16+4*s,16+1.2*s,z+1.6*s],.25,.2)),mat:mat(p.c2,{step:.06})},
      {sdf:union(...W),mat:mat(p.c1,{step:.07}),pick:p.spots?(x,y,z2)=>noise3(x*.9,y*.9,z2*.9,4)>.74?sp:null:null}]}},stack:()=>0};
FURNI.murcielago={name:"Murciélago",cat:"fauna",params:[["s","Tamaño",.6,2,.05,1],["frame","Fotograma (aleteo)",0,1,1,0]],colors:[["c1","Cuerpo","#3a2f45"],["c2","Membrana","#5a4a6a"]],
  build(p){const s=p.s,z=8,dn=p.frame===1,W=[];
    for(const sg of[1,-1]){if(!dn)W.push(ellipsoid(16-.4*s,16+sg*3.8*s,z+.6,2.2*s,3.1*s,.45),ellipsoid(16-1*s,16+sg*6.6*s,z+1.4,1.6*s,2.3*s,.4));
      else W.push(ellipsoid(16-.4*s,16+sg*2.7*s,z-1.6*s,2.1*s,1.3*s,2.4*s))}
    return{footprint:[1,1],height:Math.ceil(z+5*s),slack:12,parts:[{sdf:union(ellipsoid(16,16,z,2.2*s,1.6*s,1.7*s),sphere(16+2.1*s,16,z+.7*s,1.25*s),cone(16+2.1*s,16+.8*s,.6*s,z+1.4*s,.1,z+2.9*s),cone(16+2.1*s,16-.8*s,.6*s,z+1.4*s,.1,z+2.9*s)),mat:mat(p.c1,{step:.06})},
      {sdf:union(...W),mat:mat(p.c2,{step:.06})}]}},stack:()=>0};
FURNI.conejo={name:"Conejo",cat:"fauna",params:[["s","Tamaño",.6,1.8,.05,1],["frame","Fotograma (salto)",0,1,1,0]],colors:[["c1","Pelaje","#a0784f"],["c2","Cola y vientre","#f2ede4"],["c3","Ojos","#1b1b1b"]],
  build(p){const s=p.s,hop=p.frame===1,body=hop?ellipsoid(16,16,4.6*s,4.8*s,2.7*s,2.9*s):ellipsoid(15.4,16,3.6*s,4*s,3.1*s,3.5*s),
      head=hop?sphere(16+4.6*s,16,6.6*s,2.1*s):sphere(16+3.2*s,16,6.6*s,2.2*s),hx=hop?16+3.6*s:16+2.8*s,
      ears=hop?[rcone([hx,16+.8*s,7.8*s],[hx-3.2*s,16+1.2*s,9.6*s],.75*s,.5*s),rcone([hx,16-.8*s,7.8*s],[hx-3.2*s,16-1.2*s,9.6*s],.75*s,.5*s)]
        :[rcone([hx,16+.8*s,8*s],[hx-.6*s,16+1.1*s,12.2*s],.75*s,.55*s),rcone([hx,16-.8*s,8*s],[hx-.6*s,16-1.1*s,12.2*s],.75*s,.55*s)];
    const ex=(hop?16+5.7*s:16+4.4*s);
    return{footprint:[1,1],height:Math.ceil(13*s+3),parts:[{sdf:groundCut(union(body,head,...ears)),mat:mat(p.c1,{step:.07})},
      {sdf:sphere(hop?16-4.6*s:16-3.9*s,16,hop?5.2*s:3.8*s,1.25*s),mat:mat(p.c2,{step:.05})},{sdf:union(eyeAt(ex,16+1.2*s,7.1*s,.55*s),eyeAt(ex,16-1.2*s,7.1*s,.55*s)),mat:mat(p.c3,{step:.04})}]}},stack:()=>0};
FURNI.topo={name:"Topo",cat:"fauna",params:[["s","Tamaño",.6,1.8,.05,1],["frame","Fotograma (asomado)",0,1,1,1]],colors:[["c1","Pelaje","#3f3a45"],["c2","Tierra","#7a5230"],["c3","Hocico","#ff93a8"]],
  build(p){const s=p.s,parts=[{sdf:groundCut(roughen(ellipsoid(16,16,0,5.2*s,5.2*s,2.8*s),.8,.8)),mat:mat(p.c2,{step:.07,pattern:(x,y,z)=>noise3(x*.8,y*.8,z,3)>.68?-1:0})}];
    if(p.frame===1){parts.push({sdf:ellipsoid(16+1.4*s,16,3.6*s,2.1*s,1.9*s,2.3*s),mat:mat(p.c1,{step:.06})},{sdf:union(sphere(16+3.4*s,16,3.6*s,.8*s),ellipsoid(16+2.6*s,16+1.6*s,2.4*s,.9*s,.5*s,.4*s),ellipsoid(16+2.6*s,16-1.6*s,2.4*s,.9*s,.5*s,.4*s)),mat:mat(p.c3,{step:.05})})}
    return{footprint:[1,1],height:Math.ceil(7*s+2),parts}},stack:()=>0};
FURNI.pez={name:"Pez",cat:"fauna",params:[["s","Tamaño",.6,2,.05,1],["frame","Fotograma (cola)",0,1,1,0]],colors:[["c1","Cuerpo","#ff7a2f"],["c2","Aletas","#ffd27a"]],
  build(p){const s=p.s,z=3.2*s,ty=(p.frame?1:-1)*1.3*s;
    return{footprint:[1,1],height:Math.ceil(z+4*s),parts:[{sdf:ellipsoid(16,16,z,4.6*s,1.6*s,2.1*s),mat:mat(p.c1,{step:.08,pattern:(x)=>Math.sin(x*1.6)>.8?-1:0})},
      {sdf:union(ellipsoid(16-5.3*s,16+ty,z,1.5*s,.45,2.2*s),ellipsoid(16-.4*s,16,z+2*s,1.9*s,.4,1.1*s)),mat:mat(p.c2,{step:.06})},{sdf:union(eyeAt(16+3*s,16+1.05*s,z+.6*s,.42*s),eyeAt(16+3*s,16-1.05*s,z+.6*s,.42*s)),mat:mat("#1b1b1b",{step:.04})}]}},stack:()=>0};
FURNI.ave={name:"Pájaro",cat:"fauna",params:[["s","Tamaño",.6,2,.05,1],["frame","Fotograma (aleteo)",0,1,1,0]],colors:[["c1","Cuerpo","#3a68c4"],["c2","Alas","#2a4f9a"],["c3","Pico","#ffb000"]],
  build(p){const s=p.s,z=6,dn=p.frame===1,W=[];
    for(const sg of[1,-1])W.push(dn?ellipsoid(16-.3*s,16+sg*3.4*s,z-.4,2.2*s,2.8*s,.45):ellipsoid(16-.3*s,16+sg*1.6*s,z+2.6*s,2*s,.5,2.7*s));
    return{footprint:[1,1],height:Math.ceil(z+6*s),slack:12,parts:[{sdf:union(ellipsoid(16,16,z,3*s,1.7*s,1.8*s),sphere(16+2.7*s,16,z+1.2*s,1.45*s),rcone([16-2.4*s,16,z+.2],[16-5*s,16,z+.9],1.1*s,.35)),mat:mat(p.c1,{step:.07})},
      {sdf:union(...W),mat:mat(p.c2,{step:.07})},{sdf:rcone([16+3.9*s,16,z+1.1*s],[16+5.5*s,16,z+.9*s],.55*s,.12),mat:mat(p.c3,{step:.05})},
      {sdf:union(eyeAt(16+3.3*s,16+1.1*s,z+1.6*s,.38*s),eyeAt(16+3.3*s,16-1.1*s,z+1.6*s,.38*s)),mat:mat("#111111",{step:.04})}]}},stack:()=>0};
FURNI.cocodrilo={name:"Cocodrilo",cat:"fauna",params:[["s","Tamaño",.6,1.4,.05,1],["frame","Fotograma (cola)",0,1,1,0]],toggles:[["sub","Nadando (medio sumergido)",false]],
  colors:[["c1","Piel","#4a6a35"],["c2","Escamas","#34502a"],["c3","Vientre","#b5b07a"]],
  build(p){const s=p.s,sw=(p.frame?1:-1)*2.2*s,dz=p.sub?-2.4*s:0,Z=(x,y,z)=>[x,y,z-dz];
    const body=union(ellipsoid(16,16,2.9*s,7*s,2.9*s,2.1*s),ellipsoid(16+8.6*s,16,2.5*s,4.3*s,1.6*s,1.25*s),ellipsoid(16+6*s,16,3.2*s,2*s,2.1*s,1.5*s),
      rcone([16-6*s,16,2.6*s],[16-10.5*s,16+sw*.5,2*s],2.1*s,1.3*s),rcone([16-10.5*s,16+sw*.5,2*s],[16-15*s,16+sw,1.6*s],1.3*s,.35),
      ...[[1,1],[1,-1],[-1,1],[-1,-1]].map(([a,b])=>ellipsoid(16+a*4.2*s,16+b*3.2*s,1*s,1.2*s,1.4*s,1*s)));
    const shifted=(x,y,z)=>body(...Z(x,y,z)),sc=mat(p.c2,{step:.06}),belly=mat(p.c3,{step:.05});
    return{footprint:[1,1],height:Math.ceil(7*s),slack:Math.ceil(10*s),parts:[{sdf:groundCut(shifted),mat:mat(p.c1,{step:.07}),
      pick:(x,y,z,nx,ny,nz)=>nz<-.2?belly:nz>.6&&(Math.floor(x/1.8)+Math.floor(y/1.8))%2===0?sc:null},
      {sdf:groundCut(union(eyeAt(16+6.4*s,16+1.1*s,4.5*s+dz,.65*s),eyeAt(16+6.4*s,16-1.1*s,4.5*s+dz,.65*s))),mat:mat("#e6d25a",{step:.04})}]}},stack:()=>0};
