/**
 * src/lib/ai/examiner/BrowserVoiceEngine.ts
 *
 * Browser-native voice engine for speaking practice. These APIs are built
 * into every modern browser (Chrome, Edge, Safari, Firefox) and are FREE —
 * no external paid STT/TTS provider is required.
 *
 *   - `browserSpeak(text)`      uses window.speechSynthesis (Text-to-Speech)
 *   - `browserListen(opts)`     uses webkitSpeechRecognition / SpeechRecognition
 *                                (Speech-to-Text, live microphone transcription)
 *
 * This module is CLIENT-ONLY. It never imports any server-side SDK and
 * performs no network calls. Everything runs in the visitor's browser, so
 * microphone audio never leaves the device unless the host page explicitly
 * uploads it elsewhere.
 *
 * The ExaminerEngine (server-side, optional z-ai-web-dev-sdk enhancement)
 * is now used ONLY when the deployment opts in. By default the live-exam
 * page drives TTS + STT through this browser module.
 */

"use client";

// ─── Types ──────────────────────────────────────────────────────────────

export type BrowserVoiceInfo = {
  ttsSupported: boolean;
  sttSupported: boolean;
  voicesLoaded: boolean;
};

export type BrowserSpeakOptions = {
  rate?: number; // 0.1 – 10, default 0.95 (slightly slower for clarity)
  pitch?: number; // 0 – 2, default 1.0
  volume?: number; // 0 – 1, default 1.0
  /** BCP-47 tag, e.g. "en-US", "en-GB", "en-IN". Default "" (browser default). */
  lang?: string;
  /** Prefer a voice whose name contains this substring (case-insensitive). */
  preferredVoiceName?: string;
  /** Called when the utterance starts. */
  onStart?: () => void;
  /** Called when the utterance ends naturally OR is cancelled. */
  onEnd?: () => void;
  /** Called if the browser reports a synthesis error. */
  onError?: (err: string) => void;
};

export type BrowserListenOptions = {
  /** BCP-47 tag, e.g. "en-US". Default "" (browser default). */
  lang?: string;
  /** Whether to keep recognition running after a final result. Default false. */
  continuous?: boolean;
  /** Return interim (non-final) results. Default true. */
  interimResults?: boolean;
  /** Called with the latest transcript chunk (may be interim or final). */
  onResult?: (transcript: string, isFinal: boolean) => void;
  /** Called when recognition starts listening. */
  onStart?: () => void;
  /** Called when recognition ends (manually or automatically). */
  onEnd?: () => void;
  /** Called with a human-readable error string. */
  onError?: (err: string) => void;
  /** Max seconds to listen before auto-stopping. Default 120. */
  maxDurationSec?: number;
};

export type BrowserRecognitionHandle = {
  /** Stop recognition; final results are still delivered via onResult. */
  stop: () => void;
  /** Hard-cancel recognition immediately. */
  abort: () => void;
};

// ─── Capability detection ───────────────────────────────────────────────

export function isBrowserTTSSupported(): boolean {
  return typeof window !== "undefined" && typeof window.speechSynthesis !== "undefined";
}

