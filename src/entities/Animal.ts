import Phaser from 'phaser';
import { TILE_SIZE, FIRE_WOLF_REPEL_RADIUS, HUNT_RANGE_PX, SNEAK_AWARENESS_MULT } from '../constants';
import { WorldGenerator } from '../world/WorldGenerator';
import { TILE_META, TileType } from '../world/TileTypes';
import { TimeOfDay } from '../systems/TimeSystem';
import { SoundSystem } from '../systems/SoundSystem';

export enum AnimalType {
  DEER   = 'deer',
  RABBIT = 'rabbit',
  PIG    = 'pig',
  WOLF   = 'wolf',
}

interface AnimalConfig {
  texture:         string;
  scale:           number;
  maxHealth:       number;  // HP — larger animals have more
  wanderTileMs:    number;  // ms per tile while wandering
  fleeTileMs:      number;  // ms per tile at max pressure (lower = faster)
  awarenessRadius: number;  // px — pressure fades in from this distance
  hopPauseMs?:     number;  // ms pause between tiles (rabbit only)
  wanderMin:       number;
  wanderMax:       number;
  idleMin:         number;
  idleMax:         number;
  nocturnal?:      boolean; // dormant during day, active at night
  attracted?:      boolean; // moves toward player instead of away
  biteRangePx?:    number;  // px radius to deal damage
  biteDamage?:     number;  // HP per bite
  biteCooldownMs?: number;  // ms between bites
}

const CONFIGS: Record<AnimalType, AnimalConfig> = {
  [AnimalType.DEER]: {
    texture:         'animal_deer',
    scale:           1.8,
    maxHealth:       3,
    wanderTileMs:    420,
    fleeTileMs:       95,
    awarenessRadius: 360,
    wanderMin: 3000, wanderMax: 7000,
    idleMin:   2000, idleMax:   5000,
  },
  [AnimalType.RABBIT]: {
    texture:         'animal_rabbit',
    scale:           1.6,
    maxHealth:       1,
    wanderTileMs:    200,
    fleeTileMs:       80,
    awarenessRadius: 260,
    hopPauseMs:      340,
    wanderMin:  600, wanderMax: 2000,
    idleMin:    500, idleMax:   2000,
  },
  [AnimalType.PIG]: {
    texture:         'animal_pig',
    scale:           2.0,
    maxHealth:       4,
    wanderTileMs:    900,
    fleeTileMs:      520,
    awarenessRadius: 180,
    wanderMin: 3000, wanderMax: 8000,
    idleMin:   2000, idleMax:   6000,
  },
  [AnimalType.WOLF]: {
    texture:         'animal_wolf',
    scale:           1.5,
    maxHealth:       5,
    wanderTileMs:    280,
    fleeTileMs:       90,
    awarenessRadius: 500,
    wanderMin: 1500, wanderMax: 4000,
    idleMin:   1000, idleMax:   2500,
    nocturnal:       true,
    attracted:       true,
    biteRangePx:     90,
    biteDamage:      20,
    biteCooldownMs:  2000,
  },
};

type AnimalState = 'idle' | 'wander' | 'retreating' | 'hiding' | 'dormant';

export class Animal {
  readonly sprite: Phaser.GameObjects.Sprite;
  private scene: Phaser.Scene;
  private world: WorldGenerator;
  private cfg: AnimalConfig;

  // Tile grid position — same pattern as Player.ts
  private _tx: number;
  private _ty: number;
  private targetTx: number;
  private targetTy: number;
  private moveProgress = 1.0; // 1.0 = arrived at target tile

  private state: AnimalState = 'idle';
  private stateTimer = 0;

  // Rabbit: pause after arriving at each tile before the next hop
  private hopPauseTimer = 0;
  private inHopPause    = false;

  // Night retreat / hole retreat
  private retreatTx: number | null = null;
  private retreatTy: number | null = null;
  private prevTimeOfDay: TimeOfDay | null = null;

  // Rabbit hole home
  private homeTx: number | null = null;
  private homeTy: number | null = null;
  private static readonly HOME_RADIUS = 5; // max tiles from hole while wandering

