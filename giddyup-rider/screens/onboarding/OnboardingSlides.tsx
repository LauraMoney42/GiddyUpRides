/**
 * OnboardingSlides.tsx
 * gu-010: Onboarding Steps 2-4 — explainer slides.
 * gu-040: 5th slide added — Voice Assistant; showAICard removed from SOS slide.
 * Plain language, large icons, big text. No swipes — tap Next/Back only.
 * Accessibility spec: 60pt+ touch targets, VoiceOver labels on all elements.
 */

import React, { useState, useRef, useLayoutEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, TouchTarget, FontSize } from '../../constants/theme';
import { useAccessibility } from '../../context/AccessibilityContext';

interface Props {
  onDone: () => void;
  onBack: () => void;
}

interface Slide {
  emoji: string;
  title: string;
  body: string;
  detail?: string;        // optional info detail box
  showMicHero?: boolean;  // gu-040: show mic icon as hero (Voice Assistant slide)
  showSosButton?: boolean; // gu-sos-slide-001: show static SOS button top-right (SOS slide)
}

const SLIDES: Slide[] = [
  {
    emoji: '🚗',
    title: 'Book a ride in seconds',
    body: 'Tell us where you\'re going. We\'ll find you a nearby driver — usually in under 5 minutes.',
    // gu-024: detail box removed per PM request
  },
  {
    // gu-meet-driver-img-001: hero icon removed — reclaims vertical space above title
    emoji: '',
    title: 'Meet your driver',
    body: 'We\'ll show you your driver\'s name, photo, and the car they\'re driving.',
    detail: 'You\'ll also get a text message with all their details, just in case.',
  },
  {
    emoji: '🏡',
    title: 'Get there safely',
    body: 'Your driver picks you up at your door and takes you where you need to go.',
    // gu-025: detail box removed per PM request
  },
  {
    // gu-sos-slide-001: emoji hero removed — real SOS button renders top-right instead
    emoji: '',
    title: 'The SOS Button',
    body: 'Every screen has a red SOS button. If you ever feel unsafe or need help, tap it.',
    detail: 'Tapping SOS starts a 5-second countdown — cancel anytime if it was a mistake. If the countdown completes, your emergency contacts and Giddy-Up HQ are notified and your location is shared. You can then choose to call 911.',
    showSosButton: true,
  },
  {
    // gu-040: mic icon rendered as hero via showMicHero — not an emoji
    emoji: '',
    title: 'Voice Assistant',
    body: 'The mic button on your home screen is powered by AI — not a human. It can help you book rides and answer questions, but it has limitations.',
    detail: 'Just say "I want to speak to a person" and it will call Giddy-Up right away — no hassle.',
    showMicHero: true,
  },
];

