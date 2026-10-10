"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, Copy, Download, Facebook, FileText, Instagram, Layout,
  Linkedin, Mail, Megaphone, Newspaper, Package, Save, Sparkles,
  Trash2, Twitter, type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DEFAULT_MARKETING_FACTS,
  generateMarketingDraft,
  MARKETING_CONTENT_TYPES,
  type MarketingBrief,
  type MarketingContentType,
} from "@/lib/marketing-content";
import type { ModuleId } from "./module-registry";

type Nav = { navigate: (id: ModuleId) => void };
type CampaignDraft = {
  id: string;
  title: string;
  type: MarketingContentType;
  brief: MarketingBrief;
  content: string;
  updatedAt: string;
};

const STORAGE_KEY = "alo.marketing.drafts.v1";
const CHANNEL_ICONS: Record<MarketingContentType, LucideIcon> = {
  "Facebook Post": Facebook,
  "Instagram Caption": Instagram,
  "LinkedIn Post": Linkedin,
  "X Post": Twitter,
  "Blog Article": FileText,
  "Email Newsletter": Mail,
  "Landing Page": Layout,
  "Product Description": Package,
  "Press Release": Newspaper,
};

async function copyText(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const input = document.createElement("textarea");
  input.value = value;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.select();
  const copied = document.execCommand("copy");
  input.remove();
  if (!copied) throw new Error("Clipboard access is unavailable");
}

