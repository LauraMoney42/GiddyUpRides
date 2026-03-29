/**
 * RideMapView.tsx
 * gu-012: Reusable mock map component for the Giddy-Up rider app.
 *
 * Expo Go compatible — uses pure React Native views (no react-native-maps native module).
 * Route drawn as L-shaped road segments following the grid, not a diagonal line.
 * Driver marker uses vehicle color so it matches the booked car.
 *
 * Swap for full MapView + Directions API when running a dev build with Google Maps key.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius } from '../constants/theme';
import { useAccessibility } from '../context/AccessibilityContext';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LatLng {
  latitude: number;
  longitude: number;
}

interface Props {
  /** Rider's pickup location */
  pickup?: LatLng;
  /** Ride destination */
  destination?: LatLng;
  /** Optional live driver position (triggers driver marker) */
  driverCoord?: LatLng;
  /** Show L-shaped route between pickup and destination */
  showRoute?: boolean;
  /** Map height — defaults to 260 */
  height?: number;
  /** Vehicle color name e.g. "Silver", "Red", "Blue" — used to color driver marker */
  vehicleColor?: string;
  /** Called when map is ready */
  onReady?: () => void;
}

// ── Color helpers ─────────────────────────────────────────────────────────────

/** Maps common vehicle color names → hex values for the car marker. */
function vehicleColorToHex(name?: string): string {
  if (!name) return Colors.primary;
  switch (name.toLowerCase().trim()) {
    case 'silver': case 'grey': case 'gray':    return '#9E9E9E';
    case 'white':                                return '#E0E0E0';
    case 'black':                                return '#212121';
    case 'red':                                  return '#D32F2F';
    case 'blue':                                 return '#1565C0';
    case 'green':                                return '#2E7D32';
    case 'gold': case 'yellow':                  return '#F9A825';
    case 'orange':                               return '#E65100';
    case 'brown': case 'bronze':                 return '#795548';
    case 'beige': case 'tan':                    return '#D7CCC8';
    case 'purple': case 'violet':                return '#6A1B9A';
    default:                                     return Colors.primary;
  }
}

