# 03_SERVICES_AND_INTEGRATIONS — Agent → Service map

> VERIFIED where read in source; INFERRED otherwise.

## Direct service dependencies (VERIFIED)

```
AGENT_PROFILES (agent-profiles.ts:72)
   └─ normalizeAgentIdentity ─► topology node agent-devops (topology-defaults.ts:91-119)
                                   │
AgentService (phase4-agents-roles.ts:86)  [IAgentResolver impl, agent-service.ts:71]
   ├─ reads  getActiveTopology() → node config (prompt/model/tools/temp)
   ├─ resolveAgent('agent-devops') → ResolvedAgent (agent-service.ts:337)
   ├─ getAgents()/getStats()       (agent-service.ts:306,288)
   ├─ consumes COGNITIVE_STEP_COMPLETED (184) + STREAM_END (219) → stats
   ├─ consumes AGENT_LIFECYCLE_CHANGE (249) + AGENT_HEALTH_CHANGE (252)
   └─ emits   AGENT_LIFECYCLE_CHANGE / AGENT_RESTARTED / SYSTEM_NODE_*
```

## Agent → Subsystem integration assessment

| Target                                                         | Integration path                                             | Status      | Evidence                                                      |
| -------------------------------------------------------------- | ------------------------------------------------------------ | ----------- | ------------------------------------------------------------- |
| **Debate**                                                     | topology node → DebateRuntime persona-selector → executor    | ✅ Wired    | `persona-selector.ts`, `topology-defaults.ts:469`             |
| **Cognitive stream**                                           | step events emitted by Orchestrator; AgentService stats only | ⚠️ Partial  | `agent-service.ts:184`; `COGNITIVE_DECISION_MADE` DEAD        |
| **Memory**                                                     | shared journal + ~16 memory stores; no devops-specific       | ⚠️ Indirect | `agent-journal-service.ts:130-190`                            |
| **Invocation**                                                 | AgentResolverDirectory over agentService; human picks devops | ✅ Wired    | `phase21-invocation.ts:43-58`                                 |
| **Research**                                                   | no direct devops wiring                                      | ❌ None     | grep: no refs                                                 |
| **Workflow/Builder**                                           | `debate:start` emitted, no consumer                          | 💀 Dead     | `builder-agent-service.ts:40`                                 |
| **Knowledge/Crystal**                                          | not wired to devops                                          | ❌ None     | grep: no refs                                                 |
| **Forum**                                                      | not wired; appears only via others                           | ❌ None     | grep: no refs                                                 |
| **Scheduler**                                                  | no scheduler found                                           | ❌ None     | grep: no refs                                                 |
| **ConversationCore**                                           | resolveAgent → ChatExecutor                                  | ✅ Wired    | `agent-service.ts:337`, `conversation-execution-engine.ts:40` |
| **Other agents**                                               | groups / meta-agent / debate side-by-side                    | ✅ Generic  | `agent-service.ts:667-762`                                    |
| **UI (AgentsPanel, Room, Director, Debate, Forum, Dashboard)** | identity chip everywhere                                     | ✅ Wired    | `agent-identity.ts:111`                                       |

## End-to-end data flow (INFERRED, grounded in verified seams)

```
Human/Policy
   │
   ├─ Debate: meta-agent picks agent-devops node → PersonaSelector(topic) → executor
   │        → groq/llama-3.1-8b-instant  →  debate:* events  →  DebateRuntimePanel/AgentControlPanel
   │
   ├─ ConversationCore/Director: scenario turn → resolveAgent('agent-devops')
   │        → model honored  →  conversation:* events  →  DirectorStore/RunTab
   │
   └─ Invocation(Room): human selects Tomas Berg → invoke(req)
            → AgentResolverDirectory.getAgents  →  policy(source:'human-mention') allows
            → InvocationExecutionDelegate.start  →  ChatExecutor / Debate / Director
            →  invocation:* + conversation:*  →  InvocationStore/RoomPanel
```

## Reuse assessment (OPINION)

Almost everything is reusable for devops: `AgentService.resolveAgent` already returns the pinned model + specializations; `InvocationEngineService` already exposes devops in the picker; `agent-journal-service` already records its steps. The **missing** pieces are _domain bridges_ (a DevOps lens, runbook/incident memory, real K8s/CI tools), not new infrastructure. No new buses/adapters needed.
