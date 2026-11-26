/* ========================================================================
 * CLANG! 2.5D — 62 机器：9 类敌人 + 4 精英的 AI / 动画 / 命中圈 / 死亡
 * ====================================================================== */
(function(){
'use strict';
const T=THREE,CL=window.CL,{clamp,lerp,damp,rnd,rndi,pick}=CL;
const G=CL.G,R=CL.render,MD=CL.models,D=CL.D,XMAX=25,GRAV=42;
const P=()=>G.P;
const dmgOf=e=>e.def.damage*(e.mul?e.mul.dmg:1)*(G.DV?G.DV.enemyDamage:1);

/* ---------- 生成 ---------- */
function spawn(id,x,o={}){
  const base=D.EL[id]?D.EL[id].base:id,def=D.EL[id]||D.E[id];
  if(!def)return null;
  const dv=G.DV||D.DIFF.normal,mul=CL.flow?CL.flow.enemyMul():{hp:1,dmg:1};
  const m=MD.spawn(base,CL.ents),elite=!!D.EL[id],scale=elite?def.scale:1;
  if(elite)MD.elite(m,scale);
  const hp=def.hp*mul.hp*dv.enemyHp;
  const e={id,base,def,elite,m,parts:m.userData.parts,scale,x:clamp(x,-XMAX+1,XMAX-1),y:o.y||0,vx:0,vy:0,face:1,z:rnd(-1.7,.9),
    hp,hpMax:hp,alive:true,ground:false,state:'spawn',t:0,cd:rnd(.5,1.3),flash:0,push:0,melt:0,burn:null,hooked:false,yanked:-9,mul,
    spawnT:.85,riseY:0,riseT:0,execable:false,jumpCd:rnd(0,1.5),strafe:rnd()<.5?1:-1,strafeT:rnd(1,2.5),tele:null,stun:0,phase:rnd(0,6),post:0,noPhys:false};
  if(base==='bulwark'){e.shieldHp=e.shieldMax=def.shield;e.shield=m.getObjectByName('shield');e.shieldDown=-9}
  if(base==='husk'){e.plateHp=def.plate;e.plate=m.getObjectByName('plate')}
  if(base==='drone'||base==='spotter'){e.riseY=15;e.spawnT=.7}
  e.sh=MD.shadow();CL.ents.add(e.sh);m.visible=false;
  e.tele=CL.tele.ring(e.x,0,1.0*scale,e.spawnT,0xe3b247,{op:.75});
  if(e.riseY&&base==='spotter')e.tele.mesh.material.color.set(0x9ff5e6);
  G.enemies.push(e);return e;
}
function enter(e){
  const p=P();
  if(e.riseY){e.y=e.riseY;e.riseT=.7;CL.AU.rumble()}
  else{CL.fx.dust(e.x,0,10);CL.fx.flash(e.x,e.y+.6,.9*e.scale,0xffe7a8,.12);e.riseT=.22}
  e.m.visible=true;e.state='idle';e.t=0;e.cd=Math.max(e.cd,.35);
  if(p&&!p.dead)e.face=Math.sign(p.x-e.x)||1;
}

/* ---------- 命中圈 ---------- */
CL.circles=e=>{
  const s=e.scale,h=e.def.height*s,r=e.def.radius*s*.9,x=e.x,out=[];
  if(e.untargetable)return out;
  if(e.boss&&e.preHit)return CL.boss.circlesOf(e);
  const b=e.base;
  if(e.shieldHp>0&&e.shield&&e.shield.visible)out.push({x:x+e.face*.6*s,y:e.y+h*.5,r:.62*s,part:'shield'});
  if(e.plateHp>0&&e.plate&&e.plate.visible)out.push({x:x+e.face*.25,y:e.y+h*.72,r:.34*s,part:'plate'});
  if(b!=='worm'&&b!=='hauler'&&b!=='popper'&&b!=='drone')out.push({x:x+e.face*.1*s,y:e.y+h*.9,r:(b==='spotter'?.26:.22)*s,part:'head'});
  if(b==='drone')out.push({x,y:e.y+e.def.height*s*.5,r:e.def.radius*s,part:'body'});
  else if(h>1.5){out.push({x,y:e.y+h*.3,r,part:'body'});out.push({x,y:e.y+h*.66,r:r*.95,part:'body'})}
  else out.push({x,y:e.y+h*.5,r,part:'body'});
  if(b==='husk'&&e.plateHp>0)out.push({x,y:e.y+h*.16,r:.2*s,part:'leg'});
  return out;
};

/* ---------- 死亡 ---------- */
function killEnemy(e,o={}){
  if(!e.alive)return;e.alive=false;
  const i=G.enemies.indexOf(e);if(i>=0)G.enemies.splice(i,1);
  CL.tele.kill(e.tele);
  const cs=CL.modelColors(e.m),big=e.elite||e.def.cost>=5,h=e.def.height*e.scale;
  const pow=o.execute?13:(o.weapon==='shotgun'&&Math.hypot(e.x-(o.x??e.x))<6)?14:o.weapon==='sniper'?13:8;
  CL.fx.debris(e.x,e.y+h*.45,cs,big?16:9,pow);CL.fx.sparks(e.x,e.y+h*.5,big?18:9,0xffd36a,0,12);
  CL.fx.flash(e.x,e.y+h*.5,big?1.6:.9,0xfff3d6,.12);
  CL.AU.kill(big);R.shake(big?.4:.14);if(big)G.hitstop=Math.max(G.hitstop,.05);
  if(o.head&&!o.execute){CL.fx.stamp('HEADSHOT!',e.x,e.y+h+.9,'#f2c14e',1.25,.25);G.stats.headKills++}
  else if(!o.execute&&Math.random()<.35)CL.fx.stamp(pick(['报废!','KRRRK','哐当!','SCRAP!']),e.x,e.y+h+.7,'#f1ece2',.95,.3);
  const cost=e.def.cost||1,pts=o.execute?15:o.head?10:o.blast?6:o.shard?4:6;
  G.stats.kills++;if(e.elite)G.stats.eliteKills++;
  CL.addScore(D.LEVELS.scorePerCost*cost*(e.elite?1:1));CL.addCombo(pts);
  const mul=(CL.flow&&CL.flow.dropMult)?CL.flow.dropMult():1;
  if(!o.self)CL.dropLoot(e.x,e.y+h*.4,cost,{mult:mul,n:mul>1?mul:1});else CL.dropLoot(e.x,e.y+h*.4,cost*.5,{mult:mul});
  removeModel(e);
  if(G.onKill)G.onKill(e,o);
  if(CL.flow)CL.flow.onEnemyDead(e,o);
}
function removeModel(e){
  e.m.parent&&e.m.parent.remove(e.m);CL.ink.unreg(e.m);
  if(e.sh&&e.sh.parent)e.sh.parent.remove(e.sh);e.sh=null;
  if(e.bar){e.bar.parent&&e.bar.parent.remove(e.bar);e.bar.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose()}});e.bar=null}
}
CL.killEnemy=killEnemy;

