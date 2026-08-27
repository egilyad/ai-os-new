# 00_PROFILE — `agent-perf` (Leon Ortiz, Performance Engineer)

> Research-only deep-dive. No source changes. All claims tagged `[VERIFIED]` (read from code), `[INFERRED]` (reasoned from verified code), or `[OPINION]` (recommendation/judgment).

## Identity (canonical)

| Field           | Value                            | Source                                  |
| --------------- | -------------------------------- | --------------------------------------- |
| Node id         | `agent-perf`                     | `src/kernel/state/agent-profiles.ts:92` |
| First / Last    | Leon Ortiz                       | `agent-profiles.ts:93-94`               |
| Display name    | Leon Ortiz                       | `agent-profiles.ts:95`                  |
| Base role       | Performance Engineer             | `agent-profiles.ts:96`                  |
| Avatar          | emoji `🚀`, color `#f97316`      | `agent-profiles.ts:97`                  |
| Provider        | `groq`                           | `agent-profiles.ts:98`                  |
| Model           | `llama-3.3-70b-versatile`        | `agent-profiles.ts:99`                  |
| Specializations | Profiling, Caching, Load Testing | `agent-profiles.ts:100`                 |

## Where the identity is applied

`agent-perf` is a seeded topology **node** (`type: 'agent'`). The curated profile is merged onto the node by `normalizeAgentIdentity()` in `src/kernel/state/topology-defaults.ts:91-119`. Because that pass runs **last** (after `assignModelsToAgents`), the profile's `provider`/`model` override the generic `auto` assignment. `[VERIFIED]`

Net node config after seeding (`topology-defaults.ts:231-241` merged with profile):

- `roleName: 'Performance Engineer'`
- `prompt: 'You are a performance engineer. Identify bottlenecks, measure throughput and latency. Propose concrete optimizations backed by data.'` `[VERIFIED]`
- `temperature: 0.25`
- `tools: ['benchmark', 'profiler']` — **declared but not present in any tool-constant set** (`CODER_TOOLS`/`ANALYTICS_TOOLS`/`SECURITY_TOOLS`/`SEARCH_TOOLS`, `topology-defaults.ts:7-10`). See `10_PROBLEMS_AND_LIMITATIONS.md`. `[VERIFIED]`
- `model: 'llama-3.3-70b-versatile'`, `provider: 'groq'` (from profile)
- `lensIds: []` (no lens attached) `[VERIFIED]`

## Topology wiring (default graph)

- Edge `e-router-perf`: `router → agent-perf` (`trigger: 'data_flow'`) — `topology-defaults.ts:472`. The Mission Router _can_ route work to it.
- Edge `e-perf-agg`: `agent-perf → aggregator` (`trigger: 'on_success'`) — `topology-defaults.ts:524`. Its output flows to the Synthesis Aggregator. `[VERIFIED]`

So in the default topology `agent-perf` is a **first-class routed node**, not an orphan.

## Persona / system prompt

The persona is entirely the system prompt above. There is **no separate persona definition** specific to performance engineering (contrast `debate-runtime/persona-selector.ts` which defines 10 generic debate personas — none performance-themed). `[VERIFIED]` + `[INFERRED]`

## Avatar resolution

`AgentCard` renders via `resolveAgentIdentity(agent.id)` (`AgentCard.tsx:23`) which reads the profile avatar (`🚀` / `#f97316`). The hash-fallback `getAgentAvatar` (`AgentAvatar.tsx:47`) is only used when no canonical avatar is passed. `[VERIFIED]`

## Lens

**None.** `agent-perf` has `lensIds: []` and there is **no performance lens** in `lens-library.ts` (15 lenses: critical, second-order, security, economic, multi-stakeholder, meta-consensus, meta-dissent, meta-uncertainty, optimistic, long-term, meta-meta — none performance). `[VERIFIED]`

## Model / provider

`groq` / `llama-3.3-70b-versatile`. This model is also used by `agent-network`, `agent-architect`, `agent-data`, `agent-designer`, `agent-po`. `[VERIFIED]`

## Where it is used (UI surfaces)

The agent card and identity appear wherever `resolveAgentIdentity` / `AgentAvatar` / `agentService.resolveAgent` are consumed (per AGENTS.md shared context, confirmed by file presence):

- `AgentsPanel/*` (card, detail, stats, observability, history) — `src/components/AgentsPanel/`
- `DebateAnalytics`, `DashboardPanel/AgentLiveBoard`, `AgentComparisonPanel`
- `ForumPanel/AuthorBadge`
- `DirectorPanel/AgentIdentityChip`
- `DebateRuntimePanel/AgentControlPanel` `[INFERRED from AGENTS.md list; file presence verified]`

## Related agents (by shared infra, not by special linkage)

Shares the `groq`/`llama-3.3-70b-versatile` slot with `agent-network` (Latency Optimization), `agent-architect` (Scalability), `agent-devops` (Observability) — the closest "ops/perf" cluster. `[INFERRED]`

## Systems that can invoke `agent-perf`

- **Router** (default topology edge) — automatic routing. `[VERIFIED]`
- **Debate** — any debate where the user selects `agent-perf` as a participant. `[INFERRED]`
- **ConversationCore / Director** — as a `participantId` in a scenario; `resolveAgent` resolves it. `[VERIFIED]` (`agent-service.ts:337`)
- **Invocation (Room)** — human picks it from the agent dropdown; `AgentResolverDirectory` resolves it. `[VERIFIED]` (`phase21-invocation.ts:43-58`)
- **Groups / auto-spawn** — `AgentService.executeGroup` / `evaluateAutoSpawn`. `[VERIFIED]`
