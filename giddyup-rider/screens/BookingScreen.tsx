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

import React, { useState } from 'react';
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
} from 'react-native';
import { Colors, FontSize, Radius, Spacing, TouchTarget } from '../constants/theme';
import SOSButton from '../components/SOSButton';

// ── Types ─────────────────────────────────────────────────────────────────────

type BookingStep = 'destination' | 'drivers' | 'confirm';

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
}

export default function BookingScreen({ onBack, onRideConfirmed, onSOS }: BookingScreenProps) {
  const [step, setStep]               = useState<BookingStep>('destination');
  const [destination, setDestination] = useState('');
  const [selectedDriver, setDriver]   = useState<MockDriver | null>(null);
  const [searching, setSearching]     = useState(false);

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
    Alert.alert(
      'Ride Confirmed! 🚗',
      `${selectedDriver.name} is on their way.\nETA: ${selectedDriver.etaMinutes} min`,
      [
        {
          text: 'OK',
          onPress: () => onRideConfirmed?.(selectedDriver, destination),
        },
      ]
    );
  }

  function handleBack() {
    Vibration.vibrate(30);
    if (step === 'confirm')    { setStep('drivers');     return; }
    if (step === 'drivers')    { setStep('destination'); return; }
    onBack();
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.root}>

        {/* ── Top bar ───────────────────────────────────────────────────── */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            accessibilityLabel="Go back"
            accessibilityHint={step === 'destination' ? 'Returns to the home screen' : 'Returns to the previous step'}
            accessibilityRole="button"
          >
            <Text style={styles.backArrow}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.screenTitle}>
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
      </View>
    </SafeAreaView>
  );
}

