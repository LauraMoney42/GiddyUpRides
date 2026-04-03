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
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, Radius, TouchTarget } from '../../constants/theme';
import { useAccessibility, ReadAloudOption } from '../../context/AccessibilityContext';

interface Props {
  onDone: () => void;
}

const OPTIONS: {
  key: ReadAloudOption;
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
}[] = [
  {
    key: 'yes',
    iconName: 'volume-high',
    label: 'Yes, read things aloud',
  },
  {
    key: 'no',
    iconName: 'volume-mute',
    label: 'No thanks',
  },
];

export default function ReadAloudScreen({ onDone }: Props) {
  const { prefs, setReadAloud, fontScale } = useAccessibility();
  const sf = (base: number) => Math.round(base * fontScale); // scaled font helper

  const handleSelect = (pref: ReadAloudOption) => {
    Vibration.vibrate(40);
    setReadAloud(pref);
    // gu-023: only yes/no options remain
    AccessibilityInfo.announceForAccessibility(
      pref === 'yes' ? 'Read aloud turned on' : 'Read aloud turned off'
    );
  };

  const canContinue = prefs.readAloud !== null;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} bounces={false}>
        {/* Progress dots — 7 steps, this is step 1 (index 0) */}
        <View style={styles.dotsRow} accessibilityLabel="Step 1 of 7">
          {[0, 1, 2, 3, 4, 5, 6].map(i => (
            <View key={i} style={[styles.dot, i === 0 && styles.dotActive]} />
          ))}
        </View>

        {/* Title — gu-023: no subtitle body text */}
        <Text style={[styles.title, { fontSize: sf(30), lineHeight: sf(30) * 1.4 }]} accessibilityRole="header">
          Should the app read things aloud?
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
                accessibilityLabel={option.label}
                activeOpacity={0.75}
              >
                <View style={styles.optionRow}>
                  <Ionicons
                    name={option.iconName}
                    size={sf(30)}
                    color={isSelected ? '#FFFFFF' : Colors.textPrimary}
                    style={styles.optionIcon}
                  />
                  <View style={styles.optionTextBlock}>
                    <Text style={[
                      styles.optionLabel,
                      { fontSize: sf(18) },
                      isSelected && styles.optionLabelSelected,
                    ]}>
                      {option.label}
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

        {/* Done button — only shown once user selects an option */}
        {canContinue && (
          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => { Vibration.vibrate(60); onDone(); }}
            accessibilityRole="button"
            accessibilityLabel="Finish setup and go to the home screen"
            activeOpacity={0.85}
          >
            <Text style={[styles.doneButtonText, { fontSize: sf(20) }]}>
              Let's Go! 🐴
            </Text>
          </TouchableOpacity>
        )}

        {/* gu-023: "You can change this any time in Settings" hint removed */}
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
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xxl,
  },
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
    marginBottom: Spacing.xl, // gu-023: increased — subtitle removed
    lineHeight: 40,
  },
  // subtitle removed — gu-023: no body text per UX feedback
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
    backgroundColor: Colors.primary,  // Gold bg — black text = 8.6:1 ✅
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    marginRight: Spacing.md,
    flexShrink: 0,
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
    color: '#000000',  // Black on gold = 8.6:1 ✅
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
    color: '#000000',  // Black on gold = 8.6:1 ✅
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  hint: {
    color: Colors.textSecondary,
    textAlign: 'center',
    opacity: 0.7,
  },
});
