// textures.js — 程序化像素纹理：一张 8×2 图集 + 快捷栏图标
'use strict';

const TEX_SIZE = 16;            // 每格 16×16 像素
const ATLAS_COLS = 8, ATLAS_ROWS = 2;

function makeTexGen() {
  // 每种纹理一个绘制函数 (ctx, x0, y0)
  const R = () => Math.random();
  const px = (ctx, x0, y0, x, y, c) => { ctx.fillStyle = c; ctx.fillRect(x0 + x, y0 + y, 1, 1); };
  const fill = (ctx, x0, y0, c) => { ctx.fillStyle = c; ctx.fillRect(x0, y0, TEX_SIZE, TEX_SIZE); };
  const speckle = (ctx, x0, y0, colors, n) => {
    for (let i = 0; i < n; i++) px(ctx, x0, y0, randInt(0, 15), randInt(0, 15), colors[randInt(0, colors.length - 1)]);
  };

  return {
    // [0,0] 草顶
    grassTop(ctx, x0, y0) {
      fill(ctx, x0, y0, '#5fb53a');
      speckle(ctx, x0, y0, ['#4f9c30', '#6fc744', '#57a836', '#7ad050'], 110);
      for (let i = 0; i < 8; i++) px(ctx, x0, y0, randInt(0,15), randInt(0,15), '#3f8a26');
    },
    // [1,0] 草侧
    grassSide(ctx, x0, y0) {
      fill(ctx, x0, y0, '#8a5a32');
      speckle(ctx, x0, y0, ['#7a4c28', '#9a6a3c', '#6e4423'], 100);
      // 顶部草边 2~4 像素
      for (let x = 0; x < 16; x++) {
        const d = 2 + (Math.sin(x * 1.7) + 1) + randInt(0, 1);
        for (let y = 0; y < d; y++) px(ctx, x0, y0, x, y, ['#5fb53a', '#4f9c30', '#6fc744'][randInt(0, 2)]);
      }
    },
    // [2,0] 泥土
    dirt(ctx, x0, y0) {
      fill(ctx, x0, y0, '#8a5a32');
      speckle(ctx, x0, y0, ['#7a4c28', '#9a6a3c', '#6e4423', '#a5754a'], 130);
    },
    // [3,0] 石头
    stone(ctx, x0, y0) {
      fill(ctx, x0, y0, '#8c8c8c');
      speckle(ctx, x0, y0, ['#7d7d7d', '#9a9a9a', '#6f6f6f'], 120);
      // 裂纹
      ctx.strokeStyle = '#666'; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x0 + 2, y0 + 4); ctx.lineTo(x0 + 7, y0 + 6); ctx.lineTo(x0 + 5, y0 + 11);
      ctx.moveTo(x0 + 10, y0 + 3); ctx.lineTo(x0 + 13, y0 + 8); ctx.lineTo(x0 + 11, y0 + 13);
      ctx.stroke();
    },
    // [4,0] 沙子
    sand(ctx, x0, y0) {
      fill(ctx, x0, y0, '#dcd29b');
      speckle(ctx, x0, y0, ['#cfc488', '#e9e0ac', '#c2b67c'], 110);
    },
    // [5,0] 木头横截面
    woodTop(ctx, x0, y0) {
      fill(ctx, x0, y0, '#6e4f26');
      for (let r = 6; r > 0; r -= 2) {
        ctx.strokeStyle = r % 4 === 0 ? '#7d5c30' : '#5c411f';
        ctx.strokeRect(x0 + 8 - r, y0 + 8 - r, r * 2, r * 2);
      }
    },
    // [6,0] 木头侧面（树皮）
    woodSide(ctx, x0, y0) {
      fill(ctx, x0, y0, '#5c411f');
      for (let x = 0; x < 16; x += 3) {
        ctx.fillStyle = x % 6 === 0 ? '#4a3317' : '#6e4f26';
        ctx.fillRect(x0 + x, y0, 2, 16);
      }
      speckle(ctx, x0, y0, ['#3f2c12', '#7d5c30'], 30);
    },
    // [7,0] 树叶
    leaves(ctx, x0, y0) {
      fill(ctx, x0, y0, '#2e6b1f');
      speckle(ctx, x0, y0, ['#265c18', '#3a7f28', '#1f4d13', '#45922f'], 150);
      // 空洞感
      for (let i = 0; i < 14; i++) px(ctx, x0, y0, randInt(0, 15), randInt(0, 15), '#173d0e');
    },
    // [0,1] 木板
    planks(ctx, x0, y0) {
      fill(ctx, x0, y0, '#a8814f');
      for (let y = 0; y < 16; y += 4) {
        ctx.fillStyle = '#8f6d3f';
        ctx.fillRect(x0, y0 + y, 16, 1);
      }
      for (let y = 0; y < 16; y += 4) {
        const off = (y / 4) % 2 === 0 ? 4 : 10;
        ctx.fillStyle = '#8f6d3f';
        ctx.fillRect(x0 + off, y0 + y, 1, 4);
      }
      speckle(ctx, x0, y0, ['#bb9259', '#96723e'], 40);
    },
    // [1,1] 砖块
    brick(ctx, x0, y0) {
      fill(ctx, x0, y0, '#9e4f3a');
      ctx.fillStyle = '#c4b6a4'; // 灰缝
      for (let y = 0; y < 16; y += 4) ctx.fillRect(x0, y0 + y, 16, 1);
      for (let y = 0; y < 16; y += 4) {
        const off = (y / 4) % 2 === 0 ? 4 : 12;
        ctx.fillRect(x0 + off, y0 + y, 1, 4);
        ctx.fillRect(x0 + ((off + 8) % 16), y0 + y, 1, 4);
      }
      speckle(ctx, x0, y0, ['#8e4530', '#ad5a42'], 40);
    },
    // [2,1] 玻璃
    glass(ctx, x0, y0) {
      ctx.clearRect(x0, y0, 16, 16);
      ctx.strokeStyle = '#cfe8f0'; ctx.lineWidth = 1;
      ctx.strokeRect(x0 + 0.5, y0 + 0.5, 15, 15);
      // 高光
      ctx.strokeStyle = 'rgba(255,255,255,.7)';
      ctx.beginPath();
      ctx.moveTo(x0 + 3, y0 + 12); ctx.lineTo(x0 + 12, y0 + 3);
      ctx.moveTo(x0 + 7, y0 + 13); ctx.lineTo(x0 + 13, y0 + 7);
      ctx.stroke();
    },
    // [3,1] 基岩
    bedrock(ctx, x0, y0) {
      fill(ctx, x0, y0, '#4a4a4a');
      speckle(ctx, x0, y0, ['#2e2e2e', '#5f5f5f', '#1c1c1c', '#707070'], 150);
    },
    // [4,1] 水
    water(ctx, x0, y0) {
      fill(ctx, x0, y0, '#2f6fd8');
      for (let y = 0; y < 16; y += 3) {
        ctx.fillStyle = 'rgba(255,255,255,.16)';
        ctx.fillRect(x0 + ((y * 5) % 8), y0 + y, 7, 1);
      }
      speckle(ctx, x0, y0, ['#2a63c0', '#3a7de8'], 30);
    },
  };
}

