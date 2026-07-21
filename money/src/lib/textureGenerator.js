import * as THREE from 'three';

const W = 2048;
const H = Math.round(2048 * (2.61 / 6.14));
const S = 2.5;

function createCanvas() {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  return c;
}

function drawNoise(ctx, intensity = 15) {
  const imgData = ctx.getImageData(0, 0, W, H);
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * intensity;
    d[i] += n;
    d[i + 1] += n;
    d[i + 2] += n;
  }
  ctx.putImageData(imgData, 0, 0);
}

function drawBorder(ctx) {
  const m = 40 * S;
  const m2 = 60 * S;
  ctx.strokeStyle = '#0d2b06';
  ctx.lineWidth = 3 * S;
  ctx.strokeRect(m, m, W - m * 2, H - m * 2);
  ctx.lineWidth = 1.5 * S;
  ctx.strokeRect(m2, m2, W - m2 * 2, H - m2 * 2);

  for (let corner of [[m2, m2], [W - m2, m2], [m2, H - m2], [W - m2, H - m2]]) {
    ctx.beginPath();
    ctx.arc(corner[0], corner[1], 12 * S, 0, Math.PI * 2);
    ctx.fillStyle = '#0d2b06';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(corner[0], corner[1], 8 * S, 0, Math.PI * 2);
    ctx.fillStyle = '#f5f0c8';
    ctx.fill();
    for (let a = 0; a < 8; a++) {
      const angle = (a / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(corner[0], corner[1]);
      ctx.lineTo(corner[0] + Math.cos(angle) * 10 * S, corner[1] + Math.sin(angle) * 10 * S);
      ctx.strokeStyle = '#0d2b06';
      ctx.lineWidth = 0.8 * S;
      ctx.stroke();
    }
  }

  for (let x = m + 20 * S; x < W - m; x += 6 * S) {
    ctx.fillStyle = '#0d2b06';
    ctx.fillRect(x, m - 2 * S, 1 * S, 4 * S);
    ctx.fillRect(x, H - m - 2 * S, 1 * S, 4 * S);
  }
  for (let y = m + 20 * S; y < H - m; y += 6 * S) {
    ctx.fillStyle = '#0d2b06';
    ctx.fillRect(m - 2 * S, y, 4 * S, 1 * S);
    ctx.fillRect(W - m - 2 * S, y, 4 * S, 1 * S);
  }
}

function drawGuilloche(ctx, cx, cy, r1, r2, loops) {
  ctx.beginPath();
  for (let i = 0; i <= 360 * loops; i++) {
    const a = (i * Math.PI) / 180;
    const r = r1 + r2 * Math.sin(a * loops * 0.3);
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = 'rgba(13,43,6,0.2)';
  ctx.lineWidth = 0.5 * S;
  ctx.stroke();
}

function drawSeal(ctx, cx, cy, radius, letter) {
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < 32; i++) {
    const a = (i / 32) * Math.PI * 2;
    const r = (i % 2 === 0 ? 1 : 0.92) * radius;
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(13,43,6,0.08)';
  ctx.fill();
  ctx.strokeStyle = '#0d2b06';
  ctx.lineWidth = 2 * S;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.85, 0, Math.PI * 2);
  ctx.lineWidth = 1 * S;
  ctx.stroke();

  ctx.font = `bold ${28 * S}px serif`;
  ctx.fillStyle = '#0d2b06';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(letter, cx, cy);

  ctx.font = `${7 * S}px sans-serif`;
  ctx.fillStyle = '#0d2b06';
  const text = 'FEDERAL RESERVE';
  for (let i = 0; i < text.length; i++) {
    const a = -Math.PI / 2 + (i / text.length) * Math.PI;
    ctx.save();
    ctx.translate(cx + radius * 0.65 * Math.cos(a), cy + radius * 0.65 * Math.sin(a));
    ctx.rotate(a + Math.PI / 2);
    ctx.fillText(text[i], 0, 0);
    ctx.restore();
  }
  ctx.restore();
}

function drawCat(ctx, cx, cy, size) {
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, cy, size * 0.55, size * 0.65, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(13,43,6,0.05)';
  ctx.fill();
  ctx.strokeStyle = '#0d2b06';
  ctx.lineWidth = 2 * S;
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(cx, cy, size * 0.52, size * 0.62, 0, 0, Math.PI * 2);
  ctx.lineWidth = 0.8 * S;
  ctx.stroke();

  const hx = cx, hy = cy - size * 0.05;
  const headR = size * 0.35;
  ctx.beginPath();
  ctx.arc(hx, hy, headR, 0, Math.PI * 2);
  ctx.fillStyle = '#f0e8d0';
  ctx.fill();
  ctx.strokeStyle = '#0d2b06';
  ctx.lineWidth = 1.5 * S;
  ctx.stroke();

  const earW = headR * 0.45, earH = headR * 0.6;
  for (let side of [-1, 1]) {
    const ex = hx + side * headR * 0.55;
    const ey = hy - headR * 0.7;
    ctx.beginPath();
    ctx.moveTo(ex - earW * 0.5, ey + earH * 0.3);
    ctx.lineTo(ex, ey - earH * 0.5);
    ctx.lineTo(ex + earW * 0.5, ey + earH * 0.3);
    ctx.closePath();
    ctx.fillStyle = '#f0e8d0';
    ctx.fill();
    ctx.strokeStyle = '#0d2b06';
    ctx.lineWidth = 1.5 * S;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(ex - earW * 0.25, ey + earH * 0.1);
    ctx.lineTo(ex, ey - earH * 0.3);
    ctx.lineTo(ex + earW * 0.25, ey + earH * 0.1);
    ctx.closePath();
    ctx.fillStyle = '#e8a0a0';
    ctx.fill();
  }

  for (let side of [-1, 1]) {
    const ex = hx + side * headR * 0.32;
    const ey = hy + headR * 0.02;
    const eyeW = headR * 0.18, eyeH = headR * 0.22;
    ctx.beginPath();
    ctx.ellipse(ex, ey, eyeW, eyeH, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#f5f5f0';
    ctx.fill();
    ctx.strokeStyle = '#0d2b06';
    ctx.lineWidth = 1 * S;
    ctx.stroke();

    const irisR = eyeW * 0.7;
    ctx.beginPath();
    ctx.ellipse(ex + side * eyeW * 0.1, ey, irisR, eyeH * 0.85, 0, 0, Math.PI * 2);
    const grad = ctx.createRadialGradient(ex + side * eyeW * 0.1, ey, 0, ex + side * eyeW * 0.1, ey, irisR);
    grad.addColorStop(0, '#4a8a3a');
    grad.addColorStop(0.6, '#2d5a1e');
    grad.addColorStop(1, '#1a3a0e');
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(ex + side * eyeW * 0.1, ey, irisR * 0.3, eyeH * 0.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#000';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(ex + side * eyeW * 0.3, ey - eyeH * 0.3, eyeW * 0.18, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ex - side * eyeW * 0.1, ey + eyeH * 0.1, eyeW * 0.1, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fill();
  }

  const nx = hx, ny = hy + headR * 0.2;
  ctx.beginPath();
  ctx.moveTo(nx - headR * 0.06, ny - headR * 0.02);
  ctx.lineTo(nx, ny + headR * 0.05);
  ctx.lineTo(nx + headR * 0.06, ny - headR * 0.02);
  ctx.closePath();
  ctx.fillStyle = '#e88080';
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(nx, ny + headR * 0.05);
  ctx.quadraticCurveTo(nx - headR * 0.15, ny + headR * 0.2, nx - headR * 0.2, ny + headR * 0.12);
  ctx.strokeStyle = '#0d2b06';
  ctx.lineWidth = 1.2 * S;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(nx, ny + headR * 0.05);
  ctx.quadraticCurveTo(nx + headR * 0.15, ny + headR * 0.2, nx + headR * 0.2, ny + headR * 0.12);
  ctx.stroke();

  const mouthY = hy + headR * 0.35;
  ctx.beginPath();
  ctx.arc(hx, mouthY, headR * 0.12, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.strokeStyle = '#0d2b06';
  ctx.lineWidth = 1 * S;
  ctx.stroke();

  for (let side of [-1, 1]) {
    const wy = hy + headR * 0.15;
    for (let w = -1; w <= 1; w++) {
      ctx.beginPath();
      ctx.moveTo(hx + side * headR * 0.3, wy + w * headR * 0.06);
      ctx.lineTo(hx + side * headR * 0.7, wy + w * headR * 0.08 - headR * 0.02);
      ctx.strokeStyle = '#0d2b06';
      ctx.lineWidth = 0.7 * S;
      ctx.stroke();
    }
  }

  for (let side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(hx + side * headR * 0.35, hy + headR * 0.18, headR * 0.1, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(220,140,140,0.3)';
    ctx.fill();
  }

  for (let i = 0; i < 40; i++) {
    const fx = hx + (Math.random() - 0.5) * headR * 1.5;
    const fy = hy + (Math.random() - 0.5) * headR * 1.5;
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(fx + (Math.random() - 0.5) * 4 * S, fy + (Math.random() - 0.5) * 4 * S);
    ctx.strokeStyle = `rgba(13,43,6,${0.1 + Math.random() * 0.15})`;
    ctx.lineWidth = 0.5 * S;
    ctx.stroke();
  }

  ctx.restore();
}

function drawSerialNumber(ctx, x, y, num) {
  ctx.save();
  ctx.font = `${11 * S}px monospace`;
  ctx.fillStyle = '#0d2b06';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`B${num}8675309A`, x, y);
  ctx.restore();
}

function drawDenomination(ctx, x, y) {
  ctx.save();
  ctx.font = `bold ${48 * S}px serif`;
  ctx.fillStyle = '#0d2b06';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('100', x, y);
  ctx.restore();
}

function drawText(ctx, text, x, y, fontSize, bold = false) {
  ctx.save();
  ctx.font = `${bold ? 'bold ' : ''}${fontSize * S}px serif`;
  ctx.fillStyle = '#0d2b06';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawFibers(ctx) {
  for (let i = 0; i < 30; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    const len = (3 + Math.random() * 6) * S;
    const angle = Math.random() * Math.PI;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
    ctx.strokeStyle = Math.random() > 0.5 ? 'rgba(180,40,40,0.3)' : 'rgba(40,40,180,0.3)';
    ctx.lineWidth = 0.8 * S;
    ctx.stroke();
  }
}

function drawSecurityLine(ctx) {
  const x = W * 0.33;
  ctx.save();
  ctx.setLineDash([4 * S, 8 * S]);
  ctx.beginPath();
  ctx.moveTo(x, 60 * S);
  ctx.lineTo(x, H - 60 * S);
  ctx.strokeStyle = 'rgba(13,43,6,0.15)';
  ctx.lineWidth = 2 * S;
  ctx.stroke();
  ctx.restore();
}

function drawMicroText(ctx) {
  ctx.save();
  ctx.font = `${3 * S}px sans-serif`;
  ctx.fillStyle = 'rgba(13,43,6,0.2)';
  const text = 'ONEHUNDREDDOLLARS';
  for (let y = 80 * S; y < H - 80 * S; y += 8 * S) {
    ctx.fillText(text.repeat(20), 70 * S, y);
  }
  ctx.restore();
}

function drawBuilding(ctx, cx, cy, bw) {
  const bh = bw * 0.55;
  ctx.save();
  ctx.strokeStyle = '#0d2b06';
  ctx.fillStyle = '#0d2b06';
  ctx.lineWidth = 1.5 * S;

  const baseY = cy + bh * 0.35;
  const topY = cy - bh * 0.35;
  const leftX = cx - bw * 0.45;
  const rightX = cx + bw * 0.45;

  ctx.strokeRect(leftX, topY + bh * 0.25, bw * 0.9, bh * 0.1);
  ctx.fillRect(leftX, topY + bh * 0.25, bw * 0.9, bh * 0.1);

  ctx.strokeRect(leftX, baseY - bh * 0.02, bw * 0.9, bh * 0.12);

  for (let i = 0; i < 5; i++) {
    const px = leftX + bw * 0.1 + i * bw * 0.15;
    ctx.beginPath();
    ctx.moveTo(px, baseY - bh * 0.02);
    ctx.lineTo(px, topY + bh * 0.35);
    ctx.lineWidth = 2 * S;
    ctx.stroke();
  }

  const towerW = bw * 0.2;
  const towerH = bh * 0.5;
  ctx.strokeRect(cx - towerW / 2, topY - towerH * 0.1, towerW, towerH);
  ctx.fillRect(cx - towerW / 2, topY - towerH * 0.1, towerW, towerH);

  ctx.beginPath();
  ctx.moveTo(cx - towerW * 0.6, topY - towerH * 0.1);
  ctx.lineTo(cx, topY - towerH * 0.5);
  ctx.lineTo(cx + towerW * 0.6, topY - towerH * 0.1);
  ctx.closePath();
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, topY + towerH * 0.1, towerW * 0.15, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, topY - towerH * 0.1);
  ctx.lineTo(cx, topY - towerH * 0.04);
  ctx.moveTo(cx - towerW * 0.12, topY - towerH * 0.08);
  ctx.lineTo(cx + towerW * 0.12, topY - towerH * 0.08);
  ctx.stroke();

  const doorW = bw * 0.08;
  const doorH = bh * 0.15;
  ctx.beginPath();
  ctx.arc(cx, baseY - bh * 0.02, doorW / 2, Math.PI, 0);
  ctx.lineTo(cx + doorW / 2, baseY + doorH);
  ctx.lineTo(cx - doorW / 2, baseY + doorH);
  ctx.closePath();
  ctx.stroke();

  for (let side of [-1, 1]) {
    const wx = cx + side * bw * 0.3;
    ctx.strokeRect(wx - bw * 0.06, topY + bh * 0.35, bw * 0.12, bh * 0.15);
  }

  for (let i = 0; i < 8; i++) {
    const sx = leftX + i * bw * 0.11;
    ctx.beginPath();
    ctx.moveTo(sx, baseY + bh * 0.12);
    ctx.lineTo(sx, baseY + bh * 0.18);
    ctx.lineWidth = 1 * S;
    ctx.stroke();
  }

  ctx.restore();
}

export function createFrontTexture() {
  const c = createCanvas();
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#f5f0c8';
  ctx.fillRect(0, 0, W, H);
  drawNoise(ctx, 10);

  drawGuilloche(ctx, W * 0.25, H * 0.5, 30 * S, 20 * S, 8);
  drawGuilloche(ctx, W * 0.75, H * 0.5, 30 * S, 20 * S, 8);

  drawBorder(ctx);
  drawSecurityLine(ctx);
  drawFibers(ctx);
  drawMicroText(ctx);

  drawSeal(ctx, W * 0.2, H * 0.5, 35 * S, 'B');
  drawSeal(ctx, W * 0.8, H * 0.5, 35 * S, 'T');

  const catSize = 50 * S;
  drawCat(ctx, W * 0.5, H * 0.48, catSize);

  drawText(ctx, 'FEDERAL RESERVE NOTE', W * 0.5, H * 0.12, 10);
  drawText(ctx, 'THE UNITED STATES OF AMERICA', W * 0.5, H * 0.85, 11);
  drawText(ctx, 'ONE HUNDRED DOLLARS', W * 0.5, H * 0.92, 10);

  drawDenomination(ctx, W * 0.12, H * 0.12);
  drawDenomination(ctx, W * 0.88, H * 0.12);
  drawDenomination(ctx, W * 0.12, H * 0.88);
  drawDenomination(ctx, W * 0.88, H * 0.88);

  drawSerialNumber(ctx, 80 * S, H * 0.2, 'A234567');
  drawSerialNumber(ctx, W - 180 * S, H * 0.8, 'A234567');

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  return tex;
}

export function createBackTexture() {
  const c = createCanvas();
  const ctx = c.getContext('2d');

  ctx.translate(W, 0);
  ctx.scale(-1, 1);

  ctx.fillStyle = '#f5f0c8';
  ctx.fillRect(0, 0, W, H);
  drawNoise(ctx, 10);

  drawGuilloche(ctx, W * 0.25, H * 0.5, 30 * S, 20 * S, 8);
  drawGuilloche(ctx, W * 0.75, H * 0.5, 30 * S, 20 * S, 8);

  drawBorder(ctx);
  drawFibers(ctx);

  drawBuilding(ctx, W * 0.5, H * 0.48, 80 * S);

  drawText(ctx, 'UNITED STATES OF AMERICA', W * 0.5, H * 0.1, 11);
  drawText(ctx, 'IN GOD WE TRUST', W * 0.5, H * 0.8, 9);
  drawText(ctx, 'ONE HUNDRED DOLLARS', W * 0.5, H * 0.9, 10);

  drawDenomination(ctx, W * 0.12, H * 0.12);
  drawDenomination(ctx, W * 0.88, H * 0.12);
  drawDenomination(ctx, W * 0.12, H * 0.88);
  drawDenomination(ctx, W * 0.88, H * 0.88);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  return tex;
}

export function createBumpMap() {
  const c = createCanvas();
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, W, H);

  drawNoise(ctx, 20);

  for (let i = 0; i < 2000; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    const len = (2 + Math.random() * 4) * S;
    const angle = Math.random() * Math.PI;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
    ctx.strokeStyle = `rgba(${128 + (Math.random() - 0.5) * 30},${128 + (Math.random() - 0.5) * 30},${128 + (Math.random() - 0.5) * 30},0.3)`;
    ctx.lineWidth = 0.5 * S;
    ctx.stroke();
  }

  const m = 40 * S;
  ctx.fillStyle = 'rgba(160,160,160,0.5)';
  ctx.fillRect(0, 0, W, m);
  ctx.fillRect(0, H - m, W, m);
  ctx.fillRect(0, 0, m, H);
  ctx.fillRect(W - m, 0, m, H);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  return tex;
}
