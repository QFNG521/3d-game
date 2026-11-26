/* ========================================================================
 * CLANG! 2.5D — 80 主循环：输入 / 状态机 / 固定步长逻辑 + 渲染合成
 * ====================================================================== */
(function(){
'use strict';
const CL=window.CL,T=THREE,G=CL.G,R=CL.render;
const $=id=>document.getElementById(id);

function err(e){
  const b=$('boot');b.classList.remove('hidden');b.classList.add('err');
  b.textContent='出错了：'+(e&&(e.message||e)+'\n'+String(e&&e.stack||'').split('\n').slice(0,4).join('\n'));
}
addEventListener('error',e=>{if(!window.__errOnce){window.__errOnce=1;err(e.error||e.message)}});
addEventListener('unhandledrejection',e=>err(e.reason));

function input(){
  G.mouse=new T.Vector2(.15,.05);G.mouse.px=innerWidth*.6;G.mouse.py=innerHeight*.5;
  G.aim=new T.Vector3(6,1.4,0);G.keys={};G.press={};
  addEventListener('keydown',e=>{
    if(e.repeat)return;
    if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Tab'].includes(e.code))e.preventDefault();
    G.keys[e.code]=true;G.press[e.code]=true;
    if(CL.AU.init&&G.state!=='title')CL.AU.init();
    if(e.code==='Escape'){if(G.state==='play')CL.ui.pause();else if(G.state==='pause')CL.ui.resume();return}
    if(G.state==='cards'){if(/^Digit[1-3]$/.test(e.code))CL.ui.cardKey(+e.code.slice(5));else if(e.code==='KeyR')CL.flow.rerollCards();return}
    if(G.state==='dead'&&e.code==='KeyR'){CL.ui.retry();return}
    if(G.state==='title'&&e.code==='Enter'){CL.ui.play();return}
  });
  addEventListener('keyup',e=>{G.keys[e.code]=false});
  addEventListener('blur',()=>{G.keys={};G.mouse.down=false;G.mouse.rdown=false;if(G.state==='play')CL.ui.pause()});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&G.state==='play')CL.ui.pause()});
  addEventListener('mousemove',e=>{G.mouse.px=e.clientX;G.mouse.py=e.clientY;G.mouse.x=e.clientX/innerWidth*2-1;G.mouse.y=1-e.clientY/innerHeight*2;G.mouse.touch=false});
  addEventListener('mousedown',e=>{CL.AU.init();if(e.button===0)G.mouse.down=true;if(e.button===2)G.mouse.rdown=true});
  addEventListener('mouseup',e=>{if(e.button===0)G.mouse.down=false;if(e.button===2)G.mouse.rdown=false});
  addEventListener('touchstart',()=>CL.AU.init(),{once:true,passive:true});
}

function loop(){
  let last=performance.now(),crossX=-1,crossY=-1;
  const frame=t=>{
    requestAnimationFrame(frame);
    const real=Math.min(.05,(t-last)/1000);last=t;
    R.U.uTime.value=t/1000;
    if(G.state==='play'){
      if(G.hitstop>0)G.hitstop-=real;
      const dt=real*(G.hitstop>0?.08:1);
      G.t+=dt;
      CL.stepCombat(dt);CL.enemies.update(dt);CL.player.update(dt);CL.boss.update(dt);CL.flow.update(dt);
      G.press={};
      const T=G.touch;if(T){T.jumpEdge=false;T.slideEdge=false;T.nadeEdge=false;T.execEdge=false}
    }else if(G.state==='dead'){
      G.t+=real;CL.flow.update(real);
    }
    CL.world.update(real,real,t/1000);
    // 准星跟随（鼠标 / 触屏虚拟光标）
    const cx=(G.mouse.x*.5+.5)*innerWidth,cy=(-G.mouse.y*.5+.5)*innerHeight;
    if(Math.abs(cx-crossX)>1||Math.abs(cy-crossY)>1){crossX=cx;crossY=cy;const c=$('cross');c.style.left=cx+'px';c.style.top=cy+'px'}
    R.updateCamera(real);
    if(CL.fx.draw)CL.fx.draw();if(CL.bullets.draw)CL.bullets.draw();
    R.render();
    if(G.state==='dead'&&CL.ui.hud)CL.ui.hud();
  };
  requestAnimationFrame(frame);
}

function boot(){
  try{
    if(!window.WebGLRenderingContext||!R.renderer.getContext()){throw new Error('浏览器不支持 WebGL')}
    $('boot').classList.add('hidden');
    CL.game=G;CL.ui.init();input();loop();
  }catch(e){err(e)}
}
if(document.readyState==='loading')addEventListener('DOMContentLoaded',boot);else boot();
})();
