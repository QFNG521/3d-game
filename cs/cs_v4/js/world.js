// world.js — 体素世界：合并区块网格（每 chunk 仅 1~2 个 Mesh）
'use strict';

// 六个面：法线 + 4 个角点（从面外侧看逆时针），uvAnchor 指定每个角点对应纹理的 [u(0左1右), v(0下1上)]
// 这样可保证草方块侧面草沿朝上、各面纹理方向正确
const FACES = [
  { dir: [ 1, 0, 0], corners: [[1,1,1],[1,0,1],[1,1,0],[1,0,0]], tex:'side',
    uvAnchor: [[0,1],[0,0],[1,1],[1,0]] },   // +x  左=+z
  { dir: [-1, 0, 0], corners: [[0,1,0],[0,0,0],[0,1,1],[0,0,1]], tex:'side',
    uvAnchor: [[0,1],[0,0],[1,1],[1,0]] },   // -x  左=-z
  { dir: [ 0, 1, 0], corners: [[0,1,1],[1,1,1],[0,1,0],[1,1,0]], tex:'top',
    uvAnchor: [[0,0],[1,0],[0,1],[1,1]] },   // +y  上=北(-z)
  { dir: [ 0,-1, 0], corners: [[0,0,0],[1,0,0],[0,0,1],[1,0,1]], tex:'bottom',
    uvAnchor: [[0,0],[1,0],[0,1],[1,1]] },   // -y
  { dir: [ 0, 0, 1], corners: [[0,1,1],[0,0,1],[1,1,1],[1,0,1]], tex:'side',
    uvAnchor: [[0,1],[0,0],[1,1],[1,0]] },   // +z  左=-x
  { dir: [ 0, 0,-1], corners: [[1,1,0],[1,0,0],[0,1,0],[0,0,0]], tex:'side',
    uvAnchor: [[0,1],[0,0],[1,1],[1,0]] },   // -z  左=+x
];

// 按 FACES 顺序向 bucket 填入一个面（4 顶点 + 2 三角形，逆时针）
function buildFace(bucket, x, y, z, face, uv) {
  for (let i = 0; i < 4; i++) {
    const c = face.corners[i];
    bucket.pos.push(x + c[0], y + c[1], z + c[2]);
    bucket.nrm.push(face.dir[0], face.dir[1], face.dir[2]);
    const a = face.uvAnchor[i];
    bucket.uv.push(lerp(uv.u0, uv.u1, a[0]), lerp(uv.v0, uv.v1, a[1]));
  }
  const b = bucket.count * 4;
  bucket.idx.push(b, b + 1, b + 2, b + 2, b + 1, b + 3);
  bucket.count++;
}

class World {
  constructor(scene, atlas, seed) {
    this.scene = scene;
    this.atlas = atlas;
    this.noise = new ValueNoise(seed);

    this.W = CFG.WORLD_W; this.D = CFG.WORLD_D; this.H = CFG.WORLD_H;
    this.data = new Uint8Array(this.W * this.H * this.D);

    this.chunksX = Math.ceil(this.W / CFG.CHUNK);
    this.chunksZ = Math.ceil(this.D / CFG.CHUNK);
    this.chunkMeshes = new Map(); // "cx,cz" -> {opaque, transparent}

    this.matOpaque = new THREE.MeshLambertMaterial({ map: atlas.texture });
    this.matTransparent = new THREE.MeshLambertMaterial({
      map: atlas.texture, transparent: true, alphaTest: 0.4, depthWrite: false,
    });

    this.generate();
    this.buildAllChunks();
  }

  idx(x, y, z) { return (y * this.D + z) * this.W + x; }
  inBounds(x, y, z) { return x >= 0 && x < this.W && y >= 0 && y < this.H && z >= 0 && z < this.D; }
  get(x, y, z) { return this.inBounds(x, y, z) ? this.data[this.idx(x, y, z)] : 0; }

  set(x, y, z, id, rebuild = true) {
    if (!this.inBounds(x, y, z)) return;
    this.data[this.idx(x, y, z)] = id;
    if (rebuild) this.rebuildAround(x, z);
  }

