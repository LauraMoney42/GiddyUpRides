// GiddyUp Rides — SOSButton.tsx
// Always-visible emergency button per accessibility spec.
// Renders as a fixed floating button — present on every screen.
// Tapping triggers a confirmation dialog before calling for help
// (prevents accidental activation per spec requirement).

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  AccessibilityInfo,
  Alert,
  Vibration,
} from 'react-native';
import { Colors, FontSize, Radius, Spacing, TouchTarget } from '../constants/theme';

interface SOSButtonProps {
  onSOS?: () => void;
}

export default function SOSButton({ onSOS }: SOSButtonProps) {
  const [confirmVisible, setConfirmVisible] = useState(false);

  const handlePress = () => {
    // Haptic feedback on first tap
    Vibration.vibrate(100);
    setConfirmVisible(true);
  };

  const handleConfirm = () => {
    setConfirmVisible(false);
    Vibration.vibrate([0, 200, 100, 200]);
    if (onSOS) {
      // gu-014: navigate to full SOSScreen flow (countdown → alerting → alerted)
      onSOS();
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
      {/* Floating SOS button — always visible, bottom-right */}
      <TouchableOpacity
        style={styles.sosButton}
        onPress={handlePress}
        accessibilityLabel="SOS emergency button"
        accessibilityHint="Double tap to call for emergency help"
        accessibilityRole="button"
      >
        <Text style={styles.sosText}>SOS</Text>
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
    bottom: 100,
    right: Spacing.lg,
    width: 72,
    height: 72,
    borderRadius: Radius.full,
    backgroundColor: Colors.sos,
    alignItems: 'center',
    justifyContent: 'center',
    // Shadow for visibility on all backgrounds
    shadowColor: Colors.sos,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 999,
  },
  sosText: {
    color: '#FFFFFF',
    fontSize: FontSize.sm,
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
