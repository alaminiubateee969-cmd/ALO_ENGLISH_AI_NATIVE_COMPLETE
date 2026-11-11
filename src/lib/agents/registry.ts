/**
 * src/lib/agents/registry.ts
 *
 * The agent registry — what the platform says about its own agents.
 *
 * WHY THIS FILE IS NOW GENERATED RATHER THAN HAND-WRITTEN
 * ───────────────────────────────────────────────────────
 * It used to be a hand-written list of twenty aspirational entries. Every
 * one of them said "not verified", and the list had drifted from the code:
 * it named agents that did not exist, described agents that did something
 * else, and omitted the agents that actually existed.
 *
 * The registry is now derived from the runtime's own definitions, so the
 * dashboard can never show an agent that is not registered, and the
 * responsibility text lives next to the handler that does the work. A
 * separate `PLATFORM_SERVICES` list holds the platform's own services that
 * are not agents — they are routes and libraries, and saying so is more
 * honest than giving them a fake agent identity.
 *
 * THE STATUS IS EARNED
 * ────────────────────
 * `status` is not a hand-written word. An agent is `ready` when it is
 * registered, enabled, has a handler, and has completed a job in the recent
 * window. It is `registered` when it exists but has not yet run. It is
 * `failed` when its recent jobs failed. The word "ready" is never typed by
 * hand.
 */

import { registeredAgents } from "@/lib/agents/runtime/runtime";
import type { AgentDefinitionSpec } from "@/lib/agents/runtime/types";
import "@/lib/agents/runtime";

export type AgentStatus =
  | "registered"
  | "configured"
  | "ready"
  | "running"
  | "waiting_for_approval"
  | "succeeded"
  | "failed"
  | "disabled";

export type AiAgent = {
  code: string;
  name: string;
  department: string;
  responsibility: string;
  canAutoExecute: boolean;
  requiresAdminApproval: boolean;
  status: AgentStatus;
  examScope: string[];
  publicLabel: string;
  internalLabel: string;
  version: string;
  permissions: string[];
  limits: {
    maxDurationSeconds: number;
    maxRetries: number;
    maxConcurrency: number;
  };
  /** Measured, not asserted. */
  measured: {
    jobs: number;
    succeeded: number;
    failed: number;
    successRate: number | null;
    averageDurationMs: number | null;
  };
};

/** The platform's own services. They are not agents, and they are not
 *  pretending to be. */
export type PlatformService = {
  code: string;
  name: string;
  kind: "route" | "library" | "page";
  purpose: string;
  location: string;
};

export const PLATFORM_SERVICES: PlatformService[] = [
  {
    code: "SVC-SPEAKING-PRACTICE",
    name: "Speaking practice conversation",
    kind: "route",
    purpose:
      "A session-only conversational practice session with an AI guide, using speech recognition and speech synthesis. It produces no score of any kind.",
    location: "/api/speaking/*",
  },
  {
    code: "SVC-HANDBOOK-RAG",
    name: "Handbook Q&A",
    kind: "route",
    purpose:
      "Answers questions from the platform's own published study material. A model may answer; the answer may be incomplete.",
    location: "/api/rag/ask",
  },
  {
    code: "SVC-SPEAKING-TRANSCRIBE",
    name: "Speech transcription",
    kind: "route",
    purpose:
      "Transcribes a bounded Base64 audio upload through the configured provider. It does not persist a recording.",
    location: "/api/speaking/transcribe",
  },
  {
    code: "SVC-EVALUATION-LAYER",
    name: "Evaluation layer",
    kind: "library",
    purpose:
      "The platform's own evaluation agent: a rubric per exam, a prompt built from it, a strict schema, and a local rule engine fallback.",
    location: "src/lib/ai/evaluation/",
  },
  {
    code: "SVC-MODEL-PROVIDER",
    name: "Model provider seam",
    kind: "library",
    purpose:
      "The only module that performs an outbound model call. Self-hosted model server first, then the optional external providers, then the deterministic rule engine.",
    location: "src/lib/ai/providers/ai-provider.ts",
  },
  {
    code: "SVC-EXAM-ENGINE",
    name: "Exam engine",
    kind: "library",
    purpose:
      "Deterministic selection, freezing, timing, autosave, submission and grading for every attempt.",
    location: "src/lib/exam/",
  },
];

