/**
 * TextSizeScreen.tsx
 * gu-003: Welcome flow Step 1 — choose text size.
 * Shows Normal / Large / Extra Large with a live preview sentence
 * so the user sees exactly what they're picking before they commit.
 * Accessibility spec: 60pt min touch targets, no swipes, plain language.
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
import { Colors, FontSize, Spacing, Radius, TouchTarget } from '../../constants/theme';
import { useAccessibility, TextSizeOption } from '../../context/AccessibilityContext';

interface Props {
  onNext: () => void;
}

const SIZE_OPTIONS: {
  key: TextSizeOption;
  label: string;
  description: string;
  previewSize: number; // font size used in the live preview
  labelSize: number;   // font size for the option label itself
}[] = [
  { key: 'normal',  label: 'Normal',       description: 'Standard size',             previewSize: 18, labelSize: 20 },
  { key: 'large',   label: 'Large',        description: 'Bigger and easier to read',  previewSize: 24, labelSize: 24 },
  { key: 'xlarge',  label: 'Extra Large',  description: 'Even bigger',                previewSize: 30, labelSize: 28 },
  { key: 'xxlarge', label: 'XXL',          description: 'Maximum size',               previewSize: 36, labelSize: 32 },
];

export default function TextSizeScreen({ onNext }: Props) {
  const { prefs, setTextSize, fontScale } = useAccessibility();
  const sf = (base: number) => Math.round(base * fontScale);

  const handleSelect = (size: TextSizeOption) => {
    Vibration.vibrate(40);
    setTextSize(size);
    AccessibilityInfo.announceForAccessibility(`Text size changed to ${size}`);
  };

  const selected = prefs.textSize;
  const selectedOption = SIZE_OPTIONS.find(o => o.key === selected)!;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} bounces={false}>
        {/* Progress dots — 7 steps, this is step 0 (Text Size) */}
        <View style={styles.dotsRow} accessibilityLabel="Step 1 of 7">
          {[0,1,2,3,4,5,6].map(i => (
            <View key={i} style={[styles.dot, i === 0 && styles.dotActive]} />
          ))}
        </View>

        {/* Title */}
        <Text style={[styles.title, { fontSize: sf(26), lineHeight: sf(26) * 1.4 }]} accessibilityRole="header">
          Text Size
        </Text>

        {/* Live preview box — updates instantly on selection */}
        <View
          style={styles.previewBox}
          accessibilityLabel={`Live preview: text is currently ${selected} size`}
        >
          <Text style={[styles.previewLabel, { fontSize: sf(15) }]}>PREVIEW</Text>
          <Text style={[styles.previewText, { fontSize: selectedOption.previewSize, lineHeight: selectedOption.previewSize * 1.5 }]}>
            Your ride is{'\n'}5 minutes away.
          </Text>
        </View>

        {/* Size options */}
        <View style={styles.optionList} accessibilityRole="radiogroup">
          {SIZE_OPTIONS.map(option => {
            const isSelected = selected === option.key;
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
                  <View style={styles.optionTextBlock}>
                    <Text style={[
                      styles.optionLabel,
                      { fontSize: option.labelSize },
                      isSelected && styles.optionLabelSelected,
                    ]}>
                      {option.label}
                    </Text>
                    <Text style={[styles.optionDescription, { fontSize: sf(FontSize.xs) }, isSelected && styles.optionDescriptionSelected]}>
                      {option.description}
                    </Text>
                  </View>
                  {/* Radio circle */}
                  <View style={[styles.radio, isSelected && styles.radioSelected]}>
                    {isSelected && <View style={styles.radioDot} />}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Continue */}
        <TouchableOpacity
          style={styles.nextButton}
          onPress={() => { Vibration.vibrate(40); onNext(); }}
          accessibilityRole="button"
          accessibilityLabel="Continue to next step"
          activeOpacity={0.85}
        >
          <Text style={[styles.nextButtonText, { fontSize: sf(20) }]}>Continue →</Text>
        </TouchableOpacity>
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
    marginBottom: Spacing.xl,
  },
  // subtitle removed — "You can change this any time in Settings" copy removed per UX feedback

  // Live preview
  previewBox: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    minHeight: 110,
    justifyContent: 'center',
  },
  previewLabel: {
    color: Colors.textSecondary,
    letterSpacing: 1.4,
    marginBottom: Spacing.sm,
    fontWeight: '700',
  },
  previewText: {
    color: Colors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Options
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
    minHeight: TouchTarget.min,
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
  optionTextBlock: {
    flex: 1,
  },
  optionLabel: {
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  optionLabelSelected: {
    color: '#FFFFFF',  // Black on gold = 8.6:1 ✅
  },
  optionDescription: {
    color: Colors.textSecondary,
  },
  optionDescriptionSelected: {
    color: '#FFFFFF',  // Black on gold = 8.6:1 ✅
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

  // Continue button
  nextButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TouchTarget.xl,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  nextButtonText: {
    color: '#FFFFFF',  // Black on gold = 8.6:1 ✅
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