/* ---------- 通用 ---------- */
function faceTo(e,p){e.face=Math.sign(p.x-e.x)||e.face}
function jumpIfAbove(e,p,range){
  if(p.y>e.y+1.2&&e.ground&&Math.abs(p.x-e.x)<range&&e.jumpCd<=0&&!e.noPhys){e.vy=15.5;e.jumpCd=rnd(2.5,3.5);e.ground=false}
}
function volley(e,n,gap,o){
  const p=P(),s=e.scale,fromX=e.x+e.face*.7*s,fromY=e.y+(o.h??1.42)*s,dv=G.DV||D.DIFF.normal;
  for(let i=0;i<n;i++)CL.after(i*gap,()=>{
    if(!e.alive||!p||p.dead)return;
    const dist=Math.abs(p.x-e.x),err=(o.err??1.2)*(.3+.025*dist)*dv.aimError*(1+i*.15);
    const tx=p.x+rnd(-err,err),ty=p.y+(o.ty??1.1)+rnd(-err,err)*.55;
    CL.bullets.efire(fromX,fromY,tx,ty,{speed:o.speed,r:o.r??.13,dmg:dmgOf(e),src:o.src,life:5});
    CL.fx.flash(fromX,fromY,.32,0xffb347,.06);
  });
}
function phys(e,dt){
  const py=e.y;
  e.push*=Math.max(0,1-7*dt);
  if(!e.noPhys){e.vy=Math.max(-40,e.vy-GRAV*dt)}
  e.x+=(e.vx+e.push)*dt;e.y+=e.vy*dt;
  e.ground=false;
  if(e.base!=='drone'&&!e.noPhys){
    if(e.y<=0){e.y=0;if(e.vy<0)e.vy=0;e.ground=true}
    else if(e.vy<=0)for(const pl of CL.world.PLATFORMS)if(py>=pl.y-.03&&e.y<=pl.y&&Math.abs(e.x-pl.x)<=pl.w/2+.1){e.y=pl.y;e.vy=0;e.ground=true;break}
  }
  if(Math.abs(e.x)>XMAX-.5){e.x=Math.sign(e.x)*(XMAX-.5);e.vx=0}
}
function separate(){
  const L=G.enemies;
  for(let i=0;i<L.length;i++)for(let j=i+1;j<L.length;j++){
    const a=L[i],b=L[j];if(a.noPhys||b.noPhys||Math.abs(a.y-b.y)>1)continue;
    const min=(a.def.radius*a.scale+b.def.radius*b.scale)*.9,dx=b.x-a.x;
    if(Math.abs(dx)<min){const push=(min-Math.abs(dx))*.5*(dx>=0?1:-1);a.x-=push*.5;b.x+=push*.5}
  }
}
function startWind(e,tele){e.state='wind';e.t=0;e.vx=0;if(tele)e.tele=tele}

