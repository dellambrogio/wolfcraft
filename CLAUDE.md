# Wolfcraft — Claude Context

## What this is

A browser-based 2D tile-step survival game. Phaser 3 + TypeScript + Vite. No image assets — every sprite and tile is drawn procedurally onto Canvas in `BootScene.ts`. Deployed to GitHub Pages.

Run with: `npm run dev` → http://localhost:5173

## Project layout

```
src/
  main.ts                  # Phaser game config, scene registration
  constants.ts             # All tunable numbers live here (speeds, probabilities, sizes)
  config.ts                # Structured GameConfig object
  scenes/
    BootScene.ts           # Generates all textures (no image files needed)
    MenuScene.ts           # Atmospheric main menu
    GameScene.ts           # Core game loop — orchestrates everything
  entities/
    Player.ts              # Tile-step movement, gathering, eating, sneaking, water damage
    Animal.ts              # AI for deer, rabbit, pig, wolf
    Fire.ts                # Campfire — light radius, wolf repel, duration
  world/
    TileTypes.ts           # TileType enum + TileMeta (walkable, speed, color, etc.)
    WorldGenerator.ts      # Seeded fractal noise → biome map, rabbit holes, item scatter
    MapObjects.ts          # Static objects: trees (harvestable), rocks
  systems/
    ResourceSystem.ts      # Inventory — Inventory interface + add/subtract/has
    TimeSystem.ts          # Day/night cycle, darknessAlpha
    FogOfWar.ts            # Per-tile exploration state
    SoundSystem.ts         # Procedural Web Audio synthesis
  pipelines/
    NightPipeline.ts       # WebGL post-processing: darkness, torch & fire light circles
  textures/
    tileDraw.ts            # Canvas tile textures (4-connectivity bitmask variants)
    animalDraw.ts          # Animal sprites
    playerDraw.ts          # Player sprite (idle/walk/swim frames)
    objectDraw.ts          # Trees, rocks, rabbit holes, item pickups
  ui/
    palette.ts             # Central colour constants for all UI
    HUD.ts                 # Health bar, minimap, day/time display, gather hint
    Toolbelt.ts            # Hotbar slots 1–8, equipped tool tracking
    CraftingMenu.ts        # Crafting + inventory panel (E key)
    InstructionPanel.ts    # Controls reference (H key)
    MobileControls.ts      # Touch D-pad + action buttons
    drawIcon.ts            # Icon rendering for inventory items
```

## Key invariants

- **All constants go in `constants.ts`** — never hardcode magic numbers elsewhere.
- **No image files** — textures are always drawn via Canvas API in `BootScene.ts` or the `textures/` helpers. Adding a new sprite means adding a draw function and registering it in `BootScene`.
- **Tile-step movement** — the player moves one tile at a time with smooth linear interpolation; there is no free movement. New movement mechanics must respect this.
- **UI camera separation** — UI objects go on `uiCam` (no night shader), world objects on `cameras.main`. When adding UI elements, register them correctly in both camera ignore lists in `GameScene.create()`.
- **ResourceSystem is the single source of truth** for inventory. All item adds/subtracts go through it.
- **Depth layers** (from `constants.ts`): `DEPTH_BG=-1`, tiles=0, animals/player=1, trees=2–4, `DEPTH_FOG=5`, `DEPTH_NIGHT=20`, `DEPTH_HUD=30`, `DEPTH_CRAFT=50`.

## Inventory items

```
Resources:  wood, stone, water, grass, wheat, meat, vegetables
Tools:      axe (wood), pickaxe (stone), knife (hunting)
Placeable:  fire
Cooked:     cookedMeat, bread
```

## Biomes & tiles

| TileType  | Walkable | Notes                                    |
|-----------|----------|------------------------------------------|
| WATER     | yes      | depth 1–3 slows+drains HP; depth 4+ blocks |
| GRASS     | yes      | grass items, stone items spawn here      |
| FOREST    | yes      | 1.5× slower; trees; deer/wolf spawn      |
| MOUNTAIN  | **no**   | impassable                               |
| DESERT    | yes      | 1.3× slower                              |
| SNOW      | yes      | 1.6× slower                             |
| SWAMP     | yes      | 2.0× slower; pig/wolf spawn             |
| WHEAT     | yes      | wheat items spawn here                   |

## Animal types

- **Rabbit** — spawns near rabbit holes, flees player, small meat yield
- **Deer** — forest/grass, flees, medium meat yield
- **Pig** — swamp/forest, neutral, medium meat yield
- **Wolf** — hunts player at night or when close; repelled by fire; damages player on bite

## Controls reference

| Key | Action |
|-----|--------|
| WASD / Arrows | Move |
| Shift | Sneak (slower, reduced animal awareness) |
| Q | Gather |
| K | Hunt nearest animal |
| Z | Eat food |
| T | Toggle torch |
| F | Place campfire |
| E | Crafting/inventory |
| H | Help panel |
| 1–8 | Hotbar slot |
| R | Restart after death |

Mobile: D-pad + action buttons via `MobileControls.ts`.

## Game settings (menu screen)

Defined in `src/GameSettings.ts`, passed from `MenuScene` → `GameScene` via scene `data`.

| Setting | Type | Options | Effect |
|---------|------|---------|--------|
| `dayNightRatio` | `DayNightRatio` | `3:1` `2:1`(default) `1:1` `1:2` `1:3` | Adjusts day/night schedule thresholds in `TimeSystem` |
| `daySpeed` | `DaySpeed` | `fast` `normal`(default) `slow` `crawl` | Scales `DAY_DURATION_MS` (1/2/5/10 real min per game day) |
| `wolvesEnabled` | `boolean` | ON(default) / OFF | Skips wolf spawning in `GameScene.spawnAnimals()` |
| `starterKit` | `boolean` | OFF(default) / ON | Adds axe, knife, wood×5, stone×5, meat×3 to starting inventory |

`TimeSystem` constructor accepts `(dayDurationMs, ratio)` — both sourced from settings.

## Adding a new feature — checklist

1. **New resource/item** → add to `Inventory` interface in `ResourceSystem.ts`, default `0` in constructor, add icon to `drawIcon.ts`, register texture in `BootScene.ts`.
2. **New tile type** → add to `TileType` enum, add `TileMeta` entry in `TILE_META`, add draw function in `tileDraw.ts`, register in `BootScene.ts`.
3. **New animal** → add to `AnimalType` enum in `Animal.ts`, add draw function in `animalDraw.ts`, add spawn logic in `GameScene.spawnAnimals()`.
4. **New constant** → add to `constants.ts` with a comment.
5. **New UI element** → add to the correct camera ignore list in `GameScene.create()`.
