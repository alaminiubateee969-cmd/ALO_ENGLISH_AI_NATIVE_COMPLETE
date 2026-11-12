"use client";

/**
 * src/components/exam/SplitScreenReading.tsx
 *
 * IELTS British-Council-Familiarisation-style reading panel:
 *
 *  ┌────────────────────────┬──────────────────────────┐
 *  │  Passage (scrollable)  │   Questions (children)   │
 *  │  - text highlighting   │                          │
 *  │  - notes panel below   │                          │
 *  └────────────────────────┴──────────────────────────┘
 *
 * On narrow screens (below `lg`) the two panes stack: passage first,
 * questions second — the same order a candidate reads them in.
 *
 * Text highlighting:
 *   - The candidate selects a passage range with the mouse.
 *   - A small "Highlight" toolbar appears near the selection.
 *   - Clicking it persists the range as a <mark> span.
 *   - Hovering an existing mark shows a "Remove" affordance.
 *
 * Notes:
 *   - A textarea below the passage, persisted to localStorage keyed by
 *     `attemptId` + `questionId` so the candidate's scratch notes survive
 *     a refresh but never leave the device.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Highlighter, StickyNote, Trash2, X } from "lucide-react";

type HighlightRange = {
  /** Inclusive character offset into the passage string. */
  start: number;
  /** Exclusive character offset into the passage string. */
  end: number;
  id: string;
};

type SplitScreenReadingProps = {
  passage: string;
  /** Stable key for the per-question notes namespace. */
  questionId: string;
  /** Optional attempt id — when supplied, notes are namespaced per attempt. */
  attemptId?: string;
  /** Title shown above the passage. */
  passageTitle?: string;
  /** The questions pane — the page renders its own question card here. */
  children?: ReactNode;
};

/**
 * Merge overlapping/adjacent ranges so the rendered passage never has
 * nested <mark> spans (which would break offset computation on the next
 * selection).
 */
function mergeRanges(ranges: HighlightRange[]): HighlightRange[] {
  if (ranges.length === 0) return [];
  const sorted = [...ranges].sort((a, b) => a.start - b.start || a.end - b.end);
  const merged: HighlightRange[] = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    const cur = sorted[i];
    if (cur.start <= last.end) {
      last.end = Math.max(last.end, cur.end);
    } else {
      merged.push(cur);
    }
  }
  return merged;
}

/**
 * Compute [start, end) character offsets of a Range within the passage
 * container by walking every text node in document order and summing
 * lengths. Works whether the passage is a single text node or has been
 * split into mark spans by previous highlights.
 */
function rangeToOffsets(container: HTMLElement, range: Range): { start: number; end: number } | null {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let charCount = 0;
  let start = -1;
  let end = -1;
  let node: Text | null = walker.nextNode() as Text | null;
  while (node) {
    const len = node.textContent?.length ?? 0;
    if (start === -1 && node === range.startContainer) {
      start = charCount + Math.min(range.startOffset, len);
    }
    if (end === -1 && node === range.endContainer) {
      end = charCount + Math.min(range.endOffset, len);
    }
    if (start !== -1 && end !== -1) break;
    charCount += len;
    node = walker.nextNode() as Text | null;
  }
  if (start === -1 || end === -1) return null;
  if (end < start) [start, end] = [end, start];
  return { start, end };
}

/** Render the passage string as alternating plain / highlighted spans. */
function renderPassage(text: string, ranges: HighlightRange[]): ReactNode[] {
  if (ranges.length === 0) return [text];
  const out: ReactNode[] = [];
  let cursor = 0;
  ranges.forEach((r, i) => {
    if (r.start > cursor) out.push(text.slice(cursor, r.start));
    out.push(
      <mark
        key={`hl-${r.id}`}
        data-hl-id={r.id}
        className="rounded bg-yellow-200 px-0.5 text-slate-900 hover:bg-yellow-300"
      >
        {text.slice(r.start, r.end)}
      </mark>,
    );
    cursor = r.end;
    if (i === ranges.length - 1 && cursor < text.length) out.push(text.slice(cursor));
  });
  return out;
}

