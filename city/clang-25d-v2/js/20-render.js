/* ========================================================================
 * CLANG! 2.5D — 20 渲染：透视相机 + 双通道合成（美漫印刷后处理）
 * 通道 A：卡通着色 beauty → RT；通道 B：每个网格写入独立 id 色 → RT
 * 合成：id 色差 → 墨线；亮度 → 网点；纸纹 / 套印错位 / 沙暴横纹 / 受伤暗角
 * ====================================================================== */
(function(){
'use strict';
const T=THREE,CL=window.CL,{clamp,damp,rnd,$}=CL;
const canvas=$('gl');
const renderer=new T.WebGLRenderer({canvas,antialias:false,powerPreference:'high-performance',stencil:false});
// 调色板按 sRGB 直接书写：关闭输出端的线性→sRGB 编码（本构建为物理光照模式，光强需 ×π 补偿）
renderer.outputColorSpace=T.LinearSRGBColorSpace;
const LIGHT_PI=Math.PI;
const scene=new T.Scene();
scene.fog=new T.Fog(0x8f5a35,46,130);
const camera=new T.PerspectiveCamera(34,1,.5,800);
let rtCol=null,rtInk=null,postOK=true;

const U={
  tCol:{value:null},tInk:{value:null},uTexel:{value:new T.Vector2()},uCss:{value:new T.Vector2()},
  uTime:{value:0},uInk:{value:1},uHalf:{value:1},uGrain:{value:.05},uMis:{value:1},uFlash:{value:0},
  uHurt:{value:0},uSand:{value:0},uLow:{value:0},uDir:{value:1},
  uInkColor:{value:new T.Color(CL.C.ink)},uFlashColor:{value:new T.Color('#fff3d6')},uSandColor:{value:new T.Color('#a5763f')}
};
const postMat=new T.ShaderMaterial({
  uniforms:U,depthTest:false,depthWrite:false,
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
  fragmentShader:`
precision highp float;
uniform sampler2D tCol;uniform sampler2D tInk;
uniform vec2 uTexel;uniform vec2 uCss;
uniform float uTime,uInk,uHalf,uGrain,uMis,uFlash,uHurt,uSand,uLow,uDir;
uniform vec3 uInkColor,uFlashColor,uSandColor;
varying vec2 vUv;
float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float df(vec3 a,vec3 b){return abs(a.r-b.r)+abs(a.g-b.g)+abs(a.b-b.b);}
void main(){
  vec2 uv=vUv;
  float mis=uMis;
  vec3 col;
  col.g=texture2D(tCol,uv).g;
  col.r=texture2D(tCol,uv+vec2(mis,-mis*.5)*uTexel).r;
  col.b=texture2D(tCol,uv-vec2(mis*.6,mis*.3)*uTexel).b;
  vec3 c0=texture2D(tInk,uv).rgb;
  vec2 t=uTexel;float e=0.0;
  e=max(e,df(c0,texture2D(tInk,uv+vec2(t.x,0.)).rgb));
  e=max(e,df(c0,texture2D(tInk,uv-vec2(t.x,0.)).rgb));
  e=max(e,df(c0,texture2D(tInk,uv+vec2(0.,t.y)).rgb));
  e=max(e,df(c0,texture2D(tInk,uv-vec2(0.,t.y)).rgb));
  e=max(e,df(c0,texture2D(tInk,uv+vec2(t.x,t.y)).rgb));
  e=max(e,df(c0,texture2D(tInk,uv+vec2(-t.x,t.y)).rgb));
  e=max(e,df(c0,texture2D(tInk,uv+vec2(2.*t.x,0.)).rgb));
  e=max(e,df(c0,texture2D(tInk,uv-vec2(2.*t.x,0.)).rgb));
  e=max(e,df(c0,texture2D(tInk,uv+vec2(0.,2.*t.y)).rgb));
  e=max(e,df(c0,texture2D(tInk,uv-vec2(0.,2.*t.y)).rgb));
  float ink=smoothstep(.07,.16,e)*uInk;
  col=mix(col,uInkColor,ink);
  vec2 p=mat2(.7071,-.7071,.7071,.7071)*(uv*uCss);
  vec2 cell=fract(p/5.0)-.5;
  float d=length(cell)*2.0;
  float lum=dot(col,vec3(.299,.587,.114));
  float shade=smoothstep(.5,.12,lum);
  float r=shade*.95;
  float cov=smoothstep(r+.25,r-.25,d);
  col=mix(col,uInkColor,cov*uHalf*.5*(1.0-ink));
  col+=(hash(floor(uv*uCss))-.5)*uGrain;
  if(uSand>.001){
    float row=floor(uv.y*uCss.y/3.0);
    float xx=uv.x*26.0+uTime*(5.0+hash(vec2(row,3.0))*9.0)*uDir;
    float st=step(.84,hash(vec2(row,floor(xx))));
    col=mix(col,uSandColor,uSand*(.48+.5*st));
  }
  float vg=smoothstep(.35,1.05,length((uv-.5)*vec2(1.25,1.0)));
  col*=1.0-vg*.42;
  col=mix(col,vec3(.78,.27,.18),uHurt*smoothstep(.2,.85,length(uv-.5)));
  col=mix(col,vec3(.78,.27,.18),uLow*.28*smoothstep(.25,.9,length(uv-.5))*(.55+.45*sin(uTime*7.0)));
  col=mix(col,uFlashColor,uFlash);
  gl_FragColor=vec4(col,1.0);
}`
});
const postScene=new T.Scene(),postCam=new T.Camera();
const quad=new T.Mesh(new T.PlaneGeometry(2,2),postMat);quad.frustumCulled=false;postScene.add(quad);

/* ---------- 灯光（颜色随章节主题插值） ---------- */
const hemi=new T.HemisphereLight(0xffd9a8,0x4a2c1c,1.5);scene.add(hemi);
const key=new T.DirectionalLight(0xffd79a,2.1);key.position.set(-8,14,16);scene.add(key);
const rim=new T.DirectionalLight(0xff8a4c,.85);rim.position.set(10,6,-14);scene.add(rim);
rim.intensity=.85*Math.PI;

function resize(){
  const w=Math.max(1,innerWidth),h=Math.max(1,innerHeight),dpr=Math.min(devicePixelRatio||1,2);
  renderer.setPixelRatio(dpr);renderer.setSize(w,h,false);
  camera.aspect=w/h;camera.updateProjectionMatrix();
  const cap=6.5e6;let s=2;if(w*h*4>cap)s=Math.sqrt(cap/(w*h));
  const rw=Math.max(64,Math.round(w*s)),rh=Math.max(64,Math.round(h*s));
  try{
    if(rtCol){rtCol.dispose();rtInk.dispose()}
    rtCol=new T.WebGLRenderTarget(rw,rh,{minFilter:T.LinearFilter,magFilter:T.LinearFilter});
    rtInk=new T.WebGLRenderTarget(rw,rh,{minFilter:T.NearestFilter,magFilter:T.NearestFilter});
    U.tCol.value=rtCol.texture;U.tInk.value=rtInk.texture;
    U.uTexel.value.set(1/rw,1/rh);U.uCss.value.set(rw,rh);
    postOK=true;
  }catch(e){postOK=false;console.warn('post-process disabled',e)}
}

/* ---------- 相机 ---------- */
const cam={x:0,y:4.4,z:26,tz:1,zoom:1,trauma:0,shakeScale:1,ox:0,oy:0,rot:0};
const ray=new T.Raycaster(),plane=new T.Plane(new T.Vector3(0,0,1),0),aimV=new T.Vector3(8,2,0),pv=new T.Vector3();
function shake(v){cam.trauma=Math.min(1,cam.trauma+v)}
function updateCamera(real){
  const G=CL.game,P=G&&G.P;
  const aspect=innerWidth/innerHeight,baseH=clamp(24/aspect,14,23);
  const B=G&&G.boss;let zm=1;
  if(B&&B.alive&&P){const d=Math.abs(B.x-P.x);zm=clamp(1.12-d/60,.74,1)}
  cam.zoom=damp(cam.zoom,cam.tz*zm,4.5,real);
  const vh=baseH/cam.zoom,half=vh*aspect/2;
  let tx=0,ty=4.4;
  if(P){
    const look=clamp((aimV.x-P.x)*.2,-2.6,2.6),lim=Math.max(0,26-half+3.5);
    tx=clamp(P.x+look+(B&&B.alive?(B.x-P.x)*.3:0),-lim,lim);ty=4.4+Math.max(0,P.y)*.32+(B&&B.alive?1.6:0);
  }
  cam.x=damp(cam.x,tx,5.5,real);cam.y=damp(cam.y,ty,4,real);
  cam.trauma=Math.max(0,cam.trauma-real*1.7);
  const s=cam.trauma*cam.trauma*cam.shakeScale;
  cam.ox=rnd(-1,1)*s*.5;cam.oy=rnd(-1,1)*s*.4;cam.rot=rnd(-1,1)*s*.02;
  cam.z=vh*1.63;
  camera.position.set(cam.x+cam.ox,cam.y+2.2+cam.oy,cam.z);
  camera.lookAt(cam.x+cam.ox,cam.y+.3+cam.oy,0);
  camera.rotation.z+=cam.rot;
  camera.updateMatrixWorld();
  if(G&&G.mouse){ray.setFromCamera(G.mouse,camera);ray.ray.intersectPlane(plane,aimV);if(aimV)G.aim.copy(aimV)}
}
function project(x,y,z=0){
  pv.set(x,y,z).project(camera);
  return {x:(pv.x*.5+.5)*innerWidth,y:(-pv.y*.5+.5)*innerHeight,z:pv.z};
}
const clearC=new T.Color(0x8f5a35);
function render(){
  if(!postOK){
    camera.layers.enableAll();renderer.setRenderTarget(null);renderer.setClearColor(clearC);renderer.render(scene,camera);return;
  }
  const roots=CL.ink.roots,saved=[];
  for(const root of roots){
    const list=root.userData.ink;if(!list)continue;
    for(const m of list){if(m.userData.base) m.material=m.userData.base;saved.push(m.material);m.material=m.userData.inkMat}
  }
  camera.layers.set(0);
  renderer.setRenderTarget(rtInk);renderer.setClearColor(0x000000,1);renderer.render(scene,camera);
  stats.ink=renderer.info.render.calls;
  let i=0;
  for(const root of roots){const list=root.userData.ink;if(!list)continue;for(const m of list)m.material=saved[i++]}
  camera.layers.enableAll();
  renderer.setRenderTarget(rtCol);renderer.setClearColor(clearC);renderer.render(scene,camera);
  stats.beauty=renderer.info.render.calls;
  renderer.setRenderTarget(null);
  if(view==='post')renderer.render(postScene,postCam);
  else{ // 调试：直接看 beauty / ink / 只看某层
    const cam2=camera.clone();cam2.position.copy(camera.position);cam2.quaternion.copy(camera.quaternion);
    if(typeof view==='number'){cam2.layers.set(view)}
    if(view==='ink'){cam2.layers.set(0);swapInk(true);renderer.setRenderTarget(null);renderer.setClearColor(0x000000,1);renderer.render(scene,cam2);swapInk(false)}
    else{renderer.setRenderTarget(null);renderer.setClearColor(clearC);renderer.render(scene,cam2)}
  }
}
const stats={ink:0,beauty:0};
function swapInk(on){for(const root of CL.ink.roots){const list=root.userData.ink;if(!list)continue;for(const m of list)m.material=on?m.userData.inkMat:m.userData.base}}
let view='post';
addEventListener('resize',resize);resize();
CL.render={scene,camera,renderer,U,cam,updateCamera,render,resize,project,shake,stats,
  setView:v=>{view=v},
  getRT:()=>rtCol,getRTInk:()=>rtInk,
  PI:Math.PI,aimPlane:plane,
  clearColor:clearC,fog:scene.fog,lights:{hemi,key,rim}};
})();
