// GiddyUp Rides — SettingsScreen.tsx
// Settings screen for the rider app, KindCode style.
// Matches POTS Buddy / TicBuddy settings pattern:
//   - Grouped sections with clear headers
//   - 60pt+ touch targets throughout
//   - 22pt+ fonts
//   - Full VoiceOver/TalkBack accessibility labels
//   - Haptic feedback on every tap

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  StyleSheet,
  SafeAreaView,
  Vibration,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Radius, Spacing, TouchTarget } from '../constants/theme';
import { useAccessibility, TextSizeOption } from '../context/AccessibilityContext';
import MicFab from '../components/MicFab';
import SOSButton from '../components/SOSButton';

// ── Constants ─────────────────────────────────────────────────────────────────

const APP_VERSION = '1.0.0 (MVP1)';
const SUPPORT_EMAIL  = 'kindcodedevelopment@gmail.com'; // gu-027: KindCode dev team
const KINDCODE_URL   = 'https://kindcode.us';            // gu-027: KindCode website
// TODO gu-027: confirm correct URLs with owner before updating
const PRIVACY_URL    = 'https://kindcode.ca/privacy';
const TERMS_URL      = 'https://kindcode.ca/terms';

// Values MUST match TextSizeOption in AccessibilityContext — context is the source of truth
const TEXT_SIZE_OPTIONS: { value: TextSizeOption; label: string; preview: number }[] = [
  { value: 'normal',  label: 'Normal',      preview: 20 },
  { value: 'large',   label: 'Large',       preview: 24 },
  { value: 'xlarge',  label: 'Extra Large', preview: 30 },
  { value: 'xxlarge', label: 'XXL',         preview: 36 },
];

// ── SettingsScreen ─────────────────────────────────────────────────────────────

interface SettingsScreenProps {
  userName?: string;
  onBack?: () => void;
  onSignOut?: () => void;
  onEmergencyContacts?: () => void;  // gu-019
  onMobilitySettings?: () => void;   // gu-029
  onFavoriteSettings?: () => void;   // gu-onboarding-favorites-001: edit saved places
  onSOS?: () => void;                // gu-059: SOS always visible
  onVoiceMic?: () => void;           // gu-059: bottom nav mic
}

