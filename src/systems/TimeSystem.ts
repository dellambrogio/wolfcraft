import { DAY_DURATION_MS } from '../constants';

export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';

// Day schedule (as fraction of 24h):
//   06:00 = 0.25  dawn starts
//   08:00 = 0.333 full day
//   20:00 = 0.833 dusk starts
//   22:00 = 0.917 full night
//   06:00 = 0.25  (next day) dawn starts again
const DAWN_START  = 6  / 24; // 0.250
const DAY_START   = 8  / 24; // 0.333
const DUSK_START  = 20 / 24; // 0.833
const NIGHT_START = 22 / 24; // 0.917

export class TimeSystem {
  // Start at 08:00
  private elapsed = DAY_START * DAY_DURATION_MS;
  private dayNumber = 1;

  /** 0 = midnight, 1 = next midnight */
  get dayProgress(): number {
    return this.elapsed / DAY_DURATION_MS;
  }

  get currentDay(): number {
    return this.dayNumber;
  }

  get timeOfDay(): TimeOfDay {
    const p = this.dayProgress;
    if (p >= DAWN_START  && p < DAY_START)   return 'dawn';
    if (p >= DAY_START   && p < DUSK_START)  return 'day';
    if (p >= DUSK_START  && p < NIGHT_START) return 'dusk';
    return 'night';
  }

  /**
   * Darkness alpha: 0 = full daylight, 1 = full dark.
   * night  00:00–06:00  → 1
   * dawn   06:00–08:00  → 1..0
   * day    08:00–20:00  → 0
   * dusk   20:00–22:00  → 0..1
   * night  22:00–24:00  → 1
   */
  get darknessAlpha(): number {
    const p = this.dayProgress;

    if (p < DAWN_START)  return 1;                                          // 00–06 night
    if (p < DAY_START)   return 1 - (p - DAWN_START) / (DAY_START - DAWN_START);  // 06–08 dawn
    if (p < DUSK_START)  return 0;                                          // 08–20 day
    if (p < NIGHT_START) return (p - DUSK_START) / (NIGHT_START - DUSK_START);    // 20–22 dusk
    return 1;                                                               // 22–24 night
  }

  /** Returns fraction [0,1] representing how complete the day cycle is for HUD display */
  get clockFraction(): number {
    return this.dayProgress;
  }

  update(deltaMs: number): void {
    this.elapsed += deltaMs;
    if (this.elapsed >= DAY_DURATION_MS) {
      this.elapsed -= DAY_DURATION_MS;
      this.dayNumber++;
    }
  }

  /** Hour-like label for HUD, 0–23 mapped to day progress */
  get hourLabel(): string {
    const hour = Math.floor(this.dayProgress * 24);
    return `${hour.toString().padStart(2, '0')}:00`;
  }
}
