// enemies.js — 敌人：体素风格模型 + 简单 AI + 苦力怕爆炸
'use strict';

class Enemy {
  constructor(scene, world, typeKey, pos) {
    this.scene = scene;
    this.world = world;
    this.typeKey = typeKey;
    this.type = ENEMY_TYPES[typeKey];
    this.pos = pos.clone();        // 脚底
    this.vel = new THREE.Vector3();
    this.hp = this.type.hp;
    this.alive = true;
    this.state = 'chase';          // chase / windup / dead
    this.attackCd = 0;
    this.windupTimer = 0;          // 苦力怕蓄爆
    this.groanCd = rand(2, 6);
    this.animPhase = rand(0, Math.PI * 2);
    this.deadTimer = 0;

    this.buildModel();
    this.buildHealthBar();
  }

  buildModel() {
    const t = this.type;
    const s = t.scale;
    this.group = new THREE.Group();

    const bodyMat = new THREE.MeshLambertMaterial({ color: t.color });
    const skinMat = new THREE.MeshLambertMaterial({ color: t.skin });

    if (this.typeKey === 'creeper') {
      // 苦力怕：无臂，四短腿
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.0, 0.38), bodyMat);
      body.position.y = 0.85;
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), bodyMat);
      head.position.y = 1.6;
      // 脸
      const faceMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
      const eyeL = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 0.14), faceMat);
      eyeL.position.set(-0.12, 1.65, 0.256);
      const eyeR = eyeL.clone(); eyeR.position.x = 0.12;
      const mouth = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.2), faceMat);
      mouth.position.set(0, 1.47, 0.256);
      this.group.add(body, head, eyeL, eyeR, mouth);
      this.head = head;
      this.legs = [];
      [[-0.16, 0.14], [0.16, 0.14], [-0.16, -0.14], [0.16, -0.14]].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.42, 0.2), skinMat);
        leg.position.set(lx, 0.21, lz);
        this.group.add(leg);
        this.legs.push(leg);
      });
    } else {
      // 人形（僵尸/疾行兽/蛮兽）
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.85, 0.34), bodyMat);
      body.position.y = 0.95;
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.46, 0.46), skinMat);
      head.position.y = 1.63;
      // 发光眼睛
      const eyeMat = new THREE.MeshBasicMaterial({ color: this.typeKey === 'brute' ? 0xff3030 : 0xffe27a });
      const eyeL = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.06), eyeMat);
      eyeL.position.set(-0.11, 1.66, 0.236);
      const eyeR = eyeL.clone(); eyeR.position.x = 0.11;
      // 手臂（前伸僵尸式）
      this.armL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.7, 0.18), skinMat);
      this.armL.position.set(-0.42, 1.15, 0.15);
      this.armL.rotation.x = -Math.PI / 2;
      this.armR = this.armL.clone();
      this.armR.position.x = 0.42;
      // 腿
      this.legL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.55, 0.2), bodyMat);
      this.legL.position.set(-0.16, 0.28, 0);
      this.legR = this.legL.clone();
      this.legR.position.x = 0.16;

      this.group.add(body, head, eyeL, eyeR, this.armL, this.armR, this.legL, this.legR);
      this.head = head;
    }

    this.group.scale.set(s, s, s);
    this.group.traverse(c => { if (c.isMesh) { c.castShadow = true; } });
    this.group.position.copy(this.pos);
    this.scene.add(this.group);
  }

  buildHealthBar() {
    const cv = document.createElement('canvas');
    cv.width = 40; cv.height = 5;
    this.hpCtx = cv.getContext('2d');
    this.hpTex = new THREE.CanvasTexture(cv);
    const mat = new THREE.SpriteMaterial({ map: this.hpTex, depthTest: false });
    this.hpBar = new THREE.Sprite(mat);
    this.hpBar.scale.set(0.9, 0.11, 1);
    this.hpBar.position.y = 2.15 * this.type.scale;
    this.group.add(this.hpBar);
    this.updateHealthBar();
  }

  updateHealthBar() {
    const ctx = this.hpCtx;
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, 40, 5);
    const p = clamp(this.hp / this.type.hp, 0, 1);
    ctx.fillStyle = p > 0.5 ? '#4caf50' : p > 0.25 ? '#ffc107' : '#f44336';
    ctx.fillRect(1, 1, 38 * p, 3);
    this.hpTex.needsUpdate = true;
  }

  center() {
    return new THREE.Vector3(this.pos.x, this.pos.y + 1.1 * this.type.scale, this.pos.z);
  }

  hitRadius() { return 0.62 * this.type.scale + 0.25; }

  takeDamage(amount, particles) {
    if (!this.alive) return false;
    this.hp -= amount;
    this.updateHealthBar();
    particles.blood(this.center());
    // 受击闪白
    this.group.traverse(c => {
      if (c.isMesh && c.material && c.material.color && !c.material._isFace) {
        if (!c.material._origColor) c.material._origColor = c.material.color.clone();
        c.material.color.set(0xffffff);
        setTimeout(() => { if (c.material._origColor) c.material.color.copy(c.material._origColor); }, 70);
      }
    });
    if (this.hp <= 0) { this.die(); return true; }
    return false;
  }

  die() {
    this.alive = false;
    this.state = 'dead';
    this.deadTimer = 1.2;
  }

  // 苦力怕爆炸
  explode(game) {
    const t = this.type;
    const center = this.center();
    game.particles.explosion(center, t.blast);
    sfx.explode();

    // 破坏地形（球形弹坑）
    const r = Math.floor(t.blast);
    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dz = -r; dz <= r; dz++) {
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (dist > t.blast) continue;
          const bx = Math.floor(center.x) + dx;
          const by = Math.floor(center.y) + dy;
          const bz = Math.floor(center.z) + dz;
          const id = this.world.get(bx, by, bz);
          if (id !== 0 && BLOCK_BY_ID[id].breakable && Math.random() < 0.9) {
            this.world.set(bx, by, bz, 0);
            if (Math.random() < 0.4) {
              game.particles.breakBlock(new THREE.Vector3(bx, by, bz), BLOCK_BY_ID[id]);
            }
          }
        }
      }
    }

    // 伤害玩家（距离衰减）
    const pd = game.player.pos.distanceTo(this.pos);
    if (pd < t.blast + 1.5) {
      const dmg = Math.floor(t.blastDmg * (1 - pd / (t.blast + 1.5)));
      if (dmg > 0) game.player.takeDamage(dmg);
    }
    // 伤害其他敌人
    game.enemies.forEach(e => {
      if (e !== this && e.alive && e.pos.distanceTo(this.pos) < t.blast) {
        e.takeDamage(t.blastDmg * 0.8, game.particles);
      }
    });

    game.shake(0.5, 0.35);
    this.remove();
  }

  remove() {
    this.scene.remove(this.group);
    this.group.traverse(c => {
      if (c.isMesh) { c.geometry.dispose(); }
    });
    this.alive = false;
    this.removed = true;
  }

  update(dt, player, game) {
    if (this.removed) return;

    // ---- 死亡动画 ----
    if (this.state === 'dead') {
      this.deadTimer -= dt;
      this.group.rotation.x = lerp(this.group.rotation.x, Math.PI / 2, dt * 6);
      this.group.position.y = lerp(this.group.position.y, this.pos.y - 0.3, dt * 4);
      this.group.traverse(c => {
        if (c.isMesh && c.material) {
          c.material.transparent = true;
          c.material.opacity = Math.max(0, this.deadTimer / 1.2);
        }
      });
      if (this.deadTimer <= 0) this.remove();
      return;
    }

    const t = this.type;
    const toPlayer = new THREE.Vector3().subVectors(player.pos, this.pos);
    toPlayer.y = 0;
    const dist = toPlayer.length();

    // ---- 苦力怕逻辑 ----
    if (t.explodes) {
      if (this.state === 'windup') {
        this.windupTimer -= dt;
        // 闪烁
        const flash = Math.sin(this.windupTimer * 25) > 0;
        this.group.traverse(c => {
          if (c.isMesh && c.material && c.material.emissive !== undefined) {
            c.material.emissive = c.material.emissive || new THREE.Color();
            c.material.emissive.set(flash ? 0xffffff : 0x000000);
          }
        });
        const s = t.scale * (1 + (1.2 - this.windupTimer) * 0.15);
        this.group.scale.set(s, s, s);
        if (dist > t.atkRange + 1.2) {
          // 玩家跑开了，取消
          this.state = 'chase';
          this.group.traverse(c => { if (c.isMesh && c.material.emissive) c.material.emissive.set(0x000000); });
          this.group.scale.set(t.scale, t.scale, t.scale);
        } else if (this.windupTimer <= 0) {
          this.explode(game);
          return;
        }
      } else if (dist < t.atkRange) {
        this.state = 'windup';
        this.windupTimer = 1.2;
        sfx.zombieGroan(1.8);
      }
    } else {
      // ---- 近战攻击 ----
      this.attackCd -= dt;
      if (dist < t.atkRange && this.attackCd <= 0) {
        this.attackCd = 1.0;
        player.takeDamage(t.dmg);
        // 扑咬动画
        this.group.position.z += 0;
        if (this.armL) {
          this.armL.rotation.x = -Math.PI / 2 - 0.6;
          this.armR.rotation.x = -Math.PI / 2 - 0.6;
          setTimeout(() => {
            if (this.armL) { this.armL.rotation.x = -Math.PI / 2; this.armR.rotation.x = -Math.PI / 2; }
          }, 250);
        }
      }
    }

    // ---- 移动追踪（带简单跳跃爬块）----
    if (dist > 0.5 && this.state === 'chase') {
      const dir = toPlayer.normalize();
      const speedMul = this.state === 'windup' ? 0 : 1;
      this.vel.x = dir.x * t.speed * speedMul;
      this.vel.z = dir.z * t.speed * speedMul;
    } else {
      this.vel.x = 0; this.vel.z = 0;
    }

    this.vel.y -= CFG.GRAVITY * dt;

    const half = 0.32 * t.scale, height = 1.7 * t.scale;
    const preX = this.pos.x, preZ = this.pos.z;
    this.pos.x += this.vel.x * dt;
    this.world.collide(this.pos, half, height);
    this.pos.z += this.vel.z * dt;
    this.world.collide(this.pos, half, height);
    this.pos.y += this.vel.y * dt;
    this.world.collide(this.pos, half, height);

    const grounded = this.world.onGround(this.pos, half);
    if (grounded && this.vel.y <= 0) {
      this.vel.y = 0;
      const gy = Math.floor(this.pos.y - 0.02);
      if (this.pos.y < gy + 1.02 && this.pos.y > gy) this.pos.y = gy + 1.001;
    }

    // 被挡住就跳一下（爬上一格方块）
    const movedDist = Math.hypot(this.pos.x - preX, this.pos.z - preZ);
    if (grounded && (this.vel.x !== 0 || this.vel.z !== 0) && movedDist < t.speed * dt * 0.3) {
      this.vel.y = 8.5;
    }

    // ---- 朝向 & 动画 ----
    if (dist > 0.1) {
      const targetYaw = Math.atan2(toPlayer.x, toPlayer.z);
      let dy = targetYaw - this.group.rotation.y;
      while (dy > Math.PI) dy -= Math.PI * 2;
      while (dy < -Math.PI) dy += Math.PI * 2;
      this.group.rotation.y += dy * dt * 8;
    }

    this.animPhase += dt * (this.vel.x !== 0 || this.vel.z !== 0 ? 8 : 2);
    const swing = Math.sin(this.animPhase) * 0.5;
    if (this.legL) {
      this.legL.rotation.x = swing;
      this.legR.rotation.x = -swing;
    }
    if (this.legs) {
      this.legs.forEach((leg, i) => { leg.rotation.x = Math.sin(this.animPhase + i * 1.57) * 0.4; });
    }
    if (this.armL && this.state !== 'dead') {
      const tremble = Math.sin(this.animPhase * 3) * 0.06;
      this.armL.rotation.z = tremble;
      this.armR.rotation.z = -tremble;
    }

    this.group.position.copy(this.pos);

    // 低吼
    this.groanCd -= dt;
    if (this.groanCd <= 0 && dist < 20) {
      this.groanCd = rand(3, 8);
      sfx.zombieGroan(this.typeKey === 'brute' ? 0.7 : 1);
    }
  }
}

// ---------- 敌人生成器 ----------
class EnemySpawner {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
  }

  spawnPos(playerPos) {
    for (let i = 0; i < 20; i++) {
      const a = rand(0, Math.PI * 2);
      const r = rand(16, 26);
      const x = Math.floor(playerPos.x + Math.cos(a) * r);
      const z = Math.floor(playerPos.z + Math.sin(a) * r);
      if (x < 2 || x >= this.world.W - 2 || z < 2 || z >= this.world.D - 2) continue;
      const h = this.world.surfaceHeight(x, z);
      const id = this.world.get(x, h, z);
      if (id !== 0 && !BLOCK_BY_ID[id].liquid && h + 2 < this.world.H) {
        return new THREE.Vector3(x + 0.5, h + 1.01, z + 0.5);
      }
    }
    return null;
  }

  spawn(typeKey, playerPos) {
    const pos = this.spawnPos(playerPos);
    if (!pos) return null;
    return new Enemy(this.scene, this.world, typeKey, pos);
  }
}
