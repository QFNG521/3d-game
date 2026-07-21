import * as THREE from 'three';

const BILL_WIDTH = 1.535;
const BILL_HEIGHT = 0.6525;
const COLS = 48;
const ROWS = 28;
const DRAG_RADIUS = 0.15;
const MAX_DRAG_DISTANCE = 1.5;
const CONSTRAINT_ITERATIONS = 14;
const GRAVITY = new THREE.Vector3(0, -9.8, 0);
const FLOOR_Y = 0.001;
const FRICTION = 0.95;
const MAX_SPEED = 0.5;
const WIND_FREQUENCY = 2.0;
const WIND_SPATIAL_FREQUENCY = 4.0;
const WIND_AMPLITUDE = 0.3;

const tempVec3a = new THREE.Vector3();
const tempVec3b = new THREE.Vector3();
const tempVec3c = new THREE.Vector3();
const tempVec3d = new THREE.Vector3();
const tempDelta = new THREE.Vector3();

function smoothstep(edge0, edge1, x) {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
}

class Particle {
    constructor(x, y, z) {
        this.position = new THREE.Vector3(x, y, z);
        this.oldPosition = new THREE.Vector3(x, y, z);
        this.acceleration = new THREE.Vector3(0, 0, 0);
        this.pinned = false;
        this.mass = 1.0;
    }
}

export class ClothSimulation {
    constructor(width = BILL_WIDTH, height = BILL_HEIGHT, cols = COLS, rows = ROWS) {
        this.width = width;
        this.height = height;
        this.cols = cols;
        this.rows = rows;
        this.particleCount = cols * rows;

        this.particles = [];
        this.constraints = [];
        this.drag = null;
        this.currentHitPoint = null;
        this._positionsBuffer = new Float32Array(this.particleCount * 3);

        this._initParticles();
        this._initConstraints();
    }

