# 03_SERVICES_AND_INTEGRATIONS — `agent-lead` → Services → Events → Storage → UI

> Reuse existing seams. Tags: VERIFIED / INFERRED / OPINION.

## Service map (VERIFIED)

```
                         ┌─────────────────────────────────────────────┐
   topology-defaults.ts  │  AuditorTopology node 'agent-lead'          │
   (:369) + AGENT_PROFILES│  prompt / avatar / provider / model / specs │
   (:202)                └───────────────┬─────────────────────────────┘
                                         │ mounted → orchestrator
                                         ▼
   ┌──────────────────────────────────────────────────────────────────┐
   │  AgentService (IAgentResolver)  agent-service.ts:71                │
   │   getAgents() :306  resolveAgent() :337  stats :184  groups :667   │
   │   lifecycle :588  journal-subscribe :175                          │
   └───┬───────────┬───────────────┬───────────────┬───────────────────┘
       │           │               │               │
       ▼           ▼               ▼               ▼
  Debate        Conversation    Invocation       Cognitive/Memory
  runtime        Core/Director   Engine          stream
```

## Event flow (VERIFIED)

| Layer          | Emits / Consumes | Event                                                                             | Source                             |
| -------------- | ---------------- | --------------------------------------------------------------------------------- | ---------------------------------- |
| Execution      | emits            | `COGNITIVE_STEP_COMPLETED` (nodeId=agent-lead)                                    | `orchestration-service.ts:414`     |
| AgentService   | consumes         | `COGNITIVE_STEP_COMPLETED` → stats                                                | `agent-service.ts:184`             |
| AgentService   | consumes         | `COGNITIVE_STEP_COMPLETED`(key) → provider stats                                  | `agent-service.ts:219`             |
| AgentService   | consumes         | `AGENT_LIFECYCLE_CHANGE`, `AGENT_HEALTH_CHANGE`                                   | `agent-service.ts:245-254`         |
| AgentJournal   | consumes         | `COGNITIVE_STEP_ACTIVE`, `COGNITIVE_STEP_COMPLETED`, `debate:runtime:agent:error` | `agent-journal-service.ts:130-190` |
| Memory engine  | consumes         | `COGNITIVE_STEP_COMPLETED`                                                        | `memory-engine.ts:181`             |
| Health monitor | consumes         | `COGNITIVE_STEP_COMPLETED`                                                        | `agent-health-monitor.ts:66`       |
| Policy svc     | consumes         | `COGNITIVE_STEP_COMPLETED`                                                        | `policy-service.ts:275`            |
| Metrics svc    | consumes         | `COGNITIVE_STEP_COMPLETED`                                                        | `metrics-service.ts:187`           |
| Trace svc      | consumes         | `COGNITIVE_STEP_COMPLETED`                                                        | `trace-service.ts:200`             |
| Advisor svc    | consumes         | `COGNITIVE_STEP_COMPLETED`                                                        | `advisor-service.ts:119`           |
| Snapshot svc   | consumes         | `COGNITIVE_STEP_COMPLETED` (throttled)                                            | `snapshot-service.ts:114`          |
| Cognitive svc  | consumes         | `COGNITIVE_STEP_COMPLETED`                                                        | `cognitive-service.ts:229`         |

## Debate integration (VERIFIED)

- `debate-agent-executor.ts:45` `findParticipant(sessionId, request.nodeId)` → looks up participant by node id. agent-lead is a participant if added to the debate.
- `persona-selector.ts:251` assigns a persona by **topic keywords** (not by agent). agent-lead can receive `diplomat` (consensus/negotiation keywords) or `strategist` etc.
- `debate-meta-agent-controller.ts:21` can assign `synthesizer` tactical role based on graph centrality — a natural fit for a lead, but identity-blind.

## ConversationCore / Director integration (VERIFIED)

- `conversation-orchestrator.ts` drives turns; the execution engine calls `agentService.resolveAgent(participantId)` (`agent-service.ts:337` comment `:331-336`) so agent-lead voices its turn with its identity.
- `ChatExecutor` uses resolved `systemPrompt`/`model`. For agent-lead this is the team-lead prompt + nvidia model.

## Invocation integration (VERIFIED)

- `phase21-invocation.ts:44 AgentResolverDirectory` wraps `agentService.getAgents()`/`resolveAgent`, exposing `specializations` to RoomPanel picker.
- `phase21-invocation.ts:61 InvocationExecutionDelegate` hands chat/director-scenario to `ConversationDirectorService`, debate to `DebateSyncManager`. agent-lead reaches execution only if human-selected.

## Storage touched (VERIFIED)

| Store                                       | Keyed by                      | Source                        |
| ------------------------------------------- | ----------------------------- | ----------------------------- |
| Agent stats KV `super_agents_agent_stats`   | nodeId + `key:*`/`provider:*` | `agent-service.ts:68,158`     |
| Agent groups KV `super_agents_agent_groups` | group id                      | `agent-service.ts:69,167`     |
| Agent journal `agent_journal_v1`            | entry id (agentId field)      | `agent-journal-service.ts:36` |
| Memory stores (~16)                         | generic agent memory          | `memory-engine.ts:181`        |
| Dexie (invocations, scenarios, debates…)    | via subsystems                | AGENTS.md                     |

## UI surfaces (VERIFIED — per AGENTS.md + file presence)

AgentsPanel (card/detail/editor/wizard/avatar), DebateAnalytics, DashboardPanel/AgentLiveBoard, AgentComparisonPanel, ForumPanel/AuthorBadge, DirectorPanel/AgentIdentityChip, DebateRuntimePanel/AgentControlPanel, RoomPanel.

## Other agents (VERIFIED)

- Same execution path as all 24 peers — shared infra, no lead privilege.
- Management audit siblings: `agent-pm`, `agent-po` (`prompt-audit-service.ts:18-20`).

## OPINION

The integration graph is healthy and additive: agent-lead rides every existing bus. The missing link is **semantic** — no service treats agent-lead specially. A coordinator capability would slot in at the `AgentResolverDirectory` / `MetaAgentController` / `executeGroup` seams without new storage or buses.
