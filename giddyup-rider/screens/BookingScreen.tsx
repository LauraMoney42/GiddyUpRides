// GiddyUp Rides — BookingScreen.tsx
// gu-005: Book-a-ride flow (mock data).
//
// 3-step flow, all state-based (no react-navigation needed yet):
//   Step 1 — Destination entry  (type or tap a preset)
//   Step 2 — Driver selection   (3 fake drivers with ETA + rating)
//   Step 3 — Confirmation       (summary + confirm button)
//
// Accessibility-first:
//   - 22pt+ fonts, 60pt+ touch targets
//   - Haptic on every tap (Vibration.vibrate(50))
//   - accessibilityLabel + accessibilityHint on all interactive elements
//   - Plain language, large text, no swipes
//   - SOS button always visible

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Vibration,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import * as Location from 'expo-location';
import { Colors, FontSize, Radius, Spacing, TouchTarget } from '../constants/theme';
import SOSButton from '../components/SOSButton';
import MicFab from '../components/MicFab';
import { useAccessibility } from '../context/AccessibilityContext';
import { Ionicons } from '@expo/vector-icons';
// gu-034: Guarded import — static import crashes Expo Go (native module absent).
// Module-level assignment is fixed at bundle time so hook call count never
// changes between renders (rules of hooks satisfied).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ExpoSpeechRecognitionModule: any = null;
// No-op stands in for the hook when native module is unavailable.
// Safe: assignment is determined once at module load, not per render.
let useSpeechRecognitionEvent: (event: string, cb: (e: any) => void) => void =
  (_event: string, _cb: (e: any) => void) => {};
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const _SR = require('expo-speech-recognition');
  ExpoSpeechRecognitionModule  = _SR.ExpoSpeechRecognitionModule;
  useSpeechRecognitionEvent    = _SR.useSpeechRecognitionEvent;
} catch (_) {
  // expo-speech-recognition native module not available in Expo Go —
  // mic button will trigger mock demo behaviour instead of crashing.
}

// ── Types ─────────────────────────────────────────────────────────────────────

type BookingStep = 'destination' | 'drivers' | 'confirm';

// gu-016: Google Places Autocomplete prediction shape
interface PlaceSuggestion {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text?: string;
  };
}

interface MockDriver {
  id: string;
  name: string;
  rating: number;        // 1–5
  totalRides: number;
  vehicle: string;       // "make model (color)"
  plate: string;
  etaMinutes: number;
  fare: string;          // display string e.g. "$12.50"
  photoEmoji: string;    // stand-in for a real photo
}

// ── Mock Data ─────────────────────────────────────────────────────────────────
// Replace with Firestore query (gu-002) once Firebase is wired.

const MOCK_DRIVERS: MockDriver[] = [
  {
    id: 'd1',
    name: 'Carlos M.',
    rating: 4.9,
    totalRides: 312,
    vehicle: 'Toyota Camry (Silver)',
    plate: 'GUR-1042',
    etaMinutes: 3,
    fare: '$11.00',
    photoEmoji: '👨',
  },
  {
    id: 'd2',
    name: 'Sandra T.',
    rating: 4.8,
    totalRides: 207,
    vehicle: 'Honda Accord (Blue)',
    plate: 'GUR-2287',
    etaMinutes: 6,
    fare: '$11.50',
    photoEmoji: '👩',
  },
  {
    id: 'd3',
    name: 'James O.',
    rating: 4.7,
    totalRides: 489,
    vehicle: 'Hyundai Sonata (White)',
    plate: 'GUR-3019',
    etaMinutes: 9,
    fare: '$10.75',
    photoEmoji: '🧑',
  },
];

const PRESET_DESTINATIONS = [
  { label: '🏥 Doctor / Medical', address: 'Sunview Medical Center, 120 Main St' },
  { label: '🛒 Grocery Store',    address: 'Green Valley Grocery, 55 Oak Ave' },
  { label: '🏠 Home',             address: '742 Evergreen Terrace' },
  { label: '🌳 Senior Center',    address: 'Pine Ridge Senior Center, 300 Elm Blvd' },
  { label: '💊 Pharmacy',         address: 'CareMore Pharmacy, 88 River Rd' },
];

// ── BookingScreen ──────────────────────────────────────────────────────────────

interface BookingScreenProps {
  onBack: () => void;
  onRideConfirmed?: (driver: MockDriver, destination: string) => void;
  onSOS?: () => void;
  /** gu-fav-prefill-001: Pre-fill destination from HomeScreen favorites tap */
  initialDestination?: string;
  /**
   * gu-070: When true (Favorite with a real saved address was tapped),
   * skip step 1 (destination picker) and open directly on step 2 (driver selection).
   * Requires initialDestination to be non-empty — guarded at initialisation.
   */
  skipDestinationStep?: boolean;
  onVoiceMic?: () => void;  // gu-066: bottom nav mic
}

