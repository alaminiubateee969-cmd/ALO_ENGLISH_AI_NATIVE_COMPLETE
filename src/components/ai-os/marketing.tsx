"use client";

import { useState } from "react";
import {
  Megaphone, Sparkles, Copy, Trash2, Calendar, TrendingUp, Facebook,
  Instagram, Linkedin, Twitter, Mail, FileText, Layout, Package, Newspaper,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { ModuleId } from "./module-registry";

type Nav = { navigate: (id: ModuleId) => void };

const CONTENT_TYPES = [
  { name: "Facebook Post", icon: Facebook, color: "#1877F2", charLimit: 5000 },
  { name: "Instagram Caption", icon: Instagram, color: "#E4405F", charLimit: 2200 },
  { name: "LinkedIn Post", icon: Linkedin, color: "#0A66C2", charLimit: 3000 },
  { name: "X Post", icon: Twitter, color: "#1DA1F2", charLimit: 280 },
  { name: "Blog Article", icon: FileText, color: "#6366F1", charLimit: 5000 },
  { name: "Email Newsletter", icon: Mail, color: "#E8501A", charLimit: 5000 },
  { name: "Landing Page", icon: Layout, color: "#16A34A", charLimit: 5000 },
  { name: "Product Description", icon: Package, color: "#F59E0B", charLimit: 1500 },
  { name: "Press Release", icon: Newspaper, color: "#0EA5E9", charLimit: 5000 },
];

const SAMPLE_CAMPAIGNS = [
  { name: "Summer Course Launch", type: "Multi-platform", posts: 12, reach: "24.5K", status: "Active" },
  { name: "AI Tutor Promotion", type: "Instagram + FB", posts: 8, reach: "18.2K", status: "Active" },
  { name: "Back-to-School Email", type: "Email Newsletter", posts: 3, reach: "9.8K", status: "Scheduled" },
  { name: "Research Webinar", type: "LinkedIn + X", posts: 5, reach: "6.4K", status: "Draft" },
];

function generateContent(type: string, product: string): string {
  const templates: Record<string, string> = {
    "Facebook Post": `📚 Big news! ${product} is here — and it's going to change how you learn.\n\n✅ AI-powered personalization\n✅ 6 languages supported\n✅ Bite-sized lessons\n✅ Free trial available\n\nTry it today 👉 link in bio\n#Education #AI #Learning`,
    "Instagram Caption": `✨ Meet ${product} — your new AI study buddy ✨\n\nWhether you're learning English, Math, or AI itself, this app adapts to YOU. 🎯\n\nTap the link in bio to start free 🚀\n\n#AI #EdTech #StudySmart #Learning #EdTechTools #StudentLife #Motivation`,
    "LinkedIn Post": `I'm thrilled to announce the launch of ${product}.\n\nAfter 18 months of R&D with educators across 4 countries, we've built an AI tutor that adapts to each learner's pace, language, and goals.\n\nKey results from beta:\n📈 32% improvement in test scores\n🌍 6 languages supported\n⏱️ 4.2 hours saved per student weekly\n\nThis is just the beginning. We'd love your feedback.\n\n#EdTech #AI #Education #Innovation #ProductLaunch`,
    "X Post": `🚀 Just launched: ${product}\n\nAI-powered learning in 6 languages. Free to start.\n\nTry it → [link]\n\n#AI #EdTech`,
    "Blog Article": `# Why ${product} Is the Future of Personalized Learning\n\nEducation has always been one-size-fits-all. Not anymore.\n\n## The Problem\nTraditional classrooms can't adapt to every student. Some fall behind; others get bored.\n\n## Our Solution\n${product} uses adaptive AI to meet each learner exactly where they are — adjusting difficulty, language, and pacing in real time.\n\n## What Early Users Say\n"My daughter finally enjoys math," reports one parent. "She asks for her AI tutor before bed."\n\n## Try It Free\nSign up today and get 14 days on us.\n\n[Read more →]`,
    "Email Newsletter": `Subject: 🎉 ${product} is live — your free trial inside\n\nHi [First Name],\n\nAfter months of anticipation, ${product} is finally here.\n\nHere's what's new this week:\n• 🎯 Personalized AI tutor for every subject\n• 🌍 Available in 6 languages\n• 📊 Progress tracking with weekly reports\n\nAs a subscriber, you get 14 days free — no card required.\n\n[Start your free trial →]\n\nHappy learning,\nThe ${product} Team`,
    "Landing Page": `# ${product}\n## Learn smarter, not harder.\n\n**AI-powered personalized learning in 6 languages.**\n\n[Start Free Trial]  [Watch Demo]\n\n### Why choose us?\n- ✅ Adaptive AI tutor\n- ✅ Real-time feedback\n- ✅ Multi-language support\n- ✅ Track progress easily\n\n> "My child went from struggling to top of the class in 3 months." — Parent\n\n### Ready to begin?\n[Get Started Free →]`,
    "Product Description": `**${product}** — Your AI-Powered Learning Companion\n\nUnlock personalized education with ${product}, the intelligent tutor that adapts to your pace, language, and learning style. Perfect for K-12 students, adult learners, and educators alike.\n\n• Adaptive curriculum in 6 languages\n• Real-time feedback & analytics\n• Available 24/7 on any device\n• Parent & teacher dashboards\n\n*Subscription starts at $9.99/month. 14-day free trial.*`,
    "Press Release": `**FOR IMMEDIATE RELEASE**\n\n**${product} Launches to Revolutionize AI-Powered Education**\n\n*CITY, DATE* — Today, ALO Labs announced the launch of ${product}, an AI-driven personalized learning platform serving students across 6 languages.\n\n"${product} represents our commitment to making world-class education accessible to everyone, regardless of language or geography," said [CEO Name], CEO of ALO Labs.\n\nThe platform features adaptive AI tutors, real-time analytics, and a comprehensive curriculum spanning 8 subjects.\n\nFor more information, visit [website] or contact press@alolabs.com.\n\n###\n\n**Media Contact:**\nName · email@example.com · +1-XXX-XXX-XXXX`,
  };
  return templates[type] || `Generated content for ${product}...`;
}

export default function Marketing({ navigate }: Nav) {
  const [type, setType] = useState(CONTENT_TYPES[0]);
  const [product, setProduct] = useState("");
  const [generating, setGenerating] = useState(false);
  const [content, setContent] = useState("");
  const [copied, setCopied] = useState(false);
  const [campaigns, setCampaigns] = useState(SAMPLE_CAMPAIGNS);

  const generate = () => {
    if (!product.trim()) return;
    setGenerating(true);
    setTimeout(() => {
      setContent(generateContent(type.name, product));
      setGenerating(false);
    }, 1200);
  };

  const copy = () => {
    navigator.clipboard?.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="min-h-screen bg-[#0F172A] p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-[#E8501A]">
            <Megaphone className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">AI Marketing Center</h1>
            <p className="text-white/60">Posts, captions, emails, campaigns & press releases</p>
          </div>
        </div>

        {/* Content Type Selector */}
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/60">Content Type</h2>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9">
            {CONTENT_TYPES.map((t) => {
              const Icon = t.icon;
              const active = type.name === t.name;
              return (
                <button
                  key={t.name}
                  onClick={() => setType(t)}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition ${
                    active ? "border-[#E8501A] bg-[#E8501A]/10" : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <Icon className="size-5" style={{ color: t.color }} />
                  <span className="text-[10px] font-medium leading-tight">{t.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Input */}
          <Card className="border-white/10 bg-white/5 text-white">
            <CardHeader>
              <CardTitle>Content Generator</CardTitle>
              <CardDescription className="text-white/60">{type.name} · max {type.charLimit} characters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Product / Topic</Label>
                <Input
                  className="border-white/10 bg-white/5"
                  placeholder="e.g. ALO English Tutor App"
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Additional Context (optional)</Label>
                <Textarea
                  className="border-white/10 bg-white/5"
                  placeholder="Target audience, key features, tone..."
                />
              </div>
              <Button className="w-full bg-[#E8501A] hover:bg-[#E8501A]/90" onClick={generate} disabled={generating || !product.trim()}>
                <Sparkles /> {generating ? "Generating..." : `Generate ${type.name}`}
              </Button>
            </CardContent>
          </Card>

          {/* Output */}
          <Card className="border-white/10 bg-white/5 text-white">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Generated Content</CardTitle>
                {content && (
                  <Button size="sm" variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10" onClick={copy}>
                    {copied ? "Copied!" : <><Copy /> Copy</>}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {content ? (
                <div className="rounded-lg border border-white/10 bg-[#0F172A] p-4">
                  <pre className="whitespace-pre-wrap text-sm text-white/80">{content}</pre>
                  <div className="mt-3 flex items-center justify-between text-xs text-white/40">
                    <span>{content.length} characters</span>
                    <span>{content.length > type.charLimit ? "⚠ exceeds limit" : "✓ within limit"}</span>
                  </div>
                </div>
              ) : (
                <div className="flex aspect-video flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-white/20 text-white/40">
                  <Megaphone className="size-12" />
                  <p>Generated content will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Campaign Manager */}
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Campaign Manager</CardTitle>
                <CardDescription className="text-white/60">{campaigns.length} campaigns · {campaigns.filter((c) => c.status === "Active").length} active</CardDescription>
              </div>
              <Button className="bg-[#6366F1] hover:bg-[#6366F1]/90" onClick={() => setCampaigns((c) => [{ name: "New Campaign", type: "Multi-platform", posts: 0, reach: "0", status: "Draft" }, ...c])}>
                <Sparkles /> New Campaign
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {campaigns.map((c, i) => (
                <div key={i} className="flex items-center gap-4 rounded-lg border border-white/10 bg-white/5 p-4">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#E8501A] to-[#6366F1]">
                    <Megaphone className="size-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-white/50">{c.type} · {c.posts} posts</p>
                  </div>
                  <div className="text-right">
                    <p className="flex items-center gap-1 text-sm font-medium"><TrendingUp className="size-3.5 text-[#16A34A]" /> {c.reach}</p>
                    <p className="text-xs text-white/50">reach</p>
                  </div>
                  <Badge
                    className={
                      c.status === "Active"
                        ? "bg-[#16A34A]/20 text-[#86efac]"
                        : c.status === "Scheduled"
                        ? "bg-[#F59E0B]/20 text-[#fcd34d]"
                        : "bg-white/10 text-white/60"
                    }
                  >
                    {c.status}
                  </Badge>
                  <Button size="icon" variant="ghost" onClick={() => setCampaigns((p) => p.filter((_, idx) => idx !== i))}>
                    <Trash2 className="size-4 text-red-400" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="rounded-xl border border-white/10 bg-gradient-to-r from-[#E8501A]/10 to-[#6366F1]/10 p-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="font-semibold">Schedule your campaign across platforms</h3>
              <p className="text-sm text-white/60">Auto-publish to 13+ social platforms in one click.</p>
            </div>
            <Button variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10" onClick={() => navigate("social")}>
              Open Social Automation
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
