/* ========================================================================
 * CLANG! 2.5D — 70 界面：标题（Canvas 手绘 logo）/ HUD / 卡牌 / 图鉴 / 设置 / 暂停·死亡·通关 / 触屏
 * ====================================================================== */
(function(){
'use strict';
const CL=window.CL,{clamp}=CL;
const G=CL.G,R=CL.render,D=CL.D;
const $=id=>document.getElementById(id);
const KEY='clang25d.v2.';
const store={
  get(k,d){try{const v=localStorage.getItem(KEY+k);return v?JSON.parse(v):d}catch(e){return d}},
  set(k,v){try{localStorage.setItem(KEY+k,JSON.stringify(v))}catch(e){}}
};
const sel={diff:store.get('diff','normal'),level:1};
const SET=Object.assign({sfx:.8,music:.55,shake:1,ink:1,dnum:true},store.get('set',{}));
const touch={on:false};
const isTouch=()=>touch.on;
const E={};

function applySet(){
  CL.AU.setVol(SET.sfx,SET.music);R.cam.shakeScale=SET.shake;R.U.uInk.value=SET.ink;
  store.set('set',SET);
}

/* ---------- Logo ---------- */
function drawLogo(){
  const c=$('logo'),x=c.getContext('2d'),W=c.width,H=c.height;
  x.clearRect(0,0,W,H);
  // 墨色套印底块
  x.fillStyle='#1c1713';x.beginPath();x.moveTo(84,104);x.lineTo(W-28,58);x.lineTo(W-62,332);x.lineTo(72,352);x.closePath();x.fill();
  // CLANG! 主体画在离屏层，网点只落在字上
  const oc=document.createElement('canvas');oc.width=W;oc.height=H;const o=oc.getContext('2d');
  const cx=W/2,cy=205,txt='CLANG!',f='900 340px Impact,"Arial Black","PingFang SC",sans-serif';
  o.font=f;o.textAlign='center';o.textBaseline='middle';o.lineJoin='round';
  o.save();o.translate(cx,cy);o.rotate(-.035);
  o.lineWidth=28;o.strokeStyle='#1c1713';o.strokeText(txt,0,0);
  const gr=o.createLinearGradient(0,-160,0,160);gr.addColorStop(0,'#f2c14e');gr.addColorStop(.55,'#e3b247');gr.addColorStop(1,'#e2654e');
  o.fillStyle=gr;o.fillText(txt,0,0);
  o.globalCompositeOperation='source-atop';
  for(let yy=18;yy<190;yy+=11)for(let xx=-560;xx<560;xx+=11){o.beginPath();o.arc(xx+((yy/11)%2)*5.5,yy,2.2+yy*.012,0,Math.PI*2);o.fillStyle='rgba(28,23,19,.45)';o.fill()}
  o.globalCompositeOperation='source-over';
  o.lineWidth=9;o.strokeStyle='rgba(200,70,44,.8)';o.strokeText(txt,8,-6); // 套印错位
  // 青色流挂
  o.lineWidth=6;o.strokeStyle='#1c1713';o.fillStyle='#56c2b6';
  for(const [lx,ly,len] of [[-318,128,74],[-138,136,46],[36,132,98],[214,134,60],[338,124,84]]){
    o.beginPath();o.moveTo(lx-10,ly);o.lineTo(lx+10,ly);o.lineTo(lx+10,ly+len*.6);o.quadraticCurveTo(lx+10,ly+len,lx,ly+len);o.quadraticCurveTo(lx-10,ly+len,lx-10,ly+len*.6);o.closePath();o.fill();o.stroke();
  }
  // 红皇冠：戴在感叹号上
  const kx=cx-30,ky=-134;
  o.fillStyle='#c8462c';o.lineWidth=8;o.beginPath();o.moveTo(kx-70,ky+52);o.lineTo(kx-70,ky);o.lineTo(kx-36,ky+26);o.lineTo(kx,ky-22);o.lineTo(kx+36,ky+26);o.lineTo(kx+70,ky);o.lineTo(kx+70,ky+52);o.closePath();o.fill();o.stroke();
  o.fillStyle='#f2c14e';for(const [dx,dy] of[[-70,-2],[0,-24],[70,-2]]){o.beginPath();o.arc(kx+dx,ky+dy,10,0,Math.PI*2);o.fill();o.stroke()}
  o.restore();
  x.drawImage(oc,0,0);
  // 中文副标
  x.font='900 116px Impact,"Arial Black","PingFang SC","Heiti SC",sans-serif';x.textAlign='center';x.textBaseline='middle';x.lineJoin='round';
  x.lineWidth=20;x.strokeStyle='#1c1713';x.strokeText('哐当！拆机试炼场',cx+7,442);
  x.fillStyle='#efe6d2';x.fillText('哐当！拆机试炼场',cx,436);
  // 标语
  x.font='900 32px Impact,"Arial Black",sans-serif';x.lineWidth=9;x.strokeStyle='#1c1713';x.strokeText('S C R A P .   S H O O T .   S U R V I V E .',cx,556);
  x.fillStyle='#e3b247';x.fillText('S C R A P .   S H O O T .   S U R V I V E .',cx,556);
  // 2.5D 印章
  x.save();x.translate(W-140,84);x.rotate(.12);x.fillStyle='#56c2b6';x.strokeStyle='#1c1713';x.lineWidth=6;
  x.beginPath();x.rect(-88,-34,176,68);x.fill();x.stroke();x.fillStyle='#1c1713';x.font='900 46px Impact,"Arial Black",sans-serif';x.fillText('2.5D',0,2);x.restore();
}

/* ---------- 标题 ---------- */
function seg(el,items,cur,fn){
  el.innerHTML='';
  for(const it of items){
    const b=document.createElement('button');b.innerHTML=it.html;if(it.id===cur)b.classList.add('on');
    b.onclick=()=>{for(const c of el.children)c.classList.remove('on');b.classList.add('on');fn(it.id);CL.AU.init();if(CL.AU.ui)CL.AU.ui()};
    el.appendChild(b);
  }
}
function bestLine(){
  const b=CL.flow.best(),dv=D.DIFF[G.diff];
  $('bestLine').textContent=b.score?`最佳记录（${dv.label}）：${b.score.toLocaleString()} 分 · 第 ${b.level} 关`:'还没有记录 · 第一台机器在等你';
}
function title(){
  E.title.classList.remove('hidden');E.hud.classList.add('hidden');E.cross.classList.remove('on');hideOver();
  E.touchUI.classList.remove('show');document.body.style.cursor='';
  bestLine();
  if(CL.AU.startMusic)CL.AU.startMusic(0);
}
function refreshTitle(){
  const dv=D.DIFF;
  seg($('diffSeg'),Object.keys(dv).map(k=>({id:k,html:`${dv[k].label}<small>${dv[k].en}</small>`})),sel.diff,id=>{sel.diff=id;G.diff=id;store.set('diff',id);bestLine()});
  if(!D.CHAPTERS.some(c=>c.from===sel.level))sel.level=1;
  seg($('startSeg'),D.CHAPTERS.map(ch=>({id:ch.from,html:`${ch.name}<small>第 ${ch.from} 关</small>`})),sel.level,id=>{sel.level=id});
}
function play(){
  CL.AU.init();G.diff=sel.diff;
  E.title.classList.add('hidden');E.hud.classList.remove('hidden');E.cross.classList.add('on');
  document.body.style.cursor=isTouch()?'':'none';
  if(isTouch())E.touchUI.classList.add('show');
  E.hintT=performance.now()+14000;$('hint').style.opacity=1;
  CL.fx.init();CL.flow.start(sel.level,{level:sel.level});
}

/* ---------- 暂停 / 死亡 / 通关 ---------- */
function hideOver(){for(const id of['pause','dead','win','cards','codex','settings'])$(id).classList.add('hidden');E.cardsOpen=false}
function pause(){
  if(G.state!=='play')return;G.state='pause';$('pause').classList.remove('hidden');E.touchUI.classList.remove('show');
}
function resume(){
  if(G.state!=='pause')return;$('pause').classList.add('hidden');G.state='play';CL.AU.init();if(isTouch())E.touchUI.classList.add('show');
}
function showDead(src){
  $('dead').classList.remove('hidden');E.touchUI.classList.remove('show');
  $('deadStat').textContent=`第 ${G.level} 关 · 被「${src}」击毁 · 分数 ${G.score.toLocaleString()} · 击杀 ${G.stats.kills}`;
}
function showWin(){
  E.cross.classList.remove('on');E.touchUI.classList.remove('show');$('win').classList.remove('hidden');
  const s=G.stats,t=Math.round(CL.flow.F.runT);
  $('winStat').innerHTML=`分数 <b style="color:var(--gold)">${G.score.toLocaleString()}</b> · 击杀 ${s.kills} · 爆头 ${s.headKills} · 处决 ${s.exec} · 最高连杀 ${s.maxCombo}<br>用时 ${Math.floor(t/60)} 分 ${t%60} 秒 · 死亡 ${s.deaths} 次 · 卡牌 ${s.cards} 张`;
}
function retryLevel(){hideOver();G.state='play';E.hud.classList.remove('hidden');E.cross.classList.add('on');if(isTouch())E.touchUI.classList.add('show');CL.flow.retry()}
function quit(){G.state='title';E.cross.classList.remove('on');CL.flow.toTitle();title()}

/* ---------- 通知 / 提示 ---------- */
let noticeT=null,tipUntil=0,tipHold=0;
function notice(a,b,boss){
  $('noticeA').textContent=a;$('noticeA').classList.toggle('boss',!!boss);$('noticeB').textContent=b||'';
  $('notice').style.opacity=1;clearTimeout(noticeT);noticeT=setTimeout(()=>$('notice').style.opacity=0,2300);
}
function tip(key,text,sec=3){
  $('tip').innerHTML=(key?`<b>${key}</b>`:'')+text;$('tip').classList.add('show');tipUntil=performance.now()+sec*1000;tipHold=sec;
}
function toast(txt,color){
  const box=$('toasts');if(box.children.length>=5)box.removeChild(box.firstChild);
  const d=document.createElement('div');d.textContent=txt;if(color)d.style.color=color;
  box.appendChild(d);setTimeout(()=>d.remove(),1850);
}
function hitmark(head,kill){
  const c=E.cross;c.classList.remove('hit','kill');void c.offsetWidth;c.classList.add(kill?'kill':head?'kill':'hit');
}
function dnum(v,x,y,head,boss){
  if(!SET.dnum)return;
  const p=R.project(x,y,2.2),d=document.createElement('div');d.className='dnum'+(head?' crit':boss?' weak':'');
  d.textContent=Math.round(v);d.style.left=p.x+'px';d.style.top=p.y+'px';$('marks').appendChild(d);setTimeout(()=>d.remove(),720);
}

/* ---------- HUD ---------- */
function hud(){
  if(E.hud.classList.contains('hidden')||!G.P)return;
  const F=CL.flow.F,P=G.P,dv=G.DV||D.DIFF.normal;
  $('hDiff').textContent=dv.label;$('hLevel').textContent=F.level;
  const boss=G.boss;$('hLeft').textContent=boss?'BOSS':(F.queue.length+G.enemies.length);
  $('hScore').textContent=G.score.toLocaleString();
  const ev=CL.flow.evData(),hev=$('hEvent');
  if(ev){hev.classList.remove('hidden');hev.textContent=ev.name;hev.classList.toggle('zone',F.event==='zone')}else hev.classList.add('hidden');
  const clock=$('clock');
  if(F.event==='timed'&&(F.phase==='spawning'||F.phase==='fighting')){clock.classList.remove('hidden');const t=Math.max(0,F.timer);
    $('clockT').textContent=`${Math.floor(t/60)}:${String(Math.floor(t%60)).padStart(2,'0')}`;clock.classList.toggle('hurry',t<10)}
  else clock.classList.add('hidden');
  // 连杀
  const cb=$('combo'),c=G.combo;
  if(c.n>=2){cb.classList.remove('hidden');$('comboN').textContent='×'+c.n;
    $('comboRank').textContent=CL.comboRank()+' · ×'+CL.comboMult().toFixed(2).replace(/\.?0+$/,'');$('comboB').style.width=(c.t/c.tmax*100)+'%';
    if(c.n!==E.lastCombo){cb.classList.remove('pop');void cb.offsetWidth;cb.classList.add('pop');E.lastCombo=c.n}}
  else{cb.classList.add('hidden');E.lastCombo=0}
  // 生命 / 装甲 / 手雷 / 钩锁
  $('hpT').textContent=`${Math.ceil(P.hp)} / ${P.hpMax}`;$('hpBar').style.width=(P.hp/P.hpMax*100)+'%';$('hpAr').style.width=(P.armorMax?P.armor/P.armorMax*100:0)+'%';
  $('hp').classList.toggle('low',P.hp<P.hpMax*.3);
  const nd=$('nade');if(nd.children.length!==P.nadeMax){nd.innerHTML='';for(let i=0;i<P.nadeMax;i++)nd.appendChild(document.createElement('i'))}
  for(let i=0;i<nd.children.length;i++)nd.children[i].classList.toggle('on',i<P.nades);
  const hk=$('hook');hk.style.display=P.cards.grapple?'block':'none';if(P.cards.grapple)hk.firstElementChild.style.width=(P.hookE*100)+'%';
  const w=P.w;$('ammoCur').textContent=w.mag;const res=P.reserve[w.id];$('ammoRes').textContent='/ '+(res===Infinity?'∞':res);
  $('ammoCur').parentElement.classList.toggle('dry',w.mag<=Math.max(1,Math.ceil(w.magSize*.2)));
  $('reloadB').style.width=(P.reload>0?(1-P.reload/w.reload)*100:0)+'%';
  const strip=$('strip'),key=P.weapons.map(x=>x.id).join('|');
  if(E.stripKey!==key){E.stripKey=key;strip.innerHTML='';
    D.ORDER.forEach(id=>{const o=P.weapons.find(x=>x.id===id);if(!o)return;const s=document.createElement('span');s.className='w';s.textContent=D.W[id].name;strip.appendChild(s)})}
  let wi=0;for(const s of strip.children)s.classList.toggle('on',P.weapons[wi++]===w);
  E.cross.classList.toggle('ads',!!P.ads);
  if(boss)bossBar(boss);
  // 新手提示淡出
  if(E.hintT&&performance.now()>E.hintT){$('hint').style.opacity=0;E.hintT=0}
  // 情境提示：处决 / 回到光幕
  const now=performance.now();
  if(now>tipUntil){
    let ctx=null;
    if(G.state==='play'&&!P.dead){
      for(const e of G.enemies)if(e.execable&&Math.hypot(e.x-P.x,e.y-P.y)<5){ctx=['F','处决 · 回复 25% 生命'];break}
      if(!ctx&&F.event==='zone'&&F.zone&&(P.x<F.zone.x0||P.x>F.zone.x1))ctx=['!',(P.x<F.zone.x0?'→ 向右':'← 向左')+' 快回到光幕里'];
    }
    if(ctx)tip(ctx[0],ctx[1],.2);else $('tip').classList.remove('show');
  }
}

/* ---------- Boss 条 ---------- */
let bossTipUntil=0;
function colorTips(t){
  return t.replace(/(红色长条|红色细线|红光|红圈|红色)/g,'<u class="r">$1</u>').replace(/(黄光|黄圈)/g,'<u>$1</u>').replace(/(白圈|白光)/g,'<u class="w">$1</u>')
    .replace(/(滑铲|下蹲|蹲下|起跳|跳上平台|闪开|绕到背后|走出圈|跑出圈|扔手雷|打头|打背后|打发动机|打散热口|打发光|先清|先打掉护甲)/g,'<u class="c">$1</u>');
}
function bossBar(b){
  const el=$('boss');el.classList.remove('hidden');
  $('bossName').textContent=b.def.name+' · '+b.def.en;
  $('bossHp').style.width=(b.hp/b.hpMax*100)+'%';$('bossAr').style.width=(b.armourMax?b.armourHp/b.armourMax*100:0)+'%';
  $('bossShield').textContent=b.armourHp>0?'护甲':'';
  el.classList.toggle('exposed',b.weakT>0);el.classList.toggle('stunned',b.state==='stun');
  const ph=b.def.phases;$('bossM1').style.left=(ph[0]*100)+'%';$('bossM2').style.left=(ph[1]*100)+'%';
  const bt=$('bossTip');let html='';
  if(G.t<bossTipUntil)html=E.bossTipHtml;
  if(b.weakT>0)html='<u class="c">弱点暴露 ×1.4</u> 趁现在 '+html;
  else if(b.under)html='<u class="c">它钻地了</u> 看地上的沙圈 · 往坑里扔手雷伤害翻倍';
  else if(b.state==='stun')html='<u class="c">它晕了</u> 绕到背后打发动机';
  if(bt.innerHTML!==html)bt.innerHTML=html;
}
function bossIntro(b){
  E.bossTipHtml=(b.def.tips||[]).map(t=>'<u>·</u> '+colorTips(t)).join('<br>');
  bossTipUntil=G.t+10;bossBar(b);
}
function bossHide(){$('boss').classList.add('hidden');$('bossTip').innerHTML=''}

/* ---------- 卡牌 ---------- */
function cardEl(c,i,owned){
  const el=document.createElement('div');el.className='card '+c.rarity;el.dataset.i=i;
  const kind=c.kind==='weapon'?'武器':c.kind==='mod'?(c.rarity==='legend'?'觉醒':'改装'):'通用';
  const gun=c.kind==='general'?'通用':(D.W[c.target]||{}).name||'';
  const chips=[];
  if(c.mods)for(const k in c.mods){const v=c.mods[k];chips.push(`<span class="chip"><small>${D.MOD_NAME[k]||k}</small><b>${v>0?'+':''}${Math.round(v*100)}%</b></span>`)}
  if(c.magAdd)chips.push(`<span class="chip"><small>弹匣</small><b>+${c.magAdd}</b></span>`);
  if(!chips.length)chips.push(`<span class="chip"><small>类型</small><b>${c.kind==='weapon'?'新武器':'被动'}</b></span>`);
  let pips='';const ms=c.maxStacks||1;for(let k=0;k<ms;k++)pips+=`<i class="${k<owned?'on':''}"></i>`;
  const icon=CL.ICONS[c.icon]||CL.ICONS[c.id]||CL.ICONS['gun-pistol'];
  el.innerHTML=`<div class="key">${i+1}</div><div class="face">${c.rarity!=='common'?`<div class="stamp">${D.R[c.rarity]||''}</div>`:''}
    <div class="band${c.kind==='weapon'?' wb':''}"><span class="gun">${gun}</span><span class="kind">${kind}</span></div>
    <div class="art"><img draggable="false" style="width:196px;height:100px;object-fit:contain" src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(icon)}"></div>
    <div class="name">${c.name}</div>
    <div class="head">${c.head||c.flavour||''}</div>
    <div class="chips">${chips.join('')}</div>
    <div class="tip">${(c.detail&&c.detail[0])||c.flavour||''}</div>
    <div class="foot"><span class="pips">${pips}</span><span>点击选取</span></div></div><div class="cp-confirm">再点一次确认</div>`;
  return el;
}
function cards(list,F){
  E.cardsOpen=true;$('cards').classList.remove('hidden');
  $('cpTitle').innerHTML=`拆一件，装一件<small>PICK ONE · 第 ${G.level} 关</small>`;
  const P=G.P,bl=[];for(const id in P.cards){const c=D.CARD[id];if(c)bl.push(`<span class="${c.rarity==='legend'?'aw':''}">${c.name}${P.cards[id]>1?' ×'+P.cards[id]:''}</span>`)}
  $('cpBuild').innerHTML=bl.join('')||'<span>还什么都没拆到</span>';
  const row=$('cpRow');row.innerHTML='';E.touchPick=-1;
  list.forEach((c,i)=>{
    const el=cardEl(c,i,P.cards[c.id]||0);
    el.onclick=()=>{
      if(isTouch()&&E.touchPick!==i){for(const o of row.children)o.classList.remove('chosen');el.classList.add('chosen');E.touchPick=i;return}
      for(const o of row.children){o.classList.add(o===el?'picked':'dropped');o.onclick=null}
      setTimeout(()=>CL.flow.pickCard(i),240);
    };
    row.appendChild(el);
  });
  $('cpNote').textContent=`换一组剩余 ${F.rerolls} 次`;$('btnReroll').disabled=F.rerolls<=0;
}
function cardsClose(){$('cards').classList.add('hidden');E.cardsOpen=false}
function cardKey(n){
  if(G.state!=='cards'||!E.cardsOpen)return;const el=$('cpRow').children[n-1];if(el)el.click();
}

/* ---------- 图鉴 ---------- */
function codex(tab=0){
  $('codex').classList.remove('hidden');
  for(const b of $('cxTabs').children)b.classList.toggle('on',+b.dataset.t===tab);
  const body=$('cxBody');body.innerHTML='';
  const row=(name,en,tip,how,extra,color)=>{
    const d=document.createElement('div');d.className='row';
    d.innerHTML=`<div class="ic" style="display:flex;align-items:center;justify-content:center;font-family:var(--f-disp);font-size:2.4rem;color:${color};text-shadow:2px 2px 0 #000">${name[0]}</div>
      <div><h4>${name}<small>${en}</small></h4><p>${tip}</p><div class="how"><b>应对</b>${how}</div>${extra?`<div class="how"><b>数据</b>${extra}</div>`:''}</div>`;
    body.appendChild(d);
  };
  if(tab===0){const U=D.LEVELS.unlock;for(const id in D.E){const e=D.E[id];row(e.name,e.en,e.tip,e.how,`生命 ${e.hp} · 分值 ${e.cost} · 首次出现 第 ${U[id]||1} 关`,'#e2654e')}}
  else if(tab===1){for(const id in D.EL){const e=D.EL[id];row(e.name,'ELITE','精英机器：更大、更硬，会格挡子弹。',`对应机器的强化版。生命 ${e.hp} · 分值 ${e.cost} · 首次出现 第 ${D.LEVELS.unlock[id]||1} 关`,'','#f2c14e')}}
  else{
    const pl=D.CODEX.player;row(pl.name,pl.en,pl.desc,pl.how,'','#56c2b6');
    for(const b of D.BOSS)row(b.name,b.en,b.tag,`招式：${b.atk} · 弱点：${b.weak}`,b.tips.join('；')+` · 第 ${b.level} 关`,'#ff8c6c');
  }
}

/* ---------- 设置 ---------- */
function settings(){
  $('settings').classList.remove('hidden');
  const body=$('setBody');body.innerHTML='';
  const slider=(label,sub,key,min,max,step,fn)=>{
    const d=document.createElement('div');d.className='setRow';d.innerHTML=`<div class="l"><b>${label}</b><small>${sub}</small></div>`;
    const inp=document.createElement('input');inp.type='range';inp.min=min;inp.max=max;inp.step=step;inp.value=SET[key];
    inp.oninput=()=>{SET[key]=+inp.value;fn&&fn(SET[key]);applySet()};d.appendChild(inp);body.appendChild(d);
  };
  slider('音效','枪声 / 命中 / 爆炸','sfx',0,1,.05,()=>{CL.AU.init();CL.AU.shoot('pistol')});
  slider('音乐','四风格自适应配乐','music',0,1,.05);
  slider('屏幕震动','受击 / 爆炸 / Boss 落地','shake',0,1,.1,()=>R.shake(.5));
  slider('墨线浓度','美漫画风描边','ink',.5,1.5,.05);
  const d=document.createElement('div');d.className='setRow';d.innerHTML=`<div class="l"><b>伤害数字</b><small>命中时飘出数字</small></div>`;
  const b=document.createElement('button');b.className='btn ghost';b.textContent=SET.dnum?'开':'关';
  b.onclick=()=>{SET.dnum=!SET.dnum;b.textContent=SET.dnum?'开':'关';applySet();if(CL.AU.ui)CL.AU.ui()};
  d.appendChild(b);body.appendChild(d);
}
function resetSettings(){Object.assign(SET,{sfx:.8,music:.55,shake:1,ink:1,dnum:true});applySet();settings()}

/* ---------- 触屏 ---------- */
function setTouch(on){
  touch.on=on;if(!on)E.touchUI.classList.remove('show');
}
function touchAim(dx,dy){
  const m=G.mouse;if(!m)return;
  m.x=clamp((m.px===undefined?m.x:m.px/innerWidth*2-1)+dx/innerWidth*2.4,-1,1);
  m.y=clamp((m.py===undefined?m.y:1-m.py/innerHeight*2)-dy/innerHeight*2.4,-1,1);
  m.touch=true;
}
function bindTouch(){
  const T=G.touch,stick=$('stick'),knob=$('stickKnob');let sid=null,sc={x:0,y:0};
  stick.addEventListener('touchstart',e=>{const t=e.changedTouches[0],r=stick.getBoundingClientRect();sid=t.identifier;sc={x:r.left+r.width/2,y:r.top+r.height/2};e.preventDefault()},{passive:false});
  stick.addEventListener('touchmove',e=>{for(const t of e.changedTouches)if(t.identifier===sid){const dx=t.clientX-sc.x,dy=t.clientY-sc.y,l=Math.hypot(dx,dy)||1,m=Math.min(l,46);
    knob.style.transform=`translate(${dx/l*m}px,${dy/l*m}px)`;T.mx=clamp(dx/40,-1,1);T.crouch=dy>26&&l>30}e.preventDefault()},{passive:false});
  const end=e=>{for(const t of e.changedTouches)if(t.identifier===sid){sid=null;T.mx=0;T.crouch=false;knob.style.transform=''}};
  stick.addEventListener('touchend',end);stick.addEventListener('touchcancel',end);
  const look=$('look');let lid=null,lx=0,ly=0;
  look.addEventListener('touchstart',e=>{const t=e.changedTouches[0];lid=t.identifier;lx=t.clientX;ly=t.clientY;e.preventDefault()},{passive:false});
  look.addEventListener('touchmove',e=>{for(const t of e.changedTouches)if(t.identifier===lid){touchAim(t.clientX-lx,t.clientY-ly);lx=t.clientX;ly=t.clientY}e.preventDefault()},{passive:false});
  look.addEventListener('touchend',e=>{for(const t of e.changedTouches)if(t.identifier===lid)lid=null});
  const btn=(id,down,up)=>{const el=$(id);
    el.addEventListener('touchstart',e=>{e.preventDefault();el.classList.add('act');CL.AU.init();down&&down()},{passive:false});
    el.addEventListener('touchend',e=>{e.preventDefault();el.classList.remove('act');up&&up()})};
  btn('mbFire',()=>T.fire=true,()=>T.fire=false);btn('mbAim',()=>T.aim=true,()=>T.aim=false);
  btn('mbJump',()=>{T.jump=true;T.jumpEdge=true},()=>T.jump=false);
  btn('mbSlide',()=>T.slideEdge=true);btn('mbReload',()=>G.press.KeyR=true);
  btn('mbWeap',()=>{const n=G.P?G.P.weapons.length:1,k=((G.P?G.P.wi:0)+1)%n+1;G.press['Digit'+k]=true});
  btn('mbNade',()=>T.nadeEdge=true);btn('mbHook',()=>T.hook=true,()=>T.hook=false);btn('mbExec',()=>T.execEdge=true);
  $('mbPause').addEventListener('touchstart',e=>{e.preventDefault();pause()},{passive:false});
  setInterval(()=>{
    const P=G.P;if(!P||!isTouch()||G.state!=='play')return;
    $('mbHook').style.display=P.cards.grapple?'flex':'none';
    let ex=false;for(const e of G.enemies)if(e.execable&&Math.hypot(e.x-P.x,e.y-P.y)<5){ex=true;break}
    $('mbExec').style.display=ex?'flex':'none';
  },150);
}

/* ---------- 初始化 ---------- */
function init(){
  E.cross=$('cross');E.hud=$('hud');E.title=$('title');E.touchUI=$('touchUI');
  E.hintT=0;E.lastCombo=-1;E.stripKey='';E.cardsOpen=false;E.bossTipHtml='';E.touchPick=-1;
  applySet();drawLogo();refreshTitle();
  addEventListener('mousemove',e=>{E.cross.style.left=e.clientX+'px';E.cross.style.top=e.clientY+'px'});
  addEventListener('contextmenu',e=>e.preventDefault());
  $('btnPlay').onclick=play;
  $('btnCodex').onclick=()=>codex(0);$('btnCodexClose').onclick=()=>$('codex').classList.add('hidden');
  for(const b of $('cxTabs').children)b.onclick=()=>codex(+b.dataset.t);
  $('btnSettings').onclick=settings;$('btnSetClose').onclick=()=>$('settings').classList.add('hidden');$('btnSetReset').onclick=resetSettings;
  $('btnReroll').onclick=()=>CL.flow.rerollCards();
  $('btnResume').onclick=resume;$('btnPauseSet').onclick=settings;$('btnRetryLevel').onclick=retryLevel;$('btnQuit').onclick=quit;
  $('btnRetry').onclick=retryLevel;$('btnDeadQuit').onclick=quit;
  $('btnEndless').onclick=()=>{hideOver();G.state='play';E.cross.classList.add('on');CL.flow.startEndless()};$('btnWinQuit').onclick=quit;
  G.touch={mx:0,fire:false,jump:false,jumpEdge:false,slideEdge:false,nadeEdge:false,execEdge:false,aim:false,hook:false,crouch:false,sprint:false};
  bindTouch();
  if(matchMedia('(pointer:coarse)').matches||(navigator.maxTouchPoints||0)>0&&innerWidth<1100)setTouch(true);
}
CL.ui={init,hud,notice,tip,toast,hitmark,dnum,cards,cardsClose,cardKey,boss:bossBar,bossIntro,bossHide,showDead,showWin,pause,resume,retry:retryLevel,hideOver,title,play,
  setTouch,touchAim,codex,settings,resetSettings,drawLogo,applySet,get settings(){return SET},get touch(){return touch}};
})();
