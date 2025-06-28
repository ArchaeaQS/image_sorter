/**
 * Application constants
 */

// Default color palette for class items
export const DEFAULT_COLORS = [
  "",
  "#ef4444", // Red
  "#10b981", // Green
  "#3b82f6", // Blue
  "#f59e0b", // Amber
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#84cc16", // Lime
];

// Grid configuration limits
export const GRID_LIMITS = {
  MIN_COLS: 1,
  MAX_COLS: 20,
  MIN_ROWS: 1,
  MAX_ROWS: 20,
} as const;

// Thumbnail size limits
export const THUMBNAIL_LIMITS = {
  MIN_SIZE: 50,
  MAX_SIZE: 300,
  DEFAULT_HEIGHT: 120,
  DEFAULT_WIDTH: 120,
} as const;

// Debounce timing
export const DEBOUNCE_DELAYS = {
  AUTO_SAVE: 300,
  SEARCH: 500,
} as const;
