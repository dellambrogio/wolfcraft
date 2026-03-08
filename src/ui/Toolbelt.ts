import Phaser from 'phaser';
import { ResourceSystem, Inventory } from '../systems/ResourceSystem';
import { DEPTH_HUD } from '../constants';
import { drawIcon } from './drawIcon';
import { BG, BORDER, TEXT, ACCENT } from './palette';

const TOOL_KEYS = new Set<keyof Inventory>(['axe', 'pickaxe', 'knife']);

const INVENTORY_KEYS: Array<keyof Inventory> = [
  'wood', 'stone', 'water', 'grass', 'wheat', 'meat', 'cookedMeat', 'bread',
  'axe', 'pickaxe', 'knife', 'fire',
];

const NUM_SLOTS = 8;

export class Toolbelt {
  private scene: Phaser.Scene;
  private resourceSystem: ResourceSystem;
  private uiObjects: Phaser.GameObjects.GameObject[] = [];

  private assignedSlots: Array<keyof Inventory | null> = new Array(NUM_SLOTS).fill(null);
  private slotIconGraphics: Phaser.GameObjects.Graphics[] = [];
  private slotIconDrawn: boolean[] = new Array(NUM_SLOTS).fill(false);
  private slotPositions: Array<{ cx: number; cy: number; sx: number; sy: number }> = [];
  private slotCounts: Phaser.GameObjects.Text[] = [];
  private slotHighlights: Phaser.GameObjects.Graphics[] = [];
  private gatherHint!: Phaser.GameObjects.Text;
  private numberKeys: Phaser.Input.Keyboard.Key[] = [];

  // 9th equipped-tool slot
  private equippedSlotGraphic!: Phaser.GameObjects.Graphics;
  private equippedIconGraphic!: Phaser.GameObjects.Graphics;
  private equippedCountText!: Phaser.GameObjects.Text;
  private equippedIconDrawn = false;
  private _equippedTool: keyof Inventory | null = null;

  get equippedTool(): keyof Inventory | null { return this._equippedTool; }

  constructor(scene: Phaser.Scene, resources: ResourceSystem, width: number, height: number) {
    this.scene = scene;
    this.resourceSystem = resources;
    this.create(width, height);
    this.setupNumberKeys();
  }

  private setupNumberKeys(): void {
    const kb = this.scene.input.keyboard!;
    const codes = [
      Phaser.Input.Keyboard.KeyCodes.ONE,
      Phaser.Input.Keyboard.KeyCodes.TWO,
      Phaser.Input.Keyboard.KeyCodes.THREE,
      Phaser.Input.Keyboard.KeyCodes.FOUR,
      Phaser.Input.Keyboard.KeyCodes.FIVE,
      Phaser.Input.Keyboard.KeyCodes.SIX,
      Phaser.Input.Keyboard.KeyCodes.SEVEN,
      Phaser.Input.Keyboard.KeyCodes.EIGHT,
    ];
    for (let i = 0; i < NUM_SLOTS; i++) {
      this.numberKeys.push(kb.addKey(codes[i]));
    }
  }

