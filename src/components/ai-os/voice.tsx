"use client";

import { useState } from "react";
import {
  Mic, Play, Pause, Download, Sparkles, Volume2, Gauge, Heart,
  Globe, Copy, ShieldAlert, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import type { ModuleId } from "./module-registry";

type Nav = { navigate: (id: ModuleId) => void };

const VOICE_TYPES = [
  { name: "Male", icon: "👨", sample: "Deep, authoritative" },
  { name: "Female", icon: "👩", sample: "Warm, clear" },
  { name: "Child", icon: "🧒", sample: "Playful, energetic" },
  { name: "Elderly", icon: "👴", sample: "Wise, slow-paced" },
  { name: "Teacher", icon: "🧑‍🏫", sample: "Patient, articulate" },
  { name: "Storyteller", icon: "🎙️", sample: "Theatrical, expressive" },
  { name: "Professional", icon: "💼", sample: "Neutral, corporate" },
];

const EMOTIONS = ["Neutral", "Happy", "Sad", "Excited", "Calm", "Angry", "Whisper"];
const TONES = ["Friendly", "Formal", "Soft", "Bold", "Soothing", "Energetic"];
const LANGUAGES = [
  { code: "EN", name: "English" },
  { code: "BN", name: "Bangla" },
  { code: "AR", name: "Arabic" },
  { code: "HI", name: "Hindi" },
  { code: "ES", name: "Spanish" },
  { code: "FR", name: "French" },
];

export default function Voice({ navigate }: Nav) {
  const [voiceType, setVoiceType] = useState(VOICE_TYPES[1]);
  const [emotion, setEmotion] = useState(EMOTIONS[0]);
  const [tone, setTone] = useState(TONES[0]);
  const [language, setLanguage] = useState("EN");
  const [speed, setSpeed] = useState(50);
  const [pitch, setPitch] = useState(50);
  const [text, setText] = useState("Welcome to ALO Labs. Today we'll explore how AI can transform education, one voice at a time.");
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = () => {
    if (!text.trim()) return;
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setGenerated(true);
      setPlaying(true);
    }, 1500);
  };

  const copy = () => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="min-h-screen bg-[#0F172A] p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-[#06B6D4]">
            <Mic className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">AI Voice Studio</h1>
            <p className="text-white/60">Multilingual speech synthesis with emotion & tone control</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Voice type */}
          <Card className="border-white/10 bg-white/5 text-white">
            <CardHeader>
              <CardTitle>Voice Type</CardTitle>
              <CardDescription className="text-white/60">Choose your narrator</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {VOICE_TYPES.map((v) => (
                <button
                  key={v.name}
                  onClick={() => setVoiceType(v)}
                  className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition ${
                    voiceType.name === v.name
                      ? "border-[#06B6D4] bg-[#06B6D4]/10"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <span className="text-2xl">{v.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{v.name}</p>
                    <p className="text-xs text-white/60">{v.sample}</p>
                  </div>
                  {voiceType.name === v.name && <CheckCircle2 className="size-4 text-[#06B6D4]" />}
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Controls + text */}
          <Card className="border-white/10 bg-white/5 text-white lg:col-span-2">
            <CardHeader>
              <CardTitle>Voice Controls</CardTitle>
              <CardDescription className="text-white/60">Fine-tune emotion, language & delivery</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><Heart className="size-3.5" /> Emotion</Label>
                  <Select value={emotion} onValueChange={setEmotion}>
                    <SelectTrigger className="w-full border-white/10 bg-white/5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EMOTIONS.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label> Tone</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger className="w-full border-white/10 bg-white/5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><Globe className="size-3.5" /> Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="w-full border-white/10 bg-white/5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((l) => <SelectItem key={l.code} value={l.code}>{l.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="flex items-center justify-between">
                    <span className="flex items-center gap-1"><Gauge className="size-3.5" /> Speed</span>
                    <span className="text-xs text-white/60">{speed}%</span>
                  </Label>
                  <Slider value={[speed]} onValueChange={(v) => setSpeed(v[0])} min={25} max={200} step={5} />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center justify-between">
                    <span className="flex items-center gap-1"><Volume2 className="size-3.5" /> Pitch</span>
                    <span className="text-xs text-white/60">{pitch}%</span>
                  </Label>
                  <Slider value={[pitch]} onValueChange={(v) => setPitch(v[0])} min={0} max={100} step={5} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Text to Speak</Label>
                  <Button size="sm" variant="ghost" onClick={copy}>
                    {copied ? <CheckCircle2 className="size-4 text-[#16A34A]" /> : <Copy className="size-4" />} {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
                <Textarea
                  className="min-h-32 border-white/10 bg-white/5"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type the text you want the AI to speak..."
                />
                <div className="flex items-center justify-between text-xs text-white/50">
                  <span>{text.length} characters · ~{Math.ceil(text.length / 12)}s audio</span>
                </div>
              </div>
              <Button className="w-full bg-[#06B6D4] hover:bg-[#06B6D4]/90" onClick={generate} disabled={generating || !text.trim()}>
                <Sparkles /> {generating ? "Synthesizing voice..." : "Generate Voice"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Audio player */}
        {generated && (
          <Card className="border-white/10 bg-white/5 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Volume2 className="size-5" style={{ color: "#06B6D4" }} /> Generated Audio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <Button
                  size="icon"
                  className="size-14 rounded-full bg-[#06B6D4] hover:bg-[#06B6D4]/80"
                  onClick={() => setPlaying(!playing)}
                >
                  {playing ? <Pause /> : <Play />}
                </Button>
                <div className="flex-1">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span>{voiceType.name} · {emotion} · {tone}</span>
                    <span className="text-white/50">{Math.ceil(text.length / 12)}s · {LANGUAGES.find((l) => l.code === language)?.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 48 }, (_, i) => (
                      <div
                        key={i}
                        className={`w-1 rounded-full transition-all ${playing ? "animate-pulse" : ""}`}
                        style={{
                          height: `${10 + Math.abs(Math.sin(i * 0.5)) * 30}px`,
                          background: playing && i % 3 === 0 ? "#06B6D4" : "rgba(255,255,255,0.2)",
                        }}
                      />
                    ))}
                  </div>
                </div>
                <Button variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
                  <Download /> Download MP3
                </Button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge className="bg-[#06B6D4]/20 text-[#67e8f9]">44.1 kHz · 16-bit</Badge>
                <Badge className="bg-white/10 text-white/70">MP3 · WAV · OGG</Badge>
                <Badge className="bg-[#16A34A]/20 text-[#86efac]">✓ Ready for video sync</Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Voice Cloning */}
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles className="size-5" style={{ color: "#8B5CF6" }} /> Voice Cloning</CardTitle>
            <CardDescription className="text-white/60">Clone your own voice from a 30-second sample</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="border-[#EF4444]/40 bg-[#EF4444]/10 text-white">
              <ShieldAlert className="size-4 text-[#EF4444]" />
              <AlertDescription className="text-white/90">
                <strong className="text-[#EF4444]">Permission required:</strong> Voice cloning requires the explicit,
                documented consent of the person whose voice is being cloned. Do not clone another person's voice without authorization.
                All clones are watermarked and traceable.
              </AlertDescription>
            </Alert>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-dashed border-white/20 bg-white/5 p-6 text-center">
                <Mic className="mx-auto mb-2 size-8 text-white/40" />
                <p className="text-sm font-medium">Upload 30s+ audio sample</p>
                <p className="text-xs text-white/50">WAV or MP3, clean recording</p>
                <Button variant="outline" size="sm" className="mt-3 border-white/20 bg-transparent text-white hover:bg-white/10">
                  Browse Files
                </Button>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-6">
                <p className="mb-3 text-sm font-medium">Clone checklist:</p>
                <ul className="space-y-1.5 text-xs text-white/70">
                  <li className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-[#16A34A]" /> I have written consent</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-[#16A34A]" /> Audio is my own or authorized</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-[#16A34A]" /> I will not use it for impersonation</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-[#16A34A]" /> I understand all clones are watermarked</li>
                </ul>
                <Button className="mt-4 w-full bg-[#8B5CF6] hover:bg-[#8B5CF6]/90" disabled>
                  Start Cloning
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="rounded-xl border border-white/10 bg-gradient-to-r from-[#06B6D4]/10 to-[#6366F1]/10 p-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="font-semibold">Add this voice to a video</h3>
              <p className="text-sm text-white/60">Sync narration with your AI avatar for full production.</p>
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
