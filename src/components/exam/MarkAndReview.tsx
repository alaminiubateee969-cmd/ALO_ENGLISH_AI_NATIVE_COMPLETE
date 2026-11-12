"use client";

/**
 * src/components/exam/MarkAndReview.tsx
 *
 * ETS POWERPREP-style "Mark & Review" feature for the GRE / GMAT exam
 * families. Two pieces:
 *
 *   1. <MarkButton> — a per-question toggle that bookmarks the current
 *      question into the "marked for review" set. Lives next to the
 *      existing Flag affordance in the question card.
 *
 *   2. <ReviewMarkedDialog> — a modal opened from the question palette
 *      that lists every marked question, its prompt snippet, and an
 *      answered / unanswered badge. Clicking a row jumps to that
 *      question so the candidate can revisit it before submitting.
 *
 * The component set is presentation-only: the parent owns the marked Set
 * and the answer map (so the marks survive a refresh via the parent's
 * existing autosave plumbing).
 */

import { useMemo } from "react";
import { Bookmark, BookmarkCheck, ListChecks } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type MarkedQuestion = {
  id: string;
  section: string;
  prompt: string;
  order: number;
  answered: boolean;
};

type MarkButtonProps = {
  marked: boolean;
  onToggle: () => void;
  disabled?: boolean;
};

/** Per-question "Mark for Review" toggle button. */
export function MarkButton({ marked, onToggle, disabled }: MarkButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={marked}
      className={cn(
        "flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium transition disabled:opacity-50",
        marked
          ? "bg-purple-100 text-purple-700 hover:bg-purple-200"
          : "text-slate-500 hover:bg-slate-100",
      )}
      title={marked ? "Marked for review — click to unmark" : "Mark this question for review"}
    >
      {marked ? (
        <>
          <BookmarkCheck className="h-4 w-4" /> Marked
        </>
      ) : (
        <>
          <Bookmark className="h-4 w-4" /> Mark
        </>
      )}
    </button>
  );
}

type ReviewMarkedDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** All marked questions, in any order — the dialog sorts by `order`. */
  questions: MarkedQuestion[];
  /** Jump to a question by id (parent handles section + index resolution). */
  onJumpTo: (questionId: string) => void;
};

/** Modal listing every marked question, with jump-to handlers. */
export function ReviewMarkedDialog({
  open,
  onOpenChange,
  questions,
  onJumpTo,
}: ReviewMarkedDialogProps) {
  const sorted = useMemo(
    () => [...questions].sort((a, b) => a.order - b.order),
    [questions],
  );
  const answeredCount = sorted.filter((q) => q.answered).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-purple-600" />
            Marked for review
          </DialogTitle>
          <DialogDescription>
            {sorted.length === 0
              ? "You have not marked any questions for review."
              : `${sorted.length} question${sorted.length === 1 ? "" : "s"} marked · ${answeredCount} answered · ${sorted.length - answeredCount} unanswered. Click a row to jump back to it.`}
          </DialogDescription>
        </DialogHeader>

        {sorted.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
            Use the “Mark” button on any question to flag it for a final review pass before submitting.
          </div>
        ) : (
          <ul role="list" className="max-h-[60vh] overflow-y-auto rounded-lg border border-slate-200 divide-y divide-slate-100">
            {sorted.map((q, i) => (
              <li key={q.id}>
                <button
                  type="button"
                  onClick={() => {
                    onJumpTo(q.id);
                    onOpenChange(false);
                  }}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-slate-50"
                >
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-semibold text-purple-700">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-xs text-slate-500">
                      <span>{q.section.replace(/_/g, " ")}</span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-medium",
                          q.answered
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700",
                        )}
                      >
                        {q.answered ? "Answered" : "Unanswered"}
                      </span>
                    </span>
                    <span className="mt-0.5 line-clamp-2 text-sm text-slate-700">
                      {q.prompt}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type ReviewMarkedButtonProps = {
  markedCount: number;
  onClick: () => void;
  disabled?: boolean;
};

/** Toolbar button that opens the review dialog. */
export function ReviewMarkedButton({
  markedCount,
  onClick,
  disabled,
}: ReviewMarkedButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm font-medium transition",
        markedCount > 0
          ? "border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100"
          : "border-slate-300 text-slate-600 hover:bg-slate-50",
        "disabled:opacity-50",
      )}
      title="Review questions you have marked"
    >
      <ListChecks className="h-4 w-4" />
      Review
      {markedCount > 0 && (
        <span className="ml-1 rounded-full bg-purple-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
          {markedCount}
        </span>
      )}
    </button>
  );
}

export default ReviewMarkedDialog;
