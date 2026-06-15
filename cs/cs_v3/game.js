class Game {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock();
        this.state = 'menu';
        this.selectedMap = 'arena';
        this.player = {
            health: 100,
            maxHealth: 100,
            ammo: 30,
            maxAmmo: 30,
            reserveAmmo: 90,
            score: 0,
            kills: 0,
            speed: 6,
            position: new THREE.Vector3(0, 1.6, 25),
            direction: new THREE.Euler(0, 0, 0, 'YXZ')
        };
        this.enemies = [];
        this.teammates = [];
        this.bullets = [];
        this.enemyBullets = [];
        this.allyBullets = [];
        this.walls = [];
        this.maxEnemies = 8;
        this.maxTeammates = 4;
        this.startTime = 0;
        this.locking = false;
        this.keys = { w: false, a: false, s: false, d: false };
        this.isPointerLocked = false;
        this.shootCooldown = 0.12;
        this.lastShootTime = 0;
        this.muzzleFlash = null;
        this.muzzleFlashLight = null;

        // [FIX] 新增：武器模型相关属性
        this.weaponModel = null;
        this.weaponBasePos = new THREE.Vector3(0.3, -0.28, -0.55);
        this.weaponRecoilTime = 0;
        this.reloading = false;
        this.reloadTimer = 0;
        this.reloadDuration = 1.8;

        this.init();
    }

    init() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.FogExp2(0x87CEEB, 0.012);

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);
        this.camera.position.copy(this.player.position);

        // [FIX] 必须将相机加入场景，否则相机的子节点（枪模型）不会被渲染
        this.scene.add(this.camera);

        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('gameCanvas'),
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        this.createLighting();
        this.createMuzzleFlash();
        this.createWeaponModel(); // [FIX] 创建第一人称枪模型
        this.setupUI();
        this.setupEventListeners();
        this.animate();
    }

    tryLockPointer() {
        if (this.locking || this.isPointerLocked) return;
        this.locking = true;
        document.getElementById('gameCanvas').requestPointerLock();
    }

    createLighting() {
        this.scene.add(new THREE.AmbientLight(0x6688aa, 0.6));
        const sun = new THREE.DirectionalLight(0xfff4e0, 1.0);
        sun.position.set(40, 60, 30);
        sun.castShadow = true;
        sun.shadow.mapSize.width = 2048;
        sun.shadow.mapSize.height = 2048;
        const s = 50;
        sun.shadow.camera.left = -s;
        sun.shadow.camera.right = s;
        sun.shadow.camera.top = s;
        sun.shadow.camera.bottom = -s;
        sun.shadow.camera.near = 0.5;
        sun.shadow.camera.far = 200;
        this.scene.add(sun);
    }

    // [FIX] 修复 clearScene：不再直接赋值 scene.children，改用 scene.remove 逐个移除
    clearScene() {
        [...this.enemies, ...this.teammates, ...this.bullets, ...this.enemyBullets, ...this.allyBullets].forEach(o => this.scene.remove(o));

        // 保留灯光、muzzleFlash、muzzleFlashLight、camera（枪模型是 camera 子节点不需处理）
        const toRemove = [];
        for (const child of this.scene.children) {
            if (!child.isLight && child !== this.muzzleFlash && child !== this.muzzleFlashLight && child !== this.camera) {
                toRemove.push(child);
            }
        }
        toRemove.forEach(c => this.scene.remove(c));

        this.enemies = [];
        this.teammates = [];
        this.bullets = [];
        this.enemyBullets = [];
        this.allyBullets = [];
        this.walls = [];
    }

    addWall(w, h, d, mat, x, y, z) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
        m.position.set(x, y, z);
        m.castShadow = true;
        m.receiveShadow = true;
        this.scene.add(m);
        this.walls.push({
            minX: x - w / 2, maxX: x + w / 2,
            minY: y - h / 2, maxY: y + h / 2,
            minZ: z - d / 2, maxZ: z + d / 2
        });
        return m;
    }

    bulletHitsWall(pos) {
        for (const w of this.walls) {
            if (pos.x >= w.minX && pos.x <= w.maxX &&
                pos.y >= w.minY && pos.y <= w.maxY &&
                pos.z >= w.minZ && pos.z <= w.maxZ) return true;
        }
        return false;
    }

    canSeeTarget(from, to) {
        const dir = new THREE.Vector3().subVectors(to, from);
        const dist = dir.length();
        dir.normalize();
        const pos = from.clone();
        const steps = Math.ceil(dist / 0.5);
        for (let i = 0; i < steps; i++) {
            pos.add(dir.clone().multiplyScalar(0.5));
            if (this.bulletHitsWall(pos)) return false;
        }
        return true;
    }

    findSafeSpawn() {
        const candidates = [
            [0, 1.6, 25], [0, 1.6, -25], [25, 1.6, 0], [-25, 1.6, 0],
            [20, 1.6, 20], [-20, 1.6, 20], [20, 1.6, -20], [-20, 1.6, -20],
            [30, 1.6, 30], [-30, 1.6, -30]
        ];
        for (const [x, y, z] of candidates) {
            if (!this.bulletHitsWall(new THREE.Vector3(x, y, z))) return new THREE.Vector3(x, y, z);
        }
        return new THREE.Vector3(0, 1.6, 35);
    }

    // [FIX] Arena 地图添加边界墙
    buildMapArena() {
        const grassMat = new THREE.MeshLambertMaterial({ color: 0x5da130 });
        const dirtMat = new THREE.MeshLambertMaterial({ color: 0x8B5A2B });
        const stoneMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
        const woodMat = new THREE.MeshLambertMaterial({ color: 0xA0722A });
        const darkMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        const sandMat = new THREE.MeshLambertMaterial({ color: 0xD2B48C });
        const wallMat = new THREE.MeshLambertMaterial({ color: 0x777766 });

        this.addWall(120, 1, 120, dirtMat, 0, -0.5, 0);
        this.addWall(120, 0.1, 120, grassMat, 0, 0.05, 0);

        for (let x = -50; x <= 50; x += 10) {
            for (let z = -50; z <= 50; z += 10) {
                this.addWall(0.3, 0.3, 0.3, sandMat, x, 0.15, z);
            }
        }

        // [FIX] 边界墙 — 原来缺少，玩家和敌人可以走出地图
        this.addWall(1, 5, 120, wallMat, -60, 2.5, 0);
        this.addWall(1, 5, 120, wallMat, 60, 2.5, 0);
        this.addWall(120, 5, 1, wallMat, 0, 2.5, -60);
        this.addWall(120, 5, 1, wallMat, 0, 2.5, 60);

        this.addWall(6, 4, 6, stoneMat, -15, 2, -15);
        this.addWall(6, 4, 6, stoneMat, 15, 2, 15);
        this.addWall(6, 4, 6, stoneMat, -15, 2, 15);
        this.addWall(6, 4, 6, stoneMat, 15, 2, -15);
        this.addWall(3, 3, 8, woodMat, 0, 1.5, -20);
        this.addWall(3, 3, 8, woodMat, 0, 1.5, 20);
        this.addWall(8, 3, 3, woodMat, -20, 1.5, 0);
        this.addWall(8, 3, 3, woodMat, 20, 1.5, 0);

        for (let i = 0; i < 20; i++) {
            const bx = (Math.random() - 0.5) * 80;
            const bz = (Math.random() - 0.5) * 80;
            const bh = 1 + Math.random() * 3;
            const mat = [stoneMat, woodMat, darkMat][Math.floor(Math.random() * 3)];
            this.addWall(2, bh, 2, mat, bx, bh / 2, bz);
        }

        this.addWall(2, 2, 2, stoneMat, 0, 1, 0);
        this.addWall(2, 1, 2, stoneMat, 0, 2.5, 0);

        for (let i = 0; i < 4; i++) {
            const a = (i / 4) * Math.PI * 2;
            this.addWall(1.5, 2.5, 1.5, darkMat, Math.cos(a) * 10, 1.25, Math.sin(a) * 10);
        }
    }

    buildMapBloodstrike() {
        const floorMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        const wallMat = new THREE.MeshLambertMaterial({ color: 0x999999 });
        const redMat = new THREE.MeshLambertMaterial({ color: 0xCC2222 });
        const crateMat = new THREE.MeshLambertMaterial({ color: 0x8B6914 });
        const roofMat = new THREE.MeshLambertMaterial({ color: 0x666666 });

        this.addWall(80, 1, 80, floorMat, 0, -0.5, 0);
        const s = 40;
        this.addWall(1, 4, s * 2, wallMat, -s, 2, 0);
        this.addWall(1, 4, s * 2, wallMat, s, 2, 0);
        this.addWall(s * 2, 4, 1, wallMat, 0, 2, -s);
        this.addWall(s * 2, 4, 1, wallMat, 0, 2, s);

        this.addWall(8, 3, 8, redMat, 0, 1.5, 0);
        this.addWall(3, 1.5, 3, roofMat, 0, 3.5, 0);

        for (let i = 0; i < 4; i++) {
            const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
            this.addWall(2, 2, 2, wallMat, Math.cos(a) * 12, 1, Math.sin(a) * 12);
        }

        const offsets = [
            [-20, -20], [20, -20], [-20, 20], [20, 20],
            [-30, 0], [30, 0], [0, -30], [0, 30],
            [-12, -25], [12, -25], [-12, 25], [12, 25]
        ];
        offsets.forEach(([x, z]) => {
            this.addWall(1.5, 1.5, 1.5, crateMat, x, 0.75, z);
        });

        for (let i = 0; i < 4; i++) {
            const a = (i / 4) * Math.PI * 2;
            this.addWall(1, 2, 6, wallMat, Math.cos(a) * 22, 1, Math.sin(a) * 22);
        }
        for (let i = 0; i < 4; i++) {
            const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
            this.addWall(4, 2.5, 1, wallMat, Math.cos(a) * 30, 1.25, Math.sin(a) * 30);
        }
    }

    buildMapDust2() {
        const sandMat = new THREE.MeshLambertMaterial({ color: 0xD2B48C });
        const wallMat = new THREE.MeshLambertMaterial({ color: 0xC4A882 });
        const stoneMat = new THREE.MeshLambertMaterial({ color: 0x998877 });
        const crateMat = new THREE.MeshLambertMaterial({ color: 0x8B6914 });
        const darkMat = new THREE.MeshLambertMaterial({ color: 0x776655 });

        this.addWall(100, 1, 80, sandMat, 0, -0.5, 0);
        this.addWall(100, 5, 1, wallMat, 0, 2.5, -40);
        this.addWall(100, 5, 1, wallMat, 0, 2.5, 40);
        this.addWall(1, 5, 80, wallMat, -50, 2.5, 0);
        this.addWall(1, 5, 80, wallMat, 50, 2.5, 0);

        this.addWall(40, 4, 1, wallMat, -20, 2, -15);
        this.addWall(40, 4, 1, wallMat, -20, 2, 15);
        this.addWall(40, 4, 1, wallMat, 20, 2, -15);
        this.addWall(40, 4, 1, wallMat, 20, 2, 15);
        this.addWall(1, 4, 30, wallMat, -20, 2, 0);
        this.addWall(1, 4, 30, wallMat, 20, 2, 0);
        this.addWall(1, 4, 10, wallMat, 0, 2, -15);
        this.addWall(1, 4, 10, wallMat, 0, 2, 15);

        this.addWall(6, 3, 6, stoneMat, -35, 1.5, -30);
        this.addWall(6, 3, 6, stoneMat, 35, 1.5, 30);
        this.addWall(6, 3, 6, stoneMat, -35, 1.5, 30);
        this.addWall(6, 3, 6, stoneMat, 35, 1.5, -30);
        this.addWall(3, 2, 3, stoneMat, 0, 1, 0);

        for (let i = 0; i < 8; i++) {
            const x = (i % 2 === 0 ? -1 : 1) * (30 + Math.random() * 10);
            const z = (Math.random() - 0.5) * 30;
            this.addWall(2, 1.5, 2, crateMat, x, 0.75, z);
        }

        this.addWall(10, 3, 1, darkMat, -35, 1.5, -5);
        this.addWall(10, 3, 1, darkMat, 35, 1.5, 5);
        this.addWall(1, 3, 8, darkMat, -10, 1.5, -30);
        this.addWall(1, 3, 8, darkMat, 10, 1.5, 30);
    }

    // [FIX] Assault 地图添加边界墙
    buildMapAssault() {
        const concreteMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
        const wallMat = new THREE.MeshLambertMaterial({ color: 0x777777 });
        const metalMat = new THREE.MeshLambertMaterial({ color: 0x556666 });
        const crateMat = new THREE.MeshLambertMaterial({ color: 0x8B6914 });
        const redMat = new THREE.MeshLambertMaterial({ color: 0x883333 });
        const roofMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        const borderMat = new THREE.MeshLambertMaterial({ color: 0x666666 });

        this.addWall(90, 1, 90, concreteMat, 0, -0.5, 0);

        // [FIX] 边界墙 — 原来缺少
        this.addWall(1, 5, 90, borderMat, -45, 2.5, 0);
        this.addWall(1, 5, 90, borderMat, 45, 2.5, 0);
        this.addWall(90, 5, 1, borderMat, 0, 2.5, -45);
        this.addWall(90, 5, 1, borderMat, 0, 2.5, 45);

        this.addWall(20, 5, 1, wallMat, -25, 2.5, 0);
        this.addWall(20, 5, 1, wallMat, 25, 2.5, 0);
        this.addWall(1, 5, 40, wallMat, -15, 2.5, 0);
        this.addWall(1, 5, 40, wallMat, 15, 2.5, 0);
        this.addWall(30, 5, 1, redMat, 0, 2.5, -20);
        this.addWall(30, 5, 1, redMat, 0, 2.5, 20);

        this.addWall(6, 4, 6, wallMat, -30, 2, -15);
        this.addWall(6, 4, 6, wallMat, 30, 2, 15);
        this.addWall(6, 4, 6, wallMat, -30, 2, 15);
        this.addWall(6, 4, 6, wallMat, 30, 2, -15);
        this.addWall(8, 3, 12, metalMat, -25, 1.5, -30);
        this.addWall(8, 3, 12, metalMat, 25, 1.5, 30);
        this.addWall(30, 1, 12, roofMat, 0, 4, -20);
        this.addWall(30, 1, 12, roofMat, 0, 4, 20);

        for (let i = 0; i < 16; i++) {
            const x = (Math.random() - 0.5) * 60;
            const z = (Math.random() - 0.5) * 60;
            this.addWall(1.5, 1.5, 1.5, crateMat, x, 0.75, z);
        }

        this.addWall(1, 3, 10, wallMat, -5, 1.5, -30);
        this.addWall(1, 3, 10, wallMat, 5, 1.5, 30);
        this.addWall(10, 3, 1, wallMat, -35, 1.5, -10);
        this.addWall(10, 3, 1, wallMat, 35, 1.5, 10);
    }

    buildMap(name) {
        switch (name) {
            case 'bloodstrike': this.buildMapBloodstrike(); break;
            case 'dust2': this.buildMapDust2(); break;
            case 'assault': this.buildMapAssault(); break;
            default: this.buildMapArena(); break;
        }
    }

    getMapSpawn() {
        switch (this.selectedMap) {
            case 'bloodstrike': return { min: -35, max: 35 };
            case 'dust2': return { min: -45, max: 45 };
            case 'assault': return { min: -40, max: 40 };
            default: return { min: -50, max: 50 };
        }
    }

    createMuzzleFlash() {
        const geo = new THREE.BoxGeometry(0.15, 0.15, 0.3);
        const mat = new THREE.MeshBasicMaterial({ color: 0xFFFF00, transparent: true, opacity: 0.9 });
        this.muzzleFlash = new THREE.Mesh(geo, mat);
        this.muzzleFlash.visible = false;
        this.scene.add(this.muzzleFlash);
        this.muzzleFlashLight = new THREE.PointLight(0xFFAA00, 3, 6);
        this.muzzleFlashLight.visible = false;
        this.scene.add(this.muzzleFlashLight);
    }

    // [FIX] 新增：创建MC风格的第一人称AK-47武器模型
    createWeaponModel() {
        const weaponGroup = new THREE.Group();

        // 材质定义 — MC方块风格用纯色
        const bodyMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        const woodMat = new THREE.MeshLambertMaterial({ color: 0x8B5A2B });
        const metalMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        const darkMetalMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        const orangeMat = new THREE.MeshLambertMaterial({ color: 0xCC6600 });

        // 枪管
        const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.55), darkMetalMat);
        barrel.position.set(0, 0.01, -0.48);
        weaponGroup.add(barrel);

        // 枪管上护罩
        const barrelShield = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.2), bodyMat);
        barrelShield.position.set(0, 0.01, -0.55);
        weaponGroup.add(barrelShield);

        // 机匣
        const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.07, 0.25), bodyMat);
        receiver.position.set(0, -0.005, -0.12);
        weaponGroup.add(receiver);

        // 机匣盖（稍浅色）
        const receiverTop = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.015, 0.18), metalMat);
        receiverTop.position.set(0, 0.035, -0.1);
        weaponGroup.add(receiverTop);

        // 弯曲弹匣 — AK标志性弯弹匣
        const magazine = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.16, 0.045), metalMat);
        magazine.position.set(0, -0.1, -0.07);
        magazine.rotation.x = 0.2;
        weaponGroup.add(magazine);

        // 弹匣底部
        const magBottom = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.02, 0.05), darkMetalMat);
        magBottom.position.set(0, -0.18, -0.05);
        magBottom.rotation.x = 0.2;
        weaponGroup.add(magBottom);

        // 木质枪托
        const stock = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 0.2), woodMat);
        stock.position.set(0, -0.01, 0.15);
        weaponGroup.add(stock);

        // 枪托底部（略宽）
        const stockEnd = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.1, 0.04), woodMat);
        stockEnd.position.set(0, -0.015, 0.26);
        weaponGroup.add(stockEnd);

        // 木质护木
        const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.055, 0.18), woodMat);
        handguard.position.set(0, -0.005, -0.32);
        weaponGroup.add(handguard);

        // 准星
        const frontSight = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.035, 0.008), metalMat);
        frontSight.position.set(0, 0.04, -0.7);
        weaponGroup.add(frontSight);

        // 后准星
        const rearSight = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.025, 0.008), metalMat);
        rearSight.position.set(0, 0.035, -0.06);
        weaponGroup.add(rearSight);

        // 握把
        const grip = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.08, 0.03), woodMat);
        grip.position.set(0, -0.06, 0.02);
        grip.rotation.x = -0.25;
        weaponGroup.add(grip);

        // 扳机护圈
        const triggerGuard = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.008, 0.04), metalMat);
        triggerGuard.position.set(0, -0.035, -0.01);
        weaponGroup.add(triggerGuard);

        // 枪口制退器
        const muzzleBrake = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.04), darkMetalMat);
        muzzleBrake.position.set(0, 0.01, -0.73);
        weaponGroup.add(muzzleBrake);

        // 侧面导气杆
        const gasTube = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.015, 0.25), orangeMat);
        gasTube.position.set(0.025, 0.02, -0.3);
        weaponGroup.add(gasTube);

        // 设置武器在摄像机空间中的位置 — 屏幕右下方
        weaponGroup.position.copy(this.weaponBasePos);
        weaponGroup.rotation.set(0, 0, 0);

        this.weaponModel = weaponGroup;
        this.camera.add(weaponGroup);
    }

    createCharacter(color, gunColor) {
        const group = new THREE.Group();
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.0, 0.35), new THREE.MeshLambertMaterial({ color }));
        body.position.y = 0.1;
        body.castShadow = true;
        group.add(body);
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.45), new THREE.MeshLambertMaterial({ color: 0xDEB887 }));
        head.position.y = 0.85;
        head.castShadow = true;
        group.add(head);
        const legL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.5, 0.2), new THREE.MeshLambertMaterial({ color: 0x333366 }));
        legL.position.set(-0.15, -0.55, 0);
        group.add(legL);
        const legR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.5, 0.2), new THREE.MeshLambertMaterial({ color: 0x333366 }));
        legR.position.set(0.15, -0.55, 0);
        group.add(legR);
        const gun = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.5), new THREE.MeshLambertMaterial({ color: gunColor || 0x222222 }));
        gun.position.set(0.35, 0.2, -0.3);
        group.add(gun);
        return group;
    }

    spawnEnemy() {
        if (this.enemies.length >= this.maxEnemies) return;
        const sp = this.getMapSpawn();
        const group = this.createCharacter(0xCC3333, 0x111111);
        const angle = Math.random() * Math.PI * 2;
        const dist = 15 + Math.random() * 20;
        group.position.set(
            this.player.position.x + Math.cos(angle) * dist,
            1.6,
            this.player.position.z + Math.sin(angle) * dist
        );
        group.position.x = Math.max(sp.min, Math.min(sp.max, group.position.x));
        group.position.z = Math.max(sp.min, Math.min(sp.max, group.position.z));
        group.userData = {
            team: 'enemy', health: 100, maxHealth: 100,
            speed: 2.5 + Math.random() * 1.5,
            state: 'patrol', stateTimer: 0,
            shootCooldown: 1.0 + Math.random() * 0.5, lastShootTime: 0,
            patrolDir: new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize(),
            body: group.children[0], head: group.children[1],
            legL: group.children[2], legR: group.children[3],
            animTime: 0, name: this.randomName()
        };
        this.scene.add(group);
        this.enemies.push(group);
    }

    spawnTeammate() {
        if (this.teammates.length >= this.maxTeammates) return;
        const group = this.createCharacter(0x3366CC, 0x222244);
        const angle = Math.random() * Math.PI * 2;
        const dist = 3 + Math.random() * 6;
        group.position.set(this.player.position.x + Math.cos(angle) * dist, 1.6, this.player.position.z + Math.sin(angle) * dist);
        group.userData = {
            team: 'ally', health: 100, maxHealth: 100,
            speed: 3.0, state: 'follow', stateTimer: 0,
            shootCooldown: 0.8 + Math.random() * 0.4, lastShootTime: 0,
            patrolDir: new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize(),
            body: group.children[0], head: group.children[1],
            legL: group.children[2], legR: group.children[3],
            animTime: 0, name: this.randomAllyName()
        };
        this.scene.add(group);
        this.teammates.push(group);
    }

    randomName() {
        const n = ['Bot_Alex', 'Bot_Kira', 'Bot_Max', 'Bot_Zoe', 'Bot_Jack', 'Bot_Nova', 'Bot_Rex', 'Bot_Luna', 'Bot_Vex', 'Bot_Echo', 'Bot_Dash', 'Bot_Ace'];
        return n[Math.floor(Math.random() * n.length)];
    }

    randomAllyName() {
        const n = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot'];
        return n[Math.floor(Math.random() * n.length)];
    }

    createBullet(from, dir, speed, damage, owner) {
        const color = owner === 'player' ? 0xFFFF44 : owner === 'ally' ? 0x4488FF : 0xFF4444;
        const geo = new THREE.BoxGeometry(0.08, 0.08, 0.3);
        const mat = new THREE.MeshBasicMaterial({ color });
        const bullet = new THREE.Mesh(geo, mat);
        bullet.position.copy(from);
        const target = from.clone().add(dir.clone().multiplyScalar(100));
        bullet.lookAt(target);
        bullet.userData = { velocity: dir.clone().multiplyScalar(speed), lifetime: 1.5, damage, owner };
        this.scene.add(bullet);
        if (owner === 'player') this.bullets.push(bullet);
        else if (owner === 'ally') this.allyBullets.push(bullet);
        else this.enemyBullets.push(bullet);
    }

    // [FIX] 射击时添加武器后坐力
    playerShoot() {
        if (this.state !== 'playing' || !this.isPointerLocked || this.player.ammo <= 0 || this.reloading) return;
        const now = performance.now() / 1000;
        if (now - this.lastShootTime < this.shootCooldown) return;
        this.lastShootTime = now;
        this.player.ammo--;
        this.updateHUD();

        const dir = new THREE.Vector3(0, 0, -1).applyEuler(this.player.direction);
        this.createBullet(this.camera.position.clone(), dir, 60, 25, 'player');
        this.showMuzzleFlash();
        this.applyWeaponRecoil();
    }

    showMuzzleFlash() {
        const dir = new THREE.Vector3(0, 0, -1).applyEuler(this.player.direction);
        this.muzzleFlash.position.copy(this.camera.position).add(dir.clone().multiplyScalar(1.2));
        this.muzzleFlash.lookAt(this.camera.position.clone().add(dir.clone().multiplyScalar(100)));
        this.muzzleFlash.visible = true;
        this.muzzleFlashLight.position.copy(this.muzzleFlash.position);
        this.muzzleFlashLight.visible = true;
        setTimeout(() => {
            this.muzzleFlash.visible = false;
            this.muzzleFlashLight.visible = false;
        }, 50);
    }

    // [FIX] 新增：武器后坐力动画
    applyWeaponRecoil() {
        if (!this.weaponModel) return;
        this.weaponRecoilTime = 0.08;
        // 后坐力：枪向后跳 + 向上抬
        this.weaponModel.position.z = this.weaponBasePos.z + 0.06;
        this.weaponModel.position.y = this.weaponBasePos.y + 0.02;
        this.weaponModel.rotation.x = -0.1;
    }

    // [FIX] 新增：每帧更新武器动画（后坐力恢复 + 换弹动画）
    updateWeapon(delta) {
        if (!this.weaponModel) return;

        if (this.reloading) {
            // 换弹动画
            this.reloadTimer -= delta;
            const progress = 1 - (this.reloadTimer / this.reloadDuration);

            if (progress < 0.2) {
                // 阶段1：武器下移
                const t = progress / 0.2;
                this.weaponModel.position.y = this.weaponBasePos.y - t * 0.3;
                this.weaponModel.rotation.x = t * 0.3;
            } else if (progress < 0.5) {
                // 阶段2：保持在低位（换弹匣）
                this.weaponModel.position.y = this.weaponBasePos.y - 0.3;
                this.weaponModel.rotation.x = 0.3;
            } else if (progress < 0.7) {
                // 阶段3：拉栓
                this.weaponModel.position.y = this.weaponBasePos.y - 0.3;
                this.weaponModel.rotation.x = 0.3;
                this.weaponModel.position.z = this.weaponBasePos.z + 0.03;
            } else if (progress < 1.0) {
                // 阶段4：恢复原位
                const t = (progress - 0.7) / 0.3;
                this.weaponModel.position.y = this.weaponBasePos.y - 0.3 * (1 - t);
                this.weaponModel.rotation.x = 0.3 * (1 - t);
                this.weaponModel.position.z = this.weaponBasePos.z + 0.03 * (1 - t);
            }

            if (this.reloadTimer <= 0) {
                this.reloading = false;
                this.weaponModel.position.copy(this.weaponBasePos);
                this.weaponModel.rotation.set(0, 0, 0);
                // 实际换弹
                const needed = this.player.maxAmmo - this.player.ammo;
                const toLoad = Math.min(needed, this.player.reserveAmmo);
                this.player.ammo += toLoad;
                this.player.reserveAmmo -= toLoad;
                this.updateHUD();
            }
        } else if (this.weaponRecoilTime > 0) {
            this.weaponRecoilTime -= delta;
        } else {
            // 后坐力平滑恢复
            this.weaponModel.position.z += (this.weaponBasePos.z - this.weaponModel.position.z) * 12 * delta;
            this.weaponModel.position.y += (this.weaponBasePos.y - this.weaponModel.position.y) * 12 * delta;
            this.weaponModel.rotation.x += (0 - this.weaponModel.rotation.x) * 12 * delta;
        }
    }

    enemyShoot(enemy, targetPos) {
        const now = performance.now() / 1000;
        if (now - enemy.userData.lastShootTime < enemy.userData.shootCooldown) return;
        if (!this.canSeeTarget(enemy.position, targetPos)) return;
        enemy.userData.lastShootTime = now;
        const dir = new THREE.Vector3().subVectors(targetPos, enemy.position).normalize();
        dir.x += (Math.random() - 0.5) * 0.15;
        dir.z += (Math.random() - 0.5) * 0.15;
        dir.normalize();
        const from = enemy.position.clone();
        from.y += 0.3;
        this.createBullet(from, dir, 35, 8, 'enemy');
    }

    allyShoot(ally, target) {
        const now = performance.now() / 1000;
        if (now - ally.userData.lastShootTime < ally.userData.shootCooldown) return;
        if (!this.canSeeTarget(ally.position, target.position)) return;
        ally.userData.lastShootTime = now;
        const dir = new THREE.Vector3().subVectors(target.position, ally.position).normalize();
        dir.x += (Math.random() - 0.5) * 0.18;
        dir.z += (Math.random() - 0.5) * 0.18;
        dir.normalize();
        const from = ally.position.clone();
        from.y += 0.3;
        this.createBullet(from, dir, 40, 12, 'ally');
    }

    // [FIX] 换弹改为带动画的延迟换弹
    reload() {
        if (this.state !== 'playing' || this.reloading) return;
        if (this.player.ammo === this.player.maxAmmo || this.player.reserveAmmo <= 0) return;
        this.reloading = true;
        this.reloadTimer = this.reloadDuration;
    }

    takeDamage(amount) {
        this.player.health -= amount;
        const overlay = document.getElementById('damage-overlay');
        overlay.classList.add('show');
        setTimeout(() => overlay.classList.remove('show'), 200);
        this.updateHUD();
        if (this.player.health <= 0) {
            this.player.health = 0;
            this.gameOver();
        }
    }

    showHitmarker() {
        const hm = document.getElementById('hitmarker');
        hm.classList.add('show');
        setTimeout(() => hm.classList.remove('show'), 150);
    }

    addKillfeed(msg) {
        const kf = document.getElementById('killfeed');
        const el = document.createElement('div');
        el.className = 'kill-msg';
        el.textContent = msg;
        kf.appendChild(el);
        setTimeout(() => el.remove(), 3000);
        if (kf.children.length > 5) kf.firstChild.remove();
    }

    gameOver() {
        this.state = 'gameover';
        document.exitPointerLock();
        const elapsed = Math.floor((performance.now() / 1000) - this.startTime);
        document.getElementById('final-score').textContent = this.player.score;
        document.getElementById('final-kills').textContent = this.player.kills;
        document.getElementById('final-time').textContent = elapsed + 's';
        document.getElementById('gameover-screen').style.display = 'flex';
        document.getElementById('ui').style.display = 'none';
    }

    startGame() {
        this.clearScene();
        this.buildMap(this.selectedMap);
        this.player.health = this.player.maxHealth;
        this.player.ammo = this.player.maxAmmo;
        this.player.reserveAmmo = 90;
        this.player.score = 0;
        this.player.kills = 0;
        this.player.position.copy(this.findSafeSpawn());
        this.player.direction.set(0, 0, 0);
        this.reloading = false;
        this.reloadTimer = 0;
        if (this.weaponModel) {
            this.weaponModel.position.copy(this.weaponBasePos);
            this.weaponModel.rotation.set(0, 0, 0);
        }
        for (let i = 0; i < this.maxEnemies; i++) this.spawnEnemy();
        for (let i = 0; i < this.maxTeammates; i++) this.spawnTeammate();
        this.startTime = performance.now() / 1000;
        this.state = 'playing';
        this.updateHUD();
        document.getElementById('gameover-screen').style.display = 'none';
        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('pause-screen').style.display = 'none';
        document.getElementById('ui').style.display = 'block';
        document.getElementById('map-name-display').textContent = this.getMapDisplayName();
        setTimeout(() => this.tryLockPointer(), 100);
    }

    getMapDisplayName() {
        const map = document.querySelector('.map-card.selected');
        return map ? map.querySelector('.map-name').textContent : 'Arena';
    }

    setupUI() {
        this.updateHUD();
    }

    updateHUD() {
        const p = this.player;
        document.getElementById('score-value').textContent = p.score;
        document.getElementById('kills-value').textContent = p.kills;
        document.getElementById('ammo-current').textContent = p.ammo;
        document.getElementById('ammo-reserve').textContent = p.reserveAmmo;
        const hpPct = Math.max(0, p.health / p.maxHealth * 100);
        document.getElementById('hp-bar-fill').style.width = hpPct + '%';
        document.getElementById('hp-text').textContent = Math.max(0, p.health);
        const hpFill = document.getElementById('hp-bar-fill');
        const hpText = document.getElementById('hp-text');
        const hpIcon = document.getElementById('hp-icon');
        if (hpPct <= 30) {
            hpFill.classList.add('low');
            hpText.style.color = '#ff4444';
            hpIcon.style.color = '#ff4444';
        } else {
            hpFill.classList.remove('low');
            hpText.style.color = '#00ff00';
            hpIcon.style.color = '#00ff00';
        }
    }

    setupEventListeners() {
        document.addEventListener('keydown', e => this.onKeyDown(e));
        document.addEventListener('keyup', e => this.onKeyUp(e));
        document.addEventListener('mousemove', e => this.onMouseMove(e));
        document.addEventListener('mousedown', e => {
            if (e.button === 0) this.playerShoot();
        });
        document.addEventListener('pointerlockchange', () => {
            this.locking = false;
            this.isPointerLocked = !!document.pointerLockElement;
            if (this.state === 'playing' && !this.isPointerLocked && !this.locking) {
                this.state = 'paused';
                document.getElementById('pause-screen').style.display = 'flex';
            }
        });
        document.getElementById('gameCanvas').addEventListener('click', () => {
            if (this.state === 'paused') {
                this.state = 'playing';
                document.getElementById('pause-screen').style.display = 'none';
                this.tryLockPointer();
            }
        });
        document.getElementById('pause-screen').addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.state === 'paused') {
                this.state = 'playing';
                document.getElementById('pause-screen').style.display = 'none';
                this.tryLockPointer();
            }
        });
        document.querySelectorAll('.map-card').forEach(card => {
            card.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelectorAll('.map-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.selectedMap = card.dataset.map;
            });
        });
        document.getElementById('start-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.startGame();
        });
        document.getElementById('restart-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            document.getElementById('gameover-screen').style.display = 'none';
            document.getElementById('start-screen').style.display = 'flex';
        });
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    onKeyDown(e) {
        if (this.state !== 'playing') return;
        switch (e.key.toLowerCase()) {
            case 'w': this.keys.w = true; break;
            case 'a': this.keys.a = true; break;
            case 's': this.keys.s = true; break;
            case 'd': this.keys.d = true; break;
            case 'r': this.reload(); break;
        }
    }

    onKeyUp(e) {
        switch (e.key.toLowerCase()) {
            case 'w': this.keys.w = false; break;
            case 'a': this.keys.a = false; break;
            case 's': this.keys.s = false; break;
            case 'd': this.keys.d = false; break;
        }
    }

    onMouseMove(e) {
        if (!this.isPointerLocked || this.state !== 'playing') return;
        this.player.direction.y -= e.movementX * 0.002;
        this.player.direction.x -= e.movementY * 0.002;
        this.player.direction.x = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.player.direction.x));
    }

    updatePlayer(delta) {
        const dir = new THREE.Vector3();
        if (this.keys.w) dir.z -= 1;
        if (this.keys.s) dir.z += 1;
        if (this.keys.a) dir.x -= 1;
        if (this.keys.d) dir.x += 1;
        if (dir.lengthSq() > 0) {
            dir.normalize();
            dir.applyEuler(new THREE.Euler(0, this.player.direction.y, 0, 'YXZ'));
            const testX = this.player.position.clone();
            testX.x += dir.x * this.player.speed * delta;
            if (!this.bulletHitsWall(testX)) this.player.position.x = testX.x;
            const testZ = this.player.position.clone();
            testZ.z += dir.z * this.player.speed * delta;
            if (!this.bulletHitsWall(testZ)) this.player.position.z = testZ.z;
        }
        const sp = this.getMapSpawn();
        this.player.position.x = Math.max(sp.min, Math.min(sp.max, this.player.position.x));
        this.player.position.z = Math.max(sp.min, Math.min(sp.max, this.player.position.z));
        this.camera.position.copy(this.player.position);
        this.camera.rotation.copy(this.player.direction);
    }

    findNearestEnemy(pos, maxDist) {
        let nearest = null, minDist = maxDist;
        for (const e of this.enemies) {
            const d = pos.distanceTo(e.position);
            if (d < minDist) { minDist = d; nearest = e; }
        }
        return nearest;
    }

    updateTeammates(delta) {
        for (const ally of this.teammates) {
            const ud = ally.userData;
            ud.stateTimer += delta;
            ud.animTime += delta;
            const nearestEnemy = this.findNearestEnemy(ally.position, 30);
            const toPlayer = new THREE.Vector3().subVectors(this.player.position, ally.position);
            toPlayer.y = 0;
            const distToPlayer = toPlayer.length();
            if (nearestEnemy) {
                ud.state = 'combat';
                const toEnemy = new THREE.Vector3().subVectors(nearestEnemy.position, ally.position);
                toEnemy.y = 0;
                const distToEnemy = toEnemy.length();
                if (distToEnemy > 12) {
                    const m = toEnemy.clone().normalize();
                    ally.position.x += m.x * ud.speed * delta;
                    ally.position.z += m.z * ud.speed * delta;
                }
                const ld = toEnemy.clone();
                ld.y = 0;
                if (ld.lengthSq() > 0.01) ally.rotation.y = Math.atan2(ld.x, ld.z);
                this.allyShoot(ally, nearestEnemy);
            } else {
                ud.state = 'follow';
                if (distToPlayer > 6) {
                    const m = toPlayer.clone().normalize();
                    ally.position.x += m.x * ud.speed * 0.8 * delta;
                    ally.position.z += m.z * ud.speed * 0.8 * delta;
                } else if (distToPlayer < 3) {
                    const m = toPlayer.clone().normalize().negate();
                    ally.position.x += m.x * ud.speed * 0.5 * delta;
                    ally.position.z += m.z * ud.speed * 0.5 * delta;
                }
                if (distToPlayer > 1) {
                    const ld = toPlayer.clone();
                    ld.y = 0;
                    if (ld.lengthSq() > 0.01) ally.rotation.y = Math.atan2(ld.x, ld.z);
                }
            }
            const sp = this.getMapSpawn();
            ally.position.x = Math.max(sp.min, Math.min(sp.max, ally.position.x));
            ally.position.z = Math.max(sp.min, Math.min(sp.max, ally.position.z));
            if (ud.legL && ud.legR) {
                const moving = ud.state === 'combat' ? true : distToPlayer > 6;
                const swing = moving ? Math.sin(ud.animTime * 8) * 0.3 : 0;
                ud.legL.rotation.x = swing;
                ud.legR.rotation.x = -swing;
            }
        }
    }

    updateEnemies(delta) {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            const ud = enemy.userData;
            ud.stateTimer += delta;
            ud.animTime += delta;
            const distToPlayer = enemy.position.distanceTo(this.player.position);
            let nearestTarget = null, nearestDist = Infinity, nearestIsPlayer = false;
            if (distToPlayer < 30) {
                nearestTarget = this.player.position;
                nearestDist = distToPlayer;
                nearestIsPlayer = true;
            }
            for (const ally of this.teammates) {
                const d = enemy.position.distanceTo(ally.position);
                if (d < nearestDist && d < 30) {
                    nearestDist = d;
                    nearestTarget = ally.position;
                    nearestIsPlayer = false;
                }
            }
            if (nearestTarget && nearestDist < 20) ud.state = 'attack';
            else if (nearestTarget && nearestDist < 35) ud.state = 'chase';
            else ud.state = 'patrol';

            if (ud.state === 'patrol') {
                enemy.position.x += ud.patrolDir.x * ud.speed * 0.6 * delta;
                enemy.position.z += ud.patrolDir.z * ud.speed * 0.6 * delta;
                if (ud.stateTimer > 3 + Math.random() * 2) {
                    ud.patrolDir.set(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
                    ud.stateTimer = 0;
                }
            } else if (ud.state === 'chase') {
                const m = new THREE.Vector3().subVectors(nearestTarget, enemy.position);
                m.y = 0; m.normalize();
                enemy.position.x += m.x * ud.speed * delta;
                enemy.position.z += m.z * ud.speed * delta;
            } else if (ud.state === 'attack') {
                const toTarget = new THREE.Vector3().subVectors(nearestTarget, enemy.position);
                toTarget.y = 0;
                if (toTarget.length() > 10) {
                    const m = toTarget.clone().normalize();
                    enemy.position.x += m.x * ud.speed * 0.7 * delta;
                    enemy.position.z += m.z * ud.speed * 0.7 * delta;
                }
                this.enemyShoot(enemy, nearestIsPlayer ? this.player.position : nearestTarget);
            }

            const sp = this.getMapSpawn();
            enemy.position.x = Math.max(sp.min, Math.min(sp.max, enemy.position.x));
            enemy.position.z = Math.max(sp.min, Math.min(sp.max, enemy.position.z));
            const lt = nearestTarget || new THREE.Vector3().copy(enemy.position).add(ud.patrolDir);
            const ld = new THREE.Vector3().subVectors(lt, enemy.position);
            ld.y = 0;
            if (ld.lengthSq() > 0.01) enemy.rotation.y = Math.atan2(ld.x, ld.z);
            if (ud.legL && ud.legR) {
                const moving = ud.state !== 'attack' || nearestDist > 10;
                const swing = moving ? Math.sin(ud.animTime * 8) * 0.3 : 0;
                ud.legL.rotation.x = swing;
                ud.legR.rotation.x = -swing;
            }
        }
    }

    processBullets(delta) {
        const allBullets = [
            ...this.bullets.map(b => ({ b, group: 'player' })),
            ...this.allyBullets.map(b => ({ b, group: 'ally' })),
            ...this.enemyBullets.map(b => ({ b, group: 'enemy' }))
        ];
        for (const { b, group } of allBullets) {
            b.position.add(b.userData.velocity.clone().multiplyScalar(delta));
            b.userData.lifetime -= delta;
            if (b.userData.lifetime <= 0) {
                this.scene.remove(b);
                this.removeBullet(b, group);
                continue;
            }
            if (this.bulletHitsWall(b.position)) {
                const fx = new THREE.PointLight(0xFFAA00, 1, 3);
                fx.position.copy(b.position);
                this.scene.add(fx);
                setTimeout(() => this.scene.remove(fx), 60);
                this.scene.remove(b);
                this.removeBullet(b, group);
                continue;
            }
            if (group === 'player' || group === 'ally') {
                for (let j = this.enemies.length - 1; j >= 0; j--) {
                    const enemy = this.enemies[j];
                    if (b.position.distanceTo(enemy.position) < 1.2) {
                        enemy.userData.health -= b.userData.damage;
                        if (group === 'player') this.showHitmarker();
                        const fx = new THREE.PointLight(0xFF0000, 2, 4);
                        fx.position.copy(b.position);
                        this.scene.add(fx);
                        setTimeout(() => this.scene.remove(fx), 80);
                        this.scene.remove(b);
                        this.removeBullet(b, group);
                        if (enemy.userData.health <= 0) {
                            const killer = group === 'player' ? 'You' : (this.teammates[0]?.userData.name || 'Ally');
                            this.addKillfeed(`${killer} ▸ ${enemy.userData.name}`);
                            if (group === 'player') {
                                this.player.kills++;
                                this.player.score += 100;
                                this.updateHUD();
                            }
                            this.scene.remove(enemy);
                            this.enemies.splice(j, 1);
                            setTimeout(() => this.spawnEnemy(), 2000 + Math.random() * 2000);
                        }
                        break;
                    }
                }
            } else {
                for (let k = this.teammates.length - 1; k >= 0; k--) {
                    const ally = this.teammates[k];
                    if (b.position.distanceTo(ally.position) < 1.2) {
                        ally.userData.health -= b.userData.damage;
                        this.scene.remove(b);
                        this.removeBullet(b, group);
                        if (ally.userData.health <= 0) {
                            this.addKillfeed(`${this.enemies[0]?.userData.name || 'Enemy'} ▸ ${ally.userData.name}`);
                            this.scene.remove(ally);
                            this.teammates.splice(k, 1);
                            setTimeout(() => this.spawnTeammate(), 3000);
                        }
                        break;
                    }
                }
                if (b.parent) {
                    const distToPlayer = b.position.distanceTo(this.player.position);
                    if (distToPlayer < 0.8) {
                        this.takeDamage(b.userData.damage);
                        this.scene.remove(b);
                        this.removeBullet(b, group);
                    }
                }
            }
        }
    }

    removeBullet(bullet, group) {
        const arr = group === 'player' ? this.bullets : group === 'ally' ? this.allyBullets : this.enemyBullets;
        const idx = arr.indexOf(bullet);
        if (idx !== -1) arr.splice(idx, 1);
    }

    // [FIX] 动画循环中添加武器更新
    animate() {
        requestAnimationFrame(() => this.animate());
        const delta = Math.min(this.clock.getDelta(), 0.1);
        if (this.state === 'playing') {
            this.updatePlayer(delta);
            this.updateEnemies(delta);
            this.updateTeammates(delta);
            this.processBullets(delta);
            this.updateWeapon(delta); // [FIX] 每帧更新武器动画
        }
        this.renderer.render(this.scene, this.camera);
    }
}

window.addEventListener('load', () => {
    window.game = new Game();
});