export function isBrowserSTTSupported(): boolean {
  if (typeof window === "undefined") return false;
  return typeof (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition !== "undefined"
    || typeof (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition !== "undefined";
}

export function getBrowserVoiceInfo(): BrowserVoiceInfo {
  return {
    ttsSupported: isBrowserTTSSupported(),
    sttSupported: isBrowserSTTSupported(),
    voicesLoaded: isBrowserTTSSupported() && window.speechSynthesis.getVoices().length > 0,
  };
}

// ─── Text-to-Speech: window.speechSynthesis ─────────────────────────────

/**
 * Speak `text` using the browser's built-in SpeechSynthesis API.
 * Cancels any in-flight utterance first to avoid overlapping speech.
 */
export function browserSpeak(text: string, opts: BrowserSpeakOptions = {}): void {
  if (!isBrowserTTSSupported() || !text) {
    if (opts.onEnd) opts.onEnd();
    return;
  }
  const synth = window.speechSynthesis;
  // Cancel any previously queued speech so the new utterance starts cleanly.
  synth.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = typeof opts.rate === "number" ? clamp(opts.rate, 0.1, 10) : 0.95;
  utterance.pitch = typeof opts.pitch === "number" ? clamp(opts.pitch, 0, 2) : 1.0;
  utterance.volume = typeof opts.volume === "number" ? clamp(opts.volume, 0, 1) : 1.0;
  if (opts.lang) utterance.lang = opts.lang;

  // Try to pick a matching voice from the loaded list.
  const voices = synth.getVoices();
  if (voices.length > 0) {
    const preferred = opts.preferredVoiceName
      ? voices.find((v) => v.name.toLowerCase().includes(opts.preferredVoiceName!.toLowerCase()))
      : undefined;
    const langMatch = preferred
      || voices.find((v) => opts.lang && v.lang === opts.lang)
      || voices.find((v) => v.lang.startsWith("en"))
      || voices[0];
    if (langMatch) utterance.voice = langMatch;
  }

  if (opts.onStart) utterance.onstart = () => opts.onStart!();
  utterance.onend = () => opts.onEnd && opts.onEnd();
  utterance.onerror = (e) => {
    const reason = (e as SpeechSynthesisErrorEvent)?.error || "unknown";
    if (opts.onError) opts.onError(reason);
    // Synthesis sometimes reports "interrupted" or "canceled" after a manual
    // cancel(); that's not a real failure, but we still fire onEnd so the UI
    // returns to its listening state.
    if (opts.onEnd) opts.onEnd();
  };

  synth.speak(utterance);
}

/** Stop any in-flight browser speech immediately. */
export function browserCancelSpeak(): void {
  if (isBrowserTTSSupported()) {
    window.speechSynthesis.cancel();
  }
}

// ─── Speech-to-Text: webkitSpeechRecognition / SpeechRecognition ─────────

/**
 * Start live microphone transcription using the browser's built-in
 * SpeechRecognition API. Returns a handle whose `stop()` / `abort()`
 * methods let the caller end the session.
 *
 * Returns `null` if SpeechRecognition is unavailable in this browser
 * (Safari < 14.1, Firefox, etc.); the caller can fall back to typed input.
 */
export function browserListen(opts: BrowserListenOptions = {}): BrowserRecognitionHandle | null {
  if (!isBrowserSTTSupported()) {
    if (opts.onError) opts.onError("Speech recognition is not supported in this browser. Use Chrome, Edge, or Safari.");
    return null;
  }

  // We cast through unknown because the TS DOM lib doesn't ship the
  // vendor-prefixed constructor by default.
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition!;
  const recognition = new Ctor();

  recognition.lang = opts.lang || "";
  recognition.continuous = typeof opts.continuous === "boolean" ? opts.continuous : false;
  recognition.interimResults = typeof opts.interimResults === "boolean" ? opts.interimResults : true;
  recognition.maxAlternatives = 1;

  let ended = false;
  const finish = (reason: "ended" | "aborted") => {
    if (ended) return;
    ended = true;
    if (reason === "ended" && opts.onEnd) opts.onEnd();
    if (opts.onEnd) opts.onEnd();
  };

  recognition.onstart = () => {
    if (opts.onStart) opts.onStart();
  };

  recognition.onresult = (event: SpeechRecognitionEventLike) => {
    let interim = "";
    let final = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const transcript = result[0]?.transcript || "";
      if (result.isFinal) final += transcript;
      else interim += transcript;
    }
    if (final && opts.onResult) opts.onResult(final.trim(), true);
    if (interim && opts.onResult) opts.onResult(interim.trim(), false);
  };

  recognition.onerror = (e: SpeechRecognitionErrorEventLike) => {
    const err = e?.error || "unknown";
    // "no-speech" and "aborted" are normal end-of-session signals, not errors.
    if (err !== "no-speech" && err !== "aborted" && opts.onError) {
      opts.onError(err);
    }
  };

  recognition.onend = () => {
    finish("ended");
  };

  try {
    recognition.start();
  } catch (err) {
    // start() throws if called twice or if the page hasn't received a user
    // gesture. Surface as onError and return a no-op handle so the caller
    // can clean up its UI.
    if (opts.onError) opts.onError(String(err));
    return {
      stop: () => {},
      abort: () => {},
    };
  }

  // Auto-stop after maxDurationSec to avoid runaway sessions.
  const maxSec = typeof opts.maxDurationSec === "number" ? opts.maxDurationSec : 120;
  const timer = setTimeout(() => {
    try {
      recognition.stop();
    } catch {
      // ignore
    }
  }, maxSec * 1000);

  return {
    stop: () => {
      clearTimeout(timer);
      try {
        recognition.stop();
      } catch {
        // already stopped
      }
    },
    abort: () => {
      clearTimeout(timer);
      try {
        recognition.abort();
      } catch {
        // already aborted
      }
      finish("aborted");
    },
  };
}

// ─── Voices helper ──────────────────────────────────────────────────────

/**
 * Some browsers populate speechSynthesis.getVoices() asynchronously. This
 * helper resolves with the voice list once it's available (or immediately
 * if it already is).
 */
export function loadBrowserVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (!isBrowserTTSSupported()) {
      resolve([]);
      return;
    }
    const synth = window.speechSynthesis;
    const existing = synth.getVoices();
    if (existing.length > 0) {
      resolve(existing);
      return;
    }
    // voiceschanged is the standard event; some browsers fire it after a tick.
    const handler = () => {
      const v = synth.getVoices();
      if (v.length > 0) {
        synth.removeEventListener("voiceschanged", handler);
        resolve(v);
      }
    };
    synth.addEventListener("voiceschanged", handler);
    // Fallback timeout — never leave the caller hanging.
    setTimeout(() => {
      synth.removeEventListener("voiceschanged", handler);
      resolve(synth.getVoices());
    }, 1500);
  });
}

// ─── Local helpers ──────────────────────────────────────────────────────

function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

// Minimal vendor-typed shapes we use (TS DOM lib doesn't ship these
// reliably across versions, so we declare just what we touch).
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: ((this: SpeechRecognitionLike, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognitionLike, ev: SpeechRecognitionEventLike) => void) | null;
  onerror: ((this: SpeechRecognitionLike, ev: SpeechRecognitionErrorEventLike) => void) | null;
  onend: ((this: SpeechRecognitionLike, ev: Event) => void) | null;
};

type SpeechRecognitionResultLike = ArrayLike<{ transcript: string }> & {
  isFinal: boolean;
  length: number;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike> & { length: number };
};

type SpeechRecognitionErrorEventLike = {
  error: string;
};
