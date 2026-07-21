// particles.js — 粒子系统：方块碎屑、曳光、爆炸
'use strict';

class ParticleSystem {
  constructor(scene, atlas) {
    this.scene = scene;
    this.atlas = atlas;
    this.pool = [];
    this.active = [];
    this.tracers = [];
    this.max = 400;

    // 共享几何
    this.geo = new THREE.PlaneGeometry(0.14, 0.14);
  }

  _getMesh() {
    if (this.pool.length) return this.pool.pop();
    if (this.active.length >= this.max) {
      const oldest = this.active.shift();
      this.scene.remove(oldest.mesh);
      this.pool.push(oldest.mesh);
      return this.pool.pop();
    }
    return new THREE.Mesh(this.geo, new THREE.MeshBasicMaterial({
      map: this.atlas.texture, transparent: true, side: THREE.DoubleSide,
    }));
  }

  // 方块碎裂粒子
  breakBlock(pos, block) {
    const count = 14;
    const [tc, tr] = block.tex.side;
    const uv = this.atlas.uvOf(tc, tr);

    for (let i = 0; i < count; i++) {
      const mesh = this._getMesh();
      // 随机纹理子区域
      const su = lerp(uv.u0, uv.u1, Math.random() * 0.8);
      const sv = lerp(uv.v0, uv.v1, Math.random() * 0.8);
      const du = (uv.u1 - uv.u0) * 0.18, dv = (uv.v1 - uv.v0) * 0.18;
      mesh.geometry = this.geo.clone();
      const uvAttr = mesh.geometry.attributes.uv;
      for (let v = 0; v < uvAttr.count; v++) {
        uvAttr.setXY(v, su + uvAttr.getX(v) * du, sv + uvAttr.getY(v) * dv);
      }
      mesh.material.opacity = 1;

      mesh.position.set(
        pos.x + rand(0.15, 0.85),
        pos.y + rand(0.15, 0.85),
        pos.z + rand(0.15, 0.85)
      );
      const vel = new THREE.Vector3(rand(-2.5, 2.5), rand(2, 6), rand(-2.5, 2.5));
      this.active.push({ mesh, vel, life: rand(0.5, 0.9), maxLife: 0.9, spin: rand(-8, 8), gravity: 18 });
      this.scene.add(mesh);
    }
  }

  // 命中火花
  spark(pos, color = 0xffe27a) {
    for (let i = 0; i < 6; i++) {
      const mesh = this._getMesh();
      mesh.material = mesh.material.clone();
      mesh.material.map = null;
      mesh.material.color = new THREE.Color(color);
      mesh.material.opacity = 1;
      mesh.position.copy(pos);
      const vel = new THREE.Vector3(rand(-3, 3), rand(0, 4), rand(-3, 3));
      this.active.push({ mesh, vel, life: rand(0.15, 0.35), maxLife: 0.35, spin: rand(-10, 10), gravity: 10 });
      this.scene.add(mesh);
    }
  }

  // 血雾
  blood(pos) {
    for (let i = 0; i < 10; i++) {
      const mesh = this._getMesh();
      mesh.material = mesh.material.clone();
      mesh.material.map = null;
      mesh.material.color = new THREE.Color().setHSL(0, 0.85, rand(0.25, 0.45));
      mesh.material.opacity = 0.95;
      mesh.position.set(pos.x + rand(-0.3, 0.3), pos.y + rand(-0.3, 0.3), pos.z + rand(-0.3, 0.3));
      const vel = new THREE.Vector3(rand(-2, 2), rand(1, 3.5), rand(-2, 2));
      this.active.push({ mesh, vel, life: rand(0.3, 0.55), maxLife: 0.55, spin: rand(-6, 6), gravity: 14 });
      this.scene.add(mesh);
    }
  }

  // 爆炸火球 + 烟
  explosion(pos, radius) {
    for (let i = 0; i < 30; i++) {
      const mesh = this._getMesh();
      mesh.material = mesh.material.clone();
      mesh.material.map = null;
      const isFire = Math.random() < 0.6;
      mesh.material.color = isFire
        ? new THREE.Color().setHSL(rand(0.02, 0.1), 1, rand(0.5, 0.65))
        : new THREE.Color().setHSL(0, 0, rand(0.15, 0.35));
      mesh.material.opacity = 1;
      const s = rand(0.25, 0.7) * (isFire ? 1 : 1.4);
      mesh.scale.set(s, s, 1);
      mesh.position.copy(pos);
      const dir = new THREE.Vector3(rand(-1, 1), rand(-0.3, 1), rand(-1, 1)).normalize();
      const vel = dir.multiplyScalar(rand(3, 8) * (radius / 3));
      this.active.push({ mesh, vel, life: rand(0.4, 0.9), maxLife: 0.9, spin: rand(-4, 4), gravity: isFire ? 2 : -1 });
      this.scene.add(mesh);
    }
  }

  // 曳光弹（细长三角面片，存活极短）
  tracer(from, to, color) {
    const dir = to.clone().sub(from);
    const len = dir.length();
    if (len < 0.5) return;
    const geo = new THREE.PlaneGeometry(0.03, len);
    const mat = new THREE.MeshBasicMaterial({
      color, transparent: true, opacity: 0.85, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(from).add(dir.multiplyScalar(0.5));
    mesh.lookAt(to);
    mesh.rotateX(Math.PI / 2);
    this.scene.add(mesh);
    this.tracers.push({ mesh, life: 0.07 });
  }

  update(dt, camera) {
    // 普通粒子
    for (let i = this.active.length - 1; i >= 0; i--) {
      const p = this.active[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        if (p.mesh.geometry !== this.geo) p.mesh.geometry.dispose();
        p.mesh.geometry = this.geo;
        this.pool.push(p.mesh);
        this.active.splice(i, 1);
        continue;
      }
      p.vel.y -= p.gravity * dt;
      p.mesh.position.addScaledVector(p.vel, dt);
      p.mesh.rotation.z += p.spin * dt;
      // 面向相机（公告板）
      p.mesh.quaternion.copy(camera.quaternion);
      p.mesh.material.opacity = clamp(p.life / p.maxLife * 1.4, 0, 1);
    }
    // 曳光
    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const t = this.tracers[i];
      t.life -= dt;
      if (t.life <= 0) {
        this.scene.remove(t.mesh);
        t.mesh.geometry.dispose();
        t.mesh.material.dispose();
        this.tracers.splice(i, 1);
      }
    }
  }

  clear() {
    this.active.forEach(p => { this.scene.remove(p.mesh); this.pool.push(p.mesh); });
    this.active = [];
    this.tracers.forEach(t => { this.scene.remove(t.mesh); t.mesh.geometry.dispose(); t.mesh.material.dispose(); });
    this.tracers = [];
  }
}
