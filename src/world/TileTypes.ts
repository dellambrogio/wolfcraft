export enum TileType {
  WATER    = 0,
  GRASS    = 1,
  FOREST   = 2,
  MOUNTAIN = 3,
  DESERT   = 4,
  SNOW     = 5,
  SWAMP    = 6,
  WHEAT    = 7,
}

export interface TileMeta {
  walkable: boolean;
  gatherable: boolean;
  gatherResource: 'wood' | 'stone' | 'grass' | 'wheat' | null;
  /** If true, player must be standing ON this tile to gather (vs adjacent). */
  gatherOnTile: boolean;
  /** Multiplier applied to TILE_MOVE_MS — higher = slower. */
  moveSpeedMultiplier: number;
  color: number;
  label: string;
}

export const TILE_META: Record<TileType, TileMeta> = {
  [TileType.WATER]: {
    walkable: true, gatherable: false, gatherResource: null, gatherOnTile: false,
    moveSpeedMultiplier: 1.0, // overridden per-depth in Player.ts
    color: 0x3a7bd5, label: 'Water',
  },
  [TileType.GRASS]: {
    walkable: true, gatherable: false, gatherResource: null, gatherOnTile: false,
    moveSpeedMultiplier: 1.0,
    color: 0x5a9e3a, label: 'Grass',
  },
  [TileType.FOREST]: {
    walkable: true, gatherable: false, gatherResource: null, gatherOnTile: false,
    moveSpeedMultiplier: 1.5,
    color: 0x2d6a1e, label: 'Forest',
  },
  [TileType.MOUNTAIN]: {
    walkable: false, gatherable: false, gatherResource: null, gatherOnTile: false,
    moveSpeedMultiplier: 1.0,
    color: 0x8a7a6a, label: 'Mountain',
  },
  [TileType.DESERT]: {
    walkable: true, gatherable: false, gatherResource: null, gatherOnTile: false,
    moveSpeedMultiplier: 1.3,
    color: 0xe8c870, label: 'Desert',
  },
  [TileType.SNOW]: {
    walkable: true, gatherable: false, gatherResource: null, gatherOnTile: false,
    moveSpeedMultiplier: 1.6,
    color: 0xe8eef8, label: 'Snow',
  },
  [TileType.SWAMP]: {
    walkable: true, gatherable: false, gatherResource: null, gatherOnTile: false,
    moveSpeedMultiplier: 2.0,
    color: 0x4a6830, label: 'Swamp',
  },
  [TileType.WHEAT]: {
    walkable: true, gatherable: false, gatherResource: null, gatherOnTile: false,
    moveSpeedMultiplier: 1.1,
    color: 0xd4a830, label: 'Wheat Field',
  },
};
