"use client";

import { useState } from "react";
import {
  Bot, Plus, Trash2, Pencil, Upload, Brain, Wrench, Heart, Mic, Globe,
  Sparkles, Search, X,
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
import type { ModuleId } from "./module-registry";

type Nav = { navigate: (id: ModuleId) => void };

type Agent = {
  id: string;
  name: string;
  role: string;
  personality: string;
  systemPrompt: string;
  language: string;
  voice: string;
  emotion: string;
  speakingStyle: string;
  tools: string[];
};

const ROLES = ["Family", "Education", "Research", "Business"];
const LANGUAGES = [
  { code: "EN", name: "English" },
  { code: "BN", name: "Bangla" },
  { code: "AR", name: "Arabic" },
  { code: "HI", name: "Hindi" },
  { code: "ES", name: "Spanish" },
  { code: "FR", name: "French" },
];
const VOICES = ["Warm Female", "Calm Male", "Energetic Youth", "Storyteller", "Professional"];
const EMOTIONS = ["Neutral", "Friendly", "Enthusiastic", "Compassionate", "Authoritative"];
const SPEAKING_STYLES = ["Conversational", "Formal", "Storytelling", "Lecture", "Coaching"];

const TEMPLATES: { name: string; role: string; icon: string; color: string; desc: string }[] = [
  { name: "Mother", role: "Family", icon: "👩", color: "#EC4899", desc: "Nurturing, patient, full of warmth & life advice" },
  { name: "Father", role: "Family", icon: "👨", color: "#3B82F6", desc: "Steady guidance, discipline & dad jokes" },
  { name: "Baby", role: "Family", icon: "👶", color: "#F472B6", desc: "Curious toddler learning language & world" },
  { name: "Teacher", role: "Education", icon: "👩‍🏫", color: "#16A34A", desc: "Patient K-12 tutor with adaptive explanations" },
  { name: "Professor", role: "Education", icon: "🧑‍🎓", color: "#6366F1", desc: "University-level academic mentor" },
  { name: "Research Director", role: "Research", icon: "🔬", color: "#0EA5E9", desc: "PhD-level research planning & peer review" },
  { name: "CEO", role: "Business", icon: "💼", color: "#E8501A", desc: "Strategic leadership & board-level advice" },
  { name: "Marketing Lead", role: "Business", icon: "📣", color: "#F59E0B", desc: "Campaign strategist & brand voice expert" },
];

const TOOL_OPTIONS = ["Web Search", "Code Execution", "Image Generation", "File Analysis", "Calendar", "Email", "Database", "Calculator"];

const INITIAL_AGENTS: Agent[] = [
  {
    id: "a1",
    name: "Dr. Aria",
    role: "Education",
    personality: "Patient, encouraging, scholarly",
    systemPrompt: "You are Dr. Aria, a university professor. Explain concepts clearly with examples and analogies.",
    language: "EN",
    voice: "Calm Male",
    emotion: "Friendly",
    speakingStyle: "Lecture",
    tools: ["Web Search", "Code Execution"],
  },
  {
    id: "a2",
    name: "Ma",
    role: "Family",
    personality: "Warm, loving, supportive",
    systemPrompt: "You are Ma — a caring Bengali mother. Speak with warmth in Bangla or English.",
    language: "BN",
    voice: "Warm Female",
    emotion: "Compassionate",
    speakingStyle: "Conversational",
    tools: ["Calendar"],
  },
];

export default function Agents({ navigate }: Nav) {
  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Agent, "id">>({
    name: "",
    role: "Education",
    personality: "",
    systemPrompt: "",
    language: "EN",
    voice: "Warm Female",
    emotion: "Friendly",
    speakingStyle: "Conversational",
    tools: [],
  });

  const resetForm = () => {
    setForm({
      name: "",
      role: "Education",
      personality: "",
      systemPrompt: "",
      language: "EN",
      voice: "Warm Female",
      emotion: "Friendly",
      speakingStyle: "Conversational",
      tools: [],
    });
    setEditingId(null);
    setShowForm(false);
  };

  const saveAgent = () => {
    if (!form.name.trim()) return;
    if (editingId) {
      setAgents((prev) => prev.map((a) => (a.id === editingId ? { ...a, ...form } : a)));
    } else {
      setAgents((prev) => [...prev, { ...form, id: `a${Date.now()}` }]);
    }
    resetForm();
  };

  const editAgent = (a: Agent) => {
    setForm(a);
    setEditingId(a.id);
    setShowForm(true);
  };

  const deleteAgent = (id: string) => setAgents((prev) => prev.filter((a) => a.id !== id));

  const toggleTool = (t: string) =>
    setForm((f) => ({
      ...f,
      tools: f.tools.includes(t) ? f.tools.filter((x) => x !== t) : [...f.tools, t],
    }));

  const filtered = agents.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#0F172A] p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-xl bg-[#6366F1]">
                <Bot className="size-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold sm:text-3xl">AI Agent Center</h1>
                <p className="text-white/60">Design, manage & deploy unlimited AI agents</p>
              </div>
            </div>
          </div>
          <Button className="bg-[#6366F1] hover:bg-[#6366F1]/90" onClick={() => { resetForm(); setShowForm(true); }}>
            <Plus /> New Agent
          </Button>
        </div>

        {/* Templates */}
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/60">Pre-built Templates</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {TEMPLATES.map((t) => (
              <button
                key={t.name}
                onClick={() => {
                  setForm((f) => ({ ...f, name: t.name, role: t.role, personality: t.desc }));
                  setEditingId(null);
                  setShowForm(true);
                }}
                className="group rounded-xl border border-white/10 bg-white/5 p-4 text-left transition-all hover:border-white/20 hover:bg-white/10"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-3xl">{t.icon}</span>
                  <Badge variant="outline" className="border-white/20 text-[10px]" style={{ color: t.color }}>
                    {t.role}
                  </Badge>
                </div>
                <h3 className="font-semibold">{t.name}</h3>
                <p className="mt-1 text-xs text-white/60">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Form Dialog */}
        {showForm && (
          <Card className="border-white/10 bg-white/5 text-white">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{editingId ? "Edit Agent" : "Create New Agent"}</CardTitle>
                  <CardDescription className="text-white/60">
                    Configure personality, voice, knowledge & tools.
                  </CardDescription>
                </div>
                <Button size="icon" variant="ghost" onClick={resetForm}>
                  <X className="size-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  className="border-white/10 bg-white/5"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Dr. Aria"
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger className="border-white/10 bg-white/5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Personality</Label>
                <Input
                  className="border-white/10 bg-white/5"
                  value={form.personality}
                  onChange={(e) => setForm({ ...form, personality: e.target.value })}
                  placeholder="Warm, scholarly, witty..."
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="flex items-center gap-1"><Brain className="size-3.5" /> System Prompt</Label>
                <Textarea
                  className="border-white/10 bg-white/5 min-h-24"
                  value={form.systemPrompt}
                  onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })}
                  placeholder="You are a... Your role is to... Always..."
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><Globe className="size-3.5" /> Language</Label>
                <Select value={form.language} onValueChange={(v) => setForm({ ...form, language: v })}>
                  <SelectTrigger className="border-white/10 bg-white/5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((l) => <SelectItem key={l.code} value={l.code}>{l.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><Mic className="size-3.5" /> Voice Type</Label>
                <Select value={form.voice} onValueChange={(v) => setForm({ ...form, voice: v })}>
                  <SelectTrigger className="border-white/10 bg-white/5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {VOICES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><Heart className="size-3.5" /> Emotion</Label>
                <Select value={form.emotion} onValueChange={(v) => setForm({ ...form, emotion: v })}>
                  <SelectTrigger className="border-white/10 bg-white/5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EMOTIONS.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Speaking Style</Label>
                <Select value={form.speakingStyle} onValueChange={(v) => setForm({ ...form, speakingStyle: v })}>
                  <SelectTrigger className="border-white/10 bg-white/5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SPEAKING_STYLES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Avatar Image</Label>
                <div className="flex items-center gap-3 rounded-lg border border-dashed border-white/20 bg-white/5 p-4">
                  <Upload className="size-5 text-white/40" />
                  <span className="text-sm text-white/60">Drop image or click to upload</span>
                  <Button variant="outline" size="sm" className="ml-auto border-white/20 bg-transparent text-white hover:bg-white/10">
                    Browse
                  </Button>
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Knowledge Base (paste docs, URLs or text)</Label>
                <Textarea
                  className="border-white/10 bg-white/5"
                  placeholder="Add reference material the agent should know..."
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="flex items-center gap-1"><Wrench className="size-3.5" /> Tools</Label>
                <div className="flex flex-wrap gap-2">
                  {TOOL_OPTIONS.map((t) => {
                    const active = form.tools.includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => toggleTool(t)}
                        className={`rounded-full border px-3 py-1 text-xs transition ${
                          active
                            ? "border-[#6366F1] bg-[#6366F1] text-white"
                            : "border-white/20 bg-white/5 text-white/70 hover:bg-white/10"
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex justify-end gap-2 md:col-span-2">
                <Button variant="ghost" onClick={resetForm}>Cancel</Button>
                <Button className="bg-[#E8501A] hover:bg-[#E8501A]/90" onClick={saveAgent}>
                  <Sparkles /> {editingId ? "Update" : "Create"} Agent
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* My Agents */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white/60">My Agents ({agents.length})</h2>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" />
              <Input
                className="border-white/10 bg-white/5 pl-9"
                placeholder="Search agents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((a) => (
              <Card key={a.id} className="border-white/10 bg-white/5 text-white">
                <CardContent>
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex size-12 items-center justify-center rounded-full text-xl font-bold"
                        style={{ background: "linear-gradient(135deg,#6366F1,#E8501A)" }}
                      >
                        {a.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold">{a.name}</h3>
                        <Badge variant="outline" className="border-white/20 text-[10px]">{a.role}</Badge>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => editAgent(a)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => deleteAgent(a.id)}>
                        <Trash2 className="size-4 text-red-400" />
                      </Button>
                    </div>
                  </div>
                  <p className="mb-3 text-xs text-white/60">{a.personality || "—"}</p>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge className="bg-[#6366F1]/20 text-[#a5b4fc]">{a.language}</Badge>
                    <Badge className="bg-[#E8501A]/20 text-[#fdba74]">{a.voice}</Badge>
                    <Badge className="bg-white/10 text-white/70">{a.emotion}</Badge>
                  </div>
                  {a.tools.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {a.tools.map((t) => (
                        <span key={t} className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-white/50">{t}</span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="rounded-xl border border-dashed border-white/10 p-12 text-center text-white/50">
              No agents found. Create your first one above.
            </div>
          )}
        </div>

        <div className="rounded-xl border border-white/10 bg-gradient-to-r from-[#6366F1]/10 to-[#E8501A]/10 p-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="font-semibold">Want your agents to produce content?</h3>
              <p className="text-sm text-white/60">Connect agents to the Course, Video & Marketing modules.</p>
            </div>
            <Button variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10" onClick={() => navigate("workflow")}>
              Build Workflow
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
