import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Award, Crown, Medal, Trophy } from "lucide-react";
import { db } from "@/lib/db";
import { resolveSiteUrl } from "@/lib/public-routes";

export const metadata: Metadata = {
  title: "Practice Leaderboard",
  description:
    "Top practice scores from ALO English mock tests. Scores are practice indicators only — not official exam results.",
  alternates: { canonical: "/leaderboard" },
  openGraph: {
    title: "Practice Leaderboard — ALO English",
    description:
      "Top practice scores from ALO English mock tests. Practice indicators only, not official exam results.",
    type: "website",
    url: `${resolveSiteUrl()}/leaderboard`,
  },
  // Indexable, but the leaderboard is dynamic and changes frequently —
  // crawlers should revisit often but not cache stale rankings.
  robots: { index: true, follow: true },
};

export const revalidate = 300; // 5 minutes — the top 50 shifts slowly.

const LIMIT = 50;

function maskEmail(email: string): string {
  const at = email.indexOf("@");
  if (at <= 0) return "anonymous";
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const head = local.charAt(0) || "u";
  return `${head}***@${domain}`;
}

function formatScore(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "—";
  }
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

type LeaderboardRow = {
  rank: number;
  name: string;
  examType: { code: string; name: string } | null;
  overall: number;
  listening: number | null;
  reading: number | null;
  writing: number | null;
  speaking: number | null;
  date: Date;
};

async function getLeaderboard(): Promise<LeaderboardRow[]> {
  const rows = await db.score.findMany({
    orderBy: { overall: "desc" },
    take: LIMIT * 5,
    select: {
      overall: true,
      listening: true,
      reading: true,
      writing: true,
      speaking: true,
      createdAt: true,
      user: { select: { id: true, name: true, email: true } },
      attempt: {
        select: {
          practiceSet: {
            select: { examType: { select: { code: true, name: true } } },
          },
        },
      },
    },
  });

  const seen = new Set<string>();
  return rows
    .filter((r) => {
      if (seen.has(r.user.id)) return false;
      seen.add(r.user.id);
      return true;
    })
    .slice(0, LIMIT)
    .map((r, i) => ({
      rank: i + 1,
      name:
        r.user.name && r.user.name.trim().length > 0
          ? r.user.name.trim()
          : maskEmail(r.user.email),
      examType: r.attempt.practiceSet.examType,
      overall: r.overall,
      listening: r.listening,
      reading: r.reading,
      writing: r.writing,
      speaking: r.speaking,
      date: r.createdAt,
    }));
}

// ─── Podium (top 3) ────────────────────────────────────────────────────────
function Podium({ rows }: { rows: LeaderboardRow[] }) {
  if (rows.length === 0) return null;

  // Visual order on the podium is [silver, gold, bronze] so the gold step is
  // in the middle and highest.
  const order: Array<{ row: LeaderboardRow; place: 1 | 2 | 3 }> = [];
  const gold = rows.find((r) => r.rank === 1);
  const silver = rows.find((r) => r.rank === 2);
  const bronze = rows.find((r) => r.rank === 3);
  if (silver) order.push({ row: silver, place: 2 });
  if (gold) order.push({ row: gold, place: 1 });
  if (bronze) order.push({ row: bronze, place: 3 });

  return (
    <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-3 sm:gap-4">
      {order.map(({ row, place }) => {
        const config = PODEUM_CONFIG[place];
        const Icon = config.icon;
        return (
          <article
            key={row.rank}
            className={`relative flex flex-col items-center rounded-2xl border-2 px-4 py-6 text-center shadow-sm ${config.border} ${config.bg} ${config.height}`}
          >
            <span
              aria-hidden="true"
              className={`absolute -top-3 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold text-white shadow ${config.chip}`}
            >
              <Icon className="size-3.5" />
              {config.label}
            </span>
            <span
              aria-hidden="true"
              className={`mb-2 grid size-12 place-items-center rounded-full text-white ${config.medal}`}
            >
              <Medal className="size-6" />
            </span>
            <p className="line-clamp-1 text-sm font-bold text-[#0B1F3A]">
              {row.name}
            </p>
            <p className="mt-0.5 text-[11px] font-medium text-slate-500">
              {row.examType ? row.examType.name : "Practice"}
            </p>
            <p className={`mt-3 text-3xl font-black ${config.score}`}>
              {formatScore(row.overall)}
            </p>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              overall
            </p>
            <p className="mt-2 text-[10px] text-slate-400">
              {formatDate(row.date.toISOString())}
            </p>
          </article>
        );
      })}
    </div>
  );
}

const PODEUM_CONFIG: Record<
  1 | 2 | 3,
  {
    label: string;
    icon: typeof Crown;
    border: string;
    bg: string;
    chip: string;
    medal: string;
    score: string;
    height: string;
  }