  private create(width: number, height: number): void {
    const SLOT_SIZE = 54;
    const GAP = 4;
    const PAD = 8;
    const LABEL_H = 16;
    const EQUIP_GAP = 20; // extra gap before the equipped slot
    const barW = NUM_SLOTS * SLOT_SIZE + (NUM_SLOTS - 1) * GAP + PAD * 2
               + EQUIP_GAP + SLOT_SIZE; // 8 slots + gap + 1 equipped
    const barH = LABEL_H + SLOT_SIZE + PAD * 2;
    const barX = (width - barW) / 2;
    const barY = height - barH;

    const track = <T extends Phaser.GameObjects.GameObject>(o: T): T => {
      this.uiObjects.push(o); return o;
    };

    // Panel background
    track(this.scene.add.rectangle(barX, barY, barW, barH, BG.PANEL, 0.82)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(DEPTH_HUD));

    // "INVENTORY" label over the 8 slots
    const invCentreX = barX + PAD + NUM_SLOTS * SLOT_SIZE / 2 + (NUM_SLOTS - 1) * GAP / 2;
    track(this.scene.add.text(invCentreX, barY + 5, 'INVENTORY', {
      fontFamily: 'monospace', fontSize: '10px', color: TEXT.MID,
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(DEPTH_HUD));

    // "EQUIPPED" label over the 9th slot
    const equipSlotX = barX + PAD + NUM_SLOTS * (SLOT_SIZE + GAP) + EQUIP_GAP;
    const equipCX = equipSlotX + SLOT_SIZE / 2;
    track(this.scene.add.text(equipCX, barY + 5, 'EQUIPPED', {
      fontFamily: 'monospace', fontSize: '10px', color: TEXT.LIGHT,
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(DEPTH_HUD));

    const slotBgGraphics = track(this.scene.add.graphics()
      .setScrollFactor(0).setDepth(DEPTH_HUD)) as Phaser.GameObjects.Graphics;

    // Draw 8 inventory slots
    for (let i = 0; i < NUM_SLOTS; i++) {
      const sx = barX + PAD + i * (SLOT_SIZE + GAP);
      const sy = barY + PAD + LABEL_H;
      const cx = sx + SLOT_SIZE / 2;
      const cy = sy + SLOT_SIZE / 2 - 4;

      slotBgGraphics.fillStyle(BG.SLOT, 0.85);
      slotBgGraphics.fillRect(sx, sy, SLOT_SIZE, SLOT_SIZE);
      slotBgGraphics.lineStyle(2, BORDER.MID, 1);
      slotBgGraphics.strokeRect(sx, sy, SLOT_SIZE, SLOT_SIZE);

      // Hover/click highlight (hidden by default)
      const hl = track(this.scene.add.graphics()
        .setScrollFactor(0).setDepth(DEPTH_HUD + 0.5).setAlpha(0)) as Phaser.GameObjects.Graphics;
      hl.lineStyle(2, BORDER.WHITE, 0.7);
      hl.strokeRect(sx, sy, SLOT_SIZE, SLOT_SIZE);
      this.slotHighlights.push(hl);

      const iconG = track(this.scene.add.graphics()
        .setScrollFactor(0).setDepth(DEPTH_HUD + 1).setVisible(false)) as Phaser.GameObjects.Graphics;
      this.slotIconGraphics.push(iconG);
      this.slotPositions.push({ cx, cy, sx, sy });

      const countText = track(this.scene.add.text(
        sx + SLOT_SIZE - 4, sy + SLOT_SIZE - 4, '',
        { fontFamily: 'monospace', fontSize: '12px', color: TEXT.WHITE, stroke: '#000000', strokeThickness: 3 },
      ).setOrigin(1, 1).setScrollFactor(0).setDepth(DEPTH_HUD + 2).setVisible(false));
      this.slotCounts.push(countText);

      // Slot number label (top-left corner, Minecraft style)
      track(this.scene.add.text(sx + 3, sy + 2, String(i + 1), {
        fontFamily: 'monospace', fontSize: '10px', color: TEXT.DIM,
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0, 0).setScrollFactor(0).setDepth(DEPTH_HUD + 2));

      // Clickable zone
      const zone = track(this.scene.add.zone(sx, sy, SLOT_SIZE, SLOT_SIZE)
        .setOrigin(0, 0).setScrollFactor(0).setInteractive());
      zone.on('pointerdown', () => this.onSlotClick(i));
      zone.on('pointerover', () => hl.setAlpha(1));
      zone.on('pointerout',  () => hl.setAlpha(0));
    }

    // 9th equipped slot (gold border)
    const equipSY = barY + PAD + LABEL_H;
    const equipCY = equipSY + SLOT_SIZE / 2 - 4;

    this.equippedSlotGraphic = track(this.scene.add.graphics()
      .setScrollFactor(0).setDepth(DEPTH_HUD)) as Phaser.GameObjects.Graphics;
    this.equippedSlotGraphic.fillStyle(BG.SLOT, 0.9);
    this.equippedSlotGraphic.fillRect(equipSlotX, equipSY, SLOT_SIZE, SLOT_SIZE);
    this.equippedSlotGraphic.lineStyle(2, BORDER.LIGHT, 1);
    this.equippedSlotGraphic.strokeRect(equipSlotX, equipSY, SLOT_SIZE, SLOT_SIZE);

    this.equippedIconGraphic = track(this.scene.add.graphics()
      .setScrollFactor(0).setDepth(DEPTH_HUD + 1).setVisible(false)) as Phaser.GameObjects.Graphics;
    this.slotPositions.push({ cx: equipCX, cy: equipCY, sx: equipSlotX, sy: equipSY });

    this.equippedCountText = track(this.scene.add.text(
      equipSlotX + SLOT_SIZE - 4, equipSY + SLOT_SIZE - 4, '',
      { fontFamily: 'monospace', fontSize: '12px', color: TEXT.WHITE, stroke: '#000000', strokeThickness: 3 },
    ).setOrigin(1, 1).setScrollFactor(0).setDepth(DEPTH_HUD + 2).setVisible(false));

    // Gather hint
    this.gatherHint = track(this.scene.add.text(width / 2, barY - 8, '[Q] Gather', {
      fontFamily: 'monospace', fontSize: '14px', color: ACCENT.GATHER,
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5, 1).setScrollFactor(0).setDepth(DEPTH_HUD).setAlpha(0));
  }

  private onSlotClick(i: number): void {
    const key = this.assignedSlots[i];
    if (!key || !TOOL_KEYS.has(key)) return;
    if (this.resourceSystem.get(key) <= 0) return;

    // Equip this tool
    this._equippedTool = key;
    this.equippedIconDrawn = false; // force redraw
  }

  showGatherHint(show: boolean): void {
    this.gatherHint.setAlpha(show ? 1 : 0);
  }

  update(): void {
    const inv = this.resourceSystem.getAll();

    // 1–8 number keys select hotbar slot (equips if slot contains a tool)
    for (let i = 0; i < NUM_SLOTS; i++) {
      if (Phaser.Input.Keyboard.JustDown(this.numberKeys[i])) {
        this.onSlotClick(i);
        break;
      }
    }

    // Un-equip if tool runs out
    if (this._equippedTool && inv[this._equippedTool] <= 0) {
      this._equippedTool = null;
      this.equippedIconGraphic.clear().setVisible(false);
      this.equippedCountText.setVisible(false).setText('');
      this.equippedIconDrawn = false;
    }

    // Remove slots whose item count dropped to zero
    for (let i = 0; i < NUM_SLOTS; i++) {
      const key = this.assignedSlots[i];
      if (key !== null && inv[key] === 0) {
        this.assignedSlots[i] = null;
        this.slotIconGraphics[i].clear().setVisible(false);
        this.slotIconDrawn[i] = false;
        this.slotCounts[i].setVisible(false).setText('');
      }
    }

    // Assign newly-acquired items to the leftmost free slot
    for (const key of INVENTORY_KEYS) {
      if (inv[key] > 0 && !this.assignedSlots.includes(key)) {
        const freeIdx = this.assignedSlots.indexOf(null);
        if (freeIdx === -1) break;
        this.assignedSlots[freeIdx] = key;
        this.slotIconDrawn[freeIdx] = false; // needs drawing
      }
    }

    // Redraw icons that haven't been drawn yet
    for (let i = 0; i < NUM_SLOTS; i++) {
      const key = this.assignedSlots[i];
      if (key !== null && !this.slotIconDrawn[i]) {
        const { cx, cy } = this.slotPositions[i];
        this.slotIconGraphics[i].clear();
        drawIcon(this.slotIconGraphics[i], cx, cy, key, 1);
        // Tint tool slots with a subtle gold outline indicator
        if (TOOL_KEYS.has(key)) {
          this.slotIconGraphics[i].lineStyle(1, BORDER.LIGHT, 0.5);
          const { sx, sy } = this.slotPositions[i];
          this.slotIconGraphics[i].strokeRect(sx + 2, sy + 2, 50, 50);
        }
        this.slotIconGraphics[i].setVisible(true);
        this.slotIconDrawn[i] = true;
      }
    }

    // Update count badges
    for (let i = 0; i < NUM_SLOTS; i++) {
      const key = this.assignedSlots[i];
      if (key !== null) {
        this.slotCounts[i].setVisible(true).setText(String(inv[key]));
      }
    }

    // Equipped slot icon
    if (this._equippedTool) {
      if (!this.equippedIconDrawn) {
        const { cx, cy } = this.slotPositions[NUM_SLOTS]; // 9th position
        this.equippedIconGraphic.clear();
        drawIcon(this.equippedIconGraphic, cx, cy, this._equippedTool, 1);
        this.equippedIconGraphic.setVisible(true);
        this.equippedIconDrawn = true;
      }
      this.equippedCountText.setText(String(inv[this._equippedTool])).setVisible(true);
    }
  }

  getGameObjects(): Phaser.GameObjects.GameObject[] {
    return this.uiObjects;
  }
}
