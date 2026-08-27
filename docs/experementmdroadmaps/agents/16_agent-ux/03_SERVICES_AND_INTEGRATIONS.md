# 03_SERVICES_AND_INTEGRATIONS — Agent → Services → Events → Storage → UI

> Map for `agent-ux`. All shared infra; **[VERIFIED]** from source.

## Data-flow chart (text)

```
                         ┌─────────────────────────────┐
   Human / Router  ─────▶ │  Topology node `agent-ux`   │  (topology-defaults.ts:331-341)
                         │  config: prompt/temp/tools/ │
                         │  model=groq/llama-3.1-8b-   │
                         │  instant, avatar 🔍#06b6d4  │
                         └──────────────┬──────────────┘
                                        │ resolveAgent (agent-service.ts:337)
                                        ▼
        ┌───────────────────────────────────────────────────────────┐
        │  Execution path A: Chat/ConversationCore                   │
        │   ChatExecutor (chat-executor.ts:98) → CognitiveService    │
        │   .executeAgentNode (cognitive-service.ts:402) → adapter   │
        ├───────────────────────────────────────────────────────────┤
        │  Execution path B: Debate                                  │
        │   debate-agent-executor.ts:38 + PersonaSelector overlay    │
        ├───────────────────────────────────────────────────────────┤
        │  Execution path C: Director (ConversationCore scenario)    │
        │   conversation-director-service → orchestrator → engine    │
        ├───────────────────────────────────────────────────────────┤
        │  Execution path D: Invocation (RoomPanel human pick)        │
        │   phase21-invocation.ts:151 → delegate → C or B            │
        └───────────────────────────────────────────────────────────┘
                                        │
                  emits ──▶ EVENTS.COGNITIVE_STEP_ACTIVE / _COMPLETED
                  emits ──▶ EVENTS.STREAM_END (provider stats)
                  (debate path) emits ──▶ DEBATE_* events
                                        │
            ┌───────────────────────────────────────────────┐
            │ Consumers                                     │
            │  AgentService (stats)        agent-service.ts:184 │
            │  AgentJournalService         agent-journal-service.ts:130 │
            │  CognitiveService (traces)   cognitive-service.ts:199 │
            │  AgentHealthMonitor          phase4:123 │
            │  DirectorStore / InvocationStore (UI)  │
            └───────────────────────────────────────────────┘
                                        │
            Storage: Dexie KV `super_agents_agent_stats`, `agent_journal_v1`,
                     memory tables, trace store, cognitive traces
                                        │
            UI: AgentsPanel (AgentCard/AgentDetailPanel), DebateAnalytics,
                DashboardPanel/AgentLiveBoard, AgentComparisonPanel,
                ForumPanel/AuthorBadge, DirectorPanel/AgentIdentityChip,
                DebateRuntimePanel/AgentControlPanel, RoomPanel
```

## Per-system assessment (Agent → X)

| System                   | Relationship                                 | Evidence                                                 | Notes                                                              |
| ------------------------ | -------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------ |
| **Debate**               | Participant (optional)                       | `debate-agent-executor.ts:38-117`, `persona-selector.ts` | Generic persona; no UX variant. **[VERIFIED]**                     |
| **Cognitive stream**     | Emits step events; consumed for stats/traces | `cognitive-service.ts:199-259`                           | `COGNITIVE_DECISION_MADE` unused by agent. **[VERIFIED]**          |
| **Memory**               | Generic write/read                           | `memory-engine.ts:52`                                    | No UX-scoped store. **[INFERRED]**                                 |
| **Invocation**           | Human-invoked via AgentResolverDirectory     | `phase21-invocation.ts:43-58,151`                        | Source-gated policy; any registered agent. **[VERIFIED]**          |
| **Research/Knowledge**   | Generic participation (identity)             | knowledge-generator-service (generic)                    | No bespoke UX role. **[INFERRED]**                                 |
| **Workflow**             | Generic (builder-agent compiles flows)       | builder-agent-service                                    | Agent can be a workflow node; no UX specialization. **[INFERRED]** |
| **Knowledge/Crystal**    | Generic identity in AuthorBadge/bridges      | crystal-vault, forum (generic)                           | **[INFERRED]**                                                     |
| **Forum**                | Agent-provenance posts                       | forum-service                                            | **[VERIFIED]** generic.                                            |
| **Scheduler**            | Time-based schedules; NOT role-aware         | `scheduler-service.ts:47`                                | Agent-ux never targeted by role. **[VERIFIED]**                    |
| **ConversationCore**     | Scenario `participantId`                     | `conversation-orchestrator.ts:55`                        | **[VERIFIED]**                                                     |
| **Analytics/Stats**      | calls/tokens/latency/errors/cost             | `agent-service.ts:15-23,184-210`                         | **[VERIFIED]**                                                     |
| **UI card**              | AgentCard shows name/role/specs/avatar/stats | `AgentCard.tsx:17-175`                                   | **[VERIFIED]**                                                     |
| **Health/auto-recovery** | Monitored generically                        | `agent-health-monitor` `phase4:123`                      | **[VERIFIED]**                                                     |
| **Groups/teams**         | Can be grouped                               | `agent-service.ts:667-799`                               | **[VERIFIED]**                                                     |

## Reuse assessment

Everything `agent-ux` touches **reuses existing services** — there is zero agent-specific code. This is the correct architecture (per AGENTS.md dependency rule), but it means `agent-ux` currently differentiates **only by prompt + model + avatar**. Adding real UX capability = either (a) a UX lens + UX tool, or (b) a UX persona variant + UX memory namespace — both reuse existing extension points. No new bus/adapter needed.

**[VERIFIED]** all wiring. **[OPINION]** the lack of differentiation is the central finding.