  private _dead = false;
  private _type: AnimalType;
  private lastBiteMs = 0;
  private soundTimer = 0;
  private soundSystem: SoundSystem | null = null;

  private _health: number;
  private _maxHealth: number;
  private healthBar: Phaser.GameObjects.Graphics;

  get health(): number { return this._health; }
  get maxHealth(): number { return this._maxHealth; }

  constructor(
    scene: Phaser.Scene,
    world: WorldGenerator,
    type: AnimalType,
    x: number,
    y: number,
    depth: number,
    soundSystem?: SoundSystem,
    home?: { tx: number; ty: number },
  ) {
    this.scene       = scene;
    this.world       = world;
    this.cfg         = CONFIGS[type];
    this._type       = type;
    this.soundSystem = soundSystem ?? null;
    if (home) { this.homeTx = home.tx; this.homeTy = home.ty; }
    // Stagger ambient sounds so all animals don't play at once
    this.soundTimer  = Phaser.Math.Between(2000, 10000);

    this._tx      = Math.floor(x / TILE_SIZE);
    this._ty      = Math.floor(y / TILE_SIZE);
    this.targetTx = this._tx;
    this.targetTy = this._ty;

    this._health    = this.cfg.maxHealth;
    this._maxHealth = this.cfg.maxHealth;

    this.sprite = scene.add.sprite(
      this._tx * TILE_SIZE + TILE_SIZE / 2,
      this._ty * TILE_SIZE + TILE_SIZE / 2,
      this.cfg.texture,
    ).setScale(this.cfg.scale).setDepth(depth);
    this.setupAnims();

    this.healthBar = scene.add.graphics().setDepth(depth + 0.1).setVisible(false);

    // Nocturnal animals (wolves) start dormant and invisible during day
    if (this.cfg.nocturnal) {
      this.state = 'dormant';
      this.sprite.setVisible(false);
    } else {
      this.stateTimer = Phaser.Math.Between(0, 2000);
    }
  }

  get dead(): boolean { return this._dead; }
  get type(): AnimalType { return this._type; }
  /** True when the animal should appear on the minimap. */
  get visibleOnMap(): boolean {
    return !this._dead && this.state !== 'dormant' && this.state !== 'hiding';
  }

  /** Meat dropped on successful kill (varies by animal size). */
  get meatYield(): number {
    return { [AnimalType.DEER]: 3, [AnimalType.PIG]: 2, [AnimalType.RABBIT]: 1, [AnimalType.WOLF]: 2 }[this._type];
  }

  /**
   * Returns damage dealt if the animal bites the player this frame, else 0.
   * Call once per frame from the scene; pass scene.time.now.
   */
  checkBite(playerX: number, playerY: number, now: number): number {
    if (this._dead || !this.cfg.biteRangePx || this.state === 'dormant') return 0;
    const dx = this.sprite.x - playerX;
    const dy = this.sprite.y - playerY;
    if (dx * dx + dy * dy > this.cfg.biteRangePx ** 2) return 0;
    if (now - this.lastBiteMs < (this.cfg.biteCooldownMs ?? 2000)) return 0;
    this.lastBiteMs = now;
    return this.cfg.biteDamage ?? 0;
  }

  private setupAnims(): void {
    const idle = `${this.cfg.texture}_idle`;
    const walk = `${this.cfg.texture}_walk`;
    if (this.scene.anims.exists(idle)) return;
    this.scene.anims.create({
      key: idle,
      frames: [{ key: this.cfg.texture, frame: 0 }],
      frameRate: 1,
      repeat: -1,
    });
    this.scene.anims.create({
      key: walk,
      frames: this.scene.anims.generateFrameNumbers(this.cfg.texture, { start: 1, end: 2 }),
      frameRate: 6,
      repeat: -1,
    });
    this.sprite.play(idle);
  }

  private playAnim(key: string): void {
    if (this.sprite.anims.currentAnim?.key !== key) this.sprite.play(key);
  }

