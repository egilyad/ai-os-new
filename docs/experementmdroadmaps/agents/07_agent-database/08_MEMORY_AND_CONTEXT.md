# 08_MEMORY_AND_CONTEXT — Memory available to / saved by `agent-database`

## What exists (VERIFIED)

- **Global memory mesh:** 15 memory stores under `src/kernel/services/memory/` — `semantic-memory`, `episodic-memory`, `procedural-memory`, `working-memory`, `social-memory`, `emotional-memory`, `spatial-memory`, `memory-palace`, `memory-cache`, `memory-quality-gate`, `memory-search-utils`, `memory-prune-scheduler`, `memory-worker-client`, `sleep-engine`, `service-backed-memory`.
- `MemoryEngine` ingests `cognitive:step:completed` (`memory-engine.ts:181`), so `agent-database`'s outputs DO enter the shared mesh.
- `AgentJournalService` writes per-agent journal entries keyed by `agentId` to Dexie KV (`agent_journal_v1`, `agent-journal-service.ts:36,55`).

## What is NOT specialized (VERIFIED / INFERRED)

- There is **no DB-specific memory partition.** All 15 stores are domain-agnostic. A SQL-tuning insight produced by `agent-database` is stored alongside every other agent's output with no `specialization`/`domain` tag that would let it be retrieved specifically for future DB tasks.
- The agent has **no working memory of prior schemas/queries** it has reviewed in this session versus past sessions in an isolatable way.
- `lensIds:[]` means no lens biases its memory retrieval.

## Continuity improvements (OPINION — reuse existing infra)

1. **Tag memory writes with `agentId` + `specialization`.** `MemoryEngine` already has the `nodeId` from the event; extend the stored entry metadata with `specializations` (already on `ResolvedAgent`) so DB memories are retrievable by domain. Reuses the existing event payload — no new bus.
2. **Procedural memory for SQL patterns.** Promote repeated SQL-tuning advice into `procedural-memory` so the agent's future turns cite its own prior recommendations (genuine continuity, not re-derivation).
3. **Schema scratchpad.** A lightweight `working-memory` entry keyed by `agent-database:<session>` holding the last reviewed schema/query, so a follow-up "now add an index" turn has context. Reuses `working-memory.ts`.
4. **Journal → Crystal bridge.** High-confidence DB recommendations in `agent-journal-service` could be surfaced to the Crystal Vault (Module 2) as candidate knowledge — reuses the existing `debate:verdict:generated → crystal` bridge pattern.

## Risk

Memory writes are global; adding `specialization` tags is low-risk (additive metadata) but must avoid polluting retrieval for other agents — scope tags to `agentId` first.
