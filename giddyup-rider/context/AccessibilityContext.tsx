/**
 * AccessibilityContext.tsx
 * gu-003: Global accessibility preferences for the Rider app.
 * gu-010: Extended with userName (set during onboarding NameSetupScreen).
 * gu-019: Extended with emergencyContacts (set in EmergencyContactScreen).
 * gu-029: Extended with mobilityNeeds + mobilityNotes (set in MobilitySetupScreen).
 * gu-onboarding-favorites-001: Extended with favoriteAddresses (set in FavoritesSetupScreen).
 * Stores text size, read-aloud preference, user's first name, emergency contacts,
 * mobility/accessibility needs shown to drivers, and saved favorite place addresses.
 * Consumed by all screens via useAccessibility().
 */

import React, { createContext, useContext, useState } from 'react';

export type TextSizeOption = 'normal' | 'large' | 'xlarge' | 'xxlarge';
export type ReadAloudOption = 'yes' | 'no' | 'later';

// gu-029: Mobility need keys — used in MobilitySetupScreen + BookingScreen driver note
export type MobilityNeed =
  | 'wheelchair'       // Uses a wheelchair — WAV match preferred
  | 'cane_walker'      // Uses a cane or walker
  | 'hard_of_hearing'  // Hard of hearing
  | 'assistance_in'    // Needs assistance getting in/out of vehicle
  | 'wheelchair_load'  // Needs help loading/unloading wheelchair or mobility device
  | 'other';           // Free-text only (captured in mobilityNotes)

// gu-onboarding-favorites-001: Saved favorite place addresses — set in FavoritesSetupScreen
export interface FavoriteAddresses {
  home:    string;   // 🏠 Home address
  grocery: string;   // 🛒 Grocery store address
  park:    string;   // 🌳 Park address
  doctor:  string;   // 🏥 Doctor / medical office address
}

// gu-019: Emergency contact shape — shared by EmergencyContactScreen + SOSScreen
export interface EmergencyContact {
  id: string;          // uuid or timestamp-based key
  name: string;
  phone: string;
  role?: string;       // optional label e.g. "Son", "Caregiver"
}

interface AccessibilityPrefs {
  textSize: TextSizeOption;
  readAloud: ReadAloudOption | null;
  userName: string | null;               // gu-010: first name from onboarding
  emergencyContacts: EmergencyContact[]; // gu-019: user-added contacts
  mobilityNeeds: MobilityNeed[];         // gu-029: selected mobility/accessibility needs
  mobilityNotes: string;                 // gu-029: free-text "anything else" field
  favoriteAddresses: FavoriteAddresses;  // gu-onboarding-favorites-001: saved place addresses
}

interface AccessibilityContextType {
  prefs: AccessibilityPrefs;
  setTextSize: (size: TextSizeOption) => void;
  setReadAloud: (pref: ReadAloudOption) => void;
  setUserName: (name: string) => void;                          // gu-010
  setEmergencyContacts: (contacts: EmergencyContact[]) => void; // gu-019
  setMobilityProfile: (needs: MobilityNeed[], notes: string) => void; // gu-029
  setFavoriteAddresses: (addresses: FavoriteAddresses) => void; // gu-onboarding-favorites-001
  /** Numeric scale multiplier — apply to base font sizes across the app */
  fontScale: number;
}

const DEFAULTS: AccessibilityPrefs = {
  textSize: 'large',  // Default large — elderly users benefit from bigger text
  readAloud: null,
  userName: null,
  emergencyContacts: [],
  mobilityNeeds: [],   // gu-029
  mobilityNotes: '',   // gu-029
  favoriteAddresses: { home: '', grocery: '', park: '', doctor: '' }, // gu-onboarding-favorites-001
};

const FONT_SCALES: Record<TextSizeOption, number> = {
  normal:  1.0,
  large:   1.25,
  xlarge:  1.55,
  xxlarge: 1.85,
};

const AccessibilityContext = createContext<AccessibilityContextType>({
  prefs: DEFAULTS,
  setTextSize: () => {},
  setReadAloud: () => {},
  setUserName: () => {},
  setEmergencyContacts: () => {},
  setMobilityProfile: () => {},
  setFavoriteAddresses: () => {},
  fontScale: FONT_SCALES.large,
});

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<AccessibilityPrefs>(DEFAULTS);

  const setTextSize          = (size: TextSizeOption)         => setPrefs(p => ({ ...p, textSize: size }));
  const setReadAloud         = (pref: ReadAloudOption)         => setPrefs(p => ({ ...p, readAloud: pref }));
  const setUserName          = (name: string)                  => setPrefs(p => ({ ...p, userName: name }));
  const setEmergencyContacts = (contacts: EmergencyContact[])  => setPrefs(p => ({ ...p, emergencyContacts: contacts }));
  // gu-029: Save mobility/accessibility profile — shown to driver before every ride
  const setMobilityProfile   = (needs: MobilityNeed[], notes: string) =>
    setPrefs(p => ({ ...p, mobilityNeeds: needs, mobilityNotes: notes }));
  // gu-onboarding-favorites-001: Save favorite place addresses — used for quick-book
  const setFavoriteAddresses = (addresses: FavoriteAddresses) =>
    setPrefs(p => ({ ...p, favoriteAddresses: addresses }));

  return (
    <AccessibilityContext.Provider
      value={{ prefs, setTextSize, setReadAloud, setUserName, setEmergencyContacts, setMobilityProfile, setFavoriteAddresses, fontScale: FONT_SCALES[prefs.textSize] }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export const useAccessibility = () => useContext(AccessibilityContext);
