/** Small grass-bundle collectible placed on grass biome tiles. */
export function drawGrassItem(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const cx = w / 2;
  const base = h - 3;

  // Glow halo behind blades
  const glow = ctx.createRadialGradient(cx, base - 10, 1, cx, base - 8, 12);
  glow.addColorStop(0, 'rgba(160,255,80,0.55)');
  glow.addColorStop(1, 'rgba(160,255,80,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(cx - 13, base - 22, 26, 24);

  // Dark outline pass
  ctx.fillStyle = '#0d2808';
  ctx.beginPath();
  ctx.moveTo(cx - 9, base + 1); ctx.lineTo(cx - 6, base - 17); ctx.lineTo(cx - 1, base + 1);
  ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx - 4, base + 1); ctx.lineTo(cx, base - 21); ctx.lineTo(cx + 4, base + 1);
  ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + 1, base + 1); ctx.lineTo(cx + 6, base - 16); ctx.lineTo(cx + 9, base + 1);
  ctx.closePath(); ctx.fill();

  // Dirt mound
  ctx.fillStyle = '#c08840';
  ctx.beginPath();
  ctx.ellipse(cx, base, 9, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Left blade
  ctx.fillStyle = '#60e838';
  ctx.beginPath();
  ctx.moveTo(cx - 8, base); ctx.lineTo(cx - 6, base - 16); ctx.lineTo(cx - 1, base);
  ctx.closePath(); ctx.fill();

  // Centre blade (brightest)
  ctx.fillStyle = '#96ff50';
  ctx.beginPath();
  ctx.moveTo(cx - 3, base); ctx.lineTo(cx, base - 20); ctx.lineTo(cx + 3, base);
  ctx.closePath(); ctx.fill();

  // Right blade
  ctx.fillStyle = '#60e838';
  ctx.beginPath();
  ctx.moveTo(cx + 1, base); ctx.lineTo(cx + 6, base - 15); ctx.lineTo(cx + 8, base);
  ctx.closePath(); ctx.fill();

  // White-yellow tip highlight
  ctx.fillStyle = 'rgba(240,255,180,0.85)';
  ctx.beginPath();
  ctx.moveTo(cx - 1, base - 8); ctx.lineTo(cx, base - 19); ctx.lineTo(cx + 1, base - 8);
  ctx.closePath(); ctx.fill();
}

