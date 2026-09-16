# 08_COGNITIVE — `agent-doc-auditor` & the Cognitive Event Stream

**VERIFIED.** Four cognitive events exist (`event-registry.ts:736,755,763,776`):

1. `COGNITIVE_TRACE_UPDATED` (`cognitive:trace:updated`, `:736`)
2. `COGNITIVE_STEP_ACTIVE` (`cognitive:step:active`, `:755`)
3. `COGNITIVE_STEP_COMPLETED` (`cognitive:step:completed`, `:763`)
4. `COGNITIVE_DECISION_MADE` (`cognitive:decision:made`, `:776`)

## Writers

- `CognitiveService`, `TraceService`, `OrchestrationService` are the producers. **Debate emits NO cognitive events** (VERIFIED — only `AgentService` consumes `COGNITIVE_STEP_COMPLETED`; debate paths use `debate-memory` only).

## How doc-auditor is observed

- `AgentService.setupListeners()` subscribes `COGNITIVE_STEP_COMPLETED` (`agent-service.ts:184`) and updates per-agent `AgentStats` (calls/tokens/latency/errors). Doc-auditor's stats are incremented through this **shared** path whenever a cognitive step names its `nodeId`.
- A step's `nodeId` is the agent/topology node id (`COGNITIVE_STEP_COMPLETED` payload: `nodeId, traceId, status, duration, output, provider, model`, `:763-775`). So a doc-auditor step carries `nodeId:'agent-doc-auditor'`.
- `COGNITIVE_STEP_ACTIVE` (`nodeId, traceId`) likewise references doc-auditor when it is mid-step.

## `cognitive:decision:made` — dead at consumer

**VERIFIED (shared context).** AGENTS.md states `cognitive:decision:made` is "dead-at-consumer" — no active consumer updates state from it. Doc-auditor's decisions are therefore not specially tracked; the event exists in the registry but is effectively unused.

## Hot-path note

The cognitive schemas are marked `@internal — decorative schema. Runtime validation bypassed for HOT_EVENTS` (`event-registry.ts:732-734`); producers validate before emit. Doc-auditor is unaffected by this perf choice.

## OPINION

Doc-auditor's cognitive footprint is identical to every other agent: it appears in traces/steps by `nodeId`, and its contributions are aggregated by `AgentService` stats. The "auditor" semantics are never reflected in the cognitive event schema (no `verdict`/`contradiction` field). If audit outcomes should be first-class in the cognitive stream, that is a schema extension — currently absent.
