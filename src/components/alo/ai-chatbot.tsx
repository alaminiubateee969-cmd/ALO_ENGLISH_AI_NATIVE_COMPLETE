"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Sparkles, ShieldCheck, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Msg = { role: "bot" | "user"; text: string; time: string };

const QUICK_PROMPTS = [
  "How do I start a mock test?",
  "Is it really free?",
  "How is my score calculated?",
  "Can I download my certificate?",
  "What exams are available?",
];

function botReply(userText: string): string {
  const t = userText.toLowerCase();
  if (t.includes("start") && t.includes("mock")) return "Sign in and open Practice Tests. You can start a session only if an active practice set is available for your account. Content counts and official-format coverage are not verified, so do not treat a session as a full official mock.";
  if (t.includes("free") && (t.includes("quota") || t.includes("mock") || t.includes("unlimited") || t.includes("cost") || t.includes("pay"))) return "Yes — completely free. Every exam, mock test, speaking practice and study material is unlimited, 24/7, with nothing to pay and no card required.";
  if (t.includes("score") && t.includes("calcul")) return "Supported listening and reading indicators are a simple accuracy-based practice measure. Writing may receive generic text suggestions; speaking is not numerically scored. No publisher-equivalent rubric, calibrated confidence, or official result is provided.";
  if (t.includes("certificate") || t.includes("cert")) return "I cannot verify a certificate-generation or download feature in the current application. Please contact ALO Education directly before relying on any certificate claim.";
  if (t.includes("exam") && t.includes("available")) return "The database schema includes multiple exam-type records, but active question-bank counts and full-length readiness have not been verified. Check the current catalog in the app; listed metadata does not guarantee a playable exam.";
  if (t.includes("ielts")) return "IELTS-related catalog and legacy sample content exist in the code, but active database counts, licensed-content provenance, audio playback, and official-length coverage are not verified. ALO practice is not an official IELTS result.";
  if (t.includes("pte")) return "PTE-related catalog entries exist, but the available task types, active question count, and official-format coverage have not been verified. Do not rely on this app as a full PTE simulation.";
  if (t.includes("speaking")) return "Speaking chat and transcription code exists, but provider availability is unverified. Transcript text cannot measure pronunciation, fluency, pauses, or accent, and the platform deliberately returns no numeric speaking score.";
  if (t.includes("writing")) return "The current local writing helper can return generic revision suggestions and word count. It does not apply a validated exam rubric or produce a numeric writing score.";
  if (t.includes("refund")) return "The application has no verified merchant checkout, webhook, or refund flow; online purchases are unavailable. Please ask ALO Education for the current written refund policy before making payment outside this app.";
  if (t.includes("privacy") || t.includes("data")) return "Please review the privacy notice and contact ALO Education for data-access or deletion requests. I cannot verify live CRM synchronization, retention, or download/delete workflows from this help widget.";
  if (t.includes("human") || t.includes("examiner") || t.includes("real")) return "This help widget is a set of scripted replies, not a human or AI examiner. Provider-backed conversation features require configuration and have not been verified here; no official examiner result is produced.";
  if (t.includes("hello") || t.includes("hi") || t.includes("hey")) return "Hello! I'm the ALO Support Assistant. I can help with mock tests (free & unlimited), scores, certificates, exams, and policies. What would you like to know?";
  if (t.includes("thank")) return "You're welcome! If you need more help, you can also book a free counseling session with an ALO Education advisor. Good luck with your practice!";
  if (t.includes("book") || t.includes("counsel")) return "You can book a free counseling session by scrolling to the 'Book Free Consultation' section on the homepage, or from your student dashboard. An ALO Education advisor will contact you within 24 hours.";
  return "This is a scripted help widget; its replies are not live support or official exam guidance. Try a suggested topic, then confirm account, payment, privacy, and test-format details with ALO Education or the relevant official exam provider.";
}

export function AiChatbot() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "bot", text: "Hello. This is a scripted help widget, not a live support agent or exam evaluator. Choose a topic and verify important details with ALO Education or the relevant official provider.", time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, typing]);

  const send = (text?: string) => {
    const msg = (text || input).trim();
    if (!msg) return;
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setMsgs((m) => [...m, { role: "user", text: msg, time: now }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMsgs((m) => [...m, { role: "bot", text: botReply(msg), time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
    }, 800 + Math.random() * 600);
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-alo-orange text-white shadow-lg hover:bg-[#cc3f10] transition-all hover:scale-105 alo-shadow-orange"
          aria-label="Open chat"
        >
          <MessageSquare className="h-6 w-6" />
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-5 right-5 z-50 w-[calc(100vw-2.5rem)] max-w-sm rounded-2xl border border-slate-200 bg-white shadow-2xl flex flex-col overflow-hidden" style={{ height: "min(560px, calc(100vh-3rem))" }}>
          {/* Header */}
          <div className="flex items-center justify-between bg-alo-navy px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-alo-orange text-white"><Sparkles className="h-4 w-4" /></div>
              <div>
                <div className="text-sm font-bold text-white">ALO Help Widget</div>
                <div className="text-[10px] text-slate-300">Scripted replies · not live support</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="grid h-7 w-7 place-items-center rounded-lg bg-white/10 text-white hover:bg-white/20"><X className="h-4 w-4" /></button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto alo-scroll p-3 space-y-3 bg-slate-50">
            {msgs.map((m, i) => (
              <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[85%] rounded-2xl px-3 py-2 text-sm", m.role === "user" ? "bg-alo-blue text-white rounded-tr-sm" : "bg-white border border-slate-200 text-alo-navy rounded-tl-sm")}>
                  <p className="leading-relaxed">{m.text}</p>
                  <div className={cn("mt-1 text-[9px]", m.role === "user" ? "text-blue-200" : "text-alo-faint")}>{m.time}</div>
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-tl-sm bg-white border border-slate-200 px-3 py-2.5">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-2 w-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Quick prompts */}
          {msgs.length <= 2 && (
            <div className="px-3 pb-2 bg-slate-50">
              <div className="text-[10px] font-semibold text-alo-faint mb-1.5">Quick questions:</div>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_PROMPTS.map((q) => (
                  <button key={q} onClick={() => send(q)} className="rounded-full border border-alo-blue/20 bg-white px-2.5 py-1 text-[10px] font-medium text-alo-blue hover:bg-alo-soft-blue">{q}</button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="border-t border-slate-200 p-3 bg-white">
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Type your message…"
                className="flex-1 h-10 rounded-xl border border-slate-200 px-3 text-sm focus:outline-none focus:border-alo-blue"
              />
              <button onClick={() => send()} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-alo-orange text-white hover:bg-[#cc3f10]"><Send className="h-4 w-4" /></button>
            </div>
            <div className="mt-1.5 flex items-center justify-center gap-1 text-[9px] text-alo-faint">
              <ShieldCheck className="h-3 w-3" />
              Scripted help text · Verify details with official sources
            </div>
          </div>
        </div>
      )}
    </>
  );
}
