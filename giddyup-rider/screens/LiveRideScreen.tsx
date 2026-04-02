// GiddyUp Rides — LiveRideScreen.tsx
// gu-007: Live ride in-progress screen (mock data).
// gu-033: Fires ride-status local notifications on phase transitions.
//
// Shows:
//   - Driver card: name, vehicle, plate, rating, photo placeholder
//   - ETA countdown (mock, ticks down every 30s)
//   - Status banner: "Driver on the way" → "Driver arrived" → "Ride in progress" → "Almost there" → "Arrived!"
//   - Destination reminder
//   - SOS button always visible
//   - Cancel ride (before driver arrives)
//   - "I'm Home" / "Rate this ride" CTA at completion
//
// Accessibility-first:
//   - 22pt+ fonts, 60pt+ touch targets
//   - Haptic on all taps (Vibration.vibrate)
//   - accessibilityLabel + accessibilityHint on all interactive elements
//   - Large, plain-language status updates
//   - High-contrast status colors

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Vibration,
  Alert,
} from 'react-native';
import { Colors, FontSize, Radius, Spacing, TouchTarget } from '../constants/theme';
import SOSButton from '../components/SOSButton';
import MicFab from '../components/MicFab';
import { useAccessibility } from '../context/AccessibilityContext';
// gu-012: Google Maps integration
import RideMapView, { LatLng, extractVehicleColor } from '../components/RideMapView';
import {
  MOCK_HOME,
  MOCK_DEFAULT_DESTINATION,
  mockDriverApproachPath,
  mockDriverTripPath,
} from '../constants/mockCoords';
// gu-033: ride-status push notifications
import {
  sendTenMinWarning,
  sendDriverArriving,
  sendRideStarted,
} from '../services/NotificationService';

// ── Types ─────────────────────────────────────────────────────────────────────

type RidePhase =
  | 'driver_coming'     // Driver accepted, en route to rider
  | 'driver_arrived'    // Driver is at pickup
  | 'in_progress'       // Rider in vehicle, heading to destination
  | 'almost_there'      // ~2 min from destination
  | 'completed';        // Arrived at destination

interface LiveRideScreenProps {
  destination?: string;
  driverName?: string;
  driverVehicle?: string;
  driverPlate?: string;
  driverRating?: number;
  onRideComplete?: () => void;
  onCancelRide?: () => void;
  onSOS?: () => void;
  onVoiceMic?: () => void;
}

// ── Mock data ─────────────────────────────────────────────────────────────────

// Phase durations in seconds — shortened for demo/prototype feel
const PHASE_DURATIONS_MS: Record<RidePhase, number> = {
  driver_coming: 25_000,
  driver_arrived: 12_000,
  in_progress: 30_000,
  almost_there: 15_000,
  completed: 0,
};

const PHASE_ORDER: RidePhase[] = [
  'driver_coming',
  'driver_arrived',
  'in_progress',
  'almost_there',
  'completed',
];

// ── LiveRideScreen ─────────────────────────────────────────────────────────────

