# 03 — SERVICES & INTEGRATIONS map

> How `agent-pm` flows through the system. Reuses existing verified seams. Tags: **VERIFIED** / **INFERRED** / **OPINION**.

## Data-flow diagram (VERIFIED)

```
AGENT_PROFILES['agent-pm']            agent-profiles.ts:182
        │  (build time)
        ▼
normalizeAgentIdentity()  ──►  topology node.config {displayName, model, provider, specializations, avatar}
        │                              topology-defaults.ts:91-119
        ▼
ActiveTopology (AuditorTopology)  ──►  nodes[agent-pm], edges router→pm→aggregator (482,534)
        │
        ├─► AgentService (IAgentResolver) ── getAgents()/resolveAgent() ── agent-service.ts:306,337
        │        │
        │        ├─► AgentStats (COGNITIVE_STEP_COMPLETED / STREAM_END) ── agent-service.ts:175-256
        │        └─► AgentLifecycle (pause/resume/restart/groups) ── agent-service.ts:460-686
        │
        ├─► Debate runtime  (Mission Router → agent-pm → aggregator)
        │        │   PersonaSelector picks variant by topic+role (NOT spec) ── persona-selector.ts:3-241
        │        │   debate-agent-executor.ts:78 records usage
        │        └─► (NO cognitive events emitted by debate)
        │
        ├─► ConversationCore / Director  (scenario participant)
        │        │   ConversationOrchestrator.resolveAgent → ChatExecutor(systemPrompt+model)
        │        └─► emits conversation:* events (turn:start/complete/error/...)
        │
        ├─► Invocation Engine (human RoomPanel pick)
        │        │   AgentResolverDirectory wraps agentService ── phase21-invocation.ts:43-58
        │        │   InvocationExecutionDelegate.start → chat/debate ── phase21-invocation.ts:60-110
        │        └─► emits invocation:* (requested/accepted/executing/done)
        │
        └─► UI consumers (generic)
                AgentsPanel (card/detail/stats/elo/history/groups),
                DirectorPanel/AgentIdentityChip, ForumPanel/AuthorBadge,
                DebateRuntimePanel/AgentControlPanel, DashboardPanel/AgentLiveBoard

Prompt-audit (by-name):  agent-pm ∈ 'Management' group ── prompt-audit-service.ts:18,192
AgentJournal (by agentId): cognitive_step entries ── agent-journal-service.ts:129-191
```

## Service dependency list (VERIFIED)

| Service / contract                                   | Role for `agent-pm`                                       | Source                                        |
| ---------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------- |
| `AgentService` (`IAgentResolver`)                    | identity resolution, stats, lifecycle, groups, auto-spawn | `agent-service.ts:71,306,337,460,614,667`     |
| `agent-identity.ts`                                  | UI-ready `AgentIdentityView` (avatar/specs/providerName)  | `agent-identity.ts:62-144`                    |
| `ConversationOrchestrator`                           | resolves agent-pm for Director scenarios                  | `conversation-orchestrator.ts` (AGENTS.md)    |
| `ChatExecutor`                                       | speaks agent-pm turns with pinned model+prompt            | AGENTS.md (ConversationCore)                  |
| `PersonaSelector`                                    | debate persona (generic, ignores specs)                   | `persona-selector.ts:3-241`                   |
| `debate-agent-executor`                              | debate turn execution + usage record                      | `debate-agent-executor.ts:78`                 |
| `InvocationEngineService` + `AgentResolverDirectory` | human invocation dispatch                                 | `phase21-invocation.ts:43-58,146-167`         |
| `AgentJournalService`                                | per-agent activity journal                                | `agent-journal-service.ts:96-331`             |
| `PromptAuditService`                                 | Management group membership (by name)                     | `prompt-audit-service.ts:18,192`              |
| `AgentAvatarService` / `AgentAvatar.tsx`             | avatar render — **deterministic hash, not profiles**      | `AgentAvatar.tsx:47-54` (VERIFIED correction) |

## Events touched (VERIFIED)

- **Emitted/consumed for agent-pm:** `COGNITIVE_STEP_COMPLETED`, `COGNITIVE_STEP_ACTIVE`, `STREAM_END`, `AGENT_LIFECYCLE_CHANGE`, `AGENT_HEALTH_CHANGE` (all via `AgentService`/`AgentJournalService`); `conversation:*` and `invocation:*` when run via those surfaces; `debate:*` when in a debate (but debate emits **no** `cognitive:*`).
- **Storage:** `AgentStats` + `AgentGroup` persisted to KV (`STATS_KEY`/`GROUPS_KEY`, `agent-service.ts:68-69,158-173`); journal to `agent_journal_v1` (`agent-journal-service.ts:36`); no agent-pm-specific Dexie table.

## Cross-agent / other-agent interaction (VERIFIED/INFERRED)

- `agent-pm` shares the `Management` audit group with `agent-po`, `agent-lead` (`prompt-audit-service.ts:18-20`).
- In debates it is a peer of all routed agents; it can be paired with `agent-risk` (its `Risk` spec complement) only by human scenario design — there is **no automatic PM+Risk pairing**.
- It can be auto-cloned by `evaluateAutoSpawn` (`agent-service.ts:642-651`) when busy and under `maxAgents`.

## Reuse summary

Every integration is **shared infrastructure**; `agent-pm` adds no new table, event, or service. The only name-based special case is the `Management` prompt-audit group.
