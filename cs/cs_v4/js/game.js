// game.js — 主控制：场景/光照/天空、波次流程、射击结算、UI
'use strict';

class Game {
  constructor() {
    this.state = 'loading';   // loading / menu / playing / paused / dead / victory
    this.wave = 0;
    this.kills = 0;
    this.score = 0;
    this.endless = false;
    this.pendingSpawn = [];   // 待生成敌人
    this.spawnTimer = 0;
    this.waveCooldown = false; // 波次结束判定冷却，防止每帧重复触发
    this.dayTime = 0.3;       // 0~1 昼夜
    this.shakeIntensity = 0;
    this.shakeDecay = 0;
    this.enemies = [];
    this.killLog = [];

    this.clock = new THREE.Clock();
    this.initRenderer();
    this.initScene();
    this.initSky();

    this.buildWorld();
    this.initUI();

    this.state = 'menu';
    document.getElementById('loading').style.display = 'none';
    this.animate();
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    this.renderer.setSize(innerWidth, innerHeight);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    document.getElementById('app').appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 400);
    this.scene = new THREE.Scene();

    window.addEventListener('resize', () => {
      this.camera.aspect = innerWidth / innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(innerWidth, innerHeight);
    });
  }

  initScene() {
    // 环境光 + 太阳 + 半球光
    this.ambient = new THREE.AmbientLight(0xffffff, 0.35);
    this.scene.add(this.ambient);

    this.sun = new THREE.DirectionalLight(0xfff2d8, 0.9);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(1024, 1024);
    const sc = this.sun.shadow.camera;
    sc.near = 1; sc.far = 160;
    sc.left = -45; sc.right = 45; sc.top = 45; sc.bottom = -45;
    this.scene.add(this.sun);
    this.scene.add(this.sun.target);

    this.hemi = new THREE.HemisphereLight(0x87b5e8, 0x4a3826, 0.35);
    this.scene.add(this.hemi);

    this.scene.fog = new THREE.Fog(0x87b5e8, 60, 160);
  }

  initSky() {
    // 天空穹顶（顶点色渐变着色器）
    const geo = new THREE.SphereGeometry(320, 24, 12);
    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        topColor: { value: new THREE.Color(0x3a7bd5) },
        bottomColor: { value: new THREE.Color(0xbfe3ff) },
        sunDir: { value: new THREE.Vector3(0, 1, 0) },
        sunColor: { value: new THREE.Color(0xfff4c8) },
      },
      vertexShader: `
        varying vec3 vDir;
        void main() {
          vDir = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        uniform vec3 topColor, bottomColor, sunColor, sunDir;
        varying vec3 vDir;
        void main() {
          float h = clamp(vDir.y, 0.0, 1.0);
          vec3 sky = mix(bottomColor, topColor, pow(h, 0.6));
          float s = max(dot(normalize(vDir), normalize(sunDir)), 0.0);
          sky += sunColor * (pow(s, 350.0) * 1.2 + pow(s, 24.0) * 0.25);
          gl_FragColor = vec4(sky, 1.0);
        }`,
    });
    this.skyDome = new THREE.Mesh(geo, mat);
    this.scene.add(this.skyDome);

    // 云（少量漂浮平面）
    this.clouds = new THREE.Group();
    const cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 });
    for (let i = 0; i < 14; i++) {
      const w = rand(6, 14), d = rand(4, 8);
      const cloud = new THREE.Mesh(new THREE.BoxGeometry(w, 0.8, d), cloudMat);
      cloud.position.set(rand(-80, 80), rand(34, 48), rand(-80, 80));
      cloud.userData.speed = rand(0.3, 0.9);
      this.clouds.add(cloud);
    }
    this.scene.add(this.clouds);
  }

  buildWorld() {
    this.atlas = buildAtlas();
    this.atlas.uvOf.canvasRef = this.atlas.canvas;
    this.world = new World(this.scene, this.atlas, Date.now() % 100000);
    this.particles = new ParticleSystem(this.scene, this.atlas);
    this.player = new Player(this.camera, this.world, this.particles);
    this.scene.add(this.camera);   // 手部挂在相机上
    this.player.spawn();
    this.spawner = new EnemySpawner(this.scene, this.world);
  }

  // ---------- UI ----------
  initUI() {
    // 快捷栏图标
    const hotbarEl = document.getElementById('hotbar');
    hotbarEl.innerHTML = '';
    HOTBAR.forEach((slot, i) => {
      const div = document.createElement('div');
      div.className = 'slot';

      // 编号
      const num = document.createElement('span');
      num.className = 'num';
      num.textContent = i + 1;
      div.appendChild(num);

      // 图标
      let iconEl;
      if (slot.type === 'weapon') {
        iconEl = this.makeWeaponIcon(WEAPONS[slot.idx]);
      } else {
        iconEl = makeBlockIcon(BLOCKS[slot.block], this.atlas.uvOf);
      }
      div.appendChild(iconEl);

      // 名称标签
      const label = document.createElement('span');
      label.className = 'label';
      label.textContent = slot.type === 'weapon' ? WEAPONS[slot.idx].name : BLOCKS[slot.block].name;
      div.appendChild(label);

      hotbarEl.appendChild(div);
    });
    this.updateHotbarUI();

    // 按钮
    const start = () => { sfx.init(); sfx.resume(); sfx.uiClick(); this.startGame(1); };
    document.getElementById('btn-start').onclick = start;
    document.getElementById('btn-wave-select').onclick = () => { sfx.init(); sfx.uiClick(); this.showWaveSelect(); };
    document.getElementById('btn-wave-back').onclick = () => {
      sfx.uiClick();
      document.getElementById('wave-select').style.display = 'none';
      document.getElementById('menu').style.display = 'flex';
    };
    document.getElementById('btn-respawn').onclick = () => { sfx.uiClick(); this.respawn(); };
    document.getElementById('btn-resume').onclick = () => { sfx.uiClick(); this.resume(); };
    document.getElementById('btn-again').onclick = () => location.reload();
    document.getElementById('btn-endless').onclick = () => {
      sfx.uiClick();
      this.endless = true;
      document.getElementById('victory').style.display = 'none';
      this.resume();
      this.toast('无尽模式 — 看你能撑到第几波！');
    };

    // 指针锁
    document.addEventListener('pointerlockchange', () => {
      if (!document.pointerLockElement && this.state === 'playing') this.pause();
    });
    document.addEventListener('keydown', e => {
      if (e.code === 'Escape' && this.state === 'paused') this.resume();
    });
  }

  // 用 Canvas 画像素武器图标（替代 emoji，避免系统不显示）
  makeWeaponIcon(weapon) {
    const cv = document.createElement('canvas');
    cv.width = 38; cv.height = 38;
    const ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const metal = '#3d3d3d', dark = '#222', wood = '#6e4f26', accent = '#ffd75e';

    if (weapon.key === 'rifle') {
      // 枪身
      ctx.fillStyle = metal; ctx.fillRect(6, 14, 24, 8);
      // 枪管
      ctx.fillStyle = dark; ctx.fillRect(28, 16, 8, 4);
      // 弹匣
      ctx.fillStyle = dark; ctx.fillRect(14, 22, 6, 10);
      // 枪托
      ctx.fillStyle = wood; ctx.fillRect(2, 15, 6, 6);
      // 准星
      ctx.fillStyle = accent; ctx.fillRect(16, 12, 2, 2);
    } else if (weapon.key === 'pistol') {
      // 套筒
      ctx.fillStyle = metal; ctx.fillRect(10, 14, 20, 7);
      // 枪管
      ctx.fillStyle = dark; ctx.fillRect(28, 16, 6, 3);
      // 握把
      ctx.fillStyle = wood; ctx.fillRect(10, 21, 6, 12);
      ctx.fillRect(16, 21, 4, 8);
    } else {
      // 双管
      ctx.fillStyle = dark; ctx.fillRect(8, 12, 4, 16);
      ctx.fillRect(14, 12, 4, 16);
      // 枪身
      ctx.fillStyle = wood; ctx.fillRect(6, 20, 14, 10);
      // 枪口
      ctx.fillStyle = metal; ctx.fillRect(8, 28, 4, 6);
      ctx.fillRect(14, 28, 4, 6);
    }
    return cv;
  }

  updateHotbarUI() {
    const slots = document.querySelectorAll('#hotbar .slot');
    slots.forEach((el, i) => el.classList.toggle('active', i === this.player.slot));
    this.updateAmmoUI();
  }

  updateAmmoUI() {
    const slot = this.player.currentSlot();
    const nameEl = document.getElementById('ammo-name');
    const magEl = document.getElementById('ammo-mag');
    if (slot.type === 'weapon') {
      const w = this.player.weapons[slot.idx];
      nameEl.textContent = w.name;
      magEl.textContent = `${w.ammo} / ${w.mag}`;
    } else {
      nameEl.textContent = BLOCKS[slot.block].name;
      magEl.textContent = '右键放置';
    }
  }

  toast(msg, dur = 2200) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.style.opacity = 1;
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => { el.style.opacity = 0; }, dur);
  }

  killFeed(msg, color = '#fff') {
    const feed = document.getElementById('killfeed');
    const div = document.createElement('div');
    div.textContent = msg;
    div.style.color = color;
    feed.prepend(div);
    while (feed.children.length > 5) feed.removeChild(feed.lastChild);
    setTimeout(() => { if (div.parentNode) div.parentNode.removeChild(div); }, 4000);
  }

  showHitmark(kill) {
    const hm = document.getElementById('hitmark');
    hm.classList.remove('show', 'kill');
    void hm.offsetWidth;   // 重启动画
    hm.classList.add('show');
    if (kill) hm.classList.add('kill');
  }

  waveBanner(text, sub) {
    const b = document.getElementById('wave-banner');
    b.querySelector('.big').textContent = text;
    b.querySelector('.small').textContent = sub;
    b.classList.remove('show');
    void b.offsetWidth;
    b.classList.add('show');
  }

  shake(intensity, decay) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeDecay = decay;
  }

  // ---------- 选波次 ----------
  showWaveSelect() {
    document.getElementById('menu').style.display = 'none';
    const sel = document.getElementById('wave-select');
    sel.style.display = 'flex';

    const grid = document.getElementById('wave-grid');
    grid.innerHTML = '';
    const maxUnlocked = this.maxUnlockedWave || 1;
    for (let w = 1; w <= CFG.TOTAL_WAVES; w++) {
      const cell = document.createElement('div');
      cell.className = 'wave-cell' + (w > maxUnlocked ? ' locked' : '');
      const comp = waveComp(w);
      cell.innerHTML = `${w}<small>${comp.length} 敌</small>`;
      if (w <= maxUnlocked) {
        cell.onclick = () => { sfx.uiClick(); this.startGame(w); };
      }
      grid.appendChild(cell);
    }
  }

  // ---------- 流程 ----------
  startGame(wave) {
    document.getElementById('menu').style.display = 'none';
    document.getElementById('wave-select').style.display = 'none';
    document.getElementById('hud').style.display = 'block';
    this.wave = wave - 1;          // nextWave() 会 +1
    this.state = 'playing';
    this.renderer.domElement.requestPointerLock();
    this.nextWave();
  }

  pause() {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    document.getElementById('pause').style.display = 'flex';
    document.exitPointerLock();
  }

  resume() {
    document.getElementById('pause').style.display = 'none';
    this.state = 'playing';
    this.renderer.domElement.requestPointerLock();
  }

  respawn() {
    document.getElementById('death').style.display = 'none';
    // 清场重来当前波
    this.enemies.forEach(e => e.remove());
    this.enemies = [];
    this.pendingSpawn = [];
    this.waveCooldown = false;   // 重置波次冷却
    this.player.spawn();
    this.player.heal(CFG.MAX_HP);
    this.updateHUD();
    this.state = 'playing';
    this.renderer.domElement.requestPointerLock();
    this.waveBanner(`第 ${this.wave} 波`, '再来一次！');
    this.queueWaveSpawn();
  }

  onPlayerDeath() {
    this.state = 'dead';
    document.exitPointerLock();
    document.getElementById('death-stats').innerHTML =
      `存活到了第 <b>${this.wave}</b> 波<br>击杀 <b>${this.kills}</b> · 得分 <b>${this.score}</b>`;
    document.getElementById('death').style.display = 'flex';
  }

  onVictory() {
    this.state = 'victory';
    document.exitPointerLock();
    document.getElementById('victory-stats').innerHTML =
      `共击退 <b>${CFG.TOTAL_WAVES}</b> 波进攻<br>击杀 <b>${this.kills}</b> · 得分 <b>${this.score}</b>`;
    document.getElementById('victory').style.display = 'flex';
  }

  nextWave() {
    this.wave++;
    document.getElementById('wave-num').textContent = this.wave;
    const comp = waveComp(this.wave);
    this.waveBanner(`第 ${this.wave} 波`, `${comp.length} 个敌人正在逼近`);
    sfx.waveStart();
    this.queueWaveSpawn();
  }

  queueWaveSpawn() {
    this.pendingSpawn = waveComp(this.wave);
    // 洗牌
    for (let i = this.pendingSpawn.length - 1; i > 0; i--) {
      const j = randInt(0, i);
      [this.pendingSpawn[i], this.pendingSpawn[j]] = [this.pendingSpawn[j], this.pendingSpawn[i]];
    }
    this.spawnTimer = 0.5;
    this.updateEnemyCount();
  }

  updateEnemyCount() {
    const alive = this.enemies.filter(e => e.alive).length;
    document.getElementById('enemies-left').textContent = alive + this.pendingSpawn.length;
  }

  updateHUD() {
    document.getElementById('kills').textContent = this.kills;
    document.getElementById('score').textContent = this.score;
    document.getElementById('wave-num').textContent = this.wave;
  }

  // ---------- 射击结算 ----------
  handleShotHits(hits) {
    for (const h of hits) {
      if (h.type === 'enemy') {
        const killed = h.enemy.takeDamage(h.damage, this.particles);
        this.showHitmark(killed);
        if (killed) {
          this.kills++;
          this.score += h.enemy.type.score;
          sfx.kill();
          this.killFeed(`☠ ${h.enemy.type.name} +${h.enemy.type.score}`, '#ffd75e');
          this.updateHUD();
          this.updateEnemyCount();
        } else {
          sfx.hitMarker();
        }
      } else if (h.type === 'block') {
        // 子弹击碎可破坏方块
        const { hit, damage } = h;
        const block = hit.block;
        if (block.breakable) {
          // 硬度：石头要更多伤害累积 —— 用简易概率模拟
          const breakChance = clamp(damage / (block.hardness * 25), 0.15, 1);
          if (Math.random() < breakChance) {
            this.world.set(hit.x, hit.y, hit.z, 0);
            this.particles.breakBlock(new THREE.Vector3(hit.x, hit.y, hit.z), block);
            sfx.breakBlock();
            this.score += 1;
            this.updateHUD();
          } else {
            this.particles.spark(hit.point, 0xcccccc);
          }
        } else {
          this.particles.spark(hit.point, 0xffe27a);
        }
      }
    }
  }

  // ---------- 昼夜 & 环境 ----------
  updateEnvironment(dt) {
    this.dayTime = (this.dayTime + dt / 240) % 1;   // 4 分钟一昼夜
    const t = this.dayTime;
    const sunAngle = t * Math.PI * 2 - Math.PI / 2;
    const sunY = Math.sin(sunAngle);
    const sunDir = new THREE.Vector3(Math.cos(sunAngle) * 0.5, sunY, 0.4).normalize();

    // 太阳/月亮位置（跟随玩家，保证阴影覆盖）
    this.sun.position.copy(this.player.pos).add(sunDir.clone().multiplyScalar(80));
    this.sun.target.position.copy(this.player.pos);

    // 亮度
    const dayLight = clamp(sunY * 1.4 + 0.15, 0.06, 1);
    this.sun.intensity = 0.95 * dayLight;
    this.sun.color.setHSL(0.1, 0.5, lerp(0.65, 0.98, dayLight));
    this.ambient.intensity = lerp(0.12, 0.4, dayLight);
    this.hemi.intensity = lerp(0.1, 0.38, dayLight);

    // 天空颜色
    const day = new THREE.Color(0x3a7bd5), night = new THREE.Color(0x070b1e);
    const dayB = new THREE.Color(0xbfe3ff), nightB = new THREE.Color(0x0e1630);
    const uni = this.skyDome.material.uniforms;
    uni.topColor.value.copy(night).lerp(day, dayLight);
    uni.bottomColor.value.copy(nightB).lerp(dayB, dayLight);
    uni.sunDir.value.copy(sunDir);
    this.scene.fog.color.copy(uni.bottomColor.value);

    // 黄昏加暖
    const dusk = clamp(1 - Math.abs(sunY) * 4, 0, 1) * (sunY > -0.1 ? 1 : 0);
    if (dusk > 0) uni.bottomColor.value.lerp(new THREE.Color(0xff8c4a), dusk * 0.55);

    // 云移动
    this.clouds.children.forEach(c => {
      c.position.x += c.userData.speed * dt;
      if (c.position.x > 100) c.position.x = -100;
    });
    this.clouds.position.set(this.player.pos.x, 0, this.player.pos.z);

    // 天空跟随玩家
    this.skyDome.position.copy(this.player.pos);
  }

  // ---------- 主循环 ----------
  animate() {
    requestAnimationFrame(() => this.animate());
    const dt = Math.min(this.clock.getDelta(), 0.05);

    if (this.state === 'playing') {
      // 玩家
      this.player.update(dt, this.enemies);

      // 敌人生成
      if (this.pendingSpawn.length > 0) {
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
          this.spawnTimer = rand(0.6, 1.6);
          const type = this.pendingSpawn.pop();
          const e = this.spawner.spawn(type, this.player.pos);
          if (e) this.enemies.push(e);
          else this.pendingSpawn.push(type);   // 找不到位置则稍后重试
          this.updateEnemyCount();
        }
      }

      // 敌人更新
      for (let i = this.enemies.length - 1; i >= 0; i--) {
        const e = this.enemies[i];
        e.update(dt, this.player, this);
        if (e.removed) this.enemies.splice(i, 1);
      }

      // 波次结束判定（waveCooldown 防止每帧重复触发）
      if (this.pendingSpawn.length === 0 && this.enemies.filter(e => e.alive).length === 0 && !this.player.dead && !this.waveCooldown) {
        if (!this.endless && this.wave >= CFG.TOTAL_WAVES) {
          this.onVictory();
        } else {
          this.waveCooldown = true;   // 关键：立即上锁，防止下一帧再次进入
          this.maxUnlockedWave = Math.max(this.maxUnlockedWave || 1, Math.min(this.wave + 1, CFG.TOTAL_WAVES));
          this.player.heal(25);
          this.toast('波次肃清！生命恢复 25 点');
          this.score += 200 * this.wave;
          this.updateHUD();
          setTimeout(() => {
            this.waveCooldown = false;
            if (this.state === 'playing') this.nextWave();
          }, 2500);
        }
      }

      // 粒子 & 环境
      this.particles.update(dt, this.camera);
      this.updateEnvironment(dt);

      // 屏幕震动
      if (this.shakeIntensity > 0.001) {
        this.camera.position.x += rand(-1, 1) * this.shakeIntensity * 0.15;
        this.camera.position.y += rand(-1, 1) * this.shakeIntensity * 0.15;
        this.camera.rotation.z = rand(-1, 1) * this.shakeIntensity * 0.02;
        this.shakeIntensity *= Math.pow(1 - this.shakeDecay, dt * 60);
      } else {
        this.camera.rotation.z = 0;
      }

      // 血条 UI
      const hpFill = document.getElementById('hp-fill');
      hpFill.style.width = (this.player.hp / CFG.MAX_HP * 100) + '%';
      hpFill.classList.toggle('low', this.player.hp < 30);
    }

    this.renderer.render(this.scene, this.camera);
  }
}

// 启动
let game = null;
window.addEventListener('load', () => {
  const fill = document.getElementById('load-fill');
  let p = 0;
  const iv = setInterval(() => {
    p += 20;
    fill.style.width = Math.min(p, 100) + '%';
    if (p >= 100) {
      clearInterval(iv);
      game = new Game();
    }
  }, 60);
});
