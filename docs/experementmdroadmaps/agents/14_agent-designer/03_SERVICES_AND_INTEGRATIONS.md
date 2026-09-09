# 03_SERVICES_AND_INTEGRATIONS — Agent → Services → Events → Storage → UI

> Map of how `agent-designer` flows through the system. All edges are SHARED (not designer-specific).
> VERIFIED unless noted INFERRED.

## Dependency chain (reuse existing)

```
agent-designer (ISNode, topology-defaults.ts:307)
   │
   ├─ AGENT PROFILES merged at build → normalizeAgentIdentity (topology-defaults.ts:91)
   │
   ├─ AgentService (agent-service.ts:71, IAgentResolver)
   │     ├─ getAgents()            :306   → AgentsPanel list
   │     ├─ resolveAgent(id)       :337   → debate / ConversationCore / Director / Invocation
   │     ├─ getStats / lifecycle   :288/:588 → AgentStatsDashboard, AgentCard
   │     └─ groups / autoSpawn     :667/:614 → AgentGroupsSection
   │
   ├─ Debate runtime
   │     ├─ persona-selector.ts:251  (generic variants, NO design variant)
   │     ├─ debate-agent-executor.ts:38  (calls LLM with node prompt)
   │     └─ debate-sync-manager → DebateSyncManager (participant registration)
   │
   ├─ ConversationCore
   │     ├─ conversation-backed-debate-orchestrator + ConversationOrchestrator
   │     ├─ ChatExecutor (uses resolveAgent model/provider)
   │     └─ ConversationDirectorService → HybridPolicy → Orchestrator
   │
   ├─ Invocation Engine
   │     ├─ AgentResolverDirectory (phase21-invocation.ts:44) wraps agentService
   │     ├─ InvocationExecutionDelegate (:61) → ConversationCore or Debate
   │     └─ DEFAULT_ROOM_POLICY (human-mention, :125)
   │
   ├─ Memory
   │     └─ AgentJournalService (agent-journal-service.ts:96) subscribes COGNITIVE_STEP_*
   │
   ├─ Cognitive stream
   │     ├─ COGNITIVE_STEP_ACTIVE / COMPLETED (event-registry.ts:755/763)
   │     └─ COGNITIVE_DECISION_MADE (:776) — DEAD at consumer
   │
   └─ UI
         AgentCard / AgentDetailPanel / AgentIdentityEditor / AgentWizard
         DebateAnalytics / AgentLiveBoard / AgentComparison / Forum AuthorBadge
         Director AgentIdentityChip / DebateRuntime AgentControlPanel
```

## Assessment per integration axis

| Axis                      | Assessment                                                    | Evidence                                             |
| ------------------------- | ------------------------------------------------------------- | ---------------------------------------------------- |
| Agent → Debate            | **Works, generic.** Persona = node prompt + generic variant.  | `debate-agent-executor.ts:45`, `persona-selector.ts` |
| Agent → Cognitive         | **Works, generic.** Stats only; decision event dead.          | `agent-service.ts:184`, AGENTS.md                    |
| Agent → Memory            | **Works, generic.** Journal by nodeId, name-not-friendly bug. | `agent-journal-service.ts:130-172`                   |
| Agent → Invocation        | **Works, human-only.** No design policy.                      | `phase21-invocation.ts:43,125`                       |
| Agent → Research          | **N/A.** No binding.                                          | (grep: no reference)                                 |
| Agent → Workflow          | **Works, generic.** Builder uses agents as nodes.             | builder-agent-service                                |
| Agent → Knowledge/Crystal | **N/A.** No design binding.                                   | (grep: no reference)                                 |
| Agent → Forum             | **Works, generic.** Author badge only.                        | ForumPanel                                           |
| Agent → Scheduler         | **N/A.** No scheduler subsystem.                              | —                                                    |
| Agent → ConversationCore  | **Works.** resolveAgent → ChatExecutor.                       | `agent-service.ts:337`                               |

## Storage touched (generic)

- `agent_journal_v1` KV (journal) — `agent-journal-service.ts:36`
- `super_agents_agent_stats` / `super_agents_agent_groups` KV — `agent-service.ts:68-69`
- `conversations` / `debateSessions` / `scenario` tables when invoked via those paths
- `invocations` / `invocationPolicies` (v20) when invoked via Room — `phase21-invocation.ts`

## Other agents it interacts with

Only via **graph topology** (`router → designer → aggregator`) and **debate/scenario co-participation**
(generic). No designer-specific peer contracts. INFERRED: in practice it co-debates with the
Creative cluster (`agent-creative`, `agent-content`, `agent-ux`) when a design topic is routed.
