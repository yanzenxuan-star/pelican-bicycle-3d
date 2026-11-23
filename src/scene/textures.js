import * as THREE from 'three';

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function finalizeTexture(canvas, { repeatX = 1, repeatY = 1, srgb = true } = {}) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = 8;
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Weathered warm Riviera cedar/oak boardwalk planks (albedo + bump)
 */
export function createBoardwalkTextures() {
  const w = 1024;
  const h = 1024;
  const col = makeCanvas(w, h);
  const ctx = col.getContext('2d');
  const bmp = makeCanvas(w, h);
  const bctx = bmp.getContext('2d');

  ctx.fillStyle = '#3b2618';
  ctx.fillRect(0, 0, w, h);
  bctx.fillStyle = '#181818';
  bctx.fillRect(0, 0, w, h);

  const plankCount = 16;
  const plankW = w / plankCount;
  const tones = [
    [194, 149, 102],
    [182, 136, 91],
    [206, 162, 114],
    [172, 128, 86],
    [199, 154, 108],
    [188, 142, 97],
  ];

  // Deterministic PRNG for clean repeatability
  let seed = 4217;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let i = 0; i < plankCount; i++) {
    const x = i * plankW;
    const gap = 3;
    const [r, g, b] = tones[i % tones.length];
    const jitter = (rand() - 0.5) * 16;

    // Base plank fill
    const grad = ctx.createLinearGradient(x, 0, x + plankW, 0);
    grad.addColorStop(0, `rgb(${r + jitter - 10}, ${g + jitter - 8}, ${b + jitter - 6})`);
    grad.addColorStop(0.5, `rgb(${r + jitter + 6}, ${g + jitter + 5}, ${b + jitter + 4})`);
    grad.addColorStop(1, `rgb(${r + jitter - 12}, ${g + jitter - 10}, ${b + jitter - 8})`);
    ctx.fillStyle = grad;
    ctx.fillRect(x + gap, 0, plankW - gap * 2, h);

    bctx.fillStyle = '#b4b4b4';
    bctx.fillRect(x + gap, 0, plankW - gap * 2, h);

    // Subtle wood grain lines running lengthwise along Z (Y in UV)
    for (let s = 0; s < 32; s++) {
      const gx = x + gap + rand() * (plankW - gap * 2);
      const alpha = 0.05 + rand() * 0.1;
      ctx.strokeStyle = rand() > 0.45 ? `rgba(74, 46, 22, ${alpha})` : `rgba(240, 215, 178, ${alpha * 0.8})`;
      ctx.lineWidth = 1 + rand() * 2;
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      for (let y = 0; y <= h; y += 64) {
        ctx.lineTo(gx + Math.sin(y * 0.015 + s) * 2.5, y);
      }
      ctx.stroke();

      bctx.strokeStyle = `rgba(110,110,110,${alpha * 1.4})`;
      bctx.lineWidth = 1.5;
      bctx.beginPath();
      bctx.moveTo(gx, 0);
      bctx.lineTo(gx, h);
      bctx.stroke();
    }

    // Cross-butt seam + nail heads
    const seamY = Math.floor((0.2 + rand() * 0.6) * h);
    ctx.fillStyle = 'rgba(46, 28, 16, 0.65)';
    ctx.fillRect(x + gap, seamY, plankW - gap * 2, 3);
    bctx.fillStyle = '#202020';
    bctx.fillRect(x + gap, seamY, plankW - gap * 2, 4);

    for (const ny of [seamY - 18, seamY + 20, 64, h - 64]) {
      for (const nx of [x + 15, x + plankW - 15]) {
        ctx.fillStyle = 'rgba(54, 42, 34, 0.72)';
        ctx.beginPath();
        ctx.arc(nx, ny, 3.2, 0, Math.PI * 2);
        ctx.fill();
        bctx.fillStyle = '#404040';
        bctx.beginPath();
        bctx.arc(nx, ny, 3.5, 0, Math.PI * 2);
        bctx.fill();
      }
    }
  }

  return {
    map: finalizeTexture(col, { repeatX: 16, repeatY: 1, srgb: true }),
    bumpMap: finalizeTexture(bmp, { repeatX: 16, repeatY: 1, srgb: false }),
  };
}

