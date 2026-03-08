import Phaser from 'phaser';

const FW = 24;
const FH = 30;

// Frames: 0=idle, 1=walk-A, 2=walk-B, 3=swim-A, 4=swim-B
const NUM_FRAMES = 5;

export function createPlayerSpritesheet(textures: Phaser.Textures.TextureManager): void {
  const canvas = document.createElement('canvas');
  canvas.width  = FW * NUM_FRAMES;
  canvas.height = FH;
  const ctx = canvas.getContext('2d')!;
  drawCavemanFrame(ctx, 0,          0); // idle
  drawCavemanFrame(ctx, FW,         1); // walk-A
  drawCavemanFrame(ctx, FW * 2,     2); // walk-B
  drawSwimFrame(ctx,   FW * 3, false); // swim-A  (arms reaching)
  drawSwimFrame(ctx,   FW * 4, true);  // swim-B  (arms pulling)
  const tex = textures.addCanvas('player', canvas)!;
  for (let i = 0; i < NUM_FRAMES; i++) tex.add(i, 0, i * FW, 0, FW, FH);
}

/**
 * Draws one frame of the caveman player onto `ctx` at x-offset `ox`.
 * phase 0 = idle, 1 = step-A (left leg lifted), 2 = step-B (right leg lifted).
 * Sprite faces right; Player.ts flips it horizontally when moving left.
 */