  // ---------- 地形生成 ----------
  generate() {
    const { W, D, H, noise } = this;

    for (let x = 0; x < W; x++) {
      for (let z = 0; z < D; z++) {
        const h = noise.terrainHeight(x, z, W, D);

        for (let y = 0; y <= h; y++) {
          let id;
          if (y === 0) id = BLOCKS.bedrock.id;
          else if (y < h - 3) id = BLOCKS.stone.id;
          else if (y < h) id = BLOCKS.dirt.id;
          else id = h <= CFG.WATER_LEVEL + 1 ? BLOCKS.sand.id : BLOCKS.grass.id;
          this.data[this.idx(x, y, z)] = id;
        }

        // 水
        if (h < CFG.WATER_LEVEL) {
          for (let y = h + 1; y <= CFG.WATER_LEVEL; y++) {
            this.data[this.idx(x, y, z)] = BLOCKS.water.id;
          }
        }
      }
    }

    // 树（避开中心战区）
    const treeCount = Math.floor(W * D / 160);
    for (let i = 0; i < treeCount; i++) {
      const x = randInt(3, W - 4), z = randInt(3, D - 4);
      if (Math.hypot(x - W / 2, z - D / 2) < 15) continue;   // 战区不长树
      const h = this.surfaceHeight(x, z);
      if (h <= CFG.WATER_LEVEL + 1 || h >= H - 8) continue;
      if (this.get(x, h, z) !== BLOCKS.grass.id) continue;
      this.plantTree(x, h + 1, z);
    }

    // 战场障碍：随机石堆/掩体
    const cx = W / 2, cz = D / 2;
    for (let i = 0; i < 26; i++) {
      const a = rand(0, Math.PI * 2), r = rand(6, 20);
      const x = Math.floor(cx + Math.cos(a) * r), z = Math.floor(cz + Math.sin(a) * r);
      if (x < 2 || x >= W - 2 || z < 2 || z >= D - 2) continue;
      const h = this.surfaceHeight(x, z);
      if (this.get(x, h, z) === BLOCKS.water.id) continue;
      const mat = Math.random() < 0.6 ? BLOCKS.stone.id : BLOCKS.brick.id;
      const bw = randInt(1, 3), bh = randInt(1, 3);
      for (let dx = 0; dx < bw; dx++) {
        for (let dy = 1; dy <= bh; dy++) {
          if (Math.random() < 0.85) this.set(x + dx, h + dy, z, mat, false);
          if (Math.random() < 0.7) this.set(x, h + dy, z + dx, mat, false);
        }
      }
    }
  }

  plantTree(x, y, z) {
    const trunkH = randInt(3, 5);
    for (let i = 0; i < trunkH; i++) this.set(x, y + i, z, BLOCKS.wood.id, false);
    for (let dy = trunkH - 2; dy <= trunkH + 1; dy++) {
      const r = dy <= trunkH ? 2 : 1;
      for (let dx = -r; dx <= r; dx++) {
        for (let dz = -r; dz <= r; dz++) {
          if (dx === 0 && dz === 0 && dy < trunkH) continue;
          if (Math.abs(dx) === r && Math.abs(dz) === r && Math.random() < 0.5) continue;
          const yy = y + dy;
          if (this.get(x + dx, yy, z + dz) === 0) this.set(x + dx, yy, z + dz, BLOCKS.leaves.id, false);
        }
      }
    }
  }

  surfaceHeight(x, z) {
    for (let y = this.H - 1; y >= 0; y--) {
      const id = this.get(x, y, z);
      if (id !== 0 && !BLOCK_BY_ID[id].liquid) return y;
    }
    return 0;
  }

  // ---------- 区块网格合并（核心性能）----------
  buildAllChunks() {
    for (let cx = 0; cx < this.chunksX; cx++)
      for (let cz = 0; cz < this.chunksZ; cz++)
        this.buildChunk(cx, cz);
  }

  chunkKey(cx, cz) { return cx + ',' + cz; }

