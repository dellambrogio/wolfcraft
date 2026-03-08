import Phaser from 'phaser';
import { WorldGenerator } from '../world/WorldGenerator';
import { TileType } from '../world/TileTypes';
import { MapObjects } from '../world/MapObjects';
import { Player } from '../entities/Player';
import { Animal, AnimalType } from '../entities/Animal';
import { ResourceSystem } from '../systems/ResourceSystem';
import { TimeSystem } from '../systems/TimeSystem';
import { FogOfWar } from '../systems/FogOfWar';
import { HUD } from '../ui/HUD';
import { CraftingMenu } from '../ui/CraftingMenu';
import { InstructionPanel } from '../ui/InstructionPanel';
import { SoundSystem } from '../systems/SoundSystem';
import { NightPipeline } from '../pipelines/NightPipeline';
import { Fire } from '../entities/Fire';
import { drawIcon } from '../ui/drawIcon';
import { Inventory } from '../systems/ResourceSystem';
import {
  TILE_SIZE,
  MAP_WIDTH,
  MAP_HEIGHT,
  NOISE_SEED,
  DEPTH_BG,
  DEPTH_ANIMALS,
  DEPTH_PLAYER,
  FOOD_DRAIN_PER_DAY,
  FOG_RADIUS,
  HUNT_RANGE_PX,
  HUNT_PROBS,
} from '../constants';

export class GameScene extends Phaser.Scene {
  private world!: WorldGenerator;
  private player!: Player;
  private resources!: ResourceSystem;
  private timeSystem!: TimeSystem;
  private hud!: HUD;
  private craftingMenu!: CraftingMenu;
  private instructions!: InstructionPanel;
  private craftKey!:   Phaser.Input.Keyboard.Key;
  private restartKey!: Phaser.Input.Keyboard.Key;

