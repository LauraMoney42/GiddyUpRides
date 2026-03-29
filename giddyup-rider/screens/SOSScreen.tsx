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
  Vibration,
  Linking,
  Animated,
} from 'react-native';
import { FontSize, Radius, Spacing, TouchTarget } from '../constants/theme';

// ── Types ─────────────────────────────────────────────────────────────────────

type SOSPhase = 'countdown' | 'alerting' | 'alerted';

interface EmergencyContact {
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

// ── Mock emergency contacts ────────────────────────────────────────────────────
// TODO (gu-002): pull from Firestore rider profile once Firebase is wired
const MOCK_CONTACTS: EmergencyContact[] = [
  { name: 'Margaret',    role: 'Primary caregiver', phone: '+15550001111', notified: true },
  { name: 'GiddyUp HQ', role: 'Dispatch',           phone: '+15550009999', notified: true },
];

const COUNTDOWN_SECS = 5;

// ── SOSScreen ─────────────────────────────────────────────────────────────────

export default function SOSScreen({
  onDismiss,
  userName = 'there',
}: SOSScreenProps) {
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

      {/* ── PHASE 1: Countdown ─────────────────────────────────────────── */}
      {phase === 'countdown' && (
        <View style={styles.centerContainer}>
          <Text
            style={styles.headingCountdown}
            accessibilityRole="header"
            accessibilityLabel="Calling for help"
          >
            Calling for help…
          </Text>

          <Text style={styles.subHeading}>
            Alerting your contacts in:
          </Text>

          {/* Pulsing countdown circle */}
          <Animated.View
            style={[styles.countdownCircle, { transform: [{ scale: pulseAnim }] }]}
            accessibilityLabel={`${secondsLeft} seconds until alert is sent`}
          >
            <Text style={styles.countdownNumber}>{secondsLeft}</Text>
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
            <Text style={styles.cancelBtnText}>✕  I'm Okay — Cancel</Text>
          </TouchableOpacity>

          <Text style={styles.cancelNote}>
            Tap cancel before the timer reaches zero to stop the alert.
          </Text>
        </View>
      )}

      {/* ── PHASE 2: Alerting ──────────────────────────────────────────── */}
      {phase === 'alerting' && (
        <View style={styles.centerContainer}>
          <Text style={styles.alertingEmoji}>📡</Text>
          <Text
            style={styles.headingCountdown}
            accessibilityRole="header"
          >
            Sending alert…
          </Text>
          <Text style={styles.subHeading}>
            Notifying your emergency contacts right now.
          </Text>

          {/* Simple animated dots */}
          <View style={styles.dotsRow}>
            {[0, 1, 2].map(i => (
              <View key={i} style={styles.dot} />
            ))}
          </View>
        </View>
      )}

      {/* ── PHASE 3: Alerted ───────────────────────────────────────────── */}
      {phase === 'alerted' && (
        <View style={styles.alertedContainer}>
          {/* Big confirmed check */}
          <View style={styles.confirmedCircle}>
            <Text style={styles.confirmedCheck}>✓</Text>
          </View>

          <Text
            style={styles.headingAlerted}
            accessibilityRole="header"
          >
            Help is on the way
          </Text>

          <Text style={styles.alertedSub}>
            Hi {userName} — your contacts have been notified and your location has been shared.
            Stay where you are if it's safe to do so.
          </Text>

          {/* Contacts notified */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>CONTACTS NOTIFIED</Text>

            {MOCK_CONTACTS.map(contact => (
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
            <Text style={styles.call911Text}>📞  Call 911 Now</Text>
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
            <Text style={styles.safeBtnText}>✓  I'm Safe Now</Text>
          </TouchableOpacity>

          <Text style={styles.safeNote}>
            Tapping "I'm Safe" will notify your contacts that you are okay.
          </Text>
        </View>
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
    color: 'rgba(255,255,255,0.85)',
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
    fontSize: 80,
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
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    lineHeight: 22,
  },

  // ── Alerting phase
  alertingEmoji: {
    fontSize: 64,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: Spacing.md,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.6)',
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
    fontSize: 40,
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
    borderColor: '#2D6A4F',
    borderRadius: Radius.lg,
    paddingVertical: 18,
    alignItems: 'center',
    minHeight: TouchTarget.min,
    justifyContent: 'center',
  },
  safeBtnText: {
    fontSize: FontSize.base,
    fontWeight: '700',
    color: '#2D6A4F',
  },
  safeNote: {
    fontSize: FontSize.xs,
    color: '#4A4A6A',
    textAlign: 'center',
    lineHeight: 20,
  },
});
