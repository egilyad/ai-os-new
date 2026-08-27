# 03_SERVICES_AND_INTEGRATIONS — Map Agent → Services → Events → Storage → UI → Other Agents

## Flow (VERIFIED — reuse of existing infra, no new code)

```
[Router / Human / Director / Debate]
        │
        ▼
AgentService.resolveAgent('agent-database')      agent-service.ts:337
        │  returns ResolvedAgent (prompt+model+lensIds+specializations)
        ▼
Orchestrator.execute(node)  →  LLM pipeline (governor, retry, streaming)
        │  emits:
        ├─ cognitive:step:active     orchestration-service.ts:355
        ├─ cognitive:step:completed  orchestration-service.ts:414
        └─ stream:end                (tokens/cost)
        ▼
Consumers (event-driven):
  • AgentService          → stats (agent-service.ts:184,219)
  • MemoryEngine         → memory ingest (memory-engine.ts:181)
  • AgentHealthMonitor   → health (agent-health-monitor.ts:66)
  • AgentJournalService  → journal log (agent-journal-service.ts:130)
  • TraceService         → cognitive trace (trace-service.ts:166,200)
  • SnapshotService      → snapshots (snapshot-service.ts:114)
  • MetricsService       → metrics (metrics-service.ts:187)
  • PolicyService        → policy (policy-service.ts:275)
  • AdvisorService       → advisor (advisor-service.ts:119)
        ▼
Storage: Dexie KV (stats `super_agents_agent_stats`, groups, journal `agent_journal_v1`) + memory mesh (15 stores)
        ▼
UI: AgentsPanel (AgentCard/AgentStatsDashboard/AgentObservabilityTab/AgentHistoryTab/
    AgentGroupsSection/AgentCapabilitiesTab) + DebateAnalytics + DashboardPanel/AgentLiveBoard
    + AgentComparisonPanel + ForumPanel/AuthorBadge + DirectorPanel/AgentIdentityChip
    + DebateRuntimePanel/AgentControlPanel + RoomPanel (Invocation)
```

## Assessment per subsystem (VERIFIED / INFERRED)

- **→ Debate:** Participates as a generic participant. `persona-selector.ts` has **no** DB-specific variant; the agent gets the same `technologist`/`cautious_scientist` personas any agent would by keyword match. Its DB identity is invisible to debate framing. **Assessment: weak / PARTIAL.** (see `04_DEBATE_ROLE`)
- **→ Cognitive stream:** Emits `cognitive:step:*` like any node. `cognitive:decision:made` is DEAD (no consumer). **Assessment: generic / DEAD event.** (see `07_COGNITIVE_ROLE`)
- **→ Memory:** Shares the 15-store mesh; no DB-specific partition, so schema/query learnings are not isolated. **Assessment: generic / PARTIAL.** (see `08_MEMORY_AND_CONTEXT`)
- **→ Invocation:** Reachable via `RoomPanel` human pick → `InvocationEngineService` → `ConversationDirector` (chat) or `DebateSyncManager` (debate). `AgentResolverDirectory` resolves it from `agentService` (`phase21-invocation.ts:43-58`). **Assessment: fully wired / good.**
- **→ Research / Knowledge / Crystal / Forum / Workflow / Scheduler:** No agent-specific hook. It would only ever appear as a generic agent if those modules happen to call it. **Assessment: absent / POTENTIAL.**
- **→ ConversationCore / Director:** Fully reachable; `resolveAgent` supplies persona+pinned model. **Assessment: good.**
- **→ Analytics/stats:** Rich — calls/tokens/latency/errors/cost persisted and shown. **Assessment: good.**
- **→ UI card:** Renders name/avatar/role/stats. Specializations shown only in detail/identity editor. **Assessment: adequate.**
- **→ Health/auto-recovery:** `agent-health-monitor.ts` + `restartAgent` + auto-spawn clones. **Assessment: good (shared).**
- **→ Groups/teams:** `createGroup`/`executeGroup` supported. **Assessment: good.**

## Key reuse note (VERIFIED)

There is exactly **one** identity source: the topology node + `AGENT_PROFILES`, surfaced via `IAgentResolver` (`agent-identity.ts:62`). No second registry exists — `agent-database` is resolved identically by Debate, Director, Invocation, and UI.
