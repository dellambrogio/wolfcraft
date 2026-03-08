import Phaser from 'phaser';
import {
  TILE_SIZE, TILE_MOVE_MS,
  BASE_GATHER_PROB, TOOL_GATHER_PROB, GATHER_COOLDOWN_MS,
  DEPTH_PLAYER,
  WATER_DRAIN_RATE, WATER_SPEED_MULT, WATER_DEADLY_DEPTH,
  SNEAK_SPEED_MULT,
  HEAL_FROM_MEAT, HEAL_FROM_COOKED_MEAT, HEAL_FROM_BREAD, HEAL_FROM_WHEAT,
} from '../constants';
import { Inventory } from '../systems/ResourceSystem';
import { WorldGenerator } from '../world/WorldGenerator';
import { TILE_META, TileType } from '../world/TileTypes';
import { ResourceSystem } from '../systems/ResourceSystem';
import { MapObjects } from '../world/MapObjects';

export class Player {
  private scene: Phaser.Scene;
  private world: WorldGenerator;
  private resources: ResourceSystem;
  private mapObjects: MapObjects;

  readonly sprite: Phaser.GameObjects.Sprite;

  // Tile coords: _tx/_ty = where we came from, target = where we're going
  private _tx: number;
  private _ty: number;
  private targetTx: number;
  private targetTy: number;
  private moveProgress = 1; // 1.0 = arrived, 0.0 = just started

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };
  private gatherKey!:    Phaser.Input.Keyboard.Key;
  private torchKey!:     Phaser.Input.Keyboard.Key;
  private huntKey!:      Phaser.Input.Keyboard.Key;
  private firePlaceKey!: Phaser.Input.Keyboard.Key;
  private eatKey!:       Phaser.Input.Keyboard.Key;
  private shiftKey!:     Phaser.Input.Keyboard.Key;

  private lastGatherTime = 0;
  private _nearGatherable = false;
  private _torchOn = false;
  private _wantsToHunt = false;
  private _sneaking = false;
  private currentMoveDuration = TILE_MOVE_MS;
  private _wantsToPlaceFire = false;
  private _health = 100;
  readonly maxHealth = 100;

  private lastFacingDx = 1; // 1 = right, -1 = left
  private _equippedTool: keyof Inventory | null = null;
  setEquippedTool(tool: keyof Inventory | null): void { this._equippedTool = tool; }

  /** Depth of the water tile the player is currently standing on (0 = dry land). */
  private _waterDepth = 0;
  get waterDepth(): number { return this._waterDepth; }

  /** Accumulates sub-integer water damage until a whole HP can be deducted. */
  private _drainAcc = 0;

  /** Set when the player picks up a grass item; consumed once by GameScene. */
  private _gatheredGrassTile: { tx: number; ty: number } | null = null;
  get gatheredGrassTile(): { tx: number; ty: number } | null {
    const v = this._gatheredGrassTile;
    this._gatheredGrassTile = null;
    return v;
  }

  /** Set when the player picks up a wheat item; consumed once by GameScene. */
  private _gatheredWheatTile: { tx: number; ty: number } | null = null;
  get gatheredWheatTile(): { tx: number; ty: number } | null {
    const v = this._gatheredWheatTile;
    this._gatheredWheatTile = null;
    return v;
  }

  /** Set when the player picks up a stone item; consumed once by GameScene. */
  private _gatheredStoneTile: { tx: number; ty: number } | null = null;
  get gatheredStoneTile(): { tx: number; ty: number } | null {
    const v = this._gatheredStoneTile;
    this._gatheredStoneTile = null;
    return v;
  }

  /** Set when the player harvests wood from a tree; consumed once by GameScene. */
  private _gatheredWoodTile: { tx: number; ty: number } | null = null;
  get gatheredWoodTile(): { tx: number; ty: number } | null {
    const v = this._gatheredWoodTile;
    this._gatheredWoodTile = null;
    return v;
  }

  constructor(
    scene: Phaser.Scene,
    startTx: number,
    startTy: number,
    world: WorldGenerator,
    resources: ResourceSystem,
    mapObjects: MapObjects,
  ) {
    this.scene = scene;
    this.world = world;
    this.resources = resources;
    this.mapObjects = mapObjects;

    this._tx = startTx;
    this._ty = startTy;
    this.targetTx = startTx;
    this.targetTy = startTy;

    this.sprite = scene.add.sprite(
      startTx * TILE_SIZE + TILE_SIZE / 2,
      startTy * TILE_SIZE + TILE_SIZE / 2,
      'player',
      0,
    ).setScale(2).setDepth(DEPTH_PLAYER);

    this.setupAnims();
    this.setupInput();
    this.sprite.play('player_idle');
  }

  private setupAnims(): void {
    if (this.scene.anims.exists('player_idle')) return;
    this.scene.anims.create({
      key: 'player_idle',
      frames: [{ key: 'player', frame: 0 }],
      frameRate: 1,
      repeat: -1,
    });
    this.scene.anims.create({
      key: 'player_walk',
      frames: this.scene.anims.generateFrameNumbers('player', { start: 1, end: 2 }),
      frameRate: 8,
      repeat: -1,
    });
    this.scene.anims.create({
      key: 'player_swim',
      frames: this.scene.anims.generateFrameNumbers('player', { start: 3, end: 4 }),
      frameRate: 3,
      repeat: -1,
    });
  }

  private setupInput(): void {
    const kb = this.scene.input.keyboard!;
    this.cursors = kb.createCursorKeys();
    this.wasd = {
      up:    kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down:  kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left:  kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.gatherKey    = kb.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    this.torchKey     = kb.addKey(Phaser.Input.Keyboard.KeyCodes.T);
    this.huntKey      = kb.addKey(Phaser.Input.Keyboard.KeyCodes.K);
    this.firePlaceKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.F);
    this.eatKey       = kb.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.shiftKey     = kb.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
  }

  get x(): number { return this.sprite.x; }
  get y(): number { return this.sprite.y; }

  /** Current destination tile (used for fog-of-war, gathering, etc.) */
  get tileX(): number { return this.targetTx; }
  get tileY(): number { return this.targetTy; }

  get nearGatherable(): boolean { return this._nearGatherable; }
  get torchOn(): boolean { return this._torchOn; }
  get isSneaking(): boolean { return this._sneaking; }
  get health(): number { return this._health; }
  get isDead(): boolean { return this._health <= 0; }
  takeDamage(amount: number): void { this._health = Math.max(0, this._health - amount); }
  heal(amount: number): void { this._health = Math.min(this.maxHealth, this._health + amount); }
  /** Consumed once by GameScene to trigger hunt resolution. */
  get wantsToHunt(): boolean {
    const v = this._wantsToHunt;
    this._wantsToHunt = false;
    return v;
  }

  /** Consumed once by GameScene to place a fire at the player's tile. */
  get wantsToPlaceFire(): boolean {
    const v = this._wantsToPlaceFire;
    this._wantsToPlaceFire = false;
    return v;
  }

  update(delta: number): void {
    // ── Sneak ─────────────────────────────────────────────────────────────
    this._sneaking = this.shiftKey.isDown;
    this.sprite.setAlpha(this._sneaking ? 0.55 : 1.0);

    // ── Water state (from settled tile) ───────────────────────────────────
    const onWater = this.world.getTile(this._tx, this._ty) === TileType.WATER;
    this._waterDepth = onWater ? this.world.getWaterDepth(this._tx, this._ty) : 0;

    // Continuous water damage — accumulate fractional HP, deal only whole integers
    if (this._waterDepth > 0) {
      const rate = WATER_DRAIN_RATE[Math.min(this._waterDepth - 1, WATER_DRAIN_RATE.length - 1)];
      this._drainAcc += delta * rate / 1000;
      const dmg = Math.floor(this._drainAcc);
      if (dmg > 0) {
        this._drainAcc -= dmg;
        this.takeDamage(dmg);
      }
    } else {
      this._drainAcc = 0;
    }

    // Read direction every frame so it's always available the moment a move completes
    const { dx, dy } = this.readDirection();

    // ── Animation & facing ────────────────────────────────────────────────
    if (dx !== 0) this.lastFacingDx = dx;
    this.sprite.setFlipX(this.lastFacingDx < 0);
    if (this._waterDepth > 0) {
      this.sprite.play('player_swim', true);
    } else {
      const isMoving = this.moveProgress < 1;
      this.sprite.play(isMoving ? 'player_walk' : 'player_idle', true);
    }

    // --- Slide to target tile (linear = constant velocity, smooth when chaining) ---
    if (this.moveProgress < 1) {
      this.moveProgress = Math.min(1, this.moveProgress + delta / this.currentMoveDuration);

      const fromX = this._tx * TILE_SIZE + TILE_SIZE / 2;
      const fromY = this._ty * TILE_SIZE + TILE_SIZE / 2;
      const toX   = this.targetTx * TILE_SIZE + TILE_SIZE / 2;
      const toY   = this.targetTy * TILE_SIZE + TILE_SIZE / 2;

      this.sprite.x = fromX + (toX - fromX) * this.moveProgress;
      this.sprite.y = fromY + (toY - fromY) * this.moveProgress;

      if (this.moveProgress >= 1) {
        this._tx = this.targetTx;
        this._ty = this.targetTy;
        this.sprite.x = toX;
        this.sprite.y = toY;
        // Chain immediately — no one-frame gap
        this.tryStartMove(dx, dy);
      }
    } else {
      this.tryStartMove(dx, dy);
    }

    // --- Gather ---
    this._nearGatherable = this.checkNearGatherable();
    if (Phaser.Input.Keyboard.JustDown(this.gatherKey)) {
      this.tryGather();
    }

    // --- Torch toggle ---
    if (Phaser.Input.Keyboard.JustDown(this.torchKey)) {
      this._torchOn = !this._torchOn;
    }

    // --- Hunt ---
    if (Phaser.Input.Keyboard.JustDown(this.huntKey)) {
      this._wantsToHunt = true;
    }

    // --- Place fire ---
    if (Phaser.Input.Keyboard.JustDown(this.firePlaceKey)) {
      this._wantsToPlaceFire = true;
    }

    // --- Eat ---
    if (Phaser.Input.Keyboard.JustDown(this.eatKey)) {
      this.tryEat();
    }
  }

  private readDirection(): { dx: number; dy: number } {
    if (this.cursors.left.isDown  || this.wasd.left.isDown)  return { dx: -1, dy:  0 };
    if (this.cursors.right.isDown || this.wasd.right.isDown) return { dx:  1, dy:  0 };
    if (this.cursors.up.isDown    || this.wasd.up.isDown)    return { dx:  0, dy: -1 };
    if (this.cursors.down.isDown  || this.wasd.down.isDown)  return { dx:  0, dy:  1 };
    return { dx: 0, dy: 0 };
  }

  private tryStartMove(dx: number, dy: number): void {
    if (dx === 0 && dy === 0) return;
    const nx = this._tx + dx;
    const ny = this._ty + dy;
    const tile = this.world.getTile(nx, ny);
    const meta = TILE_META[tile];
    if (!meta.walkable) return;

    let moveDuration = TILE_MOVE_MS * meta.moveSpeedMultiplier;

    if (tile === TileType.WATER) {
      const depth = this.world.getWaterDepth(nx, ny);
      if (depth >= WATER_DEADLY_DEPTH) return; // too deep — blocked
      moveDuration = TILE_MOVE_MS * WATER_SPEED_MULT[depth - 1];
    }

    if (this._sneaking) moveDuration *= SNEAK_SPEED_MULT;

    this.targetTx = nx;
    this.targetTy = ny;
    this.currentMoveDuration = moveDuration;
    this.moveProgress = 0;
  }

  // Which tool boosts which resource
  private static readonly TOOL_FOR: Partial<Record<string, keyof Inventory>> = {
    wood: 'axe',
  };

  private checkNearGatherable(): boolean {
    if (this.world.hasGrassItem(this._tx, this._ty)) return true;
    if (this.world.hasWheatItem(this._tx, this._ty)) return true;
    if (this.world.hasStoneItem(this._tx, this._ty)) return true;
    if (this.mapObjects.findNearestTree(this._tx, this._ty) !== null) return true;
    if (TILE_META[this.world.getTile(this._tx, this._ty)].gatherable) return true;
    return false;
  }

  private findGatherableResource(): string | null {
    if (this.world.hasGrassItem(this._tx, this._ty)) return 'grass';
    if (this.world.hasWheatItem(this._tx, this._ty)) return 'wheat_item';
    if (this.world.hasStoneItem(this._tx, this._ty)) return 'stone_item';
    if (this.mapObjects.findNearestTree(this._tx, this._ty) !== null) return 'wood';
    const ownMeta = TILE_META[this.world.getTile(this._tx, this._ty)];
    if (ownMeta.gatherable && ownMeta.gatherResource) return ownMeta.gatherResource;
    return null;
  }

  private tryGather(): void {
    const now = this.scene.time.now;
    if (now - this.lastGatherTime < GATHER_COOLDOWN_MS) return;
    this.lastGatherTime = now;

    const resource = this.findGatherableResource();
    if (!resource) return;

    // Grass items: deterministic pickup — item is removed from the world
    if (resource === 'grass') {
      this.world.removeGrassItem(this._tx, this._ty);
      this.resources.add('grass', 1);
      this._gatheredGrassTile = { tx: this._tx, ty: this._ty };
      this.showGatherFeedback('+1 grass');
      return;
    }

    // Wheat items: deterministic pickup
    if (resource === 'wheat_item') {
      this.world.removeWheatItem(this._tx, this._ty);
      this.resources.add('wheat', 1);
      this._gatheredWheatTile = { tx: this._tx, ty: this._ty };
      this.showGatherFeedback('+1 wheat');
      return;
    }

    // Stone items: deterministic pickup
    if (resource === 'stone_item') {
      this.world.removeStoneItem(this._tx, this._ty);
      this.resources.add('stone', 1);
      this._gatheredStoneTile = { tx: this._tx, ty: this._ty };
      this.showGatherFeedback('+1 stone');
      return;
    }

    // Wood — harvested from a nearby tree object
    if (resource === 'wood') {
      const tree = this.mapObjects.findNearestTree(this._tx, this._ty);
      if (!tree) return;
      const hasTool = this._equippedTool === 'axe';
      const prob = hasTool ? TOOL_GATHER_PROB : BASE_GATHER_PROB;
      if (Math.random() < prob) {
        this.resources.add('wood', 1);
        this._gatheredWoodTile = { tx: tree.tx, ty: tree.ty };
        this.showGatherFeedback('+1 wood');
      } else {
        this.showGatherFeedback('...', '#888888');
      }
      return;
    }

    // All other resources: probability roll, boosted when the right tool is equipped
    const toolKey = Player.TOOL_FOR[resource];
    const hasTool = toolKey ? this._equippedTool === toolKey : false;
    const prob    = hasTool ? TOOL_GATHER_PROB : BASE_GATHER_PROB;

    if (Math.random() < prob) {
      this.resources.add(resource as keyof Inventory, 1);
      this.showGatherFeedback(`+1 ${resource}`);
    } else {
      this.showGatherFeedback('...', '#888888');
    }
  }

  private tryEat(): void {
    if (this._health >= this.maxHealth) {
      this.showGatherFeedback('full!', '#ffff88');
      return;
    }
    // Priority: cooked meat > bread > raw meat > wheat
    if (this.resources.has('cookedMeat', 1)) {
      this.resources.subtract('cookedMeat', 1);
      this.heal(HEAL_FROM_COOKED_MEAT);
      this.showGatherFeedback(`+${HEAL_FROM_COOKED_MEAT} HP`, '#ffcc66');
    } else if (this.resources.has('bread', 1)) {
      this.resources.subtract('bread', 1);
      this.heal(HEAL_FROM_BREAD);
      this.showGatherFeedback(`+${HEAL_FROM_BREAD} HP`, '#ffdd88');
    } else if (this.resources.has('meat', 1)) {
      this.resources.subtract('meat', 1);
      this.heal(HEAL_FROM_MEAT);
      this.showGatherFeedback(`+${HEAL_FROM_MEAT} HP`, '#ffaaaa');
    } else if (this.resources.has('wheat', 1)) {
      this.resources.subtract('wheat', 1);
      this.heal(HEAL_FROM_WHEAT);
      this.showGatherFeedback(`+${HEAL_FROM_WHEAT} HP`, '#ddff88');
    } else {
      this.showGatherFeedback('nothing to eat', '#888888');
    }
  }

  private showGatherFeedback(label: string, color = '#aaffaa'): void {
    const text = this.scene.add.text(this.sprite.x, this.sprite.y - TILE_SIZE, label, {
      fontFamily: 'monospace',
      fontSize: '13px',
      color,
      stroke: '#000',
      strokeThickness: 2,
    }).setDepth(DEPTH_PLAYER + 1);

    this.scene.tweens.add({
      targets: text,
      y: text.y - 30,
      alpha: 0,
      duration: 800,
      onComplete: () => text.destroy(),
    });
  }
}
