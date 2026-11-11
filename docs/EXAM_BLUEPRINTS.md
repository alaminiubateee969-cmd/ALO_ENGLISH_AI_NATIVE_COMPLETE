# Exam Blueprints

**Status:** implemented and verified — 2026-10-19  
**Code:** `src/lib/agents/runtime/blueprints.ts`  
**Checked against the providers' own published specifications:** 2026-10-19

A blueprint is the contract between the content agents and the exam engine.
It says which sections an exam has, how long each one is, how many items it
contains, which item types it uses, and where the structure came from.

Before this file existed, the platform described an exam as a title, a
duration and a bag of question types. That was not enough to generate a
question, to allocate a sitting, or to tell a learner what a mock test will
contain.

---

## The nine principal families

| Exam | Sections | Timing | Score scale | Source |
|---|---|---|---|---|
| **IELTS Academic** | Listening 40q · Reading 40q (3 passages, 2150–2750 words) · Writing 2 tasks (150+ / 250+ words) · Speaking 3 parts | 30 / 60 / 60 / 11–14 min (2h45 total) | 0–9 band | [ielts.org — IELTS Academic test](https://ielts.org/take-a-test/test-types/ielts-academic-test) |
| **IELTS General Training** | As above, but Reading is everyday texts and Writing Task 1 is a letter | as above | 0–9 band | [ielts.org — General Training](https://ielts.org/take-a-test/test-types/ielts-general-training-test) |
| **TOEFL iBT** *(format from 21 January 2026)* | Reading 50 items (Complete the Words / Read in Daily Life / Academic Passage) · Listening 47 items · Speaking 11 items · Writing 12 items | 30 / 29 / 8 / 23 min (~90 min) | 0–30 per section, 0–120 total; also 1–6 | [ETS — TOEFL iBT content](https://www.ets.org/toefl/test-takers/ibt/about/content.html) · [ETS — 2026 test specifications (PDF)](https://www.in.ets.org/content/dam/ets-org/pdfs/toefl/toefl-ibt-test-specifications-2026.pdf) |
| **PTE Academic** *(format from 7 August 2025)* | Part 1 Speaking & Writing, 9 task types · Part 2 Reading, 5 types · Part 3 Listening, 8 types | 76–84 / 23–30 / 31–39 min | 10–90 | [Pearson — PTE Academic](https://www.pearsonpte.com/pte-academic/test-format) |
| **Duolingo English Test** | Intro & setup 5 min · Adaptive test 45 min · Writing and speaking sample 10 min (ungraded) | ~60 min | 10–160 in steps of 5 | [Duolingo — DET Scoring Guide 2026 (PDF)](https://englishtest-static.duolingo.com/media/resources/DET_Scoring%20Guide%20for%20Teachers%20(2026).pdf) |
| **GRE General Test** | Analytical Writing 1 essay (30 min) · Verbal 12q/18min + 15q/23min · Quantitative 12q/21min + 15q/26min | ~1h58 | 130–170, 0–6 AW | [ETS — GRE structure](https://www.ets.org/gre/test-takers/general-test/prepare/test-structure.html) |
| **GMAT Focus Edition** | Quantitative 21q/45min · Verbal 23q/45min · Data Insights 20q/45min | 2h15 | 205–805, 60–90 per section | [GMAC — GMAT exam](https://www.mba.com/exams-and-exam-prep/gmat-exam) |
| **Digital SAT** | Reading & Writing 54q (2 × 27, 32 min) · Math 44q (2 × 22, 35 min) | 2h14 | 400–1600 | [College Board — SAT test format](https://www.collegeboard.org/educators/college-board-maps/sat-test-format) |
| **ACT** | English 50q/45min · Math 45q/60min · Reading 36q/35min · Science 40q/35min (optional) · Writing (optional) | ~2h55 | 1–36 | [ACT — test format](https://www.act.org/the-act/test/format) |
| **ALO English Placement** | Listening 20 · Reading 20 · Writing 15 · Speaking 10 | 60 min | Not a proficiency certificate | ALO product definition |

## The other eleven the platform already offers

| Exam | Structure | Source |
|---|---|---|
| **IELTS for UKVI** | as IELTS; the test is for UK visa purposes | [ielts.org — test types](https://ielts.org/en-us/for-test-takers/test-format) |
| **OET (Healthcare)** | Listening 42q/40min · Reading 42q/60min · Writing 1 task/45min · Speaking 2 role plays/20min | [Cambridge English — OET](https://www.cambridgeenglish.org/exams-and-tests/oet/test-overview/) |
| **TOEIC** | Listening 100q/45min · Reading 100q/75min | [ETS — TOEIC](https://www.ets.org/toeic/about/listening-reading.html) |
| **Cambridge Linguaskill** | Reading & Listening 75min · Speaking 15min · Writing 45min | [Cambridge English — Linguaskill](https://www.cambridgeenglish.org/exams-and-tests/linguaskill/) |
| **LanguageCert** | Reading & Listening 60min · Writing 40min · Speaking 15min | [LanguageCert](https://www.languagecert.org/exams/english/languagecert-english/) |
| **MCAT** | Chem/Phys 59q/95min · CARS 53q/90min · Bio/Biochem 59q/95min · Psych/Soc 59q/95min | [AAMC](https://www.aamc.org/students/mcat-exam/register/exam-day) |
| **LSAT** | LR I and II 24–26q each/35min · RC 26–28q/35min · Experimental unscored · Argumentative Writing 50min | [LSAC](https://www.lsat.org/about/what-is-the-lsat) |
| **Visa Interview Practice** | Interview practice only, 30 min, no score | ALO product definition |
| **OIETC** | **Generic structure only.** The product's identity has not been verified, so no provider structure is claimed and the blueprint says so. | none — identity unverified |

---

## Two things a blueprint is not

**A blueprint is not a score.** The `scoring` field records the provider's own
scale so the platform can *talk about* it. It does not mean the platform
produces that score. The platform's practice result is a deterministic,
disclosed accuracy ratio on a 0–9 practice indicator, and every result the
platform shows carries that disclosure.

**A blueprint is not a licence.** The structures above are the public
specifications of each product. The platform's *content* is original: the
question generator composes invented places, organisations and facts at run
time, so nothing in the bank is taken from any provider's material.

---

## Rules the code enforces

* **Every question type a blueprint names must be one the grader can score.**
  `unscoreableBlueprintTypes()` returns the types a blueprint names that are
  not in the canonical vocabulary, and the test suite asserts that list is
  empty for every blueprint. A blueprint cannot drift away from the grader.
* **Every blueprint must name a source and the date it was checked.** The test
  suite asserts it.
* **An exam with no blueprint cannot generate questions.** Agent 002 refuses.
* **An exam whose identity is unverified must say so.** The `OIETC` blueprint
  carries `identityVerified: false` and a source label that says the product's
  identity is unverified.

## Re-verification

Providers change their specifications — TOEFL did in January 2026 and PTE in
August 2025. Each blueprint carries `sourceCheckedAt`, and the agent workforce
proposes a blueprint change through the same approval gate as everything else:
an agent may propose, and a human decides.
