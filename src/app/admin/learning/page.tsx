"use client";

/**
 * src/app/admin/learning/page.tsx
 *
 * AI Learning Dashboard — shows the daily learning loop results,
 * agent evolutions, active specialists, and exam orchestrator status.
 *
 * Accessible to ADMIN and SUPER_ADMIN roles.
 */

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/site/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, TrendingUp, AlertTriangle, CheckCircle2, Zap, RefreshCw, Activity } from "lucide-react";

const NAV = [
  { label: "Dashboard", href: "/admin/dashboard" },
  { label: "Exam Center", href: "/admin/exam-center" },
  { label: "AI Learning", href: "/admin/learning" },
  { label: "Logout", href: "/login" },
];

type Dashboard = {
  totalExams: number;
  totalStudents: number;
  avgScore: number;
  topWeaknesses: Array<{ area: string; occurrences: number }>;
  recentLearnings: Array<{ agentId: string; observation: string; date: string }>;
  activeSpecialists: number;
  totalEvolutions: number;
};

type OrchestratorReport = {
  examTypes: Array<{
    code: string;
    name: string;
    isActive: boolean;
    totalQuestions: number;
    totalAttempts: number;
    avgScore: number | null;
    hasDailySet: boolean;
    status: string;
  }>;
  totalQuestions: number;
  totalAttempts: number;
  readyExams: number;
  issues: string[];
};

type DailyResult = {
  date: string;
  examsAnalyzed: number;
  insightsGenerated: number;
  agentsImproved: number;
  newSpecialistsCreated: number;
  topWeaknesses: Array<{ area: string; occurrences: number }>;
  topStrengths: Array<{ area: string; occurrences: number }>;
  recommendations: string[];
} | null;

async function fetchLearningData() {
  const [dashRes, orchRes] = await Promise.all([
    fetch("/api/learning/dashboard"),
    fetch("/api/learning/orchestrator"),
  ]);

  return {
    dashboard: dashRes.ok ? ((await dashRes.json()).data as Dashboard) : null,
    orchestrator: orchRes.ok ? ((await orchRes.json()).data as OrchestratorReport) : null,
  };
}

