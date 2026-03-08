import Phaser from 'phaser';
import { Inventory } from '../systems/ResourceSystem';

/**
 * Draw an item icon centred at (cx, cy).
 * s = scale multiplier: 1.0 fits a ~54px slot, 0.6 for small cost badges.
 */
export function drawIcon(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  key: keyof Inventory,
  s = 1,
): void {
  const r = (v: number) => v * s;

  switch (key) {
    case 'wood':
      g.fillStyle(0x8B4513, 1); g.fillRect(cx - r(14), cy - r(11), r(28), r(8));
      g.fillStyle(0xA0522D, 1); g.fillRect(cx - r(14), cy - r(1),  r(28), r(8));
      g.fillStyle(0x8B4513, 1); g.fillRect(cx - r(14), cy + r(9),  r(28), r(8));
      g.lineStyle(1, 0x5a2d0c, 0.7);
      g.lineBetween(cx - r(5), cy - r(11), cx - r(5), cy + r(17));
      g.lineBetween(cx + r(5), cy - r(11), cx + r(5), cy + r(17));
      break;

    case 'stone':
      g.fillStyle(0x777777, 1); g.fillCircle(cx + r(1), cy + r(3), r(13));
      g.fillStyle(0x999999, 1); g.fillCircle(cx - r(3), cy - r(2), r(8));
      g.fillStyle(0xAAAAAA, 1); g.fillCircle(cx - r(5), cy - r(5), r(4));
      break;

    case 'water':
      g.fillStyle(0x2a60cc, 1);
      g.fillTriangle(cx, cy - r(14), cx - r(9), cy + r(2), cx + r(9), cy + r(2));
      g.fillCircle(cx, cy + r(3), r(10));
      g.fillStyle(0x88bbff, 0.55); g.fillCircle(cx - r(3), cy, r(4));
      break;

    case 'grass':
      g.fillStyle(0x3a7a28, 1);
      g.fillTriangle(cx - r(11), cy + r(12), cx - r(7), cy - r(14), cx - r(2), cy + r(12));
      g.fillStyle(0x5ab83a, 1);
      g.fillTriangle(cx - r(4),  cy + r(12), cx,        cy - r(16), cx + r(4), cy + r(12));
      g.fillStyle(0x3a7a28, 1);
      g.fillTriangle(cx + r(2),  cy + r(12), cx + r(7),  cy - r(11), cx + r(11), cy + r(12));
      break;

    case 'meat':
      g.fillStyle(0xCC4444, 1); g.fillCircle(cx - r(3), cy - r(3), r(12));
      g.fillStyle(0xEECCAA, 1); g.fillRect(cx + r(4), cy + r(2), r(6), r(12));
      g.fillCircle(cx + r(7), cy + r(15), r(5));
      g.fillStyle(0xDD6666, 1); g.fillCircle(cx - r(7), cy - r(7), r(5));
      break;

    case 'vegetables':
      g.fillStyle(0x2e8b2e, 1); g.fillEllipse(cx, cy + r(4), r(18), r(26));
      g.fillStyle(0x44aa44, 1); g.fillEllipse(cx - r(8), cy - r(2), r(14), r(20));
      g.fillEllipse(cx + r(8), cy - r(2), r(14), r(20));
      g.fillStyle(0x66cc66, 1); g.fillEllipse(cx, cy - r(6), r(10), r(16));
      break;

    case 'axe':
      g.fillStyle(0x8B4513, 1); g.fillRect(cx - r(3), cy - r(14), r(6), r(28));
      g.fillStyle(0xCCCCCC, 1);
      g.fillTriangle(cx + r(3), cy - r(14), cx + r(17), cy - r(4), cx + r(3), cy + r(6));
      g.lineStyle(1, 0xEEEEEE, 1); g.lineBetween(cx + r(3), cy - r(14), cx + r(17), cy - r(4));
      break;

    case 'pickaxe':
      g.lineStyle(Math.max(2, r(5)), 0x8B4513, 1);
      g.lineBetween(cx - r(6), cy + r(14), cx + r(8), cy - r(2));
      g.fillStyle(0xBBBBBB, 1); g.fillRect(cx - r(14), cy - r(10), r(28), r(7));
      g.fillTriangle(cx - r(14), cy - r(10), cx - r(14), cy - r(3), cx - r(21), cy - r(7));
      g.fillTriangle(cx + r(14), cy - r(10), cx + r(14), cy - r(3), cx + r(21), cy - r(6));
      g.lineStyle(1, 0xDDDDDD, 1); g.lineBetween(cx - r(14), cy - r(10), cx + r(14), cy - r(10));
      break;

    case 'knife':
      g.fillStyle(0xDDDDDD, 1);
      g.fillTriangle(cx - r(10), cy + r(5), cx + r(14), cy - r(4), cx + r(14), cy + r(5));
      g.lineStyle(1, 0xFFFFFF, 0.9); g.lineBetween(cx - r(10), cy + r(5), cx + r(14), cy - r(4));
      g.fillStyle(0x8B4513, 1); g.fillRect(cx - r(18), cy - r(1), r(10), r(9));
      g.fillStyle(0x5a2d0c, 1); g.fillRect(cx - r(10), cy - r(1), r(3), r(9));
      break;

    case 'fire':
      // Ember base
      g.fillStyle(0x553311, 1); g.fillEllipse(cx, cy + r(12), r(20), r(7));
      // Outer flame (dark orange)
      g.fillStyle(0xff4400, 0.9);
      g.fillTriangle(cx - r(9), cy + r(10), cx + r(9), cy + r(10), cx, cy - r(14));
      // Mid flame (orange)
      g.fillStyle(0xff8800, 1);
      g.fillTriangle(cx - r(6), cy + r(8), cx + r(6), cy + r(8), cx, cy - r(8));
      // Inner flame (yellow)
      g.fillStyle(0xffdd00, 1);
      g.fillTriangle(cx - r(3), cy + r(5), cx + r(3), cy + r(5), cx, cy - r(2));
      break;

    case 'wheat':
      // Stalk
      g.lineStyle(Math.max(1, r(2)), 0xb88820, 1);
      g.lineBetween(cx, cy + r(14), cx - r(2), cy - r(6));
      // Left leaf
      g.lineStyle(Math.max(1, r(1.5)), 0xc8a030, 1);
      g.lineBetween(cx - r(1), cy + r(4), cx - r(8), cy - r(2));
      // Right leaf
      g.lineBetween(cx - r(1), cy - r(1), cx + r(6), cy - r(7));
      // Grain head (center + side grains)
      g.fillStyle(0xe8c040, 1);
      g.fillEllipse(cx - r(2), cy - r(10), r(5), r(12));
      g.fillStyle(0xd4a828, 1);
      g.fillEllipse(cx - r(6), cy - r(7), r(4), r(8));
      g.fillEllipse(cx + r(2), cy - r(7), r(4), r(8));
      break;

    case 'bread':
      // Loaf body
      g.fillStyle(0xc87828, 1); g.fillEllipse(cx, cy + r(2), r(28), r(18));
      // Crust top (dome)
      g.fillStyle(0xd4902a, 1); g.fillEllipse(cx, cy - r(3), r(24), r(14));
      // Score line across top
      g.lineStyle(Math.max(1, r(1.5)), 0xa05c18, 0.8);
      g.lineBetween(cx - r(8), cy - r(4), cx + r(8), cy - r(4));
      // Highlight
      g.fillStyle(0xe8b050, 0.6); g.fillEllipse(cx - r(4), cy - r(6), r(10), r(5));
      break;

    case 'cookedMeat':
      // Stick / skewer
      g.fillStyle(0x8B4513, 1);
      g.fillRect(cx - r(14), cy + r(5), r(28), r(4));
      // Meat chunk (browned)
      g.fillStyle(0x7a2e00, 1); g.fillEllipse(cx, cy - r(2), r(22), r(16));
      // Caramelised top (golden-brown highlight)
      g.fillStyle(0xc45a00, 1); g.fillEllipse(cx - r(2), cy - r(5), r(16), r(9));
      // Sear marks (dark stripes)
      g.lineStyle(Math.max(1, r(2)), 0x3a1000, 0.85);
      g.lineBetween(cx - r(5), cy - r(9), cx - r(3), cy + r(4));
      g.lineBetween(cx + r(2), cy - r(9), cx + r(4), cy + r(4));
      // Steam dot
      g.fillStyle(0xffffff, 0.35); g.fillCircle(cx, cy - r(12), r(3));
      break;
  }
}
