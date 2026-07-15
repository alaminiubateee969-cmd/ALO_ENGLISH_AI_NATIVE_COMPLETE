"use client";

import { useState } from "react";
import {
  BookOpen, FlaskConical, Microscope, BarChart3, FileText, Lightbulb,
  Quote, Play, CheckCircle2, Circle, ChevronRight, Plus,
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

const STAGES = [
  { id: "topic", name: "Topic", icon: Lightbulb },
  { id: "lit", name: "Literature Review", icon: BookOpen },
  { id: "gap", name: "Gap Analysis", icon: FlaskConical },
  { id: "proposal", name: "Proposal", icon: FileText },
  { id: "method", name: "Methodology", icon: Microscope },
  { id: "stats", name: "Statistics", icon: BarChart3 },
  { id: "refs", name: "References", icon: Quote },
  { id: "review", name: "Paper Review", icon: CheckCircle2 },
  { id: "pres", name: "Presentation", icon: Play },
];

const AGENTS = [
  { name: "Research Director", role: "Orchestrates the entire research workflow", icon: "🎯" },
  { name: "Literature Review Agent", role: "Searches & summarizes academic papers", icon: "📚" },
  { name: "Gap Analysis Agent", role: "Identifies research gaps & opportunities", icon: "🔍" },
  { name: "Methodology Agent", role: "Designs experiments & data collection", icon: "🧪" },
  { name: "Statistics Expert", role: "Runs analyses: ANOVA, regression, t-tests", icon: "📊" },
  { name: "Citation Agent", role: "Manages references in APA/MLA/IEEE", icon: "📑" },
];

const SAMPLE_REFS = [
  { id: 1, citation: "Vaswani, A. et al. (2017). Attention Is All You Need. NeurIPS.", type: "Conference" },
  { id: 2, citation: "Brown, T. et al. (2020). Language Models are Few-Shot Learners. NeurIPS.", type: "Conference" },
  { id: 3, citation: "Devlin, J. et al. (2019). BERT: Pre-training of Deep Bidirectional Transformers. NAACL.", type: "Conference" },
  { id: 4, citation: "Goodfellow, I. et al. (2016). Deep Learning. MIT Press.", type: "Book" },
  { id: 5, citation: "LeCun, Y., Bengio, Y., Hinton, G. (2015). Deep Learning. Nature, 521, 436-444.", type: "Journal" },
];

const MOCK_OUTPUTS: Record<string, string> = {
  topic: "Research Topic: Evaluating the impact of multimodal AI tutors on K-12 student engagement and learning outcomes in STEM subjects.",
  lit: "Literature Review: A synthesis of 142 peer-reviewed papers (2018-2024) reveals three dominant themes: (1) adaptive difficulty pacing, (2) affective computing for engagement detection, and (3) multimodal feedback loops. Key works span Vaswani et al. (2017), Brown et al. (2020), and recent longitudinal classroom studies by the Stanford CRAFT lab.",
  gap: "Gap Analysis: Existing research focuses heavily on adult learners and short-term interventions. Three gaps identified: (a) limited studies on K-5 multimodal tutors, (b) absence of culturally adaptive content for non-English speakers, (c) no standardized engagement metric across studies.",
  proposal: "Proposal: We propose a 24-week mixed-methods study with 480 students across 8 schools evaluating ALO Tutor against a control. Hypotheses: (H1) multimodal feedback increases engagement by ≥20%, (H2) culturally adaptive content reduces dropout, (H3) parental involvement amplifies gains.",
  method: "Methodology: Mixed-methods RCT. Quantitative: pre/post tests, time-on-task, engagement telemetry. Qualitative: student interviews, teacher observations. Sample: N=480, stratified by grade (3-8). Duration: 24 weeks. Analysis: ANCOVA, multilevel modeling, thematic coding.",
  stats: "Statistical Plan: Primary outcome — engagement score (0-100). Power analysis: N=480 achieves 0.85 power for d=0.25 at α=0.05. Planned analyses: paired t-test (pre/post), ANCOVA (treatment vs control), multilevel regression with random school effects. Software: R 4.4 + lme4.",
  refs: "References: 5 sources loaded in APA 7th format. Auto-managed by Citation Agent. Full bibliography attached in references panel.",
  review: "Paper Review: Structure conforms to APA empirical report standards. Abstract (248 words), Introduction (4 paragraphs), Methods (5 subsections), Results, Discussion. Reviewer checklist: 18/20 items passed. Suggested revisions: strengthen threats-to-validity section, add effect sizes.",
  pres: "Presentation: 14-slide deck outline generated. Speaker notes drafted. Suggested visuals: RCT flow diagram, engagement boxplots, thematic network map. Ready for export to Presentation Studio.",
};

export default function Research({ navigate }: Nav) {
  const [topic, setTopic] = useState("");
  const [activeStage, setActiveStage] = useState("topic");
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [selectedAgent, setSelectedAgent] = useState(AGENTS[0].name);
  const [refs, setRefs] = useState(SAMPLE_REFS);
  const [newRef, setNewRef] = useState("");
  const [running, setRunning] = useState(false);

  const runStage = () => {
    setRunning(true);
    setTimeout(() => {
      setCompleted((prev) => new Set([...prev, activeStage]));
      setRunning(false);
    }, 1200);
  };

  const addRef = () => {
    if (!newRef.trim()) return;
    setRefs((prev) => [...prev, { id: Date.now(), citation: newRef, type: "Manual" }]);
    setNewRef("");
  };

  const currentIndex = STAGES.findIndex((s) => s.id === activeStage);

  return (
    <div className="min-h-screen bg-[#0F172A] p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-[#0EA5E9]">
            <BookOpen className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">AI Research Center</h1>
            <p className="text-white/60">From idea to publication — a 9-stage AI research workflow</p>
          </div>
        </div>

        {/* Topic input */}
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <CardTitle>Research Topic</CardTitle>
            <CardDescription className="text-white/60">Define your research question to kick off the workflow.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              className="border-white/10 bg-white/5"
              placeholder="e.g. Impact of multimodal AI tutors on K-12 STEM engagement..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Label className="text-white/70">Lead Agent</Label>
                <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                  <SelectTrigger className="w-64 border-white/10 bg-white/5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AGENTS.map((a) => <SelectItem key={a.name} value={a.name}>{a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button className="bg-[#6366F1] hover:bg-[#6366F1]/90" onClick={runStage} disabled={running}>
                {running ? "Running..." : "Run Stage"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Workflow Stages */}
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <CardTitle>Research Workflow</CardTitle>
            <CardDescription className="text-white/60">
              {completed.size} of {STAGES.length} stages completed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={(completed.size / STAGES.length) * 100} className="mb-4" />
            <div className="flex flex-wrap gap-2">
              {STAGES.map((s, i) => {
                const Icon = s.icon;
                const done = completed.has(s.id);
                const active = activeStage === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveStage(s.id)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                      active
                        ? "border-[#6366F1] bg-[#6366F1]/20"
                        : done
                        ? "border-[#16A34A]/40 bg-[#16A34A]/10"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    {done ? <CheckCircle2 className="size-4 text-[#16A34A]" /> : <Circle className="size-4 text-white/40" />}
                    <Icon className="size-4" />
                    <span>{s.name}</span>
                    {i < STAGES.length - 1 && <ChevronRight className="size-3 text-white/30" />}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Stage Output */}
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {(() => {
                  const Icon = STAGES[currentIndex].icon;
                  return <Icon className="size-5" style={{ color: "#6366F1" }} />;
                })()}
                {STAGES[currentIndex].name} — Output
              </CardTitle>
              <Button size="sm" variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10" onClick={runStage} disabled={running}>
                {running ? "Generating..." : "Regenerate"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-white/10 bg-[#0F172A] p-4">
              <p className="text-sm leading-relaxed text-white/80">
                {topic || MOCK_OUTPUTS[activeStage]}
              </p>
              {!topic && <p className="mt-4 text-xs text-white/40">{MOCK_OUTPUTS[activeStage]}</p>}
              {topic && <p className="mt-4 text-xs text-white/40">{MOCK_OUTPUTS[activeStage]}</p>}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Agents */}
          <Card className="border-white/10 bg-white/5 text-white">
            <CardHeader>
              <CardTitle>Specialized Research Agents</CardTitle>
              <CardDescription className="text-white/60">Each stage is powered by a domain expert.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {AGENTS.map((a) => (
                <div
                  key={a.name}
                  className={`flex items-center gap-3 rounded-lg border p-3 transition ${
                    selectedAgent === a.name
                      ? "border-[#6366F1] bg-[#6366F1]/10"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <span className="text-2xl">{a.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium">{a.name}</div>
                    <div className="text-xs text-white/60">{a.role}</div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedAgent(a.name)}>
                    Select
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Reference Manager */}
          <Card className="border-white/10 bg-white/5 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Quote className="size-5" /> Reference Manager</CardTitle>
              <CardDescription className="text-white/60">{refs.length} citations · APA 7th edition</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  className="border-white/10 bg-white/5"
                  placeholder="Paste a citation..."
                  value={newRef}
                  onChange={(e) => setNewRef(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addRef()}
                />
                <Button className="bg-[#E8501A] hover:bg-[#E8501A]/90" onClick={addRef}><Plus /></Button>
              </div>
              <div className="max-h-80 space-y-2 overflow-y-auto">
                {refs.map((r) => (
                  <div key={r.id} className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm">
                    <div className="mb-1 flex items-center justify-between">
                      <Badge variant="outline" className="border-white/20 text-[10px] text-white/60">{r.type}</Badge>
                      <Button size="icon" variant="ghost" className="size-6" onClick={() => setRefs((p) => p.filter((x) => x.id !== r.id))}>
                        <span className="text-xs text-white/40">✕</span>
                      </Button>
                    </div>
                    <p className="text-white/80">{r.citation}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="rounded-xl border border-white/10 bg-gradient-to-r from-[#0EA5E9]/10 to-[#6366F1]/10 p-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="font-semibold">Turn your research into a presentation</h3>
              <p className="text-sm text-white/60">Export the final stage directly into Presentation Studio.</p>
            </div>
            <Button variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10" onClick={() => navigate("presentation")}>
              Open Presentation Studio
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
