/* ========================================================================
 * CLANG! 2.5D — 58 战斗核心：状态 / 子弹 / 手雷 / 抛射物 / 爆炸 / 受击 / 拾取 / 连杀 / 特效
 * 玩法平面 z=0；实体模型带 z 偏移做视差，命中判定只看 (x,y)
 * ====================================================================== */
(function(){
'use strict';
const T=THREE,CL=window.CL,{clamp,rnd,rndi,pick,segCircle,TAU}=CL;
const R=CL.render,MD=CL.models;
const GRAV=42,XMAX=25.2,BZ=1.25;
const ents=new T.Group();ents.name='ents';
const fxLayer=new T.Group();fxLayer.name='fx';
R.scene.add(ents,fxLayer);CL.ents=ents;CL.fxLayer=fxLayer;

/* ---------- 全局状态 ---------- */
const G=CL.G={
  state:'title',t:0,hitstop:0,level:1,diff:'normal',DV:null,score:0,levelScore0:0,endless:false,tier:0,
  mouse:{x:0,y:0,down:false,rdown:false},keys:{},aim:{x:6,y:1.5},
  P:null,enemies:[],boss:null,bullets:[],ebullets:[],lobs:[],nades:[],pickups:[],teles:[],pend:[],
  combo:{n:0,t:0,pts:0,tmax:4},stats:null,wind:0,slow:1,
  has:()=>false,onBulletHit:null,onPick:null,onKill:null
};
const newStats=()=>({kills:0,head:0,headKills:0,shots:0,hits:0,dmg:0,deaths:0,exec:0,maxCombo:0,time:0,bossKills:0,eliteKills:0,cards:0});
G.stats=newStats();
const comboRank=()=>{const p=G.combo.pts;return p>=80?'S':p>=48?'A':p>=22?'B':'C'};
const comboMult=()=>{const p=G.combo.pts;return p>=80?2:p>=48?1.6:p>=22?1.25:1};
const after=(t,fn)=>G.pend.push({t,fn});
CL.comboRank=comboRank;CL.comboMult=comboMult;CL.after=after;CL.newStats=newStats;
function addScore(n){const v=Math.round(n*comboMult());G.score+=v;return v}
function addCombo(pts){
  const c=G.combo;c.n++;c.t=c.tmax;c.pts=Math.min(99,c.pts+pts);
  G.stats.maxCombo=Math.max(G.stats.maxCombo,c.n);
}

/* ---------- 受击 ---------- */
// o: {x,y,dir,fromFront,ap,head,low,part,weapon,blast,gen,d0,noGuard,silent}
function hitEnemy(e,dmg,o={}){
  if(!e||!e.alive)return 0;
  if(e.preHit)return e.preHit(dmg,o); // Boss：护甲条 / 弱点 / 阶段
  if(!(dmg>0)){if(dmg!==dmg&&!window.__nan)window.__nan={id:e.id,weapon:o.weapon,part:o.part,o:JSON.stringify(o),stack:String(new Error().stack).split('\n').slice(2,7).join(' | ')};return 0}
  const ap=o.ap||0,hx=o.x??e.x,hy=o.y??e.y+e.def.height*.5;
  if(e.def.guard&&!e.boss&&!o.noGuard&&!o.blast&&G.t-(e.guardAt||-9)>2.5&&Math.random()<e.def.guard){
    e.guardAt=G.t;e.flash=.06;
    sparks(hx,hy,7,0xf1ece2);stamp('CLANG!',hx,hy+.4,'#f1ece2',.95,.12);CL.AU.clangSfx();return 0;
  }
  let d=dmg;
  if(e.def.armour&&!e.melt&&o.fromFront&&!o.blast&&ap<1)d*=((1-ap)*e.def.armour+ap);
  // 沙骸钢板：挡正面躯干
  if(e.plateHp>0&&o.fromFront&&!o.head&&!o.low&&ap<1&&!o.blast){
    const red=Math.min(d,e.plateHp);e.plateHp-=d;e.flash=.05;sparks(hx,hy,4,0xc3c9c9);
    if(e.plateHp<=0){e.plate.visible=false;debris(e.x+.3,e.y+1.2,[0x7c8086,0x3f4247],7,8);stamp('KA-CHUNK',e.x,e.y+1.7,'#f1ece2',1.1,.2);CL.AU.clangSfx()}
    else CL.AU.hit(false);
    return red;
  }
  // 盾卫护盾：挡正面（熔蚀后承伤 +50%）
  if(e.shieldHp>0&&o.fromFront&&ap<1){
    let sd=d*(1-ap);if(e.melt>0)sd*=1.5;
    e.shieldHp-=sd;e.shieldHit=.14;sparks(hx,hy,5,0xf1ece2);
    if(e.shieldHp<=0){e.shield.visible=false;e.shieldDown=G.t;debris(e.x+.5,e.y+1,[0x7c8086,0x9a3524],9,9);
      stamp('CLANG!',e.x,e.y+1.9,'#f1ece2',1.3,.22);CL.AU.clangSfx()}
    else{stamp('clang',e.x+.5,e.y+1.6,'#efe6d2',.65,.1);CL.AU.hit(false)}
    return sd;
  }
  if(e.hitMult)d*=e.hitMult(o);
  e.hp-=d;e.flash=.07;e.lastHit=G.t;G.stats.dmg+=d;
  if(e.push!==undefined&&o.dir)e.push+=o.dir*d*.05*(e.def.heavy?.15:1);
  if(o.head&&!o.silent){G.stats.head++;if(d>=18)stamp('爆!',e.x,e.y+e.def.height*.95,'#f2c14e',.85,.14)}
  if(e.hp<=0)CL.killEnemy(e,o);else if(e.onHit)e.onHit(d,o);
  return d;
}
function dmgPlayer(n,src){
  const P=G.P;if(!P||P.dead||P.inv>0||G.state!=='play')return false;
  let d=n;
  if(P.armor>0){const a=Math.min(P.armor,d*.6);P.armor-=a;d-=a}
  P.hp-=d;P.hurt=.4;P.inv=Math.max(P.inv,.25);
  R.U.uHurt.value=1;R.shake(.4);sparks(P.x,P.y+1,10,0xe2654e);
  stamp(pick(['嘭!','BAM!','哐当!']),P.x,P.y+2.2,'#e2654e',1.2,.3);CL.AU.hurt();
  if(P.hp<=0){P.hp=0;P.dead=true;G.stats.deaths++;CL.flow.died(src)}
  return true;
}
function explode(x,y,r,dmg,o={}){
  fxFlash(x,y,r*.9,o.color||0xffb347,.16);fxFlash(x,y,r*.45,0xfff3d6,.1);
  sparks(x,y,o.sparks||16,o.color||0xffd36a,0,15);debris(x,y,[0x3d4348,0xa5522c,0x1d1f22],o.debris??6,o.power??8);
  if(!o.quiet){stamp(o.label||pick(['BOOM!','轰!!','哐啷!']),x,y+1,o.label?'#56c2b6':'#e2654e',Math.min(1.9,.95+r*.11),.25);
    R.shake(.25+r*.03);CL.AU.explode(Math.min(2.5,.8+r*.2))}
  const all=G.enemies.slice();if(G.boss&&G.boss.alive)all.push(G.boss);
  for(const e of all){
    if(o.noBoss&&e.boss)continue;
    const cy=e.y+e.def.height*.5,dd=Math.hypot(e.x-x,cy-y);
    if(dd>r+e.def.radius)continue;
    const k=clamp(1-dd/(r+e.def.radius),.25,1);
    hitEnemy(e,dmg*k,{x:e.x,y:cy,fromFront:false,ap:.5,blast:true,dir:Math.sign(e.x-x)||1});
    if(!e.boss&&e.alive)e.push=(e.push||0)+Math.sign(e.x-x||1)*k*(o.knock??7);
  }
  const P=G.P;
  if(!o.noSelf&&P&&!P.dead){const dd=Math.hypot(P.x-x,P.y+.9-y);if(dd<r+.5)dmgPlayer((o.selfDmg??dmg*.3)*clamp(1-dd/(r+.5),.3,1),'爆炸')}
}
CL.hitEnemy=hitEnemy;CL.dmgPlayer=dmgPlayer;CL.addScore=addScore;CL.addCombo=addCombo;CL.explode=explode;
CL.circles=e=>[{x:e.x,y:e.y+e.def.height*.5,r:e.def.radius,part:'body'}];
function nearestEnemy(x,y,r,skip){
  let best=null,bd=r;
  for(const e of G.enemies){if(!e.alive||e.untargetable||(skip&&skip.has(e)))continue;
    const d=Math.hypot(e.x-x,e.y+e.def.height*.5-y);if(d<bd){bd=d;best=e}}
  return best;
}
CL.nearestEnemy=nearestEnemy;

/* ---------- 特效：拟声词 / 火花 / 碎块 / 闪光 / 曳光 ---------- */
const stampCache=new Map();
function stampTex(txt,color){
  const k=txt+'|'+color;if(stampCache.has(k))return stampCache.get(k);
  const c=document.createElement('canvas'),x=c.getContext('2d'),f='900 76px "Arial Black","PingFang SC","Heiti SC",Impact,sans-serif';
  x.font=f;const w=Math.ceil(x.measureText(txt).width)+64;c.width=w;c.height=128;x.font=f;x.textAlign='center';x.textBaseline='middle';x.lineJoin='round';
  x.lineWidth=22;x.strokeStyle='#1c1713';x.strokeText(txt,w/2,66);x.fillStyle=color;x.fillText(txt,w/2,66);
  x.lineWidth=5;x.strokeStyle='#1c1713';x.strokeText(txt,w/2,66);
  x.fillStyle='rgba(255,255,255,.55)';x.save();x.translate(w/2,66);x.scale(1,.42);x.fillText(txt,0,-26);x.restore();
  const t=new T.CanvasTexture(c);t.minFilter=T.LinearFilter;stampCache.set(k,t);return t;
}
const stamps=[];
function stamp(txt,x,y,color,size=1,throttle=.1){
  if(!txt||!color)return;
  const last=stamps.find(s=>s.txt===txt);if(last&&last.age<throttle)return;
  const t=stampTex(txt,color),sp=new T.Sprite(new T.SpriteMaterial({map:t,transparent:true,depthTest:false,depthWrite:false}));
  sp.layers.set(1);sp.renderOrder=20;sp.userData.noInk=true;
  sp.userData.w=1.5*size*(t.image.width/t.image.height);sp.userData.h=1.5*size;
  sp.scale.set(.01,.01,1);sp.position.set(x+rnd(-.25,.25),y+rnd(-.15,.15),4);sp.material.rotation=rnd(-.22,.22);
  fxLayer.add(sp);stamps.push({sp,age:0,txt});
  if(stamps.length>24){const o=stamps.shift();o.sp.parent.remove(o.sp);o.sp.material.dispose()}
}
let debrisMesh,sparkMesh;const flashes=[],tracers=[];
const _m=new T.Matrix4(),_c=new T.Color(),o3=new T.Object3D();
function initFx(){
  const mk=(geo,mat,N)=>{const im=new T.InstancedMesh(geo,mat,N);im.instanceMatrix.setUsage(T.DynamicDrawUsage);
    im.layers.set(1);im.frustumCulled=false;im.userData.noInk=true;im.renderOrder=3;fxLayer.add(im);
    for(let i=0;i<N;i++)im.setColorAt(i,_c.set(0xffffff));return im};
  debrisMesh=mk(new T.BoxGeometry(1,1,1),new T.MeshToonMaterial({color:0xffffff,gradientMap:CL.M.steel.gradientMap}),280);
  sparkMesh=mk(new T.BoxGeometry(1,1,1),new T.MeshBasicMaterial({color:0xffffff}),240);
  for(let i=0;i<12;i++){const f=new T.Mesh(new T.CircleGeometry(1,18),new T.MeshBasicMaterial({color:0xffe7a8,transparent:true,opacity:0,depthWrite:false}));
    f.layers.set(1);f.userData.noInk=true;f.renderOrder=6;f.visible=false;fxLayer.add(f);flashes.push({m:f,age:9,dur:.1,r:1})}
  for(let i=0;i<24;i++){const t=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,depthWrite:false}));
    t.layers.set(1);t.userData.noInk=true;t.visible=false;fxLayer.add(t);tracers.push({m:t,age:9,dur:.1})}
}
const debrisList=[],sparkList=[];
function sparks(x,y,n=6,color=0xffd36a,dir=null,pow=9){
  for(let i=0;i<n;i++){
    if(sparkList.length>=239)sparkList.shift();
    const a=dir===null?rnd(0,TAU):dir+rnd(-1.2,1.2);
    sparkList.push({x,y,z:rnd(-.3,.3),vx:Math.cos(a)*rnd(2,pow),vy:Math.sin(a)*rnd(2,pow)+rnd(0,4),s:rnd(.05,.14),life:rnd(.22,.5),age:0,c:Math.random()<.25?0xffffff:color,rz:rnd(0,TAU),rs:rnd(-14,14)});
  }
}
function debris(x,y,colors,n=8,pow=8){
  const cs=colors&&colors.length?colors:[0x5e6268];
  for(let i=0;i<n;i++){
    if(debrisList.length>=279)debrisList.shift();
    debrisList.push({x:x+rnd(-.25,.25),y:Math.max(.1,y+rnd(-.25,.25)),z:rnd(-1.2,1.2),vx:rnd(-1,1)*pow*.8,vy:rnd(.4,1.3)*pow*.85,
      w:rnd(.12,.42),h:rnd(.1,.3),d:rnd(.1,.3),rx:rnd(0,TAU),rz:rnd(0,TAU),rsx:rnd(-7,7),rsz:rnd(-7,7),life:rnd(2.4,3.4),age:0,c:pick(cs)});
  }
}
function fxFlash(x,y,r,color=0xffe7a8,dur=.11){
  const f=flashes.reduce((a,b)=>a.age>b.age?a:b);f.age=0;f.dur=dur;f.r=r;
  f.m.material.color.set(color);f.m.visible=true;f.m.position.set(x,y,3.4);
}
function tracer(x0,y0,x1,y1,color=0xfff3d6,w=.05,dur=.09){
  const t=tracers.reduce((a,b)=>a.age>b.age?a:b),dx=x1-x0,dy=y1-y0;
  t.age=0;t.dur=dur;t.m.visible=true;t.m.material.color.set(color);
  t.m.position.set((x0+x1)/2,(y0+y1)/2,2.6);t.m.rotation.z=Math.atan2(dy,dx);t.m.scale.set(Math.hypot(dx,dy),w,1);
}
const inkLine=(x0,y0,x1,y1)=>tracer(x0,y0,x1,y1,0x1c1713,.08,.5);
CL.fx={stamp,sparks,debris,flash:fxFlash,tracer,inkLine,dust:(x,y,n=8)=>sparks(x,y,n,0xd8b878,Math.PI/2,4),shake:v=>R.shake(v)};
function stepFx(dt){
  for(let i=stamps.length-1;i>=0;i--){const s=stamps[i];s.age+=dt;const k=s.age/.42;
    const sc=s.age<.07?lerp2(1.7,1,s.age/.07):1;s.sp.scale.set(s.sp.userData.w*sc*(k<1?1:1-(k-1)*3),s.sp.userData.h*sc*(k<1?1:1-(k-1)*3),1);
    s.sp.material.opacity=k<.75?1:1-(k-.75)*4;s.sp.position.y+=dt*.5;
    if(k>1){s.sp.parent.remove(s.sp);s.sp.material.dispose();stamps.splice(i,1)}}
  for(const f of flashes){if(f.age>f.dur){f.m.visible=false;continue}f.age+=dt;const k=f.age/f.dur;f.m.scale.setScalar(f.r*(.6+.6*k));f.m.material.opacity=.85*(1-k)}
  for(const t of tracers){if(t.age>t.dur){t.m.visible=false;continue}t.age+=dt;t.m.material.opacity=1-t.age/t.dur}
  for(let i=debrisList.length-1;i>=0;i--){const d=debrisList[i];d.age+=dt;
    if(d.age>d.life){debrisList.splice(i,1);continue}
    d.vy-=GRAV*dt;d.x+=d.vx*dt;d.y+=d.vy*dt;
    if(d.y<d.h/2){d.y=d.h/2;d.vy=Math.abs(d.vy)*.35;d.vx*=.7;d.rsx*=.6;d.rsz*=.6;if(Math.abs(d.vx)<.3)d.vx=0}
    if(Math.abs(d.x)>XMAX){d.x=Math.sign(d.x)*XMAX;d.vx=-d.vx*.5}
    d.rx+=d.rsx*dt;d.rz+=d.rsz*dt;
    if(d.age>d.life-1)d.y-=dt*.5;
  }
  for(let i=sparkList.length-1;i>=0;i--){const s=sparkList[i];s.age+=dt;if(s.age>s.life){sparkList.splice(i,1);continue}
    s.vy-=GRAV*.6*dt;s.x+=s.vx*dt;s.y+=s.vy*dt;s.rz+=s.rs*dt}
}
function lerp2(a,b,t){return a+(b-a)*t}
function drawFx(){
  if(!debrisMesh)return;
  let i=0;
  for(const d of debrisList){o3.position.set(d.x,d.y,d.z);o3.rotation.set(d.rx,0,d.rz);o3.scale.set(d.w,d.h,d.d);o3.updateMatrix();debrisMesh.setMatrixAt(i,o3.matrix);debrisMesh.setColorAt(i,_c.set(d.c));i++}
  hideRest(debrisMesh,i,280);
  i=0;
  for(const s of sparkList){o3.position.set(s.x,s.y,s.z);o3.rotation.set(0,0,s.rz);o3.scale.set(s.s*2.2,s.s*.6,s.s);o3.updateMatrix();sparkMesh.setMatrixAt(i,o3.matrix);sparkMesh.setColorAt(i,_c.set(s.c));i++}
  hideRest(sparkMesh,i,240);
}
function hideRest(mesh,from,N){
  o3.position.set(0,-999,0);o3.rotation.set(0,0,0);o3.scale.setScalar(.0001);o3.updateMatrix();
  for(let i=from;i<N;i++)mesh.setMatrixAt(i,o3.matrix);
  mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
}
CL.fx.init=initFx;CL.fx.step=stepFx;CL.fx.draw=drawFx;
function modelColors(m){const cs=[];m.traverse(o=>{if(o.isMesh&&o.material.color&&!o.userData.noInk){const c=o.material.color.getHex();if(!cs.includes(c))cs.push(c)}});return cs}
CL.modelColors=modelColors;

