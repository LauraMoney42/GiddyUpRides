/**
 * VoiceAssistant.tsx — gu-028
 * Global floating voice assistant for GiddyUp Rides.
 *
 * Architecture:
 *   - Floating 70pt mic button, bottom-center, above SOS
 *   - Tap → expo-speech-recognition → transcript → VoiceInputFilter
 *   - Safe transcripts → /api/intent (OpenAI intent classifier)
 *   - Intent actions → navigate via onNavigate callback
 *   - All spoken output passes through VoiceOutputFilter before TTSService.speak()
 *
 * Guardrails (enforced by VoiceInputFilter):
 *   - "I want a human" → Linking.openURL('tel:+15551234567') immediately
 *   - Emergency keywords → Linking.openURL('tel:911') + TTS backup dial reminder
 *   - Off-topic → 1-sentence redirect, no engagement
 *   - System prompt: rides only · short + polite · never claim to be human
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Linking,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from 'react-native';
// gu-034: Guarded import — static import crashes Expo Go (native module absent).
// Module-level assignment fixed at bundle time → hook call count consistent.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ExpoSpeechRecognitionModule: any = null;
let useSpeechRecognitionEvent: (event: string, cb: (e: any) => void) => void =
  (_event: string, _cb: (e: any) => void) => {};
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const _SR = require('expo-speech-recognition');
  ExpoSpeechRecognitionModule = _SR.ExpoSpeechRecognitionModule;
  useSpeechRecognitionEvent   = _SR.useSpeechRecognitionEvent;
} catch (_) {
  // Native module not available in Expo Go — mock demo mode active
}
import { Colors, Radius, Spacing, TouchTarget } from '../constants/theme';
import VoiceInputFilter from '../services/VoiceInputFilter';
import VoiceOutputFilter from '../services/VoiceOutputFilter';
import TTSService from '../services/TTSService';
import { useAccessibility } from '../context/AccessibilityContext';

// ── Types ─────────────────────────────────────────────────────────────────────

export type VoiceNavigationTarget =
  | 'booking'
  | 'scheduleRide'
  | 'scheduledRides'
  | 'home'
  | 'settings'
  | 'sos';

interface Props {
  /** Called when the assistant resolves an intent to a screen navigation. */
  onNavigate: (target: VoiceNavigationTarget) => void;
  /** Support phone number for "I want a human" routing. */
  supportPhone?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const BACKEND_URL = process.env.EXPO_PUBLIC_TTS_URL ?? 'http://localhost:3001';
const AUTH_TOKEN  = process.env.EXPO_PUBLIC_TTS_TOKEN ?? '';

const SUPPORT_PHONE = '+15551234567'; // TODO: replace with real dispatcher number

/** Intent → navigation target mapping */
const INTENT_ACTIONS: Record<string, VoiceNavigationTarget> = {
  book_ride:      'booking',
  schedule_ride:  'scheduleRide',
  view_upcoming:  'scheduledRides',
  go_home:        'home',
  open_settings:  'settings',
  trigger_sos:    'sos',
};

// ── VoiceAssistant ─────────────────────────────────────────────────────────────

