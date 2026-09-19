# 00 — PROFILE: `agent-content`

> VERIFIED from source. Citations use `file:line`.

## Identity

| Field             | Value                                          | Source                    |
| ----------------- | ---------------------------------------------- | ------------------------- |
| Node id           | `agent-content`                                | agent-profiles.ts:162     |
| First / Last name | Lena Petrova                                   | agent-profiles.ts:163-164 |
| Display name      | Lena Petrova                                   | agent-profiles.ts:165     |
| Base role         | Content Strategist                             | agent-profiles.ts:166     |
| Avatar            | emoji `📝`, color `#f59e0b`                    | agent-profiles.ts:167     |
| Provider          | `openrouter`                                   | agent-profiles.ts:168     |
| Model             | `openrouter/meta-llama/llama-3.3-70b-instruct` | agent-profiles.ts:169     |
| Specializations   | `Editorial`, `SEO`, `Messaging`                | agent-profiles.ts:170     |

## Topology node (runtime identity)

`agent-content` is a **real node in the default baked-in topology** (not just a profile):

- `type: 'agent'`, `label: 'Content Strategist'` — topology-defaults.ts:319-328
- `config.prompt`: "You are a content strategist. Craft clear, engaging, and audience-appropriate content. Structure information for readability and impact." — topology-defaults.ts:324
- `config.temperature`: `0.6` — topology-defaults.ts:325
- `config.tools`: `SEARCH_TOOLS` (web search toolset) — topology-defaults.ts:326
- `config.model` in source is `'auto'`, **but `normalizeAgentIdentity` overwrites it** with the curated `profile.model` → `openrouter/meta-llama/llama-3.3-70b-instruct` — topology-defaults.ts:91-119 (line 105 `next.model = profile.model`). **VERIFIED: at runtime this node is pinned to llama-3.3-70b via openrouter.**
- `config.avatar` is injected from the curated profile (`{emoji:'📝',color:'#f59e0b'}`) — topology-defaults.ts:103.

### Edges (how it is wired into the default pipeline)

- `e-router-content`: `router` → `agent-content` (`trigger: 'data_flow'`) — topology-defaults.ts:480
- `e-content-agg`: `agent-content` → `aggregator` (`trigger: 'on_success'`) — topology-defaults.ts:532

So in the default topology, `agent-content` is a fan-out branch: the Mission Router may route a task to it, and its output flows to the Synthesis Aggregator.

## Grouping / audit metadata

- Classified as group **`Creative`** in `prompt-audit-service.ts` (`GROUP_BY_NODE_ID['agent-content']='Creative'`) — prompt-audit-service.ts:23. Siblings: `agent-creative`, `agent-designer`, `agent-ux`.

## Lens assignment

- **NONE.** `agent-content` has no `lensIds` in its profile or node config (lensIds defaulted to `[]` — topology-defaults.ts:106).
- The lens library (`lens-library.ts`) contains **11 lenses**, none content/SEO-specific (verified: `lens:critical`, `second-order`, `security`, `economic`, `multi-stakeholder`, `meta-consensus`, `meta-dissent`, `meta-uncertainty`, `optimistic`, `long-term`, `meta-meta`). AGENTS.md's claim of "15 lenses" is **stale** — source shows 11.

## Where it is used (consumers)

All consumers use `agent-content` **generically** as one of the 25 seeded agents via `AgentService.getAgents()` / `resolveAgent()`:

- **AgentsPanel** — AgentsPanelView, AgentCard, AgentDetailPanel, AgentIdentityEditor, AgentWizard, AgentAvatar, AgentStatsDashboard, EloLeaderboard, AgentComparison, AgentGroupsSection, AgentPolicySection, observability/history tabs — src/components/AgentsPanel/*.
- **Debate** — appears as a selectable participant wherever agents are listed; identity resolved via `resolveAgentIdentity` for DebateRuntimePanel/AgentControlPanel.
- **Director (ConversationCore)** — `agent-content` can be a `participantId` in a scenario; `resolveAgent` feeds `ChatExecutor` its model/systemPrompt.
- **Forum** — `AuthorBadge` resolves identity for any agent author.
- **DashboardPanel / AgentLiveBoard**, **AgentComparisonPanel**, **DirectorPanel / AgentIdentityChip** — generic agent-list consumers.
- **Invocaton** — `RoomPanel` human-picks any agent; `AgentResolverDirectory` wraps `agentService`.

## Systems that can invoke `agent-content`

1. **Default topology pipeline** (OrchestrationService) — automatic when the router routes to it. _VERIFIED (topology edges)._
2. **Manual / human invocation** via RoomPanel → Invocation Engine → ConversationDirector (chat) or Debate. _VERIFIED (phase21-invocation.ts:44-109)._
3. **Debate** as an explicit participant (human-configured). _VERIFIED (generic participant model; no content-specific path)._
4. **Director scenario** where it is listed as a participant. _VERIFIED (resolveAgent feeds ChatExecutor)._
5. **Agent groups** (AgentService.executeGroup). _VERIFIED (agent-service.ts:667-762)._

## Related agents (same `Creative` group)

`agent-creative` (Indira Sun), `agent-designer` (Kai Mendez), `agent-ux` (Theo Nakamura). Also adjacent: `agent-writer` (Clara Bengtsson, "Specialized" group), `agent-doc-*` family (documentation).

## Summary verdict

`agent-content` is a **fully-provisioned, model-pinned topology node with a curated persona**, but it carries **zero agent-specific code**. Every capability it has is shared infrastructure. Its "content strategist" behavior is defined solely by its system prompt + pinned model + SEO/search tools. There is no lens, no debate persona variant, no module hook that is content-aware.

_Status labels used below: VERIFIED (read in source), INFERRED (reasoned from architecture), OPINION (recommendation/judgment)._
