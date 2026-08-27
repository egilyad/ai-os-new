# 00 — PROFILE: `agent-po` (Sofia Romano)

> STATUS LEGEND used across this research pack: **VERIFIED** (read in source), **INFERRED** (derived from architecture, not directly observed), **OPINION** (recommendation/judgement).

## Core identity (VERIFIED — `src/kernel/state/agent-profiles.ts:192-201`)

| Field           | Value                                     | Source                  |
| --------------- | ----------------------------------------- | ----------------------- |
| Node id         | `agent-po`                                | `agent-profiles.ts:192` |
| First / Last    | Sofia / Romano                            | `:193-194`              |
| Display name    | Sofia Romano                              | `:195`                  |
| Base role       | Product Owner                             | `:196`                  |
| Avatar          | 🎯 `#8b5cf6`                              | `:197`                  |
| Provider        | `groq`                                    | `:198`                  |
| Model           | `llama-3.3-70b-versatile`                 | `:199`                  |
| Specializations | `['Backlog', 'Vision', 'Prioritization']` | `:200`                  |

## Topology node (VERIFIED — `src/kernel/state/topology-defaults.ts:357-367`)

- `type: 'agent'`, `label: 'Product Owner'`
- `config.roleName: 'Product Owner'`
- `config.prompt: 'You are a product owner. Define requirements, prioritize the backlog by business value, and make scope trade-off decisions. Keep the team focused on delivering user value.'` (`:362`)
- `config.temperature: 0.3`, `config.tools: []`, `config.model: 'auto'` (`:363-365`)
- Edges: `e-router-po` router→agent-po (`data_flow`), `e-po-agg` agent-po→aggregator (`on_success`) — `topology-defaults.ts:483,535`

## Persona / system prompt (VERIFIED)

The agent "persona" at runtime is the `config.prompt` above; the curated `firstName/lastName/avatar` live in `AGENT_PROFILES` and are merged by `agent-identity.ts` for UI only. There is **no** Product-Owner-specific LLM behavior beyond that one system-prompt sentence.

## Lens (VERIFIED — `src/kernel/services/lens-engine/lens-library.ts`)

**None.** No lens references `agent-po`. `resolveAgentIdentity` returns `lensIds: []` for `agent-po` (no `lensIds` set in `AGENT_PROFILES` entry, `agent-profiles.ts:192-201`). The lens library contains `critical`, `second-order`, `security`, `economic`, `multi-stakeholder`, `meta-consensus`, `meta-dissent`, `meta-uncertainty`, `optimistic`, `long-term`, `meta-meta` — **none are product/vision/PO lenses**. (OPINION: a `lens:product-vision` would be the natural fit but does not exist.)

## Where used (VERIFIED — grep across `src`)

- `AgentsPanel` UI — `AgentCard.tsx`, `AgentsPanelView.tsx`, `AgentDetailPanel.tsx`, `AgentIdentityEditor.tsx`, `AgentAvatar.tsx`, `AgentStatsDashboard.tsx`, `EloLeaderboard.tsx`, `LiveActivityStream.tsx`, `AgentComparison.tsx`, `AgentGroupsSection.tsx`, etc. (all generic over `agentService.getAgents()`)
- `DirectorPanel/AgentIdentityChip.tsx:25` (reads `identity.baseRole` + `specializations[0]`)
- `ForumPanel/AuthorBadge` (author provenance)
- `DebateRuntimePanel/AgentControlPanel`, `DebateAnalytics`
- `DashboardPanel/AgentLiveBoard`
- `AgentComparisonPanel`
- `prompt-audit-service.ts:19` — grouped under `'Management'` (with `agent-pm`, `agent-lead`)

All of the above are **agent-agnostic** — they iterate over `agentService.getAgents()` and resolve identity per id. There is **no code path that special-cases `agent-po`**.

## Related agents (VERIFIED / INFERRED)

- Management cluster: `agent-pm` (Project Manager), `agent-lead` (Team Lead) — share `prompt-audit` group `'Management'` (`prompt-audit-service.ts:18-20`) and the same router→agent→aggregator topology trio (`topology-defaults.ts:345-536`).
- Debate/Conversation/Invocation: any agent selected as a participant.

## Systems that CAN invoke `agent-po` (VERIFIED)

1. **Debate** — selected as a participant node (human/topology picks participants; no PO-specific logic).
2. **ConversationCore / Director** — `ConversationOrchestrator` / `ChatExecutor` resolve it via `agentService.resolveAgent` (`agent-service.ts:337`).
3. **Invocation Engine** — `RoomPanel` human-picks any registered agent; `AgentResolverDirectory` wraps `agentService` (`phase21-invocation.ts:43-58`).
4. **AgentService** itself — `getAgents()` exposes it; `spawnAgent`/lifecycle/auto-spawn apply uniformly.

## One-line summary

`agent-po` is a **purely declarative topology node + curated profile**; its entire behavioral footprint is one system-prompt sentence, a groq model pin, and shared AgentService infra. It has **zero** bespoke code.
