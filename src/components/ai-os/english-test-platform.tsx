"use client";

import { useState } from "react";
import {
  GraduationCap, BookOpen, Clock, Award, Users, FileText, Play,
  ChevronRight, Check, X, Send, Download, ShieldCheck, Search,
  BarChart3, Settings, Mic, PenLine, Headphones, Star, Sparkles,
  ArrowLeft, Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// =====================================================
// ENGLISH TEST PLATFORM — NO AI BRANDING
// Looks like a standard English exam system
// Powered by AI OS behind the scenes (invisible to users)
// =====================================================

type View = "dashboard" | "exams" | "mock-test" | "results" | "students" | "questions" | "settings";

const EXAMS = [
  { id: "ielts", name: "IELTS Academic", sections: ["Listening", "Reading", "Writing", "Speaking"], duration: "2h 44m", scale: "Band 0–9", badge: "Popular", questions: 41 },
  { id: "ielts-ukvi", name: "IELTS UKVI", sections: ["Listening", "Reading", "Writing", "Speaking"], duration: "2h 44m", scale: "Band 0–9", badge: "UK Visa", questions: 15 },
  { id: "pte", name: "PTE Academic", sections: ["Speaking & Writing", "Reading", "Listening"], duration: "2h 00m", scale: "10–90", badge: "Fast", questions: 35 },
  { id: "toefl", name: "TOEFL iBT", sections: ["Reading", "Listening", "Speaking", "Writing"], duration: "2h 00m", scale: "0–120", badge: "USA", questions: 33 },
  { id: "duolingo", name: "Duolingo English Test", sections: ["Literacy", "Comprehension", "Conversation", "Production"], duration: "1h 00m", scale: "10–160", badge: "Adaptive", questions: 21 },
  { id: "oietc", name: "OIETC / Oxford ELLT", sections: ["Listening", "Reading", "Writing", "Speaking"], duration: "1h 30m", scale: "CEFR A2–C1", badge: "UK Entry", questions: 20 },
  { id: "oet", name: "OET (Healthcare)", sections: ["Listening", "Reading", "Writing", "Speaking"], duration: "2h 50m", scale: "A–E grades", badge: "Medical", questions: 25 },
  { id: "sat", name: "Digital SAT", sections: ["Reading & Writing", "Math Module 1", "Math Module 2"], duration: "2h 14m", scale: "400–1600", badge: "USA", questions: 28 },
  { id: "gre", name: "GRE General", sections: ["Verbal", "Quantitative", "Analytical Writing"], duration: "1h 58m", scale: "260–340", badge: "Graduate", questions: 28 },
  { id: "gmat", name: "GMAT Focus", sections: ["Quantitative", "Verbal", "Data Insights"], duration: "2h 15m", scale: "205–805", badge: "Business", questions: 21 },
];

const SAMPLE_QUESTIONS = [
  {
    id: 1, type: "Multiple Choice · Reading",
    passage: "The rise of remote work has reshaped urban economies. City-centre retail has declined while suburban co-working spaces have surged.",
    prompt: "According to the passage, what is one consequence of remote work?",
    options: ["Increased city-centre revenue", "Higher demand for suburban co-working", "Reduced suburban investment", "More daily commuting"],
    correct: 1,
    explanation: "The passage states suburban co-working demand has surged.",
  },
  {
    id: 2, type: "True / False / Not Given",
    passage: "Coral reefs support 25% of marine species despite covering less than 1% of the ocean floor.",
    prompt: "Statement: Coral reefs cover more than 1% of the ocean floor.",
    options: ["True", "False", "Not Given"],
    correct: 1,
    explanation: "Passage says 'less than 1%', so the statement is False.",
  },
  {
    id: 3, type: "Fill in the Blanks",
    prompt: "The lecturer emphasized that sustainable development requires balancing economic growth with ______ protection.",
    options: ["environmental", "political", "commercial", "industrial"],
    correct: 0,
    explanation: "'Sustainable development' pairs with 'environmental protection'.",
  },
  {
    id: 4, type: "Multiple Choice · Grammar",
    prompt: "Choose the grammatically correct sentence:",
    options: ["The data shows that students are increasing.", "The data show that the number of students is increasing.", "The data shows that students were increasing.", "The data show that students are increasing."],
    correct: 1,
    explanation: "'Data' (plural) takes 'show'; 'the number of' takes singular 'is'.",
  },
  {
    id: 5, type: "Multiple Choice · Reading",
    passage: "Urban green spaces have been shown to reduce cortisol levels in city residents. A minimum of 20 minutes per week in green environments can yield measurable health benefits.",
    prompt: "What is the minimum weekly exposure to greenery linked to reduced cortisol?",
    options: ["5 minutes", "10 minutes", "20 minutes", "60 minutes"],
    correct: 2,
    explanation: "Passage states 'minimum of 20 minutes per week'.",
  },
];

const RECENT_RESULTS = [
  { id: "ATT-001", student: "Tania Islam", exam: "IELTS Academic", date: "Jan 8", overall: "7.5", listening: 8, reading: 7, writing: 7, speaking: 7.5, cefr: "C1", status: "completed" },
  { id: "ATT-002", student: "Arif Rahman", exam: "PTE Academic", date: "Jan 7", overall: "79", listening: 75, reading: 70, writing: 68, speaking: 74, cefr: "C1", status: "completed" },
  { id: "ATT-003", student: "Nadia Khan", exam: "Duolingo", date: "Jan 5", overall: "135", listening: 125, reading: 118, writing: 115, speaking: 122, cefr: "C1", status: "completed" },
  { id: "ATT-004", student: "Rakib Hasan", exam: "TOEFL iBT", date: "Jan 3", overall: "104", listening: 28, reading: 27, writing: 25, speaking: 24, cefr: "C1", status: "completed" },
];

const STUDENTS = [
  { id: "AE-2026000001", name: "Tania Islam", email: "tania.i@alo.edu", phone: "+880171***", exam: "IELTS", mocks: 5, best: "7.5", status: "active" },
  { id: "AE-2026000002", name: "Arif Rahman", email: "arif.r@alo.edu", phone: "+880181***", exam: "PTE", mocks: 3, best: "79", status: "active" },
  { id: "AE-2026000003", name: "Nadia Khan", email: "nadia.k@alo.edu", phone: "+880191***", exam: "Duolingo", mocks: 2, best: "135", status: "active" },
  { id: "AE-2026000004", name: "Rakib Hasan", email: "rakib.h@alo.edu", phone: "+880161***", exam: "TOEFL", mocks: 4, best: "104", status: "active" },
];

const DISCLAIMER = "This is a practice test. Scores are estimates. Not an official exam result. No guarantee that questions will appear in real exam.";

export default function EnglishTestPlatform({ navigate }: { navigate: (id: any) => void }) {
  const [view, setView] = useState<View>("dashboard");
  const [selectedExam, setSelectedExam] = useState<string | null>(null);

  const nav = [
    { id: "dashboard" as View, label: "Dashboard", icon: BarChart3 },
    { id: "exams" as View, label: "Exam Types", icon: BookOpen },
    { id: "mock-test" as View, label: "Mock Test Engine", icon: Play },
    { id: "results" as View, label: "Results", icon: Award },
    { id: "students" as View, label: "Students", icon: Users },
    { id: "questions" as View, label: "Question Bank", icon: FileText },
    { id: "settings" as View, label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-r border-slate-200 bg-white sticky top-0 h-screen overflow-y-auto">
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#0057B8] text-white">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-extrabold text-[#0B1F3A]">ALO English</div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400">Test Platform</div>
            </div>
          </div>
        </div>
        <nav className="p-3 space-y-1">
          {nav.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => { setView(item.id); setSelectedExam(null); }}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                  view === item.id ? "bg-[#0057B8] text-white" : "text-slate-600 hover:bg-slate-50"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="p-3 border-t border-slate-100 mt-auto">
          <button onClick={() => navigate("home")} className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-600">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Platform
          </button>
          {/* Discreet staff access — looks like a copyright/version link, not a login button */}
          <button
            onClick={() => {
              // Trigger the login flow by dispatching a custom event
              window.dispatchEvent(new CustomEvent("staff-login"));
            }}
            className="mt-2 block text-[10px] text-slate-300 hover:text-slate-500"
          >
            v1.0.0 · System Status
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        <div className="p-6 lg:p-8 max-w-6xl mx-auto">
          {view === "dashboard" && <Dashboard />}
          {view === "exams" && <ExamCatalog onSelect={(id) => { setSelectedExam(id); setView("mock-test"); }} />}
          {view === "mock-test" && <MockTestEngine examId={selectedExam} />}
          {view === "results" && <Results />}
          {view === "students" && <Students />}
          {view === "questions" && <QuestionBank />}
          {view === "settings" && <SettingsView />}
        </div>
      </div>
    </div>
  );
}

// ============ DASHBOARD ============
function Dashboard() {
  const kpis = [
    { l: "Total Students", v: "1,924", c: "#0057B8" },
    { l: "Mock Tests Taken", v: "8,412", c: "#E8501A" },
    { l: "Writing Submissions", v: "3,206", c: "#0057B8" },
    { l: "Avg Score", v: "7.0", c: "#E8501A" },
  ];
  return (
    <div>
      <h1 className="text-2xl font-extrabold text-[#0B1F3A]">Dashboard</h1>
      <p className="text-sm text-slate-500 mt-1">English test platform overview</p>
      <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <div key={k.l} className="rounded-2xl border border-[#D9E8FF] bg-white p-5 shadow-sm">
            <div className="text-3xl font-extrabold" style={{ color: k.c }}>{k.v}</div>
            <div className="text-xs text-slate-500 mt-1">{k.l}</div>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-2xl border border-[#D9E8FF] bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-[#0B1F3A] mb-3">Recent Mock Test Results</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-400 border-b border-slate-200">
                <th className="py-2 font-semibold">Student</th>
                <th className="py-2 font-semibold">Exam</th>
                <th className="py-2 font-semibold">Score</th>
                <th className="py-2 font-semibold">CEFR</th>
                <th className="py-2 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody>
              {RECENT_RESULTS.map(r => (
                <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-2.5 font-medium text-[#0B1F3A]">{r.student}</td>
                  <td className="py-2.5 text-slate-600">{r.exam}</td>
                  <td className="py-2.5 font-bold text-[#E8501A]">{r.overall}</td>
                  <td className="py-2.5"><span className="rounded-md bg-[#EEF6FF] px-2 py-0.5 text-xs font-bold text-[#0057B8]">{r.cefr}</span></td>
                  <td className="py-2.5 text-slate-500 text-xs">{r.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
        <p className="text-xs text-amber-800">{DISCLAIMER}</p>
      </div>
    </div>
  );
}

// ============ EXAM CATALOG ============
function ExamCatalog({ onSelect }: { onSelect: (id: string) => void }) {
  const [search, setSearch] = useState("");
  const filtered = EXAMS.filter(e => e.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <div>
      <h1 className="text-2xl font-extrabold text-[#0B1F3A]">Exam Types</h1>
      <p className="text-sm text-slate-500 mt-1">Select an exam to start a practice test</p>
      <div className="mt-4 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search exams..." className="pl-9 h-10 rounded-xl" />
      </div>
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(exam => (
          <div key={exam.id} onClick={() => onSelect(exam.id)} className="cursor-pointer rounded-2xl border border-[#D9E8FF] bg-white p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all">
            <div className="flex items-start justify-between">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#0057B8] text-white">
                <GraduationCap className="h-5 w-5" />
              </div>
              <span className="rounded-full bg-[#EEF6FF] px-2 py-0.5 text-[10px] font-bold text-[#0057B8]">{exam.badge}</span>
            </div>
            <h3 className="mt-3 text-base font-bold text-[#0B1F3A]">{exam.name}</h3>
            <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{exam.duration}</span>
              <span className="flex items-center gap-1"><Award className="h-3.5 w-3.5" />{exam.scale}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1">
              {exam.sections.map(s => <span key={s} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">{s}</span>)}
            </div>
            <Button className="mt-4 w-full h-9 rounded-xl bg-[#0057B8] text-white text-xs hover:bg-[#004a9e]">
              Start Practice <ChevronRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ MOCK TEST ENGINE ============
function MockTestEngine({ examId }: { examId: string | null }) {
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    const correct = SAMPLE_QUESTIONS.filter(q => answers[q.id] === q.correct).length;
    const pct = Math.round((correct / SAMPLE_QUESTIONS.length) * 100);
    const band = pct >= 80 ? "7.5" : pct >= 60 ? "6.5" : pct >= 40 ? "5.5" : "5.0";
    const cefr = pct >= 80 ? "C1" : pct >= 60 ? "B2" : "B1";
    return (
      <div>
        <div className="rounded-2xl border border-[#D9E8FF] bg-white p-8 shadow-sm text-center">
          <div className="grid h-16 w-16 mx-auto place-items-center rounded-2xl bg-[#FFF7ED]">
            <Award className="h-8 w-8 text-[#E8501A]" />
          </div>
          <h2 className="mt-4 text-2xl font-extrabold text-[#0B1F3A]">Score Report</h2>
          <p className="text-xs text-slate-500">Practice estimate · Not an official score</p>
          <div className="mt-6 grid grid-cols-4 gap-3 max-w-lg mx-auto">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="text-2xl font-extrabold text-[#0B1F3A]">{correct}/{SAMPLE_QUESTIONS.length}</div><div className="text-xs text-slate-500">Correct</div></div>
            <div className="rounded-xl border border-[#0057B8]/20 bg-[#EEF6FF] p-4"><div className="text-2xl font-extrabold text-[#0057B8]">{pct}%</div><div className="text-xs text-slate-500">Accuracy</div></div>
            <div className="rounded-xl border border-[#E8501A]/20 bg-[#FFF7ED] p-4"><div className="text-2xl font-extrabold text-[#E8501A]">~{band}</div><div className="text-xs text-slate-500">Band est.</div></div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"><div className="text-2xl font-extrabold text-emerald-600">{cefr}</div><div className="text-xs text-slate-500">CEFR</div></div>
          </div>
          <div className="mt-6 text-left max-w-lg mx-auto space-y-2 max-h-60 overflow-y-auto">
            {SAMPLE_QUESTIONS.map((q, i) => {
              const userAns = answers[q.id];
              const isCorrect = userAns === q.correct;
              return (
                <div key={q.id} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400">Q{i+1} · {q.type}</span>
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", isCorrect ? "bg-emerald-50 text-emerald-600" : userAns === undefined ? "bg-slate-100 text-slate-500" : "bg-red-50 text-red-600")}>
                      {isCorrect ? "Correct" : userAns === undefined ? "Skipped" : "Incorrect"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[#0B1F3A]">{q.prompt}</p>
                  <p className="mt-1 text-[11px] text-slate-500"><span className="font-semibold text-[#0057B8]">Explanation:</span> {q.explanation}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 max-w-lg mx-auto">
            <p className="text-[11px] text-amber-800">{DISCLAIMER}</p>
          </div>
          <Button onClick={() => { setStarted(false); setSubmitted(false); setAnswers({}); setCurrent(0); }} className="mt-5 h-11 rounded-xl bg-[#E8501A] text-white hover:bg-[#cc3f10]">
            Take Another Test
          </Button>
        </div>
      </div>
    );
  }

  if (!started) {
    const exam = EXAMS.find(e => e.id === examId) || EXAMS[0];
    return (
      <div className="rounded-2xl border border-[#D9E8FF] bg-white p-8 shadow-sm text-center">
        <div className="grid h-16 w-16 mx-auto place-items-center rounded-2xl bg-[#EEF6FF]">
          <Play className="h-8 w-8 text-[#0057B8]" />
        </div>
        <h2 className="mt-4 text-xl font-extrabold text-[#0B1F3A]">{exam.name} Practice Test</h2>
        <p className="mt-2 text-sm text-slate-500">{SAMPLE_QUESTIONS.length} questions · ~{SAMPLE_QUESTIONS.length * 2} minutes</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {exam.sections.map(s => <span key={s} className="rounded-md bg-[#EEF6FF] px-2 py-1 text-xs font-semibold text-[#0057B8]">{s}</span>)}
        </div>
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 max-w-md mx-auto">
          <p className="text-xs text-amber-800">{DISCLAIMER}</p>
        </div>
        <Button onClick={() => setStarted(true)} className="mt-5 h-12 px-8 rounded-xl bg-[#E8501A] text-white hover:bg-[#cc3f10]">
          <Play className="mr-2 h-4 w-4" /> Start Test
        </Button>
      </div>
    );
  }

  const q = SAMPLE_QUESTIONS[current];
  const total = SAMPLE_QUESTIONS.length;
  const answered = Object.keys(answers).length;

  return (
    <div className="rounded-2xl border border-[#D9E8FF] bg-white shadow-sm overflow-hidden">
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <span className="rounded-md bg-[#EEF6FF] px-2 py-1 text-xs font-bold text-[#0057B8]">Practice · Q{current+1} of {total}</span>
        <div className="flex items-center gap-1.5 rounded-lg bg-[#EEF6FF] px-2.5 py-1.5 font-mono text-sm font-bold text-[#0057B8]">
          <Clock className="h-4 w-4" />{(total * 2 - answered * 2)}:00
        </div>
      </div>
      <Progress value={(answered / total) * 100} className="h-1 rounded-none" />
      <div className="p-6">
        {q.passage && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 mb-3">
            <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Passage</div>
            <p className="text-sm text-[#0B1F3A] leading-relaxed">{q.passage}</p>
          </div>
        )}
        <h3 className="text-base font-bold text-[#0B1F3A]">{q.prompt}</h3>
        <div className="mt-4 space-y-2">
          {q.options.map((opt, i) => {
            const sel = answers[q.id] === i;
            return (
              <button key={i} onClick={() => setAnswers({...answers, [q.id]: i})}
                className={cn("flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition-all", sel ? "border-[#0057B8] bg-[#EEF6FF]" : "border-slate-200 hover:border-[#0057B8]/40")}>
                <span className={cn("grid h-7 w-7 place-items-center rounded-full text-xs font-bold", sel ? "bg-[#0057B8] text-white" : "bg-slate-100 text-slate-500")}>{String.fromCharCode(65+i)}</span>
                <span className="text-sm font-medium text-[#0B1F3A]">{opt}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-5 flex items-center justify-between">
          <Button variant="outline" disabled={current === 0} onClick={() => setCurrent(c => Math.max(0, c-1))} className="h-10 rounded-xl border-slate-300">Previous</Button>
          {current < total - 1 ? (
            <Button onClick={() => setCurrent(c => Math.min(total-1, c+1))} className="h-10 rounded-xl bg-[#0057B8] text-white hover:bg-[#004a9e]">Next</Button>
          ) : (
            <Button onClick={() => setSubmitted(true)} className="h-10 rounded-xl bg-[#E8501A] text-white hover:bg-[#cc3f10]"><Send className="mr-1 h-4 w-4" />Submit</Button>
          )}
        </div>
      </div>
      <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex gap-1.5">
        {SAMPLE_QUESTIONS.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)}
            className={cn("grid h-7 w-7 place-items-center rounded-md text-[11px] font-bold border", i === current ? "border-[#0057B8] ring-2 ring-[#0057B8]/20" : "border-transparent", answers[SAMPLE_QUESTIONS[i].id] !== undefined ? "bg-[#0057B8] text-white" : "bg-white text-slate-500 border-slate-200")}>
            {i+1}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============ RESULTS ============
function Results() {
  return (
    <div>
      <h1 className="text-2xl font-extrabold text-[#0B1F3A]">Results</h1>
      <p className="text-sm text-slate-500 mt-1">All mock test results</p>
      <div className="mt-6 rounded-2xl border border-[#D9E8FF] bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-400 border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-2 font-semibold">Student</th>
                <th className="px-4 py-2 font-semibold">Exam</th>
                <th className="px-4 py-2 font-semibold">Overall</th>
                <th className="px-4 py-2 font-semibold">L/R/W/S</th>
                <th className="px-4 py-2 font-semibold">CEFR</th>
                <th className="px-4 py-2 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody>
              {RECENT_RESULTS.map(r => (
                <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-medium text-[#0B1F3A]">{r.student}</td>
                  <td className="px-4 py-2.5 text-slate-600">{r.exam}</td>
                  <td className="px-4 py-2.5 font-bold text-[#E8501A]">{r.overall}</td>
                  <td className="px-4 py-2.5 text-slate-500 text-xs">{r.listening}/{r.reading}/{r.writing}/{r.speaking}</td>
                  <td className="px-4 py-2.5"><span className="rounded-md bg-[#EEF6FF] px-2 py-0.5 text-xs font-bold text-[#0057B8]">{r.cefr}</span></td>
                  <td className="px-4 py-2.5 text-slate-500 text-xs">{r.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============ STUDENTS ============
function Students() {
  return (
    <div>
      <h1 className="text-2xl font-extrabold text-[#0B1F3A]">Students</h1>
      <p className="text-sm text-slate-500 mt-1">Registered students</p>
      <div className="mt-6 rounded-2xl border border-[#D9E8FF] bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-400 border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-2 font-semibold">Student ID</th>
                <th className="px-4 py-2 font-semibold">Name</th>
                <th className="px-4 py-2 font-semibold">Email</th>
                <th className="px-4 py-2 font-semibold">Exam</th>
                <th className="px-4 py-2 font-semibold">Mocks</th>
                <th className="px-4 py-2 font-semibold">Best</th>
                <th className="px-4 py-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {STUDENTS.map(s => (
                <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-mono text-xs text-[#0B1F3A]">{s.id}</td>
                  <td className="px-4 py-2.5 font-medium text-[#0B1F3A]">{s.name}</td>
                  <td className="px-4 py-2.5 text-slate-500 text-xs">{s.email}</td>
                  <td className="px-4 py-2.5 text-slate-600">{s.exam}</td>
                  <td className="px-4 py-2.5 text-slate-600">{s.mocks}</td>
                  <td className="px-4 py-2.5 font-bold text-[#E8501A]">{s.best}</td>
                  <td className="px-4 py-2.5"><span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">{s.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============ QUESTION BANK ============
function QuestionBank() {
  return (
    <div>
      <h1 className="text-2xl font-extrabold text-[#0B1F3A]">Question Bank</h1>
      <p className="text-sm text-slate-500 mt-1">Original practice questions</p>
      <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
        {EXAMS.slice(0, 8).map(e => (
          <div key={e.id} className="rounded-xl border border-[#D9E8FF] bg-white p-4 shadow-sm">
            <div className="text-sm font-bold text-[#0B1F3A]">{e.name}</div>
            <div className="text-2xl font-extrabold text-[#0057B8]">{e.questions}</div>
            <div className="text-xs text-slate-500">questions</div>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-2xl border border-[#D9E8FF] bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-[#0B1F3A] mb-3">Sample Questions ({SAMPLE_QUESTIONS.length})</h2>
        <div className="space-y-2">
          {SAMPLE_QUESTIONS.map((q, i) => (
            <div key={q.id} className="rounded-xl border border-slate-200 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Q{i+1} · {q.type}</span>
                <span className="text-xs text-slate-500">Correct: {String.fromCharCode(65 + q.correct)}</span>
              </div>
              <p className="mt-1 text-sm text-[#0B1F3A]">{q.prompt}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
        <p className="text-xs text-amber-800">All questions are original, exam-aligned practice content. No official exam questions are used.</p>
      </div>
    </div>
  );
}

// ============ SETTINGS ============
function SettingsView() {
  return (
    <div>
      <h1 className="text-2xl font-extrabold text-[#0B1F3A]">Settings</h1>
      <p className="text-sm text-slate-500 mt-1">Platform configuration</p>
      <div className="mt-6 space-y-4">
        <div className="rounded-2xl border border-[#D9E8FF] bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-[#0B1F3A]">Free Quota</h2>
          <div className="mt-3 grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">ALO Students (free mocks)</Label>
              <div className="mt-1 text-2xl font-extrabold text-[#0057B8]">3</div>
            </div>
            <div>
              <Label className="text-xs">Public Students (free mocks)</Label>
              <div className="mt-1 text-2xl font-extrabold text-[#E8501A]">1</div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-[#D9E8FF] bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-[#0B1F3A]">Scoring</h2>
          <p className="mt-1 text-xs text-slate-500">Scoring is automated. Scores are practice estimates only.</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs text-amber-800">{DISCLAIMER}</p>
        </div>
      </div>
    </div>
  );
}
