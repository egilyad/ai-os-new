# 07_COGNITIVE_ROLE — Cognitive event visibility for `agent-security`

> Display/integration only. VERIFIED event definitions + consumption.

## Cognitive event surface (VERIFIED — `event-registry.ts:736-776`)

| Event                                                   | Emitted by                    | Carries nodeId? | Notes                                    |
| ------------------------------------------------------- | ----------------------------- | --------------- | ---------------------------------------- |
| `COGNITIVE_TRACE_UPDATED` (`cognitive:trace:updated`)   | CognitiveService/TraceService | trace-level     | full trace array                         |
| `COGNITIVE_STEP_ACTIVE` (`cognitive:step:active`)       | CognitiveService              | ✅ `nodeId`     |                                          |
| `COGNITIVE_STEP_COMPLETED` (`cognitive:step:completed`) | CognitiveService              | ✅ `nodeId`     | drives AgentService stats + AgentJournal |
| `COGNITIVE_DECISION_MADE` (`cognitive:decision:made`)   | CognitiveService              | —               | **DEAD at consumer** (shared context)    |

## What `agent-security` contributes (VERIFIED)

- On **ConversationCore/Director/Chat** path: `cognitive-service.ts:421` reads `node.config.systemPrompt`, so each `agent-security` turn emits `COGNITIVE_STEP_ACTIVE` + `COGNITIVE_STEP_COMPLETED` with `nodeId:'agent-security'`.
- `AgentService` consumes `COGNITIVE_STEP_COMPLETED` (`agent-service.ts:184-210`) → increments `calls/tokens/latency/errors/estimatedCost` for `agent-security`.
- `AgentJournalService` consumes both `COGNITIVE_STEP_*` (`agent-journal-service.ts:129-172`) → journal entry per step.
- On **Debate** path: debate runtime emits `debate:*` only; **no `cognitive:*` events** → `agent-security`'s cognitive visibility is absent during debates (VERIFIED by code paths).

## Display / integration opportunities (OPINION)

1. **Dashboard "Security activity" tile** — subscribe to `COGNITIVE_STEP_COMPLETED` filtered by `nodeId==='agent-security'` and render a live feed in AgentsPanel Observability tab (reuse `AgentObservabilityTab.tsx`).
2. **Close the debate blind-spot** — either (a) have `debate-llm-caller` also emit `COGNITIVE_STEP_COMPLETED` for participants, or (b) have `AgentJournalService` additionally consume `debate:argument`/`agent:responded` to attribute debate activity to `agent-security`. Low-risk, high-value (see 11 QW-4).
3. **`COGNITIVE_DECISION_MADE`** is dead — if a security "decision" (e.g., flag/approve) event is ever needed, define it properly rather than reusing the dead schema.

## Status flags

- ConversationCore path: **USED** (full).
- Debate path: **PARTIAL / blind-spot** (no cognitive events).
- `COGNITIVE_DECISION_MADE`: **DEAD**.
