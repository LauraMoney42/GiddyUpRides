// GiddyUp Rides — Rider App
// Entry point. Uses simple state-based navigation so each screen
// can be developed independently before react-navigation is wired in.
//
// Screen flow:
//   welcome (gu-003, Dev3) → home (gu-004, Dev4) → booking (gu-005)

import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import HomeScreen from './screens/HomeScreen';
import { Colors } from './constants/theme';

type Screen = 'welcome' | 'home' | 'booking';

export default function App() {
  // TODO (gu-003): replace with actual onboarding check from AsyncStorage/Firebase
  // For now, skip straight to home so home screen is testable.
  const [screen, setScreen] = useState<Screen>('home');

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {screen === 'home' && (
        <HomeScreen
          userName="Dorothy"
          onBookRide={() => setScreen('booking')}
        />
      )}

      {/* TODO (gu-003): WelcomeScreen rendered here for first-launch */}
      {/* {screen === 'welcome' && (
        <WelcomeScreen onComplete={() => setScreen('home')} />
      )} */}

      {/* TODO (gu-005): BookingScreen rendered here */}
      {/* {screen === 'booking' && (
        <BookingScreen onBack={() => setScreen('home')} />
      )} */}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
