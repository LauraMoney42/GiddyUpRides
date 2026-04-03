/**
 * NotificationPermissionScreen.tsx — gu-033
 * Onboarding step: ask rider to allow notifications.
 * Placed after MobilitySetupScreen, immediately before HomeScreen.
 *
 * Flow:
 *   "Enable Notifications" → requests permission → calls onDone()
 *   "Skip for now"         → skips permission request → calls onDone()
 *
 * If the user skips or denies, the app continues to work — no notifications,
 * no broken state. They can enable later in iOS/Android system settings.
 *
 * Accessibility:
 *   - 22pt+ fonts, scales with sf()
 *   - 60pt+ touch targets
 *   - accessibilityLabel + accessibilityHint on all interactive elements
 *   - Plain English — no jargon
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Vibration,
  ScrollView,
} from 'react-native';
import { Colors, FontSize, Radius, Spacing, TouchTarget } from '../../constants/theme';
import { useAccessibility } from '../../context/AccessibilityContext';
import { requestPermissions } from '../../services/NotificationService';

interface Props {
  onDone: () => void;
}

export default function NotificationPermissionScreen({ onDone }: Props) {
  const { fontScale } = useAccessibility();
  const sf = (base: number) => Math.round(base * fontScale);

  const [loading, setLoading] = useState(false);

  const handleEnable = async () => {
    Vibration.vibrate(50);
    setLoading(true);
    try {
      await requestPermissions();
    } catch {
      // Permission request failed — not a crash, just continue
    } finally {
      setLoading(false);
      onDone();
    }
  };

  const handleSkip = () => {
    Vibration.vibrate(30);
    onDone();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress dots — 7 steps, this is step 7 (index 6) */}
        <View style={styles.dotsRow} accessibilityLabel="Step 7 of 7">
          {[0, 1, 2, 3, 4, 5, 6].map(i => (
            <View key={i} style={[styles.dot, i === 6 && styles.dotActive]} />
          ))}
        </View>

        {/* Icon */}
        <View style={styles.iconCircle} accessibilityElementsHidden>
          <Text style={[styles.icon, { fontSize: sf(FontSize.hero) }]}>🔔</Text>
        </View>

        {/* Heading */}
        <Text
          style={[styles.title, { fontSize: sf(FontSize.lg), lineHeight: sf(FontSize.lg) * 1.35 }]}
          accessibilityRole="header"
        >
          Stay in the loop{'\n'}about your ride
        </Text>

        {/* What we'll send */}
        <View style={styles.benefitList} accessibilityRole="list">
          <BenefitRow
            emoji="🚗"
            text="Know when your driver is 10 minutes away"
            sf={sf}
          />
          <BenefitRow
            emoji="🙋"
            text="Get alerted the moment your driver arrives"
            sf={sf}
          />
          <BenefitRow
            emoji="🛣️"
            text="Confirm your ride has started"
            sf={sf}
          />
        </View>

        {/* Privacy note */}
        <View style={styles.privacyNote}>
          <Text style={[styles.privacyText, { fontSize: sf(FontSize.xs), lineHeight: sf(FontSize.xs) * 1.7 }]}>
            🔒  We only send notifications about your active rides. No marketing, no spam — ever.
          </Text>
        </View>

        {/* Enable button */}
        <TouchableOpacity
          style={[styles.enableBtn, loading && styles.enableBtnLoading]}
          onPress={handleEnable}
          activeOpacity={0.85}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Enable ride notifications"
          accessibilityHint="Allows Giddy-Up to alert you when your driver is nearby or has arrived"
          accessibilityState={{ disabled: loading }}
        >
          {loading ? (
            <ActivityIndicator color="#000000" size="small" />
          ) : (
            <Text style={[styles.enableBtnText, { fontSize: sf(FontSize.base) }]}>
              Enable Notifications 🔔
            </Text>
          )}
        </TouchableOpacity>

        {/* Skip */}
        <TouchableOpacity
          style={styles.skipBtn}
          onPress={handleSkip}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel="Skip notifications for now"
          accessibilityHint="You can enable notifications later in your phone's Settings app"
        >
          <Text style={[styles.skipText, { fontSize: sf(FontSize.xs) }]}>
            Skip for now — I'll enable this later
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── BenefitRow sub-component ──────────────────────────────────────────────────

function BenefitRow({ emoji, text, sf }: { emoji: string; text: string; sf: (n: number) => number }) {
  return (
    <View style={benefitStyles.row}>
      <Text style={[benefitStyles.emoji, { fontSize: sf(FontSize.lg) }]} accessibilityElementsHidden>{emoji}</Text>
      <Text style={[benefitStyles.text, { fontSize: sf(FontSize.sm), lineHeight: sf(FontSize.sm) * 1.55 }]}>
        {text}
      </Text>
    </View>
  );
}

const benefitStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  emoji: {
    // fontSize set inline via sf(FontSize.lg)
    width: 36,
    textAlign: 'center',
  },
  text: {
    flex: 1,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
});

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  // gu-043: justifyContent:'center' was blocking scroll on small screens / large
  // text sizes. flexGrow:1 + justifyContent:'flex-start' keeps content at top
  // while still allowing the ScrollView to scroll when content overflows.
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: Spacing.lg,
  },

  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
    alignSelf: 'stretch',
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

  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    marginBottom: Spacing.sm,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
  icon: {
    // fontSize set inline via sf(FontSize.hero)
  },

  title: {
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
  },

  benefitList: {
    alignSelf: 'stretch',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },

  privacyNote: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  privacyText: {
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  enableBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TouchTarget.large,
    alignSelf: 'stretch',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  enableBtnLoading: {
    opacity: 0.8,
  },
  enableBtnText: {
    color: '#000000',  // Black on gold — WCAG AAA contrast ✅
    fontWeight: '800',
    letterSpacing: 0.3,
    textAlign: 'center',
  },

  skipBtn: {
    alignItems: 'center',
    minHeight: TouchTarget.min,
    justifyContent: 'center',
  },
  skipText: {
    color: Colors.textSecondary,
    textDecorationLine: 'underline',
  },
});
