/**
 * ScheduledRidesScreen.tsx
 * gu-018: Upcoming scheduled rides list.
 *
 * Shows all future scheduled rides with destination, date/time, and a cancel button.
 * Accessible from HomeScreen via "Upcoming Rides" link.
 * Mock seed data (1-2 entries) shown on first load; new rides added via ScheduleRideScreen.
 *
 * Accessibility: 60pt+ touch targets, fontScale via sf(), VoiceOver labels.
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
  Alert,
} from 'react-native';
import { Colors, FontSize, Radius, Spacing, TouchTarget } from '../constants/theme';
import SOSButton from '../components/SOSButton';
import MicFab from '../components/MicFab';
import { useAccessibility } from '../context/AccessibilityContext';
import { ScheduledRide } from './ScheduleRideScreen';

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  rides: ScheduledRide[];
  onCancel: (id: string) => void;
  onScheduleNew: () => void;
  onBack: () => void;
  onSOS?: () => void;
  onVoiceMic?: () => void;
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function ScheduledRidesScreen({
  rides,
  onCancel,
  onScheduleNew,
  onBack,
  onSOS,
  onVoiceMic,
}: Props) {
  const { fontScale } = useAccessibility();
  const sf = (base: number) => Math.round(base * fontScale);

  const handleCancel = (ride: ScheduledRide) => {
    Vibration.vibrate(40);
    Alert.alert(
      'Cancel this ride?',
      `Cancel your ride to ${ride.destination} on ${ride.date} at ${ride.time}?`,
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Yes, cancel',
          style: 'destructive',
          onPress: () => {
            Vibration.vibrate(60);
            onCancel(ride.id);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.root}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => { Vibration.vibrate(30); onBack(); }}
            accessibilityRole="button"
            accessibilityLabel="Go back to home screen"
            activeOpacity={0.7}
          >
            <Text style={[styles.backBtnText, { fontSize: sf(FontSize.sm) }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { fontSize: sf(FontSize.lg) }]}>
            Upcoming
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {rides.length === 0 ? (
            /* Empty state */
            <View style={styles.emptyState}>
              <Text style={[styles.emptyEmoji, { fontSize: sf(FontSize.hero) }]}>🗓</Text>
              <Text style={[styles.emptyTitle, { fontSize: sf(FontSize.lg) }]}>
                No upcoming rides
              </Text>
              <Text style={[styles.emptyBody, { fontSize: sf(FontSize.sm) }]}>
                Schedule a ride ahead of time for doctor appointments,
                grocery runs, and more.
              </Text>
              <TouchableOpacity
                style={styles.scheduleNewBtn}
                onPress={() => { Vibration.vibrate(40); onScheduleNew(); }}
                accessibilityRole="button"
                accessibilityLabel="Schedule a new ride"
                activeOpacity={0.85}
              >
                <Text style={[styles.scheduleNewBtnText, { fontSize: sf(FontSize.base) }]}>
                  🗓  Schedule a Ride
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={[styles.listCount, { fontSize: sf(FontSize.xs) }]}>
                {rides.length} upcoming ride{rides.length !== 1 ? 's' : ''}
              </Text>

              {rides.map(ride => (
                <RideRow
                  key={ride.id}
                  ride={ride}
                  onCancel={() => handleCancel(ride)}
                  sf={sf}
                />
              ))}

              {/* Schedule another */}
              <TouchableOpacity
                style={styles.addMoreBtn}
                onPress={() => { Vibration.vibrate(40); onScheduleNew(); }}
                accessibilityRole="button"
                accessibilityLabel="Schedule another ride"
                activeOpacity={0.85}
              >
                <Text style={[styles.addMoreBtnText, { fontSize: sf(FontSize.base) }]}>
                  +  Schedule Another Ride
                </Text>
              </TouchableOpacity>
            </>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        <SOSButton onSOS={onSOS} />
        <MicFab onPress={onVoiceMic} />
      </View>
    </SafeAreaView>
  );
}

// ── Ride Row ──────────────────────────────────────────────────────────────────

function RideRow({
  ride,
  onCancel,
  sf,
}: {
  ride: ScheduledRide;
  onCancel: () => void;
  sf: (n: number) => number;
}) {
  return (
    <View
      style={styles.rideCard}
      accessibilityLabel={`Scheduled ride to ${ride.destination} on ${ride.date} at ${ride.time}`}
    >
      {/* Top section: date/time + destination (full width — no competition with cancel) */}
      <View style={styles.rideLeft}>
        <View style={styles.dateBlock}>
          <Text style={[styles.calEmoji, { fontSize: sf(FontSize.base) }]}>🗓</Text>
          <View>
            <Text style={[styles.rideDate, { fontSize: sf(FontSize.sm) }]}>
              {ride.date}
            </Text>
            <Text style={[styles.rideTime, { fontSize: sf(FontSize.base) }]}>
              {ride.time}
            </Text>
          </View>
        </View>
        <View style={styles.destBlock}>
          <Text style={[styles.destPin, { fontSize: sf(FontSize.xs) }]}>📍</Text>
          <Text
            style={[styles.rideDest, { fontSize: sf(FontSize.sm) }]}
            numberOfLines={2}
          >
            {ride.destination}
          </Text>
        </View>
      </View>

      {/* Cancel button — own row, right-aligned, never overlaps time text */}
      <View style={styles.cancelRow}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel={`Cancel ride to ${ride.destination} on ${ride.date}`}
          activeOpacity={0.75}
        >
          <Text style={[styles.cancelBtnText, { fontSize: sf(14) }]}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  root: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { minWidth: TouchTarget.min, minHeight: TouchTarget.min, justifyContent: 'center' },
  backBtnText: { color: Colors.primary, fontWeight: '700' },
  headerTitle: { fontWeight: '800', color: Colors.textPrimary },
  headerSpacer: { minWidth: TouchTarget.min },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.lg, gap: Spacing.sm },

  listCount: {
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },

  // Ride card — column layout so cancel button never overlaps date/time text
  rideCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  rideLeft: {
    gap: Spacing.sm,
  },
  dateBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  calEmoji: {},
  rideDate: { color: Colors.textSecondary, fontWeight: '500' },
  rideTime: { color: Colors.textPrimary,   fontWeight: '800' },
  destBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
  },
  destPin: { marginTop: 2 },
  rideDest: { color: Colors.textPrimary, fontWeight: '600', flex: 1 },

  // Cancel button row — right-aligned below ride details, never floats next to time text
  cancelRow: {
    alignItems: 'flex-end',
  },
  cancelBtn: {
    borderWidth: 2,
    borderColor: Colors.sos,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minWidth: 72,
    minHeight: TouchTarget.min,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: { color: Colors.sos, fontWeight: '700' },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.md,
  },
  emptyEmoji: { marginBottom: Spacing.sm },
  emptyTitle: { fontWeight: '800', color: Colors.textPrimary },
  emptyBody: {
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: Spacing.lg,
  },
  scheduleNewBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TouchTarget.xl,
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.sm,
  },
  scheduleNewBtnText: { color: '#000000', fontWeight: '800' }, // Black on gold — WCAG AAA

  // "Schedule Another Ride" — filled gold, matches all other primary CTAs in the app
  addMoreBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TouchTarget.min,
    marginTop: Spacing.md,
  },
  addMoreBtnText: { color: '#000000', fontWeight: '800' }, // Black on electric blue — 16.6:1 ✅ AAA (gu-078)
});
