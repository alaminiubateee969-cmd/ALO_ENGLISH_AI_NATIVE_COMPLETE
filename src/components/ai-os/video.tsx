"use client";

import { useState } from "react";
import {
  Video, Sparkles, Clock, PlayCircle, CheckCircle2, Mic, Camera,
  Image as ImageIcon, Clapperboard, Captions, Youtube, Search,
  Film, Megaphone, FileText, ListOrdered,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { ModuleId } from "./module-registry";

type Nav = { navigate: (id: ModuleId) => void };

const LENGTHS = [5, 10, 15, 20, 30, 45, 60];

const PIPELINE = [
  { name: "Research", icon: Search },
  { name: "Script", icon: FileText },
  { name: "Fact Check", icon: CheckCircle2 },
  { name: "Scene Planning", icon: Clapperboard },
  { name: "Voice", icon: Mic },
  { name: "Image", icon: ImageIcon },
  { name: "Animation", icon: Film },
  { name: "Video", icon: Video },
  { name: "Subtitles", icon: Captions },
  { name: "Thumbnail", icon: ImageIcon },
  { name: "Social Clips", icon: Megaphone },
  { name: "Publishing", icon: Youtube },
];

const OUTPUT_ITEMS = [
  "Title", "Learning objectives", "Full script", "Scene-by-scene breakdown",
  "Voice narration", "Camera directions", "Avatar instructions", "B-roll suggestions",
  "Captions / subtitles", "Thumbnail concept", "YouTube description", "SEO keywords",
  "Chapters", "Call-to-action", "Hook (first 5 seconds)", "Outro",
  "Music suggestions", "Lower-thirds text", "End-screen layout", "Social media teasers",
];

const SCRIPT_SAMPLE = `[HOOK — 0:00]
Ever wondered how AI actually learns? In the next 10 minutes, you'll understand the core idea — no math degree required.

[INTRO — 0:15]
Hi, I'm your AI tutor. Today we're unpacking machine learning — the technology behind everything from Netflix recommendations to self-driving cars.

[SCENE 1 — 0:45 — Visual: animated brain]
At its core, machine learning is pattern recognition. We feed a computer lots of examples, and it finds the pattern on its own.

[SCENE 2 — 1:30 — Visual: scatter plot forming line]
Imagine plotting house prices vs. square footage. Draw a line through the points — that's already a simple ML model!

[SCENE 3 — 2:30 — Visual: neural network diagram]
Neural networks take this further: many layers, each learning more abstract features. Edges → shapes → objects → faces.

[OUTRO — 9:30]
So next time Netflix recommends a show, you'll know exactly what's happening under the hood. Subscribe for more bite-sized AI.`;

export default function VideoGen({ navigate }: Nav) {
  const [topic, setTopic] = useState("");
  const [length, setLength] = useState(10);
  const [generated, setGenerated] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [activePipeline, setActivePipeline] = useState(0);
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const generate = () => {
    if (!topic.trim()) return;
    setGenerating(true);
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      setActivePipeline(i);
      if (i >= PIPELINE.length) {
        clearInterval(interval);
        setGenerating(false);
        setGenerated(true);
      }
    }, 250);
  };

  const toggleItem = (item: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(item)) next.delete(item); else next.add(item);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#0F172A] p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-[#EF4444]">
            <Video className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">AI Video Generator</h1>
            <p className="text-white/60">Educational videos — script to published film, fully automated</p>
          </div>
        </div>

        {/* Input */}
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <CardTitle>Video Plan</CardTitle>
            <CardDescription className="text-white/60">Define your video topic & duration</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2 md:col-span-3">
              <Label>Video Topic</Label>
              <Textarea
                className="border-white/10 bg-white/5"
                placeholder="e.g. How does machine learning actually work?"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
            <div className="space-y-2 md:col-span-3">
              <Label>Length (minutes)</Label>
              <div className="flex flex-wrap gap-2">
                {LENGTHS.map((l) => (
                  <button
                    key={l}
                    onClick={() => setLength(l)}
                    className={`flex items-center gap-1 rounded-lg border px-4 py-2 text-sm font-medium transition ${
                      length === l
                        ? "border-[#EF4444] bg-[#EF4444] text-white"
                        : "border-white/20 bg-white/5 text-white/70 hover:bg-white/10"
                    }`}
                  >
                    <Clock className="size-3" /> {l} min
                  </button>
                ))}
              </div>
            </div>
            <div className="md:col-span-3">
              <Button className="bg-[#EF4444] hover:bg-[#EF4444]/90" onClick={generate} disabled={generating || !topic.trim()}>
                <Sparkles /> {generating ? `Generating... (${activePipeline}/${PIPELINE.length})` : "Generate Video Plan"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Pipeline */}
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <CardTitle>Production Workflow</CardTitle>
            <CardDescription className="text-white/60">
              {generating ? `Currently: ${PIPELINE[activePipeline]?.name}` : "12-stage automated pipeline"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {PIPELINE.map((p, i) => {
                const Icon = p.icon;
                const done = i < activePipeline;
                const active = i === activePipeline && generating;
                return (
                  <div
                    key={p.name}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                      done
                        ? "border-[#16A34A]/40 bg-[#16A34A]/10"
                        : active
                        ? "border-[#EF4444] bg-[#EF4444]/20"
                        : "border-white/10 bg-white/5"
                    }`}
                  >
                    {done ? <CheckCircle2 className="size-4 text-[#16A34A]" /> : <Icon className={`size-4 ${active ? "animate-pulse" : "text-white/40"}`} />}
                    <span>{p.name}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Output */}
        {generated && (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Title + objectives */}
              <Card className="border-white/10 bg-white/5 text-white">
                <CardHeader>
                  <CardTitle>Title</CardTitle>
                </CardHeader>
                <CardContent>
                  <h3 className="text-lg font-bold">{topic || "How AI Actually Learns — Explained in 10 Minutes"}</h3>
                  <Badge className="mt-2 bg-[#EF4444]/20 text-[#fca5a5]">{length} minutes</Badge>
                  <div className="mt-4">
                    <p className="mb-2 text-xs font-semibold uppercase text-white/50">Learning objectives</p>
                    <ul className="space-y-1.5 text-sm text-white/80">
                      <li>• Define machine learning in plain language</li>
                      <li>• Identify 3 real-world ML applications</li>
                      <li>• Explain supervised vs. unsupervised learning</li>
                      <li>• Recognize the role of training data</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Thumbnail concept */}
              <Card className="border-white/10 bg-white/5 text-white">
                <CardHeader>
                  <CardTitle>Thumbnail Concept</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video rounded-lg border border-white/10 bg-gradient-to-br from-[#6366F1]/40 to-[#EF4444]/30 p-4">
                    <div className="flex h-full flex-col justify-between">
                      <Badge className="w-fit bg-[#EF4444] text-white">10 MIN</Badge>
                      <div>
                        <p className="text-xl font-black leading-tight">HOW AI<br />LEARNS</p>
                        <p className="mt-1 text-xs text-white/70">Explained simply 🤖</p>
                      </div>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-white/60">High contrast, bold text, surprised face, big arrow.</p>
                </CardContent>
              </Card>

              {/* SEO + chapters */}
              <Card className="border-white/10 bg-white/5 text-white">
                <CardHeader>
                  <CardTitle>SEO & Chapters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase text-white/50">SEO keywords</p>
                    <div className="flex flex-wrap gap-1">
                      {["machine learning", "AI explained", "how AI works", "ML tutorial", "neural networks", "beginner AI", "tech education"].map((k) => (
                        <Badge key={k} variant="outline" className="border-white/20 text-[10px]">{k}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase text-white/50">Chapters</p>
                    <div className="space-y-1 text-xs text-white/70">
                      <p>0:00 — Hook</p>
                      <p>0:15 — Introduction</p>
                      <p>0:45 — What is ML?</p>
                      <p>2:30 — Neural Networks</p>
                      <p>5:00 — Real-world examples</p>
                      <p>8:30 — Quiz</p>
                      <p>9:30 — Outro & CTA</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Full script */}
            <Card className="border-white/10 bg-white/5 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileText className="size-5" style={{ color: "#6366F1" }} /> Full Script</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg border border-white/10 bg-[#0F172A] p-4 text-sm text-white/80">{SCRIPT_SAMPLE}</pre>
              </CardContent>
            </Card>

            {/* Scene breakdown */}
            <Card className="border-white/10 bg-white/5 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Clapperboard className="size-5" style={{ color: "#E8501A" }} /> Scene-by-Scene Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { n: 1, time: "0:00", scene: "Hook", visual: "Bold text on dark background", voice: "Curious, energetic", avatar: "Looking directly at camera, smiling" },
                    { n: 2, time: "0:45", scene: "Definition", visual: "Animated brain diagram", voice: "Clear, measured", avatar: "Pointing to diagram" },
                    { n: 3, time: "2:30", scene: "Neural Net", visual: "Network of glowing nodes", voice: "Excited", avatar: "Hands gesturing connections" },
                    { n: 4, time: "5:00", scene: "Examples", visual: "Montage: Netflix, maps, voice assistants", voice: "Warm", avatar: "Sitting at desk" },
                    { n: 5, time: "9:30", scene: "Outro", visual: "Subscribe animation", voice: "Friendly CTA", avatar: "Waving goodbye" },
                  ].map((s) => (
                    <div key={s.n} className="grid grid-cols-1 gap-2 rounded-lg border border-white/10 bg-white/5 p-3 sm:grid-cols-[60px_60px_1fr_1fr_1fr_1fr]">
                      <div className="flex items-center gap-2 text-sm"><PlayCircle className="size-4 text-[#EF4444]" /> #{s.n}</div>
                      <div className="text-xs text-white/50">{s.time}</div>
                      <div className="text-sm font-medium">{s.scene}</div>
                      <div className="text-xs text-white/70"><span className="text-white/40">Visual:</span> {s.visual}</div>
                      <div className="text-xs text-white/70"><span className="text-white/40">Voice:</span> {s.voice}</div>
                      <div className="text-xs text-white/70"><span className="text-white/40">Avatar:</span> {s.avatar}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Output checklist */}
            <Card className="border-white/10 bg-white/5 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ListOrdered className="size-5" style={{ color: "#16A34A" }} /> Output Checklist ({checked.size}/{OUTPUT_ITEMS.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {OUTPUT_ITEMS.map((item) => {
                    const isChecked = checked.has(item);
                    return (
                      <button
                        key={item}
                        onClick={() => toggleItem(item)}
                        className={`flex items-center gap-2 rounded-lg border p-2.5 text-left text-sm transition ${
                          isChecked ? "border-[#16A34A]/40 bg-[#16A34A]/10" : "border-white/10 bg-white/5 hover:bg-white/10"
                        }`}
                      >
                        {isChecked ? <CheckCircle2 className="size-4 text-[#16A34A]" /> : <div className="size-4 rounded-full border border-white/20" />}
                        <span>{item}</span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* YouTube description + CTA */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-white/10 bg-white/5 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Youtube className="size-5" style={{ color: "#EF4444" }} /> YouTube Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border border-white/10 bg-[#0F172A] p-4 text-sm text-white/80">
                    <p>{topic || "How AI Actually Learns"} — explained simply in just {length} minutes!</p>
                    <p className="mt-2">In this video, we break down the core ideas of machine learning without any heavy math. Perfect for students, curious beginners, and anyone who wants to understand the technology shaping our world.</p>
                    <p className="mt-2">🔔 Subscribe for weekly AI & tech explainers!</p>
                    <p className="mt-2 text-white/50">#MachineLearning #AI #TechEducation #LearnAI</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/5 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Megaphone className="size-5" style={{ color: "#E8501A" }} /> Call-to-Action</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm">
                    <p className="font-semibold text-[#E8501A]">End-screen CTA</p>
                    <p className="text-white/70">"If this clicked for you, hit subscribe. Next week: How ChatGPT really works."</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm">
                    <p className="font-semibold text-[#6366F1]">Pinned comment</p>
                    <p className="text-white/70">"What AI topic should we cover next? Drop your ideas below 👇"</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm">
                    <p className="font-semibold text-[#16A34A]">B-roll suggestions</p>
                    <p className="text-white/70">Stock footage: data centers, code on screens, classrooms, satellites.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-white/10 bg-gradient-to-r from-[#EF4444]/10 to-[#6366F1]/10 p-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="font-semibold">Need a presenter for your video?</h3>
              <p className="text-sm text-white/60">Generate a talking AI avatar in minutes.</p>
            </div>
            <Button variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10" onClick={() => navigate("avatar")}>
              Open Avatar Studio
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
