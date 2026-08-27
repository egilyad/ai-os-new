# 00 — PROFILE: `agent-pm` (Dana Whitfield)

> Research-only deep-dive. Classification legend: **VERIFIED** = read in source; **INFERRED** = derived from code paths; **OPINION** = recommendation/assessment.

## Core Identity (VERIFIED — `src/kernel/state/agent-profiles.ts:182-191`)

| Field              | Value                                          | Source                  |
| ------------------ | ---------------------------------------------- | ----------------------- |
| Node id            | `agent-pm`                                     | `agent-profiles.ts:182` |
| First name         | Dana                                           | `agent-profiles.ts:183` |
| Last name          | Whitfield                                      | `agent-profiles.ts:184` |
| Display name       | Dana Whitfield                                 | `agent-profiles.ts:185` |
| Base role          | Project Manager                                | `agent-profiles.ts:186` |
| Avatar             | emoji `🧩`, color `#3b82f6`                    | `agent-profiles.ts:187` |
| Provider (profile) | `openrouter`                                   | `agent-profiles.ts:188` |
| Model (profile)    | `openrouter/meta-llama/llama-3.3-70b-instruct` | `agent-profiles.ts:189` |
| Specializations    | `Planning`, `Agile`, `Risk`                    | `agent-profiles.ts:190` |

## How the identity reaches runtime (VERIFIED)

1. The curated blob in `AGENT_PROFILES` is consumed by `normalizeAgentIdentity()` (`src/kernel/state/topology-defaults.ts:91-119`), which runs at topology build time and copies `displayName/firstName/lastName/baseRole/specializations/avatar/provider/model/lensIds` from the profile **into the live node `config`**.
2. The raw topology node for `agent-pm` is declared with `model:'auto'` (`topology-defaults.ts:345-355`), **but** `normalizeAgentIdentity` overwrites `config.model` and `config.provider` with the profile values (lines 104-105). **VERIFIED nuance:** the 70B `openrouter/meta-llama/llama-3.3-70b-instruct` pin **IS applied** at runtime — it is _not_ dropped. (Stale docs in this folder previously claimed the pin was discarded; source contradicts that.)
3. `AgentService.resolveAgent()` (`agent-service.ts:337-389`) reads `node.config.model`; because it is now an explicit model (not `auto`/`default`), it returns `model = 'openrouter/meta-llama/llama-3.3-70b-instruct'` (`agent-service.ts:351-353`). Thus the chat/debate/ChatExecutor path binds `agent-pm` to that model.
4. `resolveAgentIdentity()` (`agent-identity.ts:62-144`) surfaces `displayName`, `avatar`, `specializations`, `providerName`, `model` to the UI from the resolved node.

## Persona / System prompt (VERIFIED — `topology-defaults.ts:350`)

```
"You are a project manager. Break down work into milestones, identify
dependencies, assess resource needs, and track progress. Communicate
clearly with stakeholders."
```

`temperature: 0.3`, `tools: []`.

## Where used in the product (VERIFIED — component consumers)

`agent-pm` is **one of 25 topology nodes** (`AGENT_PROFILES` size = 25, `agent-profiles.ts:21`). It is displayed generically through the shared agent UI, exactly like every other node:

- `src/components/AgentsPanel/` — `AgentsPanelView`, `AgentCard`, `AgentDetailPanel`, `AgentIdentityEditor`, `AgentStatsDashboard`, `EloLeaderboard`, `LiveActivityStream`, `AgentGroupsSection` (all driven by `agentService.getAgents()` / `resolveAgentIdentity()`).
- `DirectorPanel/AgentIdentityChip` — shows `agent-pm` when it is a scenario participant.
- `ForumPanel/AuthorBadge` — renders `agent-pm` as an author if it posts.
- `DebateRuntimePanel/AgentControlPanel` — pause/resume/control surface for the node during a debate.
- `DashboardPanel/AgentLiveBoard`, `AgentComparisonPanel`, `DebateAnalytics` — aggregate boards.

## Related agents (VERIFIED)

- **Same `Management` prompt-audit group** (`prompt-audit-service.ts:18-20`): `agent-po` (Sofia Romano, Product Owner) and `agent-lead` (Victor Soto, Team Lead). These three are the only "management" persona nodes.
- **Debate neighbours** (`topology-defaults.ts:482,534`): router → `agent-pm` → aggregator.
- **Sibling planners/risk**: `agent-architect` (scalability), `agent-risk` (Rafael Stone, Risk Analyst, `agent-profiles.ts:32-41`), `agent-po` (backlog/vision). `agent-risk` is the natural risk counterpart to `agent-pm`'s `Risk` specialization.

## Systems that can invoke `agent-pm` (VERIFIED)

- **Human (RoomPanel):** `phase21-invocation.ts:43-58` wraps `agentService` in `AgentResolverDirectory`; `RoomPanel` lets a human pick _any_ registered agent including `agent-pm`. The seeded `Manual Room Chat (human-selected agent)` policy (`phase21-invocation.ts:125-139`) matches `source:'human-mention'` and permits any registered agent.
- **Debate router:** `agent-pm` can be routed into a debate by the Mission Router (`topology-defaults.ts:482`).
- **ConversationCore / Director:** any scenario that lists `agent-pm` as a participant (via `TurnProposal.participantId`) resolves through `agentService.resolveAgent`.
- **Auto-spawn clones (indirect):** `AgentService.evaluateAutoSpawn` (`agent-service.ts:614-665`) can clone any busy agent including `agent-pm` when `autoSpawnConfig.enabled` and under `maxAgents`.

## Lens (VERIFIED — none)

`agent-pm` has **no `lensIds`** (profile omits it; `normalizeAgentIdentity` sets `lensIds:[]` at `topology-defaults.ts:106`). The lens library contains no planning/agile/risk lens (grep of `lens-library.ts` for `planning|agile|risk|backlog|sprint` → no match). **N/A.** See `02_CAPABILITIES.md` and `07_COGNITIVE_ROLE.md`.
