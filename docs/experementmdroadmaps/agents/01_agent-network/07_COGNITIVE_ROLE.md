# 07_COGNITIVE_ROLE — cognitive-event visibility for `agent-network`

> Improvements over the EXISTING cognitive event system only. No new event types.

## What the cognitive stream is (VERIFIED)

Four events (`event-registry.ts:736-776`):

- `cognitive:trace:updated` (`:736`)
- `cognitive:step:active` (`:755`)
- `cognitive:step:completed` (`:763`) — **the one AgentService consumes** (`agent-service.ts:184`)
- `cognitive:decision:made` (`:776`) — **dead-at-consumer** (AGENTS.md).

Writers: CognitiveService, TraceService, OrchestrationService. Debate does **not** emit cognitive events (`debate-agent-executor.ts` has none).

## Which cognitive events make sense for Nadia (INFERRED)

- **`COGNITIVE_STEP_COMPLETED`** — already fires when she performs a cognitive step via the orchestrator (ConversationCore). This is the right signal for her stats + journal.
- **`COGNITIVE_STEP_ACTIVE`** — drives the Agent Journal "in_progress" entry (`agent-journal-service.ts:130`). Good for live activity boards.
- **`cognitive:trace:updated`** — useful for a per-agent trace viewer (shows her reasoning steps). Currently no consumer renders it per-agent.
- **`cognitive:decision:made`** — semantically perfect for "Nadia chose topology A over B because of latency" but is **dead**; reviving its consumer (e.g. journaling the decision) would add value without a new event.

## Display / integration improvements (OPINION, reuse-only)

1. **Agent Journal already records her steps** (`agent-journal-service.ts`) — add a per-agent journal view (reuse `listByAgent`, `getAgentStats`) in `AgentDetailPanel`. No new event.
2. **Live activity:** the Dashboard `AgentLiveBoard` likely keys off `COGNITIVE_STEP_ACTIVE`/lifecycle; ensure `agent-network` appears when busy. Reuse existing store.
3. **During debate she is cognitively invisible** (no `cognitive:*` emit). Option: have `debate-agent-executor.ts` emit `COGNITIVE_STEP_COMPLETED` (nodeId = participant.agentId) after each turn, mirroring ConversationCore. This gives unified stats/journal across debate + conversation with **zero new event types** and one emit call. (Risk: double-counting if debate also feeds stats elsewhere — verify.)
4. **Decisions:** if `cognitive:decision:made` is ever emitted for her, route it to the Agent Journal (it already subscribes to cognitive events) — currently only ACTIVE/COMPLETED/error are handled (`agent-journal-service.ts:129-191`). Add a 4th handler reusing `record()`.

## What NOT to do (see 15_DO_NOT_BUILD_YET)

- Do NOT create a "networking cognitive event" or a Nadia-specific trace bus. The system is intentionally generic; per-agent specialization belongs in _persona/prompt/side_, not in a new event taxonomy.

## Bottom line

Nadia's cognitive visibility is **partial**: present in ConversationCore, absent in Debate, journaled but UI-hidden. All fixes reuse existing events + existing `AgentJournalService`/`AgentService` consumers.
