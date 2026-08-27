# 07_MEMORY — `agent-doc-historian`

Memory subsystems touching the historian.

## VERIFIED

- `src/kernel/services/agent-journal-service.ts` exists (memory/journal for agents). It is a generic agent journal; grep for `historian`/`doc-historian` across `src` → only topology/profiles/persona hits, so the journal service has no historian-specific logic.
- AGENTS.md states "~16 memory stores" in the system. These are general memory stores, not per-agent-type.
- `AgentService` persists `AgentStats` and `AgentGroup`s to KV (`agent-service.ts:68-69`, `:158-173`) — this is the historian's only persistent, agent-scoped state (calls/tokens/latency/cost).
- `MEMORY_UPDATED` event (`event-registry.ts:838`) is generic; debates can extract agent memory (`debate-memory.ts`, `debate-memory-extractor.ts`) but nothing ties memory to the historian specifically.

## INFERRED

- The historian has no dedicated memory table, no `crystals` authored specifically by it, and no journal partition keyed by `agent-doc-historian`. Its memory footprint is the same generic mechanism any agent uses.
- If the historian produces a changelog, that text lives only in the conversation/debate transcript or (if the user persists it) in whatever store the user routes it to — not in a historian-owned memory store.

## OPINION

- For a "Documentation Historian" whose value is long-term lineage, the absence of a persistent, agent-scoped memory store is the single biggest functional gap (see 14_EVENT_LOG_LINEAGE, 15_DO_NOT_BUILD_YET).