export default function LiveRideScreen({
  destination = 'Sunview Medical Center',
  driverName = 'Harold T.',
  driverVehicle = '2021 Toyota Camry',
  driverPlate = 'GDY-1138',
  driverRating = 4.9,
  onRideComplete,
  onCancelRide,
  onSOS,
  onVoiceMic,
}: LiveRideScreenProps) {
  const { fontScale } = useAccessibility();
  const sf = (base: number) => Math.round(base * fontScale);

  const [phase, setPhase] = useState<RidePhase>('driver_coming');
  const [etaSeconds, setEtaSeconds] = useState(480); // 8-min mock ETA
  const phaseRef = useRef<RidePhase>('driver_coming');
  phaseRef.current = phase;

  // gu-012: Driver marker position — animated along mock path
  const pickup      = MOCK_HOME;
  const destCoord   = MOCK_DEFAULT_DESTINATION;
  const approachPath = useRef(mockDriverApproachPath(pickup)).current;
  const tripPath     = useRef(mockDriverTripPath(pickup, destCoord)).current;
  const mapStepRef   = useRef(0);
  const [driverCoord, setDriverCoord] = useState<LatLng>(approachPath[0]);

  // ── ETA countdown (ticks every second until in_progress starts) ────────────
  useEffect(() => {
    if (phase === 'driver_coming') {
      const timer = setInterval(() => {
        setEtaSeconds(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [phase]);

  // gu-033: Fire ride-status notifications on phase transitions ───────────────
  // driver_coming  → 10-min warning fires immediately on mount (mock: ETA starts
  //                  at 8 min, simulating real dispatch where ETA was >10 min at
  //                  the moment of booking confirmation)
  // driver_arrived → "Your driver is arriving now"
  // in_progress    → "Your ride has started"
  const notifiedRef = useRef<Set<RidePhase>>(new Set());
  useEffect(() => {
    if (notifiedRef.current.has(phase)) return; // don't double-fire
    notifiedRef.current.add(phase);

    switch (phase) {
      case 'driver_coming':
        // Simulate the 10-min ETA alert that would fire from the server
        sendTenMinWarning(driverName);
        break;
      case 'driver_arrived':
        sendDriverArriving(driverName);
        break;
      case 'in_progress':
        sendRideStarted(destination);
        break;
      default:
        break;
    }
  }, [phase, driverName, destination]);

  // gu-012: Animate driver marker along approach path during driver_coming phase
  useEffect(() => {
    if (phase !== 'driver_coming') return;
    mapStepRef.current = 0;
    const t = setInterval(() => {
      mapStepRef.current = Math.min(mapStepRef.current + 1, approachPath.length - 1);
      setDriverCoord(approachPath[mapStepRef.current]);
    }, PHASE_DURATIONS_MS.driver_coming / approachPath.length);
    return () => clearInterval(t);
  }, [phase]);

  // gu-012: Animate driver marker along trip path during in_progress / almost_there
  useEffect(() => {
    if (phase !== 'in_progress') return;
    mapStepRef.current = 0;
    const totalMs = PHASE_DURATIONS_MS.in_progress + PHASE_DURATIONS_MS.almost_there;
    const t = setInterval(() => {
      mapStepRef.current = Math.min(mapStepRef.current + 1, tripPath.length - 1);
      setDriverCoord(tripPath[mapStepRef.current]);
    }, totalMs / tripPath.length);
    return () => clearInterval(t);
  }, [phase]);

  // ── Auto-advance through ride phases (mock) ────────────────────────────────
  useEffect(() => {
    const idx = PHASE_ORDER.indexOf(phase);
    if (idx < 0 || phase === 'completed') return;

    const duration = PHASE_DURATIONS_MS[phase];
    const timer = setTimeout(() => {
      const nextPhase = PHASE_ORDER[idx + 1];
      if (nextPhase) {
        setPhase(nextPhase);
        Vibration.vibrate(80);
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [phase]);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const formatEta = (secs: number): string => {
    if (secs <= 0) return 'Arriving now';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m} min${m > 1 ? 's' : ''} away` : `${s} sec`;
  };

  const handleCancel = () => {
    Vibration.vibrate(50);
    Alert.alert(
      'Cancel ride?',
      'Are you sure you want to cancel? Your driver is on the way.',
      [
        { text: 'Keep ride', style: 'cancel' },
        {
          text: 'Yes, cancel',
          style: 'destructive',
          onPress: () => {
            Vibration.vibrate(100);
            onCancelRide?.();
          },
        },
      ]
    );
  };

  const handleImHome = () => {
    Vibration.vibrate([0, 60, 40, 60]);
    onRideComplete?.();
  };

  // ── Status config per phase ────────────────────────────────────────────────

  const statusConfig = getStatusConfig(phase, driverName, destination, formatEta(etaSeconds));

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* gu-069: SOSButton is self-positioning via safe area insets */}
      <SOSButton onPress={onSOS ?? (() => {})} />
      {/* gu-068: MicFab — floating voice assistant, bottom-right */}
      <MicFab onPress={onVoiceMic} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status banner */}
        <View style={[styles.statusBanner, { backgroundColor: statusConfig.bannerColor }]}>
          <Text style={styles.statusEmoji}>{statusConfig.emoji}</Text>
          <Text
            style={[styles.statusTitle, { fontSize: sf(FontSize.xl) }]}
            accessibilityRole="header"
            accessibilityLabel={statusConfig.title}
          >
            {statusConfig.title}
          </Text>
          <Text style={[styles.statusSub, { fontSize: sf(FontSize.sm), lineHeight: sf(FontSize.sm) * 1.5 }]}>{statusConfig.subtitle}</Text>
        </View>

        {/* ETA pill — only shown while driver is coming */}
        {phase === 'driver_coming' && (
          <View style={styles.etaPill}>
            <Text style={[styles.etaLabel, { fontSize: sf(FontSize.xs) }]}>ETA</Text>
            <Text
              style={[styles.etaValue, { fontSize: sf(FontSize.base) }]}
              accessibilityLabel={`Estimated time of arrival: ${formatEta(etaSeconds)}`}
            >
              {formatEta(etaSeconds)}
            </Text>
          </View>
        )}

        {/* Driver card */}
        <View style={styles.card}>
          <Text style={[styles.cardHeading, { fontSize: sf(FontSize.xs) }]}>Your driver</Text>

          <View style={styles.driverRow}>
            {/* Avatar placeholder */}
            <View
              style={styles.avatarCircle}
              accessibilityLabel={`Driver ${driverName}'s profile picture`}
            >
              <Text style={[styles.avatarInitial, { fontSize: sf(28) }]}>
                {driverName.charAt(0).toUpperCase()}
              </Text>
            </View>

            <View style={styles.driverInfo}>
              <Text style={[styles.driverName, { fontSize: sf(FontSize.lg) }]}>{driverName}</Text>
              <View style={styles.ratingRow}>
                <Text style={styles.ratingStar}>⭐</Text>
                <Text style={[styles.ratingText, { fontSize: sf(FontSize.sm) }]}>
                  {driverRating.toFixed(1)}
                </Text>
              </View>
            </View>
          </View>

          {/* Vehicle info */}
          <View style={styles.divider} />
          <View style={styles.vehicleRow}>
            <View style={styles.vehicleItem}>
              <Text style={[styles.vehicleLabel, { fontSize: sf(FontSize.xs) }]}>Vehicle</Text>
              <Text style={[styles.vehicleValue, { fontSize: sf(FontSize.sm) }]}>{driverVehicle}</Text>
            </View>
            <View style={styles.vehicleSeparator} />
            <View style={styles.vehicleItem}>
              <Text style={[styles.vehicleLabel, { fontSize: sf(FontSize.xs) }]}>Plate</Text>
              <Text
                style={[styles.vehicleValue, styles.plateText, { fontSize: sf(FontSize.sm) }]}
                accessibilityLabel={`License plate: ${driverPlate}`}
              >
                {driverPlate}
              </Text>
            </View>
          </View>
        </View>

        {/* Destination card */}
        <View style={styles.card}>
          <Text style={[styles.cardHeading, { fontSize: sf(FontSize.xs) }]}>Destination</Text>
          <View style={styles.destRow}>
            <Text style={styles.destPin}>📍</Text>
            <Text
              style={[styles.destText, { fontSize: sf(FontSize.base), lineHeight: sf(FontSize.base) * 1.45 }]}
              accessibilityLabel={`Your destination is ${destination}`}
            >
              {destination}
            </Text>
          </View>
        </View>

        {/* gu-012: Live map — driver marker animates along mock path */}
        <RideMapView
          pickup={pickup}
          destination={destCoord}
          driverCoord={phase !== 'completed' ? driverCoord : undefined}
          vehicleColor={extractVehicleColor(driverVehicle)}
          showRoute
          height={270}
        />

        {/* Action buttons */}
        <View style={styles.actionsBlock}>
          {phase === 'completed' ? (
            /* Ride complete — primary CTA */
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleImHome}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="I'm home"
              accessibilityHint="Tap to confirm you've arrived safely and finish the ride"
            >
              <Text style={[styles.primaryBtnText, { fontSize: sf(FontSize.base) }]}>🏠  I'm Home</Text>
            </TouchableOpacity>
          ) : phase === 'driver_coming' ? (
            /* Can still cancel before driver arrives */
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={handleCancel}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Cancel ride"
              accessibilityHint="Tap to cancel your current ride request"
            >
              <Text style={[styles.cancelBtnText, { fontSize: sf(FontSize.sm) }]}>Cancel ride</Text>
            </TouchableOpacity>
          ) : (
            /* In-progress — nothing to do but wait */
            <View style={styles.inProgressNote}>
              <Text style={[styles.inProgressText, { fontSize: sf(FontSize.sm), lineHeight: sf(FontSize.sm) * 1.55 }]}>
                Sit back and relax 🤠{'\n'}Your driver has everything under control.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Status config helper ───────────────────────────────────────────────────────

function getStatusConfig(
  phase: RidePhase,
  driverName: string,
  destination: string,
  etaStr: string
): { title: string; subtitle: string; emoji: string; bannerColor: string } {
  switch (phase) {
    case 'driver_coming':
      return {
        emoji: '🚗',
        title: 'Driver on the way',
        subtitle: `${driverName} is heading to your pickup — ${etaStr}`,
        bannerColor: Colors.primaryDark, // gu-020: was hardcoded green
      };
    case 'driver_arrived':
      return {
        emoji: '🙋',
        title: 'Your driver is here!',
        subtitle: `Look for ${driverName} outside. They're waiting for you.`,
        bannerColor: Colors.primaryDark, // gu-020: was hardcoded green
      };
    case 'in_progress':
      return {
        emoji: '🛣️',
        title: 'Ride in progress',
        subtitle: `On the way to ${destination}.`,
        bannerColor: Colors.primaryDark, // gu-020: was hardcoded green
      };
    case 'almost_there':
      return {
        emoji: '🏁',
        title: 'Almost there!',
        subtitle: `Just a couple of minutes to ${destination}.`,
        bannerColor: Colors.primary,
      };
    case 'completed':
      return {
        emoji: '✅',
        title: `You've arrived!`,
        subtitle: `Welcome to ${destination}. Hope the ride was great!`,
        bannerColor: Colors.surface,  // Navy — white text high contrast ✅
      };
  }
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },

  // ── Status banner
  statusBanner: {
    paddingTop: 56,
    paddingBottom: 28,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
  },
  statusEmoji: {
    fontSize: FontSize.hero, // decorative status emoji — intentionally large
    marginBottom: Spacing.sm,
  },
  statusTitle: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  statusSub: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.82)',
    textAlign: 'center',
    lineHeight: 26,
  },

  // ── ETA pill
  etaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 10,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  etaLabel: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  etaValue: {
    fontSize: FontSize.base,
    fontWeight: '800',
    color: Colors.primary,
  },

  // ── Cards
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.lg,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeading: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: Spacing.md,
  },

  // ── Driver row
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: '#000000', // Black on gold avatar — WCAG AAA
  },
  driverInfo: {
    flex: 1,
    gap: 4,
  },
  driverName: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingStar: {
    fontSize: FontSize.xs,
  },
  ratingText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },

  // ── Vehicle row
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleItem: {
    flex: 1,
    gap: 4,
  },
  vehicleSeparator: {
    width: 1,
    height: 36,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
  },
  vehicleLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  vehicleValue: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  plateText: {
    fontFamily: 'monospace',
    letterSpacing: 1.5,
    color: Colors.primary,
  },

  // ── Destination
  destRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  destPin: {
    fontSize: FontSize.base,
    marginTop: 1,
  },
  destText: {
    flex: 1,
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.textPrimary,
    lineHeight: 30,
  },

  // ── Map placeholder
  mapPlaceholder: {
    marginHorizontal: Spacing.lg,
    height: 180,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    gap: 6,
  },
  mapEmoji: {
    fontSize: FontSize.hero, // decorative map placeholder emoji
  },
  mapLabel: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.primary,
  },
  mapSub: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },

  // ── Actions
  actionsBlock: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 20,
    alignItems: 'center',
    minHeight: TouchTarget.large,
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontSize: FontSize.base,
    fontWeight: '800',
    color: '#000000',  // Black on gold = 8.6:1 ✅
  },
  cancelBtn: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingVertical: 18,
    alignItems: 'center',
    minHeight: TouchTarget.min,
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  inProgressNote: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  inProgressText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: '600',
  },
});