> = {
  1: {
    label: "1st place",
    icon: Crown,
    border: "border-amber-300",
    bg: "bg-gradient-to-b from-amber-50 to-white",
    chip: "bg-amber-500",
    medal: "bg-amber-500",
    score: "text-amber-600",
    height: "sm:py-10",
  },
  2: {
    label: "2nd place",
    icon: Medal,
    border: "border-slate-300",
    bg: "bg-gradient-to-b from-slate-50 to-white",
    chip: "bg-slate-500",
    medal: "bg-slate-500",
    score: "text-slate-600",
    height: "sm:py-8",
  },
  3: {
    label: "3rd place",
    icon: Award,
    border: "border-orange-300",
    bg: "bg-gradient-to-b from-orange-50 to-white",
    chip: "bg-orange-600",
    medal: "bg-orange-600",
    score: "text-orange-700",
    height: "sm:py-7",
  },
};

// ─── Ranked table (4th onward) ─────────────────────────────────────────────
function RankedList({ rows }: { rows: LeaderboardRow[] }) {
  if (rows.length === 0) return null;
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <ul
        role="list"
        className="divide-y divide-slate-100"
        aria-label="Leaderboard rankings"
      >
        {rows.map((row) => (
          <li
            key={`${row.rank}-${row.name}`}
            className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 px-4 py-3 sm:grid-cols-[3rem_1fr_auto_auto] sm:gap-4 sm:px-5 sm:py-4"
          >
            <span className="font-mono text-sm font-bold text-slate-500">
              {row.rank}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#0B1F3A]">
                {row.name}
              </p>
              <p className="mt-0.5 truncate text-xs text-slate-500">
                {row.examType ? row.examType.name : "Practice"}{" "}
                <span className="text-slate-300" aria-hidden="true">·</span>{" "}
                {formatDate(row.date.toISOString())}
              </p>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              <ScoreChip label="L" value={row.listening} />
              <ScoreChip label="R" value={row.reading} />
              <ScoreChip label="W" value={row.writing} />
              <ScoreChip label="S" value={row.speaking} />
            </div>
            <span className="text-right">
              <span className="font-mono text-base font-bold text-[#0057B8]">
                {formatScore(row.overall)}
              </span>
              <span className="ml-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                overall
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ScoreChip({ label, value }: { label: string; value: number | null }) {
  const display = formatScore(value);
  return (
    <span
      className="inline-flex min-w-[2.25rem] items-center justify-center gap-0.5 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600"
      title={`${label} score`}
    >
      <span className="text-slate-400">{label}</span>
      <span className="font-mono">{display}</span>
    </span>
  );
}

export default async function LeaderboardPage() {
  const rows = await getLeaderboard();
  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0B1F3A]">
      {/* Hero */}
      <section className="bg-[#0B1F3A] px-4 py-12 text-white sm:px-6 sm:py-14">
        <div className="mx-auto max-w-5xl text-center">
          <p className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-orange-300/40 bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-orange-300">
            <Trophy className="size-3.5" aria-hidden="true" />
            Practice leaderboard
          </p>
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
            Top mock-test performers
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
            The 50 highest practice scores from ALO English mock tests. A
            candidate appears once, with their best single attempt. Scores are
            practice indicators, not official exam results.
          </p>
        </div>
      </section>

      {/* Podium */}
      <section
        aria-labelledby="podium-title"
        className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12"
      >
        <h2 id="podium-title" className="sr-only">
          Top three performers
        </h2>
        {podium.length > 0 ? (
          <Podium rows={podium} />
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <Trophy className="mx-auto size-10 text-slate-300" aria-hidden="true" />
            <p className="mt-3 text-base font-semibold text-[#0B1F3A]">
              No scored attempts yet
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Be the first to take a mock test and appear on the leaderboard.
            </p>
            <Link
              href="/exam-prep"
              className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0057B8] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0B63CE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0057B8] focus-visible:ring-offset-2"
            >
              Browse practice tests
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        )}
      </section>

      {/* Ranked list */}
      {rest.length > 0 ? (
        <section
          aria-labelledby="ranking-title"
          className="mx-auto max-w-5xl px-4 pb-12 sm:px-6 sm:pb-16"
        >
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#C2410C]">
                Rankings
              </p>
              <h2 id="ranking-title" className="mt-1 text-xl font-bold text-[#0B1F3A] sm:text-2xl">
                Positions 4 – {rows.length}
              </h2>
            </div>
            <p className="hidden text-xs text-slate-500 sm:block">
              L = Listening · R = Reading · W = Writing · S = Speaking
            </p>
          </div>
          <RankedList rows={rest} />
        </section>
      ) : null}

      {/* Disclosure + CTA */}
      <section className="border-t border-slate-200 bg-white px-4 py-10 sm:px-6 sm:py-12">
        <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="max-w-2xl">
            <h2 className="text-lg font-bold text-[#0B1F3A]">
              Practice indicators, not official scores
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              The numbers shown here are produced by the platform&apos;s own
              objective scorer. They are not issued, endorsed or validated by
              any exam provider, and cannot be quoted in an application.
            </p>
          </div>
          <Link
            href="/exam-prep"
            className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#CC3F10] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#A8320D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8501A] focus-visible:ring-offset-2"
          >
            Take a practice test
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}
