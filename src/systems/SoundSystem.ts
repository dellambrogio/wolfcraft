import Phaser from 'phaser';
import { AnimalType } from '../entities/Animal';

/**
 * Synthesises all game audio via Web Audio API — no external asset files needed.
 */
export class SoundSystem {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;

  constructor(scene: Phaser.Scene) {
    const sm = scene.sound;
    if (sm instanceof Phaser.Sound.WebAudioSoundManager) {
      this.ctx    = sm.context;
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
    }
  }

  private get now(): number { return this.ctx?.currentTime ?? 0; }

  /** White-noise buffer source. */
  private noise(dur: number): AudioBufferSourceNode {
    const ctx = this.ctx!;
    const sr  = ctx.sampleRate;
    const buf = ctx.createBuffer(1, Math.ceil(sr * dur), sr);
    const d   = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    return src;
  }

  // ── Public API ────────────────────────────────────────────────────────────

  playAnimalAmbient(type: AnimalType, volume = 0.5): void {
    if (!this.ctx || !this.master) return;
    switch (type) {
      case AnimalType.DEER:   this.deerBleat(volume);    break;
      case AnimalType.RABBIT: this.rabbitChirp(volume);  break;
      case AnimalType.PIG:    this.pigGrunt(volume);     break;
      case AnimalType.WOLF:   this.wolfRumble(volume);   break;
    }
  }

  playWolfHowl(volume = 0.6): void {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx; const t = this.now;

    // Single sine, rises then falls — clean and eerie
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(220, t);
    o.frequency.exponentialRampToValueAtTime(580, t + 0.5);
    o.frequency.exponentialRampToValueAtTime(440, t + 1.0);
    o.frequency.exponentialRampToValueAtTime(300, t + 1.8);

    // Slow vibrato (3 Hz — not fart range)
    const vib = ctx.createOscillator();
    vib.frequency.value = 3;
    const vg = ctx.createGain();
    vg.gain.value = 6;
    vib.connect(vg); vg.connect(o.frequency);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(volume * 0.6, t + 0.15);
    g.gain.setValueAtTime(volume * 0.6, t + 1.3);
    g.gain.exponentialRampToValueAtTime(0.001, t + 2.0);

    o.connect(g); g.connect(this.master);
    o.start(t); vib.start(t);
    o.stop(t + 2.1); vib.stop(t + 2.1);
  }

  playWolfBite(volume = 0.55): void {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx; const t = this.now;

    // Noise snap — short, sharp
    const nb = this.noise(0.08);
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 1200;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(volume, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
    nb.connect(hp); hp.connect(ng); ng.connect(this.master);
    nb.start(t); nb.stop(t + 0.09);

    // Low thud underneath
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(140, t);
    o.frequency.exponentialRampToValueAtTime(50, t + 0.15);
    const og = ctx.createGain();
    og.gain.setValueAtTime(volume * 0.8, t);
    og.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    o.connect(og); og.connect(this.master);
    o.start(t); o.stop(t + 0.2);
  }

  /** Punchy percussive hit. */
  playKill(volume = 0.5): void {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx; const t = this.now;

    // Tonal thud: sine pitch-drops fast
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(180, t);
    o.frequency.exponentialRampToValueAtTime(35, t + 0.14);
    const og = ctx.createGain();
    og.gain.setValueAtTime(volume * 0.9, t);
    og.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    o.connect(og); og.connect(this.master);
    o.start(t); o.stop(t + 0.2);

    // High crack on top
    const nb = this.noise(0.035);
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 3000;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(volume * 0.55, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.035);
    nb.connect(hp); hp.connect(ng); ng.connect(this.master);
    nb.start(t); nb.stop(t + 0.04);
  }

  // ── Private synthesis helpers ─────────────────────────────────────────────

  /** Deer — soft nasal bleat. */
  private deerBleat(vol: number): void {
    const ctx = this.ctx!; const t = this.now;

    // Triangle wave (much softer than sawtooth) through a gentle bandpass
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(320, t);
    o.frequency.linearRampToValueAtTime(280, t + 0.12);
    o.frequency.linearRampToValueAtTime(340, t + 0.22);
    o.frequency.linearRampToValueAtTime(295, t + 0.34);

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 600; bp.Q.value = 1.2;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol * 0.5, t + 0.04);
    g.gain.setValueAtTime(vol * 0.5, t + 0.24);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.38);

