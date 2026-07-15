"use client";

import { useState, useRef, useEffect } from "react";
import {
  BookOpen, Send, Award, Brain, Calculator, Atom, Code, Cpu, Globe2,
  History, Map, Trophy, Sparkles, CheckCircle2, XCircle, User, Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { ModuleId } from "./module-registry";

type Nav = { navigate: (id: ModuleId) => void };

const SUBJECTS = [
  { name: "English", icon: BookOpen, color: "#6366F1", progress: 78 },
  { name: "Math", icon: Calculator, color: "#E8501A", progress: 64 },
  { name: "Science", icon: Atom, color: "#16A34A", progress: 91 },
  { name: "Programming", icon: Code, color: "#0EA5E9", progress: 52 },
  { name: "AI", icon: Cpu, color: "#8B5CF6", progress: 43 },
  { name: "Robotics", icon: Cpu, color: "#EF4444", progress: 28 },
  { name: "History", icon: History, color: "#F59E0B", progress: 70 },
  { name: "Geography", icon: Globe2, color: "#06B6D4", progress: 60 },
];

const QUIZZES = [
  {
    q: "Which sentence is grammatically correct?",
    options: ["She don't like coffee", "She doesn't likes coffee", "She doesn't like coffee", "She not like coffee"],
    answer: 2,
    subject: "English",
  },
  {
    q: "What is 7 × 8?",
    options: ["54", "56", "64", "58"],
    answer: 1,
    subject: "Math",
  },
  {
    q: "What is the chemical symbol for gold?",
    options: ["Go", "Gd", "Au", "Ag"],
    answer: 2,
    subject: "Science",
  },
  {
    q: "Which keyword defines a function in Python?",
    options: ["function", "def", "fn", "func"],
    answer: 1,
    subject: "Programming",
  },
];

const TUTOR_REPLIES = [
  "Great question! Let me break this down step by step. First, identify what the problem is asking...",
  "Excellent — you're on the right track. The key concept here is that energy is always conserved. So if we apply the law of conservation of energy...",
  "Perfect! Think of it like building blocks. Each concept stacks on the previous one. Let's revisit the foundation first...",
  "I love your curiosity! This connects to a fascinating real-world application. Imagine a self-driving car using exactly this principle...",
];

export default function Education({ navigate }: Nav) {
  const [activeSubject, setActiveSubject] = useState(SUBJECTS[0]);
  const [messages, setMessages] = useState<{ role: "user" | "tutor"; text: string }[]>([
    { role: "tutor", text: "Hi! I'm your AI Tutor. Ask me anything about English, Math, Science, Programming, and more." },
  ]);
  const [input, setInput] = useState("");
  const [quizIdx, setQuizIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<number[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const reply = TUTOR_REPLIES[Math.floor(Math.random() * TUTOR_REPLIES.length)];
    setMessages((m) => [...m, { role: "user", text: input }, { role: "tutor", text: reply }]);
    setInput("");
  };

  const currentQuiz = QUIZZES[quizIdx];
  const selectAnswer = (i: number) => {
    if (answered.includes(quizIdx)) return;
    setSelectedAnswer(i);
    setAnswered((a) => [...a, quizIdx]);
    if (i === currentQuiz.answer) setScore((s) => s + 1);
  };

  const nextQuiz = () => {
    setQuizIdx((i) => (i + 1) % QUIZZES.length);
    setSelectedAnswer(null);
  };

  return (
    <div className="min-h-screen bg-[#0F172A] p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-[#16A34A]">
            <BookOpen className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">AI Education Center</h1>
            <p className="text-white/60">Tutors, quizzes, progress tracking & certificates</p>
          </div>
        </div>

        {/* Subjects */}
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/60">Subjects</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {SUBJECTS.map((s) => {
              const Icon = s.icon;
              const active = activeSubject.name === s.name;
              return (
                <button
                  key={s.name}
                  onClick={() => setActiveSubject(s)}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition ${
                    active ? "border-white/30 bg-white/10" : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <Icon className="size-6" style={{ color: s.color }} />
                  <span className="text-xs font-medium">{s.name}</span>
                  <Progress value={s.progress} className="h-1" />
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Tutor chat */}
          <Card className="border-white/10 bg-white/5 text-white lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="size-5" style={{ color: "#6366F1" }} />
                AI Tutor — {activeSubject.name}
              </CardTitle>
              <CardDescription className="text-white/60">Ask anything. Get explanations, examples & practice problems.</CardDescription>
            </CardHeader>
            <CardContent>
              <div ref={scrollRef} className="mb-3 h-80 space-y-3 overflow-y-auto rounded-lg border border-white/10 bg-[#0F172A] p-4">
                {messages.map((m, i) => (
                  <div key={i} className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                    <div
                      className="flex size-8 items-center justify-center rounded-full text-xs font-bold"
                      style={{ background: m.role === "user" ? "#E8501A" : "#6366F1" }}
                    >
                      {m.role === "user" ? <User className="size-4" /> : <Bot className="size-4" />}
                    </div>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${m.role === "user" ? "bg-[#E8501A] text-white" : "bg-white/10 text-white"}`}>
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  className="border-white/10 bg-white/5"
                  placeholder={`Ask about ${activeSubject.name}...`}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                />
                <Button className="bg-[#6366F1] hover:bg-[#6366F1]/90" onClick={sendMessage}><Send /></Button>
              </div>
            </CardContent>
          </Card>

          {/* Quiz Generator */}
          <Card className="border-white/10 bg-white/5 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Brain className="size-5" style={{ color: "#E8501A" }} /> Quiz Generator</CardTitle>
              <CardDescription className="text-white/60">Score: {score}/{QUIZZES.length}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Badge variant="outline" className="border-white/20 text-white/70">{currentQuiz.subject}</Badge>
              <p className="font-medium">{currentQuiz.q}</p>
              <div className="space-y-2">
                {currentQuiz.options.map((opt, i) => {
                  const isSelected = selectedAnswer === i;
                  const isCorrect = i === currentQuiz.answer;
                  const showResult = answered.includes(quizIdx);
                  return (
                    <button
                      key={i}
                      onClick={() => selectAnswer(i)}
                      className={`flex w-full items-center justify-between rounded-lg border p-2.5 text-sm transition ${
                        showResult && isCorrect
                          ? "border-[#16A34A] bg-[#16A34A]/15"
                          : showResult && isSelected && !isCorrect
                          ? "border-[#EF4444] bg-[#EF4444]/15"
                          : "border-white/10 bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      <span>{opt}</span>
                      {showResult && isCorrect && <CheckCircle2 className="size-4 text-[#16A34A]" />}
                      {showResult && isSelected && !isCorrect && <XCircle className="size-4 text-[#EF4444]" />}
                    </button>
                  );
                })}
              </div>
              <Button variant="outline" className="w-full border-white/20 bg-transparent text-white hover:bg-white/10" onClick={nextQuiz}>
                Next Question
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Progress */}
          <Card className="border-white/10 bg-white/5 text-white lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Trophy className="size-5" style={{ color: "#F59E0B" }} /> Learning Progress</CardTitle>
              <CardDescription className="text-white/60">Track mastery across subjects</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {SUBJECTS.map((s) => (
                <div key={s.name}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <s.icon className="size-4" style={{ color: s.color }} />
                      {s.name}
                    </span>
                    <span className="text-white/60">{s.progress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full" style={{ width: `${s.progress}%`, background: s.color }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Certificate */}
          <Card className="border-white/10 bg-white/5 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Award className="size-5" style={{ color: "#6366F1" }} /> Certificate Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border-2 border-[#6366F1]/40 bg-gradient-to-br from-[#6366F1]/10 to-[#E8501A]/10 p-6 text-center">
                <Award className="mx-auto mb-2 size-12" style={{ color: "#E8501A" }} />
                <p className="text-xs uppercase tracking-widest text-white/50">Certificate of Completion</p>
                <h3 className="mt-2 text-lg font-bold">{activeSubject.name} Mastery</h3>
                <p className="mt-1 text-xs text-white/60">Awarded to</p>
                <p className="font-semibold">Student Name</p>
                <div className="mt-3 flex items-center justify-center gap-1 text-xs text-white/60">
                  <Sparkles className="size-3" /> ALO Labs · {new Date().getFullYear()}
                </div>
              </div>
              <Button className="mt-3 w-full bg-[#E8501A] hover:bg-[#E8501A]/90">Download Certificate</Button>
            </CardContent>
          </Card>
        </div>

        <div className="rounded-xl border border-white/10 bg-gradient-to-r from-[#16A34A]/10 to-[#6366F1]/10 p-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="font-semibold">Want a full structured course?</h3>
              <p className="text-sm text-white/60">Auto-generate a complete curriculum in minutes.</p>
            </div>
            <Button variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10" onClick={() => navigate("courses")}>
              Open Course Builder
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