export default function OnboardingSlides({ onDone, onBack }: Props) {
  const { fontScale } = useAccessibility();
  const sf = (base: number) => Math.round(base * fontScale);

  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;

  // gu-voice-slide-scroll-001: Reset scroll to top on every slide change.
  // useLayoutEffect fires synchronously before paint — prevents mid-page flash
  // that useEffect caused (async after paint). Covers both initial mount and
  // index changes so every slide always opens at the top.
  const scrollRef = useRef<ScrollView>(null);
  useLayoutEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [index]);

  const handleNext = () => {
    Vibration.vibrate(40);
    if (isLast) {
      onDone();
    } else {
      setIndex(i => i + 1);
    }
  };

  const handleBack = () => {
    Vibration.vibrate(30);
    if (index === 0) {
      onBack();
    } else {
      setIndex(i => i - 1);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.container} bounces={false}>
        {/* Progress dots */}
        <View style={styles.dotsRow} accessibilityLabel={`Slide ${index + 1} of ${SLIDES.length}`}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>

        {/* Slide content */}
        <View
          style={[
            styles.slideContent,
            // gu-051: slides with no hero emoji need top padding so the title
            // isn't flush against the top edge (or hidden behind the absolute SOS demo button).
            // showSosButton slides get extra clearance for the 72pt circle.
            slide.showSosButton
              ? styles.slideContentSosPad
              : (!slide.emoji && !slide.showMicHero) && styles.slideContentNoPad,
          ]}
          accessibilityLiveRegion="polite"
          accessibilityLabel={`${slide.title}. ${slide.body}${slide.detail ? ' ' + slide.detail : ''}`}
        >
          {/* gu-sos-slide-001: Static SOS button — top-right, visual only, mirrors real location */}
          {slide.showSosButton && (
            <View
              style={styles.sosDemoButton}
              accessibilityElementsHidden={true}
              importantForAccessibility="no-hide-descendants"
            >
              <Text style={styles.sosDemoText}>SOS</Text>
            </View>
          )}

          {/* Hero area — mic icon, emoji, or nothing */}
          {slide.showMicHero ? (
            // gu-040: Voice Assistant slide
            <View style={styles.micHeroCircle} accessibilityElementsHidden>
              <Ionicons name="mic" size={sf(52)} color="#FFFFFF" />
            </View>
          ) : (
            !!slide.emoji && <Text style={styles.slideEmoji}>{slide.emoji}</Text>
          )}
          <Text style={[styles.slideTitle, { fontSize: sf(FontSize.xl), lineHeight: sf(FontSize.xl) * 1.35 }]}>{slide.title}</Text>
          <Text style={[styles.slideBody, { fontSize: sf(FontSize.base), lineHeight: sf(FontSize.base) * 1.5 }]}>{slide.body}</Text>
          {slide.detail ? (
            <View style={styles.detailBox}>
              <Text style={[styles.slideDetail, { fontSize: sf(FontSize.sm), lineHeight: sf(FontSize.sm) * 1.55 }]}>{slide.detail}</Text>
            </View>
          ) : null}
        </View>

        {/* Navigation */}
        <View style={styles.navRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            activeOpacity={0.7}
          >
            <Text style={[styles.backButtonText, { fontSize: sf(FontSize.sm) }]}>← Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
            accessibilityRole="button"
            accessibilityLabel={isLast ? 'Continue to account setup' : 'Next slide'}
            activeOpacity={0.85}
          >
            <Text style={[styles.nextButtonText, { fontSize: sf(FontSize.sm) }]}>
              {isLast ? 'Continue →' : 'Next →'}
            </Text>
          </TouchableOpacity>
        </View>
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
    flexGrow: 1,
    justifyContent: 'space-between',
  },

  // Progress dots
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

  // Slide
  slideContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.sm, // gu-051: base breathing room so title is never flush at top
  },
  // gu-051: SOS slide — 72pt absolute demo button at top:0; title needs to clear it
  slideContentSosPad: {
    paddingTop: 90,
  },
  // gu-051: "Meet your driver" slide (no emoji, no mic hero) — small extra pad
  slideContentNoPad: {
    paddingTop: Spacing.lg,
  },
  slideEmoji: {
    fontSize: FontSize.hero, // intentionally large onboarding hero emoji
    marginBottom: Spacing.xl,
  },
  slideTitle: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 42,
  },
  slideBody: {
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: Spacing.lg,
  },
  detailBox: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    width: '100%',
  },
  slideDetail: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 28,
  },

  // gu-sos-slide-001: Static SOS button — same style as headerSos in HomeScreen.tsx,
  // positioned absolute top-right to show exactly where it lives on every real screen.
  // Non-interactive (no onPress); hidden from accessibility tree.
  sosDemoButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#D62828',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  sosDemoText: {
    color: '#FFFFFF',
    fontSize: FontSize.sm,
    fontWeight: '900',
    letterSpacing: 1,
  },

  // gu-040: Voice Assistant slide hero — black circle mic matching the home screen button
  micHeroCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },

  // Navigation
  navRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xxl,
  },
  backButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TouchTarget.min,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  backButtonText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  nextButton: {
    flex: 2,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TouchTarget.min,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  nextButtonText: {
    fontSize: FontSize.sm,
    color: '#000000', // Black on gold — WCAG AAA contrast
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