function drawCavemanFrame(ctx: CanvasRenderingContext2D, ox: number, phase: number): void {
  const SKIN  = '#d49050';
  const HAIR  = '#1a0800';
  const FUR   = '#8a5520';
  const FUR_D = '#4a2a06';
  const CLUB  = '#6a3e0e';
  const EYE   = '#120400';

  // ── Legs ──────────────────────────────────────────────────────────────
  type Leg = { x: number; y: number; h: number };
  let lL: Leg, rL: Leg;
  if (phase === 1) {                     // left leg lifted, right grounded
    lL = { x: 7,  y: 16, h: 4 };
    rL = { x: 14, y: 23, h: 7 };
  } else if (phase === 2) {              // right leg lifted, left grounded
    lL = { x: 7,  y: 23, h: 7 };
    rL = { x: 13, y: 16, h: 4 };
  } else {                               // idle
    lL = { x: 8,  y: 23, h: 7 };
    rL = { x: 13, y: 23, h: 7 };
  }
  // back leg first
  ctx.fillStyle = SKIN;
  ctx.fillRect(ox + rL.x, rL.y, 4, rL.h);
  ctx.fillStyle = FUR_D;
  ctx.fillRect(ox + rL.x - 1, rL.y + rL.h - 2, 6, 2);
  // front leg
  ctx.fillStyle = SKIN;
  ctx.fillRect(ox + lL.x, lL.y, 4, lL.h);
  ctx.fillStyle = FUR_D;
  ctx.fillRect(ox + lL.x - 1, lL.y + lL.h - 2, 6, 2);

  // ── Loincloth ─────────────────────────────────────────────────────────
  ctx.fillStyle = FUR;
  ctx.fillRect(ox + 6, 19, 12, 6);
  ctx.fillStyle = FUR_D;
  ctx.fillRect(ox + 6,  19, 12, 1);
  ctx.fillRect(ox + 8,  20, 2, 5);
  ctx.fillRect(ox + 11, 20, 2, 5);
  ctx.fillRect(ox + 14, 20, 2, 5);

  // ── Torso ─────────────────────────────────────────────────────────────
  ctx.fillStyle = SKIN;
  ctx.fillRect(ox + 7, 12, 10, 8);

  // ── Fur shoulder strap ────────────────────────────────────────────────
  ctx.fillStyle = FUR;
  ctx.fillRect(ox + 5, 10, 14, 4);
  ctx.fillStyle = FUR_D;
  ctx.fillRect(ox + 5,  10, 14, 1);
  ctx.fillRect(ox + 6,  12, 2,  2);
  ctx.fillRect(ox + 16, 12, 2,  2);

  // ── Arms & club ───────────────────────────────────────────────────────
  let laY: number, raY: number;
  if (phase === 1)      { laY = 14; raY = 11; }
  else if (phase === 2) { laY = 11; raY = 14; }
  else                  { laY = 12; raY = 12; }

  ctx.fillStyle = SKIN;
  ctx.fillRect(ox + 2,  laY, 5, 7);
  ctx.fillRect(ox + 17, raY, 5, 7);

  ctx.fillStyle = CLUB;
  ctx.fillRect(ox + 20, raY + 1, 3, 8);
  ctx.fillRect(ox + 18, raY - 2, 6, 4);
  ctx.fillStyle = FUR_D;
  ctx.fillRect(ox + 19, raY - 1, 5, 1);

  // ── Head ──────────────────────────────────────────────────────────────
  ctx.fillStyle = SKIN;
  ctx.beginPath();
  ctx.ellipse(ox + 12, 7, 6, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = HAIR;
  ctx.fillRect(ox + 8,  10, 2, 2);
  ctx.fillRect(ox + 11, 11, 3, 1);
  ctx.fillRect(ox + 14, 10, 2, 2);

  ctx.fillStyle = EYE;
  ctx.fillRect(ox + 9,  6, 2, 2);
  ctx.fillRect(ox + 13, 6, 2, 2);

  ctx.fillStyle = HAIR;
  ctx.fillRect(ox + 8,  4, 8, 2);
  ctx.fillRect(ox + 11, 3, 2, 2);

  ctx.fillStyle = '#a86a30';
  ctx.fillRect(ox + 11, 7, 2, 3);

  // ── Wild hair ─────────────────────────────────────────────────────────
  ctx.fillStyle = HAIR;
  ctx.fillRect(ox + 6,  0, 12, 5);
  ctx.fillRect(ox + 3,  2, 5,  6);
  ctx.fillRect(ox + 16, 2, 5,  6);
  ctx.fillRect(ox + 7,  0, 2,  2);
  ctx.fillRect(ox + 11, 0, 2,  3);
  ctx.fillRect(ox + 15, 0, 2,  2);
  ctx.fillRect(ox + 4,  6, 3,  5);
  ctx.fillRect(ox + 17, 6, 3,  5);
}

/**
 * Swimming frame: head + upper torso visible above the waterline.
 * pulling=false → arms reaching forward (stroke start).
 * pulling=true  → arms swept back (stroke pull-through).
 * Pixels below y=22 are left transparent so the water tile shows through.
 */
function drawSwimFrame(ctx: CanvasRenderingContext2D, ox: number, pulling: boolean): void {
  const SKIN  = '#d49050';
  const HAIR  = '#1a0800';
  const FUR   = '#8a5520';
  const FUR_D = '#4a2a06';
  const EYE   = '#120400';

  // ── Head ──────────────────────────────────────────────────────────────
  ctx.fillStyle = SKIN;
  ctx.beginPath();
  ctx.ellipse(ox + 12, 7, 6, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── Wild hair ─────────────────────────────────────────────────────────
  ctx.fillStyle = HAIR;
  ctx.fillRect(ox + 6,  0, 12, 5);
  ctx.fillRect(ox + 3,  2, 5,  6);
  ctx.fillRect(ox + 16, 2, 5,  6);
  ctx.fillRect(ox + 7,  0, 2,  2);
  ctx.fillRect(ox + 11, 0, 2,  3);
  ctx.fillRect(ox + 15, 0, 2,  2);
  ctx.fillRect(ox + 4,  6, 3,  5);
  ctx.fillRect(ox + 17, 6, 3,  5);

  // ── Eyes & nose ───────────────────────────────────────────────────────
  ctx.fillStyle = EYE;
  ctx.fillRect(ox + 9,  6, 2, 2);
  ctx.fillRect(ox + 13, 6, 2, 2);
  ctx.fillStyle = HAIR;
  ctx.fillRect(ox + 8,  4, 8, 2);
  ctx.fillRect(ox + 11, 3, 2, 2);
  ctx.fillStyle = '#a86a30';
  ctx.fillRect(ox + 11, 7, 2, 3);

  // ── Torso (above waterline) ────────────────────────────────────────────
  ctx.fillStyle = SKIN;
  ctx.fillRect(ox + 7, 12, 10, 8);

  // ── Fur shoulder strap ────────────────────────────────────────────────
  ctx.fillStyle = FUR;
  ctx.fillRect(ox + 5, 10, 14, 4);
  ctx.fillStyle = FUR_D;
  ctx.fillRect(ox + 5, 10, 14, 1);
  ctx.fillRect(ox + 6, 12, 2, 2);
  ctx.fillRect(ox + 16, 12, 2, 2);

  // ── Arms (horizontal swim stroke) ─────────────────────────────────────
  ctx.fillStyle = SKIN;
  if (!pulling) {
    // Reaching: arms extended wide to both sides
    ctx.fillRect(ox + 0,  14, 7, 4);
    ctx.fillRect(ox + 17, 14, 7, 4);
  } else {
    // Pulling: arms swept downward and back
    ctx.fillRect(ox + 1,  17, 6, 4);
    ctx.fillRect(ox + 17, 17, 6, 4);
  }

  // ── Waterline ripple ──────────────────────────────────────────────────
  ctx.fillStyle = 'rgba(80, 155, 230, 0.8)';
  ctx.fillRect(ox + 0, 21, 24, 3);
  ctx.fillStyle = 'rgba(160, 210, 255, 0.55)';
  ctx.fillRect(ox + 2,  20, 4, 1);
  ctx.fillRect(ox + 10, 20, 4, 1);
  ctx.fillRect(ox + 18, 20, 4, 1);
  // y >= 24: transparent — water tile visible below
}
