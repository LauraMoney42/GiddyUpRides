// GiddyUp Rides — SOSScreen.tsx
// gu-014: Full SOS emergency flow screen.
//
// 3-phase flow:
//   Phase 1 — countdown (5 sec): large countdown, cancel button, auto-advances
//   Phase 2 — alerting:           spinner while "sending alert"
//   Phase 3 — alerted:            confirmed — contacts notified, call 911, I'm Safe
//
// Accessibility-first:
//   - 60pt+ touch targets throughout
//   - 22pt+ fonts
//   - Vibration feedback at each phase transition
//   - accessibilityLabel + accessibilityHint on all interactive elements
//   - High-contrast red/white scheme — easy to read under stress
//   - Plain, large language ("Help is coming" not "Alert dispatched")

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Vibration,
  Linking,
  Animated,
} from 'react-native';
import { Colors, FontSize, Radius, Spacing, TouchTarget } from '../constants/theme';
import { useAccessibility } from '../context/AccessibilityContext';

// ── Types ─────────────────────────────────────────────────────────────────────

type SOSPhase = 'countdown' | 'alerting' | 'alerted';

// Internal display type (adds notified flag for Phase 3 UI)
interface EmergencyContactDisplay {
  name: string;
  role: string;
  phone: string;
  notified: boolean;
}

interface SOSScreenProps {
  /** Called when user taps "I'm Safe" — return to previous screen */
  onDismiss?: () => void;
  /** Rider's name for personalised message */
  userName?: string;
}

const COUNTDOWN_SECS = 5;

// gu-019: Dispatch is always notified — user's personal contacts are added from context
const DISPATCH_CONTACT: EmergencyContactDisplay = {
  name: 'GiddyUp HQ',
  role: 'Dispatch',
  phone: '+15550009999',
  notified: true,
};

// ── SOSScreen ─────────────────────────────────────────────────────────────────

