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
  Animated,
  Vibration,
} from 'react-native';
import { Colors, Spacing, Radius, TouchTarget, FontSize } from '../../constants/theme';

interface Props {
  onGetStarted: () => void;
}

export default function WelcomeSplashScreen({ onGetStarted }: Props) {
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
      <View style={styles.container}>
        {/* Western logo area */}
        <Animated.View
          style={[styles.logoArea, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
          accessibilityLabel="Giddy-Up Rides logo"
        >
          {/* Horse emoji stands in for the real western logo asset */}
          <Text style={styles.horseEmoji}>🐴</Text>
          <Text style={styles.brandName}>GIDDY-UP</Text>
          <Text style={styles.brandSub}>RIDES</Text>
          {/* Decorative western divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerStar}>✦</Text>
            <View style={styles.dividerLine} />
          </View>
          <Text style={styles.tagline}>Saddle Up!</Text>
        </Animated.View>

        {/* Warm welcome copy */}
        <Animated.View style={[styles.copyArea, { opacity: fadeAnim }]}>
          <Text style={styles.headline}>
            Your ride,{'\n'}your way.
          </Text>
          <Text style={styles.body}>
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
            <Text style={styles.getStartedText}>Get Started  →</Text>
          </TouchableOpacity>

          <Text style={styles.alreadyHave}>
            Already have an account?{' '}
            <Text style={styles.signInLink}>Sign In</Text>
          </Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#1B4332', // Deep western green on splash only
  },
  container: {
    flex: 1,
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
    fontSize: 80,
    marginBottom: Spacing.md,
  },
  brandName: {
    fontSize: 42,
    fontWeight: '900',
    color: '#F4A261',     // Warm amber — brand accent on dark bg
    letterSpacing: 6,
  },
  brandSub: {
    fontSize: 22,
    fontWeight: '700',
    color: 'rgba(244,162,97,0.75)',
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
    backgroundColor: 'rgba(244,162,97,0.35)',
  },
  dividerStar: {
    color: '#F4A261',
    fontSize: 16,
    marginHorizontal: Spacing.sm,
  },
  tagline: {
    fontSize: FontSize.lg,
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
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 50,
    marginBottom: Spacing.md,
  },
  body: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    lineHeight: 28,
  },

  // CTA
  ctaArea: {
    gap: Spacing.md,
  },
  getStartedButton: {
    backgroundColor: '#F4A261',
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
    color: '#1B4332',
    fontSize: FontSize.lg,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  alreadyHave: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.6)',
    fontSize: FontSize.xs,
  },
  signInLink: {
    color: '#F4A261',
    fontWeight: '700',
  },
});
