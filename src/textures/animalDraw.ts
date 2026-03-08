import Phaser from 'phaser';

/**
 * Create a 3-frame spritesheet (idle + 2 walk steps) for an animal.
 * liftingFactor ∈ [0, 1] — how far each leg lifts as a fraction of its height.
 * Rabbit has no drawn legs; it uses a whole-body hop offset instead.
 */
export function createAnimalSpritesheet(
  textures: Phaser.Textures.TextureManager,
  key: string,
  w: number,
  h: number,
  drawFn: (ctx: CanvasRenderingContext2D, w: number, h: number, phase: number, liftingFactor: number) => void,
  liftingFactor = 0.5,
): void {
  const canvas = document.createElement('canvas');
  canvas.width  = w * 3;
  canvas.height = h;
  const main = canvas.getContext('2d')!;

  for (let phase = 0; phase < 3; phase++) {
    const fc = document.createElement('canvas');
    fc.width  = w;
    fc.height = h;
    drawFn(fc.getContext('2d')!, w, h, phase, liftingFactor);
    main.drawImage(fc, phase * w, 0);
  }

  const tex = textures.addCanvas(key, canvas)!;
  for (let i = 0; i < 3; i++) tex.add(i, 0, i * w, 0, w, h);
}

// ---------------------------------------------------------------------------
// Animal draw functions
// phase 0 = idle, 1 = step-A (pair 0+3 lifted), 2 = step-B (pair 1+2 lifted)
// Sprites face right; Animal.ts flips them when moving left.
// ---------------------------------------------------------------------------