/** Extract color word from a vehicle string like "2021 Toyota Camry (Silver)" */
export function extractVehicleColor(vehicleString?: string): string | undefined {
  if (!vehicleString) return undefined;
  // Match text inside parens e.g. "(Silver)"
  const match = vehicleString.match(/\(([^)]+)\)/);
  if (match) return match[1];
  // Fallback: check for known color words anywhere in the string
  const colorWords = ['silver','grey','gray','white','black','red','blue','green','gold','yellow','orange','brown','beige','tan','purple'];
  const lower = vehicleString.toLowerCase();
  for (const c of colorWords) {
    if (lower.includes(c)) return c.charAt(0).toUpperCase() + c.slice(1);
  }
  return undefined;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function RideMapView({
  driverCoord,
  showRoute = true,
  height = 260,
  vehicleColor,
  onReady,
}: Props) {
  React.useEffect(() => { onReady?.(); }, []);

  const { fontScale } = useAccessibility();
  const sf = (base: number) => Math.round(base * fontScale);

  const carColor = vehicleColorToHex(vehicleColor);
  // Decide text color for car label based on background brightness
  const isDark = ['#212121', '#1565C0', '#2E7D32', '#D32F2F', '#6A1B9A', '#E65100'].includes(carColor);
  const carTextColor = isDark ? '#fff' : '#333';

  return (
    <View
      style={[styles.container, { height }]}
      accessibilityLabel="Ride map showing your pickup location and destination"
    >
      {/* ── Map background ──────────────────────────────────────────────── */}
      <View style={styles.mapBg}>

        {/* Road grid — 2 horizontal + 2 vertical streets */}
        <View style={[styles.roadH, { top: '38%' }]} />
        <View style={[styles.roadH, { top: '68%' }]} />
        <View style={[styles.roadV, { left: '32%' }]} />
        <View style={[styles.roadV, { left: '62%' }]} />

        {/* ── L-shaped route ─────────────────────────────────────────────
            Route: Pickup (bottom-left) → right along bottom road →
                   turn north → Drop-off (top-right)
            Segments follow the road grid, no diagonal.
        ─────────────────────────────────────────────────────────────── */}
        {showRoute && (
          <>
            {/* Horizontal segment — along bottom road from pickup to corner */}
            <View style={styles.routeH} />
            {/* Vertical segment — up from corner to drop-off */}
            <View style={styles.routeV} />
            {/* Corner dot — smooth the turn */}
            <View style={styles.routeCorner} />
          </>
        )}

        {/* Pickup pin — bottom left */}
        <View style={[styles.pinContainer, { bottom: '18%', left: '16%' }]}>
          <Text style={[styles.pinEmoji, { fontSize: sf(22) }]}>📍</Text>
          <View style={[styles.markerLabel, { backgroundColor: Colors.primary }]}>
            <Text style={[styles.markerLabelText, { fontSize: sf(11) }]}>Pickup</Text>
          </View>
        </View>

        {/* Drop-off pin — top right */}
        <View style={[styles.pinContainer, { top: '10%', right: '12%' }]}>
          <Text style={[styles.pinEmoji, { fontSize: sf(22) }]}>🏁</Text>
          <View style={[styles.markerLabel, { backgroundColor: '#D32F2F' }]}>
            <Text style={[styles.markerLabelText, { fontSize: sf(11) }]}>Drop-off</Text>
          </View>
        </View>

        {/* Driver/car marker — color matches booked vehicle */}
        {driverCoord && (
          <View style={[styles.carMarker, { backgroundColor: carColor, top: '42%', left: '38%' }]}>
            <Text style={[styles.carEmoji, { color: carTextColor }]}>🚗</Text>
          </View>
        )}
      </View>

      {/* Prototype badge */}
      <View style={styles.mockBadge} pointerEvents="none">
        <Text style={[styles.mockBadgeText, { fontSize: sf(11) }]}>📍 Mock map — real GPS coming soon</Text>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const ROUTE_COLOR = Colors.primary;
const ROUTE_WIDTH = 5;

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#DDE2E8',
  },
  mapBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#EAF2EA',
  },

  // Road grid
  roadH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 10,
    backgroundColor: '#D0DDD0',
  },
  roadV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 10,
    backgroundColor: '#D0DDD0',
  },

  // L-shaped route:
  // Horizontal: from left 18% to left 64% at bottom 30%
  routeH: {
    position: 'absolute',
    bottom: '30%',
    left: '18%',
    right: '36%',       // = left 64%
    height: ROUTE_WIDTH,
    backgroundColor: ROUTE_COLOR,
    opacity: 0.85,
    borderRadius: 3,
  },
  // Vertical: from top 12% down to bottom 30%
  routeV: {
    position: 'absolute',
    left: '62%',        // aligns with right end of routeH
    top: '12%',
    bottom: '30%',
    width: ROUTE_WIDTH,
    backgroundColor: ROUTE_COLOR,
    opacity: 0.85,
    borderRadius: 3,
  },
  // Corner dot to smooth the L-turn
  routeCorner: {
    position: 'absolute',
    left: '61%',
    bottom: '29%',
    width: ROUTE_WIDTH + 2,
    height: ROUTE_WIDTH + 2,
    borderRadius: (ROUTE_WIDTH + 2) / 2,
    backgroundColor: ROUTE_COLOR,
    opacity: 0.85,
  },

  // Pins
  pinContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  pinEmoji: {
    fontSize: 26,
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

  // Car marker — colored to match vehicle
  carMarker: {
    position: 'absolute',
    borderRadius: 18,
    padding: 5,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.7)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  carEmoji: {
    fontSize: 20,
  },

  // Prototype badge
  mockBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.50)',
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
