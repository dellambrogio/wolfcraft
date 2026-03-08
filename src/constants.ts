// Tile dimensions
export const TILE_SIZE = 64;

// Map dimensions (in tiles)
export const MAP_WIDTH = 80;
export const MAP_HEIGHT = 60;

// Player settings
export const PLAYER_SIZE = 24;    // sprite width/height (visual only)
export const TILE_MOVE_MS = 240;  // milliseconds to slide one tile

// Resource gathering — stochastic: each G press rolls against probability
export const BASE_GATHER_PROB   = 0.20; // 20% without the right tool
export const TOOL_GATHER_PROB   = 0.75; // 75% with the right tool equipped
export const GATHER_COOLDOWN_MS = 350;  // ms between attempts (allow quick tapping)

// Day/Night cycle
export const DAY_DURATION_MS = 120_000; // 2 real minutes = 1 in-game day

// Fire
export const FIRE_DURATION_MS        = DAY_DURATION_MS / 2; // 12 in-game hours
export const FIRE_WOLF_REPEL_RADIUS  = 320;  // px — wolves flee within this range
export const FIRE_LIGHT_RADIUS       = 315;  // px — illumination radius (≈ torch)
export const NIGHT_MAX_ALPHA = 0.65;   // darkness overlay max opacity

// Hunger mechanic
export const FOOD_DRAIN_PER_DAY = 10; // food units consumed each full day

// Noise generation
export const NOISE_SEED = 42;

// Camera
export const CAMERA_LERP = 0.1;

// Z-ordering depths
export const DEPTH_BG      = -1; // smooth world background canvas
export const DEPTH_TILES   =  0;
export const DEPTH_ANIMALS =  1; // below trees [2-4] and fog
export const DEPTH_FOG     =  5; // fog of war — above trees, hides animals/player
export const DEPTH_PLAYER =  1; // below trees [2-4], same layer as animals
export const DEPTH_NIGHT = 20;
export const DEPTH_HUD   = 30;
export const DEPTH_CRAFT = 50; // crafting menu — above everything

// Grass items scattered in the grass biome
export const GRASS_ITEM_SPAWN_PROB  = 0.10; // 10 % of grass tiles get an item
// Wheat items scattered on wheat tiles (pickable object, like grass items)
export const WHEAT_ITEM_SPAWN_PROB  = 0.60; // 60 % of wheat tiles get an item
// Stone items scattered on grass tiles (pickable pebbles)
export const STONE_ITEM_SPAWN_PROB  = 0.05; // 5 % of grass tiles get a stone item

// Water traversal
export const WATER_DRAIN_RATE   = [8, 22, 55] as const;  // HP/sec for depth 1, 2, 3
export const WATER_SPEED_MULT   = [1.8, 3.0, 5.0] as const; // move-duration × per depth 1, 2, 3
export const WATER_DEADLY_DEPTH = 4;  // depth ≥ this blocks entry

// Fog of war
export const FOG_RADIUS = 3; // tiles revealed around the player

// Sneaking (Shift held)
export const SNEAK_SPEED_MULT     = 1.6;  // move-duration multiplier while sneaking (slower)
export const SNEAK_AWARENESS_MULT = 0.5;  // animal awareness radius × when player is sneaking

// Eating (E key) — HP restored per food item
export const HEAL_FROM_MEAT        = 15;
export const HEAL_FROM_COOKED_MEAT = 30;
export const HEAL_FROM_BREAD       = 25;
export const HEAL_FROM_WHEAT       =  5;

// Hunting (K key)
export const HUNT_RANGE_PX = 110; // pixel radius around player to reach an animal

// Kill probability per tool (no tool = bare hands)
export const HUNT_PROBS: Record<string, { kill: number; meat: number }> = {
  knife:   { kill: 0.75, meat: 0.90 },
  axe:     { kill: 0.50, meat: 0.65 },
  pickaxe: { kill: 0.25, meat: 0.45 },
  none:    { kill: 0.05, meat: 0.20 },
};
