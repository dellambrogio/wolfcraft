import Phaser from 'phaser';
import { ResourceSystem, Inventory } from '../systems/ResourceSystem';
import { DEPTH_CRAFT } from '../constants';
import { drawIcon } from './drawIcon';
import { BG, BORDER, TEXT, ACCENT } from './palette';

interface CostItem { key: keyof Inventory; amount: number; }
interface Recipe {
  output:         keyof Inventory;
  name:           string;
  cost:           CostItem[];
  condition?:     () => boolean;
  conditionHint?: string;
}

interface ListRowUI {
  bg:       Phaser.GameObjects.Rectangle;
  iconG:    Phaser.GameObjects.Graphics;
  nameText: Phaser.GameObjects.Text;
  costText: Phaser.GameObjects.Text;
}

export class CraftingMenu {
  private scene:     Phaser.Scene;
  private resources: ResourceSystem;
  private _open      = false;
  private nearFire   = false;
  private selectedIdx: number | null = null;

  private objects:    Phaser.GameObjects.GameObject[] = [];
  private recipes:    Recipe[] = [];

  // Left panel
  private listRowBgs: Phaser.GameObjects.Rectangle[] = [];
  private listRows:   ListRowUI[] = [];

  // Right panel
  private gridIconGs:  Phaser.GameObjects.Graphics[] = []; // 9 grid cells
  private outputIconG!: Phaser.GameObjects.Graphics;
  private craftBtn!:    Phaser.GameObjects.Rectangle;
  private craftBtnLbl!: Phaser.GameObjects.Text;
  private statusText!:  Phaser.GameObjects.Text;

  // Cached layout coords (container-relative, computed in build)
  private gridX = 0;
  private gridY = 0;
  private readonly CELL = 52;
  private readonly GAP  = 5;
  private outCX = 0;
  private outCY = 0;

  private escKey!: Phaser.Input.Keyboard.Key;

  get isOpen(): boolean { return this._open; }
  getGameObjects(): Phaser.GameObjects.GameObject[] { return this.objects; }
  setNearFire(value: boolean): void { this.nearFire = value; }

  constructor(scene: Phaser.Scene, resources: ResourceSystem) {
    this.scene     = scene;
    this.resources = resources;
    this.build();
    this.setAllVisible(false);
  }

  private reg<T extends Phaser.GameObjects.GameObject>(o: T): T {
    this.objects.push(o);
    return o;
  }

  private build(): void {
    const { width, height } = this.scene.scale;

    // Scale so the panel fits on any screen (1× on desktop, smaller on mobile)
    const s = Math.min(1, (width - 8) / 640, (height - 8) / 420);

    this.recipes = [
      { output: 'axe',      name: 'Axe',       cost: [{ key: 'wood', amount: 3 }, { key: 'stone', amount: 2 }] },
      { output: 'pickaxe',  name: 'Pickaxe',   cost: [{ key: 'wood', amount: 3 }, { key: 'stone', amount: 4 }] },
      { output: 'knife',    name: 'Knife',     cost: [{ key: 'wood', amount: 1 }, { key: 'stone', amount: 1 }, { key: 'grass', amount: 2 }] },
      { output: 'fire',     name: 'Campfire',  cost: [{ key: 'wood', amount: 4 }, { key: 'stone', amount: 2 }] },
      {
        output: 'cookedMeat', name: 'Cook Meat',
        cost:   [{ key: 'meat', amount: 1 }],
        condition:     () => this.nearFire,
        conditionHint: 'Requires nearby fire',
      },
      {
        output: 'bread', name: 'Bread',
        cost:   [{ key: 'wheat', amount: 3 }],
        condition:     () => this.nearFire,
        conditionHint: 'Requires nearby fire',
      },
    ];

    // ── Full-screen backdrop (outside container — always fills screen) ─────
    const backdrop = this.reg(
      this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.70)
        .setOrigin(0).setScrollFactor(0).setDepth(DEPTH_CRAFT)
        .setInteractive(),
    ) as Phaser.GameObjects.Rectangle;
    backdrop.on('pointerdown', () => this.close());

    // ── Container (centred, scaled) ────────────────────────────────────────
    const ct = this.reg(
      this.scene.add.container(width / 2, height / 2)
        .setScrollFactor(0).setDepth(DEPTH_CRAFT + 1),
    ) as Phaser.GameObjects.Container;
    ct.setScale(s);

