"use client";

import { useState } from "react";
import {
  Share2, Calendar, Clock, Plus, Trash2, Image as ImageIcon, Link2,
  Facebook, Instagram, Twitter, Youtube, Linkedin, BarChart3, Heart,
  MessageCircle, Send, Bookmark, ThumbsUp, Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { ModuleId } from "./module-registry";

type Nav = { navigate: (id: ModuleId) => void };

const PLATFORMS = [
  { name: "Facebook", icon: Facebook, color: "#1877F2", connected: true, followers: "12.4K" },
  { name: "Instagram", icon: Instagram, color: "#E4405F", connected: true, followers: "8.9K" },
  { name: "Threads", icon: MessageCircle, color: "#1DA1F2", connected: false, followers: "—" },
  { name: "X", icon: Twitter, color: "#1DA1F2", connected: true, followers: "5.2K" },
  { name: "LinkedIn", icon: Linkedin, color: "#0A66C2", connected: true, followers: "3.1K" },
  { name: "YouTube", icon: Youtube, color: "#FF0000", connected: true, followers: "15.7K" },
  { name: "TikTok", icon: Share2, color: "#000000", connected: false, followers: "—" },
  { name: "Pinterest", icon: Bookmark, color: "#BD081C", connected: false, followers: "—" },
  { name: "Telegram", icon: Send, color: "#0088CC", connected: true, followers: "4.6K" },
  { name: "Discord", icon: MessageCircle, color: "#5865F2", connected: false, followers: "—" },
  { name: "WhatsApp", icon: MessageCircle, color: "#25D366", connected: false, followers: "—" },
  { name: "WordPress", icon: ImageIcon, color: "#21759B", connected: true, followers: "—" },
  { name: "Medium", icon: Bookmark, color: "#000000", connected: false, followers: "—" },
];

const SCHEDULED_POSTS = [
  { id: 1, content: "🎉 New course launched! Learn AI fundamentals in 7 days. Free for first 100 students.", platforms: ["Facebook", "Instagram", "X"], time: "Today · 6:00 PM", status: "Scheduled" },
  { id: 2, content: "📖 Did you know? Reading 15 minutes a day exposes kids to 1.8M words/year.", platforms: ["Facebook", "Instagram"], time: "Tomorrow · 9:00 AM", status: "Scheduled" },
  { id: 3, content: "🎙️ New podcast episode: 'How AI tutors adapt to every learner'", platforms: ["YouTube", "Telegram"], time: "Dec 5 · 12:00 PM", status: "Draft" },
  { id: 4, content: "💡 Weekly tip: Use the 80/20 rule — focus on the 20% of topics that drive 80% of results.", platforms: ["LinkedIn", "X"], time: "Dec 6 · 8:00 AM", status: "Scheduled" },
];

const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const CALENDAR_POSTS: Record<string, { count: number; platforms: string[] }> = {
  "0-0": { count: 2, platforms: ["Facebook", "Instagram"] },
  "0-2": { count: 1, platforms: ["X"] },
  "1-1": { count: 3, platforms: ["LinkedIn", "Facebook", "X"] },
  "2-0": { count: 1, platforms: ["YouTube"] },
  "2-3": { count: 2, platforms: ["Instagram", "Telegram"] },
  "3-4": { count: 1, platforms: ["Facebook"] },
  "4-2": { count: 4, platforms: ["Facebook", "Instagram", "LinkedIn", "X"] },
  "5-0": { count: 2, platforms: ["YouTube", "Telegram"] },
  "6-1": { count: 1, platforms: ["Instagram"] },
};

export default function Social({ navigate }: Nav) {
  const [platforms, setPlatforms] = useState(PLATFORMS);
  const [post, setPost] = useState("");
  const [scheduledPosts, setScheduledPosts] = useState(SCHEDULED_POSTS);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["Facebook", "Instagram"]);

  const togglePlatform = (name: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name]
    );
  };

  const toggleConnect = (name: string) => {
    setPlatforms((prev) =>
      prev.map((p) => (p.name === name ? { ...p, connected: !p.connected } : p))
    );
  };

  const schedule = () => {
    if (!post.trim() || selectedPlatforms.length === 0) return;
    setScheduledPosts((prev) => [
      { id: Date.now(), content: post, platforms: selectedPlatforms, time: "Today · 8:00 PM", status: "Scheduled" },
      ...prev,
    ]);
    setPost("");
  };

  return (
    <div className="min-h-screen bg-[#0F172A] p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-[#10B981]">
            <Share2 className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">Social Media Automation</h1>
            <p className="text-white/60">Schedule & publish to 13+ platforms from one dashboard</p>
          </div>
        </div>

        {/* Platform Grid */}
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Connected Platforms</CardTitle>
                <CardDescription className="text-white/60">
                  {platforms.filter((p) => p.connected).length} of {platforms.length} connected
                </CardDescription>
              </div>
              <Badge className="bg-[#10B981]/20 text-[#6ee7b7]">{platforms.filter((p) => p.connected).length} active</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
              {platforms.map((p) => {
                const Icon = p.icon;
                return (
                  <div
                    key={p.name}
                    className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition ${
                      p.connected ? "border-white/20 bg-white/5" : "border-dashed border-white/10 bg-white/[0.02]"
                    }`}
                  >
                    <Icon className="size-6" style={{ color: p.color }} />
                    <span className="text-xs font-medium">{p.name}</span>
                    <span className="text-[10px] text-white/40">{p.followers} followers</span>
                    <Button
                      size="sm"
                      variant={p.connected ? "outline" : "default"}
                      className={`h-6 w-full text-[10px] ${
                        p.connected
                          ? "border-[#16A34A]/30 bg-[#16A34A]/10 text-[#86efac] hover:bg-[#16A34A]/20"
                          : "bg-[#10B981] hover:bg-[#10B981]/90"
                      }`}
                      onClick={() => toggleConnect(p.name)}
                    >
                      {p.connected ? "Connected" : "Connect"}
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Post Composer */}
          <Card className="border-white/10 bg-white/5 text-white lg:col-span-2">
            <CardHeader>
              <CardTitle>Compose Post</CardTitle>
              <CardDescription className="text-white/60">Write once, publish everywhere</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                className="min-h-32 border-white/10 bg-white/5"
                placeholder="What's on your mind?"
                value={post}
                onChange={(e) => setPost(e.target.value)}
              />
              <div className="flex items-center justify-between text-xs text-white/50">
                <span>{post.length} characters</span>
                <span>{selectedPlatforms.length} platform(s) selected</span>
              </div>
              <div>
                <Label className="mb-2 block">Publish to</Label>
                <div className="flex flex-wrap gap-2">
                  {platforms.filter((p) => p.connected).map((p) => {
                    const Icon = p.icon;
                    const active = selectedPlatforms.includes(p.name);
                    return (
                      <button
                        key={p.name}
                        onClick={() => togglePlatform(p.name)}
                        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition ${
                          active ? "border-[#10B981] bg-[#10B981]/20 text-white" : "border-white/20 bg-white/5 text-white/60"
                        }`}
                      >
                        <Icon className="size-3.5" style={{ color: p.color }} />
                        {p.name}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
                  <ImageIcon /> Add Image
                </Button>
                <Button variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
                  <Link2 /> Add Link
                </Button>
                <Button variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
                  <Calendar /> Schedule
                </Button>
                <Button className="ml-auto bg-[#10B981] hover:bg-[#10B981]/90" onClick={schedule} disabled={!post.trim() || selectedPlatforms.length === 0}>
                  <Send /> Schedule Post
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Analytics summary */}
          <Card className="border-white/10 bg-white/5 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BarChart3 className="size-5" style={{ color: "#10B981" }} /> Platform Analytics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {platforms.filter((p) => p.connected && p.followers !== "—").slice(0, 6).map((p) => {
                const Icon = p.icon;
                const engagement = Math.floor(20 + Math.random() * 60);
                return (
                  <div key={p.name} className="rounded-lg border border-white/10 bg-white/5 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="size-4" style={{ color: p.color }} />
                        <span className="text-sm font-medium">{p.name}</span>
                      </div>
                      <span className="text-xs text-white/50">{p.followers}</span>
                    </div>
                    <div className="mb-1 flex justify-between text-[10px] text-white/40">
                      <span>Engagement</span>
                      <span>{engagement}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full" style={{ width: `${engagement}%`, background: p.color }} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Calendar */}
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Calendar className="size-5" style={{ color: "#6366F1" }} /> Content Calendar — This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {WEEK_DAYS.map((day, dIdx) => (
                <div key={day} className="min-h-32 rounded-lg border border-white/10 bg-white/5 p-2">
                  <p className="mb-2 text-xs font-semibold text-white/60">{day}</p>
                  <div className="space-y-1">
                    {CALENDAR_POSTS[`${dIdx}-0`] && (
                      <div className="rounded bg-[#10B981]/20 p-1.5 text-[9px]">
                        <p className="font-medium text-[#6ee7b7]">{CALENDAR_POSTS[`${dIdx}-0`].count} posts</p>
                        <p className="text-white/50">{CALENDAR_POSTS[`${dIdx}-0`].platforms.join(", ")}</p>
                      </div>
                    )}
                    {CALENDAR_POSTS[`${dIdx}-1`] && (
                      <div className="rounded bg-[#6366F1]/20 p-1.5 text-[9px]">
                        <p className="font-medium text-[#a5b4fc]">{CALENDAR_POSTS[`${dIdx}-1`].count} posts</p>
                      </div>
                    )}
                    {CALENDAR_POSTS[`${dIdx}-2`] && (
                      <div className="rounded bg-[#E8501A]/20 p-1.5 text-[9px]">
                        <p className="font-medium text-[#fdba74]">{CALENDAR_POSTS[`${dIdx}-2`].count} posts</p>
                      </div>
                    )}
                    {CALENDAR_POSTS[`${dIdx}-3`] && (
                      <div className="rounded bg-[#F59E0B]/20 p-1.5 text-[9px]">
                        <p className="font-medium text-[#fcd34d]">{CALENDAR_POSTS[`${dIdx}-3`].count} posts</p>
                      </div>
                    )}
                    {CALENDAR_POSTS[`${dIdx}-4`] && (
                      <div className="rounded bg-[#EC4899]/20 p-1.5 text-[9px]">
                        <p className="font-medium text-[#f9a8d4]">{CALENDAR_POSTS[`${dIdx}-4`].count} posts</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Scheduled Posts */}
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <CardTitle>Scheduled Posts ({scheduledPosts.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {scheduledPosts.map((p) => (
              <div key={p.id} className="rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <p className="flex-1 text-sm text-white/90">{p.content}</p>
                  <Button size="icon" variant="ghost" className="size-7 shrink-0" onClick={() => setScheduledPosts((prev) => prev.filter((x) => x.id !== p.id))}>
                    <Trash2 className="size-3.5 text-red-400" />
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap items-center gap-1">
                    {p.platforms.map((pl) => {
                      const platform = platforms.find((x) => x.name === pl);
                      const Icon = platform?.icon;
                      return Icon ? <Icon key={pl} className="size-3.5" style={{ color: platform.color }} /> : null;
                    })}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-white/50">
                    <span className="flex items-center gap-1"><Clock className="size-3" /> {p.time}</span>
                    <Badge
                      className={
                        p.status === "Scheduled"
                          ? "bg-[#10B981]/20 text-[#6ee7b7]"
                          : p.status === "Draft"
                          ? "bg-[#F59E0B]/20 text-[#fcd34d]"
                          : "bg-white/10 text-white/60"
                      }
                    >
                      {p.status}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="rounded-xl border border-white/10 bg-gradient-to-r from-[#10B981]/10 to-[#6366F1]/10 p-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="font-semibold">Automate posting with workflows</h3>
              <p className="text-sm text-white/60">Trigger posts automatically when new content is published.</p>
            </div>
            <Button variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10" onClick={() => navigate("workflow")}>
              Open Workflow Automation
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
