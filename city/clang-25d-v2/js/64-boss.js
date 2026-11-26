/* ========================================================================
 * CLANG! 2.5D — 64 Boss：六个 Boss（屠宰机 / 督军 / 攻城锤 / 巢母 / 流沙巨口 / 未完工的机器）
 * 护甲条 → 弱点暴露；阶段（stagger）→ 呼叫援军；全部招式带地面预警
 * ====================================================================== */
(function(){
'use strict';
const T=THREE,CL=window.CL,{clamp,lerp,damp,rnd,pick}=CL;
const G=CL.G,R=CL.render,MD=CL.models,D=CL.D;
const GRAV=42,XMAX=25,RED=0xe2654e,YEL=0xffd36a,WHITE=0xf1ece2,CYAN=0x9ff5e6,SAND=0xd8b878,ORANGE=0xff8a4c;
const P=()=>G.P;
const MH={butcher:3.4,commander:5.4,siege:5.5,carrier:5.0,maw:4.4,titan:9.6};
const RAD={butcher:1.0,commander:1.0,siege:1.3,carrier:1.5,maw:1.6,titan:1.4};
const PREF={butcher:5,commander:11,siege:3.5,carrier:12,titan:8};
let cur=null;
const dv=()=>G.DV||D.DIFF.normal;
const dmgOf=e=>e.def.damage*e.mul.dmg*dv().enemyDamage;
const stamp=(t,x,y,c,s,l)=>CL.fx.stamp(t,x,y,c,s,l);
const alive=()=>cur&&cur.alive&&cur.state!=='dying';
function ebul(x,y,tx,ty,o){CL.bullets.efire(x,y,tx,ty,o)}
function train(e,n,gap,fn){for(let i=0;i<n;i++)CL.after(i*gap,()=>{if(e.alive&&e.state!=='dying')fn(i)})}
function touch(e,r,dy=2.6){const p=P();return p&&!p.dead&&Math.abs(p.x-e.x)<r&&Math.abs(p.y-e.y)<dy}
function knock(p,dir){if(p&&!p.dead){p.vx=dir*15;p.vy=Math.max(p.vy,6.5)}}
function dropTele(e){
  CL.tele.kill(e.tele);e.tele=null;
  if(e.tele2){CL.tele.kill(e.tele2);e.tele2=null}
  if(Array.isArray(e.tel)){for(const t of e.tel)CL.tele.kill(t)}
  e.tel=null;e.againN=0;
}
function idle(e,cd){dropTele(e);e.state='idle';e.t=0;e.stage=0;e.cd=cd*e.cdMul}
function start(e,name){dropTele(e);e.state=name;e.t=0;e.stage=0;e.hitCd=0;e.againN=0}
function faceTo(e,p){e.face=Math.sign(p.x-e.x)||e.face}
function walk(e,dt,p,preferred,spdMul=1){
  const dx=p.x-e.x,ad=Math.abs(dx);
  e.face=Math.sign(dx)||e.face;
  e.vx=(ad>preferred+1?e.face:ad<preferred-2?-e.face:0)*e.def.speed*spdMul*(p.dead?0:1);
}

/* ---------- 生成 ---------- */
function spawn(def,x,o={}){
  clear();
  const mul=CL.flow&&CL.flow.bossMul?CL.flow.bossMul():{hp:1,dmg:1},tier=o.tier||0;
  const hp=def.hp*mul.hp;
  const s=def.h/MH[def.id],bd=Object.assign({},def,{height:def.h,radius:RAD[def.id],guard:0,armour:0,heavy:true});
  const m=MD.spawn(def.id,CL.ents);
  const e=cur={boss:true,id:def.id,def:bd,base:def.id,m,parts:m.userData.parts,scale:s,x:Math.sign(x||1)*(XMAX-2.5),y:0,vx:0,vy:0,face:-Math.sign(x||1),z:1.0,
    h:def.h,radius:RAD[def.id],hp,hpMax:hp,alive:true,state:'intro',t:0,cd:1,cd2:0,hitCd:0,atk:null,stage:0,phase:0,tier,mul,flash:0,flashLast:0,
    armourMax:hp*def.armour,armourHp:hp*def.armour,weakT:0,hitT:-9,tele:null,under:false,untargetable:false,pit:null,melt:0,burn:null,phaseA:rnd(0,6),
    called:new Set(),door:0,cdMul:1,overload:false,againN:0,travel:0,travelMax:0,dir:1,tx:0,gx0:0,gx:0,bdir:1,vort:null};
  e.sh=MD.shadow();CL.ents.add(e.sh);
  e.preHit=(dmg,o)=>preHit(e,dmg,o);
  G.boss=e;
  if(CL.ui&&CL.ui.bossIntro)CL.ui.bossIntro(e);
  CL.AU.boss&&CL.AU.boss();
  return e;
}
function clear(){
  const e=cur;if(!e)return;
  dropTele(e);if(e.vort)CL.tele.kill(e.vort);e.vort=null;
  if(e.m.parent)e.m.parent.remove(e.m);CL.ink.unreg(e.m);
  if(e.sh&&e.sh.parent)e.sh.parent.remove(e.sh);
  cur=null;G.boss=null;
  if(CL.ui&&CL.ui.bossHide)CL.ui.bossHide();
}

/* ---------- 命中圈 ---------- */
function bossCircles(e){
  const out=[],h=e.h,n=Math.max(2,Math.round(h/1.5)),r=e.radius;
  for(let i=0;i<n;i++)out.push({x:e.x,y:e.y+(i+.5)*h/n,r:r*(i===n-1?.82:1),part:i===n-1?'head':'body'});
  if(e.id==='butcher')out.push({x:e.x-e.face*.55,y:e.y+h*.42,r:.5,part:'engine'});
  if(e.id==='commander')out.push({x:e.x+e.face*.62,y:e.y+h*.62,r:.4,part:'chest'});
  if(e.id==='carrier'&&e.door>0)out.push({x:e.x+e.face*.5,y:e.y+h*.35,r:.7,part:'hangar'});
  if(e.id==='maw'&&e.state==='up')out.push({x:e.x+e.face*.4,y:e.y+h*.22,r:.6,part:'belly'});
  if(e.id==='titan')out.push({x:e.x+e.face*.9,y:e.y+h*.6,r:.42,part:'core'});
  return out;
}

/* ---------- 受击（挂到 hitEnemy 的 preHit） ---------- */
function preHit(e,dmg,o){
  if(!e.alive||e.state==='dying'||e.state==='intro')return 0;
  if(e.under){ // 潜地时只有坑里的爆炸有效（×2）
    if(o.blast&&e.pit&&Math.hypot((o.x??e.x)-e.pit.x,0)<2.4){
      dmg*=2;if(!o.silent)stamp('坑里!×2',e.x,e.h*.5+1,CYAN,1.3,.5);
      e.weakT=Math.max(e.weakT,1.6);e.pitHit=true;
    }else return 0;
  }
  let d=dmg;
  const weakPart=o.part==='engine'||o.part==='core'||(o.part==='hangar'&&e.door>0)||(o.part==='belly'&&e.state==='up')||o.part==='chest';
  if(o.part==='head'||weakPart)d*=1.5;
  else if(!o.fromFront&&!o.blast&&!o.dot)d*=1.3; // 背后散热口
  if(e.weakT>0)d*=1.4;
  if(e.overload)d*=1.4;
  if(e.id==='carrier'){let n=0;for(const x of G.enemies)if(x.alive&&x.droneOf===e)n++;if(n)d*=Math.pow(.78,n)}
  let a=0;
  if(e.armourHp>0&&o.fromFront&&!o.blast&&!o.dot&&(o.ap||0)<1&&!weakPart){
    const toArm=Math.min(e.armourHp,d*.75);e.armourHp-=toArm;a=toArm;d-=toArm;
    if(!o.silent)CL.AU.hit(false);
    if(e.armourHp<=0)armourBreak(e);
  }
  e.hp-=d;e.flash=.08;e.hitT=G.t;G.stats.dmg+=d+a;
  if(o.part==='head'&&o.part!=='body'&&!o.silent&&d>=30)stamp('爆!',e.x,e.y+e.h*.95,YEL,.85,.14);
  if(e.hp<=0){e.hp=0;startDying(e)}
  else{
    const k=e.hp/e.hpMax,ph=e.def.phases;
    if(e.phase<ph.length&&k<=ph[e.phase]){e.phase++;phaseShift(e)}
    for(const c of e.def.calls)if(!e.called.has(c)&&k<=c.at){e.called.add(c);callUnits(e,c.units)}
  }
  return d+a;
}
function armourBreak(e){
  e.armourHp=0;e.weakT=2.4;
  stamp('护甲碎!',e.x,e.y+e.h+1,YEL,1.6,.6);CL.AU.clangSfx();R.shake(.35);
  CL.fx.debris(e.x,e.y+e.h*.5,[0x7c8086,0x3f4247,0x9a3524],14,10);
  if(CL.ui&&CL.ui.toast)CL.ui.toast('护甲碎了 · 弱点暴露 ×1.4','#f2c14e');
}
function phaseShift(e){
  dropTele(e);start(e,'stagger');e.weakT=2.6;e.vx=0;
  if(e.id==='titan'){e.armourHp=e.armourMax;if(e.phase>=e.def.phases.length){e.overload=true;stamp('过载!!',e.x,e.y+e.h+1.2,RED,2,.8)}else stamp('新护甲!',e.x,e.y+e.h+1.2,YEL,1.5,.7)}
  else stamp(pick(['哐——!!','过载!','KRRRK!']),e.x,e.y+e.h+1.2,RED,1.8,.7);
  CL.fx.flash(e.x,e.y+e.h*.5,e.radius*3,0xfff3d6,.2);CL.fx.sparks(e.x,e.y+e.h*.6,26,YEL,0,14);
  R.shake(.8);CL.AU.boss&&CL.AU.boss();G.hitstop=Math.max(G.hitstop,.08);
}
function callUnits(e,units){
  stamp('呼叫援军!',e.x,e.y+e.h*.5,ORANGE,1.1,.5);CL.AU.warn&&CL.AU.warn();
  let i=0;
  for(const [id,n] of units)for(let k=0;k<n;k++){
    const side=(i++%2?1:-1),x=clamp(e.x+side*(2.5+rnd(0,4)),-XMAX+1.5,XMAX-1.5);
    CL.after(i*.25,()=>{if(alive())CL.enemies.spawn(id,x)});
  }
}

/* ---------- 通用招式（攻城锤 / 未完工的机器 共用） ---------- */
const MV={};
MV.slam=(e,dt,o)=>{
  const p=P(),hx=e.x+e.face*(o.reach||1.6);
  if(e.stage===0){
    e.vx=0;if(!e.tele){e.tele=CL.tele.ring(hx,0,o.r,o.wind,WHITE,{op:.55});e.againN=o.again?1:0}
    if(e.t>=o.wind){
      CL.tele.kill(e.tele);e.tele=null;e.stage=1;e.t=0;
      CL.fx.flash(hx,.4,2.4,0xfff3d6,.14);CL.fx.dust(hx,0,24);R.shake(.65);CL.AU.slam();stamp('轰!!',hx,e.h*.5+1,WHITE,1.7,.3);
      if(p&&!p.dead&&Math.abs(p.x-hx)<o.r&&Math.abs(p.y-e.y)<2.4){CL.dmgPlayer(dmgOf(e)*(o.dmgK||1),e.def.name);knock(p,Math.sign(p.x-hx)||1)}
      for(const s of[-1,1])for(const sp of o.shock)ebul(hx,.3,hx+s,.3,{speed:sp,r:.34,dmg:dmgOf(e)*.45,low:true,life:o.life||1.4,src:e.def.name,col:RED});
    }
  }else if(e.againN>0&&e.t>=.62){e.againN--;e.stage=0;e.t=0}
  else if(e.t>=.75)idle(e,o.cd||1.4);
};
MV.fissure=(e,dt,o)=>{
  if(e.stage===0){
    e.vx=0;const L=e.travelMax;
    if(!e.tele){e.tx=e.x+e.face*1.5;e.dir=e.face;e.tele=CL.tele.bar(e.tx+e.dir*L/2,0,L,.9,o.wind,RED,{op:.75})}
    if(e.t>=o.wind){
      dropTele(e);e.stage=1;e.t=0;CL.AU.slam();R.shake(.45);stamp('裂!',e.tx+e.dir*2,2,RED,1.3,.3);
      const x0=e.tx,dir=e.dir;
      for(let i=0;i<o.n;i++)CL.after(i*.14,()=>{if(!alive())return;
        ebul(x0,.5,x0+dir,.5,{speed:o.speed,r:o.r,dmg:dmgOf(e)*.6,life:L/o.speed+.06,src:e.def.name,col:ORANGE})});
      for(let i=0;i<L;i+=1.5)CL.after(i/o.speed,()=>{if(!alive())return;CL.fx.dust(x0+dir*i,0,5);CL.fx.sparks(x0+dir*i,.2,3,ORANGE,Math.PI/2,7)});
    }
  }else if(e.t>=o.wind+.7)idle(e,1.3);
};
MV.fan=(e,dt,o)=>{
  const p=P();
  if(e.stage===0){
    e.vx=0;if(p)faceTo(e,p);
    if(e.t>=o.wind){
      e.stage=1;e.t=0;
      train(e,o.bursts,o.gap,()=>{
        const q=P();if(!q)return;
        const x=e.x+e.face*1.3,y=e.y+e.h*.62;CL.fx.flash(x,y,.7,YEL,.08);CL.AU.shoot('shotgun');
        const base=Math.atan2(1.05-y,q.x-x);
        for(let i=0;i<o.n;i++){const a=base+(i/(o.n-1)-.5)*2*o.spread;ebul(x,y,x+Math.cos(a)*5,y+Math.sin(a)*5,{speed:o.speed,r:.14,dmg:dmgOf(e),col:YEL,src:e.def.name})}
      });
    }
  }else if(e.t>=o.bursts*o.gap+.25){
    if(o.reload){e.state='reload';e.t=0;e.weakT=o.reload;CL.AU.reload();stamp('装填!',e.x,e.y+e.h+1,CYAN,1.2,.5)}
    else idle(e,1.1);
  }
};
MV.fireline=(e,dt,o)=>{
  if(e.stage===0){
    e.vx=0;if(P())faceTo(e,P());
    if(!e.tele){
      const L=XMAX-1-Math.abs(e.x)-1.5;e.travelMax=Math.max(3,L);
      const mk=d=>CL.tele.bar(e.x+d*(1.5+L/2),0,L,.9,o.wind,RED,{op:.7});
      e.tele=mk(e.face);if(o.both){e.tele2=mk(-e.face)}
    }
    if(e.t>=o.wind){
      dropTele(e);if(e.tele2){CL.tele.kill(e.tele2);e.tele2=null}
      e.stage=1;e.t=0;CL.AU.shoot('rifle');
      const dirs=o.both?[e.face,-e.face]:[e.face];
      train(e,o.n,o.gap,()=>{for(const d of dirs)ebul(e.x+d*1.5,.35,e.x+d*3,.35,{speed:o.speed,r:.3,low:true,dmg:dmgOf(e)*.7,life:6,src:e.def.name,col:RED})});
    }
  }else if(e.t>=o.wind+o.n*o.gap+.4)idle(e,1.2);
};
MV.stomp=(e,dt,o)=>{
  if(e.stage===0){
    e.vx=0;if(!e.tele)e.tele=CL.tele.ring(e.x,0,o.r,o.wind,RED,{op:.5});
    if(e.t>=o.wind){dropTele(e);e.stage=1;e.t=0;
      CL.fx.dust(e.x,0,18);R.shake(.55);CL.AU.slam();stamp('踏!',e.x,e.h*.5+1,RED,1.5,.3);
      if(touch(e,o.r,2.4)){if(CL.dmgPlayer(dmgOf(e),e.def.name))knock(P(),Math.sign(P().x-e.x)||1)}
      for(const s of[-1,1])ebul(e.x,.3,e.x+s,.3,{speed:9,r:.4,dmg:dmgOf(e)*.45,low:true,life:1.3,src:e.def.name,col:RED});
    }
  }else if(e.t>=.6)idle(e,.9);
};
MV.charge=(e,dt,o)=>{
  const p=P();
  if(e.stage===0){
    e.vx=0;if(p)faceTo(e,p);
    if(!e.tele){e.travelMax=o.L??clamp(Math.abs((p?p.x:0)-e.x)+6,8,22);e.tele=CL.tele.bar(e.x+e.face*e.travelMax/2,0,e.travelMax,1.7,o.wind,RED,{op:.7})}
    if(e.t>=o.wind){dropTele(e);e.stage=1;e.t=0;e.travel=0;CL.fx.flash(e.x,e.y+1,2,0xff6a4c,.1);CL.AU.warn()}
  }else{
    e.vx=e.face*o.speed;e.travel+=o.speed*dt;
    if(CL.fx.dust&&(e.phaseA+=dt)>.05){e.phaseA=0;CL.fx.dust(e.x-e.face*1.2,0,2)}
    if(e.hitCd<=0&&touch(e,o.hit,2.8)){e.hitCd=.5;if(CL.dmgPlayer(dmgOf(e),e.def.name))knock(p,e.face)}
    const wall=Math.abs(e.x)>=XMAX-1.8;
    if(wall&&o.stun){e.state='stun';e.t=0;e.vx=0;e.weakT=1.8;CL.fx.dust(e.x,0,24);R.shake(.85);CL.AU.slam();stamp('哐!!',e.x,e.y+e.h+1,YEL,1.9,.6);if(CL.ui&&CL.ui.toast)CL.ui.toast('它晕了 · 绕到背后打发动机','#56c2b6')}
    else if(wall||e.travel>=e.travelMax)idle(e,o.cd||1.4);
  }
};
MV.leap=(e,dt,o)=>{
  const p=P();
  if(e.stage===0){
    e.vx=0;
    if(!e.tele){e.tx=clamp((p?p.x:0)+(p.vx||0)*.3,-XMAX+2,XMAX-2);e.tele=CL.tele.ring(e.tx,0,o.r,o.wind,RED,{op:.6})}
    if(e.t>=o.wind){dropTele(e);e.stage=1;e.t=0;const Tm=.8;e.vx=(e.tx-e.x)/Tm;e.vy=.5*GRAV*Tm;e.face=Math.sign(e.vx)||e.face;CL.AU.jump&&CL.AU.jump()}
  }else if(e.t>.3&&e.vy<=0&&e.y<=0){
    e.y=0;e.vy=0;e.vx=0;
    CL.fx.dust(e.x,0,22);R.shake(.6);CL.AU.slam();stamp('轰!',e.x,e.h*.5+1,WHITE,1.6,.3);
    if(touch(e,o.r*.8,2.5))CL.dmgPlayer(dmgOf(e),e.def.name);
    for(const s of[-1,1])ebul(e.x,.3,e.x+s,.3,{speed:9,r:.32,dmg:dmgOf(e)*.5,low:true,life:1.2,src:e.def.name,col:RED});
    idle(e,1.2);
  }
};
MV.hangar=(e,dt,o)=>{
  if(e.stage===0){e.vx=0;if(e.t>=.4){e.stage=1;e.t=0;e.door=o.dur;stamp('放出无人机!',e.x,e.y+e.h+1,ORANGE,1.1,.5);CL.AU.warn&&CL.AU.warn();
    train(e,o.n,.6,i=>{if(!alive())return;const d=CL.enemies.spawn('drone',clamp(e.x+e.face*3,-XMAX+2,XMAX-2));if(d){d.riseY=e.y+e.h*.6;d.riseT=.7;d.droneOf=e;d.spawnT=.5}})}}
  else{e.door=Math.max(0,e.door-dt);if(e.t>=o.dur+.3){e.door=0;idle(e,1.1)}}
};
MV.airstrike=(e,dt,o)=>{
  const p=P();
  if(e.stage===0){
    e.vx=0;
    if(!e.tel){e.tel=[];const c=p?p.x:0;
      o.spots.map(s=>clamp(c+s,-XMAX+2.5,XMAX-2.5)).forEach((x,i)=>{
        const t=CL.tele.ring(x,0,o.r,1.15+i*.12,WHITE,{op:.7});e.tel.push(t);
        CL.after(.35+i*.12,()=>{if(!alive())return;CL.lob('shell',x,15,0,-4,{r:.25,onLand:()=>{},spin:0})});
        t.onEnd=()=>{CL.explode(x,.3,o.r,dmgOf(e)*1.25,{sparks:18,debris:8,power:10,knock:8,noBoss:true,label:'轰!!'});CL.fx.debris(x,3,[0x3d4348,0x1d1f22],5,7)};
      });
    }
    if(e.t>=1.9){for(const t of e.tel)CL.tele.kill(t);e.tel=null;idle(e,1.3)}
  }
};
MV.barrage=(e,dt,o)=>{
  const p=P();
  if(e.stage===0){e.vx=0;if(!e.tel){e.tel=true;
    train(e,o.n,o.gap,()=>{const q=P();if(!q)return;const tx=clamp(q.x+q.vx*.5+rnd(-o.spread,o.spread),-XMAX+2.5,XMAX-2.5),Tm=1.0,sx=e.x+e.face*1.2,sy=e.y+e.h*.85;
      CL.lob('shell',sx,sy,(tx-sx)/Tm,(0.1-sy)/Tm+.5*GRAV*Tm,{r:o.r,warn:Tm+.05,warnR:o.r,col:WHITE,onLand:b=>CL.explode(b.x,.3,o.r,dmgOf(e),{sparks:14,debris:6,power:9,knock:7,noBoss:true,label:'轰!'})});CL.AU.clack()});
  }
  if(e.t>=o.n*o.gap+.6){e.tel=null;idle(e,1.3)}
  }
};
MV.beam=(e,dt,o)=>{
  const p=P(),ax=()=>e.x+e.face*1.1,ay=()=>e.y+e.h*.8;
  if(e.stage===0){
    e.vx=0;if(!e.tel){e.tel=true;e.gx0=clamp((p?p.x:0),-XMAX+1,XMAX-1);e.bdir=Math.random()<.5?-1:1;if(Math.abs(e.gx0+e.bdir*16)>XMAX)e.bdir=-e.bdir}
    CL.fx.tracer(ax(),ay(),e.gx0,0,RED,.05,.03);CL.fx.sparks(e.gx0,.1,1,RED,Math.PI/2,3);
    if(e.t>=o.wind){e.stage=1;e.t=0;CL.AU.laser&&CL.AU.laser();stamp('光束!',e.x,e.y+e.h+1,CYAN,1.4,.5)}
  }else{
    const k=clamp(e.t/o.dur,0,1);e.gx=e.gx0+e.bdir*16*k;
    CL.fx.tracer(ax(),ay(),e.gx,0,CYAN,.16,.03);CL.fx.tracer(ax(),ay(),e.gx,0,0xfff3d6,.06,.03);
    CL.fx.sparks(e.gx,.1,3,WHITE,Math.PI/2,8);
    if(e.hitCd<=0&&p&&!p.dead&&CL.segCircle(ax(),ay(),e.gx,0,p.x,p.y+.9,.95)){e.hitCd=.32;CL.dmgPlayer(dmgOf(e)*.55,e.def.name)}
    if(e.t>=o.dur)idle(e,1.2);
  }
};

/* ---------- 各 Boss 的选招 / 招式 ---------- */
const AI={};
AI.butcher={
  choose(e,p){const ad=Math.abs(p.x-e.x);if(ad<3.6)return pick(['spin','spin','leap']);if(ad>9)return pick(['charge','charge','leap']);return pick(['charge','spin','leap'])},
  step(e,dt,p){
    if(e.state==='charge')MV.charge(e,dt,{wind:.75,speed:27,hit:1.7,stun:true,cd:1.3});
    else if(e.state==='spin'){
      if(e.stage===0){e.vx=0;if(e.t>=.45){e.stage=1;e.t=0;CL.AU.warn()}}
      else{e.vx=e.face*e.def.speed*.8;if(touch(e,3.3,3.2)&&e.hitCd<=0){e.hitCd=.28;if(CL.dmgPlayer(dmgOf(e)*.55,'屠宰机'))knock(p,e.face)}
        if(e.t>=.95)idle(e,1.2)}
    }else if(e.state==='leap')MV.leap(e,dt,{wind:.5,r:2.6});
    else if(e.state==='stun'){e.vx=0;if(e.t>=1.8)idle(e,.6)}
  }
};
AI.commander={
  choose(e,p){const ad=Math.abs(p.x-e.x);if(ad<3.6)return pick(['stomp','stomp','fan']);return pick(['fan','fan','fireline'])},
  step(e,dt,p){
    if(e.state==='fan')MV.fan(e,dt,{wind:.6,bursts:3,gap:.35,n:7,spread:.14,speed:7,reload:1.4});
    else if(e.state==='fireline')MV.fireline(e,dt,{wind:.7,n:8,gap:.11,speed:10});
    else if(e.state==='stomp')MV.stomp(e,dt,{wind:.35,r:3});
  }
};
AI.siege={
  choose(e,p){const ad=Math.abs(p.x-e.x);if(ad<5.5)return 'slam';if(ad>9)return pick(['fissure','ram']);return pick(['slam','fissure','ram'])},
  step(e,dt,p){
    const low=e.hp<e.hpMax*.5;
    if(e.state==='slam')MV.slam(e,dt,{wind:.9,r:4.6,shock:[9],reach:1.6,cd:1.5,again:low});
    else if(e.state==='fissure')MV.fissure(e,dt,{wind:.75,speed:14,n:3,r:.6,L:clamp(Math.abs(p.x-e.x)+6,8,20)});
    else if(e.state==='ram')MV.charge(e,dt,{wind:.6,speed:16,hit:1.9,stun:false,L:13,cd:1.2});
    // 背后蒸汽：站它背后太近会被喷开
    if(e.cd2<=0&&p&&!p.dead&&Math.sign(p.x-e.x)!==e.face&&Math.abs(p.x-e.x)<2.3&&Math.abs(p.y-e.y)<2.5){
      e.cd2=2.4;CL.fx.sparks(e.x-e.face*1.1,e.y+2.2,14,WHITE,-Math.PI/2,9);CL.AU.explode(.4);
      if(CL.dmgPlayer(dmgOf(e)*.4,'攻城锤'))knock(p,-e.face);
    }
  }
};
AI.carrier={
  choose(e,p){const ad=Math.abs(p.x-e.x);let n=0;for(const x of G.enemies)if(x.alive&&x.droneOf===e)n++;if(ad<4)return n<3?pick(['hangar','guns']):'guns';return n<4?pick(['guns','airstrike','hangar']):pick(['guns','airstrike'])},
  step(e,dt,p){
    if(e.state==='guns'){
      if(e.stage===0){e.vx=0;if(e.t>=.5){e.stage=1;e.t=0;faceTo(e,p);e.gx=e.face;
        train(e,10,.13,i=>{const q=P();if(!q)return;const d=i%2?1:-1,x=e.x+e.gx*1.3,y=e.y+e.h*.72,err=1.1*dv().aimError;
          ebul(x,y,q.x+rnd(-err,err),q.y+1.1+rnd(-err,err)*.5,{speed:8.5,r:.15,dmg:dmgOf(e),col:ORANGE,src:'巢母'});CL.fx.flash(x,y,.4,YEL,.05);CL.AU.shoot('pistol')})}}
      else if(e.t>=1.9)idle(e,1.2);
    }
    else if(e.state==='hangar')MV.hangar(e,dt,{n:2,dur:3.2});
    else if(e.state==='airstrike')MV.airstrike(e,dt,{spots:[0,-5,5],r:2.5});
    // 践踏
    if(e.cd2<=0&&touch(e,3.2,3)){e.cd2=1.3;R.shake(.5);CL.AU.slam();stamp('踏!',e.x,e.y+2,RED,1.3,.3);if(CL.dmgPlayer(dmgOf(e),'巢母'))knock(p,Math.sign(p.x-e.x)||1)}
  }
};
AI.maw={
  choose(){return 'under'},
  step(e,dt,p){
    const d=e.def,h=e.h;
    if(e.state==='under'){
      e.untargetable=true;e.under=true;e.y=-h*1.15;e.noGrav=true;
      e.vx=p.dead?0:clamp((p.x-e.x)*1.5,-d.speed,d.speed);
      if(Math.random()<dt*14)CL.fx.sparks(e.x+rnd(-1.5,1.5),.05,1,SAND,Math.PI/2,3);
      if(e.pit){e.pit.t-=dt;if(e.pit.t<=0)e.pit=null}
      if(e.t>=1.0){start(e,'ring');e.tx=clamp(p.x,-XMAX+3,XMAX-3);e.tele=CL.tele.ring(e.tx,0,3.4,1.0,SAND,{op:.8,grow:true});CL.AU.rumble&&CL.AU.rumble()}
    }else if(e.state==='ring'){
      e.vx=lerp(e.vx,0,dt*6);e.under=true;e.untargetable=true;
      if(Math.random()<dt*20)CL.fx.sparks(e.tx+rnd(-2.5,2.5),.05,2,SAND,Math.PI/2,4);
      if(e.t>=1.0){dropTele(e);start(e,'erupt');e.x=e.tx;e.vx=0;e.face=Math.sign(p.x-e.x)||1}
    }else if(e.state==='erupt'){
      const k=clamp(e.t/.38,0,1);e.y=-h*1.15*(1-k*k);e.under=k<.6;e.untargetable=k<.6;e.vx=0;
      if(k>=1&&!e.eruptHit){e.eruptHit=true;e.y=0;e.under=false;e.untargetable=false;
        CL.fx.dust(e.x,0,30);CL.fx.flash(e.x,1,3.5,SAND,.16);R.shake(.7);CL.AU.slam();stamp('轰!!',e.x,h*.5+1,SAND,1.8,.4);
        if(touch(e,3.2,3.4))CL.dmgPlayer(dmgOf(e)*1.3,e.def.name);
        for(const s of[-1,1])ebul(e.x,.3,e.x+s,.3,{speed:9,r:.3,dmg:dmgOf(e)*.4,low:true,life:1.3,src:e.def.name,col:SAND});
        start(e,'up');e.upT=0}
    }else if(e.state==='up'){
      e.y=0;e.under=false;e.untargetable=false;faceTo(e,p);e.upT+=dt;e.vx=p.dead?0:clamp((p.x-e.x)*.35,-2.2,2.2);
      // 咬
      if(Math.abs(p.x-e.x)<3.8&&e.cd2<=0&&e.t>.3){e.cd2=1.6;e.bite=.35;CL.AU.warn&&CL.AU.warn()}
      if(e.bite!==undefined){e.bite-=dt;if(e.bite<=0){delete e.bite;if(touch(e,3.8,3.2)){if(CL.dmgPlayer(dmgOf(e),e.def.name))knock(p,e.face)}stamp('咬!',e.x+e.face*2.5,2.2,RED,1.3,.3);R.shake(.35)}}
      // 沙石弹
      if(e.upT>1.1&&!e.r1){e.r1=1;for(let i=0;i<3;i++)CL.after(i*.22,()=>{if(!alive()||e.state!=='up')return;const q=P(),tx=clamp(q.x+rnd(-1.2,1.2),-XMAX+2,XMAX-2),Tm=1.0,sx=e.x+e.face*2.2,sy=e.y+h*.7;
        CL.lob('rock',sx,sy,(tx-sx)/Tm,(0.1-sy)/Tm+.5*GRAV*Tm,{r:1.6,warn:Tm+.05,warnR:1.6,col:SAND,dmg:dmgOf(e)*.8,onLand:b=>CL.explode(b.x,.2,1.6,b.dmg,{sparks:8,debris:4,power:7,noBoss:true,color:SAND})});CL.AU.clack()})}
      // 流沙漩涡
      if(e.upT>2.4&&!e.vortDone){e.vortDone=1;const vx0=clamp(p.x,-XMAX+5,XMAX-5);e.vort={x:vx0,t:3.6};e.vortTele=CL.tele.ring(vx0,0,4.2,3.6,SAND,{op:.55,grow:false});stamp('流沙!',vx0,3,SAND,1.3,.5);CL.AU.rumble&&CL.AU.rumble()}
      if(e.vort){e.vort.t-=dt;if(e.vort.t<=0){e.vort=null;CL.tele.kill(e.vortTele);e.vortTele=null}
        else if(p&&!p.dead&&Math.abs(p.x-e.vort.x)<4.2&&p.y<.3){p.slowT=Math.max(p.slowT||0,.2);if(e.cd3===undefined)e.cd3=0;e.cd3-=dt;if(e.cd3<=0){e.cd3=.5;CL.dmgPlayer(dmgOf(e)*.3,'流沙')}}}
      if(e.t>=5.2){start(e,'down');if(e.vort){e.vort=null;CL.tele.kill(e.vortTele);e.vortTele=null}}
    }else if(e.state==='down'){
      const k=clamp(e.t/.6,0,1);e.y=-h*1.15*k*k;e.under=k>.3;e.untargetable=k>.3;e.vx=0;
      if(k>=1){start(e,'under');e.pit={x:e.x,t:2.4};e.r1=0;e.vortDone=0;e.eruptHit=false;CL.fx.dust(e.x,0,20);CL.AU.slam&&CL.AU.slam()}
    }
  }
};
AI.titan={
  choose(e,p){
    const ad=Math.abs(p.x-e.x),pool=['slam','fan','fissure'];
    if(e.phase>=1)pool.push('barrage','fireline');if(e.phase>=2)pool.push('beam','ram');
    if(ad<4.5)pool.push('slam','stomp');if(ad>12)pool.push('ram','barrage');
    return pick(pool);
  },
  step(e,dt,p){
    const ph=e.phase;
    if(e.state==='slam')MV.slam(e,dt,{wind:.85,r:5.4,shock:ph>=1?[9,13]:[9],reach:2,cd:1.3,again:ph>=2});
    else if(e.state==='fan')MV.fan(e,dt,{wind:.6,bursts:ph>=2?5:3,gap:.32,n:9,spread:.18,speed:8,reload:1.2});
    else if(e.state==='fissure')MV.fissure(e,dt,{wind:.75,speed:15,n:3,r:.65,L:clamp(Math.abs(p.x-e.x)+8,8,24)});
    else if(e.state==='ram')MV.charge(e,dt,{wind:.65,speed:20,hit:2.2,stun:false,L:16,cd:1.1});
    else if(e.state==='barrage')MV.barrage(e,dt,{n:4,gap:.24,spread:3.5,r:2.3});
    else if(e.state==='fireline')MV.fireline(e,dt,{wind:.7,n:9,gap:.1,speed:11,both:true});
    else if(e.state==='beam')MV.beam(e,dt,{wind:.7,dur:1.3});
    else if(e.state==='stomp')MV.stomp(e,dt,{wind:.35,r:3.6});
  }
};

/* ---------- 死亡 ---------- */
function startDying(e){
  start(e,'dying');e.vx=0;e.vy=0;e.untargetable=true;e.under=false;e.y=0;e.vort=null;
  G.ebullets.length=0;G.hitstop=Math.max(G.hitstop,.12);R.shake(.9);CL.AU.boss&&CL.AU.boss();
  stamp('报废!!',e.x,e.y+e.h+1.2,YEL,2.2,.9);
  for(const x of G.enemies.slice())CL.killEnemy(x,{blast:true,x:x.x,y:x.y,weapon:'boss'});
}
function finishDying(e){
  const cs=CL.modelColors(e.m);
  CL.fx.debris(e.x,e.y+e.h*.5,cs,44,15);CL.fx.sparks(e.x,e.y+e.h*.5,30,YEL,0,16);CL.fx.flash(e.x,e.y+e.h*.5,5,0xfff3d6,.3);
  CL.explode(e.x,e.y+e.h*.4,e.radius*2.4,0,{noSelf:true,quiet:true,sparks:20,debris:10,power:12,noBoss:true});
  CL.AU.explode(2.5);R.shake(1);
  G.stats.bossKills++;CL.addScore(1500+e.tier*1500);CL.addCombo(25);
  CL.drop(e.x-1,e.y+e.h*.3,'crate');CL.drop(e.x+1,e.y+e.h*.3,'crate');CL.drop(e.x,e.y+e.h*.3,'med',null,40);
  for(let i=0;i<3;i++)CL.drop(e.x+rnd(-2,2),e.y+1,'ammo',pick(['rifle','shotgun','sniper']),30);
  e.alive=false;
  if(e.m.parent)e.m.parent.remove(e.m);CL.ink.unreg(e.m);
  if(e.sh&&e.sh.parent)e.sh.parent.remove(e.sh);
  cur=null;G.boss=null;
  if(CL.ui&&CL.ui.bossHide)CL.ui.bossHide();
  if(CL.flow&&CL.flow.onBossDead)CL.flow.onBossDead(e);
}

/* ---------- 动画 ---------- */
function anim(e,dt){
  const m=e.m,pt=e.parts,s=e.scale,p=P();
  m.position.set(e.x,e.y,e.z);m.scale.set(e.face*s,s,s);
  if(e.flash>0&&e.flashLast!==1){CL.ink.setFlash(m,true);e.flashLast=1}else if(e.flash<=0&&e.flashLast!==0){CL.ink.setFlash(m,false);e.flashLast=0}
  const sp=Math.abs(e.vx);if(sp>.5)e.phaseA+=dt*sp*1.1;
  const sn=Math.sin(e.phaseA),k=clamp(sp/4,0,1);
  const leg=(n,dir)=>{const l=pt[n],kn=pt['knee'+n.slice(3)];if(!l)return;l.rotation.z=dir*sn*.6*k;if(kn)kn.rotation.z=-Math.max(0,dir*-sn)*.55*k};
  const raise=(name,to,sp)=>{const a=pt[name];if(a)a.rotation.z=damp(a.rotation.z,to,sp,dt)};
  const wind=e.stage===0,act=e.stage===1;
  let ang=0;if(p){const gy=e.y+e.h*.62;ang=clamp(Math.atan2(p.y+1.1-gy,(p.x-e.x)*e.face),-1.2,.6)}
  if(e.id==='butcher'){
    leg('legF',1);leg('legB',-1);pt.torso.rotation.z=k*.12+(e.state==='charge'&&act?.32:0);
    if(pt.saw)pt.saw.rotation.x+=dt*(e.state==='spin'&&act?50:e.state==='charge'?30:10);
    if(e.state==='spin')raise('armF',act?-1.2:1.6,16);else if(e.state==='leap')raise('armF',act?-.9:2.0,14);else raise('armF',wind?1.9:.4+sn*.3*k,10);
    raise('armB',-sn*.3*k-.2,10);if(pt.head)pt.head.rotation.z=e.state==='stun'?Math.sin(G.t*30)*.12:0;
  }else if(e.id==='commander'){
    leg('legF',1);leg('legB',-1);
    raise('armF',e.state==='fan'?(wind?ang+.25:ang):e.state==='reload'?-.6:ang*.9,12);
    raise('armB',-.3-sn*.3*k,10);if(pt.head)pt.head.rotation.z=ang*.4;
    if(pt.chest)pt.chest.scale.setScalar(e.weakT>0||e.state==='reload'?1.35+Math.sin(G.t*22)*.25:1);
  }else if(e.id==='siege'){
    leg('legF',1);leg('legB',-1);
    raise('armF',wind&&e.state==='slam'?1.7:act&&e.state==='slam'&&e.t<.25?-1.5:-.2,act?26:10);
    pt.torso.rotation.z=wind&&e.state==='slam'?-.15:act&&e.state==='slam'&&e.t<.25?.25:0;
    if(pt.vents)pt.vents.scale.setScalar(e.weakT>0?1.2:1);
  }else if(e.id==='carrier'){
    pt.torso.rotation.z=k*.05+Math.sin(G.t*1.5)*.03;pt.torso.position.y=2.4+Math.sin(G.t*1.5)*.05;
    for(const z of[.5,-.5]){const c=pt['cannon'+z];if(c)c.rotation.z=damp(c.rotation.z,e.state==='guns'?(wind?ang+.2:ang):0,10,dt)}
    const hg=pt.hangar;if(hg){hg.scale.x=damp(hg.scale.x,e.door>0?.15:1,8,dt);hg.position.z=damp(hg.position.z,e.door>0?-.5:.9,8,dt)}
    const lp=pt.doorLamp;if(lp)lp.visible=e.door>0?Math.sin(G.t*18)>0:true;
  }else if(e.id==='maw'){
    pt.torso.rotation.z=e.state==='erupt'?-.25:e.state==='up'?Math.sin(G.t*2)*.05-.05:0;
    const open=e.state==='erupt'?.9:e.state==='up'?(Math.abs((p?p.x:0)-e.x)<4.5?.75:.25+Math.sin(G.t*3)*.12):.3;
    pt.jawU.rotation.z=damp(pt.jawU.rotation.z,open,12,dt);pt.jawL.rotation.z=-pt.jawU.rotation.z;
    if(pt.head)pt.head.rotation.z=e.state==='up'?-.18:e.state==='erupt'?-.4:0;
    if(pt.glow)pt.glow.scale.setScalar(e.state==='up'?1.15+Math.sin(G.t*6)*.2:1);
  }else if(e.id==='titan'){
    leg('legF',1);leg('legB',-1);pt.torso.rotation.z=k*.06;
    const a=e.state==='slam'?(wind?1.8:act&&e.t<.3?-1.6:-.3):e.state==='fan'?(wind?ang+.2:ang):e.state==='beam'?.6:e.state==='ram'?-.9:-.4;
    raise('armF',a,act?24:10);raise('armB',-sn*.3*k-.3,10);
    if(pt.core){const c=pt.core.getObjectByName('core');if(c)c.scale.setScalar(e.overload||e.weakT>0?1.5+Math.sin(G.t*18)*.3:1)}
    if(pt.head)pt.head.rotation.z=e.state==='stagger'?Math.sin(G.t*30)*.15:ang*.3;
  }
  if(e.sh){
    e.sh.position.set(e.x,.03,e.z-.3);const sc=e.radius*2.3;e.sh.scale.set(sc*(e.under?.5:1),sc*.6,1);e.sh.material.opacity=e.under?.12:.32;e.sh.visible=e.y>-1;
  }
}

/* ---------- 每帧 ---------- */
function update(dt){
  const e=cur;if(!e)return;
  e.t+=dt;e.cd-=dt;e.cd2-=dt;e.hitCd-=dt;if(e.weakT>0)e.weakT-=dt;if(e.flash>0)e.flash-=dt;
  const p=P()||{x:0,y:0,vx:0,dead:true};
  if(e.burn){e.burn.t-=dt;e.burn.tick-=dt;
    if(e.burn.tick<=0){e.burn.tick=.5;CL.hitEnemy(e,e.hpMax*.005,{dot:true,silent:true,noGuard:true,blast:false});CL.fx.sparks(e.x,e.y+e.h*.6,3,RED)}
    if(e.burn&&e.burn.t<=0)e.burn=null;
  }
  if(e.state==='intro'){e.vx=e.face*2.5;if(Math.abs(e.x)<XMAX-5||e.t>3.5)idle(e,.8)}
  else if(e.state==='dying'){
    e.vx=0;e.boomT=(e.boomT||0)-dt;
    if(e.boomT<=0){e.boomT=.24;CL.explode(e.x+rnd(-1,1)*e.radius,e.y+rnd(.2,.9)*e.h,1.7,0,{noSelf:true,quiet:true,sparks:10,debris:4,power:8,noBoss:true});CL.AU.explode(.7);R.shake(.3);
      CL.fx.flash(e.x,e.y+e.h*.5,e.radius*2,0xff8a4c,.08)}
    if(e.t>=2.3)finishDying(e);
  }
  else if(e.state==='stagger'){e.vx=0;if(e.t>=1.5)idle(e,.4)}
  else if(e.state==='reload'){e.vx=0;if(e.t>=1.4)idle(e,.5)}
  else if(e.state==='idle'){
    if(e.id==='maw')start(e,'under');
    else{walk(e,dt,p,PREF[e.id]);if(e.cd<=0&&!p.dead)start(e,AI[e.id].choose(e,p))}
  }
  else AI[e.id].step(e,dt,p);
  if(!cur)return;
  // 积分
  e.x+=e.vx*dt;
  if(e.id!=='maw'){e.vy-=GRAV*dt;e.y+=e.vy*dt;if(e.y<0){e.y=0;e.vy=0}}
  if(Math.abs(e.x)>XMAX-1.2){e.x=Math.sign(e.x)*(XMAX-1.2);if(e.state==='charge'&&e.stage===1){/* 撞墙交给 MV.charge 处理 */}
  }
  if(e.vortTele&&e.vort){e.vortTele.mesh.material.opacity=.4+.3*(Math.sin(G.t*9)>0?1:0)}
  anim(e,dt);
  if(CL.ui&&CL.ui.boss)CL.ui.boss(e);
}
CL.boss={spawn,update,clear,circlesOf:bossCircles,get cur(){return cur}};
})();