/* ---------- AI ---------- */
const AI={};
AI.ripper=(e,dt,p)=>{
  const dx=p.x-e.x,dy=p.y-e.y,d=e.def;
  if(e.state==='idle'){
    faceTo(e,p);e.vx=e.face*d.speed*(p.dead?-.3:1);jumpIfAbove(e,p,5);
    if(!p.dead&&Math.abs(dx)<d.hitReach&&Math.abs(dy)<1.2&&e.ground&&e.cd<=0)startWind(e,CL.tele.ring(p.x,p.y,.9,d.windup,0xe2654e,{op:.55}));
  }else if(e.state==='wind'){e.vx=0;
    if(e.t>=d.windup){e.state='lunge';e.t=0;e.hitDone=false;CL.fx.flash(e.x,e.y+.5,.7,0xff6a4c,.1)}
  }else if(e.state==='lunge'){
    e.vx=e.face*d.lunge/d.lungeTime;
    if(!e.hitDone&&!p.dead&&Math.abs(p.x-e.x)<1.15&&Math.abs(p.y-e.y)<1.2){e.hitDone=true;CL.dmgPlayer(dmgOf(e),'撕裂者')}
    if(e.t>=d.lungeTime){e.vx=0;if(e.elite&&!e.combo){e.combo=true;e.state='wind';e.t=d.windup-.2}else{e.combo=false;e.state='idle';e.cd=d.interval*rnd(.9,1.1)}}
  }
};
AI.warden=(e,dt,p)=>{
  const dx=p.x-e.x,ad=Math.abs(dx),d=e.def;faceTo(e,p);
  e.strafeT-=dt;if(e.strafeT<=0){e.strafeT=rnd(d.strafeMin||1.4,d.strafeMax||2.8);e.strafe=-e.strafe}
  if(e.state==='idle'){
    e.vx=(ad>d.preferred?e.face:ad<d.minRange?-e.face:e.strafe*.6)*d.speed*(p.dead?.2:1);jumpIfAbove(e,p,6);
    if(!p.dead&&e.cd<=0&&ad<d.range){startWind(e);CL.AU.warn()}
  }else if(e.state==='wind'){e.vx=0;
    if(e.t>=d.windup){e.state='idle';e.cd=d.interval*(G.DV?G.DV.rangedInterval:1);
      volley(e,d.shots,d.shotGap,{speed:d.bulletSpeed,err:d.aimErr??1.2,src:'枪手'})}
  }
};
AI.hauler=(e,dt,p)=>{
  const dx=p.x-e.x,ad=Math.abs(dx),d=e.def;
  if(Math.sign(dx)!==e.face){e.faceT=(e.faceT||0)+dt;if(e.faceT>1/d.turn){e.face=Math.sign(dx)||1;e.faceT=0}}else e.faceT=0;
  if(e.state==='idle'){
    e.vx=e.face*d.speed*(p.dead?0:1);
    if(!p.dead&&e.cd<=0&&ad<d.range&&Math.abs(p.y-e.y)<1.6)startWind(e,CL.tele.ring(e.x+e.face*.9,0,2.9,d.windup,0xf1ece2,{op:.5}));
  }else if(e.state==='wind'){e.vx=0;
    if(e.t>=d.windup){e.state='idle';e.cd=d.interval;slam(e)}
  }
};
function slam(e){
  const p=P(),hx=e.x+e.face*.9;
  CL.fx.flash(hx,.3,1.7,0xfff3d6,.14);CL.fx.dust(hx,0,18);CL.fx.sparks(hx,.3,12,0xc3c9c9,0,12);
  R.shake(.55);CL.AU.slam();CL.fx.stamp('轰!',hx,1.8,'#f1ece2',1.5,.3);
  if(p&&!p.dead&&Math.abs(p.x-hx)<3&&Math.abs(p.y-e.y)<1.6)CL.dmgPlayer(dmgOf(e),'重装机');
  for(const s of[-1,1])CL.bullets.efire(hx,.3,hx+s,.3,{speed:9,r:.3,dmg:dmgOf(e)*.5,low:true,life:1.35,src:'冲击波'});
}
AI.spotter=(e,dt,p)=>{
  const dx=p.x-e.x,ad=Math.abs(dx),d=e.def;faceTo(e,p);
  if(e.state==='idle'){
    e.vx=(e.post>0&&e.post%3===0&&e.t<1.5)?-e.face*d.speed:0;
    if(!p.dead&&e.t>1&&e.cd<=0&&ad<d.range){e.state='aim';e.t=0;e.lock={x:p.x,y:p.y+1.1};e.post++;CL.AU.laser()}
  }else if(e.state==='aim'){
    e.vx=0;const aiming=e.t<d.windup-.25;
    if(aiming)e.lock={x:p.x,y:p.y+1.1};
    const gx=e.x+e.face*1.9,gy=e.y+2.1;
    CL.fx.tracer(gx,gy,e.lock.x,e.lock.y,aiming?0xe2654e:0xf1ece2,aiming?.03:.08,.03);
    if(e.t>=d.windup){
      CL.bullets.efire(gx,gy,e.lock.x,e.lock.y,{speed:d.bulletSpeed,r:.16,dmg:dmgOf(e),laser:true,src:'远射机'});
      CL.AU.snipe();CL.fx.flash(gx,gy,.9,0x9ff5e6,.1);CL.fx.sparks(gx,gy,4,0x9ff5e6,e.face>0?0:Math.PI,10);
      e.state='idle';e.t=0;e.cd=e.post%3===0?d.interval*.7:.9;
    }
  }
};
AI.popper=(e,dt,p)=>{
  const dx=p.x-e.x,ad=Math.abs(dx),d=e.def;faceTo(e,p);
  if(e.state==='idle'){
    e.vx=e.face*d.speed*(p.dead?0:1);jumpIfAbove(e,p,4);
    if(!p.dead&&ad<d.range&&Math.abs(p.y-e.y)<1.6){e.state='fuse';e.t=0;e.beep=0;e.tele=CL.tele.ring(e.x,e.y,d.blast*.9,d.windup,0xe2654e,{op:.35})}
  }else if(e.state==='fuse'){
    e.vx=e.face*d.speed*.15;const k=e.t/d.windup,sp=e.m.getObjectByName('spark');
    if(sp){sp.visible=Math.sin(e.t*(18+k*55))>0;sp.scale.setScalar(.11*(1+k*1.1))}
    e.beep-=dt;if(e.beep<=0){e.beep=.22*(1-k*.72);CL.AU.fuse()}
    e.m.position.x=e.x+rnd(-.04,.04);
    if(e.t>=d.windup)boom(e);
  }
};
function boom(e){
  const d=e.def,r=d.blast||4;CL.tele.kill(e.tele);
  killEnemy(e,{blast:true,self:true,x:e.x,y:e.y+.5,weapon:'popper'});
  CL.explode(e.x,e.y+.5,r,d.machineDamage||90,{selfDmg:d.damage*(e.mul?e.mul.dmg:1)*(G.DV?G.DV.enemyDamage:1),knock:10,sparks:22,debris:10,power:12,label:'爆破!'});
}
AI.bulwark=(e,dt,p)=>{
  const d=e.def;
  if(e.shieldHp<=0&&G.t-e.shieldDown>6){e.shieldHp=e.shieldMax;e.shield.visible=true;CL.fx.stamp('盾!',e.x,e.y+e.def.height*e.scale+.6,'#58768a',.9,.4);CL.AU.clangSfx(.7)}
  AI.warden(e,dt,p);
  if(e.shieldHit>0){e.shieldHit-=dt;e.shield.position.x=.5+Math.sin(G.t*80)*.06}else e.shield.position.x=.5;
};
AI.drone=(e,dt,p)=>{
  const dx=p.x-e.x,ad=Math.abs(dx),d=e.def;faceTo(e,p);
  e.strafeT-=dt;if(e.strafeT<=0){e.strafeT=rnd(d.strafeMin||1.2,d.strafeMax||2.6);e.strafe=-e.strafe}
  if(e.hoverY===undefined)e.hoverY=rnd(d.hover[0],d.hover[1]);
  const want=p.x-Math.sign(dx||1)*d.preferred;
  e.vx=clamp((want-e.x)*.9,-d.speed,d.speed)+e.strafe*2.2*(p.dead?0:1);
  e.vy=clamp((p.y+e.hoverY+Math.sin(G.t*2.4+e.phase)*.35-e.y)*2.2,-5,5);
  if(e.state==='idle'){if(!p.dead&&e.cd<=0&&ad<d.range){startWind(e)}}
  else if(e.state==='wind'){if(e.t>=d.windup){e.state='idle';e.cd=d.interval*(G.DV?G.DV.rangedInterval:1);volley(e,d.shots,d.shotGap,{speed:d.bulletSpeed,err:d.aimErr??1.7,h:0,ty:1.1,src:'无人机'})}}
};
AI.husk=(e,dt,p)=>{
  const dx=p.x-e.x,ad=Math.abs(dx),d=e.def;faceTo(e,p);
  e.strafeT-=dt;if(e.strafeT<=0){e.strafeT=rnd(d.strafeMin||1.2,d.strafeMax||2.6);e.strafe=-e.strafe}
  if(e.state==='idle'){
    e.vx=(ad>d.preferred?e.face:ad<d.minRange?-e.face:e.strafe*.5)*d.speed*(p.dead?0:1);jumpIfAbove(e,p,6);
    if(!p.dead&&e.cd<=0&&ad<d.range)startWind(e);
  }else if(e.state==='wind'){e.vx=0;
    if(e.t>=d.windup){
      e.state='idle';e.cd=d.interval*(G.DV?G.DV.rangedInterval:1);
      const T=1.05,tx=clamp(p.x+p.vx*.45,-24,24),sx=e.x+e.face*.4,sy=e.y+1.4*e.scale;
      CL.lob('jar',sx,sy,(tx-sx)/T,((p.y+.1)-sy)/T+.5*GRAV*T,{r:d.splash,warn:T+.05,warnR:d.splash,col:0xd8b878,dmg:dmgOf(e),onLand:jarLand});
      CL.AU.clack();
    }
  }
};
function jarLand(b){
  const p=P(),x=b.x,r=CL.D.E.husk.splash;
  CL.fx.dust(x,.1,16);CL.fx.flash(x,.3,r,0xd8b878,.2);CL.AU.explode(.5);R.shake(.15);
  if(p&&!p.dead&&Math.abs(p.x-x)<r&&Math.abs(p.y-b.y)<2.2){if(CL.dmgPlayer(b.dmg,'沙罐')){p.slowT=.9;R.U.uFlash.value=.5;R.U.uFlashColor.value.set(0xd8b878)}}
}
AI.worm=(e,dt,p)=>{
  const d=e.def;e.noPhys=true;
  if(e.state==='idle'){
    e.untargetable=true;const dx=p.x-e.x;
    e.face=Math.sign(dx)||e.face;e.vx=p.dead?0:e.face*Math.min(Math.abs(dx)*1.5,d.speed);e.vy=0;e.y=0;
    if(!p.dead&&e.cd<=0&&Math.abs(dx)<7.5){e.state='ring';e.t=0;e.ringX=p.x;e.ringY=p.y;e.tele=CL.tele.ring(p.x,p.y,2.3,.8,0xd8b878,{op:.85,grow:true});CL.AU.rumble()}
  }else if(e.state==='ring'){
    e.vx=0;if(e.t>=.8){e.state='leap';e.t=0;e.hit=false;
      e.x=lerp(e.x,e.ringX-Math.sign(e.ringX-e.x||1)*2.2,.6);e.y=-.6;
      const T=.95;e.vx=(e.ringX-e.x)/T;e.vy=(e.ringY+.6)/T+.5*GRAV*T;e.face=Math.sign(e.ringX-e.x)||1;e.untargetable=false;
      CL.fx.dust(e.x,0,16);CL.fx.shake(.3);CL.AU.slam()}
  }else if(e.state==='leap'){
    e.vy-=GRAV*dt;
    if(!e.hit&&!p.dead&&Math.hypot(p.x-e.x,p.y+.8-e.y-.3)<1.35){e.hit=true;CL.dmgPlayer(dmgOf(e)*1.6,'沙虫');CL.fx.stamp('咬!',e.x,e.y+1.4,'#e2654e',1.3,.4)}
    if(e.t>.35&&e.vy<0&&e.y<=0){e.state='stranded';e.t=0;e.y=0;e.vx=0;e.vy=0;e.hitMult=()=>1.6;CL.fx.dust(e.x,0,16);R.shake(.35);CL.AU.slam();CL.fx.stamp('翻!',e.x,e.y+1.6,'#f2c14e',1.1,.4)}
  }else if(e.state==='stranded'){e.vx=0;if(e.t>=1.9){e.state='sink';e.t=0;e.hitMult=null}}
  else if(e.state==='sink'){e.untargetable=true;if(e.t>=.5){e.state='idle';e.t=0;e.cd=1.4;e.hitMult=null}}
};

