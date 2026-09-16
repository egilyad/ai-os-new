# 03_AGENT_SERVICE — `agent-doc-historian`

How `AgentService` (`src/kernel/services/agent-service.ts`) manages the historian node.

## VERIFIED

- `AgentService implements IAgentResolver` (`:71`). Registered in `phase4-agents-roles.ts:86-97` as `'agentService'`, constructed with `database`, `eventBus`, `pricingService`, and a lazy `orchestrator` getter (`:91-93`). `void svc.init()` runs on first resolution.
- `getAgents()` (`:306-329`) returns all `type: 'agent' | 'router'` nodes from the active topology, mapping each to `{ id, name (node.label 'Historian Agent'), role, status, stats }`. For the historian, `role` = `config.roleName` (`'Documentation Historian'`) (`:320-323`); `status` = paused if `isNodeDisabled` else lifecycle state (`:324-326`); `stats` = `getStats(id)`.
- `resolveAgent(id)` (`:337-390`) resolves the node; returns `systemPrompt` from topology `config.prompt` (`:346-350`), `model` `undefined` when `'auto'` (`:352-353`), and `specializations` from node `config.specializations` (absent → `[]`, `:385`).
- Stats: `AgentStats` = `{ calls, tokens, latency, errors, avgTokensPerCall, lastActive, estimatedCost }` (`:15-23`). Persisted to KV `super_agents_agent_stats` (`:68`, `:158-173` debounced 2s). Capped at `MAX_AGENT_STATS = 500` (`:72`, `:258-264`).
- Lifecycle: `lifecycleStates` Map (`:77`); states `initializing|ready|busy|idle|paused|terminated`. `toggleAgent` (`:460-469`), `pauseAllAgents`/`resumeAllAgents` (`:471-491`), `restartAgent` (`:493-515`), `getLifecycleState` (`:588-590`).
- Groups: `createGroup`/`executeGroup` (`:667-799`) — historian can be a member of an `AgentGroup` with execution patterns `parallel|sequential|consensus|pipeline|debate` (`:25`). No seeded groups reference the historian (INFERRED: groups are user-created at runtime).
- Auto-spawn: `autoSpawnConfig.enabled=true, maxAgents:10` (`:81-86`). `evaluateAutoSpawn` (`:614-665`) clones busy agents when all 25 are busy; historian could be auto-cloned. Clone ids tracked in `autoCloneIds` (`:87`).

## INFERRED

- The historian accrues `AgentStats` only when it actually executes a step that emits `COGNITIVE_STEP_COMPLETED` (see 08_COGNITIVE_EVENTS). As a workforce node it only runs when the router or a group/invocation selects it.
- `spawnAgent`/`deleteAgent`/`updateAgent` (`:392-458`) operate on the topology; the historian can be toggled/paused/restarted like any node.

## OPINION

- Stats are keyed by node id; if the topology is swapped (a different active topology without `agent-doc-historian`), its historical stats remain in KV but `getAgents()` returns `[]` and stats are orphaned (capped out at 500 eventually).
