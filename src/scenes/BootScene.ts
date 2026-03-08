import Phaser from 'phaser';
import { TILE_SIZE } from '../constants';
import { TileType } from '../world/TileTypes';
import { genMaskedVariants, addTileTexture } from '../textures/textureUtils';
import { drawGrass, drawWater, drawForest, drawMountain, drawDesert, drawSnow, drawSwamp, drawWheat } from '../textures/tileDraw';
import { drawGrassItem, drawWheatItem, drawStoneItem, drawRabbitHole, drawTree, drawRock, drawCactus, drawSnowPine, drawReed } from '../textures/objectDraw';
import { createAnimalSpritesheet, drawDeer, drawRabbit, drawPig, drawWolf } from '../textures/animalDraw';
import { createPlayerSpritesheet } from '../textures/playerDraw';

/**
 * BootScene generates all textures programmatically — no external image assets needed.
 * Drawing logic lives in src/textures/; this file only orchestrates registration.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    this.load.audio('deer-grunt',    'sounds/deer-grunt.mp3');
    this.load.audio('rabbit-squeak', 'sounds/rabbit-squeak.mp3');
    this.load.audio('pig-grunt',     'sounds/pig-grunt.mp3');
    this.load.audio('wolf-howl',     'sounds/wolf-howl.mp3');

    const S = TILE_SIZE;
    const tex = this.textures;

    // Tile textures — 16 connectivity-masked variants each
    for (let v = 0; v < 4; v++) {
      genMaskedVariants(tex, `tile_${TileType.GRASS}_v${v}`, S, S, (ctx, w, h) => drawGrass(ctx, w, h, v));
    }
    genMaskedVariants(tex, `tile_${TileType.WATER}`,    S, S, drawWater);
    genMaskedVariants(tex, `tile_${TileType.FOREST}`,   S, S, drawForest);
    genMaskedVariants(tex, `tile_${TileType.MOUNTAIN}`, S, S, drawMountain);
    genMaskedVariants(tex, `tile_${TileType.DESERT}`,   S, S, drawDesert);
    genMaskedVariants(tex, `tile_${TileType.SNOW}`,     S, S, drawSnow);
    genMaskedVariants(tex, `tile_${TileType.SWAMP}`,    S, S, drawSwamp);
    genMaskedVariants(tex, `tile_${TileType.WHEAT}`,    S, S, drawWheat);

    // Map objects
    addTileTexture(tex, 'grass_item',  26, 26, drawGrassItem);
    addTileTexture(tex, 'wheat_item',  26, 26, drawWheatItem);
    addTileTexture(tex, 'stone_item',  26, 22, drawStoneItem);
    addTileTexture(tex, 'rabbit_hole', 34, 22, drawRabbitHole);
    addTileTexture(tex, 'tree',        32, 44, drawTree);
    addTileTexture(tex, 'rock',      30, 24, drawRock);
    addTileTexture(tex, 'cactus',    18, 34, drawCactus);
    addTileTexture(tex, 'snow_pine', 30, 42, drawSnowPine);
    addTileTexture(tex, 'reed',      14, 32, drawReed);

    // Animals — 3-frame spritesheets (idle + 2 walk steps)
    // liftingFactor: fraction of leg height lifted per step [0..1]
    createAnimalSpritesheet(tex, 'animal_deer',   36, 40, drawDeer,   0.5);
    createAnimalSpritesheet(tex, 'animal_rabbit', 20, 24, drawRabbit, 0.6);
    createAnimalSpritesheet(tex, 'animal_pig',    34, 20, drawPig,    0.5);
    createAnimalSpritesheet(tex, 'animal_wolf',   42, 36, drawWolf,   0.5);

    // Player spritesheet (3 frames: idle + 2 walk steps)
    createPlayerSpritesheet(tex);
  }

  create(): void {
    this.scene.start('MenuScene');
  }
}
