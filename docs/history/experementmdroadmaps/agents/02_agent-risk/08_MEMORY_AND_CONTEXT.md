# 08_MEMORY_AND_CONTEXT — memory available/saved/read for `agent-risk`

## What memory exists (VERIFIED)

- ~16 memory stores under `src/kernel/services/memory/`: emotional, episodic, procedural, semantic, social, spatial, working + sleep/prune/quality/federated/palace/cache/worker.
- Several support **agentId-filtered queries**: `episodic-memory.ts:53`, `social-memory.ts:33`, `service-backed-memory.ts:46` filter `e.metadata.agentId === query.agentId`. So agent-scoped memory retrieval IS technically supported.
- `debate-knowledge-sync.ts:60,84` writes debate arguments into `memoryService` (semantic/episodic) — but this is debate-global, keyed by content, not guaranteed agent-risk-scoped reads.

## What agent-risk actually saves/reads (INFERRED — NEGATIVE)

- **No verified code path auto-loads agent-risk's prior memory into its turns.** Each debate/conversation turn is stateless w.r.t. the agent's own history. The memory stores persist generic content; agent-risk has no dedicated "risk knowledge" memory that is injected as context.
- **No self-journaling on execution.** `agent-journal-service.ts` exists and is queryable by agentId, but nothing in the execution path (debate/ConversationCore/Invocation) writes a journal entry for agent-risk automatically. Journal entries are user/externally created (AgentJournalPanel).
- Therefore: memory is **EXISTS-BUT-UNUSED** for agent-risk continuity. (Capability matrix flag, 02.)

## Long-term / episodic / semantic / agent-specific (INFERRED)

- Long-term (semantic): could store risk frameworks, prior FAIR/DREAD scores — but not auto-populated.
- Episodic: could store "risk review of payment service on date X" — not auto-populated.
- Agent-specific: the `agentId` filter exists; the binding to agent-risk is not wired.

## Continuity improvements (OPINION — see 11/13)

1. **Auto-load agent memory into turns:** when `resolveAgent('agent-risk')` runs (agent-service.ts:337), attach a `systemContext` built from `memoryService.query({agentId:'agent-risk', type:'semantic'|'episodic'})`. This gives the agent recall of past risk analyses — pure reuse of existing stores + resolver seam.
2. **Auto-journal risk decisions:** on `cognitive:decision:made` (or debate argument) for agent-risk, write a `JournalEntry` via `agentJournalService` (reuse existing service, AgentJournalPanel UI already exists).
3. **Risk memory type:** optionally a `risk` tagged semantic memory (probability/impact tables) — but this can be plain semantic memory with `metadata.tags:['risk']`; no new store needed.

## Caveat (VERIFIED)

- Memory stores cap entries (memory-cache hard cap, MAX_MEMORY_ENTRIES → CONFIG.services.memory.maxEntries per P2.20). Auto-loading must respect the cap and be cheap (last-N or tagged query).
