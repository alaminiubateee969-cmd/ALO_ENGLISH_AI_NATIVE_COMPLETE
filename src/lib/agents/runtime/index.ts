/**
 * src/lib/agents/runtime/index.ts
 *
 * The agent workforce, assembled.
 *
 * Fourteen agents, each with a real execution handler:
 *
 *   001  Exam Orchestrator          creates and manages real exam sessions
 *   002  Question Generation        generates original, blueprint-aligned drafts
 *   003  Question Quality Gate      checks drafts and raises them for approval
 *   004  Speaking Examiner          evaluates a speaking transcript
 *   005  Writing Examiner           evaluates a written submission
 *   006  Listening & Media Agent    creates and validates listening audio
 *   007  Personal AI Teacher        builds a study plan from real performance
 *   008  Adaptive Learning Agent    chooses the next practice step
 *   009  Daily Learning Agent       creates and schedules the day's exercise
 *   010  Analytics Agent            computes real performance and trends
 *   011  CRM Synchronization Agent  syncs exam progress into the CRM
 *   012  Security & Audit Agent     scans for suspicious activity
 *   013  AI Model Router            probes and routes to the available models
 *   014  Agent Quality Improvement  measures the workforce and proposes changes
 *
 * Importing this module registers all fourteen. The database copy of each
 * definition is reconciled by `syncAgentDefinitions()`, which the admin route
 * and the worker both call on start-up.
 */

import { registerContentAgents } from "./agents/content-agents";
import { registerAssessmentAgents } from "./agents/assessment-agents";
import { registerLearningAgents } from "./agents/learning-agents";
import { registerOperationsAgents } from "./agents/operations-agents";

let registered = false;

/** Register all fourteen agents. Safe to call more than once. */
export function registerAllAgents(): void {
  if (registered) return;
  registerContentAgents();
  registerAssessmentAgents();
  registerLearningAgents();
  registerOperationsAgents();
  registered = true;
}

// The side effect of importing this file is the registration itself, so any
// code that imports the runtime gets the whole workforce.
registerAllAgents();

export { registerAllAgents as registerAgents };

export * from "./types";
export * from "./queue";
export * from "./schema";
export * from "./runtime";
export * from "./blueprints";
export * from "./generator";