/* ---------- 地面预警 ---------- */
function teleRing(x,y,r,dur,color=0xe2654e,o={}){
  const m=MD.ring(r*.9,r,color,o.op??.85);m.position.set(x,y+.03,0);fxLayer.add(m);
  const t={kind:'ring',x,y,r,dur,age:0,mesh:m,color,onEnd:null,follow:o.follow||null,grow:o.grow!==false};G.teles.push(t);return t;
}
function teleBar(x,y,w,d,dur,color=0xe2654e,o={}){
  const m=MD.bar(w,d,color,o.op??.8);m.position.set(x,y+.03,0);fxLayer.add(m);
  const t={kind:'bar',x,y,w,d,dur,age:0,mesh:m,color,onEnd:null,follow:o.follow||null};G.teles.push(t);return t;
}
function teleKill(t){if(!t)return;const i=G.teles.indexOf(t);if(i<0)return;t.onEnd=null;G.teles.splice(i,1);t.mesh.parent.remove(t.mesh);t.mesh.geometry.dispose();t.mesh.material.dispose()}
function stepTeles(dt){
  for(let i=G.teles.length-1;i>=0;i--){
    const t=G.teles[i];t.age+=dt;
    if(t.follow){t.x=t.follow.x;t.y=t.follow.y;t.mesh.position.set(t.x,t.y+.03,0)}
    const k=clamp(t.age/t.dur,0,1);
    if(t.kind==='ring'&&t.grow){const s=Math.max(.05,1-k);t.mesh.scale.set(s,s,1)}
    else if(t.kind==='bar')t.mesh.scale.x=Math.max(.02,k);
    t.mesh.material.opacity=.45+.45*(Math.sin(t.age*(8+k*22))>0?1:0);
    if(t.age>=t.dur){G.teles.splice(i,1);t.mesh.parent.remove(t.mesh);t.mesh.geometry.dispose();t.mesh.material.dispose();if(t.onEnd)t.onEnd(t)}
  }
}
function teleClear(){for(const t of G.teles.slice())teleKill(t)}
CL.tele={ring:teleRing,bar:teleBar,kill:teleKill,clear:teleClear};

