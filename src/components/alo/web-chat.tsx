"use client";

/**
 * src/components/alo/web-chat.tsx
 *
 * Floating chat assistant for the ALO homepage. This is the entry point
 * that guides a visitor from chat → exam selection → registration → student
 * portal → exam.
 *
 * The AI is OWN AI: every reply comes from the rule-based ChatEngine via
 * POST /api/chat. No external LLM is called. The button floats at the
 * bottom-right of every page where the component is mounted.
 *
 * The chat ships with:
 *   - quick-reply buttons (the engine suggests them per state)
 *   - typing indicator while the request is in flight
 *   - automatic scroll to the latest message
 *   - portal-link chips that navigate to /practice-test, /study-plan,
 *     /shortcuts, or /login
 *   - success state when the chat registers a new student (their ALO
 *     student ID is shown and they are auto-logged-in by the API)
 *   - graceful error handling (rate-limit, network failures)
 *   - mobile-first responsive layout
 *   - keyboard accessible (Enter to send, Esc to close, focus trap)
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, X, Send, Sparkles, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────

type ChatRole = "assistant" | "user";

type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  time: string;
  /** Optional quick-reply buttons attached to this assistant message. */
  quickReplies?: QuickReply[];
  /** Optional portal link chip the user can click to navigate. */
  portalLink?: string;
};

type QuickReply = {
  label: string;
  value: string;
};

type ChatState =
  | "greeting"
  | "exam_selection"
  | "exam_info"
  | "account_check"
  | "registration_collect_name"
  | "registration_collect_email"
  | "registration_collect_edu_id"
  | "registration_collect_password"
  | "registration_submitting"
  | "portal_redirect"
  | "faq";

type ChatDraft = {
  name?: string;
  email?: string;
  educationalId?: string;
  examInterest?: string | null;
};

type ApiChatResponse = {
  success: boolean;
  data?: {
    reply: {
      text: string;
      nextState: ChatState;
      quickReplies?: QuickReply[];
      portalLink?: string;
    };
    context: {
      state: ChatState;
      draft: ChatDraft;
      turnCount: number;
    };
    loggedInAs?: string | null;
  };
  message?: string;
};

// ─── Constants ──────────────────────────────────────────────────────────

const STORAGE_KEY = "alo-web-chat-context";
const OPEN_KEY = "alo-web-chat-open";

const GREETING_TEXT =
  "Welcome to ALO English! I'm your AI assistant. I can help you pick an exam, register for a student account, and start a mock test. Would you like to practice for an English exam?";

const GREETING_QUICK_REPLIES: QuickReply[] = [
  { label: "Yes, practice for an exam", value: "yes" },
  { label: "Which exams are available?", value: "which exams" },
  { label: "How do I register?", value: "how do I register" },
  { label: "Is it free?", value: "is it free" },
];

const PASSWORD_STATES: ChatState[] = [
  "registration_collect_password",
  "registration_submitting",
];

// ─── Helpers ────────────────────────────────────────────────────────────

