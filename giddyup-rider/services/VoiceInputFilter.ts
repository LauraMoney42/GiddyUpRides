/**
 * VoiceInputFilter.ts — gu-028
 * Inbound speech transcript safety filter for the GiddyUp Voice Assistant.
 * Modelled on TicBuddy's ZiggyContentFilter.swift.
 *
 * Priority order (checked top to bottom — first match wins):
 *   1. Emergency keywords  → { action: 'call911' }
 *   2. "I want a human"    → { action: 'callSupport' }
 *   3. Off-topic content   → { action: 'redirect' }
 *   4. Everything else     → { action: 'process', cleanedText }
 *
 * All matching is case-insensitive and accent-normalised.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type InputFilterAction =
  | { action: 'call911' }                         // autodial 911
  | { action: 'callSupport' }                     // connect to human dispatcher
  | { action: 'redirect'; message: string }       // off-topic — redirect to rides
  | { action: 'process'; cleanedText: string };   // safe — send to intent API

// ── Emergency keywords ────────────────────────────────────────────────────────
// Triggers immediate 911 autodial + TTS urges manual dial as backup.
// Err on the side of caution — false positives are fine here.

const EMERGENCY_PATTERNS: RegExp[] = [
  /\bhelp me\b/,
  /\b(call|get)\s+(an?\s+)?ambulance\b/,
  /\b(call|get)\s+(the\s+)?police\b/,
  /\b(call|get)\s+(the\s+)?fire\b/,
  /\bheart\s+attack\b/,
  /\bchest\s+pain\b/,
  /\bcan'?t\s+breathe\b/,
  /\bnot\s+breathing\b/,
  /\bcrash(ed)?\b/,
  /\baccident\b/,
  /\bsomeone\s+(is\s+)?(hurt|attacking|following|threatening)\b/,
  /\bi('?m)?\s+(dying|in danger|being attacked|scared for my life)\b/,
  /\bfire\b/,
  /\bemergency\b/,
  /\b9[\s\-]?1[\s\-]?1\b/,
  /\bsos\b/,
];

// ── "I want a human" patterns ─────────────────────────────────────────────────
// Immediately connect to human dispatcher — no arguing, no rerouting.

const HUMAN_PATTERNS: RegExp[] = [
  /\b(want|need|get)\s+(a\s+)?human\b/,
  /\b(want|need|talk|speak)\s+(to\s+)?(a\s+)?(real\s+)?(person|agent|dispatcher|someone)\b/,
  /\bnot\s+(a\s+)?robot\b/,
  /\bstop\s+(talking|using)\s+(the\s+)?computer\b/,
  /\breal\s+(person|help|support)\b/,
  /\bgive\s+me\s+(a\s+)?human\b/,
  /\bi\s+don'?t\s+want\s+(to\s+talk\s+to\s+)?(a\s+)?(robot|computer|bot|ai)\b/,
];

// ── Off-topic patterns ────────────────────────────────────────────────────────
// Anything clearly unrelated to ride booking / transport.
// Off-topic → 1-sentence redirect (assistant never engages with the topic).

const OFF_TOPIC_PATTERNS: RegExp[] = [
  /\b(weather|forecast|temperature|rain|snow|sunny)\b/,
  /\b(news|politics|election|president|government)\b/,
  /\b(recipe|cooking|food|restaurant|dinner|lunch)\b/,
  /\b(joke|story|poem|song|game|play)\b/,
  /\b(stock|market|invest|crypto|bitcoin)\b/,
  /\b(sports|score|game|team|player)\b/,
  /\b(medical|doctor|prescription|medication|symptoms|diagnosis)\b/,
  /\b(legal|lawyer|attorney|lawsuit|court)\b/,
  /\b(relationship|dating|marriage|divorce)\b/,
];

const OFF_TOPIC_REDIRECT =
  "I can only help with Giddy-Up rides — booking, scheduling, or checking your upcoming trips. How can I help with your ride?";

// ── VoiceInputFilter ──────────────────────────────────────────────────────────

const VoiceInputFilter = {
  /**
   * Analyse a raw speech transcript and return the appropriate action.
   * Call this BEFORE sending anything to the intent API.
   */
  filter(rawTranscript: string): InputFilterAction {
    const text = normalise(rawTranscript);

    // 1. Emergency check — highest priority
    if (EMERGENCY_PATTERNS.some(re => re.test(text))) {
      return { action: 'call911' };
    }

    // 2. Human-request check
    if (HUMAN_PATTERNS.some(re => re.test(text))) {
      return { action: 'callSupport' };
    }

    // 3. Off-topic check
    if (OFF_TOPIC_PATTERNS.some(re => re.test(text))) {
      return { action: 'redirect', message: OFF_TOPIC_REDIRECT };
    }

    // 4. Safe — forward to intent API
    return { action: 'process', cleanedText: rawTranscript.trim() };
  },
};

export default VoiceInputFilter;

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Lowercase + remove accents + collapse whitespace for reliable matching. */
function normalise(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
