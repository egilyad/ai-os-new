# 08_MEMORY_AND_CONTEXT — What the critic remembers

## What is available (VERIFIED)

- **MemoryEngine** subscribes to `COGNITIVE_STEP_COMPLETED` (`memory-engine.ts:181`) and writes memory entries keyed by agent activity. So the critic accumulates memory **during topology runs** only.
- **AgentJournalService** (`agent-journal-service.ts`) writes `JournalEntry` (agentId, agentName, taskType, taskDescription, outcome, durationMs, tokensUsed, notes, tags) on the same event (`agent-journal-service.ts:150`). Again topology-only.
- **AgentService stats** persist to Dexie KV `super_agents_agent_stats` (`agent-service.ts:158-173`).

## What is NOT available / saved (VERIFIED)

- **Debate critique is never memorized.** Debate does not emit `COGNITIVE_STEP_COMPLETED`, so the critic's debate findings, fallacy flags, and red-team demolitions leave **no memory/journal/stats trace** (`agent-service.ts:184` only fires from topology).
- **No critique-specific memory store.** Of the ~16 memory stores, none is keyed to "critiques," "fallacies," or "objections." The critic's output is indistinguishable from any other agent's in memory.
- **No cross-session continuity for critique.** Even in topology, the memory is generic; the critic cannot recall "last time I flagged X's argument as a strawman."
- **No structured critique persistence.** The critic's output is free text; nothing extracts `{ claim, fallacy, severity }` for later query.

## Continuity improvements (OPINION / INFERRED)

1. **Emit `COGNITIVE_STEP_COMPLETED` from debate & conversation critique turns** so the critic's memory/journal/stats are consistent across all runtimes (reuse existing event; no new infra).
2. **Add a `critique` memory store** (one of the 16, or a new typed store) keyed by `{ targetAgentId, topic, fallacyType, severity }` — built from a structured critique object the critic returns.
3. **Persistent fallacy ledger.** Store detected fallacies with source argument id; surface in AgentsPanel as "Greta has flagged N fallacies across M debates."
4. **Critique recall injection.** When the critic is invoked on a topic it has critiqued before, prepend relevant past critiques (memory read → system prompt) to improve consistency.

## Evidence summary

- Topology memory write: `memory-engine.ts:181`
- Topology journal write: `agent-journal-service.ts:150`
- No debate cognitive emit: grep negative on `debate-runtime/`
- No critic-specific store: grep `lensIds`/`fallacy`/`critique` in `memory-engine.ts` → none
