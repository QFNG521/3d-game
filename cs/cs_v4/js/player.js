// player.js — 玩家：移动物理 + 第一人称手部 + 射击/放置/挖掘
'use strict';

class Player {
  constructor(camera, world, particles) {
    this.camera = camera;
    this.world = world;
    this.particles = particles;

    this.pos = new THREE.Vector3();   // 脚底位置
    this.vel = new THREE.Vector3();
    this.yaw = 0;
    this.pitch = 0;
    this.hp = CFG.MAX_HP;
    this.grounded = false;
    this.dead = false;

    // 武器状态
    this.weapons = WEAPONS.map(w => ({ ...w, ammo: w.mag }));
    this.slot = 0;                    // 快捷栏选中 0~6
    this.fireCooldown = 0;
    this.reloading = 0;
    this.switching = 0;
    this.recoil = 0;
    this.bobPhase = 0;
    this.muzzleTimer = 0;

    this.keys = {};
    this.mouseDown = { left: false, right: false };
    this._prevLeft = false;

    this.buildHand();
    this.bindInput();
  }

  // ---------- 第一人称手部模型（MC 风格手臂 + 枪/方块）----------
  buildHand() {
    this.hand = new THREE.Group();

    // 手臂（肤色 + 袖子）
    const skinMat = new THREE.MeshLambertMaterial({ color: 0xd8a077 });
    const sleeveMat = new THREE.MeshLambertMaterial({ color: 0x3a7bd5 });
    const armGeo = new THREE.BoxGeometry(0.09, 0.09, 0.3);
    this.arm = new THREE.Mesh(armGeo, skinMat);
    this.arm.position.set(0.26, -0.24, -0.42);
    const sleeve = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.12), sleeveMat);
    sleeve.position.set(0.26, -0.24, -0.28);
    this.hand.add(this.arm, sleeve);

    // 枪体组（随武器切换）
    this.gunGroup = new THREE.Group();
    this.hand.add(this.gunGroup);
    this.buildGunModels();

    // 方块手（选中方块时显示）
    this.handBlock = null;

    // 枪口闪光
    const flashMat = new THREE.MeshBasicMaterial({
      color: 0xffe27a, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    this.muzzleFlash = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.3), flashMat);
    this.muzzleFlash.position.set(0.26, -0.18, -0.75);
    this.hand.add(this.muzzleFlash);

    this.camera.add(this.hand);
    this.updateHandVisibility();
  }

  buildGunModels() {
    const metal = new THREE.MeshLambertMaterial({ color: 0x3d3d3d });
    const dark = new THREE.MeshLambertMaterial({ color: 0x222222 });
    const wood = new THREE.MeshLambertMaterial({ color: 0x6e4f26 });

    this.gunModels = {};

    // 步枪
    {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.11, 0.5), metal);
      const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.3), dark);
      barrel.position.set(0, 0.03, -0.36);
      const mag = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.14, 0.1), dark);
      mag.position.set(0, -0.1, -0.05);
      const stock = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.09, 0.16), wood);
      stock.position.set(0, -0.02, 0.3);
      g.add(body, barrel, mag, stock);
      g.position.set(0.26, -0.2, -0.5);
      this.gunModels.rifle = g;
    }
    // 手枪
    {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 0.24), metal);
      const grip = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.12, 0.06), dark);
      grip.position.set(0, -0.08, 0.06);
      grip.rotation.x = 0.25;
      g.add(body, grip);
      g.position.set(0.26, -0.19, -0.42);
      this.gunModels.pistol = g;
    }
    // 霰弹枪
    {
      const g = new THREE.Group();
      const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.035, 0.5), dark);
      b1.position.set(-0.02, 0.02, -0.1);
      const b2 = b1.clone(); b2.position.x = 0.02;
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.07, 0.34), wood);
      body.position.set(0, -0.03, 0.14);
      g.add(b1, b2, body);
      g.position.set(0.26, -0.2, -0.5);
      this.gunModels.shotgun = g;
    }

    Object.values(this.gunModels).forEach(g => { g.visible = false; this.gunGroup.add(g); });
  }

  setHandBlock(block) {
    if (this.handBlock) { this.hand.remove(this.handBlock); this.handBlock = null; }
    if (!block) return;
    const g = new THREE.BoxGeometry(0.16, 0.16, 0.16);
    const mats = [];
    const uvFaces = ['side', 'side', 'top', 'bottom', 'side', 'side'];
    for (let i = 0; i < 6; i++) {
      const [tc, tr] = block.tex[uvFaces[i]];
      const uv = this.world.atlas.uvOf(tc, tr);
      const tex = this.world.atlas.texture.clone();
      tex.repeat.set(uv.u1 - uv.u0, uv.v1 - uv.v0);
      tex.offset.set(uv.u0, uv.v0);
      tex.needsUpdate = true;
      tex.magFilter = THREE.NearestFilter;
      mats.push(new THREE.MeshLambertMaterial({ map: tex, transparent: block.transparent }));
    }
    this.handBlock = new THREE.Mesh(g, mats);
    this.handBlock.position.set(0.26, -0.2, -0.42);
    this.handBlock.rotation.set(0.2, 0.6, 0);
    this.hand.add(this.handBlock);
  }

  currentSlot() { return HOTBAR[this.slot]; }
  currentWeapon() { return this.weapons[this.currentSlot().type === 'weapon' ? this.currentSlot().idx : 0]; }

  updateHandVisibility() {
    const slot = this.currentSlot();
    const isWeapon = slot.type === 'weapon';
    Object.entries(this.gunModels).forEach(([k, g]) => {
      g.visible = isWeapon && WEAPONS[slot.idx].key === k;
    });
    this.setHandBlock(isWeapon ? null : BLOCKS[slot.block]);
    this.arm.visible = true;
  }

  // ---------- 输入 ----------
  bindInput() {
    document.addEventListener('keydown', e => {
      this.keys[e.code] = true;
      if (e.code.startsWith('Digit')) {
        const n = parseInt(e.code.slice(5)) - 1;
        if (n >= 0 && n < HOTBAR.length) this.selectSlot(n);
      }
      if (e.code === 'KeyR') this.startReload();
    });
    document.addEventListener('keyup', e => { this.keys[e.code] = false; });

    document.addEventListener('mousedown', e => {
      if (e.button === 0) this.mouseDown.left = true;
      if (e.button === 2) this.mouseDown.right = true;
    });
    document.addEventListener('mouseup', e => {
      if (e.button === 0) this.mouseDown.left = false;
      if (e.button === 2) this.mouseDown.right = false;
    });
    document.addEventListener('mousemove', e => {
      if (!document.pointerLockElement) return;
      this.yaw -= e.movementX * CFG.MOUSE_SENS;
      this.pitch -= e.movementY * CFG.MOUSE_SENS;
      this.pitch = clamp(this.pitch, -Math.PI / 2 + 0.02, Math.PI / 2 - 0.02);
    });
    document.addEventListener('wheel', e => {
      const dir = e.deltaY > 0 ? 1 : -1;
      this.selectSlot((this.slot + dir + HOTBAR.length) % HOTBAR.length);
    }, { passive: true });
  }

  selectSlot(n) {
    if (n === this.slot) return;
    this.slot = n;
    this.switching = 0.25;
    this.reloading = 0;
    this.updateHandVisibility();
    sfx.uiClick();
    if (game) game.updateHotbarUI();
  }

  startReload() {
    const slot = this.currentSlot();
    if (slot.type !== 'weapon') return;
    const w = this.weapons[slot.idx];
    if (this.reloading > 0 || w.ammo >= w.mag) return;
    this.reloading = w.reload;
    sfx.reload();
    document.getElementById('ammo-state').textContent = '装填中…';
  }

  spawn() {
    const cx = CFG.WORLD_W / 2, cz = CFG.WORLD_D / 2;
    const h = this.world.surfaceHeight(Math.floor(cx), Math.floor(cz));
    this.pos.set(cx, h + 1.01, cz);
    this.vel.set(0, 0, 0);
    this.hp = CFG.MAX_HP;
    this.dead = false;
    this.weapons.forEach(w => { w.ammo = w.mag; });
    this.slot = 0;
    this.reloading = 0;
    this.updateHandVisibility();
  }

  eyePos() {
    return new THREE.Vector3(this.pos.x, this.pos.y + CFG.EYE_HEIGHT, this.pos.z);
  }

  viewDir() {
    const cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
    const cy = Math.cos(this.yaw), sy = Math.sin(this.yaw);
    return new THREE.Vector3(-sy * cp, sp, -cy * cp).normalize();
  }

  takeDamage(amount) {
    if (this.dead) return;
    this.hp -= amount;
    sfx.hurt();
    const v = document.getElementById('dmg-vignette');
    v.style.transition = 'none'; v.style.opacity = 1;
    requestAnimationFrame(() => { v.style.transition = 'opacity .5s'; v.style.opacity = 0; });
    if (this.hp <= 0) { this.hp = 0; this.dead = true; game.onPlayerDeath(); }
  }

  heal(amount) {
    this.hp = clamp(this.hp + amount, 0, CFG.MAX_HP);
    const v = document.getElementById('heal-flash');
    v.style.transition = 'none'; v.style.opacity = 1;
    requestAnimationFrame(() => { v.style.transition = 'opacity .6s'; v.style.opacity = 0; });
  }

  // ---------- 射击 ----------
  tryFire(dt, enemies) {
    const slot = this.currentSlot();
    if (slot.type !== 'weapon') return;
    const w = this.weapons[slot.idx];

    if (this.reloading > 0 || this.switching > 0 || this.fireCooldown > 0) return;
    if (!w.auto && this._prevLeft) return;   // 半自动需松开

    if (w.ammo <= 0) {
      sfx.dryFire();
      this.fireCooldown = 0.3;
      this.startReload();
      return;
    }

    w.ammo--;
    this.fireCooldown = w.rate;
    this.recoil = Math.min(this.recoil + (w.pellets ? 0.09 : 0.035), 0.18);
    this.muzzleTimer = 0.05;
    sfx.shoot(w.pitch);
    if (game) game.updateAmmoUI();

    const eye = this.eyePos();
    const baseDir = this.viewDir();
    const pellets = w.pellets || 1;
    const hits = [];

    for (let i = 0; i < pellets; i++) {
      const dir = baseDir.clone();
      dir.x += rand(-w.spread, w.spread);
      dir.y += rand(-w.spread, w.spread);
      dir.z += rand(-w.spread, w.spread);
      dir.normalize();

      const result = this.traceShot(eye, dir, w, enemies);
      hits.push(result);
    }
    return hits;
  }

  traceShot(eye, dir, weapon, enemies) {
    // 1) 方块命中
    const blockHit = this.world.raycast(eye, dir, CFG.SHOT_RANGE);
    // 2) 敌人命中（射线-包围球）
    let enemyHit = null, enemyDist = Infinity;
    for (const e of enemies) {
      if (!e.alive) continue;
      const c = e.center();
      const oc = c.clone().sub(eye);
      const t = oc.dot(dir);
      if (t < 0 || t > CFG.SHOT_RANGE) continue;
      const closest = eye.clone().add(dir.clone().multiplyScalar(t));
      const rr = e.hitRadius();
      if (closest.distanceToSquared(c) < rr * rr && t < enemyDist) {
        enemyDist = t; enemyHit = e;
      }
    }

    // 谁近打谁
    if (enemyHit && (!blockHit || enemyDist < blockHit.dist)) {
      const point = eye.clone().add(dir.clone().multiplyScalar(enemyDist));
      this.particles.tracer(eye.clone().add(dir.clone().multiplyScalar(0.6)), point, weapon.tracer);
      return { type: 'enemy', enemy: enemyHit, point, damage: weapon.damage };
    }
    if (blockHit) {
      this.particles.tracer(eye.clone().add(dir.clone().multiplyScalar(0.6)), blockHit.point, weapon.tracer);
      return { type: 'block', hit: blockHit, damage: weapon.damage };
    }
    const far = eye.clone().add(dir.clone().multiplyScalar(CFG.SHOT_RANGE));
    this.particles.tracer(eye.clone().add(dir.clone().multiplyScalar(0.6)), far, weapon.tracer);
    return { type: 'miss' };
  }

  // ---------- 放置方块 ----------
  tryPlace() {
    const slot = this.currentSlot();
    if (slot.type !== 'block') return false;
    const block = BLOCKS[slot.block];

    const eye = this.eyePos();
    const dir = this.viewDir();
    const hit = this.world.raycast(eye, dir, CFG.PICK_RANGE);
    if (!hit) return false;

    const { px, py, pz } = hit;
    if (this.world.get(px, py, pz) !== 0) return false;

    // 防止放到自己身体里
    if (this.world.overlapsCylinder(px, py, pz, this.pos, CFG.PLAYER_HALF, CFG.PLAYER_HEIGHT)) return false;

    this.world.set(px, py, pz, block.id);
    sfx.placeBlock();
    this.particles.spark(new THREE.Vector3(px + 0.5, py + 0.5, pz + 0.5), 0xffffff);
    this.switching = 0.18; // 放置小动画
    return true;
  }

  // ---------- 主更新 ----------
  update(dt, enemies) {
    if (this.dead) return;

    // ---- 移动 ----
    const sprint = this.keys['ShiftLeft'] || this.keys['ShiftRight'];
    const speed = sprint ? CFG.SPRINT_SPEED : CFG.WALK_SPEED;
    const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw);

    let mx = 0, mz = 0;
    if (this.keys['KeyW']) { mx -= sin; mz -= cos; }
    if (this.keys['KeyS']) { mx += sin; mz += cos; }
    if (this.keys['KeyA']) { mx -= cos; mz += sin; }
    if (this.keys['KeyD']) { mx += cos; mz -= sin; }
    const len = Math.hypot(mx, mz);
    if (len > 0) { mx /= len; mz /= len; }

    this.vel.x = mx * speed;
    this.vel.z = mz * speed;
    this.vel.y -= CFG.GRAVITY * dt;
    if (this.keys['Space'] && this.grounded) {
      this.vel.y = CFG.JUMP_VEL;
      this.grounded = false;
      sfx.jump();
    }

    // 分轴移动 + 碰撞（防穿墙卡死）
    const half = CFG.PLAYER_HALF, height = CFG.PLAYER_HEIGHT;
    this.pos.x += this.vel.x * dt;
    this.world.collide(this.pos, half, height);
    this.pos.z += this.vel.z * dt;
    this.world.collide(this.pos, half, height);

    // 垂直移动：比较"期望落点"和"碰撞修正后的实际落点"
    const dy = this.vel.y * dt;
    const expectedY = this.pos.y + dy;
    this.pos.y = expectedY;
    this.world.collide(this.pos, half, height);
    const blockedDown = this.pos.y > expectedY + 1e-4;   // 被向上推 → 脚下有方块
    const blockedUp   = this.pos.y < expectedY - 1e-4;   // 被向下压 → 头顶有方块

    if (blockedDown && this.vel.y <= 0) {
      // 落地
      this.grounded = true;
      this.vel.y = 0;
    } else if (blockedUp && this.vel.y > 0) {
      // 撞头
      this.vel.y = 0;
      this.grounded = false;
    } else if (this.vel.y <= 0 && this.world.onGround(this.pos, half)) {
      // 沿平地行走，保持贴地（不弹跳）
      this.grounded = true;
      this.vel.y = 0;
    } else {
      this.grounded = false;
    }

    // 掉出世界兜底
    if (this.pos.y < -10) this.takeDamage(1000);

    // ---- 武器计时 ----
    if (this.fireCooldown > 0) this.fireCooldown -= dt;
    if (this.switching > 0) this.switching -= dt;
    if (this.reloading > 0) {
      this.reloading -= dt;
      if (this.reloading <= 0) {
        const w = this.currentWeapon();
        w.ammo = w.mag;
        document.getElementById('ammo-state').textContent = '';
        if (game) game.updateAmmoUI();
      }
    }
    if (this.recoil > 0) this.recoil = Math.max(0, this.recoil - dt * 0.6);
    if (this.muzzleTimer > 0) {
      this.muzzleTimer -= dt;
      if (this.muzzleTimer <= 0) this.muzzleFlash.material.opacity = 0;
    }

    // ---- 开火 / 放置 ----
    const left = this.mouseDown.left;
    if (left) {
      const slot = this.currentSlot();
      if (slot.type === 'weapon') {
        const hits = this.tryFire(dt, enemies);
        if (hits && game) game.handleShotHits(hits);
        if (this.muzzleTimer > 0) {
          this.muzzleFlash.material.opacity = 0.9;
          this.muzzleFlash.rotation.z = rand(0, Math.PI);
          const s = rand(0.7, 1.2);
          this.muzzleFlash.scale.set(s, s, 1);
        }
      } else if (!this._prevLeft) {
        this.tryPlace();
      }
    }
    this._prevLeft = left;

    // ---- 相机 ----
    const moving = len > 0 && this.grounded;
    this.bobPhase += dt * (sprint ? 13 : 9) * (moving ? 1 : 0);
    const bobY = Math.sin(this.bobPhase * 2) * 0.035 * (moving ? 1 : 0);
    const bobX = Math.cos(this.bobPhase) * 0.02 * (moving ? 1 : 0);

    // 相机 Y：从高处走下/落地瞬间做平滑，消除画面跳变
    if (this.smoothEyeY === undefined) this.smoothEyeY = this.pos.y + CFG.EYE_HEIGHT;
    const targetEyeY = this.pos.y + CFG.EYE_HEIGHT;
    if (targetEyeY >= this.smoothEyeY - 0.001) {
      // 上升或平地 → 直接跟随
      this.smoothEyeY = targetEyeY;
    } else {
      // 下落/走下台階 → 快速插值（约 8 帧收敛）
      this.smoothEyeY = lerp(this.smoothEyeY, targetEyeY, 1 - Math.pow(0.0000001, dt));
    }

    this.camera.position.set(this.pos.x + bobX, this.smoothEyeY + bobY, this.pos.z);
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch + this.recoil;

    // 手部摆动 + 后座位移 + 切枪动画
    const sway = this.switching > 0 ? this.switching * 1.6 : 0;
    this.hand.position.y = -sway + Math.sin(this.bobPhase * 2) * 0.008;
    this.hand.position.z = this.recoil * 0.35;
    this.hand.rotation.x = this.recoil * 1.2 - sway * 0.8;

    // 准星扩散
    const ch = document.getElementById('crosshair');
    if (ch) ch.classList.toggle('spread', this.recoil > 0.05 || !this.grounded);
  }
}