export default function BookingScreen({ onBack, onRideConfirmed, onSOS, initialDestination = '', skipDestinationStep = false, onVoiceMic }: BookingScreenProps) {
  // Always start at step 1 (destination) so user sees From/To/swap card.
  // skipDestinationStep reserved for future use; gu-070+071 unified spec shows step 1.
  const [step, setStep]               = useState<BookingStep>('destination');
  const [destination, setDestination] = useState(initialDestination);
  const [selectedDriver, setDriver]   = useState<MockDriver | null>(null);
  const [searching, setSearching]     = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const { fontScale } = useAccessibility();
  const sf = (base: number) => Math.round(base * fontScale);

  // ── Step handlers ────────────────────────────────────────────────────────

  function handleDestinationConfirm() {
    if (!destination.trim()) {
      Alert.alert('Please enter a destination', 'Where would you like to go?');
      return;
    }
    Vibration.vibrate(50);
    // Simulate a brief "searching for drivers" delay
    setSearching(true);
    setTimeout(() => {
      setSearching(false);
      setStep('drivers');
    }, 1200);
  }

  function handleDriverSelect(driver: MockDriver) {
    Vibration.vibrate(50);
    setDriver(driver);
    setStep('confirm');
  }

  function handleConfirm() {
    if (!selectedDriver) return;
    Vibration.vibrate([0, 80, 60, 80]);
    setShowConfirmModal(true);
  }

  function handleBack() {
    Vibration.vibrate(30);
    if (step === 'confirm')  { setStep('drivers');     return; }
    if (step === 'drivers')  { setStep('destination'); return; }
    onBack();
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.outerRoot}>

        {/* ── Top bar ───────────────────────────────────────────────────── */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            accessibilityLabel="Go back"
            accessibilityHint={step === 'destination' ? 'Returns to the home screen' : 'Returns to the previous step'}
            accessibilityRole="button"
          >
            <Text style={[styles.backArrow, { fontSize: sf(FontSize.sm) }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.screenTitle, { fontSize: sf(FontSize.lg) }]}>
            {step === 'destination' && 'Where to?'}
            {step === 'drivers'     && 'Choose a Driver'}
            {step === 'confirm'     && 'Confirm Ride'}
          </Text>
          <View style={styles.backButton} />
        </View>

        {/* ── Step indicator ────────────────────────────────────────────── */}
        <StepIndicator current={step} />

        {/* ── Step content ──────────────────────────────────────────────── */}
        {step === 'destination' && (
          <DestinationStep
            destination={destination}
            onChangeDestination={setDestination}
            onConfirm={handleDestinationConfirm}
            searching={searching}
            initialDestination={initialDestination}
          />
        )}

        {step === 'drivers' && (
          <DriversStep
            drivers={MOCK_DRIVERS}
            destination={destination}
            onSelect={handleDriverSelect}
          />
        )}

        {step === 'confirm' && selectedDriver && (
          <ConfirmStep
            driver={selectedDriver}
            destination={destination}
            onConfirm={handleConfirm}
            onChangeDriver={() => { Vibration.vibrate(30); setStep('drivers'); }}
          />
        )}

        {/* Always-visible SOS — gu-014: wired to SOSScreen */}
        <SOSButton onSOS={onSOS} />

        {/* ── Ride Confirmed modal — respects fontScale ──────────────────── */}
        <Modal
          visible={showConfirmModal}
          transparent
          animationType="fade"
          onRequestClose={() => {}}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={[styles.modalEmoji, { fontSize: sf(FontSize.hero) }]}>🎉</Text>
              <Text style={[styles.modalTitle, { fontSize: sf(26) }]}>
                Ride Confirmed!
              </Text>
              <Text style={[styles.modalBody, { fontSize: sf(18) }]}>
                {selectedDriver?.name} is on their way.
              </Text>
              <Text style={[styles.modalEta, { fontSize: sf(20) }]}>
                Driver arrives in {selectedDriver?.etaMinutes} min 🚗
              </Text>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  setShowConfirmModal(false);
                  if (selectedDriver) onRideConfirmed?.(selectedDriver, destination);
                }}
                accessibilityRole="button"
                accessibilityLabel="OK, go to live ride screen"
                activeOpacity={0.85}
              >
                <Text style={[styles.modalButtonText, { fontSize: sf(20) }]}>OK 👍</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* gu-068: Mic moved to floating MicFab (bottom-right) — bottom nav removed */}
        <MicFab onPress={onVoiceMic} />

      </View>
    </SafeAreaView>
  );
}

