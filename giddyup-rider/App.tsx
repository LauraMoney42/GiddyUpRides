/**
 * App.tsx — Giddy-Up Rider
 * Screen flow:
 *   textSize  → gu-003 (Dev3) TextSizeScreen  — choose Normal / Large / XL
 *   readAloud → gu-003 (Dev3) ReadAloudScreen  — TTS preference
 *   home      → gu-004 (Dev4) HomeScreen       — main home screen
 *   booking   → gu-005       BookingScreen     — book a ride (upcoming)
 */

import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AccessibilityProvider } from './context/AccessibilityContext';
import TextSizeScreen from './screens/welcome/TextSizeScreen';
import ReadAloudScreen from './screens/welcome/ReadAloudScreen';
import HomeScreen from './screens/HomeScreen';
import BookingScreen from './screens/BookingScreen';
import { Colors } from './constants/theme';

type Screen = 'textSize' | 'readAloud' | 'home' | 'booking';

export default function App() {
  // gu-003: Start at welcome flow. After onboarding, AsyncStorage will skip to 'home'.
  const [screen, setScreen] = useState<Screen>('textSize');

  return (
    <AccessibilityProvider>
      <View style={styles.root}>
        <StatusBar style="dark" />

        {/* gu-003: Welcome flow — text size picker */}
        {screen === 'textSize' && (
          <TextSizeScreen onNext={() => setScreen('readAloud')} />
        )}

        {/* gu-003: Welcome flow — read-aloud preference */}
        {screen === 'readAloud' && (
          <ReadAloudScreen onDone={() => setScreen('home')} />
        )}

        {/* gu-004 (Dev4): Main home screen */}
        {screen === 'home' && (
          <HomeScreen
            userName="Dorothy"
            onBookRide={() => setScreen('booking')}
          />
        )}

        {/* gu-005: BookingScreen — destination → driver pick → confirm */}
        {screen === 'booking' && (
          <BookingScreen
            onBack={() => setScreen('home')}
            onRideConfirmed={() => setScreen('home')}
          />
        )}
      </View>
    </AccessibilityProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