/* ---------- 动画 ---------- */
function anim(e,dt){
  const p=P(),pt=e.parts,s=e.scale,m=e.m,sp=Math.abs(e.vx),base=e.base;
  m.position.set(e.x,e.y,e.z);m.scale.set(e.face*s,s,s);
  if(e.riseT>0&&!e.riseY){const k=1-e.riseT/.22;m.scale.y=s*Math.max(.08,k);m.position.y=e.y}
  if(e.flash>0&&e.flashLast!==1){CL.ink.setFlash(m,true);e.flashLast=1}else if(e.flash<=0&&e.flashLast!==0){CL.ink.setFlash(m,false);e.flashLast=0}
  if(e.melt>0&&Math.random()<dt*14)CL.fx.sparks(e.x+rnd(-.3,.3),e.y+rnd(.2,e.def.height*s),1,0x56c2b6);
  if(e.ground&&sp>.4)e.phase+=dt*sp*1.5;
  const k=clamp(sp/6,0,1.1),sn=Math.sin(e.phase);
  const leg=(n,dir)=>{    const l=pt[n],kn=pt['knee'+n.slice(3)];if(!l)return;
    l.rotation.z=dir*sn*.7*k;if(kn)kn.rotation.z=-Math.max(0,dir*-sn)*.8*k-.04};
  const wind=e.state==='wind',aim=e.state==='aim';
  let aimAng=0;
  if(p){const gy=e.y+(base==='spotter'?2.1:1.45)*s;aimAng=clamp(Math.atan2(p.y+1.1-gy,(p.x-e.x)*e.face),-1,1)}
  if(base==='ripper'){
    leg('legF',1);leg('legB',-1);pt.torso.rotation.z=-.25+k*.12;
    if(e.state==='wind')pt.armF.rotation.z=damp(pt.armF.rotation.z,1.9,22,dt);
    else if(e.state==='lunge')pt.armF.rotation.z=-1.5;
    else pt.armF.rotation.z=damp(pt.armF.rotation.z,.5+sn*.5*k,14,dt);
    pt.armB.rotation.z=-.3-sn*.5*k;pt.head.rotation.z=Math.sin(G.t*14)*.08*(wind?1:0);
  }else if(base==='warden'||base==='bulwark'){
    leg('legF',1);leg('legB',-1);pt.torso.rotation.z=k*.06;
    pt.armF.rotation.z=damp(pt.armF.rotation.z,aimAng+(wind?.12:0)+(e.state==='idle'&&e.cd<.4?-.1:0),16,dt);
    pt.armB.rotation.z=pt.armF.rotation.z+.1;pt.head.rotation.z=aimAng*.5;
  }else if(base==='husk'){
    leg('legF',1);leg('legB',-1);pt.torso.rotation.z=wind?-.3:k*.05+Math.sin(G.t*3+e.phase)*.03;
    pt.armF.rotation.z=damp(pt.armF.rotation.z,wind?2.2:.5+sn*.4*k,14,dt);pt.armB.rotation.z=-sn*.5*k;
    const jar=pt.armF.getObjectByName('jar');if(jar)jar.visible=e.cd<.3||wind;
  }else if(base==='hauler'){
    leg('legF',1);leg('legB',-1);pt.torso.rotation.z=wind?-.12:e.t<.3&&e.state==='idle'?.1:0;
    const f=pt.fist,f2=pt.fist2;if(f){f.rotation.z=damp(f.rotation.z,wind?1.5:e.slamK??0,18,dt);if(f2)f2.rotation.z=f.rotation.z*.6}
    if(e.blade)e.blade.rotation.z=0;
  }else if(base==='spotter'){
    leg('legF',1);leg('legB',-1);pt.torso.rotation.z=aim?-.08:0;pt.head.rotation.z=aimAng*.7;
    const g=pt.armF.getObjectByName('gun');pt.armF.rotation.z=damp(pt.armF.rotation.z,aim?aimAng:0,12,dt);
  }else if(base==='popper'){
    leg('legF',1);leg('legB',-1);m.position.y=e.y+Math.abs(sn)*.08*k+(e.state==='fuse'?Math.abs(Math.sin(G.t*40))*.05:0);
    pt.torso.rotation.z=(e.state==='fuse'?Math.sin(G.t*50)*.08:sn*.12*k);pt.fuse.rotation.z=Math.sin(G.t*6)*.2;
  }else if(base==='drone'){
    for(let i=0;i<4;i++){const r=pt['rot'+i];if(r)r.rotation.y+=dt*40}
    m.rotation.z=clamp(-e.vx*e.face*.04,-.35,.35);pt.torso.rotation.z=0;
    if(wind)pt.gun.rotation.z=-.2;
  }else if(base==='worm'){
    const under=e.state==='idle'||e.state==='sink'||e.state==='ring';
    m.position.y=e.y-(under?.78*e.scale:0);
    if(e.state==='stranded'){m.rotation.z=Math.PI;m.position.y=e.y+.42*s}else m.rotation.z=e.state==='leap'?clamp(-e.vy*.05,-1,1)*e.face:0;
    pt.seg1.rotation.z=Math.sin(G.t*9)*.22;pt.seg2.rotation.z=Math.sin(G.t*9+1)*.25;
    const open=e.state==='leap'?.5:Math.sin(G.t*3)*.1+.15;pt.jawU.rotation.z=open;pt.jawL.rotation.z=-open;
    if(under&&Math.random()<dt*10)CL.fx.sparks(e.x+rnd(-.6,.6),.05,1,0xd8b878,Math.PI/2,3);
  }
  // 影子
  if(e.sh){
    const sy=CL.player.support(e.x,e.y+.001),hh=e.y-sy,sc=clamp(1-hh/10,.2,1)*e.def.radius*1.5*s;
    e.sh.position.set(e.x,sy+.02,e.z-.1);e.sh.scale.set(sc,sc*.6,1);e.sh.material.opacity=.3*clamp(1-hh/10,.15,1);
    e.sh.visible=!under2(e);
  }
  hpBar(e);
}
const under2=e=>e.base==='worm'&&(e.state==='idle'||e.state==='sink');
function hpBar(e){
  const h=e.def.height*e.scale;
  const show=e.hp<e.hpMax-1&&e.state!=='spawn';
  if(!show){if(e.bar)e.bar.visible=false;return}
  if(!e.bar){
    const g=new T.Group(),bg=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({color:0x1c1713,depthTest:false,transparent:true,opacity:.9})),
      fg=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({color:e.elite?0xf2c14e:0xe2654e,depthTest:false}));
    for(const m of[bg,fg]){m.layers.set(1);m.userData.noInk=true;m.renderOrder=15}
    fg.position.z=.01;fg.name='fg';bg.scale.set(.9,.1,1);g.add(bg,fg);CL.fxLayer.add(g);e.bar=g;e.barFg=fg;
  }
  e.bar.visible=true;e.bar.position.set(e.x,e.y+h+.28,3);
  const w=.86*clamp(e.hp/e.hpMax,0,1);e.barFg.scale.set(w,.062,1);e.barFg.position.x=-.43+w/2;
}

