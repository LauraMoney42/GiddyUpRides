/**
 * ReadAloudScreen.tsx
 * gu-003: Welcome flow Step 2 — read-aloud (TTS) preference.
 * Three options: Yes / No / Ask me later.
 * "Yes" means the app speaks driver name, ride status, and key updates.
 * Done button disabled until user makes a selection.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  AccessibilityInfo,
  Vibration,
} from 'react-native';
import { Colors, Spacing, Radius, TouchTarget } from '../../constants/theme';
import { useAccessibility, ReadAloudOption } from '../../context/AccessibilityContext';

interface Props {
  onDone: () => void;
}

const OPTIONS: {
  key: ReadAloudOption;
  emoji: string;
  label: string;
  description: string;
}[] = [
  {
    key: 'yes',
    emoji: '🔊',
    label: 'Yes, read things aloud',
    description: 'The app will speak your driver info, ride status, and key updates',
  },
  {
    key: 'no',
    emoji: '🔇',
    label: 'No thanks',
    description: "Silent mode — you'll read everything on screen yourself",
  },
  {
    key: 'later',
    emoji: '⏰',
    label: 'Ask me later',
    description: 'You can turn this on any time in Settings',
  },
];

export default function ReadAloudScreen({ onDone }: Props) {
  const { prefs, setReadAloud, fontScale } = useAccessibility();
  const sf = (base: number) => Math.round(base * fontScale); // scaled font helper

  const handleSelect = (pref: ReadAloudOption) => {
    Vibration.vibrate(40);
    setReadAloud(pref);
    AccessibilityInfo.announceForAccessibility(
      pref === 'yes' ? 'Read aloud turned on' :
      pref === 'no'  ? 'Read aloud turned off' :
      'Will ask again later'
    );
  };

  const canContinue = prefs.readAloud !== null;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} bounces={false}>
        {/* Step indicator */}
        <Text style={styles.stepLabel}>Step 2 of 2</Text>

        {/* Title */}
        <Text style={[styles.title, { fontSize: sf(30) }]} accessibilityRole="header">
          Should the app read things aloud?
        </Text>
        <Text style={[styles.subtitle, { fontSize: sf(16) }]}>
          This helps if reading small text is difficult.{'\n'}
          You can change this any time in Settings.
        </Text>

        {/* Options */}
        <View style={styles.optionList} accessibilityRole="radiogroup">
          {OPTIONS.map(option => {
            const isSelected = prefs.readAloud === option.key;
            return (
              <TouchableOpacity
                key={option.key}
                style={[styles.optionButton, isSelected && styles.optionButtonSelected]}
                onPress={() => handleSelect(option.key)}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${option.label}. ${option.description}`}
                activeOpacity={0.75}
              >
                <View style={styles.optionRow}>
                  <Text style={styles.optionEmoji}>{option.emoji}</Text>
                  <View style={styles.optionTextBlock}>
                    <Text style={[
                      styles.optionLabel,
                      { fontSize: sf(18) },
                      isSelected && styles.optionLabelSelected,
                    ]}>
                      {option.label}
                    </Text>
                    <Text style={[
                      styles.optionDescription,
                      { fontSize: sf(14) },
                      isSelected && styles.optionDescriptionSelected,
                    ]}>
                      {option.description}
                    </Text>
                  </View>
                  <View style={[styles.radio, isSelected && styles.radioSelected]}>
                    {isSelected && <View style={styles.radioDot} />}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Done button */}
        <TouchableOpacity
          style={[styles.doneButton, !canContinue && styles.doneButtonDisabled]}
          onPress={canContinue ? () => { Vibration.vibrate(60); onDone(); } : undefined}
          accessibilityRole="button"
          accessibilityLabel={canContinue ? "Finish setup and go to the home screen" : "Choose an option above to continue"}
          accessibilityState={{ disabled: !canContinue }}
          activeOpacity={canContinue ? 0.85 : 1}
        >
          <Text style={[styles.doneButtonText, { fontSize: sf(20) }]}>
            {canContinue ? "Let's Go! 🐴" : 'Choose an option above'}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.hint, { fontSize: sf(13) }]}>
          All preferences can be changed later in Settings.
        </Text>
      </ScrollView>
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
  },
  stepLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
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
  optionList: {
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  optionButton: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.border,
    minHeight: TouchTarget.large,
    justifyContent: 'center',
  },
  optionButtonSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#EDF7F2',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionEmoji: {
    fontSize: 30,
    marginRight: Spacing.md,
  },
  optionTextBlock: {
    flex: 1,
  },
  optionLabel: {
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  optionLabelSelected: {
    color: Colors.primary,
  },
  optionDescription: {
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  optionDescriptionSelected: {
    color: Colors.primary,
  },
  radio: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.md,
    flexShrink: 0,
  },
  radioSelected: {
    borderColor: Colors.primary,
  },
  radioDot: {
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: Colors.primary,
  },
  doneButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TouchTarget.xl,
    marginBottom: Spacing.lg,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  doneButtonDisabled: {
    backgroundColor: Colors.disabled,
    shadowOpacity: 0,
    elevation: 0,
  },
  doneButtonText: {
    color: '#fff',
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  hint: {
    color: Colors.textSecondary,
    textAlign: 'center',
    opacity: 0.7,
  },
});
