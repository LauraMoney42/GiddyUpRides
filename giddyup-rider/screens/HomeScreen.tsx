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

import React, { useRef, useMemo } from 'react';
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
import SOSButton from '../components/SOSButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // gu-074: inline mic + bottom padding

// ── Types ────────────────────────────────────────────────────────────────────

interface RecentRide {
  id: string;
  destination: string;
  date: string;
  status: 'completed' | 'cancelled';
  fare: string;
}

// gu-favorites-label-001: Favorites data — up to 4 shown as pill rows; "See All →" if more.
// Labels match favoriteAddresses keys in AccessibilityContext: home, grocery, park, doctor
const FAVORITES = [
  { emoji: '🏥', label: 'Doctor',  hint: 'Book a ride to a medical appointment' },
  { emoji: '🛒', label: 'Grocery', hint: 'Book a ride to the grocery store' },
  { emoji: '🏠', label: 'Home',    hint: 'Book a ride to go home' },
  { emoji: '🌳', label: 'Park',    hint: 'Book a ride to the park' },
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

// gu-067: Western-themed rotating greetings — {name} replaced with userName at runtime
const WESTERN_GREETINGS = [
  'Ready to saddle up, {name}?',
  'Time to ride off into the sunset, {name}!',
  'Howdy, {name}! Where we headed?',
  'Yeehaw, {name}! Let\'s hit the trail!',
  'Well, well, {name} — the trail awaits!',
  'Giddy up, {name}! Your ride\'s a-waitin\'.',
  'Tighten your boots, {name} — let\'s ride!',
  'Good to see ya, {name}! Which way to the horizon?',
];

// ── HomeScreen ────────────────────────────────────────────────────────────────

interface HomeScreenProps {
  userName?: string;
  onBookRide?: () => void;
  onBookRideTo?: (destination: string, skipDestinationStep?: boolean) => void; // gu-070: skip step 1 when address is known
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
  onBookRideTo,
  onSettings,
  onViewHistory,
  onScheduleRide,
  onViewScheduled,
  onSOS,
  onVoiceMic,
}: HomeScreenProps) {
  const { fontScale, prefs } = useAccessibility();
  const sf = (base: number) => Math.round(base * fontScale);
  const insets = useSafeAreaInsets(); // gu-074: bottom padding for nav bar

  // gu-067: Pick a random western greeting once per mount; embed userName
  const greeting = useMemo(() => {
    const template = WESTERN_GREETINGS[Math.floor(Math.random() * WESTERN_GREETINGS.length)];
    return template.replace('{name}', userName);
  }, [userName]);

  // gu-fav-prefill-001: Merge saved addresses into favorites list.
  // Saved address shown as subtitle; tapping calls onBookRideTo(address) to pre-fill BookingScreen.
  const fav = prefs.favoriteAddresses;
  const DYNAMIC_FAVORITES = FAVORITES.map(f => ({
    ...f,
    savedAddress:
      f.label === 'Doctor'  ? fav.doctor  :
      f.label === 'Grocery' ? fav.grocery :
      f.label === 'Home'    ? fav.home    :
      f.label === 'Park'    ? fav.park    :
      '',
  }));

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
        {/* gu-sos-position-001: paddingRight reserves space so greeting never slides behind SOS button */}
        <View style={styles.header}>
          {/* gu-067: full western phrase with name embedded; shrinks to fit at large font scales */}
          <Text
            style={[styles.userName, { fontSize: sf(FontSize.lg) }]}
            numberOfLines={2}
            adjustsFontSizeToFit
          >
            {greeting}
          </Text>
        </View>

        {/* gu-069: SOSButton shared component — self-positioning via safe area insets */}
        <SOSButton onPress={onSOS ?? (() => {})} />

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
               gu-fav-prefill-001: Shows saved address subtitle; tapping pre-fills BookingScreen. */}
          <View
            style={styles.favPillList}
            accessibilityRole="list"
            accessibilityLabel="Favorite destinations"
          >
            {DYNAMIC_FAVORITES.slice(0, 4).map((item) => (
              <FavoritePill
                key={item.label}
                emoji={item.emoji}
                label={item.label}
                hint={item.hint}
                savedAddress={item.savedAddress}
                onPress={
                  // gu-070: skip destination step when a real address is saved.
                  // Saved address → skip step 1, go straight to driver selection.
                  // No saved address → pre-fill with label but still show step 1
                  // so the user can confirm/edit the destination.
                  onBookRideTo
                    ? () => onBookRideTo(
                        item.savedAddress || item.label,
                        !!item.savedAddress,  // true = skip step 1 (address known)
                      )
                    : onBookRide
                }
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
                <Text style={[styles.viewAllText, { fontSize: sf(FontSize.sm) }]}>View All →</Text>
              </TouchableOpacity>
            )}
          </View>

          {MOCK_RECENT_RIDES.length > 0 ? (
            MOCK_RECENT_RIDES.map((ride) => (
              <RecentRideCard key={ride.id} ride={ride} onRebook={onBookRide} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyEmoji, { fontSize: sf(FontSize.hero) }]}>🚗</Text>
              <Text style={[styles.emptyText, { fontSize: sf(FontSize.lg) }]}>No rides yet.</Text>
              <Text style={[styles.emptySubtext, { fontSize: sf(FontSize.base) }]}>Your ride history will appear here.</Text>
            </View>
          )}

          {/* Padding so last card clears the bottom nav bar */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* ── Persistent bottom nav bar ─────────────────────────────────── */}
        {/* gu-074: Settings (left) | Favorites (centre) | Mic inline (right)
            paddingBottom uses safeAreaInsets.bottom so nav sits flush with
            the home indicator — no dead space beneath it. */}
        <View style={[styles.bottomNav, { paddingBottom: insets.bottom + Spacing.xs }]}>

          {/* Left: Settings */}
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

          {/* Centre: Favorites */}
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

          {/* Right: Mic — large gold circle, inline with bar */}
          <TouchableOpacity
            style={styles.bottomNavMic}
            onPress={() => { Vibration.vibrate(40); onVoiceMic?.(); }}
            accessibilityRole="button"
            accessibilityLabel="Voice assistant"
            accessibilityHint="Tap to speak a command — book a ride, check upcoming rides, and more"
          >
            <Ionicons name="mic" size={sf(28)} color="#000000" />
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
        style={[styles.bookButton, { alignSelf: 'stretch', height: sf(64) }]}
        onPress={() => { Vibration.vibrate(50); onBookRide?.(); }}
        accessibilityLabel="Get a ride now"
        accessibilityHint="Opens the ride booking screen. You will be able to enter your destination."
        accessibilityRole="button"
      >
        {/* Emoji pinned to left in fixed-width container */}
        <View style={styles.bookButtonIconWrap}>
          <Text style={[styles.bookButtonIcon, { fontSize: sf(20) }]}>🚗</Text>
        </View>
        {/* Label fills remaining space and centers itself */}
        <Text style={[styles.bookButtonText, { fontSize: sf(FontSize.base) }]}>Get a Ride</Text>
        {/* Right spacer mirrors the icon width so text is truly centered */}
        <View style={styles.bookButtonIconWrap} />
      </TouchableOpacity>

      {/* gu-018: Schedule ahead — gu-045: emoji pinned left, text centered */}
      <TouchableOpacity
        style={[styles.scheduleButton, { alignSelf: 'stretch', height: sf(64) }]}
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
  savedAddress,
  onPress,
  sf,
}: {
  emoji: string;
  label: string;
  hint: string;
  savedAddress?: string;
  onPress?: () => void;
  sf: (n: number) => number;
}) {
  const hasSaved = savedAddress && savedAddress.trim().length > 0;
  return (
    <TouchableOpacity
      style={[styles.favPill, { minHeight: sf(TouchTarget.min) }, hasSaved && styles.favPillSaved]}
      onPress={() => { Vibration.vibrate(50); onPress?.(); }}
      accessibilityRole="button"
      accessibilityLabel={hasSaved ? `${label}: ${savedAddress}` : label}
      accessibilityHint={hasSaved ? `Books a ride to your saved ${label.toLowerCase()} address` : hint}
    >
      <Text style={{ fontSize: sf(28) }}>{emoji}</Text>
      <View style={styles.favPillTextCol}>
        <Text style={[styles.favPillLabel, { fontSize: sf(FontSize.base) }]}>{label}</Text>
        {hasSaved && (
          <Text
            style={[styles.favPillAddress, { fontSize: sf(FontSize.xs) }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {savedAddress}
          </Text>
        )}
      </View>
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
        <Text style={[styles.rideDestination, { fontSize: sf(FontSize.base) }]}>{ride.destination}</Text>
        <Text style={[styles.rideDate, { fontSize: sf(FontSize.sm) }]}>{ride.date}</Text>
        <Text style={[styles.rideFare, { fontSize: sf(FontSize.sm) }]}>{ride.fare}</Text>
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
        <Text style={[styles.rebookText, { fontSize: sf(FontSize.sm) }]}>Rebook</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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
    // gu-058: fixed height (applied inline via sf(64)) so both primary buttons are always identical
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.lg,
    overflow: 'hidden',
  },
  // Fixed-width container for emoji — keeps label truly centered
  bookButtonIconWrap: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookButtonIcon: {
    // fontSize set inline via sf(20) — matches scheduleButton emoji size
  },
  bookButtonText: {
    flex: 1,
    color: '#000000',
    fontWeight: '900',
    textAlign: 'center',
  },
  scheduleButton: {
    // gu-045: row layout — emoji left, label centered, mirror spacer right
    // gu-058: fixed height (applied inline via sf(64)) — must match bookButton exactly
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(200,150,62,0.12)',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    overflow: 'hidden',
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
  // gu-fav-prefill-001: gold border when a saved address is set
  favPillSaved: {
    borderColor: Colors.primary,
    borderWidth: 1.5,
  },
  // Column wrapper when address subtitle is present
  favPillTextCol: {
    flex: 1,
    gap: 2,
  },
  favPillLabel: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  favPillAddress: {
    color: Colors.textSecondary,
    fontWeight: '500',
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
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  rideDate: {
    color: Colors.textSecondary,
  },
  rideFare: {
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
    fontWeight: '700',
  },

  // ── Empty state ─────────────────────────────────────────────────────────────
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.sm,
  },
  emptyEmoji: {
  },
  emptyText: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  emptySubtext: {
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  // ── Bottom nav bar ──────────────────────────────────────────────────────────
  // gu-074: Settings (left) | Favorites (centre) | Mic inline (right)
  // paddingBottom applied inline via insets.bottom so it never overlaps home indicator
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    // paddingBottom set inline: insets.bottom + Spacing.xs
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
  // gu-074: Inline gold mic circle — sits in the nav row, not floating above it
  bottomNavMic: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
});
