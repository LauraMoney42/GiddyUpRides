/**
 * OnboardingSlides.tsx
 * gu-010: Onboarding Steps 2-4 — 3 simple explainer slides.
 * Plain language, large icons, big text. No swipes — tap Next/Back only.
 * Accessibility spec: 60pt+ touch targets, VoiceOver labels on all elements.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Vibration,
} from 'react-native';
import { Colors, Spacing, Radius, TouchTarget, FontSize } from '../../constants/theme';

interface Props {
  onDone: () => void;
  onBack: () => void;
}

interface Slide {
  emoji: string;
  title: string;
  body: string;
  detail: string;
}

const SLIDES: Slide[] = [
  {
    emoji: '🚗',
    title: 'Book a ride in seconds',
    body: 'Tell us where you\'re going. We\'ll find you a nearby driver — usually in under 5 minutes.',
    detail: 'No app experience needed. Just tap "Book a Ride" and follow the simple steps.',
  },
  {
    emoji: '🧑‍✈️',
    title: 'Meet your driver',
    body: 'We\'ll show you your driver\'s name, photo, and the car they\'re driving — in big, easy-to-read text.',
    detail: 'You\'ll also get a text message with all their details, just in case.',
  },
  {
    emoji: '🏡',
    title: 'Get there safely',
    body: 'Your driver picks you up at your door and takes you exactly where you need to go.',
    detail: 'No confusing GPS or apps. Just a friendly driver who\'s there to help.',
  },
];

export default function OnboardingSlides({ onDone, onBack }: Props) {
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;

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
      <ScrollView contentContainerStyle={styles.container} bounces={false}>
        {/* Progress dots */}
        <View style={styles.dotsRow} accessibilityLabel={`Slide ${index + 1} of ${SLIDES.length}`}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>

        {/* Slide content */}
        <View
          style={styles.slideContent}
          accessibilityLiveRegion="polite"
          accessibilityLabel={`${slide.title}. ${slide.body} ${slide.detail}`}
        >
          <Text style={styles.slideEmoji}>{slide.emoji}</Text>
          <Text style={styles.slideTitle}>{slide.title}</Text>
          <Text style={styles.slideBody}>{slide.body}</Text>
          <View style={styles.detailBox}>
            <Text style={styles.slideDetail}>{slide.detail}</Text>
          </View>
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
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
            accessibilityRole="button"
            accessibilityLabel={isLast ? 'Continue to account setup' : 'Next slide'}
            activeOpacity={0.85}
          >
            <Text style={styles.nextButtonText}>
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
  },
  slideEmoji: {
    fontSize: 80,
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
    color: '#fff',
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