    const add = <T extends Phaser.GameObjects.GameObject>(o: T): T => {
      ct.add(o); return o;
    };

    // ── Panel geometry (in unscaled 640×420 space, centred at 0,0) ────────
    const PW = 640, PH = 420;
    const PX = -PW / 2;  // -320
    const PY = -PH / 2;  // -210

    const LIST_W = 210;
    const DIV_X  = PX + LIST_W;  // -110

    const CELL = this.CELL, GAP = this.GAP;
    const GRID_CONTENT_W = 3 * CELL + 2 * GAP; // 166
    const RIGHT_W        = PW - LIST_W;          // 430
    const USED_W         = GRID_CONTENT_W + 20 + 22 + 10 + 60; // 278
    const LAYOUT_OFFSET  = Math.floor((RIGHT_W - USED_W) / 2);

    this.gridX = DIV_X + LAYOUT_OFFSET;
    this.gridY = PY + 90;

    const arrowX    = this.gridX + GRID_CONTENT_W + 20;
    const arrowMidY = this.gridY + (3 * CELL + 2 * GAP) / 2;
    const outX      = arrowX + 22 + 10;
    const outSize   = 60;
    this.outCX = outX + outSize / 2;
    this.outCY = arrowMidY;

    // Transparent blocker — absorbs clicks on the panel so they don't reach the backdrop
    add(this.scene.add.rectangle(0, 0, PW, PH, 0x000000, 0).setInteractive());

    // ── Panel background ───────────────────────────────────────────────────
    add(this.scene.add.rectangle(PX, PY, PW, PH, BG.FULL_PANEL, 1).setOrigin(0));

    // Panel border
    const border = add(this.scene.add.graphics()) as Phaser.GameObjects.Graphics;
    border.lineStyle(2, BORDER.STD, 1);
    border.strokeRect(PX, PY, PW, PH);

    // Title bar
    add(this.scene.add.rectangle(PX, PY, PW, 38, BG.TITLEBAR, 1).setOrigin(0));
    add(this.scene.add.text(0, PY + 19, 'CRAFTING TABLE', {
      fontFamily: 'monospace', fontSize: '15px', color: TEXT.LIGHT,
    }).setOrigin(0.5));

    // Close button (top-right)
    const closeBtn = add(this.scene.add.text(PX + PW - 6, PY + 6, '✕', {
      fontFamily: 'monospace', fontSize: '18px', color: '#888888',
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true })) as Phaser.GameObjects.Text;
    closeBtn.on('pointerover',  () => closeBtn.setColor('#ffffff'));
    closeBtn.on('pointerout',   () => closeBtn.setColor('#888888'));
    closeBtn.on('pointerdown',  () => this.close());

    // Dividers
    const divG = add(this.scene.add.graphics()) as Phaser.GameObjects.Graphics;
    divG.lineStyle(1, BORDER.DIM, 1);
    divG.lineBetween(PX,    PY + 64, PX + PW, PY + 64);
    divG.lineBetween(DIV_X, PY + 38, DIV_X,   PY + PH);

    // Section headers
    add(this.scene.add.text(PX + LIST_W / 2, PY + 51, 'RECIPES', {
      fontFamily: 'monospace', fontSize: '10px', color: TEXT.DIM,
    }).setOrigin(0.5));
    add(this.scene.add.text(DIV_X + RIGHT_W / 2, PY + 51, 'CRAFTING GRID', {
      fontFamily: 'monospace', fontSize: '10px', color: TEXT.DIM,
    }).setOrigin(0.5));

    // ── Recipe list (left) ─────────────────────────────────────────────────
    const ROW_H  = 50;
    const ROW_Y0 = PY + 68;

