/**
 * TTSService.ts
 * Read-aloud TTS for GiddyUp Rides rider app.
 *
 * Primary:  GiddyUp backend → OpenAI tts-1-hd, nova voice (warm + clear).
 *           Same setup as TicBuddy — nova is friendly and easy to understand.
 * Fallback: expo-speech (on-device TTS) if backend is unreachable.
 *
 * Usage:
 *   import TTSService from '../services/TTSService';
 *   await TTSService.speak("Your driver is 3 minutes away.");
 *   TTSService.stop();
 */

import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';

// ── Config ────────────────────────────────────────────────────────────────────

// Backend URL — update when deployed to Railway / Render / etc.
// For local dev: use your machine's LAN IP (not localhost — device can't reach localhost).
const BACKEND_URL = process.env.EXPO_PUBLIC_TTS_URL ?? 'http://localhost:3001';
const AUTH_TOKEN  = process.env.EXPO_PUBLIC_TTS_TOKEN ?? '';

// ── State ─────────────────────────────────────────────────────────────────────

let currentSound: Audio.Sound | null = null;

// ── TTSService ────────────────────────────────────────────────────────────────

const TTSService = {
  /**
   * Speak text via Nova (OpenAI tts-1-hd) with expo-speech fallback.
   * No-ops silently if text is empty.
   */
  async speak(text: string): Promise<void> {
    if (!text?.trim()) return;

    // Stop anything currently playing
    await TTSService.stop();

    // Try backend Nova voice first
    try {
      const audio = await fetchNovaAudio(text.trim());
      if (audio) {
        await playBase64Audio(audio);
        return;
      }
    } catch (err) {
      console.warn('[TTSService] Nova backend unavailable, falling back to expo-speech:', err);
    }

    // Fallback: expo-speech (on-device)
    speakWithExpoSpeech(text.trim());
  },

  /** Stop any currently playing TTS audio. */
  async stop(): Promise<void> {
    // Stop expo-av audio
    if (currentSound) {
      try {
        await currentSound.stopAsync();
        await currentSound.unloadAsync();
      } catch (_) {}
      currentSound = null;
    }
    // Stop expo-speech
    Speech.stop();
  },

  /** Check if TTS is currently speaking. */
  async isSpeaking(): Promise<boolean> {
    return Speech.isSpeakingAsync();
  },
};

export default TTSService;

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Fetch base64 mp3 from the GiddyUp backend (Nova voice via OpenAI tts-1-hd).
 * Returns null if the backend is unreachable or returns an error.
 */
async function fetchNovaAudio(text: string): Promise<string | null> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (AUTH_TOKEN) {
    headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout

  try {
    const res = await fetch(`${BACKEND_URL}/api/tts`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ text }),
      signal: controller.signal,
    });

    if (!res.ok) {
      console.warn(`[TTSService] Backend returned ${res.status}`);
      return null;
    }

    const json = await res.json();
    return json.audio ?? null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Decode base64 mp3 and play it via expo-av.
 * Uses a data URI so no file system writes needed.
 */
async function playBase64Audio(base64: string): Promise<void> {
  await Audio.setAudioModeAsync({
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
  });

  const { sound } = await Audio.Sound.createAsync(
    { uri: `data:audio/mp3;base64,${base64}` },
    { shouldPlay: true, volume: 1.0 }
  );
  currentSound = sound;

  // Auto-cleanup after playback finishes
  sound.setOnPlaybackStatusUpdate(status => {
    if (status.isLoaded && status.didJustFinish) {
      sound.unloadAsync().catch(() => {});
      currentSound = null;
    }
  });
}

/**
 * On-device TTS fallback via expo-speech.
 * Uses a clear female voice at slightly reduced rate for elderly users.
 */
function speakWithExpoSpeech(text: string): void {
  Speech.speak(text, {
    rate: 0.85,       // slightly slower — easier to follow
    pitch: 1.0,
    language: 'en-US',
  });
}
