import { TileType } from './TileTypes';
import { MAP_WIDTH, MAP_HEIGHT, NOISE_SEED, GRASS_ITEM_SPAWN_PROB, WHEAT_ITEM_SPAWN_PROB, STONE_ITEM_SPAWN_PROB } from '../constants';

/**
 * A simple seeded pseudo-random number generator (LCG).
 */
function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

/**
 * Value noise at integer grid coordinates, using a seeded RNG table.
 */
function makeValueNoise(seed: number) {
  const SIZE = 512;
  const rand = seededRand(seed);
  const table: number[] = Array.from({ length: SIZE }, () => rand());

  function noise2d(x: number, y: number): number {
    const xi = Math.floor(x) & (SIZE - 1);
    const yi = Math.floor(y) & (SIZE - 1);
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);

    // bilinear interpolation
    const v00 = table[(xi + yi * 57) & (SIZE - 1)];
    const v10 = table[((xi + 1) + yi * 57) & (SIZE - 1)];
    const v01 = table[(xi + (yi + 1) * 57) & (SIZE - 1)];
    const v11 = table[((xi + 1) + (yi + 1) * 57) & (SIZE - 1)];

    const ux = xf * xf * (3 - 2 * xf); // smoothstep
    const uy = yf * yf * (3 - 2 * yf);

    return (
      v00 * (1 - ux) * (1 - uy) +
      v10 * ux * (1 - uy) +
      v01 * (1 - ux) * uy +
      v11 * ux * uy
    );
  }

  /** Layered fractal noise (octaves). */
  function fbm(x: number, y: number, octaves = 4): number {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let max = 0;
    for (let i = 0; i < octaves; i++) {
      value += noise2d(x * frequency, y * frequency) * amplitude;
      max += amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }
    return value / max;
  }

  return fbm;
}

export class WorldGenerator {
  private tiles: TileType[][];
  private elevations: number[][];
  private moistures: number[][];
  private width: number;
  private height: number;

  /** Water depth per tile: 1 = shore-adjacent, up to MAX_WATER_DEPTH = 6. 0 = non-water. */
  waterDepth: number[][];

  /**
   * Grass items scattered across the grass biome.
   * Keys are "tx,ty" strings. Removed when the player picks up the item.
   */
  readonly grassItems: Set<string> = new Set();

  /**
   * Wheat items scattered on wheat tiles (pickable objects).
   * Keys are "tx,ty" strings. Removed when the player picks up the item.
   */
  readonly wheatItems: Set<string> = new Set();

  /**
   * Stone items scattered on grass tiles (pickable pebbles).
   * Keys are "tx,ty" strings. Removed when the player picks up the item.
   */
  readonly stoneItems: Set<string> = new Set();

  /** Rabbit holes placed in the grass biome. */
  readonly rabbitHoles: { tx: number; ty: number }[] = [];

  private variantNoise!: (x: number, y: number, octaves?: number) => number;

  constructor(width = MAP_WIDTH, height = MAP_HEIGHT, seed = NOISE_SEED) {
    this.width = width;
    this.height = height;
    this.elevations = [];
    this.moistures = [];
    this.waterDepth = [];
    this.tiles = this.generate(seed);
  }

  private generate(seed: number): TileType[][] {
    const fbm = makeValueNoise(seed);
    const fbm2 = makeValueNoise(seed + 999); // second layer for variety
    this.variantNoise = makeValueNoise(seed + 1777); // low-freq surface detail

    const grid: TileType[][] = [];

    for (let y = 0; y < this.height; y++) {
      grid[y] = [];
      this.elevations[y] = [];
      this.moistures[y] = [];
      for (let x = 0; x < this.width; x++) {
        // Normalize coords to [0, scale]
        const nx = x / this.width * 6;
        const ny = y / this.height * 6;

        const elevation = fbm(nx, ny, 4);
        const moisture = fbm2(nx + 100, ny + 100, 3);

        this.elevations[y][x] = elevation;
        this.moistures[y][x] = moisture;
        grid[y][x] = this.classify(elevation, moisture);
      }
    }

    this.scatterWheat(grid, seed);
    this.waterDepth = this.computeWaterDepth(grid);
    this.scatterGrassItems(grid, seed);
    this.scatterWheatItems(grid, seed);
    this.scatterStoneItems(grid, seed);
    this.placeRabbitHoles(grid, seed);
    return grid;
  }

