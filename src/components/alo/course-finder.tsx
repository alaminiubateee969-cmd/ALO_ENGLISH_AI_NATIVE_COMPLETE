"use client";

import { useState } from "react";
import { Search, Bookmark, GitCompare, ArrowRight, MapPin, Banknote, Clock, Award, Check, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COURSE_RESULTS, type CourseResult } from "@/lib/alo-data";

export function AloCourseFinder({ onCta }: { onCta: () => void }) {
  const [country, setCountry] = useState("all");
  const [level, setLevel] = useState("all");
  const [subject, setSubject] = useState("all");
  const [saved, setSaved] = useState<Set<string>>(new Set());

  const filtered = COURSE_RESULTS.filter((c) => {
    if (country !== "all" && c.country !== country) return false;
    if (level !== "all" && c.level !== level) return false;
    return true;
  });

  const toggleSave = (id: string) => {
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <section id="course-finder" className="py-16 lg:py-24 bg-alo-soft-gray">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="text-sm font-bold uppercase tracking-wide text-alo-orange">Course Finder</div>
            <h2 className="mt-3 text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight text-alo-navy">
              Find the right course for your future.
            </h2>
            <p className="mt-4 text-base md:text-lg leading-8 text-alo-muted">
              Search verified universities, courses, intakes, tuition fees, scholarships and entry
              requirements. Save, compare and apply — all in one premium SaaS search experience.
            </p>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                { v: "4,000+", l: "Universities" },
                { v: "60,000+", l: "Courses" },
                { v: "7", l: "Countries" },
              ].map((s) => (
                <div key={s.l} className="rounded-2xl border border-alo-card bg-white p-3.5 alo-shadow-sm">
                  <div className="text-xl font-extrabold text-alo-navy">{s.v}</div>
                  <div className="text-xs text-alo-faint">{s.l}</div>
                </div>
              ))}
            </div>
            <Button onClick={onCta} className="mt-6 h-12 px-6 rounded-xl bg-alo-orange text-white font-semibold hover:bg-[#cc3f10]">
              Talk to a Counselor
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>

          {/* Search panel + results */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 alo-shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <SlidersHorizontal className="h-4 w-4 text-alo-blue" />
              <span className="text-sm font-bold text-alo-navy">Search courses</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-alo-navy">Country</Label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger className="h-11 rounded-xl border-slate-200 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All countries</SelectItem>
                    <SelectItem value="UK">🇬🇧 UK</SelectItem>
                    <SelectItem value="Canada">🇨🇦 Canada</SelectItem>
                    <SelectItem value="Australia">🇦🇺 Australia</SelectItem>
                    <SelectItem value="USA">🇺🇸 USA</SelectItem>
                    <SelectItem value="Ireland">🇮🇪 Ireland</SelectItem>
                    <SelectItem value="New Zealand">🇳🇿 New Zealand</SelectItem>
                    <SelectItem value="Dubai">🇦🇪 Dubai</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-alo-navy">Study level</Label>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger className="h-11 rounded-xl border-slate-200 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All levels</SelectItem>
                    <SelectItem value="Bachelor's">Bachelor's</SelectItem>
                    <SelectItem value="Master's">Master's</SelectItem>
                    <SelectItem value="PhD">PhD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label className="text-xs font-semibold text-alo-navy">Subject</Label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger className="h-11 rounded-xl border-slate-200 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All subjects</SelectItem>
                    <SelectItem value="cs">Computer Science &amp; IT</SelectItem>
                    <SelectItem value="eng">Engineering</SelectItem>
                    <SelectItem value="bus">Business &amp; Management</SelectItem>
                    <SelectItem value="health">Health &amp; Nursing</SelectItem>
                    <SelectItem value="data">Data Science &amp; Analytics</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button className="mt-3 w-full h-12 rounded-xl bg-alo-orange text-white font-semibold hover:bg-[#cc3f10]">
              <Search className="mr-2 h-4 w-4" />
              Search {filtered.length} courses
            </Button>

            {/* Results */}
            <div className="mt-4 space-y-3 max-h-[420px] overflow-y-auto alo-scroll pr-1">
              {filtered.map((c) => (
                <CourseCard key={c.id} course={c} saved={saved.has(c.id)} onSave={() => toggleSave(c.id)} onApply={onCta} />
              ))}
              {filtered.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-alo-faint">
                  No courses match your filters. Try a different combination.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CourseCard({ course, saved, onSave, onApply }: { course: CourseResult; saved: boolean; onSave: () => void; onApply: () => void }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 alo-shadow-sm hover:alo-shadow-lg transition-all">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-alo-faint">
            <span>{course.flag}</span>
            <span className="font-semibold">{course.university}</span>
          </div>
          <h4 className="mt-0.5 text-sm font-bold text-alo-navy truncate">{course.course}</h4>
          <div className="flex items-center gap-1 text-xs text-alo-faint">
            <MapPin className="h-3 w-3" />
            {course.city}, {course.country} · {course.level}
          </div>
        </div>
        <button
          onClick={onSave}
          className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg border", saved ? "border-alo-orange bg-alo-soft-orange text-alo-orange" : "border-slate-200 text-alo-faint hover:bg-alo-soft-blue")}
          aria-label="save course"
        >
          <Bookmark className={cn("h-4 w-4", saved && "fill-alo-orange")} />
        </button>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-lg bg-slate-50 p-2">
          <Banknote className="h-3.5 w-3.5 text-alo-blue" />
          <div className="mt-0.5 font-bold text-alo-navy">{course.tuition}</div>
          <div className="text-[10px] text-alo-faint">tuition</div>
        </div>
        <div className="rounded-lg bg-slate-50 p-2">
          <Clock className="h-3.5 w-3.5 text-alo-blue" />
          <div className="mt-0.5 font-bold text-alo-navy">{course.duration}</div>
          <div className="text-[10px] text-alo-faint">duration</div>
        </div>
        <div className="rounded-lg bg-slate-50 p-2">
          <Award className="h-3.5 w-3.5 text-alo-blue" />
          <div className="mt-0.5 font-bold text-alo-navy truncate">{course.englishReq}</div>
          <div className="text-[10px] text-alo-faint">English req</div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-alo-success">
          Scholarship: {course.scholarship}
        </span>
        <Button onClick={onApply} size="sm" className="h-8 rounded-lg bg-alo-blue text-white text-xs hover:bg-[#004a9e]">
          Apply Now
          <ArrowRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