  buildChunk(cx, cz) {
    const key = this.chunkKey(cx, cz);
    const old = this.chunkMeshes.get(key);
    if (old) {
      [old.opaque, old.transparent].forEach(m => {
        if (m) { this.scene.remove(m); m.geometry.dispose(); }
      });
    }

    const x0 = cx * CFG.CHUNK, z0 = cz * CFG.CHUNK;
    const x1 = Math.min(x0 + CFG.CHUNK, this.W);
    const z1 = Math.min(z0 + CFG.CHUNK, this.D);

    // 每个方块类型分别合并：不透明 & 透明 两组
    const opaque = { pos: [], nrm: [], uv: [], idx: [], count: 0 };
    const transp = { pos: [], nrm: [], uv: [], idx: [], count: 0 };

    for (let x = x0; x < x1; x++) {
      for (let z = z0; z < z1; z++) {
        for (let y = 0; y < this.H; y++) {
          const id = this.get(x, y, z);
          if (id === 0) continue;
          const block = BLOCK_BY_ID[id];

          for (const face of FACES) {
            const nx = x + face.dir[0], ny = y + face.dir[1], nz = z + face.dir[2];
            const nid = this.get(nx, ny, nz);

            // 面剔除：邻接不透明块则跳过
            if (nid !== 0) {
              const nb = BLOCK_BY_ID[nid];
              if (!nb.transparent) continue;          // 邻接不透明 → 剔除
              if (nb.id === id) continue;             // 同类透明（水-水）→ 剔除
            }

            const bucket = block.transparent ? transp : opaque;
            const [tc, tr] = block.tex[face.tex];
            const uv = this.atlas.uvOf(tc, tr);
            buildFace(bucket, x, y, z, face, uv);
          }
        }
      }
    }

    const entry = { opaque: null, transparent: null };

    if (opaque.count > 0) {
      const g = this.makeGeometry(opaque);
      const m = new THREE.Mesh(g, this.matOpaque);
      m.castShadow = true; m.receiveShadow = true;
      this.scene.add(m);
      entry.opaque = m;
    }
    if (transp.count > 0) {
      const g = this.makeGeometry(transp);
      const m = new THREE.Mesh(g, this.matTransparent);
      m.receiveShadow = true;
      this.scene.add(m);
      entry.transparent = m;
    }
    this.chunkMeshes.set(key, entry);
  }

  makeGeometry(bucket) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(bucket.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(bucket.nrm, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(bucket.uv, 2));
    g.setIndex(bucket.idx);
    return g;
  }

