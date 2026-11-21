/**
 * Developer playground — animal configs + sound tester.
 * No Phaser dependency; runs as a standalone page at /dev.html
 */

// ── Audio context ─────────────────────────────────────────────────────────────

const ctx = new AudioContext();
const master = ctx.createGain();
master.gain.value = 0.6;
master.connect(ctx.destination);

const volSlider  = document.getElementById('vol-slider')  as HTMLInputElement;
const volDisplay = document.getElementById('vol-display') as HTMLSpanElement;
volSlider.addEventListener('input', () => {
  const v = Number(volSlider.value) / 100;
  master.gain.value = v;
  volDisplay.textContent = `${volSlider.value}%`;
});

function resume() { if (ctx.state === 'suspended') ctx.resume(); }

// ── Synthesis helpers (mirrors SoundSystem.ts) ────────────────────────────────

function makeNoise(dur: number): AudioBufferSourceNode {
  const sr  = ctx.sampleRate;
  const buf = ctx.createBuffer(1, Math.ceil(sr * dur), sr);
  const d   = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  return src;
}

function playDeerBleat(vol = 0.6) {
  const t = ctx.currentTime;
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
  o.connect(bp); bp.connect(g); g.connect(master);
  o.start(t); o.stop(t + 0.4);
}

function playRabbitChirp(vol = 0.6) {
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(2400, t);
  o.frequency.exponentialRampToValueAtTime(1600, t + 0.06);
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol * 0.35, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
  o.connect(g); g.connect(master);
  o.start(t); o.stop(t + 0.1);
}

function pigOink(t: number, vol: number) {
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(120, t);
  osc.frequency.setValueAtTime(120, t + 0.55);
  osc.frequency.exponentialRampToValueAtTime(65, t + 0.75);
  const f1 = ctx.createBiquadFilter();
  f1.type = 'bandpass'; f1.frequency.value = 2500; f1.Q.value = 8;
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
  fmix.connect(env); env.connect(master);
  osc.start(t); osc.stop(t + 0.82);
  const nb = makeNoise(0.15);
  const nf = ctx.createBiquadFilter();
  nf.type = 'bandpass'; nf.frequency.value = 2300; nf.Q.value = 2;
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(vol * 0.3, t + 0.05);
  ng.gain.exponentialRampToValueAtTime(0.001, t + 0.20);
  nb.connect(nf); nf.connect(ng); ng.connect(master);
  nb.start(t + 0.05); nb.stop(t + 0.22);
}

function pigShortGrunt(t: number, vol: number) {
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(130, t);
  osc.frequency.exponentialRampToValueAtTime(70, t + 0.15);
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
  fmix.connect(env); env.connect(master);
  osc.start(t); osc.stop(t + 0.70);
  const sub = ctx.createOscillator();
  sub.type = 'sine'; sub.frequency.value = 60;
  const sg = ctx.createGain();
  sg.gain.setValueAtTime(0, t + 0.20);
  sg.gain.linearRampToValueAtTime(vol * 0.35, t + 0.30);
  sg.gain.exponentialRampToValueAtTime(0.001, t + 0.68);
  sub.connect(sg); sg.connect(master);
  sub.start(t + 0.20); sub.stop(t + 0.70);
  const nb = makeNoise(0.07);
  const nf = ctx.createBiquadFilter();
  nf.type = 'bandpass'; nf.frequency.value = 3000; nf.Q.value = 2;
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(vol * 0.25, t);
  ng.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
  nb.connect(nf); nf.connect(ng); ng.connect(master);
  nb.start(t); nb.stop(t + 0.08);
}

function playPigGrunt(vol = 0.6) {
  const t = ctx.currentTime;
  if (Math.random() < 0.5) pigOink(t, vol);
  else pigShortGrunt(t, vol);
}

function playWolfRumble(vol = 0.6) {
  const t = ctx.currentTime;
  const nb = makeNoise(0.5);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = 220;
  const lp2 = ctx.createBiquadFilter();
  lp2.type = 'lowpass'; lp2.frequency.value = 180;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol * 0.7, t + 0.06);
  g.gain.setValueAtTime(vol * 0.7, t + 0.3);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
  nb.connect(lp); lp.connect(lp2); lp2.connect(g); g.connect(master);
  nb.start(t); nb.stop(t + 0.58);
}

