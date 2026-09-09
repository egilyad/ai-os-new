# 08_MEMORY_AND_CONTEXT — Memory available/saved/read for `agent-creative`

## What is saved today (VERIFIED)

| Store                                  | Keyed by      | agent-creative writes?        | Evidence                                 |
| -------------------------------------- | ------------- | ----------------------------- | ---------------------------------------- |
| `agent_journal_v1` (Dexie KV)          | agent id      | ✅ every step                 | `agent-journal-service.ts:55-81,206-227` |
| `super_agents_agent_stats` (KV)        | agent id      | ✅ calls/tokens/cost          | `agent-service.ts:68,158-210`            |
| `super_agents_agent_groups` (KV)       | group id      | ✅ if grouped                 | `agent-service.ts:69,667-686`            |
| Debate tables (`debateArguments` etc.) | session/topic | ✅ as participant             | `debate-*` persistence                   |
| Conversation scenarios / runs          | scenario id   | ✅ as participant             | `conversation-*` persistence             |
| Crystals / Forum posts                 | record id     | ✅ as author (if it proposes) | `crystal-debate-bridge`, `ForumPanel`    |

## What is read back (VERIFIED / INFERRED)

- **Stats & journal** are read in AgentsPanel (`AgentStatsDashboard`, `AgentHistoryTab`)
  and `AgentJournalService.listByAgent` (`agent-journal-service.ts:253`).
- **Debate memory** (`debate-memory.ts`, `debate-memory-graph.ts`) is **topic/session
  keyed**, not agent-keyed. `agent-creative` contributes to it but cannot _retrieve its
  own_ prior creative decisions per-agent.
- **No agent-scoped semantic memory.** There is no store that says "here is what
  `agent-creative` previously decided about brand X." The ~16 memory stores (AGENTS.md)
  are mostly global/domain (crystals, junctions, synthesis, forum, generator jobs, etc.),
  not per-agent long-term creative memory.

## Continuity gaps (OPINION, grounded in above)

1. **No brand/style memory.** If `agent-creative` drafts copy for "Acme" today and again
   next week, it has no persisted "Acme brand voice" to stay consistent with. The journal
   log exists but is not structured for retrieval (it stores raw `taskDescription` strings,
   `agent-journal-service.ts:7-19`).
2. **Debate contributions are not linked to the agent's creative lineage.** A creative
   idea in a debate and its later crystallization in Crystal are connected only by topic,
   not by `agentId`.
3. **Lens/memory not combined.** `lensIds:[]` means no perspective is consistently applied,
   so "creative memory" has no framing lens.

## Recommended continuity improvements (reuse-existing)

- **Structured journal tags:** extend `JournalEntry.tags` (`agent-journal-service.ts:17`)
  to auto-tag `agent-creative` entries with its `specializations` (Ideation/Narrative/
  Brand) at record time. Zero new storage; just richer `listByTag` queries
  (`agent-journal-service.ts:257`).
- **Brand voice as a Crystal:** when `agent-creative` produces a strong brand definition,
  route it through `crystalVault.propose` (existing `crystal-debate-bridge`). Then future
  sessions can load that crystal as context — genuine continuity without a new store.
- **Agent-memory view:** a read-only panel joining journal + crystals + forum posts by
  `agentId` (all three already expose `agentId`/author). Presentation only.
