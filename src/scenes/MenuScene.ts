import Phaser from 'phaser';
import { NOISE_SEED } from '../constants';
import { BG, BORDER, TEXT } from '../ui/palette';
import {
  GameSettings,
  DayNightRatio,
  DaySpeed,
  DEFAULT_SETTINGS,
  DAY_SPEED_LABELS,
} from '../GameSettings';

const DAY_RATIOS:  DayNightRatio[] = ['3:1', '2:1', '1:1', '1:2', '1:3'];
const DAY_SPEEDS:  DaySpeed[]      = ['fast', 'normal', 'slow', 'crawl'];

export class MenuScene extends Phaser.Scene {
  private currentSeed = NOISE_SEED;
  private settings: GameSettings = { ...DEFAULT_SETTINGS };

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    this.drawAtmosphere(width, height);

    // ── Title ─────────────────────────────────────────────────────────────
    this.add.text(cx + 3, cy - 200 + 3, 'WOLFCRAFT', {
      fontFamily: 'serif', fontSize: '64px', color: '#000000',
    }).setOrigin(0.5).setAlpha(0.6);

    this.add.text(cx, cy - 200, 'WOLFCRAFT', {
      fontFamily: 'serif', fontSize: '64px',
      color: TEXT.WHITE, stroke: '#000000', strokeThickness: 8,
    }).setOrigin(0.5);

    this.add.text(cx, cy - 132, 'Survive the Night', {
      fontFamily: 'monospace', fontSize: '16px',
      color: TEXT.MID, stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5);

    // ── Seed row ──────────────────────────────────────────────────────────
    const seedY = cy - 78;

    this.add.text(cx - 110, seedY, 'SEED', {
      fontFamily: 'monospace', fontSize: '12px', color: TEXT.DIM,
    }).setOrigin(0, 0.5);

    const seedText = this.add.text(cx - 62, seedY, this.formatSeed(this.currentSeed), {
      fontFamily: 'monospace', fontSize: '14px', color: TEXT.LABEL,
    }).setOrigin(0, 0.5);

    const rndBtn = this.add.rectangle(cx + 72, seedY, 110, 26, BG.BTN)
      .setInteractive({ useHandCursor: true });
    this.add.text(cx + 72, seedY, '↻ RANDOMISE', {
      fontFamily: 'monospace', fontSize: '11px', color: TEXT.LIGHT,
    }).setOrigin(0.5);

    rndBtn.on('pointerover',  () => rndBtn.setFillStyle(BG.BTN_OVER));
    rndBtn.on('pointerout',   () => rndBtn.setFillStyle(BG.BTN));
    rndBtn.on('pointerdown',  () => {
      this.currentSeed = Phaser.Math.Between(1, 999999);
      seedText.setText(this.formatSeed(this.currentSeed));
    });

    // ── Settings divider ──────────────────────────────────────────────────
    const divY = cy - 48;
    const g = this.add.graphics();
    g.lineStyle(1, BORDER.DIM, 0.8);
    g.lineBetween(cx - 120, divY, cx + 120, divY);
    this.add.text(cx, divY, ' SETTINGS ', {
      fontFamily: 'monospace', fontSize: '10px', color: TEXT.DIM,
      backgroundColor: '#000000',
    }).setOrigin(0.5);

    // ── Settings rows ─────────────────────────────────────────────────────
    this.addCycleRow(
      cy - 22,
      'DAY / NIGHT',
      DAY_RATIOS,
      DAY_RATIOS.indexOf(this.settings.dayNightRatio),
      (i) => { this.settings.dayNightRatio = DAY_RATIOS[i]; },
    );

    this.addCycleRow(
      cy + 10,
      'SPEED (real/hr)',
      DAY_SPEEDS.map(s => DAY_SPEED_LABELS[s]),
      DAY_SPEEDS.indexOf(this.settings.daySpeed),
      (i) => { this.settings.daySpeed = DAY_SPEEDS[i]; },
    );

    this.addToggleRow(
      cy + 42,
      'WOLVES',
      this.settings.wolvesEnabled,
      (v) => { this.settings.wolvesEnabled = v; },
    );

    this.addToggleRow(
      cy + 74,
      'STARTER KIT',
      this.settings.starterKit,
      (v) => { this.settings.starterKit = v; },
    );

    // ── Start button ──────────────────────────────────────────────────────
    const btn = this.add.rectangle(cx, cy + 140, 220, 52, BG.BTN)
      .setInteractive({ useHandCursor: true });
    this.add.text(cx, cy + 140, 'ENTER THE WILD', {
      fontFamily: 'monospace', fontSize: '20px',
      color: TEXT.WHITE, stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5);

    btn.on('pointerover',  () => btn.setFillStyle(BG.BTN_OVER));
    btn.on('pointerout',   () => btn.setFillStyle(BG.BTN));
    btn.on('pointerdown',  () => {
      this.cameras.main.fadeOut(600, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('GameScene', { seed: this.currentSeed, settings: this.settings });
      });
    });
  }