/**
 * Woven golden honey rattan wicker basket texture (albedo + bump)
 */
export function createWickerTextures() {
  const s = 512;
  const col = makeCanvas(s, s);
  const ctx = col.getContext('2d');
  const bmp = makeCanvas(s, s);
  const bctx = bmp.getContext('2d');

  ctx.fillStyle = '#6c411b';
  ctx.fillRect(0, 0, s, s);
  bctx.fillStyle = '#222222';
  bctx.fillRect(0, 0, s, s);

  const rows = 16;
  const cols = 16;
  const rw = s / cols;
  const rh = s / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const horiz = (r + c) % 2 === 0;
      const x = c * rw;
      const y = r * rh;

      if (horiz) {
        const g = ctx.createLinearGradient(x, y, x + rw, y);
        g.addColorStop(0, '#8d5724');
        g.addColorStop(0.5, '#d5994b');
        g.addColorStop(1, '#8d5724');
        ctx.fillStyle = g;
        ctx.fillRect(x + 1, y + 3, rw - 2, rh - 6);

        const bg = bctx.createLinearGradient(x, y, x + rw, y);
        bg.addColorStop(0, '#555');
        bg.addColorStop(0.5, '#eee');
        bg.addColorStop(1, '#555');
        bctx.fillStyle = bg;
        bctx.fillRect(x + 1, y + 3, rw - 2, rh - 6);
      } else {
        const g = ctx.createLinearGradient(x, y, x, y + rh);
        g.addColorStop(0, '#7c4b1e');
        g.addColorStop(0.5, '#c4863c');
        g.addColorStop(1, '#7c4b1e');
        ctx.fillStyle = g;
        ctx.fillRect(x + 3, y + 1, rw - 6, rh - 2);

        const bg = bctx.createLinearGradient(x, y, x, y + rh);
        bg.addColorStop(0, '#555');
        bg.addColorStop(0.5, '#ddd');
        bg.addColorStop(1, '#555');
        bctx.fillStyle = bg;
        bctx.fillRect(x + 3, y + 1, rw - 6, rh - 2);
      }
    }
  }

  return {
    map: finalizeTexture(col, { repeatX: 2, repeatY: 1.5, srgb: true }),
    bumpMap: finalizeTexture(bmp, { repeatX: 2, repeatY: 1.5, srgb: false }),
  };
}

/**
 * Soft layered pelican feather plumage texture (albedo + bump)
 */
export function createPlumageTextures() {
  const s = 512;
  const col = makeCanvas(s, s);
  const ctx = col.getContext('2d');
  const bmp = makeCanvas(s, s);
  const bctx = bmp.getContext('2d');

  ctx.fillStyle = '#fcf8ef';
  ctx.fillRect(0, 0, s, s);
  bctx.fillStyle = '#888888';
  bctx.fillRect(0, 0, s, s);

  const rows = 18;
  const cols = 12;
  const dx = s / cols;
  const dy = s / rows;

  for (let r = -1; r <= rows; r++) {
    const offset = (r % 2) * (dx * 0.5);
    for (let c = -1; c <= cols; c++) {
      const cx = c * dx + offset;
      const cy = r * dy;
      const rx = dx * 0.56;
      const ry = dy * 0.85;

      const grad = ctx.createRadialGradient(cx, cy - ry * 0.2, 2, cx, cy, ry * 1.1);
      grad.addColorStop(0, '#fffdf7');
      grad.addColorStop(0.75, '#f6efe0');
      grad.addColorStop(1, '#e6dac4');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(182, 163, 137, 0.25)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Feather shaft highlight
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.beginPath();
      ctx.moveTo(cx, cy - ry * 0.7);
      ctx.lineTo(cx, cy + ry * 0.65);
      ctx.stroke();

      const bgrad = bctx.createRadialGradient(cx, cy - ry * 0.15, 2, cx, cy, ry);
      bgrad.addColorStop(0, '#e8e8e8');
      bgrad.addColorStop(0.85, '#999999');
      bgrad.addColorStop(1, '#4a4a4a');
      bctx.fillStyle = bgrad;
      bctx.beginPath();
      bctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      bctx.fill();
    }
  }

  return {
    map: finalizeTexture(col, { repeatX: 2.5, repeatY: 2.5, srgb: true }),
    bumpMap: finalizeTexture(bmp, { repeatX: 2.5, repeatY: 2.5, srgb: false }),
  };
}

