/**
 * ReadAloudScreen.tsx
 * gu-003: Step 2 of the accessibility welcome flow.
 * Asks whether the user wants the app to read things aloud (TTS).
 * Options: Yes / No / Ask me later
 * "Yes" choice means Ziggy-style TTS fires on all key screens.
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
} from 'react-native';
import { useAccessibility, ReadAloudOption } from '../../context/AccessibilityContext';

interface Props {
  onDone: () => void;
}

const READ_ALOUD_OPTIONS: {
  key: ReadAloudOption;
  emoji: string;
  label: string;
  description: string;
}[] = [
  {
    key: 'yes',
    emoji: '🔊',
    label: 'Yes, read things aloud',
    description: 'The app will speak screen content and status updates',
  },
  {
    key: 'no',
    emoji: '🔇',
    label: 'No thanks',
    description: 'Silent mode — you\'ll read everything yourself',
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

  const scaledFont = (base: number) => Math.round(base * fontScale);

  const handleSelect = (pref: ReadAloudOption) => {
    setReadAloud(pref);
    AccessibilityInfo.announceForAccessibility(
      `Read aloud set to ${pref === 'later' ? 'ask me later' : pref}`
    );
  };

  const canContinue = prefs.readAloud !== null;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} bounces={false}>
        {/* Header */}
        <Text style={styles.stepLabel} accessibilityRole="text">Step 2 of 2</Text>
        <Text style={[styles.title, { fontSize: scaledFont(28) }]} accessibilityRole="header">
          Should the app read things aloud?
        </Text>
        <Text style={[styles.subtitle, { fontSize: scaledFont(15) }]}>
          This helps if reading small text is difficult. The app will announce
          your driver's name, ride status, and important updates.
        </Text>

        {/* Options */}
        <View style={styles.optionList}>
          {READ_ALOUD_OPTIONS.map((option) => {
            const selected = prefs.readAloud === option.key;
            return (
              <TouchableOpacity
                key={option.key}
                style={[styles.optionButton, selected && styles.optionButtonSelected]}
                onPress={() => handleSelect(option.key)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`${option.label}. ${option.description}`}
                activeOpacity={0.7}
              >
                <View style={styles.optionRow}>
                  <Text style={styles.optionEmoji}>{option.emoji}</Text>
                  <View style={styles.optionText}>
                    <Text style={[
                      styles.optionLabel,
                      { fontSize: scaledFont(17) },
                      selected && styles.optionLabelSelected,
                    ]}>
                      {option.label}
                    </Text>
                    <Text style={[
                      styles.optionDescription,
                      { fontSize: scaledFont(13) },
                      selected && styles.optionDescriptionSelected,
                    ]}>
                      {option.description}
                    </Text>
                  </View>
                  <View style={[styles.radio, selected && styles.radioSelected]}>
                    {selected && <View style={styles.radioDot} />}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Done button */}
        <TouchableOpacity
          style={[styles.doneButton, !canContinue && styles.doneButtonDisabled]}
          onPress={canContinue ? onDone : undefined}
          accessibilityRole="button"
          accessibilityLabel="Finish setup and go to home screen"
          accessibilityState={{ disabled: !canContinue }}
          activeOpacity={canContinue ? 0.85 : 1}
        >
          <Text style={[styles.doneButtonText, { fontSize: scaledFont(19) }]}>
            {canContinue ? "Let's Go! 🐴" : 'Choose an option above'}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.changeHint, { fontSize: scaledFont(13) }]}>
          You can change any of these settings later in the Settings screen.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 48,
  },
  stepLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  title: {
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 10,
    lineHeight: 36,
  },
  subtitle: {
    color: '#666',
    marginBottom: 28,
    lineHeight: 22,
  },
  optionList: {
    gap: 12,
    marginBottom: 36,
  },
  optionButton: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    minHeight: 76,
    justifyContent: 'center',
  },
  optionButtonSelected: {
    borderColor: '#C0873F',
    backgroundColor: '#FFF8F0',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionEmoji: {
    fontSize: 28,
    marginRight: 14,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  optionLabelSelected: {
    color: '#C0873F',
  },
  optionDescription: {
    color: '#888',
    lineHeight: 18,
  },
  optionDescriptionSelected: {
    color: '#A06020',
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CCC',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    flexShrink: 0,
  },
  radioSelected: {
    borderColor: '#C0873F',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#C0873F',
  },
  doneButton: {
    backgroundColor: '#C0873F',
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    minHeight: 64,
    justifyContent: 'center',
    marginBottom: 16,
  },
  doneButtonDisabled: {
    backgroundColor: '#DDD',
  },
  doneButtonText: {
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  changeHint: {
    color: '#AAA',
    textAlign: 'center',
    lineHeight: 18,
  },
});
