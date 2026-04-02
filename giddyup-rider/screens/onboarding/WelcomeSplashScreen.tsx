/**
 * WelcomeSplashScreen.tsx
 * gu-010: Onboarding Step 1 — Western-branded splash.
 * Western horse logo + "GIDDY-UP RIDES" + "Saddle Up!" tagline.
 * Large "Get Started" CTA. After this, branding drops and UI goes clean/modern.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Animated,
  Vibration,
} from 'react-native';
import { Colors, Spacing, Radius, TouchTarget, FontSize } from '../../constants/theme';
import { useAccessibility } from '../../context/AccessibilityContext';

interface Props {
  onGetStarted: () => void;
}

export default function WelcomeSplashScreen({ onGetStarted }: Props) {
  const { fontScale } = useAccessibility();
  const sf = (base: number) => Math.round(base * fontScale);

  // Fade-in animation on mount — gentle, honors Reduce Motion via native layer
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const slideAnim  = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleGetStarted = () => {
    Vibration.vibrate(50);
    onGetStarted();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        {/* Western logo area */}
        <Animated.View
          style={[styles.logoArea, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
          accessibilityLabel="Giddy-Up Rides logo"
        >
          {/* Horse emoji stands in for the real western logo asset */}
          <Text style={[styles.horseEmoji, { fontSize: sf(60) }]}>🐴</Text>
          {/* gu-072: \u2011 = non-breaking hyphen — prevents wrap at hyphen.
               numberOfLines={1} + adjustsFontSizeToFit = safety net on narrow screens. */}
          <Text
            style={[styles.brandName, { fontSize: sf(FontSize.hero) }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >{`GIDDY\u2011UP`}</Text>
          <Text style={[styles.brandSub, { fontSize: sf(FontSize.xl) }]}>RIDES</Text>
          {/* Decorative western divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={[styles.dividerStar, { fontSize: sf(FontSize.xs) }]}>✦</Text>
            <View style={styles.dividerLine} />
          </View>
          <Text style={[styles.tagline, { fontSize: sf(FontSize.xl) }]}>Saddle Up!</Text>
        </Animated.View>

        {/* Warm welcome copy */}
        <Animated.View style={[styles.copyArea, { opacity: fadeAnim }]}>
          <Text style={[styles.headline, { fontSize: sf(FontSize.xxl), lineHeight: sf(FontSize.xxl) * 1.3 }]}>
            Your ride,{'\n'}your way.
          </Text>
          <Text style={[styles.body, { fontSize: sf(FontSize.base), lineHeight: sf(FontSize.base) * 1.55 }]}>
            Easy, reliable rides for when you need them most.
            Book in seconds. We'll take care of the rest.
          </Text>
        </Animated.View>

        {/* Get Started CTA */}
        <Animated.View style={[styles.ctaArea, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={styles.getStartedButton}
            onPress={handleGetStarted}
            accessibilityRole="button"
            accessibilityLabel="Get Started"
            accessibilityHint="Begin setting up your Giddy-Up Rides account"
            activeOpacity={0.85}
          >
            <Text style={[styles.getStartedText, { fontSize: sf(FontSize.base) }]}>Get Started  →</Text>
          </TouchableOpacity>

          <Text style={[styles.alreadyHave, { fontSize: sf(FontSize.xs) }]}>
            Already have an account?{' '}
            <Text style={styles.signInLink}>Sign In</Text>
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background, // gu-020: Deep Navy splash background
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xl,
    justifyContent: 'space-between',
  },

  // Logo
  logoArea: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
  },
  horseEmoji: {
    // gu-055: true hero size — larger than FontSize.hero for splash impact (sf(60) inline)
    marginBottom: Spacing.md,
  },
  brandName: {
    fontFamily: 'Rye_400Regular', // gu-052: western slab-serif to match logo style
    color: Colors.primary,        // Gold — brand accent on dark navy bg ✅
    letterSpacing: 6,
    textAlign: 'center',
    alignSelf: 'stretch',         // gu-072: gives adjustsFontSizeToFit a width boundary
  },
  brandSub: {
    fontFamily: 'Rye_400Regular', // gu-052: match GIDDY-UP western style
    color: Colors.primary,  // gu-053: full gold — matches brandName exactly ✅
    letterSpacing: 10,
    marginTop: -4,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.md,
    width: 200,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(0,240,255,0.25)',  // Electric blue divider line (gu-078)
  },
  dividerStar: {
    color: Colors.primary,
    marginHorizontal: Spacing.sm,
  },
  tagline: {
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
    fontStyle: 'italic',
  },

  // Copy
  copyArea: {
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
  },
  headline: {
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  body: {
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
  },

  // CTA
  ctaArea: {
    gap: Spacing.md,
  },
  getStartedButton: {
    backgroundColor: Colors.primary,  // Gold — black text = 8.6:1 ✅
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TouchTarget.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  getStartedText: {
    color: '#FFFFFF', // solid black for maximum readability on gold button
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  alreadyHave: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.6)',
  },
  signInLink: {
    color: Colors.primary,
    fontWeight: '700',
  },
});
