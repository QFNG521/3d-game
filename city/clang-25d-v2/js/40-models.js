/* ========================================================================
 * CLANG! 2.5D — 40 模型：主角 / 枪械 / 机器 / Boss / 拾取物
 * 约定：模型面向 +x，脚底在 y=0；关节 = 按材质合并后的 Group（name 即关节名）
 * ====================================================================== */
(function(){
'use strict';
const T=THREE,CL=window.CL,{box,cyl,cone,torus,ball,disc,plate,M,toon}=CL;
const E=CL.EM={
  rust:toon('#b45e2e'),rustD:toon('#8a4a2c'),gb:toon('#58768a'),slate:toon('#4d5a64'),yel:toon('#dca820'),
  dkRed:toon('#9a3524'),red:toon('#bc3a2a'),metal:toon('#5e6268'),metalD:toon('#3f4247'),steel:toon('#7c8086'),
  black:toon('#2a2a2a'),bone:toon('#c9c0ab'),olive:toon('#5d6150'),khaki:toon('#8a8466'),skin:toon('#d9a066'),
  white:toon('#f1ece2'),sandL:toon('#d8b878')
};
// 批量方块 [w,h,d,mat,x,y,z,rx,ry,rz]
function B(g,list){for(const a of list){const m=box(a[0],a[1],a[2],a[3],a[4],a[5],a[6],g);if(a.length>7)m.rotation.set(a[7],a[8],a[9])}return g}
// 合并一组静态网格；发光贴片(noInk)保留并换算到本组坐标
function P(g,name){
  g.updateMatrixWorld(true);
  const inv=new T.Matrix4().copy(g.matrixWorld).invert(),keep=[];
  g.traverse(o=>{if(o.userData.noInk)keep.push(o)});
  const out=CL.ink.merge(g);out.name=name||'';
  for(const k of keep){
    k.matrix.multiplyMatrices(inv,k.matrixWorld);k.matrix.decompose(k.position,k.quaternion,k.scale);
    k.removeFromParent();out.add(k);
  }
  return out;
}
// 关节 + 合并网格
function J(parent,name,x=0,y=0,z=0){const g=new T.Group();g.name=name;g.position.set(x,y,z);parent.add(g);return g}
function PB(parent,name,x,y,z,list){const j=J(parent,name,x,y,z);j.add(P(B(new T.Group(),list)));return j}
// 面向 +x 的发光灯
function eye(parent,r,color,x,y,z,name='eye'){
  const d=disc(r,color,x,y,z,parent);d.rotation.y=Math.PI/2;d.name=name;return d;
}
// 竖向交替条纹带（警示涂装）
function bands(g,w,h,d,x,y,z,n=4,a=E.yel,b=M.black){
  const s=h/n;for(let i=0;i<n;i++)box(w,s*.94,d,i%2?b:a,x,y-h/2+s*(i+.5),z,g);return g;
}

/* ---------------- 枪械（握把在原点，枪口朝 +x） ---------------- */
function finishGun(g,list,mx,my){
  g.add(P(B(new T.Group(),list)));g.userData.muzzle=new T.Vector3(mx,my,0);g.userData.len=mx;return g;
}
const gunPistol=()=>finishGun(new T.Group(),[[.5,.13,.1,E.steel,.2,.05,0],[.52,.05,.11,E.metalD,.2,-.03,0],
  [.16,.3,.1,M.wood,-.02,-.15,0,0,0,.14],[.3,.03,.1,E.metalD,.12,-.09,0],[.05,.12,.1,E.metalD,.44,.05,0]],.5,.05);
function gunRifle(){
  const g=new T.Group(),b=B(new T.Group(),[[.74,.19,.14,E.steel,.2,.05,0],[.5,.06,.15,E.metalD,.2,.16,0],
    [.14,.22,.12,M.wood,.38,-.13,0],[.36,.2,.12,M.wood,-.28,-.03,0],[.14,.26,.11,M.wood,-.02,-.14,0,0,0,.3]]);
  const bar=cyl(.045,.045,.42,E.metalD,.78,.07,0,b,8);bar.rotation.z=Math.PI/2;
  const mz=cyl(.06,.07,.08,E.metalD,.62,.07,0,b,8);mz.rotation.z=Math.PI/2;
  g.add(P(b));const mag=J(g,'mag',.1,-.2,0);mag.add(P(B(new T.Group(),[[.1,.34,.09,E.metalD,0,0,0]])));
  g.userData.muzzle=new T.Vector3(1.0,.07,0);g.userData.len=1.0;return g;
}
function gunShotgun(){
  const g=new T.Group(),b=B(new T.Group(),[[.3,.19,.15,E.steel,.08,.04,0],[.42,.2,.12,M.wood,-.27,-.05,0],[.14,.24,.12,M.wood,.05,-.15,0,0,0,.3]]);
  const bar=cyl(.05,.05,.92,E.metalD,.66,.09,0,b,8);bar.rotation.z=Math.PI/2;
  const tube=cyl(.038,.038,.8,E.steel,.58,-.02,0,b,8);tube.rotation.z=Math.PI/2;
  g.add(P(b));const pump=J(g,'pump',.5,-.05,0);pump.add(P(B(new T.Group(),[[.26,.15,.15,M.wood,0,0,0]])));
  g.userData.muzzle=new T.Vector3(1.13,.09,0);g.userData.len=1.13;return g;
}
function gunSniper(){
  const g=new T.Group(),b=B(new T.Group(),[[.52,.17,.12,E.steel,.1,.03,0],[.62,.2,.12,M.wood,-.36,-.05,0],[.3,.08,.12,M.wood,-.1,.09,0],
    [.1,.24,.08,E.metalD,.02,-.17,0],[.14,.26,.11,M.wood,-.03,-.14,0,0,0,.3]]);
  const bar=cyl(.038,.038,.92,E.metalD,.82,.06,0,b,8);bar.rotation.z=Math.PI/2;
  const sc=cyl(.07,.07,.36,E.metalD,.12,.2,0,b,10);sc.rotation.z=Math.PI/2;
  g.add(P(b));const lens=disc(.055,0x9ff5e6,.305,.2,0,g);lens.rotation.y=Math.PI/2;
  g.userData.muzzle=new T.Vector3(1.29,.06,0);g.userData.len=1.29;return g;
}

/* ---------------- 主角 ---------------- */
function mkPlayer(){
  const r=new T.Group();
  const torso=PB(r,'torso',0,.92,0,[
    [.6,.56,.42,E.rust,0,.4,0],[.8,.14,.5,M.dark,0,.12,0],[.2,.5,.46,M.cream,.17,.44,0],[.62,.1,.46,M.amber,0,.64,0],
    [.22,.5,.46,M.bone,-.14,.42,0],[.14,.5,.46,M.dark,.04,.4,0],[.26,.3,.44,E.slate,-.08,.36,0]
  ]);
  const head=PB(torso,'head',0,.7,0,[
    [.42,.4,.42,E.skin,0,.22,0],[.48,.16,.48,M.coral,0,.42,0],[.5,.06,.5,M.coral,0,.35,0],[.3,.14,.2,M.coral,.1,.6,0]
  ]);
  eye(head,.1,0xffd36a,.22,.28,.11,'g1');eye(head,.1,0xffd36a,.22,.28,-.11,'g2');
  PB(torso,'scarf',0,.62,0,[[.5,.16,.5,M.teal,0,0,0],[.16,.3,.14,M.teal,.18,-.12,.2,0,0,.2]]);
  // 持枪臂：沿 +x 伸出；枪挂在 armF/gun
  const armF=PB(torso,'armF',.04,.56,.26,[[.4,.17,.17,E.rust,.2,0,0],[.14,.16,.16,E.skin,.44,0,0],[.24,.2,.2,M.dark,.12,.02,0]]);
  J(armF,'gun',.42,.04,0);
  PB(torso,'armB',.04,.56,-.26,[[.56,.15,.15,E.rust,.28,0,0],[.14,.14,.14,E.skin,.6,0,0]]);
  for(const [n,z] of [['legF',.15],['legB',-.15]]){
    const l=PB(torso,n,0,-.02,z,[[.26,.46,.3,E.gb,0,-.22,0],[.2,.16,.32,M.amber,.05,-.36,0]]);
    PB(l,'knee'+n.slice(3),0,-.46,0,[[.24,.44,.28,E.gb,0,-.22,0],[.34,.16,.3,M.dark,.07,-.43,0],[.36,.1,.32,M.dark,.07,-.5,0]]);
  }
  // 围巾尾巴（4 节链）
  let sp=J(torso,'sc0',-.22,.62,-.12);
  for(let i=0;i<4;i++){sp.add(P(B(new T.Group(),[[.24,.15,.12,M.teal,-.11,0,0]])));sp=J(sp,'sc'+(i+1),-.22,0,0)}
  return r;
}

/* ---------------- 通用双足机器 ---------------- */
function humanoid(o){
  const r=new T.Group(),c=o.c,ly=o.legY||.95;
  for(const [n,z] of [['legF',.14],['legB',-.14]]){
    const l=PB(r,n,0,ly,z,[[.26,.46,.28,c.leg,0,-.23,0],[.28,.1,.3,M.dark,0,-.38,0]]);
    PB(l,'knee'+n.slice(3),0,-.46,0,[[.24,.44,.26,c.leg,0,-.22,0],[.3,.16,.38,M.dark,.06,-.44,0]]);
  }
  const torso=PB(r,'torso',0,ly,0,o.torso);
  const head=PB(torso,'head',0,o.headY||.76,0,o.head);
  eye(head,o.eyeR||.07,c.eye,.25,.26,.1);eye(head,o.eyeR||.07,c.eye,.25,.26,-.1);
  let armF,armB;
  if(o.gun){
    armF=PB(torso,'armF',.05,.6,.3,[[.16,.34,.16,c.arm,0,-.17,0],[.36,.15,.15,c.arm,.16,-.34,0],[.14,.14,.14,M.dark,.36,-.34,0]]);
    J(armF,'gun',.36,-.34,.02);
    armB=PB(torso,'armB',.05,.6,-.3,[[.16,.34,.16,c.arm,0,-.17,0],[.5,.14,.14,c.arm,.25,-.34,0]]);
  }else{
    armF=PB(torso,'armF',0,.62,.3,[[.17,.42,.17,c.arm,0,-.2,0],[.18,.2,.18,M.dark,0,-.44,0]]);
    armB=PB(torso,'armB',0,.62,-.3,[[.17,.42,.17,c.arm,0,-.2,0],[.18,.2,.18,M.dark,0,-.44,0]]);
  }
  return {r,torso,head,armF,armB,ly};
}
function rail(g,x,len,r=E.black){const b=cyl(r,r,len,E.black,x,0,0,g,6);b.rotation.z=Math.PI/2;return b}
const GUN_SMALL=[[.5,.11,.1,E.metalD,.2,0,0],[.08,.22,.08,E.black,.05,-.14,0]];
function mkGunLong(){const g=new T.Group();B(g,[[.6,.13,.1,E.metalD,.1,0,0],[.1,.2,.08,E.black,.02,-.13,0],[.3,.14,.1,M.wood,-.25,0,0]]);rail(g,.7,.6,.03);return g}
function addGun(arm,g){arm.getObjectByName('gun').add(P(Array.isArray(g)?B(new T.Group(),g):(g||mkGunLong())))}

const lib={};
function def(id,fn){lib[id]=fn()}

/* ---------- 敌人 ---------- */
def('player',mkPlayer);
def('ripper',()=>{
  const c={leg:E.metalD,body:E.red,head:E.metal,arm:E.metalD,eye:0xff4a3c};
  const r=new T.Group();
  const torso=PB(r,'torso',0,.36,0,[[.62,.48,.5,c.body,0,.3,0],[.4,.16,.52,E.black,0,.56,0],[.3,.3,.2,E.metalD,-.3,.3,-.2],[.3,.3,.2,E.metalD,-.3,.3,.2]]);
  const head=PB(torso,'head',.2,.6,0,[[.38,.32,.36,c.head,0,.14,0],[.1,.3,.3,E.black,.2,.14,0],[.08,.14,.06,E.yel,-.05,.34,0]]);
  eye(head,.09,c.eye,.26,.16,.08);eye(head,.09,c.eye,.26,.16,-.08);
  for(const [n,z] of [['legF',.17],['legB',-.17]])PB(r,n,0,.36,z,[[.22,.36,.22,c.leg,0,-.17,0],[.26,.12,.3,E.black,.05,-.36,0]]);
  // 锯刃臂
  const arm=PB(torso,'armF',.05,.5,.32,[[.16,.4,.16,c.arm,0,-.2,0]]);
  const bl=B(new T.Group(),[[.2,.4,.2,M.dark,0,-.4,0],[.5,.34,.06,E.steel,.42,-.5,0,0,0,-.35]]);
  for(let i=0;i<4;i++)cone(.07,.16,E.steel,.3+i*.15,-.36-i*.052,0,bl,4).rotation.z=-Math.PI/2+1.1;
  arm.add(P(bl));
  PB(torso,'armB',.05,.5,-.3,[[.15,.36,.15,c.arm,0,-.18,0],[.14,.3,.14,E.steel,.1,-.42,0,0,0,.5]]);
  return r;
});
def('warden',()=>{
  const h=humanoid({c:{leg:E.slate,body:E.gb,head:E.slate,arm:E.gb,eye:0xffc86a},gun:true,
    torso:[[.64,.72,.46,E.gb,0,.42,0],[.5,.4,.06,E.slate,.3,.48,0],[.7,.14,.5,M.dark,0,.12,0],[.36,.5,.34,E.metalD,-.3,.46,0],[.2,.1,.3,E.yel,-.46,.6,0]],
    head:[[.42,.36,.42,E.slate,0,.24,0],[.48,.1,.48,E.slate,0,.42,0],[.14,.12,.3,E.black,.2,.26,0],[.06,.2,.06,E.yel,-.1,.5,.1]],
    headY:.76});
  addGun(h.armF);return h.r;
});
def('hauler',()=>{
  const r=new T.Group();
  const torso=PB(r,'torso',0,.5,0,[[1.3,.66,.9,E.rust,0,.5,0],[1.1,.2,.94,E.rustD,0,.86,0],[.5,.34,.5,E.yel,.3,1.12,0],[.5,.1,.52,E.rustD,.3,1.3,0],
    [.9,.14,.94,E.metalD,0,.2,0],[.36,.5,.3,E.rustD,-.2,.55,.5],[.36,.5,.3,E.rustD,-.2,.55,-.5]]);
  eye(torso,.09,0xff4a3c,.56,1.14,.14);eye(torso,.09,0xff4a3c,.56,1.14,-.14);
  for(const z of [.28,-.28]){cyl(.07,.07,.5,E.metalD,-.42,1.3,z,torso,6);disc(.07,0xff8a4c,-.42,1.56,z,torso)}
  for(const [n,z] of [['legF',.36],['legB',-.36]]){
    const l=PB(r,n,0,.5,z,[[.3,.34,.3,E.metalD,0,-.15,0],[.2,.3,.2,E.steel,0,-.4,0]]);
    PB(l,'knee'+n.slice(3),0,-.5,0,[[.24,.3,.24,E.metal,0,-.12,0],[.44,.2,.5,E.metalD,.08,-.3,0]]);
  }
  // 正面推土铲（装甲）
  const blade=J(r,'blade',.68,.5,0);const bg=B(new T.Group(),[]);bands(bg,.16,1.2,.9,0,.1,0,6);
  B(bg,[[.3,.14,.14,E.metalD,-.14,1.1,0],[.3,.14,.14,E.metalD,-.14,-.9,0],[.3,.12,.12,E.metalD,-.16,.1,.3],[.3,.12,.12,E.metalD,-.16,.1,-.3]]);
  blade.add(P(bg));
  // 砸地拳
  PB(torso,'fist',.4,.7,.62,[[.18,.4,.18,E.metalD,0,-.2,0],[.42,.36,.36,E.metal,0,-.5,0]]);
  PB(torso,'fist2',.4,.7,-.62,[[.18,.4,.18,E.metalD,0,-.2,0],[.36,.3,.3,E.metalD,0,-.46,0]]);
  return r;
});
def('spotter',()=>{
  const r=new T.Group();
  for(const [n,z] of [['legF',.24],['legB',-.24]]){
    const l=PB(r,n,0,1.3,z,[[.13,.62,.13,E.metal,0,-.3,0],[.1,.2,.2,E.yel,0,-.5,0]]);
    PB(l,'knee'+n.slice(3),0,-.62,0,[[.11,.6,.11,E.metalD,0,-.3,0],[.4,.1,.3,M.dark,.1,-.56,0]]);
  }
  const torso=PB(r,'torso',0,1.3,0,[[.5,.42,.5,E.gb,0,.24,0],[.36,.3,.54,E.slate,0,.5,0],[.3,.5,.3,E.metalD,-.3,.3,0]]);
  const head=PB(torso,'head',.08,.74,0,[[.4,.34,.4,E.slate,0,.16,0],[.5,.1,.44,E.slate,0,.34,0],[.1,.26,.3,E.black,.2,.16,0]]);
  const lens=cyl(.16,.19,.12,E.metalD,.3,.16,0,head,12);lens.rotation.z=Math.PI/2;eye(head,.13,0x9ff5e6,.37,.16,0);
  const arm=PB(torso,'armF',.05,.3,.3,[[.16,.3,.16,E.gb,0,-.15,0],[.14,.4,.14,E.gb,.22,-.22,0]]);
  const g=new T.Group();B(g,[[.6,.14,.12,E.slate,.1,0,0],[.14,.26,.1,E.black,.02,-.16,0]]);rail(g,1.1,1.5,.035);
  const mz=cyl(.07,.06,.2,E.slate,1.9,.03,0,g,8);mz.rotation.z=Math.PI/2;
  J(arm,'gun',.08,-.3,.02).add(P(g));
  return r;
});
def('popper',()=>{
  const r=new T.Group();
  const torso=PB(r,'torso',0,.18,0,[[.62,.62,.62,E.black,0,.42,0],[.66,.14,.66,E.metalD,0,.6,0],[.66,.14,.66,E.metalD,0,.26,0],[.3,.12,.66,E.red,0,.74,0]]);
  const st=B(new T.Group(),[]);bands(st,.64,.28,.64,0,.43,0,3);torso.add(P(st));
  eye(torso,.1,0xff4a3c,.32,.46,.1);eye(torso,.1,0xff4a3c,.32,.46,-.1);
  const fuse=PB(torso,'fuse',0,.8,0,[[.08,.2,.08,E.metalD,0,.1,0],[.2,.1,.2,E.red,0,.22,0]]);
  disc(.11,0xffd36a,0,.32,0,fuse).name='spark';
  for(const [n,z] of [['legF',.2],['legB',-.2]])PB(r,n,0,.18,z,[[.16,.16,.16,E.metalD,0,-.08,0],[.2,.1,.24,E.metalD,.04,-.15,0]]);
  return r;
});
def('bulwark',()=>{
  const h=humanoid({c:{leg:E.metal,body:E.metalD,head:E.metal,arm:E.metal,eye:0xffc86a},gun:true,
    torso:[[.68,.76,.5,E.metalD,0,.44,0],[.5,.44,.08,E.metal,.3,.5,0],[.76,.14,.54,M.black,0,.12,0],[.4,.5,.36,E.black,-.32,.5,0],[.24,.1,.3,E.dkRed,-.48,.66,0]],
    head:[[.44,.36,.44,E.metal,0,.24,0],[.5,.08,.48,E.metalD,0,.44,0],[.16,.12,.3,E.black,.21,.26,0]],headY:.78});
  addGun(h.armF,GUN_SMALL);
  const sh=J(h.r,'shield',.5,.1,0);const sg=B(new T.Group(),[[.14,1.7,.9,E.steel,0,.85,0],[.18,.1,.94,E.dkRed,0,1.66,0],[.18,.1,.94,E.dkRed,0,.06,0],[.2,.3,.2,E.yel,.02,.9,0]]);
  bands(sg,.16,.2,.9,0,.5,0,2);sh.add(P(sg));
  return h.r;
});
def('drone',()=>{
  const r=new T.Group();
  const torso=PB(r,'torso',0,0,0,[[.6,.3,.6,E.metalD,0,0,0],[.4,.12,.4,E.gb,0,.2,0],[.2,.16,.2,E.black,0,-.2,0]]);
  eye(torso,.08,0xff4a3c,.31,.02,0);
  let n=0;
  for(const [x,z] of [[.36,.36],[-.36,.36],[.36,-.36],[-.36,-.36]]){
    box(.4,.06,.08,E.metal,x*.6,0,z*.6,torso).rotation.y=Math.atan2(z,x);
    const ro=J(torso,'rot'+n++,x,.06,z);cyl(.3,.3,.025,E.black,0,0,0,ro,10);box(.5,.03,.04,E.slate,0,.02,0,ro);
  }
  PB(torso,'gun',.1,-.26,0,[[.4,.1,.1,E.black,.1,0,0]]);
  return r;
});
def('husk',()=>{
  const h=humanoid({c:{leg:E.khaki,body:E.bone,head:E.bone,arm:E.khaki,eye:0x9ff5e6},gun:false,eyeR:.06,
    torso:[[.6,.72,.44,E.bone,0,.42,0],[.66,.14,.46,E.olive,0,.14,0],[.5,.4,.46,E.khaki,0,.62,0],[.3,.5,.3,E.olive,-.3,.44,0]],
    head:[[.42,.4,.42,E.khaki,0,.2,0],[.5,.26,.5,E.bone,0,.4,0],[.46,.1,.46,E.khaki,0,.26,0],[.3,.2,.46,M.dark,0,.06,0]]});
  const pl=J(h.r,'plate',.3,1.0,0);
  pl.add(P(B(new T.Group(),[[.1,.6,.5,E.steel,0,.3,0],[.14,.1,.54,E.metalD,0,.6,0],[.14,.1,.54,E.metalD,0,.02,0],[.16,.1,.14,E.metalD,.02,.3,.2],[.16,.1,.14,E.metalD,.02,.3,-.2]])));
  const jar=J(h.armF,'jar',0,-.5,0);cyl(.1,.13,.3,E.sand,0,.12,0,jar,8);cyl(.06,.08,.1,E.rustD,0,.31,0,jar,8);
  return h.r;
});
def('worm',()=>{
  const r=new T.Group();
  let par=r,x=-.5;const segs=[];
  for(let i=0;i<3;i++){
    const s=PB(par,'seg'+i,x,0,0,[[.7,.62,.62,[E.metalD,E.rustD,E.rust][i],0,.3,0],[.5,.12,.56,E.sandL,0,.58,0]]);
    box(.16,.3,.06,E.red,-.1,.78,0,s).rotation.z=-.4;segs.push(s);par=s;x=-.62;
  }
  const head=PB(segs[2],'head',.6,0,0,[[.5,.56,.56,E.rustD,0,.28,0]]);
  const up=PB(head,'jawU',.2,.5,0,[[.44,.16,.5,E.bone,0,0,0]]),lo=PB(head,'jawL',.2,.08,0,[[.44,.14,.5,E.bone,0,0,0]]);
  for(let i=0;i<4;i++){cone(.05,.1,E.white,.14+i*.1,.06,.18,up,4).rotation.z=Math.PI;cone(.05,.1,E.white,.14+i*.1,-.05,.18,lo,4)}
  eye(head,.07,0xff4a3c,.24,.5,.2);eye(head,.07,0xff4a3c,.24,.5,-.2);
  return r;
});

/* ---------- Boss ---------- */
def('butcher',()=>{
  const r=new T.Group();
  const torso=PB(r,'torso',0,1.3,0,[[1.9,1.5,1.5,E.red,.2,.8,0],[1.5,.4,1.6,E.black,.2,1.6,0],[1.2,.5,.9,E.metalD,-.3,1.95,0],[1.6,.3,1.56,E.rustD,.2,.1,0]]);
  const head=PB(torso,'head',.9,1.7,0,[[.7,.6,.6,E.metal,0,.3,0],[.2,.3,.5,E.black,.4,.3,0],[.1,.4,.1,E.yel,-.1,.7,0]]);
  eye(head,.14,0xff4a3c,.48,.34,.16);eye(head,.14,0xff4a3c,.48,.34,-.16);
  for(const [n,z] of [['legF',.5],['legB',-.5]]){
    const l=PB(r,n,0,1.3,z,[[.6,.8,.6,E.metalD,0,-.4,0],[.5,.3,.62,E.yel,0,-.2,0]]);
    PB(l,'knee'+n.slice(3),0,-.8,0,[[.56,.7,.56,E.metal,0,-.3,0],[.9,.4,1.0,E.metalD,.15,-.6,0]]);
  }
  // 巨型圆锯
  const arm=PB(torso,'armF',.6,1.2,.9,[[.4,.9,.4,E.metalD,0,-.4,0]]);
  const saw=J(arm,'saw',.3,-.9,0);const d0=cyl(1.1,1.1,.14,E.steel,0,0,0,saw,22);d0.rotation.x=Math.PI/2;
  for(let i=0;i<12;i++){const a=i/12*Math.PI*2;const th=box(.34,.3,.1,E.steel,Math.cos(a)*1.16,Math.sin(a)*1.16,0,saw);th.rotation.z=a}
  cyl(.2,.2,.2,E.dkRed,0,0,0,saw,10).rotation.x=Math.PI/2;
  const eng=PB(torso,'engine',-.9,.9,0,[[.5,.9,1.0,E.metalD,0,0,0],[.3,.3,.3,E.metal,-.3,.3,.3],[.3,.3,.3,E.metal,-.3,.3,-.3]]);
  const v=disc(.2,0xff8a4c,-.25,.2,0,eng);v.rotation.y=-Math.PI/2;v.name='vent';
  PB(torso,'armB',.6,1.2,-.9,[[.4,1.0,.4,E.metalD,0,-.5,0],[.7,.6,.6,E.metal,.1,-1.1,0]]);
  return r;
});
def('commander',()=>{
  const r=new T.Group();
  for(const [n,z] of [['legF',.3],['legB',-.3]]){
    const l=PB(r,n,0,2.0,z,[[.6,.9,.6,E.slate,0,-.45,0],[.4,.4,.64,E.gb,0,-.2,0]]);
    PB(l,'knee'+n.slice(3),0,-.9,0,[[.56,.9,.56,E.metalD,0,-.4,0],[.8,.5,1.0,E.metalD,.2,-.7,0]]);
  }
  const torso=PB(r,'torso',0,2.0,0,[[1.3,1.6,1.1,E.gb,0,1.0,0],[1.0,.8,.1,E.slate,.62,1.2,0],[1.5,.3,1.2,E.dkRed,0,.3,0],[.8,.6,.8,E.metalD,-.5,1.9,0]]);
  const lamp=disc(.18,0xffd36a,.68,1.2,0,torso);lamp.rotation.y=Math.PI/2;lamp.name='chest';
  const head=PB(torso,'head',.2,1.9,0,[[.7,.6,.7,E.slate,0,.3,0],[.8,.14,.8,E.yel,0,.6,0],[.1,.4,.1,E.yel,-.2,.9,0],[.2,.26,.5,E.black,.38,.34,0]]);
  eye(head,.13,0xffc86a,.5,.34,.14);eye(head,.13,0xffc86a,.5,.34,-.14);
  const arm=PB(torso,'armF',.5,1.4,.7,[[.4,.8,.4,E.slate,0,-.4,0]]);
  const cannon=J(arm,'cannon',.1,-.8,0);cannon.add(P(B(new T.Group(),[[.9,.7,.7,E.metalD,0,0,0]])));
  for(const [y,z] of [[.16,.16],[-.16,.16],[.16,-.16],[-.16,-.16]])rail(cannon,.5,1.3,.08).position.set(.5,y*1.6,z*1.6);
  PB(torso,'pack',-.85,1.1,0,[[.5,1.1,.9,E.metalD,0,0,0],[.2,.4,.2,E.metal,-.2,.4,.3],[.2,.4,.2,E.metal,-.2,.4,-.3]]);
  PB(torso,'armB',.5,1.4,-.7,[[.4,1.2,.4,E.slate,0,-.6,0],[.7,.7,.7,E.metalD,.1,-1.3,0]]);
  return r;
});
def('siege',()=>{
  const r=new T.Group();
  const torso=PB(r,'torso',0,1.2,0,[[2.2,1.6,1.7,E.rust,.1,1.0,0],[1.8,.4,1.8,E.rustD,.1,1.9,0],[1.0,.6,.8,E.yel,.7,2.2,0],[.9,.16,.84,E.rustD,.7,2.56,0],
    [1.6,.3,1.8,E.metalD,0,.2,0],[.5,.7,.4,E.metalD,-.3,1.6,.6],[.5,.7,.4,E.metalD,-.3,1.6,-.6]]);
  eye(torso,.14,0xff4a3c,1.02,2.28,.2);eye(torso,.14,0xff4a3c,1.02,2.28,-.2);
  for(const z of [.5,-.5]){cyl(.12,.12,.8,E.metalD,-.7,2.4,z,torso,8);disc(.12,0xff8a4c,-.7,2.82,z,torso)}
  for(const [n,z] of [['legF',.7],['legB',-.7]]){
    const l=PB(r,n,0,1.2,z,[[.7,.7,.6,E.metalD,0,-.3,0]]);
    PB(l,'knee'+n.slice(3),0,-.7,0,[[.6,.5,.5,E.metal,0,-.2,0],[1.2,.5,1.0,E.metalD,.2,-.5,0]]);
  }
  // 攻城锤臂
  const arm=PB(torso,'armF',.9,1.9,.9,[[.5,1.3,.5,E.metalD,0,-.6,0]]);
  PB(arm,'hammer',.2,-1.4,0,[[1.1,.9,.9,E.metal,.3,0,0],[.8,.2,.94,E.yel,.3,.35,0],[.5,.6,.5,E.metalD,-.4,-.2,0]]);
  const vg=B(new T.Group(),[]);bands(vg,.42,1.0,1.0,0,0,0,5,E.metal,E.metalD);
  const vents=PB(torso,'vents',-.95,1.0,0,[]);vents.add(P(vg));
  const v=disc(.28,0xff8a4c,-.22,0,0,vents);v.rotation.y=-Math.PI/2;v.name='vent';
  return r;
});
def('carrier',()=>{
  const r=new T.Group();
  const torso=PB(r,'torso',0,2.4,0,[[2.6,1.8,2.0,E.olive,.2,1.0,0],[2.0,.5,1.6,E.khaki,.2,2.1,0],[1.2,.6,.6,E.metalD,-.6,2.0,0],[2.6,.3,2.0,E.metalD,.1,.1,0]]);
  eye(torso,.16,0xff4a3c,1.52,1.1,.3);eye(torso,.16,0xff4a3c,1.52,1.1,-.3);
  for(const z of [.8,-.8])for(const x of [.7,-.4]){
    const l=PB(r,'leg'+x+z,0,2.4,z,[[.4,.4,.4,E.metalD,x*.6,-.2,0]]);const l2=J(l,'l',x*.8,-.3,0);
    l2.add(P(B(new T.Group(),[[.3,1.5,.3,E.metal,0,-.7,0],[.6,.3,.7,E.metalD,.1,-1.45,0]])));
  }
  // 机库门
  const hang=PB(torso,'hangar',.5,.9,.9,[[1.4,1.1,.12,E.slate,0,0,0]]);disc(.3,0x9ff5e6,0,0,.07,hang).name='doorLamp';
  for(const z of [.5,-.5]){const c=J(torso,'cannon'+z,.9,2.0,z);c.add(P(B(new T.Group(),[[.5,.5,.5,E.metalD,0,0,0]])));rail(c,.9,1.4,.1)}
  return r;
});
def('maw',()=>{
  const r=new T.Group();
  const body=PB(r,'torso',0,0,0,[[2.0,2.4,2.2,E.rustD,0,1.2,0],[1.2,2.0,1.2,E.rust,-1.2,1.1,0]]);
  for(let i=0;i<3;i++)box(1.0,.3,1.0,E.sandL,-.8-i*.6,2.5-i*.1,0,body);
  const head=PB(body,'head',1.3,1.2,0,[[.9,2.0,2.0,E.rust,0,0,0]]);
  const up=PB(head,'jawU',.3,.9,0,[[.9,.7,2.0,E.rustD,0,.3,0]]),lo=PB(head,'jawL',.3,-.9,0,[[.9,.6,2.0,E.rustD,0,-.3,0]]);
  for(let i=0;i<5;i++)for(const z of [-.7,-.35,0,.35,.7]){cone(.14,.36,E.white,.36,.04,z,up,4).rotation.z=-Math.PI;cone(.14,.36,E.white,.36,-.04,z,lo,4)}
  for(const z of [.6,-.6]){eye(head,.16,0xff4a3c,.3,.9,z);eye(head,.16,0xff4a3c,.3,-.9,z)}
  const belly=PB(body,'belly',.3,-.5,1.1,[[1.2,1.0,.2,E.sandL,0,0,0]]);disc(.42,0xffe08a,.1,.1,0,belly).name='glow';
  return r;
});
def('titan',()=>{
  const r=new T.Group();
  for(const [n,z] of [['legF',.5],['legB',-.5]]){
    const l=PB(r,n,0,4.0,z,[[.6,2.0,.6,E.metal,0,-1.0,0],[.3,1.0,.66,E.yel,0,-.4,0]]);
    PB(l,'knee'+n.slice(3),0,-2.0,0,[[.56,1.6,.56,E.metalD,0,-.8,0],[.9,.5,1.0,E.metalD,.15,-1.6,0]]);
  }
  const torso=PB(r,'torso',0,4.0,0,[[1.6,2.4,1.4,E.gb,0,1.3,0],[1.2,1.6,.2,E.metal,.8,1.4,0],[1.0,.3,1.0,E.metalD,0,2.6,0]]);
  const core=PB(torso,'core',.9,1.5,0,[[.3,.8,.8,E.metalD,0,0,0]]);
  const cl=disc(.34,0xffd36a,.17,0,0,core);cl.rotation.y=Math.PI/2;cl.name='core';
  const head=PB(torso,'head',.2,2.8,0,[[.8,.7,.8,E.slate,0,.3,0],[.3,.4,.3,E.metalD,-.3,.7,0]]);
  eye(head,.14,0xff4a3c,.5,.34,.16);eye(head,.14,0xff4a3c,.5,.34,-.16);
  const arm=PB(torso,'armF',.7,2.2,.9,[[.5,1.2,.5,E.metal,0,-.6,0]]);
  PB(arm,'hammer',.1,-1.4,0,[[.8,1.0,1.0,E.metalD,.1,0,0],[.6,.2,1.04,E.yel,.1,.4,0]]);
  PB(torso,'armB',.7,2.2,-.9,[[.5,1.6,.5,E.metal,0,-.8,0],[.6,.8,.8,E.metalD,.1,-1.7,0]]);
  for(const z of [.5,-.5])cyl(.1,.1,1.2,E.metalD,-.7,2.8,z,torso,6);
  return r;
});

/* ---------- 拾取物 / 道具 ---------- */
const PICK_COL={rifle:0x58768a,pistol:0xdca820,shotgun:0xb45e2e,sniper:0x56c2b6,dual:0xdca820};
def('ammo',()=>{const r=new T.Group();PB(r,'b',0,0,0,[[.44,.3,.3,E.slate,0,.15,0],[.46,.08,.32,E.metalD,0,.3,0],[.1,.3,.32,E.yel,0,.15,0]]);return r});
def('med',()=>{const r=new T.Group();PB(r,'b',0,0,0,[[.4,.3,.3,E.white,0,.15,0],[.3,.09,.31,E.red,0,.15,0],[.09,.3,.31,E.red,0,.15,0]]);return r});
def('crate',()=>{const r=new T.Group();PB(r,'b',0,0,0,[[.9,.7,.7,E.olive,0,.35,0],[.94,.1,.74,E.khaki,0,.66,0],[.1,.7,.74,E.yel,0,.35,0]]);return r});
def('armor',()=>{const r=new T.Group();PB(r,'b',0,0,0,[[.4,.36,.14,E.steel,0,.2,0],[.1,.3,.16,E.yel,0,.2,0]]);return r});
def('nade',()=>{const r=new T.Group();cyl(.12,.14,.26,E.olive,0,0,0,r,8);cyl(.04,.04,.1,E.metalD,0,.17,0,r,6);return r});
def('jar',()=>{const r=new T.Group();cyl(.16,.2,.4,E.sand,0,0,0,r,8);cyl(.09,.12,.12,E.rustD,0,.25,0,r,8);return r});
def('rock',()=>{const r=new T.Group();ball(.3,E.sandD,0,0,0,r).scale.set(1,.8,.9);return r});
def('hook',()=>{const r=new T.Group(),g=new T.Group();torus(.14,.05,E.steel,0,0,0,g,5).rotation.x=Math.PI/2;
  box(.08,.2,.08,E.metalD,0,.14,0,g);box(.14,.1,.1,E.yel,0,-.1,0,g);r.add(P(g));return r});
def('shell',()=>{const r=new T.Group();cyl(.14,.14,.4,E.metalD,0,0,0,r,8);cone(.14,.2,E.red,0,.3,0,r,8);return r});

/* ---------------- 对外接口 ---------------- */
function parts(root){const o={};root.traverse(x=>{if(x.name)o[x.name]=x});return o}
function spawn(id,parent){
  const c=lib[id].clone(true);CL.ink.reg(c);(parent||CL.ents).add(c);
  c.userData.parts=parts(c);return c;
}
// 精英：放大 + 金冠 + 红眼
function elite(m,scale=1.35){
  m.scale.multiplyScalar(scale);
  const p=parts(m),h=p.head;
  if(h){const cr=new T.Group();cr.add(P(B(new T.Group(),[[.3,.1,.3,E.yel,0,.5,0],[.07,.2,.07,E.yel,.1,.62,.1],[.07,.2,.07,E.yel,-.1,.62,-.1],[.07,.2,.07,E.yel,0,.62,.1],[.07,.2,.07,E.yel,0,.62,-.1]])));h.add(cr)}
  m.traverse(o=>{if(o.name==='eye')o.material=CL.flat(0xff2a1c)});
  m.userData.elite=true;return m;
}
let shadowGeo=null;
function shadow(){
  if(!shadowGeo)shadowGeo=new T.CircleGeometry(1,18);
  const m=new T.Mesh(shadowGeo,new T.MeshBasicMaterial({color:0x1c1713,transparent:true,opacity:.3,depthWrite:false}));
  m.rotation.x=-Math.PI/2;m.layers.set(1);m.userData.noInk=true;m.renderOrder=-1;return m;
}
// 地面圈 / 地面条（预警标记与落点）
function ring(r0,r1,color,op=.8){
  const m=new T.Mesh(new T.RingGeometry(r0,r1,44),new T.MeshBasicMaterial({color,transparent:true,opacity:op,depthWrite:false,side:T.DoubleSide}));
  m.rotation.x=-Math.PI/2;m.layers.set(1);m.userData.noInk=true;m.renderOrder=1;return m;
}
function bar(w,d,color,op=.8){
  const m=new T.Mesh(new T.PlaneGeometry(w,d),new T.MeshBasicMaterial({color,transparent:true,opacity:op,depthWrite:false,side:T.DoubleSide}));
  m.rotation.x=-Math.PI/2;m.layers.set(1);m.userData.noInk=true;m.renderOrder=1;return m;
}
CL.models={lib,def,spawn,parts,elite,shadow,ring,bar,B,P,J,PB,eye,stripes:bands,
  guns:{pistol:gunPistol,rifle:gunRifle,shotgun:gunShotgun,sniper:gunSniper,dual:gunPistol},PICK_COL};
})();