function playWolfHowl(vol = 0.6) {
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(220, t);
  o.frequency.exponentialRampToValueAtTime(580, t + 0.5);
  o.frequency.exponentialRampToValueAtTime(440, t + 1.0);
  o.frequency.exponentialRampToValueAtTime(300, t + 1.8);
  const vib = ctx.createOscillator();
  vib.frequency.value = 3;
  const vg = ctx.createGain();
  vg.gain.value = 6;
  vib.connect(vg); vg.connect(o.frequency);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol * 0.6, t + 0.15);
  g.gain.setValueAtTime(vol * 0.6, t + 1.3);
  g.gain.exponentialRampToValueAtTime(0.001, t + 2.0);
  o.connect(g); g.connect(master);
  o.start(t); vib.start(t);
  o.stop(t + 2.1); vib.stop(t + 2.1);
}

function playWolfBite(vol = 0.6) {
  const t = ctx.currentTime;
  const nb = makeNoise(0.08);
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass'; hp.frequency.value = 1200;
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(vol, t);
  ng.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
  nb.connect(hp); hp.connect(ng); ng.connect(master);
  nb.start(t); nb.stop(t + 0.09);
  const o = ctx.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(140, t);
  o.frequency.exponentialRampToValueAtTime(50, t + 0.15);
  const og = ctx.createGain();
  og.gain.setValueAtTime(vol * 0.8, t);
  og.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
  o.connect(og); og.connect(master);
  o.start(t); o.stop(t + 0.2);
}

function playKill(vol = 0.6) {
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(180, t);
  o.frequency.exponentialRampToValueAtTime(35, t + 0.14);
  const og = ctx.createGain();
  og.gain.setValueAtTime(vol * 0.9, t);
  og.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
  o.connect(og); og.connect(master);
  o.start(t); o.stop(t + 0.2);
  const nb = makeNoise(0.035);
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass'; hp.frequency.value = 3000;
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(vol * 0.55, t);
  ng.gain.exponentialRampToValueAtTime(0.001, t + 0.035);
  nb.connect(hp); hp.connect(ng); ng.connect(master);
  nb.start(t); nb.stop(t + 0.04);
}

// ── Animal data ───────────────────────────────────────────────────────────────

interface AnimalDef {
  id: string;
  name: string;
  emoji: string;
  badge: string;
  badgeClass: string;
  playAmbient: () => void;
  playSpecial?: () => void;
  specialLabel?: string;
  stats: { key: string; val: string | number; barPct?: number; barColor?: string }[];
}

const ANIMALS: AnimalDef[] = [
  {
    id: 'deer', name: 'Deer', emoji: '🦌',
    badge: 'passive', badgeClass: 'badge-passive',
    playAmbient: () => playDeerBleat(),
    stats: [
      { key: 'HP',              val: 3,      barPct: 3/5, barColor: '#44cc88' },
      { key: 'Awareness radius',val: '360 px' },
      { key: 'Wander speed',   val: '420 ms/tile', barPct: 1 - 420/1000, barColor: '#7aa2d4' },
      { key: 'Flee speed',     val: '95 ms/tile',  barPct: 1 - 95/1000,  barColor: '#ffaa44' },
      { key: 'Wander interval',val: '3 – 7 s' },
      { key: 'Idle interval',  val: '2 – 5 s' },
      { key: 'Meat yield',     val: 3 },
      { key: 'Biome',          val: 'grass → forest' },
    ],
  },
  {
    id: 'rabbit', name: 'Rabbit', emoji: '🐇',
    badge: 'passive', badgeClass: 'badge-passive',
    playAmbient: () => playRabbitChirp(),
    stats: [
      { key: 'HP',              val: 1,      barPct: 1/5, barColor: '#44cc88' },
      { key: 'Awareness radius',val: '260 px' },
      { key: 'Wander speed',   val: '200 ms/tile', barPct: 1 - 200/1000, barColor: '#7aa2d4' },
      { key: 'Flee speed',     val: '80 ms/tile',  barPct: 1 - 80/1000,  barColor: '#ffaa44' },
      { key: 'Hop pause',      val: '340 ms' },
      { key: 'Wander interval',val: '0.6 – 2 s' },
      { key: 'Idle interval',  val: '0.5 – 2 s' },
      { key: 'Meat yield',     val: 1 },
      { key: 'Biome',          val: 'grass (near holes)' },
    ],
  },
  {
    id: 'pig', name: 'Pig', emoji: '🐖',
    badge: 'passive', badgeClass: 'badge-passive',
    playAmbient: () => playPigGrunt(),
    stats: [
      { key: 'HP',              val: 4,      barPct: 4/5, barColor: '#44cc88' },
      { key: 'Awareness radius',val: '180 px' },
      { key: 'Wander speed',   val: '900 ms/tile', barPct: 1 - 900/1000, barColor: '#7aa2d4' },
      { key: 'Flee speed',     val: '520 ms/tile', barPct: 1 - 520/1000, barColor: '#ffaa44' },
      { key: 'Wander interval',val: '3 – 8 s' },
      { key: 'Idle interval',  val: '2 – 6 s' },
      { key: 'Meat yield',     val: 2 },
      { key: 'Biome',          val: 'grass / swamp' },
    ],
  },
  {
    id: 'wolf', name: 'Wolf', emoji: '🐺',
    badge: 'nocturnal hunter', badgeClass: 'badge-nocturnal',
    playAmbient: () => playWolfRumble(),
    playSpecial: () => playWolfHowl(),
    specialLabel: '▶ howl',
    stats: [
      { key: 'HP',              val: 5,        barPct: 5/5, barColor: '#ff4444' },
      { key: 'Awareness radius',val: '500 px' },
      { key: 'Wander speed',   val: '280 ms/tile', barPct: 1 - 280/1000, barColor: '#7aa2d4' },
      { key: 'Flee speed',     val: '90 ms/tile',  barPct: 1 - 90/1000,  barColor: '#ffaa44' },
      { key: 'Bite range',     val: '90 px' },
      { key: 'Bite damage',    val: '20 HP' },
      { key: 'Bite cooldown',  val: '2 s' },
      { key: 'Wander interval',val: '1.5 – 4 s' },
      { key: 'Biome',          val: 'forest / swamp / any' },
    ],
  },
];