/* ---------- 子弹 ---------- */
let bMesh,eMesh,ebCol=null;
function initBullets(){
  const mk=(geo,color,N)=>{const im=new T.InstancedMesh(geo,new T.MeshBasicMaterial({color}),N);im.instanceMatrix.setUsage(T.DynamicDrawUsage);
    im.layers.set(1);im.frustumCulled=false;im.userData.noInk=true;im.renderOrder=4;fxLayer.add(im);return im};
  bMesh=mk(new T.BoxGeometry(1,.1,.1),0xffe2a0,220);
  eMesh=mk(new T.SphereGeometry(1,10,8),0xffffff,220);ebCol=new T.Color(0xff6a4c);for(let i=0;i<220;i++)eMesh.setColorAt(i,ebCol);
}
// o: {speed,r,dmg,life,pierce,weapon,ap,len,spread,gen,ric,d0}
function fireBullet(x,y,tx,ty,o){
  if(G.bullets.length>=219)return null;
  const dx=tx-x,dy=ty-y,l=Math.hypot(dx,dy)||1,s=o.speed||72;
  let a=Math.atan2(dy,dx);if(o.spread)a+=rnd(-o.spread,o.spread);
  const b={x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,r:o.r||.12,dmg:o.dmg,speed:s,life:o.life||1.2,pierce:o.pierce||0,hit:new Set(),
    weapon:o.weapon,ap:o.ap||0,len:o.len||.7,gen:o.gen||0,ric:o.ric||0,d0:o.d0||o.dmg,shot:o.shot,hs:o.hs||1,crit:o.crit||0};
  G.bullets.push(b);return b;
}
// o: {speed,r,dmg,life,grav,laser,low,src}
function efire(x,y,tx,ty,o){
  if(G.ebullets.length>=219)return;
  const dx=tx-x,dy=ty-y,l=Math.hypot(dx,dy)||1,s=(o.speed||10)*(G.P?G.P.diffSpeed||1:1);
  const a=Math.atan2(dy,dx)+(o.spread?o.spread:0);
  G.ebullets.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,r:o.r||.13,dmg:o.dmg,life:o.life||4.5,grav:o.grav||0,laser:!!o.laser,low:!!o.low,src:o.src,spin:rnd(0,6)});
}
function playerCircles(){
  const P=G.P,h=P.slide>0?.4:P.crouch?.66:1.05,r=P.slide>0?.36:P.crouch?.4:.44;
  return [{x:P.x,y:P.y+h*.5,r},{x:P.x,y:P.y+h*.92,r:r*.62}];
}
CL.playerCircles=playerCircles;
function stepBullets(dt){
  const P=G.P,list=G.boss&&G.boss.alive?G.enemies.concat([G.boss]):G.enemies;
  for(let i=G.bullets.length-1;i>=0;i--){
    const b=G.bullets[i];b.life-=dt;
    const nx=b.x+b.vx*dt,ny=b.y+b.vy*dt,dx=nx-b.x,dy=ny-b.y,len2=dx*dx+dy*dy||1;
    let hit=null,bt=2;
    if(b.life>0)for(const e of list){
      if(!e.alive||b.hit.has(e)||e.untargetable)continue;
      for(const c of CL.circles(e)){
        let t=((c.x-b.x)*dx+(c.y-b.y)*dy)/len2;if(t<0||t>1)continue;
        const px=b.x+dx*t-c.x,py=b.y+dy*t-c.y;
        if(px*px+py*py>c.r*c.r)continue;
        if(t<bt){bt=t;hit={e,c}}
      }
    }
    if(hit){
      const {e,c}=hit,hx=b.x+dx*bt,hy=b.y+dy*bt,dir=Math.sign(b.vx)||1;
      const o={x:hx,y:hy,dir,fromFront:(e.face||1)!==dir,weapon:b.weapon,head:c.part==='head',low:c.part==='leg',part:c.part,ap:b.ap,gen:b.gen,d0:b.d0,shot:b.shot,pierceHit:b.hit.size};
      const dealt=hitEnemy(e,o.head?b.dmg*(b.hs||1)*(1+(b.crit||0)):b.dmg,o);
      if(dealt>0){G.stats.hits++;CL.AU.hit(o.head);CL.ui.hitmark(o.head,e.hp<=0);if(CL.ui.dnum)CL.ui.dnum(dealt,hx,hy,o.head,e.boss)}
      sparks(hx,hy,3,o.head?0xf2c14e:0xffe2a0);
      if(G.onBulletHit)G.onBulletHit(e,b,o,dealt,hit.c);
      b.hit.add(e);
      if(b.pierce>0){b.pierce--;b.dmg*=b.grow||1}
      else{b.x=hx;b.y=hy;G.bullets.splice(i,1);continue}
    }
    b.x=nx;b.y=ny;
    if(b.life<=0||Math.abs(b.x)>XMAX+6||b.y>34||b.y<-3)G.bullets.splice(i,1);
  }
  // 敌方子弹
  const pc=playerCircles();
  for(let i=G.ebullets.length-1;i>=0;i--){
    const b=G.ebullets[i];b.life-=dt;const ox=b.x,oy=b.y;
    if(b.grav)b.vy-=b.grav*dt;
    b.x+=b.vx*dt;b.y+=b.vy*dt;b.spin+=dt*10;
    if(b.life<=0||Math.abs(b.x)>XMAX+8||b.y<-2){G.ebullets.splice(i,1);continue}
    if(!P||P.dead||P.inv>0)continue;
    let hit=false;
    for(const c of pc)if(segCircle(ox,oy,b.x,b.y,c.x,c.y,c.r)){hit=true;break}
    // 胸口高度的弹幕：滑铲 / 下蹲可钻过
    const rel=Math.min(Math.abs(oy-P.y),Math.abs(b.y-P.y));
    if(hit&&!b.low&&(P.slide>0||P.crouch)&&rel>.55&&rel<1.12)hit=false;
    if(hit){dmgPlayer(b.dmg,b.src||'弹幕');sparks(b.x,b.y,6,0xff6a4c);G.ebullets.splice(i,1);continue}
    if(b.y<=0){sparks(b.x,.1,3,0xff6a4c);G.ebullets.splice(i,1)}
  }
}
function drawBullets(){
  if(!bMesh)return;
  let i=0;
  for(const b of G.bullets){o3.position.set(b.x,b.y,BZ);o3.rotation.set(0,0,Math.atan2(b.vy,b.vx));o3.scale.set(b.len,1,1);o3.updateMatrix();bMesh.setMatrixAt(i++,o3.matrix)}
  hideRest(bMesh,i,220);
  i=0;
  for(const b of G.ebullets){
    o3.position.set(b.x,b.y,BZ);
    if(b.laser){o3.rotation.set(0,0,Math.atan2(b.vy,b.vx));o3.scale.set(b.r*6,b.r*.5,b.r*.5)}
    else{o3.rotation.set(0,0,b.spin);o3.scale.set(b.r,b.r*.9,b.r*.9)}
    o3.updateMatrix();eMesh.setMatrixAt(i,o3.matrix);ebCol.set(b.col||0xff6a4c);eMesh.setColorAt(i,ebCol);i++;
  }
  if(eMesh.instanceColor)eMesh.instanceColor.needsUpdate=true;
  hideRest(eMesh,i,220);
}
CL.bullets={fire:fireBullet,efire,step:stepBullets,draw:drawBullets};
CL.bullets.clear=()=>{G.bullets.length=0;G.ebullets.length=0};

