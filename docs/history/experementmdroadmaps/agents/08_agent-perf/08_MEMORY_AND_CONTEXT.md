# 08_MEMORY_AND_CONTEXT — Memory available to / saved by `agent-perf`

## What exists `[VERIFIED]`

- **Agent Journal** (`agent-journal-service.ts`): a per-agent (`agentId`) append-only log in Dexie KV `agent_journal_v1` (`:36`). Records:
  - `COGNITIVE_STEP_ACTIVE` → in-progress entry (`:130`)
  - `COGNITIVE_STEP_COMPLETED` → success/failure entry (`:150`)
  - `debate:runtime:agent:error` → failure entry (`:174`)
  - Exposes `listByAgent(agent-perf)`, `getAgentStats(agent-perf)` (`:253`, `:299`).
- **~16 generic memory stores** (AGENTS.md): shared infrastructure, **not** agent-keyed. `agent-perf` has no dedicated store. `[INFERRED]`
- **Stats KV** (`super_agents_agent_stats`, `agent-service.ts:68`): agent-level counters keyed by nodeId — `agent-perf` included when it emits `COGNITIVE_STEP_COMPLETED`.
- **Groups KV** (`super_agents_agent_groups`, `agent-service.ts:69`).

## What is actually saved / read for `agent-perf` `[VERIFIED]` + `[INFERRED]`

| Source                         | Saved for agent-perf?                              | Read/visible?      |
| ------------------------------ | -------------------------------------------------- | ------------------ |
| Journal — ConversationCore run | ✅ (cognitive_step)                                | ✅ AgentHistoryTab |
| Journal — Debate run           | ⚠️ **only on error** (no COGNITIVE_STEP in debate) | ⚠️ partial         |
| Stats — ConversationCore       | ✅                                                 | ✅ AgentCard       |
| Stats — Debate                 | ❌ (no nodeId event)                               | ❌ (card shows 0)  |
| Generic memory stores          | ❌ (not agent-scoped)                              | n/a                |

## Continuity gaps `[OPINION]`

1. **Debate amnesia** — the single biggest continuity hole: `agent-perf` participates in a perf debate but leaves **no journal/stats trace** unless it errors. Fix = emit `COGNITIVE_STEP_COMPLETED` in `debate-agent-executor.ts` (see `07_COGNITIVE_ROLE.md`).
2. **No perf-specific memory** — there is no store capturing "Leon's prior bottleneck findings" across sessions. The journal is task-granular and capped (`MAX_ENTRIES=1000`, `agent-journal-service.ts:37`); long-term perf knowledge is not distilled.
3. **No lens-derived memory** — with `lensIds:[]`, no lens summarizes/recalls `agent-perf`'s reasoning.

## Continuity improvements (reuse existing infra) `[OPINION]`

- After a perf debate/conversation, auto-propose a **Crystal** from `agent-perf`'s output (the existing `crystal-debate-bridge` pattern, AGENTS.md Module 2) — turns ephemeral perf reasoning into durable knowledge.
- Add a lightweight "perf notes" tag to journal entries when `agent-perf` is the actor, so `listByTag('performance')` becomes a continuity view (no schema change — `tags` already exist on `JournalEntry`, `agent-journal-service.ts:17`).
- Persist `agent-perf`'s last N optimization plans in the existing journal rather than a new store.
