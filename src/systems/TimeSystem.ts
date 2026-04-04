import { DAY_DURATION_MS } from '../constants';
import { DayNightRatio, RATIO_THRESHOLDS } from '../GameSettings';

export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';

export class TimeSystem {
  private elapsed: number;
  private dayNumber = 1;

  private readonly dayDurationMs: number;
  private readonly DAWN_START:  number;
  private readonly DAY_START:   number;
  private readonly DUSK_START:  number;
  private readonly NIGHT_START: number;

  constructor(dayDurationMs = DAY_DURATION_MS, ratio: DayNightRatio = '2:1') {
    this.dayDurationMs = dayDurationMs;
    [this.DAWN_START, this.DAY_START, this.DUSK_START, this.NIGHT_START] = RATIO_THRESHOLDS[ratio];
    // Start at the beginning of full daylight
    this.elapsed = this.DAY_START * dayDurationMs;
  }

  /** 0 = midnight, 1 = next midnight */
  get dayProgress(): number {
    return this.elapsed / this.dayDurationMs;
  }

  get currentDay(): number { return this.dayNumber; }

  get timeOfDay(): TimeOfDay {
    const p = this.dayProgress;
    if (p >= this.DAWN_START  && p < this.DAY_START)   return 'dawn';
    if (p >= this.DAY_START   && p < this.DUSK_START)  return 'day';
    if (p >= this.DUSK_START  && p < this.NIGHT_START) return 'dusk';
    return 'night';
  }

  /**
   * Darkness alpha: 0 = full daylight, 1 = full dark.
   * Transitions linearly between 0 and 1 during dawn / dusk.
   */
  get darknessAlpha(): number {
    const p = this.dayProgress;
    if (p < this.DAWN_START)  return 1;
    if (p < this.DAY_START)   return 1 - (p - this.DAWN_START)  / (this.DAY_START   - this.DAWN_START);
    if (p < this.DUSK_START)  return 0;
    if (p < this.NIGHT_START) return     (p - this.DUSK_START)  / (this.NIGHT_START - this.DUSK_START);
    return 1;
  }

  /** Fraction [0,1] of the full day cycle — used by the HUD clock arc. */
  get clockFraction(): number { return this.dayProgress; }

  update(deltaMs: number): void {
    this.elapsed += deltaMs;
    if (this.elapsed >= this.dayDurationMs) {
      this.elapsed -= this.dayDurationMs;
      this.dayNumber++;
    }
  }

  /** Hour label (00:00–23:00) for the HUD. */
  get hourLabel(): string {
    const hour = Math.floor(this.dayProgress * 24);
    return `${hour.toString().padStart(2, '0')}:00`;
  }
}
