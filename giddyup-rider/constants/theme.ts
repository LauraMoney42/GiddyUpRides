// GiddyUp Rides — theme.ts
// Design tokens for the rider app.
// Accessibility-first: large fonts, high-contrast, generous touch targets.

export const Colors = {
  // gu-078: Color scheme overhaul — black + white + electric blue
  primary: '#00F0FF',      // Electric Blue — primary action, CTA buttons, accent (gu-078)
  primaryDark: '#00C4CC',  // Deep Electric Blue — pressed/active state (gu-078)
  accent: '#00F0FF',       // Electric Blue — same as primary for consistency (gu-078)
  sos: '#D62828',          // Red — SOS / emergency button (UNCHANGED per spec)
  sosDark: '#9B1C1C',      // Darker red — SOS pressed state (UNCHANGED per spec)
  background: '#000000',   // Pure Black — app background (gu-078)
  surface: '#1A1A1A',      // Dark surface — card/surface background (gu-078)
  textPrimary: '#FFFFFF',  // White — main text on dark bg (gu-078)
  textSecondary: '#9E9E9E',// Medium grey — secondary text, 5.9:1 on black ✅ AA (gu-078)
  border: '#2A2A2A',       // Dark border — subtle on black bg (gu-078)
  success: '#4CAF50',      // Green — confirmed (unchanged)
  warning: '#F4A261',      // Amber — in-progress (unchanged)
  disabled: '#444444',     // Dark grey — disabled state on black bg (gu-078)
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
