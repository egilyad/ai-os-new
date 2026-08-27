---
title: End-to-End Flow — agent-doc-simplifier
status: VERIFIED
agent_id: agent-doc-simplifier
---

# 14 — END-TO-END: how `agent-doc-simplifier` actually runs

## Path A — Router dispatch (VERIFIED)

1. Incoming task hits `router` node → `orchestrator` classifies and routes.
2. If routed to documentation simplification, edge `e-router-doc-simplifier`
   (`topology-defaults.ts:500`) activates the node.
3. `orchestrator.execute` runs the node → emits `COGNITIVE_STEP_ACTIVE`
   (`orchestration-service.ts:355`) then `COGNITIVE_STEP_COMPLETED`
   (`orchestration-service.ts:414`) with `nodeId:'agent-doc-simplifier'`.
4. Consumers update: `AgentService` stats (`agent-service.ts:184`),
   `agent-journal-service` (`agent-journal-service.ts:150`),
   `memory-engine` (`memory-engine.ts:181`), `trace-service`, `metrics-service`.
5. Output flows to `aggregator` via `e-doc-simplifier-agg`
   (`topology-defaults.ts:552`).

## Path B — Explicit invocation (RoomPanel) (VERIFIED)

1. Human picks "Maya Lindholm" in `RoomPanel` → `invocationEngine.invoke(req)`
   (`phase21-invocation.ts:151`).
2. `resolveAgents` resolves id from directory (`invocation-engine-service.ts:158`);
   default policy permits human-mention (`phase21-invocation.ts:125-144`).
3. `InvocationExecutionDelegate.start` → `chat` mode builds a `ConversationScenario`
   with `participantId:'agent-doc-simplifier'` and `director.run()`
   (`phase21-invocation.ts:89-108`).
4. `ChatExecutor` resolves the agent (`conversation-execution-engine.ts:40`),
   executes at `groq/llama-3.1-8b-instant` with the simplification prompt.
5. `conversation:turn:*` events fire; `DirectorStore` observes; `RoomPanel`
   shows live output (`AGENTS.md` B4/B5.4c/Step 6).

## Path C — Debate participant (VERIFIED)

1. Agent selected as `DebateParticipant` (UI or Invocation `debate` mode).
2. `debate-agent-executor` runs it (`debate-agent-executor.ts:38`);
   `PersonaSelector` may attach a neutral persona (`persona-selector.ts:292`).
3. **No** `cognitive:*` events (debate emits only `debate:*` + bridged
   `conversation:*`) — see `07_COGNITIVE_EVENTS.md`.

## Identity consistency (VERIFIED)

All paths resolve the **same** identity through `agentService.resolveAgent` →
`resolveAgentIdentity`: emoji 💡, color #10b981, model llama-3.1-8b-instant,
provider groq, specializations [Plain Language, Clarity, Restructure].

## Verification status

Every hop above is backed by a `file:line` citation in `00`–`13`. No step is
fabricated; negative claims ("no special wiring") are supported by the repo-wide
grep for `agent-doc-simplifier` returning only `topology-defaults.ts` +
`agent-profiles.ts` (+ `prompt-audit-service.ts:46` prefix).