export default function VoiceAssistant({ onNavigate, supportPhone = SUPPORT_PHONE }: Props) {
  const { fontScale } = useAccessibility();
  const sf = (base: number) => Math.round(base * fontScale);

  const [listening, setListening] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [overlayText, setOverlayText] = useState<string | null>(null);
  const [overlayError, setOverlayError] = useState(false);

  // Pulsing animation while listening
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  const startPulse = useCallback(() => {
    pulseAnim.setValue(1);
    pulseLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.18, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    pulseLoop.current.start();
  }, [pulseAnim]);

  const stopPulse = useCallback(() => {
    pulseLoop.current?.stop();
    Animated.spring(pulseAnim, { toValue: 1, useNativeDriver: true }).start();
  }, [pulseAnim]);

  // ── Speech recognition events ─────────────────────────────────────────────

  useSpeechRecognitionEvent('start', () => {
    setListening(true);
    startPulse();
  });

  useSpeechRecognitionEvent('end', () => {
    setListening(false);
    stopPulse();
  });

  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results?.[0]?.transcript ?? '';
    if (transcript) {
      handleTranscript(transcript);
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    setListening(false);
    setProcessing(false);
    stopPulse();
    // Only show error for non-trivial failures (not "no-speech" which is common)
    if (event.error !== 'no-speech') {
      showOverlay("Sorry, I didn't catch that. Try again?", true);
    }
  });

  // ── Auto-dismiss overlay after 4 seconds ─────────────────────────────────

  const overlayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showOverlay = useCallback((text: string, isError = false) => {
    if (overlayTimer.current) clearTimeout(overlayTimer.current);
    setOverlayText(text);
    setOverlayError(isError);
    overlayTimer.current = setTimeout(() => {
      setOverlayText(null);
      setOverlayError(false);
    }, 4000);
  }, []);

  useEffect(() => {
    return () => {
      if (overlayTimer.current) clearTimeout(overlayTimer.current);
    };
  }, []);

  // ── Core logic: transcript → filter → intent → action ────────────────────

  const handleTranscript = useCallback(async (raw: string) => {
    setProcessing(true);
    const filterResult = VoiceInputFilter.filter(raw);

    switch (filterResult.action) {
      case 'call911': {
        // Emergency — autodial + TTS backup reminder
        const msg = VoiceOutputFilter.filter(
          "Calling 911 now. If the call doesn't connect, dial 911 directly on your phone."
        ).text;
        showOverlay(msg);
        await TTSService.speak(msg);
        Vibration.vibrate([0, 100, 100, 100]);
        Linking.openURL('tel:911').catch(() => {});
        break;
      }

      case 'callSupport': {
        // "I want a human" — connect immediately, no arguing
        const msg = VoiceOutputFilter.confirmationFor('call_support');
        showOverlay(msg);
        await TTSService.speak(msg);
        Vibration.vibrate(80);
        Linking.openURL(`tel:${supportPhone}`).catch(() => {});
        break;
      }

      case 'redirect': {
        // Off-topic — 1-sentence redirect
        const msg = VoiceOutputFilter.filter(filterResult.message).text;
        showOverlay(msg, true);
        await TTSService.speak(msg);
        break;
      }

      case 'process': {
        // Safe input — classify intent via backend
        try {
          const intent = await classifyIntent(filterResult.cleanedText);
          const target = INTENT_ACTIONS[intent];

          if (target) {
            const confirmation = VoiceOutputFilter.confirmationFor(intent);
            showOverlay(confirmation);
            await TTSService.speak(confirmation);
            Vibration.vibrate(60);
            // Slight delay so user hears confirmation before nav
            setTimeout(() => onNavigate(target), 600);
          } else {
            // Intent returned but no matching screen action
            const msg = VoiceOutputFilter.filter(
              "I can help you book a ride, schedule a ride, or check your upcoming trips."
            ).text;
            showOverlay(msg, true);
            await TTSService.speak(msg);
          }
        } catch {
          const msg = "I'm having trouble right now. Please try again in a moment.";
          showOverlay(msg, true);
          await TTSService.speak(msg);
        }
        break;
      }
    }

    setProcessing(false);
  }, [onNavigate, showOverlay, supportPhone]);

  // ── Button press handler ──────────────────────────────────────────────────

  const handleMicPress = async () => {
    Vibration.vibrate(50);
    if (processing) return;

    // gu-034: Native module absent in Expo Go — inject mock transcript for demo
    if (!ExpoSpeechRecognitionModule) {
      const mockPhrases = [
        'Book me a ride to the pharmacy',
        'Show my upcoming rides',
        'Go home',
        'Open settings',
        'Schedule a ride for tomorrow',
      ];
      const phrase = mockPhrases[Math.floor(Math.random() * mockPhrases.length)];
      setOverlayText(`🎤 "${phrase}"`);
      setTimeout(() => handleTranscript(phrase), 1500);
      return;
    }

    if (listening) {
      ExpoSpeechRecognitionModule.stop();
      return;
    }

    setOverlayText(null);
    try {
      await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        interimResults: false,
        maxAlternatives: 1,
      });
    } catch {
      showOverlay("Microphone permission is needed for voice commands.", true);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const micColor    = listening ? '#E53E3E' : Colors.primary;
  const micBgColor  = listening ? '#FFF5F5' : '#FFFFFF';
  const micLabel    = listening ? 'Tap to stop listening' : 'Tap to speak a voice command';

  return (
    <>
      {/* ── Floating mic button ─────────────────────────────────────────── */}
      <Animated.View
        style={[
          styles.micWrapper,
          { transform: [{ scale: pulseAnim }] },
        ]}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          style={[
            styles.micButton,
            { backgroundColor: micBgColor, borderColor: micColor },
            processing && styles.micButtonProcessing,
          ]}
          onPress={handleMicPress}
          disabled={processing}
          accessibilityLabel={micLabel}
          accessibilityRole="button"
          accessibilityState={{ busy: processing }}
          activeOpacity={0.8}
        >
          <Text style={[styles.micEmoji, { fontSize: sf(30), color: micColor }]}>
            {processing ? '⏳' : listening ? '🛑' : '🎙️'}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* ── Status overlay card (non-modal — doesn't block scroll) ──────── */}
      {overlayText ? (
        <View
          style={[styles.overlayCard, overlayError && styles.overlayCardError]}
          accessibilityLiveRegion="polite"
          accessibilityLabel={overlayText}
        >
          <Text style={[styles.overlayText, { fontSize: sf(15) }]}>{overlayText}</Text>
        </View>
      ) : null}
    </>
  );
}

// ── Intent API ────────────────────────────────────────────────────────────────

/**
 * Classify a user transcript into one of the MVP intents.
 * Calls the GiddyUp backend /api/intent (OpenAI-powered).
 * Falls back to local keyword matching if the backend is unreachable.
 */
async function classifyIntent(text: string): Promise<string> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (AUTH_TOKEN) {
      headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    try {
      const res = await fetch(`${BACKEND_URL}/api/intent`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ text }),
        signal: controller.signal,
      });

      if (res.ok) {
        const json = await res.json();
        return json.intent ?? 'unknown';
      }
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    // Backend unreachable — fall through to local fallback
  }

  // ── Local keyword fallback (prototype / offline mode) ─────────────────────
  return classifyIntentLocally(text);
}