    this.recipes.forEach((recipe, i) => {
      const ry  = ROW_Y0 + i * ROW_H;
      const rx  = PX + 4;
      const rowW = LIST_W - 8;

      const rowBg = add(
        this.scene.add.rectangle(rx, ry, rowW, ROW_H - 4, BG.ROW, 1)
          .setOrigin(0).setInteractive({ useHandCursor: true }),
      ) as Phaser.GameObjects.Rectangle;

      rowBg.on('pointerover', () => {
        if (this.selectedIdx !== i) rowBg.setFillStyle(BG.HOVER, 1);
      });
      rowBg.on('pointerout', () => {
        rowBg.setFillStyle(this.selectedIdx === i ? BG.SELECTED : BG.ROW, 1);
      });
      rowBg.on('pointerdown', () => { this.selectRecipe(i); });
      this.listRowBgs.push(rowBg);

      const iconG = add(this.scene.add.graphics()) as Phaser.GameObjects.Graphics;
      drawIcon(iconG, rx + 22, ry + (ROW_H - 4) / 2, recipe.output, 0.42);

      const nameText = add(this.scene.add.text(rx + 46, ry + 8, recipe.name, {
        fontFamily: 'monospace', fontSize: '12px', color: TEXT.LIGHT,
      })) as Phaser.GameObjects.Text;

      const costStr  = recipe.cost.map(c => `${c.amount}× ${c.key}`).join('  ');
      const costText = add(this.scene.add.text(rx + 46, ry + 24, costStr, {
        fontFamily: 'monospace', fontSize: '9px', color: TEXT.MID,
      })) as Phaser.GameObjects.Text;

      this.listRows.push({ bg: rowBg, iconG, nameText, costText });
    });

