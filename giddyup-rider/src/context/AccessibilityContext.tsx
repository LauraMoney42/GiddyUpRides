/**
 * AccessibilityContext.tsx
 * gu-003: Global accessibility preferences for the Rider app.
 * Stores text size scale + read-aloud preference.
 * These are set during the welcome flow and used app-wide.
 */

import React, { createContext, useContext, useState } from 'react';

export type TextSizeOption = 'normal' | 'large' | 'xlarge';
export type ReadAloudOption = 'yes' | 'no' | 'later';

interface AccessibilityPrefs {
  textSize: TextSizeOption;
  readAloud: ReadAloudOption | null;
}

interface AccessibilityContextType {
  prefs: AccessibilityPrefs;
  setTextSize: (size: TextSizeOption) => void;
  setReadAloud: (pref: ReadAloudOption) => void;
  /** Returns the numeric font scale multiplier for the current text size */
  fontScale: number;
}

const defaults: AccessibilityPrefs = {
  textSize: 'large',   // Default to large — elderly users benefit from bigger text
  readAloud: null,
};

const AccessibilityContext = createContext<AccessibilityContextType>({
  prefs: defaults,
  setTextSize: () => {},
  setReadAloud: () => {},
  fontScale: 1.2,
});

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<AccessibilityPrefs>(defaults);

  const setTextSize = (size: TextSizeOption) =>
    setPrefs((p) => ({ ...p, textSize: size }));

  const setReadAloud = (pref: ReadAloudOption) =>
    setPrefs((p) => ({ ...p, readAloud: pref }));

  const fontScale: Record<TextSizeOption, number> = {
    normal: 1.0,
    large: 1.25,
    xlarge: 1.55,
  };

  return (
    <AccessibilityContext.Provider
      value={{
        prefs,
        setTextSize,
        setReadAloud,
        fontScale: fontScale[prefs.textSize],
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export const useAccessibility = () => useContext(AccessibilityContext);
