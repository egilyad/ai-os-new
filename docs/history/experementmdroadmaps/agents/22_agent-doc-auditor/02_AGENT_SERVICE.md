# 02_AGENT_SERVICE — `agent-doc-auditor` in `AgentService`

**VERIFIED.** `AgentService` (`src/kernel/services/agent-service.ts:71`) is the `IAgentResolver` implementation. Doc-auditor is _one row_ in the topology-backed agent registry; it receives no special casing.

## Registration

- Registered in `phase4-agents-roles.ts:86` (`register('agentService', ...)`).
- Exposed as `agentService = lazyService<AgentService>('agentService')` (`instances/services-core.ts:60`).

## How doc-auditor is surfaced

- **`getAgents()`** (`agent-service.ts:306-329`): iterates `topology.nodes` filtered to `type === 'agent' || 'router'`. For doc-auditor it yields `{ id:'agent-doc-auditor', name:'Auditor Agent', role:'Documentation Auditor', status:<lifecycle>, stats:<AgentStats> }`. This is what the AgentsPanel and RoomPanel consume.
- **`resolveAgent(id)`** (`agent-service.ts:337-390`): the canonical resolver (see `00_PROFILE.md`, `03_AGENT_IDENTITY.md`). Doc-auditor's resolved `model`/`provider` come from the normalized profile, not the raw `'auto'` node.
- **`getStats(id)`** / `getAllStats` (`agent-service.ts:292`): per-agent `AgentStats` (`calls, tokens, latency, errors, avgTokensPerCall, lastActive, estimatedCost`). Doc-auditor accrues stats like any other agent.
- **`getTopAgents`** (`agent-service.ts:296-304`): ranks by calls/tokens/latency — doc-auditor appears in leaderboards when active.
- **Lifecycle** (`lifecycleStates` map, `transitionLifecycle`): doc-auditor has states `initializing|active|paused|...`; `getLifecycleState` / `isNodeDisabled` drive the `status` field. AgentsPanel can `pauseAgent`/`resumeAgent`/`restartAgent` it.
- **Groups** (`AgentGroup`, `:27-35`) and **autoSpawn** (`autoSpawnConfig`, `:81-86`): doc-auditor can be added to named groups and is eligible for auto-spawn evaluation (`evaluateAutoSpawn`) — no doc-auditor-specific logic.

## Cognitive stats hook

- `setupListeners()` subscribes `COGNITIVE_STEP_COMPLETED` (`agent-service.ts:184`) to increment per-agent stats (calls/tokens/latency/errors). Doc-auditor's stats are updated through this shared path (see `08_COGNITIVE.md`).

## Other shared consumers of `agentService` that touch doc-auditor

- `agent-identity.ts` (`resolveAgentIdentity`) — `src/kernel/services/agent-identity.ts:62,82`.
- `conversation-execution-engine.ts` / `ChatExecutionEngine` (`agentResolver?.resolveAgent`) — `src/kernel/services/conversation-execution-engine.ts:40`.
- `phase20-director.ts:36` passes `agentService` (as `IAgentResolver`) into `ConversationDirectorService`.
- `phase21-invocation.ts:152` wraps `agentService` in `AgentResolverDirectory`.
- `role-service.ts:578` `getAgentsByRole`, `agent-health-monitor.ts:177-183` auto-recovery, `admin-service.ts:317/441/503`, `topology-manager.ts`, `workforce-federation.ts`, `agent-diversity/diversity-scorer.ts`, `prompt-audit-service.ts:95` (audits all agent prompts incl. doc-auditor's).

## OPINION

Doc-auditor is a first-class, fully managed agent: it is pauseable, restartable, stats-tracked, journaled, and diversity/prompt-audited exactly like the other 24. There is no "documentation auditor" subsystem in `AgentService` — it is purely data.