// ── Step Indicator ────────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: BookingStep }) {
  const steps: BookingStep[] = ['destination', 'drivers', 'confirm'];
  const labels = ['Destination', 'Driver', 'Confirm'];
  const currentIdx = steps.indexOf(current);

  return (
    <View style={styles.stepIndicator}>
      {steps.map((s, i) => (
        <React.Fragment key={s}>
          <View style={styles.stepItem}>
            <View style={[styles.stepDot, i <= currentIdx && styles.stepDotActive]}>
              <Text style={[styles.stepNumber, i <= currentIdx && styles.stepNumberActive]}>
                {i + 1}
              </Text>
            </View>
            <Text style={[styles.stepLabel, i === currentIdx && styles.stepLabelActive]}>
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

function DestinationStep({
  destination,
  onChangeDestination,
  onConfirm,
  searching,
}: {
  destination: string;
  onChangeDestination: (v: string) => void;
  onConfirm: () => void;
  searching: boolean;
}) {
  return (
    <ScrollView
      style={styles.stepScroll}
      contentContainerStyle={styles.stepContent}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.stepHeading}>Where are you going?</Text>
      <Text style={styles.stepSubheading}>Type an address or tap a common destination below.</Text>

      {/* Address text input */}
      <TextInput
        style={styles.addressInput}
        value={destination}
        onChangeText={onChangeDestination}
        placeholder="Enter address or place name…"
        placeholderTextColor={Colors.textSecondary}
        autoCorrect={false}
        returnKeyType="search"
        onSubmitEditing={onConfirm}
        accessibilityLabel="Destination address"
        accessibilityHint="Type where you want to go"
      />

      {/* Quick-tap presets */}
      <Text style={styles.presetsLabel}>Common Destinations</Text>
      {PRESET_DESTINATIONS.map((preset) => (
        <TouchableOpacity
          key={preset.address}
          style={styles.presetButton}
          onPress={() => {
            Vibration.vibrate(30);
            onChangeDestination(preset.address);
          }}
          accessibilityLabel={preset.label.replace(/[^a-zA-Z ]/g, '').trim()}
          accessibilityHint={`Sets destination to ${preset.address}`}
          accessibilityRole="button"
        >
          <Text style={styles.presetLabel}>{preset.label}</Text>
          <Text style={styles.presetAddress}>{preset.address}</Text>
        </TouchableOpacity>
      ))}

      {/* Find drivers button */}
      <TouchableOpacity
        style={[styles.primaryButton, searching && styles.primaryButtonDisabled]}
        onPress={onConfirm}
        disabled={searching}
        accessibilityLabel="Find drivers"
        accessibilityHint="Searches for available drivers near you"
        accessibilityRole="button"
      >
        {searching ? (
          <View style={styles.searchingRow}>
            <ActivityIndicator color="#FFF" size="small" />
            <Text style={styles.primaryButtonText}>Finding drivers…</Text>
          </View>
        ) : (
          <Text style={styles.primaryButtonText}>🔍  Find Drivers</Text>
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
  return (
    <ScrollView style={styles.stepScroll} contentContainerStyle={styles.stepContent}>
      <Text style={styles.stepHeading}>Available Drivers</Text>
      <Text style={styles.stepSubheading} numberOfLines={2}>
        To: {destination}
      </Text>
      <Text style={styles.stepNote}>All drivers are background-checked and rated by riders.</Text>

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
  const stars = '★'.repeat(Math.round(driver.rating)) + '☆'.repeat(5 - Math.round(driver.rating));

  return (
    <View style={styles.driverCard}>
      {/* Driver info row */}
      <View style={styles.driverRow}>
        <View style={styles.driverAvatar}>
          <Text style={styles.driverAvatarEmoji}>{driver.photoEmoji}</Text>
        </View>
        <View style={styles.driverInfo}>
          <Text style={styles.driverName}>{driver.name}</Text>
          <Text style={styles.driverRating}>
            {stars} {driver.rating.toFixed(1)} · {driver.totalRides} rides
          </Text>
          <Text style={styles.driverVehicle}>{driver.vehicle}</Text>
          <Text style={styles.driverPlate}>Plate: {driver.plate}</Text>
        </View>
        <View style={styles.driverEtaBlock}>
          <Text style={styles.driverEtaNumber}>{driver.etaMinutes}</Text>
          <Text style={styles.driverEtaUnit}>min</Text>
          <Text style={styles.driverFare}>{driver.fare}</Text>
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
        <Text style={styles.selectButtonText}>Select {driver.name.split(' ')[0]}</Text>
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
  const stars = '★'.repeat(Math.round(driver.rating)) + '☆'.repeat(5 - Math.round(driver.rating));

  return (
    <ScrollView style={styles.stepScroll} contentContainerStyle={styles.stepContent}>
      <Text style={styles.stepHeading}>Review Your Ride</Text>

      {/* Summary card */}
      <View style={styles.summaryCard}>
        <SummaryRow icon="📍" label="Going to" value={destination} />
        <View style={styles.summaryDivider} />
        <SummaryRow icon="🚗" label="Driver" value={driver.name} />
        <SummaryRow icon="⏱" label="ETA"    value={`${driver.etaMinutes} minutes`} />
        <SummaryRow icon="💰" label="Fare"   value={driver.fare} />
        <SummaryRow icon="🚙" label="Car"    value={driver.vehicle} />
        <SummaryRow icon="🔢" label="Plate"  value={driver.plate} />
        <View style={styles.summaryDivider} />
        <View style={styles.driverRatingRow}>
          <Text style={styles.summaryLabel}>Driver rating</Text>
          <Text style={styles.summaryStars}>
            {stars} {driver.rating.toFixed(1)}
          </Text>
        </View>
      </View>

      <Text style={styles.confirmNote}>
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
        <Text style={styles.confirmButtonText}>✅  Confirm Ride</Text>
      </TouchableOpacity>

      {/* Change driver */}
      <TouchableOpacity
        style={styles.changeDriverButton}
        onPress={onChangeDriver}
        accessibilityLabel="Choose a different driver"
        accessibilityRole="button"
      >
        <Text style={styles.changeDriverText}>Choose a Different Driver</Text>
      </TouchableOpacity>

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

function SummaryRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryIcon}>{icon}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue} numberOfLines={2}>{value}</Text>
    </View>
  );
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
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '700',
  },
  screenTitle: {
    fontSize: FontSize.lg,
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
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  stepNumberActive: {
    color: '#FFFFFF',
  },
  stepLabel: {
    fontSize: 13,
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
    fontSize: FontSize.xl,
    color: Colors.textPrimary,
    fontWeight: '900',
    marginBottom: Spacing.xs,
  },
  stepSubheading: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  stepNote: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    fontStyle: 'italic',
  },

  // Destination step
  addressInput: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
    minHeight: TouchTarget.min,
  },
  presetsLabel: {
    fontSize: FontSize.sm,
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
  presetLabel: {
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    fontWeight: '700',
    marginBottom: 2,
  },
  presetAddress: {
    fontSize: FontSize.sm,
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
    fontSize: FontSize.lg,
    color: '#FFFFFF',
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
    fontSize: 32,
  },
  driverInfo: {
    flex: 1,
    gap: 3,
  },
  driverName: {
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
    fontWeight: '800',
  },
  driverRating: {
    fontSize: FontSize.sm,
    color: Colors.accent,
    fontWeight: '600',
  },
  driverVehicle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  driverPlate: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  driverEtaBlock: {
    alignItems: 'center',
    minWidth: 60,
  },
  driverEtaNumber: {
    fontSize: FontSize.xxl,
    color: Colors.primary,
    fontWeight: '900',
  },
  driverEtaUnit: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginTop: -4,
  },
  driverFare: {
    fontSize: FontSize.sm,
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
    fontSize: FontSize.base,
    color: '#FFFFFF',
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
    fontSize: 22,
    width: 32,
    textAlign: 'center',
  },
  summaryLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    width: 80,
    fontWeight: '600',
  },
  summaryValue: {
    flex: 1,
    fontSize: FontSize.base,
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
    fontSize: FontSize.base,
    color: Colors.accent,
    fontWeight: '700',
  },
  confirmNote: {
    fontSize: FontSize.sm,
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
    alignItems: 'center',
    minHeight: TouchTarget.xl,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  confirmButtonText: {
    fontSize: FontSize.lg,
    color: '#FFFFFF',
    fontWeight: '900',
  },
  changeDriverButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    minHeight: TouchTarget.min,
  },
  changeDriverText: {
    fontSize: FontSize.base,
    color: Colors.primary,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
