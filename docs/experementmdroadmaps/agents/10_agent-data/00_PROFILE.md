# 00_PROFILE — `agent-data` (Sam Okafor, Data Scientist)

> Source of truth: `src/kernel/state/agent-profiles.ts:112-121`, topology node `src/kernel/state/topology-defaults.ts:257-267`.
> Confidence tags: **VERIFIED** (read from source), **INFERRED** (derived), **OPINION** (recommendation).

## Identity (VERIFIED)

| Field           | Value                                                                                                                                                                              | Source                                                                                                          |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Node id         | `agent-data`                                                                                                                                                                       | topology-defaults.ts:257                                                                                        |
| Display name    | Sam Okafor                                                                                                                                                                         | agent-profiles.ts:115                                                                                           |
| First / Last    | Sam / Okafor                                                                                                                                                                       | agent-profiles.ts:113-114                                                                                       |
| Base role       | Data Scientist                                                                                                                                                                     | agent-profiles.ts:116, topology node `roleName: 'Data Scientist'` (topology-defaults.ts:261)                    |
| Avatar          | 🔬 `#14b8a6`                                                                                                                                                                       | agent-profiles.ts:117 (injected into node `config.avatar` via normalizeAgentIdentity, topology-defaults.ts:103) |
| Provider        | `groq`                                                                                                                                                                             | agent-profiles.ts:118 (injected to `config.provider`, topology-defaults.ts:104)                                 |
| Model           | `llama-3.3-70b-versatile`                                                                                                                                                          | agent-profiles.ts:119 (injected to `config.model`, topology-defaults.ts:105)                                    |
| Specializations | Machine Learning, Statistics, Forecasting                                                                                                                                          | agent-profiles.ts:120                                                                                           |
| System prompt   | "You are a data scientist. Base analysis on statistical reasoning and empirical evidence. Distinguish correlation from causation. Quantify uncertainty with confidence intervals." | topology-defaults.ts:262                                                                                        |
| Temperature     | 0.3                                                                                                                                                                                | topology-defaults.ts:263                                                                                        |
| Tools           | `ANALYTICS_TOOLS`                                                                                                                                                                  | topology-defaults.ts:264                                                                                        |

## Where the profile is actually consumed (VERIFIED)

`AGENT_PROFILES` is imported in exactly **two** production files (`grep AGENT_PROFILES` → 6 matches, 2 production):

- `src/kernel/state/topology-defaults.ts:5,96` — `normalizeAgentIdentity()` copies the curated fields into the topology **node config** at build time.
- `src/kernel/state/topology-defaults.test.ts` — test only.

➡️ **The identity lives in the topology node, NOT in a live registry.** Every consumer (AgentService, debate, director, identity resolver, avatar) reads `node.config`, and the node was pre-populated from `AGENT_PROFILES` once. There is no runtime profile table — `resolveAgent` (`agent-service.ts:337`) reads `node.config`, not `AGENT_PROFILES`.

## Lens (VERIFIED — NONE)

`normalizeAgentIdentity` sets `next.lensIds = []` when undefined (topology-defaults.ts:106). `resolveAgentIdentity` (`agent-identity.ts:116`) reads `resolved.lensIds` → **empty**.
The lens library (`lens-engine/lens-library.ts`) has 11 lenses: `lens:critical, lens:second-order, lens:security, lens:economic, lens:multi-stakeholder, lens:meta-consensus, lens:meta-dissent, lens:meta-uncertainty, lens:optimistic, lens:long-term, lens:meta-meta`. **No `data` or `statistics` lens exists.** → Lens for this agent = N/A (currently unassigned).

## Where used (VERIFIED)

- `AgentsPanel` family (`src/components/AgentsPanel/`): AgentCard, AgentDetailPanel, AgentIdentityEditor, AgentWizard, AgentAvatar, AgentStatsDashboard, AgentObservabilityTab, AgentComparison, etc.
- Cross-panel consumers (INFERRED from shared resolver): DebateAnalytics, DashboardPanel/AgentLiveBoard, AgentComparisonPanel, ForumPanel/AuthorBadge, DirectorPanel/AgentIdentityChip, DebateRuntimePanel/AgentControlPanel.
- Debate runtime: participant built from node config in `debate-api.ts:308-320` (provider + modelId passed through).
- Invocation: `phase21-invocation.ts` `AgentResolverDirectory` over `agentService` (specializations exposed).
- prompt-audit grouping: `prompt-audit-service.ts:26` maps `agent-data → 'Analytical'`.

## Related agents (VERIFIED)

Topology neighbors (`topology-defaults.ts` edges):

- In: `e-router-data` router→agent-data (`:474`, trigger `data_flow`).
- Out: `e-data-agg` agent-data→aggregator (`:526`, `on_success`).
  Sibling analytics agents: `agent-database` (Database Engineer, `:219`), `agent-risk` (Risk Analyst, `:157`), `agent-research` (Research Analyst, `:269`) — all grouped under 'Analytical' in prompt-audit (`prompt-audit-service.ts:25-28`).

## Systems that can invoke (VERIFIED / INFERRED)

| System                                 | Can invoke agent-data? | Mechanism                                                                                                                                      |
| -------------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Debate                                 | YES                    | Auto-selected via router `data_flow` edge + `debate-api.ts` builds participant from node config                                                |
| ConversationCore / Director            | YES                    | `resolveAgent('agent-data')` resolves the node; scenarios can include it as participant                                                        |
| Invocation (Room)                      | YES                    | Human picks from `agentService.getAgents()`; policy gates `human-mention` only, any registered agent allowed (`phase21-invocation.ts:125-139`) |
| Knowledge Generator                    | GENERIC                | Runs via lenses, not specific agents; agent-data only if chosen as a participant                                                               |
| Crystal / Forum / Workflow / Scheduler | GENERIC                | No agent-specific binding exists                                                                                                               |

## Persona note (VERIFIED, important)

Debate **persona selection is topic-keyword based**, not specialization-based (`persona-selector.ts:243-290` scores variants by topic keywords + role; `agent-data`'s ML/Statistics/Forecasting specializations are **ignored** for persona). However the **model/provider pin IS honored** in debate (`debate-api.ts:315-319`). So Sam "speaks" with groq/llama-3.3-70b-versatile but her "Data Scientist" framing comes only from the node `systemPrompt`, not from a specialization-aware persona layer.
