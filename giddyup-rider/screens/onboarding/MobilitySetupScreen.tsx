/**
 * MobilitySetupScreen.tsx — gu-029
 * Onboarding step (after NameSetupScreen) + reused from Settings.
 *
 * Rider selects any mobility or accessibility needs that apply.
 * Selections are saved to AccessibilityContext and automatically
 * attached to every ride request so drivers are informed before pickup.
 *
 * Usage modes:
 *   - onboarding: shows step indicator + "Continue" CTA → onDone()
 *   - settings:   shows back button + "Save" CTA → onBack()
 *
 * Accessibility:
 *   - 60pt+ touch targets throughout
 *   - 22pt+ fonts, scales with sf()
 *   - Haptic on every tap
 *   - accessibilityLabel + accessibilityHint on all interactive elements
 *   - Skippable in onboarding — rider can tap "Skip for now"
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Vibration,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Colors, FontSize, Radius, Spacing, TouchTarget } from '../../constants/theme';
import { useAccessibility, MobilityNeed } from '../../context/AccessibilityContext';
import SOSButton from '../../components/SOSButton';
import MicFab from '../../components/MicFab';

// ── Types ─────────────────────────────────────────────────────────────────────

interface MobilitySetupScreenProps {
  /** Called when onboarding "Continue" or settings "Save" is tapped */
  onDone: () => void;
  /** Back nav — if provided, shows a back button (settings mode) */
  onBack?: () => void;
  /** If true: shows step indicator + "Skip for now" link (onboarding mode) */
  isOnboarding?: boolean;
  onSOS?: () => void;
  onVoiceMic?: () => void;
}

// ── Need option definitions ───────────────────────────────────────────────────

interface NeedOption {
  key: MobilityNeed;
  emoji: string;
  label: string;
  hint: string;           // shown to driver
  warnWAV?: boolean;      // true = surface WAV note
}

const NEED_OPTIONS: NeedOption[] = [
  {
    key: 'wheelchair',
    emoji: '🦽',
    label: 'I use a wheelchair',
    hint: 'Rider requires a wheelchair accessible vehicle.',
    warnWAV: true,
  },
  {
    key: 'cane_walker',
    emoji: '🦯',
    label: 'I use a cane or walker',
    hint: 'Rider uses a cane or walker — extra time may be needed.',
  },
  {
    key: 'hard_of_hearing',
    emoji: '🦻',
    label: 'I am hard of hearing',
    hint: 'Rider is hard of hearing — please speak clearly and face them when talking.',
  },
  {
    key: 'assistance_in',
    emoji: '👋',
    label: 'I need help getting in/out of the car',
    hint: 'Rider needs physical assistance getting in and out of the vehicle.',
  },
  {
    key: 'wheelchair_load',
    emoji: '🚗',
    label: 'I need help loading/unloading my wheelchair',
    hint: 'Rider needs help loading and unloading their wheelchair or mobility device.',
  },
];

// ── MobilitySetupScreen ───────────────────────────────────────────────────────