/* ---------- 手雷 ---------- */
function throwNade(x,y,vx,vy){
  const m=MD.spawn('nade',ents);
  G.nades.push({x,y,vx,vy,m,fuse:1.2,spin:rnd(-10,10)});CL.AU.clack();
}
function stepNades(dt){
  for(let i=G.nades.length-1;i>=0;i--){
    const n=G.nades[i];n.fuse-=dt;n.vy-=GRAV*dt;n.x+=n.vx*dt;n.y+=n.vy*dt;
    if(n.y<=.14){n.y=.14;if(Math.abs(n.vy)>.8)CL.AU.clack();n.vy=Math.abs(n.vy)*.38;n.vx*=.75}
    if(Math.abs(n.x)>XMAX){n.x=Math.sign(n.x)*XMAX;n.vx=-n.vx*.6}
    if(n.fuse<=0){
      n.m.parent.remove(n.m);CL.ink.unreg(n.m);G.nades.splice(i,1);
      explode(n.x,n.y,4.3,115,{knock:9});
      if(G.has('grenade-echo')){const x=n.x,y=n.y;after(.35,()=>explode(x,y,3,34,{noSelf:true,sparks:8,debris:3,power:6,echo:true}))}
    }else{n.m.position.set(n.x,n.y,1.7);n.m.rotation.z+=n.spin*dt;n.m.scale.setScalar(1+Math.max(0,.5-n.fuse)*.6*(Math.sin(G.t*40)>0?1:0))}
  }
}
CL.nade={throw:throwNade,step:stepNades};

