export function drawGrass(ctx: CanvasRenderingContext2D, w: number, h: number, variant: number): void {
  ctx.fillStyle = '#6ab83c';
  ctx.fillRect(0, 0, w, h);

  const makeLCG = (seed: number) => {
    let s = (seed ^ 0xdeadbeef) >>> 0;
    return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 0x100000000; };
  };
  const wrap = (fn: (x: number, y: number) => void, x: number, y: number) => {
    for (const ox of [0, -w, w]) for (const oy of [0, -h, h]) fn(x + ox, y + oy);
  };
  const rng = makeLCG(variant * 0x9e3779b9 + 1);

  for (let i = 0; i < 55; i++) {
    const nx = rng() * w;
    const ny = rng() * h;
    const bright = rng() > 0.5;
    ctx.fillStyle = bright ? 'rgba(120,200,60,0.09)' : 'rgba(30,70,5,0.09)';
    wrap((x, y) => { ctx.fillRect(x, y, 1, 1); }, nx, ny);
  }

  ctx.fillStyle = 'rgba(88,58,18,0.12)';
  const nDirt = 3 + Math.floor(rng() * 3);
  for (let i = 0; i < nDirt; i++) {
    const px  = rng() * w;
    const py  = rng() * h;
    const rx  = rng() * 4 + 3;
    const ry  = rng() * 2 + 1.5;
    const ang = rng() * Math.PI;
    wrap((x, y) => {
      ctx.beginPath(); ctx.ellipse(x, y, rx, ry, ang, 0, Math.PI * 2); ctx.fill();
    }, px, py);
  }

  type Blade = { dx: number; lean: number; h: number };
  type Tuft  = { x: number; y: number; blades: Blade[]; col: string; lw: number };
  const nTufts = 20 + Math.floor(rng() * 8);
  const tufts: Tuft[] = [];
  for (let i = 0; i < nTufts; i++) {
    const tx       = rng() * w;
    const ty       = rng() * h;
    const nBlades  = 1 + Math.floor(rng() * 3);
    const baseH    = rng() * 4 + 3;
    const baseLean = rng() * 4 - 2;
    const dark     = rng() > 0.45;
    const blades: Blade[] = [];
    for (let b = 0; b < nBlades; b++) {
      blades.push({
        dx:   (b - (nBlades - 1) / 2) * 2.4,
        lean: baseLean + (rng() - 0.5) * 1.6,
        h:    baseH * (0.75 + rng() * 0.5),
      });
    }
    tufts.push({ x: tx, y: ty, blades, col: dark ? '#1e5410' : '#2e6a14', lw: 0.9 + rng() * 0.5 });
  }
  ctx.lineCap = 'round';
  for (const t of tufts) {
    ctx.strokeStyle = t.col;
    ctx.lineWidth   = t.lw;
    for (const bl of t.blades) {
      wrap((x, y) => {
        ctx.beginPath();
        ctx.moveTo(x + bl.dx, y);
        ctx.lineTo(x + bl.dx + bl.lean, y - bl.h);
        ctx.stroke();
      }, t.x, t.y);
    }
  }

  if (variant === 1) {
    ctx.fillStyle = 'rgba(40,120,20,0.55)';
    for (const [cx, cy] of [[24, 22], [27, 20], [22, 19]] as [number, number][]) {
      ctx.beginPath(); ctx.arc(cx, cy, 2, 0, Math.PI * 2); ctx.fill();
    }
  }
  if (variant === 2) {
    ctx.fillStyle = '#f8e040';
    ctx.beginPath(); ctx.arc(22, 22, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(22, 22, 1.0, 0, Math.PI * 2); ctx.fill();
  }
  if (variant === 3) {
    ctx.fillStyle = 'rgba(120,110,95,0.55)';
    ctx.beginPath(); ctx.ellipse(24, 24, 3, 2, 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(190,180,165,0.35)';
    ctx.beginPath(); ctx.ellipse(23, 23, 1.5, 1, 0.3, 0, Math.PI * 2); ctx.fill();
  }
}

export function drawWater(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = '#3a7bd5';
  ctx.fillRect(0, 0, w, h);
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  for (let ry = 6; ry < h; ry += 16) {
    ctx.beginPath();
    ctx.moveTo(0, ry);
    ctx.bezierCurveTo(w * 0.25, ry - 2, w * 0.75, ry + 2, w, ry);
    ctx.stroke();
  }
  const wrap = (fn: (x: number, y: number) => void, x: number, y: number) => {
    for (const ox of [0, -w, w]) for (const oy of [0, -h, h]) fn(x + ox, y + oy);
  };
  ctx.fillStyle = 'rgba(255,255,255,0.10)';
  for (const [gx, gy] of [[10, 8], [30, 22], [50, 14], [16, 46], [44, 38], [6, 30], [54, 54]]) {
    wrap((x, y) => { ctx.beginPath(); ctx.arc(x, y, 1.5, 0, Math.PI * 2); ctx.fill(); }, gx, gy);
  }
}

export function drawForest(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = '#2d6a1e';
  ctx.fillRect(0, 0, w, h);
  const wrap = (fn: (x: number, y: number) => void, x: number, y: number) => {
    for (const ox of [0, -w, w]) for (const oy of [0, -h, h]) fn(x + ox, y + oy);
  };
  ctx.fillStyle = 'rgba(40,100,10,0.45)';
  for (const [px, py, rx, ry, ang] of [
    [ 8, 24, 6, 4,  0.3], [24, 10, 5, 3, -0.4], [44, 28, 5, 3, 0.6],
    [ 6, 46, 6, 3,  0.2], [36, 52, 5, 3, -0.3], [54, 14, 4, 3, 0.5],
    [18, 36, 5, 3, -0.2], [50, 42, 4, 3,  0.4],
  ] as [number, number, number, number, number][]) {
    wrap((x, y) => {
      ctx.beginPath(); ctx.ellipse(x, y, rx, ry, ang, 0, Math.PI * 2); ctx.fill();
    }, px, py);
  }
  ctx.fillStyle = '#4ab828';
  for (const [mx, my] of [[5, 14], [20, 30], [34, 18], [12, 6], [46, 6], [58, 36], [28, 54], [52, 52]]) {
    wrap((x, y) => { ctx.beginPath(); ctx.arc(x, y, 2.2, 0, Math.PI * 2); ctx.fill(); }, mx, my);
  }
  ctx.fillStyle = 'rgba(62,140,20,0.50)';
  for (const [lx, ly, ang] of [
    [16, 42, 0.8], [38, 8, 0.3], [56, 28, 1.2], [26, 58, 0.5],
  ] as [number, number, number][]) {
    wrap((x, y) => {
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
      ctx.beginPath(); ctx.ellipse(0, 0, 3, 1.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }, lx, ly);
  }
}

export function drawMountain(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = '#8a7a6a';
  ctx.fillRect(0, 0, w, h);
  const wrap = (fn: (x: number, y: number) => void, x: number, y: number) => {
    for (const ox of [0, -w, w]) for (const oy of [0, -h, h]) fn(x + ox, y + oy);
  };
  for (const [rx, ry, rw, rh, ang] of [
    [10, 20, 9, 6, -0.2], [32, 10, 7, 4,  0.3], [52, 30, 8, 5, -0.1],
    [20, 42, 6, 4,  0.4], [46, 50, 9, 5,  0.2], [ 6, 54, 5, 3, -0.3],
    [58, 10, 5, 3,  0.1], [36, 56, 7, 4, -0.4],
  ] as [number, number, number, number, number][]) {
    wrap((x, y) => {
      ctx.fillStyle = 'rgba(45,35,25,0.22)';
      ctx.beginPath(); ctx.ellipse(x + 2, y + 2, rw, rh, ang, 0, Math.PI * 2); ctx.fill();
    }, rx, ry);
    wrap((x, y) => {
      ctx.fillStyle = '#9a8a7a';
      ctx.beginPath(); ctx.ellipse(x, y, rw, rh, ang, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#bfb0a0';
      ctx.beginPath(); ctx.ellipse(x - rw * 0.25, y - rh * 0.3, rw * 0.45, rh * 0.4, ang - 0.3, 0, Math.PI * 2); ctx.fill();
    }, rx, ry);
  }
  ctx.strokeStyle = 'rgba(50,40,32,0.32)';
  ctx.lineWidth = 0.9;
  ctx.lineCap = 'round';
  for (const [x1, y1, x2, y2] of [
    [18, 34, 28, 40], [40, 18, 52, 24], [24, 52, 34, 48], [54, 42, 60, 50],
  ] as [number, number, number, number][]) {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }
}

export function drawDesert(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = '#e8c870';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(160,120,40,0.28)';
  ctx.lineWidth = 1;
  for (let ry = 4; ry < h; ry += 8) {
    ctx.beginPath();
    ctx.moveTo(0, ry);
    ctx.bezierCurveTo(w * 0.30, ry - 1.5, w * 0.70, ry + 1.5, w, ry);
    ctx.stroke();
  }
  const wrap = (fn: (x: number, y: number) => void, x: number, y: number) => {
    for (const ox of [0, -w, w]) for (const oy of [0, -h, h]) fn(x + ox, y + oy);
  };
  ctx.fillStyle = 'rgba(175,135,55,0.55)';
  for (const [px, py] of [[6, 10], [22, 22], [14, 38], [38, 8], [10, 52], [50, 36], [56, 56], [30, 50]]) {
    wrap((x, y) => {
      ctx.beginPath(); ctx.ellipse(x, y, 2.2, 1.3, 0.4, 0, Math.PI * 2); ctx.fill();
    }, px, py);
  }
  ctx.fillStyle = 'rgba(140,100,30,0.12)';
  for (const [px, py, rx, ry, ang] of [
    [18, 28, 7, 4, 0.2], [44, 46, 6, 3.5, -0.3], [54, 20, 5, 3, 0.4],
  ] as [number, number, number, number, number][]) {
    wrap((x, y) => {
      ctx.beginPath(); ctx.ellipse(x, y, rx, ry, ang, 0, Math.PI * 2); ctx.fill();
    }, px, py);
  }
}

export function drawSnow(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = '#e8eef8';
  ctx.fillRect(0, 0, w, h);
  const wrap = (fn: (x: number, y: number) => void, x: number, y: number) => {
    for (const ox of [0, -w, w]) for (const oy of [0, -h, h]) fn(x + ox, y + oy);
  };
  ctx.fillStyle = 'rgba(155,175,215,0.28)';
  for (const [dx, dy, rx, ry, ang] of [
    [ 8, 22, 9, 4.5,  0.2], [30, 10, 7, 3.5, -0.3], [52, 40, 8,  4,  0.1],
    [16, 50, 7, 3.5,  0.4], [46, 20, 7, 3.5, -0.2], [ 6, 38, 5, 2.5, 0.3],
  ] as [number, number, number, number, number][]) {
    wrap((x, y) => {
      ctx.beginPath(); ctx.ellipse(x, y, rx, ry, ang, 0, Math.PI * 2); ctx.fill();
    }, dx, dy);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  for (const [sx, sy] of [[6, 6], [22, 18], [38, 8], [52, 26], [14, 36], [46, 50], [30, 56], [8, 54], [54, 4]]) {
    wrap((x, y) => { ctx.beginPath(); ctx.arc(x, y, 1.3, 0, Math.PI * 2); ctx.fill(); }, sx, sy);
  }
  ctx.fillStyle = 'rgba(140,180,240,0.14)';
  for (const [ix, iy, rx, ry, ang] of [
    [24, 28, 9, 5, 0.5], [50, 44, 7, 4, 0.3], [10, 48, 8, 4.5, 0.2],
  ] as [number, number, number, number, number][]) {
    wrap((x, y) => {
      ctx.beginPath(); ctx.ellipse(x, y, rx, ry, ang, 0, Math.PI * 2); ctx.fill();
    }, ix, iy);
  }
}

export function drawWheat(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  // Warm golden base
  ctx.fillStyle = '#d4a830';
  ctx.fillRect(0, 0, w, h);

  // Subtle soil shadow patches
  ctx.fillStyle = 'rgba(120, 80, 20, 0.15)';
  for (const [px, py, rx, ry, ang] of [
    [12, 20, 7, 3, 0.3], [40, 38, 6, 2.5, -0.2], [54, 14, 5, 2, 0.5],
    [28, 52, 6, 2.5, 0.1], [6, 48, 5, 2, -0.3],
  ] as [number, number, number, number, number][]) {
    ctx.beginPath(); ctx.ellipse(px, py, rx, ry, ang, 0, Math.PI * 2); ctx.fill();
  }

  const wrap = (fn: (x: number, y: number) => void, x: number, y: number) => {
    for (const ox of [0, -w, w]) for (const oy of [0, -h, h]) fn(x + ox, y + oy);
  };

  // Wheat stalks — vertical lines with grain head on top
  ctx.lineCap = 'round';
  const stalks: { x: number; y: number; lean: number; stalkH: number; headH: number }[] = [
    { x:  8, y: h, lean: -1, stalkH: 20, headH: 8 },
    { x: 14, y: h, lean:  1, stalkH: 22, headH: 9 },
    { x: 22, y: h, lean: -1, stalkH: 19, headH: 8 },
    { x: 30, y: h, lean:  1, stalkH: 23, headH: 9 },
    { x: 38, y: h, lean: -2, stalkH: 21, headH: 8 },
    { x: 46, y: h, lean:  1, stalkH: 20, headH: 9 },
    { x: 54, y: h, lean: -1, stalkH: 22, headH: 8 },
    { x: 60, y: h, lean:  2, stalkH: 20, headH: 9 },
  ];

  for (const s of stalks) {
    // Stalk
    ctx.strokeStyle = '#b88820';
    ctx.lineWidth = 1.5;
    wrap((x, y) => {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + s.lean, y - s.stalkH);
      ctx.stroke();
    }, s.x, s.y);

    // Grain head (elongated oval cluster)
    ctx.fillStyle = '#e8c040';
    wrap((x, y) => {
      const tx = x + s.lean;
      const ty = y - s.stalkH;
      ctx.beginPath();
      ctx.ellipse(tx, ty - s.headH / 2, 2, s.headH / 2, 0.15, 0, Math.PI * 2);
      ctx.fill();
      // Side grains
      ctx.fillStyle = '#d4a828';
      ctx.beginPath(); ctx.ellipse(tx - 2, ty - s.headH * 0.3, 1.2, 2.5, -0.3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(tx + 2, ty - s.headH * 0.3, 1.2, 2.5,  0.3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e8c040';
    }, s.x, s.y);
  }

  // Light highlight glints (sun on grain)
  ctx.fillStyle = 'rgba(255, 240, 120, 0.45)';
  for (const [gx, gy] of [[10, 10], [32, 6], [50, 22], [18, 44], [44, 54], [58, 38]]) {
    wrap((x, y) => { ctx.beginPath(); ctx.arc(x, y, 1.2, 0, Math.PI * 2); ctx.fill(); }, gx, gy);
  }
}

export function drawSwamp(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = '#4a6830';
  ctx.fillRect(0, 0, w, h);
  const wrap = (fn: (x: number, y: number) => void, x: number, y: number) => {
    for (const ox of [0, -w, w]) for (const oy of [0, -h, h]) fn(x + ox, y + oy);
  };
  ctx.fillStyle = 'rgba(35,22,8,0.42)';
  for (const [px, py, rx, ry, ang] of [
    [ 8, 10, 4, 2.5, 0.5], [30, 30, 4.5, 2.5, -0.2], [10, 32, 3.5, 2, 0.3],
    [50, 14, 4, 2.0, 0.4], [24, 52, 4,   2.5, -0.3], [52, 46, 3,   2, 0.2],
  ] as [number, number, number, number, number][]) {
    wrap((x, y) => {
      ctx.beginPath(); ctx.ellipse(x, y, rx, ry, ang, 0, Math.PI * 2); ctx.fill();
    }, px, py);
  }
  for (const [px, py, rx, ry, ang] of [
    [18, 22, 9, 6.5, 0.3], [48, 40, 8, 5.5, -0.2], [10, 52, 7, 5, 0.4],
  ] as [number, number, number, number, number][]) {
    wrap((x, y) => {
      ctx.fillStyle = 'rgba(18,28,10,0.55)';
      ctx.beginPath(); ctx.ellipse(x, y, rx, ry, ang, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(70,110,35,0.30)';
      ctx.beginPath(); ctx.ellipse(x, y, rx, ry, ang, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#4a8018';
      ctx.beginPath(); ctx.arc(x, y, 2.8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2e5a0e';
      ctx.beginPath(); ctx.arc(x, y, 1.4, 0, Math.PI); ctx.fill();
    }, px, py);
  }
}
