// GiddyUp Rides — theme.ts
// Design tokens for the rider app.
// Accessibility-first: large fonts, high-contrast, generous touch targets.

export const Colors = {
  primary: '#0066FF',      // Electric Blue — primary action
  primaryDark: '#0044CC',  // Deep Electric Blue — pressed state
  accent: '#4D99FF',       // Light Electric Blue — highlights
  sos: '#D62828',          // Red — SOS / emergency button (unchanged)
  sosDark: '#9B1C1C',      // Darker red — SOS pressed state (unchanged)
  background: '#000000',   // Black — app background
  surface: '#111111',      // Near-black — card/surface background
  textPrimary: '#FFFFFF',  // White — main text on dark bg
  textSecondary: '#9E9E9E',// Medium grey — secondary text
  border: '#222222',       // Dark border — subtle on black bg
  success: '#4CAF50',      // Green — confirmed (unchanged)
  warning: '#F4A261',      // Amber — in-progress (unchanged)
  disabled: '#3A3A3A',     // Dark grey — disabled state on black bg
};

// Minimum touch target per accessibility spec: 60×60pt
export const TouchTarget = {
  min: 60,
  large: 72,
  xl: 80,
};

// Font sizes — 22pt base per spec, Dynamic Type support
export const FontSize = {
  xs: 16,
  sm: 18,
  base: 22,
  lg: 26,
  xl: 32,
  xxl: 40,
  hero: 48,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,   // added for BookingScreen + ScheduleRideScreen large cards
  full: 999,
};
