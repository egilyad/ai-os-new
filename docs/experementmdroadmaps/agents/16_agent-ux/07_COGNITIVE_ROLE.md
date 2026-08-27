# 07_COGNITIVE_ROLE — Cognitive Event Stream for `agent-ux`

## CURRENT state

Four cognitive events exist (`event-registry.ts:736-776`):

- `COGNITIVE_TRACE_UPDATED` (736)
- `COGNITIVE_STEP_ACTIVE` (755)
- `COGNITIVE_STEP_COMPLETED` (763)
- `COGNITIVE_DECISION_MADE` (776)

**Producers/consumers for `agent-ux`:**

- `CognitiveService` listens to `COGNITIVE_STEP_ACTIVE`/`_COMPLETED` and builds traces (`cognitive-service.ts:199-259`). These are emitted by the **chat/ConversationCore path** (`cognitive-service.ts:229-259`), so a `agent-ux` ChatExecutor/Director turn DOES produce steps+stats. **[VERIFIED]**
- `AgentService` consumes `COGNITIVE_STEP_COMPLETED` for per-agent stats (`agent-service.ts:184-210`) and `STREAM_END` for provider-level stats (`:219-244`). **[VERIFIED]**
- `AgentJournalService` consumes both step events for journal entries (`agent-journal-service.ts:130-172`). **[VERIFIED]**
- `COGNITIVE_DECISION_MADE` is **DEAD at the consumer for agents**: `CognitiveService.executeAgentNode` emits it (`cognitive-service.ts:414`) but no agent-specific consumer surfaces a "decision" for `agent-ux`. The shared context confirms it is dead-at-consumer. **[VERIFIED]**

**Debate path emits NO cognitive events** — a `agent-ux` debate turn is invisible to the cognitive stream. **[VERIFIED]** (debate uses `DEBATE_*` events only).

## What to surface (display/integration only — no new agent logic)

1. **Live step feed**: RoomPanel / AgentObservabilityTab already can show `COGNITIVE_STEP_ACTIVE/_COMPLETED` per `nodeId === 'agent-ux'`. Just filter the existing `LiveActivityStream` by agent id. **[INFERRED]** reuse.
2. **UX decision log**: if a UX-specific decision tool is added later (see 11/12), have it emit via the existing `COGNITIVE_DECISION_MADE` schema rather than a new event — reviving the dead event instead of adding one. **[OPINION]**
3. **Cognitive trace correlation**: link `agent-ux` turns in Director scenarios to their `traceId` so a UX review scenario shows the full reasoning chain in `CognitiveTraceView`. Reuses `cognitive-service.ts:375 getTraces`. **[INFERRED]**

## Recommendation

Do **not** add new cognitive events for `agent-ux`. Reuse `COGNITIVE_STEP_COMPLETED` (already wired) and revive `COGNITIVE_DECISION_MADE` only when a real UX decision primitive exists. Keep the cognitive stream as a **display/integration** layer, never a behavior owner. **[OPINION]**