    // ── 3×3 Crafting grid (right) ──────────────────────────────────────────
    const cellBgG = add(this.scene.add.graphics()) as Phaser.GameObjects.Graphics;
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const cx = this.gridX + col * (CELL + GAP);
        const cy = this.gridY + row * (CELL + GAP);
        cellBgG.fillStyle(BG.PANEL, 1);
        cellBgG.fillRect(cx, cy, CELL, CELL);
        cellBgG.lineStyle(1, BORDER.MID, 1);
        cellBgG.strokeRect(cx, cy, CELL, CELL);
      }
    }

    for (let c = 0; c < 9; c++) {
      this.gridIconGs.push(add(this.scene.add.graphics()) as Phaser.GameObjects.Graphics);
    }

    // Arrow
    add(this.scene.add.text(arrowX, arrowMidY, '→', {
      fontFamily: 'monospace', fontSize: '24px', color: TEXT.DIM,
    }).setOrigin(0, 0.5));

    // Output slot
    const outBgG = add(this.scene.add.graphics()) as Phaser.GameObjects.Graphics;
    outBgG.fillStyle(BG.PANEL, 1);
    outBgG.fillRect(outX, arrowMidY - outSize / 2, outSize, outSize);
    outBgG.lineStyle(2, BORDER.LIGHT, 1);
    outBgG.strokeRect(outX, arrowMidY - outSize / 2, outSize, outSize);

    this.outputIconG = add(this.scene.add.graphics()) as Phaser.GameObjects.Graphics;

    // ── Craft button ───────────────────────────────────────────────────────
    const BTN_W = 130, BTN_H = 36;
    const contentCX = this.gridX + USED_W / 2;
    const btnY      = this.gridY + 3 * CELL + 2 * GAP + 22;

    this.craftBtn = add(
      this.scene.add.rectangle(contentCX, btnY, BTN_W, BTN_H, BG.BTN, 1)
        .setOrigin(0.5, 0).setInteractive({ useHandCursor: true }),
    ) as Phaser.GameObjects.Rectangle;

    this.craftBtn.on('pointerover', () => {
      if (this.canCraftSelected()) this.craftBtn.setFillStyle(BG.BTN_OVER, 1);
    });
    this.craftBtn.on('pointerout',  () => { this.refreshCraftBtn(); });
    this.craftBtn.on('pointerdown', () => { this.doCraft(); });

    this.craftBtnLbl = add(this.scene.add.text(contentCX, btnY + BTN_H / 2, 'CRAFT', {
      fontFamily: 'monospace', fontSize: '14px', color: TEXT.MID,
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5)) as Phaser.GameObjects.Text;

    this.statusText = add(this.scene.add.text(contentCX, btnY + BTN_H + 8, '', {
      fontFamily: 'monospace', fontSize: '10px', color: '#ff7744',
    }).setOrigin(0.5, 0)) as Phaser.GameObjects.Text;

    // Close hint
    add(this.scene.add.text(0, PY + PH - 10, '[ESC] / ✕ to close', {
      fontFamily: 'monospace', fontSize: '10px', color: TEXT.FAINT,
    }).setOrigin(0.5, 1));

    this.escKey = this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
  }

  // ── Selection ─────────────────────────────────────────────────────────────

  private selectRecipe(idx: number): void {
    this.selectedIdx = idx;

    this.listRowBgs.forEach((bg, i) => {
      bg.setFillStyle(i === idx ? 0x1e3020 : BG.ROW, 1);
    });

    const cells: Array<keyof Inventory | null> = Array(9).fill(null);
    let slot = 0;
    for (const { key, amount } of this.recipes[idx].cost) {
      for (let a = 0; a < amount && slot < 9; a++, slot++) {
        cells[slot] = key;
      }
    }

    const CELL = this.CELL, GAP = this.GAP;
    for (let c = 0; c < 9; c++) {
      this.gridIconGs[c].clear();
      if (cells[c]) {
        const col = c % 3, row = Math.floor(c / 3);
        const cx = this.gridX + col * (CELL + GAP) + CELL / 2;
        const cy = this.gridY + row * (CELL + GAP) + CELL / 2;
        drawIcon(this.gridIconGs[c], cx, cy, cells[c]!, 0.52);
      }
    }

    this.outputIconG.clear();
    drawIcon(this.outputIconG, this.outCX, this.outCY, this.recipes[idx].output, 0.65);

    this.refreshCraftBtn();
  }

  // ── Crafting ──────────────────────────────────────────────────────────────

  private canCraft(i: number): boolean {
    const recipe = this.recipes[i];
    const condOk = recipe.condition ? recipe.condition() : true;
    const inv    = this.resources.getAll();
    return condOk && recipe.cost.every(({ key, amount }) => inv[key] >= amount);
  }

  private refreshList(): void {
    this.listRows.forEach((row, i) => {
      const available = this.canCraft(i);
      const selected  = this.selectedIdx === i;

      row.bg.setFillStyle(selected ? BG.SELECTED : available ? BG.ROW : BG.SLOT, 1);
      row.iconG.setAlpha(available ? 1 : 0.3);
      row.nameText.setColor(available ? TEXT.LIGHT : TEXT.DISABLED);
      row.costText.setColor(available ? TEXT.MID : TEXT.FAINT);
    });
  }

  private canCraftSelected(): boolean {
    return this.selectedIdx !== null && this.canCraft(this.selectedIdx);
  }

  private refreshCraftBtn(): void {
    if (this.selectedIdx === null) {
      this.craftBtn.setFillStyle(BG.BTN, 1);
      this.craftBtnLbl.setColor(TEXT.MID);
      this.statusText.setText('← Select a recipe');
      return;
    }
    const recipe = this.recipes[this.selectedIdx];
    const condOk = recipe.condition ? recipe.condition() : true;
    const inv    = this.resources.getAll();
    const afford = recipe.cost.every(({ key, amount }) => inv[key] >= amount);

    if (!condOk) {
      this.craftBtn.setFillStyle(BG.BTN, 1);
      this.craftBtnLbl.setColor(TEXT.MID);
      this.statusText.setText(recipe.conditionHint ?? '');
    } else if (!afford) {
      this.craftBtn.setFillStyle(0x3d1818, 1);
      this.craftBtnLbl.setColor('#ff6666');
      this.statusText.setText('Not enough resources');
    } else {
      this.craftBtn.setFillStyle(BG.BTN_ON, 1);
      this.craftBtnLbl.setColor('#ffffff');
      this.statusText.setText('');
    }
  }

  private doCraft(): void {
    if (!this.canCraftSelected()) return;
    const recipe = this.recipes[this.selectedIdx!];
    recipe.cost.forEach(({ key, amount }) => this.resources.subtract(key, amount));
    this.resources.add(recipe.output, 1);
    this.refreshCraftBtn();
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  toggle(): void { this._open ? this.close() : this.open(); }

  open(): void {
    this._open = true;
    this.setAllVisible(true);
    this.selectedIdx = null;
    this.listRowBgs.forEach(bg => bg.setFillStyle(BG.ROW, 1));
    this.refreshList();
    this.gridIconGs.forEach(g => g.clear());
    this.outputIconG.clear();
    this.refreshCraftBtn();
  }

  close(): void {
    this._open = false;
    this.setAllVisible(false);
  }

  update(): void {
    if (!this._open) return;
    if (Phaser.Input.Keyboard.JustDown(this.escKey)) { this.close(); return; }
    this.refreshList();
    this.refreshCraftBtn();
  }

  private setAllVisible(v: boolean): void {
    this.objects.forEach(o =>
      (o as Phaser.GameObjects.GameObject & { setVisible(b: boolean): unknown }).setVisible(v),
    );
  }
}
