# 08_MEMORY_AND_CONTEXT — memory available to / saved by `agent-devops`

> VERIFIED: `agent-journal-service.ts`; INFERRED for "16 memory stores" (per AGENTS.md) and persistence.

## What is saved today (VERIFIED)

- **Agent journal:** `AgentJournalService` persists `JournalEntry` per devops step (cognitive_step active/completed, debate error) to KV `agent_journal_v1` (`agent-journal-service.ts:36,55-81`). `listByAgent('agent-devops')` works (`agent-journal-service.ts:253`).
- **Stats KV:** `super_agents_agent_stats` (per-node stats) (`agent-service.ts:68,135`).
- **Groups KV:** `super_agents_agent_groups` (`agent-service.ts:69`).
- **Dexie KV persistence:** general `database` KV layer used by both.

## What is read back (VERIFIED)

- `AgentService.getStats('agent-devops')` (`agent-service.ts:288`).
- `AgentJournalService.listByAgent('agent-devops')` (`agent-journal-service.ts:253`) — but **no UI consumer** surfaces devops-specific journal (EXISTS-BUT-UNUSED, see `02_CAPABILITIES.md`).

## "16 memory stores" (INFERRED)

AGENTS.md cites ~16 memory stores; none are devops-specific. Devops shares the generic memory subsystem used by all agents. There is **no** runbook memory, incident memory, or CI/CD artifact memory scoped to `agent-devops`.

## Continuity gaps (OPINION)

1. **No runbook/incident memory** — Tomas Berg cannot recall past incident post-mortems or learned deployment patterns. Each invocation starts cold from the 1-line prompt.
2. **No specialization-tagged retrieval** — journal tags are empty (`agent-journal-service.ts:133-146`), so memory is not queryable by `Kubernetes`/`CI/CD`.
3. **Debate turns are not memorized** — debate emits no cognitive events, and journal records only `debate:runtime:agent:error` (`agent-journal-service.ts:174`), not successful devops debate contributions.
4. **No cross-agent memory bridge** — devops does not read Crystals/Forums written by `agent-architect`/`agent-security`.

## Continuity improvements (reuse-only, OPINION)

- Add a **devops-scoped memory collection** (new Dexie table or a tagged KV namespace) populated from devops ConversationCore turns + journal; read back into the system prompt via `resolveAgent` enrichment.
- Tag journal entries with `specializations` (`agent-profiles.ts:80`) — trivial change in `agent-journal-service.ts`.
- Bridge: when a Crystal of type "runbook"/"incident" is formed, index it for devops retrieval (reuse `crystalVault` + `lens-engine`).
- No new buses; reuse `AgentJournalService`, `AgentService` stats, Dexie KV.
