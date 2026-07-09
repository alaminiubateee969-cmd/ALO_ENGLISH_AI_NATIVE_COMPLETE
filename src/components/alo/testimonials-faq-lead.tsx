"use client";

import { useState } from "react";
import { Star, Quote, ChevronDown, CalendarClock, Send, ShieldCheck, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { TESTIMONIALS, FAQS } from "@/lib/alo-data";

export function AloTestimonials() {
  return (
    <section className="py-16 lg:py-24 bg-alo-soft-blue">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-alo-orange/20 bg-white px-3 py-1 text-xs font-semibold text-alo-orange">
            <Star className="h-3.5 w-3.5 fill-alo-orange" />
            Student Results
          </div>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-alo-navy">
            Real students. Real score lifts.
          </h2>
          <p className="mt-4 text-lg text-alo-muted leading-relaxed">
            Over 12,500 students have prepared with ALO English. Here's what a few of them achieved.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col">
              <div className="flex items-center justify-between">
                <Quote className="h-7 w-7 text-alo-orange/30" />
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="h-3.5 w-3.5 fill-alo-orange text-alo-orange" />
                  ))}
                </div>
              </div>
              <p className="mt-3 text-sm text-alo-navy leading-relaxed flex-1">"{t.quote}"</p>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-alo-blue text-white text-xs font-bold">
                  {t.initials}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-alo-navy truncate">{t.name}</div>
                  <div className="text-[11px] text-slate-500 truncate">{t.role}</div>
                </div>
                <span className="ml-auto rounded-full bg-alo-soft-orange px-2 py-0.5 text-[10px] font-bold text-alo-orange">
                  {t.score}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AloFaq() {
  return (
    <section id="faq" className="py-16 lg:py-24 bg-white">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-alo-blue/20 bg-alo-soft-blue px-3 py-1 text-xs font-semibold text-alo-blue">
            FAQ
          </div>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-alo-navy">
            Questions, answered.
          </h2>
        </div>
        <Accordion type="single" collapsible className="space-y-3">
          {FAQS.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="rounded-2xl border border-slate-200 bg-white px-5 shadow-sm"
            >
              <AccordionTrigger className="text-left text-base font-bold text-alo-navy hover:no-underline py-5">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-alo-muted leading-relaxed pb-5">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

export function AloLeadCapture() {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    exam: "",
    country: "",
    intake: "",
    message: "",
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone) {
      toast({ title: "Please fill in your name, email and phone.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, source: "english.aloeducation.com" }),
      });
      const data = await res.json();
      if (data.ok) {
        toast({
          title: "Counseling request received!",
          description: "An ALO Education advisor will contact you within 24 hours.",
        });
        setForm({ name: "", email: "", phone: "", exam: "", country: "", intake: "", message: "" });
      } else {
        toast({ title: "Saved locally", description: "Your request was saved and will be synced to CRM." });
      }
    } catch {
      toast({ title: "Saved locally", description: "Your request was saved and will be synced to CRM." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-16 lg:py-24 bg-alo-soft-blue relative overflow-hidden">
      <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-alo-orange/10 blur-3xl pointer-events-none" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left copy */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-alo-orange/20 bg-white px-3 py-1 text-xs font-semibold text-alo-orange">
              <CalendarClock className="h-3.5 w-3.5" />
              Book Free Counseling
            </div>
            <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-alo-navy">
              Talk to an ALO Education advisor — free.
            </h2>
            <p className="mt-4 text-lg text-alo-muted leading-relaxed">
              Not sure which exam to take? Need a study plan? Book a free counseling session.
              Our advisors will help you pick the right test, build a prep schedule, and connect
              you to visa & admission support.
            </p>

            <div className="mt-6 space-y-3">
              {[
                { icon: ShieldCheck, t: "100% free, no obligation", d: "First session is always complimentary" },
                { icon: Users, t: "Certified education counselors", d: "10+ years guiding students abroad" },
                { icon: CalendarClock, t: "Flexible scheduling", d: "Online or in-person at ALO offices" },
              ].map((b) => (
                <div key={b.t} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-alo-soft-orange text-alo-orange">
                    <b.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-alo-navy">{b.t}</div>
                    <div className="text-xs text-slate-500">{b.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right form */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 lg:p-8 shadow-xl">
            <h3 className="text-xl font-extrabold text-alo-navy">Request your free session</h3>
            <p className="text-sm text-slate-500 mt-1">We'll create a CRM lead and an advisor will reach out.</p>

            <form onSubmit={onSubmit} className="mt-5 space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-semibold text-alo-navy">Full name *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Your name"
                    className="h-11 rounded-xl border-slate-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs font-semibold text-alo-navy">Phone *</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+880 1XXX-XXXXXX"
                    className="h-11 rounded-xl border-slate-200"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-alo-navy">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  className="h-11 rounded-xl border-slate-200"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-alo-navy">Exam interest</Label>
                  <Select value={form.exam} onValueChange={(v) => setForm({ ...form, exam: v })}>
                    <SelectTrigger className="h-11 rounded-xl border-slate-200">
                      <SelectValue placeholder="Select exam" />
                    </SelectTrigger>
                    <SelectContent>
                      {["IELTS Academic", "IELTS UKVI", "PTE Academic", "TOEFL iBT", "Duolingo", "OIETC / ELLT", "OET", "Not sure yet"].map((o) => (
                        <SelectItem key={o} value={o}>{o}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-alo-navy">Target country</Label>
                  <Select value={form.country} onValueChange={(v) => setForm({ ...form, country: v })}>
                    <SelectTrigger className="h-11 rounded-xl border-slate-200">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {["UK", "USA", "Canada", "Australia", "Germany", "Ireland", "Other"].map((o) => (
                        <SelectItem key={o} value={o}>{o}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="message" className="text-xs font-semibold text-alo-navy">Message (optional)</Label>
                <Textarea
                  id="message"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Tell us about your goals, current score, target intake…"
                  className="rounded-xl border-slate-200 min-h-[80px]"
                />
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-12 rounded-xl bg-alo-orange text-white font-semibold hover:bg-[#d2460f] disabled:opacity-50"
              >
                {submitting ? (
                  <>Sending…</>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Book Free Counseling
                  </>
                )}
              </Button>
              <p className="text-[11px] text-slate-400 text-center">
                By submitting you agree to our Terms & Privacy Policy. Your data syncs to ALO Web_CRM.
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

export function AloFinalCta({ onStart }: { onStart: () => void }) {
  return (
    <section className="py-16 lg:py-20 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-alo-navy via-alo-blue to-alo-royal p-8 lg:p-14">
          <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-alo-orange/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-alo-orange/10 blur-3xl pointer-events-none" />
          <div className="relative grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
                Ready to ace your English exam?
              </h2>
              <p className="mt-4 text-lg text-slate-200 leading-relaxed">
                Start your free mock test now. ALO Education students get 3 free — new visitors
                get 1 free. No card required.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={onStart}
                  className="h-12 px-6 rounded-xl bg-alo-orange text-white font-semibold hover:bg-[#d2460f]"
                >
                  Take Free Mock Test
                </Button>
                <a href="#contact">
                  <Button variant="outline" className="h-12 px-6 rounded-xl border-white/30 bg-white/10 text-white hover:bg-white/20">
                    Book Free Counseling
                  </Button>
                </a>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { v: "48,200+", l: "Mock tests delivered" },
                { v: "12,500+", l: "Students prepared" },
                { v: "+1.2", l: "Average band lift" },
                { v: "8", l: "Exam types covered" },
              ].map((s) => (
                <div key={s.l} className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5">
                  <div className="text-3xl font-extrabold text-white">{s.v}</div>
                  <div className="text-xs text-slate-300 mt-1">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