export function drawRabbitHole(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const cx = w / 2;
  const cy = h / 2 + 2;

  // Dirt mound ring
  ctx.fillStyle = '#9a7040';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 13, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Mid dirt
  ctx.fillStyle = '#7a5528';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 10, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Dark tunnel mouth
  ctx.fillStyle = '#1a0e04';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 1, 7, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Subtle inner shading
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 1.5, 5, 2.8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Dirt highlight (top of mound)
  ctx.fillStyle = '#c09060';
  ctx.beginPath();
  ctx.ellipse(cx - 2, cy - 4, 5, 2, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // A few loose dirt clumps
  ctx.fillStyle = '#8a6030';
  ctx.beginPath(); ctx.ellipse(cx + 8, cy - 1, 2.5, 1.5, 0.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx - 7, cy,     2,   1.2, -0.3, 0, Math.PI * 2); ctx.fill();
}

export function drawStoneItem(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const cx = w / 2;
  const base = h - 4;

  // Subtle glow
  const glow = ctx.createRadialGradient(cx, base - 4, 1, cx, base - 3, 10);
  glow.addColorStop(0, 'rgba(200,200,220,0.45)');
  glow.addColorStop(1, 'rgba(200,200,220,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(cx - 12, base - 14, 24, 16);

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.30)';
  ctx.beginPath();
  ctx.ellipse(cx, base + 1, 9, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Back-left small pebble
  ctx.fillStyle = '#7a7870';
  ctx.beginPath();
  ctx.ellipse(cx - 5, base - 5, 4, 3, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#a8a498';
  ctx.beginPath();
  ctx.ellipse(cx - 6, base - 6.5, 2, 1.2, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Main centre stone
  ctx.fillStyle = '#6e6c66';
  ctx.beginPath();
  ctx.ellipse(cx + 1, base - 5, 7, 5.5, 0.1, 0, Math.PI * 2);
  ctx.fill();

  // Mid tone layer
  ctx.fillStyle = '#9c9890';
  ctx.beginPath();
  ctx.ellipse(cx, base - 6, 6, 4.5, 0.1, 0, Math.PI * 2);
  ctx.fill();

  // Highlight
  ctx.fillStyle = '#d0cec6';
  ctx.beginPath();
  ctx.ellipse(cx - 1.5, base - 8, 3, 2, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // Bright specular dot
  ctx.fillStyle = 'rgba(255,255,255,0.70)';
  ctx.beginPath();
  ctx.ellipse(cx - 2, base - 9, 1.2, 0.8, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Right small pebble
  ctx.fillStyle = '#888480';
  ctx.beginPath();
  ctx.ellipse(cx + 6, base - 3, 3.5, 2.5, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#b4b0a8';
  ctx.beginPath();
  ctx.ellipse(cx + 5.5, base - 4.2, 1.5, 1, 0.1, 0, Math.PI * 2);
  ctx.fill();
}

export function drawWheatItem(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const cx = w / 2;
  const base = h - 3;

  // Glow halo
  const glow = ctx.createRadialGradient(cx, base - 10, 1, cx, base - 8, 12);
  glow.addColorStop(0, 'rgba(255,220,60,0.55)');
  glow.addColorStop(1, 'rgba(255,220,60,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(cx - 13, base - 22, 26, 24);

  // Dark outline pass
  ctx.strokeStyle = '#5a3800';
  ctx.lineWidth = 2.5;
  const stalks: [number, number, number, number][] = [
    [cx - 7, base, cx - 9, base - 18],
    [cx - 2, base, cx - 3, base - 20],
    [cx + 3, base, cx + 2, base - 19],
    [cx + 7, base, cx + 9, base - 17],
  ];
  for (const [x0, y0, x1, y1] of stalks) {
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  }

  // Dirt mound
  ctx.fillStyle = '#c09050';
  ctx.beginPath();
  ctx.ellipse(cx, base, 9, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Stalks
  ctx.strokeStyle = '#e8b820';
  ctx.lineWidth = 2;
  for (const [x0, y0, x1, y1] of stalks) {
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  }

  // Grain heads — filled ellipses at top of each stalk
  const heads: [number, number][] = [
    [cx - 9, base - 18],
    [cx - 3, base - 20],
    [cx + 2, base - 19],
    [cx + 9, base - 17],
  ];
  ctx.fillStyle = '#f0d040';
  for (const [hx, hy] of heads) {
    ctx.beginPath(); ctx.ellipse(hx, hy - 3, 2.5, 5, 0.15, 0, Math.PI * 2); ctx.fill();
  }
  // Bright tip highlight
  ctx.fillStyle = 'rgba(255,255,180,0.75)';
  for (const [hx, hy] of heads) {
    ctx.beginPath(); ctx.ellipse(hx - 0.5, hy - 4, 1, 2.5, 0.1, 0, Math.PI * 2); ctx.fill();
  }
}

export function drawTree(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = '#7a5230';
  ctx.fillRect(w / 2 - 4, h * 0.72, 8, h * 0.28);
  ctx.fillStyle = '#a07848';
  ctx.fillRect(w / 2 - 1, h * 0.74, 2, h * 0.22);

  ctx.fillStyle = '#185010';
  ctx.beginPath();
  ctx.ellipse(w / 2 + 2, h * 0.44, 14, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#2d8c1a';
  ctx.beginPath();
  ctx.ellipse(w / 2, h * 0.40, 13, 11, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#50c828';
  ctx.beginPath();
  ctx.ellipse(w / 2 - 4, h * 0.28, 7, 6, -0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#90ee50';
  ctx.beginPath();
  ctx.ellipse(w / 2 - 5, h * 0.22, 3, 2.5, -0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#165a0e';
  ctx.beginPath();
  ctx.ellipse(w / 2 + 5, h * 0.50, 6, 5, 0.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#3aaa20';
  for (const [lx, ly] of [[10, 18], [22, 15], [16, 10], [8, 26]]) {
    ctx.beginPath(); ctx.arc(lx, ly, 2, 0, Math.PI * 2); ctx.fill();
  }
}

export function drawRock(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath();
  ctx.ellipse(w * 0.5, h * 0.88, w * 0.42, h * 0.14, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#8a8078';
  ctx.beginPath();
  ctx.ellipse(w * 0.46, h * 0.52, w * 0.40, h * 0.38, -0.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#c8c0b0';
  ctx.beginPath();
  ctx.ellipse(w * 0.34, h * 0.32, w * 0.20, h * 0.16, -0.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#e0ddd0';
  ctx.beginPath();
  ctx.ellipse(w * 0.30, h * 0.26, w * 0.08, h * 0.07, -0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#5e5650';
  ctx.beginPath();
  ctx.ellipse(w * 0.56, h * 0.66, w * 0.22, h * 0.16, 0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#9e9890';
  ctx.beginPath();
  ctx.ellipse(w * 0.80, h * 0.62, w * 0.17, h * 0.16, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c4beb4';
  ctx.beginPath();
  ctx.ellipse(w * 0.76, h * 0.53, w * 0.07, h * 0.06, -0.2, 0, Math.PI * 2);
  ctx.fill();
}

export function drawCactus(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const mx = w / 2;

  ctx.fillStyle = '#5a9a30';
  ctx.fillRect(mx - 3, 10, 6, h - 10);
  ctx.fillRect(2, 14, mx - 5, 4);
  ctx.fillRect(2, 8, 4, 10);
  ctx.fillRect(mx + 3, 20, w - mx - 5, 4);
  ctx.fillRect(w - 6, 14, 4, 10);

  ctx.fillStyle = '#78c040';
  ctx.fillRect(mx - 1, 10, 2, h - 10);

  ctx.strokeStyle = 'rgba(255,255,220,0.7)';
  ctx.lineWidth = 0.8;
  for (const [sx, sy, dx, dy] of [
    [mx - 3, 13, -3, -2], [mx + 3, 16, 3, -2],
    [mx - 3, 22, -3, -2], [mx + 3, 25, 3, -2],
    [mx - 3, 31, -3, -2],
  ]) {
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + dx, sy + dy); ctx.stroke();
  }

  ctx.fillStyle = '#e05010';
  ctx.beginPath(); ctx.arc(mx, 8, 3, 0, Math.PI * 2); ctx.fill();
}

export function drawSnowPine(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const mx = w / 2;

  ctx.fillStyle = '#7a5230';
  ctx.fillRect(mx - 3, h * 0.75, 6, h * 0.25);

  const layers = [
    { cy: h * 0.76, rx: 13, ry: 7 },
    { cy: h * 0.60, rx: 11, ry: 6 },
    { cy: h * 0.45, rx:  9, ry: 5 },
    { cy: h * 0.30, rx:  7, ry: 4 },
    { cy: h * 0.17, rx:  5, ry: 3 },
  ];
  for (const { cy, rx, ry } of layers) {
    ctx.fillStyle = '#1a5c18';
    ctx.beginPath(); ctx.ellipse(mx + 1, cy + 1, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#28801e';
    ctx.beginPath(); ctx.ellipse(mx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(235,245,255,0.88)';
    ctx.beginPath(); ctx.ellipse(mx - 1, cy - ry * 0.3, rx * 0.65, ry * 0.55, -0.1, 0, Math.PI * 2); ctx.fill();
  }
}

export function drawReed(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const mx = w / 2;

  ctx.strokeStyle = '#7a6020';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(mx + 4, h); ctx.lineTo(mx + 3, 10); ctx.stroke();

  ctx.strokeStyle = '#9a7a28';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(mx, h); ctx.lineTo(mx - 1, 8); ctx.stroke();

  ctx.fillStyle = '#5a3010';
  ctx.beginPath(); ctx.ellipse(mx - 1, 14, 3, 8, 0.05, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#7a4820';
  ctx.beginPath(); ctx.ellipse(mx + 4, 16, 2.5, 7, -0.1, 0, Math.PI * 2); ctx.fill();

  ctx.strokeStyle = '#6a8830';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(mx, h * 0.5); ctx.quadraticCurveTo(mx - 6, h * 0.3, mx - 4, h * 0.1); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(mx, h * 0.6); ctx.quadraticCurveTo(mx + 6, h * 0.45, mx + 5, h * 0.25); ctx.stroke();
}