  /**
   * Setting row that cycles through a list of string options on click.
   * `values` are display strings; index maps back to the caller's option array.
   */
  private addCycleRow(
    y: number,
    label: string,
    values: string[],
    initialIndex: number,
    onChange: (index: number) => void,
  ): void {
    const cx = this.scale.width / 2;
    let idx = initialIndex;

    this.add.text(cx - 110, y, label, {
      fontFamily: 'monospace', fontSize: '11px', color: TEXT.DIM,
    }).setOrigin(0, 0.5);

    const btn = this.add.rectangle(cx + 72, y, 110, 24, BG.BTN)
      .setInteractive({ useHandCursor: true });
    const val = this.add.text(cx + 72, y, values[idx], {
      fontFamily: 'monospace', fontSize: '11px', color: TEXT.LABEL,
    }).setOrigin(0.5);

    btn.on('pointerover',  () => btn.setFillStyle(BG.BTN_OVER));
    btn.on('pointerout',   () => btn.setFillStyle(BG.BTN));
    btn.on('pointerdown',  () => {
      idx = (idx + 1) % values.length;
      val.setText(values[idx]);
      onChange(idx);
    });
  }

  /**
   * Setting row that toggles between ON and OFF on click.
   */
  private addToggleRow(
    y: number,
    label: string,
    initial: boolean,
    onChange: (value: boolean) => void,
  ): void {
    const cx = this.scale.width / 2;
    let current = initial;

    this.add.text(cx - 110, y, label, {
      fontFamily: 'monospace', fontSize: '11px', color: TEXT.DIM,
    }).setOrigin(0, 0.5);

    const btn = this.add.rectangle(cx + 72, y, 110, 24, BG.BTN)
      .setInteractive({ useHandCursor: true });
    const val = this.add.text(cx + 72, y, current ? 'ON' : 'OFF', {
      fontFamily: 'monospace', fontSize: '11px',
      color: current ? '#88ff88' : TEXT.DIM,
    }).setOrigin(0.5);

    const refresh = () => {
      val.setText(current ? 'ON' : 'OFF');
      val.setColor(current ? '#88ff88' : TEXT.DIM);
    };

    btn.on('pointerover',  () => btn.setFillStyle(BG.BTN_OVER));
    btn.on('pointerout',   () => btn.setFillStyle(BG.BTN));
    btn.on('pointerdown',  () => {
      current = !current;
      refresh();
      onChange(current);
    });
  }

