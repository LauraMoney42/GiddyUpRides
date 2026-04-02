// GiddyUp Rides — MicButton.tsx
// gu-069: Shared floating mic button — large gold circle, bottom-right, safe area aware.
// Rendered per-screen on any screen that doesn't already have its own mic control.

import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/theme';

interface MicButtonProps {
  onPress: () => void;
}

export default function MicButton({ onPress }: MicButtonProps) {
  const safeArea = useSafeAreaInsets();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { bottom: safeArea.bottom + 16, right: 16 },
      ]}
      onPress={onPress}
      accessibilityLabel="Voice assistant"
      accessibilityHint="Tap to speak a command — book a ride, check upcoming rides, and more"
      accessibilityRole="button"
    >
      <Ionicons name="mic" size={32} color="#000000" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
});
