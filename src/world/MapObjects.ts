import Phaser from 'phaser';
import { WorldGenerator } from './WorldGenerator';
import { TileType } from './TileTypes';

import { TILE_SIZE, MAP_HEIGHT, NOISE_SEED } from '../constants';

const DEPTH_BASE = 2;
const DEPTH_RANGE = 2;
const MAP_HEIGHT_PX = MAP_HEIGHT * TILE_SIZE;

function seededRand(seed: number) {
  let s = seed;
  return (): number => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

interface Tree {
  sprite: Phaser.GameObjects.Image;
  wood: number;
  baseScale: number;
}

export class MapObjects {
  private scene: Phaser.Scene;

  /** Trees keyed by "tx,ty" of the forest tile they sit on. */
  private trees = new Map<string, Tree>();

  constructor(scene: Phaser.Scene, world: WorldGenerator) {
    this.scene = scene;
    const rand = seededRand(NOISE_SEED + 7);

    for (let ty = 0; ty < world.rows; ty++) {
      for (let tx = 0; tx < world.cols; tx++) {
        const tile = world.getTile(tx, ty);
        const r = rand();

        const cx = tx * TILE_SIZE + TILE_SIZE / 2;
        const cy = ty * TILE_SIZE + TILE_SIZE / 2;

        if (tile === TileType.FOREST && r < 0.78) {
          const ox    = (rand() - 0.5) * 10;
          const oy    = (rand() - 0.5) * 8;
          const scale = 1.4 + rand() * 1.4;          // 1.4 – 2.8
          const wood  = scale < 1.8 ? 1 : scale < 2.3 ? 2 : 3;
          const sprite = this.place(scene, 'tree', cx + ox, cy + oy, 0.5, 0.82, scale);
          this.trees.set(`${tx},${ty}`, { sprite, wood, baseScale: scale });

        } else if (tile === TileType.DESERT && r < 0.40) {
          const ox    = (rand() - 0.5) * 10;
          const oy    = (rand() - 0.5) * 8;
          const scale = 1.5 + rand() * 1.2;
          this.place(scene, 'cactus', cx + ox, cy + oy, 0.5, 0.85, scale, 0.5);

        } else if (tile === TileType.SNOW && r < 0.38) {
          const ox    = (rand() - 0.5) * 10;
          const oy    = (rand() - 0.5) * 8;
          const scale = 1.4 + rand() * 1.3;
          this.place(scene, 'snow_pine', cx + ox, cy + oy, 0.5, 0.82, scale);

        } else if (tile === TileType.SWAMP && r < 0.55) {
          const ox    = (rand() - 0.5) * 8;
          const oy    = (rand() - 0.5) * 6;
          const scale = 1.3 + rand() * 0.9;
          this.place(scene, 'reed', cx + ox, cy + oy, 0.5, 0.85, scale);
        }
      }
    }
  }

  hasTree(tx: number, ty: number): boolean {
    return this.trees.has(`${tx},${ty}`);
  }

  /** Returns remaining wood on the nearest tree at or adjacent to (tx,ty), or null. */
  findNearestTree(tx: number, ty: number): { tx: number; ty: number } | null {
    // Own tile first, then adjacents
    if (this.trees.has(`${tx},${ty}`)) return { tx, ty };
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;
        if (this.trees.has(`${tx + dx},${ty + dy}`)) return { tx: tx + dx, ty: ty + dy };
      }
    }
    return null;
  }

  /**
   * Harvest one unit of wood from the tree at (tx,ty).
   * Returns the remaining wood count, or -1 if no tree there.
   */
  harvestTree(tx: number, ty: number): number {
    const key = `${tx},${ty}`;
    const tree = this.trees.get(key);
    if (!tree) return -1;

    tree.wood--;

    if (tree.wood <= 0) {
      // Fade out and destroy
      this.scene.tweens.add({
        targets: tree.sprite,
        alpha: 0,
        scaleX: tree.baseScale * 0.5,
        scaleY: tree.baseScale * 0.5,
        duration: 500,
        ease: 'Power2',
        onComplete: () => tree.sprite.destroy(),
      });
      this.trees.delete(key);
      return 0;
    }

    // Visual hit feedback: shrink to fraction of remaining wood
    const frac = tree.wood / (tree.baseScale < 1.8 ? 1 : tree.baseScale < 2.3 ? 2 : 3);
    const targetScale = tree.baseScale * (0.65 + frac * 0.35);
    this.scene.tweens.add({
      targets: tree.sprite,
      scaleX: targetScale,
      scaleY: targetScale,
      duration: 200,
      ease: 'Back.Out',
    });

    return tree.wood;
  }

  private place(
    scene: Phaser.Scene,
    key: string,
    x: number,
    y: number,
    originX: number,
    originY: number,
    scale = 2,
    fixedDepth?: number,
  ): Phaser.GameObjects.Image {
    const obj = scene.add.image(x, y, key).setOrigin(originX, originY).setScale(scale);
    obj.setDepth(fixedDepth ?? DEPTH_BASE + (y / MAP_HEIGHT_PX) * DEPTH_RANGE);
    return obj;
  }
}
