// GiddyUp Rides — RideHistoryScreen.tsx
// gu-008: Full ride history screen (mock data).
//
// Shows all past rides with status, date, destination, fare, driver.
// Filter tabs: All | Completed | Cancelled
// Rebook button on each completed ride → opens BookingScreen.
//
// Accessibility-first:
//   - 22pt+ fonts, 60pt+ touch targets, sf() scaling throughout
//   - Haptic on every tap
//   - accessibilityLabel + accessibilityHint on all interactive elements
//   - SOS button always visible, no swipe gestures

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Vibration,
} from 'react-native';
import { Colors, FontSize, Radius, Spacing, TouchTarget } from '../constants/theme';
import SOSButton from '../components/SOSButton';
import MicFab from '../components/MicFab';
import { useAccessibility } from '../context/AccessibilityContext';

// ── Types ─────────────────────────────────────────────────────────────────────

type RideStatus = 'completed' | 'cancelled' | 'no_show';
type FilterTab  = 'all' | 'completed' | 'cancelled';

interface RideRecord {
  id: string;
  destination: string;
  pickup: string;
  date: string;            // display string
  timeOfDay: string;       // display string
  fare: string;
  status: RideStatus;
  driverName: string;
  driverRating: number;
  vehicleDescription: string;
}

// ── Mock Data ─────────────────────────────────────────────────────────────────
// Replace with Firestore query once gu-002 Firebase is wired.

const MOCK_RIDE_HISTORY: RideRecord[] = [
  {
    id: 'r1',
    destination: 'Sunview Medical Center',
    pickup: '742 Evergreen Terrace',
    date: 'Today',
    timeOfDay: '10:30 AM',
    fare: '$12.50',
    status: 'completed',
    driverName: 'Carlos M.',
    driverRating: 4.9,
    vehicleDescription: 'Toyota Camry (Silver)',
  },
  {
    id: 'r2',
    destination: 'Green Valley Grocery',
    pickup: '742 Evergreen Terrace',
    date: 'Yesterday',
    timeOfDay: '2:15 PM',
    fare: '$8.00',
    status: 'completed',
    driverName: 'Sandra T.',
    driverRating: 4.8,
    vehicleDescription: 'Honda Accord (Blue)',
  },
  {
    id: 'r3',
    destination: 'Pine Ridge Senior Center',
    pickup: '742 Evergreen Terrace',
    date: 'Mar 27',
    timeOfDay: '9:00 AM',
    fare: '$15.75',
    status: 'completed',
    driverName: 'James O.',
    driverRating: 4.7,
    vehicleDescription: 'Hyundai Sonata (White)',
  },
  {
    id: 'r4',
    destination: 'CareMore Pharmacy',
    pickup: '742 Evergreen Terrace',
    date: 'Mar 25',
    timeOfDay: '11:45 AM',
    fare: '$6.50',
    status: 'cancelled',
    driverName: '—',
    driverRating: 0,
    vehicleDescription: '—',
  },
  {
    id: 'r5',
    destination: 'Riverside Community Church',
    pickup: '742 Evergreen Terrace',
    date: 'Mar 22',
    timeOfDay: '8:00 AM',
    fare: '$9.25',
    status: 'completed',
    driverName: 'Carlos M.',
    driverRating: 4.9,
    vehicleDescription: 'Toyota Camry (Silver)',
  },
  {
    id: 'r6',
    destination: 'Valley View Hospital',
    pickup: '742 Evergreen Terrace',
    date: 'Mar 20',
    timeOfDay: '7:30 AM',
    fare: '$18.00',
    status: 'completed',
    driverName: 'Sandra T.',
    driverRating: 4.8,
    vehicleDescription: 'Honda Accord (Blue)',
  },
  {
    id: 'r7',
    destination: 'Maplewood Library',
    pickup: '742 Evergreen Terrace',
    date: 'Mar 18',
    timeOfDay: '1:00 PM',
    fare: '$7.75',
    status: 'cancelled',
    driverName: '—',
    driverRating: 0,
    vehicleDescription: '—',
  },
  {
    id: 'r8',
    destination: 'Lakeview Park',
    pickup: '742 Evergreen Terrace',
    date: 'Mar 15',
    timeOfDay: '3:30 PM',
    fare: '$11.00',
    status: 'completed',
    driverName: 'James O.',
    driverRating: 4.7,
    vehicleDescription: 'Hyundai Sonata (White)',
  },
];

// ── RideHistoryScreen ─────────────────────────────────────────────────────────

interface RideHistoryScreenProps {
  onBack: () => void;
  onRebook?: (destination: string) => void;
  onSOS?: () => void;
  onVoiceMic?: () => void;
}

