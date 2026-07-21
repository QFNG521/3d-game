// sfx.js — WebAudio 程序化音效（零资源文件）
'use strict';

class SFX {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.enabled = true;
  }

  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.ctx.destination);
  }

  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }

  _env(gain, t0, a, d, peak = 1) {
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(peak, t0 + a);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d);
  }

  _noiseBuffer(dur) {
    const sr = this.ctx.sampleRate;
    const buf = this.ctx.createBuffer(1, sr * dur, sr);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  // 枪声：噪声脉冲 + 低频轰
  shoot(pitch = 1) {
    if (!this.ctx || !this.enabled) return;
    const t = this.ctx.currentTime;

    const src = this.ctx.createBufferSource();
    src.buffer = this._noiseBuffer(0.18);
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 900 * pitch; bp.Q.value = 0.8;
    const g = this.ctx.createGain();
    this._env(g, t, 0.002, 0.14, 0.9);
    src.connect(bp).connect(g).connect(this.master);
    src.start(t);

    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160 * pitch, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.12);
    const g2 = this.ctx.createGain();
    this._env(g2, t, 0.002, 0.13, 0.7);
    osc.connect(g2).connect(this.master);
    osc.start(t); osc.stop(t + 0.16);
  }

  dryFire() { this._click(1400, 0.03, 0.3); }
  _click(freq, dur, vol) {
    if (!this.ctx || !this.enabled) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'square'; osc.frequency.value = freq;
    const g = this.ctx.createGain();
    this._env(g, t, 0.001, dur, vol);
    osc.connect(g).connect(this.master);
    osc.start(t); osc.stop(t + dur + 0.02);
  }

  reload() {
    if (!this.ctx || !this.enabled) return;
    this._click(700, 0.04, 0.35);
    setTimeout(() => this._click(500, 0.04, 0.35), 250);
    setTimeout(() => this._click(1000, 0.05, 0.4), 700);
  }

  // 方块碎裂
  breakBlock() {
    if (!this.ctx || !this.enabled) return;
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this._noiseBuffer(0.2);
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.setValueAtTime(2500, t);
    lp.frequency.exponentialRampToValueAtTime(300, t + 0.18);
    const g = this.ctx.createGain();
    this._env(g, t, 0.003, 0.18, 0.6);
    src.connect(lp).connect(g).connect(this.master);
    src.start(t);
  }

  placeBlock() { this._click(300, 0.06, 0.45); }
  hitMarker() { this._click(2000, 0.03, 0.32); }
  kill() {
    this._click(500, 0.06, 0.4);
    setTimeout(() => this._click(760, 0.09, 0.4), 70);
  }

  // 爆炸
  explode() {
    if (!this.ctx || !this.enabled) return;
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this._noiseBuffer(0.9);
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(1800, t);
    lp.frequency.exponentialRampToValueAtTime(60, t + 0.8);
    const g = this.ctx.createGain();
    this._env(g, t, 0.004, 0.85, 1.2);
    src.connect(lp).connect(g).connect(this.master);
    src.start(t);

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(90, t);
    osc.frequency.exponentialRampToValueAtTime(28, t + 0.7);
    const g2 = this.ctx.createGain();
    this._env(g2, t, 0.004, 0.7, 0.9);
    osc.connect(g2).connect(this.master);
    osc.start(t); osc.stop(t + 0.8);
  }

  hurt() {
    if (!this.ctx || !this.enabled) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.18);
    const g = this.ctx.createGain();
    this._env(g, t, 0.003, 0.2, 0.5);
    osc.connect(g).connect(this.master);
    osc.start(t); osc.stop(t + 0.25);
  }

  zombieGroan(pitch = 1) {
    if (!this.ctx || !this.enabled) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(85 * pitch, t);
    osc.frequency.linearRampToValueAtTime(60 * pitch, t + 0.5);
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 420;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.18, t + 0.1);
    g.gain.linearRampToValueAtTime(0.0001, t + 0.55);
    osc.connect(lp).connect(g).connect(this.master);
    osc.start(t); osc.stop(t + 0.6);
  }

  waveStart() {
    if (!this.ctx || !this.enabled) return;
    [220, 277, 330].forEach((f, i) => {
      setTimeout(() => {
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        osc.type = 'square'; osc.frequency.value = f;
        const g = this.ctx.createGain();
        this._env(g, t, 0.01, 0.25, 0.22);
        osc.connect(g).connect(this.master);
        osc.start(t); osc.stop(t + 0.3);
      }, i * 130);
    });
  }

  uiClick() { this._click(900, 0.04, 0.3); }
  jump() { this._click(400, 0.05, 0.12); }
}

const sfx = new SFX();
