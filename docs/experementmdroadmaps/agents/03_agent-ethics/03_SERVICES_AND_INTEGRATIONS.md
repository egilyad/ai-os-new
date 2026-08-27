# 03 — SERVICES & INTEGRATIONS map: `agent-ethics`

```
                         ┌─────────────────────────────────────────┐
   HUMAN / SYSTEM  ───▶  │  Topology (default)  agent-ethics node  │
                         │  prompt + temp 0.2 + model nvidia/llama  │
                         └───────────────┬─────────────────────────┘
                                         │ resolveAgent(id)
                                         ▼
                         ┌─────────────────────────────────────────┐
                         │  AgentService (IAgentResolver)           │
                         │  - getAgents / resolveAgent / stats      │
                         │  - lifecycle / groups / autoSpawn        │
                         └───┬───────────┬───────────┬─────────────┘
              uses identity  │           │           │ emits
              ┌─────────────▼──┐   ┌─────▼──────┐ ┌──▼───────────────┐
              │AgentIdentity   │   │AgentJournal│ │ EventBus         │
              │ (avatar 🛡️)    │   │Service     │ │ COGNITIVE_*      │
              └────────────────┘   └─────┬──────┘ └──┬───────────────┘
                                         │           │
   INVOCATION ENGINE                     │           ├─▶ DirectorStore / LiveActivityStream
   (phase21) ── resolveAgents ──────────┘           ├─▶ AgentStatsDashboard
                                         │           └─▶ AgentJournalPanel
   DEBATE RUNTIME (generic participant)
     debate-agent-executor → callLLM
     emits debate:runtime:agent:*  (NO cognitive)
        ├─ bias-profiler (generic)
        ├─ ethical_framework constraint (topic)
        └─ expert-ethics witness (separate feature)

   CONVERSATIONCORE / DIRECTOR
     ChatExecutor → resolveAgent → COGNITIVE_STEP_*
     conversation:* lifecycle events
```

## Agent → Subsystem assessment

| Subsystem                | Link                                         | Strength        | Evidence                                                                  |
| ------------------------ | -------------------------------------------- | --------------- | ------------------------------------------------------------------------- |
| **Agent core**           | `AgentService.resolveAgent`                  | Strong          | `agent-service.ts:337`; identity normalized `topology-defaults.ts:91-119` |
| **Debate**               | generic participant                          | Weak/incidental | `debate-agent-executor.ts`; no agent-specific wiring                      |
| **Cognitive stream**     | `COGNITIVE_STEP_COMPLETED` (non-debate only) | Partial         | debate emits none; `event-registry.ts`; `agent-service.ts:184`            |
| **Memory**               | `AgentJournalService`                        | Partial         | `agent-journal-service.ts:129-191`                                        |
| **Invocation**           | `AgentResolverDirectory` → `agentService`    | Strong          | `phase21-invocation.ts:40-49`; `invocation-engine-service.ts:158`         |
| **Research/Knowledge**   | none auto                                    | Absent          | no references                                                             |
| **Workflow (Builder)**   | none auto                                    | Absent          | no references                                                             |
| **Knowledge/Crystal**    | none auto                                    | Absent          | no references                                                             |
| **Forum**                | none auto                                    | Absent          | no references                                                             |
| **Scheduler**            | none auto                                    | Absent          | no references                                                             |
| **ConversationCore**     | `resolveAgent` + `ChatExecutor`              | Strong          | `conversation-execution-engine.ts:40`                                     |
| **Analytics/Stats**      | `AgentService` stats                         | Strong          | `agent-service.ts:184-210`                                                |
| **UI card**              | `AgentCard`/`AgentDetailPanel`               | Strong          | AgentsPanel                                                               |
| **Health/auto-recovery** | `agent-health-monitor`                       | Strong          | shared                                                                    |
| **Groups/teams**         | `AgentGroup`                                 | Strong (opt-in) | `agent-service.ts:667-799`                                                |

## Reuse notes (VERIFIED)

- All real behavior reuses **existing** shared infra; nothing is bespoke to Elena.
- The richest _latent_ ethics machinery (`bias-profiler`, `ethical_framework` constraint, `expert-ethics`) is generic and **topic-keyword triggered**, so it fires for _any_ debate, not preferentially for her.
- `AgentResolverDirectory` (phase21) deliberately reuses `agentService.resolveAgent`, so the Room/Invocation path gets the same canonical identity. (VERIFIED — `phase21-invocation.ts:40-49`)
