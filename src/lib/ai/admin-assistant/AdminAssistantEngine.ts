/**
 * src/lib/ai/admin-assistant/AdminAssistantEngine.ts
 *
 * Super Admin AI Assistant — code-aware chat agent for the command center.
 */
import { db } from "@/lib/db";

export type AIProvider = {
  id: string; name: string; free: boolean; apiKeyUrl: string; baseUrl: string; models: string[];
};

export const AI_PROVIDERS: AIProvider[] = [
  { id: "groq", name: "Groq (Free, Fast)", free: true, apiKeyUrl: "https://console.groq.com/keys", baseUrl: "https://api.groq.com/openai/v1", models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"] },
  { id: "openrouter", name: "OpenRouter (Free models)", free: true, apiKeyUrl: "https://openrouter.ai/keys", baseUrl: "https://openrouter.ai/api/v1", models: ["free:meta-llama/llama-3.3-70b-instruct", "free:google/gemma-2-9b-it"] },
  { id: "gemini", name: "Google Gemini (Free tier)", free: true, apiKeyUrl: "https://aistudio.google.com/app/apikey", baseUrl: "https://generativelanguage.googleapis.com/v1beta", models: ["gemini-2.0-flash", "gemini-1.5-flash"] },
  { id: "alolabs", name: "ALO Labs AI (Custom)", free: true, apiKeyUrl: "https://english.alolabs.net/api/ai/key", baseUrl: "https://english.alolabs.net/api/ai", models: ["alolabs-default", "alolabs-code"] },
];

export type AdminAssistantConfig = { provider: string; apiKey: string; model: string; enabled: boolean };
export type ChatMessage = { role: "user" | "assistant" | "system"; content: string; timestamp: string };
export type AdminAssistantResponse = { reply: string; codeGenerated?: string; language?: string; usedExternalAI: boolean; provider?: string };

const KNOWLEDGE: Record<string, string> = {
  "how many exams": "২২ ধরনের পরীক্ষা: IELTS (A/G/UKVI), TOEFL, PTE, Duolingo, OET, Cambridge, LanguageCert, Linguaskill, OIETC, TOEIC, GRE, GMAT, SAT, ACT, LSAT, MCAT, Visa, ALO Placement, Counselor, Document Readiness। মোট ৩৭৯ প্রশ্ন।",
  "ielts format": "IELTS: Listening ৩০মি/৪০Q, Reading ৬০মি/৪০Q, Writing ৬০মি/২টাস্ক, Speaking ১৪মি/৩পর্ব। ব্যান্ড ০-৯।",
  "toefl format": "TOEFL: Reading ৩৫মি/২০Q, Listening ৩৬মি/২৮Q, Speaking ১৭মি/৪টাস্ক, Writing ২৯মি/২টাস্ক। স্কোর ০-১২০।",
  "pte format": "PTE: Speaking & Writing ৫৪-৬৭মি, Reading ২৯-৩০মি, Listening ৩০-৪৩মি। ২০ ধরনের প্রশ্ন। স্কোর ১০-৯০।",
  "duolingo format": "Duolingo: ~৪৫মি অ্যাডাপটিভ, ৪ সাবস্কোর, ক্যামেরা প্রক্টরিং। স্কোর ১০-১৬০।",
  "gre format": "GRE: Writing ৩০মি, Verbal ৪১মি/২৭Q, Quantitative ৪৭মি/২৭Q। ক্যালকুলেটর আছে। স্কোর ২৬০-৩৪০।",
  "gmat format": "GMAT: Quantitative ৪৫মি, Verbal ৪৫মি, Data Insights ৪৫মি। স্কোর ২০৫-৮০৫।",
  "sat format": "SAT: R&W ২মডিউল/৬৪মি, Math ২মডিউল/৭০মি। Desmos ক্যালকুলেটর। স্কোর ৪০০-১৬০০।",
  "how to take exam": "১. রেজিস্টার (edu ID) ২. লগইন ৩. /practice-test ৪. পরীক্ষা নির্বাচন ৫. Start ৬. ডিভাইস যাচাই ৭. পরীক্ষা ৮. সাবমিট ৯. AI মূল্যায়ন ১০. সার্টিফিকেট PDF",
  "device setup": "প্রয়োজন: Chrome/Firefox, মাইক্রোফোন, স্পিকার, ইন্টারনেট, Educational ID। ডিভাইস ফিঙ্গারপ্রিন্ট, ট্যাব সুইচ ডিটেকশন, লকডাউন মোড চালু।",
  "ai teachers": "১০ জন AI শিক্ষক (৫M+৫F), বাঙালি চেহারা, নিজস্ব AI, কোনো পেইড API নেই।",
  "departments": "১০০ বিভাগ, ২০০০ AI কর্মচারী, ৩৯ সার্টিফায়েড, ৫১ কন্ডিশনালি, ১০ আন্ডার রিভিউ।",
  "free mocks": "প্রতি পরীক্ষা প্রকারে ৩টি ফ্রি মক (edu ID দিয়ে)। বেশির জন্য ফি।",
  "certificate": "প্রতি সাবমিটে PDF সার্টিফিকেট (ALO-CERT-YYYY-NNNNNN) স্বয়ংক্রিয়ভাবে তৈরি + ইমেইল।",
};

function findInKnowledge(q: string): string | null {
  const l = q.toLowerCase();
  for (const [k, v] of Object.entries(KNOWLEDGE)) if (l.includes(k)) return v;
  for (const exam of ["ielts","toefl","pte","duolingo","gre","gmat","sat"]) {
    if (l.includes(exam) && (l.includes("format")||l.includes("how")||l.includes("what")))
      return KNOWLEDGE[exam + " format"];
  }
  if (l.includes("take") && l.includes("exam")) return KNOWLEDGE["how to take exam"];
  if (l.includes("device")||l.includes("setup")||l.includes("requirement")) return KNOWLEDGE["device setup"];
  if (l.includes("certificate")) return KNOWLEDGE["certificate"];
  if (l.includes("teacher")) return KNOWLEDGE["ai teachers"];
  if (l.includes("department")) return KNOWLEDGE["departments"];
  if (l.includes("free") && l.includes("mock")) return KNOWLEDGE["free mocks"];
  return null;
}

function generateCode(q: string): { code: string; language: string } | null {
  const l = q.toLowerCase();
  if (l.includes("api route")||l.includes("create api")) return {
    language: "typescript",
    code: `import { requireAuth } from "@/lib/auth";\nimport { ok, badRequest } from "@/lib/responses";\nimport { withErrorHandler } from "@/lib/responses";\nimport { z } from "zod";\n\nexport const runtime = "nodejs";\nexport const dynamic = "force-dynamic";\n\nexport async function POST(req: Request) {\n  return withErrorHandler(async () => {\n    const user = await requireAuth();\n    // Your logic here\n    return ok({ success: true }, "Done");\n  });\n}`,
  };
  if (l.includes("prisma model")||l.includes("database model")) return {
    language: "prisma",
    code: `model YourModel {\n  id        String   @id @default(cuid())\n  name      String\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n  @@index([name])\n}`,
  };
  if (l.includes("page")||l.includes("component")) return {
    language: "tsx",
    code: `"use client";\nimport { useState } from "react";\nimport { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";\n\nexport default function Page() {\n  return <Card><CardHeader><CardTitle>Title</CardTitle></CardHeader><CardContent>Content</CardContent></Card>;\n}`,
  };
  return null;
}

async function callExternalAI(config: AdminAssistantConfig, messages: ChatMessage[]): Promise<string | null> {
  if (!config.apiKey || !config.enabled) return null;
  const provider = AI_PROVIDERS.find(p => p.id === config.provider);
  if (!provider) return null;
  try {
    if (config.provider === "gemini") {
      const res = await fetch(`${provider.baseUrl}/models/${config.model}:generateContent?key=${config.apiKey}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: messages.map(m => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })) }),
      });
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
    }
    const res = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}` },
      body: JSON.stringify({ model: config.model, messages: messages.map(m => ({ role: m.role, content: m.content })) }),
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content || null;
  } catch { return null; }
}

export async function askAssistant(question: string, history: ChatMessage[], config: AdminAssistantConfig): Promise<AdminAssistantResponse> {
  if (config.enabled && config.apiKey) {
    const sys = "You are ALO Education Super Admin AI Assistant. Help with exam info, code generation, platform management. Support Bengali.";
    const msgs: ChatMessage[] = [{ role: "system", content: sys, timestamp: new Date().toISOString() }, ...history.slice(-10), { role: "user", content: question, timestamp: new Date().toISOString() }];
    const ext = await callExternalAI(config, msgs);
    if (ext) return { reply: ext, usedExternalAI: true, provider: config.provider };
  }
  const k = findInKnowledge(question);
  if (k) return { reply: k, usedExternalAI: false };
  const c = generateCode(question);
  if (c) return { reply: `কোড টেমপ্লেট:\n\n\`\`\`${c.language}\n${c.code}\n\`\`\``, codeGenerated: c.code, language: c.language, usedExternalAI: false };
  return { reply: `আমি সাহায্য করতে পারি। জিজ্ঞাসুন:\n📖 পরীক্ষা: "IELTS format", "TOEFL কীভাবে"\n🔧 কোড: "API route", "Prisma model"\n🏢 সিস্টেম: "কত বিভাগ", "AI শিক্ষক"\n🎯 "কীভাবে পরীক্ষা দেব?", "device প্রয়োজন"\n\nফ্রি AI কানেক্ট: Settings → AI Provider → API Key`, usedExternalAI: false };
}

export async function getAssistantConfig(): Promise<AdminAssistantConfig> {
  const s = await db.setting.findUnique({ where: { key: "ai_assistant_config" } });
  if (s) try { return JSON.parse(s.value); } catch {}
  return { provider: "groq", apiKey: "", model: "llama-3.3-70b-versatile", enabled: false };
}

export async function saveAssistantConfig(config: AdminAssistantConfig): Promise<void> {
  await db.setting.upsert({ where: { key: "ai_assistant_config" }, update: { value: JSON.stringify(config) }, create: { key: "ai_assistant_config", value: JSON.stringify(config) } });
}
