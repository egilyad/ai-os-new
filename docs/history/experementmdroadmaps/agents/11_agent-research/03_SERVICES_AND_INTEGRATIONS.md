# 03 — SERVICES AND INTEGRATIONS MAP

**Goal:** trace `agent-research` → Services → Events → Storage → UI → Other agents, across every subsystem. VERIFIED unless tagged.

## Dependency-direction note (architecture rule)

`src/kernel` (where AgentService lives) MUST NOT import UI (`agent-service.ts` has zero React/DOM imports — VERIFIED, it only imports contracts/types/utils/events). UI consumes the agent through `agentService` / `resolveAgentIdentity`.

## Agent → Services

| Service                                | Relationship to agent-research                                  | Evidence                                                                  |
| -------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `AgentService` (`agent-service.ts:71`) | Canonical resolver + lifecycle + stats + groups + auto-spawn    | `getAgents:306`, `resolveAgent:337`, `toggleAgent:460`, `createGroup:667` |
| `agent-identity.ts`                    | Builds `AgentIdentityView` from resolver + lens engine + avatar | `resolveAgentIdentity:62`                                                 |
| `agent-journal-service.ts`             | Records its cognitive steps / debate errors generically         | `subscribe:129-191`, `listByAgent:253`                                    |
| `prompt-audit-service.ts`              | Groups it `'Analytical'`                                        | `:27`                                                                     |
| `debate-agent-executor.ts`             | Executes it as a debate participant                             | `:38-80`                                                                  |
| `debate-query-engine.ts`               | Resolves provider/key/model for it in debate                    | `:182-340`                                                                |
| `debate-meta-agent-controller.ts`      | Assigns tactical role per-round (graph-based)                   | `:21-50`                                                                  |
| `PersonaSelector`                      | Injects `cautious_scientist` on research-y topics               | `persona-selector.ts:4-25`                                                |
| `ConversationOrchestrator`             | Resolves it via `agentService.resolveAgent` for Director turns  | `agent-service.ts:337` (consumed)                                         |
| `ChatExecutor`                         | Speaks its turn in ConversationCore                             | (per AGENTS.md)                                                           |
| `invocation-engine-service.ts`         | `AgentResolverDirectory` wraps `agentService`; human picks it   | `phase21-invocation.ts:43-58`                                             |
| `agent-health-monitor.ts`              | Generic health/auto-recovery (INFERRED per AGENTS.md)           | —                                                                         |
| `agent-version-service.ts`             | Generic versioning; `AgentHistoryTab`                           | `AgentHistoryTab.tsx:14`                                                  |
| `agent-avatar-service.ts`              | Deterministic avatar fallback                                   | `agent-identity.ts:72`                                                    |

## Agent → Events

| Event                             | Role                                                  | Evidence                                               |
| --------------------------------- | ----------------------------------------------------- | ------------------------------------------------------ |
| `COGNITIVE_STEP_ACTIVE`           | consumed (journal)                                    | `agent-journal-service.ts:130`                         |
| `COGNITIVE_STEP_COMPLETED`        | produced (when node runs) + consumed (stats, journal) | `agent-service.ts:184`, `agent-journal-service.ts:150` |
| `STREAM_END`                      | consumed (provider/key stats)                         | `agent-service.ts:219`                                 |
| `AGENT_LIFECYCLE_CHANGE`          | produced/consumed                                     | `agent-service.ts:603,249`                             |
| `AGENT_HEALTH_CHANGE`             | consumed (auto-spawn)                                 | `agent-service.ts:252`                                 |
| `debate:runtime:agent:error`      | consumed (journal)                                    | `agent-journal-service.ts:174`                         |
| `conversation:*` / `invocation:*` | observed via store when invoked                       | store layer (per AGENTS.md)                            |
| `cognitive:decision:made`         | NOT consumed (DEAD)                                   | `event-recorder.ts:232,261`                            |

## Agent → Storage

- **Dexie KV**: agent stats (`STATS_KEY='super_agents_agent_stats'`, `agent-service.ts:68`), groups (`GROUPS_KEY`, `:69`), journal (`'agent_journal_v1'`, `agent-journal-service.ts:36`).
- **No dedicated table** for agent-research. No scenarios/invocations keyed to it specifically (invocations store the target id generically — `invocation-repository.ts`).

## Agent → UI

`AgentsPanel*` (container/card/detail/editor/wizard/avatar/leaderboard/live-stream/history/groups/policy), `DirectorPanel/AgentIdentityChip`, `DebateRuntimePanel/AgentControlPanel`, `ForumPanel/AuthorBadge`, `AgentComparisonPanel`, `DashboardPanel/AgentLiveBoard`, `DebateAnalytics`, `RoomPanel` (invoke picker).

## Agent → Other agents

- **Not coupled** to any specific agent. Interactions are emergent: in debate it speaks alongside whatever participants are selected; in groups it runs with the group's agentIds; in topology it flows router→agent-research→aggregator (`topology-defaults.ts:476,528`).
- Sibling "Analytical" cohort (`prompt-audit-service.ts:25-29`): `agent-critic`, `agent-data`, `agent-research`, `agent-risk`, `agent-ethics` — same audit group, no runtime dependency.

## Subsystem assessments (reuse existing)

- **→ Debate:** ✅ fully reusable. Just another participant. ADDITIVE cost = 0.
- **→ Cognitive stream:** ⚠️ only generic `COGNITIVE_STEP_*`; `cognitive:decision:made` is DEAD. Display integration = read existing events, no new producer.
- **→ Memory:** ✅ `AgentJournalService` already logs it. Continuity improvement = tag/summarize, not new store.
- **→ Invocation:** ✅ works today via `human-mention` policy. No engine change needed.
- **→ Research (phase9 engine):** ❌ NOT wired. Would require the Research Engine to accept an `agentId`/persona — currently source-driven.
- **→ Workflow (Builder):** ❌ not referenced by `builder-agent-service`. POTENTIAL.
- **→ Knowledge/Crystal/Synthesis:** ❌ lens/role-driven, not agent-driven. POTENTIAL (attach `lens:critical`/`meta-uncertainty`).
- **→ Forum:** ✅ can author posts generically (AuthorBadge). No agent-specific behavior.
- **→ Scheduler:** ❌ invocation policy is `human-mention` only; no scheduled-trigger policy exists for it.
- **→ ConversationCore:** ✅ reusable as a Director participant.
