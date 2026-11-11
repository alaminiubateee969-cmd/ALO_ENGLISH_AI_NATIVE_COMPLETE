"use client";

/**
 * src/app/ask-handbook/page.tsx
 *
 * AI Study Handbook — ExamCite-style free chat (no signup required).
 *
 * Users can ask about available public study materials. Model-generated
 * answers may be incomplete or wrong; official providers remain authoritative.
 *
 * This page is PUBLIC — no login required.
 */

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, BookOpen, Sparkles, Loader2, MessageSquare, Lightbulb } from "lucide-react";

type Message = {
  role: "user" | "assistant";
  content: string;
  citedFrom?: string | null;
  materialTitle?: string | null;
  timestamp: string;
};

const SUGGESTED_QUESTIONS = [
  "What is the IELTS speaking test format?",
  "How do I improve my writing task 2 score?",
  "What are common PTE reading question types?",
  "How do I use articles (a, an, the) correctly?",
  "What is the difference between TOEFL and IELTS?",
  "How can I improve my English vocabulary?",
];

export default function AskHandbookPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [materials, setMaterials] = useState<Array<{ id: string; title: string; category: string }>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/rag/materials")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setMaterials(d.data.materials.map((m: { id: string; title: string; category: string }) => ({ id: m.id, title: m.title, category: m.category })));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const ask = async (question: string) => {
    if (!question.trim() || loading) return;

    const userMessage: Message = {
      role: "user",
      content: question,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/rag/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();

      if (data.success) {
        const assistantMessage: Message = {
          role: "assistant",
          content: data.data.answer,
          citedFrom: data.data.citedFrom,
          materialTitle: data.data.materialTitle,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Sorry, I couldn't process your question. Please try again.",
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Network error. Please check your connection and try again.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-200px)] bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-1.5 text-sm font-medium text-blue-700">
            <Sparkles className="h-4 w-4" />
            Public · No Sign-Up · Provider availability required
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            AI Study Handbook
          </h1>
          <p className="mt-2 text-slate-600">
            Ask about the public materials currently available. Generated answers may be incomplete
            or inaccurate; confirm exam formats and requirements with official providers.
          </p>
        </div>

        {/* Available materials */}
        {materials.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs font-medium text-slate-500">Knowledge base:</span>
            {materials.slice(0, 5).map((m) => (
              <Badge key={m.id} variant="secondary" className="text-xs">
                <BookOpen className="mr-1 h-3 w-3" /> {m.title}
              </Badge>
            ))}
          </div>
        )}

        {/* Chat interface */}
        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-white/50">
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              Ask the Handbook
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Messages */}
            <div className="max-h-[450px] min-h-[300px] space-y-4 overflow-y-auto p-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                    <Lightbulb className="h-8 w-8 text-blue-500" />
                  </div>
                  <p className="mb-1 font-medium text-slate-700">Ask me anything about English exams</p>
                  <p className="mb-6 text-sm text-slate-500">Try one of these suggested questions:</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {SUGGESTED_QUESTIONS.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => ask(q)}
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-left text-sm text-slate-700 transition hover:border-blue-300 hover:bg-blue-50"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                      msg.role === "user"
                        ? "rounded-tr-sm bg-blue-500 text-white"
                        : "rounded-tl-sm bg-slate-100 text-slate-800"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    {msg.role === "assistant" && msg.materialTitle && (
                      <div className="mt-2 flex items-center gap-2 border-t border-slate-200 pt-2 text-xs text-slate-500">
                        <BookOpen className="h-3 w-3" />
                        <span>Cited from: {msg.materialTitle}</span>

                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-3 text-sm text-slate-500">
                    <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                    Searching study material...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-slate-200 p-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  ask(input);
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question about English exams..."
                  className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  disabled={loading}
                />
                <Button type="submit" disabled={loading || !input.trim()} className="gap-2">
                  <Send className="h-4 w-4" />
                  Ask
                </Button>
              </form>
              <p className="mt-2 text-center text-xs text-slate-400">
                AI answers are grounded in study material. Not an official exam resource.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
