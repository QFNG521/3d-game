// noise.js — 值噪声地形生成（带种子，可复现）
'use strict';

class ValueNoise {
  constructor(seed = 1337) {
    this.seed = seed;
    this.perm = new Uint8Array(512);
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    // Fisher-Yates，用种子驱动的 LCG
    let s = seed >>> 0;
    const lcg = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(lcg() * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }
    for (let i = 0; i < 512; i++) this.perm[i] = p[i & 255];
  }

  hash(x, y) {
    return this.perm[(this.perm[x & 255] + y) & 255] / 255;
  }

  smooth(t) { return t * t * (3 - 2 * t); }

  noise2(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = this.smooth(xf), v = this.smooth(yf);
    const a = this.hash(xi, yi),     b = this.hash(xi + 1, yi);
    const c = this.hash(xi, yi + 1), d = this.hash(xi + 1, yi + 1);
    return lerp(lerp(a, b, u), lerp(c, d, u), v);
  }

  // 分形叠加
  fbm(x, y, octaves = 4, lacunarity = 2, gain = 0.5) {
    let amp = 1, freq = 1, sum = 0, norm = 0;
    for (let i = 0; i < octaves; i++) {
      sum += this.noise2(x * freq, y * freq) * amp;
      norm += amp;
      amp *= gain;
      freq *= lacunarity;
    }
    return sum / norm;
  }

  // 地形高度：中部平缓战场 + 边缘山丘
  terrainHeight(x, z, w, d) {
    const n = this.fbm(x * 0.025, z * 0.025, 4);
    const detail = this.fbm(x * 0.08 + 100, z * 0.08 + 100, 2);
    let h = 3 + n * 9 + detail * 2;

    // 边缘抬升成山（战场盆地，防止跑出地图的视觉边界）
    const cx = w / 2, cz = d / 2;
    const edgeDist = Math.min(x, z, w - 1 - x, d - 1 - z);
    if (edgeDist < 12) h += (12 - edgeDist) * (12 - edgeDist) * 0.3;

    // 中心战区压平，利于交火
    const dc = Math.hypot(x - cx, z - cz);
    if (dc < 16) h = lerp(h, 5 + detail * 1.5, 1 - dc / 16);

    return clamp(Math.floor(h), 2, CFG.WORLD_H - 8);
  }
}
