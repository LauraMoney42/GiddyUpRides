/**
 * App.tsx — Giddy-Up Rider
 * gu-010: Full onboarding flow added (splash → slides → textSize → readAloud → nameSetup → home).
 *
 * Complete screen flow (first launch):
 *   splash     → WelcomeSplashScreen  — western branding, Get Started (gu-010)
 *   slides     → OnboardingSlides     — 3 explainer slides (gu-010)
 *   textSize   → TextSizeScreen       — pick font size (gu-003)
 *   readAloud  → ReadAloudScreen      — TTS preference (gu-003)
 *   nameSetup  → NameSetupScreen      — enter first name (gu-010)
 *   home       → HomeScreen           — main app (gu-004)
 *   booking    → BookingScreen        — book a ride (gu-005)
 *   settings   → SettingsScreen       — accessibility + account + support (gu-011)
 *   history    → RideHistoryScreen    — past rides, filter, rebook (gu-008)
 */

import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AccessibilityProvider, useAccessibility } from './context/AccessibilityContext';
import WelcomeSplashScreen from './screens/onboarding/WelcomeSplashScreen';
import OnboardingSlides from './screens/onboarding/OnboardingSlides';
import NameSetupScreen from './screens/onboarding/NameSetupScreen';
import TextSizeScreen from './screens/welcome/TextSizeScreen';
import ReadAloudScreen from './screens/welcome/ReadAloudScreen';
import HomeScreen from './screens/HomeScreen';
import BookingScreen from './screens/BookingScreen';
import RideHistoryScreen from './screens/RideHistoryScreen';
import SettingsScreen from './screens/SettingsScreen';
import { Colors } from './constants/theme';

type Screen = 'splash' | 'slides' | 'textSize' | 'readAloud' | 'nameSetup' | 'home' | 'booking' | 'history' | 'settings';

// RootNavigator is a child of AccessibilityProvider so it can read prefs via useAccessibility()
function RootNavigator() {
  const { prefs } = useAccessibility();
  // gu-010: Start at splash (onboarding). AsyncStorage check (future) will skip to 'home' on return.
  const [screen, setScreen] = useState<Screen>('splash');
  const userName = prefs.userName ?? 'there';

  return (
    <View style={styles.root}>
      <StatusBar style={screen === 'splash' ? 'light' : 'dark'} />

      {/* gu-010: Onboarding Step 1 — Western splash screen */}
      {screen === 'splash' && (
        <WelcomeSplashScreen onGetStarted={() => setScreen('slides')} />
      )}

      {/* gu-010: Onboarding Steps 2-4 — What is Giddy-Up? */}
      {screen === 'slides' && (
        <OnboardingSlides
          onDone={() => setScreen('textSize')}
          onBack={() => setScreen('splash')}
        />
      )}

      {/* gu-003: Onboarding Step 5 — Choose text size */}
      {screen === 'textSize' && (
        <TextSizeScreen onNext={() => setScreen('readAloud')} />
      )}

      {/* gu-003: Onboarding Step 6 — Read aloud preference */}
      {screen === 'readAloud' && (
        <ReadAloudScreen onDone={() => setScreen('nameSetup')} />
      )}

      {/* gu-010: Onboarding Step 7 — Enter first name */}
      {screen === 'nameSetup' && (
        <NameSetupScreen
          onDone={() => setScreen('home')}
          onBack={() => setScreen('readAloud')}
        />
      )}

      {/* gu-004 (Dev4): Main home screen */}
      {screen === 'home' && (
        <HomeScreen
          userName={userName}
          onBookRide={() => setScreen('booking')}
          onSettings={() => setScreen('settings')}
          onViewHistory={() => setScreen('history')}
        />
      )}

      {/* gu-005 (Dev1): Book a ride */}
      {screen === 'booking' && (
        <BookingScreen
          onBack={() => setScreen('home')}
          onRideConfirmed={() => setScreen('home')}
        />
      )}

      {/* gu-008 (Dev1): Ride history */}
      {screen === 'history' && (
        <RideHistoryScreen
          onBack={() => setScreen('home')}
          onRebook={() => setScreen('booking')}
        />
      )}

      {/* gu-011 (Dev4): Settings — sign out restarts onboarding */}
      {screen === 'settings' && (
        <SettingsScreen
          userName={userName}
          onBack={() => setScreen('home')}
          onSignOut={() => setScreen('splash')}
        />
      )}
    </View>
  );
}

export default function App() {
  return (
    <AccessibilityProvider>
      <RootNavigator />
    </AccessibilityProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
