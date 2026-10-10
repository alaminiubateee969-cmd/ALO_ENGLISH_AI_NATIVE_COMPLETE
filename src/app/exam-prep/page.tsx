"use client";

/**
 * src/app/exam-prep/page.tsx
 *
 * Exam Preparation Center — lists the active exam types and practice-bank
 * counts returned by the database. Provider information is linked where an
 * official source was checked; local content and score equivalence remain
 * separate release gates.
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, FileText, Mic, PenLine, Headphones, ArrowRight, Sparkles } from "lucide-react";

type ExamType = {
  id: string;
  code: string;
  name: string;
  category: string;
  questionCount: number;
  practiceSetCount: number;
  available: boolean;
};

type StudyMaterial = {
  id: string;
  title: string;
  description: string | null;
  category: string;
};

type ExamInfo = {
  format?: string;
  sections?: string[];
  scoring?: string;
  note?: string;
  sourceUrl?: string;
  icon: typeof BookOpen;
};

/**
 * Current provider information is shown only for entries with an official
 * source link. These are summaries, not a claim that the local practice bank
 * or its scoring reproduces an official exam.
 */
const EXAM_INFO: Record<string, ExamInfo> = {
  "IELTS-A": {
    format: "About 2 hours 45 minutes; Speaking is 11–14 minutes",
    sections: ["Listening", "Reading", "Writing", "Speaking"],
    scoring: "Band scale 0–9",
    note: "Academic version. Local questions and scores are not provider-certified.",
    sourceUrl: "https://ielts.org/organisations/ielts-for-organisations/test-types/ielts-academic-test/academic-test-format-in-detail",
    icon: Headphones,
  },
  "IELTS-G": {
    format: "About 2 hours 45 minutes; Speaking is 11–14 minutes",
    sections: ["Listening", "Reading", "Writing", "Speaking"],
    scoring: "Band scale 0–9",
    note: "General Training version. Local questions and scores are not provider-certified.",
    sourceUrl: "https://ielts.org/organisations/ielts-for-organisations/test-types/ielts-academic-test/academic-test-format-in-detail",
    icon: PenLine,
  },
  "TOEFL-iBT": {
    format: "2026 adaptive format; approximately 1 hour",
    sections: ["Reading", "Listening", "Writing", "Speaking"],
    scoring: "1–6 reporting scale; comparable 0–120 during the transition period",
    note: "Task counts and timing vary with the adaptive format. Local practice results are not TOEFL scores.",
    sourceUrl: "https://www.ets.org/toefl/test-takers/ibt/about/content.html",
    icon: Headphones,
  },
  "PTE-A": {
    format: "Speaking & Writing portion: approximately 76–84 minutes",
    sections: ["Speaking & Writing", "Reading", "Listening"],
    scoring: "PTE score scale 10–90",
    note: "The Speaking & Writing portion has nine task types; local practice results are not PTE scores.",
    sourceUrl: "https://www.pearsonpte.com/pte-academic/test-format/speaking-writing/",
    icon: Mic,
  },
  "DUOLINGO": {
    format: "Approximately 1 hour; adaptive",
    sections: ["Literacy", "Comprehension", "Conversation", "Production"],
    scoring: "10–160, with skill and integrated subscores",
    note: "The local practice engine does not reproduce the adaptive DET or its certified score.",
    sourceUrl: "https://blog.englishtest.duolingo.com/how-is-the-duolingo-english-test-scored/",
    icon: Sparkles,
  },
  "OET": {
    sections: ["Listening", "Reading", "Writing", "Speaking"],
    scoring: "Component results use a 0–500 scale and letter grades",
    note: "Four sub-tests; Speaking may be scheduled separately under specified conditions.",
    sourceUrl: "https://oet.com/test-regulations",
    icon: BookOpen,
  },
  "LANGUAGECERT": {
    sections: ["Written examination", "Spoken examination"],
    note: "Written and spoken exams may be taken separately and lead to independent certificates.",
    sourceUrl: "https://www.languagecert.org/en/about-us/faq/international-esol-faq",
    icon: FileText,
  },
  "GRE": {
    format: "About 1 hour 58 minutes; current format began September 22, 2023",
    sections: ["Analytical Writing (one Issue task)", "Verbal Reasoning", "Quantitative Reasoning"],
    scoring: "Verbal and Quantitative 130–170; Analytical Writing 0–6",
    note: "Local practice results are not GRE scores; do not infer equivalence from a generic percentage.",
    sourceUrl: "https://www.ets.org/gre/test-takers/general-test/prepare/test-structure.html",
    icon: PenLine,
  },
  "SAT": {
    format: "2 hours 14 minutes; two adaptive modules per section",
    sections: ["Reading and Writing", "Math"],
    scoring: "400–1600",
    note: "Digital SAT multistage-adaptive format. Local practice results are not SAT scores.",
    sourceUrl: "https://satsuite.collegeboard.org/sat/whats-on-the-test/structure",
    icon: FileText,
  },
  "ACT": {
    format: "Enhanced test; Science and Writing are optional",
    sections: ["English", "Math", "Reading", "Optional Science", "Optional Writing"],
    note: "Since September 2025, the Composite averages English, Math, and Reading. Local results are not ACT scores.",
    sourceUrl: "https://www.act.org/content/dam/act/unsecured/documents/ACT-UserHandbook.pdf",
    icon: BookOpen,
  },
  "LSAT": {
    sections: ["Two scored Logical Reasoning sections", "One scored Reading Comprehension section", "One unscored variable section"],
    scoring: "120–180; Argumentative Writing is separate and unscored",
    note: "The current multiple-choice test no longer includes Logic Games / Analytical Reasoning.",
    sourceUrl: "https://www.lsac.org/lsat/frequently-asked-questions-about-lsat",
    icon: PenLine,
  },
  "TOEIC": {
    sections: ["Listening and Reading; other TOEIC tests are separate"],
    note: "This catalog code does not identify which TOEIC version is configured. Check the official test page before relying on timing or score details.",
    icon: Headphones,
  },
  "GMAT": {
    format: "2 hours 15 minutes; three 45-minute sections, order is flexible",
    sections: ["Quantitative Reasoning", "Verbal Reasoning", "Data Insights"],
    scoring: "205–805; each section contributes equally",
    note: "Current GMAC format. Local practice results are not GMAT scores.",
    sourceUrl: "https://www.mba.com/exams-and-exam-prep/gmat-exam/what-is-the-gmat-exam-and-what-should-you-know",
    icon: FileText,
  },
  "VISA-INTERVIEW": {
    note: "Interview preparation, not a standardized English proficiency score. Follow the official authority’s current instructions; no outcome is guaranteed.",
    icon: Mic,
  },
  "ALO-PLACEMENT": {
    note: "Internal placement format. The current deployment’s sections and placement rubric have not been independently verified.",
    icon: FileText,
  },
};