export default function MobilitySetupScreen({
  onDone,
  onBack,
  isOnboarding = false,
  onSOS,
  onVoiceMic,
}: MobilitySetupScreenProps) {
  const { prefs, setMobilityProfile, fontScale } = useAccessibility();
  const sf = (base: number) => Math.round(base * fontScale);

  // Seed from existing prefs (settings edit mode)
  const [selected, setSelected] = useState<Set<MobilityNeed>>(
    new Set(prefs.mobilityNeeds)
  );
  const [notes, setNotes] = useState(prefs.mobilityNotes);

  const toggle = (key: MobilityNeed) => {
    Vibration.vibrate(40);
    setSelected(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const handleSave = () => {
    Vibration.vibrate(60);
    setMobilityProfile(Array.from(selected), notes.trim());
    onDone();
  };

  const handleSkip = () => {
    Vibration.vibrate(30);
    onDone(); // saves nothing — stays as empty defaults
  };

  const hasWheelchair = selected.has('wheelchair');

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          {/* Back button (settings mode) */}
          {!!onBack && (
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => { Vibration.vibrate(30); onBack(); }}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Text style={[styles.backBtnText, { fontSize: sf(FontSize.sm) }]}>← Back</Text>
            </TouchableOpacity>
          )}

          {/* Progress dots — 7 steps, this is step 6 (index 5) */}
          {isOnboarding && (
            <View style={styles.dotsRow} accessibilityLabel="Step 6 of 7">
              {[0, 1, 2, 3, 4, 5, 6].map(i => (
                <View key={i} style={[styles.dot, i === 5 && styles.dotActive]} />
              ))}
            </View>
          )}

          {/* Title */}
          <Text
            style={[styles.title, { fontSize: sf(FontSize.lg), lineHeight: sf(FontSize.lg) * 1.35 }]}
            accessibilityRole="header"
          >
            Anything we should{'\n'}tell your driver?
          </Text>
          <Text style={[styles.subtitle, { fontSize: sf(FontSize.sm), lineHeight: sf(FontSize.sm) * 1.6 }]}>
            Select all that apply. Your driver will see this before pickup so they can be ready to help.
          </Text>

          {/* WAV notice — shown if wheelchair selected */}
          {hasWheelchair && (
            <View style={styles.wavBanner}>
              <Text style={[styles.wavText, { fontSize: sf(FontSize.sm), lineHeight: sf(FontSize.sm) * 1.55 }]}>
                🦽  We'll look for a wheelchair accessible vehicle (WAV) for you.
              </Text>
            </View>
          )}

          {/* Need options */}
          <View style={styles.optionList} accessibilityRole="list">
            {NEED_OPTIONS.map(option => {
              const isSelected = selected.has(option.key);
              return (
                <TouchableOpacity
                  key={option.key}
                  style={[styles.optionRow, isSelected && styles.optionRowSelected]}
                  onPress={() => toggle(option.key)}
                  activeOpacity={0.75}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isSelected }}
                  accessibilityLabel={option.label}
                  accessibilityHint={isSelected ? 'Tap to deselect' : 'Tap to select'}
                >
                  <Text style={styles.optionEmoji}>{option.emoji}</Text>
                  <Text style={[
                    styles.optionLabel,
                    { fontSize: sf(FontSize.base), lineHeight: sf(FontSize.base) * 1.4 },
                    isSelected && styles.optionLabelSelected,
                  ]}>
                    {option.label}
                  </Text>
                  {/* Checkbox indicator */}
                  <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Free-text notes */}
          <View style={styles.notesBlock}>
            <Text style={[styles.notesLabel, { fontSize: sf(FontSize.sm) }]}>
              ✏️  Anything else your driver should know?
            </Text>
            <TextInput
              style={[
                styles.notesInput,
                {
                  fontSize: sf(FontSize.base),
                  // minHeight scales so larger text never clips at the top
                  minHeight: sf(100),
                  // paddingTop matches padding so first line isn't flush with border
                  paddingTop: Spacing.md,
                },
              ]}
              value={notes}
              onChangeText={setNotes}
              placeholder="e.g. I move slowly — please wait a moment before driving off."
              placeholderTextColor={Colors.disabled}
              multiline
              // numberOfLines removed — fixed line-count locks height on Android and clips text
              maxLength={300}
              accessibilityLabel="Additional notes for your driver"
              accessibilityHint="Optional. Anything else you want your driver to know before pickup."
              returnKeyType="done"
            />
            <Text style={[styles.charCount, { fontSize: sf(FontSize.xs) }]}>
              {notes.length}/300
            </Text>
          </View>

          {/* Driver preview (only when at least one item selected) */}
          {(selected.size > 0 || notes.trim().length > 0) && (
            <View style={styles.previewCard}>
              <Text style={[styles.previewHeading, { fontSize: sf(FontSize.xs) }]}>
                WHAT YOUR DRIVER WILL SEE
              </Text>
              {Array.from(selected).map(key => {
                const opt = NEED_OPTIONS.find(o => o.key === key);
                return opt ? (
                  <Text key={key} style={[styles.previewLine, { fontSize: sf(FontSize.sm), lineHeight: sf(FontSize.sm) * 1.55 }]}>
                    • {opt.hint}
                  </Text>
                ) : null;
              })}
              {notes.trim().length > 0 && (
                <Text style={[styles.previewLine, { fontSize: sf(FontSize.sm), lineHeight: sf(FontSize.sm) * 1.55 }]}>
                  • Rider note: "{notes.trim()}"
                </Text>
              )}
            </View>
          )}

          {/* Save / Continue CTA */}
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSave}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={isOnboarding ? 'Continue to the home screen' : 'Save my accessibility profile'}
            accessibilityHint="Your preferences will be saved and shared with your driver before every ride"
          >
            <Text style={[styles.saveBtnText, { fontSize: sf(FontSize.base) }]}>
              {isOnboarding ? 'Continue →' : 'Save'}
            </Text>
          </TouchableOpacity>

          {/* Skip (onboarding only) */}
          {isOnboarding && (
            <TouchableOpacity
              style={styles.skipBtn}
              onPress={handleSkip}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Skip for now"
              accessibilityHint="You can add accessibility needs any time in Settings"
            >
              <Text style={[styles.skipBtnText, { fontSize: sf(FontSize.xs) }]}>
                Skip for now — I'll add this later in Settings
              </Text>
            </TouchableOpacity>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
      {/* gu-069: SOS + mic always visible */}
      <SOSButton onPress={onSOS ?? (() => {})} />
      <MicFab onPress={onVoiceMic} />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
    gap: Spacing.lg,
  },

  backBtn: {
    alignSelf: 'flex-start',
    minHeight: TouchTarget.min,
    justifyContent: 'center',
    marginBottom: -Spacing.sm,
  },
  backBtnText: {
    color: Colors.textSecondary,
    fontWeight: '600',
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
  },
  subtitle: {
    color: Colors.textSecondary,
    marginTop: -Spacing.sm,
  },

  // WAV notice — gu-mobility-layout-001: increased padding + lineHeight scales inline
  wavBanner: {
    backgroundColor: Colors.surface,  // Navy — gold border + gold text ✅
    borderRadius: Radius.md,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  wavText: {
    color: Colors.primary,            // Gold on navy = 4.6:1 ✅
    fontWeight: '600',
    // lineHeight set inline so it scales with sf()
  },

  // Options
  optionList: {
    gap: Spacing.sm,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    minHeight: TouchTarget.min,
    borderWidth: 2,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  optionRowSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,  // Gold bg — black text = 8.6:1 ✅
  },
  optionEmoji: {
    fontSize: FontSize.lg,
    width: 36,
    textAlign: 'center',
  },
  optionLabel: {
    flex: 1,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  optionLabelSelected: {
    color: '#000000', // Black on gold = 8.6:1 ✅
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkmark: {
    color: '#000000',  // Black on gold checkbox = 8.6:1 ✅
    fontSize: FontSize.xs,
    fontWeight: '800',
  },

  // Notes
  notesBlock: {
    gap: Spacing.sm,
  },
  notesLabel: {
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  notesInput: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: Spacing.md,
    color: Colors.textPrimary,
    // minHeight set inline via sf() so it scales with user's text-size preference
    textAlignVertical: 'top', // Android: pin caret to top of box
    // lineHeight intentionally omitted — let RN auto-size per fontSize to avoid clipping
  },
  charCount: {
    color: Colors.textSecondary,
    textAlign: 'right',
  },

  // Driver preview — gu-mobility-layout-001: increased padding + gap; lineHeight scales inline
  previewCard: {
    backgroundColor: Colors.surface,  // Navy surface ✅
    borderRadius: Radius.md,
    padding: Spacing.lg,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  previewHeading: {
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },
  previewLine: {
    color: Colors.textSecondary,
    // lineHeight set inline so it scales with sf()
  },

  // Save button
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TouchTarget.large,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveBtnText: {
    color: '#000000',  // Black on gold = 8.6:1 ✅
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // Skip
  skipBtn: {
    alignItems: 'center',
    minHeight: TouchTarget.min,
    justifyContent: 'center',
  },
  skipBtnText: {
    color: Colors.textSecondary,
    textDecorationLine: 'underline',
  },
});