function now(): string {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function newId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function isPasswordState(state: ChatState): boolean {
  return PASSWORD_STATES.includes(state);
}

// ─── Component ──────────────────────────────────────────────────────────

export function WebChat() {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [state, setState] = useState<ChatState>("greeting");
  const [draft, setDraft] = useState<ChatDraft>({});
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unmounted, setUnmounted] = useState(false);

  const endRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const sessionStartedRef = useRef(false);

  // ─── Restore session from localStorage on mount ─────────────────────
  useEffect(() => {
    setUnmounted(false);
    try {
      const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      if (stored) {
        const parsed = JSON.parse(stored) as {
          messages?: ChatMessage[];
          state?: ChatState;
          draft?: ChatDraft;
        };
        if (parsed.messages && parsed.messages.length > 0) {
          setMessages(parsed.messages);
          setState(parsed.state || "greeting");
          setDraft(parsed.draft || {});
          sessionStartedRef.current = true;
          return;
        }
      }
    } catch {
      // ignore malformed storage
    }
    // First visit: greet the user once they open the chat.
  }, []);

  // ─── Persist context whenever it changes ─────────────────────────────
  useEffect(() => {
    if (unmounted) return;
    if (messages.length === 0) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ messages, state, draft }),
      );
    } catch {
      // storage might be full or disabled — non-fatal
    }
  }, [messages, state, draft, unmounted]);

  // ─── Restore open/closed state from sessionStorage ───────────────────
  useEffect(() => {
    try {
      if (typeof window !== "undefined" && sessionStorage.getItem(OPEN_KEY) === "1") {
        setOpen(true);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (unmounted) return;
    try {
      if (typeof window !== "undefined") {
        if (open) sessionStorage.setItem(OPEN_KEY, "1");
        else sessionStorage.removeItem(OPEN_KEY);
      }
    } catch {
      // ignore
    }
  }, [open, unmounted]);

  // ─── Auto-scroll to latest message ──────────────────────────────────
  useEffect(() => {
    if (unmounted) return;
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isTyping, unmounted]);

  // ─── Focus input when chat opens ────────────────────────────────────
  useEffect(() => {
    if (unmounted) return;
    if (open && !isTyping) {
      const t = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(t);
    }
  }, [open, isTyping, unmounted]);

  // ─── Esc closes the chat ────────────────────────────────────────────
  useEffect(() => {
    if (unmounted) return;
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, unmounted]);

  // ─── Cleanup on unmount ─────────────────────────────────────────────
  useEffect(() => {
    return () => {
      setUnmounted(true);
    };
  }, []);

  // ─── Boot the conversation when the user first opens the chat ───────
  const ensureGreeting = useCallback(() => {
    if (sessionStartedRef.current) return;
    sessionStartedRef.current = true;
    setMessages([
      {
        id: newId(),
        role: "assistant",
        text: GREETING_TEXT,
        time: now(),
        quickReplies: GREETING_QUICK_REPLIES,
      },
    ]);
  }, []);

  // ─── Send a message to the API and append the reply ─────────────────
  const sendMessage = useCallback(
    async (rawText: string) => {
      const text = rawText.trim();
      if (!text || isTyping) return;

      setError(null);

      // Append the user's message locally first.
      const userMsg: ChatMessage = {
        id: newId(),
        role: "user",
        text: isPasswordState(state) ? "•••••••••" : text,
        time: now(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsTyping(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            state,
            draft,
          }),
        });

        const json: ApiChatResponse = await res.json().catch(() => ({
          success: false,
          message: "Couldn't reach the chat server.",
        }));

        if (!json.success || !json.data) {
          const reason = json.message || "Chat error";
          setError(reason);
          // Still append a graceful assistant message so the user isn't stuck.
          setMessages((prev) => [
            ...prev,
            {
              id: newId(),
              role: "assistant",
              text: `I hit a snag: ${reason}. Please try again in a moment.`,
              time: now(),
              quickReplies: GREETING_QUICK_REPLIES,
            },
          ]);
          return;
        }

        const { reply, context, loggedInAs } = json.data;

        // Detect a successful registration: the success reply always
        // mentions "Student ID:" (see ChatEngine.registrationSuccessReply).
        // When that happens, refresh the router so the new session cookie is
        // reflected on the destination page when the user clicks through.
        const justRegistered = /Student ID:/i.test(reply.text);
        if (loggedInAs || justRegistered) {
          router.refresh();
        }

        setMessages((prev) => [
          ...prev,
          {
            id: newId(),
            role: "assistant",
            text: reply.text,
            time: now(),
            quickReplies: reply.quickReplies,
            portalLink: reply.portalLink,
          },
        ]);
        setState(context.state);
        setDraft(context.draft);
      } catch (err) {
        const reason = err instanceof Error ? err.message : "Network error";
        setError(reason);
        setMessages((prev) => [
          ...prev,
          {
            id: newId(),
            role: "assistant",
            text: "I couldn't reach the server. Please check your connection and try again.",
            time: now(),
            quickReplies: GREETING_QUICK_REPLIES,
          },
        ]);
      } finally {
        setIsTyping(false);
      }
    },
    [state, draft, isTyping, router],
  );

  // ─── Quick reply click → treat as a normal send ─────────────────────
  const onQuickReply = useCallback(
    (qr: QuickReply) => {
      sendMessage(qr.value);
    },
    [sendMessage],
  );

  // ─── Navigate when the portal link chip is clicked ──────────────────
  const onPortalLink = useCallback(
    (href: string) => {
      // Internal link — use client-side navigation when possible.
      if (href.startsWith("/")) {
        router.push(href);
      } else {
        window.location.href = href;
      }
    },
    [router],
  );

  // ─── Submit handler ─────────────────────────────────────────────────
  const onSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      sendMessage(input);
    },
    [input, sendMessage],
  );

  const showPasswordMask = isPasswordState(state);

  return (
    <>
      {/* Floating launcher button */}
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          ensureGreeting();
        }}
        className={cn(
          "fixed bottom-5 right-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-[#CC3F10] text-white shadow-lg transition-all hover:bg-[#A8320D] hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8501A] focus-visible:ring-offset-2",
          open && "hidden",
        )}
        aria-label="Open ALO chat assistant"
        aria-expanded={open}
      >
        <MessageSquare className="h-6 w-6" aria-hidden="true" />
        <span className="sr-only">Open chat with the ALO AI assistant</span>
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
        </span>
      </button>

      {/* Chat window */}
      {open && (
        <div
          role="dialog"
          aria-modal="false"
          aria-labelledby="web-chat-title"
          className="fixed bottom-5 right-5 z-50 flex max-h-[88vh] w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          style={{ height: "min(580px, calc(100vh - 3rem))" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between bg-[#0B1F3A] px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-[#CC3F10] text-white">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="leading-tight">
                <div id="web-chat-title" className="text-sm font-bold text-white">
                  ALO AI Assistant
                </div>
                <div className="text-[10px] text-slate-300">
                  Rule-based · your own AI · no paid API
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="grid h-7 w-7 place-items-center rounded-lg bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {/* Messages */}
          <div
            className="alo-scroll flex-1 space-y-3 overflow-y-auto bg-slate-50 p-3"
            aria-live="polite"
            aria-atomic="false"
          >
            {messages.length === 0 && (
              <div className="py-8 text-center text-sm text-slate-400">
                Loading the conversation…
              </div>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "flex",
                  m.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[88%] rounded-2xl px-3 py-2 text-sm",
                    m.role === "user"
                      ? "rounded-tr-sm bg-[#0057B8] text-white"
                      : "rounded-tl-sm border border-slate-200 bg-white text-[#0B1F3A]",
                  )}
                >
                  <div
                    className={cn(
                      "mb-0.5 flex items-center gap-1.5 text-[10px] font-medium",
                      m.role === "user" ? "text-blue-200" : "text-slate-400",
                    )}
                  >
                    {m.role === "assistant" ? (
                      <Sparkles className="h-3 w-3" aria-hidden="true" />
                    ) : (
                      <MessageSquare className="h-3 w-3" aria-hidden="true" />
                    )}
                    {m.role === "assistant" ? "ALO AI" : "You"}
                  </div>
                  <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                  <div
                    className={cn(
                      "mt-1 text-[9px]",
                      m.role === "user" ? "text-blue-200" : "text-slate-400",
                    )}
                  >
                    {m.time}
                  </div>

                  {/* Quick replies */}
                  {m.role === "assistant" && m.quickReplies && m.quickReplies.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {m.quickReplies.map((qr) => (
                        <button
                          key={qr.label}
                          type="button"
                          disabled={isTyping}
                          onClick={() => onQuickReply(qr)}
                          className="rounded-full border border-[#0057B8]/20 bg-white px-2.5 py-1 text-[10px] font-medium text-[#0057B8] transition-colors hover:bg-[#EEF6FF] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0057B8]"
                        >
                          {qr.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Portal link chip */}
                  {m.role === "assistant" && m.portalLink && (
                    <button
                      type="button"
                      onClick={() => onPortalLink(m.portalLink!)}
                      className="mt-2 inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#CC3F10] px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[#A8320D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8501A]"
                    >
                      Open link <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      <span className="sr-only">{m.portalLink}</span>
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-3 py-2.5">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300" style={{ animationDelay: "150ms" }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={endRef} />
          </div>

          {/* Error banner */}
          {error && (
            <div className="border-t border-red-100 bg-red-50 px-3 py-2 text-[11px] text-red-700">
              {error}
            </div>
          )}

          {/* Input */}
          <form onSubmit={onSubmit} className="border-t border-slate-200 bg-white p-3">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type={showPasswordMask ? "password" : "text"}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isTyping}
                placeholder={showPasswordMask ? "Type a password (min 12 chars)…" : "Type your message…"}
                autoComplete={showPasswordMask ? "new-password" : "off"}
                maxLength={500}
                className="h-10 flex-1 rounded-xl border border-slate-200 px-3 text-sm focus:border-[#0057B8] focus:outline-none focus:ring-2 focus:ring-[#0057B8]/30 disabled:bg-slate-50"
                aria-label="Type your message"
              />
              <button
                type="submit"
                disabled={isTyping || !input.trim()}
                aria-label="Send message"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#CC3F10] text-white transition-colors hover:bg-[#A8320D] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8501A]"
              >
                {isTyping ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>
            <div className="mt-1.5 flex items-center justify-center gap-1 text-[9px] text-slate-400">
              <ShieldCheck className="h-3 w-3" aria-hidden="true" />
              Rule-based AI · No data leaves this site ·{" "}
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    localStorage.removeItem(STORAGE_KEY);
                  }
                  setMessages([
                    {
                      id: newId(),
                      role: "assistant",
                      text: GREETING_TEXT,
                      time: now(),
                      quickReplies: GREETING_QUICK_REPLIES,
                    },
                  ]);
                  setState("greeting");
                  setDraft({});
                  setError(null);
                  sessionStartedRef.current = true;
                }}
                className="font-medium text-[#0057B8] underline-offset-2 hover:underline"
              >
                Reset chat
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

export default WebChat;
