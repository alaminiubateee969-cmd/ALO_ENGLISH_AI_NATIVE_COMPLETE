"use client";

import { useState } from "react";
import {
  BarChart3, Bot, FileText, Video, Share2, BookOpen, Users, TrendingUp,
  TrendingDown, Clock, Heart, MessageCircle, Eye, ArrowUpRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ModuleId } from "./module-registry";

type Nav = { navigate: (id: ModuleId) => void };

const KPIS = [
  { label: "Total Agents", value: "248", change: "+12%", trend: "up", icon: Bot, color: "#6366F1" },
  { label: "Content Generated", value: "3,847", change: "+24%", trend: "up", icon: FileText, color: "#E8501A" },
  { label: "Videos Created", value: "612", change: "+8%", trend: "up", icon: Video, color: "#EF4444" },
  { label: "Social Posts", value: "9,231", change: "+34%", trend: "up", icon: Share2, color: "#10B981" },
  { label: "Courses Built", value: "184", change: "+5%", trend: "up", icon: BookOpen, color: "#F59E0B" },
  { label: "Active Users", value: "12.4K", change: "-3%", trend: "down", icon: Users, color: "#0EA5E9" },
];

const CONTENT_BY_TYPE = [
  { type: "Blog Posts", count: 1240, color: "#6366F1" },
  { type: "Social Posts", count: 9231, color: "#10B981" },
  { type: "Videos", count: 612, color: "#EF4444" },
  { type: "Courses", count: 184, color: "#F59E0B" },
  { type: "Presentations", count: 412, color: "#3B82F6" },
  { type: "Images", count: 2167, color: "#F97316" },
];

const USAGE_DATA = [
  { day: "Mon", value: 65 },
  { day: "Tue", value: 78 },
  { day: "Wed", value: 92 },
  { day: "Thu", value: 71 },
  { day: "Fri", value: 88 },
  { day: "Sat", value: 54 },
  { day: "Sun", value: 42 },
];

const PLATFORM_ENGAGEMENT = [
  { name: "Facebook", value: 78, color: "#1877F2" },
  { name: "Instagram", value: 92, color: "#E4405F" },
  { name: "YouTube", value: 85, color: "#FF0000" },
  { name: "LinkedIn", value: 64, color: "#0A66C2" },
  { name: "X", value: 58, color: "#1DA1F2" },
  { name: "Telegram", value: 47, color: "#0088CC" },
];

const TOP_CONTENT = [
  { title: "10-Min Machine Learning Explainer", type: "Video", views: "24.5K", engagement: "8.2%", trend: "up" },
  { title: "How AI Tutors Adapt to Every Learner", type: "Blog", views: "18.9K", engagement: "6.4%", trend: "up" },
  { title: "Python for Beginners — Full Course", type: "Course", views: "15.2K", engagement: "9.1%", trend: "up" },
  { title: "Parenting in the AI Age", type: "Social Post", views: "12.7K", engagement: "5.8%", trend: "down" },
  { title: "Research Workflow Demo", type: "Presentation", views: "8.4K", engagement: "4.2%", trend: "up" },
];

const ACTIVITY = [
  { user: "Sarah K.", action: "created agent", target: "Dr. Aria", time: "2 min ago", icon: Bot, color: "#6366F1" },
  { user: "Marcus L.", action: "published video", target: "Neural Networks 101", time: "12 min ago", icon: Video, color: "#EF4444" },
  { user: "Lina P.", action: "scheduled post", target: "Instagram — Dec 4", time: "31 min ago", icon: Share2, color: "#10B981" },
  { user: "James R.", action: "built course", target: "Intro to AI", time: "1 hour ago", icon: BookOpen, color: "#F59E0B" },
  { user: "Nova T.", action: "ran workflow", target: "Blog → Social", time: "2 hours ago", icon: FileText, color: "#0EA5E9" },
  { user: "Aria M.", action: "generated image", target: "DNA helix 3D", time: "3 hours ago", icon: FileText, color: "#F97316" },
  { user: "Ethan W.", action: "joined platform", target: "—", time: "4 hours ago", icon: Users, color: "#16A34A" },
];

