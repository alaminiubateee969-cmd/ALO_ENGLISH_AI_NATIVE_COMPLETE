"use client";

import { useState } from "react";
import {
  Sparkles, ArrowRight, Bot, Globe, Layers, Zap, ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MODULES, type ModuleId } from "./module-registry";

type Nav = { navigate: (id: ModuleId) => void };

const STATS = [
  { label: "Modules", value: "15", icon: Layers },
  { label: "AI Agents", value: "Unlimited", icon: Bot },
  { label: "Languages", value: "6", icon: Globe },
  { label: "Social Platforms", value: "13+", icon: Zap },
];

const FEATURES = [
  {
    icon: Sparkles,
    title: "One Platform, Every Workflow",
    desc: "Agents, research, education, content creation, and automation unified in a single OS.",
    color: "#6366F1",
  },
  {
    icon: Bot,
    title: "Unlimited AI Agents",
    desc: "Design custom AI agents with unique personalities, voices, knowledge bases & tools.",
    color: "#E8501A",
  },
  {
    icon: Globe,
    title: "Truly Multilingual",
    desc: "English, Bangla, Arabic, Hindi, Spanish & French — built for global learners.",
    color: "#0EA5E9",
  },
  {
    icon: ShieldCheck,
    title: "Enterprise-Ready",
    desc: "Role-based access, audit logs, API keys & governance baked in from day one.",
    color: "#16A34A",
  },
];

const CATEGORIES = ["Core", "Create", "Automate", "Manage"];

export default function Home({ navigate }: Nav) {
  const [activeCat, setActiveCat] = useState<string>("All");
  const filtered = activeCat === "All" ? MODULES : MODULES.filter((m) => m.category === activeCat);

  return (
    <div className="min-h-screen bg-[#0F172A] text-white">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(60% 50% at 50% 0%, #6366F1 0%, transparent 70%), radial-gradient(40% 40% at 80% 30%, #E8501A 0%, transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-6 py-20 lg:py-28">
          <div className="flex flex-col items-center text-center">
            <Badge className="mb-6 border-white/20 bg-white/10 text-white backdrop-blur">
              <Sparkles className="size-3" /> ALO Labs AgentOS
            </Badge>
            <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              AI Education, Research
              <br />
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: "linear-gradient(90deg,#6366F1,#E8501A)" }}
              >
                & Media OS
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-white/70">
              One platform. Unlimited AI agents. Endless possibilities.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button
                size="lg"
                className="bg-[#6366F1] hover:bg-[#6366F1]/90"
                onClick={() => navigate("agents")}
              >
                <Bot /> Create AI Agent
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                onClick={() => document.getElementById("modules")?.scrollIntoView({ behavior: "smooth" })}
              >
                Explore Modules <ArrowRight />
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {STATS.map((s) => (
              <Card key={s.label} className="border-white/10 bg-white/5 text-white backdrop-blur">
                <CardContent className="flex items-center gap-4">
                  <div
                    className="flex size-12 items-center justify-center rounded-xl"
                    style={{ background: "linear-gradient(135deg,#6366F1,#E8501A)" }}
                  >
                    <s.icon className="size-6 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{s.value}</div>
                    <div className="text-sm text-white/60">{s.label}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Modules Grid */}
      <section id="modules" className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">15 Modules. One OS.</h2>
            <p className="mt-1 text-white/60">Click any module to launch its workspace.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {["All", ...CATEGORIES].map((c) => (
              <button
                key={c}
                onClick={() => setActiveCat(c)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  activeCat === c
                    ? "bg-[#6366F1] text-white"
                    : "bg-white/5 text-white/70 hover:bg-white/10"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m) => {
            const Icon = m.icon as LucideIcon;
            return (
              <button
                key={m.id}
                onClick={() => navigate(m.id)}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 text-left transition-all hover:-translate-y-1 hover:border-white/20 hover:bg-white/10"
              >
                <div
                  className="absolute -right-8 -top-8 size-32 rounded-full opacity-10 blur-2xl transition-opacity group-hover:opacity-30"
                  style={{ background: m.color }}
                />
                <div
                  className="mb-4 flex size-12 items-center justify-center rounded-xl"
                  style={{ background: `${m.color}20`, color: m.color }}
                >
                  <Icon className="size-6" />
                </div>
                <div className="mb-1 flex items-center gap-2">
                  <h3 className="font-semibold text-white">{m.name}</h3>
                  <Badge variant="outline" className="border-white/20 text-[10px] text-white/60">
                    {m.category}
                  </Badge>
                </div>
                <p className="text-sm text-white/60">{m.desc}</p>
                <div className="mt-4 flex items-center gap-1 text-sm font-medium" style={{ color: m.color }}>
                  Launch module <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">Why teams choose ALO OS</h2>
            <p className="mt-2 text-white/60">A complete AI operating system — not a patchwork of disconnected tools.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => {
              const Icon = f.icon as LucideIcon;
              return (
                <Card key={f.title} className="border-white/10 bg-white/5 text-white">
                  <CardContent>
                    <div
                      className="mb-4 flex size-12 items-center justify-center rounded-xl"
                      style={{ background: `${f.color}20`, color: f.color }}
                    >
                      <Icon className="size-6" />
                    </div>
                    <h3 className="mb-2 font-semibold">{f.title}</h3>
                    <p className="text-sm text-white/60">{f.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/10">
        <div className="mx-auto max-w-5xl px-6 py-20 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Ready to build your <span style={{ color: "#E8501A" }}>AI workforce</span>?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-white/70">
            Spin up your first AI agent in under 60 seconds. Generate courses, videos, presentations & social campaigns automatically.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" className="bg-[#E8501A] hover:bg-[#E8501A]/90" onClick={() => navigate("agents")}>
              <Bot /> Start Building Agents
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/20 bg-white/5 text-white hover:bg-white/10"
              onClick={() => navigate("analytics")}
            >
              View Analytics
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
