"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Sparkles, ShieldCheck, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Msg = { role: "bot" | "user"; text: string; time: string };

const QUICK_PROMPTS = [
  "How do I start a mock test?",
  "What is the free quota?",
  "How is my score calculated?",
  "Can I download my certificate?",
  "What exams are available?",
];

function botReply(userText: string): string {
  const t = userText.toLowerCase();
  if (t.includes("start") && t.includes("mock")) return "To start a mock test: 1) Login or register, 2) Go to Practice Tests, 3) Choose Quick Practice or Full Mock, 4) Select your exam type, 5) Click Start. Your answers autosave and you'll get a Smart Score Report when you submit.";
  if (t.includes("free") && (t.includes("quota") || t.includes("mock"))) return "ALO Education registered students receive 3 free mock tests total. New visitors receive 1 free mock test. This quota is shared across all 32 exams and enforced on our backend — refreshing the browser won't reset it.";
  if (t.includes("score") && t.includes("calcul")) return "Your estimated score is calculated by the ALO Estimated Score Engine based on correct answers (for objective questions) and rubric-based evaluation (for writing/speaking). Scores are practice estimates only — not official exam results.";
  if (t.includes("certificate") || t.includes("cert")) return "After each completed mock test, the ALO Certify system auto-generates a practice completion certificate with a unique verification hash. You can download it as PDF from your dashboard. It includes a practice-only disclaimer.";
  if (t.includes("exam") && t.includes("available")) return "We support 32 computer-based exams across 5 categories: English Proficiency (IELTS, PTE, TOEFL, Duolingo, OIETC, OET, LanguageCert, Linguaskill, ALO Placement), Study Abroad (SAT, ACT, GRE, GMAT, LSAT, MCAT), University Internal, Visa & Interview, and ALO Internal.";
  if (t.includes("ielts")) return "We offer IELTS-style practice tests for Academic, General Training, and UKVI. Each covers Listening, Reading, Writing (Task 1 + Task 2), and Speaking (Part 1, 2, 3). Practice estimate only — not an official IELTS score.";
  if (t.includes("pte")) return "PTE-style practice covers all 20 question types including Read Aloud, Repeat Sentence, Describe Image, Summarize Written Text, Essay, Fill Blanks, Reorder Paragraphs, and Write From Dictation.";
  if (t.includes("speaking")) return "Speaking practice uses the ALO Practice Examiner (a digital evaluation session). You'll see a cue card, get preparation time, record your answer via microphone, and receive scores for fluency, pronunciation, grammar, lexical resource, coherence, and confidence.";
  if (t.includes("writing")) return "Writing evaluation uses Automated Practice Feedback. Submit your essay and get estimated scores for task achievement, coherence, vocabulary, and grammar — plus an improvement plan. Practice estimate only.";
  if (t.includes("refund")) return "Refund policy: Free mock tests are non-refundable (no charge). Paid mock tests may be refunded within 7 days if no attempt was started. Voucher purchases are non-refundable once used. Contact support@aloeducation.com for refund requests.";
  if (t.includes("privacy") || t.includes("data")) return "Your data is protected under our Privacy Policy. We sync your exam activity to ALO Web_CRM so your counselor can guide you. We never share private data publicly. You can download or delete your data from Settings.";
  if (t.includes("human") || t.includes("examiner") || t.includes("real")) return "Some practice tests, scoring, feedback, and interview simulations may be supported by automated digital evaluation tools. This is a practice platform only, not an official exam result. We never claim a real human examiner — the ALO Practice Examiner is a digital evaluation session.";
  if (t.includes("hello") || t.includes("hi") || t.includes("hey")) return "Hello! I'm the ALO Support Assistant. I can help with mock tests, free quota, scores, certificates, exams, and policies. What would you like to know?";
  if (t.includes("thank")) return "You're welcome! If you need more help, you can also book a free counseling session with an ALO Education advisor. Good luck with your practice!";
  if (t.includes("book") || t.includes("counsel")) return "You can book a free counseling session by scrolling to the 'Book Free Consultation' section on the homepage, or from your student dashboard. An ALO Education advisor will contact you within 24 hours.";
  return "I'm the ALO Support Assistant. I can help with: mock tests, free quota, scoring, certificates, available exams, speaking/writing practice, privacy, refunds, and more. Try one of the quick questions below, or ask me anything!";
}

export function AiChatbot() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "bot", text: "Hi! I'm the ALO Support Assistant. I can help with mock tests, free quota, scores, certificates, exams, and policies. How can I help you today?", time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
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
          <span className="absolute -top-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-alo-blue text-[10px] font-bold text-white">AI</span>
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
                <div className="text-sm font-bold text-white">ALO Support Assistant</div>
                <div className="flex items-center gap-1 text-[10px] text-emerald-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Online now</div>
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
              ALO Support Assistant · Practice platform only · Not official exam guidance
            </div>
          </div>
        </div>
      )}
    </>
  );
}
