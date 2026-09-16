# 08 — MEMORY AND CONTEXT for `agent-content`

> What memory is available/saved/read; continuity improvements. VERIFIED in memory-engine.ts.

## What is saved today (VERIFIED)

- `MemoryEngine` subscribes to `COGNITIVE_STEP_COMPLETED` (memory-engine.ts:181-200). On each `agent-content` step it stores:
  ```ts
  { content: output, metadata: { source: nodeId, type:'decision', timestamp, importance:0.4 } }
  ```
  - `source` = `'agent-content'` (memory-engine.ts:188).
  - `importance` is hardcoded `0.4` (memory-engine.ts:191) — **not** agent- or content-aware.
- Storage: Dexie memory store via `store()` (memory-engine.ts:184).

## What is read today (VERIFIED gap)

- The generic memory store is **global**. `agent-content` does **NOT** get a scoped recall of "what I previously wrote." There is no `getMemoriesByAgent('agent-content')` path; retrieval is by query/importance, not by agent identity.
- So `agent-content` has **no conversational continuity** as "Lena" — each invocation starts from its fixed system prompt + the current request, with no awareness of its own past outputs.

## Adjacent memory services (VERIFIED)

- `agent-journal-service.ts` records per-`nodeId` journal entries (success/failure/duration) — listable via `listByAgent('agent-content')` (agent-journal-service.ts:253). This is the closest thing to "agent-scoped history" and IS queryable by agent.
- `AgentService` stats are per-`nodeId` (agent-service.ts:288) — call counts, cost, lastActive.

## Continuity improvements (OPINION, reuse existing)

1. **Agent-scoped memory recall.** Extend `MemoryEngine` retrieval to filter by `metadata.source === agentId` (the field already exists at memory-engine.ts:188). Then `agent-content` (and any agent) could be given a "previous work" brief at turn time via `resolveAgent` enrichment. Low effort — filter already-supported field.
2. **Higher importance for content artifacts.** Allow an agent (or a content skill) to mark an output `importance > 0.4` so Lena's published drafts survive memory pruning. Requires an optional importance override on the stored entry.
3. **Structured content memory.** Store content outputs with `type:'content'` + `tags:['seo','editorial']` + `topic` so a later "improve this" invocation can pull the prior draft. Reuses the existing `metadata` shape (memory-engine.ts:186-192) — just populate more fields.
4. **Cross-session journal.** `AgentJournalService.listByAgent('agent-content')` already enables a "Lena's work history" tab — surface it prominently in AgentDetailPanel (likely already present via AgentHistoryTab; verify it filters by agent).

## Risks / dependencies

- Memory store is shared; agent-scoping must not leak one agent's memory into another's prompt. Filter strictly on `source`.
- Importance override needs a contract change in the store call (small).
- No new Dexie table required — reuse existing memory + journal stores.
