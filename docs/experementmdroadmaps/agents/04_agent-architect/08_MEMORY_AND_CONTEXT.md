# 08 — MEMORY & CONTEXT: `agent-architect`

## AVAILABLE / SAVED / READ (VERIFIED)

- **No agent-private memory store.** The architect shares the generic `agent-journal-service` (`agent-journal-service.ts:96`), which records one `JournalEntry` per `COGNITIVE_STEP_ACTIVE`/`COGNITIVE_STEP_COMPLETED` event keyed by `nodeId` (`agent-architect`). Persisted to Dexie KV `agent_journal_v1` (`:36`, `MAX_ENTRIES=1000`).
- **System-wide memory engine** (`memory-engine.ts:181`) also consumes `COGNITIVE_STEP_COMPLETED` for a shared memory store (~16 memory stores in the system [per AGENTS.md]) — but none are architect-scoped.
- **No conversation history continuity** specific to the architect beyond the generic journal: prior design recommendations are not retrievable by a later architect invocation.

## READS

- The architect reads **no persistent memory** at prompt-build time. Its system prompt is static (`topology-defaults.ts:188`). It does not consult its own journal, the memory engine, crystals, or junction store.
- In ConversationCore it receives conversation `history` (turn context) like any participant — that is the only contextual read.

## CONTINUITY IMPROVEMENTS (recommended)

1. **Architect memory scope** — add a per-agent journal view/filter so the architect's past trade-off decisions are retrievable (reuse `agent-journal-service`, add `agentId` filter in UI; no new storage).
2. **Prompt-injected recall** — when the architect is invoked, prepend its last N journal entries (design conclusions) into the system prompt. Reuses existing `agent-journal-service.list()` — no new infra.
3. **Crystal bridge** — if the architect's conclusion crystallizes (via `crystalVault`), later invocations could cite it. The `crystal-debate-bridge` already auto-proposes crystals from verdicts; an analogous architect→crystal path is POTENTIAL (see 11).
4. **Topology snapshot in context** — inject the current `AuditorTopology` node/edge summary so the architect reasons about the _actual_ system, not a generic one. [OPINION] High value, low cost (topology is already in memory).

## VERDICT

Memory for this agent is **generic and non-recallable**. The data exists (journal + memory engine) but is never fed back into the architect's reasoning. This is the cheapest high-impact improvement area (08.2/08.4).
