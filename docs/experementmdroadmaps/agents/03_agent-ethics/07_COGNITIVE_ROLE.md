# 07 — COGNITIVE ROLE: `agent-ethics`

> Display/integration only. **No new event system is proposed.** This agent should simply become _visible_ through the existing 4 cognitive events.

## Existing cognitive events (VERIFIED — `event-registry.ts:736,755,763,776`)

- `COGNITIVE_TRACE_UPDATED` (`:736`)
- `COGNITIVE_STEP_ACTIVE` (`:755`)
- `COGNITIVE_STEP_COMPLETED` (`:763`)
- `COGNITIVE_DECISION_MADE` (`:776`) — **dead at consumer** (per AGENTS.md): nothing renders it. Do **not** build on it.

## Who writes them (VERIFIED)

- CognitiveService / TraceService / OrchestrationService write them. `AgentService` consumes `COGNITIVE_STEP_COMPLETED` for stats (`:184`). `AgentJournalService` consumes `ACTIVE`+`COMPLETED` (`:129-191`).
- **Debate emits NONE of these** (verified — grep shows no `COGNITIVE_` emit in `debate-runtime`). So Elena is **invisible in the cognitive stream whenever she speaks in a debate.**

## What to surface (OPINION, reuse-only)

1. **Make debate participation visible**: the cleanest fix is for the debate runtime to also emit `COGNITIVE_STEP_COMPLETED` (nodeId = `agent-ethics`, output = argument text) — reusing the exact same event AgentService/Journal already consume. No new event, no new consumer. (INFERRED low-risk)
2. **Tag ethics cognition**: when Elena emits a step, the existing `LiveActivityStream` already shows nodeId; pairing it with her `Analytical` group + 🛡️ avatar (via `resolveAgentIdentity`) makes her identifiable without new infra.
3. **Structured ethical verdict as a step**: if she returns a structured verdict (see 04/05), that verdict text is the `output` of `COGNITIVE_STEP_COMPLETED` and naturally flows to the journal + live stream.
4. **Do NOT revive `COGNITIVE_DECISION_MADE`** — it is dead and would require a new consumer.

## Net effect

Elena becomes observable in the same cognitive pane as every other agent, and her ethics work is persisted in `AgentJournalService` — purely by reusing events that already exist and are already consumed.