// 生成纹理图集，返回 { texture, uvOf(col,row) -> {u0,v0,u1,v1} }
function buildAtlas() {
  const canvas = document.createElement('canvas');
  canvas.width = ATLAS_COLS * TEX_SIZE;
  canvas.height = ATLAS_ROWS * TEX_SIZE;
  const ctx = canvas.getContext('2d');

  const gens = makeTexGen();
  const map = {
    '0,0': gens.grassTop, '1,0': gens.grassSide, '2,0': gens.dirt,
    '3,0': gens.stone,    '4,0': gens.sand,      '5,0': gens.woodTop,
    '6,0': gens.woodSide, '7,0': gens.leaves,
    '0,1': gens.planks,   '1,1': gens.brick,     '2,1': gens.glass,
    '3,1': gens.bedrock,  '4,1': gens.water,
  };
  Object.entries(map).forEach(([k, fn]) => {
    const [c, r] = k.split(',').map(Number);
    fn(ctx, c * TEX_SIZE, r * TEX_SIZE);
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;   // 像素风
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;

  const W = canvas.width, H = canvas.height;
  const uvOf = (col, row) => {
    const pad = 0.02; // 防出血
    return {
      u0: (col * TEX_SIZE + pad) / W,
      v0: 1 - ((row + 1) * TEX_SIZE - pad) / H,
      u1: ((col + 1) * TEX_SIZE - pad) / W,
      v1: 1 - (row * TEX_SIZE + pad) / H,
    };
  };
  return { texture, uvOf, canvas };
}

// 为快捷栏生成单个方块的小图标（3D 感等距视角，用三个面拼）
function makeBlockIcon(block, uvOf) {
  const size = 38;
  const cv = document.createElement('canvas');
  cv.width = size; cv.height = size;
  const ctx = cv.getContext('2d');
  const atlas = uvOf.canvasRef;

  const drawFace = (colRow, sx, sy, sw, sh, brightness) => {
    const [c, r] = colRow;
    ctx.save();
    ctx.filter = `brightness(${brightness})`;
    ctx.drawImage(atlas, c * TEX_SIZE, r * TEX_SIZE, TEX_SIZE, TEX_SIZE, sx, sy, sw, sh);
    ctx.restore();
  };
  // 简单等距：顶面 + 左面 + 右面
  const w = 15, h = 8, hh = 13;
  // 顶面
  ctx.save();
  ctx.transform(1, -0.5, 1, 0.5, size / 2 - w, 2);
  drawFace(block.tex.top, 0, 0, w * 2, w, 1.05);
  ctx.restore();
  // 左面
  ctx.save();
  ctx.transform(1, 0.5, 0, 1, size / 2 - w, h + 2);
  drawFace(block.tex.side, 0, 0, w, hh, 0.78);
  ctx.restore();
  // 右面
  ctx.save();
  ctx.transform(1, -0.5, 0, 1, size / 2, h + 2 + 0);
  drawFace(block.tex.side, 0, 0, w, hh, 0.6);
  ctx.restore();
  return cv;
}
