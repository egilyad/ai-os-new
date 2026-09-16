# 03_AGENT_SERVICE — `AgentService` Integration

**Status:** VERIFIED. The service that owns doc-checker at runtime.

## Registration

`AgentService` (`src/kernel/services/agent-service.ts:71`, implements `IAgentResolver`) is registered in `src/kernel/service-registration/phase4-agents-roles.ts:86`. Exposed as a lazyService `agentService` (`src/kernel/instances/services-core.ts:60`). Phase: `phase4` (`ServiceRegistryPanel/service-phases.ts:104`).

## Methods touching doc-checker

- `getAgents()` (agent-service.ts:306-329): returns all `agent`/`router` nodes. For doc-checker it yields `{ id:'agent-doc-checker', name:'Consistency Checker', role:'Consistency Checker', status, stats }`. Status = `paused` if node disabled else `getLifecycleState` (agent-service.ts:324-326).
- `resolveAgent(id)` (agent-service.ts:337-390): returns the rich `ResolvedAgent` used by Conversation Core / Invocation / UI (see 01_IDENTITY).
- `getStats(id)` / `getAllStats()` / `getTopAgents(limit, sortBy)` (agent-service.ts:288-304): doc-checker accumulates stats keyed by `agent-doc-checker` when it executes (see 07_COGNITIVE_EVENTS).
- `toggleAgent` / `pauseAllAgents` (agent-service.ts:460-479): change node disabled state.
- `spawnAgent` / `updateAgent` / `deleteAgent` (agent-service.ts:392-458): lifecycle mutations; doc-checker is a static seed, not spawned dynamically.
- `getGroups()` / groups API: doc-checker is not auto-assigned to a group unless the user creates one (`AgentGroupsSection.tsx`).

## Stats persistence

- Stats stored in a KV store under `super_agents_agent_stats` (agent-service.ts:68), persisted on `beforeunload` (agent-service.ts:102-106) and after each `COGNITIVE_STEP_COMPLETED` (agent-service.ts:209).
- `MAX_AGENT_STATS = 500` (agent-service.ts:72) — trims oldest keys; doc-checker key is stable so it survives.

## Auto-spawn

`autoSpawnConfig` (agent-service.ts:81-86) + `evaluateAutoSpawn()` triggered on `AGENT_HEALTH_CHANGE` (agent-service.ts:252-254). Doc-checker is a fixed node; auto-spawn concerns clones, not it.

## Cognitive event consumption

`setupListeners()` (agent-service.ts:175-256) subscribes:

- `COGNITIVE_STEP_COMPLETED` (agent-service.ts:184-210): increments `calls/tokens/latency/errors/estimatedCost` for `d.nodeId`. **This is how doc-checker accrues stats** (see 07).
- `STREAM_END` (agent-service.ts:219-244): key/provider-level stats (H-52 prefixed keys), not agent-level.
- `AGENT_LIFECYCLE_CHANGE` / `AGENT_HEALTH_CHANGE` (agent-service.ts:249-254).

## Confidence

- All cited lines VERIFIED (read directly).
