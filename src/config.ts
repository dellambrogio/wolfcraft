/**
 * Central game configuration module.
 *
 * All tunable values live in constants.ts; this file re-exports them in a
 * structured, categorised object so callsites can import a single `Config`
 * instead of picking individual named exports from constants.ts.
 *
 * To add a new setting: add it to constants.ts, then wire it here.
 */

import {
  TILE_SIZE, MAP_WIDTH, MAP_HEIGHT, NOISE_SEED,
  TILE_MOVE_MS, PLAYER_SIZE,
  BASE_GATHER_PROB, TOOL_GATHER_PROB, GATHER_COOLDOWN_MS,
  DAY_DURATION_MS, NIGHT_MAX_ALPHA,
  FIRE_DURATION_MS, FIRE_WOLF_REPEL_RADIUS, FIRE_LIGHT_RADIUS,
  FOOD_DRAIN_PER_DAY,
  WATER_DRAIN_RATE, WATER_SPEED_MULT, WATER_DEADLY_DEPTH,
  FOG_RADIUS,
  HUNT_RANGE_PX, HUNT_PROBS,
  GRASS_ITEM_SPAWN_PROB, WHEAT_ITEM_SPAWN_PROB, STONE_ITEM_SPAWN_PROB,
  SNEAK_SPEED_MULT, SNEAK_AWARENESS_MULT,
  HEAL_FROM_MEAT, HEAL_FROM_COOKED_MEAT, HEAL_FROM_BREAD, HEAL_FROM_WHEAT,
  CAMERA_LERP,
} from './constants';

// ── Sub-interfaces ────────────────────────────────────────────────────────────

export interface PlayerCfg {
  size:          number;
  moveMs:        number;
  maxHealth:     number;
  /** Speed multiplier on move-duration while sneaking (>1 = slower). */
  sneakSpeedMult:     number;
  /** Fraction of normal awareness radius that applies vs a sneaking player. */
  sneakAwarenessMult: number;
  healFromMeat:       number;
  healFromCookedMeat: number;
  healFromBread:      number;
  healFromWheat:      number;
}

export interface WorldCfg {
  width:  number;
  height: number;
  seed:   number;
  grassItemProb: number;
  wheatItemProb: number;
  stoneItemProb: number;
}

export interface GatheringCfg {
  baseProb:    number;
  toolProb:    number;
  cooldownMs:  number;
}

export interface DayNightCfg {
  dayDurationMs: number;
  nightMaxAlpha: number;
}

export interface FireCfg {
  durationMs:     number;
  wolfRepelRadius: number;
  lightRadius:    number;
}

export interface HuntCfg {
  rangePx: number;
  probs:   Record<string, { kill: number; meat: number }>;
}

export interface WaterCfg {
  drainRate:   readonly number[];
  speedMult:   readonly number[];
  deadlyDepth: number;
}

export interface GameConfig {
  tile:      { size: number };
  player:    PlayerCfg;
  world:     WorldCfg;
  gathering: GatheringCfg;
  dayNight:  DayNightCfg;
  fire:      FireCfg;
  hunt:      HuntCfg;
  water:     WaterCfg;
  fog:       { radius: number };
  camera:    { lerp: number };
  food:      { drainPerDay: number };
}

// ── Singleton config (mutate at runtime for difficulty presets etc.) ──────────

export const Config: GameConfig = {
  tile: { size: TILE_SIZE },

  player: {
    size:               PLAYER_SIZE,
    moveMs:             TILE_MOVE_MS,
    maxHealth:          100,
    sneakSpeedMult:     SNEAK_SPEED_MULT,
    sneakAwarenessMult: SNEAK_AWARENESS_MULT,
    healFromMeat:       HEAL_FROM_MEAT,
    healFromCookedMeat: HEAL_FROM_COOKED_MEAT,
    healFromBread:      HEAL_FROM_BREAD,
    healFromWheat:      HEAL_FROM_WHEAT,
  },

  world: {
    width:         MAP_WIDTH,
    height:        MAP_HEIGHT,
    seed:          NOISE_SEED,
    grassItemProb: GRASS_ITEM_SPAWN_PROB,
    wheatItemProb: WHEAT_ITEM_SPAWN_PROB,
    stoneItemProb: STONE_ITEM_SPAWN_PROB,
  },

  gathering: {
    baseProb:   BASE_GATHER_PROB,
    toolProb:   TOOL_GATHER_PROB,
    cooldownMs: GATHER_COOLDOWN_MS,
  },

  dayNight: {
    dayDurationMs: DAY_DURATION_MS,
    nightMaxAlpha: NIGHT_MAX_ALPHA,
  },

  fire: {
    durationMs:      FIRE_DURATION_MS,
    wolfRepelRadius: FIRE_WOLF_REPEL_RADIUS,
    lightRadius:     FIRE_LIGHT_RADIUS,
  },

  hunt: {
    rangePx: HUNT_RANGE_PX,
    probs:   HUNT_PROBS,
  },

  water: {
    drainRate:   WATER_DRAIN_RATE,
    speedMult:   WATER_SPEED_MULT,
    deadlyDepth: WATER_DEADLY_DEPTH,
  },

  fog:    { radius: FOG_RADIUS },
  camera: { lerp:   CAMERA_LERP },
  food:   { drainPerDay: FOOD_DRAIN_PER_DAY },
};
