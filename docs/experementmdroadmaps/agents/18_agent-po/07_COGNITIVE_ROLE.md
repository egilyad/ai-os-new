# 07 — COGNITIVE ROLE (events to surface)

> VERIFIED mechanics; display/integration only. No new event emission recommended.

## CURRENT (VERIFIED)

Four cognitive events exist (`event-registry.ts:736/755/763/776`):

- `cognitive:trace:updated` — `COGNITIVE_TRACE_UPDATED`
- `cognitive:step:active` — `COGNITIVE_STEP_ACTIVE`
- `cognitive:step:completed` — `COGNITIVE_STEP_COMPLETED` (payload includes `nodeId`, `status`, `duration`, `output`, `provider`, `model`)
- `cognitive:decision:made` — `COGNITIVE_DECISION_MADE` (AGENTS.md: dead-at-consumer)

Writers (VERIFIED): `CognitiveService` (`:229,:414`), `TraceService` (`:200,:344`), `OrchestrationService` (`:414`). `agent-po` is a **subject** (`nodeId === 'agent-po'`) whenever it executes a step — it does not emit these itself.

Consumers of `COGNITIVE_STEP_COMPLETED` (VERIFIED):

- `AgentService` stats (`:184`), `memory-engine.ts:181`, `agent-health-monitor.ts:66`, `metrics-service.ts:187`, `policy-service.ts:275`, `advisor-service.ts:119`, `agent-journal-service.ts:150`, `snapshot-service.ts:114`, `trace-service.ts:200`.
- These are **generic** — `agent-po` gets the same treatment as any node.

Excluded from persistence/recording (VERIFIED — `event-recorder.ts:229-261`): all four cognitive events are filtered out of WAL/Dexie to avoid heap blow-up.

## What to SURFACE for `agent-po` (OPINION, display-only)

1. **PO activity feed** — reuse `LiveActivityStream` / `AgentLiveBoard` already driven by `COGNITIVE_STEP_COMPLETED`; filter by `nodeId:'agent-po'`. (EXISTS, just a filter.)
2. **Decision trail** — `COGNITIVE_DECISION_MADE` is dead-at-consumer; if resurrected, PO prioritization decisions would be the natural first consumer (OPINION).
3. **PO step quality** — `duration`/`provider`/`model` from `COGNITIVE_STEP_COMPLETED` could feed a "PO effectiveness" panel. Model is interesting given the **dropped groq pin** (see `02` #4) — surfacing it would expose the bug.

## RECOMMENDED (OPINION)

- **No new events.** Reuse `COGNITIVE_STEP_COMPLETED` + `nodeId` filter for a PO-specific observability view. This is display/integration only, matching the "AgentService consumes for stats" existing pattern.
- If `COGNITIVE_DECISION_MADE` is ever wired, label PO's prioritization outputs as first-class decisions.
