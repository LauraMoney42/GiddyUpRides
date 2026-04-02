/**
 * ScheduleRideScreen.tsx
 * gu-018: Schedule a ride in advance — 4-step flow.
 *
 * Step 1 — Destination  (type or pick a preset)
 * Step 2 — Date         (next 14 days as scrollable day buttons)
 * Step 3 — Time         (30-min increments, 8 AM – 8 PM)
 * Step 4 — Confirm      (summary card + "Schedule It 🐴" CTA)
 *
 * Mock only — no backend. onConfirm passes the ScheduledRide back to App.tsx
 * which stores it in state for ScheduledRidesScreen.
 *
 * Accessibility: 60pt+ touch targets, fontScale via sf(), VoiceOver labels.
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Vibration,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Colors, FontSize, Radius, Spacing, TouchTarget } from '../constants/theme';
import SOSButton from '../components/SOSButton';
import MicFab from '../components/MicFab';
import { useAccessibility } from '../context/AccessibilityContext';

// ── Google Places autocomplete ────────────────────────────────────────────────
// gu-057: Same API key + fetch pattern as BookingScreen.
const PLACES_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

interface PlaceSuggestion {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text?: string;
  };
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ScheduledRide {
  id: string;
  destination: string;
  date: string;      // e.g. "Mon, Apr 1"
  time: string;      // e.g. "10:00 AM"
  dateISO: string;   // for sorting
}

type Step = 'destination' | 'date' | 'time' | 'confirm';

// ── Preset destinations ───────────────────────────────────────────────────────

const PRESET_DESTINATIONS = [
  { emoji: '🏥', label: 'Doctor / Medical' },
  { emoji: '🛒', label: 'Grocery Store'    },
  { emoji: '💊', label: 'Pharmacy'         },
  { emoji: '🏦', label: 'Bank'             },
  { emoji: '⛪', label: 'Church'           },
  { emoji: '🏠', label: 'Home'             },
];

// ── Date helpers ──────────────────────────────────────────────────────────────

function getNext14Days(): { label: string; shortLabel: string; iso: string }[] {
  const days: { label: string; shortLabel: string; iso: string }[] = [];
  const dayNames  = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  for (let i = 1; i <= 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dayName  = dayNames[d.getDay()];
    const month    = monthNames[d.getMonth()];
    const date     = d.getDate();
    days.push({
      label:      `${dayName}, ${month} ${date}`,
      shortLabel: `${dayName}\n${month} ${date}`,
      iso:        d.toISOString().split('T')[0],
    });
  }
  return days;
}

// ── Time slots ────────────────────────────────────────────────────────────────

function getTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = 8; h <= 20; h++) {
    const period = h < 12 ? 'AM' : 'PM';
    const displayH = h <= 12 ? h : h - 12;
    slots.push(`${displayH}:00 ${period}`);
    if (h < 20) slots.push(`${displayH}:30 ${period}`);
  }
  return slots;
}

const DATES = getNext14Days();
const TIMES = getTimeSlots();

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  onBack: () => void;
  onConfirm: (ride: ScheduledRide) => void;
  onSOS?: () => void;
  onVoiceMic?: () => void;
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function ScheduleRideScreen({ onBack, onConfirm, onSOS, onVoiceMic }: Props) {
  const { fontScale, prefs } = useAccessibility();
  const sf = (base: number) => Math.round(base * fontScale);

  const [step, setStep]              = useState<Step>('destination');
  const [destination, setDestination] = useState('');
  const [customInput, setCustomInput] = useState('');
  const [selectedDate, setSelectedDate] = useState<typeof DATES[0] | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // gu-057: autocomplete state for the custom address input
  const [suggestions,       setSuggestions]       = useState<PlaceSuggestion[]>([]);
  const [showDropdown,      setShowDropdown]       = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stepIndex: Record<Step, number> = { destination: 1, date: 2, time: 3, confirm: 4 };

  const handlePreset = (label: string) => {
    Vibration.vibrate(40);
    setDestination(label);
  };

  const handleCustomSubmit = () => {
    if (!customInput.trim()) return;
    Vibration.vibrate(40);
    setDestination(customInput.trim());
    setSuggestions([]);
    setShowDropdown(false);
  };

  // gu-057: fetch Google Places suggestions for the typed address
  const fetchSuggestions = async (query: string) => {
    if (!PLACES_KEY || query.trim().length < 3) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    setLoadingSuggestions(true);
    try {
      const url =
        `https://maps.googleapis.com/maps/api/place/autocomplete/json` +
        `?input=${encodeURIComponent(query)}&key=${PLACES_KEY}&language=en`;
      const res  = await fetch(url);
      const data: { predictions?: PlaceSuggestion[] } = await res.json();
      if (data.predictions?.length) {
        setSuggestions(data.predictions.slice(0, 5));
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

  const handleAddressChange = (text: string) => {
    setCustomInput(text);
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
    setCustomInput(pred.description);
    setDestination(pred.description);
    setSuggestions([]);
    setShowDropdown(false);
  };

  const goNext = (nextStep: Step) => {
    Vibration.vibrate(40);
    setStep(nextStep);
  };

  const handleConfirm = () => {
    if (!destination || !selectedDate || !selectedTime) return;
    Vibration.vibrate([0, 60, 40, 80]);
    const ride: ScheduledRide = {
      id:          `sched-${Date.now()}`,
      destination,
      date:        selectedDate.label,
      time:        selectedTime,
      dateISO:     selectedDate.iso,
    };
    onConfirm(ride);
  };

  // ── Step header ─────────────────────────────────────────────────────────────

  const stepTitles: Record<Step, string> = {
    destination: 'Where are you going?',
    date:        'Which day?',
    time:        'What time?',
    confirm:     'Confirm your ride',
  };

  const canAdvanceFromDestination = destination.trim().length > 0;
  const canAdvanceFromDate        = selectedDate !== null;
  const canAdvanceFromTime        = selectedTime !== null;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              Vibration.vibrate(30);
              if (step === 'destination') { onBack(); return; }
              const prev: Record<Step, Step> = {
                destination: 'destination',
                date: 'destination',
                time: 'date',
                confirm: 'time',
              };
              setStep(prev[step]);
            }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            activeOpacity={0.7}
          >
            <Text style={[styles.backBtnText, { fontSize: sf(FontSize.sm) }]}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { fontSize: sf(FontSize.base) }]}>
              {stepTitles[step]}
            </Text>
            <Text style={[styles.stepIndicator, { fontSize: sf(FontSize.xs) }]}>
              Step {stepIndex[step]} of 4
            </Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${(stepIndex[step] / 4) * 100}%` }]} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Step 1: Destination ──────────────────────────────────────── */}
          {step === 'destination' && (
            <View>
              {/* gu-onboarding-favorites-001: Saved favorites — show first if any are set */}
              {(() => {
                const fav = prefs.favoriteAddresses;
                const saved = [
                  { emoji: '🏠', label: 'Home',    address: fav.home    },
                  { emoji: '🛒', label: 'Grocery', address: fav.grocery },
                  { emoji: '🌳', label: 'Park',    address: fav.park    },
                  { emoji: '🏥', label: 'Doctor',  address: fav.doctor  },
                ].filter(f => f.address.trim().length > 0);

                if (saved.length === 0) return null;
                return (
                  <>
                    <Text style={[styles.sectionLabel, { fontSize: sf(FontSize.xs) }]}>
                      My saved places
                    </Text>
                    <View style={styles.presetGrid}>
                      {saved.map(f => {
                        const isSelected = destination === f.address;
                        return (
                          <TouchableOpacity
                            key={f.label}
                            style={[styles.presetTile, styles.savedFavTile, isSelected && styles.presetTileSelected]}
                            onPress={() => { Vibration.vibrate(30); setDestination(f.address); setCustomInput(''); }}
                            accessibilityRole="button"
                            accessibilityState={{ selected: isSelected }}
                            accessibilityLabel={`${f.label}: ${f.address}`}
                            accessibilityHint={`Schedule a ride to your saved ${f.label.toLowerCase()} address`}
                            activeOpacity={0.75}
                          >
                            <Text style={[styles.presetEmoji, { fontSize: sf(FontSize.lg) }]}>{f.emoji}</Text>
                            <Text style={[styles.presetLabel, { fontSize: sf(14) }, isSelected && styles.presetLabelSelected]}>
                              {f.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </>
                );
              })()}

              {/* Preset tiles */}
              <Text style={[styles.sectionLabel, { fontSize: sf(FontSize.xs) }]}>
                Common destinations
              </Text>
              <View style={styles.presetGrid}>
                {PRESET_DESTINATIONS.map(p => {
                  const isSelected = destination === p.label;
                  return (
                    <TouchableOpacity
                      key={p.label}
                      style={[styles.presetTile, isSelected && styles.presetTileSelected]}
                      onPress={() => handlePreset(p.label)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      accessibilityLabel={p.label}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.presetEmoji, { fontSize: sf(FontSize.lg) }]}>{p.emoji}</Text>
                      <Text style={[styles.presetLabel, { fontSize: sf(14) }, isSelected && styles.presetLabelSelected]}>
                        {p.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Custom input */}
              <Text style={[styles.sectionLabel, { fontSize: sf(FontSize.xs), marginTop: Spacing.lg }]}>
                Or type an address
              </Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.textInput, { fontSize: sf(FontSize.sm) }]}
                  value={customInput}
                  onChangeText={handleAddressChange}
                  placeholder="e.g. 123 Main Street"
                  placeholderTextColor={Colors.disabled}
                  returnKeyType="done"
                  autoCorrect={false}
                  onFocus={() => {
                    if (customInput.trim().length >= 3) fetchSuggestions(customInput);
                  }}
                  onBlur={() => {
                    // Delay so tapping a suggestion registers before dropdown hides
                    setTimeout(() => setShowDropdown(false), 250);
                  }}
                  onSubmitEditing={handleCustomSubmit}
                  accessibilityLabel="Type a destination address"
                  accessibilityHint="Suggestions will appear as you type"
                />
                {customInput.trim().length > 0 && (
                  <TouchableOpacity
                    style={styles.inputConfirmBtn}
                    onPress={handleCustomSubmit}
                    accessibilityRole="button"
                    accessibilityLabel="Use this address"
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.inputConfirmText, { fontSize: sf(FontSize.xs) }]}>Use</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* gu-057: Autocomplete dropdown */}
              {showDropdown && suggestions.length > 0 && (
                <View style={styles.dropdownCard}>
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
                  style={{ marginTop: Spacing.xs, alignSelf: 'flex-start' }}
                />
              )}

              {destination.trim().length > 0 && (
                <View style={styles.selectedBadge}>
                  <Text style={[styles.selectedBadgeText, { fontSize: sf(FontSize.xs) }]}>
                    ✓  Going to: <Text style={styles.selectedBadgeDest}>{destination}</Text>
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.nextBtn, !canAdvanceFromDestination && styles.nextBtnDisabled]}
                onPress={canAdvanceFromDestination ? () => goNext('date') : undefined}
                accessibilityRole="button"
                accessibilityLabel="Choose a destination to continue"
                accessibilityState={{ disabled: !canAdvanceFromDestination }}
                activeOpacity={canAdvanceFromDestination ? 0.85 : 1}
              >
                <Text style={[styles.nextBtnText, { fontSize: sf(FontSize.base) }]}>
                  Next: Choose a Day →
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Step 2: Date ─────────────────────────────────────────────── */}
          {step === 'date' && (
            <View>
              <Text style={[styles.sectionLabel, { fontSize: sf(FontSize.xs) }]}>
                Next 14 days
              </Text>
              <View style={styles.dayGrid}>
                {DATES.map(d => {
                  const isSelected = selectedDate?.iso === d.iso;
                  return (
                    <TouchableOpacity
                      key={d.iso}
                      style={[styles.dayTile, isSelected && styles.dayTileSelected]}
                      onPress={() => { Vibration.vibrate(30); setSelectedDate(d); }}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isSelected }}
                      accessibilityLabel={d.label}
                      activeOpacity={0.75}
                    >
                      <Text style={[
                        styles.dayTileText,
                        { fontSize: sf(14) },
                        isSelected && styles.dayTileTextSelected,
                      ]}>
                        {d.shortLabel}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={[styles.nextBtn, !canAdvanceFromDate && styles.nextBtnDisabled]}
                onPress={canAdvanceFromDate ? () => goNext('time') : undefined}
                accessibilityRole="button"
                accessibilityState={{ disabled: !canAdvanceFromDate }}
                accessibilityLabel={canAdvanceFromDate ? `Continue with ${selectedDate?.label}` : 'Select a day to continue'}
                activeOpacity={canAdvanceFromDate ? 0.85 : 1}
              >
                <Text style={[styles.nextBtnText, { fontSize: sf(FontSize.base) }]}>
                  {canAdvanceFromDate ? `Next: Choose a Time →` : 'Select a day to continue'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Step 3: Time ─────────────────────────────────────────────── */}
          {step === 'time' && (
            <View>
              <Text style={[styles.sectionLabel, { fontSize: sf(FontSize.xs) }]}>
                Select a pickup time
              </Text>
              <View style={styles.timeGrid}>
                {TIMES.map(t => {
                  const isSelected = selectedTime === t;
                  return (
                    <TouchableOpacity
                      key={t}
                      style={[styles.timeTile, isSelected && styles.timeTileSelected]}
                      onPress={() => { Vibration.vibrate(30); setSelectedTime(t); }}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isSelected }}
                      accessibilityLabel={t}
                      activeOpacity={0.75}
                    >
                      <Text style={[
                        styles.timeTileText,
                        { fontSize: sf(FontSize.sm) },
                        isSelected && styles.timeTileTextSelected,
                      ]}>
                        {t}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={[styles.nextBtn, !canAdvanceFromTime && styles.nextBtnDisabled]}
                onPress={canAdvanceFromTime ? () => goNext('confirm') : undefined}
                accessibilityRole="button"
                accessibilityState={{ disabled: !canAdvanceFromTime }}
                accessibilityLabel={canAdvanceFromTime ? `Continue with ${selectedTime}` : 'Select a time to continue'}
                activeOpacity={canAdvanceFromTime ? 0.85 : 1}
              >
                <Text style={[styles.nextBtnText, { fontSize: sf(FontSize.base) }]}>
                  {canAdvanceFromTime ? 'Review & Confirm →' : 'Select a time to continue'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Step 4: Confirm ──────────────────────────────────────────── */}
          {step === 'confirm' && selectedDate && selectedTime && (
            <View>
              {/* Summary card */}
              <View style={styles.summaryCard}>
                <Text style={[styles.summaryEmoji, { fontSize: sf(FontSize.hero) }]}>🗓</Text>
                <Text style={[styles.summaryTitle, { fontSize: sf(FontSize.lg) }]}>
                  Your Scheduled Ride
                </Text>

                <View style={styles.summaryDivider} />

                <SummaryRow label="Going to"   value={destination}          sf={sf} />
                <SummaryRow label="Day"        value={selectedDate.label}   sf={sf} />
                <SummaryRow label="Time"       value={selectedTime}         sf={sf} />
                <SummaryRow label="Pickup from" value="Your saved address"  sf={sf} />

                <View style={styles.summaryDivider} />

                <Text style={[styles.summaryNote, { fontSize: sf(FontSize.xs) }]}>
                  We'll send you a reminder 1 hour before your ride.
                  Your driver will be assigned the morning of your trip.
                </Text>
              </View>

              {/* gu-029: Accessibility notice — only shown if rider has mobility needs */}
              {(prefs.mobilityNeeds.length > 0 || prefs.mobilityNotes.trim().length > 0) && (
                <View style={styles.accessibilityNote}>
                  <Text style={[styles.accessibilityNoteText, { fontSize: sf(FontSize.xs) }]}>
                    ♿  Your driver will be notified of your accessibility needs before pickup.
                  </Text>
                </View>
              )}

              {/* Schedule CTA */}
              <TouchableOpacity
                style={styles.scheduleBtn}
                onPress={handleConfirm}
                accessibilityRole="button"
                accessibilityLabel={`Schedule ride to ${destination} on ${selectedDate.label} at ${selectedTime}`}
                activeOpacity={0.85}
              >
                <Text style={[styles.scheduleBtnText, { fontSize: sf(FontSize.lg) }]}>
                  Schedule It 🐴
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => { Vibration.vibrate(30); setStep('destination'); }}
                accessibilityRole="button"
                accessibilityLabel="Edit ride details"
                activeOpacity={0.7}
              >
                <Text style={[styles.editBtnText, { fontSize: sf(FontSize.sm) }]}>
                  ✏️  Edit details
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        <SOSButton onSOS={onSOS} />
        <MicFab onPress={onVoiceMic} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Summary Row ───────────────────────────────────────────────────────────────

function SummaryRow({ label, value, sf }: { label: string; value: string; sf: (n: number) => number }) {
  return (
    <View style={styles.summaryRow} accessibilityLabel={`${label}: ${value}`}>
      <Text style={[styles.summaryLabel, { fontSize: sf(FontSize.xs) }]}>{label}</Text>
      <Text style={[styles.summaryValue, { fontSize: sf(FontSize.base) }]}>{value}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    minWidth: TouchTarget.min,
    minHeight: TouchTarget.min,
    justifyContent: 'center',
  },
  backBtnText: { color: Colors.primary, fontWeight: '700' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontWeight: '800', color: Colors.textPrimary },
  stepIndicator: { /* fontSize set inline via sf(FontSize.xs) */ color: Colors.textSecondary, marginTop: 2 },
  headerSpacer: { minWidth: TouchTarget.min },

  // Progress bar
  progressTrack: { height: 4, backgroundColor: Colors.border },
  progressFill:  { height: 4, backgroundColor: Colors.primary },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.lg, gap: Spacing.md },

  sectionLabel: {
    color: Colors.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.4,
    marginBottom: Spacing.sm,
  },

  // Preset destination grid
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  presetTile: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderColor: Colors.border,
    padding: Spacing.md,
    alignItems: 'center',
    minHeight: TouchTarget.large,
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  // gu-onboarding-favorites-001: gold accent border distinguishes saved places from generic presets
  savedFavTile: {
    borderColor: Colors.primary,
    borderWidth: 1.5,
  },
  presetTileSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,  // Gold bg — black text = 8.6:1 ✅
  },
  presetEmoji: { /* fontSize set inline via sf(FontSize.lg) */ },
  presetLabel: { fontWeight: '600', color: Colors.textPrimary, textAlign: 'center' },
  presetLabelSelected: { color: '#FFFFFF' }, // Black on gold = 8.6:1 ✅

  // Custom input
  inputRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    color: Colors.textPrimary,
    minHeight: TouchTarget.min,
  },
  inputConfirmBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    minHeight: TouchTarget.min,
    justifyContent: 'center',
  },
  inputConfirmText: { color: '#FFFFFF', fontWeight: '700' /* fontSize set inline via sf(FontSize.xs) */ }, // Black on gold ✅

  // gu-057: autocomplete dropdown
  dropdownCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginTop: Spacing.xs,
    overflow: 'hidden',
  },
  suggestionRow: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    minHeight: TouchTarget.min,
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  suggestionRowLast: {
    borderBottomWidth: 0,
  },
  suggestionMain: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  suggestionSub: {
    color: Colors.textSecondary,
    marginTop: 2,
  },

  selectedBadge: {
    backgroundColor: Colors.surface,  // Navy surface + gold border ✅
    borderRadius: Radius.sm,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  selectedBadgeText: { color: Colors.textPrimary, fontWeight: '600' }, // White on navy = 15:1 ✅
  selectedBadgeDest: { fontWeight: '800' },

  // Day picker grid
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  dayTile: {
    width: '22%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TouchTarget.large,
    padding: Spacing.xs,
  },
  dayTileSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,  // Gold bg ✅
  },
  dayTileText: {
    color: Colors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
  dayTileTextSelected: { color: '#FFFFFF' }, // Black on gold = 8.6:1 ✅

  // Time picker grid
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  timeTile: {
    width: '30%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TouchTarget.min,
    paddingVertical: Spacing.sm,
  },
  timeTileSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,  // Gold bg ✅
  },
  timeTileText: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  timeTileTextSelected: { color: '#FFFFFF' }, // Black on gold = 8.6:1 ✅

  // Next button
  nextBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TouchTarget.xl,
    marginTop: Spacing.md,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  nextBtnDisabled: {
    backgroundColor: Colors.disabled,
    shadowOpacity: 0,
    elevation: 0,
  },
  nextBtnText: { color: '#FFFFFF', fontWeight: '800' }, // Black on gold = 8.6:1 ✅

  // Confirm summary card
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  summaryEmoji: { /* fontSize set inline via sf(FontSize.hero) */ marginBottom: Spacing.xs },
  summaryTitle: { fontWeight: '800', color: Colors.textPrimary },
  summaryDivider: { height: 1, backgroundColor: Colors.border, width: '100%', marginVertical: Spacing.xs },
  summaryRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  summaryLabel: { color: Colors.textSecondary, fontWeight: '500' },
  summaryValue:  { color: Colors.textPrimary,   fontWeight: '700', textAlign: 'right', flex: 1, marginLeft: Spacing.md },
  summaryNote: {
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: Spacing.xs,
  },

  // gu-029: Accessibility notice banner (matches BookingScreen pattern)
  accessibilityNote: {
    backgroundColor: 'rgba(0,102,255,0.15)',
    borderRadius: Radius.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  accessibilityNoteText: { color: Colors.textPrimary, lineHeight: 20 },

  // Schedule / edit buttons
  scheduleBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TouchTarget.xl,
    marginBottom: Spacing.md,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  scheduleBtnText: { color: '#FFFFFF', fontWeight: '900' }, // Black on gold — WCAG AAA
  editBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TouchTarget.min,
  },
  editBtnText: { color: Colors.textSecondary, fontWeight: '600' },
});
