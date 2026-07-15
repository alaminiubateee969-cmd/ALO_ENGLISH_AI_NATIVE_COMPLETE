"use client";

import { useState } from "react";
import {
  Workflow, Zap, ArrowRight, Plus, Play, Pause, Trash2, CheckCircle2,
  Clock, Mail, FileText, CreditCard, Video, BookOpen, Megaphone,
  Settings,
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

const TRIGGERS = [
  { id: "blog_published", name: "Blog Published", icon: FileText, color: "#6366F1" },
  { id: "research_done", name: "Research Completed", icon: BookOpen, color: "#0EA5E9" },
  { id: "course_built", name: "Course Built", icon: BookOpen, color: "#F59E0B" },
  { id: "new_user", name: "New User Signup", icon: Mail, color: "#16A34A" },
  { id: "payment", name: "Payment Received", icon: CreditCard, color: "#E8501A" },
  { id: "new_video", name: "Video Published", icon: Video, color: "#EF4444" },
];

const ACTIONS = [
  { id: "social_post", name: "Publish to Social", icon: Megaphone, color: "#10B981" },
  { id: "create_slides", name: "Generate Presentation", icon: FileText, color: "#3B82F6" },
  { id: "create_video", name: "Generate Video", icon: Video, color: "#EF4444" },
  { id: "send_email", name: "Send Email", icon: Mail, color: "#E8501A" },
  { id: "send_receipt", name: "Send Receipt", icon: CreditCard, color: "#16A34A" },
  { id: "announce", name: "Announce on Social", icon: Megaphone, color: "#6366F1" },
];

const TEMPLATES = [
  {
    name: "Blog → Social",
    desc: "When a blog is published, post teasers to Facebook, Instagram, X & LinkedIn",
    trigger: TRIGGERS[0],
    actions: [ACTIONS[0]],
    color: "#6366F1",
  },
  {
    name: "Research → Presentation",
    desc: "When research is completed, auto-generate a slide deck",
    trigger: TRIGGERS[1],
    actions: [ACTIONS[1]],
    color: "#0EA5E9",
  },
  {
    name: "Course → Video",
    desc: "When a course is built, generate a promo video for it",
    trigger: TRIGGERS[2],
    actions: [ACTIONS[2]],
    color: "#F59E0B",
  },
  {
    name: "New User → Welcome Email",
    desc: "Send a personalized welcome email series to new signups",
    trigger: TRIGGERS[3],
    actions: [ACTIONS[3]],
    color: "#16A34A",
  },
  {
    name: "Payment → Receipt",
    desc: "Auto-send branded PDF receipt on every payment",
    trigger: TRIGGERS[4],
    actions: [ACTIONS[4]],
    color: "#E8501A",
  },
  {
    name: "New Video → Social Announcement",
    desc: "When a video is published, announce across all social channels",
    trigger: TRIGGERS[5],
    actions: [ACTIONS[5]],
    color: "#EF4444",
  },
];

const EXECUTION_HISTORY = [
  { workflow: "Blog → Social", time: "2 min ago", status: "Success", duration: "8.4s" },
  { workflow: "New User → Welcome Email", time: "12 min ago", status: "Success", duration: "1.2s" },
  { workflow: "Payment → Receipt", time: "31 min ago", status: "Success", duration: "0.8s" },
  { workflow: "Course → Video", time: "1 hour ago", status: "Failed", duration: "—" },
  { workflow: "Blog → Social", time: "3 hours ago", status: "Success", duration: "7.9s" },
  { workflow: "Research → Presentation", time: "5 hours ago", status: "Success", duration: "12.3s" },
];

export default function WorkflowAutomation({ navigate }: Nav) {
  const [activeFlows, setActiveFlows] = useState(TEMPLATES.map((t, i) => ({ ...t, id: `wf${i}`, active: i < 4 })));
  const [history] = useState(EXECUTION_HISTORY);
  const [showBuilder, setShowBuilder] = useState(false);
  const [builder, setBuilder] = useState({ name: "", trigger: TRIGGERS[0].id, actions: [ACTIONS[0].id] });

  const toggleActive = (id: string) => {
    setActiveFlows((prev) => prev.map((f) => (f.id === id ? { ...f, active: !f.active } : f)));
  };

  const removeFlow = (id: string) => {
    setActiveFlows((prev) => prev.filter((f) => f.id !== id));
  };

  const addFromTemplate = (template: typeof TEMPLATES[0]) => {
    setActiveFlows((prev) => [
      { ...template, id: `wf${Date.now()}`, active: true },
      ...prev,
    ]);
  };

  const saveBuilder = () => {
    if (!builder.name.trim()) return;
    const trig = TRIGGERS.find((t) => t.id === builder.trigger)!;
    const acts = builder.actions.map((id) => ACTIONS.find((a) => a.id === id)!).filter(Boolean);
    setActiveFlows((prev) => [
      { name: builder.name, desc: "Custom workflow", trigger: trig, actions: acts, color: "#6366F1", id: `wf${Date.now()}`, active: true },
      ...prev,
    ]);
    setBuilder({ name: "", trigger: TRIGGERS[0].id, actions: [ACTIONS[0].id] });
    setShowBuilder(false);
  };

  return (
    <div className="min-h-screen bg-[#0F172A] p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-xl bg-[#6366F1]">
              <Workflow className="size-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">AI Workflow Automation</h1>
              <p className="text-white/60">Chain AI tasks into automated pipelines</p>
            </div>
          </div>
          <Button className="bg-[#6366F1] hover:bg-[#6366F1]/90" onClick={() => setShowBuilder(!showBuilder)}>
            <Plus /> {showBuilder ? "Cancel" : "Build Workflow"}
          </Button>
        </div>

        {/* Builder */}
        {showBuilder && (
          <Card className="border-white/10 bg-white/5 text-white">
            <CardHeader>
              <CardTitle>Workflow Builder</CardTitle>
              <CardDescription className="text-white/60">Trigger → Steps → Output</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Workflow Name</Label>
                <Input
                  className="border-white/10 bg-white/5"
                  placeholder="e.g. New Course Promo"
                  value={builder.name}
                  onChange={(e) => setBuilder({ ...builder, name: e.target.value })}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><Zap className="size-3.5 text-[#E8501A]" /> Trigger</Label>
                  <Select value={builder.trigger} onValueChange={(v) => setBuilder({ ...builder, trigger: v })}>
                    <SelectTrigger className="w-full border-white/10 bg-white/5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TRIGGERS.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Actions</Label>
                  <div className="space-y-2">
                    {ACTIONS.map((a) => {
                      const selected = builder.actions.includes(a.id);
                      return (
                        <button
                          key={a.id}
                          onClick={() => {
                            setBuilder((b) => ({
                              ...b,
                              actions: selected ? b.actions.filter((x) => x !== a.id) : [...b.actions, a.id],
                            }));
                          }}
                          className={`flex w-full items-center gap-2 rounded-lg border p-2 text-sm transition ${
                            selected ? "border-[#6366F1] bg-[#6366F1]/10" : "border-white/10 bg-white/5 hover:bg-white/10"
                          }`}
                        >
                          {selected ? <CheckCircle2 className="size-4 text-[#6366F1]" /> : <div className="size-4 rounded-full border border-white/20" />}
                          <a.icon className="size-4" style={{ color: a.color }} />
                          {a.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-white/10 bg-[#0F172A] p-4">
                <p className="mb-3 text-xs font-semibold uppercase text-white/50">Pipeline Preview</p>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="rounded-lg border border-[#E8501A]/40 bg-[#E8501A]/10 px-3 py-2 text-sm">
                    <Zap className="mr-1 inline size-3.5" /> {TRIGGERS.find((t) => t.id === builder.trigger)?.name}
                  </div>
                  {builder.actions.map((aid) => {
                    const a = ACTIONS.find((x) => x.id === aid)!;
                    return (
                      <div key={aid} className="flex items-center gap-2">
                        <ArrowRight className="size-4 text-white/40" />
                        <div className="rounded-lg border border-[#6366F1]/40 bg-[#6366F1]/10 px-3 py-2 text-sm">
                          <a.icon className="mr-1 inline size-3.5" style={{ color: a.color }} /> {a.name}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setShowBuilder(false)}>Cancel</Button>
                <Button className="bg-[#E8501A] hover:bg-[#E8501A]/90" onClick={saveBuilder}><CheckCircle2 /> Save Workflow</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Templates */}
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/60">Workflow Templates</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {TEMPLATES.map((t) => (
              <Card key={t.name} className="border-white/10 bg-white/5 text-white">
                <CardContent>
                  <div className="mb-3 flex items-center gap-2">
                    <div
                      className="flex size-9 items-center justify-center rounded-lg"
                      style={{ background: `${t.color}20`, color: t.color }}
                    >
                      <t.trigger.icon className="size-4" />
                    </div>
                    <h3 className="font-semibold">{t.name}</h3>
                  </div>
                  <p className="mb-3 text-xs text-white/60">{t.desc}</p>
                  <div className="mb-3 flex flex-wrap items-center gap-1">
                    <Badge variant="outline" className="border-[#E8501A]/40 text-[#fdba74] text-[10px]">{t.trigger.name}</Badge>
                    {t.actions.map((a) => (
                      <Badge key={a.id} variant="outline" className="border-[#6366F1]/40 text-[#a5b4fc] text-[10px]">{a.name}</Badge>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" className="w-full border-white/20 bg-transparent text-white hover:bg-white/10" onClick={() => addFromTemplate(t)}>
                    <Plus /> Add Workflow
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Active workflows */}
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <CardTitle>Active Workflows ({activeFlows.length})</CardTitle>
            <CardDescription className="text-white/60">
              {activeFlows.filter((f) => f.active).length} active · {activeFlows.filter((f) => !f.active).length} paused
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeFlows.map((f) => (
              <div key={f.id} className="rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-1 items-center gap-3">
                    <div
                      className="flex size-10 items-center justify-center rounded-lg"
                      style={{ background: `${f.color}20`, color: f.color }}
                    >
                      <f.trigger.icon className="size-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{f.name}</p>
                      <p className="text-xs text-white/50">{f.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={
                        f.active
                          ? "bg-[#16A34A]/20 text-[#86efac]"
                          : "bg-white/10 text-white/50"
                      }
                    >
                      {f.active ? "Active" : "Paused"}
                    </Badge>
                    <Button size="icon" variant="ghost" onClick={() => toggleActive(f.id)}>
                      {f.active ? <Pause className="size-4" /> : <Play className="size-4" />}
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => removeFlow(f.id)}>
                      <Trash2 className="size-4 text-red-400" />
                    </Button>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 rounded-md bg-[#0F172A] p-3">
                  <Badge variant="outline" className="border-[#E8501A]/40 text-[#fdba74]">
                    <Zap className="size-3" /> {f.trigger.name}
                  </Badge>
                  {f.actions.map((a, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <ArrowRight className="size-3 text-white/40" />
                      <Badge variant="outline" className="border-[#6366F1]/40 text-[#a5b4fc]">
                        <a.icon className="size-3" /> {a.name}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Execution history */}
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Clock className="size-5" style={{ color: "#0EA5E9" }} /> Execution History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {history.map((h, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3 text-sm">
                  <div className="flex items-center gap-3">
                    <div className={`flex size-8 items-center justify-center rounded-full ${h.status === "Success" ? "bg-[#16A34A]/20" : "bg-[#EF4444]/20"}`}>
                      {h.status === "Success" ? <CheckCircle2 className="size-4 text-[#16A34A]" /> : <Settings className="size-4 text-[#EF4444]" />}
                    </div>
                    <div>
                      <p className="font-medium">{h.workflow}</p>
                      <p className="text-xs text-white/50">{h.time} · {h.duration}</p>
                    </div>
                  </div>
                  <Badge
                    className={
                      h.status === "Success"
                        ? "bg-[#16A34A]/20 text-[#86efac]"
                        : "bg-[#EF4444]/20 text-[#fca5a5]"
                    }
                  >
                    {h.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="rounded-xl border border-white/10 bg-gradient-to-r from-[#6366F1]/10 to-[#E8501A]/10 p-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="font-semibold">Track every workflow run</h3>
              <p className="text-sm text-white/60">See success rates, durations & failures in real time.</p>
            </div>
            <Button variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10" onClick={() => navigate("analytics")}>
              View Analytics
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
