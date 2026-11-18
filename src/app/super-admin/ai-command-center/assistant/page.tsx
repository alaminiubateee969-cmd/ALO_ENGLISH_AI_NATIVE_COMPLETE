"use client";

/**
 * Super Admin AI Assistant — chat interface at the command center.
 * Can answer questions, generate code, and connect to free AI models.
 */

import { useState, useEffect, useRef } from "react";
import { DashboardShell } from "@/components/site/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Send, Bot, Settings, Key, Check, Loader2, Sparkles, Code2 } from "lucide-react";

const NAV = [
  { label: "Dashboard", href: "/super-admin/dashboard" },
  { label: "Command Center", href: "/super-admin/ai-command-center" },
  { label: "AI Assistant", href: "/super-admin/ai-command-center/assistant" },
  { label: "Health", href: "/super-admin/health" },
  { label: "Logout", href: "/login" },
];

type Message = { role: "user" | "assistant"; content: string; timestamp: string };
type AIConfig = { provider: string; apiKey: string; model: string; enabled: boolean };
type Provider = { id: string; name: string; free: boolean; apiKeyUrl: string; models: string[] };

export default function AdminAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [config, setConfig] = useState<AIConfig>({ provider: "groq", apiKey: "", model: "llama-3.3-70b-versatile", enabled: false });
  const [providers, setProviders] = useState<Provider[]>([]);
  const [savingConfig, setSavingConfig] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/admin/assistant")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setConfig(d.data.config);
          setProviders(d.data.providers);
          if (!d.data.config.apiKey) setShowConfig(true);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, history: messages.map((m) => ({ role: m.role, content: m.content, timestamp: m.timestamp })) }),
      });
      const data = await res.json();
      if (data.success) {
        const assistantMsg: Message = { role: "assistant", content: data.data.reply, timestamp: new Date().toISOString() };
        setMessages((prev) => [...prev, assistantMsg]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Network error. Try again.", timestamp: new Date().toISOString() }]);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSavingConfig(true);
    try {
      await fetch("/api/admin/ai-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      setShowConfig(false);
    } finally {
      setSavingConfig(false);
    }
  };

  const selectedProvider = providers.find((p) => p.id === config.provider);

  return (
    <DashboardShell title="Super Admin" nav={NAV} role="SUPER_ADMIN">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="h-7 w-7 text-blue-500" /> AI Assistant
          </h2>
          <p className="text-slate-600 mt-1">Code-aware AI agent for platform management</p>
        </div>
        <div className="flex items-center gap-2">
          {config.enabled && config.apiKey ? (
            <Badge className="bg-green-50 text-green-700"><Check className="h-3 w-3 mr-1" /> {config.provider} connected</Badge>
          ) : (
            <Badge variant="secondary"><Sparkles className="h-3 w-3 mr-1" /> Own AI (no API key)</Badge>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowConfig(!showConfig)}>
            <Settings className="h-4 w-4 mr-1" /> AI Config
          </Button>
        </div>
      </div>

      {/* Config Panel */}
      {showConfig && (
        <Card className="mb-6 border-blue-200">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Key className="h-5 w-5" /> Connect Free AI Model</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium">AI Provider (all free)</Label>
              <select className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={config.provider} onChange={(e) => { const p = providers.find(x => x.id === e.target.value); setConfig({ ...config, provider: e.target.value, model: p?.models[0] || "" }); }}>
                {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            {selectedProvider && (
              <div className="rounded-md bg-blue-50 p-3 text-xs text-blue-700">
                Get free API key: <a href={selectedProvider.apiKeyUrl} target="_blank" rel="noopener noreferrer" className="font-semibold underline">{selectedProvider.apiKeyUrl}</a>
              </div>
            )}
            <div><Label className="text-sm font-medium">API Key</Label><Input type="password" className="mt-1" placeholder="Paste your free API key" value={config.apiKey} onChange={(e) => setConfig({ ...config, apiKey: e.target.value })} /></div>
            <div>
              <Label className="text-sm font-medium">Model</Label>
              <select className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={config.model} onChange={(e) => setConfig({ ...config, model: e.target.value })}>
                {selectedProvider?.models.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={config.enabled} onChange={(e) => setConfig({ ...config, enabled: e.target.checked })} /> Enable external AI (when off, uses own rule-based AI)</label>
            <Button onClick={saveConfig} disabled={savingConfig} className="w-full">{savingConfig ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Configuration"}</Button>
          </CardContent>
        </Card>
      )}

      {/* Chat */}
      <Card className="flex flex-col" style={{ height: "calc(100vh - 320px)", minHeight: "400px" }}>
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100"><Bot className="h-8 w-8 text-blue-500" /></div>
              <p className="font-medium text-slate-700">Ask me anything about the platform</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {["IELTS format কি?", "How many exams?", "API route তৈরি করুন", "কত বিভাগ আছে?", "How to take exam?", "Prisma model"].map((q) => (
                  <button key={q} onClick={() => setInput(q)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600 hover:border-blue-300 hover:bg-blue-50">{q}</button>
                ))}
              </div>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${msg.role === "user" ? "rounded-tr-sm bg-blue-500 text-white" : "rounded-tl-sm bg-slate-100 text-slate-800"}`}>
                {msg.content.includes("```") ? (
                  <div>
                    {msg.content.split("```").map((part, idx) => idx % 2 === 1 ? (
                      <pre key={idx} className="mt-2 rounded-md bg-slate-900 p-3 text-xs text-green-400 overflow-x-auto"><code>{part.replace(/^[a-z]+\n/, "")}</code></pre>
                    ) : <span key={idx}>{part}</span>)}
                  </div>
                ) : msg.content}
              </div>
            </div>
          ))}
          {loading && <div className="flex justify-start"><div className="rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-2.5 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin inline mr-1" /> Thinking...</div></div>}
          <div ref={messagesEndRef} />
        </CardContent>
        <div className="border-t border-slate-200 p-4">
          <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2">
            <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about exams, generate code, manage platform..." disabled={loading} />
            <Button type="submit" disabled={loading || !input.trim()}><Send className="h-4 w-4" /></Button>
          </form>
        </div>
      </Card>
    </DashboardShell>
  );
}