/* ---------- 抛射物（沙罐 / 沙石弹 / 炮弹） ---------- */
// o: {grav,r,warn,warnR,col,dmg,onLand,life,spin}
function lob(kind,x,y,vx,vy,o={}){
  const m=MD.spawn(kind,ents),g=o.grav||GRAV;
  const b={kind,x,y,vx,vy,g,m,life:o.life||8,r:o.r||.2,dmg:o.dmg||0,onLand:o.onLand,warn:null,spin:o.spin??rnd(-4,4),landed:false};
  const t=(vy+Math.sqrt(vy*vy+2*g*Math.max(0,y-.1)))/g;
  b.land={x:clamp(x+vx*t,-XMAX,XMAX),y:.1};b.tLand=t;
  if(o.warn)b.warn=teleRing(b.land.x,0,o.warnR||b.r,o.warn+.05,o.col||0xf1ece2,{fill:false,op:.75});
  G.lobs.push(b);return b;
}
function stepLobs(dt){
  for(let i=G.lobs.length-1;i>=0;i--){
    const b=G.lobs[i];b.life-=dt;b.vy-=b.g*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;
    if(Math.abs(b.x)>XMAX){b.x=Math.sign(b.x)*XMAX;b.vx=-b.vx*.4}
    b.m.position.set(b.x,b.y,1.2);b.m.rotation.z+=b.spin*dt;
    const floor=b.onFloor?b.onFloor(b):0;
    if(b.y<=floor+.1||b.life<=0){
      teleKill(b.warn);b.m.parent.remove(b.m);CL.ink.unreg(b.m);G.lobs.splice(i,1);
      if(b.life>0)b.onLand?b.onLand(b):explode(b.x,floor,b.r,b.dmg||10,{quiet:true});
    }
  }
}
CL.lob=lob;

