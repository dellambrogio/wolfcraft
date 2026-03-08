import Phaser from 'phaser';
import { ResourceSystem } from '../systems/ResourceSystem';
import { TimeSystem } from '../systems/TimeSystem';
import { DEPTH_HUD, MAP_WIDTH, MAP_HEIGHT, TILE_SIZE, FOG_RADIUS } from '../constants';
import { Animal, AnimalType } from '../entities/Animal';
import { FogOfWar } from '../systems/FogOfWar';
import { Toolbelt } from './Toolbelt';
import { BORDER, TEXT } from './palette';

export class HUD {
  private scene: Phaser.Scene;
  private resourceSystem: ResourceSystem;
  private timeSystem: TimeSystem;
  private toolbelt!: Toolbelt;

  private uiObjects: Phaser.GameObjects.GameObject[] = [];
  private dayText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;

  private healthBarBg!: Phaser.GameObjects.Graphics;
  private healthBarFill!: Phaser.GameObjects.Graphics;
  private healthText!: Phaser.GameObjects.Text;
  private hpBar = { x: 0, top: 0, w: 0, h: 0 };
  private minimapDot!: Phaser.GameObjects.Graphics;
  private minimapFogRT!: Phaser.GameObjects.RenderTexture;
  private minimap = { x: 0, y: 0, w: 0, h: 0 };
  private lastMinimapTx = -9999;
  private lastMinimapTy = -9999;

  constructor(scene: Phaser.Scene, resources: ResourceSystem, time: TimeSystem) {
    this.scene = scene;
    this.resourceSystem = resources;
    this.timeSystem = time;
    this.create();
  }

  private create(): void {
    const { width, height } = this.scene.scale;

    const baseStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    };

    this.toolbelt = new Toolbelt(this.scene, this.resourceSystem, width, height);

    const track = <T extends Phaser.GameObjects.GameObject>(o: T): T => {
      this.uiObjects.push(o); return o;
    };

    this.dayText = track(this.scene.add.text(width - 10, 72, '', { ...baseStyle, color: TEXT.WHITE })
      .setOrigin(1, 0).setScrollFactor(0).setDepth(DEPTH_HUD));
    this.timeText = track(this.scene.add.text(width - 10, 90, '', { ...baseStyle, color: TEXT.LABEL })
      .setOrigin(1, 0).setScrollFactor(0).setDepth(DEPTH_HUD));

    // --- Health bar (bottom-left, vertical) ---
    // Toolbelt occupies bottom 86 px (LABEL_H=16 + SLOT_SIZE=54 + PAD*2=16)
    const TOOLBELT_H = 86;
    const BAR_W  = 18;
    const BAR_H  = 130;
    const BAR_X  = 14;
    const BAR_BOTTOM = height - TOOLBELT_H - 10;
    const BAR_TOP    = BAR_BOTTOM - BAR_H;
    this.hpBar = { x: BAR_X, top: BAR_TOP, w: BAR_W, h: BAR_H };

