/**
 * App.tsx — Giddy-Up Rider
 * gu-010: Full onboarding flow (splash → textSize → readAloud → slides → nameSetup → home).
 * gu-007: LiveRideScreen wired — booking confirms → live ride → home.
 * gu-014: SOSScreen wired — any screen's SOSButton.onSOS → sos → returns to prevScreen.
 * gu-018: ScheduleRideScreen + ScheduledRidesScreen wired. scheduledRides stored in root state.
 * gu-028: VoiceAssistantOverlay wired globally — mic button on all main screens, intent → nav.
 * gu-029: MobilitySetupScreen wired — nameSetup → mobilitySetup → home; also in settings.
 * gu-033: NotificationPermissionScreen wired — mobilitySetup → notificationPermission → home.
 *         Notification tap-listener registered → deep-links to liveRide.
 * gu-019: EmergencyContactScreen onboarding step wired — slides → emergencyContactOnboarding → nameSetup.
 * gu-onboarding-favorites-001: FavoritesSetupScreen wired — nameSetup → favoritesSetup → mobilitySetup.
 *
 * ─────────────────────────────────────────────────────────────────
 * ONBOARDING ORDER — HARD RULE (gu-031)
 *   The first two post-splash screens MUST always be:
 *     1. textSize   (Text Size preference)
 *     2. readAloud  (Read Aloud / TTS preference)
 *   These must remain steps 2 and 3, directly after splash, every
 *   time. Do NOT insert, reorder, or move them without explicit PM
 *   sign-off. Accessibility prefs must be set before any content
 *   is shown to the rider.
 * ─────────────────────────────────────────────────────────────────
 *
 * Complete onboarding flow (do NOT reorder):
 *   1. splash           → WelcomeSplashScreen
 *   2. textSize         → TextSizeScreen        ← LOCKED step 2
 *   3. readAloud        → ReadAloudScreen        ← LOCKED step 3
 *   4. legalDisclaimer  → LegalDisclaimerScreen (gu-032, shown once)
 *   5. slides                    → OnboardingSlides
 *   6. emergencyContactOnboarding → EmergencyContactScreen (gu-019, isOnboarding, skippable)
 *   7. nameSetup                 → NameSetupScreen
 *   8. favoritesSetup            → FavoritesSetupScreen          (gu-onboarding-favorites-001, skippable)
 *   9. mobilitySetup             → MobilitySetupScreen          (gu-029, skippable)
 *  10. notificationPermission    → NotificationPermissionScreen  (gu-033, skippable)
 *  11. home                      → HomeScreen
 *
 * Post-onboarding screens:
 *   booking         → BookingScreen → liveRide
 *   liveRide        → LiveRideScreen → home
 *   scheduleRide    → ScheduleRideScreen → home  (gu-018)
 *   scheduledRides  → ScheduledRidesScreen       (gu-018)
 *   sos             → SOSScreen → prevScreen
 *   history         → RideHistoryScreen
 *   settings        → SettingsScreen
 *   emergencyContacts → EmergencyContactScreen   (gu-019)
 *   mobilitySettings  → MobilitySetupScreen      (gu-029, edit mode)
 */

