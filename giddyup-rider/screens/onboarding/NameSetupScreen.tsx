/**
 * NameSetupScreen.tsx
 * gu-010: Onboarding final step — enter first name only.
 * Stored locally in AccessibilityContext (mock — AsyncStorage wired later).
 * Plain language, large input, 60pt+ touch targets.
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Vibration,
  AccessibilityInfo,
} from 'react-native';
import { Colors, Spacing, Radius, TouchTarget, FontSize } from '../../constants/theme';
import { useAccessibility } from '../../context/AccessibilityContext';
import SOSButton from '../../components/SOSButton';
import MicFab from '../../components/MicFab';

interface Props {
  onDone: () => void;
  onBack: () => void;
  onSOS?: () => void;
  onVoiceMic?: () => void;
}

export default function NameSetupScreen({ onDone, onBack, onSOS, onVoiceMic }: Props) {
  const { prefs, setUserName, fontScale } = useAccessibility();
  const [name, setName] = useState(prefs.userName ?? '');
  const [hasError, setHasError] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const sf = (base: number) => Math.round(base * fontScale);

  const handleDone = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setHasError(true);
      AccessibilityInfo.announceForAccessibility('Please enter your first name to continue.');
      inputRef.current?.focus();
      return;
    }
    Vibration.vibrate(60);
    setUserName(trimmed);
    onDone();
  };

  const handleChange = (text: string) => {
    setName(text);
    if (hasError && text.trim()) setHasError(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.container} bounces={false}>
          {/* Progress dots — 7 steps, this is step 4 (index 3) */}
          <View style={styles.dotsRow} accessibilityLabel="Step 4 of 7">
            {[0, 1, 2, 3, 4, 5, 6].map(i => (
              <View key={i} style={[styles.dot, i === 3 && styles.dotActive]} />
            ))}
          </View>
          <Text style={[styles.title, { fontSize: sf(30), lineHeight: sf(30) * 1.4 }]} accessibilityRole="header">
            What's your first name?
          </Text>

          {/* Name input */}
          <View style={styles.inputSection}>
            <Text style={[styles.inputLabel, { fontSize: sf(15) }]}>
              First name
            </Text>
            <TextInput
              ref={inputRef}
              style={[
                styles.input,
                { fontSize: sf(22) },
                hasError && styles.inputError,
              ]}
              value={name}
              onChangeText={handleChange}
              placeholder="e.g. Dorothy"
              placeholderTextColor={Colors.disabled}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleDone}
              maxLength={40}
              accessibilityLabel="First name input"
              accessibilityHint="Enter your first name. Only your first name is needed."
            />
            {hasError && (
              <Text style={[styles.errorText, { fontSize: sf(FontSize.xs) }]} accessibilityLiveRegion="polite">
                Please enter your name to continue.
              </Text>
            )}
          </View>

          {/* Privacy note */}
          <View style={styles.privacyNote}>
            <Text style={[styles.privacyText, { fontSize: sf(14), lineHeight: sf(14) * 1.6 }]}>
              🔒  Your name is only used to identify you to your driver.
              We never share your personal information.
            </Text>
          </View>

          {/* Navigation */}
          <View style={styles.navRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => { Vibration.vibrate(30); onBack(); }}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              activeOpacity={0.7}
            >
              <Text style={[styles.backButtonText, { fontSize: sf(17) }]}>← Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.doneButton, !name.trim() && styles.doneButtonDisabled]}
              onPress={handleDone}
              accessibilityRole="button"
              accessibilityLabel={name.trim() ? `Continue as ${name.trim()}` : 'Enter your name to continue'}
              accessibilityState={{ disabled: !name.trim() }}
              activeOpacity={name.trim() ? 0.85 : 1}
            >
              <Text style={[styles.doneButtonText, { fontSize: sf(19) }]}>
                Let's Ride! 🐴
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      {/* gu-069: SOS + mic always visible */}
      <SOSButton onPress={onSOS ?? (() => {})} />
      <MicFab onPress={onVoiceMic} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
    flexGrow: 1,
  },
  // Progress dots (replaces "Almost done!" label)
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.border,
  },
  dotActive: {
    backgroundColor: Colors.primary,
    width: 28,
  },
  title: {
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    lineHeight: 40,
  },
  subtitle: {
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
    lineHeight: 24,
  },

  // Input
  inputSection: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    color: Colors.textPrimary,
    fontWeight: '600',
    minHeight: TouchTarget.large,
  },
  inputError: {
    borderColor: Colors.sos,
  },
  errorText: {
    color: Colors.sos,
    // fontSize set inline via sf(FontSize.xs)
    marginTop: Spacing.xs,
    fontWeight: '500',
  },

  // Privacy
  privacyNote: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xl,
    flex: 1,
    justifyContent: 'flex-start',
  },
  privacyText: {
    color: Colors.textSecondary,
    lineHeight: 22,
  },

  // Navigation
  navRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  backButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TouchTarget.min,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  backButtonText: {
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  doneButton: {
    flex: 2,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TouchTarget.min,
    paddingHorizontal: Spacing.md,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  doneButtonDisabled: {
    // gu-letsride-btn-001: keep gold bg, reduce opacity — avoids navy/dark appearance
    opacity: 0.4,
    shadowOpacity: 0,
    elevation: 0,
  },
  doneButtonText: {
    color: '#000000', // Black on gold — WCAG AAA contrast
    fontWeight: '800',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
});
