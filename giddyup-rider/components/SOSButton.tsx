// GiddyUp Rides — SOSButton.tsx
// Always-visible emergency button per accessibility spec.
// Renders as a fixed floating button — present on every screen.
// Tapping triggers a confirmation dialog before calling for help
// (prevents accidental activation per spec requirement).
//
// gu-069: Updated to use useSafeAreaInsets for safe top-right positioning.
//         Added `onPress` prop alias alongside existing `onSOS` for new screens.

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
  Vibration,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontSize, Radius, Spacing, TouchTarget } from '../constants/theme';
import { useAccessibility } from '../context/AccessibilityContext';

interface SOSButtonProps {
  /** Called after the user confirms the SOS dialog. New name per gu-069 spec. */
  onPress?: () => void;
  /** Legacy alias — kept for backward compat with existing screens that pass onSOS. */
  onSOS?: () => void;
}

export default function SOSButton({ onPress, onSOS }: SOSButtonProps) {
  const [confirmVisible, setConfirmVisible] = useState(false);
  const { fontScale } = useAccessibility();
  const safeArea = useSafeAreaInsets();
  const sf = (base: number) => Math.round(base * fontScale);

  // Resolve handler: onPress takes priority, fall back to onSOS for legacy callers
  const resolvedHandler = onPress ?? onSOS;

  const handlePress = () => {
    // Haptic feedback on first tap
    Vibration.vibrate(100);
    setConfirmVisible(true);
  };

  const handleConfirm = () => {
    setConfirmVisible(false);
    Vibration.vibrate([0, 200, 100, 200]);
    if (resolvedHandler) {
      // gu-014: navigate to full SOSScreen flow (countdown → alerting → alerted)
      resolvedHandler();
    } else {
      // Fallback if no navigator provided (standalone usage)
      Alert.alert(
        '🚨 Help is on the way',
        'We have notified emergency services and your caregiver. Stay where you are.',
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  const handleCancel = () => {
    setConfirmVisible(false);
  };

  return (
    <>
      {/* Floating SOS button — top-right, safe area aware */}
      <TouchableOpacity
        style={[
          styles.sosButton,
          { top: safeArea.top + 4, right: 16 }, // gu-075: tighter to corner — just clears status bar
        ]}
        onPress={handlePress}
        accessibilityLabel="SOS emergency button"
        accessibilityHint="Double tap to call for emergency help"
        accessibilityRole="button"
      >
        <Text style={[styles.sosText, { fontSize: sf(FontSize.sm) }]}>SOS</Text>
      </TouchableOpacity>

      {/* Confirmation dialog — prevents accidental activation */}
      <Modal
        visible={confirmVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCancel}
        accessibilityViewIsModal
      >
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>🚨 Call for Help?</Text>
            <Text style={styles.dialogBody}>
              It will call 911, notify your emergency contact, and alert Giddy-Up support — all in one tap.
            </Text>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirm}
              accessibilityLabel="Yes, call for help now"
              accessibilityRole="button"
            >
              <Text style={styles.confirmText}>Yes — Call for Help</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
              accessibilityLabel="No, I am okay. Cancel."
              accessibilityRole="button"
            >
              <Text style={styles.cancelText}>I'm Okay — Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  sosButton: {
    position: 'absolute',
    // top and right are applied inline using safeArea insets
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#D62828',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 200,
  },
  sosText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  dialog: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    gap: Spacing.md,
  },
  dialogTitle: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.sos,
    textAlign: 'center',
  },
  dialogBody: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: Spacing.sm,
  },
  confirmButton: {
    width: '100%',
    minHeight: TouchTarget.large,
    backgroundColor: Colors.sos,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
  },
  confirmText: {
    color: '#FFFFFF',
    fontSize: FontSize.base,
    fontWeight: '800',
  },
  cancelButton: {
    width: '100%',
    minHeight: TouchTarget.large,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
  },
  cancelText: {
    color: Colors.textSecondary,
    fontSize: FontSize.base,
    fontWeight: '700',
  },
});
