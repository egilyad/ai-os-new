# 03_SERVICES_AND_INTEGRATIONS — `agent-data` Integration Map

> All arrows are VERIFIED from source. `agent-data` adds **no** bespoke service; it is a payload consumed by shared services.

## Flow: Agent node → Services → Events → Storage → UI → Other agents

```
topology-defaults.ts (normalizeAgentIdentity, :91-119)
   └─ injects profile → node.config {provider:groq, model:llama-3.3-70b-versatile,
        specializations:[ML,Statistics,Forecasting], avatar:🔬#14b8a6, lensIds:[]}
              │
              ▼
AgentService (agent-service.ts:71, IAgentResolver)  [registered phase4-agents-roles.ts:86]
   ├─ getAgents()           → AgentsPanel list, RoomPanel picker, Invocation directory
   ├─ resolveAgent(id)      → DirectorService, ConversationOrchestrator, debate-api, identity resolver
   ├─ stats (KV Dexie)     → AgentStatsDashboard, EloLeaderboard
   ├─ groups/lifecycle      → AgentGroupsSection, AgentObservabilityTab
   └─ autoSpawn/clone       → generic clone of node config
              │
   ┌──────────┼───────────────────────────────────────────────┐
   ▼          ▼                                                ▼
Debate      ConversationCore/                         Invocation Engine
(debate-api.ts:308-320,  DirectorService              (phase21-invocation.ts)
 provider+model pass)  (resolveAgent)                 ├ AgentResolverDirectory(agentService)
   │                  │                                    └ InvocationExecutionDelegate
   │ emits DEBATE_*   │ emits conversation:*                └→ debate / conversation
   ▼                  ▼
EventBus ◀──────── EventBus ◀──────────────────────── EventBus
   │
   ├─ COGNITIVE_STEP_COMPLETED → AgentService.stats(:184), memory-engine(:181),
   │                             agent-journal(:150), agent-health-monitor(:66),
   │                             metrics-service(:187), advisor-service(:119), policy-service(:275),
   │                             snapshot-service(:114), trace-service(:200), cognitive-service(:229)
   ├─ STREAM_END → AgentService provider/key stats (:219)
   └─ COGNITIVE_TRACE_UPDATED / COGNITIVE_DECISION_MADE (latter: no consumer = DEAD)
              │
              ▼
Storage: Dexie KV (agent stats, groups), AgentJournal DB, Memory stores (7 typed),
         Debate/Crystal/Forum/Invocation tables
              │
              ▼
UI: AgentsPanel(AgentCard/Detail/Stats/Observability/Comparison/Groups),
    DebateRuntimePanel, DirectorPanel chip, DashboardPanel/AgentLiveBoard,
    ForumPanel/AuthorBadge, RoomPanel, AgentJournalPanel
              │
              ▼
Other agents: same shared services; no agent-to-agent code for agent-data specifically.
```

## Assessment per subsystem (VERIFIED)

| Subsystem               | Relationship to agent-data                                                                  | Verdict                                   |
| ----------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------- |
| **Debate**              | Participant; model/provider honored (`debate-api.ts:315-319`); persona topic-based          | ✅ Used, model pinned                     |
| **Cognitive stream**    | Stats/journal/health all via `COGNITIVE_STEP_COMPLETED` by nodeId                           | ✅ Used generically                       |
| **Memory**              | `memory-engine.ts:181` stores on `COGNITIVE_STEP_COMPLETED`; 7 typed stores                 | ✅ Used generically, no agent-aware query |
| **Invocation**          | Directory over `agentService`; expertise match on specializations (`:167-173`)              | ✅ Used, UI-hidden match                  |
| **Research**            | No research module in `src/kernel` (only `DebateSystemResearch.tsx` UI)                     | ❌ N/A                                    |
| **Workflow / Builder**  | User-defined flows; no auto-bind to agent-data                                              | ⚠️ Generic                                |
| **Knowledge / Crystal** | Knowledge Gen uses lenses (`knowledge-generator-service.ts:259 lensPool`); no agent binding | ⚠️ Generic                                |
| **Forum**               | Identity only via `AuthorBadge`/`resolveAgentIdentity`                                      | ✅ Used generically                       |
| **Scheduler**           | Scheduler infra exists; no agent-data schedule                                              | ⚠️ Generic/UI-hidden                      |
| **ConversationCore**    | `resolveAgent('agent-data')` valid participant                                              | ✅ Used                                   |

## Reuse posture (OPINION)

`agent-data` is the _ideal_ test bed for agent-aware features precisely because all plumbing already exists:

- Invocation expertise match → already keys on specializations.
- Memory stores → already keyed-able by `agentId` (schema supports `agentId`/`tags`).
- Cognitive events → already fire per nodeId.
  No new service is needed to make `agent-data` "smarter" — only thinner glue that routes existing signals to agent-specific UX.
