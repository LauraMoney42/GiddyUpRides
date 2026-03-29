/**
 * giddyup-backend — server.js
 * Express API for GiddyUp Rides.
 * TTS: OpenAI tts-1-hd, nova voice (same setup as TicBuddyBackend).
 * Env vars required: OPENAI_API_KEY, AUTH_TOKEN, PORT (optional, default 3001)
 */

const express = require("express");

const app  = express();
const PORT = process.env.PORT || 3001;

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const AUTH_TOKEN     = process.env.AUTH_TOKEN     || "";

app.use(express.json());

// ── Health check ──────────────────────────────────────────────────────────────

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "giddyup-backend", tts: !!OPENAI_API_KEY });
});

// ── POST /api/tts ─────────────────────────────────────────────────────────────
// Accepts: { text: string }
// Returns: { audio: "<base64 mp3>" }
// Voice: nova (OpenAI tts-1-hd) — warm, clear, friendly. Same as TicBuddy.
// Falls back gracefully when called without auth during development.

app.post("/api/tts", async (req, res) => {
  // ── Auth ──────────────────────────────────────────────────────────────────
  if (AUTH_TOKEN) {
    const authHeader = req.headers.authorization ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token || token !== AUTH_TOKEN) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  // ── OpenAI key check ──────────────────────────────────────────────────────
  if (!OPENAI_API_KEY) {
    console.error("[tts] OPENAI_API_KEY not set");
    return res.status(503).json({ error: "TTS not configured — OPENAI_API_KEY missing" });
  }

  // ── Validate input ────────────────────────────────────────────────────────
  const { text } = req.body ?? {};
  if (!text || typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ error: "text is required and must be a non-empty string" });
  }
  if (text.length > 4000) {
    return res.status(400).json({ error: "text exceeds 4000 character limit" });
  }

  // ── Call OpenAI TTS ───────────────────────────────────────────────────────
  try {
    const oaiRes = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "tts-1-hd",
        voice: "nova",        // warm, clear, friendly — same as TicBuddy
        input: text.trim(),
        response_format: "mp3",
        speed: 1.0,
      }),
    });

    if (!oaiRes.ok) {
      const errText = await oaiRes.text();
      console.error(`[tts] OpenAI error ${oaiRes.status}: ${errText}`);
      return res.status(500).json({ error: "TTS synthesis failed" });
    }

    const audioBuffer = await oaiRes.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString("base64");

    return res.json({ audio: base64Audio });

  } catch (err) {
    console.error("[tts] Unexpected error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`[giddyup-backend] Running on port ${PORT}`);
  console.log(`[giddyup-backend] TTS: ${OPENAI_API_KEY ? "✅ OpenAI nova" : "❌ No API key"}`);
});
