"use client";

import { useState, useRef, useEffect } from "react";
import {
  Baby, Send, BookHeart, Brain, Heart, Smile, Apple, Moon, Shield,
  Smartphone, BookOpen, User, Sparkles, Activity, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { ModuleId } from "./module-registry";

type Nav = { navigate: (id: ModuleId) => void };

const AGES = ["0-6 months", "6-12 months", "1-3 years", "3-5 years", "5-8 years", "8-12 years"];

const TOPICS = [
  { name: "Baby Learning", icon: Brain, color: "#EC4899", desc: "Early cognitive development & sensory play" },
  { name: "Child Development", icon: Activity, color: "#6366F1", desc: "Milestones, growth & emotional stages" },
  { name: "Parenting Guide", icon: BookHeart, color: "#E8501A", desc: "Practical tips for every age" },
  { name: "Reading Skills", icon: BookOpen, color: "#0EA5E9", desc: "Phonics, comprehension & a love of books" },
  { name: "Emotional Intelligence", icon: Smile, color: "#F59E0B", desc: "Help kids name & manage feelings" },
  { name: "Nutrition", icon: Apple, color: "#16A34A", desc: "Healthy meals & fussy eater tips" },
  { name: "Sleep", icon: Moon, color: "#8B5CF6", desc: "Sleep schedules & bedtime routines" },
  { name: "Safety", icon: Shield, color: "#EF4444", desc: "Home safety, first aid & online protection" },
  { name: "Screen Time", icon: Smartphone, color: "#06B6D4", desc: "Healthy digital habits" },
  { name: "Storytelling", icon: Sparkles, color: "#F97316", desc: "Bedtime stories that build imagination" },
];

const ACTIVITIES: Record<string, string[]> = {
  "0-6 months": [
    "Tummy time for 3-5 minutes, 2-3 times daily",
    "Black-and-white high-contrast cards at 20-30 cm distance",
    "Soft singing & gentle rocking to build rhythm",
    "Skin-to-skin contact during feeds",
  ],
  "6-12 months": [
    "Peekaboo to develop object permanence",
    "Stacking soft blocks — 2-3 high",
    "Sensory bins with rice or water under supervision",
    "Reading board books with pictures of faces",
  ],
  "1-3 years": [
    "Color sorting with pom-poms or buttons",
    "Simple puzzles with 4-6 pieces",
    "Action songs like 'Wheels on the Bus'",
    "Pouring water between cups (bath time!)",
  ],
  "3-5 years": [
    "Letter tracing in sand or salt tray",
    "Counting games with everyday objects",
    "Pretend play (kitchen, doctor, shop)",
    "Drawing & naming emotions on faces",
  ],
  "5-8 years": [
    "Read-aloud chapter books before bed",
    "Math with dice — addition & subtraction races",
    "Simple science: sink/float, magnets",
    "Draw your day — visual journaling",
  ],
  "8-12 years": [
    "Debate night — pick a fun topic & argue both sides",
    "Coding with Scratch or simple Python",
    "Cook a meal together — read recipe & measure",
    "Nature walk + journal observations",
  ],
};

const ASSISTANT_REPLIES = [
  "Great question! At this age, focus on responsive interaction. When your baby coos, coo back — this back-and-forth builds neural pathways for language and trust.",
  "Wonderful that you're thinking about this early. For children this age, consistency matters more than intensity. A 10-minute daily routine beats an hour once a week.",
  "I hear you — this is a common concern. Try reframing the moment: instead of 'stop crying', try 'I see you're upset. Let's breathe together.' Modelling calm teaches regulation.",
  "Beautiful instinct! Storytelling at this stage boosts vocabulary, empathy and imagination. Even 5 minutes a night compounds enormously over a year.",
];

export default function Parenting({ navigate }: Nav) {
  const [age, setAge] = useState(AGES[2]);
  const [activeTopic, setActiveTopic] = useState(TOPICS[0]);
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([
    { role: "assistant", text: "আদরের অভিভাবক, স্বাগতম! Welcome! Ask me anything about parenting, child development, or learning activities." },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = () => {
    if (!input.trim()) return;
    const reply = ASSISTANT_REPLIES[Math.floor(Math.random() * ASSISTANT_REPLIES.length)];
    setMessages((m) => [...m, { role: "user", text: input }, { role: "assistant", text: reply }]);
    setInput("");
  };

  return (
    <div className="min-h-screen bg-[#0F172A] p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Bilingual Hero */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#EC4899]/20 via-[#6366F1]/15 to-[#E8501A]/15 p-8">
          <div className="relative flex items-start gap-4">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-[#EC4899]">
              <Baby className="size-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">
                শিশুদের শিক্ষা ও প্যারেন্টিং নিয়ে সচেতনতা <span className="inline-block">✨</span>
              </h1>
              <p className="mt-1 text-white/70">AI Parenting & Child Development — bilingual guidance for every age.</p>
            </div>
          </div>
        </div>

        {/* Age Selector */}
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <CardTitle>Select Your Child's Age</CardTitle>
            <CardDescription className="text-white/60">Activities & advice adapt to developmental stage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {AGES.map((a) => (
                <button
                  key={a}
                  onClick={() => setAge(a)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                    age === a
                      ? "border-[#EC4899] bg-[#EC4899] text-white"
                      : "border-white/20 bg-white/5 text-white/70 hover:bg-white/10"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Topics */}
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/60">Explore Topics</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {TOPICS.map((t) => {
              const Icon = t.icon;
              const active = activeTopic.name === t.name;
              return (
                <button
                  key={t.name}
                  onClick={() => setActiveTopic(t)}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition ${
                    active ? "border-white/30 bg-white/10" : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <Icon className="size-6" style={{ color: t.color }} />
                  <span className="text-xs font-medium">{t.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* AI Parenting Assistant */}
          <Card className="border-white/10 bg-white/5 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Heart className="size-5" style={{ color: "#EC4899" }} /> AI Parenting Assistant</CardTitle>
              <CardDescription className="text-white/60">Bilingual: বাংলা / English</CardDescription>
            </CardHeader>
            <CardContent>
              <div ref={scrollRef} className="mb-3 h-72 space-y-3 overflow-y-auto rounded-lg border border-white/10 bg-[#0F172A] p-4">
                {messages.map((m, i) => (
                  <div key={i} className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                    <div
                      className="flex size-8 items-center justify-center rounded-full text-xs font-bold"
                      style={{ background: m.role === "user" ? "#E8501A" : "#EC4899" }}
                    >
                      {m.role === "user" ? <User className="size-4" /> : <Heart className="size-4" />}
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
                  placeholder="Ask about sleep, feeding, behavior..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                />
                <Button className="bg-[#EC4899] hover:bg-[#EC4899]/90" onClick={send}><Send /></Button>
              </div>
            </CardContent>
          </Card>

          {/* Activities for selected age */}
          <Card className="border-white/10 bg-white/5 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="size-5" style={{ color: activeTopic.color }} />
                {activeTopic.name} — {age}
              </CardTitle>
              <CardDescription className="text-white/60">Age-appropriate activities & tips</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {ACTIVITIES[age].map((act, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-lg border border-white/10 bg-white/5 p-3 text-sm">
                    <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[#EC4899]/20 text-xs text-[#EC4899]">
                      {i + 1}
                    </div>
                    <span className="text-white/80">{act}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Badge className="bg-[#6366F1]/20 text-[#a5b4fc]">Topic: {activeTopic.name}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Medical Disclaimer */}
        <Alert className="border-[#F59E0B]/30 bg-[#F59E0B]/10 text-white">
          <AlertTriangle className="size-4 text-[#F59E0B]" />
          <AlertDescription className="text-white/80">
            <strong className="text-[#F59E0B]">Medical Disclaimer:</strong> This AI assistant provides general parenting information, not medical advice.
            Always consult a licensed pediatrician for health concerns, developmental delays, or medical conditions.
            In emergencies, contact your local emergency services immediately.
          </AlertDescription>
        </Alert>

        <div className="rounded-xl border border-white/10 bg-gradient-to-r from-[#EC4899]/10 to-[#6366F1]/10 p-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="font-semibold">Ready to build learning activities?</h3>
              <p className="text-sm text-white/60">Generate custom courses & lessons for your child's stage.</p>
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
