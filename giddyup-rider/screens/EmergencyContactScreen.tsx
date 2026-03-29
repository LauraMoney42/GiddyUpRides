// GiddyUp Rides — EmergencyContactScreen.tsx
// gu-019: Emergency contact setup — picker + manual entry.
//
// Usage modes:
//   - onboarding (isOnboarding=true): step indicator + title + "Continue →" CTA + "Skip for now"
//   - settings   (isOnboarding=false, default): header nav bar + "← Back"
//
// Features:
//   - Import from phone contacts via expo-contacts picker
//   - Manual entry (name + phone number)
//   - List of saved contacts with tap-to-call + delete
//   - Max 3 personal contacts
//   - Saved contacts auto-populate SOSScreen when SOS is triggered
//   - GiddyUp dispatch is always added as a fixed entry in SOSScreen (not shown here)
//
// Accessibility-first:
//   - sf() scaling throughout
//   - 60pt+ touch targets
//   - accessibilityLabel + accessibilityHint on all interactive elements
//   - Plain language

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
  Linking,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as Contacts from 'expo-contacts';
import { Colors, FontSize, Radius, Spacing, TouchTarget } from '../constants/theme';
import { useAccessibility, EmergencyContact } from '../context/AccessibilityContext';

const MAX_CONTACTS = 3;

// ── EmergencyContactScreen ────────────────────────────────────────────────────

interface Props {
  onBack?: () => void;
  /** Called when onboarding "Continue" or "Skip for now" is tapped */
  onDone?: () => void;
  /** If true: shows step indicator + title + "Continue →" / "Skip for now" (onboarding mode) */
  isOnboarding?: boolean;
}

