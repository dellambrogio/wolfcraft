import Phaser from 'phaser';
import { TILE_SIZE, DEPTH_PLAYER, FIRE_DURATION_MS } from '../constants';

export class Fire {
  readonly x: number;
  readonly y: number;

  private scene: Phaser.Scene;
  private gfx: Phaser.GameObjects.Graphics;
  private timeLeft: number;
  private flickerTimer = 0;
  private _expired = false;

  constructor(scene: Phaser.Scene, tileX: number, tileY: number) {
    this.scene = scene;
    this.x = tileX * TILE_SIZE + TILE_SIZE / 2;
    this.y = tileY * TILE_SIZE + TILE_SIZE / 2;
    this.timeLeft = FIRE_DURATION_MS;

    this.gfx = scene.add.graphics().setDepth(DEPTH_PLAYER - 1).setAlpha(0);
    this.drawFlame(1.0);
    scene.tweens.add({ targets: this.gfx, alpha: 1, duration: 600 });
  }

  get expired(): boolean { return this._expired; }

  private drawFlame(flicker: number): void {
    const g = this.gfx;
    g.clear();

    const x = this.x;
    const y = this.y + TILE_SIZE * 0.15; // sit slightly below center
    const h = 20 + flicker * 12;
    const sw = flicker * 3; // sway offset

    // Ground ash / ember ring
    g.fillStyle(0x442200, 0.9);
    g.fillEllipse(x, y + 4, 24, 9);

    // Outer glow
    g.fillStyle(0xff5500, 0.06);
    g.fillCircle(x, y - h * 0.15, h * 1.8);
    g.fillStyle(0xff8800, 0.05);
    g.fillCircle(x, y - h * 0.25, h * 1.2);

    // Outer flame (dark orange)
    g.fillStyle(0xff3300, 0.88);
    g.fillTriangle(x - 10, y + 2, x + 10, y + 2, x + sw, y - h);

    // Mid flame (orange)
    g.fillStyle(0xff7700, 0.92);
    g.fillTriangle(x - 7, y, x + 7, y, x + sw * 0.6, y - h * 0.82);

    // Inner flame (yellow)
    g.fillStyle(0xffcc00, 1);
    g.fillTriangle(x - 4, y - 2, x + 4, y - 2, x + sw * 0.3, y - h * 0.60);

    // Core (bright white-yellow)
    g.fillStyle(0xffee88, 1);
    g.fillTriangle(x - 2, y - 2, x + 2, y - 2, x, y - h * 0.38);
  }

  update(delta: number): void {
    if (this._expired) return;

    this.timeLeft -= delta;

    this.flickerTimer -= delta;
    if (this.flickerTimer <= 0) {
      this.flickerTimer = 60 + Math.random() * 110;
      this.drawFlame(0.3 + Math.random() * 0.7);
    }

    // Fade out in the final 10 % of lifetime
    const lifeRatio = this.timeLeft / FIRE_DURATION_MS;
    if (lifeRatio < 0.1) {
      this.gfx.setAlpha(lifeRatio / 0.1);
    }

    if (this.timeLeft <= 0) {
      this._expired = true;
      this.scene.tweens.add({
        targets: this.gfx, alpha: 0, duration: 800,
        onComplete: () => this.gfx.destroy(),
      });
    }
  }
}