  rebuildAround(x, z) {
    const cx = Math.floor(x / CFG.CHUNK), cz = Math.floor(z / CFG.CHUNK);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        const nx = cx + dx, nz = cz + dz;
        // 只重建边界相邻的区块
        if (nx < 0 || nz < 0 || nx >= this.chunksX || nz >= this.chunksZ) continue;
        if (dx === 0 && dz === 0) { this.buildChunk(nx, nz); continue; }
        const edgeX = x % CFG.CHUNK, edgeZ = z % CFG.CHUNK;
        const nearX = (dx === -1 && edgeX === 0) || (dx === 1 && edgeX === CFG.CHUNK - 1) || (dx === 0 && Math.abs(dz) === 1 && false);
        const nearZ = (dz === -1 && edgeZ === 0) || (dz === 1 && edgeZ === CFG.CHUNK - 1);
        if ((dx !== 0 && nearX && dz === 0) || (dz !== 0 && nearZ && dx === 0) || (dx !== 0 && dz !== 0 && nearX && nearZ)) {
          this.buildChunk(nx, nz);
        }
      }
    }
  }

  // ---------- 体素射线（DDA，穿透明水，命中精确面）----------
  raycast(origin, dir, maxDist) {
    let x = Math.floor(origin.x), y = Math.floor(origin.y), z = Math.floor(origin.z);
    const stepX = dir.x > 0 ? 1 : -1, stepY = dir.y > 0 ? 1 : -1, stepZ = dir.z > 0 ? 1 : -1;
    const tDeltaX = Math.abs(1 / (dir.x || 1e-9));
    const tDeltaY = Math.abs(1 / (dir.y || 1e-9));
    const tDeltaZ = Math.abs(1 / (dir.z || 1e-9));
    let tMaxX = ((stepX > 0 ? x + 1 - origin.x : origin.x - x)) * tDeltaX;
    let tMaxY = ((stepY > 0 ? y + 1 - origin.y : origin.y - y)) * tDeltaY;
    let tMaxZ = ((stepZ > 0 ? z + 1 - origin.z : origin.z - z)) * tDeltaZ;
    let face = null, t = 0;

    for (let i = 0; i < 256; i++) {
      if (tMaxX < tMaxY && tMaxX < tMaxZ) {
        x += stepX; t = tMaxX; tMaxX += tDeltaX; face = [-stepX, 0, 0];
      } else if (tMaxY < tMaxZ) {
        y += stepY; t = tMaxY; tMaxY += tDeltaY; face = [0, -stepY, 0];
      } else {
        z += stepZ; t = tMaxZ; tMaxZ += tDeltaZ; face = [0, 0, -stepZ];
      }
      if (t > maxDist) return null;

      const id = this.get(x, y, z);
      if (id !== 0 && !BLOCK_BY_ID[id].liquid) {
        return {
          x, y, z, id, block: BLOCK_BY_ID[id],
          normal: face,
          // 相邻空气格（放置位置）
          px: x + face[0], py: y + face[1], pz: z + face[2],
          point: origin.clone().add(dir.clone().multiplyScalar(t)),
          dist: t,
        };
      }
    }
    return null;
  }

  // ---------- AABB 碰撞 ----------
  collide(pos, half, height) {
    // 返回修正后的位置
    const minX = Math.floor(pos.x - half), maxX = Math.floor(pos.x + half);
    const minY = Math.floor(pos.y), maxY = Math.floor(pos.y + height);
    const minZ = Math.floor(pos.z - half), maxZ = Math.floor(pos.z + half);

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          const id = this.get(x, y, z);
          if (id === 0 || BLOCK_BY_ID[id].liquid) continue;

          // AABB 重叠求解最小穿透轴
          const bx0 = x, bx1 = x + 1, by0 = y, by1 = y + 1, bz0 = z, bz1 = z + 1;
          const px0 = pos.x - half, px1 = pos.x + half;
          const py0 = pos.y, py1 = pos.y + height;
          const pz0 = pos.z - half, pz1 = pos.z + half;

          const ox = Math.min(px1, bx1) - Math.max(px0, bx0);
          const oy = Math.min(py1, by1) - Math.max(py0, by0);
          const oz = Math.min(pz1, bz1) - Math.max(pz0, bz0);
          if (ox <= 0 || oy <= 0 || oz <= 0) continue;

          if (ox <= oy && ox <= oz) {
            pos.x += (pos.x < x + 0.5) ? -ox : ox;
          } else if (oy <= ox && oy <= oz) {
            pos.y += (pos.y < y + 0.5) ? -oy : oy;
          } else {
            pos.z += (pos.z < z + 0.5) ? -oz : oz;
          }
        }
      }
    }
    return pos;
  }

  onGround(pos, half) {
    const eps = 0.04;
    const minX = Math.floor(pos.x - half), maxX = Math.floor(pos.x + half);
    const minZ = Math.floor(pos.z - half), maxZ = Math.floor(pos.z + half);
    const y = Math.floor(pos.y - eps);
    for (let x = minX; x <= maxX; x++)
      for (let z = minZ; z <= maxZ; z++) {
        const id = this.get(x, y, z);
        if (id !== 0 && !BLOCK_BY_ID[id].liquid) return true;
      }
    return false;
  }

  // 在圆柱范围内找实体碰撞（用于放置方块时防止放到玩家/敌人身上）
  overlapsCylinder(bx, by, bz, center, radius, height) {
    const cx = clamp(center.x, bx, bx + 1);
    const cz = clamp(center.z, bz, bz + 1);
    const dx = center.x - cx, dz = center.z - cz;
    const distSq = dx * dx + dz * dz;
    const cy0 = center.y, cy1 = center.y + height;
    return distSq < radius * radius && cy1 > by && cy0 < by + 1;
  }
}
