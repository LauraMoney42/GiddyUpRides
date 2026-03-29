// GiddyUp Rides — HomeScreen.tsx
// gu-044: Nav redesign + Favorites horizontal scroll fix.
//
// Layout changes:
//   - SOS → compact red pill in header top-right (always visible)
//   - Settings removed from header → bottom nav (right item)
//   - Floating SOSButton removed
//   - Favorites: 3-col fixed grid → horizontal ScrollView (no text clipping at XL/XXL)
//   - Persistent bottom nav bar: Favorites (left) | Mic/gold circle (center) | Settings (right)
//   - onVoiceMic prop → triggers VoiceAssistantOverlay from App.tsx
//
// Accessibility-first design per MVP1 spec:
//   - 22pt+ base font, large touch targets (60pt min)
//   - SOS button always visible (now in header)
//   - Tap-only gestures (no swipes)
//   - High-contrast colors, plain language

import React, { useRef } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { useAccessibility } from '../context/AccessibilityContext';

// ── Types ────────────────────────────────────────────────────────────────────

interface RecentRide {
  id: string;
  destination: string;
  date: string;
  status: 'completed' | 'cancelled';
  fare: string;
}

// gu-favorites-label-001: Favorites data — up to 4 shown as pill rows; "See All →" if more.
const FAVORITES = [
  { emoji: '🏥', label: 'Doctor',   hint: 'Book a ride to a medical appointment' },
  { emoji: '🛒', label: 'Grocery',  hint: 'Book a ride to the grocery store' },
  { emoji: '🏠', label: 'Home',     hint: 'Book a ride to go home' },
  { emoji: '💊', label: 'Pharmacy', hint: 'Book a ride to the pharmacy' },
] as const;

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
  onSettings?: () => void;
  onViewHistory?: () => void;
  onScheduleRide?: () => void;    // gu-018
  onViewScheduled?: () => void;   // gu-018
  onSOS?: () => void;
  onVoiceMic?: () => void;        // gu-044: bottom nav mic → opens VoiceAssistantOverlay
}

