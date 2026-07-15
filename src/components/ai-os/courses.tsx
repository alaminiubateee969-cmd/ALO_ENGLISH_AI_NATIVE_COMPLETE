"use client";

import { useState } from "react";
import {
  BookOpen, Sparkles, ListTree, FileText, Presentation, Award,
  HelpCircle, Trash2, Clock, GraduationCap, PlayCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import type { ModuleId } from "./module-registry";

type Nav = { navigate: (id: ModuleId) => void };

const LEVELS = ["Beginner", "Intermediate", "Advanced"];
const DURATIONS = ["1 hour", "3 hours", "1 day", "1 week", "1 month", "3 months"];

type Course = {
  id: string;
  topic: string;
  level: string;
  duration: string;
  createdAt: string;
};

const INITIAL_COURSES: Course[] = [
  { id: "c1", topic: "Introduction to Python Programming", level: "Beginner", duration: "1 week", createdAt: "2 days ago" },
  { id: "c2", topic: "Machine Learning Fundamentals", level: "Intermediate", duration: "1 month", createdAt: "1 week ago" },
];

export default function Courses({ navigate }: Nav) {
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState(LEVELS[0]);
  const [duration, setDuration] = useState(DURATIONS[2]);
  const [courses, setCourses] = useState<Course[]>(INITIAL_COURSES);
  const [generated, setGenerated] = useState(false);
  const [generating, setGenerating] = useState(false);

  const generate = () => {
    if (!topic.trim()) return;
    setGenerating(true);
    setTimeout(() => {
      setGenerated(true);
      setGenerating(false);
      setCourses((prev) => [
        { id: `c${Date.now()}`, topic, level, duration, createdAt: "just now" },
        ...prev,
      ]);
    }, 1400);
  };

  const reset = () => {
    setGenerated(false);
    setTopic("");
  };

  const lessons = [
    { title: "Lesson 1: Foundations & Key Concepts", duration: "25 min", type: "Video" },
    { title: "Lesson 2: Core Principles Explained", duration: "30 min", type: "Reading" },
    { title: "Lesson 3: Hands-on Practice", duration: "45 min", type: "Lab" },
    { title: "Lesson 4: Real-world Applications", duration: "35 min", type: "Video" },
    { title: "Lesson 5: Common Mistakes & How to Avoid Them", duration: "20 min", type: "Reading" },
    { title: "Lesson 6: Mini Project", duration: "60 min", type: "Project" },
  ];

  const slides = Array.from({ length: 12 }, (_, i) => i + 1);
  const assignments = [
    "Assignment 1: Concept worksheet (10 questions)",
    "Assignment 2: Practical exercise with feedback",
    "Assignment 3: Build a small project applying the concepts",
  ];
  const quizzes = [
    "Quiz 1: Fundamentals check (5 questions, 10 min)",
    "Quiz 2: Mid-course assessment (10 questions, 20 min)",
    "Final Exam: Comprehensive (20 questions, 45 min)",
  ];

  return (
    <div className="min-h-screen bg-[#0F172A] p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-[#F59E0B]">
            <BookOpen className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">AI Course Builder</h1>
            <p className="text-white/60">From topic to full curriculum in seconds</p>
          </div>
        </div>

        {/* Input */}
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <CardTitle>Course Configuration</CardTitle>
            <CardDescription className="text-white/60">Define your course parameters</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2 md:col-span-3">
              <Label>Course Topic</Label>
              <Textarea
                className="border-white/10 bg-white/5"
                placeholder="e.g. Introduction to Machine Learning for High School Students"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Level</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger className="w-full border-white/10 bg-white/5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Duration</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className="w-full border-white/10 bg-white/5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DURATIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button className="w-full bg-[#F59E0B] hover:bg-[#F59E0B]/90" onClick={generate} disabled={generating || !topic.trim()}>
                <Sparkles /> {generating ? "Generating..." : "Generate Course"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Generated output */}
        {generated && (
          <div className="space-y-6">
            <div className="flex items-center justify-between rounded-xl border border-[#16A34A]/30 bg-[#16A34A]/10 p-4">
              <div className="flex items-center gap-3">
                <GraduationCap className="size-6 text-[#16A34A]" />
                <div>
                  <h3 className="font-semibold">{topic}</h3>
                  <p className="text-sm text-white/60">{level} · {duration} · 6 lessons · 12 slides · 3 quizzes</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="border-white/20 bg-transparent text-white hover:bg-white/10" onClick={reset}>
                Reset
              </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Outline */}
              <Card className="border-white/10 bg-white/5 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><ListTree className="size-5" style={{ color: "#6366F1" }} /> Course Outline</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-lg border border-white/10 bg-[#0F172A] p-4 text-sm text-white/80">
                    <p><strong>Module 1:</strong> Foundations of {topic}</p>
                    <p><strong>Module 2:</strong> Core concepts & terminology</p>
                    <p><strong>Module 3:</strong> Practical applications</p>
                    <p><strong>Module 4:</strong> Advanced techniques</p>
                    <p><strong>Module 5:</strong> Project & assessment</p>
                  </div>
                </CardContent>
              </Card>

              {/* Lessons */}
              <Card className="border-white/10 bg-white/5 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><PlayCircle className="size-5" style={{ color: "#E8501A" }} /> Lessons ({lessons.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {lessons.map((l, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
                      <div className="flex size-8 items-center justify-center rounded-full bg-[#E8501A]/20 text-xs font-bold text-[#E8501A]">
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{l.title}</p>
                        <div className="flex items-center gap-2 text-xs text-white/50">
                          <Clock className="size-3" /> {l.duration}
                        </div>
                      </div>
                      <Badge variant="outline" className="border-white/20 text-[10px]">{l.type}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Slides preview */}
              <Card className="border-white/10 bg-white/5 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Presentation className="size-5" style={{ color: "#3B82F6" }} /> Slides Preview ({slides.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {slides.map((s) => (
                      <div key={s} className="aspect-video rounded-md border border-white/10 bg-gradient-to-br from-[#6366F1]/30 to-[#E8501A]/20 p-2 text-[10px]">
                        <div className="font-semibold text-white/80">Slide {s}</div>
                        <div className="mt-1 h-1 w-3/4 rounded bg-white/30" />
                        <div className="mt-1 h-1 w-1/2 rounded bg-white/20" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Assignments & Quizzes */}
              <Card className="border-white/10 bg-white/5 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><FileText className="size-5" style={{ color: "#16A34A" }} /> Assignments & Quizzes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {assignments.map((a, i) => (
                    <div key={`a${i}`} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-2.5 text-sm">
                      <FileText className="size-4 text-[#16A34A]" />
                      <span>{a}</span>
                    </div>
                  ))}
                  {quizzes.map((q, i) => (
                    <div key={`q${i}`} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-2.5 text-sm">
                      <HelpCircle className="size-4 text-[#F59E0B]" />
                      <span>{q}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Certificate */}
            <Card className="border-white/10 bg-white/5 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Award className="size-5" style={{ color: "#6366F1" }} /> Certificate Template</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border-2 border-[#6366F1]/40 bg-gradient-to-br from-[#6366F1]/10 to-[#E8501A]/10 p-8 text-center">
                  <Award className="mx-auto mb-2 size-12" style={{ color: "#E8501A" }} />
                  <p className="text-xs uppercase tracking-widest text-white/50">Certificate of Completion</p>
                  <h3 className="mt-2 text-xl font-bold">{topic}</h3>
                  <p className="mt-1 text-xs text-white/60">{level} Level · {duration}</p>
                  <p className="mt-3 text-sm text-white/70">This certifies that</p>
                  <p className="font-semibold">[Student Name]</p>
                  <p className="mt-1 text-sm text-white/70">has successfully completed all modules & assessments</p>
                  <div className="mt-4 flex items-center justify-center gap-1 text-xs text-white/50">
                    <Sparkles className="size-3" /> ALO Labs · {new Date().getFullYear()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* My Courses */}
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/60">My Courses ({courses.length})</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <Card key={c.id} className="border-white/10 bg-white/5 text-white">
                <CardContent>
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#F59E0B] to-[#E8501A]">
                      <BookOpen className="size-5" />
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => setCourses((p) => p.filter((x) => x.id !== c.id))}>
                      <Trash2 className="size-4 text-red-400" />
                    </Button>
                  </div>
                  <h3 className="mb-2 font-semibold">{c.topic}</h3>
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    <Badge className="bg-[#6366F1]/20 text-[#a5b4fc]">{c.level}</Badge>
                    <Badge className="bg-[#E8501A]/20 text-[#fdba74]">{c.duration}</Badge>
                  </div>
                  <div className="mb-2 flex items-center justify-between text-xs text-white/50">
                    <span>Progress</span>
                    <span>0%</span>
                  </div>
                  <Progress value={0} className="h-1.5" />
                  <p className="mt-2 text-xs text-white/40">Created {c.createdAt}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-gradient-to-r from-[#F59E0B]/10 to-[#E8501A]/10 p-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="font-semibold">Turn your course into a video series</h3>
              <p className="text-sm text-white/60">Auto-generate scripts, scenes & narration per lesson.</p>
            </div>
            <Button variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10" onClick={() => navigate("video")}>
              Open Video Generator
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
