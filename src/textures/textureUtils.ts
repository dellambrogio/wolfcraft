import Phaser from 'phaser';

type DrawFn = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

export function applyEdgeFade(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const cx = w / 2, cy = h / 2;
  const inner = Math.min(w, h) * 0.28;
  const outer = Math.min(w, h) * 0.64;
  const grad = ctx.createRadialGradient(cx, cy, inner, cx, cy, outer);
  grad.addColorStop(0, 'rgba(0,0,0,1)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalCompositeOperation = 'destination-in';
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'source-over';
}

export function addTileTexture(
  textures: Phaser.Textures.TextureManager,
  key: string,
  w: number,
  h: number,
  draw: DrawFn,
  edgeFade = false,
): void {
  if (textures.exists(key)) return;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  draw(ctx, w, h);
  if (edgeFade) applyEdgeFade(ctx, w, h);
  textures.addCanvas(key, canvas);
}

export function genMaskedVariants(
  textures: Phaser.Textures.TextureManager,
  baseKey: string,
  w: number,
  h: number,
  draw: DrawFn,
): void {
  const base = document.createElement('canvas');
  base.width = w; base.height = h;
  draw(base.getContext('2d')!, w, h);

  const FADE = Math.min(w, h) * 0.40;

  for (let pattern = 0; pattern < 16; pattern++) {
    const key = `${baseKey}_m${pattern}`;
    if (textures.exists(key)) continue;

    const topSame    = (pattern & 1) !== 0;
    const rightSame  = (pattern & 2) !== 0;
    const bottomSame = (pattern & 4) !== 0;
    const leftSame   = (pattern & 8) !== 0;

    const mask = document.createElement('canvas');
    mask.width = w; mask.height = h;
    const mc = mask.getContext('2d')!;
    mc.fillStyle = '#ffffff';
    mc.fillRect(0, 0, w, h);

    const eraseEdge = (
      gx0: number, gy0: number, gx1: number, gy1: number,
      rx: number, ry: number, rw: number, rh: number,
    ) => {
      const g = mc.createLinearGradient(gx0, gy0, gx1, gy1);
      g.addColorStop(0, 'rgba(0,0,0,1)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      mc.globalCompositeOperation = 'destination-out';
      mc.fillStyle = g;
      mc.fillRect(rx, ry, rw, rh);
      mc.globalCompositeOperation = 'source-over';
    };

    if (!topSame)    eraseEdge(0, 0, 0, FADE,     0,        0,        w, FADE);
    if (!bottomSame) eraseEdge(0, h, 0, h - FADE, 0,        h - FADE, w, FADE);
    if (!leftSame)   eraseEdge(0, 0, FADE, 0,     0,        0,        FADE, h);
    if (!rightSame)  eraseEdge(w, 0, w - FADE, 0, w - FADE, 0,        FADE, h);

    const out = document.createElement('canvas');
    out.width = w; out.height = h;
    const oc = out.getContext('2d')!;
    oc.drawImage(base, 0, 0);
    oc.globalCompositeOperation = 'destination-in';
    oc.drawImage(mask, 0, 0);
    oc.globalCompositeOperation = 'source-over';

    textures.addCanvas(key, out);
  }
}
