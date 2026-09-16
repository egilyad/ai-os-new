# 03 — SERVICES & INTEGRATIONS map (reuse-existing)

> Map: `Agent(node) → Services → Events → Storage → UI → Other agents → Debate/Conversation/Invocation`.
> All VERIFIED unless marked INFERRED.

```
┌──────────────────────────────────────────────────────────────────────┐
│ agent-po  (topology node + AGENT_PROFILES entry)                      │
└───────────────┬──────────────────────────────────────────────────────┘
                │ resolved by
                ▼
   AgentService  (implements IAgentResolver)        agent-service.ts:71,337
                │  ├─ getAgents()        :306   (UI list)
                │  ├─ resolveAgent(id)   :337   (persona+model+specs)
                │  ├─ getStats / lifecycle / groups
                │  └─ COGNITIVE_STEP_COMPLETED → stats  :184
                ▼
   Consumers (reuse the SAME seam, no PO-specific branch):
   ├─ DebateRuntime      debate-llm-prompt-context.ts:871  (participant)
   ├─ ConversationCore   conversation-backed-debate-orchestrator.ts:42
   │   └─ ChatExecutor / ConversationOrchestrator (uses resolveAgent)
   ├─ DirectorService    (turns → agentService.resolveAgent)
   ├─ InvocationEngine   phase21-invocation.ts:43 (AgentResolverDirectory)
   └─ UI                 AgentCard/AgentDetailPanel/AgentIdentityChip/AuthorBadge
                │
   Events: COGNITIVE_STEP_COMPLETED (subject), COGNITIVE_TRACE_UPDATED,
           COGNITIVE_DECISION_MADE (dead-at-consumer),
           conversation:* / debate:* / invocation:* (when executed)
                │
   Storage: agent_journal_v1 (KV, agent-journal-service.ts:36),
            agent_stats / agent_groups KV (agent-service.ts:68-69),
            dexie invocations/scenarios when invoked
                │
   Other agents: none hard-wired. PO clusters with agent-pm/agent-lead
                 only via prompt-audit group 'Management'
                 (prompt-audit-service.ts:18-20) and router→agent→aggregator
                 topology trio (topology-defaults.ts:483,535).
```

## Reuse points (VERIFIED)

- **No new bus/adapter** needed — Invocation already hands off to `ConversationDirectorService` + `DebateSyncManager` (`phase21-invocation.ts:61-110`).
- **AgentResolverDirectory** already wraps `agentService` with `specializations` (`phase21-invocation.ts:47`).
- **`resolveAgentIdentity`** is the single identity seam (`agent-identity.ts:62`).
- **`agent-journal-service`** already persists per-agent history from `COGNITIVE_STEP_COMPLETED`.

## Gaps surfaced (VERIFIED)

- `AGENT_PROFILES.model` is **not** propagated (see `02` flag #4). Fix belongs in `agent-service.ts:351-353` or `topology-defaults.ts:365`.
- `invocation-types` module is **missing** in the repo (`invocation-repository.ts:4`, `dexie-schema.ts:20`, `interfaces.ts:8`) — a pre-existing build gap, flagged here as it blocks the Invocation path at typecheck. (OPINION: out of scope for agent-po but a blocker to verify the Invocation integration end-to-end.)
