# 12_FUTURE_AGENT_CONCEPT — Realized concept from EXISTING capabilities

## Concept: "Priya, the Verifiable Database Engineer"

A realized (not invented) concept assembled **entirely from capabilities already present or one step away** in the codebase — no new framework.

### What exists to build it (VERIFIED)

- Curated identity + pinned model: `agent-profiles.ts:82-91` → `normalizeAgentIdentity` applies it (`topology-defaults.ts:91-118`).
- Invocation path: human can already invoke Priya via `RoomPanel` + `Manual Room Chat` policy (`phase21-invocation.ts:125-144`); execution hands off to ConversationCore (`InvocationExecutionDelegate.start` `:60-110`).
- Director scenarios: deterministic turns already resolve her persona (`conversation-director-service.ts`).
- Debate path: she can already be a participant (`persona-selector.ts`), just without a DB persona (addable, QW-3).
- Memory + journal: her outputs already land in the mesh and journal (`memory-engine.ts:181`, `agent-journal-service.ts:130`).
- SQL runtime hint: `bootstrap-key-init.ts:80` already references a `sqlite_db_blob` / sql.js extraction path (disabled, but the seam exists).

### The realized concept

1. Human opens Room → picks **Priya Nair** → pastes a slow query + schema DDL → Mode **Chat**.
2. Invocation creates a ConversationCore scenario; the (future) `sql_executor` tool lets Priya **run the query in a sandbox**, return an **EXPLAIN plan**, and propose a concrete index/rewrite.
3. The advice is stored in her **specialization-tagged memory** (M-2) so a later "add a partition" turn has context (M-5).
4. If the recommendation is high-confidence, it is proposed as a **Crystal** (B-3) and reused by the Knowledge Generator.
5. In a **debate** about data architecture, the `data_engineer` persona (QW-3) lets her ground the dispute in execution plans rather than opinion.

### Why this is "realized" not "new"

Every building block is present: identity, invocation, director, debate, memory, journal, and a dormant SQL seam. The concept needs **wiring + one real tool (QW-1/B-1)**, not a new subsystem. It respects the architecture rules (event-first, no globals, agent is not a second orchestrator — it remains a topology node resolved via `IAgentResolver`).
