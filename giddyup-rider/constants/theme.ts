// GiddyUp Rides — theme.ts
// Design tokens for the rider app.
// Accessibility-first: large fonts, high-contrast, generous touch targets.

export const Colors = {
  primary: '#2D6A4F',      // Deep green — primary action
  primaryDark: '#1B4332',  // Darker green — pressed state
  accent: '#F4A261',       // Warm amber — highlights, SOS warning
  sos: '#D62828',          // Red — SOS / emergency button
  sosDark: '#9B1C1C',      // Darker red — SOS pressed state
  background: '#F8F9FA',   // Off-white background
  surface: '#FFFFFF',      // Card surface
  textPrimary: '#1A1A2E',  // Near-black — main text
  textSecondary: '#4A4A6A',// Dark grey — secondary text
  border: '#DDE2E8',       // Light grey border
  success: '#2D6A4F',      // Green — confirmed
  warning: '#F4A261',      // Amber — in-progress
  disabled: '#B0B0C0',     // Grey — disabled state
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
  full: 999,
};
