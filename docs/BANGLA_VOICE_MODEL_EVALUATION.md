# Bangla Voice Model Evaluation Plan (TTS · ASR · VAD)

**Document:** `docs/BANGLA_VOICE_MODEL_EVALUATION.md`
**Phase:** 0 — evaluation *plan* and candidate shortlist. **No model has been benchmarked by ALO yet.**
**Date:** 2026-10-31

> **Read this first.** Every accuracy number in §2 is **quoted from a public source and has not been reproduced by ALO**. Published WER/MOS figures do not transfer between datasets, audio conditions or text normalisation schemes. This document exists so that the numbers ALO eventually publishes are *AOL's own measurements, on Bangladeshi audio, with a named protocol* — not somebody else's model card.

---

## 1. Why this document is not optional

The product's defining requirement is **genuinely usable Bangla voice**. The brief is explicit: *"Do not assume a model supports high-quality Bangla merely because it supports multilingual transcription."* The evidence supports that warning:

- Whisper's multilingual training is English-centric, and its Bengali performance is **poor out of the box**: an independent Bengali corpus study reports **84.53 % WER / 72.92 % CER zero-shot for Whisper large-v3** on Bangladeshi/multi-domain speech, with the authors observing the model "fails near-uniformly across domains" ([Lipi-Ghor, arXiv 2610.36184](https://arxiv.org/html/2610.36184)).
- A practitioner measurement on a handful of Bangla clips found **49–61 % word error** across Whisper variants, with a decoding-loop failure on one sentence ([mockingbird issue #122](https://github.com/NirjharBhattacharjee/mockingbird/issues/122)).
- Fine-tuned Bengali models land far better: the same Lipi-Ghor study reports **20.70 % WER** for a fine-tuned faster-whisper-medium, **21.54 %** for Moonshine-Base-Bengali and **24.67 %** for a Fast Conformer; a Bengali Whisper fine-tune (`BuzzASR/bengali`, MIT) is reported at **19 % on Common Voice 25** and **32 % on FLEURS**; a FLEURS-tuned `whisper-large-v3` checkpoint card reports **44.50 % WER** ([model card](https://huggingface.co/KhushiDS/whisper-large-v3-Bengali)).
- The same is true of TTS: "supports Bengali" in a model card says nothing about **Bangladeshi** pronunciation, prosody on questions, or how it reads `৳ ১,২৫০` and `+৮৮০` out loud.

**Conclusion:** the default choice (Whisper large-v3) is a *baseline*, not a solution, and no model may be adopted on its card alone.

---

## 2. Candidate matrix (licence + evidence status)

### 2.1 Text-to-speech

| Candidate | Bangla evidence | Licence (as published) | Compute | Status for ALO |
|---|---|---|---|---|
| **Indic Parler-TTS** (AI4Bharat) | Officially supports Bengali; 69 voices across 21 languages; emotion prompts officially supported for Bengali; trained on IndicTTS (CC BY 4.0, 382 h, 12 languages) | **Apache-2.0**, **gated** | ~0.9 B params; GPU strongly preferred | **Shortlist A.** Highest confidence in licence + explicit Bengali support. **Risk: training data is predominantly Indian Bengali → accent may not be bn-BD**; gating terms must be confirmed in writing |
| **Orpheus 3B + Bangla LoRA** (community fine-tunes, e.g. `EMTIAZZ/orpheus-3b-bangla-high-data-finetuning`, `ehzawad/orpheus-bangla-emotional-tts`) | Bangla LoRA trained on ~99 K Bangladeshi samples (per model card); emotional styles claimed | Declared **Apache-2.0**, but **base is Llama-3.2-3B-Instruct** → inherited Llama community licence + gated access | 3 B params; **GPU required** (roughly 16 GB VRAM for fp16 — *estimate*) | **Shortlist B.** Most promising bn-BD timbre if the cards are honest. **Blocked until:** upstream Llama terms reviewed, training-data rights documented, and latency measured |
| **Bangla VITS (bn-BD)** e.g. `EMTIAZZ/bangladeshi-bangla-tts-vits` | Bangladeshi pronunciation claimed; single speaker | Declared **Apache-2.0** | Small; **CPU-feasible** (VITS is designed for real-time CPU) | **Shortlist C.** Cheapest path to a working bn-BD voice. **Blocked until speaker consent + dataset provenance are documented** (an Apache-2.0 code licence does not prove the voice data was licensed) |
| **Piper** | Bangla voice availability **unverified** | Engine: MIT (archived) → **GPL-3.0** (active `OHF-Voice/piper1-gpl`); per-voice licences vary and must be read from each `MODEL_CARD` | CPU-first | **Conditional.** Only if a Bangla voice exists *and* is commercially licensed *and* legal accepts GPL-3.0 process-use |
| **Meta MMS TTS `mms-tts-ben`** | Bengali checkpoint exists | **CC-BY-NC 4.0** | Small | **Excluded from production** (non-commercial). Usable only as a research baseline |
| **Coqui XTTS v2** | Multilingual; cloning | code MPL-2.0, **weights CPML (non-commercial)**; vendor dissolved 2024 → **no commercial licence purchasable** | GPU | **Excluded from production.** Referenced only to explain why "open source" ≠ "commercially usable" |
| **Kokoro-82M** | Bangla support **not established** | Apache-2.0 | CPU/GPU light | **Not shortlisted** until Bangla is demonstrated |
| **edge-tts** (currently used for English listening assets) | Bangla voices exist but are **hosted** and undocumented for product synthesis | Microsoft service terms | none (external) | **Not a production voice.** May be used only to generate internal reference audio while evaluating local models, subject to terms review |

### 2.2 Automatic speech recognition

| Candidate | Bangla evidence | Licence | Compute | Status |
|---|---|---|---|---|
| **faster-whisper (large-v3, int8)** | Baseline; poor zero-shot Bangla (§1) | **MIT** (model weights MIT) | ~3 GB RAM int8 CPU; ~10 GB VRAM fp16 (*estimate*) | **Baseline for every comparison** |
| **`BuzzASR/bengali`** (full large-v3 fine-tune, Bengali tokenizer) | Reported 19 % CV25 / 32 % FLEURS (third-party summary) | **MIT** (per its listing — *verify on the repo*) | GPU for streaming; large-v3 footprint | **Shortlist A.** Note: replaced tokenizer — check runtime compatibility (`whisper.cpp`/CT2) before investing |
| **Moonshine-Base-Bengali** | 21.54 % WER / 10.79 % CER on Lipi-Ghor | verify (Moonshine base MIT) | small, fast | **Shortlist B** — best latency/quality trade-off candidate for streaming |
| **Fast Conformer Bengali** (NeMo-style) | 24.67 % WER / 15.56 % CER on Lipi-Ghor | verify (NeMo Apache-2.0) | GPU for streaming | **Shortlist C** — if we need true streaming partials |
| **Hishab TITU** (Bengali ASR) | 30.51 % WER zero-shot on Lipi-Ghor | **verify — commercial terms unclear** | unknown | Reference only until licence is clear |
| **Meta MMS / SeamlessM4T** | Bengali supported | **CC-BY-NC 4.0** (verify per checkpoint) | heavy | **Excluded** from production |
| **Whisper large-v3 (openai)** | 84.53 % on Lipi-Ghor zero-shot | MIT | as baseline | Baseline only |

### 2.3 Supporting models

| Role | Candidate | Licence | Note |
|---|---|---|---|
| VAD | Silero VAD | MIT (verify) | Latency-critical; must run inside the 20 ms frame loop |
| Diarisation | pyannote.audio | MIT code, **gated weights with terms** | Required only for multi-speaker recordings; verify terms |
| Punctuation/casing | small Bangla model or rule-based | — | Prefer rule-based for BN (danda `।`, digits) before neural |
| Language ID (bn/en) | small classifier or ASR confidence | — | Must handle code-switching, not just whole-utterance ID |
| Speaker embeddings | ECAPA-TDNN (Apache/MIT variants) | verify | Only for consented verification, never for covert identification |

---

## 3. What "good Bangla" means — measurable criteria

| Dimension | How measured | Notes |
|---|---|---|
| Pronunciation accuracy | Native-rater error tagging (mispronounced word, wrong vowel, wrong stress) on a fixed word list + connected speech | The `bn-BD` vs `bn-IN` distinction shows up here first |
| Naturalness | MOS 1–5, ≥ 5 native raters per stimulus, reported with 95 % CI and inter-rater agreement | Never quote a single rater |
| Intelligibility | Round-trip: synthesise → ASR → CER against the source text **using an ASR model other than the one used to train the TTS** (avoids circularity) | Reported separately from MOS |
| Number/date/currency reading | Fixed list: `৳ ১,২৫০.৫০`, `+৮৮০ ১৭xx`, `৩১/১০/২০২৬`, `১০০%`, `২য়`, `১২:৩০` | A system that reads `৳` as "taka taka" fails |
| Question vs statement prosody | Blind native-rater identification accuracy on question/statement pairs | Target: ≥ 90 % |
| Long-form stability | 3–5 minute passage: no drift, no truncation, no repeating loops, stable speaker identity | Streaming systems often fail here |
| Latency | First-audio-chunk ms; real-time factor (RTF) per sentence | Budgets from `TELEPHONY_ARCHITECTURE.md` §4.3 |
| ASR accuracy | WER and CER after documented normalisation (§4.3) | Report both; Bengali is agglutinative and character-heavy |
| Code-switching | WER on bn-EN mixed utterances, plus **script correctness** (Bangla output for Bangla speech) | Whisper's classic failure: Bangla speech → Urdu/Arabic script or romanisation |
| Noise robustness | WER at SNR 20/10/5 dB with real Bangladeshi noise (traffic, market, call-centre babble) | "Noisy environment" in the brief |
| Telephone band | WER on 8 kHz G.711-round-tripped audio | The only condition that matters for a phone call |
| Hallucination | Rate of output text on silence/noise-only segments | Whisper is known to invent text on silence — this must be counted, not ignored |

---

## 4. Evaluation protocol

### 4.1 Speakers and consent (non-negotiable)

- **24 speakers minimum** for ASR test sets: balanced gender, age bands 18–25 / 26–40 / 41–60, and at least four regional accent/vocabulary groups (Dhaka, Chattogram, Sylhet, northern/western districts) — the goal is coverage of Bangladeshi speech, not a "standard" fiction.
- **Every speaker signs a written consent** covering: recording, transcription, evaluation, retention period, withdrawal, and whether their audio may ever be used for training (default: **no training use**). Consent records follow the existing register shape (`src/lib/crm/consent.ts`): evidence, source, timestamp, revocation path.
- **No scraped audio, no YouTube rips, no "public dataset" whose licence we have not read.** Datasets used for *training* a final model must additionally have documented commercial-use rights.
- Scripts are **original** ALO business-domain texts (no copyrighted scripts).
- Speaker identity is stored as a pseudonymous code; audio files carry no name in the filename.

### 4.2 Test sets

| Set | Content | Size (target) | Purpose |
|---|---|---|---|
| **A — Clean read** | Original scripts: service enquiries, product info, order status, complaints, appointments | 120 utterances × 24 speakers ≈ 2,880 | Baseline accuracy, naturalness comparison |
| **B — Business-critical entities** | Prices, dates, phone numbers, addresses, NID/order numbers, names | 40 utterances × 12 speakers | Entity accuracy (the errors that cost money) |
| **C — Code-switched** | Bengali sentences with English product/tech nouns ("আমার order number টা দেন") | 60 utterances × 12 speakers | bn-EN mixed recognition |
| **D — Spontaneous** | Consented staff-volunteer role-play of customer calls (never real customer data), including hesitations, self-corrections, interruptions | 200 utterances | Realism; the hardest set |
| **E — Degraded** | Set A + C re-rendered at 8 kHz G.711, and with additive noise at 20/10/5 dB SNR | derived | Telephony realism |
| **F — TTS stimuli** | 40 texts × each candidate voice × each style (neutral, question, emphatic) | ~600 clips | MOS / intelligibility / prosody |
| **G — Negative controls** | Silence, background noise only, music | 50 clips | Hallucination rate |

Dataset splits are frozen and hashed before any model is run. The same frozen sets are used for every candidate, so comparisons are like-for-like.

### 4.3 Bangla-specific text normalisation (this decides your WER)

WER is only comparable if normalisation is documented and identical across models. Rules to fix in advance and version (`bn-normalisation-v1`):

1. Unicode **NFC**; strip zero-width joiners/non-joiners that are not orthographically required.
2. Bengali digits `০১২৩৪৫৬৭৮৯` ↔ ASCII `0123456789` — choose **one** canonical form and apply to both hypothesis and reference.
3. Currency `৳`/`টাকা`/`taka`/`Tk` → one token class; percent `%`/`শতাংশ`.
4. Danda `।` and `?`/`!` → sentence boundary, then removed for WER.
5. Hasanta `্` and conjuncts: **do not** blindly split; record whether the model emits decomposed sequences.
6. English words inside Bangla: score in the script produced; count a script mismatch as an error **and** report it separately (a model that transcribes Bangla speech into Latin or Urdu script is wrong even if "the words match").
7. Numbers spoken as words (`এক হাজার`) vs digits (`১০০০`) → normalise per an explicit verbalisation table, since ASR output convention differs by model.
8. Remove fillers only if the reference does; never delete hesitations to make a number look better.
9. Report **CER as well as WER** (Bengali morphology makes WER harsh and CER informative), plus sentence-level exact match.
10. Publish the normaliser as code in the evaluation harness, so the numbers can be re-derived.

### 4.4 Rating protocol (TTS)

- **5 native Bangla raters** per stimulus, 7-point or 5-point MOS scale, randomised order, no knowledge of which model produced which clip.
- Raters additionally tag errors from a closed list: wrong vowel, wrong consonant, wrong stress, unnatural pause, wrong intonation, foreign accent, misread number, misread English word, clipping/artefact.
- Report **mean MOS with 95 % bootstrap CI**, **inter-rater agreement** (Krippendorff's α or ICC), and the **error-tag frequency table**. A single aggregate "4.2/5" without these is not evidence.
- Include a **human reference** (a consented native speaker reading the same texts) and a **telephone-band** rendering of every sample — judges must hear what a customer will hear.

### 4.5 ASR protocol

- Decode settings recorded (beam size, VAD, language hint, temperature fallbacks). **Language hint must be tested both ways** (`bn` forced vs auto), because auto-detection is where script errors appear.
- Streaming metrics measured separately from batch: partial-hypothesis stability, finalisation delay, and the effect of a 200 ms VAD hangover.
- Every model run on the frozen sets produces a machine-readable results file (`results/<model>/<set>.json`) committed alongside the report, containing per-utterance reference/hypothesis/WER/CER/latency — the audit trail that makes the claim checkable.

---

## 5. Decision gates (proposed — the owner sets the final bar)

> These thresholds are **proposals**. They are deliberately stated as numbers so that "good enough" is a fact, not an opinion. Owner sign-off required before Phase 3.

**ASR — an engine may be used for live AI calls only if all hold:**

| Gate | Threshold |
|---|---|
| WER, Set A (clean, 16 kHz) | ≤ 15 % |
| WER, Set E (8 kHz telephony) | ≤ 25 % |
| WER, Set C (code-switched) | ≤ 30 %, and script-correctness ≥ 95 % |
| Entity accuracy, Set B | ≥ 90 % exact for numbers/dates/prices |
| Hallucination, Set G | ≤ 1 % of silence clips produce text |
| Final-hypothesis latency | p95 ≤ 300 ms after end-of-speech |
| RTF | ≤ 0.5 on target hardware |

**TTS — a voice may be offered to customers only if all hold:**

| Gate | Threshold |
|---|---|
| MOS (telephone-band stimuli, 95 % CI lower bound) | ≥ 3.6 (target 4.0+) |
| Round-trip CER (independent ASR) | ≤ 10 % |
| Number/date/currency reading | 100 % correct on the fixed list |
| Question/statement identification | ≥ 90 % |
| First-chunk latency | p95 ≤ 350 ms |
| Long-form | 5-minute generation without drift, truncation or repetition |
| Licence + voice-rights evidence | Complete and reviewed in writing |

**If no candidate passes:** the honest product is *human-agent contact centre + IVR with recorded human prompts + AI assist (suggested replies, summarisation, QA) for the agent*. That is a real product. An AI that mis-hears Bangladeshi customers and reads prices wrongly is not.

---

## 6. Hardware and cost (order-of-magnitude estimates, to be validated)

| Workload | Shape | Consequence |
|---|---|---|
| Bangla VITS TTS | small, CPU real-time | Could run on the existing class of server; 1 core per few concurrent syntheses (*measure*) |
| Indic Parler-TTS / Orpheus 3B | GPU, ~0.9 B / 3 B | 1 GPU can serve a limited number of concurrent streams; concurrency is bounded by TTS, not by the switch |
| Whisper-class ASR (streaming) | GPU preferred; CPU int8 possible with RTF > 1 | CPU-only streaming ASR is the most likely first bottleneck |
| Local LLM (8 B-class, 4-bit) | 1 GPU (≈ 8–16 GB VRAM) | Needed to hit the latency budget in `TELEPHONY_ARCHITECTURE.md` |
| Evaluation runs | 2,880 + 2,000 + 600 stimuli × candidates | Tens of GPU-hours per full sweep; plan a dedicated window |

**Procurement recommendation:** do not buy GPU capacity until the ASR/TTS shortlist is measured on rented GPU time with the frozen test sets. The measurement is cheap; the wrong hardware is not. (The current audit sandbox — 2 vCPU / 3 GB, no GPU, restricted network — cannot produce these numbers and must not be used for them.)

---

## 7. Voice design and authorised cloning (evaluation view)

**Voice design (synthetic persona)** is the default path and carries no third-party rights. It is configured by characteristics (age-style description, timbre, pace, energy, accent, gender presentation) — never by naming a real person. The brief's constraint is adopted verbatim: *"Age-style description without impersonating a real person."*

**Voice cloning** is a separate, gated capability:

1. **Consent first, technology second.** A clone may not be created until a signed consent record exists (identity document check, purpose, scope, expiry, revocation path) — same evidentiary standard as `CommunicationConsent` (a `GRANTED` without evidence is refused by design in this codebase).
2. **Technical gate:** speaker-similarity (SECS/cosine) ≥ threshold, MOS ≥ 3.6, no artefact regressions, and a **listening test by the voice owner themselves** — they approve their own clone.
3. **Provenance:** every generated clip carries metadata (voice id, consent id, model id/version, timestamp, purpose) and, where technically feasible, an inaudible watermark; export embeds provenance in the container.
4. **Revocation is real:** revoking consent disables the voice for new synthesis immediately, purges stored embeddings/speaker references within a stated window, and leaves an audit trail. Existing exported audio cannot be recalled — that limitation must be disclosed to the voice owner in writing **before** cloning.
5. **Abuse detection:** rate limits, purpose restrictions, blocked-name list (public figures), manual review of every new clone, and anomaly alerts.
6. **Never**: cloning a public figure, a customer, a colleague without their own signed consent, or "a voice that sounds like X".

None of this is built. It is listed here so the evaluation harness does not accidentally create a cloning capability that later needs to be un-created.

---

## 8. Evaluation harness (what will be built in Phase 3)

```
eval/
  datasets/<set>/         audio (wav, 16 kHz mono + 8 kHz band-limited), transcripts/, consent/, manifest.sha256
  normalise/bn-normalisation-v1.ts
  runners/{asr,tts}/      adapters: faster-whisper, buzzasr, moonshine, conformer, parler, orpheus, vits
  metrics/                wer.ts cer.ts entity.ts hallucination.ts latency.ts mos.ts bootstrap.ts
  raters/                 blinded A/B sheets, per-stimulus error tags, agreement calculation
  results/<model>/<set>.json   per-utterance evidence
  reports/<date>-<model>.md    the human-readable verdict, with CI and agreement
```

Rules for the harness: frozen datasets (hash-checked), identical normalisation for all candidates, per-utterance evidence files committed, and a report that names what was **not** measured. Latency measured through the real pipeline (media node → ASR → LLM → TTS → playback), never model-internal timings alone.

---

## 9. Unresolved questions to close before Phase 3

1. Which candidate TTS do we licence-review first? (Recommendation: Indic Parler-TTS for a baseline + a bn-BD VITS checkpoint for accent, in parallel.)
2. Are we permitted to use community Bangla checkpoints whose training data provenance is undocumented, for **evaluation only**? (Recommendation: yes for evaluation, **no** for production until documented.)
3. Does the owner accept the possibility that Phase 3 ends with no shippable voice, and the product ships in human-agent + AI-assist mode? (This must be answered *before* money is spent.)
4. Who are the 5+ native raters, and how are they compensated and blinded?
5. Will the owner provide 8 kHz real call audio (consented, from a pilot) as the final validation set? Without it, everything is studio speech and the WER will be optimistic.