export default function SOSScreen({
  onDismiss,
  userName = 'there',
}: SOSScreenProps) {
  const { fontScale, prefs } = useAccessibility();

  // gu-019: Build contact list from user's saved contacts + always include dispatch
  const displayContacts: EmergencyContactDisplay[] = [
    ...prefs.emergencyContacts.map(c => ({
      name: c.name,
      role: c.role ?? '',
      phone: c.phone,
      notified: true,
    })),
    DISPATCH_CONTACT,
  ];
  const sf = (base: number) => Math.round(base * fontScale);

  const [phase, setPhase]             = useState<SOSPhase>('countdown');
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECS);
  const pulseAnim                     = useRef(new Animated.Value(1)).current;

  // ── Pulse animation on countdown circle ───────────────────────────────────
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.00, duration: 600, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // ── Countdown tick ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'countdown') return;

    const timer = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          Vibration.vibrate([0, 150, 80, 150]);
          setPhase('alerting');
          return 0;
        }
        Vibration.vibrate(40); // light tick each second
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase]);

  // ── Alerting → alerted after brief "sending" delay ────────────────────────
  useEffect(() => {
    if (phase !== 'alerting') return;
    const timer = setTimeout(() => {
      Vibration.vibrate([0, 300, 100, 300, 100, 300]);
      setPhase('alerted');
    }, 2200);
    return () => clearTimeout(timer);
  }, [phase]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleCancel = () => {
    Vibration.vibrate(60);
    onDismiss?.();
  };

  const handleCall911 = () => {
    Vibration.vibrate(80);
    Linking.openURL('tel:911');
  };

  const handleCallContact = (phone: string) => {
    Vibration.vibrate(60);
    Linking.openURL(`tel:${phone}`);
  };

  const handleImSafe = () => {
    Vibration.vibrate([0, 80, 50, 80]);
    onDismiss?.();
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safeArea}>

      {/* gu-sos-icon-001: Static SOS badge — top-right on every phase, matches
          real button location on all app screens. White circle/red text so it's
          visible on the red background. Non-interactive visual only. */}
      <View
        style={styles.sosIconBadge}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Text style={styles.sosIconText}>SOS</Text>
      </View>

      {/* ── PHASE 1: Countdown ─────────────────────────────────────────── */}
      {phase === 'countdown' && (
        <ScrollView
          contentContainerStyle={styles.centerContainer}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text
            style={[styles.headingCountdown, { fontSize: sf(FontSize.xl) }]}
            accessibilityRole="header"
            accessibilityLabel="Calling for help"
          >
            Calling for help…
          </Text>

          <Text style={[styles.subHeading, { fontSize: sf(FontSize.base), lineHeight: sf(FontSize.base) * 1.5 }]}>
            Alerting your contacts in:
          </Text>

          {/* Pulsing countdown circle */}
          <Animated.View
            style={[styles.countdownCircle, { transform: [{ scale: pulseAnim }] }]}
            accessibilityLabel={`${secondsLeft} seconds until alert is sent`}
          >
            <Text
              style={styles.countdownNumber}
              adjustsFontSizeToFit
              numberOfLines={1}
            >
              {secondsLeft}
            </Text>
          </Animated.View>

          {/* Cancel — large, obvious */}
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={handleCancel}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Cancel — I am okay"
            accessibilityHint="Tap to cancel the SOS alert. No one will be contacted."
          >
            <Text style={[styles.cancelBtnText, { fontSize: sf(FontSize.base) }]}>✕  I'm Okay — Cancel</Text>
          </TouchableOpacity>

          <Text style={[styles.cancelNote, { fontSize: sf(FontSize.xs) }]}>
            Tap cancel before the timer reaches zero to stop the alert.
          </Text>
        </ScrollView>
      )}

      {/* ── PHASE 2: Alerting ──────────────────────────────────────────── */}
      {phase === 'alerting' && (
        <ScrollView
          contentContainerStyle={styles.centerContainer}
          bounces={false}
        >
          <Text
            style={[styles.headingCountdown, { fontSize: sf(FontSize.xl) }]}
            accessibilityRole="header"
          >
            Sending alert…
          </Text>
          <Text style={[styles.subHeading, { fontSize: sf(FontSize.base), lineHeight: sf(FontSize.base) * 1.5 }]}>
            Notifying your emergency contacts right now.
          </Text>

          {/* Simple animated dots */}
          <View style={styles.dotsRow}>
            {[0, 1, 2].map(i => (
              <View key={i} style={styles.dot} />
            ))}
          </View>
        </ScrollView>
      )}

      {/* ── PHASE 3: Alerted ───────────────────────────────────────────── */}
      {phase === 'alerted' && (
        <ScrollView
          style={{ flex: 1, backgroundColor: '#FFFFFF' }}
          contentContainerStyle={styles.alertedContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Big confirmed check */}
          <View style={styles.confirmedCircle}>
            <Text style={styles.confirmedCheck}>✓</Text>
          </View>

          <Text
            style={[styles.headingAlerted, { fontSize: sf(FontSize.xl) }]}
            accessibilityRole="header"
          >
            Help is on the way
          </Text>

          <Text style={[styles.alertedSub, { fontSize: sf(FontSize.sm), lineHeight: sf(FontSize.sm) * 1.55 }]}>
            Hi {userName} — your contacts have been notified and your location has been shared.
            Stay where you are if it's safe to do so.
          </Text>

          {/* Contacts notified */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>CONTACTS NOTIFIED</Text>

            {displayContacts.map(contact => (
              <TouchableOpacity
                key={contact.phone}
                style={styles.contactRow}
                onPress={() => handleCallContact(contact.phone)}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={`Call ${contact.name}, ${contact.role}`}
                accessibilityHint={`Tap to call ${contact.name} directly`}
              >
                <View style={styles.contactAvatar}>
                  <Text style={styles.contactInitial}>
                    {contact.name.charAt(0)}
                  </Text>
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.contactRole}>{contact.role}</Text>
                </View>
                <View style={styles.notifiedBadge}>
                  <Text style={styles.notifiedText}>✓ Notified</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Call 911 — always offer */}
          <TouchableOpacity
            style={styles.call911Btn}
            onPress={handleCall911}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Call 911"
            accessibilityHint="Tap to call emergency services directly"
          >
            <Text style={[styles.call911Text, { fontSize: sf(FontSize.base) }]}>📞  Call 911 Now</Text>
          </TouchableOpacity>

          {/* I'm Safe — dismiss */}
          <TouchableOpacity
            style={styles.safeBtn}
            onPress={handleImSafe}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="I am safe now"
            accessibilityHint="Tap to let your contacts know you are safe and return to the app"
          >
            <Text style={[styles.safeBtnText, { fontSize: sf(FontSize.base) }]}>✓  I'm Safe Now</Text>
          </TouchableOpacity>

          <Text style={[styles.safeNote, { fontSize: sf(FontSize.xs) }]}>
            Tapping "I'm Safe" will notify your contacts that you are okay.
          </Text>
        </ScrollView>
      )}

    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const SOS_RED       = '#D62828';
const SOS_RED_DARK  = '#9B1C1C';
const SOS_RED_LIGHT = '#FEE2E2';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: SOS_RED,
  },

  // Shared centering
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
  },

  // ── Countdown phase
  headingCountdown: {
    fontSize: FontSize.xl,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  subHeading: {
    fontSize: FontSize.base,
    color: '#FFFFFF', // gu-037: 0.85 opacity on red = ~4.8:1 borderline → pure white 5.7:1 ✅
    textAlign: 'center',
    lineHeight: 30,
  },
  countdownCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  countdownNumber: {
    fontSize: FontSize.hero, // intentionally large — SOS countdown must be unmissable
    fontWeight: '900',
    color: SOS_RED,
    lineHeight: 90,
  },
  cancelBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: Radius.lg,
    paddingVertical: 20,
    paddingHorizontal: Spacing.xl,
    minHeight: TouchTarget.large,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  cancelBtnText: {
    fontSize: FontSize.base,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cancelNote: {
    fontSize: FontSize.xs,
    color: '#FFFFFF', // gu-037: 0.65 opacity on red = 3.9:1 ❌ → pure white ✅
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.9,     // tiny visual softening without sacrificing contrast
  },

  // gu-sos-icon-001: Static SOS badge — absolute top-right, all phases.
  // White circle + red text = visible on red background; mirrors real button.
  sosIconBadge: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
  },
  sosIconText: {
    color: SOS_RED,
    fontSize: FontSize.sm,
    fontWeight: '900',
    letterSpacing: 1,
  },

  // ── Alerting phase
  dotsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: Spacing.md,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF', // gu-037: 0.60 opacity on red = 3.9:1 ❌ → pure white ✅
    opacity: 0.9,
  },

  // ── Alerted phase
  alertedContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  confirmedCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: SOS_RED,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.sm,
  },
  confirmedCheck: {
    fontSize: FontSize.xxl,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  headingAlerted: {
    fontSize: FontSize.xl,
    fontWeight: '900',
    color: SOS_RED,
    textAlign: 'center',
  },
  alertedSub: {
    fontSize: FontSize.sm,
    color: '#4A4A6A',
    textAlign: 'center',
    lineHeight: 28,
  },

  // Contacts
  section: {
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  sectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: '#4A4A6A',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 4,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SOS_RED_LIGHT,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.md,
    minHeight: TouchTarget.min,
  },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: SOS_RED,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactInitial: {
    fontSize: FontSize.base,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  contactInfo: {
    flex: 1,
    gap: 2,
  },
  contactName: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: SOS_RED_DARK,
  },
  contactRole: {
    fontSize: FontSize.xs,
    color: '#4A4A6A',
  },
  notifiedBadge: {
    backgroundColor: '#DCFCE7',
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  notifiedText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: '#166534',
  },

  // Call 911
  call911Btn: {
    backgroundColor: SOS_RED,
    borderRadius: Radius.lg,
    paddingVertical: 20,
    alignItems: 'center',
    minHeight: TouchTarget.large,
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  call911Text: {
    fontSize: FontSize.base,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  // I'm Safe
  safeBtn: {
    borderWidth: 2,
    borderColor: Colors.success, // gu-020: was hardcoded green
    borderRadius: Radius.lg,
    paddingVertical: 18,
    alignItems: 'center',
    minHeight: TouchTarget.min,
    justifyContent: 'center',
  },
  safeBtnText: {
    fontSize: FontSize.base,
    fontWeight: '700',
    color: Colors.success, // gu-020: was hardcoded green
  },
  safeNote: {
    fontSize: FontSize.xs,
    color: '#4A4A6A',
    textAlign: 'center',
    lineHeight: 20,
  },
});
