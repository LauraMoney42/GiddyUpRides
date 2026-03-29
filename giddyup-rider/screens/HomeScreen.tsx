// GiddyUp Rides — HomeScreen.tsx
// Main home screen for the rider app.
// Accessibility-first design per MVP1 spec:
//   - 22pt+ base font, large touch targets (60pt min)
//   - SOS button always visible
//   - Tap-only gestures (no swipes)
//   - Confirmation dialog before booking
//   - Read-aloud friendly labels on all interactive elements
//   - High-contrast colors, plain language

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

// ── Types ────────────────────────────────────────────────────────────────────

interface RecentRide {
  id: string;
  destination: string;
  date: string;
  status: 'completed' | 'cancelled';
  fare: string;
}

// Mock recent rides — replaced by Firestore query (gu-002) once Firebase is wired
const MOCK_RECENT_RIDES: RecentRide[] = [
  {
    id: '1',
    destination: 'Sunview Medical Center',
    date: 'Today, 10:30 AM',
    status: 'completed',
    fare: '$12.50',
  },
  {
    id: '2',
    destination: 'Green Valley Grocery',
    date: 'Yesterday, 2:15 PM',
    status: 'completed',
    fare: '$8.00',
  },
  {
    id: '3',
    destination: 'Pine Ridge Senior Center',
    date: 'Mar 27, 9:00 AM',
    status: 'completed',
    fare: '$15.75',
  },
];

// ── HomeScreen ────────────────────────────────────────────────────────────────

interface HomeScreenProps {
  userName?: string;
  onBookRide?: () => void;
}

export default function HomeScreen({
  userName = 'there',
  onBookRide,
}: HomeScreenProps) {
  const greeting = getGreeting();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.root}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting},</Text>
            <Text style={styles.userName}>{userName} 👋</Text>
          </View>
          {/* Settings icon — navigates to accessibility settings */}
          <TouchableOpacity
            style={styles.settingsButton}
            accessibilityLabel="Settings"
            accessibilityHint="Open app settings and accessibility options"
            accessibilityRole="button"
          >
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Main Book-a-Ride CTA ───────────────────────────────────── */}
          <BookRideCard onBookRide={onBookRide} />

          {/* ── Quick Actions ──────────────────────────────────────────── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>
          <View style={styles.quickActions}>
            <QuickActionButton
              emoji="🏥"
              label="Doctor"
              hint="Book a ride to a medical appointment"
              onPress={onBookRide}
            />
            <QuickActionButton
              emoji="🛒"
              label="Grocery"
              hint="Book a ride to the grocery store"
              onPress={onBookRide}
            />
            <QuickActionButton
              emoji="🏠"
              label="Home"
              hint="Book a ride to go home"
              onPress={onBookRide}
            />
          </View>

          {/* ── Recent Rides ───────────────────────────────────────────── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Rides</Text>
          </View>

          {MOCK_RECENT_RIDES.length > 0 ? (
            MOCK_RECENT_RIDES.map((ride) => (
              <RecentRideCard key={ride.id} ride={ride} onRebook={onBookRide} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🚗</Text>
              <Text style={styles.emptyText}>No rides yet.</Text>
              <Text style={styles.emptySubtext}>
                Your ride history will appear here.
              </Text>
            </View>
          )}

          {/* Bottom padding so SOS button doesn't cover last card */}
          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Always-visible SOS button */}
        <SOSButton />
      </View>
    </SafeAreaView>
  );
}

// ── Book Ride Card ────────────────────────────────────────────────────────────

function BookRideCard({ onBookRide }: { onBookRide?: () => void }) {
  const handlePress = () => {
    Vibration.vibrate(50);
    onBookRide?.();
  };

  return (
    <View style={styles.bookCard}>
      <Text style={styles.bookCardTitle}>Where are you going?</Text>
      <Text style={styles.bookCardSubtitle}>
        Tap below to book your ride
      </Text>
      <TouchableOpacity
        style={styles.bookButton}
        onPress={handlePress}
        accessibilityLabel="Book a ride"
        accessibilityHint="Opens the ride booking screen. You will be able to enter your destination."
        accessibilityRole="button"
      >
        <Text style={styles.bookButtonIcon}>🚗</Text>
        <Text style={styles.bookButtonText}>Book a Ride</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Quick Action Button ───────────────────────────────────────────────────────

function QuickActionButton({
  emoji,
  label,
  hint,
  onPress,
}: {
  emoji: string;
  label: string;
  hint: string;
  onPress?: () => void;
}) {
  const handlePress = () => {
    Vibration.vibrate(50);
    onPress?.();
  };

  return (
    <TouchableOpacity
      style={styles.quickAction}
      onPress={handlePress}
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityRole="button"
    >
      <Text style={styles.quickActionEmoji}>{emoji}</Text>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── Recent Ride Card ──────────────────────────────────────────────────────────

function RecentRideCard({
  ride,
  onRebook,
}: {
  ride: RecentRide;
  onRebook?: () => void;
}) {
  const handleRebook = () => {
    Vibration.vibrate(50);
    onRebook?.();
  };

  return (
    <View style={styles.rideCard}>
      <View style={styles.rideCardLeft}>
        <Text style={styles.rideDestination}>{ride.destination}</Text>
        <Text style={styles.rideDate}>{ride.date}</Text>
        <Text style={styles.rideFare}>{ride.fare}</Text>
      </View>
      <TouchableOpacity
        style={styles.rebookButton}
        onPress={handleRebook}
        accessibilityLabel={`Rebook ride to ${ride.destination}`}
        accessibilityHint="Books a new ride to this same destination"
        accessibilityRole="button"
      >
        <Text style={styles.rebookText}>Rebook</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
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

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  greeting: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  userName: {
    fontSize: FontSize.xl,
    color: Colors.textPrimary,
    fontWeight: '800',
  },
  settingsButton: {
    width: TouchTarget.min,
    height: TouchTarget.min,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: {
    fontSize: 28,
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },

  // Book Ride Card
  bookCard: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  bookCardTitle: {
    fontSize: FontSize.xl,
    color: '#FFFFFF',
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  bookCardSubtitle: {
    fontSize: FontSize.base,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    minHeight: TouchTarget.xl,
    gap: Spacing.sm,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  bookButtonIcon: {
    fontSize: 28,
  },
  bookButtonText: {
    fontSize: FontSize.lg,
    color: Colors.primary,
    fontWeight: '900',
  },

  // Section headers
  sectionHeader: {
    marginBottom: Spacing.sm,
    marginTop: Spacing.xs,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
    fontWeight: '800',
  },

  // Quick actions
  quickActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  quickAction: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    minHeight: TouchTarget.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.xs,
  },
  quickActionEmoji: {
    fontSize: 32,
  },
  quickActionLabel: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: '700',
    textAlign: 'center',
  },

  // Recent ride cards
  rideCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rideCardLeft: {
    flex: 1,
    gap: Spacing.xs,
  },
  rideDestination: {
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  rideDate: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  rideFare: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '700',
  },
  rebookButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: TouchTarget.min,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rebookText: {
    color: '#FFFFFF',
    fontSize: FontSize.sm,
    fontWeight: '700',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.sm,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyText: {
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  emptySubtext: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
