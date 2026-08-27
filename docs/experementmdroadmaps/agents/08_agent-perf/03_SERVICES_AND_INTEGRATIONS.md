# 03_SERVICES_AND_INTEGRATIONS — Agent → Services → Events → Storage → UI

Map of how `agent-perf` flows through the system. All shared infra; nothing agent-perf-specific. `[VERIFIED]` unless noted.

```
                         ┌─────────────────────────────────────────────┐
                         │  topology-defaults.ts (node + edges)        │
                         │  agent-profiles.ts (identity)               │
                         └───────────────────┬─────────────────────────┘
                                             │ mounts topology
                                             ▼
   INVOKE ────┬───────────────────  AgentService (IAgentResolver) ── resolveAgent/getAgents
              │                    agent-service.ts:71,306,337
              │                    • lifecycle, groups, autoSpawn, stats
              ├── Debate ──────────► debate-runtime/persona-selector.ts (generic persona)
              │                    debate-agent-executor.ts (generic executor)
              │                    emits: DEBATE_* (NO cognitive events)  [VERIFIED: grep 0 hits]
              │
              ├── ConversationCore/Director ─► ConversationOrchestrator → ChatExecutor
              │                    emits: COGNITIVE_STEP_COMPLETED(nodeId) [INFERRED writer]
              │
              ├── Invocation(Room) ─► phase21-invocation.ts AgentResolverDirectory
              │                    → InvocationExecutionDelegate → Director/Debate
              │
              └── Groups/autoSpawn ─► agent-service.ts executeGroup/evaluateAutoSpawn

   EVENTS ───┬─ COGNITIVE_STEP_COMPLETED ─► AgentService.stats (agent-perf)  [agent-service.ts:184]
             │                            └─ AgentJournalService.record       [agent-journal-service.ts:150]
             ├─ STREAM_END (provider keyed) ─► AgentService.stats (provider:*) [agent-service.ts:219]
             ├─ AGENT_LIFECYCLE_CHANGE ─────► AgentService.lifecycleStates   [agent-service.ts:249]
             ├─ AGENT_HEALTH_CHANGE ───────► evaluateAutoSpawn               [agent-service.ts:252]
             └─ DEBATE_* ──────────────────► (no agent-perf stats)

   STORAGE ──┬─ Dexie KV `super_agents_agent_stats`  [agent-service.ts:68]
             ├─ Dexie KV `super_agents_agent_groups` [agent-service.ts:69]
             ├─ Dexie KV `agent_journal_v1`          [agent-journal-service.ts:36]
             └─ ~16 generic memory stores            [INFERRED]

   UI ───────┬─ AgentsPanel (card/detail/stats/observability/history/leaderboard)
             ├─ DebateRuntimePanel/AgentControlPanel
             ├─ DirectorPanel/AgentIdentityChip
             ├─ ForumPanel/AuthorBadge, DashboardPanel/AgentLiveBoard
             └─ RoomPanel (human invoke)

   OTHER AGENTS ── shares groq/llama-3.3-70b with agent-network, agent-architect,
                  agent-data, agent-designer, agent-po  [agent-profiles.ts]
```

## Assessment per subsystem

| Subsystem              | Link strength | Notes                                                               | Evidence                                          |
| ---------------------- | ------------- | ------------------------------------------------------------------- | ------------------------------------------------- |
| → Debate               | **Weak**      | Generic executor; no perf persona; **no agent-level stats/journal** | `debate-agent-executor.ts`; grep 0 cognitive hits |
| → Cognitive stream     | **Partial**   | Only via ConversationCore; debate path silent                       | `agent-service.ts:184` vs debate                  |
| → Memory               | **Partial**   | Journal + generic stores; debate errors only                        | `agent-journal-service.ts`                        |
| → Invocation           | **Strong**    | Resolvable + invokable via Room                                     | `phase21-invocation.ts:43-58`                     |
| → Research             | **None auto** | No wiring                                                           | —                                                 |
| → Workflow/Builder     | **None auto** | Eligible only if user adds                                          | BuilderPanel                                      |
| → Knowledge/Crystal    | **None auto** | No linkage                                                          | —                                                 |
| → Forum                | **Passive**   | Can author posts (AuthorBadge)                                      | `ForumPanel/AuthorBadge`                          |
| → Scheduler            | **None**      | No schedule exists                                                  | —                                                 |
| → ConversationCore     | **Strong**    | Full participant via resolveAgent                                   | `agent-service.ts:337`                            |
| → Analytics/stats      | **Partial**   | Debate invisible (see above)                                        | `agent-service.ts`                                |
| → UI card              | **Strong**    | Full card + specializations                                         | `AgentCard.tsx:23,68-78`                          |
| → Health/auto-recovery | **Generic**   | No special handling                                                 | `agent-health-monitor.ts`                         |
| → Groups/teams         | **Generic**   | User-created only                                                   | `agent-service.ts:667`                            |

## Reuse opportunity

Every integration already exists and is generic — the only "missing" links are (a) the debate→cognitive-event gap (a 1-line emit would fix stats/journal for debates) and (b) no performance-specific lens/tooling. No new bus/adapter needed. `[OPINION]`
