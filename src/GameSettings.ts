export type DayNightRatio = '3:1' | '2:1' | '1:1' | '1:2' | '1:3';
export type DaySpeed      = 'fast' | 'normal' | 'slow' | 'crawl';

export interface GameSettings {
  dayNightRatio: DayNightRatio;
  daySpeed:      DaySpeed;
  wolvesEnabled: boolean;
  starterKit:    boolean;
}

export const DEFAULT_SETTINGS: GameSettings = {
  dayNightRatio: '2:1',
  daySpeed:      'normal',
  wolvesEnabled: true,
  starterKit:    false,
};

/** Real milliseconds per full 24h game day. */
export const DAY_SPEED_MS: Record<DaySpeed, number> = {
  fast:    60_000,   //  1 real min / day
  normal: 120_000,   //  2 real min / day  ← default
  slow:   300_000,   //  5 real min / day
  crawl:  600_000,   // 10 real min / day
};

/** Human-readable labels shown in the menu. */
export const DAY_SPEED_LABELS: Record<DaySpeed, string> = {
  fast:   ' 2.5 s/hr',
  normal: '   5 s/hr',
  slow:   '12.5 s/hr',
  crawl:  '  25 s/hr',
};

/**
 * Day/night schedule thresholds as fractions of the 24h cycle.
 * [dawnStart, dayStart, duskStart, nightStart]
 * Dawn and dusk transitions are always 2 game-hours each.
 *
 * Ratio  | day core | night core
 * -------|----------|-----------
 *  3:1   |   14 h   |    6 h
 *  2:1   |   12 h   |    8 h   ← default
 *  1:1   |    6 h   |   14 h
 *  1:2   |    3 h   |   19 h
 *  1:3   |    1 h   |   21 h
 */
export const RATIO_THRESHOLDS: Record<DayNightRatio, [number, number, number, number]> = {
  '3:1': [  4/24,  6/24, 20/24, 22/24 ],
  '2:1': [  6/24,  8/24, 20/24, 22/24 ],
  '1:1': [  8/24, 10/24, 16/24, 18/24 ],
  '1:2': [  9/24, 10/24, 13/24, 14/24 ],
  '1:3': [ 10/24, 11/24, 12/24, 13/24 ],
};
