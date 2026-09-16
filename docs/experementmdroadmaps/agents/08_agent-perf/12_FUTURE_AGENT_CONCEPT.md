# 12_FUTURE_AGENT_CONCEPT — Realized concept from EXISTING capabilities

> Not a new agent — a _realized role_ for the existing `agent-perf` node, assembled only from infra that already exists. `[OPINION]`

## Concept: "Leon Ortiz, the Performance Review Officer"

A **first-class performance authority** realized by composing capabilities that are already in the codebase, with **zero new services**:

| Needed capability     | Already exists at                                                                       | How `agent-perf` uses it              |
| --------------------- | --------------------------------------------------------------------------------------- | ------------------------------------- |
| Identity + avatar     | `agent-profiles.ts:92`, `agent-identity.ts`                                             | Leon Ortiz 🚀 already canonical       |
| Perf voice            | `persona-selector.ts` (+ Q2 persona)                                                    | `performance_engineer` variant        |
| Run a perf analysis   | `ConversationOrchestrator` + `ChatExecutor` via `resolveAgent` (`agent-service.ts:337`) | Director scenario, single participant |
| Human trigger         | `phase21-invocation.ts` Room handoff                                                    | "Profile this" (Q5)                   |
| Record findings       | `agent-journal-service.ts` (+ Q3 tag)                                                   | `listByTag('performance')`            |
| Make findings durable | `crystal-debate-bridge` (Module 2)                                                      | perf Crystal from verdict/output      |
| Surface in UI         | `AgentsPanel`, `LiveActivityStream`, `AgentHistoryTab`                                  | no new panel                          |
| Observe activity      | `COGNITIVE_STEP_COMPLETED` (Q1 in debate)                                               | stats/journal light up everywhere     |

## The realized workflow (no new code, only wiring)

1. Human opens Room → picks **Leon Ortiz** → mode **Chat** → pastes an architecture/endpoint description.
2. Invocation Engine → `InvocationExecutionDelegate` → Director scenario (`phase21-invocation.ts:89`) → `agent-perf` runs via `ChatExecutor` carrying its perf prompt.
3. `COGNITIVE_STEP_COMPLETED` fires → stats + journal (`performance` tag) update.
4. Output is auto-proposed as a **Crystal** (Module 2 bridge) → durable perf knowledge.
5. In a future perf dispute, `agent-perf` joins the debate with the `performance_engineer` persona (Q2) and, after Q1, leaves a full journal trail.

## Why this is the right "concept"

- Honors the system's **shared-infra** principle (AGENTS.md): `agent-perf` needs no bespoke engine.
- Closes every gap in `10_PROBLEMS_AND_LIMITATIONS.md` via the quick/medium wins in `11_OPPORTUNITIES.md`.
- Avoids the trap of a 26th mini-framework (see `15_DO_NOT_BUILD_YET.md`).

**Verdict:** the "Performance Review Officer" is achievable today at ~80% with Q1+Q2+Q3+Q5, and 100% with M1+M2+M3. No new agent node required.
