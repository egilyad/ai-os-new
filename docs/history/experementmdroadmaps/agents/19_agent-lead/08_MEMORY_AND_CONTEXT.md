# 08_MEMORY_AND_CONTEXT — Memory available to / saved for `agent-lead`

> Tags VERIFIED / INFERRED / OPINION.

## What is saved (VERIFIED)

- **Per-step memory.** `memory-engine.ts:181` subscribes to `COGNITIVE_STEP_COMPLETED`; for nodeId=`agent-lead` it stores a memory entry (generic, ~16 memory stores per AGENTS.md). Same path as every agent.
- **Agent journal.** `agent-journal-service.ts` persists `agent_journal_v1` entries keyed by `agentId` (`agent-journal-service.ts:36,253 listByAgent`). Covers `cognitive_step` (from `COGNITIVE_STEP_ACTIVE`/`COMPLETED`) and `debate` (from `debate:runtime:agent:error`, `:174-190`).
- **Stats continuity.** `agent-service.ts:133-145` loads `super_agents_agent_stats` from KV on init; agent-lead's call/token/latency/error/cost history survives reload.
- **Groups.** `super_agents_agent_groups` KV persists any group agent-lead belongs to (`agent-service.ts:147-154`).

## What is read back (VERIFIED / INFERRED)

- **Memory stores** are readable by memory APIs (~16 stores) — available to agent-lead like any agent, but there is **no lead-specific memory query** (no "what did the team decide" aggregation keyed to agent-lead).
- **Journal** is surfaced in `AgentHistoryTab` (`AgentHistoryTab.tsx`) — generic per-agent list.
- **No cross-agent synthesis memory.** agent-lead cannot query "memories of all agents I coordinated" — memory is keyed per nodeId, not per coordinator.

## Continuity improvements (OPINION / INFERRED)

1. **Coordination memory scope.** When agent-lead acts as coordinator (04/05), tag its memories with `metadata.coordinatorSession` so it can later answer "what did I unblock last sprint". Reuses the existing memory store + one metadata field — no new table.
2. **Mentoring memory.** Capture agent-lead ↔ other-agent interactions (handoffs, `taskHandoffService`) into a "mentoring" memory bucket keyed by mentor=`agent-lead`, mentee=`otherId`. `AgentHandoffsTab.tsx:7` already reads handoffs per agent.
3. **Stale-profile guard.** Stats trim at 500 entries (`agent-service.ts:72`); if agent-lead is heavily used as coordinator, its history may age out. Bump or add a pinned retention for lead. Low priority.

## Risk / Dependencies

- All improvements are metadata-only on existing stores. No schema change. Verify memory-engine accepts arbitrary `metadata` (it does, per `COGNITIVE_STEP_COMPLETED` payload `metadata?: record`, `event-registry.ts:760`).
