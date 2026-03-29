/**
 * AccessibilityContext.tsx
 * gu-003: Global accessibility preferences for the Rider app.
 * gu-010: Extended with userName (set during onboarding NameSetupScreen).
 * Stores text size, read-aloud preference, and user's first name.
 * Consumed by all screens via useAccessibility().
 */

import React, { createContext, useContext, useState } from 'react';

export type TextSizeOption = 'normal' | 'large' | 'xlarge';
export type ReadAloudOption = 'yes' | 'no' | 'later';

interface AccessibilityPrefs {
  textSize: TextSizeOption;
  readAloud: ReadAloudOption | null;
  userName: string | null; // gu-010: first name from onboarding
}

interface AccessibilityContextType {
  prefs: AccessibilityPrefs;
  setTextSize: (size: TextSizeOption) => void;
  setReadAloud: (pref: ReadAloudOption) => void;
  setUserName: (name: string) => void; // gu-010
  /** Numeric scale multiplier — apply to base font sizes across the app */
  fontScale: number;
}

const DEFAULTS: AccessibilityPrefs = {
  textSize: 'large',  // Default large — elderly users benefit from bigger text
  readAloud: null,
  userName: null,
};

const FONT_SCALES: Record<TextSizeOption, number> = {
  normal: 1.0,
  large:  1.25,
  xlarge: 1.55,
};

const AccessibilityContext = createContext<AccessibilityContextType>({
  prefs: DEFAULTS,
  setTextSize: () => {},
  setReadAloud: () => {},
  setUserName: () => {},
  fontScale: FONT_SCALES.large,
});

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<AccessibilityPrefs>(DEFAULTS);

  const setTextSize  = (size: TextSizeOption)  => setPrefs(p => ({ ...p, textSize: size }));
  const setReadAloud = (pref: ReadAloudOption)  => setPrefs(p => ({ ...p, readAloud: pref }));
  const setUserName  = (name: string)           => setPrefs(p => ({ ...p, userName: name }));

  return (
    <AccessibilityContext.Provider
      value={{ prefs, setTextSize, setReadAloud, setUserName, fontScale: FONT_SCALES[prefs.textSize] }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export const useAccessibility = () => useContext(AccessibilityContext);
