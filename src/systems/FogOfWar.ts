import Phaser from 'phaser';
import { TILE_SIZE, DEPTH_FOG } from '../constants';

export class FogOfWar {
  private fog: Phaser.GameObjects.RenderTexture;
  private brush: Phaser.GameObjects.Image;
  private lastTx = -9999;
  private lastTy = -9999;
  private radius: number;
  private revealedTiles = new Set<string>();

  constructor(scene: Phaser.Scene, cols: number, rows: number, radius: number) {
    this.radius = radius;

    // Full-map black overlay
    this.fog = scene.add.renderTexture(0, 0, cols * TILE_SIZE, rows * TILE_SIZE)
      .setOrigin(0, 0)
      .setDepth(DEPTH_FOG);
    this.fog.fill(0x000000, 1);

    // Build a soft circular gradient brush on an HTML canvas.
    // White = erase fog; transparent = keep fog.
    // Result: clear in the centre, soft fade at the edge.
    const diameter = (radius * 2 + 1) * TILE_SIZE;
    const half = diameter / 2;

    const canvas = document.createElement('canvas');
    canvas.width = diameter;
    canvas.height = diameter;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createRadialGradient(half, half, 0, half, half, half);
    grad.addColorStop(0,    'rgba(255,255,255,1.0)'); // fully clear
    grad.addColorStop(0.65, 'rgba(255,255,255,1.0)'); // still fully clear
    grad.addColorStop(1.0,  'rgba(255,255,255,0.0)'); // fade to nothing

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, diameter, diameter);

    // Register as a Phaser texture so it can be used as an erase source
    scene.textures.addCanvas('fog_brush', canvas);
    this.brush = scene.make.image({ key: 'fog_brush' });
    this.brush.setVisible(false); // only used as an erase source
  }

  isRevealed(tx: number, ty: number): boolean {
    return this.revealedTiles.has(`${tx},${ty}`);
  }

  /**
   * Call each frame with the player's current tile coords.
   * A new soft-circle erase is issued only when the player enters a new tile.
   */
  reveal(centerTx: number, centerTy: number): void {
    if (centerTx === this.lastTx && centerTy === this.lastTy) return;
    this.lastTx = centerTx;
    this.lastTy = centerTy;

    for (let dy = -this.radius; dy <= this.radius; dy++) {
      for (let dx = -this.radius; dx <= this.radius; dx++) {
        if (dx * dx + dy * dy <= this.radius * this.radius) {
          this.revealedTiles.add(`${centerTx + dx},${centerTy + dy}`);
        }
      }
    }

    // World-space centre of the tile
    const wx = centerTx * TILE_SIZE + TILE_SIZE / 2;
    const wy = centerTy * TILE_SIZE + TILE_SIZE / 2;

    // erase() positions the object's centre (default origin 0.5,0.5) at (wx, wy)
    this.fog.erase(this.brush, wx, wy);
  }
}
