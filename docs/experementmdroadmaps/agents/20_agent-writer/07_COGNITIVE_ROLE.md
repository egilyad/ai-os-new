# 07_COGNITIVE_ROLE — `agent-writer` and the Cognitive Event Stream

## The 4 cognitive events (VERIFIED, `event-registry.ts`)

1. `COGNITIVE_TRACE_UPDATED` `cognitive:trace:updated` :736
2. `COGNITIVE_STEP_ACTIVE` `cognitive:step:active` :755
3. `COGNITIVE_STEP_COMPLETED` `cognitive:step:completed` :763
4. `COGNITIVE_DECISION_MADE` `cognitive:decision:made` :776 — **DEAD at consumer** (`AGENTS.md`).

## Writer's relationship to them

- **Writer is a CONSUMER TARGET, not a producer** of cognitive events. When she executes a step, the orchestrator emits `COGNITIVE_STEP_COMPLETED` with `nodeId:'agent-writer'` (`orchestration-service.ts:414`; `trace-service.ts:200`; `cognitive-service.ts:229`). She does **not** emit `COGNITIVE_DECISION_MADE`.
- **Stats consumer:** `AgentService` updates `agent-writer` stats from `COGNITIVE_STEP_COMPLETED` (`agent-service.ts:184-210`).
- **Memory consumer:** `MemoryEngine` (`memory-engine.ts:181`) and `AgentJournalService` (`agent-journal-service.ts:150`) record her steps.
- **Observability consumers:** `MetricsService` (`metrics-service.ts:187`), `PolicyService` (`policy-service.ts:275`), `AgentHealthMonitor` (`agent-health-monitor.ts:66`), `AdvisorService` (`advisor-service.ts:119`), `SnapshotService` (`snapshot-service.ts:114`).
- **Debate emits NO cognitive events** (`AGENTS.md`) — so during a pure debate Clara's activity is _not_ on the cognitive stream except via `agent-journal` `debate:runtime:agent:error` (`agent-journal-service.ts:174`).

## What to surface (display/integration only — no new events needed)

- **Writer activity card** in Dashboard/Cognitive panel: subscribe to `COGNITIVE_STEP_COMPLETED` filtered by `nodeId:'agent-writer'` → show "Clara wrote X tokens in Y ms". Reuses `AgentService.getStats` + the existing event.
- **Decision trail:** if/when the writer is given a real documentation _decision_ (e.g. "chose tutorial over reference"), emit `COGNITIVE_DECISION_MADE` — but note this event is currently **dead at consumer**, so first fix the consumer or it will be invisible. `[VERIFIED]` `AGENTS.md` states `cognitive:decision:made dead-at-consumer`.
- **Cognitive trace view:** `COGNITIVE_TRACE_UPDATED` already carries `nodeId` per step; a writer-filtered trace shows her full generation history. `CognitiveService`/`TraceService` are the producers.
- **Health:** `AgentHealthMonitor` already watches her steps for liveness; surface "Clara: healthy / stalled" in the AgentCard.

## Recommendation

Do **not** add writer-specific cognitive events. Surface her existing `COGNITIVE_STEP_COMPLETED` / `getStats` data in the AgentCard and a new "Documentation activity" strip. If a documentation _decision_ event is wanted, reuse `COGNITIVE_DECISION_MADE` **after** fixing its dead consumer. `[OPINION]`
