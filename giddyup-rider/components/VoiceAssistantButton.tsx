// GiddyUp Rides — VoiceAssistantButton.tsx
// gu-028: Floating mic button — 70pt+, bottom-center, above SOS button.
// Rendered as a global overlay in App.tsx (not per-screen).
// Tap → opens VoiceAssistantOverlay.

import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  Vibration,
} from 'react-native';
import { Colors, Radius } from '../constants/theme';
import { useAccessibility } from '../context/AccessibilityContext';

interface Props {
  onPress: () => void;
  disabled?: boolean;
}

export default function VoiceAssistantButton({ onPress, disabled = false }: Props) {
  const { fontScale } = useAccessibility();
  const sf = (base: number) => Math.round(base * fontScale);
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.92,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 6,
    }).start();
  };

  const handlePress = () => {
    if (disabled) return;
    Vibration.vibrate(60);
    onPress();
  };

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ scale }] }]}>
      <TouchableOpacity
        style={[styles.button, disabled && styles.disabled]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityLabel="Voice assistant"
        accessibilityHint="Tap and speak to book a ride, schedule a trip, or navigate the app hands-free"
        accessibilityRole="button"
        disabled={disabled}
      >
        <Text style={[styles.icon, { fontSize: sf(30) }]}>🎙️</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    // Bottom-center, above the SOS button (SOS is at bottom: 100)
    bottom: 180,
    alignSelf: 'center',
    zIndex: 998,
  },
  button: {
    width: 70,
    height: 70,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 9,
  },
  disabled: {
    opacity: 0.4,
  },
  icon: {
  },
});
