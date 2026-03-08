/**
 * Central UI colour palette — neutral white / grey / black.
 *
 * All HUD, menu, and overlay colours should reference these constants so the
 * entire game's UI look can be changed from one place.
 */

/** Hex numbers for Phaser fillStyle / lineStyle (0xRRGGBB). */
export const BG = {
  BASE:     0x000000,  // pure black  (backdrop overlays)
  DEEP:     0x0d0d0d,  // near-black  (instruction panel)
  PANEL:    0x111111,  // dark panel  (toolbelt bg, slot cells)
  SLOT:     0x1a1a1a,  // slot fill
  ROW:      0x222222,  // list row default
  TITLEBAR: 0x252525,  // section title bar
  SELECTED: 0x2a2a2a,  // selected row / active element
  HOVER:    0x2e2e2e,  // hovered row
  BTN:      0x333333,  // button default
  BTN_ON:   0x3a3a3a,  // button — craftable / active state
  BTN_OVER: 0x555555,  // button hover
  FULL_PANEL: 0x1c1c1c, // large menu panel background
} as const;

/** Hex numbers for borders. */
export const BORDER = {
  DIM:    0x333333,
  MID:    0x444444,
  STD:    0x555555,
  BRIGHT: 0x666666,
  LIGHT:  0x888888,
  WHITE:  0xffffff,
} as const;

/** CSS hex strings for Phaser Text colour. */
export const TEXT = {
  WHITE:    '#ffffff',
  LIGHT:    '#cccccc',
  LABEL:    '#aaaaaa',
  MID:      '#888888',
  DIM:      '#666666',
  DISABLED: '#555555',
  FAINT:    '#444444',
  HINT:     '#556677',  // corner/footer hints
} as const;

/** Accent colours for functional indicators (not purely decorative). */
export const ACCENT = {
  CLOCK:   0xdddd00,  // clock arc sweep
  GATHER:  '#ffff99', // gather-hint text
  ERR_BG:  0x3d1818,  // "can't afford" button bg
  ERR_TXT: '#ff6666', // "can't afford" label
  STATUS:  '#ff7744', // status line (crafting)
} as const;
