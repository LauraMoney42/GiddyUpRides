// GiddyUp Rides — theme.ts
// Design tokens for the rider app.
// Accessibility-first: large fonts, high-contrast, generous touch targets.

export const Colors = {
  primary: '#C8963E',      // Warm Gold — primary action (gu-020)
  primaryDark: '#A67A2E',  // Deep Gold — pressed state (gu-020)
  accent: '#F4A261',       // Warm amber — highlights, SOS warning
  sos: '#D62828',          // Red — SOS / emergency button (unchanged)
  sosDark: '#9B1C1C',      // Darker red — SOS pressed state (unchanged)
  background: '#1A2744',   // Deep Navy — app background (gu-020)
  surface: '#243255',      // Navy surface — card background (gu-020)
  textPrimary: '#FFFFFF',  // White — main text on dark bg (gu-020)
  textSecondary: '#B0BEC5',// Light blue-grey — secondary text (gu-020)
  border: '#2E3F6E',       // Navy border — subtle on dark bg (gu-020)
  success: '#4CAF50',      // Green — confirmed (adjusted for dark bg)
  warning: '#F4A261',      // Amber — in-progress
  disabled: '#4A5A7A',     // Muted navy — disabled state on dark bg (gu-020)
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
