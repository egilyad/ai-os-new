# 07_COGNITIVE_ROLE — Cognitive Event Stream

## Events available (VERIFIED — `event-registry.ts:736-776`)

1. `COGNITIVE_TRACE_UPDATED` (`cognitive:trace:updated`)
2. `COGNITIVE_STEP_ACTIVE` (`cognitive:step:active`)
3. `COGNITIVE_STEP_COMPLETED` (`cognitive:step:completed`)
4. `COGNITIVE_DECISION_MADE` (`cognitive:decision:made`)

## Who writes them (VERIFIED)

- `COGNITIVE_STEP_COMPLETED` is emitted **only** by `orchestration-service.ts:414` — i.e., during **topology** execution. So `agent-critic` emits it (with `nodeId:'agent-critic'`) when the default topology runs (`router → agent-critic → aggregator`).
- `COGNITIVE_DECISION_MADE` — **dead at consumer** per AGENTS.md: emitted by someone but no consumer acts on it. Not specifically tied to the critic.
- Debate emits **no** cognitive events (grep: no `COGNITIVE_STEP_COMPLETED` emit in `debate-runtime/`).

## What consumes the critic's step (VERIFIED)

| Consumer                      | Uses `nodeId:'agent-critic'`? | Evidence                                           |
| ----------------------------- | ----------------------------- | -------------------------------------------------- |
| AgentService stats            | ✅ (if nodeId matches)        | `agent-service.ts:184-210`                         |
| AgentJournalService           | ✅                            | `agent-journal-service.ts:150`                     |
| MemoryEngine                  | ✅                            | `memory-engine.ts:181`                             |
| CognitiveService/TraceService | ✅                            | `cognitive-service.ts:229`, `trace-service.ts:200` |
| AgentHealthMonitor            | ✅                            | `agent-health-monitor.ts:66`                       |
| SnapshotService               | ✅                            | `snapshot-service.ts:114`                          |
| MetricsService                | ✅                            | `metrics-service.ts:187`                           |
| LiveActivityStream (UI)       | ✅                            | `LiveActivityStream.tsx:122`                       |
| AgentsPanelContainer          | ✅                            | `AgentsPanelContainer.tsx:137`                     |

## Display / integration only (OPINION)

The cognitive stream already captures the critic's topology activity. To surface the critic specifically:

- **LiveActivityStream** already filters `COGNITIVE_STEP_COMPLETED` by `nodeId` (`LiveActivityStream.tsx:122`) — could add a filter chip "show only Greta / Critical Auditor."
- A `cognitive:decision:made` payload could be emitted by the critic when it **rejects/flags** an argument — but today it is dead; reviving it for the critic's "I found a fallacy" moment would give a first-class, queryable critique event without new infra.
- RoomPanel's live feed (`RoomPanel.tsx:334-357`) already shows `conversation:*` turns; a critique turn from the critic would appear there naturally once ConversationCore critique routing exists (see `05_CONVERSATION_ROLE`).

**Constraint:** No new cognitive events should be invented without reusing the 4 existing ones. The critic's value is best surfaced by emitting `COGNITIVE_DECISION_MADE` (already defined) on critique findings, and by ensuring debate/critique paths also emit `COGNITIVE_STEP_COMPLETED` for parity.