export function SplitScreenReading({
  passage,
  questionId,
  attemptId,
  passageTitle = "Reading Passage",
  children,
}: SplitScreenReadingProps) {
  const passageRef = useRef<HTMLDivElement>(null);
  const [highlights, setHighlights] = useState<HighlightRange[]>([]);
  const [selectionBox, setSelectionBox] = useState<{ x: number; y: number } | null>(null);
  const [pendingRange, setPendingRange] = useState<Range | null>(null);
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(true);

  // ─── Restore highlights + notes from localStorage on question change ──
  const storageKey = useMemo(
    () => `alo.reading.${attemptId ?? "session"}.${questionId}`,
    [attemptId, questionId],
  );

  useEffect(() => {
    let restoredHighlights: HighlightRange[] = [];
    let restoredNotes = "";
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.highlights)) {
          restoredHighlights = parsed.highlights
            .filter((h) => typeof h?.start === "number" && typeof h?.end === "number")
            .map((h, i) => ({
              id: String(h.id ?? `r${i}`),
              start: Math.max(0, Math.floor(h.start)),
              end: Math.min(passage.length, Math.floor(h.end)),
            }))
            .filter((h) => h.end > h.start);
        }
        if (typeof parsed.notes === "string") restoredNotes = parsed.notes;
      }
    } catch {
      /* ignore — corrupted entry, start fresh */
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading persisted UI state from localStorage on mount/question change; there is no render-time path to read browser storage without an effect.
    setHighlights(mergeRanges(restoredHighlights));
    setNotes(restoredNotes);
    setSelectionBox(null);
    setPendingRange(null);
  }, [storageKey, passage.length]);

  // ─── Persist highlights + notes (debounced) ───────────────────────────
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify({ highlights, notes }));
      } catch {
        /* quota / private mode — non-fatal */
      }
    }, 300);
    return () => clearTimeout(t);
  }, [storageKey, highlights, notes]);

  // ─── Selection → floating "Highlight" button ──────────────────────────
  const handleMouseUp = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
      setSelectionBox(null);
      setPendingRange(null);
      return;
    }
    const range = sel.getRangeAt(0);
    const container = passageRef.current;
    if (!container) return;
    // Only react when the selection is anchored inside the passage.
    if (!container.contains(range.commonAncestorContainer)) {
      setSelectionBox(null);
      setPendingRange(null);
      return;
    }
    const offsets = rangeToOffsets(container, range);
    if (!offsets || offsets.end - offsets.start < 1) {
      setSelectionBox(null);
      setPendingRange(null);
      return;
    }
    const rect = range.getBoundingClientRect();
    setPendingRange(range.cloneRange());
    setSelectionBox({
      x: rect.left + rect.width / 2,
      y: rect.top + window.scrollY,
    });
  }, []);

  const addHighlight = useCallback(() => {
    if (!pendingRange || !passageRef.current) return;
    const offsets = rangeToOffsets(passageRef.current, pendingRange);
    if (!offsets) {
      setSelectionBox(null);
      setPendingRange(null);
      return;
    }
    const newRange: HighlightRange = {
      id: `hl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      start: offsets.start,
      end: offsets.end,
    };
    setHighlights((prev) => mergeRanges([...prev, newRange]));
    window.getSelection()?.removeAllRanges();
    setSelectionBox(null);
    setPendingRange(null);
  }, [pendingRange]);

  const removeHighlight = useCallback((id: string) => {
    setHighlights((prev) => prev.filter((h) => h.id !== id));
  }, []);

  const clearAllHighlights = useCallback(() => {
    setHighlights([]);
  }, []);

  const merged = useMemo(() => mergeRanges(highlights), [highlights]);
  const wordCount = useMemo(
    () => passage.split(/\s+/).filter(Boolean).length,
    [passage],
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[1.05fr_1fr] xl:grid-cols-[1.15fr_1fr]">
      {/* LEFT — passage + notes */}
      <div className="flex flex-col gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Highlighter className="h-4 w-4 text-amber-500" />
              <span>{passageTitle}</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-normal text-slate-500">
                {wordCount} words
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowNotes((s) => !s)}
                className="flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                aria-pressed={showNotes}
                aria-label={showNotes ? "Hide notes panel" : "Show notes panel"}
              >
                <StickyNote className="h-3.5 w-3.5" /> Notes
              </button>
              {merged.length > 0 && (
                <button
                  type="button"
                  onClick={clearAllHighlights}
                  className="flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Clear
                </button>
              )}
            </div>
          </div>

          <div
            ref={passageRef}
            onMouseUp={handleMouseUp}
            className="relative max-h-[60vh] overflow-y-auto whitespace-pre-line rounded-lg bg-slate-50 p-4 text-sm leading-relaxed text-slate-700"
            aria-label="Reading passage — select text to highlight"
          >
            {renderPassage(passage, merged)}
            {merged.map((h) => (
              <button
                key={`rm-${h.id}`}
                type="button"
                onClick={() => removeHighlight(h.id)}
                className="sr-only"
                aria-label={`Remove highlight from offset ${h.start} to ${h.end}`}
              >
                remove
              </button>
            ))}
          </div>

          {/* Highlight chips — visible list so the candidate can manage them */}
          {merged.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {merged.map((h, i) => (
                <button
                  key={`chip-${h.id}`}
                  type="button"
                  onClick={() => removeHighlight(h.id)}
                  className="group flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800 hover:bg-yellow-200"
                  title={`Highlight ${i + 1}: "${passage.slice(h.start, h.end).slice(0, 40)}${h.end - h.start > 40 ? "…" : ""}" — click to remove`}
                >
                  <span className="max-w-[12rem] truncate">
                    {passage.slice(h.start, h.end)}
                  </span>
                  <X className="h-3 w-3 opacity-60 group-hover:opacity-100" />
                </button>
              ))}
            </div>
          )}

          {/* Floating "Highlight" toolbar — anchored to the selection */}
          {selectionBox && (
            <div
              className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full"
              style={{ left: selectionBox.x, top: selectionBox.y - 8 }}
            >
              <button
                type="button"
                onClick={addHighlight}
                className="pointer-events-auto flex items-center gap-1 rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg hover:bg-slate-700"
              >
                <Highlighter className="h-3.5 w-3.5" /> Highlight
              </button>
            </div>
          )}
        </div>

        {/* Notes panel */}
        {showNotes && (
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <StickyNote className="h-4 w-4 text-amber-500" />
              <span>Notes</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-normal text-slate-500">
                {notes.split(/\s+/).filter(Boolean).length} words · saved locally
              </span>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              placeholder="Jot down key points, paraphrases, or question references. Notes are saved to this browser only."
              className="w-full resize-y rounded-md border border-slate-300 p-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-300"
              aria-label="Reading notes"
            />
          </div>
        )}
      </div>

      {/* RIGHT — questions (caller-provided) */}
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export default SplitScreenReading;
