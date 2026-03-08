import Phaser from 'phaser';

type BtnData = {
  bg: Phaser.GameObjects.Rectangle;
  txt: Phaser.GameObjects.Text;
  getX: (W: number) => number;
  getY: (H: number) => number;
};

export class MobileControls {
  private scene: Phaser.Scene;
  private btns: BtnData[] = [];

  // D-pad held state
  touchDx = 0;
  touchDy = 0;

  // One-shot action flags
  private _justGather = false;
  private _justEat    = false;
  private _justHunt   = false;
  private _justFire   = false;
  private _justTorch  = false;
  private _justCraft  = false;
  private _sneakDown  = false;

  get justGather(): boolean { const v = this._justGather; this._justGather = false; return v; }
  get justEat():    boolean { const v = this._justEat;    this._justEat    = false; return v; }
  get justHunt():   boolean { const v = this._justHunt;   this._justHunt   = false; return v; }
  get justFire():   boolean { const v = this._justFire;   this._justFire   = false; return v; }
  get justTorch():  boolean { const v = this._justTorch;  this._justTorch  = false; return v; }
  get justCraft():  boolean { const v = this._justCraft;  this._justCraft  = false; return v; }
  get sneakDown():  boolean { return this._sneakDown; }

  readonly active: boolean;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.active = scene.sys.game.device.input.touch;
    if (!this.active) return;
    this.build();
    scene.scale.on('resize', this.reposition, this);
  }

  private build(): void {
    const PAD  = 16;
    const BTN  = 56;   // D-pad button size
    const ABTN = 52;   // action button size
    const STEP = 60;   // action button stride (ABTN + gap)

    // ── D-pad ──────────────────────────────────────────────────────────────
    // Centre of the cross: PAD + 1.5 × BTN from bottom-left
    const dpCx = (W: number) => W * 0;  // unused, anchored left
    const dpLeft = PAD + BTN * 1.5;
    const dpRight = PAD + BTN * 2.5;
    const dpCenterX = PAD + BTN * 1.5;

    this.makeDirBtn(
      () => dpCenterX,
      (H) => H - PAD - BTN * 2.5,
      '▲', 0, -1,
    );
    this.makeDirBtn(
      () => dpCenterX,
      (H) => H - PAD - BTN * 0.5,
      '▼', 0, 1,
    );
    this.makeDirBtn(
      () => PAD + BTN * 0.5,
      (H) => H - PAD - BTN * 1.5,
      '◀', -1, 0,
    );
    this.makeDirBtn(
      () => PAD + BTN * 2.5,
      (H) => H - PAD - BTN * 1.5,
      '▶', 1, 0,
    );

    // ── Action buttons (bottom-right) ──────────────────────────────────────
    // 2 columns (col 0 = far right), 3 rows (row 0 = bottom)
    const ax = (col: number) => (W: number) => W - PAD - ABTN / 2 - col * STEP;
    const ay = (row: number) => (H: number) => H - PAD - ABTN / 2 - row * STEP;

    const actions: { label: string; col: number; row: number; fn: () => void; color?: number }[] = [
      { label: 'Gather', col: 0, row: 0, fn: () => { this._justGather = true; } },
      { label: 'Hunt',   col: 1, row: 0, fn: () => { this._justHunt   = true; } },
      { label: 'Eat',    col: 0, row: 1, fn: () => { this._justEat    = true; } },
      { label: 'Fire',   col: 1, row: 1, fn: () => { this._justFire   = true; } },
      { label: 'Torch',  col: 0, row: 2, fn: () => { this._justTorch  = true; } },
      { label: 'Craft',  col: 1, row: 2, fn: () => { this._justCraft  = true; }, color: 0x1a2a44 },
    ];

    for (const a of actions) {
      this.makeActionBtn(ax(a.col), ay(a.row), ABTN, a.label, a.fn, a.color ?? 0x0d1a0d);
    }

    // Sneak: wide button spanning both columns, one row above actions
    this.makeSneakBtn(
      (W) => W - PAD - (2 * ABTN + 8) / 2,
      (H) => H - PAD - ABTN / 2 - 3 * STEP,
      2 * ABTN + 8,
      ABTN,
    );
  }

  // ── Factory helpers ────────────────────────────────────────────────────

  private makeRect(
    getX: (W: number) => number,
    getY: (H: number) => number,
    w: number, h: number,
    color: number, alpha: number,
  ): Phaser.GameObjects.Rectangle {
    const { width: W, height: H } = this.scene.scale;
    return this.scene.add
      .rectangle(getX(W), getY(H), w, h, color, alpha)
      .setScrollFactor(0)
      .setDepth(300);
  }

  private makeLabel(
    getX: (W: number) => number,
    getY: (H: number) => number,
    label: string,
    size = '11px',
  ): Phaser.GameObjects.Text {
    const { width: W, height: H } = this.scene.scale;
    return this.scene.add
      .text(getX(W), getY(H), label, {
        fontFamily: 'monospace', fontSize: size,
        color: '#ffffff', align: 'center',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(301);
  }

  private makeDirBtn(
    getX: (W: number) => number,
    getY: (H: number) => number,
    label: string,
    dx: number, dy: number,
  ): void {
    const bg = this.makeRect(getX, getY, 56, 56, 0x000000, 0.4).setInteractive();
    const txt = this.makeLabel(getX, getY, label, '22px');

    bg.on('pointerdown', () => { this.touchDx = dx; this.touchDy = dy; });
    bg.on('pointerup',   () => { if (this.touchDx === dx) this.touchDx = 0; if (this.touchDy === dy) this.touchDy = 0; });
    bg.on('pointerout',  () => { if (this.touchDx === dx) this.touchDx = 0; if (this.touchDy === dy) this.touchDy = 0; });

    this.btns.push({ bg, txt, getX, getY });
  }

  private makeActionBtn(
    getX: (W: number) => number,
    getY: (H: number) => number,
    size: number,
    label: string,
    fn: () => void,
    color = 0x0d1a0d,
  ): void {
    const bg = this.makeRect(getX, getY, size, size, color, 0.55).setInteractive();
    const txt = this.makeLabel(getX, getY, label);

    bg.on('pointerdown', () => { bg.setAlpha(0.85); fn(); });
    bg.on('pointerup',   () => bg.setAlpha(0.55));
    bg.on('pointerout',  () => bg.setAlpha(0.55));

    this.btns.push({ bg, txt, getX, getY });
  }

  private makeSneakBtn(
    getX: (W: number) => number,
    getY: (H: number) => number,
    w: number, h: number,
  ): void {
    const bg = this.makeRect(getX, getY, w, h, 0x1a1a2e, 0.55).setInteractive();
    const txt = this.makeLabel(getX, getY, 'Sneak');

    bg.on('pointerdown', () => { this._sneakDown = true;  bg.setAlpha(0.85); });
    bg.on('pointerup',   () => { this._sneakDown = false; bg.setAlpha(0.55); });
    bg.on('pointerout',  () => { this._sneakDown = false; bg.setAlpha(0.55); });

    this.btns.push({ bg, txt, getX, getY });
  }

  // ── Resize ────────────────────────────────────────────────────────────

  private reposition(): void {
    const { width: W, height: H } = this.scene.scale;
    for (const { bg, txt, getX, getY } of this.btns) {
      bg.setPosition(getX(W), getY(H));
      txt.setPosition(getX(W), getY(H));
    }
  }

  // ── Public API ────────────────────────────────────────────────────────

  getGameObjects(): Phaser.GameObjects.GameObject[] {
    return this.btns.flatMap(b => [b.bg, b.txt]);
  }

  destroy(): void {
    if (!this.active) return;
    this.scene.scale.off('resize', this.reposition, this);
    for (const { bg, txt } of this.btns) { bg.destroy(); txt.destroy(); }
  }
}