export default function AdminLearningPage() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [orchestrator, setOrchestrator] = useState<OrchestratorReport | null>(null);
  const [dailyResult, setDailyResult] = useState<DailyResult>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const { dashboard, orchestrator } = await fetchLearningData();
      if (dashboard) setDashboard(dashboard);
      if (orchestrator) setOrchestrator(orchestrator);
    } catch (err) {
      console.error("Failed to load learning data:", err);
    } finally {
      setLoading(false);
    }
  };

  // The initial fetch keeps its state updates inside promise callbacks rather
  // than calling loadData() directly, which would set state during the effect.
  useEffect(() => {
    let cancelled = false;

    fetchLearningData()
      .then(({ dashboard, orchestrator }) => {
        if (cancelled) return;
        if (dashboard) setDashboard(dashboard);
        if (orchestrator) setOrchestrator(orchestrator);
      })
      .catch((err) => {
        if (!cancelled) console.error("Failed to load learning data:", err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const runDailyLoop = async () => {
    setRunning(true);
    try {
      const res = await fetch("/api/learning/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ daysBack: 1 }),
      });
      if (res.ok) {
        const d = await res.json();
        setDailyResult(d.data);
        loadData(); // refresh
      }
    } catch (err) {
      console.error("Failed to run daily loop:", err);
    } finally {
      setRunning(false);
    }
  };

  const generateDailySets = async () => {
    setRunning(true);
    try {
      await fetch("/api/learning/orchestrator", { method: "POST" });
      loadData();
    } finally {
      setRunning(false);
    }
  };

  return (
    <DashboardShell title="Admin Portal" nav={NAV} role="ADMIN">
      <div className="mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Brain className="h-7 w-7 text-rose-500" />
          AI Learning Center
        </h2>
        <p className="text-slate-600 mt-1">
          Daily learning loop, agent self-improvement, and exam orchestrator
        </p>
      </div>

      {/* Action buttons */}
      <div className="mb-6 flex flex-wrap gap-3">
        <Button onClick={runDailyLoop} disabled={running} className="gap-2">
          {running ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
          Run Daily Learning Loop
        </Button>
        <Button onClick={generateDailySets} disabled={running} variant="outline" className="gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Generate Daily Question Sets
        </Button>
        <Button onClick={loadData} disabled={loading} variant="ghost" className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Daily Loop Result */}
      {dailyResult && (
        <Card className="mb-6 border-rose-200 bg-rose-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-5 w-5 text-rose-500" />
              Latest Learning Run — {dailyResult.date}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-4">
              <div>
                <p className="text-2xl font-bold text-slate-900">{dailyResult.examsAnalyzed}</p>
                <p className="text-xs text-slate-500">Exams Analyzed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{dailyResult.insightsGenerated}</p>
                <p className="text-xs text-slate-500">Insights Generated</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{dailyResult.agentsImproved}</p>
                <p className="text-xs text-slate-500">Agents Improved</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{dailyResult.newSpecialistsCreated}</p>
                <p className="text-xs text-slate-500">New Specialists</p>
              </div>
            </div>
            {dailyResult.recommendations.length > 0 && (
              <div className="mt-4 space-y-1">
                <p className="text-xs font-medium text-slate-600">Recommendations:</p>
                {dailyResult.recommendations.map((r, i) => (
                  <p key={i} className="text-sm text-slate-700">{r}</p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dashboard Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{dashboard?.totalExams ?? "—"}</p>
                <p className="text-xs text-slate-500">Total Exams Taken</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{dashboard?.totalStudents ?? "—"}</p>
                <p className="text-xs text-slate-500">Total Students</p>
              </div>
              <Brain className="h-8 w-8 text-rose-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{dashboard?.avgScore.toFixed(1) ?? "—"}</p>
                <p className="text-xs text-slate-500">Avg Overall Score (/9)</p>
              </div>
              <Activity className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{dashboard?.activeSpecialists ?? "—"}</p>
                <p className="text-xs text-slate-500">Active AI Specialists</p>
              </div>
              <Zap className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Orchestrator Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Exam Orchestrator Status</CardTitle>
          </CardHeader>
          <CardContent>
            {orchestrator ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant={orchestrator.readyExams === orchestrator.examTypes.length ? "default" : "secondary"}>
                    {orchestrator.readyExams}/{orchestrator.examTypes.length} exams ready
                  </Badge>
                  <span className="text-slate-500">{orchestrator.totalQuestions} questions, {orchestrator.totalAttempts} attempts</span>
                </div>
                {orchestrator.issues.length > 0 && (
                  <div className="rounded-md bg-amber-50 p-3">
                    <p className="flex items-center gap-1 text-xs font-medium text-amber-700 mb-1">
                      <AlertTriangle className="h-3 w-3" /> Issues ({orchestrator.issues.length})
                    </p>
                    <ul className="text-xs text-amber-600 space-y-0.5">
                      {orchestrator.issues.slice(0, 5).map((issue, i) => (
                        <li key={i}>• {issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {orchestrator.examTypes.map((et) => (
                    <div key={et.code} className="flex items-center justify-between rounded-md border px-3 py-1.5 text-xs">
                      <span className="font-medium">{et.code}</span>
                      <span className="text-slate-500">{et.totalQuestions} Q</span>
                      <span className="text-slate-500">{et.totalAttempts} attempts</span>
                      {et.avgScore != null && (
                        <span className="text-slate-500">{et.avgScore.toFixed(1)}</span>
                      )}
                      <Badge variant={et.status === "READY" ? "default" : "destructive"} className="text-[10px]">
                        {et.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">Loading...</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Learnings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Agent Learnings</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard && dashboard.recentLearnings.length > 0 ? (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {dashboard.recentLearnings.map((l, i) => (
                  <div key={i} className="rounded-md border p-2.5 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="outline" className="text-[10px]">{l.agentId}</Badge>
                      <span className="text-slate-400">{new Date(l.date).toLocaleString()}</span>
                    </div>
                    <p className="text-slate-700">{l.observation}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No learnings yet. Run the daily loop.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Weaknesses */}
      {dashboard && dashboard.topWeaknesses.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Top Student Weaknesses (All Students)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {dashboard.topWeaknesses.map((w, i) => (
                <div key={i} className="flex items-center justify-between rounded-md border p-3">
                  <span className="text-sm font-medium text-slate-700">{w.area.replace(/_/g, " ")}</span>
                  <Badge variant="destructive">{w.occurrences}×</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </DashboardShell>
  );
}