/* ---------- 拾取 ---------- */
const PICK={ammo:{m:'ammo'},med:{m:'med'},armor:{m:'armor'},crate:{m:'crate'}};
function dropPickup(x,y,kind,weap,amount){
  const p=PICK[kind],m=MD.spawn(p.m,ents);
  if(kind==='ammo'&&weap)discTag(m,MD.PICK_COL[weap]||0xdca820);
  if(kind==='med')discTag(m,0xe2654e);if(kind==='armor')discTag(m,0x58768a);
  G.pickups.push({kind,weap,amount,x,y:Math.max(.3,y),vx:rnd(-2.5,2.5),vy:rnd(3,7),m,life:CL.D.LEVELS.drops.life,age:0,bob:rnd(0,6)});
}
function discTag(m,c){const d=CL.disc(.13,c,0,.48,0,m);d.name='tag'}
function dropLoot(x,y,cost,o={}){
  const D=CL.D,dr=D.LEVELS.drops,dv=G.DV,mult=o.mult||1,P=G.P;
  const pow=Math.pow(Math.max(1,cost),.6);
  if(Math.random()<dr.ammo*pow*dv.ammoDrop*mult){
    const owned=P.weapons.filter(w=>w.id!=='pistol'||G.has('gun-dual')).map(w=>w.id==='dual'?'dual':w.id);
    const need=owned.filter(id=>P.reserve[id]<P.cap[id]*.6);
    const id=need.length&&Math.random()<.7?pick(need):owned.length?pick(owned):null;
    if(id)for(let k=0;k<(o.n||1);k++)dropPickup(x,y,'ammo',id,CL.D.AMMO_PICK[id]);
  }
  const low=1+clamp((P.hpMax-P.hp)/P.hpMax,0,1)*1.6;
  if(Math.random()<dr.health*pow*low*dv.healthDrop*mult)dropPickup(x,y,'med',null,cost>=dr.bigFrom?dr.bigHeal:dr.smallHeal);
  if(P.armorMax>P.armor&&Math.random()<.03*mult)dropPickup(x,y,'armor',null,25);
}
function stepPickups(dt){
  const P=G.P,reach=CL.D.LEVELS.drops.reach*(G.has('scavenger')?2:1)*1.3;
  for(let i=G.pickups.length-1;i>=0;i--){
    const p=G.pickups[i];p.life-=dt;p.age+=dt;
    const tgt={x:p.x,y:.2};
    if(p.kind==='crate'&&p.vy<-.1&&p.y<=.35){p.vy=0;p.vx=0;CL.fx.dust(p.x,.1,14);R.shake(.25);CL.AU.slam()}
    if(P&&!P.dead&&p.age>.35){
      const dx=P.x-p.x,dy=P.y+.9-p.y,dd=Math.hypot(dx,dy);
      if(dd<reach){p.vx=dx/dd*16;p.vy=dy/dd*16;p.mag=true}
      if(dd<.7||(p.kind==='crate'&&dd<1.3)){if(G.onPick(p,G)!==false){p.m.parent.remove(p.m);CL.ink.unreg(p.m);G.pickups.splice(i,1)}continue}
    }
    if(!p.mag){p.vy-=GRAV*dt}
    p.x+=p.vx*dt;p.y+=p.vy*dt;
    if(p.y<=.2){p.y=.2;p.vy=Math.abs(p.vy)*.3;p.vx*=.8;if(Math.abs(p.vy)<1)p.vy=0}
    if(Math.abs(p.x)>XMAX){p.x=Math.sign(p.x)*XMAX;p.vx=0}
    p.m.position.set(p.x,p.y+(p.kind==='crate'?0:Math.sin(G.t*4+p.bob)*.06+.08),1.3);p.m.rotation.y+=dt*1.2;
    p.m.visible=p.life>6||Math.sin(p.life*12)>0;
    if(p.life<=0){p.m.parent.remove(p.m);CL.ink.unreg(p.m);G.pickups.splice(i,1)}
  }
}
CL.drop=dropPickup;CL.dropLoot=dropLoot;