/* ---------- 每帧 ---------- */
function update(dt){
  const p=P();
  for(let i=G.enemies.length-1;i>=0;i--){
    const e=G.enemies[i];if(!e)continue;e.t+=dt;e.cd-=dt;e.jumpCd-=dt;e.stun-=dt;
    if(e.flash>0)e.flash-=dt;if(e.melt>0)e.melt-=dt;if(e.shieldHit>0)e.shieldHit-=dt;
    if(e.burn){e.burn.t-=dt;e.burn.tick-=dt;
      if(e.burn.tick<=0){e.burn.tick=.5;CL.hitEnemy(e,e.hpMax*.04*(G.has('awake-sg-ignite')?1.5:1),{dot:true,silent:true,noGuard:true,blast:true});CL.fx.sparks(e.x,e.y+e.def.height*.6,3,0xe2654e)}
      if(e.burn&&e.burn.t<=0)e.burn=null;
    }
    if(!e.alive)continue;
    if(e.state==='spawn'){if(e.t>=e.spawnT){CL.tele.kill(e.tele);e.tele=null;enter(e)}else continue}
    // 空降 / 钻出期间不参与 AI
    if(e.riseT>0){
      e.riseT-=dt;
      if(e.riseY){const k=1-e.riseT/.7,ty=e.base==='drone'&&p?p.y+(e.hoverY===undefined?(e.hoverY=rnd(5.2,7.6)):e.hoverY):0;
        e.y=lerp(e.riseY,ty,k*k);e.x+=e.vx*dt;e.vx=0;if(e.riseT<=0){CL.fx.dust(e.x,ty,8);CL.fx.flash(e.x,e.y+.4,.9,0x9ff5e6,.12)}}
      anim(e,dt);continue;
    }
    // 被钩锁拽动 / 被拽后的硬直
    if(e.hooked&&p){const dx=p.x-e.x,dy=p.y+.4-e.y,d=Math.hypot(dx,dy)||1;e.x+=dx/d*24*dt;e.y+=dy/d*24*dt;e.vx=0;e.vy=0;anim(e,dt);continue}
    if(p&&G.t-e.yanked<.45){e.vx=0;phys(e,dt);anim(e,dt);continue}
    if(e.stun>0){e.vx=0;phys(e,dt);anim(e,dt);continue}
    e.execable=!!p&&!p.dead&&e.hp<=e.hpMax*.3&&e.state!=='spawn';
    const fn=AI[e.base];if(fn)fn(e,dt,p||{x:0,y:0,dead:true,vx:0});
    if(e.alive){phys(e,dt);anim(e,dt)}
  }
  separate();
}
function clear(){for(const e of G.enemies.slice())removeModel(e);G.enemies.length=0}
CL.enemies={spawn,update,clear,kill:killEnemy,AI};
})();