  private fog!: FogOfWar;
  private mapObjects!: MapObjects;
  private nightPipeline: NightPipeline | null = null;
  private lastDayNumber = 1;
  private animals: Animal[] = [];
  private fires: Fire[] = [];
  private grassItemSprites = new Map<string, Phaser.GameObjects.Image>();
  private wheatItemSprites = new Map<string, Phaser.GameObjects.Image>();
  private stoneItemSprites = new Map<string, Phaser.GameObjects.Image>();
  private playerToolGraphic!: Phaser.GameObjects.Graphics;
  private lastEquippedTool: keyof Inventory | null = null;
  private gameOver = false;
  private worldSeed = NOISE_SEED;
  private soundSystem!: SoundSystem;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { seed?: number }): void {
    if (data?.seed !== undefined) this.worldSeed = data.seed;
  }

  create(): void {
    this.gameOver          = false;
    this.fires             = [];
    this.animals           = [];
    this.lastDayNumber     = 1;
    this.lastEquippedTool  = null;
    this.resources    = new ResourceSystem();
    this.timeSystem   = new TimeSystem();
    this.world        = new WorldGenerator(MAP_WIDTH, MAP_HEIGHT, this.worldSeed);
    this.soundSystem  = new SoundSystem(this);

    this.grassItemSprites.clear();
    this.wheatItemSprites.clear();
    this.stoneItemSprites.clear();
    this.renderWorldBackground();
    this.renderWaterDepth();
    this.renderWorld();
    this.placeGrassItems();
    this.placeWheatItems();
    this.placeStoneItems();
    this.placeRabbitHoles();
    this.mapObjects = new MapObjects(this, this.world);
    this.spawnAnimals();

    // Spawn player at a walkable tile near center
    const { tx, ty } = this.world.findSpawnTile();
    this.player = new Player(this, tx, ty, this.world, this.resources, this.mapObjects);

    // World-space tool graphic (follows player, redrawn when tool changes)
    this.playerToolGraphic = this.add.graphics().setDepth(DEPTH_PLAYER + 0.5);

    // Camera
    const mapW = MAP_WIDTH * TILE_SIZE;
    const mapH = MAP_HEIGHT * TILE_SIZE;
    this.cameras.main.setBounds(0, 0, mapW, mapH);
    this.cameras.main.startFollow(this.player.sprite, true, 0.12, 0.12);

    // Fog of war
    this.fog = new FogOfWar(this, MAP_WIDTH, MAP_HEIGHT, FOG_RADIUS);
    this.fog.reveal(tx, ty);

    // Night shader pipeline (WebGL only)
    if (this.renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer) {
      this.renderer.pipelines.addPostPipeline('NightPipeline', NightPipeline);
      this.cameras.main.setPostPipeline(NightPipeline);
      this.nightPipeline = this.cameras.main.getPostPipeline(NightPipeline) as NightPipeline;
    }

    // HUD
    this.hud = new HUD(this, this.resources, this.timeSystem);
    this.craftingMenu = new CraftingMenu(this, this.resources);
    this.instructions = new InstructionPanel(this);
    this.craftKey   = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.restartKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.R);

    // Separate UI camera — no night pipeline, always on top
    const uiObjects = [
      ...this.hud.getGameObjects(),
      ...this.craftingMenu.getGameObjects(),
      ...this.instructions.getGameObjects(),
    ];
    const uiCam = this.cameras.add(0, 0, this.scale.width, this.scale.height);
    uiCam.ignore(
      this.children.list.filter(o => !uiObjects.includes(o))
    );
    this.cameras.main.ignore(uiObjects);

    // Fade in
    this.cameras.main.fadeIn(500, 0, 0, 0);
  }

  /**
   * Renders a low-resolution (4px per tile) smooth colour canvas for the world,
   * then upscales it with LINEAR filtering so biome colours blend gradually
   * across tile boundaries instead of cutting hard.
   */
  private placeRabbitHoles(): void {
    for (const hole of this.world.rabbitHoles) {
      this.add.image(
        hole.tx * TILE_SIZE + TILE_SIZE / 2,
        hole.ty * TILE_SIZE + TILE_SIZE / 2,
        'rabbit_hole',
      ).setDepth(0.5);

      // Spawn 2–3 rabbits per hole, offset slightly from hole centre
      const count = 2 + Math.floor(Math.random() * 2);
      for (let i = 0; i < count; i++) {
        const ox = (Math.random() - 0.5) * TILE_SIZE * 2;
        const oy = (Math.random() - 0.5) * TILE_SIZE * 2;
        this.animals.push(new Animal(
          this, this.world, AnimalType.RABBIT,
          hole.tx * TILE_SIZE + TILE_SIZE / 2 + ox,
          hole.ty * TILE_SIZE + TILE_SIZE / 2 + oy,
          DEPTH_ANIMALS,
          this.soundSystem,
          { tx: hole.tx, ty: hole.ty },
        ));
      }
    }
  }

  private spawnAnimals(): void {
    const forestTiles: [number, number][] = [];
    const swampTiles:  [number, number][] = [];
    const anyTiles:    [number, number][] = [];

    for (let ty = 0; ty < MAP_HEIGHT; ty++) {
      for (let tx = 0; tx < MAP_WIDTH; tx++) {
        switch (this.world.getTile(tx, ty)) {
          case TileType.GRASS:
          case TileType.FOREST: anyTiles.push([tx, ty]); break;
          case TileType.SWAMP:  swampTiles.push([tx, ty]); break;
        }
        if (this.world.getTile(tx, ty) === TileType.FOREST) forestTiles.push([tx, ty]);
      }
    }

    const shuffle = <T>(a: T[]) => {
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };
    shuffle(forestTiles); shuffle(swampTiles); shuffle(anyTiles);

    const spawn = (pool: [number, number][], count: number, type: AnimalType) => {
      for (let i = 0; i < Math.min(count, pool.length); i++) {
        const [tx, ty] = pool[i];
        this.animals.push(new Animal(
          this, this.world, type,
          tx * TILE_SIZE + TILE_SIZE / 2,
          ty * TILE_SIZE + TILE_SIZE / 2,
          DEPTH_ANIMALS,
          this.soundSystem,
        ));
      }
    };

    spawn([...forestTiles, ...anyTiles], 15, AnimalType.DEER);
    spawn([...swampTiles, ...forestTiles], 10, AnimalType.PIG);
    spawn([...forestTiles, ...swampTiles, ...anyTiles], 8, AnimalType.WOLF);
  }

  private renderWorldBackground(): void {
    const SCALE = 4; // samples per tile
    const cw = MAP_WIDTH  * SCALE;
    const ch = MAP_HEIGHT * SCALE;

    const canvas = document.createElement('canvas');
    canvas.width  = cw;
    canvas.height = ch;
    const ctx = canvas.getContext('2d')!;
    const img = ctx.createImageData(cw, ch);

    const ss = (a: number, b: number, x: number) => {
      const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    type RGB = [number, number, number];
    const mix = (a: RGB, b: RGB, t: number): RGB => [
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t,
      a[2] + (b[2] - a[2]) * t,
    ];

    const DEEP_WATER:    RGB = [ 18,  52, 145];
    const SHALLOW_WATER: RGB = [ 78, 140, 210];
    const GRASS:         RGB = [ 82, 152,  52];
    const FOREST:        RGB = [ 38,  95,  22];
    const DESERT:        RGB = [228, 198, 100];
    const SWAMP:         RGB = [ 62,  90,  36];
    const SNOW:          RGB = [228, 235, 248];
    const MOUNTAIN:      RGB = [128, 116, 104];


    const biomeColor = (elev: number, moist: number): RGB => {
      // Water
      if (elev < 0.30) return mix(DEEP_WATER, SHALLOW_WATER, ss(0.20, 0.30, elev));
      if (elev < 0.38) return mix(SHALLOW_WATER, moist > 0.45 ? GRASS : DESERT, ss(0.30, 0.38, elev));
      // Mountain / snow cap
      if (elev > 0.75) return mix(MOUNTAIN, SNOW, ss(0.75, 0.92, elev));
      if (elev > 0.62) return mix(moist > 0.52 ? FOREST : (moist < 0.32 ? DESERT : GRASS), MOUNTAIN, ss(0.62, 0.75, elev));
      // Snow highlands
      if (elev > 0.55 && moist < 0.52) return mix(moist < 0.30 ? DESERT : GRASS, SNOW, ss(0.55, 0.63, elev) * ss(0.52, 0.35, moist));
      // Desert
      if (moist < 0.32) return mix(GRASS, DESERT, ss(0.38, 0.20, moist));
      // Swamp
      if (moist > 0.62 && elev < 0.50) return mix(FOREST, SWAMP, ss(0.62, 0.72, moist) * ss(0.50, 0.38, elev));
      // Forest ↔ Grass
      return mix(GRASS, FOREST, ss(0.45, 0.60, moist));
    };

    for (let py = 0; py < ch; py++) {
      for (let px = 0; px < cw; px++) {
        const { elevation, moisture } = this.world.sampleBilinear(px / SCALE, py / SCALE);
        const [r, g, b] = biomeColor(elevation, moisture);
        const i = (py * cw + px) * 4;
        img.data[i]     = r;
        img.data[i + 1] = g;
        img.data[i + 2] = b;
        img.data[i + 3] = 255;
      }
    }

    ctx.putImageData(img, 0, 0);
    if (this.textures.exists('world_bg')) this.textures.remove('world_bg');
    this.textures.addCanvas('world_bg', canvas);

    // Override pixelArt/NEAREST with LINEAR so the upscale blends smoothly
    this.textures.get('world_bg').setFilter(Phaser.Textures.FilterMode.LINEAR);

    this.add.image(0, 0, 'world_bg')
      .setOrigin(0, 0)
      .setScale(TILE_SIZE / SCALE)   // 64/4 = 16× upscale → fills full map
      .setDepth(DEPTH_BG);
  }

  /**
   * Smooth water-depth canvas. Bilinearly interpolates the waterDepth grid at
   * 4× resolution, maps depth 1→6 to a light-blue → dark-navy gradient, then
   * upscales with LINEAR filtering so depth rings blend seamlessly across tiles.
   * Rendered between the biome background and the tile layer.
   */
  private renderWaterDepth(): void {
    const SCALE = 4;
    const cw = MAP_WIDTH  * SCALE;
    const ch = MAP_HEIGHT * SCALE;

    const canvas = document.createElement('canvas');
    canvas.width  = cw;
    canvas.height = ch;
    const img = canvas.getContext('2d')!.createImageData(cw, ch);

    for (let py = 0; py < ch; py++) {
      for (let px = 0; px < cw; px++) {
        // Sample at pixel centre in tile-space
        const tx = (px + 0.5) / SCALE;
        const ty = (py + 0.5) / SCALE;

        const x0 = Math.floor(tx), y0 = Math.floor(ty);
        const x1 = Math.min(x0 + 1, MAP_WIDTH  - 1);
        const y1 = Math.min(y0 + 1, MAP_HEIGHT - 1);
        const wx = tx - x0, wy = ty - y0;

        const d00 = this.world.waterDepth[y0][x0];
        const d10 = this.world.waterDepth[y0][x1];
        const d01 = this.world.waterDepth[y1][x0];
        const d11 = this.world.waterDepth[y1][x1];

        const depth = d00*(1-wx)*(1-wy) + d10*wx*(1-wy) + d01*(1-wx)*wy + d11*wx*wy;

        const i = (py * cw + px) * 4;
        if (depth < 0.5) { img.data[i + 3] = 0; continue; } // land — transparent

        // Smoothstep t: 0 = shore (depth 1), 1 = abyss (depth 6)
        const tRaw = (Math.min(6, Math.max(1, depth)) - 1) / 5;
        const t    = tRaw * tRaw * (3 - 2 * tRaw);

        // Shallow azure → deep navy
        img.data[i]     = Math.round(88  + (10  - 88)  * t);  // R
        img.data[i + 1] = Math.round(160 + (38  - 160) * t);  // G
        img.data[i + 2] = Math.round(235 + (105 - 235) * t);  // B
        img.data[i + 3] = 255;
      }
    }

    canvas.getContext('2d')!.putImageData(img, 0, 0);
    if (this.textures.exists('water_depth')) this.textures.remove('water_depth');
    this.textures.addCanvas('water_depth', canvas);
    this.textures.get('water_depth').setFilter(Phaser.Textures.FilterMode.LINEAR);

    this.add.image(0, 0, 'water_depth')
      .setOrigin(0, 0)
      .setScale(TILE_SIZE / SCALE)
      .setDepth(DEPTH_BG + 0.5);  // above biome bg, below tile sprites
  }

  private placeGrassItems(): void {
    for (const key of this.world.grassItems) {
      const [tx, ty] = key.split(',').map(Number);
      const img = this.add.image(
        tx * TILE_SIZE + TILE_SIZE / 2,
        ty * TILE_SIZE + TILE_SIZE / 2,
        'grass_item',
      ).setDepth(0.6);
      this.grassItemSprites.set(key, img);
    }
  }

  private placeWheatItems(): void {
    for (const key of this.world.wheatItems) {
      const [tx, ty] = key.split(',').map(Number);
      const img = this.add.image(
        tx * TILE_SIZE + TILE_SIZE / 2,
        ty * TILE_SIZE + TILE_SIZE / 2,
        'wheat_item',
      ).setDepth(0.6);
      this.wheatItemSprites.set(key, img);
    }
  }

  private placeStoneItems(): void {
    for (const key of this.world.stoneItems) {
      const [tx, ty] = key.split(',').map(Number);
      const img = this.add.image(
        tx * TILE_SIZE + TILE_SIZE / 2,
        ty * TILE_SIZE + TILE_SIZE / 2,
        'stone_item',
      ).setDepth(0.6);
      this.stoneItemSprites.set(key, img);
    }
  }

  private renderWorld(): void {
    for (let ty = 0; ty < MAP_HEIGHT; ty++) {
      for (let tx = 0; tx < MAP_WIDTH; tx++) {
        const type: TileType = this.world.getTile(tx, ty);

        // 4-connectivity bitmask: bit0=top, bit1=right, bit2=bottom, bit3=left
        const same = (dx: number, dy: number) => {
          const nx = tx + dx, ny = ty + dy;
          return nx >= 0 && ny >= 0 && nx < MAP_WIDTH && ny < MAP_HEIGHT
            && this.world.getTile(nx, ny) === type;
        };
        const pattern = (same(0, -1) ? 1 : 0)
                      | (same(1,  0) ? 2 : 0)
                      | (same(0,  1) ? 4 : 0)
                      | (same(-1, 0) ? 8 : 0);

        const baseKey = type === TileType.GRASS
          ? `tile_${type}_v${this.world.getGrassVariant(tx, ty)}`
          : `tile_${type}`;

        const img = this.add.image(tx * TILE_SIZE, ty * TILE_SIZE, `${baseKey}_m${pattern}`).setOrigin(0, 0);

        // Water tiles: semi-transparent so the smooth depth canvas below shows through.
        // The masked tile edges already fade to 0 alpha near shore, so this blends naturally.
        if (type === TileType.WATER) img.setAlpha(0.45);
      }
    }
  }

  update(_time: number, delta: number): void {
    if (this.gameOver) {
      if (Phaser.Input.Keyboard.JustDown(this.restartKey)) this.scene.restart();
      return;
    }
    this.timeSystem.update(delta);

    const px = this.player.sprite.x;
    const py = this.player.sprite.y;

    // Instruction panel — dismiss on first action key or movement
    this.instructions.update();

    // Toggle crafting menu
    if (Phaser.Input.Keyboard.JustDown(this.craftKey)) {
      this.craftingMenu.toggle();
    }

    // Let crafting menu know whether a fire is within cooking range
    const nearFire = this.fires.some(f => {
      const dx = f.x - px;
      const dy = f.y - py;
      return dx * dx + dy * dy <= (TILE_SIZE * 2) ** 2;
    });
    this.craftingMenu.setNearFire(nearFire);
    this.craftingMenu.update();

    // Pause player input while menu is open
    if (!this.craftingMenu.isOpen) {
      this.player.update(delta);
      if (this.player.isDead) { this.triggerGameOver(); return; }
      const gathered = this.player.gatheredGrassTile;
      if (gathered) {
        const key = `${gathered.tx},${gathered.ty}`;
        this.grassItemSprites.get(key)?.destroy();
        this.grassItemSprites.delete(key);
      }
      const gatheredWheat = this.player.gatheredWheatTile;
      if (gatheredWheat) {
        const key = `${gatheredWheat.tx},${gatheredWheat.ty}`;
        this.wheatItemSprites.get(key)?.destroy();
        this.wheatItemSprites.delete(key);
      }
      const gatheredStone = this.player.gatheredStoneTile;
      if (gatheredStone) {
        const key = `${gatheredStone.tx},${gatheredStone.ty}`;
        this.stoneItemSprites.get(key)?.destroy();
        this.stoneItemSprites.delete(key);
      }
      const gatheredWood = this.player.gatheredWoodTile;
      if (gatheredWood) this.mapObjects.harvestTree(gatheredWood.tx, gatheredWood.ty);
      if (this.player.wantsToHunt) this.resolveHunt();
      if (this.player.wantsToPlaceFire) this.placeFire();
    }
    // Update fires, prune expired
    for (const fire of this.fires) fire.update(delta);
    this.fires = this.fires.filter(f => !f.expired);

    const timeOfDay = this.timeSystem.timeOfDay;
    const now = this.time.now;
    const firePositions = this.fires.map(f => ({ x: f.x, y: f.y }));
    const playerSneaking = this.player.isSneaking;
    for (const animal of this.animals) {
      animal.update(delta, px, py, timeOfDay, firePositions, playerSneaking);
      const dmg = animal.checkBite(px, py, now);
      if (dmg > 0) {
        this.soundSystem.playWolfBite();
        this.player.takeDamage(dmg);
        this.showDamageFeedback(px, py, dmg);
        if (this.player.health <= 0) { this.triggerGameOver(); return; }
      }
    }

    // Reveal fog around player's destination tile
    this.fog.reveal(this.player.tileX, this.player.tileY);

    // Day/night shader
    if (this.nightPipeline) {
      const cam = this.cameras.main;
      this.nightPipeline.nightAmount = this.timeSystem.darknessAlpha;
      this.nightPipeline.torchActive = this.player.torchOn;
      // PostFX texture Y=0 is at the bottom (OpenGL convention), so invert Y
      const uvY = (worldY: number) =>
        1.0 - (worldY - cam.worldView.y) / cam.worldView.height;
      const uvX = (worldX: number) =>
        (worldX - cam.worldView.x) / cam.worldView.width;

      this.nightPipeline.torchUVx = uvX(this.player.x);
      this.nightPipeline.torchUVy = uvY(this.player.y);

      // Sort fires by distance to player, pass up to 4 closest to pipeline
      const sortedFires = [...this.fires].sort((a, b) => {
        const da = (a.x - px) ** 2 + (a.y - py) ** 2;
        const db = (b.x - px) ** 2 + (b.y - py) ** 2;
        return da - db;
      });
      this.nightPipeline.fireUVs = sortedFires.slice(0, 4).map(f => ({
        uvx: uvX(f.x),
        uvy: uvY(f.y),
      }));
    }

    // Food drain: subtract once per day
    const currentDay = this.timeSystem.currentDay;
    if (currentDay > this.lastDayNumber) {
      this.resources.subtract('meat', FOOD_DRAIN_PER_DAY);
      this.lastDayNumber = currentDay;
    }

    // Sync equipped tool to player (for gather boost)
    const currentTool = this.hud.equippedTool;
    this.player.setEquippedTool(currentTool);

    // Player tool graphic — reposition each frame, redraw only when tool changes
    const px2 = this.player.x, py2 = this.player.y;
    this.playerToolGraphic.setPosition(px2 + 22, py2);
    if (currentTool !== this.lastEquippedTool) {
      this.playerToolGraphic.clear();
      if (currentTool) drawIcon(this.playerToolGraphic, 0, 0, currentTool, 1.1);
      this.lastEquippedTool = currentTool;
    }

    // HUD gather hint
    this.hud.showGatherHint(this.player.nearGatherable);
    this.hud.update(this.player.health, this.player.maxHealth, this.player.x, this.player.y, this.animals, this.fog);
  }

  private triggerGameOver(): void {
    this.gameOver = true;
    const { width, height } = this.scale;

    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.78)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(200);
    const title = this.add.text(width / 2, height / 2 - 50, 'YOU DIED', {
      fontFamily: 'monospace', fontSize: '52px', color: '#cc2222',
      stroke: '#000000', strokeThickness: 6,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201);
    const sub = this.add.text(width / 2, height / 2 + 20, 'Press R to restart', {
      fontFamily: 'monospace', fontSize: '22px', color: '#ffffff',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

    // Only show on the UI camera (no night pipeline darkening)
    this.cameras.main.ignore([overlay, title, sub]);

  }

  private showDamageFeedback(px: number, py: number, dmg: number): void {
    const t = this.add.text(px, py - TILE_SIZE, `-${dmg} HP`, {
      fontFamily: 'monospace', fontSize: '14px', color: '#ff4444',
      stroke: '#000', strokeThickness: 2,
    }).setDepth(DEPTH_PLAYER + 1);
    this.tweens.add({ targets: t, y: t.y - 36, alpha: 0, duration: 900, onComplete: () => t.destroy() });
  }

  private placeFire(): void {
    if (!this.resources.has('fire', 1)) return;
    this.resources.subtract('fire', 1);
    this.fires.push(new Fire(this, this.player.tileX, this.player.tileY));
  }

  private resolveHunt(): void {
    // Find nearest alive animal in range
    const px = this.player.x;
    const py = this.player.y;
    let nearest: typeof this.animals[0] | null = null;
    let nearestDist = HUNT_RANGE_PX;

    for (const animal of this.animals) {
      if (animal.dead) continue;
      const dx = animal.sprite.x - px;
      const dy = animal.sprite.y - py;
      const d  = Math.sqrt(dx * dx + dy * dy);
      if (d < nearestDist) { nearest = animal; nearestDist = d; }
    }

    if (!nearest) return; // no animal in range

    // Pick best available tool
    const inv = this.resources.getAll();
    const toolKey = ['knife', 'axe', 'pickaxe'].find(t => inv[t as keyof typeof inv] > 0) ?? 'none';
    const probs   = HUNT_PROBS[toolKey];

    const showFeedback = (msg: string, color: string) => {
      const t = this.add.text(px, py - TILE_SIZE, msg, {
        fontFamily: 'monospace', fontSize: '13px', color,
        stroke: '#000', strokeThickness: 2,
      }).setDepth(DEPTH_PLAYER + 1);
      this.tweens.add({ targets: t, y: t.y - 30, alpha: 0, duration: 800, onComplete: () => t.destroy() });
    };

    if (Math.random() >= probs.kill) {
      showFeedback('missed!', '#ff8888');
      return;
    }

    // Hit — deal 1 damage
    const died = nearest.takeDamage(1);
    if (!died) {
      showFeedback(`-1 HP (${nearest.health}/${nearest.maxHealth})`, '#ffaaaa');
      return;
    }

    // Killed
    this.soundSystem.playKill();
    this.animals = this.animals.filter(a => a !== nearest);

    if (Math.random() < probs.meat) {
      const yield_ = nearest!.meatYield;
      this.resources.add('meat', yield_);
      showFeedback(`+${yield_} meat`, '#ffccaa');
    } else {
      showFeedback('no meat', '#888888');
    }
  }
}