import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFonts } from 'expo-font';
import { Rye_400Regular } from '@expo-google-fonts/rye'; // gu-052: western slab-serif for splash title
import { AccessibilityProvider, useAccessibility } from './context/AccessibilityContext';
import WelcomeSplashScreen from './screens/onboarding/WelcomeSplashScreen';
import OnboardingSlides from './screens/onboarding/OnboardingSlides';
import NameSetupScreen from './screens/onboarding/NameSetupScreen';
import TextSizeScreen from './screens/welcome/TextSizeScreen';
import ReadAloudScreen from './screens/welcome/ReadAloudScreen';
import HomeScreen from './screens/HomeScreen';
import BookingScreen from './screens/BookingScreen';
import LiveRideScreen from './screens/LiveRideScreen';
import SOSScreen from './screens/SOSScreen';
import RideHistoryScreen from './screens/RideHistoryScreen';
import SettingsScreen from './screens/SettingsScreen';
import ScheduleRideScreen, { ScheduledRide } from './screens/ScheduleRideScreen';
import ScheduledRidesScreen from './screens/ScheduledRidesScreen';
import EmergencyContactScreen from './screens/EmergencyContactScreen'; // gu-019
import MobilitySetupScreen from './screens/onboarding/MobilitySetupScreen'; // gu-029
import FavoritesSetupScreen from './screens/onboarding/FavoritesSetupScreen'; // gu-onboarding-favorites-001
import LegalDisclaimerScreen from './screens/onboarding/LegalDisclaimerScreen'; // gu-032
import NotificationPermissionScreen from './screens/onboarding/NotificationPermissionScreen'; // gu-033
import VoiceAssistantOverlay, { VoiceIntent } from './components/VoiceAssistantOverlay'; // gu-028
import { listenForNotificationTaps, setupAndroidChannel } from './services/NotificationService'; // gu-033
import { Colors } from './constants/theme';
import { SafeAreaProvider } from 'react-native-safe-area-context'; // gu-069: required for useSafeAreaInsets in SOSButton/MicButton

type Screen =
  | 'splash' | 'slides' | 'textSize' | 'readAloud' | 'legalDisclaimer'
  | 'nameSetup' | 'favoritesSetup' | 'mobilitySetup' | 'notificationPermission'  // gu-033, gu-onboarding-favorites-001
  | 'emergencyContactOnboarding'       // gu-019 — onboarding step (slides → here → nameSetup)
  | 'home' | 'booking' | 'liveRide' | 'sos' | 'history' | 'settings'
  | 'scheduleRide' | 'scheduledRides'  // gu-018
  | 'emergencyContacts'                // gu-019 — settings edit
  | 'mobilitySettings'                 // gu-029 — edit from Settings
  | 'favoritesSettings';               // gu-onboarding-favorites-001 — edit from Settings

// gu-018: Seed mock data so ScheduledRidesScreen isn't empty on first visit
const MOCK_SEED_RIDES: ScheduledRide[] = [
  { id: 'seed-1', destination: 'Sunview Medical Center', date: 'Tue, Apr 1',  time: '10:00 AM', dateISO: '2026-04-01' },
  { id: 'seed-2', destination: 'Green Valley Grocery',   date: 'Thu, Apr 3',  time: '2:00 PM',  dateISO: '2026-04-03' },
];

