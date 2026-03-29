/**
 * TextSizeScreen.tsx
 * gu-003: Step 1 of the accessibility welcome flow.
 * User picks their preferred text size — Normal / Large / Extra Large.
 * Live preview updates instantly so the user sees exactly what they're choosing.
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
import { useAccessibility, TextSizeOption } from '../../context/AccessibilityContext';

interface Props {
  onNext: () => void;
}

const SIZE_OPTIONS: { key: TextSizeOption; label: string; description: string; sampleSize: number }[] = [
  { key: 'normal',  label: 'Normal',      description: 'Standard text size',       sampleSize: 18 },
  { key: 'large',   label: 'Large',       description: 'Bigger and easier to read', sampleSize: 24 },
  { key: 'xlarge',  label: 'Extra Large', description: 'Maximum readability',       sampleSize: 30 },
];

export default function TextSizeScreen({ onNext }: Props) {
  const { prefs, setTextSize } = useAccessibility();

  const handleSelect = (size: TextSizeOption) => {
    setTextSize(size);
    // Announce change to screen readers
    AccessibilityInfo.announceForAccessibility(`Text size set to ${size}`);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} bounces={false}>
        {/* Header */}
        <Text style={styles.stepLabel} accessibilityRole="text">Step 1 of 2</Text>
        <Text style={styles.title} accessibilityRole="header">
          Choose your text size
        </Text>
        <Text style={styles.subtitle}>
          You can change this any time in Settings.
        </Text>

        {/* Live preview of chosen size */}
        <View style={styles.previewBox} accessibilityLabel="Live text size preview">
          <Text style={[styles.previewText, { fontSize: SIZE_OPTIONS.find(o => o.key === prefs.textSize)?.sampleSize ?? 24 }]}>
            Your ride is 5 minutes away.
          </Text>
        </View>

        {/* Size selector buttons */}
        <View style={styles.optionList}>
          {SIZE_OPTIONS.map((option) => {
            const selected = prefs.textSize === option.key;
            return (
              <TouchableOpacity
                key={option.key}
                style={[styles.optionButton, selected && styles.optionButtonSelected]}
                onPress={() => handleSelect(option.key)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`${option.label} — ${option.description}`}
                activeOpacity={0.7}
              >
                <View style={styles.optionRow}>
                  <View style={styles.optionText}>
                    <Text style={[styles.optionLabel, selected && styles.optionLabelSelected, { fontSize: option.sampleSize * 0.75 }]}>
                      {option.label}
                    </Text>
                    <Text style={[styles.optionDescription, selected && styles.optionDescriptionSelected]}>
                      {option.description}
                    </Text>
                  </View>
                  {/* Selection indicator */}
                  <View style={[styles.radio, selected && styles.radioSelected]}>
                    {selected && <View style={styles.radioDot} />}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Next button */}
        <TouchableOpacity
          style={styles.nextButton}
          onPress={onNext}
          accessibilityRole="button"
          accessibilityLabel="Continue to next step"
          activeOpacity={0.85}
        >
          <Text style={styles.nextButtonText}>Continue →</Text>
        </TouchableOpacity>
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
    fontSize: 30,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 28,
    lineHeight: 22,
  },
  previewBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewText: {
    color: '#1A1A1A',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 38,
  },
  optionList: {
    gap: 12,
    marginBottom: 40,
  },
  optionButton: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    // Minimum 60pt touch target per accessibility spec
    minHeight: 72,
    justifyContent: 'center',
  },
  optionButtonSelected: {
    borderColor: '#C0873F',
    backgroundColor: '#FFF8F0',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    fontSize: 13,
    color: '#888',
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
  nextButton: {
    backgroundColor: '#C0873F',
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    // Large touch target
    minHeight: 64,
    justifyContent: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
