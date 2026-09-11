# AI Architecture

## Model Router (src/lib/ai/routing/ModelRouter.ts)
Multi-model routing: routes tasks to best available provider.
Tasks: writing_evaluation, speaking_evaluation, question_generation, etc.
Providers: Groq (default), OpenRouter, Gemini, HuggingFace, local rule engine.
Fallback chain: each task has preferred model + local fallback.

## Memory Layers (src/lib/ai/memory/MemoryLayers.ts)
L1: Session Memory (current attempt state)
L2: Attempt Memory (completed scores)
L3: Student Learning Memory (weakness tracking via LearningMemory model)
L4: Long-Term Student Memory (trajectory, trend, recommendations)
L5-L6: Exam/Question Knowledge Memory (item statistics)
L7-L10: Agent/Model/Engineering/System Memory (performance tracking)
Privacy isolation: all queries filter by userId. No cross-user leakage.

## Quality Gate (src/lib/ai/self-development/QualityGate.ts)
10 quality gates: functional, test coverage, regression, security, latency,
cost, AI quality, student outcome, model agreement, prompt stability.
canAutoDeploy: false (human approval always required).