    o.connect(bp); bp.connect(g); g.connect(this.master!);
    o.start(t); o.stop(t + 0.4);
  }

  /** Rabbit — quick high chirp. */
  private rabbitChirp(vol: number): void {
    const ctx = this.ctx!; const t = this.now;

    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(2400, t);
    o.frequency.exponentialRampToValueAtTime(1600, t + 0.06);

    const g = ctx.createGain();
    g.gain.setValueAtTime(vol * 0.35, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    o.connect(g); g.connect(this.master!);
    o.start(t); o.stop(t + 0.1);
  }

  /** Pig — nasal double-oink. */
  /** Pig — randomly picks breathy oink or punchy grunt. */
  private pigGrunt(vol: number): void {
    if (Math.random() < 0.5) this.pigOink(vol);
    else                      this.pigShortGrunt(vol);
  }

  /**
   * Slow breathy oink (based on oink-47167 spectral analysis):
   * sawtooth ~120 Hz, 67% of energy in 2000–3500 Hz formant cluster,
   * slow 200ms attack, pitch drops to 65 Hz at end.
   */
  private pigOink(vol: number): void {
    const ctx = this.ctx!; const t = this.now;

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.setValueAtTime(120, t + 0.55);
    osc.frequency.exponentialRampToValueAtTime(65, t + 0.75);

    // Dominant formant cluster: 2500 Hz tight bandpass
    const f1 = ctx.createBiquadFilter();
    f1.type = 'bandpass'; f1.frequency.value = 2500; f1.Q.value = 8;

    // Secondary formant: 1750 Hz
    const f2 = ctx.createBiquadFilter();
    f2.type = 'bandpass'; f2.frequency.value = 1750; f2.Q.value = 5;

    const fmix = ctx.createGain(); fmix.gain.value = 0.5;

    const env = ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(vol * 0.75, t + 0.20);
    env.gain.setValueAtTime(vol * 0.70, t + 0.45);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.80);

    osc.connect(f1); f1.connect(fmix);
    osc.connect(f2); f2.connect(fmix);
    fmix.connect(env); env.connect(this.master!);
    osc.start(t); osc.stop(t + 0.82);

    // Noise burst at 2300 Hz — oink transient texture (40% mix)
    const nb = this.noise(0.15);
    const nf = ctx.createBiquadFilter();
    nf.type = 'bandpass'; nf.frequency.value = 2300; nf.Q.value = 2;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(vol * 0.3, t + 0.05);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.20);
    nb.connect(nf); nf.connect(ng); ng.connect(this.master!);
    nb.start(t + 0.05); nb.stop(t + 0.22);
  }

  /**
   * Punchy short grunt (based on pig-sound-47168 spectral analysis):
   * fast 46ms attack, pitch drops 130→70 Hz in first 150ms,
   * formant sweeps 2800→3900 Hz, sub-bass rumble tail at 60 Hz.
   */
  private pigShortGrunt(vol: number): void {
    const ctx = this.ctx!; const t = this.now;

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(130, t);
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.15);

    // Sweeping formant: 2800→3900 Hz over 500ms
    const f1 = ctx.createBiquadFilter();
    f1.type = 'bandpass'; f1.Q.value = 5;
    f1.frequency.setValueAtTime(2800, t);
    f1.frequency.linearRampToValueAtTime(3900, t + 0.50);

    const f2 = ctx.createBiquadFilter();
    f2.type = 'bandpass'; f2.frequency.value = 3200; f2.Q.value = 4;

    const fmix = ctx.createGain(); fmix.gain.value = 0.5;

    const env = ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(vol * 0.8, t + 0.04);
    env.gain.exponentialRampToValueAtTime(vol * 0.28, t + 0.14);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.68);

    osc.connect(f1); f1.connect(fmix);
    osc.connect(f2); f2.connect(fmix);
    fmix.connect(env); env.connect(this.master!);
    osc.start(t); osc.stop(t + 0.70);

    // Sub-bass rumble tail: 60 Hz sine, fades in after 200ms
    const sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.value = 60;
    const sg = ctx.createGain();
    sg.gain.setValueAtTime(0, t + 0.20);
    sg.gain.linearRampToValueAtTime(vol * 0.35, t + 0.30);
    sg.gain.exponentialRampToValueAtTime(0.001, t + 0.68);
    sub.connect(sg); sg.connect(this.master!);
    sub.start(t + 0.20); sub.stop(t + 0.70);

    // Noise burst at 3000 Hz (25% mix)
    const nb = this.noise(0.07);
    const nf = ctx.createBiquadFilter();
    nf.type = 'bandpass'; nf.frequency.value = 3000; nf.Q.value = 2;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(vol * 0.25, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
    nb.connect(nf); nf.connect(ng); ng.connect(this.master!);
    nb.start(t); nb.stop(t + 0.08);
  }

  /** Wolf ambient — low noise rumble (no oscillators, no fart risk). */
  private wolfRumble(vol: number): void {
    const ctx = this.ctx!; const t = this.now;

    const nb = this.noise(0.5);

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 220;

    const lp2 = ctx.createBiquadFilter();
    lp2.type = 'lowpass'; lp2.frequency.value = 180;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol * 0.7, t + 0.06);
    g.gain.setValueAtTime(vol * 0.7, t + 0.3);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.55);

    nb.connect(lp); lp.connect(lp2); lp2.connect(g); g.connect(this.master!);
    nb.start(t); nb.stop(t + 0.58);
  }
}