export function drawDeer(ctx: CanvasRenderingContext2D, _w: number, h: number, phase = 0, liftingFactor = 0.5): void {
  // Diagonal gait: legs[0]+legs[3] lifted in phase 1; legs[1]+legs[2] in phase 2.
  const lift = [
    (phase === 1 ? liftingFactor : 0) * 12,
    (phase === 2 ? liftingFactor : 0) * 12,
    (phase === 2 ? liftingFactor : 0) * 11,
    (phase === 1 ? liftingFactor : 0) * 11,
  ];

  ctx.fillStyle = '#7a4828';
  ctx.fillRect(6,  h - 12, 3, 12 - lift[0]);
  ctx.fillRect(12, h - 12, 3, 12 - lift[1]);
  ctx.fillRect(20, h - 11, 3, 11 - lift[2]);
  ctx.fillRect(26, h - 11, 3, 11 - lift[3]);

  ctx.fillStyle = '#c07848';
  ctx.beginPath();
  ctx.ellipse(17, h - 14, 14, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#f0ede4';
  ctx.beginPath();
  ctx.ellipse(4, h - 15, 5, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#c07848';
  ctx.beginPath();
  ctx.ellipse(30, h - 21, 4, 7, -0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(33, h - 28, 5, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#d4986a';
  ctx.beginPath();
  ctx.ellipse(36, h - 27, 3, 2, 0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#5a3018';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(30, h - 32); ctx.lineTo(26, h - 38);
  ctx.moveTo(28, h - 35); ctx.lineTo(23, h - 33);
  ctx.moveTo(33, h - 32); ctx.lineTo(36, h - 38);
  ctx.moveTo(34, h - 35); ctx.lineTo(38, h - 33);
  ctx.stroke();

  ctx.fillStyle = '#1a0a00';
  ctx.beginPath();
  ctx.arc(34, h - 29, 1.5, 0, Math.PI * 2);
  ctx.fill();
}

export function drawRabbit(ctx: CanvasRenderingContext2D, _w: number, h: number, phase = 0, liftingFactor = 0.5): void {
  // No drawn legs — animate with a whole-body vertical hop.
  const hopUp = Math.round(phase === 1 ? liftingFactor * 5 : phase === 2 ? liftingFactor * 3 : 0);

  ctx.fillStyle = '#f4f4f4';
  ctx.beginPath();
  ctx.arc(3, h - 7 - hopUp, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#a8a098';
  ctx.beginPath();
  ctx.ellipse(9, h - 6 - hopUp, 7, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(16, h - 13 - hopUp, 5, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#909088';
  ctx.beginPath();
  ctx.ellipse(13, h - 21 - hopUp, 2, 7, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(17, h - 20 - hopUp, 2, 7,  0.15, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#e8a0b0';
  ctx.beginPath();
  ctx.ellipse(13, h - 21 - hopUp, 0.8, 5, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(17, h - 20 - hopUp, 0.8, 5,  0.15, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(18, h - 14 - hopUp, 1.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#e07080';
  ctx.beginPath();
  ctx.arc(19, h - 11 - hopUp, 1, 0, Math.PI * 2);
  ctx.fill();
}

export function drawWolf(ctx: CanvasRenderingContext2D, _w: number, h: number, phase = 0, liftingFactor = 0.5): void {
  const lift = [
    (phase === 1 ? liftingFactor : 0) * 11,
    (phase === 2 ? liftingFactor : 0) * 11,
    (phase === 2 ? liftingFactor : 0) * 10,
    (phase === 1 ? liftingFactor : 0) * 10,
  ];

  // Tail (behind body)
  ctx.strokeStyle = '#3a3a3a';
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(6, h - 12);
  ctx.quadraticCurveTo(0, h - 24, 5, h - 30);
  ctx.stroke();
  ctx.strokeStyle = '#5e5e5e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(6, h - 12);
  ctx.quadraticCurveTo(1, h - 23, 5, h - 29);
  ctx.stroke();

  ctx.fillStyle = '#2e2e2e';
  ctx.fillRect(8,  h - 11, 3, 11 - lift[0]);
  ctx.fillRect(14, h - 11, 3, 11 - lift[1]);
  ctx.fillRect(23, h - 10, 3, 10 - lift[2]);
  ctx.fillRect(29, h - 10, 3, 10 - lift[3]);

  ctx.fillStyle = '#484848';
  ctx.beginPath();
  ctx.ellipse(19, h - 14, 14, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#5c5c5c';
  ctx.beginPath();
  ctx.ellipse(16, h - 20, 9, 3, -0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#484848';
  ctx.beginPath();
  ctx.ellipse(31, h - 20, 4, 7, -0.25, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(35, h - 25, 5, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#383838';
  ctx.beginPath();
  ctx.ellipse(39, h - 23, 4, 2.5, 0.15, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#383838';
  ctx.beginPath();
  ctx.moveTo(30, h - 29); ctx.lineTo(27, h - 36); ctx.lineTo(35, h - 30); ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(36, h - 28); ctx.lineTo(34, h - 35); ctx.lineTo(40, h - 29); ctx.closePath(); ctx.fill();

  ctx.fillStyle = '#7a3030';
  ctx.beginPath();
  ctx.moveTo(31, h - 30); ctx.lineTo(29, h - 33); ctx.lineTo(34, h - 31); ctx.closePath(); ctx.fill();

  ctx.fillStyle = '#100a00';
  ctx.beginPath(); ctx.arc(36, h - 25, 2.2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#d4a000';
  ctx.beginPath(); ctx.arc(36, h - 25, 1.2, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = '#111111';
  ctx.beginPath(); ctx.arc(41, h - 22, 1.3, 0, Math.PI * 2); ctx.fill();
}

export function drawPig(ctx: CanvasRenderingContext2D, _w: number, h: number, phase = 0, liftingFactor = 0.5): void {
  const lift = [
    (phase === 1 ? liftingFactor : 0) * 5,
    (phase === 2 ? liftingFactor : 0) * 5,
    (phase === 2 ? liftingFactor : 0) * 5,
    (phase === 1 ? liftingFactor : 0) * 5,
  ];

  ctx.fillStyle = '#4a3028';
  ctx.fillRect(5,  h - 5, 3, 5 - lift[0]);
  ctx.fillRect(10, h - 5, 3, 5 - lift[1]);
  ctx.fillRect(18, h - 5, 3, 5 - lift[2]);
  ctx.fillRect(23, h - 5, 3, 5 - lift[3]);

  ctx.fillStyle = '#7a5040';
  ctx.beginPath();
  ctx.ellipse(15, h - 8, 13, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#9a7060';
  ctx.beginPath();
  ctx.ellipse(15, h - 7, 9, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#7a5040';
  ctx.beginPath();
  ctx.ellipse(28, h - 10, 7, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#5a3828';
  ctx.beginPath();
  ctx.moveTo(24, h - 14);
  ctx.lineTo(30, h - 14);
  ctx.lineTo(27, h - 18);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#c07060';
  ctx.beginPath();
  ctx.ellipse(33, h - 9, 3, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#8a3828';
  ctx.beginPath(); ctx.arc(32, h - 9, 1, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(34, h - 9, 1, 0, Math.PI * 2); ctx.fill();

  ctx.strokeStyle = '#e8d8a0';
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(32, h - 7);
  ctx.quadraticCurveTo(35, h - 5, 33, h - 3);
  ctx.stroke();

  ctx.fillStyle = '#1a0a00';
  ctx.beginPath();
  ctx.arc(28, h - 11, 1.5, 0, Math.PI * 2);
  ctx.fill();
}