/**
 * Vintage cream-wall bicycle tire tread texture
 */
export function createTireTextures() {
  const w = 512;
  const h = 256;
  const col = makeCanvas(w, h);
  const ctx = col.getContext('2d');
  const bmp = makeCanvas(w, h);
  const bctx = bmp.getContext('2d');

  // Top & bottom are inner rim side, center band is road tread, flanking bands are vintage cream sidewalls!
  ctx.fillStyle = '#efe5cc';
  ctx.fillRect(0, 0, w, h);

  // Dark charcoal rubber tread band in the middle (v from 0.28 to 0.72)
  ctx.fillStyle = '#24292e';
  ctx.fillRect(0, h * 0.26, w, h * 0.48);

  // Subtle tan accent pinstripe along sidewall
  ctx.fillStyle = '#c9b38c';
  ctx.fillRect(0, h * 0.24, w, 4);
  ctx.fillRect(0, h * 0.74, w, 4);

  bctx.fillStyle = '#707070';
  bctx.fillRect(0, 0, w, h);

  // Chevron tread grooves
  bctx.strokeStyle = '#ececec';
  bctx.lineWidth = 6;
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 4;

  const step = 24;
  for (let x = -32; x < w + 32; x += step) {
    for (const target of [bctx, ctx]) {
      target.beginPath();
      target.moveTo(x, h * 0.28);
      target.lineTo(x + 14, h * 0.5);
      target.lineTo(x, h * 0.72);
      target.stroke();
    }
  }

  return {
    map: finalizeTexture(col, { repeatX: 6, repeatY: 1, srgb: true }),
    bumpMap: finalizeTexture(bmp, { repeatX: 6, repeatY: 1, srgb: false }),
  };
}

/**
 * Navy & Ivory Breton Sailor Scarf Striped Fabric
 */
export function createSailorScarfTexture() {
  const w = 512;
  const h = 256;
  const c = makeCanvas(w, h);
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#1b3556';
  ctx.fillRect(0, 0, w, h);

  // Crisp ivory nautical stripes near borders & tips
  ctx.fillStyle = '#f8f2e4';
  ctx.fillRect(0, 26, w, 20);
  ctx.fillRect(0, h - 46, w, 20);

  // End stripes
  for (const sx of [38, 72, w - 92, w - 58]) {
    ctx.fillRect(sx, 0, 14, h);
  }

  // Subtle woven linen grain
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  for (let y = 0; y < h; y += 4) {
    ctx.fillRect(0, y, w, 1);
  }
  for (let x = 0; x < w; x += 6) {
    ctx.fillRect(x, 0, 1, h);
  }

  return finalizeTexture(c, { repeatX: 1, repeatY: 1, srgb: true });
}

/**
 * Sun-warmed Mediterranean limestone / sandstone promenade texture
 */
export function createStoneTexture() {
  const s = 512;
  const c = makeCanvas(s, s);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#e5d5b7';
  ctx.fillRect(0, 0, s, s);

  const rows = 8;
  const rh = s / rows;
  let seed = 9183;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let r = 0; r < rows; r++) {
    const cols = 4;
    const cw = s / cols;
    const shift = (r % 2) * (cw * 0.5);
    for (let col = -1; col <= cols; col++) {
      const x = col * cw + shift;
      const y = r * rh;
      const v = Math.floor((rand() - 0.5) * 20);
      ctx.fillStyle = `rgb(${226 + v}, ${208 + v}, ${175 + v})`;
      ctx.fillRect(x + 2, y + 2, cw - 4, rh - 4);
    }
  }

  return finalizeTexture(c, { repeatX: 20, repeatY: 1, srgb: true });
}

/**
 * Load our MiniMax/AI-generated Riviera Travel Poster texture for the boardwalk easel
 */
export function loadPosterTexture(url = './assets/images/riviera_poster.jpg') {
  const loader = new THREE.TextureLoader();
  const tex = loader.load(url);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}
