"use client";

/**
 * src/components/exam/ExamAudio.tsx
 *
 * Listening-section audio player with exam-style playback restrictions.
 *
 *   onePlay mode (maxPlays = 1, the default):
 *     - The audio can be played exactly once.
 *     - The native seekbar is disabled — the candidate cannot skip ahead or
 *       jump back. The progress bar is shown read-only.
 *     - When the audio ends, the play button is disabled (no replay).
 *     - A "Plays remaining: 1" badge updates to 0 after the first play.
 *
 *   multiPlay mode (maxPlays > 1):
 *     - The candidate can replay the audio up to `maxPlays` times.
 *     - The seekbar is still disabled (consistent with most proctored mocks).
 *
 *   compact mode:
 *     - A single-line variant: play/pause button + small progress + remaining
 *       badge, used inside question cards where vertical space is limited.
 *
 * Implementation notes:
 *   - The native `<audio controls>` element exposes a seekbar we cannot
 *     reliably disable across browsers, so we render the `<audio>` element
 *     WITHOUT the `controls` attribute and draw our own (read-only) progress.
 *     Seeking is blocked at the source: we intercept `seeking` / `seeked`
 *     events and restore the previous currentTime, which defeats both
 *     drag-the-thumb and keyboard-arrow seeking.
 *   - `playbackRate` is locked to 1 — the candidate cannot speed-listen.
 *   - `volume` is left controllable (some candidates need it lower).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Headphones, Pause, Play, RotateCcw, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ExamAudioProps = {
  /** Audio source URL (must be same-origin or CORS-enabled). */
  src: string;
  /** Maximum number of plays. `1` enables the strict onePlay exam mode. */
  maxPlays?: number;
  /** Compact single-line variant for inline use. */
  compact?: boolean;
  /** Optional accessible label for the audio (e.g. "Section 1 — Track 1"). */
  label?: string;
  /** Optional className for the root wrapper. */
  className?: string;
  /** Auto-play on mount. Defaults to false. Mostly for testing. */
  autoPlay?: boolean;
};

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function ExamAudio({
  src,
  maxPlays = 1,
  compact = false,
  label,
  className,
  autoPlay = false,
}: ExamAudioProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // The last known `currentTime` BEFORE a seek event fires. We restore to this
  // value when the browser reports a seek, so dragging the (hidden) native
  // seekbar or pressing arrow keys cannot move the playhead.
  const lastCurrentTimeRef = useRef(0);
  // Did this play attempt already count toward the budget? A single play
  // attempt that gets paused and resumed should only consume one credit; we
  // decrement the budget on the FIRST `playing` event after a `play` click,
  // then clear the flag on `ended` / `pause`.
  const playCountedRef = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playsRemaining, setPlaysRemaining] = useState(maxPlays);
  const [hasEnded, setHasEnded] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── Wire up the audio element listeners ────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMetadata = () => {
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
      setIsReady(true);
    };
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      lastCurrentTimeRef.current = audio.currentTime;
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      setHasEnded(true);
      playCountedRef.current = false;
    };
    const onPlaying = () => {
      // Count this play against the budget exactly once per play attempt.
      if (!playCountedRef.current) {
        playCountedRef.current = true;
        setPlaysRemaining((remaining) => Math.max(0, remaining - 1));
      }
    };
    const onSeeking = () => {
      // Block seeking: restore the playhead to where it was before the seek.
      // This defeats both drag-the-thumb seeking and keyboard arrow seeking.
      audio.currentTime = lastCurrentTimeRef.current;
    };
    const onRateChange = () => {
      // Lock playback rate to 1 — the candidate cannot speed-listen.
      if (audio.playbackRate !== 1) {
        audio.playbackRate = 1;
      }
    };
    const onError = () => {
      setError("The audio could not be loaded. Please try again.");
      setIsReady(false);
    };

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("seeking", onSeeking);
    audio.addEventListener("seeked", onSeeking);
    audio.addEventListener("ratechange", onRateChange);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("seeking", onSeeking);
      audio.removeEventListener("seeked", onSeeking);
      audio.removeEventListener("ratechange", onRateChange);
      audio.removeEventListener("error", onError);
    };
  }, []);

  // When the source changes we want to reset the derived player state.
  // Rather than driving that from a useEffect (which would call setState in
  // the effect body and trigger cascading renders), we listen for the audio
  // element's `loadstart` event — the browser fires it whenever the src
  // attribute changes, so the reset is synchronised to the external system
  // (the audio element) rather than to a render cycle.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onLoadStart = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setPlaysRemaining(maxPlays);
      setHasEnded(false);
      setIsReady(false);
      setError(null);
      playCountedRef.current = false;
      lastCurrentTimeRef.current = 0;
    };
    audio.addEventListener("loadstart", onLoadStart);
    return () => {
      audio.removeEventListener("loadstart", onLoadStart);
    };
  }, [maxPlays]);

  const noPlaysLeft = playsRemaining <= 0 || hasEnded;
  const canPlay = isReady && !noPlaysLeft && !error;

  const handleTogglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!canPlay) return;
    if (isPlaying) {
      void audio.pause();
    } else {
      void audio.play().catch(() => {
        setError("Playback was blocked. Please tap play again.");
      });
    }
  }, [canPlay, isPlaying]);

  // Optional auto-play (mostly for tests / hosted demos; browsers will block
  // it without a prior user gesture).
  useEffect(() => {
    if (!autoPlay || !audioRef.current || !canPlay) return;
    void audioRef.current.play().catch(() => {
      // Autoplay was blocked — expected. The candidate will click play.
    });
  }, [autoPlay, canPlay]);

  const progressPct =
    duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  // ─── Render ────────────────────────────────────────────────────────────
  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2",
          className,
        )}
      >
        <audio ref={audioRef} src={src} preload="metadata" hidden />
        <button
          type="button"
          onClick={handleTogglePlay}
          disabled={!canPlay}
          aria-label={isPlaying ? "Pause audio" : "Play audio"}
          className="grid size-9 shrink-0 place-items-center rounded-full bg-[#0057B8] text-white transition-colors hover:bg-[#0B63CE] disabled:cursor-not-allowed disabled:bg-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0057B8] focus-visible:ring-offset-2"
        >
          {isPlaying ? (
            <Pause className="size-4" aria-hidden="true" />
          ) : (
            <Play className="size-4 translate-x-0.5" aria-hidden="true" />
          )}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between text-[10px] font-medium text-slate-500">
            <span className="truncate">{label ?? "Audio"}</span>
            <span className="font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={Math.max(0, Math.round(duration))}
            aria-valuenow={Math.round(currentTime)}
            aria-label="Audio playback progress"
            className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-200"
          >
            <div
              className="h-full bg-[#0057B8] transition-[width] duration-150"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
        <PlaysRemainingBadge
          remaining={playsRemaining}
          maxPlays={maxPlays}
          className="hidden sm:inline-flex"
        />
        {error ? (
          <span className="ml-2 text-xs text-[#DC2626]">{error}</span>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white p-4 shadow-sm",
        className,
      )}
    >
      <audio ref={audioRef} src={src} preload="metadata" hidden />

      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#EEF6FF] text-[#0057B8]">
          <Headphones className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[#0B1F3A]">
            {label ?? "Listening audio"}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {maxPlays === 1
              ? "One play only — like the real exam. You cannot skip ahead."
              : `Up to ${maxPlays} plays. You cannot skip ahead.`}
          </p>
        </div>
        <PlaysRemainingBadge
          remaining={playsRemaining}
          maxPlays={maxPlays}
        />
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={handleTogglePlay}
          disabled={!canPlay}
          aria-label={isPlaying ? "Pause audio" : "Play audio"}
          className="grid size-11 shrink-0 place-items-center rounded-full bg-[#0057B8] text-white transition-colors hover:bg-[#0B63CE] disabled:cursor-not-allowed disabled:bg-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0057B8] focus-visible:ring-offset-2"
        >
          {isPlaying ? (
            <Pause className="size-5" aria-hidden="true" />
          ) : (
            <Play className="size-5 translate-x-0.5" aria-hidden="true" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={Math.max(0, Math.round(duration))}
            aria-valuenow={Math.round(currentTime)}
            aria-label="Audio playback progress (seeking disabled)"
            className="relative h-2 w-full overflow-hidden rounded-full bg-slate-200"
          >
            <div
              className="h-full bg-[#0057B8] transition-[width] duration-150"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[11px] font-medium text-slate-500">
            <span className="inline-flex items-center gap-1">
              <Volume2 className="size-3.5" aria-hidden="true" />
              {formatTime(currentTime)}
            </span>
            <span className="font-mono">{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      {hasEnded ? (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-[#FFF7ED] px-3 py-2 text-xs text-[#C2410C]">
          <RotateCcw className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <p>
            {maxPlays === 1
              ? "Playback finished. In the real exam the audio is played only once — you cannot replay it here."
              : "Playback finished. You can replay up to your remaining play budget."}
          </p>
        </div>
      ) : null}

      {error ? (
        <p className="mt-3 text-xs font-medium text-[#DC2626]">{error}</p>
      ) : null}
    </div>
  );
}

// ─── Sub-component: plays-remaining badge ───────────────────────────────
function PlaysRemainingBadge({
  remaining,
  maxPlays,
  className,
}: {
  remaining: number;
  maxPlays: number;
  className?: string;
}) {
  if (maxPlays === 1) {
    const used = remaining === 0;
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold",
          used
            ? "bg-[#FEE2E2] text-[#DC2626]"
            : "bg-[#EEF6FF] text-[#0057B8]",
          className,
        )}
        aria-label={`Plays remaining: ${remaining} of ${maxPlays}`}
      >
        <span
          aria-hidden="true"
          className={cn(
            "size-1.5 rounded-full",
            used ? "bg-[#DC2626]" : "bg-[#0057B8]",
          )}
        />
        {used ? "Played" : `${remaining} play left`}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full bg-[#EEF6FF] px-2.5 py-1 text-[11px] font-semibold text-[#0057B8]",
        className,
      )}
      aria-label={`Plays remaining: ${remaining} of ${maxPlays}`}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-[#0057B8]" />
      {remaining} / {maxPlays} plays
    </span>
  );
}

export default ExamAudio;
