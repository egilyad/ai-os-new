# 08_MEMORY_AND_CONTEXT — Memory available to `agent-ux`

## CURRENT state

`agent-ux` uses the **generic** `MemoryService` (`memory-engine.ts:52`) — the same engine every agent uses. There is:

- No `agent-ux`-scoped memory namespace.
- No automatic persistence of UX-specific knowledge (heuristics applied, research findings, user personas discovered).
- Memory entries are generic `MemoryEntry` (tags/agentId optional), pruned by `MemoryPruneScheduler` (`memory-engine.ts:19,88`). **[VERIFIED]**

Adjacent memory infrastructure (the "~16 memory stores" from shared context) is **cross-agent / global**, not per-agent-ux: `memory-engine`, `memory-orchestrator`, `federated-memory-service`, `memory-transfer-service`. **[VERIFIED]** (file list).

`AgentJournalService` (`agent-journal-service.ts`) records every `agent-ux` step as a `JournalEntry` (agentId, taskType, outcome, duration) — this is the closest thing to per-agent continuity today, but it stores only metadata, not learned content. **[VERIFIED]**

## What is saved vs read

| What                       | Saved?                                                  | Read back by agent-ux?     |
| -------------------------- | ------------------------------------------------------- | -------------------------- |
| LLM outputs (step results) | Only as traces (rolling 30, `cognitive-service.ts:101`) | No (traces are diagnostic) |
| Stats                      | Yes (Dexie KV `super_agents_agent_stats`)               | Yes (AgentService)         |
| Journal entries            | Yes (`agent_journal_v1`)                                | No semantic read by agent  |
| Memory entries             | Only if something writes them                           | Only if queried by a tool  |

Today, nothing writes UX-domain memory for `agent-ux`. **[INFERRED]**

## Continuity improvements (recommendations)

1. **UX knowledge namespace**: when `agent-ux` produces a usability finding, write a `MemoryEntry` tagged `agent:agent-ux`, `type:ux-finding`, `domain:usability`. Reuses `MemoryRepository` (`memory-engine.ts:3`). **[OPINION]**
2. **Persona memory**: persist discovered user personas / interview insights so a later `agent-ux` turn can recall them (federated memory pattern already exists in `federated-memory-service`). **[INFERRED]** reuse.
3. **Pre-turn recall**: add a `SEARCH_TOOLS`/memory-retrieval step to the `agent-ux` system prompt (or a Director hook) so each run pulls prior UX findings. This turns the generic memory engine into a UX-specific asset without new storage. **[OPINION]**

Risk: must avoid memory bloat / stale heuristics — reuse the existing `memory-quality-gate` (`memory-engine.ts:20`) and TTL pruning. **[VERIFIED]** primitives.
