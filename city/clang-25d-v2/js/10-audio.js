/* ========================================================================
 * CLANG! 2.5D — 10 音频：合成音效 + 四风格自适应配乐（全部 WebAudio 实时合成）
 * 音乐风格对应原作：夜行合成器 / 废铁打击 / 荒漠西部 / 铁锈摇滚
 * ====================================================================== */
(function(){
'use strict';
const CL=window.CL,rnd=Math.random;
const AU=CL.AU={
  ctx:null,sfx:null,mus:null,noise:null,vol:{sfx:.8,music:.55},
  musState:{on:false,style:0,I:0,step:0,next:0,timer:null,bar:0},
  init(){
    if(this.ctx){if(this.ctx.state==='suspended')this.ctx.resume();return true;}
    const A=window.AudioContext||window.webkitAudioContext;if(!A)return false;
    const c=this.ctx=new A();
    const comp=c.createDynamicsCompressor();
    comp.threshold.value=-6;comp.knee.value=8;comp.ratio.value=3;comp.attack.value=.003;comp.release.value=.12;
    comp.connect(c.destination);
    this.sfx=c.createGain();this.sfx.gain.value=this.vol.sfx;this.sfx.connect(comp);
    this.mus=c.createGain();this.mus.gain.value=this.vol.music*.5;this.mus.connect(comp);
    const len=c.sampleRate*1.2,b=c.createBuffer(1,len,c.sampleRate),d=b.getChannelData(0);
    for(let i=0;i<len;i++)d[i]=rnd()*2-1;
    this.noise=b;
    if(c.state==='suspended')c.resume();
    return true;
  },
  setVol(sfx,music){this.vol.sfx=sfx;this.vol.music=music;if(this.sfx){this.sfx.gain.value=sfx;this.mus.gain.value=music*.5}},
  env(t,dur,vol,dest,attack=.004){
    const g=this.ctx.createGain();
    g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(vol,t+attack);
    g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    g.connect(dest||this.sfx);return g;
  },
  osc(type,f,t,dur,vol,dest,o={}){
    if(!this.ctx)return null;
    const x=this.ctx.createOscillator();x.type=type;x.frequency.setValueAtTime(f,t);
    if(o.to)x.frequency.exponentialRampToValueAtTime(o.to,t+dur);
    if(o.detune)x.detune.value=o.detune;
    x.connect(this.env(t,dur,vol,dest,o.attack||.004));x.start(t);x.stop(t+dur+.05);return x;
  },
  noiseHit(t,dur,vol,o={}){
    if(!this.ctx)return;
    const s=this.ctx.createBufferSource();s.buffer=this.noise;s.loop=true;s.playbackRate.value=o.rate||1;
    const f=this.ctx.createBiquadFilter();f.type=o.type||'lowpass';f.frequency.setValueAtTime(o.freq||1200,t);
    if(o.to)f.frequency.exponentialRampToValueAtTime(o.to,t+dur);
    f.Q.value=o.q||.8;
    s.connect(f);f.connect(this.env(t,dur,vol,o.dest||this.sfx));s.start(t);s.stop(t+dur+.05);
  },
  now(){return this.ctx?this.ctx.currentTime:0},

  /* ---------- 音效 ---------- */
  shoot(k){
    if(!this.ctx)return;
    if(k==='shotgun'){this.noiseHit(this.now(),.34,.7,{freq:1300,to:180});this.noiseHit(this.now(),.12,.4,{type:'highpass',freq:2800});this.osc('sine',105,this.now(),.22,.6,this.sfx,{to:38});}
    else if(k==='rifle'){const t=this.now();this.noiseHit(t,.09,.3,{type:'bandpass',freq:2400,q:.6});this.osc('square',190,t,.07,.16,this.sfx,{to:70});}
    else if(k==='sniper'){const t=this.now();this.noiseHit(t,.4,.75,{freq:2600,to:160});this.osc('sawtooth',150,t,.3,.5,this.sfx,{to:34});this.osc('sine',1500,t,.05,.2,this.sfx,{to:260});}
    else{const t=this.now();this.noiseHit(t,.14,.5,{freq:2500,to:320});this.osc('square',330,t,.09,.26,this.sfx,{to:110});}
  },
  hit(head){if(!this.ctx)return;const t=this.now();
    if(head){this.osc('square',1500,t,.08,.2,this.sfx,{to:900});this.osc('sine',2400,t,.07,.14,this.sfx);}
    else this.noiseHit(t,.05,.18,{type:'bandpass',freq:2600,q:1.2});},
  kill(big){if(!this.ctx)return;const t=this.now();const s=big?1.8:1;
    this.noiseHit(t,.3*s,.4,{freq:1500,to:220});this.osc('sawtooth',150,t,.24*s,.3,this.sfx,{to:46});
    this.osc('square',523,t,.09,.12,this.sfx,{to:2100});},
  clangSfx(p=1){if(!this.ctx)return;const t=this.now();
    [1,2.76,5.4].forEach((m,i)=>this.osc('square',420*p*m,t,.5/(i+1),.22/(i+1),this.sfx));},
  explode(s=1){if(!this.ctx)return;const t=this.now();
    this.noiseHit(t,.6*s,.7,{freq:900,to:60});this.osc('sine',85,t,.5*s,.5,this.sfx,{to:26});this.noiseHit(t,.08,.3,{type:'highpass',freq:3000});},
  hurt(){if(!this.ctx)return;const t=this.now();this.noiseHit(t,.2,.4,{freq:900,to:200});this.osc('sawtooth',160,t,.24,.3,this.sfx,{to:55});},
  jump(){this.osc&&this.osc('square',300,this.now(),.1,.1,this.sfx,{to:540})},
  land(){this.noiseHit(this.now(),.07,.14,{freq:500})},
  slide(){this.noiseHit(this.now(),.3,.2,{type:'bandpass',freq:1100,q:.5})},
  step(){this.noiseHit(this.now(),.04,.05,{freq:800})},
  hook(){if(!this.ctx)return;const t=this.now();this.osc('square',500,t,.09,.16,this.sfx,{to:1500});this.noiseHit(t,.35,.14,{type:'highpass',freq:2400})},
  hookHit(){this.osc('square',900,this.now(),.07,.16,this.sfx,{to:400})},
  execute(){if(!this.ctx)return;const t=this.now();this.noiseHit(t,.34,.5,{freq:1400,to:180});this.osc('sawtooth',170,t,.32,.38,this.sfx,{to:50});this.osc('square',700,t,.14,.2,this.sfx,{to:180});},
  reload(){if(!this.ctx)return;const t=this.now();this.osc('square',480,t,.05,.14,this.sfx);this.osc('square',300,t+.14,.06,.1,this.sfx)},
  clack(){this.osc('square',820,this.now(),.05,.14,this.sfx,{to:480})},
  empty(){this.osc('square',190,this.now(),.05,.12,this.sfx)},
  pickup(){if(!this.ctx)return;const t=this.now();this.osc('square',880,t,.08,.16,this.sfx);this.osc('square',1320,t+.07,.1,.14,this.sfx)},
  card(){if(!this.ctx)return;const t=this.now();[660,880,1100].forEach((f,i)=>this.osc('square',f,t+i*.07,.14,.16,this.sfx))},
  ui(){this.osc('square',640,this.now(),.05,.1,this.sfx)},
  warn(){this.osc('square',760,this.now(),.1,.14,this.sfx,{to:980})},
  snipe(){if(!this.ctx)return;const t=this.now();this.noiseHit(t,.22,.3,{type:'bandpass',freq:2600,q:.5});this.osc('sawtooth',700,t,.2,.22,this.sfx,{to:150})},
  laser(){if(!this.ctx)return;this.osc('sawtooth',1200,this.now(),.4,.14,this.sfx,{to:300})},
  slam(){if(!this.ctx)return;const t=this.now();this.osc('sine',70,t,.4,.7,this.sfx,{to:28});this.noiseHit(t,.35,.4,{freq:600,to:80});},
  fuse(){this.osc('square',1100,this.now(),.05,.1,this.sfx)},
  boss(){if(!this.ctx)return;const t=this.now();this.osc('sawtooth',70,t,.9,.42,this.sfx,{to:38});this.osc('square',140,t+.1,.6,.2,this.sfx,{to:60});this.clangSfx(.5)},
  wave(){if(!this.ctx)return;const t=this.now();[392,523,659].forEach((f,i)=>this.osc('square',f,t+i*.09,.18,.16,this.sfx))},
  win(){if(!this.ctx)return;const t=this.now();[523,659,784,1046,1318].forEach((f,i)=>this.osc('square',f,t+i*.13,.32,.2,this.sfx))},
  rumble(){if(!this.ctx)return;this.noiseHit(this.now(),.5,.3,{freq:220,q:1.2})},
  count(hi){this.osc('square',hi?1046:660,this.now(),.09,.14,this.sfx)},

  /* ---------- 配乐 ---------- */
  startMusic(style){
    if(!this.ctx)return;
    this.stopMusic();
    const m=this.musState;m.style=style|0;m.step=0;m.bar=0;m.next=this.ctx.currentTime+.08;
    m.on=true;m.timer=setInterval(()=>this.sched(),40);
  },
  stopMusic(){const m=this.musState;m.on=false;if(m.timer){clearInterval(m.timer);m.timer=null}},
  setMusic(style,I){const m=this.musState;if(m.style!==(style|0)){this.startMusic(style)}m.I=I},
  setIntensity(I){this.musState.I=I},
  sched(){
    const m=this.musState;if(!m.on||!this.ctx)return;
    const bpm=[104,122,96,140][m.style],spb=60/bpm/4;
    while(m.next<this.ctx.currentTime+.2){
      this.playStep(m.step,m.next,m.I,m.style,m.bar);
      m.next+=spb;m.step++;
      if(m.step>=16){m.step=0;m.bar=(m.bar+1)%4}
    }
  },
  kick(t,v){this.osc('sine',150,t,.22,v,this.mus,{to:44,attack:.002})},
  snare(t,v){this.noiseHit(t,.13,v,{type:'highpass',freq:1700,dest:this.mus});this.osc('triangle',190,t,.09,v*.6,this.mus)},
  hat(t,v){this.noiseHit(t,.035,v,{type:'highpass',freq:7000,dest:this.mus})},
  clang(t,f,v){[1,2.76,5.4].forEach((k,i)=>this.osc('square',f*k,t,.6/(i+1),v/(i+1),this.mus))},
  playStep(s,t,I,style,bar){
    const N=(root,semi,type,dur,vol,o)=>this.osc(type,root*Math.pow(2,semi/12),t,dur,vol,this.mus,o);
    if(style===0){ // 夜行合成器
      const root=[110,110,87.3,98][bar],chord=[0,3,7,10,12,10,7,3];
      if(s%2===0)N(root,[0,0,-4,-2][bar],'sawtooth',.16,.2);
      if(s%4===0)this.kick(t,.9);
      if(I>.3&&(s===4||s===12))this.snare(t,.4);
      if(I>.15&&s%2===1)this.hat(t,.2);
      if(I>.45)N(root*2,[0,3,7,12,10,7,3,0][s],'square',.11,.07);
      if(I>.75&&s===0)N(root*2,7,'sawtooth',1.6,.09,{attack:.2});
    }else if(style===1){ // 废铁打击
      const root=[82.4,82.4,110,98][bar];
      if(s%4===0)this.kick(t,.8);
      if(I>.1&&[0,3,6,10,12].includes(s))this.clang(t,[420,630,940][((s+bar)%3)],.12+I*.1);
      if(s%2===0)N(root,[0,0,0,5,3,3,3,7][(s/2)|0],'square',.13,.13);
      if(I>.35&&(s===4||s===12))this.snare(t,.4);
      if(I>.6&&s%2===1)this.hat(t,.22);
      if(I>.8&&s%4===2)N(root*4,[0,3,7,10][bar],'sawtooth',.2,.05);
    }else if(style===2){ // 荒漠西部
      const root=[98,98,130.8,110][bar],g=[0,7,12,7][s%4];
      if([0,6,8,14].includes(s))N(root,[0,0,5,3][bar],'triangle',.24,.26);
      if(I>.1&&s%2===1)this.hat(t,.25);
      if(I>.25&&s%4===0)this.kick(t,.6);
      if(I>.45)N(root*2,g,'triangle',.1,.06);
      if(I>.55&&(s===7||s===15))N(root*4,[0,2,3][bar],'sine',.5,.1,{to:root*4*Math.pow(2,([3,2,0][bar])/12),attack:.04});
      if(I>.8&&(s===0||s===10))this.clang(t,840,.07);
    }else{ // 铁锈摇滚
      const root=[82.4,82.4,110,103.8][bar],riff=[0,null,0,3,5,null,0,7,0,null,3,5,7,10,12,null];
      const n=riff[s];
      if(n!==null){N(root,n,'sawtooth',.13,.12);N(root,n+.01,'square',.13,.1,{detune:8})}
      if(s%4===0)this.kick(t,1);
      if(s===4||s===12)this.snare(t,.5);
      if(I>.1&&s%2===1)this.hat(t,.2);
      if(I>.5&&s%2===0)N(root/2,[0,0,0,0,3,3,5,5][((s/2)|0)],'sawtooth',.14,.16);
      if(I>.75&&s===0)N(root*2,7,'square',.6,.06,{attack:.03});
    }
  }
};
})();
