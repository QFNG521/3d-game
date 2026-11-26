/* ========================================================================
 * CLANG! 2.5D — 66 流程：30 关 6 章 / 预算波次 / 特殊关卡 / 卡牌三选一 / Boss 关 / 死亡重开 / 无尽
 * ====================================================================== */
(function(){
'use strict';
const CL=window.CL,{clamp,rnd,rndi,pick}=CL;
const G=CL.G,D=CL.D,MD=CL.models,W=CL.world,XMAX=25;
const LS=()=>D.LEVELS;
const KEY='clang25d.v2.';
const store={
  get(k,d){try{const v=localStorage.getItem(KEY+k);return v?JSON.parse(v):d}catch(e){return d}},
  set(k,v){try{localStorage.setItem(KEY+k,JSON.stringify(v))}catch(e){}}
};
const R=CL.render;
const F={level:1,phase:'idle',t:0,queue:[],event:null,side:1,spawnT:0,timer:0,time:0,runT:0,seen:{},cards:null,awakenDone:{},endless:false,tier:0,
  levelScore0:0,lockMesh:null,zoneT:0,cardsNext:false,boss:null,deadSrc:'',runStart:0,stat0:null};

/* ---------- 存档 ---------- */
function loadSeen(){F.seen=store.get('seen',{})||{}}
function saveSeen(){store.set('seen',F.seen)}
loadSeen();
function seen(id){
  const base=D.EL[id]?D.EL[id].base:id;
  if(!F.seen[id]){F.seen[id]=1;F.seen[base]=1;saveSeen();return true}
  return false;
}
function best(){return store.get('best.'+G.diff,{score:0,level:0})}
function saveBest(){
  const b=best();if(G.score>b.score||G.level>b.level)store.set('best.'+G.diff,{score:Math.max(G.score,b.score),level:Math.max(G.level,b.level)});
}

/* ---------- 数值 ---------- */
function enemyMul(){
  const L=LS(),dv=G.DV||D.DIFF.normal,l=F.level;
  const late=F.endless?1+.06*Math.max(0,l-30):1;
  return {hp:(1+Math.min(l-1,L.growthCap)*L.hpPerLevel*dv.hpGrowth)*late*(1+F.tier*.35),dmg:(1+Math.min(l-1,L.growthCap)*L.damagePerLevel*dv.damageGrowth)*late};
}
function dropMult(){return F.event==='doubleSupply'?D.EVENTS.doubleSupply.drops:1}
// Boss 血量已是按关卡设计好的，只吃难度 / 无尽系数
function bossMul(){const dv=G.DV||D.DIFF.normal;return {hp:dv.enemyHp*(1+F.tier*.75)*(F.endless?1+.06*Math.max(0,F.level-30):1),dmg:enemyMul().dmg}}
function fieldMax(){return Math.min(LS().fieldBase+Math.floor(F.level/3),LS().fieldMax)}

/* ---------- 波次生成 ---------- */
const costOf=id=>(D.EL[id]||D.E[id]).cost||1;
function unitPool(l,ev){
  const L=LS(),out=[];
  for(const id in L.unlock){
    if(L.unlock[id]>l)continue;
    if(id==='hauler'&&(l-L.haulerFrom)%L.haulerEvery!==0)continue;
    const d=D.EL[id]||D.E[id],elite=!!D.EL[id],ranged=!!(d.shots||d.bulletSpeed);
    let w=L.weight[id]||.5;
    if(l>=L.shiftFrom)w*=1+L.shift*(l-L.shiftFrom)*costOf(id)/3;
    if(ev){
      if(ev===D.EVENTS.sandstorm)w*=ranged?ev.ranged:ev.melee;
      if(ev===D.EVENTS.eliteSurge)w*=elite?ev.elite:ev.normal;
    }
    out.push([id,w]);
  }
  return out;
}
function buildQueue(l,ev){
  const L=LS();let budget=(L.budgetBase+3.5*Math.min(l-1,9)+2*Math.max(0,l-10))*G.DV.budget*(ev&&ev.budget||1);
  const pool=unitPool(l,ev),q=[],cnt={},tot=pool.reduce((a,b)=>a+b[1],0);
  let guard=0;
  while(budget>0&&guard++<500){
    let r=rnd(0,tot),id=pool[0][0];
    for(const [pid,w] of pool){r-=w;if(r<=0){id=pid;break}}
    const base=D.EL[id]?D.EL[id].base:id,cap=L.cap[id];
    if(cap&&(cnt[base]||0)>=cap[0]+Math.floor(l/cap[1]))continue;
    if(costOf(id)>budget+.6&&q.length)continue;
    cnt[base]=(cnt[base]||0)+1;q.push(id);budget-=costOf(id);
  }
  if(!q.length)q.push('ripper');
  // 重机型往后排，开场轻一些
  q.sort((a,b)=>costOf(a)-costOf(b));
  for(let i=q.length-1;i>0;i--){const j=rndi(0,i);if(costOf(q[i])-costOf(q[j])<1.5){const t=q[i];q[i]=q[j];q[j]=t}}
  return q;
}

/* ---------- 特殊关卡 ---------- */
function rollEvent(l){
  const E=D.EVENTS,ids=Object.keys(E).filter(k=>E[k].from<=l);
  if(!ids.length||Math.random()>=D.EVENT_CHANCE)return null;
  return pick(ids);
}
function setupEvent(ev){
  const P=G.P;
  if(ev===D.EVENTS.lockdown){
    const m=MD.bar(1.6,XMAX*2-2,0xe2654e,.32);m.position.set(-XMAX+1.1,0,0);CL.fxLayer.add(m);F.lockMesh=m;
  }else if(ev===D.EVENTS.zone){
    const w=XMAX*2*ev.width,side=Math.random()<.5?-1:1,cx=side*(XMAX-w/2);
    F.zone={x0:cx-w/2,x1:cx+w/2};W.setZone(F.zone.x0,F.zone.x1);F.zoneT=ev.prepare;
    F.side=-side; // 敌人从对面来
  }else if(ev===D.EVENTS.timed){
    F.timer=ev.base+ev.perPoint*F.queue.reduce((a,id)=>a+costOf(id),0);
  }else if(ev===D.EVENTS.sandstorm){W.storm(1);G.wind=ev.wind}
}
function endEvent(){
  const E=D.EVENTS;
  if(F.event===E.lockdown&&F.lockMesh){F.lockMesh.parent.remove(F.lockMesh);F.lockMesh.geometry.dispose();F.lockMesh.material.dispose();F.lockMesh=null}
  if(F.event===E.zone){W.setZone(null,null);F.zone=null}
  if(F.event===E.sandstorm){W.storm(0);G.wind=0}
  F.timer=0;F.zoneT=0;
}
function stepEvent(dt){
  const P=G.P,ev=F.event,E=D.EVENTS;
  if(!ev||!P||P.dead)return;
  if(ev===E.lockdown){if(P.x<-XMAX+2.2){P.x=-XMAX+2.2;P.vx=Math.max(0,P.vx)}}
  else if(ev===E.zone){
    if(F.zoneT>0)F.zoneT-=dt;
    else if(P.x<F.zone.x0||P.x>F.zone.x1){
      P.hp-=E.zone.hurt*dt;R_flash();
      if(P.hp<=0){P.hp=0;P.dead=true;G.stats.deaths++;died('信号区外')}
    }
  }else if(ev===E.timed&&(F.phase==='spawning'||F.phase==='fighting')){
    F.timer-=dt;
    if(F.timer<=0){F.timer=0;P.inv=0;CL.dmgPlayer(9999,'超时')}
  }
}
function R_flash(){R.U.uFlash.value=.35;R.U.uFlashColor.value.set(0x9ff5e6)}

/* ---------- 关卡 ---------- */
function start(l,opts={}){
  const G0=G;G0.score=0;G0.stats=CL.newStats();G0.combo.n=0;G0.combo.pts=0;G0.endless=false;G0.tier=0;G0.state='play';
  F.endless=false;F.tier=0;F.awakenDone={};F.seen={};F.runT=0;F.runStart=performance.now();
  CL.clearCombat();CL.enemies.clear();CL.boss.clear();CL.tele.clear();endEvent();F.event=null;F.phase='idle';
  CL.player.reset();G0.P.x=0;
  startLevel(opts.level||1,false);
}
function startLevel(l,isRetry){
  const L=LS();F.level=l;G.level=l;F.tier=G.tier=D.bossTier(l);F.levelScore0=G.score;F.time=0;F.cardsNext=false;F.runT=isRetry?F.runT:0;
  const ch=D.chapterOf(l);
  W.setTheme(ch.theme);if(CL.AU.startMusic)CL.AU.startMusic(CL.MUSIC[ch.music]);
  CL.clearCombat();CL.enemies.clear();CL.boss.clear();CL.tele.clear();endEvent();
  G.combo.n=0;G.combo.pts=0;
  const P=G.P;
  P.x=0;P.y=0;P.vx=0;P.vy=0;P.dead=false;P.deadT=0;P.hp=P.hpMax;P.inv=1.5;P.nades=Math.max(P.nades,2);P.m.rotation.set(0,0,0);P.m.visible=true;P.hook=null;P.exec=null;P.slide=0;
  for(const w of P.weapons){w.mag=w.magSize;if(P.reserve[w.id]!==Infinity)P.reserve[w.id]=Math.max(P.reserve[w.id],(w.d.res||0)*.5)}
  CL.player.recompute();
  const boss=D.bossOf(l);
  F.boss=boss;
  if(boss){
    F.phase='bossIntro';F.t=2.6;F.queue=[];
    CL.ui.notice(boss.name,boss.en+' · '+boss.tag,true);CL.ui.tip(boss.tips[rndi(0,boss.tips.length)],7);
    if(CL.AU.boss)CL.AU.boss();W.storm(0);
    if(CL.AU.setIntensity)CL.AU.setIntensity(1);
  }else{
    if(!isRetry)F.event=rollEvent(l);
    const ev=F.event?D.EVENTS[F.event]:null;
    F.queue=buildQueue(l,ev);F.phase='prepare';F.t=1.7;F.side=Math.random()<.5?1:-1;F.spawnT=0;
    const chNew=D.chapterOf(l),prev=D.chapterOf(Math.max(1,l-1));
    if(l===1||chNew!==prev||l%L.bossEvery===1){CL.ui.notice(ch.name,ch.en+' · 第 '+l+' 关',false)}
    else CL.ui.notice('第 '+l+' 关',ev?ev.name+' · '+ev.desc:F.queue.length+' 台机器',false);
    if(ev){setupEvent(ev);CL.ui.toast(ev.name+'：'+ev.desc,'#9ff5e6')}
    if(l>=3)CL.after(3.5,()=>{if(F.phase==='spawning'||F.phase==='fighting'||F.phase==='prepare'){CL.drop(rnd(-10,10),7,'crate');CL.ui.toast('空投来了','#f2c14e')}});
  }
}
function nextLevel(){
  const n=F.level+1;
  if(n>LS().total&&!F.endless){G.state='win';saveBest();CL.ui.showWin();return}
  startLevel(n,false);
}
function startEndless(){
  F.endless=true;G.endless=true;startLevel(LS().total+1,false);
}
function retry(){
  G.score=F.levelScore0;G.combo.n=0;G.combo.pts=0;
  CL.ui.hideOver&&CL.ui.hideOver();
  startLevel(F.level,true);G.state='play';
}
function toTitle(){
  G.state='title';CL.clearCombat();CL.enemies.clear();CL.boss.clear();CL.tele.clear();endEvent();
  if(G.P)G.P.m.visible=false;CL.ui.hideOver&&CL.ui.hideOver();CL.ui.title&&CL.ui.title();
}

/* ---------- 卡牌 ---------- */
function eligible(){
  const P=G.P,out=[],l=F.level;
  for(const c of D.CARDS){
    const n=P.cards[c.id]||0;
    if(n>=(c.maxStacks||1))continue;
    if((c.minLevel||1)>l)continue;
    if(c.requires&&!P.cards[c.requires])continue;
    if(c.kind!=='general'&&!P.weapons.some(w=>w.id===c.target||(c.target==='pistol'&&(w.id==='pistol'||w.id==='dual'))))continue;
    out.push(c);
  }
  return out;
}
function rollCards(force){
  const el=eligible(),list=[],used=new Set();
  if(force){const aw=el.filter(c=>c.rarity==='legend');if(aw.length){list.push(pick(aw));used.add(list[0].id)}}
  while(list.length<LS().cards.reveal){
    const pool=el.filter(c=>!used.has(c.id));if(!pool.length)break;
    let tot=0;const ws=pool.map(c=>{const w=c.rarity==='common'?1:c.rarity==='rare'?.6:.3;tot+=w;return w});
    let r=rnd(0,tot),i=0;for(;i<pool.length-1;i++){r-=ws[i];if(r<=0)break}
    list.push(pool[i]);used.add(pool[i].id);
  }
  return list;
}
function openCards(done){
  const L=LS();let force=false;
  for(const a of L.cards.awaken)if(F.level>=a&&!F.awakenDone[a]){F.awakenDone[a]=true;force=true}
  if(G.endless||F.endless)force=false;
  F.cards={list:rollCards(force),rerolls:L.rerolls,done,forced:force};
  if(!F.cards.list.length){done();return}
  G.state='cards';CL.ui.cards(F.cards.list,F.cards);CL.AU.card&&CL.AU.card();
}
function pickCard(i){
  const c=F.cards;if(!c)return;const card=c.list[i];if(!card)return;
  CL.player.giveCard(card.id);CL.ui.cardsClose&&CL.ui.cardsClose();F.cards=null;
  CL.AU.card&&CL.AU.card();CL.fx.stamp(card.name,G.P.x,G.P.y+2.6,'#f2c14e',1.3,.1);
  G.state='play';c.done();
}
function rerollCards(){
  const c=F.cards;if(!c||c.rerolls<=0)return false;
  c.rerolls--;c.list=rollCards(false);CL.ui.cards(c.list,c);CL.AU.ui&&CL.AU.ui();
  return true;
}

/* ---------- 回调 ---------- */
function onEnemyDead(e,o){
  if(CL.AU.setIntensity)CL.AU.setIntensity(clamp(.4+G.enemies.length*.08,0,1));
}
function onBossDead(b){
  F.phase='bossDead';F.t=LS().bossClearedPause;F.cardsNext=true;F.boss=null;
  CL.ui.notice('报废!','THE '+b.def.en.replace(/^THE /,'')+' IS SCRAP',false);
  if(CL.AU.win)CL.AU.win();
}
function died(src){
  if(F.phase==='dead')return;
  F.phase='dead';F.deadSrc=src;F.t=1.4;
  saveBest();
  if(CL.AU.setIntensity)CL.AU.setIntensity(.1);
}
function spawnOne(){
  const id=F.queue.shift();if(!id)return;
  const side=F.event===D.EVENTS.lockdown?1:(F.side=-F.side);
  const x=side*(XMAX-1.3)+rnd(-.5,.5);
  const e=CL.enemies.spawn(id,x);
  if(e&&seen(id)&&(D.EL[id]||costOf(id)>=3))CL.ui.toast('新机器：'+e.def.name,'#f2c14e');
}
function cleared(){
  const L=LS();F.phase='cleared';F.t=L.clearedPause;endEvent();
  const bonus=L.clearBase+L.clearPerLevel*F.level;G.score+=bonus;CL.ui.toast('清场 +'+bonus,'#f2c14e');
  if(CL.AU.win)CL.AU.win();
  F.cardsNext=(F.level>=L.cards.from&&F.level%L.cards.every===0)||F.event===D.EVENTS.timed;
  if(CL.AU.setIntensity)CL.AU.setIntensity(.3);
}
function afterClear(){
  if(F.cardsNext)openCards(()=>nextLevel());else nextLevel();
}

/* ---------- 每帧 ---------- */
function update(dt){
  const P=G.P,L=LS();
  F.runT+=dt;
  if(F.phase==='dead'){F.t-=dt;if(F.t<=0){G.state='dead';CL.ui.showDead(F.deadSrc);F.phase='over'}return}
  if(F.phase==='prepare'){F.t-=dt;if(F.t<=0){F.phase='spawning';F.spawnT=.2}}
  else if(F.phase==='spawning'||F.phase==='fighting'){
    F.time+=dt;
    if(F.queue.length&&G.enemies.length<fieldMax()){F.spawnT-=dt;if(F.spawnT<=0){F.spawnT=L.spawnGap;spawnOne()}}
    if(!F.queue.length&&F.phase==='spawning')F.phase='fighting';
    if(F.phase==='fighting'&&!G.enemies.length)cleared();
    stepEvent(dt);
  }
  else if(F.phase==='cleared'){F.t-=dt;if(F.t<=0)afterClear()}
  else if(F.phase==='bossIntro'){F.t-=dt;if(F.t<=0){CL.boss.spawn(F.boss,P.x>=0?-1:1,{tier:F.tier});F.phase='boss'}}
  else if(F.phase==='bossDead'){F.t-=dt;if(F.t<=0)afterClear()}
  // 提示 HUD
  if(CL.ui.hud)CL.ui.hud();
}
const left=()=>F.queue.length+G.enemies.length;
const evData=()=>F.event?D.EVENTS[F.event]:null;
CL.flow={F,start,startLevel,nextLevel,retry,toTitle,startEndless,update,enemyMul,bossMul,dropMult,onEnemyDead,onBossDead,died,
  pickCard,rerollCards,afterClear,left,evData,fieldMax,seen,best,saveBest,costOf};
})();