    _initParticles() {
        const dx = this.width / (this.cols - 1);
        const dz = this.height / (this.rows - 1);

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const x = c * dx - this.width * 0.5;
                const z = r * dz - this.height * 0.5;
                this.particles.push(new Particle(x, FLOOR_Y, z));
            }
        }
    }

    _particleIndex(col, row) {
        return row * this.cols + col;
    }

    _initConstraints() {
        const addConstraint = (i, j, type) => {
            const pa = this.particles[i];
            const pb = this.particles[j];
            const rest = pa.position.distanceTo(pb.position);
            this.constraints.push(i, j, rest, type);
        };

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const idx = this._particleIndex(c, r);

                if (c < this.cols - 1) addConstraint(idx, this._particleIndex(c + 1, r), 0);
                if (r < this.rows - 1) addConstraint(idx, this._particleIndex(c, r + 1), 0);

                if (c < this.cols - 1 && r < this.rows - 1)
                    addConstraint(idx, this._particleIndex(c + 1, r + 1), 1);
                if (c > 0 && r < this.rows - 1)
                    addConstraint(idx, this._particleIndex(c - 1, r + 1), 1);

                if (c < this.cols - 2) addConstraint(idx, this._particleIndex(c + 2, r), 2);
                if (r < this.rows - 2) addConstraint(idx, this._particleIndex(c, r + 2), 2);

                if (c < this.cols - 4) addConstraint(idx, this._particleIndex(c + 4, r), 3);
                if (r < this.rows - 4) addConstraint(idx, this._particleIndex(c, r + 4), 3);
            }
        }
    }

    update(dt, windActive = false, time = 0) {
        if (this.drag && this.drag.active) this._applyDrag();

        const windDir = tempVec3a.set(0.2, 0.08, 1.0).normalize();
        const dtSq = dt * dt;

        for (let pi = 0; pi < this.particleCount; pi++) {
            const p = this.particles[pi];
            if (p.pinned) continue;

            const hasHighWeight = this.drag && this.drag.active && this.drag.weights.has(pi) && this.drag.weights.get(pi) > 0.5;
            if (hasHighWeight) continue;

            p.acceleration.copy(GRAVITY);

            if (windActive) {
                const sinVal = Math.sin(time * WIND_FREQUENCY + p.position.x * WIND_SPATIAL_FREQUENCY);
                const cosVal = Math.cos(time * WIND_FREQUENCY * 1.3 + p.position.z * WIND_SPATIAL_FREQUENCY * 0.7);
                tempVec3b.copy(windDir).multiplyScalar(sinVal * cosVal * WIND_AMPLITUDE);
                p.acceleration.add(tempVec3b);
            }

            tempDelta.copy(p.position).sub(p.oldPosition).multiplyScalar(0.99);
            tempVec3c.copy(p.acceleration).multiplyScalar(dtSq);
            p.oldPosition.copy(p.position);
            p.position.add(tempDelta).add(tempVec3c);

            this._clampFloor(p);

            tempVec3d.copy(p.position).sub(p.oldPosition);
            if (tempVec3d.lengthSq() > MAX_SPEED * MAX_SPEED) {
                tempVec3d.normalize().multiplyScalar(MAX_SPEED);
                p.oldPosition.copy(p.position).sub(tempVec3d);
            }
        }

        if (windActive) this._pinCorners();

        for (let iter = 0; iter < CONSTRAINT_ITERATIONS; iter++) {
            this._solveConstraints();
            for (let pi = 0; pi < this.particleCount; pi++) {
                this._clampFloor(this.particles[pi]);
            }
        }

        if (this.drag && this.drag.active) this._applyDrag();

        for (let pi = 0; pi < this.particleCount; pi++) {
            this._clampFloor(this.particles[pi]);
        }
    }

    _applyDrag() {
        if (!this.drag || !this.drag.active) return;

        for (const [idx, weight] of this.drag.weights) {
            const p = this.particles[idx];
            const startPos = this.drag.startPositions.get(idx);
            if (!startPos) continue;

            tempVec3a.copy(this.currentHitPoint).sub(this.drag.startHitPoint).multiplyScalar(weight);
            tempVec3b.copy(startPos).add(tempVec3a);

            tempVec3c.copy(tempVec3b).sub(this.drag.planeOrigin);
            const dot = tempVec3c.dot(this.drag.planeNormal);
            tempVec3a.copy(this.drag.planeNormal).multiplyScalar(-dot);
            tempVec3b.add(tempVec3a);

            tempVec3d.copy(tempVec3b).sub(this.drag.planeOrigin);
            if (tempVec3d.lengthSq() > MAX_DRAG_DISTANCE * MAX_DRAG_DISTANCE) {
                tempVec3d.normalize().multiplyScalar(MAX_DRAG_DISTANCE);
                tempVec3b.copy(this.drag.planeOrigin).add(tempVec3d);
            }

            p.position.copy(tempVec3b);
            p.oldPosition.copy(tempVec3b);
            p.pinned = true;
        }
    }

    _solveConstraints() {
        const data = this.constraints;
        const len = data.length;

        for (let ci = 0; ci < len; ci += 4) {
            const i = data[ci];
            const j = data[ci + 1];
            const rest = data[ci + 2];
            const type = data[ci + 3];

            const pa = this.particles[i];
            const pb = this.particles[j];

            const hasHighWeightA = this.drag && this.drag.active && this.drag.weights.has(i) && this.drag.weights.get(i) > 0.5;
            const hasHighWeightB = this.drag && this.drag.active && this.drag.weights.has(j) && this.drag.weights.get(j) > 0.5;
            if (hasHighWeightA && hasHighWeightB) continue;

            tempVec3a.copy(pb.position).sub(pa.position);
            const currentDist = tempVec3a.length();
            if (currentDist < 1e-6) continue;

            let stiffness;
            switch (type) {
                case 0: stiffness = 0.9; break;
                case 1: stiffness = 0.85; break;
                case 2: stiffness = 0.98; break;
                case 3: stiffness = 0.95; break;
                default: stiffness = 0.9;
            }

            const correction = (currentDist - rest) / currentDist * stiffness * 0.5;
            tempVec3a.multiplyScalar(correction);

            if (!pa.pinned && !hasHighWeightA) pa.position.add(tempVec3a);
            if (!pb.pinned && !hasHighWeightB) pb.position.sub(tempVec3a);
        }
    }

    _clampFloor(p) {
        if (p.position.y < FLOOR_Y) {
            p.position.y = FLOOR_Y;
            if (p.oldPosition.y < FLOOR_Y) p.oldPosition.y = FLOOR_Y;

            const vx = p.position.x - p.oldPosition.x;
            const vz = p.position.z - p.oldPosition.z;
            p.oldPosition.x = p.position.x - vx * FRICTION;
            p.oldPosition.z = p.position.z - vz * FRICTION;
            p.oldPosition.y = p.position.y;
        }
    }

    _pinCorners() {
        this.particles[this._particleIndex(0, 0)].pinned = true;
        this.particles[this._particleIndex(this.cols - 1, 0)].pinned = true;
        this.particles[this._particleIndex(0, this.rows - 1)].pinned = true;
        this.particles[this._particleIndex(this.cols - 1, this.rows - 1)].pinned = true;
    }

    startDrag(hitPoint, cameraPosition) {
        const planeNormal = tempVec3a.copy(cameraPosition).sub(hitPoint).normalize();

        const weights = new Map();
        const startPositions = new Map();

        for (let i = 0; i < this.particleCount; i++) {
            const p = this.particles[i];
            const dx = p.position.x - hitPoint.x;
            const dz = p.position.z - hitPoint.z;
            const dy = p.position.y - hitPoint.y;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            if (dist < DRAG_RADIUS) {
                const w = smoothstep(DRAG_RADIUS, 0, dist);
                weights.set(i, w);
                startPositions.set(i, p.position.clone());
            }
        }

        this.drag = {
            active: true,
            planeOrigin: hitPoint.clone(),
            planeNormal: planeNormal.clone(),
            startHitPoint: hitPoint.clone(),
            startPositions,
            weights,
        };

        this.currentHitPoint = hitPoint.clone();
    }

    moveDrag(currentHitPoint) {
        if (!this.drag || !this.drag.active) return;
        this.currentHitPoint.copy(currentHitPoint);
    }

    endDrag() {
        if (!this.drag || !this.drag.active) return;
        for (const [idx] of this.drag.weights) {
            this.particles[idx].pinned = false;
        }
        this.drag.active = false;
        this.drag = null;
        this.currentHitPoint = null;
    }

    reset() {
        const dx = this.width / (this.cols - 1);
        const dz = this.height / (this.rows - 1);

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const idx = this._particleIndex(c, r);
                const p = this.particles[idx];
                p.position.set(c * dx - this.width * 0.5, FLOOR_Y, r * dz - this.height * 0.5);
                p.oldPosition.copy(p.position);
                p.acceleration.set(0, 0, 0);
                p.pinned = false;
            }
        }

        this.drag = null;
        this.currentHitPoint = null;
    }

    getPositions() {
        const buf = this._positionsBuffer;
        for (let i = 0; i < this.particleCount; i++) {
            const p = this.particles[i];
            const i3 = i * 3;
            buf[i3] = p.position.x;
            buf[i3 + 1] = p.position.y;
            buf[i3 + 2] = p.position.z;
        }
        return buf;
    }
}