  /** Paint the atmospheric wolf scene onto a canvas texture. */
  private drawAtmosphere(width: number, height: number): void {
    const canvas = document.createElement('canvas');
    canvas.width  = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // ── Sky ───────────────────────────────────────────────────────────────
    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0,    '#000000');
    sky.addColorStop(0.55, '#0a0005');
    sky.addColorStop(1,    '#1c0008');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    // ── Stars ─────────────────────────────────────────────────────────────
    const rng = (n: number) => Math.sin(n * 127.1 + 311.7) * 0.5 + 0.5;
    for (let i = 0; i < 180; i++) {
      const sx = rng(i * 3)     * width;
      const sy = rng(i * 3 + 1) * height * 0.65;
      const sr = rng(i * 3 + 2) * 1.2 + 0.3;
      const sa = rng(i * 3 + 4) * 0.5 + 0.2;
      ctx.fillStyle = `rgba(255,200,200,${sa.toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }

    // ── Blood moon ────────────────────────────────────────────────────────
    const moonX = width  * 0.62;
    const moonY = height * 0.25;
    const moonR = 72;

    const outerGlow = ctx.createRadialGradient(moonX, moonY, moonR * 0.6, moonX, moonY, moonR * 2.8);
    outerGlow.addColorStop(0,   'rgba(180, 0, 0, 0.22)');
    outerGlow.addColorStop(0.4, 'rgba(120, 0, 0, 0.10)');
    outerGlow.addColorStop(1,   'rgba(0,  0, 0, 0)');
    ctx.fillStyle = outerGlow;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR * 2.8, 0, Math.PI * 2);
    ctx.fill();

    const moonDisc = ctx.createRadialGradient(moonX - moonR * 0.2, moonY - moonR * 0.2, 0, moonX, moonY, moonR);
    moonDisc.addColorStop(0,   '#ff6644');
    moonDisc.addColorStop(0.4, '#cc2200');
    moonDisc.addColorStop(0.8, '#880000');
    moonDisc.addColorStop(1,   '#440000');
    ctx.fillStyle = moonDisc;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    for (const [ox, oy, or_] of [[-22, 10, 10], [18, -20, 7], [30, 18, 5], [-8, -28, 6]] as [number,number,number][]) {
      ctx.beginPath();
      ctx.arc(moonX + ox, moonY + oy, or_, 0, Math.PI * 2);
      ctx.fill();
    }

    // ── Wolf head silhouette ───────────────────────────────────────────────
    const wX = width  * 0.38;
    const wY = height * 0.56;
    const wS = 105;

    const wolfGlow = ctx.createRadialGradient(wX, wY, 0, wX, wY, wS * 1.6);
    wolfGlow.addColorStop(0,   'rgba(120, 0, 0, 0.18)');
    wolfGlow.addColorStop(1,   'rgba(0,   0, 0, 0)');
    ctx.fillStyle = wolfGlow;
    ctx.beginPath();
    ctx.arc(wX, wY, wS * 1.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#060606';

    ctx.beginPath();
    ctx.moveTo(wX - wS * 0.30, wY - wS * 0.32);
    ctx.lineTo(wX - wS * 0.52, wY - wS * 0.90);
    ctx.lineTo(wX - wS * 0.05, wY - wS * 0.50);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(wX + wS * 0.30, wY - wS * 0.32);
    ctx.lineTo(wX + wS * 0.52, wY - wS * 0.90);
    ctx.lineTo(wX + wS * 0.05, wY - wS * 0.50);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(wX, wY, wS * 0.52, wS * 0.46, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(wX - wS * 0.60, wY + wS * 0.50);
    ctx.bezierCurveTo(wX - wS * 0.50, wY + wS * 0.08, wX - wS * 0.28, wY + wS * 0.04, wX - wS * 0.22, wY + wS * 0.38);
    ctx.lineTo(wX + wS * 0.22, wY + wS * 0.38);
    ctx.bezierCurveTo(wX + wS * 0.28, wY + wS * 0.04, wX + wS * 0.50, wY + wS * 0.08, wX + wS * 0.60, wY + wS * 0.50);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(wX - wS * 0.24, wY + wS * 0.12);
    ctx.quadraticCurveTo(wX - wS * 0.28, wY + wS * 0.38, wX, wY + wS * 0.42);
    ctx.quadraticCurveTo(wX + wS * 0.28, wY + wS * 0.38, wX + wS * 0.24, wY + wS * 0.12);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur  = 22;
    ctx.shadowColor = '#ff2200';
    ctx.fillStyle   = '#ff2200';
    ctx.beginPath();
    ctx.ellipse(wX - wS * 0.17, wY - wS * 0.06, wS * 0.09, wS * 0.065, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(wX + wS * 0.17, wY - wS * 0.06, wS * 0.09, wS * 0.065,  0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // ── Tree silhouettes ─────────────────────────────────────────────────
    ctx.fillStyle = '#050202';
    const tree = (x: number, h: number, w: number) => {
      ctx.beginPath();
      ctx.moveTo(x, height - h);
      ctx.lineTo(x - w / 2, height);
      ctx.lineTo(x + w / 2, height);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x, height - h * 0.55);
      ctx.lineTo(x - w * 0.65, height - h * 0.05);
      ctx.lineTo(x + w * 0.65, height - h * 0.05);
      ctx.closePath();
      ctx.fill();
    };

    tree(width * 0.03,  190, 75);
    tree(width * 0.10,  240, 90);
    tree(width * 0.17,  175, 68);
    tree(width * 0.24,  215, 85);
    tree(width * 0.30,  155, 60);
    tree(width * 0.70,  160, 62);
    tree(width * 0.76,  220, 88);
    tree(width * 0.83,  180, 70);
    tree(width * 0.90,  235, 92);
    tree(width * 0.97,  195, 76);

    // ── Ground mist ───────────────────────────────────────────────────────
    const mist = ctx.createLinearGradient(0, height * 0.72, 0, height);
    mist.addColorStop(0, 'rgba(60, 0, 0, 0)');
    mist.addColorStop(1, 'rgba(40, 0, 0, 0.55)');
    ctx.fillStyle = mist;
    ctx.fillRect(0, height * 0.72, width, height * 0.28);

    if (this.textures.exists('menu_bg')) this.textures.remove('menu_bg');
    this.textures.addCanvas('menu_bg', canvas);
    this.add.image(0, 0, 'menu_bg').setOrigin(0, 0);
  }

  private formatSeed(seed: number): string {
    return seed.toString().padStart(6, '0');
  }
}
