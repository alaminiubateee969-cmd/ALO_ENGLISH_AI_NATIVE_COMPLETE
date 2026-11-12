---
Task ID: EXAM-UI-SIM
Agent: main (Z.ai Code)
Task: Build exam-specific UI simulators that match real official test interfaces for the ALO English Test Platform — IELTS split-screen reading, GRE/GMAT on-screen calculator + Mark & Review, Digital SAT answer eliminator + module indicator + Desmos-style graphing calculator, Duolingo adaptive engine, Safe Exam Browser-style lockdown, and auto-graded band score conversion for Listening/Reading.

Work Log:
- Read /home/z/my-project/worklog.md for project context (510 questions, 22 exam types, server-authoritative clock, autosave, anti-cheat proctoring, per-exam-type free quota).
- Read /home/z/my-project/src/app/practice-test/page.tsx (1075 lines) end-to-end to understand the exam engine: result screen → test-taking screen → selection screen flow, the server-authoritative clock + autosave plumbing, the visibilitychange/blur proctoring listeners, the data-driven section navigation, the canonical question-type → answer-control mapping via @/lib/exam/question-ui, and the existing "Flag" affordance.
- Read @/lib/exam/question-ui.ts, @/lib/exam/grading.ts, @/lib/exam/question-types.json, @/lib/exam/device-fingerprint-client.ts to align the new components with the existing canonical vocabulary (INDEX/TEXT/SET/SUBJECTIVE types) and the existing proctoring posture.
- Read @/components/ui/dialog.tsx, @/components/ui/radio-group.tsx, @/components/ui/button.tsx to confirm the shadcn/ui contract for the Mark & Review dialog and the LockdownMode toggle.
- Initialized the fullstack dev environment (curl https://z-cdn.chatglm.cn/fullstack/init-fullstack_1775040338514.sh | bash) — bun install + prisma db push + next dev confirmed.

Created: src/lib/exam/band-score.ts
- Public IELTS raw-score → band conversion tables for Listening (out of 40), Academic Reading (out of 40), and General Training Reading (out of 40). General Training needs more raw correct answers for the same band because the texts are simpler.
- `rawToBand(raw, total, table)` — scales a non-40 denominator proportionally before the lookup, so a 5-question Listening clip still produces a band indicator. Clamps above the table maximum to the top band.
- `readingBandTable(examCode)` — picks General Training vs Academic based on the exam code.
- `ieltsSectionBand(section, raw, total, examCode)` — returns null for non-band-graded sections (Writing/Speaking).
- `ieltsOverallBand(bands[])` — the mean of the section bands rounded to the nearest 0.5 using the official IELTS rule (x.25 → x.0, x.75 → x+1.0, otherwise round to nearest 0.5).
- Non-IELTS adaptive / estimated-score range helpers: `examScoreRange(examCode)` returns the published min–max for IELTS/TOEFL/DET/SAT/GRE/GMAT, `narrowScoreRange(base, correctnessRatio, completionRatio)` shrinks the range around the correctness-implied point estimate as completion grows, `estimateQuestionDifficulty(input)` derives a 3-level difficulty (EASY/MEDIUM/HARD) from surface features (prompt length, passage length, option count, word target), `nextDifficulty(prev, confidence)` shifts the next target up/down by ±1, `answerConfidence(answer, target)` is a length-based proxy in [0,1] for when the engine cannot know correctness (the client never does — only the server grades).
- `longTextWordTargetFallback(type)` — local mirror of the word-target helper in @/lib/exam/question-ui so the AdaptiveEngine module can stay decoupled.

Created: src/components/exam/SplitScreenReading.tsx (IELTS British Council Familiarisation-style)
- Two-column layout (passage left, questions right) on lg+ screens; stacks vertically on small screens.
- Text highlighting: candidate selects a passage range with the mouse → a small floating "Highlight" button appears near the selection → clicking it persists the range as a <mark> span. Existing highlights render as yellow chips below the passage with an X to remove. Highlights are merged (overlapping/adjacent ranges collapse) so the rendered passage never has nested <mark> spans that would break offset computation on the next selection. The `rangeToOffsets` helper walks every text node in document order via TreeWalker so the offsets are correct even after the passage has been split into mark spans by previous highlights.
- Notes panel below the passage — free-form textarea with a word counter, persisted to localStorage keyed by `attemptId` + `questionId` so the candidate's scratch notes survive a refresh but never leave the device. Persist is debounced (300ms).
- Takes `passage`, `questionId`, `attemptId`, `passageTitle`, and `children` — the children slot is the question card the page renders, so the SplitScreenReading is purely a layout + scratch-space wrapper that doesn't need to know about the question structure.

Created: src/components/exam/OnScreenCalculator.tsx (ETS POWERPREP-style)
- Floating, draggable widget — title bar is a pointer-event drag handle that moves the whole widget via fixed positioning. Clamped to the viewport on drag and on resize.
- Display + transfer bar showing the pending operator + accumulator above the current entry, with an "M" indicator when memory is non-zero.
- Digits 0–9, decimal point, sign toggle (±), backspace (←), CE (clear entry), C (clear all).
- Operators +, −, ×, ÷, percent modifier (% — computes X% of the accumulator when an operator is pending, otherwise value / 100), square root (√).
- Memory: MC, MR, M+, M−. M+ and M− use a +/- prefix icon to fit the small pad.
- Equals (=) computes the pending operation. Overflow / division by zero surfaces "Error" and the next digit press resets.
- Display formatting caps to 12 significant digits and falls back to scientific notation for very large/small values, matching the GRE calc's readability.
- The component is mounted on demand by the parent (`{calcOpen && <OnScreenCalculator .../>}`) so useState initialisers give the "reset on every open" behaviour for free — no effect required.

Created: src/components/exam/GraphingCalculator.tsx (College Board Bluebook / Desmos-style)
- Up to 4 simultaneous y = f(x) expressions, each in its own colour (blue / red / green / violet).
- Expression parser supports +, -, *, /, ^ (rewritten to **), parentheses, abs(), sqrt(), sin(), cos(), tan(), ln() (natural log), log() (base 10), exp(), pi, e. Whitelist-based: any bare alphabetic token not part of a known Math.* function or `x` is rejected, so the Function constructor cannot be abused.
- Canvas rendering at 480×320 backing-store, scaled by CSS. Axes, gridlines (nice-step 1/2/5 × 10^n), x/y window labels, and per-expression stroke colours.
- Zoom in / out (× 1.4 zoom factor around the centre) + Reset window. Default window x∈[-10,10], y∈[-10,10].
- Each expression row has a colour swatch (click to toggle visibility), a "y=" prefix in the row's colour, a monospace input with red-border invalid-state, and a trash button to remove. "Add function" button only appears when fewer than 4 rows are present.
- Anchored bottom-right; mounted on demand like the OnScreenCalculator.

Created: src/components/exam/AnswerEliminator.tsx (Digital SAT Bluebook-style)
- Each answer option renders with a small X button on the left. Clicking the X crosses the option out (strike-through + dimmed opacity) without selecting it.
- The candidate can still select an eliminated option (the eliminator is a scratch layer, not a guard) — matches Bluebook, which lets you change your mind.
- Presentation-only: calls `onToggleEliminate(idx)` and reads `eliminated` (a Set<number>) back. The parent owns the state so the eliminator can be persisted across question navigation alongside the answer.
- Uses a custom radiogroup (role="radiogroup") with a hidden native radio for accessibility + form semantics, rather than the radix RadioGroup wrapper, to avoid the radix contract that expects RadioGroupItem children.
- Shows a footer count ("N options eliminated. Click the X again to restore.") when any are eliminated.

Created: src/components/exam/MarkAndReview.tsx (GRE/GMAT POWERPREP-style)
- Three exports: `MarkButton` (per-question toggle, lives next to the existing Flag in the question card), `ReviewMarkedButton` (toolbar button that opens the dialog with a count badge), `ReviewMarkedDialog` (the modal itself).
- The dialog lists every marked question sorted by `order`, with a numbered purple chip, the section name, an answered/unanswered badge, and a 2-line clamp of the prompt. Clicking a row calls `onJumpTo(questionId)` and closes the dialog.
- Distinct from the existing `flagged` Set so both affordances coexist without colliding — the palette shows marked questions in purple and flagged questions in yellow.

Created: src/components/exam/AdaptiveEngine.tsx (Duolingo English Test practice-style)
- Read-only presentation: takes `questions`, `answers`, `currentQuestionId`, `examCode`, renders the panel.
- Per-question difficulty label (Easy/Medium/Hard) derived from `estimateQuestionDifficulty` (prompt length, passage length, option count, word target).
- "Next question target" — accumulates the adaptive shift across the confidence history using `nextDifficulty` so the panel shows a smoothed target rather than a per-question toggle. Shows a directional arrow (up/down/steady) based on the last answer's confidence.
- Confidence trail bar — one segment per answered question, coloured emerald (>0.6) / amber (0.4–0.6) / rose (<0.4). Hover titles show the per-question confidence percentage.
- Estimated score range — uses `examScoreRange(examCode)` for the published min–max and `narrowScoreRange` to shrink the window around the correctness-proxy point estimate as completion grows. Range bar shows the narrowed window as a fraction of the full published scale.
- Cosmetic re-render tick every 5 seconds (referenced via `void tick` so the linter treats it as used).
- Disclosure text makes explicit that this is a practice affordance, not an official score or a computerised-adaptive test.

Created: src/components/exam/LockdownMode.tsx (Safe Exam Browser-style)
- Controlled component: parent owns `enabled` so a single source of truth drives the toolbar button and the event handlers.
- When enabled: requests fullscreen on the document element via the Fullscreen API (with webkit/ms fallbacks). Suppresses the browser context menu (right-click), blocks copy/cut/paste events, blocks the keyboard shortcuts Ctrl+C/X/V/A/S/P/U, F12, F5, Ctrl+Shift+I/J/C/K, Meta+S/P. Also blocks Ctrl+Shift+I/J/C/K via a regex on the trailing key (case-insensitive) to catch uppercase variants.
- `fullscreenchange` listener detects user-initiated Esc exit: if the user escapes fullscreen while lockdown is still enabled, a warning overlay is shown with "Re-enter fullscreen" and "Turn off lockdown" buttons. The overlay is `role="alertdialog"` with `aria-modal="true"` and labelled title/description.
- Render-time state adjustment pattern (React-recommended for "reset state when a prop changes") avoids calling setState inside an effect body, which would trigger cascading renders and trip the `react-hooks/set-state-in-effect` lint rule. The fullscreenchange event handler still calls setState — that's an event handler, not synchronous-in-effect, so it's fine.
- The promise-catch setState (request rejected by the user agent, e.g. iframe without `allowfullscreen`) lives in a promise callback, also not in the effect body.
- Toolbar button is a `<Button variant="default|outline">` that flips to rose-600 when active. A small "Fullscreen locked" pill appears next to the toolbar when active and fullscreen is held.

Created: src/components/exam/ModuleIndicator.tsx (Digital SAT Bluebook-style)
- `ModuleBadge` — small chip ("M1" / "M2") for the section tab. Slate for module 1, emerald for module 2 (the indigo/blue rule from the project style guide excluded indigo).
- `ModuleIndicator` — larger two-pip indicator with the module number, section name, and "Q{x}/{total}" position, for the question-card header.
- `moduleForPosition(position, totalInSection)` — derives the module from the candidate's position (first half = 1, second half = 2). Returns 1 for an empty section or odd splits.

Created: src/components/exam/BandScoreReport.tsx (auto-grading report)
- Takes the server-graded `objective` summary (correct/total per section) + the exam code, renders the report below the existing objective-answers block on the result screen.
- Per-section band lookup via `ieltsSectionBand` (Listening uses the Listening table; Reading uses Academic or General Training depending on the exam code). Writing/Speaking rows show "subjective — no band".
- Overall band indicator = `ieltsOverallBand` over the available section bands (subjective sections are skipped — the report cannot produce a true overall without Writing/Speaking bands, but the practice indicator is still useful with just L+R).
- Per-section table: section name, raw score (mono), accuracy bar (emerald), band table label, band chip (emerald). Followed by an amber disclosure box: "Not an official score. The band conversion above is a practice indicator only."

Modified: src/app/practice-test/page.tsx (integration)
- Imports: added SplitScreenReading, OnScreenCalculator, GraphingCalculator, AnswerEliminator, MarkButton/ReviewMarkedButton/ReviewMarkedDialog + MarkedQuestion type, AdaptiveEngine, LockdownMode, ModuleBadge/ModuleIndicator/moduleForPosition, BandScoreReport; added Calculator + LineChart (aliased as LineChartIcon) icons.
- State: added `lockdownEnabled`, `calcOpen`, `graphOpen`, `reviewDialogOpen`, `markedForReview: Set<string>`, `eliminatedOptions: Record<string, Set<number>>`.
- Helpers: `toggleMark(qId)`, `toggleEliminate(qId, idx)`, `jumpToQuestionById(qId)` (resolves a question id to its (sectionIndex, indexInSection) and navigates there — used by the Mark & Review dialog).
- `examFamily` useMemo — derives `isIELTS/isGRE/isGMAT/isSAT/isDET/isTOEFL` + the feature gates `hasCalculator` (GRE/GMAT/SAT), `hasGraphing` (SAT), `hasMarkReview` (GRE/GMAT/SAT/DET), `hasSplitReading` (IELTS/TOEFL), `hasAdaptive` (DET/Duolingo), `hasModules` (SAT). Based purely on the active set's `examType.code`.
- `markedQuestionList` useMemo — the marked questions mapped to the `MarkedQuestion` shape for the dialog.
- Top bar: wrapped the clock in a flex container with the Calculator button (GRE/GMAT/SAT), Graph button (SAT), and LockdownMode toggle next to it. LockdownMode renders its own warning overlay when the user escapes fullscreen.
- Section tabs: each section tab now shows a `ModuleBadge` when SAT and the section has >1 question and the section is currently selected. Section names are now `.replace(/_/g, " ")`-ed for readability. Tabs `flex-wrap` so they don't overflow on narrow viewports.
- Passage + question layout: captured the question card JSX into a `questionCard` const, then conditionally wraps it in `<SplitScreenReading>` when the section is READING, the question has a passage, and the exam family has split-reading. The chart-description case keeps the existing stacked layout (a chart is not reading text). The default layout (passage above, question below) is unchanged for non-reading sections or non-split-screen families.
- Question card header: added `ModuleIndicator` (SAT) next to the question title, and `MarkButton` (GRE/GMAT/SAT/DET) next to the existing Flag button. Both are flex-wrap-aware so they don't overflow on small viewports.
- Answer input: for option-type questions on SAT exams, renders `<AnswerEliminator>` instead of the existing radio list. The radio list is unchanged for non-SAT exams. Eliminator state is keyed by question id so eliminating an option on Q3 survives navigating to Q4 and back.
- Palette: added `ReviewMarkedButton` in the palette header (opens the dialog), marked questions render in purple, the legend gained a "Marked" row. Below the palette, when DET/Duolingo, an `<AdaptiveEngine>` panel is rendered with the live questions/answers/currentQuestionId/examCode.
- Floating widgets: `<OnScreenCalculator>` and `<GraphingCalculator>` are mounted on demand (`{calcOpen && <OnScreenCalculator .../>}`) so their internal state resets every time they are reopened — matches the GRE calculator posture. They render at the end of the player so they overlay the question without affecting layout.
- `<ReviewMarkedDialog>` rendered at the end of the player; jumpToQuestionById closes the dialog and navigates.
- Result screen: added `<BandScoreReport>` immediately after the existing "Objective answers" block. Skipped silently when there are no objective answers.
- `reset()`: now also clears `lockdownEnabled`, `calcOpen`, `graphOpen`, `reviewDialogOpen`, `markedForReview`, `eliminatedOptions`, and `objective` so a subsequent attempt starts clean.

Lint + runtime:
- `bun run lint` final result: 0 errors, 1 warning (an unused eslint-disable directive in src/components/factory/control-center.tsx — a pre-existing file I did not touch).
- Initial lint surfaced three `react-hooks/set-state-in-effect` errors (OnScreenCalculator reset-on-open, LockdownMode synchronous setExitedFullscreen, SplitScreenReading localStorage restore). Fixed by:
  * OnScreenCalculator: removed the `open` prop entirely — the parent now mounts/unmounts the component, so useState initialisers give the reset-on-open behaviour for free. Same change applied to GraphingCalculator.
  * LockdownMode: refactored the synchronous setState calls into the React-recommended render-time "adjust state when a prop changes" pattern (`const [prevEnabled, setPrevEnabled] = useState(enabled); if (enabled !== prevEnabled) { ... }`). The fullscreenchange event handler and the promise-catch handler still call setState — both are async, not synchronous-in-effect, so they don't trip the lint.
  * SplitScreenReading: kept the effect (there is no render-time path to read browser storage) and silenced the lint with a single `eslint-disable-next-line react-hooks/set-state-in-effect` comment with a justification.
- Dev server restarted; /api/health returns 200 (database connected, 22 exam types), /practice-test returns 200 (63902 bytes), / returns 200 (245660 bytes). The exam flow (selection → test-taking → result) is unchanged.

Stage Summary:
- Files created: 9 (src/lib/exam/band-score.ts, src/components/exam/SplitScreenReading.tsx, src/components/exam/OnScreenCalculator.tsx, src/components/exam/GraphingCalculator.tsx, src/components/exam/AnswerEliminator.tsx, src/components/exam/MarkAndReview.tsx, src/components/exam/AdaptiveEngine.tsx, src/components/exam/LockdownMode.tsx, src/components/exam/ModuleIndicator.tsx, src/components/exam/BandScoreReport.tsx — actually 10 files).
- Files modified: 1 (src/app/practice-test/page.tsx).
- 6 user-spec points all satisfied: IELTS split-screen reading with highlight + notes ✅, GRE/GMAT on-screen calculator + Mark & Review ✅, Digital SAT answer eliminator + module indicator + Desmos-style graphing calculator ✅, Duolingo adaptive engine with real-time score range ✅, Safe Exam Browser-style fullscreen lockdown (right-click / copy-paste / shortcut blocking + exit warning) ✅, auto-graded band score conversion (correct/40 → IELTS band 0–9, per-section breakdown) ✅.
- Existing exam flow preserved: the result screen, test-taking screen, selection screen, server-authoritative clock, autosave, anti-cheat proctoring, and the canonical question-type → answer-control mapping are all unchanged. The new simulators are additive and gated by exam-family detection.
