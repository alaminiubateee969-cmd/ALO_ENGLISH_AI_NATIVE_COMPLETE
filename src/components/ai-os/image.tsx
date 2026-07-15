"use client";

import { useState } from "react";
import {
  Image as ImageIcon, Sparkles, Download, Trash2, Heart, Plus,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { ModuleId } from "./module-registry";

type Nav = { navigate: (id: ModuleId) => void };

const STYLES = [
  { name: "Realistic", icon: "📷", color: "#6366F1" },
  { name: "Cartoon", icon: "🎨", color: "#EC4899" },
  { name: "Illustration", icon: "✏️", color: "#F59E0B" },
  { name: "Diagram", icon: "📊", color: "#0EA5E9" },
  { name: "Infographic", icon: "📈", color: "#16A34A" },
  { name: "Thumbnail", icon: "🖼️", color: "#E8501A" },
];

const SIZES = [
  { name: "Square", dims: "1024×1024" },
  { name: "Portrait", dims: "768×1024" },
  { name: "Landscape", dims: "1024×768" },
  { name: "Wide", dims: "1280×720" },
  { name: "Story", dims: "720×1280" },
];

const SAMPLE_GALLERY = [
  { id: "g1", prompt: "Neural network glowing", color: "#6366F1", style: "Illustration" },
  { id: "g2", prompt: "Solar system diagram", color: "#0EA5E9", style: "Diagram" },
  { id: "g3", prompt: "DNA helix 3D", color: "#16A34A", style: "Realistic" },
  { id: "g4", prompt: "Periodic table infographic", color: "#E8501A", style: "Infographic" },
  { id: "g5", prompt: "Cartoon teacher", color: "#EC4899", style: "Cartoon" },
  { id: "g6", prompt: "Math formula blackboard", color: "#F59E0B", style: "Thumbnail" },
];

export default function ImageStudio({ navigate }: Nav) {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState(STYLES[0]);
  const [size, setSize] = useState(SIZES[0]);
  const [count, setCount] = useState(4);
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<{ id: string; prompt: string; color: string; style: string }[]>([]);
  const [gallery, setGallery] = useState(SAMPLE_GALLERY);
  const [liked, setLiked] = useState<Set<string>>(new Set());

  const generate = () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setTimeout(() => {
      const colors = ["#6366F1", "#E8501A", "#0EA5E9", "#16A34A", "#EC4899", "#F59E0B", "#8B5CF6", "#06B6D4"];
      const newResults = Array.from({ length: count }, (_, i) => ({
        id: `r${Date.now()}-${i}`,
        prompt,
        color: colors[Math.floor(Math.random() * colors.length)],
        style: style.name,
      }));
      setResults(newResults);
      setGenerating(false);
    }, 1800);
  };

  const toggleLike = (id: string) => {
    setLiked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const saveToGallery = (item: { prompt: string; color: string; style: string }) => {
    setGallery((g) => [{ id: `g${Date.now()}`, ...item }, ...g]);
  };

  return (
    <div className="min-h-screen bg-[#0F172A] p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-[#F97316]">
            <ImageIcon className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">AI Image Studio</h1>
            <p className="text-white/60">Educational images, illustrations, thumbnails & infographics</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Configuration */}
          <Card className="border-white/10 bg-white/5 text-white lg:col-span-1">
            <CardHeader>
              <CardTitle>Generate Image</CardTitle>
              <CardDescription className="text-white/60">Describe what you want</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Prompt</Label>
                <Textarea
                  className="min-h-28 border-white/10 bg-white/5"
                  placeholder="e.g. A glowing neural network diagram with labeled layers, dark background, vibrant colors"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Style</Label>
                <div className="grid grid-cols-3 gap-2">
                  {STYLES.map((s) => (
                    <button
                      key={s.name}
                      onClick={() => setStyle(s)}
                      className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-center transition ${
                        style.name === s.name ? "border-[#F97316] bg-[#F97316]/10" : "border-white/10 bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      <span className="text-2xl">{s.icon}</span>
                      <span className="text-[10px]">{s.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Size</Label>
                <div className="flex flex-wrap gap-2">
                  {SIZES.map((s) => (
                    <button
                      key={s.name}
                      onClick={() => setSize(s)}
                      className={`rounded-lg border px-3 py-1.5 text-xs transition ${
                        size.name === s.name ? "border-[#F97316] bg-[#F97316]/10" : "border-white/10 bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      {s.name} <span className="text-white/50">{s.dims}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center justify-between">
                  <span>Number of images</span>
                  <span className="text-xs text-white/60">{count}</span>
                </Label>
                <div className="flex gap-2">
                  {[1, 2, 4, 6, 8].map((n) => (
                    <button
                      key={n}
                      onClick={() => setCount(n)}
                      className={`size-9 rounded-lg border text-sm transition ${
                        count === n ? "border-[#F97316] bg-[#F97316] text-white" : "border-white/10 bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <Button className="w-full bg-[#F97316] hover:bg-[#F97316]/90" onClick={generate} disabled={generating || !prompt.trim()}>
                <Sparkles /> {generating ? "Generating..." : `Generate ${count} Image${count > 1 ? "s" : ""}`}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          <Card className="border-white/10 bg-white/5 text-white lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Wand2 className="size-5" style={{ color: "#F97316" }} /> Generated Results</CardTitle>
            </CardHeader>
            <CardContent>
              {generating ? (
                <div className="grid grid-cols-2 gap-3">
                  {Array.from({ length: count }, (_, i) => (
                    <div key={i} className="aspect-square animate-pulse rounded-lg border border-white/10 bg-white/5" />
                  ))}
                </div>
              ) : results.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {results.map((r) => (
                    <div key={r.id} className="group relative overflow-hidden rounded-lg border border-white/10">
                      <div
                        className="aspect-square"
                        style={{
                          background: `linear-gradient(135deg, ${r.color}40, ${r.color}80)`,
                        }}
                      >
                        <div className="flex h-full flex-col items-center justify-center gap-2 p-3 text-center">
                          <ImageIcon className="size-8 text-white/70" />
                          <p className="text-xs text-white/80">{r.style}</p>
                        </div>
                      </div>
                      <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/60 p-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button size="icon" variant="ghost" className="size-7" onClick={() => toggleLike(r.id)}>
                          <Heart className={`size-3.5 ${liked.has(r.id) ? "fill-[#EC4899] text-[#EC4899]" : ""}`} />
                        </Button>
                        <Button size="icon" variant="ghost" className="size-7" onClick={() => saveToGallery(r)}>
                          <Plus className="size-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="size-7">
                          <Download className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex aspect-video flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-white/20 text-white/40">
                  <ImageIcon className="size-12" />
                  <p>Your generated images will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Gallery */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white/60">Image Gallery ({gallery.length})</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {gallery.map((g) => (
              <Card key={g.id} className="group overflow-hidden border-white/10 bg-white/5 text-white">
                <CardContent className="p-0">
                  <div className="relative aspect-square" style={{ background: `linear-gradient(135deg, ${g.color}40, ${g.color}80)` }}>
                    <div className="flex h-full flex-col items-center justify-center gap-1 p-2 text-center">
                      <ImageIcon className="size-6 text-white/70" />
                      <p className="text-[10px] text-white/80">{g.style}</p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute right-1 top-1 size-6 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={() => setGallery((prev) => prev.filter((x) => x.id !== g.id))}
                    >
                      <Trash2 className="size-3 text-red-400" />
                    </Button>
                  </div>
                  <div className="p-2">
                    <p className="truncate text-xs text-white/70">{g.prompt}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-gradient-to-r from-[#F97316]/10 to-[#6366F1]/10 p-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="font-semibold">Use these images in a video or course</h3>
              <p className="text-sm text-white/60">Drop them into scenes, slides, or assignments.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10" onClick={() => navigate("video")}>
                Video Generator
              </Button>
              <Button variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10" onClick={() => navigate("presentation")}>
                Presentation Studio
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
