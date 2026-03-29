/**
 * mockCoords.ts
 * gu-012: Mock GPS coordinates for prototype map screens.
 * Replace with real expo-location coords when API keys land.
 * All coords are in a fictional suburb layout for demo purposes.
 */

import { LatLng } from '../components/RideMapView';

// Base location — rider's home address (mock)
export const MOCK_HOME: LatLng = {
  latitude:  37.7749,
  longitude: -122.4194,
};

// Common destinations matching mock ride history
export const MOCK_DESTINATIONS: Record<string, LatLng> = {
  'Sunview Medical Center':    { latitude: 37.7849, longitude: -122.4094 },
  'Green Valley Grocery':      { latitude: 37.7699, longitude: -122.4294 },
  'Pine Ridge Senior Center':  { latitude: 37.7799, longitude: -122.4394 },
  'First National Bank':       { latitude: 37.7649, longitude: -122.4144 },
  "St. Mary's Church":         { latitude: 37.7709, longitude: -122.4044 },
  'Riverside Pharmacy':        { latitude: 37.7829, longitude: -122.4244 },
};

// Default destination for BookingScreen when user types a custom address
export const MOCK_DEFAULT_DESTINATION: LatLng = {
  latitude:  37.7849,
  longitude: -122.4094,
};

/**
 * Simulate a driver approaching the pickup location.
 * Returns an array of coordinates representing the driver's path.
 * Used in LiveRideScreen to animate the car marker.
 */
export function mockDriverApproachPath(pickup: LatLng, steps = 8): LatLng[] {
  // Start the driver ~0.02 degrees away (roughly 1.5 miles)
  const startLat = pickup.latitude  - 0.018;
  const startLng = pickup.longitude + 0.015;
  return Array.from({ length: steps }, (_, i) => ({
    latitude:  startLat + (pickup.latitude  - startLat) * (i / (steps - 1)),
    longitude: startLng + (pickup.longitude - startLng) * (i / (steps - 1)),
  }));
}

/**
 * Simulate the driver traveling from pickup to destination.
 */
export function mockDriverTripPath(pickup: LatLng, destination: LatLng, steps = 10): LatLng[] {
  return Array.from({ length: steps }, (_, i) => ({
    latitude:  pickup.latitude  + (destination.latitude  - pickup.latitude)  * (i / (steps - 1)),
    longitude: pickup.longitude + (destination.longitude - pickup.longitude) * (i / (steps - 1)),
  }));
}
