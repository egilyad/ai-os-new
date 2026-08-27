# 03_SERVICES_AND_INTEGRATIONS — `agent-writer` Map

> Shows how the agent node flows through the existing architecture. **No writer-specific services exist**; it rides shared infra.

```
┌─────────────────────────── AGENT DEFINITION (static) ───────────────────────────┐
│ AGENT_PROFILES['agent-writer']  agent-profiles.ts:212                            │
│   └─ merged into topology node by normalizeAgentIdentity  topology-defaults:91  │
│ Role template r-tech-writer  role-service.ts:298 (separate, not auto-attached)   │
└──────────────────────────────────────────────────────────────────────────────────┘
                                    │ getActiveTopology()
                                    ▼
┌─────────────────────────── AGENT SERVICE (IAgentResolver) ──────────────────────┐
│ AgentService.resolveAgent('agent-writer')  agent-service.ts:337                 │
│   → ResolvedAgent { name, role, model, provider, systemPrompt, specializations } │
│   → resolveAgentIdentity()  agent-identity.ts : produces AgentIdentityView      │
│ AgentService.setupListeners: COGNITIVE_STEP_COMPLETED → stats  :184              │
└──────────────────────────────────────────────────────────────────────────────────┘
        │                                          │                                 │
   consumes identity                       emits stats KV                    lifecycle/groups
        │                                          │                                 │
        ▼                                          ▼                                 ▼
┌── DEBATE ──────────┐  ┌── CONVERSATIONCORE ─────┐  ┌── INVOCATION ──────────────┐
│ debate-engine.ts   │  │ ConversationOrchestrator│  │ InvocationEngineService    │
│ debate-llm-caller  │  │ ChatExecutor            │  │ AgentResolverDirectory     │
│ PersonaSelector    │  │ ConversationDirectorSvc │  │ (wraps agentService)       │
│ (topic-keyword,    │  │ (turn.participantId =   │  │ RoomPanel → invoke()       │
│  ignores spec)     │  │  'agent-writer')        │  │ phase21-invocation.ts:43   │
│ persona-selector:3 │  │ agent-service.ts:337    │  │                            │
└────────────────────┘  └─────────────────────────┘  └────────────────────────────┘
        │                                          │                                 │
        └─────────────── all call LLM via provider adapters ───────────────────────┘
                                    │
                                    ▼
┌── EVENTS (shared) ──────────────────────────────────────────────────────────────┐
│ COGNITIVE_STEP_COMPLETED (writer is nodeId)  event-registry.ts:763              │
│   consumers: AgentService(stats), MemoryEngine, AgentJournal, TraceService,     │
│              MetricsService, PolicyService, AgentHealthMonitor, AdvisorService   │
│ COGNITIVE_TRACE_UPDATED  :736  — CognitiveService/TraceService producers        │
│ debate:* events (writer as participant)  event-registry.ts:787+                 │
│ conversation:* events (Director/Orchestrator)  event-registry.ts (B4)            │
│ invocation:* events (RoomPanel path)  event-registry.ts (Step 3)                 │
│ COGNITIVE_DECISION_MADE :776 — DEAD at consumer (no writer producer)            │
└──────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌── STORAGE ──────────────────────────────────────────────────────────────────────┐
│ Dexie: no agent-identity table; topology in-memory                              │
│ KV: super_agents_agent_stats (AgentService)  agent-service.ts:68               │
│ Dexie: agent_journal (AgentJournalService)  agent-journal-service.ts            │
│ Dexie: invocations / invocationPolicies (InvocationEngine)  Step 2              │
└──────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌── UI (shared components) ───────────────────────────────────────────────────────┐
│ AgentsPanelView / AgentCard / AgentDetailPanel / AgentIdentityEditor /          │
│   AgentWizard / AgentAvatar  (getAgents list)                                   │
│ DirectorPanel AgentIdentityChip; DebateRuntimePanel AgentControlPanel;         │
│ ForumPanel AuthorBadge; AgentComparisonPanel; Dashboard AgentLiveBoard;         │
│ RoomPanel (human pick)                                                         │
└──────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌── OTHER AGENTS ──────────────────────────────────────────────────────────────────┐
│ Sibling doc cluster: doc-architect, doc-auditor, doc-simplifier, doc-historian,  │
│   doc-checker (same topology shape, no coordination mechanism).                 │
│ Aggregator node consumes writer output (e-writer-agg:537).                      │
│ Router decides whether writer is invoked at all (e-router-writer:485).          │
└──────────────────────────────────────────────────────────────────────────────────┘
```

## Reuse summary

- **Writer rides 100% on shared infra**: `AgentService`, `agent-identity.ts`, `PersonaSelector`, LLM adapters, EventBus, `AgentJournalService`, `MemoryEngine`, the `AgentsPanel` suite, `RoomPanel`, `DirectorPanel`.
- **No new service, event, or table is needed** to make the writer _participate_ in any of these subsystems — it already does.
- **What is missing** is _documentation-specific_ wiring: a doc-source tool, a doc-domain event, a lens, memory scoped to docs, and specialization-aware routing. These are additions, not rewrites.
