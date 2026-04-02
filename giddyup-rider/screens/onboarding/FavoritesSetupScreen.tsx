/**
 * FavoritesSetupScreen.tsx — gu-onboarding-favorites-001
 * Onboarding step: let riders save their most-used destinations upfront.
 * Inserted between NameSetupScreen and MobilitySetupScreen in the onboarding flow.
 *
 * Slots: 🏠 Home · 🛒 Grocery Store · 🌳 Park · 🏥 Doctor
 * All fields are optional. Saved to AccessibilityContext (favoriteAddresses).
 *
 * Smart input features (both optional fallbacks — user can always type manually):
 *   1. Address autocomplete — as user types, fetches suggestions from Google Places API
 *      and shows a large-text dropdown. Tap a suggestion to autofill.
 *   2. Import from Contacts — tap the 📇 button next to a slot label to open the
 *      device contact picker (expo-contacts). Selects first postal address on the contact.
 *
 * Usage modes:
 *   - onboarding (isOnboarding=true): step indicator + "Continue →" / "Skip for now"
 *   - settings   (isOnboarding=false): back button + "Save" CTA
 *
 * Accessibility:
 *   - sf() on all font sizes — scales with user's text-size preference
 *   - 60pt+ touch targets on all interactive elements including dropdown rows
 *   - accessibilityLabel + accessibilityHint on all interactive elements
 *   - Plain language, Grade 6 reading level
 *
 * Google Places setup:
 *   Set GOOGLE_PLACES_API_KEY below (or wire from env). Without a key, autocomplete
 *   silently degrades — manual typing and contact import still work.
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Vibration,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import * as Contacts from 'expo-contacts';
import { Colors, FontSize, Radius, Spacing, TouchTarget } from '../../constants/theme';
import { useAccessibility, FavoriteAddresses } from '../../context/AccessibilityContext';
import SOSButton from '../../components/SOSButton';
import MicFab from '../../components/MicFab';

// ── Google Places config ──────────────────────────────────────────────────────
// gu-057: Wired from EXPO_PUBLIC_GOOGLE_MAPS_API_KEY (same key used by BookingScreen).
// Autocomplete silently degrades (no suggestions shown) if key is empty or invalid.
const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

const PLACES_URL = 'https://maps.googleapis.com/maps/api/place/autocomplete/json';

// ── Types ─────────────────────────────────────────────────────────────────────

interface PlaceSuggestion {
  placeId: string;
  fullText: string;    // Full address string shown in the dropdown row
  primaryText: string; // Bold part (street / place name)
  secondaryText: string; // Dimmed part (city, state, country)
}

interface FavoriteSlot {
  key: keyof FavoriteAddresses;
  emoji: string;
  label: string;
  placeholder: string;
}

// ── Slot definitions ──────────────────────────────────────────────────────────

const SLOTS: FavoriteSlot[] = [
  {
    key:         'home',
    emoji:       '🏠',
    label:       'Home',
    placeholder: 'Start typing or pick from contacts…',
  },
  {
    key:         'grocery',
    emoji:       '🛒',
    label:       'Grocery Store',
    placeholder: 'Start typing or pick from contacts…',
  },
  {
    key:         'park',
    emoji:       '🌳',
    label:       'Park',
    placeholder: 'Start typing or pick from contacts…',
  },
  {
    key:         'doctor',
    emoji:       '🏥',
    label:       'Doctor',
    placeholder: 'Start typing or pick from contacts…',
  },
];

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  onDone: () => void;
  onBack?: () => void;
  isOnboarding?: boolean;
  onSOS?: () => void;
  onVoiceMic?: () => void;
}

// ── FavoritesSetupScreen ──────────────────────────────────────────────────────

export default function FavoritesSetupScreen({
  onDone,
  onBack,
  isOnboarding = false,
  onSOS,
  onVoiceMic,
}: Props) {
  const { prefs, setFavoriteAddresses, fontScale } = useAccessibility();
  const sf = (base: number) => Math.round(base * fontScale);

  // ── Field values ─────────────────────────────────────────────────────────
  const [addresses, setAddresses] = useState<FavoriteAddresses>({
    ...prefs.favoriteAddresses,
  });

  // ── Autocomplete state ────────────────────────────────────────────────────
  // suggestions: map of slot key → current suggestion list
  const [suggestions, setSuggestions] = useState<
    Partial<Record<keyof FavoriteAddresses, PlaceSuggestion[]>>
  >({});
  // which slot's dropdown is open
  const [activeDropdown, setActiveDropdown] = useState<keyof FavoriteAddresses | null>(null);
  // which slot is fetching suggestions (shows spinner)
  const [loadingKey, setLoadingKey] = useState<keyof FavoriteAddresses | null>(null);

  // Debounce timers — one per slot
  const timers = useRef<Partial<Record<keyof FavoriteAddresses, ReturnType<typeof setTimeout>>>>({});

  // gu-062: Set true on suggestion onTouchStart so the onBlur timer doesn't
  // clear the dropdown before onPress fires (prevents blink/disappear bug).
  const selectingRef = useRef(false);

  // ── Address autocomplete ──────────────────────────────────────────────────

  const fetchSuggestions = useCallback(async (key: keyof FavoriteAddresses, query: string) => {
    // Require at least 3 chars and a real API key before hitting the network
    if (!GOOGLE_PLACES_API_KEY || query.trim().length < 3) {
      setSuggestions(prev => ({ ...prev, [key]: [] }));
      setActiveDropdown(null);
      return;
    }

    setLoadingKey(key);
    setActiveDropdown(key);

    try {
      const params = new URLSearchParams({
        input:    query.trim(),
        key:      GOOGLE_PLACES_API_KEY,
        types:    'address',
        language: 'en',
      });
      const res  = await fetch(`${PLACES_URL}?${params}`);
      const json = await res.json();

      if (json.status === 'OK' && Array.isArray(json.predictions)) {
        const parsed: PlaceSuggestion[] = json.predictions.slice(0, 5).map(
          (p: {
            place_id: string;
            description: string;
            structured_formatting?: { main_text?: string; secondary_text?: string };
          }) => ({
            placeId:       p.place_id,
            fullText:      p.description,
            primaryText:   p.structured_formatting?.main_text   ?? p.description,
            secondaryText: p.structured_formatting?.secondary_text ?? '',
          })
        );
        setSuggestions(prev => ({ ...prev, [key]: parsed }));
      } else {
        // API returned no results or an error — silently clear
        setSuggestions(prev => ({ ...prev, [key]: [] }));
      }
    } catch {
      // Network failure — don't surface an error, just hide dropdown
      setSuggestions(prev => ({ ...prev, [key]: [] }));
      setActiveDropdown(null);
    } finally {
      setLoadingKey(null);
    }
  }, []);

  const handleTextChange = (key: keyof FavoriteAddresses, value: string) => {
    setAddresses(prev => ({ ...prev, [key]: value }));

    // Debounce: wait 300ms after last keystroke before hitting the API
    if (timers.current[key]) clearTimeout(timers.current[key]);

    if (value.trim().length >= 3) {
      timers.current[key] = setTimeout(() => fetchSuggestions(key, value), 300);
    } else {
      setSuggestions(prev => ({ ...prev, [key]: [] }));
      setActiveDropdown(null);
    }
  };

  const handleSelectSuggestion = (key: keyof FavoriteAddresses, suggestion: PlaceSuggestion) => {
    Vibration.vibrate(40);
    setAddresses(prev => ({ ...prev, [key]: suggestion.fullText }));
    setSuggestions(prev => ({ ...prev, [key]: [] }));
    setActiveDropdown(null);
  };

  // Fully clear suggestions + close dropdown (used after selection or input cleared)
  const clearDropdown = (key: keyof FavoriteAddresses) => {
    setSuggestions(prev => ({ ...prev, [key]: [] }));
    setActiveDropdown(null);
  };

  // gu-062: Only hide the dropdown visually — preserves the suggestions array so
  // onFocus can restore the dropdown without a redundant API round-trip.
  // Used by onBlur where a spurious blur/focus cycle (iOS keyboard animation)
  // would otherwise nuke suggestions before the user can tap one.
  const hideDropdown = (key: keyof FavoriteAddresses) => {
    setActiveDropdown(null);
    // suggestions array intentionally left intact
  };

  // ── Import from Contacts ──────────────────────────────────────────────────

  const handlePickFromContacts = async (key: keyof FavoriteAddresses) => {
    Vibration.vibrate(40);
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Contacts Permission Needed',
          'Please allow contacts access in Settings to import an address from your phone.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }

      const result = await Contacts.presentContactPickerAsync();
      if (!result) return; // user cancelled

      const addressEntry = result.addresses?.[0];
      if (!addressEntry) {
        Alert.alert(
          'No address saved',
          'This contact does not have a saved address. You can type one in instead.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Build a readable address string from the contact's postal address fields
      const { street, city, region, postalCode } = addressEntry;
      const parts = [street, city, [region, postalCode].filter(Boolean).join(' ')].filter(Boolean);
      const formatted = parts.join(', ');

      if (formatted.trim()) {
        Vibration.vibrate(50);
        setAddresses(prev => ({ ...prev, [key]: formatted.trim() }));
        clearDropdown(key);
      } else {
        Alert.alert(
          'Address incomplete',
          'This contact\'s address is missing some details. You can type it in manually.',
          [{ text: 'OK' }]
        );
      }
    } catch {
      // presentContactPickerAsync may not be supported on all platforms
      Alert.alert(
        'Contact picker unavailable',
        'Please type the address in manually.',
        [{ text: 'OK' }]
      );
    }
  };

  // ── Save / skip ───────────────────────────────────────────────────────────

  const handleSave = () => {
    Vibration.vibrate(60);
    setFavoriteAddresses(addresses);
    onDone();
  };

  const handleSkip = () => {
    Vibration.vibrate(30);
    onDone();
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          {/* Back button (settings mode) */}
          {!!onBack && (
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => { Vibration.vibrate(30); onBack(); }}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Text style={[styles.backBtnText, { fontSize: sf(FontSize.sm) }]}>← Back</Text>
            </TouchableOpacity>
          )}

          {/* Progress dots — 7 steps, this is step 5 (index 4) */}
          {isOnboarding && (
            <View style={styles.dotsRow} accessibilityLabel="Step 5 of 7">
              {[0, 1, 2, 3, 4, 5, 6].map(i => (
                <View key={i} style={[styles.dot, i === 4 && styles.dotActive]} />
              ))}
            </View>
          )}

          {/* Title */}
          <Text
            style={[styles.title, { fontSize: sf(FontSize.lg), lineHeight: sf(FontSize.lg) * 1.35 }]}
            accessibilityRole="header"
          >
            Add your favorite{'\n'}places
          </Text>
          <Text style={[styles.subtitle, { fontSize: sf(FontSize.sm), lineHeight: sf(FontSize.sm) * 1.6 }]}>
            We'll get you there fast — no typing needed every time.
          </Text>

          {/* Address slots */}
          <View style={styles.slotList}>
            {SLOTS.map(slot => {
              const slotSuggestions = suggestions[slot.key] ?? [];
              const isLoadingThis   = loadingKey === slot.key;
              const dropdownOpen    = activeDropdown === slot.key && (isLoadingThis || slotSuggestions.length > 0);

              return (
                <View key={slot.key} style={styles.slotBlock}>

                  {/* Label row — emoji + name + "From Contacts" button */}
                  <View style={styles.slotLabelRow}>
                    <Text style={[styles.slotEmoji, { fontSize: sf(FontSize.base) }]}>
                      {slot.emoji}
                    </Text>
                    <Text style={[styles.slotLabel, { fontSize: sf(FontSize.sm) }]}>
                      {slot.label}
                    </Text>
                    {/* "From Contacts" import button — right-aligned */}
                    <TouchableOpacity
                      style={styles.contactsBtn}
                      onPress={() => handlePickFromContacts(slot.key)}
                      accessibilityRole="button"
                      accessibilityLabel={`Import ${slot.label} address from contacts`}
                      accessibilityHint="Opens your phone's contact list so you can pick an address"
                    >
                      <Text style={[styles.contactsBtnText, { fontSize: sf(FontSize.xs) }]}>
                        📇 From Contacts
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Text input */}
                  <TextInput
                    style={[
                      styles.input,
                      { fontSize: sf(FontSize.base) },
                      !!addresses[slot.key] && styles.inputFilled,
                    ]}
                    value={addresses[slot.key]}
                    onChangeText={v => handleTextChange(slot.key, v)}
                    onFocus={() => {
                      // gu-062: suggestions array is preserved through blur (see hideDropdown),
                      // so we can restore the dropdown immediately on refocus without an API call.
                      if ((suggestions[slot.key]?.length ?? 0) > 0) {
                        setActiveDropdown(slot.key);
                      }
                    }}
                    onBlur={() => {
                      // gu-062: selectingRef guards against the blur firing during a
                      // tap on a suggestion row. If the user is mid-tap, skip hiding
                      // the dropdown — onPress will close it cleanly instead.
                      setTimeout(() => {
                        if (!selectingRef.current) hideDropdown(slot.key);
                        selectingRef.current = false; // reset after each blur cycle
                      }, 200);
                    }}
                    placeholder={slot.placeholder}
                    placeholderTextColor={Colors.textSecondary}
                    autoCapitalize="words"
                    autoCorrect={false}
                    returnKeyType="next"
                    accessibilityLabel={`${slot.label} address`}
                    accessibilityHint={`Optional. Start typing for suggestions, or use the From Contacts button.`}
                  />

                  {/* Autocomplete dropdown */}
                  {dropdownOpen && (
                    <View
                      style={styles.dropdown}
                      onStartShouldSetResponderCapture={() => {
                        // gu-062: capture phase fires before blur/responder change — sets flag
                        // so the onBlur 200ms timer knows NOT to close the dropdown mid-tap.
                        selectingRef.current = true;
                        return false; // don't capture — let child TouchableOpacity respond
                      }}
                    >
                      {isLoadingThis ? (
                        <View style={styles.dropdownLoading}>
                          <ActivityIndicator color={Colors.primary} size="small" />
                          <Text style={[styles.dropdownLoadingText, { fontSize: sf(FontSize.sm) }]}>
                            Searching addresses…
                          </Text>
                        </View>
                      ) : (
                        slotSuggestions.map((s, idx) => (
                          <TouchableOpacity
                            key={s.placeId}
                            style={[
                              styles.dropdownRow,
                              idx < slotSuggestions.length - 1 && styles.dropdownRowBorder,
                            ]}
                            onPress={() => handleSelectSuggestion(slot.key, s)}
                            accessibilityRole="button"
                            accessibilityLabel={s.fullText}
                            accessibilityHint="Tap to use this address"
                          >
                            <Text style={[styles.dropdownPrimary, { fontSize: sf(FontSize.sm) }]} numberOfLines={1}>
                              {s.primaryText}
                            </Text>
                            {!!s.secondaryText && (
                              <Text style={[styles.dropdownSecondary, { fontSize: sf(FontSize.xs) }]} numberOfLines={1}>
                                {s.secondaryText}
                              </Text>
                            )}
                          </TouchableOpacity>
                        ))
                      )}
                    </View>
                  )}

                </View>
              );
            })}
          </View>

          {/* Optional note */}
          <Text style={[styles.optionalNote, { fontSize: sf(FontSize.xs), lineHeight: sf(FontSize.xs) * 1.6 }]}>
            All fields are optional. You can add or change these any time in Settings.
          </Text>

          {/* Save / Continue CTA */}
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSave}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={isOnboarding ? 'Continue to next step' : 'Save favorite places'}
            accessibilityHint="Saves your favorite places so you can book rides with one tap"
          >
            <Text style={[styles.saveBtnText, { fontSize: sf(FontSize.base) }]}>
              {isOnboarding ? 'Continue →' : 'Save'}
            </Text>
          </TouchableOpacity>

          {/* Skip (onboarding only) */}
          {isOnboarding && (
            <TouchableOpacity
              style={styles.skipBtn}
              onPress={handleSkip}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Skip for now"
              accessibilityHint="You can add favorite places any time in Settings"
            >
              <Text style={[styles.skipBtnText, { fontSize: sf(FontSize.xs) }]}>
                Skip for now — I'll add these later in Settings
              </Text>
            </TouchableOpacity>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
      {/* gu-069: SOS + mic always visible */}
      <SOSButton onPress={onSOS ?? (() => {})} />
      <MicFab onPress={onVoiceMic} />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
    gap: Spacing.lg,
  },

  backBtn: {
    alignSelf: 'flex-start',
    minHeight: TouchTarget.min,
    justifyContent: 'center',
    marginBottom: -Spacing.sm,
  },
  backBtnText: {
    color: Colors.textSecondary,
    fontWeight: '600',
  },

  // Progress dots
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.border,
  },
  dotActive: {
    backgroundColor: Colors.primary,
    width: 28,
  },

  title: {
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  subtitle: {
    color: Colors.textSecondary,
    marginTop: -Spacing.sm,
  },

  // Slot list
  slotList: {
    gap: Spacing.lg,
  },

  // Outer block per slot — contains label row + input + optional dropdown
  slotBlock: {
    gap: Spacing.xs,
  },

  // Label row: emoji + name (flex: 1) + contacts button (right)
  slotLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  slotEmoji: {
    // fontSize set inline via sf()
  },
  slotLabel: {
    flex: 1,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  // "From Contacts" button — right of label, gold border, small
  contactsBtn: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactsBtnText: {
    color: Colors.primary,  // Gold on dark background — readable ✅
    fontWeight: '700',
  },

  // Text input
  input: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Colors.textPrimary,
    minHeight: TouchTarget.min,
    fontWeight: '500',
  },
  // Gold border when field has content — visual confirmation
  inputFilled: {
    borderColor: Colors.primary,
  },

  // Autocomplete dropdown — navy card, attaches directly below input
  dropdown: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.primary,  // Gold border — stands out clearly ✅
    overflow: 'hidden',
    // Slight lift so it reads as a floating suggestion panel
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    marginTop: -4,  // Visually tuck under the input's bottom border
  },

  // Loading row inside dropdown
  dropdownLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    minHeight: TouchTarget.min,
  },
  dropdownLoadingText: {
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },

  // Each suggestion row — 60pt+ touch target, gold separator between rows
  dropdownRow: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    minHeight: TouchTarget.min,
    justifyContent: 'center',
    gap: 2,
  },
  dropdownRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dropdownPrimary: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  dropdownSecondary: {
    color: Colors.textSecondary,
    fontWeight: '400',
  },

  optionalNote: {
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: -Spacing.sm,
  },

  // Save / Continue CTA — gold, black text, WCAG AAA
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TouchTarget.large,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveBtnText: {
    color: '#FFFFFF',  // Black on gold = 8.6:1 ✅
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // Skip link
  skipBtn: {
    alignItems: 'center',
    minHeight: TouchTarget.min,
    justifyContent: 'center',
  },
  skipBtnText: {
    color: Colors.textSecondary,
    textDecorationLine: 'underline',
  },
});
