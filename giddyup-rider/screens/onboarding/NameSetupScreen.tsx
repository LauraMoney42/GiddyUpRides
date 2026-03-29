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

interface Props {
  onDone: () => void;
  onBack: () => void;
}

export default function NameSetupScreen({ onDone, onBack }: Props) {
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
          {/* Header */}
          <Text style={styles.stepLabel}>Almost done!</Text>
          <Text style={[styles.title, { fontSize: sf(30) }]} accessibilityRole="header">
            What's your first name?
          </Text>
          <Text style={[styles.subtitle, { fontSize: sf(16) }]}>
            We'll use this so your driver knows who to look for.{'\n'}
            First name only — no last name needed.
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
              <Text style={styles.errorText} accessibilityLiveRegion="polite">
                Please enter your name to continue.
              </Text>
            )}
          </View>

          {/* Privacy note */}
          <View style={styles.privacyNote}>
            <Text style={[styles.privacyText, { fontSize: sf(14) }]}>
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
                {name.trim() ? `Let's Ride, ${name.trim()}! 🐴` : "Let's Ride! 🐴"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  stepLabel: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '700',
    marginBottom: Spacing.sm,
    letterSpacing: 0.5,
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
    fontSize: 15,
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
    backgroundColor: Colors.disabled,
    shadowOpacity: 0,
    elevation: 0,
  },
  doneButtonText: {
    color: '#fff',
    fontWeight: '800',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
});