    // Heart icon above bar
    track(this.scene.add.text(BAR_X + BAR_W / 2, BAR_TOP - 20, '❤', {
      fontFamily: 'monospace', fontSize: '15px', color: '#ff4444',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(DEPTH_HUD));

    // Background
    this.healthBarBg = track(this.scene.add.graphics()
      .setScrollFactor(0).setDepth(DEPTH_HUD)) as Phaser.GameObjects.Graphics;
    this.healthBarBg.fillStyle(0x330000, 0.85);
    this.healthBarBg.fillRect(BAR_X, BAR_TOP, BAR_W, BAR_H);
    this.healthBarBg.lineStyle(1, 0x880000, 1);
    this.healthBarBg.strokeRect(BAR_X, BAR_TOP, BAR_W, BAR_H);

    // Fill (redrawn each frame)
    this.healthBarFill = track(this.scene.add.graphics()
      .setScrollFactor(0).setDepth(DEPTH_HUD + 1)) as Phaser.GameObjects.Graphics;

    // HP number below bar
    this.healthText = track(this.scene.add.text(BAR_X + BAR_W / 2, BAR_BOTTOM + 4, '100', {
      fontFamily: 'monospace', fontSize: '11px', color: '#ffffff', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(DEPTH_HUD + 2));

    // --- Minimap (bottom-right corner) ---
    const MINI_W = 160;
    const MINI_H = 120;
    const MINI_PAD = 8;
    const LABEL_H_MM = 14;
    const miniX = width - MINI_W - MINI_PAD;
    const miniY = height - MINI_H - MINI_PAD;

    // Panel background
    track(this.scene.add.rectangle(miniX - 2, miniY - LABEL_H_MM - 2, MINI_W + 4, MINI_H + LABEL_H_MM + 4, 0x000000, 0.7)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(DEPTH_HUD));

    // "MAP" label
    track(this.scene.add.text(miniX + MINI_W / 2, miniY - LABEL_H_MM + 1, 'MAP', {
      fontFamily: 'monospace', fontSize: '9px', color: TEXT.MID,
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(DEPTH_HUD + 1));

    // World biome image — world_bg is MAP_WIDTH*4 × MAP_HEIGHT*4, scale to MINI_W×MINI_H
    const bgScale = MINI_W / (MAP_WIDTH * 4);
    track(this.scene.add.image(miniX, miniY, 'world_bg')
      .setOrigin(0, 0).setScale(bgScale).setScrollFactor(0).setDepth(DEPTH_HUD + 1));

    // Fog of war overlay — black RT, erased progressively as tiles are explored
    const pxPerTile = MINI_W / MAP_WIDTH;
    const brushR    = (FOG_RADIUS + 0.8) * pxPerTile;
    const brushD    = Math.ceil(brushR * 2 + 2);
    const brushHalf = brushD / 2;
    const brushCanvas = document.createElement('canvas');
    brushCanvas.width  = brushD;
    brushCanvas.height = brushD;
    const bctx = brushCanvas.getContext('2d')!;
    const grad = bctx.createRadialGradient(brushHalf, brushHalf, 0, brushHalf, brushHalf, brushHalf);
    grad.addColorStop(0,    'rgba(255,255,255,1)');
    grad.addColorStop(0.55, 'rgba(255,255,255,1)');
    grad.addColorStop(1.0,  'rgba(255,255,255,0)');
    bctx.fillStyle = grad;
    bctx.fillRect(0, 0, brushD, brushD);
    this.scene.textures.addCanvas('minimap_fog_brush', brushCanvas);

    this.minimapFogRT = track(
      this.scene.add.renderTexture(miniX, miniY, MINI_W, MINI_H)
        .setOrigin(0, 0).setScrollFactor(0).setDepth(DEPTH_HUD + 2),
    ) as Phaser.GameObjects.RenderTexture;
    this.minimapFogRT.fill(0x000000, 1);

    // Border
    const borderG = track(this.scene.add.graphics().setScrollFactor(0).setDepth(DEPTH_HUD + 3)) as Phaser.GameObjects.Graphics;
    borderG.lineStyle(1, BORDER.BRIGHT, 1);
    borderG.strokeRect(miniX, miniY, MINI_W, MINI_H);

    // Player dot (redrawn each frame)
    this.minimapDot = track(this.scene.add.graphics()
      .setScrollFactor(0).setDepth(DEPTH_HUD + 4)) as Phaser.GameObjects.Graphics;

    this.minimap = { x: miniX, y: miniY, w: MINI_W, h: MINI_H };
  }

  getGameObjects(): Phaser.GameObjects.GameObject[] {
    return [...this.uiObjects, ...this.toolbelt.getGameObjects()];
  }

  get equippedTool() { return this.toolbelt.equippedTool; }

  showGatherHint(show: boolean): void {
    this.toolbelt.showGatherHint(show);
  }

  update(playerHealth = 100, maxHealth = 100, playerX = 0, playerY = 0, animals: Animal[] = [], fog?: FogOfWar): void {
    this.toolbelt.update();

    this.dayText.setText(`Day ${this.timeSystem.currentDay}`);
    this.timeText.setText(this.timeSystem.hourLabel);

    // Health bar — vertical, fills from bottom
    const { x: bx, top: bt, w: bw, h: bh } = this.hpBar;
    const frac = Math.max(0, playerHealth / maxHealth);
    const fillColor = frac > 0.5 ? 0x44cc44 : frac > 0.25 ? 0xddaa00 : 0xcc2222;
    const fillH = Math.floor((bh - 2) * frac);
    this.healthBarFill.clear();
    this.healthBarFill.fillStyle(fillColor, 1);
    this.healthBarFill.fillRect(bx + 1, bt + bh - 1 - fillH, bw - 2, fillH);
    this.healthText.setText(String(playerHealth));

    // Minimap fog reveal — erase fog RT when player enters a new tile
    const worldW = MAP_WIDTH * TILE_SIZE;
    const worldH = MAP_HEIGHT * TILE_SIZE;
    const { x: mx, y: my, w: mw, h: mh } = this.minimap;
    const tileX = Math.floor(playerX / TILE_SIZE);
    const tileY = Math.floor(playerY / TILE_SIZE);
    if (tileX !== this.lastMinimapTx || tileY !== this.lastMinimapTy) {
      this.lastMinimapTx = tileX;
      this.lastMinimapTy = tileY;
      const localX = (tileX + 0.5) * (mw / MAP_WIDTH);
      const localY = (tileY + 0.5) * (mh / MAP_HEIGHT);
      this.minimapFogRT.erase('minimap_fog_brush', localX, localY);
    }

    // Minimap player dot + camera viewport
    const dotX = mx + (playerX / worldW) * mw;
    const dotY = my + (playerY / worldH) * mh;

    const cam = this.scene.cameras.main;
    const vw = (cam.worldView.width  / worldW) * mw;
    const vh = (cam.worldView.height / worldH) * mh;

    const ANIMAL_COLOR: Record<AnimalType, number> = {
      [AnimalType.DEER]:   0xd4a060,
      [AnimalType.RABBIT]: 0xcccccc,
      [AnimalType.PIG]:    0xe09070,
      [AnimalType.WOLF]:   0xff3300,
    };

    this.minimapDot.clear();
    // Camera viewport outline
    this.minimapDot.lineStyle(1, 0xffffff, 0.35);
    this.minimapDot.strokeRect(dotX - vw / 2, dotY - vh / 2, vw, vh);
    // Animal dots — only show on discovered tiles
    for (const animal of animals) {
      if (!animal.visibleOnMap) continue;
      const atx = Math.floor(animal.sprite.x / TILE_SIZE);
      const aty = Math.floor(animal.sprite.y / TILE_SIZE);
      if (fog && !fog.isRevealed(atx, aty)) continue;
      const ax = mx + (animal.sprite.x / worldW) * mw;
      const ay = my + (animal.sprite.y / worldH) * mh;
      this.minimapDot.fillStyle(ANIMAL_COLOR[animal.type], 0.9);
      this.minimapDot.fillCircle(ax, ay, animal.type === AnimalType.WOLF ? 2 : 1.5);
    }
    // Player dot (on top)
    this.minimapDot.fillStyle(0xffffff, 1);
    this.minimapDot.fillCircle(dotX, dotY, 2.5);

  }
}
