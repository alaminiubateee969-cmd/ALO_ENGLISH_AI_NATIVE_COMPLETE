"use client";

import { useState } from "react";
import {
  Presentation, Sparkles, FileText, BarChart3, Download, Copy,
  ChevronLeft, ChevronRight, FileSliders, FileType, Monitor,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { ModuleId } from "./module-registry";

type Nav = { navigate: (id: ModuleId) => void };

const STYLES = [
  { name: "Corporate", color: "#6366F1", bg: "from-[#6366F1]/30 to-[#0F172A]" },
  { name: "Academic", color: "#0EA5E9", bg: "from-[#0EA5E9]/30 to-[#0F172A]" },
  { name: "Creative", color: "#E8501A", bg: "from-[#E8501A]/30 to-[#0F172A]" },
  { name: "Minimal", color: "#16A34A", bg: "from-white/20 to-[#0F172A]" },
];

const SAMPLE_SLIDES = [
  { title: "Title Slide", subtitle: "Subtitle goes here", layout: "title" },
  { title: "Agenda", subtitle: "5 sections covered", layout: "list" },
  { title: "Introduction", subtitle: "Setting the context", layout: "content" },
  { title: "Key Concept", subtitle: "Definition & examples", layout: "content" },
  { title: "Data & Insights", subtitle: "Charts and analysis", layout: "chart" },
  { title: "Case Study", subtitle: "Real-world application", layout: "content" },
  { title: "Comparison", subtitle: "Pros and cons", layout: "comparison" },
  { title: "Methodology", subtitle: "How we approached this", layout: "list" },
  { title: "Results", subtitle: "Outcomes achieved", layout: "chart" },
  { title: "Recommendations", subtitle: "Next steps", layout: "list" },
  { title: "Q&A", subtitle: "Open the floor", layout: "title" },
  { title: "Thank You", subtitle: "Contact info", layout: "title" },
];

const SPEAKER_NOTES = [
  "Welcome the audience. Introduce yourself briefly, then state the goal of the presentation in one sentence.",
  "Walk through the agenda. Emphasize what they'll be able to do by the end.",
  "Start with a hook — a surprising statistic or short anecdote. Then transition to the formal introduction.",
  "Define the key term clearly. Use an analogy the audience already understands.",
  "Highlight the most important number on the chart. Don't read every data point — narrate the story.",
  "Tell the case as a story: situation, action, result. Mention concrete numbers if possible.",
  "Be balanced — present both sides honestly before recommending your preferred option.",
  "Explain the 'why' behind each methodological choice, not just the 'what'.",
  "Anchor each result to the original goal stated in slide 3.",
  "Be concrete: who does what, by when, with what resources.",
  "Repeat the question aloud so everyone hears it. Take a breath before answering.",
  "End on a forward-looking note. Share your contact details and a clear next step.",
];

const CHART_SUGGESTIONS = [
  { slide: "Data & Insights", type: "Bar chart", desc: "Compare 5 categories side by side" },
  { slide: "Results", type: "Line chart", desc: "Show growth over 6 months" },
  { slide: "Comparison", type: "Side-by-side table", desc: "Feature A vs Feature B" },
  { slide: "Methodology", type: "Flow diagram", desc: "Process steps with arrows" },
];

export default function PresentationStudio({ navigate }: Nav) {
  const [topic, setTopic] = useState("");
  const [slideCount, setSlideCount] = useState(10);
  const [style, setStyle] = useState(STYLES[0]);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = SAMPLE_SLIDES.slice(0, Math.min(slideCount, SAMPLE_SLIDES.length));

  const generate = () => {
    if (!topic.trim()) return;
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setGenerated(true);
      setActiveSlide(0);
    }, 1400);
  };

  return (
    <div className="min-h-screen bg-[#0F172A] p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-[#3B82F6]">
            <Presentation className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">AI Presentation Studio</h1>
            <p className="text-white/60">Auto-generate slides, charts & speaker notes</p>
          </div>
        </div>

        {/* Input */}
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <CardTitle>Presentation Configuration</CardTitle>
            <CardDescription className="text-white/60">Define topic, length & style</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2 md:col-span-3">
              <Label>Topic</Label>
              <Textarea
                className="min-h-20 border-white/10 bg-white/5"
                placeholder="e.g. The Future of AI in K-12 Education"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span>Slide count</span>
                <span className="text-xs text-white/60">{slideCount}</span>
              </Label>
              <input
                type="range"
                min={5}
                max={12}
                value={slideCount}
                onChange={(e) => setSlideCount(Number(e.target.value))}
                className="w-full accent-[#3B82F6]"
              />
              <div className="flex justify-between text-xs text-white/40"><span>5</span><span>12</span></div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Style</Label>
              <div className="flex flex-wrap gap-2">
                {STYLES.map((s) => (
                  <button
                    key={s.name}
                    onClick={() => setStyle(s)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                      style.name === s.name ? "border-[#3B82F6] bg-[#3B82F6]/10" : "border-white/10 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <div className="size-3 rounded-full" style={{ background: s.color }} />
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="md:col-span-3">
              <Button className="bg-[#3B82F6] hover:bg-[#3B82F6]/90" onClick={generate} disabled={generating || !topic.trim()}>
                <Sparkles /> {generating ? "Generating deck..." : "Generate Presentation"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {generated && (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Slide preview */}
              <Card className="border-white/10 bg-white/5 text-white lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Slide {activeSlide + 1} of {slides.length}</CardTitle>
                    <div className="flex gap-1">
                      <Button size="icon" variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10" onClick={() => setActiveSlide((i) => Math.max(0, i - 1))} disabled={activeSlide === 0}>
                        <ChevronLeft />
                      </Button>
                      <Button size="icon" variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10" onClick={() => setActiveSlide((i) => Math.min(slides.length - 1, i + 1))} disabled={activeSlide === slides.length - 1}>
                        <ChevronRight />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`aspect-video rounded-lg border border-white/10 bg-gradient-to-br ${style.bg} p-8`}>
                    <div className="flex h-full flex-col justify-between">
                      <div>
                        <Badge variant="outline" className="border-white/30 text-[10px] text-white/70">{slides[activeSlide].layout}</Badge>
                        <h2 className="mt-3 text-3xl font-bold">{slides[activeSlide].title}</h2>
                        <p className="mt-2 text-white/70">{slides[activeSlide].subtitle}</p>
                      </div>
                      {slides[activeSlide].layout === "chart" && (
                        <div className="flex h-24 items-end gap-2">
                          {[40, 65, 50, 80, 70, 95].map((h, i) => (
                            <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: style.color }} />
                          ))}
                        </div>
                      )}
                      {slides[activeSlide].layout === "list" && (
                        <ul className="space-y-1 text-sm text-white/70">
                          <li>• Point one</li>
                          <li>• Point two</li>
                          <li>• Point three</li>
                          <li>• Point four</li>
                        </ul>
                      )}
                      <div className="flex items-center justify-between text-xs text-white/50">
                        <span>{topic}</span>
                        <span>{activeSlide + 1} / {slides.length}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Speaker notes + chart suggestions */}
              <div className="space-y-6">
                <Card className="border-white/10 bg-white/5 text-white">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><FileText className="size-5" style={{ color: style.color }} /> Speaker Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-lg border border-white/10 bg-[#0F172A] p-4 text-sm text-white/80">
                      {SPEAKER_NOTES[activeSlide]}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-white/10 bg-white/5 text-white">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><BarChart3 className="size-5" style={{ color: "#E8501A" }} /> Chart Suggestions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {CHART_SUGGESTIONS.map((c, i) => (
                      <div key={i} className="rounded-lg border border-white/10 bg-white/5 p-2.5">
                        <p className="text-xs font-semibold text-[#3B82F6]">{c.slide}</p>
                        <p className="text-sm">{c.type}</p>
                        <p className="text-xs text-white/50">{c.desc}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Slide thumbnails */}
            <Card className="border-white/10 bg-white/5 text-white">
              <CardHeader>
                <CardTitle>All Slides</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                  {slides.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveSlide(i)}
                      className={`aspect-video rounded-md border p-2 text-left transition ${
                        activeSlide === i ? "border-[#3B82F6] bg-[#3B82F6]/10" : "border-white/10 bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      <div className="text-[9px] text-white/40">{i + 1}</div>
                      <p className="text-[10px] font-semibold leading-tight">{s.title}</p>
                      <div className="mt-1 h-0.5 w-3/4 rounded" style={{ background: style.color }} />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Export options */}
            <Card className="border-white/10 bg-white/5 text-white">
              <CardHeader>
                <CardTitle>Export Options</CardTitle>
                <CardDescription className="text-white/60">Choose your target format</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Button variant="outline" className="h-auto flex-col gap-2 border-white/20 bg-white/5 py-6 text-white hover:bg-white/10">
                    <FileSliders className="size-8 text-[#D24726]" />
                    <span className="font-semibold">PowerPoint</span>
                    <span className="text-xs text-white/50">.pptx · editable</span>
                  </Button>
                  <Button variant="outline" className="h-auto flex-col gap-2 border-white/20 bg-white/5 py-6 text-white hover:bg-white/10">
                    <Monitor className="size-8 text-[#16A34A]" />
                    <span className="font-semibold">Google Slides</span>
                    <span className="text-xs text-white/50">opens in browser</span>
                  </Button>
                  <Button variant="outline" className="h-auto flex-col gap-2 border-white/20 bg-white/5 py-6 text-white hover:bg-white/10">
                    <FileType className="size-8 text-[#EF4444]" />
                    <span className="font-semibold">PDF</span>
                    <span className="text-xs text-white/50">.pdf · print-ready</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="rounded-xl border border-white/10 bg-gradient-to-r from-[#3B82F6]/10 to-[#6366F1]/10 p-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="font-semibold">Turn research into a presentation</h3>
              <p className="text-sm text-white/60">Auto-import your research workflow outputs as slide content.</p>
            </div>
            <Button variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10" onClick={() => navigate("research")}>
              Open Research Center
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
