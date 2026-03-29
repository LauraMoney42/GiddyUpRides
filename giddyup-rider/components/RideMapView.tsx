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
import { View, Text, StyleSheet, Platform } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { Colors, Radius } from '../constants/theme';

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

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Calculate a region that fits both pickup and destination with padding.
 * For the prototype this is a simple bounding box — replace with
 * Google Directions API bounds once real keys land.
 */
function regionForCoords(a: LatLng, b: LatLng, padding = 1.6): Region {
  const midLat  = (a.latitude  + b.latitude)  / 2;
  const midLng  = (a.longitude + b.longitude) / 2;
  const deltaLat = Math.abs(a.latitude  - b.latitude)  * padding;
  const deltaLng = Math.abs(a.longitude - b.longitude) * padding;
  return {
    latitude:       midLat,
    longitude:      midLng,
    latitudeDelta:  Math.max(deltaLat, 0.02),  // min zoom so we don't over-zoom on nearby points
    longitudeDelta: Math.max(deltaLng, 0.02),
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function RideMapView({
  pickup,
  destination,
  driverCoord,
  showRoute = true,
  height = 260,
  onReady,
}: Props) {
  const region = regionForCoords(pickup, destination);

  return (
    <View style={[styles.container, { height }]}>
      <MapView
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={region}
        region={driverCoord ? undefined : region}  // let map animate freely when driver is moving
        showsUserLocation={false}       // we manage location ourselves
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        scrollEnabled={false}           // tap-only per accessibility spec — no scroll/pan
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        onMapReady={onReady}
        accessibilityLabel="Ride map showing your pickup location and destination"
        accessibilityElementsHidden={false}
      >
        {/* Pickup marker */}
        <Marker
          coordinate={pickup}
          title="Your pickup"
          description="Where your driver will meet you"
          pinColor={Colors.primary}
          accessibilityLabel="Pickup location marker"
        >
          <View style={styles.pickupMarker}>
            <Text style={styles.markerEmoji}>📍</Text>
            <View style={[styles.markerLabel, { backgroundColor: Colors.primary }]}>
              <Text style={styles.markerLabelText}>Pickup</Text>
            </View>
          </View>
        </Marker>

        {/* Destination marker */}
        <Marker
          coordinate={destination}
          title="Your destination"
          pinColor={Colors.sos}
          accessibilityLabel="Destination marker"
        >
          <View style={styles.destMarker}>
            <Text style={styles.markerEmoji}>🏁</Text>
            <View style={[styles.markerLabel, { backgroundColor: Colors.sos }]}>
              <Text style={styles.markerLabelText}>Drop-off</Text>
            </View>
          </View>
        </Marker>

        {/* Driver marker — shown during live ride */}
        {driverCoord && (
          <Marker
            coordinate={driverCoord}
            title="Your driver"
            anchor={{ x: 0.5, y: 0.5 }}
            accessibilityLabel="Driver location marker"
          >
            <View style={styles.driverMarker}>
              <Text style={styles.driverEmoji}>🚗</Text>
            </View>
          </Marker>
        )}

        {/* Route polyline — straight line for mock; replace with Directions API path */}
        {showRoute && (
          <Polyline
            coordinates={[pickup, destination]}
            strokeColor={Colors.primary}
            strokeWidth={3}
            lineDashPattern={[8, 4]}
          />
        )}
      </MapView>

      {/* Prototype badge — remove once real API key is wired */}
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
  map: {
    ...StyleSheet.absoluteFillObject,
  },

  // Markers
  pickupMarker: {
    alignItems: 'center',
  },
  destMarker: {
    alignItems: 'center',
  },
  markerEmoji: {
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
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 4,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  driverEmoji: {
    fontSize: 22,
  },

  // Mock badge
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
