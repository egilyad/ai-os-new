# 03_SERVICES_AND_INTEGRATIONS — `agent-quality` dependency map

```
                         ┌─────────────────────────────────────────────┐
                         │  AGENT_PROFILES / topology-defaults (node)     │
                         └───────────────┬─────────────────────────────┘
                                         │ resolveAgent(id)
                                         ▼
   ┌───────────────────────────────────────────────────────────────────┐
   │ AgentService (IAgentResolver)  src/kernel/services/agent-service.ts  │
   │  getAgents / resolveAgent / getStats / lifecycle / groups / autoSpawn│
   └───┬───────────┬──────────────┬──────────────┬──────────────────────┘
       │           │              │              │
  COGNITIVE_    AGENT_LIFECYCLE  AGENT_HEALTH   (provides identity to)
  STEP_COMPLETED CHANGE           CHANGE              │
       │           │              │                  ├─ AgentIdentityView (agent-identity.ts)
       ▼           ▼              ▼                  ├─ Director / ChatExecutor / Debate
  ┌────────┐ ┌──────────┐  ┌──────────────┐         ├─ Invocation AgentResolverDirectory
  │ stats  │ │lifecycle │  │HealthMonitor │         └─ UI (AgentsPanel, AuthorBadge, …)
  │(KV)    │ │state     │  │(auto-restart)│
  └────────┘ └──────────┘  └──────────────┘
       │
   COGNITIVE_STEP_COMPLETED also consumed by:
       ├─ AgentJournalService (journal entry)   agent-journal-service.ts:150
       └─ AgentHealthMonitor (step ingest)       agent-health-monitor.ts:65
```

## Agent → Subsystem assessment

- **→ Debate:** VERIFIED reused path. `PersonaSelector` receives role `"Quality Engineer"`; because no variant matches, **no persona is injected** (`persona-selector.ts:260-290`). Otherwise a normal participant. `AgentResolverDirectory` injects it as `role:'neutral'` for invocation debates (`phase21-invocation.ts:81`).
- **→ Cognitive stream:** Agent is a **consumer target** of `COGNITIVE_STEP_COMPLETED` (stats/journal/health). It is **not a producer** of `cognitive:decision:made` (dead at consumer per AGENTS.md; `event-registry.ts:776`).
- **→ Memory:** Generic journal store (`agent_journal_v1` KV) auto-writes. The ~16 memory stores (`src/kernel/services/memory/*`: semantic, episodic, procedural, working, emotional, social, spatial, memory-palace, service-backed…) are **generic**; nothing writes `agent-quality` QA findings into them. **EXISTS-BUT-UNUSED** for this agent.
- **→ Invocation:** `AgentResolverDirectory` (`phase21-invocation.ts:44-57`) wraps `agentService`; `resolveAgents` rejects unknown ids. RoomPanel lets a human pick `agent-quality`; policy `human-mention` allows any registered agent.
- **→ Research:** No research-agent subsystem references `agent-quality`. **POTENTIAL only.**
- **→ Workflow / Builder:** `builder-agent-service` is generic; no QA-gate node type. **POTENTIAL.**
- **→ Knowledge / Crystal:** No bridge seeds `agent-quality` (contrast `crystal-debate-bridge` which reacts to verdicts). **POTENTIAL.**
- **→ Forum:** `forum-service` uses `agentProvenance` generically; no QA-specific moderation role. **POTENTIAL.**
- **→ Scheduler:** No scheduled QA job exists. **POTENTIAL.**
- **→ ConversationCore / Director:** `ConversationOrchestrator` + `ChatExecutor` resolve via `agentService` (`agent-service.ts:337`); `ConversationDirectorService` uses it for turns.

## Reuse summary (all existing, no new infra needed)

`AgentService`, `agent-identity.ts`, `AgentAvatarService`, `PersonaSelector`, `AgentJournalService`, `AgentHealthMonitor`, `AgentResolverDirectory` (invocation), `EventBus` (`COGNITIVE_STEP_COMPLETED`, `AGENT_LIFECYCLE_CHANGE`, `AGENT_HEALTH_CHANGE`), Dexie KV store, AgentsPanel UI suite.