  /** Deal damage to this animal. Returns true if it dies. */
  takeDamage(amount: number): boolean {
    if (this._dead) return false;
    this._health = Math.max(0, this._health - amount);
    this.redrawHealthBar();
    if (this._health <= 0) { this.kill(); return true; }
    // Flash red on hit
    this.scene.tweens.add({
      targets: this.sprite, alpha: 0.3, duration: 80, yoyo: true,
    });
    return false;
  }

  private redrawHealthBar(): void {
    const BAR_W = 28;
    const BAR_H = 4;
    const bx = -BAR_W / 2;
    const by = -(this.sprite.displayHeight / 2) - 8;
    this.healthBar.clear();
    // Background
    this.healthBar.fillStyle(0x440000, 0.9);
    this.healthBar.fillRect(bx, by, BAR_W, BAR_H);
    // Fill
    const frac = this._health / this._maxHealth;
    const color = frac > 0.5 ? 0x44cc44 : frac > 0.25 ? 0xddaa00 : 0xcc2222;
    this.healthBar.fillStyle(color, 1);
    this.healthBar.fillRect(bx, by, Math.round(BAR_W * frac), BAR_H);
    // Border
    this.healthBar.lineStyle(1, 0x000000, 0.8);
    this.healthBar.strokeRect(bx, by, BAR_W, BAR_H);
    this.healthBar.setVisible(this._health < this._maxHealth);
  }

