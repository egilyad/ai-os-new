# 03 — SERVICES & INTEGRATIONS map: `agent-architect`

```
AGENT (topology node `agent-architect`)
   │
   ├─ AgentService (agent-service.ts:71, IAgentResolver)  [shared, 25 agents]
   │     ├─ getAgents() / resolveAgent() → identity + system prompt + model
   │     ├─ stats (COGNITIVE_STEP_COMPLETED :184) → Dexie KV
   │     ├─ lifecycle, groups, autoSpawn
   │     └─ consumes: EVENTS.COGNITIVE_STEP_COMPLETED / STREAM_END / AGENT_LIFECYCLE_CHANGE / AGENT_HEALTH_CHANGE
   │
   ├─ agent-identity.ts:62  (resolveAgentIdentity)  → AgentIdentityView (avatar, lensNames, provider)
   │     └─ reuses agentService + agentAvatarService + lensEngine
   │
   ├─ Debate runtime (debate-runtime/*)
   │     ├─ participant (explicit / router)  → DebateSession.participants
   │     ├─ persona: PersonaSelector.selectForTopic (:292) — GENERIC, topic-keyword based
   │     └─ emits debate:* (argument/verdict/consensus) — session-scoped
   │
   ├─ ConversationCore / Director
   │     └─ participantId → agentService.resolveAgent → ChatExecutor speaks as architect
   │
   ├─ Invocation Engine (phase21-invocation.ts)
   │     ├─ AgentResolverDirectory (:44) wraps agentService
   │     ├─ InvocationExecutionDelegate (:61) → ConversationDirector / Debate
   │     └─ policy "Manual Room Chat (human-selected agent)" matches source:'human-mention'
   │
   ├─ Cognitive stream (orchestration-service.ts:355,414)
   │     └─ COGNITIVE_STEP_ACTIVE / COGNITIVE_STEP_COMPLETED (nodeId)
   │           → AgentService stats, agent-journal-service, memory-engine, snapshot-service, advisor, metrics, policy
   │
   ├─ Memory: agent-journal-service.ts:130,150 (per nodeId) → Dexie KV agent_journal_v1
   │
   ├─ UI: AgentsPanel/* , DirectorPanel, DebateRuntimePanel, ForumPanel, Dashboard
   │
   └─ OTHER AGENTS: peer technical cluster (security/devops/database/perf/network)
```

## Assessment of each integration (VERIFIED unless marked)

| Integration            | Status                      | Evidence                                                                                                                                       | Note                                                  |
| ---------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| → Debate               | ✅ active                   | `persona-selector.ts`, `debate-sync-manager.ts`                                                                                                | persona generic, not architect-specific               |
| → Cognitive stream     | ✅ active (generic)         | `orchestration-service.ts:414`                                                                                                                 | only step-completion; no architect reasoning surfaced |
| → Memory               | ✅ active (generic journal) | `agent-journal-service.ts:130`                                                                                                                 | no architect-specific store                           |
| → Invocation           | ✅ active                   | `phase21-invocation.ts:44`                                                                                                                     | human can pick it from Room                           |
| → Research             | ⚠️ PARTIAL                  | node uses `CODER_TOOLS` not `SEARCH_TOOLS`                                                                                                     | no web/research tooling bound                         |
| → Workflow/Builder     | ❌ BROKEN/DEAD              | `builder-agent-service.ts:40` `debate:start` (unregistered; real `debate:started` `event-registry.ts:788`); dispatch not wired [per AGENTS.md] | do not build on this                                  |
| → Knowledge/Crystal    | ⚠️ PARTIAL                  | engines tag `capabilities:['architecture']` in tests only                                                                                      | capability tag, not agent instance                    |
| → Forum                | ✅ as author                | `ForumPanel/AuthorBadge`                                                                                                                       | no architect-specific behavior                        |
| → Scheduler            | ❌ none                     | no scheduler link found                                                                                                                        | POTENTIAL                                             |
| → ConversationCore     | ✅ active                   | Director execution engine                                                                                                                      | —                                                     |
| → Analytics/stats      | ✅ active                   | `AgentStatsDashboard`, `EloLeaderboard`                                                                                                        | —                                                     |
| → UI card              | ✅ active                   | `AgentCard.tsx`                                                                                                                                | —                                                     |
| → Health/auto-recovery | ✅ active                   | `agent-health-monitor.ts:66`                                                                                                                   | —                                                     |
| → Groups/teams         | ✅ active                   | `AgentGroupsSection.tsx`, `agent-service.ts:667`                                                                                               | —                                                     |

**Conclusion:** the agent is fully reachable through every participation channel, but **every channel treats it generically**. The only architect-specific artifact in the entire codebase is the static `architectureReviewService` (`architecture-review-service.ts:99`) — which does NOT invoke this agent at all (it parses file trees). This is the central architectural irony documented in 10/12.
