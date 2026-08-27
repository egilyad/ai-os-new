# 03 — SERVICES AND INTEGRATIONS map for `agent-content`

> How `agent-content` flows through the system. All edges are SHARED infra (no agent-specific code).

## Map: Agent → Services → Events → Storage → UI → Other agents → Subsystems

```
                         ┌─────────────────────────────────────────────┐
                         │  topology-defaults.ts (node agent-content)   │
                         │  prompt + model(llama-3.3-70b) + SEARCH_TOOLS│
                         └───────────────┬─────────────────────────────┘
                                         │ mount
                                         ▼
   ┌─────────────────────────────────────────────────────────────────────────┐
   │  OrchestrationService.execute(ctx)  [default pipeline]                    │
   │  OR ChatExecutor (Director)  OR DebateLLMCaller (Debate)                  │
   └───────────────┬───────────────────────────────────────┬──────────────────┘
                   │ LLM call (openrouter)                  │ (debate) persona
                   ▼                                        ▼
        emits COGNITIVE_STEP_COMPLETED            DEBATE_ARGUMENT / runtime events
                   │                                        │
   ┌───────────────┴───────────────┬────────────────────────┴───────────────┐
   ▼                                ▼                                        ▼
AgentService(stats)          MemoryEngine(store)                   AgentJournalService
agent-service.ts:184         memory-engine.ts:181                 agent-journal-service.ts:150
   │                                │                                        │
   ▼                                ▼                                        ▼
Dexie KV (stats)          Dexie memory store                     Dexie KV journal
   │                                │                                        │
   ▼                                ▼                                        ▼
AgentsPanel (stats)        (no agent-scoped UI)                  AgentHistoryTab
EloLeaderboard
```

## Subsystem assessment

| Subsystem                       | Relationship                                                                                                      | Verdict                         | Evidence                                                   |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------- | ---------------------------------------------------------- |
| **Debate**                      | Can be added as a participant; gets generic `PersonaSelector` variant; no content persona.                        | Reuse existing                  | persona-selector.ts:3-241; debate-agent-executor.ts:38-116 |
| **Cognitive stream**            | Emits `COGNITIVE_STEP_COMPLETED` (used by 9 consumers). `COGNITIVE_DECISION_MADE` emitted but DEAD (no consumer). | Reuse existing + fix dead event | orchestration-service.ts:414; event-registry.ts:776        |
| **Memory**                      | Outputs stored generically by `nodeId`. No agent-scoped recall.                                                   | Reuse existing; improve scoping | memory-engine.ts:181-200                                   |
| **Invocation**                  | `AgentResolverDirectory` wraps `agentService.getAgents()/resolveAgent()`. Human picks it in RoomPanel.            | Reuse existing                  | phase21-invocation.ts:44-58,127-144                        |
| **Research**                    | None content-specific. Available as generic agent.                                                                | Reuse existing                  | (no code found)                                            |
| **Workflow / Builder**          | None content-specific. Available as generic agent in a flow.                                                      | Reuse existing                  | (no code found)                                            |
| **Knowledge / Crystal**         | None content-specific. Could crystallize content as a crystal, but no auto-bridge.                                | POTENTIAL                       | crystal-debate-bridge exists for debates only              |
| **Forum**                       | Appears as `AuthorBadge` when it posts; no content-specific behavior.                                             | Reuse existing                  | ForumPanel/AuthorBadge                                     |
| **Scheduler**                   | None content-specific.                                                                                            | POTENTIAL                       | (no code found)                                            |
| **ConversationCore / Director** | `resolveAgent('agent-content')` → model+systemPrompt → ChatExecutor.                                              | Reuse existing                  | agent-service.ts:337-390; phase21-invocation.ts:89-108     |
| **Analytics / stats**           | Full stats via `COGNITIVE_STEP_COMPLETED`.                                                                        | Reuse existing                  | agent-service.ts:184                                       |
| **UI card**                     | AgentCard / AgentDetailPanel render it like any agent.                                                            | Reuse existing                  | AgentsPanel/*                                              |
| **Health / auto-recovery**      | `agent-health-monitor` consumes its step events.                                                                  | Reuse existing                  | agent-health-monitor.ts:66                                 |
| **Groups / teams**              | `AgentService.createGroup` can include it.                                                                        | Reuse existing                  | agent-service.ts:667-799                                   |

## Key cross-agent interactions

- **With `agent-creative`, `agent-designer`, `agent-ux`** (same `Creative` audit group): they are siblings in the default topology fan-out. In a single pipeline run they all execute in parallel and their outputs are merged by the aggregator — there is **no coordination or role distinction** among them beyond their individual prompts.
- **With `aggregator`**: one-directional edge `e-content-agg` (topology-defaults.ts:532).
- **With Mission Router**: one-directional edge `e-router-content` (topology-defaults.ts:480).
- **With Invocation Engine**: the engine resolves it via `AgentResolverDirectory` and may hand off to Director (chat) or Debate — phase21-invocation.ts:61-109.

## Architecture note

`agent-content` has **no service of its own**. It is data (a topology node + a curated profile) interpreted by shared services. This is the correct design (per AGENTS.md "Agents are topology NODES; behavior is SHARED infra"), but it means every enhancement must either (a) be generic agent-infra that all 25 benefit from, or (b) be a _content skill_ layered on top via prompt/lens/tools without forking the agent model.