/**
 * Simple keyword-based local intent classification.
 * Used when the backend is unreachable.
 * Good enough for MVP prototype demos.
 */
function classifyIntentLocally(text: string): string {
  const t = text.toLowerCase();

  if (/\b(book|get|need|want|order|call|hail)\s+(a\s+)?ride\b/.test(t))   return 'book_ride';
  if (/\b(schedule|plan|book|set up)\s+(a\s+)?(ride|trip|appointment)\b/.test(t)) return 'schedule_ride';
  if (/\b(upcoming|scheduled|future|my\s+rides?)\b/.test(t))              return 'view_upcoming';
  if (/\b(go\s+home|take me home|home\s+screen|main\s+screen)\b/.test(t)) return 'go_home';
  if (/\b(settings?|preferences?|accessibility|font|text\s+size)\b/.test(t)) return 'open_settings';
  if (/\bsos\b|\bhelp\s+button\b|\bemergency\b/.test(t))                  return 'trigger_sos';

  return 'unknown';
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  micWrapper: {
    position: 'absolute',
    bottom: 100, // sits above the SOS button (which is ~88pt from bottom)
    alignSelf: 'center',
    zIndex: 900,
    // Required for absolute self-centering inside a parent View
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'box-none',
  } as any,

  micButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 8,
  },

  micButtonProcessing: {
    opacity: 0.6,
  },

  micEmoji: {
  },

  // Overlay card — shown above mic, below top of screen
  overlayCard: {
    position: 'absolute',
    bottom: 185, // above the mic button
    left: Spacing.lg,
    right: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    zIndex: 901,
    // Shadow
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 9,
  },

  overlayCardError: {
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.08,
  },

  overlayText: {
    color: Colors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 22,
  },
});