export default function Analytics({ navigate }: Nav) {
  const [period, setPeriod] = useState("7d");

  return (
    <div className="min-h-screen bg-[#0F172A] p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-xl bg-[#0EA5E9]">
              <BarChart3 className="size-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">Analytics Dashboard</h1>
              <p className="text-white/60">Usage, content performance & engagement metrics</p>
            </div>
          </div>
          <div className="flex gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
            {["24h", "7d", "30d", "90d"].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                  period === p ? "bg-[#0EA5E9] text-white" : "text-white/60 hover:text-white"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {KPIS.map((k) => {
            const Icon = k.icon;
            return (
              <Card key={k.label} className="border-white/10 bg-white/5 text-white">
                <CardContent>
                  <div className="mb-3 flex items-center justify-between">
                    <div
                      className="flex size-9 items-center justify-center rounded-lg"
                      style={{ background: `${k.color}20`, color: k.color }}
                    >
                      <Icon className="size-4" />
                    </div>
                    <Badge
                      className={
                        k.trend === "up"
                          ? "bg-[#16A34A]/20 text-[#86efac]"
                          : "bg-[#EF4444]/20 text-[#fca5a5]"
                      }
                    >
                      {k.trend === "up" ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                      {k.change}
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold">{k.value}</p>
                  <p className="text-xs text-white/50">{k.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Usage over time */}
          <Card className="border-white/10 bg-white/5 text-white lg:col-span-2">
            <CardHeader>
              <CardTitle>Usage Over Time</CardTitle>
              <CardDescription className="text-white/60">Daily AI operations · last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-56 items-end justify-between gap-3">
                {USAGE_DATA.map((d) => (
                  <div key={d.day} className="flex flex-1 flex-col items-center gap-2">
                    <div className="flex w-full flex-1 items-end">
                      <div
                        className="w-full rounded-t-md bg-gradient-to-t from-[#6366F1] to-[#E8501A] transition-all hover:opacity-80"
                        style={{ height: `${d.value}%` }}
                      >
                        <div className="px-1 pt-1 text-center text-[10px] font-bold text-white opacity-0 transition-opacity hover:opacity-100">
                          {d.value}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-white/50">{d.day}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Content by type */}
          <Card className="border-white/10 bg-white/5 text-white">
            <CardHeader>
              <CardTitle>Content by Type</CardTitle>
              <CardDescription className="text-white/60">Total volume generated</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {CONTENT_BY_TYPE.map((c) => {
                const max = Math.max(...CONTENT_BY_TYPE.map((x) => x.count));
                return (
                  <div key={c.type}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-white/80">{c.type}</span>
                      <span className="font-medium">{c.count.toLocaleString()}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full" style={{ width: `${(c.count / max) * 100}%`, background: c.color }} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Engagement by platform */}
          <Card className="border-white/10 bg-white/5 text-white">
            <CardHeader>
              <CardTitle>Engagement by Platform</CardTitle>
              <CardDescription className="text-white/60">Average engagement rate</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {PLATFORM_ENGAGEMENT.map((p) => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className="w-20 text-sm text-white/70">{p.name}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full" style={{ width: `${p.value}%`, background: p.color }} />
                  </div>
                  <span className="w-10 text-right text-sm font-medium">{p.value}%</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Top performing content */}
          <Card className="border-white/10 bg-white/5 text-white lg:col-span-2">
            <CardHeader>
              <CardTitle>Top Performing Content</CardTitle>
              <CardDescription className="text-white/60">Best performers this {period}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {TOP_CONTENT.map((c, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-[#6366F1] to-[#E8501A] text-xs font-bold">
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{c.title}</p>
                      <div className="mt-0.5 flex items-center gap-3 text-xs text-white/50">
                        <Badge variant="outline" className="border-white/20 text-[10px]">{c.type}</Badge>
                        <span className="flex items-center gap-1"><Eye className="size-3" /> {c.views}</span>
                        <span className="flex items-center gap-1"><Heart className="size-3" /> {c.engagement}</span>
                      </div>
                    </div>
                  </div>
                  {c.trend === "up" ? (
                    <TrendingUp className="size-4 text-[#16A34A]" />
                  ) : (
                    <TrendingDown className="size-4 text-[#EF4444]" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Recent activity */}
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Clock className="size-5" style={{ color: "#6366F1" }} /> Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {ACTIVITY.map((a, i) => {
                const Icon = a.icon;
                return (
                  <div key={i} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
                    <div
                      className="flex size-8 items-center justify-center rounded-full"
                      style={{ background: `${a.color}20`, color: a.color }}
                    >
                      <Icon className="size-4" />
                    </div>
                    <div className="flex-1 text-sm">
                      <span className="font-medium">{a.user}</span>
                      <span className="text-white/60"> {a.action} </span>
                      <span className="font-medium text-white/80">{a.target}</span>
                    </div>
                    <span className="text-xs text-white/40">{a.time}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="rounded-xl border border-white/10 bg-gradient-to-r from-[#0EA5E9]/10 to-[#6366F1]/10 p-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="font-semibold">Need to manage users or API keys?</h3>
              <p className="text-sm text-white/60">Open the admin dashboard for full system control.</p>
            </div>
            <Button variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10" onClick={() => navigate("admin")}>
              Open Admin <ArrowUpRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
