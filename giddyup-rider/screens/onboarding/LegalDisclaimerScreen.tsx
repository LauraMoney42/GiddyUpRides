/**
 * LegalDisclaimerScreen.tsx — gu-032
 * Shown once during onboarding, after ReadAloud, before Slides.
 * Never shown again once accepted (acceptance key written to AsyncStorage).
 *
 * Sections:
 *   🐴  Before You Get Started
 *   ✅  What Giddy-Up Rides IS
 *   🚫  What Giddy-Up Rides is NOT
 *   🤖  About the AI Voice Assistant
 *   🚨  Emergency banner (yellow, same pattern as TicBuddy)
 *   ─── "I Understand — Let's Go" CTA
 *
 * All text uses sf() to respect the font size the user just picked.
 * ScrollView required — content is long.
 *
 * AsyncStorage key: 'giddyup_legal_accepted'
 * Install: npx expo install @react-native-async-storage/async-storage
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Vibration,
} from 'react-native';
import { Colors, FontSize, Radius, Spacing, TouchTarget } from '../../constants/theme';
import { useAccessibility } from '../../context/AccessibilityContext';

// ── AsyncStorage — graceful no-op if not yet installed ───────────────────────
// Run `npx expo install @react-native-async-storage/async-storage` to persist.
let AsyncStorage: { setItem: (k: string, v: string) => Promise<void> } | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch {
  // Package not installed — acceptance won't persist across app restarts (fine for prototype)
}

export const LEGAL_ACCEPTED_KEY = 'giddyup_legal_accepted';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  onAccept: () => void;
}

// ── LegalDisclaimerScreen ─────────────────────────────────────────────────────

export default function LegalDisclaimerScreen({ onAccept }: Props) {
  const { fontScale } = useAccessibility();
  const sf = (base: number) => Math.round(base * fontScale);

  const handleAccept = async () => {
    Vibration.vibrate(60);
    // Persist acceptance so this screen never shows again
    try {
      await AsyncStorage?.setItem(LEGAL_ACCEPTED_KEY, 'true');
    } catch {
      // Storage write failed — non-fatal, continue anyway
    }
    onAccept();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >

        {/* Progress dots — 7 steps, this is step 2 (index 1) */}
        <View style={styles.dotsRow} accessibilityLabel="Step 2 of 7">
          {[0, 1, 2, 3, 4, 5, 6].map(i => (
            <View key={i} style={[styles.dot, i === 1 && styles.dotActive]} />
          ))}
        </View>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <Text style={[styles.heroEmoji, { fontSize: sf(80) }]}>🐴</Text>
        <Text
          style={[styles.heading, { fontSize: sf(FontSize.xl), lineHeight: sf(FontSize.xl) * 1.3 }]}
          accessibilityRole="header"
        >
          Before You Get Started
        </Text>
        <Text style={[styles.subheading, { fontSize: sf(FontSize.base), lineHeight: sf(FontSize.base) * 1.55 }]}>
          Giddy-Up Rides helps you book rides quickly and easily.
        </Text>

        {/* ── What Giddy-Up Rides IS ─────────────────────────────────────── */}
        <SectionCard
          emoji="✅"
          title="What Giddy-Up Rides IS"
          sf={sf}
        >
          <BulletItem sf={sf}>A ride booking app</BulletItem>
          <BulletItem sf={sf}>A way to connect with local drivers</BulletItem>
          <BulletItem sf={sf}>A tool to manage your trips</BulletItem>
        </SectionCard>

        {/* ── What Giddy-Up Rides is NOT ─────────────────────────────────── */}
        <SectionCard
          emoji="🚫"
          title="What Giddy-Up Rides is NOT"
          sf={sf}
        >
          <BulletItem sf={sf}>An emergency service</BulletItem>
          <BulletItem sf={sf}>A guaranteed response</BulletItem>
          <BulletItem sf={sf}>A replacement for calling 911</BulletItem>
        </SectionCard>

        {/* ── About the AI Voice Assistant ───────────────────────────────── */}
        <SectionCard
          emoji="🤖"
          title="About the AI Voice Assistant"
          sf={sf}
        >
          <Text style={[styles.bodyText, { fontSize: sf(FontSize.base), lineHeight: sf(FontSize.base) * 1.55 }]}>
            Our voice assistant uses artificial intelligence. It is not a human. It can make mistakes.
          </Text>
          <Text style={[styles.bodyText, styles.bodyTextSpaced, { fontSize: sf(FontSize.base), lineHeight: sf(FontSize.base) * 1.55 }]}>
            For emergencies, always call 911 directly — do not rely on this app.
          </Text>
        </SectionCard>

        {/* ── Emergency banner ───────────────────────────────────────────── */}
        <View style={styles.emergencyBanner} accessibilityLiveRegion="assertive">
          <Text style={[styles.emergencyEmoji, { fontSize: sf(FontSize.lg) }]}>🚨</Text>
          <Text style={[styles.emergencyText, { fontSize: sf(FontSize.base), lineHeight: sf(FontSize.base) * 1.5 }]}>
            If you are in danger, call 911 now.{'\n'}
            <Text style={styles.emergencyBold}>Do not rely on any app in an emergency.</Text>
          </Text>
        </View>

        {/* ── Accept CTA ─────────────────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={handleAccept}
          accessibilityRole="button"
          accessibilityLabel="I understand — let's go"
          accessibilityHint="Accepts this disclaimer and continues to the app"
          activeOpacity={0.85}
        >
          <Text style={[styles.acceptButtonText, { fontSize: sf(FontSize.lg) }]}>
            I Understand — Let's Go 🐴
          </Text>
        </TouchableOpacity>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionCard({
  emoji,
  title,
  sf,
  children,
}: {
  emoji: string;
  title: string;
  sf: (n: number) => number;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={[styles.cardEmoji, { fontSize: sf(FontSize.base) }]}>{emoji}</Text>
        <Text style={[styles.cardTitle, { fontSize: sf(FontSize.base) }]}>
          {title}
        </Text>
      </View>
      <View style={styles.cardBody}>{children}</View>
    </View>
  );
}

function BulletItem({ sf, children }: { sf: (n: number) => number; children: string }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={[styles.bulletDot, { fontSize: sf(FontSize.base) }]}>•</Text>
      <Text style={[styles.bulletText, { fontSize: sf(FontSize.base), lineHeight: sf(FontSize.base) * 1.5 }]}>
        {children}
      </Text>
    </View>
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

  heroEmoji: {
    // fontSize set inline via sf(80) — gu-054: bumped from FontSize.hero (48)
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },

  heading: {
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },

  subheading: {
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },

  // Section card — navy surface, gold title, white body text
  card: {
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: 'rgba(0,240,255,0.25)',   // subtle electric blue border (gu-078)
    backgroundColor: '#1A1A1A',              // Colors.surface — dark card (gu-078)
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },

  cardEmoji: {
    // fontSize set inline via sf(FontSize.base)
  },

  cardTitle: {
    fontWeight: '800',
    flex: 1,
    color: Colors.primary,                   // gold title — high contrast on navy
  },

  cardBody: {
    gap: Spacing.xs,
  },

  // Bullet list
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },

  bulletDot: {
    color: Colors.primary,                   // gold bullet dot
    fontWeight: '700',
    marginRight: Spacing.sm,
    marginTop: 3,                            // nudge dot to align with first line of text
    lineHeight: undefined,
  },

  bulletText: {
    flex: 1,
    color: '#FFFFFF',                        // pure white for max readability
    fontWeight: '500',
  },

  // Body text (used in AI section)
  bodyText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },

  bodyTextSpaced: {
    marginTop: Spacing.sm,
    fontWeight: '700',
    color: Colors.primary,                   // gold accent on navy
  },

  // Emergency banner — dark navy with gold border, white text
  emergencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',              // black background
    borderRadius: Radius.md,
    borderWidth: 2,
    borderColor: Colors.primary,             // electric blue border (gu-078)
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },

  emergencyEmoji: {
    // fontSize set inline via sf(FontSize.lg)
    flexShrink: 0,
  },

  emergencyText: {
    flex: 1,
    color: '#FFFFFF',                        // white on black (#000000) — 21:1 ✅ AAA (gu-078)
    fontWeight: '600',
  },

  emergencyBold: {
    fontWeight: '800',
    color: Colors.primary,                   // gold for emphasis
  },

  // Accept CTA
  acceptButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TouchTarget.xl,
    paddingHorizontal: Spacing.lg,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  acceptButtonText: {
    color: '#000000',                        // black on gold — max contrast
    fontWeight: '800',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
});
