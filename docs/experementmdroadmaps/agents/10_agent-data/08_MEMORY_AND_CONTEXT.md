# 08_MEMORY_AND_CONTEXT — Memory available to / saved by `agent-data`

## Memory substrate (VERIFIED)

`memory-orchestrator.ts` exposes **7 typed stores** (not 16 — the "≈16 memory stores" in the brief overcounts; the actual store classes are: working, episodic, semantic, procedural, emotional, social, spatial — `memory-orchestrator.ts:33-58`, plus `DexieMemoryStore` in `dexie-storage.ts:104`):

| Store      | Type            | agent-data relevance                                                        |
| ---------- | --------------- | --------------------------------------------------------------------------- |
| WORKING    | transient       | per-execution scratch (not agent-keyed)                                     |
| EPISODIC   | event memory    | `memory-engine.ts:181` writes on `COGNITIVE_STEP_COMPLETED` (nodeId-tagged) |
| SEMANTIC   | facts           | queryable; no agent-data-specific seeding                                   |
| PROCEDURAL | how-to          | generic                                                                     |
| EMOTIONAL  | affect          | generic                                                                     |
| SOCIAL     | agent relations | generic                                                                     |
| SPATIAL    | location        | generic                                                                     |

## What is saved (VERIFIED)

- `memory-engine.ts:181` subscribes to `COGNITIVE_STEP_COMPLETED`. When `agent-data` completes a step, an entry is stored. Entries carry the generic payload; whether `agentId` is populated depends on the memory-engine's extraction (it keys on `nodeId`). **No agent-specific logic** — `agent-data` is one of 25 nodes feeding the same pipeline.
- `AgentJournalService` (`agent-journal-service.ts:150-171`) records `agent-data` steps + `debate:runtime:agent:error` (`:174`). NOTE: `agentName` is stored as the raw `nodeId` (`'agent-data'`), not `'Sam Okafor'` (`:135,:161`).

## What is read / continuity (INFERRED gap)

- `memory-orchestrator.ts:82 getStore`, `:91 query` accept a `MemoryStoreQuery` that supports `agentId`/`tags`. So the _capability_ to retrieve `agent-data`-scoped memory exists, but **no caller currently queries memory filtered by `agentId:'agent-data'`** for continuity. Continuity is therefore global/episodic, not agent-personalized.
- `agent-data` has **no dedicated memory store, no persona memory, no "what Sam learned" view**.

## Continuity improvements (OPINION)

1. **Tag memory writes with `agentId`** in `memory-engine.ts` extraction (cheap: copy `nodeId`→`agentId`). Enables per-agent recall.
2. **Agent memory tab**: in `AgentDetailPanel`, add a "Memory" section that calls `memoryOrchestrator.query({agentId:'agent-data'})` (reuses existing API). No new store.
3. **Inject last-K episodic memories into `agent-data`'s system prompt** when it is resolved (`resolveAgent` could optionally return recent memories) — gives Sam persistent context across debates/conversations.
4. **Fix journal display name** to `displayName` (`Sam Okafor`) via `resolveAgentIdentity` at write time (agent-journal-service.ts:135).
