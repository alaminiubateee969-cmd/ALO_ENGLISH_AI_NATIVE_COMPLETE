"use client";

import { useState } from "react";
import { Star, Quote, ChevronDown, CalendarClock, Send, ShieldCheck, Users, GraduationCap, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";

const TESTIMONIALS = [
  { name: "Tania Islam", role: "MSc Data Science · UK", score: "Scholarship 30%", quote: "ALO matched me to Edinburgh and helped me secure a 30% scholarship. The AI SOP Writer made my essay stand out.", initials: "TI" },
  { name: "Arif Rahman", role: "BEng Computer Eng · Canada", score: "Visa approved", quote: "From course shortlisting to visa stamping, the team was with me at every step. Got my Canada study permit in 3 weeks.", initials: "AR" },
  { name: "Nadia Khan", role: "Master of Nursing · Australia", score: "PR pathway", quote: "I was confused between 5 countries. My counselor built a clear comparison and Australia was perfect for nursing.", initials: "NK" },
  { name: "Rakib Hasan", role: "MS Computer Science · USA", score: "STEM OPT", quote: "The AI Study Matchmaker found me programs I never knew existed. Now I'm at a top-20 US university with STEM OPT.", initials: "RH" },
];

const FAQS = [
  { q: "Is ALO Education a registered consultancy?", a: "Yes. ALO Education is a registered education consultancy in Bangladesh with certified counselors and partnerships with 4,000+ universities across 7 countries. We follow ethical, transparent and student-first practices with no hidden fees." },
  { q: "How much does your service cost?", a: "Your first counseling session is 100% free. Many of our services — including university shortlisting, application drafting and scholarship matching — are included when you apply through us. Some premium services like 1:1 interview coaching and priority visa support have transparent fees, always shared upfront." },
  { q: "Which countries do you help students apply to?", a: "We support applications to the UK, Canada, Australia, USA, Ireland, New Zealand and Dubai (UAE). Each destination has dedicated counselors, visa specialists and scholarship experts." },
  { q: "Do you help with scholarships?", a: "Yes. We match you to merit, need-based and country-specific scholarships and help you craft winning essays. Our students have secured over ৳12 crore in scholarships including Chevening, Commonwealth, Fulbright and university merit awards." },
  { q: "Can you help with English test preparation?", a: "Yes. Our English Test Platform offers IELTS, PTE, TOEFL, Duolingo, OIETC and OET mock tests, speaking practice with the ALO Speaking Evaluator, and writing feedback. ALO Education registered students get 3 free mock tests." },
  { q: "What is your visa success rate?", a: "97%. Our visa specialists handle documentation, financial proof, SOPs and interview preparation. Every visa file is reviewed by senior counselors before submission." },
  { q: "Do you offer pre-departure support?", a: "Yes. We help with accommodation booking, airport pickup, banking, SIM cards, orientation briefings and connecting you with senior students already at your destination." },
  { q: "How does the AI Copilot work?", a: "The ALO AI Admissions Assistant helps you search courses, draft your SOP, audit your CV, practice interviews and plan your career path — 24/7 in Bangla and English. It's always supervised by certified human counselors who review and finalize every recommendation." },
];

export function AloTestimonials() {
  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="text-sm font-bold uppercase tracking-wide text-alo-orange">Success Stories</div>
          <h2 className="mt-3 text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight text-alo-navy">
            Real students. Real admissions.
          </h2>
          <p className="mt-4 text-base md:text-lg leading-8 text-alo-muted">
            Over 12,500 students have reached their dream universities with ALO Education.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="rounded-2xl border border-alo-card bg-white p-6 h-full flex flex-col alo-shadow-sm hover:alo-shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center justify-between">
                <Quote className="h-7 w-7 text-alo-orange/30" />
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="h-3.5 w-3.5 fill-alo-orange text-alo-orange" />
                  ))}
                </div>
              </div>
              <p className="mt-3 text-sm leading-7 text-alo-muted flex-1">&ldquo;{t.quote}&rdquo;</p>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-alo-blue text-white text-xs font-bold">{t.initials}</div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-alo-navy truncate">{t.name}</div>
                  <div className="text-xs text-alo-faint truncate">{t.role}</div>
                </div>
                <span className="ml-auto rounded-full bg-alo-soft-orange px-2 py-0.5 text-[10px] font-bold text-alo-orange shrink-0">{t.score}</span>
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
    <section id="faq" className="py-16 lg:py-24 bg-alo-soft-gray">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="text-sm font-bold uppercase tracking-wide text-alo-orange">FAQ</div>
          <h2 className="mt-3 text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight text-alo-navy">
            Questions, answered.
          </h2>
        </div>
        <Accordion type="single" collapsible className="space-y-3">
          {FAQS.map((faq, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="rounded-2xl border border-alo-card bg-white px-5 alo-shadow-sm">
              <AccordionTrigger className="text-left text-base font-bold text-alo-navy hover:no-underline py-5">{faq.q}</AccordionTrigger>
              <AccordionContent className="text-sm md:text-base leading-7 text-alo-muted pb-5">{faq.a}</AccordionContent>
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
  const [form, setForm] = useState({ name: "", email: "", phone: "", exam: "", country: "", intake: "", message: "" });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone) {
      toast({ title: "Please fill in your name, email and phone.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const referralCode = new URLSearchParams(window.location.search).get("ref") || undefined;
      const res = await fetch("/api/lead", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, source: "aloeducation.com", referralCode }) });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({ title: "Consultation request received!", description: "An ALO Education advisor will contact you." });
        setForm({ name: "", email: "", phone: "", exam: "", country: "", intake: "", message: "" });
      } else {
        toast({ title: "Request could not be sent", description: data.message || "Please check your details and try again.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Network error", description: "Your request was not submitted. Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-16 lg:py-24 bg-gradient-to-br from-alo-soft-blue via-white to-alo-soft-orange relative overflow-hidden">
      <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-alo-orange/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-alo-blue/10 blur-3xl pointer-events-none" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left copy */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-alo-orange/20 bg-white px-3 py-1 text-xs font-semibold text-alo-orange">
              <CalendarClock className="h-3.5 w-3.5" />
              Book Free Consultation
            </div>
            <h2 className="mt-4 text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight text-alo-navy">
              Talk to an ALO Education advisor — free.
            </h2>
            <p className="mt-4 text-base md:text-lg leading-8 text-alo-muted">
              Not sure which country or course? Book a free 1:1 session. Our certified counselors
              will build your personalized study-abroad roadmap — no obligation, no hidden fees.
            </p>
            <div className="mt-6 space-y-3">
              {[
                { icon: ShieldCheck, t: "100% free first session", d: "No obligation, no hidden fees" },
                { icon: Users, t: "Certified counselors", d: "10+ years average experience" },
                { icon: CalendarClock, t: "Flexible scheduling", d: "Online or in-person at ALO offices" },
                { icon: GraduationCap, t: "12,500+ students guided", d: "97% visa success rate" },
              ].map((b) => (
                <div key={b.t} className="flex items-start gap-3 rounded-2xl border border-alo-card bg-white p-3.5 alo-shadow-sm">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-alo-soft-orange text-alo-orange">
                    <b.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-alo-navy">{b.t}</div>
                    <div className="text-xs text-alo-faint">{b.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right form */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 lg:p-8 alo-shadow-xl">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-alo-orange" />
              <h3 className="text-xl font-extrabold text-alo-navy">Request your free session</h3>
            </div>
            <p className="text-sm text-alo-faint">We&apos;ll create a lead and an advisor will reach out within 24 hours.</p>
            <form onSubmit={onSubmit} className="mt-5 space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-semibold text-alo-navy">Full name *</Label>
                  <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" className="h-11 rounded-xl border-slate-200" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs font-semibold text-alo-navy">Phone *</Label>
                  <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+880 1XXX-XXXXXX" className="h-11 rounded-xl border-slate-200" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-alo-navy">Email *</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" className="h-11 rounded-xl border-slate-200" />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-alo-navy">Target country</Label>
                  <Select value={form.country} onValueChange={(v) => setForm({ ...form, country: v })}>
                    <SelectTrigger className="h-11 rounded-xl border-slate-200"><SelectValue placeholder="Select country" /></SelectTrigger>
                    <SelectContent>
                      {["UK", "USA", "Canada", "Australia", "Ireland", "New Zealand", "Dubai", "Not sure yet"].map((o) => (
                        <SelectItem key={o} value={o}>{o}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-alo-navy">Preferred intake</Label>
                  <Select value={form.intake} onValueChange={(v) => setForm({ ...form, intake: v })}>
                    <SelectTrigger className="h-11 rounded-xl border-slate-200"><SelectValue placeholder="Select intake" /></SelectTrigger>
                    <SelectContent>
                      {["Sep 2026", "Jan 2027", "Feb 2027", "Sep 2027", "Flexible"].map((o) => (
                        <SelectItem key={o} value={o}>{o}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="message" className="text-xs font-semibold text-alo-navy">Message (optional)</Label>
                <Textarea id="message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Tell us about your goals, target course, budget…" className="rounded-xl border-slate-200 min-h-[80px]" />
              </div>
              <Button type="submit" disabled={submitting} className="w-full h-12 rounded-xl bg-alo-orange text-white font-semibold hover:bg-[#cc3f10] disabled:opacity-50">
                {submitting ? "Sending…" : (<><Send className="mr-2 h-4 w-4" />Book Free Consultation</>)}
              </Button>
              <p className="text-[11px] text-alo-faint text-center">By submitting you agree to our Terms &amp; Privacy Policy.</p>
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
        <div className="relative overflow-hidden rounded-3xl alo-gradient-navy p-8 lg:p-14">
          <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-alo-orange/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-alo-orange/10 blur-3xl pointer-events-none" />
          <div className="relative grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight text-white">
                Ready to start your study abroad journey?
              </h2>
              <p className="mt-4 text-base md:text-lg leading-8 text-slate-200">
                Book your free consultation today. From your ambition to admission, we&apos;re with
                you all the way — counseling, applications, scholarships, visa and pre-departure.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Button onClick={onStart} className="h-12 px-6 rounded-xl bg-alo-orange text-white font-semibold hover:bg-[#cc3f10]">
                  Book Free Consultation
                </Button>
                <a href="#course-finder">
                  <Button variant="outline" className="h-12 px-6 rounded-xl border-white/30 bg-white/10 text-white hover:bg-white/20">
                    Find Courses
                  </Button>
                </a>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { v: "12,500+", l: "Students guided" },
                { v: "4,000+", l: "Universities" },
                { v: "97%", l: "Visa success" },
                { v: "৳12 Cr+", l: "Scholarships secured" },
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