// RootNavigator is a child of AccessibilityProvider so it can read prefs via useAccessibility()
function RootNavigator() {
  const { prefs } = useAccessibility();
  const [screen, setScreen] = useState<Screen>('splash');
  const prevScreenRef = React.useRef<Screen>('home');
  const userName = prefs.userName ?? 'there';

  // gu-018: Scheduled rides stored in root state — passed down to both screens
  const [scheduledRides, setScheduledRides] = useState<ScheduledRide[]>(MOCK_SEED_RIDES);

  // gu-044: HomeScreen bottom nav mic → open VoiceAssistantOverlay programmatically
  // Incrementing this counter triggers the overlay's openTrigger useEffect.
  const [voiceTrigger, setVoiceTrigger] = useState(0);

  // gu-fav-prefill-001: Store destination chosen from HomeScreen favorites
  // so BookingScreen can pre-fill the destination input.
  const bookingDestRef = useRef<string>('');
  // gu-070: when a Favorite with a saved address is tapped, skip BookingScreen
  // step 1 (destination picker) and go straight to step 2 (driver selection).
  const bookingSkipStepRef = useRef<boolean>(false);

  // gu-033: Set up Android notification channel + register tap deep-link listener
  useEffect(() => {
    setupAndroidChannel(); // no-op on iOS
    // Notification tap → navigate to liveRide (rider tapped a ride-status alert)
    return listenForNotificationTaps(() => setScreen('liveRide'));
  }, []);

  // gu-014: Navigate to SOS, remembering origin screen
  const goSOS = () => { prevScreenRef.current = screen; setScreen('sos'); };

  // gu-028: Voice assistant intent handler — routes spoken commands to nav actions
  const handleVoiceIntent = (intent: VoiceIntent) => {
    switch (intent) {
      case 'book_ride':      setScreen('booking');        break;
      case 'schedule_ride':  setScreen('scheduleRide');   break;
      case 'view_upcoming':  setScreen('scheduledRides'); break;
      case 'go_home':        setScreen('home');           break;
      case 'open_settings':  setScreen('settings');       break;
      case 'trigger_sos':    goSOS();                     break;
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style={screen === 'splash' ? 'light' : 'dark'} />

      {screen === 'splash'    && <WelcomeSplashScreen onGetStarted={() => setScreen('textSize')} />}
      {screen === 'textSize'  && <TextSizeScreen onNext={() => setScreen('readAloud')} />}
      {screen === 'readAloud' && <ReadAloudScreen onDone={() => setScreen('legalDisclaimer')} />}
      {/* gu-032: Legal disclaimer — shown once, accepted before any content */}
      {screen === 'legalDisclaimer' && (
        <LegalDisclaimerScreen onAccept={() => setScreen('slides')} />
      )}
      {screen === 'slides'    && (
        <OnboardingSlides onDone={() => setScreen('emergencyContactOnboarding')} onBack={() => setScreen('readAloud')} />
      )}
      {/* gu-019: Emergency contact onboarding step — skippable, saves to prefs.emergencyContacts */}
      {screen === 'emergencyContactOnboarding' && (
        <EmergencyContactScreen
          isOnboarding
          onDone={() => setScreen('nameSetup')}
        />
      )}
      {screen === 'nameSetup' && (
        <NameSetupScreen onDone={() => setScreen('favoritesSetup')} onBack={() => setScreen('slides')} />
      )}
      {/* gu-onboarding-favorites-001: Onboarding step 5 — save favourite place addresses */}
      {screen === 'favoritesSetup' && (
        <FavoritesSetupScreen
          isOnboarding
          onDone={() => setScreen('mobilitySetup')}
        />
      )}
      {/* gu-029: Onboarding step 6 — mobility & accessibility profile */}
      {screen === 'mobilitySetup' && (
        <MobilitySetupScreen
          isOnboarding
          onDone={() => setScreen('notificationPermission')}
        />
      )}
      {/* gu-033: Onboarding step 5 — notification permission request */}
      {screen === 'notificationPermission' && (
        <NotificationPermissionScreen onDone={() => setScreen('home')} />
      )}

      {screen === 'home' && (
        <HomeScreen
          userName={userName}
          onBookRide={() => { bookingDestRef.current = ''; bookingSkipStepRef.current = false; setScreen('booking'); }}
          onBookRideTo={(dest, skip) => { bookingDestRef.current = dest; bookingSkipStepRef.current = skip ?? false; setScreen('booking'); }} // gu-070
          onSettings={() => setScreen('settings')}
          onViewHistory={() => setScreen('history')}
          onScheduleRide={() => setScreen('scheduleRide')}
          onViewScheduled={() => setScreen('scheduledRides')}
          onSOS={goSOS}
          onVoiceMic={() => setVoiceTrigger(n => n + 1)} // gu-044: bottom nav mic
        />
      )}

      {screen === 'booking' && (
        <BookingScreen
          onBack={() => setScreen('home')}
          onRideConfirmed={() => setScreen('liveRide')}
          onSOS={goSOS}
          initialDestination={bookingDestRef.current}
          skipDestinationStep={bookingSkipStepRef.current} // gu-070
          onVoiceMic={() => setVoiceTrigger(n => n + 1)} // gu-066: bottom nav mic
        />
      )}
      {screen === 'liveRide' && (
        <LiveRideScreen onRideComplete={() => setScreen('home')} onCancelRide={() => setScreen('home')} onSOS={goSOS} onVoiceMic={() => setVoiceTrigger(n => n + 1)} />
      )}

      {/* gu-018: Schedule a ride in advance */}
      {screen === 'scheduleRide' && (
        <ScheduleRideScreen
          onBack={() => setScreen('home')}
          onConfirm={(ride) => {
            setScheduledRides(prev => [...prev, ride]);
            setScreen('scheduledRides');
          }}
          onSOS={goSOS}
          onVoiceMic={() => setVoiceTrigger(n => n + 1)}
        />
      )}

      {/* gu-018: Upcoming scheduled rides list */}
      {screen === 'scheduledRides' && (
        <ScheduledRidesScreen
          rides={scheduledRides}
          onCancel={(id) => setScheduledRides(prev => prev.filter(r => r.id !== id))}
          onScheduleNew={() => setScreen('scheduleRide')}
          onBack={() => setScreen('home')}
          onSOS={goSOS}
          onVoiceMic={() => setVoiceTrigger(n => n + 1)}
        />
      )}

      {screen === 'sos' && (
        <SOSScreen userName={userName} onDismiss={() => setScreen(prevScreenRef.current)} />
      )}
      {screen === 'history' && (
        <RideHistoryScreen
          onBack={() => setScreen('home')}
          onRebook={(dest) => { bookingDestRef.current = dest ?? ''; setScreen('booking'); }}
          onSOS={goSOS}
          onVoiceMic={() => setVoiceTrigger(n => n + 1)}
        />
      )}
      {screen === 'settings' && (
        <SettingsScreen
          userName={userName}
          onBack={() => setScreen('home')}
          onSignOut={() => setScreen('splash')}
          onEmergencyContacts={() => setScreen('emergencyContacts')}
          onMobilitySettings={() => setScreen('mobilitySettings')}
          onFavoriteSettings={() => setScreen('favoritesSettings')}
          onSOS={goSOS}
          onVoiceMic={() => setVoiceTrigger(n => n + 1)}
        />
      )}
      {/* gu-019: Emergency contact setup */}
      {screen === 'emergencyContacts' && (
        <EmergencyContactScreen onBack={() => setScreen('settings')} />
      )}
      {/* gu-029: Edit mobility/accessibility profile from Settings */}
      {screen === 'mobilitySettings' && (
        <MobilitySetupScreen
          onDone={() => setScreen('settings')}
          onBack={() => setScreen('settings')}
        />
      )}
      {/* gu-onboarding-favorites-001: Edit favorite places from Settings */}
      {screen === 'favoritesSettings' && (
        <FavoritesSetupScreen
          onDone={() => setScreen('settings')}
          onBack={() => setScreen('settings')}
        />
      )}

      {/* gu-028: Global voice assistant — floating mic on all post-onboarding screens.
           gu-068: All screens with per-screen MicFab use hideFab=true + openTrigger.
           gu-068: 'sos' excluded entirely — no mic on any SOS/emergency screen. */}
      {!['splash', 'textSize', 'readAloud', 'legalDisclaimer', 'slides', 'emergencyContactOnboarding', 'nameSetup', 'favoritesSetup', 'mobilitySetup', 'notificationPermission', 'sos'].includes(screen) && (
        <VoiceAssistantOverlay
          onIntent={handleVoiceIntent}
          hideFab={['home', 'settings', 'booking', 'scheduleRide', 'scheduledRides', 'liveRide', 'history', 'emergencyContacts'].includes(screen)}
          openTrigger={voiceTrigger}
        />
      )}
    </View>
  );
}

export default function App() {
  // gu-052: Block render until Rye font is loaded — prevents FOUT on splash screen
  const [fontsLoaded] = useFonts({ Rye_400Regular });
  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <AccessibilityProvider>
        <RootNavigator />
      </AccessibilityProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