export default function HomeScreen({
  userName = 'there',
  onBookRide,
  onSettings,
  onViewHistory,
  onScheduleRide,
  onViewScheduled,
  onSOS,
  onVoiceMic,
}: HomeScreenProps) {
  const { fontScale } = useAccessibility();
  const sf = (base: number) => Math.round(base * fontScale);
  const greeting = getGreeting();

  // gu-044: scroll ref so "Favorites" nav tap scrolls to the section
  const scrollRef = useRef<ScrollView>(null);
  const favYRef   = useRef<number>(0);

  const scrollToFavorites = () => {
    Vibration.vibrate(30);
    scrollRef.current?.scrollTo({ y: favYRef.current - 8, animated: true });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.root}>

        {/* ── Header — greeting only; SOS is absolutely positioned below ── */}
        {/* gu-sos-position-001: paddingRight reserves space so long names never slide behind the SOS button */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { fontSize: sf(FontSize.sm) }]}>{greeting},</Text>
            <Text style={[styles.userName, { fontSize: sf(FontSize.xl) }]} numberOfLines={1} adjustsFontSizeToFit>{userName}</Text>
          </View>
        </View>

        {/* gu-sos-position-001: SOS absolutely positioned — life-safety button, always visible.
            Decoupled from header flex so long names / large text CANNOT displace it. */}
        <TouchableOpacity
          style={styles.sosFab}
          onPress={() => { Vibration.vibrate(100); onSOS?.(); }}
          accessibilityRole="button"
          accessibilityLabel="SOS emergency button"
          accessibilityHint="Tap for help — calls 911 or contacts your emergency contacts"
        >
          <Text style={styles.sosFabText}>SOS</Text>
        </TouchableOpacity>

        {/* ── Scrollable content ────────────────────────────────────────── */}
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Main CTA */}
          <BookRideCard
            onBookRide={onBookRide}
            onScheduleRide={onScheduleRide}
            onViewScheduled={onViewScheduled}
          />

          {/* ── Favorites ─────────────────────────────────────────────── */}
          {/* onLayout captures Y so the bottom nav "Favorites" button can scroll here */}
          <View
            style={styles.sectionHeader}
            onLayout={(e) => { favYRef.current = e.nativeEvent.layout.y; }}
          >
            <Text style={[styles.sectionTitle, { fontSize: sf(FontSize.lg) }]}>Favorites</Text>
          </View>

          {/* gu-favorites-label-001: Pill list — full-width rows, large icon left + label right.
               Max 4 shown; "See All →" link appears when there are more. */}
          <View
            style={styles.favPillList}
            accessibilityRole="list"
            accessibilityLabel="Favorite destinations"
          >
            {FAVORITES.slice(0, 4).map((fav) => (
              <FavoritePill
                key={fav.label}
                emoji={fav.emoji}
                label={fav.label}
                hint={fav.hint}
                onPress={onBookRide}
                sf={sf}
              />
            ))}
            {FAVORITES.length > 4 && (
              <TouchableOpacity
                style={styles.favSeeAll}
                accessibilityRole="button"
                accessibilityLabel="See all favorites"
              >
                <Text style={[styles.favSeeAllText, { fontSize: sf(FontSize.sm) }]}>See All →</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ── Recent Rides ──────────────────────────────────────────── */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { fontSize: sf(FontSize.lg) }]}>Recent Rides</Text>
            {onViewHistory && (
              <TouchableOpacity
                onPress={() => { Vibration.vibrate(30); onViewHistory(); }}
                accessibilityLabel="View all ride history"
                accessibilityRole="button"
                style={styles.viewAllButton}
              >
                <Text style={styles.viewAllText}>View All →</Text>
              </TouchableOpacity>
            )}
          </View>

          {MOCK_RECENT_RIDES.length > 0 ? (
            MOCK_RECENT_RIDES.map((ride) => (
              <RecentRideCard key={ride.id} ride={ride} onRebook={onBookRide} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🚗</Text>
              <Text style={styles.emptyText}>No rides yet.</Text>
              <Text style={styles.emptySubtext}>Your ride history will appear here.</Text>
            </View>
          )}

          {/* Padding so last card clears the bottom nav bar */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* ── Persistent bottom nav bar ─────────────────────────────────── */}
        {/* gu-044: Favorites | Mic (gold circle) | Settings */}
        <View style={styles.bottomNav}>

          {/* Left: Favorites */}
          <TouchableOpacity
            style={styles.bottomNavItem}
            onPress={scrollToFavorites}
            accessibilityRole="button"
            accessibilityLabel="Favorites"
            accessibilityHint="Scroll to your favourite destinations"
          >
            <Ionicons name="star" size={sf(24)} color={Colors.primary} />
            <Text
              style={[styles.bottomNavLabel, { fontSize: sf(FontSize.xs) }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >Favorites</Text>
          </TouchableOpacity>

          {/* Center: Voice mic — large gold circle, raised above bar */}
          <TouchableOpacity
            style={[styles.bottomNavMic, { width: sf(72), height: sf(72), borderRadius: sf(36) }]}
            onPress={() => { Vibration.vibrate(60); onVoiceMic?.(); }}
            accessibilityRole="button"
            accessibilityLabel="Voice assistant"
            accessibilityHint="Tap to speak a command — book a ride, check upcoming rides, and more"
          >
            <Ionicons name="mic" size={sf(32)} color="#000000" />
          </TouchableOpacity>

          {/* Right: Settings */}
          <TouchableOpacity
            style={styles.bottomNavItem}
            onPress={() => { Vibration.vibrate(50); onSettings?.(); }}
            accessibilityRole="button"
            accessibilityLabel="Settings"
            accessibilityHint="Open app settings and accessibility options"
          >
            <Ionicons name="settings-outline" size={sf(24)} color={Colors.textSecondary} />
            <Text
              style={[styles.bottomNavLabel, { fontSize: sf(FontSize.xs) }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >Settings</Text>
          </TouchableOpacity>

        </View>
      </View>
    </SafeAreaView>
  );
}

// ── Book Ride Card ────────────────────────────────────────────────────────────

function BookRideCard({
  onBookRide,
  onScheduleRide,
  onViewScheduled,
}: {
  onBookRide?: () => void;
  onScheduleRide?: () => void;
  onViewScheduled?: () => void;
}) {
  const { fontScale } = useAccessibility();
  const sf = (base: number) => Math.round(base * fontScale);
  return (
    <View style={styles.bookCard}>
      {/* gu-home-layout-001: "Where are you going?" heading + subtitle removed — reclaim vertical space */}

      {/* Primary: Get a Ride — gu-045: renamed, emoji pinned left, label centered */}
      <TouchableOpacity
        style={[styles.bookButton, { alignSelf: 'stretch' }]}
        onPress={() => { Vibration.vibrate(50); onBookRide?.(); }}
        accessibilityLabel="Get a ride now"
        accessibilityHint="Opens the ride booking screen. You will be able to enter your destination."
        accessibilityRole="button"
      >
        {/* Emoji pinned to left in fixed-width container */}
        <View style={styles.bookButtonIconWrap}>
          <Text style={[styles.bookButtonIcon, { fontSize: sf(28) }]}>🚗</Text>
        </View>
        {/* Label fills remaining space and centers itself */}
        <Text style={[styles.bookButtonText, { fontSize: sf(FontSize.lg) }]}>Get a Ride</Text>
        {/* Right spacer mirrors the icon width so text is truly centered */}
        <View style={styles.bookButtonIconWrap} />
      </TouchableOpacity>

      {/* gu-018: Schedule ahead — gu-045: emoji pinned left, text centered */}
      <TouchableOpacity
        style={[styles.scheduleButton, { alignSelf: 'stretch' }]}
        onPress={() => { Vibration.vibrate(40); onScheduleRide?.(); }}
        accessibilityLabel="Schedule a ride in advance"
        accessibilityHint="Book a ride for a future date and time, like a doctor appointment"
        accessibilityRole="button"
      >
        <View style={styles.scheduleButtonIconWrap}>
          <Text style={{ fontSize: sf(20) }}>🗓</Text>
        </View>
        <Text style={[styles.scheduleButtonText, { fontSize: sf(FontSize.base) }]}>Schedule a Ride</Text>
        <View style={styles.scheduleButtonIconWrap} />
      </TouchableOpacity>

      {/* gu-018: Upcoming rides link */}
      {onViewScheduled && (
        <TouchableOpacity
          style={[styles.upcomingLink, { minHeight: sf(44) }]}
          onPress={() => { Vibration.vibrate(30); onViewScheduled(); }}
          accessibilityLabel="View upcoming scheduled rides"
          accessibilityRole="button"
        >
          <Text style={[styles.upcomingLinkText, { fontSize: sf(FontSize.sm) }]}>View Upcoming Rides</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Favorite Pill ─────────────────────────────────────────────────────────────
// gu-favorites-label-001: Full-width horizontal row — large icon left, label right.
// Text can never wrap or truncate (flex: 1 on label). Min 60pt tap target.

function FavoritePill({
  emoji,
  label,
  hint,
  onPress,
  sf,
}: {
  emoji: string;
  label: string;
  hint: string;
  onPress?: () => void;
  sf: (n: number) => number;
}) {
  return (
    <TouchableOpacity
      style={[styles.favPill, { minHeight: sf(TouchTarget.min) }]}
      onPress={() => { Vibration.vibrate(50); onPress?.(); }}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
    >
      <Text style={{ fontSize: sf(28) }}>{emoji}</Text>
      <Text style={[styles.favPillLabel, { fontSize: sf(FontSize.base) }]}>{label}</Text>
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
  const { fontScale } = useAccessibility();
  const sf = (base: number) => Math.round(base * fontScale);
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
        style={[
          styles.rebookButton,
          {
            paddingHorizontal: sf(Spacing.md),
            paddingVertical: sf(Spacing.sm),
            minHeight: sf(TouchTarget.min),
          },
        ]}
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

  // ── Header ─────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    // gu-sos-position-001: right padding reserves 88pt (72pt button + 16pt gap) so
    // the greeting text block never slides behind the absolutely-positioned SOS FAB.
    paddingRight: 88,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  greeting: {
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  userName: {
    color: Colors.textPrimary,
    fontWeight: '800',
  },
  // gu-sos-position-001: absolutely positioned FAB — completely decoupled from layout.
  // zIndex 200 keeps it above all content including modals/overlays rendered in root.
  sosFab: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.lg,
    zIndex: 200,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#D62828',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D62828',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 10,
  },
  sosFabText: {
    color: '#FFFFFF',
    fontSize: FontSize.sm,
    fontWeight: '900',
    letterSpacing: 1,
  },

  // ── Scroll ─────────────────────────────────────────────────────────────────
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,  // gu-home-layout-001: more breathing room below header
  },

  // ── Book Ride Card ──────────────────────────────────────────────────────────
  bookCard: {
    // gu-home-layout-001: hero text removed — padding tightened, buttons fill the card
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bookButton: {
    // gu-045: row layout — emoji left, label centered, mirror spacer right
    // gu-home-layout-001: minHeight reduced from TouchTarget.large (72) → min (60)
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    minHeight: TouchTarget.min,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  // Fixed-width container for emoji — keeps label truly centered
  bookButtonIconWrap: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookButtonIcon: {
    // fontSize set inline via sf(28) so it scales with text-size preference
  },
  bookButtonText: {
    flex: 1,
    color: '#000000',
    fontWeight: '900',
    textAlign: 'center',
  },
  scheduleButton: {
    // gu-045: row layout — emoji left, label centered, mirror spacer right
    // gu-home-layout-001: minHeight reduced from TouchTarget.large (72) → min (60)
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(200,150,62,0.12)',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    marginTop: Spacing.md,
    minHeight: TouchTarget.min,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  scheduleButtonIconWrap: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleButtonText: {
    flex: 1,
    color: Colors.primary,
    fontWeight: '700',
    textAlign: 'center',
  },
  upcomingLink: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    marginTop: Spacing.xs,
  },
  upcomingLinkText: {
    color: Colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },

  // ── Section headers ─────────────────────────────────────────────────────────
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
    marginTop: Spacing.xs,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontWeight: '800',
  },
  viewAllButton: {
    minHeight: TouchTarget.min,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xs,
  },
  viewAllText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '700',
  },

  // ── Favorites pill list ──────────────────────────────────────────────────────
  // gu-favorites-label-001: Full-width rows — no truncation possible at any font size.
  favPillList: {
    marginBottom: Spacing.lg,
  },
  favPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  favPillLabel: {
    color: Colors.textPrimary,
    fontWeight: '700',
    flex: 1,             // takes all remaining space — label never wraps or truncates
  },
  favSeeAll: {
    alignItems: 'flex-end',
    paddingVertical: Spacing.sm,
  },
  favSeeAllText: {
    color: Colors.primary,
    fontWeight: '700',
  },

  // ── Recent ride cards ───────────────────────────────────────────────────────
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
    color: '#000000',
    fontSize: FontSize.sm,
    fontWeight: '700',
  },

  // ── Empty state ─────────────────────────────────────────────────────────────
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.sm,
  },
  emptyEmoji: {
    fontSize: FontSize.hero,
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

  // ── Bottom nav bar ──────────────────────────────────────────────────────────
  // gu-044: persistent 3-item bar — Favorites | Mic (gold circle) | Settings
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,  // extra breathing room above iPhone home indicator
    paddingHorizontal: Spacing.lg,
  },
  bottomNavItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: TouchTarget.min,
    paddingVertical: Spacing.sm,
  },
  bottomNavLabel: {
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  // Center mic button — raised gold circle (the primary action)
  bottomNavMic: {
    backgroundColor: Colors.primary,  // Warm gold — black icon = 8.6:1 ✅
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing.lg,
    marginTop: -24,  // lift above the nav bar to make it the visual hero
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 10,
  },
});
