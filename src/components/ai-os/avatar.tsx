"use client";

import { useState } from "react";
import {
  UserCircle, Upload, Sparkles, ShieldAlert, Play, Pause, Trash2,
  Camera, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { ModuleId } from "./module-registry";

type Nav = { navigate: (id: ModuleId) => void };

const AVATAR_TYPES = [
  { name: "Talking Avatar", icon: "🗣️", desc: "Lip-synced AI presenter that speaks your script", color: "#6366F1" },
  { name: "AI Presenter", icon: "📺", desc: "News-style presenter for video content", color: "#E8501A" },
  { name: "Teacher Avatar", icon: "👨‍🏫", desc: "Educational avatar for tutoring videos", color: "#16A34A" },
  { name: "Cartoon Avatar", icon: "🎨", desc: "Stylized animated character", color: "#EC4899" },
  { name: "Professional Presenter", icon: "💼", desc: "Corporate-style avatar for B2B content", color: "#0EA5E9" },
];

const SAMPLE_AVATARS = [
  { name: "Aria", type: "Talking Avatar", color: "#6366F1" },
  { name: "Marcus", type: "AI Presenter", color: "#E8501A" },
  { name: "Lina", type: "Teacher Avatar", color: "#16A34A" },
  { name: "Pixel", type: "Cartoon Avatar", color: "#EC4899" },
  { name: "James", type: "Professional Presenter", color: "#0EA5E9" },
  { name: "Nova", type: "Talking Avatar", color: "#8B5CF6" },
];

export default function Avatar({ navigate }: Nav) {
  const [type, setType] = useState(AVATAR_TYPES[0]);
  const [uploaded, setUploaded] = useState<Record<string, boolean>>({ face: false, angles: false, body: false });
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [gallery, setGallery] = useState(SAMPLE_AVATARS);

  const generate = () => {
    if (!uploaded.face) return;
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setGenerated(true);
    }, 1500);
  };

  const uploadSlots = [
    { key: "face", label: "Front Face Image", hint: "Clear, well-lit, looking forward" },
    { key: "angles", label: "Multiple Angles (3-5 photos)", hint: "Left, right, up, down" },
    { key: "body", label: "Full Body Photo", hint: "Standing, neutral pose" },
  ];

  return (
    <div className="min-h-screen bg-[#0F172A] p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-[#8B5CF6]">
            <UserCircle className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">AI Avatar Studio</h1>
            <p className="text-white/60">Upload a face → generate a talking AI presenter</p>
          </div>
        </div>

        {/* Consent Notice */}
        <Alert className="border-[#EF4444]/40 bg-[#EF4444]/10 text-white">
          <ShieldAlert className="size-4 text-[#EF4444]" />
          <AlertDescription className="text-white/90">
            <strong className="text-[#EF4444]">Important:</strong> Use uploaded images only with authorization.
            Do not clone another person's identity without their explicit written consent.
            Misuse may violate laws on privacy, defamation, and deepfake regulation.
          </AlertDescription>
        </Alert>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Upload Area */}
          <Card className="border-white/10 bg-white/5 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Upload className="size-5" style={{ color: "#8B5CF6" }} /> Upload Source Images</CardTitle>
              <CardDescription className="text-white/60">Higher quality photos produce better avatars</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {uploadSlots.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setUploaded((u) => ({ ...u, [s.key]: !u[s.key] }))}
                  className={`flex w-full items-center gap-4 rounded-lg border border-dashed p-4 text-left transition ${
                    uploaded[s.key]
                      ? "border-[#16A34A]/40 bg-[#16A34A]/10"
                      : "border-white/20 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <div className={`flex size-12 items-center justify-center rounded-lg ${uploaded[s.key] ? "bg-[#16A34A]/20" : "bg-white/10"}`}>
                    {uploaded[s.key] ? <CheckCircle2 className="size-6 text-[#16A34A]" /> : <Camera className="size-6 text-white/50" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{s.label}</p>
                    <p className="text-xs text-white/50">{s.hint}</p>
                  </div>
                  <Button size="sm" variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
                    {uploaded[s.key] ? "Replace" : "Browse"}
                  </Button>
                </button>
              ))}
              <div className="mt-2 rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-white/60">
                ✓ JPG / PNG / WebP · min 512×512px · max 10 MB each
              </div>
            </CardContent>
          </Card>

          {/* Avatar Type */}
          <Card className="border-white/10 bg-white/5 text-white">
            <CardHeader>
              <CardTitle>Select Avatar Type</CardTitle>
              <CardDescription className="text-white/60">Choose the style that fits your use case</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {AVATAR_TYPES.map((t) => (
                <button
                  key={t.name}
                  onClick={() => setType(t)}
                  className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition ${
                    type.name === t.name
                      ? "border-[#8B5CF6] bg-[#8B5CF6]/10"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <span className="text-3xl">{t.icon}</span>
                  <div className="flex-1">
                    <p className="font-medium">{t.name}</p>
                    <p className="text-xs text-white/60">{t.desc}</p>
                  </div>
                  {type.name === t.name && <CheckCircle2 className="size-5" style={{ color: t.color }} />}
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Generate button + preview */}
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Avatar Preview</CardTitle>
                <CardDescription className="text-white/60">{type.name} · {uploaded.face ? "Ready" : "Upload face to continue"}</CardDescription>
              </div>
              <Button className="bg-[#8B5CF6] hover:bg-[#8B5CF6]/90" onClick={generate} disabled={generating || !uploaded.face}>
                <Sparkles /> {generating ? "Generating..." : "Generate Avatar"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-video overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-[#8B5CF6]/20 to-[#6366F1]/10">
              {generated ? (
                <div className="flex h-full flex-col items-center justify-center gap-4">
                  <div
                    className="flex size-32 items-center justify-center rounded-full text-5xl"
                    style={{ background: "linear-gradient(135deg,#8B5CF6,#6366F1)" }}
                  >
                    {type.icon}
                  </div>
                  <p className="text-lg font-semibold">Your {type.name} is ready!</p>
                  <Button
                    variant="outline"
                    className="border-white/20 bg-white/10 text-white hover:bg-white/20"
                    onClick={() => setPlaying(!playing)}
                  >
                    {playing ? <Pause /> : <Play />} {playing ? "Pause Preview" : "Play Preview"}
                  </Button>
                </div>
              ) : generating ? (
                <div className="flex h-full flex-col items-center justify-center gap-3">
                  <div className="size-16 animate-spin rounded-full border-4 border-white/20 border-t-[#8B5CF6]" />
                  <p className="text-white/70">Training avatar model...</p>
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-white/40">
                  <UserCircle className="size-16" />
                  <p>Avatar preview will appear here</p>
                </div>
              )}
            </div>
            {generated && (
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge className="bg-[#16A34A]/20 text-[#86efac]">✓ Lip-sync ready</Badge>
                <Badge className="bg-[#6366F1]/20 text-[#a5b4fc]">✓ 6 emotions supported</Badge>
                <Badge className="bg-[#E8501A]/20 text-[#fdba74]">✓ 6 languages supported</Badge>
                <Badge className="bg-white/10 text-white/70">Resolution: 1080p</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gallery */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white/60">Avatar Gallery ({gallery.length})</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {gallery.map((a) => (
              <Card key={a.name} className="border-white/10 bg-white/5 text-white">
                <CardContent>
                  <div className="mb-2 flex items-start justify-between">
                    <div
                      className="flex size-12 items-center justify-center rounded-full text-xl font-bold"
                      style={{ background: a.color }}
                    >
                      {a.name.charAt(0)}
                    </div>
                    <Button size="icon" variant="ghost" className="size-6" onClick={() => setGallery((g) => g.filter((x) => x.name !== a.name))}>
                      <Trash2 className="size-3 text-red-400" />
                    </Button>
                  </div>
                  <p className="font-medium">{a.name}</p>
                  <Badge variant="outline" className="mt-1 border-white/20 text-[10px] text-white/60">{a.type}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-gradient-to-r from-[#8B5CF6]/10 to-[#6366F1]/10 p-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="font-semibold">Give your avatar a voice</h3>
              <p className="text-sm text-white/60">Generate multilingual AI narration with emotion control.</p>
            </div>
            <Button variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10" onClick={() => navigate("voice")}>
              Open Voice Studio
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
