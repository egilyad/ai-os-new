# 03_SERVICES_AND_INTEGRATIONS — Agent → Services → Events → Storage → UI

> Map of how `agent-critic` flows through the system. All "behavior" is shared infra reuse.

## Service dependency map

```
agent-critic (topology node id 'agent-critic')
   │
   ├─ resolves identity via ─> AgentService.resolveAgent()          agent-service.ts:337
   │       └─ reads topology node config (incl. profile-injected
   │          provider/model/avatar/specializations)               topology-defaults.ts:96-106
   │
   ├─ executes via ─> orchestrator.execute() ─> LLM call           agent-service.ts:48-57
   │       └─ emits COGNITIVE_STEP_COMPLETED {nodeId:'agent-critic'}
   │                                                        orchestration-service.ts:414
   │
   ├─ consumed by stats ─> AgentService (COGNITIVE_STEP_COMPLETED)  agent-service.ts:184
   │       └─ persist Dexie KV super_agents_agent_stats             agent-service.ts:158-173
   │
   ├─ consumed by journal ─> AgentJournalService                   agent-journal-service.ts:150
   │       └─ persist KV agent_journal_v1                          agent-journal-service.ts:36
   │
   ├─ consumed by memory ─> MemoryEngine                          memory-engine.ts:181
   │       └─ memory stores (~16 stores)
   │
   ├─ consumed by cognitive trace ─> CognitiveService/TraceService cognitive-service.ts:229
   │
   ├─ consumed by health ─> AgentHealthMonitor                    agent-health-monitor.ts:66
   │
   ├─ in debate ─> DebateRuntime (persona-selector)               persona-selector.ts:251
   │       └─ emits debate:* events (NOT cognitive:*)
   │
   ├─ in conversation ─> ConversationOrchestrator/ChatExecutor    (resolveAgent path)
   │
   ├─ in invocation ─> InvocationEngineService ─> AgentResolverDirectory
   │              └─ InvocationExecutionDelegate                   phase21-invocation.ts:43-109
   │
   └─ in UI ─> AgentsPanel / DirectorPanel / RoomPanel / Forum AuthorBadge
```

## Assessment per subsystem (VERIFIED unless noted)

| Subsystem                        | Link to agent-critic                                            | Strength  | Evidence                                             |
| -------------------------------- | --------------------------------------------------------------- | --------- | ---------------------------------------------------- |
| **Agent → Debate**               | Manual participant; persona variant by topic+role, not identity | Weak      | `persona-selector.ts:251-290`                        |
| **Agent → Cognitive**            | Emits `COGNITIVE_STEP_COMPLETED` only in topology runs          | Partial   | `orchestration-service.ts:414`; no debate emit       |
| **Agent → Memory**               | Writes memory on topology-step completion                       | Partial   | `memory-engine.ts:181`                               |
| **Agent → Invocation**           | Resolvable + human-invokable via Room                           | Strong    | `phase21-invocation.ts:43-57`, `RoomPanel.tsx`       |
| **Agent → Research**             | Generic agent node; no critic-specific wire                     | POTENTIAL | INFERRED                                             |
| **Agent → Workflow/Builder**     | Generic node; no critic-specific                                | POTENTIAL | INFERRED                                             |
| **Agent → Knowledge/Crystal**    | Generic participant; no critic-specific                         | POTENTIAL | INFERRED                                             |
| **Agent → Forum**                | Author identity only                                            | Weak      | forum uses agentService identity                     |
| **Agent → Scheduler**            | No binding                                                      | Absent    | grep negative                                        |
| **Agent → ConversationCore**     | resolveAgent works; manual Director turn                        | Strong    | `agent-service.ts:337`                               |
| **Agent → Analytics/stats**      | getStats/getTopAgents                                           | Strong    | `agent-service.ts:288-304`                           |
| **Agent → UI card**              | AgentCard/AgentDetailPanel                                      | Strong    | `components/AgentsPanel/`                            |
| **Agent → Health/auto-recovery** | health monitor + auto-spawn                                     | Strong    | `agent-health-monitor.ts:66`, `agent-service.ts:614` |
| **Agent → Groups/teams**         | createGroup/executeGroup                                        | Strong    | `agent-service.ts:667-799`                           |

## Key reuse facts

- **No dedicated service.** Everything reuses `AgentService` (resolver + stats + lifecycle + groups) and the topology orchestrator. There is no `CriticService`.
- **Identity is canonical & single-source** (`agent-identity.ts:62-144`): all UIs resolve through `resolveAgentIdentity` → `agentService.resolveAgent` → topology node config.
- **Provider/model pinning is real but incidental** — it comes purely from `AGENT_PROFILES` being merged in `normalizeAgentIdentity`, not from any critic logic.
- **Debate path is the weakest integration**: the agent loses its cognitive trace, stats, journal, and memory contributions while debating, because debate does not emit `COGNITIVE_STEP_COMPLETED`.
