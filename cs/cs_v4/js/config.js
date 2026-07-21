// config.js — 全局配置与常量
'use strict';

const CFG = {
  WORLD_W: 80,          // 世界宽 (x)
  WORLD_D: 80,          // 世界深 (z)
  WORLD_H: 36,          // 世界高 (y)
  CHUNK: 16,            // 区块边长
  WATER_LEVEL: 6,

  GRAVITY: 26,
  JUMP_VEL: 9.2,
  WALK_SPEED: 5.6,
  SPRINT_SPEED: 8.4,
  PLAYER_HALF: 0.32,    // 玩家碰撞半宽
  PLAYER_HEIGHT: 1.75,
  EYE_HEIGHT: 1.62,
  MOUSE_SENS: 0.0023,

  MAX_HP: 100,
  TOTAL_WAVES: 8,       // 胜利所需波次

  SHOT_RANGE: 90,
  PICK_RANGE: 7,        // 放置/挖掘距离
};

// 方块定义：top/side/bottom 对应纹理图集中的格子
const BLOCKS = {
  grass: { id: 1, name: '草方块', tex: { top: [0,0], side: [1,0], bottom: [2,0] }, hardness: 1,   breakable: true  },
  dirt:  { id: 2, name: '泥土',   tex: { top: [2,0], side: [2,0], bottom: [2,0] }, hardness: 1,   breakable: true  },
  stone: { id: 3, name: '石头',   tex: { top: [3,0], side: [3,0], bottom: [3,0] }, hardness: 4,   breakable: true  },
  sand:  { id: 4, name: '沙子',   tex: { top: [4,0], side: [4,0], bottom: [4,0] }, hardness: 1,   breakable: true  },
  wood:  { id: 5, name: '木头',   tex: { top: [5,0], side: [6,0], bottom: [5,0] }, hardness: 2,   breakable: true  },
  leaves:{ id: 6, name: '树叶',   tex: { top: [7,0], side: [7,0], bottom: [7,0] }, hardness: 0.5, breakable: true  },
  planks:{ id: 7, name: '木板',   tex: { top: [0,1], side: [0,1], bottom: [0,1] }, hardness: 2,   breakable: true  },
  brick: { id: 8, name: '砖块',   tex: { top: [1,1], side: [1,1], bottom: [1,1] }, hardness: 5,   breakable: true  },
  glass: { id: 9, name: '玻璃',   tex: { top: [2,1], side: [2,1], bottom: [2,1] }, hardness: 0.5, breakable: true, transparent: true },
  bedrock:{ id:10, name: '基岩',  tex: { top: [3,1], side: [3,1], bottom: [3,1] }, hardness: 999, breakable: false },
  water: { id:11, name: '水',     tex: { top: [4,1], side: [4,1], bottom: [4,1] }, hardness: 999, breakable: false, transparent: true, liquid: true },
};
const BLOCK_BY_ID = {};
Object.values(BLOCKS).forEach(b => BLOCK_BY_ID[b.id] = b);

// 武器定义
const WEAPONS = [
  { key:'rifle',   name:'突击步枪', damage:26, rate:0.115, mag:30, reserve:Infinity, reload:1.5, spread:0.014, auto:true,  tracer:0xffe27a, pitch:1.0 },
  { key:'pistol',  name:'手枪',     damage:20, rate:0.26,  mag:12, reserve:Infinity, reload:1.1, spread:0.010, auto:false, tracer:0xaef3ff, pitch:1.35 },
  { key:'shotgun', name:'霰弹枪',   damage:11, rate:0.85,  mag:6,  reserve:Infinity, reload:2.2, spread:0.065, auto:false, pellets:8, tracer:0xffab5e, pitch:0.7 },
];

// 快捷栏：3 武器 + 4 方块
const HOTBAR = [
  { type:'weapon', idx:0 },
  { type:'weapon', idx:1 },
  { type:'weapon', idx:2 },
  { type:'block', block:'grass', count:Infinity },
  { type:'block', block:'dirt',  count:Infinity },
  { type:'block', block:'stone', count:Infinity },
  { type:'block', block:'planks',count:Infinity },
];

// 敌人类型
const ENEMY_TYPES = {
  zombie:  { hp:55,  speed:2.5, dmg:10, score:100, scale:1.0,  color:0x3f7a3f, skin:0x6a8f5f, atkRange:1.9, name:'僵尸' },
  runner:  { hp:30,  speed:4.6, dmg:6,  score:120, scale:0.85, color:0x8a5a2a, skin:0xb98a55, atkRange:1.7, name:'疾行兽' },
  brute:   { hp:170, speed:1.7, dmg:22, score:300, scale:1.35, color:0x5a3a6e, skin:0x7a5a8e, atkRange:2.3, name:'蛮兽' },
  creeper: { hp:40,  speed:3.0, dmg:0,  score:150, scale:0.95, color:0x4ea82e, skin:0x63c93e, atkRange:2.6, name:'苦力怕', explodes:true, blast:3.2, blastDmg:45 },
};

// 波次配置生成
function waveComp(w) {
  // 返回本波敌人构成（总数平滑上升）
  const comp = [];
  const z = Math.min(3 + w, 12);
  for (let i = 0; i < z; i++) comp.push('zombie');
  if (w >= 2) { const r = Math.min(1 + Math.floor(w / 2), 5); for (let i=0;i<r;i++) comp.push('runner'); }
  if (w >= 3) { const c = Math.min(Math.floor((w - 1) / 2), 4); for (let i=0;i<c;i++) comp.push('creeper'); }
  if (w >= 5) { const b = Math.min(Math.floor((w - 3) / 2), 3); for (let i=0;i<b;i++) comp.push('brute'); }
  return comp;
}

// 简单工具
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const randInt = (a, b) => Math.floor(rand(a, b + 1));
