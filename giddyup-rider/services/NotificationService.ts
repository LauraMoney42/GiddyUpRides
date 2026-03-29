/**
 * NotificationService.ts — gu-033
 * Push / local notification helpers for Giddy-Up Rider.
 *
 * Three ride-status notifications (all fire as immediate local notifications
 * so they work when the app is open, backgrounded, OR closed):
 *
 *   1. sendTenMinWarning()  — "Your driver is 10 minutes away"
 *   2. sendDriverArriving() — "Your driver is arriving now"
 *   3. sendRideStarted()    — "Your ride has started"
 *
 * Notification taps are handled in App.tsx via
 * Notifications.addNotificationResponseReceivedListener → navigate to liveRide.
 *
 * Permission:
 *   requestPermissions() is called from NotificationPermissionScreen during
 *   onboarding. If the user skips or denies we degrade gracefully — ride still
 *   works, they just won't get push alerts.
 */

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — expo-notifications types resolve after `npx expo install`
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// ── Notification handler (must be set before any notification fires) ──────────
// Shows alert + plays sound when a notification arrives while app is in foreground.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ── Android channel ───────────────────────────────────────────────────────────
// Required on Android 8+. Call once at app startup (idempotent).
export async function setupAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('ride-status', {
    name: 'Ride Status',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 80, 60, 80],
    sound: 'default',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    bypassDnd: false,
  });
}

// ── Permission request ────────────────────────────────────────────────────────

/**
 * Request notification permissions.
 * Returns true if granted, false if denied/undetermined.
 * Safe to call multiple times — iOS only shows the system dialog once.
 */
export async function requestPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: false,
      allowSound: true,
      allowCriticalAlerts: false, // doesn't bypass DND — appropriate for a rides app
    },
  });

  return status === 'granted';
}

/**
 * Check current permission status without prompting.
 */
export async function hasPermission(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

// ── Ride status notifications ─────────────────────────────────────────────────

/**
 * "Your driver is 10 minutes away"
 * Fire this when driver ETA first crosses the 10-minute threshold.
 * In the mock prototype this fires immediately when LiveRideScreen mounts
 * (simulating a real dispatch where ETA starts at >10 min).
 */
export async function sendTenMinWarning(driverName: string): Promise<void> {
  await _send(
    '🚗  Driver on the way',
    `${driverName} is about 10 minutes away. Get ready!`,
    'ride-status',
  );
}

/**
 * "Your driver is arriving now"
 * Fire when ride phase transitions to driver_arrived.
 */
export async function sendDriverArriving(driverName: string): Promise<void> {
  await _send(
    '🙋  Your driver is here!',
    `${driverName} has arrived at your pickup location.`,
    'ride-status',
  );
}

/**
 * "Your ride has started"
 * Fire when ride phase transitions to in_progress.
 */
export async function sendRideStarted(destination: string): Promise<void> {
  await _send(
    '🛣️  Ride in progress',
    `On the way to ${destination}. Sit back and relax!`,
    'ride-status',
  );
}

// ── Deep-link tap listener setup ──────────────────────────────────────────────

/**
 * Register a listener that fires when the user taps a notification.
 * Returns an unsubscribe function — call it in your useEffect cleanup.
 *
 * onTap receives the notification identifier so the caller can navigate
 * to the appropriate screen (typically LiveRideScreen).
 *
 * Usage in App.tsx:
 *   useEffect(() => {
 *     return listenForNotificationTaps(() => setScreen('liveRide'));
 *   }, []);
 */
export function listenForNotificationTaps(onTap: () => void): () => void {
  const sub = Notifications.addNotificationResponseReceivedListener(() => {
    onTap();
  });
  return () => sub.remove();
}

// ── Internal helper ───────────────────────────────────────────────────────────

async function _send(title: string, body: string, channelId: string): Promise<void> {
  // Silently no-op if permission not granted rather than crashing
  const granted = await hasPermission();
  if (!granted) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: 'default',
      // Android channel
      ...(Platform.OS === 'android' ? { channelId } : {}),
      // Data payload — read in tap listener to decide which screen to open
      data: { screen: 'liveRide' },
    },
    // Immediate (trigger: null → fires right away)
    trigger: null,
  });
}
