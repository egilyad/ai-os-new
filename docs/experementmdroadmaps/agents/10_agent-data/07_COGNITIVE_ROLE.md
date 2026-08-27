# 07_COGNITIVE_ROLE — Cognitive Event Stream for `agent-data`

## Events (VERIFIED, event-registry.ts:736/755/763/776)

| Event                      | Name                       | Producer                                           | Notes                                                  |
| -------------------------- | -------------------------- | -------------------------------------------------- | ------------------------------------------------------ |
| `COGNITIVE_TRACE_UPDATED`  | `cognitive:trace:updated`  | `cognitive-service.ts:338`, `trace-service.ts:344` | array of trace objects (decorative schema, HOT bypass) |
| `COGNITIVE_STEP_ACTIVE`    | `cognitive:step:active`    | `orchestration-service.ts:355`                     | `{nodeId, traceId, metadata?}`                         |
| `COGNITIVE_STEP_COMPLETED` | `cognitive:step:completed` | `orchestration-service.ts:414`                     | `{nodeId, traceId, status, duration, output, ...}`     |
| `COGNITIVE_DECISION_MADE`  | `cognitive:decision:made`  | `cognitive-service.ts:414`                         | **emitted but NO consumer → DEAD-at-consumer**         |

## What `agent-data` produces today (VERIFIED)

Every time `agent-data` executes a node (debate turn, conversation turn, group execution), `orchestration-service` emits `COGNITIVE_STEP_ACTIVE` then `COGNITIVE_STEP_COMPLETED` with `nodeId:'agent-data'`. These are consumed by:

- `AgentService` → per-agent stats (agent-service.ts:184).
- `memory-engine.ts:181` → memory write.
- `agent-journal-service.ts:150` → journal entry.
- `agent-health-monitor.ts:66`, `metrics-service.ts:187`, `advisor-service.ts:119`, `policy-service.ts:275`, `snapshot-service.ts:114`, `trace-service.ts:200`, `cognitive-service.ts:229`.

So Sam's cognitive activity is **already fully instrumented** — it just isn't surfaced _as Sam_ in a dedicated view.

## What is missing (VERIFIED)

- `COGNITIVE_DECISION_MADE` is emitted (`cognitive-service.ts:414`) but grep shows **no `on`/`onSafe` subscriber** anywhere → it is dead. `agent-data` therefore has no "decision" signal reaching any store or UI.
- No agent-scoped trace view. `COGNITIVE_TRACE_UPDATED` is global; there is no `traceId→agentId` filter exposed for `agent-data`.

## Recommended display/integration only (OPINION)

Pure UI/store work, no new events needed:

1. **Agent activity timeline** in `AgentDetailPanel`/`AgentObservabilityTab`: subscribe to `COGNITIVE_STEP_COMPLETED` filtered by `nodeId==='agent-data'`, show last N steps with duration/status (reuse `LiveActivityStream.tsx` pattern already in AgentsPanel).
2. **Repair the dead decision signal**: either (a) add a consumer that logs `cognitive:decision:made` into AgentJournal with `agentId`, or (b) stop emitting it. For `agent-data` a "statistical decision" log (e.g., "chose model X because…") would be valuable — but that requires the producer to actually carry `agentId` (currently the schema is generic).
3. **Stats surfacing**: `AgentStatsDashboard` already renders `AgentStats`; ensure `agent-data` is filterable by id (it is, via `getStats('agent-data')`, agent-service.ts:288).