export default function EmergencyContactScreen({ onBack, onDone, isOnboarding = false }: Props) {
  const { fontScale, prefs, setEmergencyContacts } = useAccessibility();
  const sf = (base: number) => Math.round(base * fontScale);

  const contacts = prefs.emergencyContacts;

  // ── Manual entry state ────────────────────────────────────────────────────
  const [manualName,  setManualName]  = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualRole,  setManualRole]  = useState('');
  const [showForm,    setShowForm]    = useState(false);

  // ── Helpers ───────────────────────────────────────────────────────────────

  function addContact(contact: Omit<EmergencyContact, 'id'>) {
    if (contacts.length >= MAX_CONTACTS) {
      Alert.alert(
        'Contact limit reached',
        `You can have up to ${MAX_CONTACTS} emergency contacts. Remove one to add another.`,
        [{ text: 'OK' }]
      );
      return;
    }
    const newContact: EmergencyContact = {
      ...contact,
      id: `ec_${Date.now()}`,
    };
    setEmergencyContacts([...contacts, newContact]);
  }

  function removeContact(id: string) {
    Alert.alert(
      'Remove contact?',
      'This person will no longer be notified during an SOS alert.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            Vibration.vibrate(40);
            setEmergencyContacts(contacts.filter(c => c.id !== id));
          },
        },
      ]
    );
  }

  // ── Phone contacts picker ─────────────────────────────────────────────────

  async function handlePickContact() {
    Vibration.vibrate(40);
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Contacts Permission Needed',
          'Please allow contacts access in Settings to import from your phone.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }

      const result = await Contacts.presentContactPickerAsync();
      if (!result) return; // user cancelled

      // Find a usable phone number
      const phoneEntry = result.phoneNumbers?.[0];
      if (!phoneEntry?.number) {
        Alert.alert(
          'No phone number',
          'This contact has no phone number saved. Please enter it manually.',
          [{ text: 'OK' }]
        );
        return;
      }

      // gu-041: expo-contacts can return name as '' (empty string) on iOS,
      // not just undefined — so ?. trim + || catches both empty and missing.
      const firstName = result.firstName?.trim() ?? '';
      const lastName  = result.lastName?.trim()  ?? '';
      const name =
        result.name?.trim()                              // composite name if present
        || [firstName, lastName].filter(Boolean).join(' ') // first+last fallback
        || 'Unknown';                                    // last resort
      const phone = phoneEntry.number.replace(/\s/g, '');

      addContact({ name, phone, role: '' });
    } catch {
      // presentContactPickerAsync may not be supported on all platforms
      Alert.alert(
        'Contact picker unavailable',
        'Please enter your emergency contact details manually below.',
        [{ text: 'OK', onPress: () => setShowForm(true) }]
      );
    }
  }

  // ── Manual save ───────────────────────────────────────────────────────────

  function handleManualSave() {
    const name  = manualName.trim();
    const phone = manualPhone.trim().replace(/\s/g, '');
    if (!name) {
      Alert.alert('Name required', 'Please enter the contact\'s name.');
      return;
    }
    if (!phone || phone.length < 7) {
      Alert.alert('Phone number required', 'Please enter a valid phone number.');
      return;
    }
    Vibration.vibrate(50);
    addContact({ name, phone, role: manualRole.trim() });
    setManualName('');
    setManualPhone('');
    setManualRole('');
    setShowForm(false);
  }

  const handleContinue = () => {
    Vibration.vibrate(60);
    onDone?.();
  };

  const handleSkip = () => {
    Vibration.vibrate(30);
    onDone?.(); // saves nothing — contacts stay as empty defaults
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const atLimit = contacts.length >= MAX_CONTACTS;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Settings-mode header (back button + title bar) */}
        {!isOnboarding && (
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => { Vibration.vibrate(30); onBack?.(); }}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              accessibilityHint="Returns to settings"
            >
              <Text style={[styles.backBtnText, { fontSize: sf(FontSize.sm) }]}>← Back</Text>
            </TouchableOpacity>
            <Text
              style={[styles.title, { fontSize: sf(FontSize.lg) }]}
              adjustsFontSizeToFit
              numberOfLines={1}
            >
              Emergency Contacts
            </Text>
            <View style={styles.backBtn} />
          </View>
        )}

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, isOnboarding && styles.contentOnboarding]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Onboarding-mode header (step indicator + title + subtitle) */}
          {isOnboarding && (
            <>
              {/* Progress dots — 7 steps, this is step 3 (index 2) */}
              <View style={styles.dotsRow} accessibilityLabel="Step 3 of 7">
                {[0, 1, 2, 3, 4, 5, 6].map(i => (
                  <View key={i} style={[styles.dot, i === 2 && styles.dotActive]} />
                ))}
              </View>
              <Text
                style={[styles.onboardingTitle, { fontSize: sf(FontSize.lg), lineHeight: sf(FontSize.lg) * 1.35 }]}
                accessibilityRole="header"
              >
                Add an emergency{'\n'}contact
              </Text>
              <Text style={[styles.onboardingSubtitle, { fontSize: sf(FontSize.sm), lineHeight: sf(FontSize.sm) * 1.6 }]}>
                If you tap SOS, we'll notify this person right away.
              </Text>
            </>
          )}

          {/* Explanation (settings mode only) */}
          {!isOnboarding && (
            <View style={styles.infoCard}>
              <Text style={[styles.infoEmoji]}>🚨</Text>
              <Text style={[styles.infoText, { fontSize: sf(FontSize.sm), lineHeight: sf(FontSize.sm) * 1.5 }]}>
                These people will be notified immediately when you trigger the SOS button.
                GiddyUp dispatch is always notified — add personal contacts below (up to {MAX_CONTACTS}).
              </Text>
            </View>
          )}

          {/* Saved contacts list */}
          {contacts.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { fontSize: sf(FontSize.xs) }]}>YOUR CONTACTS</Text>
              {contacts.map(contact => (
                <View key={contact.id} style={styles.contactCard}>
                  {/* gu-contact-card-layout-001: Top row — avatar + name/role/phone stacked */}
                  <View style={styles.contactTopRow}>
                    <View style={styles.contactAvatar}>
                      <Text style={[styles.contactInitial, { fontSize: sf(FontSize.base) }]}>
                        {contact.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.contactInfo}>
                      <Text style={[styles.contactName, { fontSize: sf(FontSize.base) }]}>
                        {contact.name}
                      </Text>
                      {!!contact.role && (
                        <Text style={[styles.contactRole, { fontSize: sf(FontSize.xs) }]}>
                          {contact.role}
                        </Text>
                      )}
                      <TouchableOpacity
                        onPress={() => { Vibration.vibrate(30); Linking.openURL(`tel:${contact.phone}`); }}
                        accessibilityRole="button"
                        accessibilityLabel={`Call ${contact.name}`}
                      >
                        <Text
                          style={[styles.contactPhone, { fontSize: sf(FontSize.sm) }]}
                          numberOfLines={1}
                        >
                          {contact.phone}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  {/* Remove button sits below name/phone — no overlap */}
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => removeContact(contact.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${contact.name}`}
                    accessibilityHint="Removes this person from your emergency contacts"
                  >
                    <Text style={[styles.removeBtnText, { fontSize: sf(FontSize.xs) }]}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {contacts.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>👤</Text>
              <Text style={[styles.emptyText, { fontSize: sf(FontSize.sm) }]}>
                No personal contacts added yet.
              </Text>
              <Text style={[styles.emptySubtext, { fontSize: sf(FontSize.xs), lineHeight: sf(FontSize.xs) * 1.5 }]}>
                Add someone who should be called if you need help.
              </Text>
            </View>
          )}

          {/* Add actions */}
          {!atLimit && (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { fontSize: sf(FontSize.xs) }]}>ADD A CONTACT</Text>

              {/* Import from phone */}
              <TouchableOpacity
                style={styles.addButton}
                onPress={handlePickContact}
                accessibilityRole="button"
                accessibilityLabel="Import from phone contacts"
                accessibilityHint="Opens your phone's contact list so you can pick someone"
              >
                <Text style={[styles.addButtonIcon, { fontSize: sf(FontSize.xl) }]}>📱</Text>
                <Text style={[styles.addButtonText, { fontSize: sf(FontSize.base) }]}>
                  Import from Phone
                </Text>
              </TouchableOpacity>

              {/* Manual entry toggle */}
              <TouchableOpacity
                style={[styles.addButton, styles.addButtonSecondary]}
                onPress={() => { Vibration.vibrate(30); setShowForm(v => !v); }}
                accessibilityRole="button"
                accessibilityLabel={showForm ? 'Hide manual entry form' : 'Enter contact manually'}
                accessibilityHint="Enter a name and phone number by typing"
              >
                <Text style={[styles.addButtonIcon, { fontSize: sf(FontSize.xl) }]}>✏️</Text>
                <Text style={[styles.addButtonText, styles.addButtonTextSecondary, { fontSize: sf(FontSize.base) }]}>
                  {showForm ? 'Hide Form' : 'Enter Manually'}
                </Text>
              </TouchableOpacity>

              {/* Manual entry form */}
              {showForm && (
                <View style={styles.form}>
                  <Text style={[styles.fieldLabel, { fontSize: sf(FontSize.xs) }]}>Name *</Text>
                  <TextInput
                    style={[styles.input, { fontSize: sf(FontSize.base) }]}
                    value={manualName}
                    onChangeText={setManualName}
                    placeholder="e.g. Margaret Smith"
                    placeholderTextColor={Colors.textSecondary}
                    autoCapitalize="words"
                    returnKeyType="next"
                    accessibilityLabel="Contact name"
                  />

                  <Text style={[styles.fieldLabel, { fontSize: sf(FontSize.xs) }]}>Phone Number *</Text>
                  <TextInput
                    style={[styles.input, { fontSize: sf(FontSize.base) }]}
                    value={manualPhone}
                    onChangeText={setManualPhone}
                    placeholder="e.g. +1 555 000 1111"
                    placeholderTextColor={Colors.textSecondary}
                    keyboardType="phone-pad"
                    returnKeyType="next"
                    accessibilityLabel="Contact phone number"
                  />

                  <Text style={[styles.fieldLabel, { fontSize: sf(FontSize.xs) }]}>
                    Relationship (optional)
                  </Text>
                  <TextInput
                    style={[styles.input, { fontSize: sf(FontSize.base) }]}
                    value={manualRole}
                    onChangeText={setManualRole}
                    placeholder="e.g. Son, Caregiver, Neighbour"
                    placeholderTextColor={Colors.textSecondary}
                    autoCapitalize="words"
                    returnKeyType="done"
                    onSubmitEditing={handleManualSave}
                    accessibilityLabel="Contact relationship"
                  />

                  <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={handleManualSave}
                    accessibilityRole="button"
                    accessibilityLabel="Save contact"
                  >
                    <Text style={[styles.saveBtnText, { fontSize: sf(FontSize.base) }]}>
                      ✓ Save Contact
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {atLimit && (
            <View style={styles.limitBadge}>
              <Text style={[styles.limitText, { fontSize: sf(FontSize.xs) }]}>
                Maximum of {MAX_CONTACTS} contacts reached. Remove one to add another.
              </Text>
            </View>
          )}

          {/* Onboarding CTAs */}
          {isOnboarding && (
            <>
              <TouchableOpacity
                style={styles.continueBtn}
                onPress={handleContinue}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Continue to next step"
                accessibilityHint="Saves your emergency contact and moves to the next onboarding step"
              >
                <Text style={[styles.continueBtnText, { fontSize: sf(FontSize.base) }]}>
                  Continue →
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.skipBtn}
                onPress={handleSkip}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel="Skip for now"
                accessibilityHint="You can add an emergency contact any time in Settings"
              >
                <Text style={[styles.skipBtnText, { fontSize: sf(FontSize.xs) }]}>
                  Skip for now — I'll add this later in Settings
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* Bottom padding */}
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  kav: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    minWidth: 80,
    minHeight: TouchTarget.min,
    justifyContent: 'center',
  },
  backBtnText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '700',
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    flex: 1,
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },

  // Info card
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,   // Navy surface ✅
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primary,        // Gold border ✅
  },
  infoEmoji: {
    fontSize: FontSize.base,
    lineHeight: 28,
  },
  infoText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,          // White on navy = 15:1 ✅
  },

  // Section
  section: {
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  sectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 4,
  },

  // Contact card — gu-contact-card-layout-001: vertical layout, Remove below name/phone
  contactCard: {
    flexDirection: 'column',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  // Top row: avatar + stacked text (name / role / phone)
  contactTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  contactInitial: {
    fontSize: FontSize.base,
    fontWeight: '800',
    color: '#000000', // Black on gold avatar — WCAG AAA
  },
  contactInfo: {
    flex: 1,
    gap: 2,
  },
  contactName: {
    fontSize: FontSize.base,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  contactRole: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  contactPhone: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  // Remove button — full width below the name/phone block, never overlaps text
  removeBtn: {
    borderWidth: 1.5,
    borderColor: '#D62828',
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    minHeight: TouchTarget.min,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeBtnText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: '#D62828',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  emptyEmoji: {
    fontSize: FontSize.hero,
  },
  emptyText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  emptySubtext: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
  },

  // Add buttons
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    minHeight: TouchTarget.min,
    gap: Spacing.sm,
  },
  addButtonSecondary: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  addButtonIcon: {
    fontSize: FontSize.base,
  },
  addButtonText: {
    fontSize: FontSize.base,
    fontWeight: '800',
    color: '#000000',      // Black on gold = 8.6:1 ✅
  },
  addButtonTextSecondary: {
    color: Colors.primary, // secondary button — primary color text
  },

  // Form
  form: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: Spacing.xs,
  },
  fieldLabel: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    minHeight: TouchTarget.min,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    minHeight: TouchTarget.min,
    marginTop: Spacing.xs,
  },
  saveBtnText: {
    fontSize: FontSize.base,
    fontWeight: '800',
    color: '#000000', // Black on gold — WCAG AAA
  },

  // Onboarding-mode content padding
  contentOnboarding: {
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
    gap: Spacing.lg,
  },

  // Onboarding progress dots (replaces "Step X of 5" text)
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

  // Onboarding title + subtitle
  onboardingTitle: {
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  onboardingSubtitle: {
    color: Colors.textSecondary,
    marginTop: -Spacing.sm,
  },

  // Continue CTA (onboarding)
  continueBtn: {
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
    marginTop: Spacing.sm,
  },
  continueBtnText: {
    color: '#000000', // Black on gold — WCAG AAA
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // Skip link (onboarding)
  skipBtn: {
    alignItems: 'center',
    minHeight: TouchTarget.min,
    justifyContent: 'center',
  },
  skipBtnText: {
    color: Colors.textSecondary,
    textDecorationLine: 'underline',
  },

  // Limit badge
  limitBadge: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary,        // Gold border ✅
    marginBottom: Spacing.lg,
  },
  limitText: {
    fontSize: FontSize.xs,
    color: Colors.textPrimary,          // White on navy = 15:1 ✅
    textAlign: 'center',
    fontWeight: '600',
  },
});
