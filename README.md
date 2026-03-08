# Wolfcraft

A browser-based 2D survival game built with Phaser 3, TypeScript, and Vite.

Survive the night. Hunt. Gather. Endure.

---

## Tech Stack

- [Phaser 3](https://phaser.io/) — game framework
- [TypeScript](https://www.typescriptlang.org/) — language
- [Vite](https://vitejs.dev/) — dev server & build tool

---

## Setup

**Prerequisites:** Node.js is managed via [fnm](https://github.com/Schniz/fnm). If you don't have it, install it first:

```bash
curl -fsSL https://fnm.vercel.app/install | bash
source ~/.bashrc
fnm install --lts
```

**Install dependencies:**

```bash
npm install
```

---

## Running the Game

```bash
npm run dev
```

Open your browser at **http://localhost:5173**

---

## Controls

| Key | Action |
|-----|--------|
| `WASD` / Arrow Keys | Move |
| `Shift` (hold) | Sneak — animals less aware |
| `Q` | Gather resource / pick up item |
| `K` | Hunt nearest animal |
| `Z` | Eat food (restores HP) |
| `T` | Toggle torch |
| `F` | Place campfire |
| `E` | Open crafting / inventory |
| `Esc` | Close crafting menu |
| `1` – `8` | Equip hotbar slot |
| `R` | Restart after death |
| `H` | Toggle help panel |

---

## Building for Production

```bash
npm run build
```

Output goes to `dist/`. Serve with:

```bash
npm run preview
```

---

## Gameplay

- **Explore** a procedurally generated world with grass, forest, mountain, and water tiles
- **Gather** wood, stone, and food resources from the environment
- **Hunt** deer, rabbits, and pigs — but watch out for wolves
- **Craft** tools and food at the crafting menu
- **Survive** the day/night cycle — health drains over time, so eat and stay warm
- **Sneak** to reduce animal awareness radius and approach wildlife unseen

---

## Project Structure

```
src/
├── main.ts                  # Entry point, Phaser game config
├── constants.ts             # Tile size, speeds, timings, tunable values
├── config.ts                # Structured GameConfig object
├── scenes/
│   ├── BootScene.ts         # Generates tile/entity textures (no image assets needed)
│   ├── MenuScene.ts         # Atmospheric main menu
│   └── GameScene.ts         # Core game loop and orchestration
├── entities/
│   ├── Player.ts            # Movement, collision, gathering, eating, sneaking
│   ├── Animal.ts            # Animal AI (deer, rabbit, pig, wolf)
│   └── Fire.ts              # Campfire placement and light radius
├── world/
│   ├── TileTypes.ts         # Tile enum + metadata (walkable, color, etc.)
│   ├── WorldGenerator.ts    # Seeded fractal noise map generation
│   └── MapObjects.ts        # Static world objects (trees, rocks, etc.)
├── systems/
│   ├── ResourceSystem.ts    # Inventory management
│   ├── TimeSystem.ts        # Day/night cycle
│   ├── FogOfWar.ts          # Tile exploration tracking
│   └── SoundSystem.ts       # Procedural audio synthesis
├── pipelines/
│   └── NightPipeline.ts     # WebGL shader for night darkness effect
├── textures/
│   ├── tileDraw.ts          # Canvas-drawn tile textures
│   ├── animalDraw.ts        # Canvas-drawn animal sprites
│   ├── playerDraw.ts        # Canvas-drawn player sprite
│   └── objectDraw.ts        # Canvas-drawn world object sprites
└── ui/
    ├── palette.ts           # Central colour constants for all UI
    ├── HUD.ts               # Health bar, minimap, day/time display
    ├── Toolbelt.ts          # Hotbar inventory slots (1–8) + equipped tool
    ├── CraftingMenu.ts      # Crafting and inventory panel (E)
    ├── InstructionPanel.ts  # Controls reference panel (H)
    └── drawIcon.ts          # Icon rendering for inventory items
```
