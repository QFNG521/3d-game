/* ========================================================================
 * CLANG! 2.5D — 60 主角：移动 / 平台 / 滑铲 / 四把枪 / 手雷 / 钩锁 / 处决 / 卡牌效果
 * ====================================================================== */
(function(){
'use strict';
const T=THREE,CL=window.CL,{clamp,lerp,damp,rnd,pick}=CL;
const G=CL.G,R=CL.render,MD=CL.models,D=CL.D,W=CL.world;
const PZ=1.6,WALK=8.4,SPRINT=11.8,JUMP=15.6,GRAV=42,XMAX=25;
const K=c=>!!G.keys[c],pr=c=>!!(G.press&&G.press[c]);
const has=id=>!!P.cards[id];
let P=null;

function buildModel(){
  const m=MD.spawn('player',CL.ents);
  P={m,parts:m.userData.parts,sh:MD.shadow()};CL.ents.add(P.sh);
  P.gunHolder=P.parts.armF.getObjectByName('gun');
}
function reset(){
  if(!P)buildModel();
  const dv=G.DV=D.DIFF[G.diff];
  P.m.rotation.set(0,0,0);P.m.visible=true;P.sh.visible=true;
  CL.ink.unreg(P.gunMesh||{userData:{}});if(P.gunMesh&&P.gunMesh.parent)P.gunMesh.parent.remove(P.gunMesh);
  if(P.gun2&&P.gun2.parent){P.gun2.parent.remove(P.gun2)}
  Object.assign(P,{x:0,y:0,vx:0,vy:0,r:.44,face:1,ground:true,wasGround:true,dead:false,deadT:0,inv:1.2,hurt:0,
    hpMax:100+dv.playerHp,hp:100+dv.playerHp,armor:0,armorMax:50,
    crouch:false,slide:0,slideCd:0,slideBuf:0,slideDir:1,coyote:0,jumpBuf:0,dropT:0,airT:0,
    fireT:0,fireHeld:false,emptyHeld:false,reload:0,relClk:0,spin:0,spinKeep:0,recoil:0,pumpT:0,readyShot:false,chainCd:0,shotId:0,shotHits:new Map(),
    nades:2,nadeMax:4,hookCd:0,hookE:1,hook:null,hookHold:false,hookTarget:null,exec:null,execCd:0,
    cards:{},weapons:[],wi:0,reserve:{},cap:{},ads:false,stepT:0,phase:0,bob:0,diffSpeed:dv.bulletSpeed,
    relayCd:0,bountyCd:0,bountyT:0,meltTarget:null,meltLast:0,meltHeld:0,dualSide:0,aimAng:0,switchT:0});
  if(P.hookM&&P.hookM.parent)P.hookM.parent.remove(P.hookM);
  R.aimPlane.constant=-PZ;
  addWeapon('pistol');recompute();switchTo(0,true);
  G.P=P;G.has=has;G.onKill=onKill;G.onBulletHit=onBulletHit;G.onPick=onPick;
}
function addWeapon(id,silent){
  let w=P.weapons.find(x=>x.id===id);const d=D.W[id];
  if(w){w.mag=d.mag;P.reserve[id]=Math.min(P.cap[id],P.reserve[id]+(d.res||0));return}
  w={id,d,mag:d.mag,dmg:d.dmg,magSize:d.mag,reload:d.reload,rate:d.rate,ap:d.ap||0,crit:0};P.weapons.push(w);
  P.reserve[id]=id==='pistol'?Infinity:d.res;P.cap[id]=d.cap||d.res;
}
function recompute(){
  for(const w of P.weapons){
    const d=w.d,m={dmg:0,mag:0,reload:0,rate:0,crit:0,pierce:0};let magAdd=0;
    for(const c of D.CARDS){const n=P.cards[c.id]||0;if(!n||!c.mods)continue;
      const tgt=c.target==='pistol'?(w.id==='pistol'||w.id==='dual'):c.target===w.id;if(!tgt)continue;
      for(const k in c.mods)m[k]+=c.mods[k]*n;if(c.magAdd)magAdd+=c.magAdd*n}
    w.dmg=d.dmg*(1+m.dmg);w.magSize=Math.round(d.mag*(1+m.mag))+magAdd;w.reload=Math.max(.45,d.reload*(1-m.reload));
    w.rate=d.rate*(1+m.rate)*(P.bountyT>0?1.2:1);w.crit=m.crit;w.ap=(d.ap||0)+m.pierce;
  }
  P.armorMax=50+25*(P.cards.vest||0);P.armor=Math.min(P.armor,P.armorMax);
  G.combo.tmax=4+2*(P.cards['combo-ember']||0);
}
function giveCard(id){
  const c=D.CARD[id];if(!c)return;P.cards[id]=(P.cards[id]||0)+1;G.stats.cards++;
  if(c.kind==='weapon')addWeapon(c.id==='gun-dual'?'dual':c.target);
  recompute();
  if(id==='vest')P.armor=Math.min(P.armorMax,P.armor+25);
  if(c.kind==='weapon')switchTo(P.weapons.findIndex(w=>w.id===(c.id==='gun-dual'?'dual':c.target)),true);
}
function switchTo(i,silent){
  if(i<0||i>=P.weapons.length||i===P.wi&&P.w)return;
  P.wi=i;P.w=P.weapons[i];P.reload=0;P.fireT=Math.max(P.fireT,silent?0:.22);P.spin=0;P.switchT=.2;
  if(P.gunMesh){P.gunMesh.parent.remove(P.gunMesh);CL.ink.unreg(P.gunMesh)}
  if(P.gun2){P.gun2.parent.remove(P.gun2);CL.ink.unreg(P.gun2);P.gun2=null}
  const g=MD.guns[P.w.id]();P.gunHolder.add(g);CL.ink.reg(g);P.gunMesh=g;
  if(P.w.id==='dual'){const armB=P.parts.armB;const g2=MD.guns.pistol();g2.position.set(.5,.04,0);armB.add(g2);CL.ink.reg(g2);P.gun2=g2}
  if(!silent)CL.AU.reload();
}
function heal(n){const o=P.hp;P.hp=Math.min(P.hpMax,P.hp+n);return P.hp-o}
function load(w,n){
  const need=w.magSize-w.mag,take=Math.min(need,n);
  if(take<=0)return 0;
  if(P.reserve[w.id]!==Infinity){const avail=Math.min(take,P.reserve[w.id]);P.reserve[w.id]-=avail;w.mag+=avail;return avail}
  w.mag+=take;return take;
}
function startReload(){
  const w=P.w;if(P.reload>0||w.mag>=w.magSize||P.reserve[w.id]<=0)return;
  P.reload=w.reload;P.relClk=0;CL.AU.reload();
}

/* ---------- 输入 ---------- */
function input(){
  const t=G.touch;let ax=(K('KeyD')||K('ArrowRight')?1:0)-(K('KeyA')||K('ArrowLeft')?1:0);
  if(t&&Math.abs(t.mx)>.18)ax=clamp(t.mx*1.4,-1,1);
  return {ax,down:K('ControlLeft')||K('ControlRight')||K('KeyS')||K('ArrowDown')||!!(t&&t.crouch),
    jump:K('Space')||!!(t&&t.jump),jumpEdge:pr('Space')||!!(t&&t.jumpEdge),sprint:K('ShiftLeft')||K('ShiftRight')||!!(t&&t.sprint),
    slideEdge:pr('KeyC')||!!(t&&t.slideEdge),nadeEdge:pr('KeyG')||!!(t&&t.nadeEdge),execEdge:pr('KeyF')||!!(t&&t.execEdge),
    aim:K('KeyQ')||!!(t&&t.aim),fire:!!(t&&t.fire),hook:K('KeyE')||!!(t&&t.hook)};
}

/* ---------- 移动 / 平台 ---------- */
function support(x,y){ // 脚下最近的支撑面高度
  let s=0;for(const p of W.PLATFORMS)if(p.y<=y+.05&&Math.abs(x-p.x)<=p.w/2+.2&&p.y>s)s=p.y;return s;
}
function move(dt,inp){
  const wasGround=P.ground,py=P.y;
  P.slideCd-=dt;P.dropT-=dt;P.coyote-=dt;P.jumpBuf-=dt;P.slideBuf-=dt;P.execCd-=dt;P.switchT-=dt;P.bountyT-=dt;
  const hooking=P.hook&&P.hook.state==='pull';
  if(P.exec){P.vx=0;P.execMove(dt);return}
  // 滑铲
  if(P.slide>0){
    P.slide-=dt;P.vx=P.slideDir*lerp(7.5,16.5,clamp(P.slide/.5,0,1));
    if(P.slide<=0)P.slideCd=.3;
  }else if(!hooking){
    const spd=(inp.sprint&&!inp.down&&!P.ads&&Math.abs(inp.ax)>.1?SPRINT:WALK)*(inp.down?.42:1)*(P.ads?.78:1)*(P.slowT>0?.62:1)*(1+(W.windX||0)*.28*Math.sign(inp.ax||1));
    const tvx=inp.ax*spd,acc=(P.ground?72:38)*dt;
    if(Math.abs(inp.ax)>.05){P.vx+=clamp(tvx-P.vx,-acc,acc);if(Math.abs(inp.ax)>.2)P.face=Math.sign(inp.ax)}
    else if(P.ground)P.vx-=clamp(P.vx,-52*dt,52*dt);
    if(P.ground&&inp.slideEdge&&P.slideCd<=0&&(Math.abs(P.vx)>2.5||Math.abs(inp.ax)>.2)){
      P.slide=.5;P.slideDir=Math.abs(P.vx)>1?Math.sign(P.vx):Math.sign(inp.ax||P.face);P.slideBuf=0;CL.AU.slide();CL.fx.dust(P.x,P.y,6)}
    else if(!P.ground&&inp.slideEdge)P.slideBuf=.3;
    if(P.ground&&P.slideBuf>0&&Math.abs(P.vx)>2.5){P.slideBuf=0;P.slide=.45;P.slideDir=Math.sign(P.vx);CL.AU.slide()}
    // 跳
    if(inp.jumpEdge)P.jumpBuf=.13;
    if(P.jumpBuf>0&&(P.ground||P.coyote>0)){
      if(inp.down&&P.y>.05&&W.PLATFORMS.some(p=>Math.abs(P.y-p.y)<.05&&Math.abs(P.x-p.x)<=p.w/2+.2)){
        P.dropT=.22;P.y-=.06;P.ground=false;
      }else{
        P.vy=JUMP;P.ground=false;P.coyote=0;P.slide=0;CL.AU.jump();CL.fx.dust(P.x,P.y,5);
      }
      P.jumpBuf=0;
    }
    if(!inp.jump&&P.vy>5)P.vy-=34*dt;
  }
  P.crouch=(inp.down&&P.ground&&!hooking)||P.slide>0;
  // 积分
  if(!hooking)P.vy=Math.max(-42,P.vy-GRAV*dt);
  P.x+=P.vx*dt;const ny=P.y+P.vy*dt;P.y=ny;
  P.ground=false;
  if(P.y<=0){P.y=0;if(P.vy<0){if(P.vy<-13){CL.fx.dust(P.x,0,8);CL.AU.land();R.shake(.08)}P.vy=0}P.ground=true}
  else if(P.vy<=0&&P.dropT<=0){
    for(const p of W.PLATFORMS){
      if(py>=p.y-.03&&P.y<=p.y&&Math.abs(P.x-p.x)<=p.w/2+.2){P.y=p.y;
        if(P.vy<-13){CL.fx.dust(P.x,p.y,8);CL.AU.land()}P.vy=0;P.ground=true;break}
    }
  }
  if(Math.abs(P.x)>XMAX){P.x=Math.sign(P.x)*XMAX;P.vx=0}
  if(wasGround&&!P.ground)P.coyote=.11;
  // 脚步
  if(P.ground&&Math.abs(P.vx)>3&&P.slide<=0){P.stepT-=dt*Math.abs(P.vx)*.5;if(P.stepT<=0){P.stepT=1;CL.AU.step();if(Math.abs(P.vx)>10)CL.fx.dust(P.x-Math.sign(P.vx)*.3,0,2)}}
  // 翻越：踩头弹起
  if(!P.ground&&P.vy<=0)for(const e of G.enemies){
    if(!e.alive||e.boss)continue;const top=e.y+e.def.height*(e.scale||1);
    if(Math.abs(P.x-e.x)<e.def.radius*(e.scale||1)+.35&&py>=top-.25&&P.y<=top+.05){
      P.y=top;P.vy=has('vault')?14:9;CL.hitEnemy(e,6,{x:e.x,y:top,dir:Math.sign(P.x-e.x)||1,fromFront:false,noGuard:true,silent:true});
      CL.fx.dust(e.x,top,5);stampAt('踩!',e.x,top+1,'#56c2b6',.8);
    }
  }
}
function stampAt(t,x,y,c,s){CL.fx.stamp(t,x,y,c,s,.3)}

/* ---------- 武器 ---------- */
function muzzle(side){
  const g=(P.w.id==='dual'&&side)?P.gun2:P.gunMesh,v=g.userData.muzzle;
  return v?g.localToWorld(v.clone()):new T.Vector3(P.x+P.face,P.y+1.4,PZ);
}
function fire(w){
  if(w.mag<=0){if(!P.emptyHeld){CL.AU.empty();P.emptyHeld=true}P.fireHeld=true;startReload();return}
  w.mag--;P.readyShot=false;P.fireHeld=true;
  const iv=fireInterval(w);P.fireT=iv;
  const side=P.dualSide=1-P.dualSide,m=muzzle(P.w.id==='dual'?side:0);
  let dx=G.aim.x-m.x,dy=G.aim.y-m.y,l=Math.hypot(dx,dy);if(l<.8){dx=P.face;dy=.1;l=1}
  P.face=Math.sign(G.aim.x-P.x)||P.face;
  const moving=Math.abs(P.vx)>2.5;
  let spread=w.d.spread*(P.ads?.42:1)*(moving?1.3:1)*(P.crouch?.7:1)*(P.ground?1:1.8);
  if(w.id==='rifle')spread*=1+P.spin*.7;
  G.stats.shots++;const shot=++P.shotId;P.shotHits=new Map();P.shotShards=0;
  const n=w.d.pellets||1;
  for(let i=0;i<n;i++){
    CL.bullets.fire(m.x,m.y,m.x+dx/l*50,m.y+dy/l*50,{dmg:w.dmg,speed:w.id==='shotgun'?62:w.id==='sniper'?150:88,r:w.id==='sniper'?.22:.12,
      weapon:w.id,ap:w.ap,pierce:w.id==='sniper'?1+(has('g43-pierce')?has('awake-g43-pierce')?99:3:0):0,spread,shot,
      len:w.id==='sniper'?1.8:w.id==='shotgun'?.45:.7,life:w.id==='sniper'?2:1.1,hs:w.d.hs||1,crit:w.crit||0});
  }
  const kind=w.id==='dual'?'pistol':w.id;
  CL.AU.shoot(kind);CL.fx.flash(m.x,m.y,w.id==='shotgun'?.75:w.id==='sniper'?.9:.5,0xfff0c0,.07);
  const a=Math.atan2(dy,dx);CL.fx.sparks(m.x,m.y,w.id==='shotgun'?6:3,0xffd36a,a,w.id==='sniper'?16:10);
  P.recoil=Math.min(1,P.recoil+(w.id==='sniper'?.9:w.id==='shotgun'?.6:.28));R.shake(w.id==='sniper'?.3:w.id==='shotgun'?.22:.07);
  if(w.id==='sniper'){CL.fx.tracer(m.x,m.y,m.x+dx/l*45,m.y+dy/l*45,0xfff3d6,.07,.14);G.hitstop=.045}
  if(w.id==='shotgun'){P.pumpT=.55;P.vx-=Math.sign(dx)*2.2}
  if(w.mag<=0)startReload();
}
function fireInterval(w){
  if(w.id!=='rifle')return 1/w.rate;
  const max=(has('awake-smg-relay')?.35:.2);return lerp(1/w.rate,1/(w.rate*(1+max)),P.spin);
}
function weapon(dt,inp){
  const w=P.w;P.fireT-=dt;P.recoil=damp(P.recoil,0,16,dt);P.pumpT-=dt;P.chainCd-=dt;P.relayCd-=dt;P.bountyCd-=dt;
  if(P.reload>0){
    P.reload-=dt;const rp=1-P.reload/w.reload;
    if(rp>.5&&!P.relClk){P.relClk=1;CL.AU.clack()}
    if(P.reload<=0){load(w,w.magSize);P.relClk=0;CL.AU.clack()}
  }
  for(let i=0;i<5;i++)if(pr('Digit'+(i+1))&&P.weapons[i]&&i!==P.wi)switchTo(i);
  if(pr('KeyR'))startReload();
  if(inp.nadeEdge&&P.nades>0&&!P.exec){
    P.nades--;let dx=G.aim.x-P.x,dy=G.aim.y-(P.y+1.3),l=Math.hypot(dx,dy)||1;
    CL.nade.throw(P.x+Math.sign(dx)*.4,P.y+1.3,dx/l*17,dy/l*15+5);
  }
  P.ads=(G.mouse.rdown||inp.aim)&&!P.exec;
  R.cam.tz=P.ads?(w.id==='sniper'?1.5:1.16):1;
  const firing=(G.mouse.down||inp.fire)&&P.reload<=0&&!P.exec&&P.switchT<=0;
  if(w.id==='rifle'){
    if(firing&&w.mag>0)P.spin=Math.min(1,P.spin+dt/1.25);
    else if(P.spinKeep>0)P.spinKeep-=dt;else P.spin=Math.max(0,P.spin-dt/.28);
  }
  const want=w.d.auto?firing:(firing&&!P.fireHeld);
  if(want&&P.fireT<=0)fire(w);
  if(!G.mouse.down&&!inp.fire){P.fireHeld=false;P.emptyHeld=false}
  // 没子弹了：自动切到还有弹的枪
  if(w.mag<=0&&P.reserve[w.id]<=0&&P.reload<=0){
    P.dryT=(P.dryT||0)+dt;
    if(P.dryT>.45){P.dryT=0;const i=P.weapons.findIndex(x=>x.mag>0||P.reserve[x.id]>0);if(i>=0&&i!==P.wi){switchTo(i);flashAmmo(w.d.name+' 没子弹了 · 切到 '+P.w.d.name)}}
  }else P.dryT=0;
}

/* ---------- 击中 / 击杀回调（卡牌机制） ---------- */
function ignite(e,gen=0){
  if(e.def.id==='hauler'||e.burn&&!e.burn.dead||e.shieldHp>0)return;
  e.burn={t:4,gen,tick:0};CL.fx.stamp('烧!',e.x,e.y+e.def.height*(e.scale||1)+.3,'#e2654e',.7,.3);
}
function onBulletHit(e,b,o,dealt){
  if(dealt<=0)return;
  const id=e.def.id;
  b.grow=b.weapon==='sniper'?(has('g43-pierce')?(b.hit.size<5?1.1:1):.88):1;
  // 熔蚀
  if(b.weapon==='rifle'&&has('smg-melt')&&!e.boss){
    if(P.meltTarget===e&&G.t-P.meltLast<=.35)P.meltHeld+=G.t-P.meltLast;else{P.meltTarget=e;P.meltHeld=0}
    P.meltLast=G.t;
    if(e.melt<=0&&P.meltHeld>=(has('awake-smg-melt')?.4:.7)){e.melt=3;CL.fx.stamp('熔蚀!',e.x,e.y+e.def.height*(e.scale||1)+.4,'#56c2b6',1,.5);CL.AU.warn()}
    else if(e.melt>0)e.melt=3;
  }
  // 跳弹弹头
  if(b.weapon==='rifle'&&b.gen===0&&has('smg-ricochet')&&Math.random()<.3){
    const t=CL.nearestEnemy(e.x,e.y,6,b.hit);
    if(t){const nb=CL.bullets.fire(o.x,o.y,t.x,t.y+t.def.height*.5,{dmg:b.dmg*.4,speed:b.speed,life:.5,weapon:'rifle',gen:1});
      if(nb){nb.hit=new Set(b.hit);nb.hit.add(e);CL.fx.inkLine(o.x,o.y,t.x,t.y+t.def.height*.5)}}
  }
  // 燃烧鹿弹
  if(b.weapon==='shotgun'&&has('sg-ignite')&&b.shot===P.shotId){
    const c=(P.shotHits.get(e)||0)+1;P.shotHits.set(e,c);if(c===2)ignite(e);
  }
}
function onKill(e,o){
  const w=o.weapon,direct=!o.blast&&!o.dot&&!o.shard&&!o.execute;
  if(has('combat-repair'))heal(P.cards['combat-repair']);
  if(has('hook-recycle'))P.hookE=Math.min(1,P.hookE+.04+(P.hookTarget===e?.06:0));
  const wk=P.weapons.find(x=>x.id===w);
  if(wk&&direct){
    if(w==='rifle'&&has('smg-relay')&&G.t>=P.relayCd){P.relayCd=G.t+.8;load(wk,2);if(has('awake-smg-relay'))P.spinKeep=2;flashAmmo('弹链接力 +2')}
    if((w==='pistol'||w==='dual')&&has('pistol-bounty')&&G.t>=P.bountyCd){P.bountyCd=G.t+.8;load(wk,o.head?4:2);flashAmmo('赏金 +'+(o.head?4:2))}
    if((w==='pistol'||w==='dual')&&has('pistol-ricochet'))ricochet(e,o,.5,1);
    if(w==='shotgun'&&has('sg-shards')&&o.shot===P.shotId&&P.shotShards<1&&Math.hypot(e.x-P.x,e.y-P.y)<6){P.shotShards++;shards(e,o,1,0)}
  }
  if(e.burn&&has('sg-ignite')&&e.burn.gen<(has('awake-sg-ignite')?2:1)){
    const r=has('awake-sg-ignite')?5:3;let n=0;
    for(const t of G.enemies){if(t.alive&&t!==e&&Math.hypot(t.x-e.x,t.y-e.y)<r&&n<3){ignite(t,e.burn.gen+1);CL.fx.inkLine(e.x,e.y+1,t.x,t.y+1);n++}}
  }
  if(e.melt>0&&has('awake-smg-melt')){
    const t=CL.nearestEnemy(e.x,e.y,5,new Set([e]));if(t){t.melt=3;P.meltTarget=t;P.meltHeld=0;CL.fx.inkLine(e.x,e.y+1,t.x,t.y+1)}
  }
  if(w==='sniper'&&has('g43-chain')&&(o.head||has('awake-g43-chain'))&&G.t>=P.chainCd&&!o.blast){
    P.chainCd=G.t+(has('awake-g43-chain')?1:1.5);P.readyShot=true;P.fireT=0;CL.AU.warn();flashAmmo('连环狙杀 · 立刻开火');
  }
}
function ricochet(e,o,mult,hop){
  let t=null,bd=6;
  for(const x of G.enemies){if(!x.alive||x===e)continue;const d=Math.hypot(x.x-e.x,x.y-e.y);if(d<bd){bd=d;t=x}}
  if(!t)return;
  const dmg=(o.d0||35)*mult,hy=e.y+e.def.height*.5,ty=t.y+t.def.height*.5;
  CL.fx.inkLine(e.x,hy,t.x,ty);CL.fx.tracer(e.x,hy,t.x,ty,0x56c2b6,.05,.2);
  CL.hitEnemy(t,dmg,{x:t.x,y:ty,dir:Math.sign(t.x-e.x)||1,fromFront:(t.face||1)!==Math.sign(t.x-e.x||1),weapon:o.weapon,d0:o.d0,gen:hop});
  if(has('awake-pistol-ricochet')&&hop<2&&!t.alive)ricochet(t,o,.25,hop+1);
}
function shards(e,o,mult,depth){
  const dir=o.dir||1,total=o.total||126;
  let n=0;
  for(const t of G.enemies.slice()){
    if(!t.alive||t===e||n>=3)continue;
    const behind=Math.sign(t.x-e.x)===dir;if(!behind||Math.abs(t.x-e.x)>6)continue;
    n++;const ty=t.y+t.def.height*.5;
    CL.fx.inkLine(e.x,e.y+e.def.height*.5,t.x,ty);
    CL.hitEnemy(t,total*.2*mult,{x:t.x,y:ty,dir,fromFront:(t.face||1)!==dir,weapon:o.weapon,shard:true,shot:o.shot,d0:o.d0});
    if(has('awake-sg-shards')&&depth<1&&!t.alive)CL.after(.12,()=>shards(t,{...o,dir},mult*.5,depth+1));
  }
}
function flashAmmo(txt){CL.ui.toast(txt,'#56c2b6')}

/* ---------- 钩锁 ---------- */
function hookUpdate(dt,inp){
  P.hookCd-=dt;if(!P.hook)P.hookE=Math.min(1,P.hookE+dt*.2);
  if(!has('grapple')){if(P.hook)hookEnd();return}
  const hold=inp.hook&&P.hookE>=.35&&!P.exec;
  if(!P.hook){
    if(hold&&!P.hookHold&&P.hookCd<=0)hookStart();
  }else{
    const h=P.hook;h.t+=dt;
    if(h.state==='fly'){
      const dx=h.tx-h.x,dy=h.ty-h.y,d=Math.hypot(dx,dy),step=52*dt;
      if(h.e&&!h.e.alive)hookEnd();
      else if(d<=step||h.t>1.2){
        if(h.e){
          if(h.e.def.guard&&!has('grapple-plus')){CL.fx.stamp('拽不动',h.e.x,h.e.y+2,'#f1ece2',.9,.5);CL.AU.clangSfx();P.hookE=Math.min(1,P.hookE+.25);hookEnd()}
          else{h.state='pullEnemy';h.e.hooked=true;CL.AU.hookHit();R.shake(.15)}
        }else{h.state='pull';CL.AU.hookHit();R.shake(.12);P.vx*=.2}
      }else{h.x+=dx/d*step;h.y+=dy/d*step}
    }else if(h.state==='pull'){
      const dx=h.tx-P.x,dy=h.ty-(P.y+1.1),d=Math.hypot(dx,dy),sp=has('grapple-plus')?34:28;
      if(!hold||d<1.4||h.t>2.4){P.vy=Math.max(P.vy,3);hookEnd();if(d<1.4)P.vy=8}
      else{P.vx=dx/d*sp;P.vy=dy/d*sp;P.x+=P.vx*dt;P.y+=P.vy*dt;P.vy=0}
      P.x=clamp(P.x,-XMAX,XMAX);
    }else if(h.state==='pullEnemy'){
      const e=h.e;
      if(!hold||!e.alive||Math.hypot(e.x-P.x,e.y-P.y)<1.7||h.t>2){if(e.alive){e.hooked=false;e.yanked=G.t}hookEnd()}
      else{h.x=e.x;h.y=e.y+e.def.height*.5}
    }
    if(P.hook){
      const m=P.hookM;m.position.set(P.hook.x,P.hook.y,2);m.rotation.z+=dt*14;
      CL.fx.tracer(P.x+P.face*.2,P.y+1.35,P.hook.x,P.hook.y,0x1c1713,.075,.03);
      if(h.state==='fly'&&h.e)h.tx=h.e.x,h.ty=h.e.y+h.e.def.height*.5;
    }
  }
  P.hookHold=inp.hook;
}
function hookStart(){
  const ox=P.x+P.face*.2,oy=P.y+1.35;let dx=G.aim.x-ox,dy=G.aim.y-oy;const l=Math.hypot(dx,dy)||1;dx/=l;dy/=l;
  const range=(has('grapple-plus')?30:20),best={t:1e9,e:null};
  for(const e of G.enemies){
    const ex=e.x-ox,ey=e.y+e.def.height*.5-oy,t=ex*dx+ey*dy;if(t<1||t>range)continue;
    const perp=Math.abs(ex*dy-ey*dx);if(perp<1.3+e.def.radius&&t<best.t)best={t,e};
  }
  let tx=null,ty=null,e=null;
  if(best.e){e=best.e;tx=e.x;ty=e.y+e.def.height*.5}
  else{
    const pts=W.ANCHORS.map(a=>({x:a.x,y:8.05}));
    for(const p of W.PLATFORMS){pts.push({x:p.x-p.w/2,y:p.y},{x:p.x+p.w/2,y:p.y})}
    let bd=3.2;
    for(const a of pts){
      const ax=a.x-ox,ay=a.y-oy,t=ax*dx+ay*dy;if(t<2||t>range*1.5||a.y<P.y+.5)continue;
      const perp=Math.abs(ax*dy-ay*dx);if(perp<bd&&t<best.t*10){bd=perp;tx=a.x;ty=a.y}
    }
  }
  if(tx===null){CL.AU.empty();P.hookCd=.25;return}
  P.hookE-=.35;P.hookCd=has('grapple-plus')?.7:1.2;
  P.hook={state:'fly',x:ox,y:oy,tx,ty,e,t:0};P.hookTarget=e||null;
  if(!P.hookM||!P.hookM.parent){P.hookM=MD.spawn('hook',CL.ents)}
  P.hookM.visible=true;CL.AU.hook();CL.fx.sparks(ox,oy,4,0xf2c14e,Math.atan2(dy,dx),6);
}
function hookEnd(){if(P.hook){P.hook=null;if(P.hookM)P.hookM.visible=false}}

/* ---------- 处决 ---------- */
function execTarget(){
  let best=null,bd=5;
  for(const e of G.enemies){if(!e.alive||e.boss||!e.execable)continue;const d=Math.hypot(e.x-P.x,e.y-P.y);if(d<bd){bd=d;best=e}}
  return best;
}
function execMove(dt){
  const x=P.exec;x.t+=dt;const e=x.e;P.inv=Math.max(P.inv,.05);
  if(!e.alive&&x.t<.15){P.exec=null;return}
  if(x.t<.16){
    const k=1-Math.pow(1-x.t/.16,2),tx=e.x-Math.sign(e.x-P.x||P.face)*.85;
    P.x=lerp(x.x0,tx,k);P.y=lerp(x.y0,e.y,k);P.vx=0;P.vy=0;P.face=Math.sign(e.x-P.x)||P.face;
  }else if(!x.hit){
    x.hit=true;P.x=e.x-Math.sign(e.x-P.x0||1)*.85;P.y=e.y;P.vy=0;
    CL.fx.flash(e.x,e.y+e.def.height*.5,1.6,0xfff3d6,.16);CL.fx.sparks(e.x,e.y+e.def.height*.6,22,0xf2c14e,0,16);
    stampAt('处决!',e.x,e.y+e.def.height+1,'#f2c14e',1.7);CL.AU.execute();R.shake(.6);G.hitstop=.11;
    heal(Math.round(P.hpMax*.25));G.stats.exec++;CL.addCombo(15);
    CL.killEnemy(e,{execute:true,x:e.x,y:e.y+e.def.height*.6,dir:Math.sign(e.x-P.x0)||1,fromFront:false});
  }else if(x.t>.5){P.exec=null;P.execCd=.2}
}
function execUpdate(dt,inp){
  if(P.exec){if(P.exec.t>.5)P.exec=null;return}
  if(inp.execEdge&&P.execCd<=0&&P.reload<=0){const e=execTarget();if(e){P.exec={e,t:0,x0:P.x,y0:P.y,hit:false};P.slide=0;P.reload=0;hookEnd()}}
}

/* ---------- 拾取 ---------- */
function onPick(p){
  let txt=null,col='#efe6d2';
  if(p.kind==='ammo'){const w=P.weapons.find(x=>x.id===p.weap);if(!w)return false;
    if(P.reserve[p.weap]>=P.cap[p.weap]&&w.mag>=w.magSize)return false;
    P.reserve[p.weap]=Math.min(P.cap[p.weap],P.reserve[p.weap]+p.amount);txt=D.W[p.weap].name+' 弹药 +'+p.amount;col='#56c2b6'}
  else if(p.kind==='med'){if(P.hp>=P.hpMax)return false;heal(p.amount);txt='生命 +'+p.amount;col='#e2654e'}
  else if(p.kind==='armor'){if(P.armor>=P.armorMax)return false;P.armor=Math.min(P.armorMax,P.armor+25);txt='装甲 +25';col='#58768a'}
  else{for(const w of P.weapons)if(P.reserve[w.id]!==Infinity)P.reserve[w.id]=Math.min(P.cap[w.id],P.reserve[w.id]+(D.AMMO_PICK[w.id]||0)*2);
    heal(25);P.nades=Math.min(P.nadeMax,P.nades+1);txt='空投：弹药补满 · 生命 +25 · 手雷 +1';col='#f2c14e'}
  CL.AU.pickup();CL.fx.sparks(p.x,p.y+.3,8,0xf2c14e,0,6);
  if(txt)CL.ui.toast(txt,col);
  return true;
}

/* ---------- 动画 ---------- */
function anim(dt){
  const pt=P.parts,m=P.m,sp=Math.abs(P.vx),cr=P.crouch?1:0,sl=clamp(P.slide/.5,0,1);
  m.position.set(P.x,P.y,PZ);m.scale.x=P.face;
  P.bob=damp(P.bob,cr?1:0,18,dt);
  if(P.ground&&sp>.5&&P.slide<=0)P.phase+=dt*sp*1.55;
  const k=clamp(sp/8,0,1.2),s=Math.sin(P.phase),c=Math.cos(P.phase);
  const air=!P.ground;
  let lf=air?-.5:s*.7*k,lb=air?.35:-s*.7*k,kf=air?1:Math.max(0,-s)*.9*k+.05,kb=air?.5:Math.max(0,s)*.9*k+.05;
  pt.legF.rotation.z=lf+cr*.95-sl*1.9;pt.legB.rotation.z=lb+cr*.95-sl*1.9;
  pt.kneeF.rotation.z=-(kf+cr*1.7-sl*.5);pt.kneeB.rotation.z=-(kb+cr*1.7-sl*.5);
  const ty=damp(pt.torso.position.y,.92-P.bob*.34-sl*.5,20,dt);pt.torso.position.y=ty;
  let lean=clamp(P.vx*P.face*.016,-.2,.2)+sl*.95;
  if(P.hook&&P.hook.state==='pull')lean=-.35;
  pt.torso.rotation.z=damp(pt.torso.rotation.z,lean,14,dt);
  // 瞄准角
  const gx=P.x+P.face*.45,gy=P.y+1.48-P.bob*.34;
  let ang=Math.atan2(G.aim.y-gy,(G.aim.x-gx)*P.face);ang=clamp(ang,-1.35,1.35);
  P.aimAng=damp(P.aimAng,ang,22,dt);
  pt.armF.rotation.z=P.aimAng+P.recoil*.55;
  const two=P.w.id!=='pistol'&&P.w.id!=='dual';
  pt.armB.rotation.z=two||P.w.id==='dual'?P.aimAng+P.recoil*.55+.08:Math.sin(P.phase)*.5*k+.25;
  pt.head.rotation.z=-P.aimAng*.22;
  // 枪：后坐 / 换弹 / 泵动
  const g=P.gunMesh;if(g){
    g.position.x=.42-P.recoil*.12;
    const rp=P.reload>0?1-P.reload/P.w.reload:0;
    g.rotation.z=P.reload>0?-1.15*Math.sin(Math.PI*Math.min(1,rp))-.0:-P.recoil*.35;
    g.position.y=.04-(P.reload>0?Math.sin(Math.PI*rp)*.12:0);
    const pump=g.getObjectByName('pump');if(pump)pump.position.x=.5-(P.pumpT>0?Math.sin(Math.PI*(1-P.pumpT/.55))*.15:0);
    const mag=g.getObjectByName('mag');if(mag)mag.position.y=-.2-(P.reload>0?Math.sin(Math.PI*rp)*.3:0);
  }
  if(P.gun2)P.gun2.position.x=.5-P.recoil*(P.dualSide?.12:0);
  // 围巾
  const wind=clamp(sp/12,0,1)*(P.ground?1:1.4)+(P.hook&&P.hook.state==='pull'?1:0);
  for(let i=0;i<5;i++){const sgn=pt['sc'+i];if(sgn)sgn.rotation.z=damp(sgn.rotation.z,.95-wind*.8+(P.vy>2?-.35:0)+Math.sin(G.t*9+i*1.1)*.13*(0.4+wind),10,dt)}
  // 受击闪烁
  if(P.inv>0&&P.hurt>0)m.visible=Math.sin(G.t*40)>-.4;else m.visible=true;
  // 影子
  const sy=support(P.x,P.y+0.001),hh=P.y-sy,sc=clamp(1-hh/9,.25,1)*.62;
  P.sh.position.set(P.x,sy+.025,PZ-.2);P.sh.scale.set(sc,sc*.6,1);P.sh.material.opacity=.3*clamp(1-hh/9,.2,1);
}
function dieAnim(dt){P.deadT+=dt;P.m.rotation.z=damp(P.m.rotation.z,-1.5*P.face,5,dt);P.m.position.y=P.y;P.m.visible=true;if(P.deadT>.6&&P.sh)P.sh.visible=false}

/* ---------- 每帧 ---------- */
function update(dt){
  if(P.dead){dieAnim(dt);return}
  P.inv-=dt;P.hurt-=dt;if(P.slowT>0)P.slowT-=dt;
  if(P.hurt<=0)R.U.uHurt.value=Math.max(0,R.U.uHurt.value);
  const inp=input();
  move(dt,inp);
  weapon(dt,inp);
  hookUpdate(dt,inp);
  execUpdate(dt,inp);
  // 熔蚀计时
  if(P.meltTarget&&(!P.meltTarget.alive||G.t-P.meltLast>.6))P.meltHeld=0;
  anim(dt);
}
const playerApi={get P(){return P},reset,update,giveCard,recompute,heal,addWeapon,switchTo,load,support,has:()=>has,XMAX,WALK,JUMP};
CL.player=playerApi;
})();