  /** Randomly place grass items on grass tiles using a seeded RNG. */
  private scatterGrassItems(grid: TileType[][], seed: number): void {
    const rand = seededRand(seed ^ 0xbadf00d);
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (grid[y][x] === TileType.GRASS && rand() < GRASS_ITEM_SPAWN_PROB) {
          this.grassItems.add(`${x},${y}`);
        }
      }
    }
  }

  /** Randomly place stone items on grass and mountain tiles using a seeded RNG. */
  private scatterStoneItems(grid: TileType[][], seed: number): void {
    const rand = seededRand(seed ^ 0xc0ffee42);
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const t = grid[y][x];
        if (t === TileType.GRASS && rand() < STONE_ITEM_SPAWN_PROB) {
          this.stoneItems.add(`${x},${y}`);
        } else if (t === TileType.MOUNTAIN && rand() < 0.35) {
          this.stoneItems.add(`${x},${y}`);
        }
      }
    }
  }

  /** Randomly place wheat items on wheat tiles using a seeded RNG. */
  private scatterWheatItems(grid: TileType[][], seed: number): void {
    const rand = seededRand(seed ^ 0xf33df00d);
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (grid[y][x] === TileType.WHEAT && rand() < WHEAT_ITEM_SPAWN_PROB) {
          this.wheatItems.add(`${x},${y}`);
        }
      }
    }
  }

  /**
   * BFS from every water tile that touches a non-water neighbour (or the map edge).
   * Those shore tiles get depth 1; each ring inward increments depth, capped at 6.
   */
  private computeWaterDepth(grid: TileType[][]): number[][] {
    const MAX_DEPTH = 6;
    const depth: number[][] = Array.from({ length: this.height }, () =>
      new Array(this.width).fill(0),
    );
    const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]] as const;
    const queue: [number, number][] = [];

    // Seed the BFS: all water tiles adjacent to land or the map boundary are depth 1.
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (grid[y][x] !== TileType.WATER) continue;
        const isShore = dirs.some(([dx, dy]) => {
          const nx = x + dx, ny = y + dy;
          return nx < 0 || ny < 0 || nx >= this.width || ny >= this.height
            || grid[ny][nx] !== TileType.WATER;
        });
        if (isShore) {
          depth[y][x] = 1;
          queue.push([x, y]);
        }
      }
    }

    // BFS inward
    for (let qi = 0; qi < queue.length; qi++) {
      const [x, y] = queue[qi];
      const d = depth[y][x];
      if (d >= MAX_DEPTH) continue;
      for (const [dx, dy] of dirs) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= this.width || ny >= this.height) continue;
        if (grid[ny][nx] === TileType.WATER && depth[ny][nx] === 0) {
          depth[ny][nx] = d + 1;
          queue.push([nx, ny]);
        }
      }
    }

    return depth;
  }

  /**
   * Scatter rare, small wheat patches (max 3×3) across grass-eligible ground.
   * Avoids touching water or mountain tiles so patches feel natural.
   */
  private scatterWheat(grid: TileType[][], seed: number): void {
    const rand = seededRand(seed ^ 0xf00dbeef);
    const NUM_PATCHES = 12; // across 80×60 = ~0.5% of tiles

    let placed = 0;
    let attempts = 0;
    while (placed < NUM_PATCHES && attempts < 2000) {
      attempts++;
      const cx = 1 + Math.floor(rand() * (this.width  - 4));
      const cy = 1 + Math.floor(rand() * (this.height - 4));

      // Only place on grass with fitting biome conditions
      if (grid[cy][cx] !== TileType.GRASS) continue;
      const e = this.elevations[cy][cx];
      const m = this.moistures[cy][cx];
      if (e < 0.36 || e > 0.55 || m < 0.35 || m > 0.60) continue;

      // Random patch size 1–3 × 1–3
      const pw = 1 + Math.floor(rand() * 3);
      const ph = 1 + Math.floor(rand() * 3);

      // Check all cells are grass before committing
      let ok = true;
      for (let dy = 0; dy < ph && ok; dy++)
        for (let dx = 0; dx < pw && ok; dx++)
          if (grid[cy + dy][cx + dx] !== TileType.GRASS) ok = false;
      if (!ok) continue;

      for (let dy = 0; dy < ph; dy++)
        for (let dx = 0; dx < pw; dx++)
          grid[cy + dy][cx + dx] = TileType.WHEAT;

      placed++;
    }
  }

  private classify(elevation: number, moisture: number): TileType {
    if (elevation < 0.35) return TileType.WATER;
    if (elevation > 0.72) return TileType.MOUNTAIN;

    // Snowy highlands (below mountain threshold but cold/high)
    if (elevation >= 0.60 && moisture < 0.55) return TileType.SNOW;

    // Desert: dry lowlands
    if (moisture < 0.30 && elevation < 0.62) return TileType.DESERT;

    // Swamp: very wet, low-lying ground
    if (moisture > 0.68 && elevation < 0.47) return TileType.SWAMP;

    // Forest: moderate to high moisture, mid elevation
    if (moisture > 0.52 && elevation < 0.68) return TileType.FOREST;

    return TileType.GRASS;
  }

  /**
   * Bilinearly interpolates elevation and moisture at fractional tile coordinates.
   * Used by the smooth background renderer for sub-tile sampling.
   */
  sampleBilinear(fx: number, fy: number): { elevation: number; moisture: number } {
    const clamp = (v: number, max: number) => Math.max(0, Math.min(max, v));
    const x0 = clamp(Math.floor(fx), this.width - 1);
    const y0 = clamp(Math.floor(fy), this.height - 1);
    const x1 = clamp(x0 + 1, this.width - 1);
    const y1 = clamp(y0 + 1, this.height - 1);
    const wx = fx - Math.floor(fx);
    const wy = fy - Math.floor(fy);

    const bilerp = (g: number[][]) =>
      g[y0][x0] * (1 - wx) * (1 - wy) +
      g[y0][x1] * wx       * (1 - wy) +
      g[y1][x0] * (1 - wx) * wy +
      g[y1][x1] * wx       * wy;

    return { elevation: bilerp(this.elevations), moisture: bilerp(this.moistures) };
  }

  /** Returns a variant index (0–3) for a tile, smoothly varying across the map. */
  getGrassVariant(tx: number, ty: number): number {
    const nx = tx / this.width * 3;   // low frequency — large patches
    const ny = ty / this.height * 3;
    const n = this.variantNoise(nx, ny, 2); // 0..1, smooth
    return Math.min(3, Math.floor(n * 4));
  }

  hasGrassItem(tx: number, ty: number): boolean {
    return this.grassItems.has(`${tx},${ty}`);
  }

  removeGrassItem(tx: number, ty: number): void {
    this.grassItems.delete(`${tx},${ty}`);
  }

  hasWheatItem(tx: number, ty: number): boolean {
    return this.wheatItems.has(`${tx},${ty}`);
  }

  removeWheatItem(tx: number, ty: number): void {
    this.wheatItems.delete(`${tx},${ty}`);
  }

  /** Place ~20 rabbit holes spread across grass tiles (minimum spacing enforced). */
  private placeRabbitHoles(grid: TileType[][], seed: number): void {
    const rand = seededRand(seed ^ 0xb0b01e5);
    const MIN_DIST = 8; // minimum tile distance between holes
    let attempts = 0;
    while (this.rabbitHoles.length < 20 && attempts < 3000) {
      attempts++;
      const tx = 2 + Math.floor(rand() * (this.width  - 4));
      const ty = 2 + Math.floor(rand() * (this.height - 4));
      if (grid[ty][tx] !== TileType.GRASS) continue;
      // Enforce minimum spacing
      const tooClose = this.rabbitHoles.some(h =>
        Math.abs(h.tx - tx) + Math.abs(h.ty - ty) < MIN_DIST,
      );
      if (tooClose) continue;
      this.rabbitHoles.push({ tx, ty });
    }
  }

  hasStoneItem(tx: number, ty: number): boolean {
    return this.stoneItems.has(`${tx},${ty}`);
  }

  removeStoneItem(tx: number, ty: number): void {
    this.stoneItems.delete(`${tx},${ty}`);
  }

  /** Returns water depth [1..6] for water tiles; 0 for non-water. */
  getWaterDepth(tx: number, ty: number): number {
    if (tx < 0 || ty < 0 || tx >= this.width || ty >= this.height) return 1;
    return this.waterDepth[ty][tx];
  }

  getTile(x: number, y: number): TileType {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
      return TileType.WATER;
    }
    return this.tiles[y][x];
  }

  get cols(): number { return this.width; }
  get rows(): number { return this.height; }

  /**
   * Find a random walkable spawn tile near the map center.
   */
  findSpawnTile(): { tx: number; ty: number } {
    const cx = Math.floor(this.width / 2);
    const cy = Math.floor(this.height / 2);

    for (let r = 0; r < Math.max(this.width, this.height); r++) {
      for (let dx = -r; dx <= r; dx++) {
        for (let dy = -r; dy <= r; dy++) {
          const tx = cx + dx;
          const ty = cy + dy;
          const t = this.getTile(tx, ty);
          if (t === TileType.GRASS || t === TileType.WHEAT || t === TileType.FOREST || t === TileType.SNOW || t === TileType.DESERT) {
            return { tx, ty };
          }
        }
      }
    }
    return { tx: cx, ty: cy };
  }
}