/* ---------- 每帧 ---------- */
function step(dt){
  for(let i=G.pend.length-1;i>=0;i--){const p=G.pend[i];p.t-=dt;if(p.t<=0){G.pend.splice(i,1);p.fn()}}
  const c=G.combo;
  if(c.n>0){c.t-=dt;c.pts=Math.max(0,c.pts-dt*7);if(c.t<=0){c.n=0;c.pts=0}}
  stepBullets(dt);stepNades(dt);stepLobs(dt);stepPickups(dt);stepTeles(dt);stepFx(dt);
  R.U.uHurt.value=Math.max(0,R.U.uHurt.value-dt*2.4);R.U.uFlash.value=Math.max(0,R.U.uFlash.value-dt*6);
}
function clear(){
  G.bullets.length=0;G.ebullets.length=0;G.pend.length=0;
  for(const l of G.lobs){teleKill(l.warn);l.m.parent.remove(l.m);CL.ink.unreg(l.m)}G.lobs.length=0;
  for(const n of G.nades){n.m.parent.remove(n.m);CL.ink.unreg(n.m)}G.nades.length=0;
  for(const p of G.pickups){p.m.parent.remove(p.m);CL.ink.unreg(p.m)}G.pickups.length=0;
  for(const e of G.enemies)if(e.m){e.m.parent.remove(e.m);CL.ink.unreg(e.m);if(e.sh)e.sh.parent.remove(e.sh)}
  G.enemies.length=0;teleClear();
}
CL.stepCombat=step;CL.clearCombat=clear;
CL.MUSIC={synth:0,strike:1,west:2,rock:3};
})();
