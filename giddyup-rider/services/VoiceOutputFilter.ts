/**
 * VoiceOutputFilter.ts — gu-028
 * Outbound TTS response safety filter for the GiddyUp Voice Assistant.
 * Modelled on TicBuddy's ZiggyOutputFilter.swift.
 *
 * Guarantees all spoken/displayed responses:
 *   - Never claim to be human
 *   - Stay short + plain-language (≤ 40 words)
 *   - Redirect off-topic responses to rides
 *   - Strip unsafe or confusing content
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FilteredOutput {
  text: string;        // Safe, trimmed text to display + speak
  wasTruncated: boolean;
  wasRedirected: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_WORDS = 40;

// Phrases that claim humanity → replace with safe alternatives
const HUMAN_CLAIM_REPLACEMENTS: [RegExp, string][] = [
  [/\bi am a (human|person|real person)\b/gi, 'I am a Giddy-Up voice assistant'],
  [/\bi'?m a (human|person|real person)\b/gi, "I'm a Giddy-Up voice assistant"],
  [/\bi'?m (human|a person)\b/gi,             "I'm a Giddy-Up voice assistant"],
  [/\bspeak(ing)? (as|like) a (human|person)\b/gi, 'speaking as your Giddy-Up assistant'],
];

// Phrases that imply medical/legal/financial advice
const UNSAFE_TOPIC_PATTERNS: RegExp[] = [
  /\b(diagnos|medic|prescri|symptom|treat|cure|disease|condition)\w*/gi,
  /\b(legal|lawsuit|sue|attorney|lawyer|court)\w*/gi,
  /\b(invest|stock|crypto|financial\s+advice)\w*/gi,
];

const REDIRECT_SUFFIX =
  ' I can help with booking, scheduling, or your upcoming rides.';

// ── VoiceOutputFilter ─────────────────────────────────────────────────────────

const VoiceOutputFilter = {
  /**
   * Filter a raw assistant response before speaking/displaying it.
   * Returns a safe, trimmed string.
   */
  filter(rawResponse: string): FilteredOutput {
    let text = rawResponse.trim();
    let wasRedirected = false;

    // 1. Strip human-identity claims
    for (const [pattern, replacement] of HUMAN_CLAIM_REPLACEMENTS) {
      text = text.replace(pattern, replacement);
    }

    // 2. If response touches unsafe topics, append a redirect and cut the rest
    if (UNSAFE_TOPIC_PATTERNS.some(re => re.test(text))) {
      // Keep only the first sentence
      const firstSentence = text.split(/[.!?]/)[0].trim();
      text = firstSentence + '.' + REDIRECT_SUFFIX;
      wasRedirected = true;
    }

    // 3. Truncate to MAX_WORDS (keeps responses short for elderly users)
    const words = text.split(/\s+/);
    const wasTruncated = words.length > MAX_WORDS;
    if (wasTruncated) {
      text = words.slice(0, MAX_WORDS).join(' ').replace(/[,;:]$/, '') + '.';
    }

    // 4. Ensure it ends with punctuation
    if (text && !/[.!?]$/.test(text)) {
      text += '.';
    }

    return { text, wasTruncated, wasRedirected };
  },

  /**
   * Build a safe confirmation message for a completed intent action.
   * Always short, always plain language.
   */
  confirmationFor(intent: string, detail?: string): string {
    const confirmations: Record<string, string> = {
      book_ride:       'Opening the booking screen now.',
      schedule_ride:   'Opening the schedule screen now.',
      view_upcoming:   'Here are your upcoming rides.',
      go_home:         'Taking you home now.',
      open_settings:   'Opening your settings.',
      trigger_sos:     'Calling for help now.',
      call_support:    'Connecting you to a real person now.',
    };
    const base = confirmations[intent] ?? 'Got it!';
    return detail ? `${base} ${detail}` : base;
  },
};

export default VoiceOutputFilter;