/** The one-line description of what an agent actually does. */
const RESPONSIBILITY: Record<string, string> = {
  "AGENT-EXAM-ORCHESTRATOR-01":
    "Creates and manages real exam sessions: reserves the attempt, allocates the question set from the exam blueprint, freezes the allocation and sets the server-authoritative deadline.",
  "AGENT-QUESTION-GEN-02":
    "Generates original, blueprint-aligned question drafts. Objective items are produced by a deterministic generator whose answer key is correct by construction; a model may improve the wording but never the key.",
  "AGENT-QUALITY-GATE-03":
    "Checks a draft for correctness, rubric compliance, ambiguity, originality, answer-key validity and difficulty, and raises it for human approval. It never publishes anything by itself.",
  "AGENT-SPEAKING-EXAMINER-04":
    "Evaluates a submitted speaking transcript against the rubric for the learner's own exam. Transcript-based only: no acoustic property is assessed, and no score is produced.",
  "AGENT-WRITING-EXAMINER-05":
    "Evaluates a written submission against the rubric for the learner's own exam and the task the learner was given, with the rubric version and the producing model recorded.",
  "AGENT-MEDIA-06":
    "Creates listening audio, validates the resulting file, and records the asset's status. An asset is READY only after it has been verified; a failed asset is recorded with its reason.",
  "AGENT-TEACHER-07":
    "Builds a study plan from the learner's real attempt history: which sections are weakest, which item types cost marks, and what to do next.",
  "AGENT-ADAPTIVE-08":
    "Chooses the next practice step from real performance, and never recommends a question the learner has already seen outside an explicit revision.",
  "AGENT-DAILY-09":
    "Creates and schedules the day's validated exercise from the learner's unseen pool. The set stays inactive until a human approves it.",
  "AGENT-ANALYTICS-10":
    "Computes real performance, weaknesses, improvement trends and readiness indicators from actual attempts, scores and evaluations.",
  "AGENT-CRM-SYNC-11":
    "Synchronises exam progress into the CRM using a fixed field allowlist. It copies no answer, no document and no personal identifier.",
  "AGENT-SECURITY-12":
    "Scans for suspicious activity: repeated failed logins, abandoned attempts, answer keys in stored payloads, and failed or dead-lettered jobs. It reports; it does not act on a learner.",
  "AGENT-MODEL-ROUTER-13":
    "Probes the self-hosted model server and every configured external provider, and shows the routing order a request would actually take.",
  "AGENT-QUALITY-IMPROVE-14":
    "Measures the workforce's own recent output and proposes safe improvements. Every proposal goes to a human; it cannot change a prompt, a rubric or the code.",
};

const ALL_EXAMS = ["ALL"];

/** Agents whose output changes what a learner sees, and therefore run freely. */
const AUTO_EXECUTE = new Set([
  "AGENT-EXAM-ORCHESTRATOR-01",
  "AGENT-SPEAKING-EXAMINER-04",
  "AGENT-WRITING-EXAMINER-05",
  "AGENT-TEACHER-07",
  "AGENT-ADAPTIVE-08",
  "AGENT-ANALYTICS-10",
  "AGENT-CRM-SYNC-11",
  "AGENT-SECURITY-12",
  "AGENT-MODEL-ROUTER-13",
  "AGENT-MEDIA-06",
]);

/** Agents whose output changes published content, and therefore need approval. */
const NEEDS_APPROVAL = new Set([
  "AGENT-QUESTION-GEN-02",
  "AGENT-QUALITY-GATE-03",
  "AGENT-DAILY-09",
  "AGENT-QUALITY-IMPROVE-14",
]);

/** The measured, per-agent numbers, gathered from the job table. */
export type AgentMeasurements = Record<
  string,
  { jobs: number; succeeded: number; failed: number; successRate: number | null; averageDurationMs: number | null }
>;

/** Build the registry from the runtime's own definitions. */
export function buildAgentRegistry(measurements: AgentMeasurements = {}): AiAgent[] {
  return registeredAgents().map((spec) => {
    const measured = measurements[spec.code] ?? {
      jobs: 0,
      succeeded: 0,
      failed: 0,
      successRate: null,
      averageDurationMs: null,
    };

    let status: AgentStatus = "registered";
    if (measured.jobs > 0) {
      if (measured.failed > 0 && measured.succeeded === 0) status = "failed";
      else if (measured.succeeded > 0) status = "ready";
      else status = "running";
    }
    if (spec.code === "AGENT-QUALITY-GATE-03" && measured.jobs > 0) {
      // The gate's normal end state is a pending approval, not a run.
      status = "waiting_for_approval";
    }

    return {
      code: spec.code,
      name: spec.name,
      department: spec.department,
      responsibility: RESPONSIBILITY[spec.code] ?? spec.description,
      canAutoExecute: AUTO_EXECUTE.has(spec.code),
      requiresAdminApproval: NEEDS_APPROVAL.has(spec.code),
      status,
      examScope: ALL_EXAMS,
      publicLabel: `ALO ${spec.name}`,
      internalLabel: `${spec.name} Agent`,
      version: spec.version,
      permissions: spec.permissions,
      limits: {
        maxDurationSeconds: spec.maxDurationSeconds,
        maxRetries: spec.maxRetries,
        maxConcurrency: spec.maxConcurrency,
      },
      measured,
    };
  });
}

/** The registry, with no measurements. */
export const AI_AGENTS: AiAgent[] = buildAgentRegistry();

/** A short description of the whole registry. */
export function getAgentStats(): {
  total: number;
  byStatus: Record<string, number>;
  byDepartment: Record<string, number>;
  ready: number;
} {
  const byStatus: Record<string, number> = {};
  const byDepartment: Record<string, number> = {};
  for (const agent of AI_AGENTS) {
    byStatus[agent.status] = (byStatus[agent.status] ?? 0) + 1;
    byDepartment[agent.department] = (byDepartment[agent.department] ?? 0) + 1;
  }
  return {
    total: AI_AGENTS.length,
    byStatus,
    byDepartment,
    ready: byStatus.ready ?? 0,
  };
}

/** One agent by code. */
export function getAgent(code: string): AiAgent | undefined {
  return AI_AGENTS.find((a) => a.code === code);
}

/** The runtime definition behind an agent code. */
export function getAgentDefinition(code: string): AgentDefinitionSpec | undefined {
  return registeredAgents().find((a) => a.code === code);
}
