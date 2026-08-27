# 08 — MEMORY & CONTEXT: `agent-ethics`

## What exists today (VERIFIED)

- **AgentJournalService** (`agent-journal-service.ts`): the only agent-scoped memory store. Subscribes to:
  - `COGNITIVE_STEP_ACTIVE` → records an `in_progress` entry (`:130-147`)
  - `COGNITIVE_STEP_COMPLETED` → records success/failure (`:150-171`)
  - `debate:runtime:agent:error` → records a failure entry (`:174-189`)
- Storage: Dexie KV `agent_journal_v1`, capped at 1000 entries, CAS-safe (`:36-81`). Persists across reloads.
- **AgentService stats KV** (`super_agents_agent_stats`): calls/tokens/latency/errors/cost per nodeId (`:68`, `:184-210`).
- **No dedicated long-term "ethics memory"** (no vector store, no bias-audit log bound to her). (INFERRED — none found)

## What is actually saved for Elena (VERIFIED/INFERRED)

- Each time she runs via ConversationCore/Director: one `in_progress` + one completed journal entry.
- Each debate **error**: one failure entry. **Debate successes are NOT journaled** (only errors via `debate:runtime:agent:error`). (VERIFIED — no `COGNITIVE_STEP_COMPLETED` in debate)
- Entries are keyed by raw `nodeId` (`agent-ethics`) and `agentName` is set to the node id, not "Elena Marchetti" (`:135,161,179`). `tags: []` — no ethics taxonomy. (VERIFIED)

## Continuity problems (VERIFIED → INFERRED)

1. **Identity mismatch in memory**: journal shows `agent-ethics`, not the human name — harder to scan.
2. **No cross-session learning**: her past ethical verdicts/bias findings are not retrievable as context for future runs.
3. **Debate silence**: her debate arguments (where most ethics reasoning happens) leave no journal trail.
4. **No structured extraction**: even when she produces an ethical-risk note, it is stored as raw text, not as queryable risks/alternatives.

## Improvements (OPINION, reuse-first)

- **QW**: record Elena's display name + an `ethics` tag in journal entries (reuse `record()` fields; no schema change).
- **QW**: have debate runtime emit `COGNITIVE_STEP_COMPLETED` for participant steps (reuse existing event/consumer) so her debate reasoning is journaled.
- **MEDIUM**: add a lightweight **ethics verdict extractor** that parses her structured output (risks / responsible alternative / framework) into journal `tags`/`notes` — reuse the same parse approach as `bias-profiler`/`debate-metrics` ethical_framework scoring (`debate-metrics.ts:480-519`).
- **MEDIUM**: expose her past verdicts in `AgentHistoryTab`/`AgentJournalPanel` filtered by `ethics` tag.
- **BIG**: bind a Crystal (Knowledge Crystal) to each finalized ethical verdict so it becomes reusable institutional memory (reuse CrystalVault bridge pattern, AGENTS.md Module 2).
