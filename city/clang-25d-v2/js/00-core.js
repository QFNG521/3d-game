/* ========================================================================
 * CLANG! 2.5D — 00 核心层：工具 / 材质 / 几何缓存 / 墨线注册
 * ====================================================================== */
(function(){
'use strict';
const T=THREE;
const CL=window.CL=window.CL||{};
T.ColorManagement.enabled=false;

/* ---------- 数学 / 杂项 ---------- */
const TAU=Math.PI*2;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
const damp=(a,b,l,dt)=>a+(b-a)*(1-Math.exp(-l*dt));
const rnd=(a=1,b)=>b===undefined?Math.random()*a:a+Math.random()*(b-a);
const rndi=(a,b)=>Math.floor(rnd(a,b+1));
const pick=a=>a[(Math.random()*a.length)|0];
const sign=v=>v>0?1:v<0?-1:0;
const $=id=>document.getElementById(id);
const dist=(x1,y1,x2,y2)=>Math.hypot(x2-x1,y2-y1);
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=(Math.random()*(i+1))|0;[a[i],a[j]]=[a[j],a[i]]}return a};
const fmt=n=>String(Math.round(n)).padStart(6,'0');
// 线段 (x1,y1)-(x2,y2) 与圆 (cx,cy,r) 是否相交（射线-圆命中，子弹很快时不会穿透）
function segCircle(x1,y1,x2,y2,cx,cy,r){
  const dx=x2-x1,dy=y2-y1,len2=dx*dx+dy*dy;
  let t=len2?((cx-x1)*dx+(cy-y1)*dy)/len2:0;
  t=clamp(t,0,1);
  const px=x1+dx*t,py=y1+dy*t;
  return (px-cx)*(px-cx)+(py-cy)*(py-cy)<=r*r;
}
Object.assign(CL,{TAU,clamp,lerp,damp,rnd,rndi,pick,sign,$,dist,shuffle,fmt,segCircle,smooth:(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)}});

/* ---------- 配色（沿用原作印刷漫画调色板） ---------- */
const C={
  ink:0x1c1713, steel:0x747c80, steelD:0x3d4348, steelL:0xc3c9c9, dark:0x25282b,
  rust:0xa5522c, rustD:0x6e3520, rustL:0xd0743a, amber:0xe3b247, gold:0xf2c14e, hot:0xc8462c,
  coral:0xe2654e, cream:0xefe6d2, bone:0xd9c7a0, sand:0xc29a5c, sandD:0x8d6b3c, teal:0x56c2b6,
  olive:0x6b7440, green:0x6f8f4e, wood:0x9a6230, woodD:0x5c3a1c, black:0x1d1f22, blue:0x3a6a8a
};
CL.C=C;

/* ---------- 卡通材质 ---------- */
const gradTex=(()=>{
  const d=new Uint8Array([96,96,96,255,170,170,170,255,255,255,255,255]);
  const t=new T.DataTexture(d,3,1,T.RGBAFormat);
  t.minFilter=t.magFilter=T.NearestFilter;t.generateMipmaps=false;t.needsUpdate=true;return t;
})();
const toon=(color,emissive=0)=>new T.MeshToonMaterial({color,gradientMap:gradTex,emissive});
const flatCache=new Map();
// 无光照纯色（发光贴片 / 灯 / 远景）
function flat(color,op=1){
  if(op>=1&&flatCache.has(color))return flatCache.get(color);
  const m=new T.MeshBasicMaterial({color,transparent:op<1,opacity:op,depthWrite:op>=1});
  if(op>=1)flatCache.set(color,m);return m;
}
const M={
  steel:toon(C.steel), steelD:toon(C.steelD), steelL:toon(C.steelL), dark:toon(C.dark),
  rust:toon(C.rust), rustD:toon(C.rustD), rustL:toon(C.rustL), amber:toon(C.amber), gold:toon(C.gold),
  hot:toon(C.hot), coral:toon(C.coral), cream:toon(C.cream), bone:toon(C.bone), sand:toon(C.sand),
  sandD:toon(C.sandD), teal:toon(C.teal), olive:toon(C.olive), green:toon(C.green), wood:toon(C.wood),
  woodD:toon(C.woodD), black:toon(C.black), blue:toon(C.blue),
  lamp:flat(0xffd36a), redLamp:flat(0xff5a3c), tealLamp:flat(0x9ff5e6), whiteLamp:flat(0xffffff),
  flash:flat(0xffffff), inkFlat:flat(C.ink)
};
CL.M=M; CL.toon=toon; CL.flat=flat;

/* ---------- 几何缓存 ---------- */
const GEO={box:new Map(),cyl:new Map(),cone:new Map(),sph:new T.SphereGeometry(1,12,9),
  circ:new T.CircleGeometry(1,22), plane:new T.PlaneGeometry(1,1), ring:new Map()};
function boxGeo(w,h,d){const k=w+'|'+h+'|'+d;let g=GEO.box.get(k);if(!g){g=new T.BoxGeometry(w,h,d);GEO.box.set(k,g)}return g}
function cylGeo(rt,rb,h,seg=10){const k=rt+'|'+rb+'|'+h+'|'+seg;let g=GEO.cyl.get(k);if(!g){g=new T.CylinderGeometry(rt,rb,h,seg);GEO.cyl.set(k,g)}return g}
function coneGeo(r,h,seg=8){const k=r+'|'+h+'|'+seg;let g=GEO.cone.get(k);if(!g){g=new T.ConeGeometry(r,h,seg);GEO.cone.set(k,g)}return g}
function ringGeo(r0,r1){const k=r0+'|'+r1;let g=GEO.ring.get(k);if(!g){g=new T.RingGeometry(r0,r1,40);GEO.ring.set(k,g)}return g}
CL.GEO=GEO;