  kill(): void {
    if (this._dead) return;
    this._dead = true;
    this.healthBar.destroy();
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0, scaleX: 0, scaleY: 0,
      duration: 400,
      ease: 'Power2',
      onComplete: () => this.sprite.destroy(),
    });
  }

  update(delta: number, playerX: number, playerY: number, timeOfDay: TimeOfDay, fires: { x: number; y: number }[] = [], playerSneaking = false): void {
    if (this._dead) return;
    const isNight = timeOfDay === 'dusk' || timeOfDay === 'night';
    const isDay   = timeOfDay === 'dawn' || timeOfDay === 'day';

    // Sneaking reduces effective awareness radius
    const effectiveAwareness = this.cfg.awarenessRadius * (playerSneaking ? SNEAK_AWARENESS_MULT : 1);

    // --- Nocturnal animals: dormant during day, active at night ---
    if (this.cfg.nocturnal) {
      if (this.state === 'dormant') {
        if (isNight) {
          this.sprite.setVisible(true).setAlpha(0);
          this.scene.tweens.add({ targets: this.sprite, alpha: 1, duration: 1200 });
          this.state      = 'wander';
          this.stateTimer = Phaser.Math.Between(this.cfg.wanderMin, this.cfg.wanderMax);
          // Bark when emerging at night (distance-attenuated)
          {
            const d = Math.sqrt((this.sprite.x - playerX) ** 2 + (this.sprite.y - playerY) ** 2);
            const v = Math.max(0, 1 - d / 1200) * 0.85;
            if (v > 0.04) this.soundSystem?.playWolfHowl(v);
          }
        } else {
          return;
        }
      } else if (isDay) {
        this.scene.tweens.add({
          targets: this.sprite, alpha: 0, duration: 800,
          onComplete: () => { this.sprite.setVisible(false); this.sprite.setAlpha(1); },
        });
        this.state = 'dormant';
        return;
      }
      // Fall through to shared movement logic below
    } else {
      // --- Diurnal animals: hide at night, emerge at dawn ---

      if (this.homeTx !== null) {
        // Hole-bound rabbit: hide when player is close OR at night
        if (this.state === 'hiding') {
          // Emerge when player is far enough away and it's day
          const dx2 = this.sprite.x - playerX, dy2 = this.sprite.y - playerY;
          const farEnough = dx2 * dx2 + dy2 * dy2 > (effectiveAwareness * 1.6) ** 2;
          if (isDay && farEnough) {
            this.sprite.setVisible(true).setAlpha(0);
            this.scene.tweens.add({ targets: this.sprite, alpha: 1, duration: 800 });
            this.state      = 'wander';
            this.stateTimer = Phaser.Math.Between(this.cfg.wanderMin, this.cfg.wanderMax);
            this.retreatTx  = null;
            this.retreatTy  = null;
          }
          return;
        }

        // Trigger hide: player too close OR night arrived
        // Exception: animal is "cornered" within hunt range — stays visible
        const adx2 = this.sprite.x - playerX, ady2 = this.sprite.y - playerY;
        const dist2 = adx2 * adx2 + ady2 * ady2;
        const tooClose = dist2 < effectiveAwareness ** 2;
        const cornered = dist2 < HUNT_RANGE_PX ** 2;
        if ((tooClose && !cornered || isNight) && this.state !== 'retreating') {
          this.retreatTx  = this.homeTx;
          this.retreatTy  = this.homeTy!;
          this.state      = 'retreating';
          this.stateTimer = 0;
          this.inHopPause = false;
        }
      } else {
        // Normal diurnal: hide in forest at night
        if (this.state === 'hiding') {
          if (isDay) {
            this.sprite.setVisible(true).setAlpha(0);
            this.scene.tweens.add({ targets: this.sprite, alpha: 1, duration: 1500 });
            this.state      = 'wander';
            this.stateTimer = Phaser.Math.Between(this.cfg.wanderMin, this.cfg.wanderMax);
            this.retreatTx  = null;
            this.retreatTy  = null;
          } else {
            return;
          }
        }

        if (isNight && this.state !== 'retreating') {
          const forest = this.findNearestForest();
          if (forest) { this.retreatTx = forest.tx; this.retreatTy = forest.ty; }
          this.state      = 'retreating';
          this.stateTimer = 0;
          this.inHopPause = false;
        }
      }
    }

    if (!this.cfg.nocturnal && this.state === 'retreating') {
      // Slide to current target tile first
      if (this.moveProgress < 1) {
        this.moveProgress = Math.min(1, this.moveProgress + delta / this.cfg.wanderTileMs);
        const fromX = this._tx      * TILE_SIZE + TILE_SIZE / 2;
        const fromY = this._ty      * TILE_SIZE + TILE_SIZE / 2;
        const toX   = this.targetTx * TILE_SIZE + TILE_SIZE / 2;
        const toY   = this.targetTy * TILE_SIZE + TILE_SIZE / 2;
        this.sprite.x = fromX + (toX - fromX) * this.moveProgress;
        this.sprite.y = fromY + (toY - fromY) * this.moveProgress;
        this.playAnim(`${this.cfg.texture}_walk`);
        if (this.moveProgress >= 1) {
          this._tx = this.targetTx;
          this._ty = this.targetTy;
          this.sprite.x = toX;
          this.sprite.y = toY;
        }
        return;
      }
      // Arrived at a tile — check if we've reached the retreat destination
      const atHole = this.homeTx !== null && this._tx === this.retreatTx && this._ty === this.retreatTy;
      const atForest = this.homeTx === null && this.world.getTile(this._tx, this._ty) === TileType.FOREST;
      if (atHole || atForest) {
        this.scene.tweens.add({
          targets: this.sprite, alpha: 0, duration: 400,
          onComplete: () => this.sprite.setVisible(false).setAlpha(1),
        });
        this.state = 'hiding';
        return;
      }
      // Not there yet — pick next step toward retreat target
      const target = this.retreatTx !== null
        ? { tx: this.retreatTx, ty: this.retreatTy! }
        : null;
      const next = target ? this.pickNextTileToward(target.tx, target.ty) : null;
      if (next) {
        this.targetTx     = next.tx;
        this.targetTy     = next.ty;
        this.moveProgress = 0;
        if (next.tx !== this._tx) this.sprite.setFlipX(next.tx < this._tx);
      }
      return;
    }

    // ---- Ambient sound tick (every active frame, not just when arrived at tile) ----
    // Keep health bar positioned above sprite
    this.healthBar.setPosition(this.sprite.x, this.sprite.y);

    this.soundTimer -= delta;
    if (this.soundTimer <= 0) {
      const dist2 = (this.sprite.x - playerX) ** 2 + (this.sprite.y - playerY) ** 2;
      const vol   = Math.max(0, 1 - Math.sqrt(dist2) / 1200) * 0.8;
      if (vol > 0.04) this.soundSystem?.playAnimalAmbient(this._type, vol);
      this.soundTimer = Phaser.Math.Between(7000, 18000);
    }

    // Quadratic pressure field — 0 at awareness boundary, rises to 1 at contact.
    // No hard edge: avoidance grows gradually as player closes in.
    const adx  = this.sprite.x - playerX;
    const ady  = this.sprite.y - playerY;
    const dist = Math.sqrt(adx * adx + ady * ady);
    const t    = Math.max(0, 1 - dist / effectiveAwareness);
    const pressure = t * t;

    // ---- Slide between tiles ----
    if (this.moveProgress < 1) {
      // Speed scales continuously with pressure (wander → flee speed)
      const tileMs = this.cfg.wanderTileMs +
        (this.cfg.fleeTileMs - this.cfg.wanderTileMs) * pressure;

      this.moveProgress = Math.min(1, this.moveProgress + delta / tileMs);

      const fromX = this._tx      * TILE_SIZE + TILE_SIZE / 2;
      const fromY = this._ty      * TILE_SIZE + TILE_SIZE / 2;
      const toX   = this.targetTx * TILE_SIZE + TILE_SIZE / 2;
      const toY   = this.targetTy * TILE_SIZE + TILE_SIZE / 2;
      this.sprite.x = fromX + (toX - fromX) * this.moveProgress;
      this.sprite.y = fromY + (toY - fromY) * this.moveProgress;

      this.playAnim(`${this.cfg.texture}_walk`);

      if (this.moveProgress >= 1) {
        this._tx = this.targetTx;
        this._ty = this.targetTy;
        // Snap exactly to center
        this.sprite.x = toX;
        this.sprite.y = toY;
        // Rabbit hop pause (only when calm — skipped mid-flee)
        if (this.cfg.hopPauseMs && pressure < 0.35) {
          this.inHopPause    = true;
          this.hopPauseTimer = this.cfg.hopPauseMs;
        }
      }
      return;
    }

    // ---- Arrived at tile ----

    // Rabbit: wait out the hop pause
    if (this.inHopPause) {
      this.hopPauseTimer -= delta;
      if (this.hopPauseTimer > 0) return;
      this.inHopPause = false;
    }

    this.playAnim(`${this.cfg.texture}_idle`);

    // State machine always ticks — pressure only affects speed and direction
    this.stateTimer -= delta;
    if (this.stateTimer <= 0) {
      if (this.state === 'idle') {
        this.state      = 'wander';
        this.stateTimer = Phaser.Math.Between(this.cfg.wanderMin, this.cfg.wanderMax);
      } else {
        // Don't go idle if under significant pressure — keep moving away
        if (pressure < 0.25) {
          this.state      = 'idle';
          this.stateTimer = Phaser.Math.Between(this.cfg.idleMin, this.cfg.idleMax);
        } else {
          // Extend wander briefly and check again soon
          this.stateTimer = 500;
        }
      }
    }

    // Wake from idle when player gets close enough to matter
    if (this.state === 'idle' && pressure > 0.18) {
      this.state      = 'wander';
      this.stateTimer = Phaser.Math.Between(this.cfg.wanderMin, this.cfg.wanderMax);
    }

    if (this.state === 'idle') return;

    // ---- Fire repulsion for wolves ----
    // If a fire is closer / stronger than the player, wolves flee from it instead
    let threatX      = playerX;
    let threatY      = playerY;
    let effectivePressure = pressure;
    let forceRepel   = false;

    if (this._type === AnimalType.WOLF && fires.length > 0) {
      for (const fire of fires) {
        const fdx  = this.sprite.x - fire.x;
        const fdy  = this.sprite.y - fire.y;
        const fdist = Math.sqrt(fdx * fdx + fdy * fdy);
        const ft   = Math.max(0, 1 - fdist / FIRE_WOLF_REPEL_RADIUS);
        const fp   = ft * ft;
        if (fp > effectivePressure) {
          effectivePressure = fp;
          threatX    = fire.x;
          threatY    = fire.y;
          forceRepel = true;
        }
      }
    }

    // ---- Pick next tile ----
    const next = this.pickNextTile(effectivePressure, threatX, threatY, forceRepel);
    if (!next || (next.tx === this._tx && next.ty === this._ty)) return;

    this.targetTx     = next.tx;
    this.targetTy     = next.ty;
    this.moveProgress = 0;

    if (next.tx !== this._tx) this.sprite.setFlipX(next.tx < this._tx);
  }

  /** Find the nearest forest tile by spiral search. */
  private findNearestForest(): { tx: number; ty: number } | null {
    for (let r = 1; r <= 20; r++) {
      for (let dx = -r; dx <= r; dx++) {
        for (let dy = -r; dy <= r; dy++) {
          if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
          const nx = this._tx + dx;
          const ny = this._ty + dy;
          if (this.world.getTile(nx, ny) === TileType.FOREST) return { tx: nx, ty: ny };
        }
      }
    }
    return null;
  }

  /** Pick adjacent walkable tile that minimises Manhattan distance to target. */
  private pickNextTileToward(targetTx: number, targetTy: number): { tx: number; ty: number } | null {
    const candidates = [
      { tx: this._tx - 1, ty: this._ty },
      { tx: this._tx + 1, ty: this._ty },
      { tx: this._tx,     ty: this._ty - 1 },
      { tx: this._tx,     ty: this._ty + 1 },
    ].filter(c => {
      const tile = this.world.getTile(c.tx, c.ty);
      return TILE_META[tile].walkable && tile !== TileType.WATER;
    });

    if (candidates.length === 0) return null;

    candidates.sort((a, b) => {
      const da = Math.abs(a.tx - targetTx) + Math.abs(a.ty - targetTy);
      const db = Math.abs(b.tx - targetTx) + Math.abs(b.ty - targetTy);
      return da - db;
    });
    return candidates[0];
  }

  /**
   * Scores adjacent tiles by blending flee-direction alignment with randomness,
   * weighted by pressure. At pressure=0 it's pure random wander; at pressure=1
   * it reliably picks the tile most aligned with the away direction.
   * This removes the hard "repulsion circle" snap.
   */
  private pickNextTile(
    pressure: number,
    playerX: number,
    playerY: number,
    forceRepel = false,
  ): { tx: number; ty: number } | null {
    const tx = this._tx;
    const ty = this._ty;

    let candidates = [
      { tx: tx - 1, ty },
      { tx: tx + 1, ty },
      { tx,         ty: ty - 1 },
      { tx,         ty: ty + 1 },
    ].filter(c => {
      const tile = this.world.getTile(c.tx, c.ty);
      return TILE_META[tile].walkable && tile !== TileType.WATER;
    });

    // Restrict hole-bound rabbits to wander within HOME_RADIUS of their hole
    if (this.homeTx !== null) {
      const bounded = candidates.filter(c =>
        Math.abs(c.tx - this.homeTx!) <= Animal.HOME_RADIUS &&
        Math.abs(c.ty - this.homeTy!) <= Animal.HOME_RADIUS,
      );
      if (bounded.length > 0) candidates = bounded;
    }

    if (candidates.length === 0) return null;

    // Normalised away vector
    const awX = this.sprite.x - playerX;
    const awY = this.sprite.y - playerY;
    const len = Math.sqrt(awX * awX + awY * awY) || 1;
    const nax = awX / len;
    const nay = awY / len;

    const scored = candidates.map(c => {
      const dot      = (c.tx - tx) * nax + (c.ty - ty) * nay; // [-1, 1]
      // Flee animals move away; attracted animals move toward — forceRepel overrides attracted
      const attract  = !forceRepel && !!this.cfg.attracted;
      const bias     = attract ? (1 - dot) / 2 : (dot + 1) / 2;
      const random   = Math.random();
      return { ...c, score: bias * pressure + random * (1 - pressure) };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0];
  }
}
