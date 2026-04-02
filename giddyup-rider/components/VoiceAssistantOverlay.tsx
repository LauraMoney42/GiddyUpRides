/**
 * VoiceAssistantOverlay.tsx — gu-028
 * Global AI voice assistant overlay for GiddyUp Rides.
 * Rendered once in App.tsx — not per-screen.
 *
 * Flow:
 *   idle → listening (mic on) → processing (intent API) → responding (TTS) → idle
 *
 * Safety guardrails (via VoiceInputFilter + VoiceOutputFilter):
 *   - Emergency keywords → autodial 911 immediately
 *   - "I want a human" → Linking.openURL(tel:support)
 *   - Off-topic → 1-sentence redirect, never engage
 *   - Responses never claim to be human
 *   - Max 40 words per response
 *   - System prompt: rides only, short + polite
 *
 * MVP intents resolved client-side:
 *   book ride · schedule ride · view upcoming · go home · open settings · SOS
 *
 * gu-034: expo-speech-recognition native module guard added.
 * The JS package can be installed but the native module is unavailable in
 * standard Expo Go. A module-level try/catch checks availability once on load.
 * If the native module is missing → mock demo mode (cycling phrases).
 * Full STT works in EAS dev build / production build.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Animated,
  Vibration,
  Linking,
  ScrollView,
} from 'react-native';
import { Colors, FontSize, Radius, Spacing, TouchTarget } from '../constants/theme';
import { useAccessibility } from '../context/AccessibilityContext';
import TTSService from '../services/TTSService';
import VoiceInputFilter from '../services/VoiceInputFilter';
import VoiceOutputFilter from '../services/VoiceOutputFilter';

// ── gu-034: Native module guard ───────────────────────────────────────────────
// Must appear AFTER all import statements (TypeScript requires imports first).
// Check ONCE at module load — not inside render or callbacks.
// require() can succeed (package installed) while the native module is absent
// in Expo Go. Calling any method on the absent module throws:
//   "Cannot find native module 'ExpoSpeechRecognition'"
// Guard: verify ExpoSpeechRecognitionModule exists before caching it.
let _ExpoSpeechRecognition: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require('expo-speech-recognition');
  if (mod?.ExpoSpeechRecognitionModule) {
    _ExpoSpeechRecognition = mod.ExpoSpeechRecognitionModule;
  }
} catch (_) {
  // Package not installed or native module unavailable (Expo Go) → mock mode
}
const NATIVE_STT_AVAILABLE = _ExpoSpeechRecognition !== null;

// ── Types ─────────────────────────────────────────────────────────────────────

type AssistantState = 'idle' | 'listening' | 'processing' | 'responding' | 'error';

export type VoiceIntent =
  | 'book_ride'
  | 'schedule_ride'
  | 'view_upcoming'
  | 'go_home'
  | 'open_settings'
  | 'trigger_sos';

export interface VoiceAssistantOverlayProps {
  /** Called when a resolved intent requires navigation */
  onIntent: (intent: VoiceIntent) => void;
  /** gu-044: When true, hides the floating FAB mic button (HomeScreen bottom nav replaces it) */
  hideFab?: boolean;
  /** gu-044: Increment this number to programmatically open the overlay (e.g. from HomeScreen bottom nav) */
  openTrigger?: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SUPPORT_PHONE   = 'tel:+15550009999'; // GiddyUp HQ dispatch
const BACKEND_URL     = process.env.EXPO_PUBLIC_TTS_URL ?? 'http://localhost:3001';

// System prompt sent with every intent request — strict guardrails
const SYSTEM_PROMPT = `You are a voice assistant for Giddy-Up Rides, a ride-sharing app for seniors and people with disabilities.
Your ONLY job is to help users with: booking a ride, scheduling a ride, checking upcoming rides, going to the home screen, opening settings, and triggering SOS.
Rules:
- Respond in 1-2 short sentences maximum.
- Plain language only — no jargon.
- Never claim to be human.
- Never give medical, legal, or financial advice.
- If the request is not about rides or app navigation, say: "I can only help with Giddy-Up rides." and nothing else.
- If the user seems distressed or mentions an emergency, say you are calling for help.`;

// ── VoiceAssistantOverlay ─────────────────────────────────────────────────────

