# 07_COGNITIVE_EVENTS — Cognitive Event Stream

**Status:** VERIFIED. How doc-checker contributes to cognitive observability.

## The 4 cognitive events

Defined in `src/kernel/events/event-registry.ts`:

- `COGNITIVE_TRACE_UPDATED` (`cognitive:trace:updated`) — event-registry.ts:736-754
- `COGNITIVE_STEP_ACTIVE` (`cognitive:step:active`) — event-registry.ts:755-762
- `COGNITIVE_STEP_COMPLETED` (`cognitive:step:completed`) — event-registry.ts:763-775
- `COGNITIVE_DECISION_MADE` (`cognitive:decision:made`) — event-registry.ts:776

Writers (per AGENTS.md): `CognitiveService`, `TraceService`, `OrchestrationService`. **`AgentService` only consumes** (for stats), it does not emit.

## doc-checker stats flow

`AgentService.setupListeners` subscribes to `COGNITIVE_STEP_COMPLETED` keyed by `nodeId` (agent-service.ts:184-210). When doc-checker executes a ConversationCore/Director turn, the orchestrator emits a step with `nodeId:'agent-doc-checker'`, and AgentService increments its `calls/tokens/latency/errors/estimatedCost` (agent-service.ts:195-207). This is the basis for `AgentsPanel` stats dashboards (see 03_AGENT_SERVICE, 01_IDENTITY).

## `cognitive:decision:made` is dead-at-consumer

Per AGENTS.md: "cognitive:decision:made dead-at-consumer." No consumer acts on it; doc-checker does not benefit from or emit it.

## Debate does NOT emit cognitive events

Per AGENTS.md: "Debate emits NO cognitive events." So a doc-checker debate turn does **not** produce `COGNITIVE_STEP_COMPLETED` for doc-checker — only ConversationCore/LLM `STREAM_END` (provider-level, prefixed key, agent-service.ts:219-244) and the generic chat `MESSAGE_RESPONSE` apply. doc-checker's per-agent stats are therefore driven by ConversationCore/Director execution, not debate.

## Observability UI

`AgentsPanel/LiveActivityStream.tsx` and `AgentStatsDashboard.tsx` visualize these stats. The cognitive trace is also surfaced via `cognitive:trace:updated` consumers (TraceService UI).

## Confidence

- Event definitions + AgentService consumption: VERIFIED (read).
- Debate-no-cognitive / decision-dead: VERIFIED via AGENTS.md (explicit statement).