// ── Render animals ────────────────────────────────────────────────────────────

const grid = document.getElementById('animals-grid')!;

for (const animal of ANIMALS) {
  const card = document.createElement('div');
  card.className = 'card';

  const rows = animal.stats.map(s => {
    const bar = s.barPct !== undefined
      ? `<div class="bar-track"><div class="bar-fill" style="width:${Math.round(s.barPct * 100)}%;background:${s.barColor ?? '#44cc88'}"></div></div>`
      : '';
    return `
      <div class="stat-row">
        <span class="stat-key">${s.key}</span>
        <div class="stat-bar">${bar}<span class="stat-val">${s.val}</span></div>
      </div>`;
  }).join('');

  const specialBtn = animal.playSpecial
    ? `<button class="btn btn-howl" data-id="${animal.id}-special">${animal.specialLabel ?? '▶ special'}</button>`
    : '';

  card.innerHTML = `
    <div class="card-header">
      <span class="card-name ${animal.id}">${animal.emoji} ${animal.name}</span>
      <span class="badge ${animal.badgeClass}">${animal.badge}</span>
    </div>
    <div class="card-body">${rows}</div>
    <div class="card-footer">
      <button class="btn btn-play" data-id="${animal.id}">▶ play sound</button>
      ${specialBtn}
    </div>`;

  grid.appendChild(card);
}

// ── Render all-sounds grid ────────────────────────────────────────────────────

const SOUNDS: { icon: string; name: string; desc: string; fn: () => void }[] = [
  { icon: '🦌', name: 'Deer bleat',  desc: 'ambient call',       fn: playDeerBleat },
  { icon: '🐇', name: 'Rabbit chirp',desc: 'ambient call',       fn: playRabbitChirp },
  { icon: '🐖', name: 'Pig grunt',   desc: 'ambient call',       fn: playPigGrunt },
  { icon: '🐺', name: 'Wolf rumble', desc: 'ambient growl',      fn: playWolfRumble },
  { icon: '🌕', name: 'Wolf howl',   desc: 'night trigger',      fn: playWolfHowl },
  { icon: '🦷', name: 'Wolf bite',   desc: 'player hit',         fn: playWolfBite },
  { icon: '💀', name: 'Kill',        desc: 'animal killed',      fn: playKill },
];

const soundsGrid = document.getElementById('sounds-grid')!;
for (const s of SOUNDS) {
  const btn = document.createElement('button');
  btn.className = 'sound-btn';
  btn.innerHTML = `
    <span class="sound-icon">${s.icon}</span>
    <span class="sound-label">
      <div class="sound-name">${s.name}</div>
      <div class="sound-desc">${s.desc}</div>
    </span>
    <span style="color:#484f58">▶</span>`;
  btn.addEventListener('click', () => { resume(); s.fn(); });
  soundsGrid.appendChild(btn);
}

// ── Wire up animal card buttons ───────────────────────────────────────────────

document.addEventListener('click', (e) => {
  const btn = (e.target as Element).closest('[data-id]') as HTMLElement | null;
  if (!btn) return;
  resume();

  const id = btn.dataset.id!;
  const animal = ANIMALS.find(a => a.id === id || `${a.id}-special` === id);
  if (!animal) return;

  if (id.endsWith('-special')) {
    animal.playSpecial?.();
  } else {
    animal.playAmbient();
  }
});
