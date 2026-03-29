/**
 * HomeScreen.tsx
 * gu-003: Placeholder home screen shown after welcome flow completes.
 * gu-004 (Dev4) will build out the full home screen UI.
 * This screen confirms the welcome flow landed successfully.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useAccessibility } from '../../context/AccessibilityContext';

export default function HomeScreen() {
  const { prefs, fontScale } = useAccessibility();
  const scaledFont = (base: number) => Math.round(base * fontScale);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* SOS button — always visible per accessibility spec */}
        <TouchableOpacity
          style={styles.sosButton}
          accessibilityRole="button"
          accessibilityLabel="SOS emergency button"
          activeOpacity={0.8}
        >
          <Text style={styles.sosText}>SOS</Text>
        </TouchableOpacity>

        {/* Placeholder content — Dev4 builds this out in gu-004 */}
        <View style={styles.centerContent}>
          <Text style={styles.horse}>🐴</Text>
          <Text style={[styles.greeting, { fontSize: scaledFont(26) }]}>
            Welcome to Giddy-Up Rides!
          </Text>
          <Text style={[styles.tagline, { fontSize: scaledFont(16) }]}>
            Saddle Up!
          </Text>
          <View style={styles.prefBadge}>
            <Text style={[styles.prefText, { fontSize: scaledFont(13) }]}>
              Text size: {prefs.textSize} · Read aloud: {prefs.readAloud ?? 'not set'}
            </Text>
          </View>
          <Text style={[styles.placeholder, { fontSize: scaledFont(14) }]}>
            Home screen coming soon — gu-004
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  container: {
    flex: 1,
    padding: 24,
  },
  sosButton: {
    alignSelf: 'flex-end',
    backgroundColor: '#D32F2F',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    minWidth: 70,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  horse: {
    fontSize: 64,
    marginBottom: 16,
  },
  greeting: {
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 6,
  },
  tagline: {
    color: '#C0873F',
    fontWeight: '600',
    marginBottom: 24,
  },
  prefBadge: {
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 20,
  },
  prefText: {
    color: '#666',
  },
  placeholder: {
    color: '#BBB',
    fontStyle: 'italic',
  },
});
