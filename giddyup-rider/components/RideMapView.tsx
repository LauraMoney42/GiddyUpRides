/**
 * RideMapView.tsx
 * gu-012: Reusable map component for the Giddy-Up rider app.
 *
 * Displays:
 *   - Pickup marker (green pin)
 *   - Destination marker (red pin)
 *   - Optional driver marker (car emoji, animated when liveDriver provided)
 *   - Polyline route between pickup → destination
 *
 * Mock coordinates used for prototype — swap for real GPS + Directions API when
 * user provides their Google Maps API key (see app.json placeholder keys).
 *
 * Usage:
 *   <RideMapView pickup={PICKUP_COORD} destination={DEST_COORD} />
 *   <RideMapView pickup={...} destination={...} driverCoord={...} showRoute />
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius } from '../constants/theme';
// react-native-maps requires a native build — using mock map view for Expo Go prototype.
// Swap this component for the full MapView implementation when running a dev build.

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LatLng {
  latitude: number;
  longitude: number;
}

interface Props {
  /** Rider's pickup location */
  pickup: LatLng;
  /** Ride destination */
  destination: LatLng;
  /** Optional live driver position (shown as 🚗 marker) */
  driverCoord?: LatLng;
  /** Show a straight polyline between pickup and destination */
  showRoute?: boolean;
  /** Map height — defaults to 260 */
  height?: number;
  /** Called when map is ready */
  onReady?: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function RideMapView({
  driverCoord,
  height = 260,
  onReady,
}: Props) {
  // Notify parent that mock map is "ready" immediately
  React.useEffect(() => { onReady?.(); }, []);

  return (
    <View
      style={[styles.container, { height }]}
      accessibilityLabel="Ride map showing your pickup location and destination"
    >
      {/* Mock map background */}
      <View style={styles.mapBg}>
        {/* Simulated road grid */}
        <View style={styles.roadH} />
        <View style={[styles.roadH, { top: '55%' }]} />
        <View style={styles.roadV} />
        <View style={[styles.roadV, { left: '60%' }]} />

        {/* Route line */}
        <View style={styles.routeLine} />

        {/* Pickup pin */}
        <View style={[styles.pinContainer, { bottom: '25%', left: '20%' }]}>
          <Text style={styles.pinEmoji}>📍</Text>
          <View style={[styles.markerLabel, { backgroundColor: Colors.primary }]}>
            <Text style={styles.markerLabelText}>Pickup</Text>
          </View>
        </View>

        {/* Destination pin */}
        <View style={[styles.pinContainer, { top: '15%', right: '15%' }]}>
          <Text style={styles.pinEmoji}>🏁</Text>
          <View style={[styles.markerLabel, { backgroundColor: Colors.sos }]}>
            <Text style={styles.markerLabelText}>Drop-off</Text>
          </View>
        </View>

        {/* Driver marker — shown during live ride */}
        {driverCoord && (
          <View style={[styles.driverMarker, { top: '45%', left: '42%' }]}>
            <Text style={styles.driverEmoji}>🚗</Text>
          </View>
        )}
      </View>

      {/* Prototype badge */}
      <View style={styles.mockBadge} pointerEvents="none">
        <Text style={styles.mockBadgeText}>📍 Mock map — real GPS coming soon</Text>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#DDE2E8',
  },
  mapBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#E8F0E8',
  },
  roadH: {
    position: 'absolute',
    top: '35%',
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: '#C8D4C8',
  },
  roadV: {
    position: 'absolute',
    left: '35%',
    top: 0,
    bottom: 0,
    width: 8,
    backgroundColor: '#C8D4C8',
  },
  routeLine: {
    position: 'absolute',
    bottom: '28%',
    left: '22%',
    width: '60%',
    height: 3,
    backgroundColor: Colors.primary,
    opacity: 0.7,
    transform: [{ rotate: '-25deg' }],
  },
  pinContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  pinEmoji: {
    fontSize: 28,
  },
  markerLabel: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 2,
  },
  markerLabelText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  driverMarker: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 4,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  driverEmoji: {
    fontSize: 22,
  },
  mockBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  mockBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '500',
  },
});