export default function SettingsScreen({
  userName = 'there',
  onBack,
  onSignOut,
  onEmergencyContacts,
  onMobilitySettings,
  onFavoriteSettings,
  onSOS,
  onVoiceMic,
}: SettingsScreenProps) {
  const { fontScale, prefs, setTextSize: ctxSetTextSize, setReadAloud: ctxSetReadAloud } = useAccessibility();
  const sf = (base: number) => Math.round(base * fontScale);

  // Seeded from context prefs so Settings reflects the user's current onboarding choices
  const [textSize, setTextSize] = useState<TextSizeOption>(prefs.textSize);
  const [readAloud, setReadAloud] = useState(prefs.readAloud === 'yes');
  const [highContrast, setHighContrast] = useState(false);

  // Account
  const [displayName] = useState(userName);
  // gu-019: derive display text from context contacts
  const emergencyContactCount = prefs.emergencyContacts.length;
  const emergencyContactLabel = emergencyContactCount > 0
    ? `${emergencyContactCount} contact${emergencyContactCount > 1 ? 's' : ''} saved`
    : 'Not set';

  // gu-onboarding-favorites-001: count how many favorite addresses are filled in
  const favAddresses = prefs.favoriteAddresses;
  const favCount = [favAddresses.home, favAddresses.grocery, favAddresses.park, favAddresses.doctor]
    .filter(a => a.trim().length > 0).length;
  const favLabel = favCount > 0 ? `${favCount} of 4 saved` : 'None saved';

  const handleBugReport = () => {
    Vibration.vibrate(50);
    // gu-027: subject + body reference "Giddy-Up Rides" brand name
    const subject = encodeURIComponent('Giddy-Up Rides — Bug / Question');
    const body = encodeURIComponent(
      'Hi KindCode team,\n\nI have a question or found an issue with Giddy-Up Rides:\n\n[Please describe here]\n\nApp version: ' + APP_VERSION
    );
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`).catch(() => {
      Alert.alert(
        'Could not open email',
        `Please email us directly at ${SUPPORT_EMAIL}`,
        [{ text: 'OK' }]
      );
    });
  };

  // gu-027: KindCode website link
  const handleKindCode = () => {
    Vibration.vibrate(50);
    Linking.openURL(KINDCODE_URL);
  };

  const handlePrivacy = () => {
    Vibration.vibrate(50);
    Linking.openURL(PRIVACY_URL);
  };

  const handleTerms = () => {
    Vibration.vibrate(50);
    Linking.openURL(TERMS_URL);
  };

  const handleSignOut = () => {
    Vibration.vibrate(50);
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => onSignOut?.(),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.root}>

      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => { Vibration.vibrate(50); onBack(); }}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Text style={[styles.backIcon, { fontSize: sf(FontSize.lg) }]}>←</Text>
          </TouchableOpacity>
        )}
        <Text style={[styles.headerTitle, { fontSize: sf(FontSize.xl) }]} numberOfLines={1} adjustsFontSizeToFit>Settings</Text>
        {/* gu-059: spacer matches SOS button width so title stays centered */}
        <View style={styles.headerSpacer} />
      </View>

      {/* gu-069: SOSButton shared component — self-positioning via safe area insets */}
      <SOSButton onPress={onSOS ?? (() => {})} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Accessibility ──────────────────────────────────────────── */}
        <SectionHeader title="Accessibility" emoji="♿️" sf={sf} />

        {/* Text size picker */}
        <View style={styles.card}>
          <Text style={[styles.settingLabel, { fontSize: sf(FontSize.base) }]}>Text Size</Text>
          <Text style={[styles.settingSubLabel, { fontSize: sf(FontSize.sm) }]}>Choose a comfortable reading size</Text>
          <View style={styles.textSizeRow}>
            {TEXT_SIZE_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.textSizePill,
                  textSize === opt.value && styles.textSizePillSelected,
                ]}
                onPress={() => { Vibration.vibrate(50); setTextSize(opt.value); ctxSetTextSize(opt.value); }}
                accessibilityLabel={`Text size: ${opt.label}`}
                accessibilityState={{ selected: textSize === opt.value }}
                accessibilityRole="radio"
              >
                <Text
                  style={[
                    styles.textSizePillText,
                    { fontSize: opt.preview },
                    textSize === opt.value && styles.textSizePillTextSelected,
                  ]}
                >
                  Aa
                </Text>
                <Text
                  style={[
                    styles.textSizePillLabel,
                    { fontSize: sf(FontSize.xs) },
                    textSize === opt.value && styles.textSizePillTextSelected,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Read aloud toggle */}
        <SettingToggle
          emoji="🔊"
          label="Read Aloud"
          subLabel="The app will speak screen content out loud"
          value={readAloud}
          onValueChange={(v) => { Vibration.vibrate(50); setReadAloud(v); ctxSetReadAloud(v ? 'yes' : 'no'); }}
          accessibilityLabel="Read aloud"
          accessibilityHint="When on, the app reads screen content aloud using your device's voice"
          sf={sf}
        />

        {/* High contrast toggle */}
        <SettingToggle
          emoji="🌗"
          label="High Contrast"
          subLabel="Pure black and white — easier to read in bright light"
          value={highContrast}
          onValueChange={(v) => { Vibration.vibrate(50); setHighContrast(v); }}
          accessibilityLabel="High contrast mode"
          accessibilityHint="When on, uses pure black and white colors for maximum readability"
          sf={sf}
        />

        {/* ── Account ────────────────────────────────────────────────── */}
        <SectionHeader title="Account" emoji="👤" sf={sf} />

        <SettingRow
          emoji="✏️"
          label="Your Name"
          value={displayName || 'Not set'}
          onPress={() => {
            Vibration.vibrate(50);
            Alert.alert('Coming soon', 'Name editing will be available in the next update.');
          }}
          accessibilityLabel={`Your name: ${displayName || 'Not set'}`}
          accessibilityHint="Tap to edit your name"
          sf={sf}
        />

        <SettingRow
          emoji="📞"
          label="Emergency Contact"
          value={emergencyContactLabel}
          onPress={() => {
            Vibration.vibrate(50);
            onEmergencyContacts?.();
          }}
          accessibilityLabel={`Emergency contact: ${emergencyContactLabel}`}
          accessibilityHint="Tap to add or change your emergency contacts"
          showChevron
          sf={sf}
        />

        {/* gu-029: Mobility & Accessibility */}
        <SettingRow
          emoji="♿"
          label="Mobility & Accessibility"
          value={prefs.mobilityNeeds.length > 0
            ? `${prefs.mobilityNeeds.length} need${prefs.mobilityNeeds.length > 1 ? 's' : ''} saved`
            : 'Not set'}
          onPress={() => {
            Vibration.vibrate(50);
            onMobilitySettings?.();
          }}
          accessibilityLabel="Mobility and accessibility needs"
          accessibilityHint="Tap to tell drivers about any mobility or accessibility needs before your ride"
          showChevron
          sf={sf}
        />

        {/* gu-onboarding-favorites-001: Favorite places — edit saved addresses */}
        <SettingRow
          emoji="⭐"
          label="Favorite Places"
          value={favLabel}
          onPress={() => {
            Vibration.vibrate(50);
            onFavoriteSettings?.();
          }}
          accessibilityLabel={`Favorite places: ${favLabel}`}
          accessibilityHint="Tap to add or edit your saved destinations like home, grocery store, and doctor"
          showChevron
          sf={sf}
        />

        {/* ── Support ────────────────────────────────────────────────── */}
        <SectionHeader title="Support" emoji="💬" sf={sf} />

        <SettingRow
          emoji="🐛"
          label="Report a Bug / Ask a Question"
          onPress={handleBugReport}
          accessibilityLabel="Report a bug or ask a question"
          accessibilityHint="Opens your email app to contact the Giddy-Up Rides support team"
          showChevron
          sf={sf}
        />

        {/* gu-027: KindCode website */}
        <SettingRow
          emoji="🌐"
          label="Built by KindCode"
          onPress={handleKindCode}
          accessibilityLabel="Visit the KindCode website"
          accessibilityHint="Opens kindcode.us in your browser"
          showChevron
          sf={sf}
        />

        <SettingRow
          emoji="🔒"
          label="Privacy Policy"
          onPress={handlePrivacy}
          accessibilityLabel="Privacy Policy"
          accessibilityHint="Opens the privacy policy in your browser"
          showChevron
          sf={sf}
        />

        <SettingRow
          emoji="📄"
          label="Terms of Service"
          onPress={handleTerms}
          accessibilityLabel="Terms of Service"
          accessibilityHint="Opens the terms of service in your browser"
          showChevron
          sf={sf}
        />

        {/* ── App ────────────────────────────────────────────────────── */}
        <SectionHeader title="App" emoji="📱" sf={sf} />

        <View style={styles.card}>
          <View style={styles.appInfoRow}>
            <Text style={[styles.appInfoLabel, { fontSize: sf(FontSize.base) }]}>Version</Text>
            <Text style={[styles.appInfoValue, { fontSize: sf(FontSize.base) }]}>{APP_VERSION}</Text>
          </View>
          <View style={styles.divider} />
          <Text style={[styles.madeWith, { fontSize: sf(FontSize.base) }]}>Made with ❤️ by KindCode</Text>
        </View>

        {/* ── Sign Out ───────────────────────────────────────────────── */}
        <View style={styles.signOutSection}>
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
            accessibilityLabel="Sign out"
            accessibilityHint="Signs you out of the app"
            accessibilityRole="button"
          >
            <Text style={[styles.signOutText, { fontSize: sf(FontSize.base) }]}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Extra padding so last card clears the bottom nav bar */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* gu-068: Mic moved to floating MicFab (bottom-right) — bottom nav removed */}
      <MicFab onPress={onVoiceMic} />

      </View>
    </SafeAreaView>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SectionHeader({ title, emoji, sf }: { title: string; emoji: string; sf: (n: number) => number }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionEmoji, { fontSize: sf(FontSize.sm) }]}>{emoji}</Text>
      <Text style={[styles.sectionTitle, { fontSize: sf(FontSize.sm) }]}>{title}</Text>
    </View>
  );
}

function SettingToggle({
  emoji,
  label,
  subLabel,
  value,
  onValueChange,
  accessibilityLabel,
  accessibilityHint,
  sf,
}: {
  emoji: string;
  label: string;
  subLabel?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  accessibilityLabel: string;
  accessibilityHint?: string;
  sf: (n: number) => number;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.toggleRow}>
        <Text style={[styles.rowEmoji, { fontSize: sf(FontSize.base) }]}>{emoji}</Text>
        <View style={styles.rowTextCol}>
          <Text style={[styles.rowLabel, { fontSize: sf(FontSize.base) }]}>{label}</Text>
          {subLabel && <Text style={[styles.rowSubLabel, { fontSize: sf(FontSize.sm) }]}>{subLabel}</Text>}
        </View>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: Colors.border, true: Colors.primary }}
          thumbColor={value ? '#FFFFFF' : '#FFFFFF'}
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={accessibilityHint}
        />
      </View>
    </View>
  );
}

function SettingRow({
  emoji,
  label,
  value,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  showChevron = false,
  sf,
}: {
  emoji: string;
  label: string;
  value?: string;
  onPress: () => void;
  accessibilityLabel: string;
  accessibilityHint?: string;
  showChevron?: boolean;
  sf: (n: number) => number;
}) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole="button"
    >
      <View style={styles.toggleRow}>
        <Text style={[styles.rowEmoji, { fontSize: sf(FontSize.base) }]}>{emoji}</Text>
        <View style={styles.rowTextCol}>
          <Text style={[styles.rowLabel, { fontSize: sf(FontSize.base) }]}>{label}</Text>
          {value && <Text style={[styles.rowSubLabel, { fontSize: sf(FontSize.sm) }]}>{value}</Text>}
        </View>
        {showChevron && (
          <Text style={[styles.chevron, { fontSize: sf(FontSize.lg) }]}>›</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  root: {
    flex: 1,
  },

  // gu-068: bottomNav/bottomNavMic removed — mic is now MicFab floating bottom-right
  // gu-069: sosFab/sosFabText removed — replaced by shared SOSButton component

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
  backButton: {
    width: TouchTarget.min,
    height: TouchTarget.min,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    // fontSize set inline via sf() — gu-076
    color: Colors.primary,
    fontWeight: '600',
  },
  headerTitle: {
    flex: 1,
    // fontSize set inline via sf() — already done (line 155)
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  headerSpacer: {
    width: TouchTarget.min,
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },

  // Section headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  sectionEmoji: {
    // fontSize set inline via sf() — gu-076
  },
  sectionTitle: {
    // fontSize set inline via sf() — gu-076
    fontWeight: '800',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // Card container
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  // Toggle / row layout
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: TouchTarget.min - Spacing.lg * 2, // account for card padding
    gap: Spacing.md,
  },
  rowEmoji: {
    // fontSize set inline via sf() — gu-076
    width: 32,
    textAlign: 'center',
  },
  rowTextCol: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    // fontSize set inline via sf() — gu-076
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  rowSubLabel: {
    // fontSize set inline via sf() — gu-076
    color: Colors.textSecondary,
  },
  chevron: {
    // fontSize set inline via sf() — gu-076
    color: Colors.textSecondary,
    fontWeight: '300',
  },

  // Text size picker
  settingLabel: {
    // fontSize set inline via sf() — gu-076
    color: Colors.textPrimary,
    fontWeight: '700',
    marginBottom: 2,
  },
  settingSubLabel: {
    // fontSize set inline via sf() — gu-076
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  textSizeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  textSizePill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    gap: Spacing.xs,
    minHeight: TouchTarget.large,
  },
  textSizePillSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '12',
  },
  textSizePillText: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  textSizePillLabel: {
    // fontSize set inline via sf() — gu-076
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  textSizePillTextSelected: {
    color: Colors.primary,
  },

  // App info
  appInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appInfoLabel: {
    // fontSize set inline via sf() — gu-076
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  appInfoValue: {
    // fontSize set inline via sf() — gu-076
    color: Colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  madeWith: {
    // fontSize set inline via sf() — gu-076
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },

  // Sign out
  signOutSection: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  signOutButton: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderColor: '#D62828',
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TouchTarget.large,
  },
  signOutText: {
    // fontSize set inline via sf() — gu-076
    color: '#D62828',
    fontWeight: '800',
  },
});