// ── Step Indicator ────────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: BookingStep }) {
  const { fontScale } = useAccessibility();
  const sf = (base: number) => Math.round(base * fontScale);
  const steps: BookingStep[] = ['destination', 'drivers', 'confirm'];
  const labels = ['Destination', 'Driver', 'Confirm'];
  const currentIdx = steps.indexOf(current);

  return (
    <View style={styles.stepIndicator}>
      {steps.map((s, i) => (
        <React.Fragment key={s}>
          <View style={styles.stepItem}>
            <View style={[styles.stepDot, i <= currentIdx && styles.stepDotActive]}>
              <Text style={[styles.stepNumber, i <= currentIdx && styles.stepNumberActive, { fontSize: sf(FontSize.sm) }]}>
                {i + 1}
              </Text>
            </View>
            <Text style={[styles.stepLabel, i === currentIdx && styles.stepLabelActive, { fontSize: sf(FontSize.xs) }]}>
              {labels[i]}
            </Text>
          </View>
          {i < steps.length - 1 && (
            <View style={[styles.stepLine, i < currentIdx && styles.stepLineActive]} />
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

// ── Step 1: Destination ───────────────────────────────────────────────────────
// gu-016: Google Places autocomplete + voice (expo-speech-recognition)

function DestinationStep({
  destination,
  onChangeDestination,
  onConfirm,
  searching,
  initialDestination = '',
}: {
  destination: string;
  onChangeDestination: (v: string) => void;
  onConfirm: () => void;
  searching: boolean;
  /** gu-070/071: When non-empty, a Favorite was tapped — hide saved places + common destinations */
  initialDestination?: string;
}) {
  const { fontScale, prefs } = useAccessibility();
  const sf = (base: number) => Math.round(base * fontScale);

  // ── "To" autocomplete state ────────────────────────────────────────────
  const [suggestions, setSuggestions]               = useState<PlaceSuggestion[]>([]);
  const [showDropdown, setShowDropdown]             = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── "From" (pickup) state ──────────────────────────────────────────────
  // gu-071: default to "Current Location"; GPS resolves to real address on mount
  const [pickup, setPickup]                             = useState('Current Location');
  const [pickupSuggestions, setPickupSuggestions]       = useState<PlaceSuggestion[]>([]);
  const [showPickupDropdown, setShowPickupDropdown]     = useState(false);
  const [loadingPickup, setLoadingPickup]               = useState(false);
  const pickupDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // gu-062: "selecting" refs — set true on onTouchStart of a suggestion row so the
  // onBlur timer knows the user is mid-tap and must not clear the dropdown.
  const selectingDestRef   = useRef(false);
  const selectingPickupRef = useRef(false);

  // gu-071: resolve GPS → readable address on mount
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const [place] = await Location.reverseGeocodeAsync(pos.coords);
        if (place) {
          const parts = [
            place.streetNumber,
            place.street,
            place.city,
          ].filter(Boolean);
          if (parts.length > 0) setPickup(parts.join(' '));
        }
      } catch {
        // GPS unavailable — keep "Current Location" as display text
      }
    })();
  }, []);

  // ── Voice state ────────────────────────────────────────────────────────
  const [isListening, setIsListening] = useState(false);
  const [voiceInterim, setVoiceInterim] = useState('');

  // ── Speech recognition events (top-level hook — always called) ─────────
  useSpeechRecognitionEvent('result', (e) => {
    const transcript = e.results[0]?.transcript ?? '';
    if (e.isFinal) {
      onChangeDestination(transcript);
      setVoiceInterim('');
      setIsListening(false);
      // Kick off autocomplete for the spoken text
      if (transcript.trim().length >= 3) fetchSuggestions(transcript);
    } else {
      setVoiceInterim(transcript);
    }
  });

  useSpeechRecognitionEvent('end', () => {
    setIsListening(false);
    setVoiceInterim('');
  });

  useSpeechRecognitionEvent('error', (e) => {
    setIsListening(false);
    setVoiceInterim('');
    if (e.error !== 'aborted') {
      Alert.alert(
        'Voice input problem',
        "Couldn't hear that. Please try again or type your destination.",
        [{ text: 'OK' }]
      );
    }
  });

  // ── Autocomplete ───────────────────────────────────────────────────────
  const fetchSuggestions = async (query: string) => {
    if (query.trim().length < 3) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    setLoadingSuggestions(true);
    try {
      const key = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
      const url =
        `https://maps.googleapis.com/maps/api/place/autocomplete/json` +
        `?input=${encodeURIComponent(query)}&key=${key}&language=en`;
      const res = await fetch(url);
      const data: { predictions?: PlaceSuggestion[] } = await res.json();
      if (data.predictions?.length) {
        setSuggestions(data.predictions.slice(0, 5)); // cap at 5 results
        setShowDropdown(true);
      } else {
        setSuggestions([]);
        setShowDropdown(false);
      }
    } catch {
      setSuggestions([]);
      setShowDropdown(false);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleTextChange = (text: string) => {
    onChangeDestination(text);
    if (!text.trim()) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => fetchSuggestions(text), 400);
  };

  const handleSuggestionSelect = (pred: PlaceSuggestion) => {
    Vibration.vibrate(30);
    onChangeDestination(pred.description);
    setSuggestions([]);
    setShowDropdown(false);
  };

  // ── Pickup ("From") autocomplete ────────────────────────────────────────
  const fetchPickupSuggestions = async (query: string) => {
    const key = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
    if (!key || query.trim().length < 3) {
      setPickupSuggestions([]);
      setShowPickupDropdown(false);
      return;
    }
    setLoadingPickup(true);
    try {
      const url =
        `https://maps.googleapis.com/maps/api/place/autocomplete/json` +
        `?input=${encodeURIComponent(query)}&key=${key}&language=en`;
      const res  = await fetch(url);
      const data: { predictions?: PlaceSuggestion[] } = await res.json();
      if (data.predictions?.length) {
        setPickupSuggestions(data.predictions.slice(0, 5));
        setShowPickupDropdown(true);
      } else {
        setPickupSuggestions([]);
        setShowPickupDropdown(false);
      }
    } catch {
      setPickupSuggestions([]);
      setShowPickupDropdown(false);
    } finally {
      setLoadingPickup(false);
    }
  };

  const handlePickupChange = (text: string) => {
    setPickup(text);
    setShowDropdown(false); // close "To" dropdown while editing "From"
    if (!text.trim()) { setPickupSuggestions([]); setShowPickupDropdown(false); return; }
    if (pickupDebounceTimer.current) clearTimeout(pickupDebounceTimer.current);
    pickupDebounceTimer.current = setTimeout(() => fetchPickupSuggestions(text), 400);
  };

  const handlePickupSelect = (pred: PlaceSuggestion) => {
    Vibration.vibrate(30);
    setPickup(pred.description);
    setPickupSuggestions([]);
    setShowPickupDropdown(false);
  };

  // ── Voice ──────────────────────────────────────────────────────────────
  const handleMicPress = async () => {
    // gu-034: Native module unavailable in Expo Go — show mock demo instead
    if (!ExpoSpeechRecognitionModule) {
      const mockDestinations = [
        'Sunview Medical Center',
        'Green Valley Grocery',
        'Riverside Community Center',
        'Downtown Transit Hub',
      ];
      const mockDest = mockDestinations[Math.floor(Math.random() * mockDestinations.length)];
      Vibration.vibrate(40);
      setIsListening(true);
      setVoiceInterim('Listening…');
      setTimeout(() => {
        setVoiceInterim(mockDest);
        setTimeout(() => {
          setIsListening(false);
          setVoiceInterim('');
          onChangeDestination(mockDest);
        }, 600);
      }, 1800);
      return;
    }

    if (isListening) {
      ExpoSpeechRecognitionModule.stop();
      setIsListening(false);
      return;
    }
    try {
      const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!granted) {
        Alert.alert(
          'Microphone Permission Needed',
          'Please allow microphone access in Settings to use voice input.',
          [{ text: 'OK' }]
        );
        return;
      }
      Vibration.vibrate(40);
      setIsListening(true);
      setVoiceInterim('');
      ExpoSpeechRecognitionModule.start({ lang: 'en-US', interimResults: true });
    } catch {
      setIsListening(false);
      Alert.alert('Voice input unavailable', 'Please type your destination instead.');
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <ScrollView
      style={styles.stepScroll}
      contentContainerStyle={styles.stepContent}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.stepHeading, { fontSize: sf(FontSize.xl) }]}>Book your ride</Text>
      <Text style={[styles.stepSubheading, { fontSize: sf(FontSize.base) }]}>Set your pickup and drop-off locations below.</Text>

      {/* gu-071: From / To card */}
      <View style={styles.routeCard}>

        {/* FROM row */}
        <View style={styles.routeRow}>
          <View style={[styles.routeDotOuter, styles.routeDotPickup]}>
            <View style={styles.routeDotInner} />
          </View>
          <View style={styles.routeFieldWrap}>
            <Text style={[styles.routeFieldLabel, { fontSize: sf(11) }]}>FROM</Text>
            <TextInput
              style={[styles.routeInput, { fontSize: sf(FontSize.sm) }]}
              value={pickup}
              onChangeText={handlePickupChange}
              placeholder="Current Location"
              placeholderTextColor={Colors.textSecondary}
              autoCorrect={false}
              returnKeyType="next"
              onFocus={() => {
                setShowDropdown(false);
                if (pickup.trim().length >= 3) fetchPickupSuggestions(pickup);
              }}
              onBlur={() => setTimeout(() => {
                if (!selectingPickupRef.current) setShowPickupDropdown(false);
                selectingPickupRef.current = false; // reset after each blur cycle
              }, 200)}
              accessibilityLabel="Pickup location"
              accessibilityHint="Where should the driver pick you up? Defaults to your current location."
            />
          </View>
        </View>

        {/* ⇅ Swap button — swaps From and To values, like Google Maps */}
        <TouchableOpacity
          style={styles.swapBtn}
          onPress={() => {
            Vibration.vibrate(30);
            const prevPickup = pickup;
            const prevDest   = destination;
            setPickup(prevDest);
            onChangeDestination(prevPickup);
            // Clear both dropdowns after swap
            setSuggestions([]);
            setShowDropdown(false);
            setPickupSuggestions([]);
            setShowPickupDropdown(false);
          }}
          accessibilityRole="button"
          accessibilityLabel="Swap pickup and destination"
          accessibilityHint="Switches your From and To addresses"
          activeOpacity={0.7}
        >
          <Text style={[styles.swapBtnText, { fontSize: sf(FontSize.base) }]}>⇅</Text>
        </TouchableOpacity>

        {/* TO row */}
        <View style={styles.routeRow}>
          <View style={[styles.routeDotOuter, styles.routeDotDest]}>
            <View style={styles.routeDotInner} />
          </View>
          <View style={styles.routeFieldWrap}>
            <Text style={[styles.routeFieldLabel, { fontSize: sf(11) }]}>TO</Text>
            <TextInput
              style={[
                styles.routeInput,
                isListening && styles.routeInputListening,
                { fontSize: sf(FontSize.sm) },
              ]}
              value={isListening ? (voiceInterim || '🎤 Listening…') : destination}
              onChangeText={handleTextChange}
              placeholder="Enter address or place name…"
              placeholderTextColor={Colors.textSecondary}
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={() => { setShowDropdown(false); onConfirm(); }}
              onFocus={() => {
                setShowPickupDropdown(false);
                if (destination.trim().length >= 3) fetchSuggestions(destination);
              }}
              onBlur={() => setTimeout(() => {
                if (!selectingDestRef.current) setShowDropdown(false);
                selectingDestRef.current = false; // reset after each blur cycle
              }, 200)}
              editable={!isListening}
              accessibilityLabel="Destination address"
              accessibilityHint="Type where you want to go, or tap the microphone to speak"
            />
          </View>
        </View>
      </View>

      {/* Pickup autocomplete dropdown */}
      {showPickupDropdown && pickupSuggestions.length > 0 && (
        <View
          style={styles.dropdownCard}
          onStartShouldSetResponderCapture={() => {
            // gu-062: capture phase fires before blur/responder change — sets flag
            // so the onBlur 200ms timer knows NOT to close the dropdown mid-tap.
            selectingPickupRef.current = true;
            return false; // don't capture — let child TouchableOpacity respond
          }}
        >
          {pickupSuggestions.map((pred, idx) => (
            <TouchableOpacity
              key={pred.place_id}
              style={[
                styles.suggestionRow,
                idx === pickupSuggestions.length - 1 && styles.suggestionRowLast,
              ]}
              onPress={() => handlePickupSelect(pred)}
              accessibilityRole="button"
              accessibilityLabel={pred.description}
              activeOpacity={0.7}
            >
              <Text style={[styles.suggestionMain, { fontSize: sf(FontSize.sm) }]} numberOfLines={1}>
                {pred.structured_formatting.main_text}
              </Text>
              {!!pred.structured_formatting.secondary_text && (
                <Text style={[styles.suggestionSub, { fontSize: sf(14) }]} numberOfLines={1}>
                  {pred.structured_formatting.secondary_text}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
      {loadingPickup && !showPickupDropdown && (
        <ActivityIndicator color={Colors.primary} size="small"
          style={{ marginBottom: Spacing.sm, alignSelf: 'flex-start' }} />
      )}

      {/* Destination ("To") autocomplete dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <View
          style={styles.dropdownCard}
          onStartShouldSetResponderCapture={() => {
            // gu-062: capture phase fires before blur/responder change — sets flag
            // so the onBlur 200ms timer knows NOT to close the dropdown mid-tap.
            selectingDestRef.current = true;
            return false; // don't capture — let child TouchableOpacity respond
          }}
        >
          {suggestions.map((pred, idx) => (
            <TouchableOpacity
              key={pred.place_id}
              style={[
                styles.suggestionRow,
                idx === suggestions.length - 1 && styles.suggestionRowLast,
              ]}
              onPress={() => handleSuggestionSelect(pred)}
              accessibilityRole="button"
              accessibilityLabel={pred.description}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.suggestionMain, { fontSize: sf(FontSize.sm) }]}
                numberOfLines={1}
              >
                {pred.structured_formatting.main_text}
              </Text>
              {!!pred.structured_formatting.secondary_text && (
                <Text
                  style={[styles.suggestionSub, { fontSize: sf(14) }]}
                  numberOfLines={1}
                >
                  {pred.structured_formatting.secondary_text}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Subtle loading indicator while fetching */}
      {loadingSuggestions && !showDropdown && (
        <ActivityIndicator
          color={Colors.primary}
          size="small"
          style={{ marginBottom: Spacing.sm, alignSelf: 'flex-start' }}
        />
      )}

      {/* gu-070/071: Hide saved places + common destinations when destination pre-filled from a Favorite tap */}
      {!initialDestination.trim() && (
        <>
          {/* gu-onboarding-favorites-001: Saved favorites — shown first when set */}
          {(() => {
            const fav = prefs.favoriteAddresses;
            const saved = [
              { emoji: '🏠', label: 'Home',     address: fav.home    },
              { emoji: '🛒', label: 'Grocery',  address: fav.grocery },
              { emoji: '🌳', label: 'Park',     address: fav.park    },
              { emoji: '🏥', label: 'Doctor',   address: fav.doctor  },
            ].filter(f => f.address.trim().length > 0);

            if (saved.length === 0) return null;
            return (
              <>
                <Text style={[styles.presetsLabel, { fontSize: sf(FontSize.sm) }]}>My Saved Places</Text>
                {saved.map((fav) => (
                  <TouchableOpacity
                    key={fav.label}
                    style={[styles.presetButton, styles.savedFavButton]}
                    onPress={() => {
                      Vibration.vibrate(30);
                      onChangeDestination(fav.address);
                      setSuggestions([]);
                      setShowDropdown(false);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`${fav.label}: ${fav.address}`}
                    accessibilityHint={`Sets destination to your saved ${fav.label.toLowerCase()} address`}
                  >
                    <Text style={[styles.presetLabel, { fontSize: sf(FontSize.base) }]}>{fav.emoji}  {fav.label}</Text>
                    <Text style={[styles.presetAddress, { fontSize: sf(FontSize.sm) }]}>{fav.address}</Text>
                  </TouchableOpacity>
                ))}
              </>
            );
          })()}

          {/* Quick-tap presets */}
          <Text style={[styles.presetsLabel, { fontSize: sf(FontSize.sm) }]}>Common Destinations</Text>
          {PRESET_DESTINATIONS.map((preset) => (
            <TouchableOpacity
              key={preset.address}
              style={styles.presetButton}
              onPress={() => {
                Vibration.vibrate(30);
                onChangeDestination(preset.address);
                setSuggestions([]);
                setShowDropdown(false);
              }}
              accessibilityLabel={preset.label.replace(/[^a-zA-Z ]/g, '').trim()}
              accessibilityHint={`Sets destination to ${preset.address}`}
              accessibilityRole="button"
            >
              <Text style={[styles.presetLabel, { fontSize: sf(FontSize.base) }]}>{preset.label}</Text>
              <Text style={[styles.presetAddress, { fontSize: sf(FontSize.sm) }]}>{preset.address}</Text>
            </TouchableOpacity>
          ))}
        </>
      )}

      {/* Find drivers button */}
      <TouchableOpacity
        style={[styles.primaryButton, searching && styles.primaryButtonDisabled]}
        onPress={() => { setShowDropdown(false); onConfirm(); }}
        disabled={searching}
        accessibilityLabel="Find drivers"
        accessibilityHint="Searches for available drivers near you"
        accessibilityRole="button"
      >
        {searching ? (
          <View style={styles.searchingRow}>
            <ActivityIndicator color="#FFF" size="small" />
            <Text style={[styles.primaryButtonText, { fontSize: sf(FontSize.lg) }]}>Finding drivers…</Text>
          </View>
        ) : (
          <Text style={[styles.primaryButtonText, { fontSize: sf(FontSize.lg) }]}>🔍  Find Drivers</Text>
        )}
      </TouchableOpacity>

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

// ── Step 2: Driver Selection ──────────────────────────────────────────────────

function DriversStep({
  drivers,
  destination,
  onSelect,
}: {
  drivers: MockDriver[];
  destination: string;
  onSelect: (d: MockDriver) => void;
}) {
  const { fontScale } = useAccessibility();
  const sf = (base: number) => Math.round(base * fontScale);

  return (
    <ScrollView style={styles.stepScroll} contentContainerStyle={styles.stepContent}>
      <Text style={[styles.stepHeading, { fontSize: sf(FontSize.xl) }]}>Available Drivers</Text>
      <Text style={[styles.stepSubheading, { fontSize: sf(FontSize.base) }]} numberOfLines={2}>
        To: {destination}
      </Text>
      <Text style={[styles.stepNote, { fontSize: sf(FontSize.sm) }]}>All drivers are background-checked and rated by riders.</Text>

      {drivers.map((driver) => (
        <DriverCard key={driver.id} driver={driver} onSelect={onSelect} />
      ))}

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

function DriverCard({
  driver,
  onSelect,
}: {
  driver: MockDriver;
  onSelect: (d: MockDriver) => void;
}) {
  const { fontScale } = useAccessibility();
  const sf = (base: number) => Math.round(base * fontScale);
  const stars = '★'.repeat(Math.round(driver.rating)) + '☆'.repeat(5 - Math.round(driver.rating));

  return (
    <View style={styles.driverCard}>
      {/* Driver info row */}
      <View style={styles.driverRow}>
        <View style={styles.driverAvatar}>
          <Text style={[styles.driverAvatarEmoji, { fontSize: sf(FontSize.xl) }]}>{driver.photoEmoji}</Text>
        </View>
        <View style={styles.driverInfo}>
          <Text style={[styles.driverName, { fontSize: sf(FontSize.lg) }]}>{driver.name}</Text>
          <Text style={[styles.driverRating, { fontSize: sf(FontSize.sm) }]}>
            {stars} {driver.rating.toFixed(1)} · {driver.totalRides} rides
          </Text>
          <Text style={[styles.driverVehicle, { fontSize: sf(FontSize.sm) }]}>{driver.vehicle}</Text>
          <Text style={[styles.driverPlate, { fontSize: sf(FontSize.sm) }]}>Plate: {driver.plate}</Text>
        </View>
        <View style={styles.driverEtaBlock}>
          <Text
            style={[styles.driverEtaNumber, { fontSize: sf(FontSize.xxl) }]}
            adjustsFontSizeToFit
            numberOfLines={1}
          >
            {driver.etaMinutes}
          </Text>
          <Text style={[styles.driverEtaUnit, { fontSize: sf(FontSize.xs) }]}>min</Text>
          <Text style={[styles.driverFare, { fontSize: sf(FontSize.sm) }]}>{driver.fare}</Text>
        </View>
      </View>

      {/* Select button */}
      <TouchableOpacity
        style={styles.selectButton}
        onPress={() => onSelect(driver)}
        accessibilityLabel={`Select ${driver.name}`}
        accessibilityHint={`${driver.etaMinutes} minutes away. Fare ${driver.fare}. ${driver.rating} stars.`}
        accessibilityRole="button"
      >
        <Text style={[styles.selectButtonText, { fontSize: sf(FontSize.base) }]}>Select {driver.name.split(' ')[0]}</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Step 3: Confirm ───────────────────────────────────────────────────────────

function ConfirmStep({
  driver,
  destination,
  onConfirm,
  onChangeDriver,
}: {
  driver: MockDriver;
  destination: string;
  onConfirm: () => void;
  onChangeDriver: () => void;
}) {
  // gu-029: Read mobility profile — show notice if rider has any needs
  const { prefs, fontScale } = useAccessibility();
  const sf = (base: number) => Math.round(base * fontScale);
  const hasMobilityNeeds = prefs.mobilityNeeds.length > 0 || prefs.mobilityNotes.trim().length > 0;

  const stars = '★'.repeat(Math.round(driver.rating)) + '☆'.repeat(5 - Math.round(driver.rating));

  return (
    <ScrollView style={styles.stepScroll} contentContainerStyle={styles.stepContent}>
      <Text style={[styles.stepHeading, { fontSize: sf(FontSize.xl) }]}>Review Your Ride</Text>

      {/* Summary card */}
      <View style={styles.summaryCard}>
        <SummaryRow icon="📍" label="Going to" value={destination} />
        <View style={styles.summaryDivider} />
        <SummaryRow icon="🚗" label="Driver"           value={driver.name} />
        <SummaryRow icon="⏱" label="Driver arrives in" value={`${driver.etaMinutes} min`} />
        <SummaryRow icon="🛣️" label="Trip time"        value="~18 min" />
        <SummaryRow icon="💰" label="Fare"             value={driver.fare} />
        <SummaryRow icon="🚙" label="Car"    value={driver.vehicle} />
        <SummaryRow icon="🔢" label="Plate"  value={driver.plate} />
        <View style={styles.summaryDivider} />
        <View style={styles.driverRatingRow}>
          <Text style={styles.summaryLabel}>Driver rating</Text>
          <Text style={[styles.summaryStars, { fontSize: sf(FontSize.base) }]}>
            {stars} {driver.rating.toFixed(1)}
          </Text>
        </View>
      </View>

      {/* gu-029: Accessibility notice — only shown if rider has mobility needs */}
      {hasMobilityNeeds && (
        <View style={styles.accessibilityNote}>
          <Text style={[styles.accessibilityNoteText, { fontSize: sf(FontSize.sm) }]}>
            ♿  Your driver will be notified of your accessibility needs before pickup.
          </Text>
        </View>
      )}

      <Text style={[styles.confirmNote, { fontSize: sf(FontSize.sm) }]}>
        Your driver will call if they have trouble finding you. Make sure your phone is nearby.
      </Text>

      {/* Confirm button */}
      <TouchableOpacity
        style={styles.confirmButton}
        onPress={onConfirm}
        accessibilityLabel="Confirm ride"
        accessibilityHint={`Confirms your ride with ${driver.name}. They will arrive in ${driver.etaMinutes} minutes.`}
        accessibilityRole="button"
      >
        <Text style={[styles.confirmButtonText, { fontSize: sf(FontSize.lg) }]}>✅  Confirm Ride</Text>
      </TouchableOpacity>

      {/* Change driver */}
      <TouchableOpacity
        style={styles.changeDriverButton}
        onPress={onChangeDriver}
        accessibilityLabel="Choose a different driver"
        accessibilityRole="button"
      >
        <Text style={[styles.changeDriverText, { fontSize: sf(FontSize.base) }]}>Choose a Different Driver</Text>
      </TouchableOpacity>

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

function SummaryRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  const { fontScale } = useAccessibility();
  const sf = (base: number) => Math.round(base * fontScale);
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryIcon, { fontSize: sf(FontSize.base) }]}>{icon}</Text>
      <Text style={[styles.summaryLabel, { fontSize: sf(FontSize.sm) }]}>{label}</Text>
      <Text style={[styles.summaryValue, { fontSize: sf(FontSize.base) }]} numberOfLines={2}>{value}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  outerRoot: {
    flex: 1,
  },

  // gu-068: bottomNav/bottomNavMic removed — mic is now MicFab floating bottom-right

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    minWidth: 80,
    minHeight: TouchTarget.min,
    justifyContent: 'center',
  },
  backArrow: {
    // fontSize set inline via sf() — gu-text-scale
    color: Colors.primary,
    fontWeight: '700',
  },
  screenTitle: {
    // fontSize set inline via sf() — gu-text-scale
    color: Colors.textPrimary,
    fontWeight: '800',
    textAlign: 'center',
    flex: 1,
  },

  // Step indicator
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  stepItem: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    backgroundColor: Colors.primary,
  },
  stepNumber: {
    // fontSize set inline via sf() — gu-text-scale
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  stepNumberActive: {
    color: '#000000',  // Black on gold step dot = 8.6:1 ✅
  },
  stepLabel: {
    // fontSize set inline via sf() — gu-text-scale
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  stepLabelActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.border,
    marginBottom: Spacing.lg,
    marginHorizontal: Spacing.xs,
  },
  stepLineActive: {
    backgroundColor: Colors.primary,
  },

  // Step shared
  stepScroll: {
    flex: 1,
  },
  stepContent: {
    padding: Spacing.lg,
  },
  stepHeading: {
    // fontSize set inline via sf() — gu-text-scale
    color: Colors.textPrimary,
    fontWeight: '900',
    marginBottom: Spacing.xs,
  },
  stepSubheading: {
    // fontSize set inline via sf() — gu-text-scale
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  stepNote: {
    // fontSize set inline via sf() — gu-text-scale
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    fontStyle: 'italic',
  },

  // Destination step — gu-016: input row, mic, autocomplete dropdown
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  addressInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    // gu-042: fontSize removed from style — set inline via sf() so it scales with text-size preference
    color: Colors.textPrimary,
    minHeight: TouchTarget.min,
  },
  addressInputListening: {
    borderColor: Colors.sos,
    color: Colors.sos,
  },

  // gu-071: From / To route card
  routeCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
    gap: 0,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },
  // ⇅ swap button — sits between FROM and TO rows
  swapBtn: {
    alignSelf: 'flex-end',   // right-aligned so it doesn't crowd the dot column
    marginRight: 0,
    marginLeft: 'auto',
    minWidth: TouchTarget.min,
    minHeight: TouchTarget.min,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: Radius.md,
    marginVertical: -4,      // tucks between rows with slight overlap
    zIndex: 1,
    paddingHorizontal: Spacing.md,
  },
  swapBtnText: {
    color: Colors.primary,
    fontWeight: '800',
  },
  routeDotOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  routeDotPickup: {
    backgroundColor: '#2E7D32', // green — pickup
  },
  routeDotDest: {
    backgroundColor: Colors.primary, // gold — destination
  },
  routeDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
  routeFieldWrap: {
    flex: 1,
    gap: 2,
  },
  routeFieldLabel: {
    color: Colors.textSecondary,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  routeInput: {
    color: Colors.textPrimary,
    paddingVertical: 4,
    minHeight: 32,
  },
  routeInputListening: {
    color: Colors.sos,
  },

  // gu-068: micButton/micButtonActive removed — inline mic replaced by MicFab
  dropdownCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
  },
  suggestionRow: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    minHeight: TouchTarget.min,
    justifyContent: 'center',
  },
  suggestionRowLast: {
    borderBottomWidth: 0,
  },
  suggestionMain: {
    color: Colors.textPrimary,
    fontWeight: '700',
    marginBottom: 2,
  },
  suggestionSub: {
    color: Colors.textSecondary,
  },
  presetsLabel: {
    // fontSize set inline via sf() — gu-text-scale
    color: Colors.textSecondary,
    fontWeight: '700',
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  presetButton: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: TouchTarget.min,
    justifyContent: 'center',
  },
  // gu-onboarding-favorites-001: saved favorites get a gold accent border
  savedFavButton: {
    borderColor: Colors.primary,
    borderWidth: 1.5,
  },
  presetLabel: {
    // fontSize set inline via sf() — gu-text-scale
    color: Colors.textPrimary,
    fontWeight: '700',
    marginBottom: 2,
  },
  presetAddress: {
    // fontSize set inline via sf() — gu-text-scale
    color: Colors.textSecondary,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TouchTarget.xl,
    marginTop: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonDisabled: {
    backgroundColor: Colors.disabled,
  },
  primaryButtonText: {
    // fontSize set inline via sf() — gu-text-scale
    color: '#000000',  // Black on gold = 8.6:1 ✅
    fontWeight: '900',
  },
  searchingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },

  // Driver cards
  driverCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  driverAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverAvatarEmoji: {
    // fontSize set inline via sf() — gu-text-scale
  },
  driverInfo: {
    flex: 1,
    gap: 3,
  },
  driverName: {
    // fontSize set inline via sf() — gu-text-scale
    color: Colors.textPrimary,
    fontWeight: '800',
  },
  driverRating: {
    // fontSize set inline via sf() — gu-text-scale
    color: Colors.accent,
    fontWeight: '600',
  },
  driverVehicle: {
    // fontSize set inline via sf() — gu-text-scale
    color: Colors.textSecondary,
  },
  driverPlate: {
    // fontSize set inline via sf() — gu-text-scale
    color: Colors.textSecondary,
  },
  driverEtaBlock: {
    alignItems: 'center',
    minWidth: 60,
  },
  driverEtaNumber: {
    // fontSize set inline via sf() — gu-text-scale
    color: Colors.primary,
    fontWeight: '900',
  },
  driverEtaUnit: {
    // fontSize set inline via sf() — gu-text-scale (see driverEtaUnit inline override)
    color: Colors.textSecondary,
    fontWeight: '600',
    marginTop: -4,
  },
  driverFare: {
    // fontSize set inline via sf() — gu-text-scale (see driverFare inline override)
    color: Colors.textPrimary,
    fontWeight: '700',
    marginTop: Spacing.xs,
  },
  selectButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    minHeight: TouchTarget.min,
  },
  selectButtonText: {
    // fontSize set inline via sf() — gu-text-scale
    color: '#000000',  // Black on gold = 8.6:1 ✅
    fontWeight: '800',
  },

  // Confirm step
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  summaryIcon: {
    // fontSize set inline via sf() — gu-text-scale
    width: 32,
    textAlign: 'center',
  },
  summaryLabel: {
    // fontSize set inline via sf() — gu-text-scale
    color: Colors.textSecondary,
    width: 80,
    fontWeight: '600',
  },
  summaryValue: {
    flex: 1,
    // fontSize set inline via sf() — gu-text-scale
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xs,
  },
  driverRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  summaryStars: {
    // fontSize set inline via sf() — gu-text-scale
    color: Colors.accent,
    fontWeight: '700',
  },
  // gu-029: Accessibility notice on confirm step
  accessibilityNote: {
    backgroundColor: Colors.surface,   // Navy surface + gold border ✅
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    marginBottom: Spacing.md,
  },
  accessibilityNoteText: {
    // fontSize set inline via sf() — gu-text-scale
    color: Colors.textPrimary,          // White on navy = 15:1 ✅
    fontWeight: '600',
    lineHeight: 24,
  },
  confirmNote: {
    // fontSize set inline via sf() — gu-text-scale
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
    lineHeight: 24,
  },
  confirmButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TouchTarget.xl,
    minWidth: 220,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  confirmButtonText: {
    // fontSize set inline via sf() — gu-text-scale
    color: '#000000',  // Black on gold = 8.6:1 ✅
    fontWeight: '900',
  },
  changeDriverButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    minHeight: TouchTarget.min,
  },
  changeDriverText: {
    // fontSize set inline via sf() — gu-text-scale
    color: Colors.primary,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },

  // ── Ride Confirmed modal ──────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  modalEmoji: {
    // fontSize set inline via sf() — gu-text-scale
    marginBottom: Spacing.sm,
  },
  modalTitle: {
    fontWeight: '900',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  modalBody: {
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
    lineHeight: 26,
  },
  modalEta: {
    fontWeight: '800',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  modalButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    minHeight: TouchTarget.xl,
    minWidth: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    color: '#000000', // Black on gold — WCAG AAA contrast
    fontWeight: '900',
  },
});
