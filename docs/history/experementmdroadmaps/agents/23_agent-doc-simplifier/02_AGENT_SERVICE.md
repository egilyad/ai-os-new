---
title: AgentService Integration — agent-doc-simplifier
status: VERIFIED
agent_id: agent-doc-simplifier
---

# 02 — AGENT SERVICE: lifecycle, stats, groups, auto-spawn

## Registration (VERIFIED)

`AgentService` implements `IAgentResolver` (`agent-service.ts:71`). Registered in
`phase4-agents-roles.ts:86` (per shared context).

## Visibility via `getAgents()` (VERIFIED)

`getAgents()` (`agent-service.ts:306-329`) returns every topology node of type
`agent` or `router`. For `agent-doc-simplifier`:

- `id: 'agent-doc-simplifier'`
- `name`: node **label** = "Simplifier Agent" (`agent-service.ts:319`) — NOTE: this is
  the label, NOT the curated `displayName` "Maya Lindholm". The display name only
  appears via `resolveAgent`/`resolveAgentIdentity`.
- `role`: `config.roleName` = "Documentation Simplifier" (`agent-service.ts:320-323`)
- `status`: `paused` if node disabled, else lifecycle state (`agent-service.ts:324-326`)
- `stats`: from `getStats(id)` (`agent-service.ts:327`)

## Resolution (VERIFIED)

`resolveAgent('agent-doc-simplifier')` (`agent-service.ts:337-390`) → full
`ResolvedAgent` (see `01_IDENTITY.md`). Returns `null` if no topology or node
missing (`agent-service.ts:339-343`).

## Lifecycle (VERIFIED)

- `lifecycleStates` map (`agent-service.ts:77`); default `ready`
  (`agent-service.ts:589`).
- `toggleAgent`, `pauseAllAgents`, `resumeAllAgents`, `restartAgent`
  (`agent-service.ts:460-515`) emit `AGENT_LIFECYCLE_CHANGE` and call
  `orchestrator.setNodeDisabled`.
- Auto-spawn: `autoSpawnConfig` (`agent-service.ts:81-86`) + `evaluateAutoSpawn`
  (`agent-service.ts:614-665`) clones busy agents. No doc-simplifier-specific rule.

## Stats (VERIFIED)

`COGNITIVE_STEP_COMPLETED` listener (`agent-service.ts:184-210`) increments
`calls/tokens/latency/errors/estimatedCost` keyed by `nodeId`. So every execution
of `agent-doc-simplifier` accrues stats under its id (`agent-service.ts:195-207`).
`STREAM_END` feeds `provider:`/`key:` keys, not agent keys (`agent-service.ts:219-244`).
Persisted to KV `super_agents_agent_stats` (debounced 2s, `agent-service.ts:158-173`).

## Groups (VERIFIED)

`createGroup`/`executeGroup` (`agent-service.ts:667-762`) can include this agent
by id (parallel/sequential/consensus/pipeline/debate patterns). No seeded group
references it (grep: none). OPINION: a user could add it to a "Documentation"
group; nothing pre-built.

## Spawn/import (VERIFIED)

`spawnAgent` (`agent-service.ts:392-430`) creates nodes with `model:'auto'`;
`importAgents` sanitizes config keys (`agent-service.ts:531-575`). Neither is
pre-applied to doc-simplifier.