export default function RideHistoryScreen({ onBack, onRebook, onSOS, onVoiceMic }: RideHistoryScreenProps) {
  const { fontScale } = useAccessibility();
  const sf = (base: number) => Math.round(base * fontScale);

  const [filter, setFilter] = useState<FilterTab>('all');

  const filtered = MOCK_RIDE_HISTORY.filter((r) => {
    if (filter === 'all')       return true;
    if (filter === 'completed') return r.status === 'completed';
    if (filter === 'cancelled') return r.status === 'cancelled' || r.status === 'no_show';
    return true;
  });

  const completedCount = MOCK_RIDE_HISTORY.filter(r => r.status === 'completed').length;
  const totalSpend = MOCK_RIDE_HISTORY
    .filter(r => r.status === 'completed')
    .reduce((sum, r) => sum + parseFloat(r.fare.replace('$', '')), 0);

  function handleBack() {
    Vibration.vibrate(30);
    onBack();
  }

  function handleFilterChange(tab: FilterTab) {
    Vibration.vibrate(30);
    setFilter(tab);
  }

  function handleRebook(ride: RideRecord) {
    Vibration.vibrate(50);
    onRebook?.(ride.destination);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.root}>

        {/* ── Top bar ───────────────────────────────────────────────────── */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            accessibilityLabel="Go back"
            accessibilityHint="Returns to the home screen"
            accessibilityRole="button"
          >
            <Text style={[styles.backArrow, { fontSize: sf(FontSize.sm) }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.screenTitle, { fontSize: sf(FontSize.lg) }]} numberOfLines={1} adjustsFontSizeToFit>Ride History</Text>
          <View style={styles.backButton} />
        </View>

        {/* ── Summary strip ─────────────────────────────────────────────── */}
        <View style={styles.summaryStrip}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryNumber, { fontSize: sf(FontSize.xl) }]} numberOfLines={1} adjustsFontSizeToFit>{completedCount}</Text>
            <Text style={[styles.summaryLabel, { fontSize: sf(FontSize.xs) }]}>Rides</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryNumber, { fontSize: sf(FontSize.xl) }]} numberOfLines={1} adjustsFontSizeToFit>${totalSpend.toFixed(2)}</Text>
            <Text style={[styles.summaryLabel, { fontSize: sf(FontSize.xs) }]}>Total Spent</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryNumber, { fontSize: sf(FontSize.xl) }]} numberOfLines={1} adjustsFontSizeToFit>{MOCK_RIDE_HISTORY.length}</Text>
            <Text style={[styles.summaryLabel, { fontSize: sf(FontSize.xs) }]}>All Time</Text>
          </View>
        </View>

        {/* ── Filter tabs ───────────────────────────────────────────────── */}
        <View style={styles.filterRow}>
          {(['all', 'completed', 'cancelled'] as FilterTab[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.filterTab, filter === tab && styles.filterTabActive]}
              onPress={() => handleFilterChange(tab)}
              accessibilityLabel={`Show ${tab} rides`}
              accessibilityRole="tab"
              accessibilityState={{ selected: filter === tab }}
            >
              <Text style={[styles.filterTabText, filter === tab && styles.filterTabTextActive, { fontSize: sf(FontSize.sm) }]}>
                {tab === 'all' ? 'All' : tab === 'completed' ? 'Completed' : 'Cancelled'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Ride list ─────────────────────────────────────────────────── */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyEmoji, { fontSize: sf(FontSize.hero) }]}>🚗</Text>
              <Text style={[styles.emptyText, { fontSize: sf(FontSize.lg) }]}>No rides here yet.</Text>
            </View>
          ) : (
            filtered.map((ride) => (
              <RideCard key={ride.id} ride={ride} sf={sf} onRebook={() => handleRebook(ride)} />
            ))
          )}
          <View style={{ height: 120 }} />
        </ScrollView>

        {/* gu-069: Always-visible SOS + mic */}
        <SOSButton onPress={onSOS ?? (() => {})} />
        <MicFab onPress={onVoiceMic} />
      </View>
    </SafeAreaView>
  );
}

// ── Ride Card ─────────────────────────────────────────────────────────────────

