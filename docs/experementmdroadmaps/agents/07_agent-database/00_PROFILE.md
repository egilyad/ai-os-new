# 00_PROFILE — `agent-database` (Priya Nair)

> Status labels used throughout this research set: **VERIFIED** (read directly in source), **INFERRED** (reasoned from source), **OPINION** (recommendation/forward-looking).

## Identity (VERIFIED — `src/kernel/state/agent-profiles.ts:82-91`)

- **Node id:** `agent-database` (node ids ARE the system agents; 25 seeded in `AGENT_PROFILES`).
- **Display name:** Priya Nair
- **First / last:** Priya / Nair
- **Base role:** Database Engineer
- **Avatar:** emoji `🧩`, color `#06b6d4`
- **Provider:** `openrouter`
- **Model:** `openrouter/meta-llama/llama-3.3-70b-instruct`
- **Specializations:** `SQL Tuning`, `Replication`, `Data Modeling`

## How the curated profile becomes the live node (VERIFIED)

- `src/kernel/state/topology-defaults.ts:218-229` defines the node template with `roleName:'Database Engineer'`, a DB-engineer `prompt`, `temperature:0.2`, `tools:['data_analysis','sql_executor']`, and **`model:'auto'`**.
- `normalizeAgentIdentity()` (`topology-defaults.ts:91-118`) OVERRIDES the template's `model:'auto'` and `provider` with the curated `profile.model` / `profile.provider` (lines 104-105), and copies `displayName/firstName/lastName/baseRole/specializations/avatar/lensIds` from `AGENT_PROFILES`.
- **VERIFIED consequence:** the live node that actually runs uses `openrouter/meta-llama/llama-3.3-70b-instruct` (not `auto`). The `model:'auto'` literal in the template is dead — overwritten before mount.
- `lensIds` is set to `[]` when absent (`topology-defaults.ts:106`). **No lens is assigned to this agent.**

## Role / persona (VERIFIED — `topology-defaults.ts:224`, `role-service.ts:103-114`)

- Node `prompt`: "You are a database engineer. Design schemas, optimize queries, plan migrations. Consider indexing, sharding, replication, and ACID vs BASE trade-offs."
- A parallel `r-database` role exists in `role-service.ts` ("Expert in data modeling, storage engines, and query optimization") but it is a separate registry; the topology node is what actually executes.
- There is **no "data" lens** in `lens-library.ts` (15 lenses: critical, second-order, security, economic, …; grep for `data|sql|database|schema` finds none).

## Tools (VERIFIED — decorative only)

- `tools: ['data_analysis','sql_executor']` is declared on the node (`topology-defaults.ts:226`).
- The real `ToolService` built-in registry (`tool-executor.ts:174-257`) contains **no** `sql_executor` and **no** `data_analysis` tool. The only data-category tool is `t-summarize`.
- **VERIFIED:** the agent's DB tools are metadata decoration. There is no SQL execution, schema introspection, or query-plan analysis wired to this agent.

## Where the avatar comes from (VERIFIED)

- `agent-avatar-service.ts:105` `generateDeterministicAvatar` + `AgentAvatarService.generate` (`:128`) provide a deterministic fallback.
- `resolveAgentIdentity()` (`agent-identity.ts:62-144`) builds a UI-ready `AgentIdentityView`; if `config.avatar` is present (it is, via normalize) it uses `emoji 🧩 / color #06b6d4`.

## Where it is used in the UI (VERIFIED via AGENTS.md + topology)

- Topology: Router → `agent-database` (`e-router-database`, trigger `data_flow`, `topology-defaults.ts:470`); `agent-database` → aggregator (`e-database-agg`, `:522`).
- Panels (per AGENTS.md): `AgentsPanel/` (AgentCard, AgentDetailPanel, AgentIdentityEditor, AgentWizard, AgentAvatar), plus it surfaces in DebateAnalytics, DashboardPanel/AgentLiveBoard, AgentComparisonPanel, ForumPanel/AuthorBadge, DirectorPanel/AgentIdentityChip, DebateRuntimePanel/AgentControlPanel.

## Related agents (INFERRED)

- Upstream: `router` (Mission Router). Downstream: `aggregator` (Synthesis Aggregator).
- Peer technical agents: `agent-architect`, `agent-security`, `agent-devops`, `agent-perf`, `agent-network`, plus the 3 `auto` agents (`agent-risk`, `agent-ethics`, `agent-network`).

## Systems that can invoke it (VERIFIED)

- **Debate runtime:** generic participant selection via `persona-selector.ts` (no DB-specific persona variant — see `04_DEBATE_ROLE`).
- **ConversationCore / Director:** `ConversationOrchestrator` and `ChatExecutor` resolve it via `agentService.resolveAgent` (`agent-service.ts:337`).
- **Invocation Engine:** `phase21-invocation.ts:43-58` `AgentResolverDirectory` wraps `agentService`; `RoomPanel` lets a human pick ANY registered agent through the `Manual Room Chat` policy (`:125-144`).
- **AgentService groups:** `executeGroup` (`agent-service.ts:688`) can run it in parallel/sequential/consensus/debate patterns.
