"use client";

/**
 * src/app/exam-prep/page.tsx
 *
 * Exam Preparation Center — shows all 20 exam types with:
 *   - Real exam format details
 *   - Number of practice questions available
 *   - Links to start practice tests
 *   - Links to AI handbook for each exam
 *   - Study tips and materials
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock, FileText, Mic, PenLine, Headphones, ArrowRight, Sparkles } from "lucide-react";

type ExamType = {
  id: string;
  code: string;
  name: string;
  category: string;
  questionCount: number;
  practiceSetCount: number;
};

type StudyMaterial = {
  id: string;
  title: string;
  description: string | null;
  category: string;
};

const EXAM_INFO: Record<string, {
  duration: string;
  sections: string[];
  scoring: string;
  tips: string[];
  icon: typeof BookOpen;
}> = {
  "IELTS-A": {
    duration: "2h 44m",
    sections: ["Listening", "Reading", "Writing", "Speaking"],
    scoring: "0-9 band",
    tips: ["Read questions before listening", "Skim reading passages first", "Use formal language in writing", "Elaborate in speaking"],
    icon: Headphones,
  },
  "IELTS-G": {
    duration: "2h 44m",
    sections: ["Listening", "Reading", "Writing (Letter + Essay)", "Speaking"],
    scoring: "0-9 band",
    tips: ["Include all bullet points in letter", "Use appropriate tone", "General topics for Task 2"],
    icon: PenLine,
  },
  "IELTS-UKVI": {
    duration: "1h (Life Skills)",
    sections: ["Speaking", "Listening"],
    scoring: "Pass/Fail",
    tips: ["16-18 min assessment", "Speaking with examiner + 1 candidate", "A1/A2/B1 levels"],
    icon: Mic,
  },
  "TOEFL-iBT": {
    duration: "3 hours",
    sections: ["Reading", "Listening", "Speaking", "Writing"],
    scoring: "0-120",
    tips: ["Take notes during listening", "Use transition words in speaking", "Focus on lecture vs reading contrast in integrated writing"],
    icon: Headphones,
  },
  "PTE-A": {
    duration: "2 hours",
    sections: ["Speaking & Writing", "Reading", "Listening"],
    scoring: "10-90",
    tips: ["Fully machine-scored — speak clearly", "Use templates for describe image", "Type exactly for write from dictation"],
    icon: Mic,
  },
  "DUOLINGO": {
    duration: "1 hour",
    sections: ["Literacy", "Comprehension", "Conversation", "Production"],
    scoring: "10-160",
    tips: ["Adaptive test — difficulty changes", "Quiet room with good lighting", "Don't look away from screen", "Write at least 50 words"],
    icon: Sparkles,
  },
  "OET": {
    duration: "2h 50m",
    sections: ["Listening", "Reading", "Writing", "Speaking"],
    scoring: "A-E (Grade B = 350+)",
    tips: ["Healthcare-specific scenarios", "Write referral/discharge letters", "Speaking role-plays with interlocutor", "Use medical terminology"],
    icon: BookOpen,
  },
  "LANGUAGECERT": {
    duration: "2h 30m",
    sections: ["Reading", "Writing", "Listening", "Speaking"],
    scoring: "A1-C2 (CEFR)",
    tips: ["Similar to IELTS format", "CEFR-aligned scoring", "Computer-based or paper-based"],
    icon: FileText,
  },
  "LINGUASKILL": {
    duration: "1h 30m",
    sections: ["Reading", "Listening", "Writing", "Speaking"],
    scoring: "A1-C2 (CEFR)",
    tips: ["Adaptive test", "Results within 48 hours", "Business or General English versions"],
    icon: Sparkles,
  },
  "OIETC": {
    duration: "2 hours",
    sections: ["Reading", "Writing", "Listening", "Speaking"],
    scoring: "B1-C1 (CEFR)",
    tips: ["Online proctored", "Accepted by UK universities", "Similar to IELTS Academic"],
    icon: FileText,
  },
  "TOEIC": {
    duration: "2 hours",
    sections: ["Listening", "Reading"],
    scoring: "10-990",
    tips: ["Business English focus", "Time management is critical", "Learn business vocabulary", "Don't spend >30 sec on Part 5"],
    icon: Headphones,
  },
  "CAMBRIDGE": {
    duration: "3h 30m",
    sections: ["Reading & Use of English", "Writing", "Listening", "Speaking"],
    scoring: "140-210 (B2 First)",
    tips: ["Learn collocations and phrasal verbs", "Plan before writing", "Use speculative language in speaking"],
    icon: BookOpen,
  },
  "GRE": {
    duration: "3h 45m",
    sections: ["Analytical Writing", "Verbal Reasoning", "Quantitative Reasoning"],
    scoring: "260-340",
    tips: ["Practice timed essays", "Build vocabulary for sentence equivalence", "Review math fundamentals"],
    icon: PenLine,
  },
  "GMAT": {
    duration: "2h 15m (Focus)",
    sections: ["Quantitative", "Verbal", "Data Insights"],
    scoring: "205-805",
    tips: ["Data Sufficiency strategy", "Critical Reasoning logic", "Time management is key"],
    icon: FileText,
  },
  "SAT": {
    duration: "2h 14m (Digital)",
    sections: ["Reading & Writing", "Math"],
    scoring: "400-1600",
    tips: ["Digital adaptive format", "Calculator allowed for math", "Shorter passages with 1 question each"],
    icon: FileText,
  },
  "ACT": {
    duration: "2h 55m",
    sections: ["English", "Math", "Reading", "Science"],
    scoring: "1-36",
    tips: ["Science section tests reasoning, not facts", "Pace yourself — 36 sec per English question", "Read questions before science passages"],
    icon: BookOpen,
  },
  "LSAT": {
    duration: "3h 30m",
    sections: ["Reading Comprehension", "Logical Reasoning", "Writing Sample"],
    scoring: "120-180",
    tips: ["Practice logical fallacies", "Identify argument structure", "Writing sample is unscored but required"],
    icon: PenLine,
  },
  "MCAT": {
    duration: "7h 30m (with breaks)",
    sections: ["Chemical & Physical", "Critical Analysis", "Biological & Biochemical", "Psychological & Social"],
    scoring: "472-528",
    tips: ["Content-heavy — start prep 3-6 months early", "Practice CARS daily", "Review AAMC official materials"],
    icon: BookOpen,
  },
  "VISA-INTERVIEW": {
    duration: "5-10 min interview",
    sections: ["Speaking", "Writing (SOP)"],
    scoring: "Pass/Fail",
    tips: ["Show strong ties to home country", "Be confident and honest", "Have documents organized", "Dress professionally"],
    icon: Mic,
  },
  "ALO-PLACEMENT": {
    duration: "1h 15m",
    sections: ["Grammar", "Vocabulary", "Reading", "Listening", "Writing"],
    scoring: "CEFR A1-C2",
    tips: ["Internal placement test", "Determines your English level", "Used for course placement"],
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
            Real exam-aligned practice for 20 exam types. Study materials, practice tests, and AI-powered handbook for every exam.
          </p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-blue-600">{examTypes.length}</p>
              <p className="text-xs text-slate-500">Exam Types</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-purple-600">{examTypes.reduce((s, e) => s + e.questionCount, 0)}</p>
              <p className="text-xs text-slate-500">Practice Questions</p>
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
              <p className="text-3xl font-bold text-amber-600">24/7</p>
              <p className="text-xs text-slate-500">AI Handbook</p>
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
              <h3 className="text-lg font-bold text-slate-900">AI Study Handbook — Free, No Sign-Up</h3>
              <p className="text-sm text-slate-600">
                Ask any question about any exam format, scoring, tips, or preparation strategy. Get instant AI answers grounded in official study materials.
              </p>
            </div>
            <a
              href="/ask-handbook"
              className="shrink-0 rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-blue-600"
            >
              Ask AI Handbook →
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
              const hasQuestions = exam.questionCount > 0;

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
                    {info && (
                      <div className="space-y-1.5 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <span>{info.duration}</span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                          <span>{info.sections.join(" · ")}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[10px]">{info.scoring}</Badge>
                        </div>
                      </div>
                    )}

                    {/* Question count */}
                    <div className="flex items-center gap-2 text-xs">
                      {hasQuestions ? (
                        <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                          {exam.questionCount} questions
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-amber-600">Coming soon</Badge>
                      )}
                    </div>

                    {/* Tips */}
                    {info && info.tips.length > 0 && (
                      <div className="rounded-md bg-slate-50 p-2.5">
                        <p className="mb-1 text-[10px] font-semibold uppercase text-slate-500">Study Tips</p>
                        <ul className="space-y-0.5 text-xs text-slate-600">
                          {info.tips.slice(0, 3).map((tip, i) => (
                            <li key={i} className="flex gap-1">
                              <span className="text-blue-500">•</span> {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

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
