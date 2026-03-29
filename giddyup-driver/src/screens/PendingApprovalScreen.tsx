// GiddyUpRides Driver — PendingApprovalScreen.tsx
// gu-006: Holding screen shown after registration until admin approves the driver.

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

interface Props {
  driverName?: string;
  onSignOut: () => void;
}

const STEPS = [
  {
    icon: '✅',
    label: 'Application submitted',
    done: true,
  },
  {
    icon: '🔍',
    label: 'Background check in progress',
    done: false,
    active: true,
  },
  {
    icon: '📋',
    label: 'Document verification',
    done: false,
  },
  {
    icon: '🚗',
    label: 'Account activation',
    done: false,
  },
];

export default function PendingApprovalScreen({
  driverName,
  onSignOut,
}: Props) {
  const firstName = driverName?.split(' ')[0] ?? 'there';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.inner}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>⏳</Text>
        <Text style={styles.title}>
          You're in the queue, {firstName}!
        </Text>
        <Text style={styles.subtitle}>
          Your application is under review. We typically complete this within{' '}
          <Text style={styles.highlight}>1–3 business days</Text>. We'll notify
          you by email once you're approved.
        </Text>
      </View>

      {/* Progress steps */}
      <View style={styles.stepsCard}>
        <Text style={styles.stepsHeading}>Application status</Text>
        <View style={styles.stepsList}>
          {STEPS.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View
                style={[
                  styles.stepIconBg,
                  step.done && styles.stepIconDone,
                  step.active && styles.stepIconActive,
                ]}
              >
                <Text style={styles.stepIcon}>{step.icon}</Text>
              </View>
              <View style={styles.stepConnector}>
                {i < STEPS.length - 1 && (
                  <View
                    style={[styles.connectorLine, step.done && styles.connectorDone]}
                  />
                )}
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  step.done && styles.stepLabelDone,
                  step.active && styles.stepLabelActive,
                ]}
              >
                {step.label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* What's next */}
      <View style={styles.infoCard}>
        <Text style={styles.infoHeading}>What happens next?</Text>
        <InfoRow icon="📧" text="Check your email for updates — we'll reach out if we need anything." />
        <InfoRow icon="📱" text="Keep an eye on notifications. You'll get an alert the moment you're approved." />
        <InfoRow icon="🤠" text="Once approved, you can start accepting rides immediately." />
      </View>

      {/* Sign out */}
      <TouchableOpacity onPress={onSignOut} style={styles.signOutBtn} activeOpacity={0.7}>
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function InfoRow({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoRowIcon}>{icon}</Text>
      <Text style={styles.infoRowText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  inner: {
    paddingHorizontal: 24,
    paddingTop: 70,
    paddingBottom: 48,
    gap: 24,
  },
  // Hero
  hero: {
    alignItems: 'center',
    marginBottom: 8,
  },
  heroEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
    lineHeight: 23,
  },
  highlight: {
    color: '#D4A017',
    fontWeight: '700',
  },
  // Progress steps
  stepsCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    padding: 20,
  },
  stepsHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#AAA',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 18,
  },
  stepsList: {
    gap: 0,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  stepIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2C2C2E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    marginTop: 2,
  },
  stepIconDone: {
    backgroundColor: '#1A3A25',
  },
  stepIconActive: {
    backgroundColor: '#3A2E00',
    borderWidth: 1.5,
    borderColor: '#D4A017',
  },
  stepIcon: {
    fontSize: 16,
  },
  stepConnector: {
    position: 'absolute',
    left: 17,
    top: 38,
    width: 2,
    height: 24,
    alignItems: 'center',
  },
  connectorLine: {
    width: 2,
    height: 24,
    backgroundColor: '#2C2C2E',
  },
  connectorDone: {
    backgroundColor: '#2A7A4A',
  },
  stepLabel: {
    fontSize: 14,
    color: '#666',
    paddingTop: 9,
    flex: 1,
  },
  stepLabelDone: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  stepLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  // Info card
  infoCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    padding: 20,
    gap: 14,
  },
  infoHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoRowIcon: {
    fontSize: 18,
    marginTop: 1,
  },
  infoRowText: {
    flex: 1,
    fontSize: 13,
    color: '#888',
    lineHeight: 20,
  },
  // Sign out
  signOutBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  signOutText: {
    color: '#555',
    fontSize: 14,
    fontWeight: '600',
  },
});