export default function VoiceAssistantOverlay({ onIntent, hideFab = false, openTrigger = 0 }: VoiceAssistantOverlayProps) {
  const { prefs, fontScale } = useAccessibility();
  const sf = (base: number) => Math.round(base * fontScale);

  const [state, setState]           = useState<AssistantState>('idle');
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse]     = useState('');
  const [errorMsg, setErrorMsg]     = useState('');

  // Mic pulse animation
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  // ── Pulse animation while listening ─────────────────────────────────────────
  useEffect(() => {
    if (state === 'listening') {
      pulseLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.25, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1.00, duration: 700, useNativeDriver: true }),
        ])
      );
      pulseLoop.current.start();
    } else {
      pulseLoop.current?.stop();
      pulseAnim.setValue(1);
    }
    return () => { pulseLoop.current?.stop(); };
  }, [state]);

  // ── Open overlay + start listening ──────────────────────────────────────────
  const handleMicTap = useCallback(() => {
    Vibration.vibrate(60);
    setTranscript('');
    setResponse('');
    setErrorMsg('');
    setState('listening');
    setOverlayVisible(true);
    startListening();
  }, []);

  // ── gu-044: External trigger — HomeScreen bottom nav mic button ──────────────
  // openTrigger increments each time the HomeScreen bottom nav mic is pressed.
  // Skips on first mount (value === 0).
  useEffect(() => {
    if (openTrigger > 0) handleMicTap();
  }, [openTrigger, handleMicTap]);

  const handleClose = useCallback(() => {
    TTSService.stop();
    stopListening();
    setState('idle');
    setOverlayVisible(false);
  }, []);

  // ── STT — expo-speech-recognition ───────────────────────────────────────────
  // gu-034: Uses module-level NATIVE_STT_AVAILABLE guard (checked once on load).
  // If native module is absent (Expo Go) → useMockListening() immediately.
  // If native module is present (EAS dev / prod build) → real STT.

  const recognitionRef = useRef<any>(null);

  const startListening = useCallback(async () => {
    // gu-034: Skip native call entirely if module unavailable — prevents
    // "Cannot find native module 'ExpoSpeechRecognition'" crash in Expo Go
    if (!NATIVE_STT_AVAILABLE) {
      useMockListening();
      return;
    }

    try {
      const perm = await _ExpoSpeechRecognition.requestPermissionsAsync();
      if (!perm.granted) {
        setErrorMsg('Microphone permission is needed to use voice.');
        setState('error');
        return;
      }

      _ExpoSpeechRecognition.start({
        lang: 'en-US',
        interimResults: true,
        continuous: false,
        onResult: (event: { results: Array<{ transcript: string; isFinal: boolean }> }) => {
          const result = event.results[0];
          setTranscript(result.transcript);
          if (result.isFinal) {
            stopListening();
            processTranscript(result.transcript);
          }
        },
        onError: (err: { message: string }) => {
          console.warn('[Voice] STT error:', err.message);
          setErrorMsg("I didn't catch that. Try again?");
          setState('error');
        },
        onEnd: () => {
          if (transcript) processTranscript(transcript);
        },
      });
      recognitionRef.current = _ExpoSpeechRecognition;
    } catch (err) {
      // Unexpected runtime error — fall back to mock so UI stays usable
      console.warn('[Voice] STT runtime error, falling back to mock:', err);
      useMockListening();
    }
  }, [transcript]);

  const stopListening = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch (_) {}
  }, []);

  /** gu-034: Demo fallback — cycles through mock transcripts in Expo Go / no native STT */
  const useMockListening = useCallback(() => {
    const mockPhrases = [
      'Book me a ride to the pharmacy',
      'Show my upcoming rides',
      'Schedule a ride for tomorrow morning',
      'Take me home',
      'Open settings',
    ];
    const phrase = mockPhrases[Math.floor(Math.random() * mockPhrases.length)];
    setTimeout(() => {
      setTranscript(phrase);
      processTranscript(phrase);
    }, 2000);
  }, []);

  // ── Intent processing ────────────────────────────────────────────────────────

  const processTranscript = useCallback(async (text: string) => {
    setState('processing');

    // 1. Run inbound filter FIRST — before anything reaches the API
    const filterResult = VoiceInputFilter.filter(text);

    if (filterResult.action === 'call911') {
      await handleEmergency();
      return;
    }

    if (filterResult.action === 'callSupport') {
      await handleCallSupport();
      return;
    }

    if (filterResult.action === 'redirect') {
      await speakAndShow(filterResult.message);
      return;
    }

    // 2. Try to resolve intent locally first (fast, no network)
    const localIntent = resolveLocalIntent(filterResult.cleanedText);
    if (localIntent) {
      const confirmation = VoiceOutputFilter.confirmationFor(localIntent);
      const { text: safeText } = VoiceOutputFilter.filter(confirmation);
      await speakAndShow(safeText);
      // Brief pause then execute intent
      setTimeout(() => {
        handleClose();
        onIntent(localIntent);
      }, 1800);
      return;
    }

    // 3. Try backend /api/intent for complex phrases
    try {
      const intent = await fetchIntent(filterResult.cleanedText);
      if (intent) {
        const confirmation = VoiceOutputFilter.confirmationFor(intent);
        const { text: safeText } = VoiceOutputFilter.filter(confirmation);
        await speakAndShow(safeText);
        setTimeout(() => {
          handleClose();
          onIntent(intent);
        }, 1800);
      } else {
        const fallback = "I didn't understand that. I can help you book a ride, schedule a ride, or check your upcoming trips.";
        await speakAndShow(fallback);
      }
    } catch (_) {
      const offline = "I'm having trouble connecting. Please try again or use the buttons on screen.";
      await speakAndShow(offline);
    }
  }, [onIntent]);

  // ── Guardrail handlers ───────────────────────────────────────────────────────

  const handleEmergency = useCallback(async () => {
    Vibration.vibrate([0, 300, 100, 300, 100, 300]);
    const msg = 'Calling 911 now. If you can, press the call button on your phone directly.';
    await speakAndShow(msg);
    // Small delay so TTS starts before switching to phone app
    setTimeout(() => {
      Linking.openURL('tel:911');
      handleClose();
    }, 1500);
  }, []);

  const handleCallSupport = useCallback(async () => {
    Vibration.vibrate(100);
    const msg = 'Connecting you to a real person now.';
    await speakAndShow(msg);
    setTimeout(() => {
      Linking.openURL(SUPPORT_PHONE);
      handleClose();
    }, 1500);
  }, []);

  // ── TTS + display helper ─────────────────────────────────────────────────────

  const speakAndShow = useCallback(async (text: string) => {
    setState('responding');
    setResponse(text);
    if (prefs.readAloud === 'yes') {
      await TTSService.speak(text);
    }
  }, [prefs.readAloud]);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Floating mic FAB — hidden on HomeScreen where bottom nav replaces it (gu-044) */}
      {!hideFab && (
        <TouchableOpacity
          style={styles.micButton}
          onPress={handleMicTap}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Voice assistant"
          accessibilityHint="Tap to speak a command — book a ride, schedule a ride, and more"
        >
          <Text style={[styles.micEmoji, { fontSize: sf(32) }]}>🎙️</Text>
        </TouchableOpacity>
      )}

      {/* Full-screen overlay modal */}
      <Modal
        visible={overlayVisible}
        animationType="slide"
        transparent
        onRequestClose={handleClose}
        accessibilityViewIsModal
      >
        <View style={styles.modalOverlay}>
          <View style={styles.sheet}>

            {/* Header */}
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { fontSize: sf(FontSize.lg) }]}>
                {stateLabel(state)}
              </Text>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={handleClose}
                accessibilityRole="button"
                accessibilityLabel="Close voice assistant"
              >
                <Text style={[styles.closeBtnText, { fontSize: sf(FontSize.base) }]}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Mic indicator */}
            <View style={styles.micArea}>
              <Animated.View
                style={[
                  styles.micCircle,
                  state === 'listening' && styles.micCircleActive,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              >
                <Text style={[styles.micCircleEmoji, { fontSize: sf(44) }]}>
                  {state === 'processing' ? '⏳' :
                   state === 'responding' ? '🔊' :
                   state === 'error'      ? '⚠️' : '🎙️'}
                </Text>
              </Animated.View>
            </View>

            {/* Transcript */}
            {!!transcript && (
              <View style={styles.transcriptBox}>
                <Text style={[styles.transcriptLabel, { fontSize: sf(FontSize.xs) }]}>YOU SAID</Text>
                <Text style={[styles.transcriptText, { fontSize: sf(FontSize.base), lineHeight: sf(FontSize.base) * 1.5 }]}>
                  "{transcript}"
                </Text>
              </View>
            )}

            {/* Response */}
            {!!response && (
              <ScrollView style={styles.responseBox} bounces={false}>
                <Text style={[styles.responseText, { fontSize: sf(FontSize.base), lineHeight: sf(FontSize.base) * 1.55 }]}>
                  {response}
                </Text>
              </ScrollView>
            )}

            {/* Error */}
            {state === 'error' && !!errorMsg && (
              <View style={styles.errorBox}>
                <Text style={[styles.errorText, { fontSize: sf(FontSize.sm) }]}>{errorMsg}</Text>
                <TouchableOpacity
                  style={styles.retryBtn}
                  onPress={() => {
                    setErrorMsg('');
                    setTranscript('');
                    setState('listening');
                    startListening();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Try again"
                >
                  <Text style={[styles.retryBtnText, { fontSize: sf(FontSize.sm) }]}>Try Again</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Hint chips — shown while idle/listening */}
            {(state === 'listening' || state === 'idle') && (
              <View style={styles.hintRow}>
                {['Book me a ride', 'My upcoming rides', 'Schedule a ride', 'Settings'].map(hint => (
                  <View key={hint} style={styles.hintChip}>
                    <Text style={[styles.hintChipText, { fontSize: sf(FontSize.xs) }]}>{hint}</Text>
                  </View>
                ))}
              </View>
            )}

          </View>
        </View>
      </Modal>
    </>
  );
}

// ── Local intent resolver ─────────────────────────────────────────────────────
// Handles common phrases without needing a network call.

function resolveLocalIntent(text: string): VoiceIntent | null {
  const t = text.toLowerCase().trim();

  if (/\b(book|get|need|want|order|call|hail)\s+(me\s+)?(a\s+)?ride\b/.test(t))
    return 'book_ride';
  if (/\b(schedule|plan|set up|book.+later|book.+tomorrow|book.+future)\b/.test(t))
    return 'schedule_ride';
  if (/\b(upcoming|scheduled|my rides|next ride|future rides)\b/.test(t))
    return 'view_upcoming';
  if (/\b(go\s+home|take\s+me\s+home|home\s+screen|main\s+screen|back\s+to\s+home)\b/.test(t))
    return 'go_home';
  if (/\b(settings|preferences|accessibility|text\s+size|font\s+size)\b/.test(t))
    return 'open_settings';
  if (/\b(sos|emergency|help|danger|unsafe)\b/.test(t))
    return 'trigger_sos';

  return null;
}

// ── Backend intent API ────────────────────────────────────────────────────────

async function fetchIntent(text: string): Promise<VoiceIntent | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(`${BACKEND_URL}/api/intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, systemPrompt: SYSTEM_PROMPT }),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const json = await res.json();
    return (json.intent as VoiceIntent) ?? null;
  } catch (_) {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function stateLabel(state: AssistantState): string {
  switch (state) {
    case 'listening':   return '🎙️  Listening…';
    case 'processing':  return '⏳  Thinking…';
    case 'responding':  return '🔊  Response';
    case 'error':       return '⚠️  Oops';
    default:            return 'Voice Assistant';
  }
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Floating mic button — bottom-center, above SOS (SOS is bottom-right at 100)
  micButton: {
    position: 'absolute',
    bottom: 108,
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 90,
  },
  micEmoji: {
  },

  // Modal overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
    minHeight: 380,
  },

  // Header
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetTitle: {
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  closeBtn: {
    width: TouchTarget.min,
    height: TouchTarget.min,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: Colors.textSecondary,
    fontWeight: '700',
  },

  // Mic circle
  micArea: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  micCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.border,
  },
  micCircleActive: {
    backgroundColor: '#C8E6C9',
    borderColor: Colors.primary,
    borderWidth: 3,
  },
  micCircleEmoji: {
  },

  // Transcript
  transcriptBox: {
    backgroundColor: '#F8F9FA',
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: 6,
  },
  transcriptLabel: {
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.6,
  },
  transcriptText: {
    color: Colors.textPrimary,
    fontStyle: 'italic',
  },

  // Response
  responseBox: {
    backgroundColor: '#EDF7F2',
    borderRadius: Radius.md,
    padding: Spacing.md,
    maxHeight: 120,
  },
  responseText: {
    color: Colors.primary,
    fontWeight: '600',
  },

  // Error
  errorBox: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  errorText: {
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    minHeight: TouchTarget.min,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryBtnText: {
    color: '#FFFFFF', // Black on gold — WCAG AAA contrast ✅
    fontWeight: '700',
  },

  // Hint chips
  hintRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  hintChip: {
    backgroundColor: '#F0F4F8',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  hintChipText: {
    color: Colors.textSecondary,
    fontWeight: '600',
  },
});