function RideCard({ ride, sf, onRebook }: { ride: RideRecord; sf: (n: number) => number; onRebook: () => void }) {
  const isCompleted = ride.status === 'completed';
  const statusColor = isCompleted ? Colors.success : Colors.sos;
  const statusLabel = isCompleted ? '✅ Completed' : '❌ Cancelled';

  return (
    <View style={styles.rideCard}>
      {/* Status badge + date */}
      <View style={styles.rideCardHeader}>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}>
          <Text style={[styles.statusText, { color: statusColor, fontSize: sf(FontSize.xs) }]}>{statusLabel}</Text>
        </View>
        <Text style={[styles.rideDate, { fontSize: sf(FontSize.xs) }]}>{ride.date} · {ride.timeOfDay}</Text>
      </View>

      {/* Route */}
      <View style={styles.routeRow}>
        <View style={styles.routeDots}>
          <View style={styles.dotGreen} />
          <View style={styles.routeLine} />
          <View style={styles.dotRed} />
        </View>
        <View style={styles.routeAddresses}>
          <Text style={[styles.routeAddress, { fontSize: sf(FontSize.base) }]} numberOfLines={1}>{ride.pickup}</Text>
          <Text style={[styles.routeAddress, { fontSize: sf(FontSize.base) }]} numberOfLines={1}>{ride.destination}</Text>
        </View>
      </View>

      {/* Driver + fare row */}
      {isCompleted && (
        <View style={styles.metaRow}>
          <Text style={[styles.metaDriver, { fontSize: sf(FontSize.sm) }]}>
            👤 {ride.driverName}  ·  {ride.vehicleDescription}
          </Text>
          <Text style={[styles.metaFare, { fontSize: sf(FontSize.base) }]}>{ride.fare}</Text>
        </View>
      )}

      {/* Rebook button — completed rides only */}
      {isCompleted && (
        <TouchableOpacity
          style={styles.rebookButton}
          onPress={onRebook}
          accessibilityLabel={`Rebook ride to ${ride.destination}`}
          accessibilityHint="Opens the booking screen with this destination pre-filled"
          accessibilityRole="button"
        >
          <Text style={[styles.rebookText, { fontSize: sf(FontSize.base) }]}>🔁  Rebook This Ride</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  root: {
    flex: 1,
  },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    minWidth: 80,
    minHeight: TouchTarget.min,
    justifyContent: 'center',
  },
  backArrow: {
    // fontSize set inline via sf() — gu-text-scale
    color: Colors.primary,
    fontWeight: '700',
  },
  screenTitle: {
    // fontSize set inline via sf() — gu-text-scale
    color: Colors.textPrimary,
    fontWeight: '800',
    textAlign: 'center',
    flex: 1,
  },

  // Summary strip
  summaryStrip: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryNumber: {
    // fontSize set inline via sf() — gu-text-scale
    color: '#FFFFFF', // Black on gold strip — WCAG AAA
    fontWeight: '900',
  },
  summaryLabel: {
    // fontSize set inline via sf() — gu-text-scale
    color: 'rgba(0,0,0,0.65)',
    fontWeight: '600',
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginVertical: Spacing.xs,
  },

  // Filter tabs
  filterRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
  },
  filterTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    minHeight: TouchTarget.min,
    justifyContent: 'center',
  },
  filterTabActive: {
    backgroundColor: Colors.primary + '18',
  },
  filterTabText: {
    // fontSize set inline via sf() — gu-text-scale
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: Colors.primary,
    fontWeight: '800',
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },

  // Ride cards
  rideCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    gap: Spacing.md,
  },
  rideCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  statusText: {
    // fontSize set inline via sf() — gu-text-scale
    fontWeight: '700',
  },
  rideDate: {
    // fontSize set inline via sf() — gu-text-scale
    color: Colors.textSecondary,
    fontWeight: '500',
  },

  // Route display
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  routeDots: {
    alignItems: 'center',
    gap: 3,
    width: 16,
  },
  dotGreen: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.success,
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: Colors.border,
  },
  dotRed: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.sos,
  },
  routeAddresses: {
    flex: 1,
    gap: Spacing.md,
  },
  routeAddress: {
    // fontSize set inline via sf() — gu-text-scale
    color: Colors.textPrimary,
    fontWeight: '600',
  },

  // Meta row
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaDriver: {
    // fontSize set inline via sf() — gu-text-scale
    color: Colors.textSecondary,
    flex: 1,
  },
  metaFare: {
    // fontSize set inline via sf() — gu-text-scale
    color: Colors.primary,
    fontWeight: '800',
    marginLeft: Spacing.sm,
  },

  // Rebook button
  rebookButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    minHeight: TouchTarget.min,
    justifyContent: 'center',
  },
  rebookText: {
    // fontSize set inline via sf() — gu-text-scale
    color: '#FFFFFF', // Black on gold — WCAG AAA
    fontWeight: '800',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.sm,
  },
  emptyEmoji: {
    // fontSize set inline via sf() — gu-text-scale
  },
  emptyText: {
    // fontSize set inline via sf() — gu-text-scale
    color: Colors.textSecondary,
    fontWeight: '600',
  },
});
