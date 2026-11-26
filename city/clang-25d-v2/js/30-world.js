/* ========================================================================
 * CLANG! 2.5D — 30 场景：天空主题 / 远中近景 / 竞技场 / 天气
 * 玩法约束在 z=0 平面，透视相机让 z 深度自然产生视差
 * ====================================================================== */
(function(){
'use strict';
const T=THREE,CL=window.CL,{box,cyl,cone,torus,disc,plate,canvasTex,clamp,lerp,damp,rnd,rndi,pick,M,C,hazardTex}=CL;
const {reg}=CL.ink;
const R=CL.render,scene=R.scene;
const ARENA=26,BEAM_Y=10.4;

/* ---------- 章节主题 ---------- */
const THEMES=[
  {id:'amber',name:'琥珀傍晚',sky:['#221a24','#4a2a2e','#8f4528','#cf7a34','#eaa950'],sun:{x:-46,y:26,r:15,c:'#f7c06a'},fog:'#a0623a',fogN:46,fogF:132,hemi:['#ffd9a8','#4a2c1c',1.5],key:['#ffd79a',2.1],ground:'#c09863',far:'#3a2226',cloud:'#5a2f30',mid:'#1c1416',storm:'#a5763f'},
  {id:'day',name:'尘白天',sky:['#7f8c8a','#a9b09c','#cfc6a6','#dccfae','#e6d9b6'],sun:{x:30,y:62,r:11,c:'#fff8e2'},fog:'#c6bc98',fogN:62,fogF:150,hemi:['#ffffff','#6a5a40',1.75],key:['#fff4d6',2.3],ground:'#cdbb8e',far:'#70786c',cloud:'#8e9488',mid:'#2a2e2a',storm:'#9a7a46'},
  {id:'gold',name:'金色午后',sky:['#3f6470','#7f9a92','#d2a94e','#ecc86b','#f3d98a'],sun:{x:44,y:44,r:13,c:'#fff0a8'},fog:'#cfa452',fogN:50,fogF:140,hemi:['#fff0c0','#6a4a28',1.6],key:['#ffe2a0',2.2],ground:'#c9a05a',far:'#42524f',cloud:'#7a7a58',mid:'#1c1c18',storm:'#a07a40'},
  {id:'storm',name:'沙尘暴',sky:['#4a341c','#6e4a24','#8c6234','#a5763f','#b48448'],sun:{x:10,y:30,r:13,c:'#e8c48a'},fog:'#9c7038',fogN:15,fogF:48,hemi:['#e8c48a','#5a3a1c',1.5],key:['#ffd9a0',1.5],ground:'#ba924e',far:'#7a5628',cloud:'#8a6232',mid:'#241a10',storm:'#a5763f'},
  {id:'sunset',name:'赭红落日',sky:['#2a1014','#5a1a16','#9a2a1c','#d25a2c','#ef9a4a'],sun:{x:-18,y:19,r:18,c:'#ff8a4c'},fog:'#8e3c26',fogN:44,fogF:125,hemi:['#ffb080','#3a1410',1.5],key:['#ff9a60',2.2],ground:'#b07848',far:'#46161a',cloud:'#6e1e1a',mid:'#180c0e',storm:'#8a5a30'},
  {id:'night',name:'夜行',sky:['#07080f','#111426','#202a4a','#3a2a5a','#5a2a52'],sun:{x:38,y:52,r:10,c:'#dfe8ff'},stars:true,fog:'#22233a',fogN:48,fogF:138,hemi:['#6a7ac0','#100a14',1.35],key:['#b0c0ff',2.0],ground:'#6c6674',far:'#0c0e1e',cloud:'#161a30',mid:'#08080e',storm:'#5a4a3a'}
];
const chapterTheme=[0,1,2,3,4,5];
function skyCanvas(th){
  return canvasTex(32,512,(x,w,h)=>{
    const g=x.createLinearGradient(0,0,0,h);
    // 相机略俯视：地平线在天空面的 43% 高度处，可见的只是低空色带
    const pos=[0,.2,.34,.43,1];th.sky.forEach((c,i)=>g.addColorStop(pos[i],c));
    x.fillStyle=g;x.fillRect(0,0,w,h);
    if(th.id==='gold'||th.id==='day'){ // 几道横云带
      x.fillStyle=th.cloud;x.globalAlpha=.16;
      for(let i=0;i<7;i++){const y=h*rnd(.3,.75);x.fillRect(0,y,w,rnd(4,14))}
    }
  });
}
const skyTexs=THEMES.map(skyCanvas);
const skyMatA=new T.MeshBasicMaterial({map:skyTexs[0],fog:false,depthWrite:false});
const skyMatB=new T.MeshBasicMaterial({map:skyTexs[0],fog:false,depthWrite:false,transparent:true,opacity:0});
const skyGeo=new T.PlaneGeometry(560,300);
const skyA=new T.Mesh(skyGeo,skyMatA);skyA.position.set(0,-12,-205);skyA.layers.set(2);scene.add(skyA);
const skyB=new T.Mesh(skyGeo,skyMatB);skyB.position.set(0,-12,-204);skyB.layers.set(2);scene.add(skyB);
let skyFade=1,themeIdx=0;
// 太阳 / 月亮
const sunMat=new T.MeshBasicMaterial({fog:false}),haloMat=new T.MeshBasicMaterial({fog:false,transparent:true,opacity:.22,depthWrite:false}),
  ringMat=new T.MeshBasicMaterial({fog:false,transparent:true,opacity:.12,depthWrite:false,side:T.DoubleSide});
const sun=new T.Mesh(new T.CircleGeometry(1,40),sunMat),halo=new T.Mesh(new T.CircleGeometry(1,40),haloMat),
  ring1=new T.Mesh(new T.RingGeometry(1.9,2.0,56),ringMat),ring2=new T.Mesh(new T.RingGeometry(2.6,2.66,56),ringMat);
for(const m of [sun,halo,ring1,ring2]){m.layers.set(2);scene.add(m)}
// 星星
const starGeo=new T.BufferGeometry(),starN=240,starPos=new Float32Array(starN*3);
for(let i=0;i<starN;i++){starPos[i*3]=rnd(-260,260);starPos[i*3+1]=rnd(-20,120);starPos[i*3+2]=-203}
starGeo.setAttribute('position',new T.BufferAttribute(starPos,3));
const starMat=new T.PointsMaterial({color:0xdfe8ff,size:1.6,sizeAttenuation:false,transparent:true,opacity:0,fog:false,depthWrite:false});
const stars=new T.Points(starGeo,starMat);stars.layers.set(2);scene.add(stars);
// 横云带
const cloudMat=new T.MeshBasicMaterial({color:0x5a2f30,fog:false,transparent:true,opacity:.3,depthWrite:false});
const clouds=[];
for(let i=0;i<9;i++){
  const m=new T.Mesh(new T.PlaneGeometry(rnd(60,150),rnd(2.5,6)),cloudMat);
  m.position.set(rnd(-260,260),rnd(-6,46),-196);m.layers.set(2);scene.add(m);
  clouds.push({m,v:rnd(.25,.7)});
}

/* ---------- 颜色插值状态 ---------- */
const cur={fog:new T.Color(),hemiSky:new T.Color(),hemiGround:new T.Color(),key:new T.Color(),ground:new T.Color(),
  far:new T.Color(),near:new T.Color(),cloud:new T.Color(),storm:new T.Color(),sun:new T.Color(),fogN:46,fogF:132,hemiI:1.5,keyI:2.1,sunX:-46,sunY:26,sunR:15,stars:0};
const tmp=new T.Color(),dustC=new T.Color('#fff0d0');
const TC=THEMES.map(t=>({fog:new T.Color(t.fog),hemiSky:new T.Color(t.hemi[0]),hemiGround:new T.Color(t.hemi[1]),
  key:new T.Color(t.key[0]),ground:new T.Color(t.ground),far:new T.Color(t.far),near:new T.Color(t.mid),
  cloud:new T.Color(t.cloud),storm:new T.Color(t.storm),sun:new T.Color(t.sun.c)}));
function initCur(){const t=THEMES[0];cur.fog.set(t.fog);cur.hemiSky.set(t.hemi[0]);cur.hemiGround.set(t.hemi[1]);cur.key.set(t.key[0]);
  cur.ground.set(t.ground);cur.far.set(t.far);cur.cloud.set(t.cloud);cur.storm.set(t.storm);cur.sun.set(t.sun.c);}
initCur();
const nearMat=new T.MeshBasicMaterial({color:0x120d0c,fog:false});
let stormTarget=0,stormI=0,windDir=1,windTimer=6;

/* ---------- 地面 ---------- */
const groundTex=canvasTex(512,512,(x,w,h)=>{
  x.fillStyle='#cdb88e';x.fillRect(0,0,w,h);
  for(let i=0;i<5200;i++){
    const r=Math.random();x.fillStyle=r<.45?'rgba(60,40,24,.2)':r<.85?'rgba(255,245,220,.22)':'rgba(120,60,30,.2)';
    x.fillRect(rnd(w),rnd(h),rnd(1,4),rnd(1,4));
  }
  x.strokeStyle='rgba(40,26,16,.28)';
  for(let i=0;i<14;i++){x.lineWidth=rnd(1,3);x.beginPath();let px=rnd(w),py=rnd(h);x.moveTo(px,py);
    for(let j=0;j<6;j++){px+=rnd(-40,40);py+=rnd(-40,40);x.lineTo(px,py)}x.stroke()}
  x.fillStyle='rgba(30,20,12,.16)';
  for(let i=0;i<9;i++){x.beginPath();x.ellipse(rnd(w),rnd(h),rnd(14,40),rnd(5,12),rnd(3),0,7);x.fill()}
  x.fillStyle='rgba(50,36,22,.2)'; // 车辙
  for(let i=0;i<3;i++){const y=rnd(h);x.fillRect(0,y,w,rnd(4,8));x.fillRect(0,y+rnd(22,40),w,rnd(4,8))}
},18,8);
groundTex.anisotropy=R.renderer.capabilities.getMaxAnisotropy();
const groundMat=new T.MeshToonMaterial({map:groundTex,gradientMap:M.steel.gradientMap,color:0xc09863});
const ground=new T.Mesh(new T.PlaneGeometry(360,150),groundMat);
ground.rotation.x=-Math.PI/2;ground.position.set(0,0,-35);scene.add(ground);reg(ground);

/* ---------- 远景（layer 2 不描边） ---------- */
const FAR_Z=-122; // 地面远边在 z=-110，远景墙放在其外、天空(-205)之前
const farMat=new T.MeshBasicMaterial({color:0x3a2226,fog:false});
(function buildFar(){
  const g=new T.Group();
  for(let i=0;i<32;i++){const h=rnd(4,11);box(rnd(12,30),h,rnd(6,14),farMat,-138+i*8.9+rnd(-3,3),h/2-3,rnd(-10,8),g)}
  for(let i=0;i<40;i++){
    const x=-134+i*6.9+rnd(-2,2),k=Math.random(),h=rnd(6,13);
    if(k<.34){box(rnd(9,16),h,rnd(6,10),farMat,x,h/2-1,rnd(0,10),g);
      for(let j=0;j<3;j++){const r=box(3.4,.6,8,farMat,x-5.5+j*3.8,h+.7,rnd(0,6),g);r.rotation.z=.5}}
    else if(k<.6){box(6,5,6,farMat,x,1.5,rnd(0,6),g);
      for(let j=0,n=rndi(1,3);j<n;j++){const sh=rnd(9,16);cyl(.5,.95,sh,farMat,x+rnd(-4,4),sh/2-1,rnd(-3,3),g,8)}}
    else if(k<.76){const z=rnd(2,8);cyl(3.4,4.6,12,farMat,x,5,z,g,12);cyl(2.4,3.4,2,farMat,x,11.5,z,g,12)}
    else if(k<.88){box(1,h+8,1,farMat,x,(h+8)/2,0,g);box(22,.7,.7,farMat,x+6,h+8,0,g);box(.4,7,.4,farMat,x+15,h+4.5,0,g)}
    else{cyl(4,4,h+4,farMat,x,(h+4)/2,rnd(0,6),g,14);cyl(.2,4.2,2.2,farMat,x,h+5,rnd(0,6),g,14)}
  }
  // 输电塔
  for(const x of [-112,-72,-28,18,64,108]){
    box(.6,16,.6,farMat,x-2.4,8,4,g);box(.6,16,.6,farMat,x+2.4,8,4,g);
    for(let j=0;j<4;j++)box(5.4-j,.35,.35,farMat,x,4+j*3.4,4,g);
    box(10,.4,.4,farMat,x,14.5,4,g);box(8,.4,.4,farMat,x,16,4,g);
  }
  const m=CL.ink.merge(g);m.traverse(o=>o.layers.set(2));m.position.z=FAR_Z;scene.add(m);
})();
// 远处灯点
(function(){
  const n=90,p=new Float32Array(n*3);
  for(let i=0;i<n;i++){p[i*3]=rnd(-130,130);p[i*3+1]=rnd(1,15);p[i*3+2]=FAR_Z+2+rnd(0,6)}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(p,3));
  const pts=new T.Points(g,new T.PointsMaterial({color:0xffc86a,size:2.2,sizeAttenuation:false,fog:false,transparent:true,opacity:.85}));
  pts.layers.set(2);scene.add(pts);
})();

/* ---------- 中景废料场（描边，按材质合并） ---------- */
const smokeTex=canvasTex(64,64,(x,w,h)=>{const g=x.createRadialGradient(32,32,2,32,32,30);g.addColorStop(0,'rgba(70,52,40,.6)');g.addColorStop(1,'rgba(70,52,40,0)');x.fillStyle=g;x.fillRect(0,0,w,h)});
const contTex=canvasTex(128,64,(x,w,h)=>{
  x.fillStyle='#dcdcdc';x.fillRect(0,0,w,h);
  x.fillStyle='#a8a8a8';for(let i=0;i<w;i+=8)x.fillRect(i,0,3,h);
  x.fillStyle='rgba(90,60,40,.28)';for(let i=0;i<70;i++)x.fillRect(rnd(w),rnd(h),rnd(2,10),rnd(1,5));
  x.fillStyle='rgba(60,60,60,.5)';x.fillRect(w/2-1,0,2,h);x.fillRect(w/2-5,4,10,h-8);
});
const contMats=[0x8a3a28,0x2f4a3a,0x2a4a6a,0xa8742c,0x5c5c5c].map(c=>new T.MeshToonMaterial({map:contTex,gradientMap:M.steel.gradientMap,color:c}));
const smokes=[];
(function buildMid(){
  const g=new T.Group(),hz=hazardTex();
  for(let i=0;i<18;i++){
    const x=-84+i*9.9+rnd(-2.5,2.5),z=-37-rnd(0,10),k=i%6;
    if(k===0){ // 集装箱堆
      const n=rndi(1,3);let y=0;
      for(let j=0;j<n;j++){const h=rnd(2.6,3.1),w=rnd(6,9);box(w,h,3,pick(contMats),x+rnd(-1,1),y+h/2,z,g);y+=h}
    }else if(k===1){ // 龙门吊
      const h=rnd(8,12),w=rnd(16,22);
      box(.7,h,.7,M.rustD,x-w/2,h/2,z,g);box(.7,h,.7,M.rustD,x+w/2,h/2,z,g);
      box(.4,h*.5,.4,M.rustD,x-w/2,h*.25,z+1.6,g);box(.4,h*.5,.4,M.rustD,x+w/2,h*.25,z+1.6,g);
      box(w+.8,1.1,1.4,M.rustD,x,h+.5,z,g);box(w,.3,.3,M.amber,x,h+.1,z,g);
      box(2.2,1.6,1.8,M.steelD,x-w*.18,h-.4,z,g);box(.08,h-3.4,.08,M.dark,x-w*.18,h/2-1.6,z,g);
      torus(.5,.1,M.amber,x-w*.18,2.4,z,g).rotation.y=Math.PI/2;
    }else if(k===2){ // 筒仓群
      const n=rndi(3,5),h=rnd(6,9.5);
      for(let j=0;j<n;j++){const sx=x+j*3.4-n*1.7+rnd(-.5,.5);cyl(1.7,1.7,h,M.steelD,sx,h/2,z,g,12);cone(1.8,1.6,M.rust,sx,h+.8,z,g,12);
        disc(.22,0xff9a4c,sx,h*.6,z+1.72,scene)}
      box(3*n, .35,.35,M.rust,x,h*.78,z+1.2,g);
      box(.3,h*.78,.3,M.rust,x-n*1.7+1,h*.39,z+1.2,g);
    }else if(k===3){ // 料仓 + 斜坡传送带
      const h=rnd(5,7.5);box(3.6,h,3.2,M.rustD,x,h/2,z,g);cone(2.6,2,M.rust,x,h+1,z,g,4).rotation.y=Math.PI/4;
      const b=box(11,.5,1,M.dark,x+6,h*.55,z+2,g);b.rotation.z=.38;box(.3,h*.4,.3,M.dark,x+9,h*.2,z+2,g);
    }else if(k===4){ // 水塔
      const h=rnd(7,9.5);
      for(const [dx,dz] of [[-1.6,-1.4],[1.6,-1.4],[-1.6,1.4],[1.6,1.4]]){const l=box(.3,h,.3,M.rustD,x+dx,h/2,z+dz,g);l.rotation.z=-dx*.06}
      cyl(2.6,2.6,3.2,M.steelD,x,h+1.6,z,g,14);cone(2.7,1.2,M.rust,x,h+3.8,z,g,14);
    }else if(k===5){ // 废料山
      const n=rndi(5,9);for(let j=0;j<n;j++){const s=rnd(1.2,3);box(s*rnd(.7,1.6),s*rnd(.4,.9),s,pick([M.rustD,M.steelD,M.dark,M.rust]),x+rnd(-3,3),rnd(.2,2.2),z+rnd(-2,2),g)}
    }
  }
  // 围栏
  for(let i=0;i<40;i++){const x=-80+i*4.1;box(.12,1.6,.12,M.dark,x,.8,-29,g);box(4.1,.08,.08,M.dark,x+2.05,1.55,-29,g);box(4.1,.06,.06,M.dark,x+2.05,.9,-29,g)}
  // 烟囱
  for(const x of [-52,-9,38,62]){const h=rnd(13,17);cyl(1,1.5,h,M.rustD,x,h/2,-40,g,10);cyl(1.1,1.1,.5,M.hot,x,h-.2,-40,g,10);
    for(let i=0;i<5;i++){const sp=new T.Sprite(new T.SpriteMaterial({map:smokeTex,transparent:true,opacity:.4,depthWrite:false}));
      sp.position.set(x+rnd(-.5,.5),h+i*2.6,-40);sp.scale.setScalar(rnd(4,6));sp.layers.set(1);scene.add(sp);
      smokes.push({sp,base:h+i*2.6,phase:rnd(0,6),x})}
  }
  const m=CL.ink.merge(g);scene.add(m);reg(m);
  CL.worldMid=m;
})();

/* ---------- 近景剪影（layer 2） ---------- */
(function buildNear(){
  const g=new T.Group();
  for(let i=0;i<46;i++){const x=-70+i*3.1,w=rnd(1.6,4.6),h=rnd(.3,1.2);
    box(w,h,rnd(1,2),nearMat,x+rnd(-1,1),h/2-1.1,9.5+rnd(-1,1),g);
    if(Math.random()<.3)box(rnd(.3,.6),rnd(.5,1),.5,nearMat,x+rnd(-1,1),.2,10,g).rotation.z=rnd(-.6,.6);
  }
  const m=CL.ink.merge(g);m.traverse(o=>o.layers.set(2));scene.add(m);
})();

/* ---------- 竞技场 ---------- */
const PLATFORMS=[{x:-15,y:2.6,w:6},{x:15,y:2.6,w:6},{x:0,y:5.2,w:7},{x:-8,y:3.9,w:3.4},{x:8,y:3.9,w:3.4}];
const ANCHORS=[];
let zone=null;
(function buildArena(){
  const g=new T.Group(),hz=hazardTex(),hzd=hazardTex('#e3b247','#c8462c');
  const hzMat=new T.MeshToonMaterial({map:hz,gradientMap:M.steel.gradientMap});
  // 头顶吊梁
  box(58,.55,.55,M.steelD,0,BEAM_Y,0,g);box(58,.16,.16,M.steelD,0,BEAM_Y+.9,0,g);
  for(let i=0;i<29;i++){const d=box(.09,1.05,.09,M.rustD,-28+i*2,BEAM_Y+.45,0,g);d.rotation.z=i%2?.72:-.72}
  // 平台
  for(const p of PLATFORMS){
    box(p.w,.3,2.4,M.steelD,p.x,p.y-.15,0,g);
    box(p.w+.12,.07,2.5,M.rust,p.x,p.y+.02,0,g);
    const st=new T.Mesh(new T.PlaneGeometry(p.w,.26),new T.MeshBasicMaterial({map:hzd}));st.position.set(p.x,p.y-.15,1.21);g.add(st);
    for(let j=0;j<p.w/.55;j++){const d=box(.07,.5,.07,M.dark,p.x-p.w/2+.3+j*.55,p.y-.6,0,g);d.rotation.z=j%2?.8:-.8}
    box(p.w,.07,.07,M.dark,p.x,p.y-.85,0,g);
    for(const s of [-1,1]){box(.07,BEAM_Y-p.y,.07,M.dark,p.x+s*(p.w/2-.5),p.y+(BEAM_Y-p.y)/2,-.5,g);
      box(.06,.9,.06,M.steelD,p.x+s*(p.w/2-.15),p.y+.5,-1.1,g)}
    box(p.w,.05,.05,M.steelD,p.x,p.y+.95,-1.1,g);
    for(const s of [-1,1])disc(.1,0xffd36a,p.x+s*(p.w/2-.4),p.y-.4,.6,scene,.95);
  }
  // 边界废料墙
  for(const s of [-1,1]){
    const x=s*(ARENA+1.5);
    box(2.6,10,4.4,M.rustD,x,5,0,g);
    for(let j=0;j<9;j++)box(rnd(.6,1.8),rnd(.5,1.6),rnd(.8,2),pick([M.rust,M.steelD,M.dark]),x-s*1.4+rnd(-.3,.3),rnd(.4,9.6),rnd(-1.8,1.8),g);
    const hp=new T.Mesh(new T.PlaneGeometry(4.2,1),new T.MeshBasicMaterial({map:hz}));hp.position.set(x-s*1.34,1.1,0);hp.rotation.y=-s*Math.PI/2;g.add(hp);
    const hp2=new T.Mesh(new T.PlaneGeometry(4.2,.7),new T.MeshBasicMaterial({map:hz}));hp2.position.set(x-s*1.34,7.6,0);hp2.rotation.y=-s*Math.PI/2;g.add(hp2);
    disc(.3,0xffd36a,x-s*1.4,8.6,0,scene,.95);disc(.2,0xff5a3c,x-s*1.4,6.4,1.6,scene,.95);
  }
  // 后方道具（z=-2.6~-4）
  const props=[-24,-20.5,-17,-12.5,-10.5,-4.5,-2.5,3,5,11,13.5,18,21,24];
  props.forEach((x,i)=>{
    const z=-2.7-rnd(0,1.2),k=i%5;
    if(k===0){for(let j=0;j<3;j++)cyl(.42,.42,1.1,pick([M.rust,M.olive,M.blue,M.rustD]),x+j*.9,.55,z,g,10)}
    else if(k===1){box(1.2,1.2,1.2,M.rust,x,.6,z,g);box(.9,.9,.9,M.steelD,x+.2,1.65,z,g).rotation.y=.5}
    else if(k===2){cyl(.22,.22,3.4,M.steelD,x,1,z,g,8).rotation.z=Math.PI/2;cyl(.22,.22,3.4,M.steelD,x,.4,z+.3,g,8).rotation.z=Math.PI/2;box(.5,1.3,.6,M.dark,x-1.6,.65,z,g)}
    else if(k===3){for(let j=0;j<3;j++)torus(.5,.2,M.dark,x,.25+j*.45,z,g).rotation.x=Math.PI/2;box(.7,.7,.7,M.rustD,x+1.4,.35,z,g)}
    else{box(1.6,1,.9,M.steelD,x,.5,z,g);cyl(.1,.1,.5,M.dark,x-.4,1.25,z,g,6);disc(.07,0x56c2b6,x+.4,1.05,z+.46,scene,.95);disc(.07,0xffd36a,x+.7,1.05,z+.46,scene,.95)}
  });
  for(let i=0;i<70;i++){const x=rnd(-ARENA-2,ARENA+2),z=rnd(-5,-1.4),k=Math.random();
    if(k<.4)box(rnd(.2,.8),rnd(.1,.25),rnd(.2,.6),Math.random()<.5?M.rust:M.steelD,x,.08,z,g);
    else if(k<.7)cyl(.1,.13,rnd(.3,.9),M.dark,x,.25,z,g,6).rotation.z=rnd(0,3);
    else box(rnd(.5,1.4),.08,rnd(.2,.5),M.steelD,x,.05,z,g).rotation.y=rnd(0,6);
  }
  const m=CL.ink.merge(g);scene.add(m);reg(m);
  // 地面标线 / 中圈
  const lineMat=new T.MeshBasicMaterial({color:0xe3b247,transparent:true,opacity:.55,depthWrite:false});
  for(const s of [-1,1]){const l=plate(.22,10,0xe3b247,s*(ARENA-.2),.015,0,null,.55);l.rotation.x=-Math.PI/2;scene.add(l)}
  const ring=new T.Mesh(new T.RingGeometry(3.2,3.45,48),lineMat);ring.rotation.x=-Math.PI/2;ring.position.y=.015;ring.layers.set(1);scene.add(ring);
  // 告示牌
  const sign=canvasTex(256,96,(x,w,h)=>{x.fillStyle='#201a16';x.fillRect(0,0,w,h);x.strokeStyle='#e3b247';x.lineWidth=6;x.strokeRect(4,4,w-8,h-8);
    x.font='900 58px Impact,"Arial Black",sans-serif';x.textAlign='center';x.textBaseline='middle';x.lineWidth=8;x.strokeStyle='#1c1713';x.strokeText('SCRAP 0'+1,w/2,h/2);x.fillStyle='#f2c14e';x.fillText('SCRAP 01',w/2,h/2)});
  const sm=new T.Mesh(new T.PlaneGeometry(4.4,1.65),new T.MeshBasicMaterial({map:sign}));sm.position.set(-9.5,6.6,-.9);scene.add(sm);reg(sm);
  // 钩锁锚点
  for(const x of [-21,-14,-7,0,7,14,21]){
    const a=new T.Group();a.position.set(x,0,0);scene.add(a);
    box(1,.75,1,M.rust,0,BEAM_Y-.65,0,a);box(.06,1.15,.06,M.steelL,0,BEAM_Y-1.6,0,a);
    torus(.34,.085,M.amber,0,BEAM_Y-2.35,0,a);
    const gl=disc(.17,0xffd36a,0,BEAM_Y-2.35,.12,a,.9);
    reg(a);ANCHORS.push({x,y:BEAM_Y-2.35,glow:gl});
  }
})();
/* 信号区 */
const zoneGroup=new T.Group();zoneGroup.visible=false;scene.add(zoneGroup);
const zoneCurtain=plate(1,15,0x56c2b6,0,7.5,0,zoneGroup,.09),zoneL=plate(.14,15,0x9ff5e6,0,7.5,.05,zoneGroup,.9),zoneR=plate(.14,15,0x9ff5e6,0,7.5,.05,zoneGroup,.9),
  zoneFloor=new T.Mesh(new T.PlaneGeometry(1,5),new T.MeshBasicMaterial({color:0x56c2b6,transparent:true,opacity:.16,depthWrite:false}));
zoneFloor.rotation.x=-Math.PI/2;zoneFloor.position.y=.02;zoneFloor.layers.set(1);zoneGroup.add(zoneFloor);
function setZone(x0,x1){
  if(x0===null||x1===null||x1-x0<2){zone=null;zoneGroup.visible=false;return}
  zone={x0,x1};zoneGroup.visible=true;
  const w=x1-x0,cx=(x0+x1)/2;
  zoneCurtain.scale.set(w,15,1);zoneCurtain.position.x=cx;
  zoneFloor.scale.set(w,5,1);zoneFloor.position.x=cx;
  zoneL.position.x=x0;zoneR.position.x=x1;
}

/* ---------- 尘埃 / 沙暴横纹 ---------- */
const dustGeo=new T.BufferGeometry(),dustN=240,dustPos=new Float32Array(dustN*3);
for(let i=0;i<dustN;i++){dustPos[i*3]=rnd(-36,36);dustPos[i*3+1]=rnd(0,13);dustPos[i*3+2]=rnd(-12,9)}
dustGeo.setAttribute('position',new T.BufferAttribute(dustPos,3));
const dustMat=new T.PointsMaterial({color:0xf0d8a8,size:.07,transparent:true,opacity:.5,depthWrite:false});
const dust=new T.Points(dustGeo,dustMat);dust.layers.set(1);scene.add(dust);
const streakN=150,strPos=new Float32Array(streakN*6),strData=[];
for(let i=0;i<streakN;i++){strData.push({x:rnd(-36,36),y:rnd(0,13),z:rnd(2,12),v:rnd(22,40),l:rnd(.7,1.8)})}
const strGeo=new T.BufferGeometry();strGeo.setAttribute('position',new T.BufferAttribute(strPos,3));
const strMat=new T.LineBasicMaterial({color:0xf2d9a6,transparent:true,opacity:0});
const streaks=new T.LineSegments(strGeo,strMat);streaks.layers.set(1);streaks.frustumCulled=false;scene.add(streaks);

/* ---------- 主题切换 / 每帧 ---------- */
function setTheme(i){
  if(i===themeIdx||!THEMES[i])return;
  themeIdx=i;skyMatB.map=skyTexs[i];skyMatB.needsUpdate=true;skyMatB.opacity=0;skyFade=0;
}
function update(dt,real,t){
  const th=THEMES[themeIdx],A=TC[themeIdx],B=TC[3];
  stormI=damp(stormI,stormTarget,1.6,real);
  windTimer-=real;if(windTimer<=0){windTimer=rnd(5,9);windDir=Math.random()<.5?-1:1}
  const s=stormI,L=1-Math.exp(-2.2*real);
  const mixC=(dst,a,b)=>dst.lerp(tmp.copy(a).lerp(b,s),L);
  mixC(cur.fog,A.fog,B.fog);mixC(cur.hemiSky,A.hemiSky,B.hemiSky);mixC(cur.hemiGround,A.hemiGround,B.hemiGround);
  mixC(cur.key,A.key,B.key);mixC(cur.ground,A.ground,B.ground);mixC(cur.far,A.far,B.far);mixC(cur.near,A.near,B.near);
  mixC(cur.cloud,A.cloud,B.cloud);cur.storm.lerp(B.storm,L);mixC(cur.sun,A.sun,B.sun);
  cur.fogN=lerp(cur.fogN,lerp(th.fogN,THEMES[3].fogN,s),L);cur.fogF=lerp(cur.fogF,lerp(th.fogF,THEMES[3].fogF,s),L);
  cur.hemiI=lerp(cur.hemiI,th.hemi[2],L);cur.keyI=lerp(cur.keyI,lerp(th.key[1],THEMES[3].key[1],s),L);
  cur.sunX=lerp(cur.sunX,th.sun.x,L);cur.sunY=lerp(cur.sunY,th.sun.y,L);cur.sunR=lerp(cur.sunR,th.sun.r*(1-s*.3),L);
  cur.stars=lerp(cur.stars,th.stars?1:0,L);
  R.fog.color.copy(cur.fog);R.fog.near=cur.fogN;R.fog.far=cur.fogF;
  R.clearColor.copy(cur.fog);
  // 物理光照模式下 ×π 还原为反照率倍数；再乘 LI 做整体曝光（防止地面过曝）
  const LI=.4;
  R.lights.hemi.color.copy(cur.hemiSky);R.lights.hemi.groundColor.copy(cur.hemiGround);R.lights.hemi.intensity=cur.hemiI*LI*R.PI;
  R.lights.key.color.copy(cur.key);R.lights.key.intensity=cur.keyI*LI*R.PI;
  groundMat.color.copy(cur.ground);farMat.color.copy(cur.far);nearMat.color.copy(cur.near);cloudMat.color.copy(cur.cloud);
  sunMat.color.copy(cur.sun);haloMat.color.copy(cur.sun);
  const su=[sun,halo,ring1,ring2];su.forEach(m=>m.position.set(cur.sunX,cur.sunY,-197));
  sun.scale.setScalar(cur.sunR);halo.scale.setScalar(cur.sunR*1.5*(1+s*.5));ring1.scale.setScalar(cur.sunR);ring2.scale.setScalar(cur.sunR);
  haloMat.opacity=.22-s*.1;ringMat.opacity=.12*(1-s);
  starMat.opacity=cur.stars*(1-s);
  // 天空渐变：后层 B 渐显盖住前层 A，完成后把贴图交给前层
  if(skyFade<1){
    skyFade=Math.min(1,skyFade+real/1.2);skyMatB.opacity=skyFade;
    if(skyFade>=1){skyMatA.map=skyMatB.map;skyMatA.needsUpdate=true}
  }
  // 云 / 烟 / 尘
  for(const c of clouds){c.m.position.x+=c.v*real*(1+s*2);if(c.m.position.x>280)c.m.position.x=-280}
  cloudMat.opacity=.26+s*.1;
  for(const m of smokes){m.sp.position.y=m.base+((t*.5+m.phase)%5);m.sp.material.opacity=.42-((t*.5+m.phase)%5)*.08}
  const dp=dust.geometry.attributes.position;
  for(let i=0;i<dustN;i++){dp.array[i*3]+=real*(.35+windDir*s*9);if(dp.array[i*3]>36)dp.array[i*3]=-36;if(dp.array[i*3]<-36)dp.array[i*3]=36}
  dp.needsUpdate=true;dustMat.opacity=.5+s*.3;dustMat.color.copy(cur.storm).lerp(dustC,.4);
  if(s>.02){
    for(let i=0;i<streakN;i++){const d=strData[i];d.x+=windDir*d.v*s*real;if(d.x>38)d.x=-38;if(d.x<-38)d.x=38;
      const j=i*6;strPos[j]=d.x;strPos[j+1]=d.y;strPos[j+2]=d.z;strPos[j+3]=d.x-windDir*d.l;strPos[j+4]=d.y+.04;strPos[j+5]=d.z}
    strGeo.attributes.position.needsUpdate=true;
  }
  strMat.opacity=s*.5;
  for(const a of ANCHORS)a.glow.material.opacity=.55+Math.sin(t*3+a.x)*.3;
  if(zoneGroup.visible){zoneCurtain.material.opacity=.07+Math.sin(t*4)*.03;zoneL.material.opacity=zoneR.material.opacity=.6+Math.sin(t*8)*.35}
  R.U.uSand.value=s*.72;R.U.uDir.value=windDir;R.U.uSandColor.value.copy(cur.storm);
}
setTheme(0);
CL.world={THEMES,chapterTheme,ARENA,BEAM_Y,PLATFORMS,ANCHORS,setTheme,update,setZone,
  get zone(){return zone},storm:v=>{stormTarget=clamp(v,0,1)},get stormI(){return stormI},
  get windX(){return windDir*stormI},groundMat,smokeTex};
})();