const CATEGORY_COLORS: Record<string, string> = {
  "English Proficiency": "bg-blue-50 text-blue-700 ring-blue-200",
  "Academic": "bg-purple-50 text-purple-700 ring-purple-200",
  "ALO Internal": "bg-rose-50 text-rose-700 ring-rose-200",
  "Visa & Interview": "bg-amber-50 text-amber-700 ring-amber-200",
};

export default function ExamPrepPage() {
  const [examTypes, setExamTypes] = useState<ExamType[]>([]);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("All");

  useEffect(() => {
    Promise.all([
      fetch("/api/exam-types").then((r) => r.json()),
      fetch("/api/rag/materials").then((r) => r.json()),
    ]).then(([examRes, matRes]) => {
      if (examRes.success) {
        setExamTypes(
          examRes.data.examTypes.map((et: ExamType & { practiceSetCount?: number }) => ({
            ...et,
            questionCount: et.questionCount || 0,
            practiceSetCount: et.practiceSetCount || 0,
          }))
        );
      }
      if (matRes.success) {
        setMaterials(matRes.data.materials);
      }
    }).finally(() => setLoading(false));
  }, []);

  const categories = ["All", ...Array.from(new Set(examTypes.map((e) => e.category)))];
  const filtered = filter === "All" ? examTypes : examTypes.filter((e) => e.category === filter);

  return (
    <div className="min-h-[calc(100vh-200px)] bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Exam Preparation Center
          </h1>
          <p className="mt-2 text-slate-600 max-w-2xl mx-auto">
            Browse exam types and question counts from the active database. A question count does not establish a full-length test, official content alignment, validated scoring, or working media.
          </p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-blue-600">{examTypes.length}</p>
              <p className="text-xs text-slate-500">Active Exam Types</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-purple-600">{examTypes.reduce((s, e) => s + e.questionCount, 0)}</p>
              <p className="text-xs text-slate-500">Active Question Rows</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-rose-600">{materials.length}</p>
              <p className="text-xs text-slate-500">Study Guides</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-amber-600">{examTypes.reduce((sum, exam) => sum + exam.practiceSetCount, 0)}</p>
              <p className="text-xs text-slate-500">Active Practice Sets</p>
            </CardContent>
          </Card>
        </div>

        {/* AI Handbook Banner */}
        <Card className="mb-8 overflow-hidden border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="flex flex-col items-center gap-4 p-6 sm:flex-row">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white">
              <Sparkles className="h-7 w-7" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-lg font-bold text-slate-900">Study Guidance</h3>
              <p className="text-sm text-slate-600">
                Guidance responses depend on the content and services configured for this deployment. Verify exam rules, format, and scoring with the official provider.
              </p>
            </div>
            <a
              href="/ask-handbook"
              className="shrink-0 rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-blue-600"
            >
              Open study guidance →
            </a>
          </CardContent>
        </Card>

        {/* Category Filter */}
        <div className="mb-6 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                filter === cat
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Exam Grid */}
        {loading ? (
          <div className="py-20 text-center text-slate-400">Loading exams...</div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((exam) => {
              const info = EXAM_INFO[exam.code];
              const Icon = info?.icon || FileText;
              const categoryColor = CATEGORY_COLORS[exam.category] || "bg-slate-50 text-slate-700 ring-slate-200";
              const hasQuestions = exam.available && exam.questionCount > 0;

              return (
                <Card key={exam.id} className={`flex flex-col overflow-hidden transition hover:shadow-lg ${!hasQuestions ? "opacity-60" : ""}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                          <Icon className="h-5 w-5 text-slate-600" />
                        </div>
                        <div>
                          <h3 className="font-bold leading-tight text-slate-900">{exam.name}</h3>
                          <span className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${categoryColor}`}>
                            {exam.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-3">
                    {/* Exam details */}
                    <div className="space-y-1.5 text-xs text-slate-600">
                      {info?.format && (
                        <div className="flex items-start gap-1.5">
                          <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                          <span>{info.format}</span>
                        </div>
                      )}
                      {info?.sections?.length ? (
                        <div className="flex items-start gap-1.5">
                          <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                          <span>{info.sections.join(" · ")}</span>
                        </div>
                      ) : null}
                      {info?.scoring && <Badge variant="outline" className="text-[10px]">{info.scoring}</Badge>}
                      {info?.note && <p className="leading-5 text-slate-500">{info.note}</p>}
                      {info?.sourceUrl ? (
                        <a href={info.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-8 items-center font-medium text-blue-700 underline underline-offset-2">
                          Official information <ArrowRight className="ml-1 h-3 w-3" aria-hidden="true" />
                        </a>
                      ) : (
                        <p className="leading-5 text-amber-700">Current official format source not verified in this catalog.</p>
                      )}
                    </div>

                    {/* Question count */}
                    <div className="flex items-center gap-2 text-xs">
                      {hasQuestions ? (
                        <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                          {exam.questionCount} active questions · depth not verified
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-amber-600">No active questions</Badge>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-auto flex gap-2 pt-2">
                      {hasQuestions && (
                        <a
                          href={`/practice-test?examType=${exam.code}`}
                          className="flex-1 rounded-md bg-blue-500 px-3 py-2 text-center text-xs font-semibold text-white transition hover:bg-blue-600"
                        >
                          Start Practice
                        </a>
                      )}
                      <a
                        href={`/ask-handbook?category=${exam.code}`}
                        className="flex items-center justify-center gap-1 rounded-md border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                      >
                        <BookOpen className="h-3.5 w-3.5" /> Guide
                      </a>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Study Materials Section */}
        <div className="mt-12">
          <h2 className="mb-4 text-xl font-bold text-slate-900">Study Materials</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {materials.map((mat) => (
              <Card key={mat.id} className="hover:shadow-md transition">
                <CardContent className="pt-5">
                  <div className="mb-2 flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-blue-500" />
                    <Badge variant="outline" className="text-[10px]">{mat.category}</Badge>
                  </div>
                  <h3 className="mb-1 font-semibold text-slate-900">{mat.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2">{mat.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
