import Phaser from 'phaser';
import { DEPTH_CRAFT } from '../constants';
import { BG, BORDER, TEXT } from './palette';

const DEPTH = DEPTH_CRAFT + 10;

const CONTROLS: [string, string][] = [
  ['WASD / Arrows', 'Move'],
  ['Shift  (hold)', 'Sneak — animals less aware'],
  ['Q',             'Gather resource / pick up item'],
  ['K',             'Hunt nearest animal'],
  ['Z',             'Eat food (restores HP)'],
  ['T',             'Toggle torch'],
  ['F',             'Place campfire'],
  ['E',             'Open crafting / inventory'],
  ['Esc',           'Close crafting menu'],
  ['1 – 8',         'Equip hotbar slot'],
  ['R',             'Restart (after death)'],
  ['H',             'Toggle this panel'],
];

export class InstructionPanel {
  private scene:   Phaser.Scene;
  private objects: Phaser.GameObjects.GameObject[] = [];
  private persistentObjects: Phaser.GameObjects.GameObject[] = [];
  private _visible = false;
  private helpKey!: Phaser.Input.Keyboard.Key;

  get isVisible(): boolean { return this._visible; }
  getGameObjects(): Phaser.GameObjects.GameObject[] { return [...this.objects, ...this.persistentObjects]; }

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.helpKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.H);
    this.build();
  }

  private build(): void {
    const { width, height } = this.scene.scale;

    const PAD   = 18;
    const PW    = 460;
    const ROW_H = 22;
    const PH    = PAD * 3 + 32 + CONTROLS.length * ROW_H + 28;
    const px    = (width  - PW) / 2;
    const py    = (height - PH) / 2;

    const add = <T extends Phaser.GameObjects.Components.ScrollFactor & Phaser.GameObjects.Components.Depth & Phaser.GameObjects.GameObject>(o: T): T => {
      o.setScrollFactor(0).setDepth(DEPTH);
      this.objects.push(o);
      return o;
    };

    // Shadow
    add(this.scene.add.rectangle(px + 6, py + 6, PW, PH, 0x000000, 0.45));

    // Background
    add(this.scene.add.rectangle(px, py, PW, PH, BG.PANEL, 0.93).setOrigin(0));

    // Border
    const border = this.scene.add.graphics().setScrollFactor(0).setDepth(DEPTH);
    border.lineStyle(1.5, BORDER.STD, 0.85);
    border.strokeRect(px, py, PW, PH);
    this.objects.push(border);

    // Title
    add(this.scene.add.text(px + PW / 2, py + PAD, 'CONTROLS', {
      fontFamily: 'monospace', fontSize: '18px', color: TEXT.LIGHT,
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5, 0));

    // Divider
    const div = this.scene.add.graphics().setScrollFactor(0).setDepth(DEPTH);
    div.lineStyle(1, 0x334466, 0.8);
    div.lineBetween(px + PAD, py + PAD + 28, px + PW - PAD, py + PAD + 28);
    this.objects.push(div);

    // Key column and action column x positions
    const keyX    = px + PAD;
    const sepX    = px + 168;
    const actionX = px + 178;
    let   ry      = py + PAD + 36;

    for (const [key, action] of CONTROLS) {
      // Alternating row tint
      const rowIdx = CONTROLS.indexOf([key, action]);
      if (rowIdx % 2 === 0) {
        const stripe = this.scene.add.rectangle(px + 1, ry - 3, PW - 2, ROW_H, 0xffffff, 0.03)
          .setOrigin(0).setScrollFactor(0).setDepth(DEPTH - 0.1);
        this.objects.push(stripe);
      }

      // Key badge
      add(this.scene.add.rectangle(keyX + 60, ry + ROW_H / 2 - 1, 118, ROW_H - 6, BG.ROW, 0.9)
        .setOrigin(0.5));
      add(this.scene.add.text(keyX + 60, ry + ROW_H / 2 - 1, key, {
        fontFamily: 'monospace', fontSize: '12px', color: TEXT.LABEL,
      }).setOrigin(0.5));

      // Separator
      add(this.scene.add.text(sepX, ry, '—', {
        fontFamily: 'monospace', fontSize: '12px', color: TEXT.DISABLED,
      }));

      // Action description
      add(this.scene.add.text(actionX, ry, action, {
        fontFamily: 'monospace', fontSize: '12px', color: TEXT.LIGHT,
      }));

      ry += ROW_H;
    }

    // Footer hint
    add(this.scene.add.text(px + PW / 2, py + PH - PAD - 4, 'Press H to hide', {
      fontFamily: 'monospace', fontSize: '11px', color: TEXT.DISABLED,
    }).setOrigin(0.5, 1));

    this.setVisible(false);

    // Persistent corner hint — always visible, never toggled
    const hint = this.scene.add.text(8, 8, '[H] Help', {
      fontFamily: 'monospace', fontSize: '11px', color: TEXT.HINT,
      stroke: '#000000', strokeThickness: 2,
    }).setScrollFactor(0).setDepth(DEPTH);
    this.persistentObjects.push(hint);
  }

  private setVisible(v: boolean): void {
    this._visible = v;
    for (const o of this.objects) {
      (o as Phaser.GameObjects.GameObject & { setVisible: (v: boolean) => void }).setVisible(v);
    }
  }

  toggle(): void {
    this.setVisible(!this._visible);
  }

  hide(): void {
    if (this._visible) this.setVisible(false);
  }

  /** Call once per frame from the scene. */
  update(): void {
    if (Phaser.Input.Keyboard.JustDown(this.helpKey)) {
      this.toggle();
    }
  }
}