export default function Marketing({ navigate }: Nav) {
  const [type, setType] = useState<MarketingContentType>(MARKETING_CONTENT_TYPES[0].id);
  const [offer, setOffer] = useState("ALO English practice");
  const [audience, setAudience] = useState("Students preparing for IELTS, PTE, TOEFL or Duolingo");
  const [facts, setFacts] = useState(DEFAULT_MARKETING_FACTS);
  const [tone, setTone] = useState("clear and encouraging");
  const [callToAction, setCallToAction] = useState("Explore practice tests");
  const [url, setUrl] = useState("https://english.aloeducation.com/practice-test");
  const [content, setContent] = useState("");
  const [drafts, setDrafts] = useState<CampaignDraft[]>([]);
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState("");

  const selectedType = useMemo(
    () => MARKETING_CONTENT_TYPES.find((item) => item.id === type) ?? MARKETING_CONTENT_TYPES[0],
    [type],
  );

  useEffect(() => {
    let cancelled = false;
    async function loadDrafts() {
      // Defer the browser read until after hydration so server and first client
      // renders remain identical.
      await Promise.resolve();
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!cancelled && raw) {
          const parsed: unknown = JSON.parse(raw);
          if (Array.isArray(parsed)) setDrafts(parsed as CampaignDraft[]);
        }
      } catch {
        if (!cancelled) setNotice("Saved drafts could not be read from this browser.");
      }
    }
    void loadDrafts();
    return () => { cancelled = true; };
  }, []);

  function updateSavedDrafts(next: CampaignDraft[]) {
    setDrafts(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      setNotice("This browser could not save your latest draft. Download it to keep a copy.");
    }
  }

  const currentBrief: MarketingBrief = { type, offer, audience, facts, tone, callToAction, url };

  function generate() {
    if (!offer.trim()) {
      setNotice("Add an offer or topic before creating a draft.");
      return;
    }
    setContent(generateMarketingDraft(currentBrief));
    setNotice("Template draft created. Review all details before publishing.");
  }

  function saveDraft() {
    if (!content.trim()) return;
    const now = new Date();
    const draft: CampaignDraft = {
      id: `${now.getTime().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      title: `${offer.trim()} · ${selectedType.label}`,
      type,
      brief: currentBrief,
      content,
      updatedAt: now.toISOString(),
    };
    updateSavedDrafts([draft, ...drafts].slice(0, 50));
    setNotice("Draft saved in this browser only.");
  }

  async function handleCopy() {
    if (!content) return;
    try {
      await copyText(content);
      setCopied(true);
      setNotice("Copy is ready to paste.");
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setNotice("Copy failed. Select the text in the preview and copy it manually.");
    }
  }

  function downloadDraft() {
    if (!content) return;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = `${offer.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "alo-campaign"}-${type.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.txt`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    setNotice("Draft downloaded as a text file.");
  }

  function restoreDraft(draft: CampaignDraft) {
    setType(draft.type);
    setOffer(draft.brief.offer);
    setAudience(draft.brief.audience);
    setFacts(draft.brief.facts);
    setTone(draft.brief.tone);
    setCallToAction(draft.brief.callToAction);
    setUrl(draft.brief.url || "");
    setContent(draft.content);
    setNotice("Draft loaded. Edit it before publishing.");
  }

  function deleteDraft(id: string) {
    updateSavedDrafts(drafts.filter((draft) => draft.id !== id));
    setNotice("Draft deleted from this browser.");
  }

  const overLimit = content.length > selectedType.charLimit;

  return (
    <main className="min-h-screen bg-[#0B1220] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#E8501A]">
              <Megaphone className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-200">ALO English</p>
              <h1 className="text-2xl font-bold sm:text-3xl">Marketing Studio</h1>
              <p className="text-sm text-white/60">Grounded campaign drafts, channel by channel.</p>
            </div>
          </div>
          <Button type="button" variant="outline" onClick={() => navigate("home")} className="min-h-11 border-white/20 bg-white/5 text-white hover:bg-white/10">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            AI OS home
          </Button>
        </div>

        <div className="rounded-xl border border-sky-300/20 bg-sky-300/5 px-4 py-3 text-sm leading-6 text-sky-100">
          This studio creates editable, template-based drafts in your browser; it does not publish posts or call an AI model. Add only claims you can verify. Drafts are stored on this device.
        </div>

        <section aria-labelledby="channel-title">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 id="channel-title" className="text-sm font-semibold uppercase tracking-wider text-white/70">Choose a format</h2>
              <p className="mt-1 text-xs text-white/45">Length guidance is a draft target; check the platform before posting.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9">
            {MARKETING_CONTENT_TYPES.map((item) => {
              const Icon = CHANNEL_ICONS[item.id];
              const active = item.id === type;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setType(item.id)}
                  className={`flex min-h-20 flex-col items-start justify-between rounded-xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 ${active ? "border-[#E8501A] bg-[#E8501A]/15" : "border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10"}`}
                >
                  <Icon className="h-4 w-4 text-orange-300" aria-hidden="true" />
                  <span className="mt-2 text-xs font-semibold leading-4">{item.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        <div className="grid items-start gap-6 xl:grid-cols-2">
          <Card className="border-white/10 bg-white/[0.04] text-white shadow-none">
            <CardHeader>
              <CardTitle>Campaign brief</CardTitle>
              <CardDescription className="text-white/60">{selectedType.label} · recommended draft length up to {selectedType.charLimit.toLocaleString()} characters</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); generate(); }}>
                <div className="space-y-2">
                  <Label htmlFor="marketing-offer">Offer or topic</Label>
                  <Input id="marketing-offer" value={offer} onChange={(event) => setOffer(event.target.value)} maxLength={160} placeholder="What are you promoting?" className="border-white/15 bg-white/5 text-white placeholder:text-white/40" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="marketing-audience">Audience</Label>
                  <Input id="marketing-audience" value={audience} onChange={(event) => setAudience(event.target.value)} maxLength={180} placeholder="Who is this for?" className="border-white/15 bg-white/5 text-white placeholder:text-white/40" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="marketing-facts">Verified facts to include</Label>
                  <Textarea id="marketing-facts" value={facts} onChange={(event) => setFacts(event.target.value)} maxLength={1600} rows={4} placeholder="Only enter approved, verifiable details." className="border-white/15 bg-white/5 text-white placeholder:text-white/40" />
                  <p className="text-xs text-white/45">Separate facts with new lines. The template will not invent metrics or testimonials.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="marketing-tone">Tone</Label>
                    <Input id="marketing-tone" value={tone} onChange={(event) => setTone(event.target.value)} maxLength={80} className="border-white/15 bg-white/5 text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="marketing-cta">Call to action</Label>
                    <Input id="marketing-cta" value={callToAction} onChange={(event) => setCallToAction(event.target.value)} maxLength={100} className="border-white/15 bg-white/5 text-white" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="marketing-url">Destination URL (optional)</Label>
                  <Input id="marketing-url" type="url" value={url} onChange={(event) => setUrl(event.target.value)} maxLength={300} placeholder="https://…" className="border-white/15 bg-white/5 text-white placeholder:text-white/40" />
                </div>
                <Button type="submit" className="min-h-11 w-full bg-[#E8501A] font-semibold text-white hover:bg-[#cf4114]">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  Build template draft
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.04] text-white shadow-none">
            <CardHeader>
              <CardTitle>Draft preview</CardTitle>
              <CardDescription className="text-white/60">Edit the copy here, then copy, download or save it.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                aria-label="Editable marketing draft"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Your draft will appear here. Generate one from the brief or open a saved draft."
                rows={18}
                className="min-h-[360px] resize-y border-white/15 bg-black/20 font-mono text-sm leading-6 text-white placeholder:text-white/35"
              />
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className={overLimit ? "font-semibold text-amber-300" : "text-white/55"} aria-live="polite">
                  {content.length.toLocaleString()} / {selectedType.charLimit.toLocaleString()} characters{overLimit ? ` · ${ (content.length - selectedType.charLimit).toLocaleString()} over guidance` : ""}
                </span>
                {overLimit && <span className="text-amber-200">Trim before posting if the destination requires it.</span>}
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <Button type="button" onClick={handleCopy} disabled={!content} className="min-h-11 bg-[#0057B8] text-white hover:bg-[#004a9e]">
                  <Copy className="h-4 w-4" aria-hidden="true" />{copied ? "Copied" : "Copy"}
                </Button>
                <Button type="button" variant="outline" onClick={downloadDraft} disabled={!content} className="min-h-11 border-white/20 bg-transparent text-white hover:bg-white/10">
                  <Download className="h-4 w-4" aria-hidden="true" />Download .txt
                </Button>
                <Button type="button" variant="outline" onClick={saveDraft} disabled={!content} className="col-span-2 min-h-11 border-white/20 bg-transparent text-white hover:bg-white/10 sm:col-span-1">
                  <Save className="h-4 w-4" aria-hidden="true" />Save draft
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <section aria-labelledby="saved-drafts-title" className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 id="saved-drafts-title" className="text-lg font-bold">Saved drafts</h2>
              <p className="text-xs text-white/50">Private to this browser · no scheduling or publishing connection is configured.</p>
            </div>
            <span className="text-xs text-white/50">{drafts.length} / 50</span>
          </div>
          {drafts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-8 text-center text-sm text-white/50">No drafts saved yet.</div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {drafts.map((draft) => (
                <article key={draft.id} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="truncate font-semibold text-white">{draft.title}</p>
                  <p className="mt-1 text-xs text-white/50">{new Date(draft.updatedAt).toLocaleString()}</p>
                  <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-xs leading-5 text-white/65">{draft.content}</p>
                  <div className="mt-3 flex gap-2">
                    <Button type="button" size="sm" onClick={() => restoreDraft(draft)} className="min-h-9 bg-white/10 text-white hover:bg-white/20">Open</Button>
                    <Button type="button" size="sm" variant="ghost" aria-label={`Delete ${draft.title}`} onClick={() => deleteDraft(draft.id)} className="min-h-9 text-white/70 hover:bg-red-500/15 hover:text-red-200">
                      <Trash2 className="h-4 w-4" aria-hidden="true" />Delete
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <p aria-live="polite" role="status" className="min-h-5 text-sm text-white/60">{notice}</p>
      </div>
    </main>
  );
}
