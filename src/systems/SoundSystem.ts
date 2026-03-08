import Phaser from 'phaser';
import { AnimalType } from '../entities/Animal';

/**
 * Synthesises all game audio via Web Audio API — no external asset files needed.
 * Obtain the AudioContext from Phaser's WebAudioSoundManager so we share the
 * same context (avoids browser limits on concurrent AudioContexts).
 */
export class SoundSystem {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const sm = scene.sound;
    if (sm instanceof Phaser.Sound.WebAudioSoundManager) {
      this.ctx    = sm.context;
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.55;
      this.master.connect(this.ctx.destination);
    }
  }

  private get now(): number { return this.ctx?.currentTime ?? 0; }

  // ── Public API ────────────────────────────────────────────────────────────

  playAnimalAmbient(type: AnimalType, volume = 0.5): void {
    if (!this.ctx || !this.master) return;
    switch (type) {
      case AnimalType.DEER:   this.deerGrunt(volume);   break;
      case AnimalType.RABBIT: this.rabbitSqueak(volume); break;
      case AnimalType.PIG:    this.pigOink(volume);      break;
      case AnimalType.WOLF:   this.wolfGrowl(volume);    break;
    }
  }

  /** Dog bark pattern — two quick "woof" barks. */
  playWolfHowl(volume = 0.6): void {
    if (!this.ctx || !this.master) return;
    this.dogBark(volume, 0);
    this.dogBark(volume * 0.75, 0.32);
  }

  private dogBark(vol: number, delay: number): void {
    const ctx = this.ctx!; const t = this.now + delay;

    // Sawtooth carrier dropped through a vocal bandpass — "woof" character
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(230, t);
    osc.frequency.exponentialRampToValueAtTime(105, t + 0.17);

    const filt = ctx.createBiquadFilter();
    filt.type = 'bandpass';
    filt.frequency.value = 520;
    filt.Q.value = 2.2;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol * 0.55, t + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(filt); filt.connect(gain); gain.connect(this.master!);
    osc.start(t); osc.stop(t + 0.24);
  }

  playWolfBite(volume = 0.65): void {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx; const t = this.now;

    // Short sharp snarl — sawtooth drop through a lowpass
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.18);

    const filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = 600;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(filt); filt.connect(gain); gain.connect(this.master);
    osc.start(t); osc.stop(t + 0.25);
  }

  playKill(volume = 0.5): void {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx; const t = this.now;
    const sr  = ctx.sampleRate;
    const dur = 0.18;

    // Percussive noise burst — sounds like a thwack
    const buf  = ctx.createBuffer(1, Math.floor(sr * dur), sr);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const k = i / sr;
      data[i] = (Math.random() * 2 - 1) * Math.exp(-k * 28) * volume;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(this.master);
    src.start(t);
  }

  // ── Private synthesis helpers ─────────────────────────────────────────────

  private deerGrunt(vol: number): void {
    const ctx = this.ctx!; const t = this.now; const sr = ctx.sampleRate;

    // Filtered noise with a soft bandpass — a muffled "huff"
    const dur  = 0.28;
    const buf  = ctx.createBuffer(1, Math.floor(sr * dur), sr);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const k = i / sr;
      data[i] = (Math.random() * 2 - 1) * Math.exp(-k * 7);
    }
    const src  = ctx.createBufferSource();
    src.buffer = buf;

    const filt = ctx.createBiquadFilter();
    filt.type = 'bandpass';
    filt.frequency.value = 280;
    filt.Q.value = 2.5;

    const gain = ctx.createGain();
    gain.gain.value = vol * 0.55;

    src.connect(filt); filt.connect(gain); gain.connect(this.master!);
    src.start(t);
  }

  private rabbitSqueak(vol: number): void {
    const ctx = this.ctx!; const t = this.now;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1500, t);
    osc.frequency.exponentialRampToValueAtTime(950, t + 0.07);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol * 0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain); gain.connect(this.master!);
    osc.start(t); osc.stop(t + 0.11);
  }

  private pigOink(vol: number): void {
    const ctx = this.ctx!; const t = this.now;

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(210, t);
    osc.frequency.linearRampToValueAtTime(155, t + 0.13);
    osc.frequency.linearRampToValueAtTime(175, t + 0.24);

    const filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = 750;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol * 0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.30);

    osc.connect(filt); filt.connect(gain); gain.connect(this.master!);
    osc.start(t); osc.stop(t + 0.32);
  }

  /** Low dog growl — used as the wolf's ambient sound. */
  private wolfGrowl(vol: number): void {
    const ctx = this.ctx!; const t = this.now;

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(95, t);

    // Tremolo LFO gives the rumbling growl texture
    const lfo     = ctx.createOscillator();
    lfo.frequency.value = 14;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 9;
    lfo.connect(lfoGain); lfoGain.connect(osc.frequency);

    const filt = ctx.createBiquadFilter();
    filt.type = 'bandpass';
    filt.frequency.value = 320;
    filt.Q.value = 2.5;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol * 0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);

    osc.connect(filt); filt.connect(gain); gain.connect(this.master!);
    osc.start(t); lfo.start(t);
    osc.stop(t + 0.58); lfo.stop(t + 0.58);
  }
}