/* ---------- 建模辅助 ---------- */
function box(w,h,d,mat,x=0,y=0,z=0,parent){
  const m=new T.Mesh(boxGeo(w,h,d),mat);m.position.set(x,y,z);if(parent)parent.add(m);return m;
}
function ball(r,mat,x=0,y=0,z=0,parent){const m=new T.Mesh(GEO.sph,mat);m.scale.setScalar(r);m.position.set(x,y,z);if(parent)parent.add(m);return m}
// 沿 y 轴的圆柱/锥
function cyl(rt,rb,h,mat,x=0,y=0,z=0,parent,seg=10){const m=new T.Mesh(cylGeo(rt,rb,h,seg),mat);m.position.set(x,y,z);if(parent)parent.add(m);return m}
function cone(r,h,mat,x=0,y=0,z=0,parent,seg=8){const m=new T.Mesh(coneGeo(r,h,seg),mat);m.position.set(x,y,z);if(parent)parent.add(m);return m}
function torus(r,t,mat,x=0,y=0,z=0,parent,seg=6){const m=new T.Mesh(new T.TorusGeometry(r,t,seg,16),mat);m.position.set(x,y,z);if(parent)parent.add(m);return m}
// 发光贴片：不描边、只在合成层渲染
function disc(r,color,x=0,y=0,z=0,parent,op=1){
  const m=new T.Mesh(GEO.circ,flat(color,op));m.scale.setScalar(r);m.position.set(x,y,z);
  m.layers.set(1);m.userData.noInk=true;if(parent)parent.add(m);return m;
}
function plate(w,h,color,x=0,y=0,z=0,parent,op=1){
  const m=new T.Mesh(GEO.plane,new T.MeshBasicMaterial({color,transparent:op<1||true,opacity:op,depthWrite:false,side:T.DoubleSide}));
  m.scale.set(w,h,1);m.position.set(x,y,z);m.layers.set(1);m.userData.noInk=true;if(parent)parent.add(m);return m;
}
// 画布贴图
function canvasTex(w,h,fn,rx=1,ry=1){
  const c=document.createElement('canvas');c.width=w;c.height=h;fn(c.getContext('2d'),w,h);
  const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(rx,ry);return t;
}
// 三角警示条纹
function hazardTex(a='#e3b247',b='#1c1713'){return canvasTex(64,16,(x,w,h)=>{x.fillStyle=a;x.fillRect(0,0,w,h);x.fillStyle=b;
  for(let i=-2;i<6;i++){x.beginPath();x.moveTo(i*16,h);x.lineTo(i*16+8,0);x.lineTo(i*16+16,0);x.lineTo(i*16+8,h);x.fill()}})}
CL.hazardTex=hazardTex;
Object.assign(CL,{box,ball,cyl,cone,torus,disc,plate,canvasTex});

/* ---------- 墨线注册（id-buffer：合成层据相邻像素 id 色差画墨线） ---------- */
const PALETTE=(()=>{const a=[],L=[0,1/6,2/6,3/6,4/6,5/6,1];
  for(const r of L)for(const g of L)for(const b of L){
    if(r===g&&g===b&&(r===0||r===1))continue;
    a.push(new T.MeshBasicMaterial({color:new T.Color(r,g,b),fog:false}));
  }return a})();
let inkCounter=0;
const inkRoots=new Set();
// 注册：根节点下所有网格获得一个独立 id 色。近景道具/角色都应注册；远景放 layer 2 不描边
function reg(root){
  root.userData.ink=[];
  root.traverse(o=>{
    if(o.isMesh&&!o.userData.noInk&&o.layers.mask===1){
      o.userData.inkMat=PALETTE[inkCounter++%PALETTE.length];
      o.userData.base=o.material;
      root.userData.ink.push(o);
    }
  });
  inkRoots.add(root);return root;
}
function unreg(root){inkRoots.delete(root);root.userData.ink=null}
// 受击闪白
function setFlash(root,on){
  const list=root.userData.ink;if(!list)return;
  for(const m of list)m.material=on?M.flash:m.userData.base;
}
// 合并一组静态网格（按材质）以降低 draw call
function mergeGroup(group){
  group.updateMatrixWorld(true);
  const inv=new T.Matrix4().copy(group.matrixWorld).invert(),byMat=new Map(),tm=new T.Matrix4();
  group.traverse(o=>{
    if(o.isMesh&&!o.userData.noInk){
      const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();
      tm.multiplyMatrices(inv,o.matrixWorld);g.applyMatrix4(tm);
      if(!byMat.has(o.material))byMat.set(o.material,[]);
      byMat.get(o.material).push(g);
    }
  });
  const out=new T.Group();
  for(const [mat,list] of byMat){
    const n=list.reduce((s,g)=>s+g.attributes.position.count,0);
    const pos=new Float32Array(n*3),nor=new Float32Array(n*3);let off=0;
    for(const g of list){pos.set(g.attributes.position.array,off*3);nor.set(g.attributes.normal.array,off*3);off+=g.attributes.position.count;g.dispose()}
    const geo=new T.BufferGeometry();
    geo.setAttribute('position',new T.BufferAttribute(pos,3));
    geo.setAttribute('normal',new T.BufferAttribute(nor,3));
    out.add(new T.Mesh(geo,mat));
  }
  return out;
}
CL.ink={roots:inkRoots,reg,unreg,setFlash,merge:mergeGroup};

/* ---------- 特效网格（layer 1：不描边） ---------- */
CL.fxMesh=(geo,mat)=>{const m=new T.Mesh(geo,mat);m.layers.set(1);m.userData.noInk=true;return m};
})();
