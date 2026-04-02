// GiddyUp Rides — MicFab.tsx
// gu-068: Persistent floating mic button — bottom-right, safe-area aware.
// Appears on every screen (except SOSScreen). Identical appearance and behavior everywhere.
// Tapping opens VoiceAssistantOverlay via onPress prop.
//
// Consolidates/replaces MicButton.tsx — single canonical mic component.

import React from 'react';
import { TouchableOpacity, StyleSheet, Vibration } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../constants/theme';
import { useAccessibility } from '../context/AccessibilityContext';

interface MicFabProps {
  onPress?: () => void;
}

export default function MicFab({ onPress }: MicFabProps) {
  const { fontScale } = useAccessibility();
  const sf = (base: number) => Math.round(base * fontScale);
  const safeArea = useSafeAreaInsets();

  return (
    <TouchableOpacity
      style={[styles.micFab, { bottom: safeArea.bottom + Spacing.lg }]}
      onPress={() => { Vibration.vibrate(60); onPress?.(); }}
      accessibilityRole="button"
      accessibilityLabel="Voice assistant"
      accessibilityHint="Tap to speak a command — book a ride, check upcoming rides, and more"
    >
      <Ionicons name="mic" size={sf(32)} color="#000000" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  micFab: {
    position: 'absolute',
    // bottom set inline: safeArea.bottom + Spacing.lg
    right: Spacing.lg,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,  // GiddyUp Gold — black icon = 8.6:1 ✅
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 200,
  },
});
