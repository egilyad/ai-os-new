# 00_PROFILE — `agent-creative` (Indira Sun)

> Methodology note: Every claim below is tagged **VERIFIED** (read directly from source),
> **INFERRED** (reasoned from code but not directly confirmed), or **OPINION** (recommendation).
> File:line citations are provided so the claim can be re-checked.

## Identity

| Field           | Value                                          | Source                                   | Status   |
| --------------- | ---------------------------------------------- | ---------------------------------------- | -------- |
| System node id  | `agent-creative`                               | `src/kernel/state/agent-profiles.ts:142` | VERIFIED |
| Display name    | `Indira Sun`                                   | `agent-profiles.ts:145`                  | VERIFIED |
| Base role       | `Creative Visionary`                           | `agent-profiles.ts:146`                  | VERIFIED |
| Avatar          | emoji `🎨`, color `#a855f7`                    | `agent-profiles.ts:147`                  | VERIFIED |
| Provider        | `openrouter`                                   | `agent-profiles.ts:148`                  | VERIFIED |
| Model           | `openrouter/meta-llama/llama-3.3-70b-instruct` | `agent-profiles.ts:149`                  | VERIFIED |
| Specializations | `Ideation`, `Narrative`, `Brand`               | `agent-profiles.ts:150`                  | VERIFIED |
| First/Last name | `Indira` / `Sun`                               | `agent-profiles.ts:143-144`              | VERIFIED |

## Persona / system prompt

The node's runtime prompt (used when the agent actually executes) is defined in the
default topology, NOT in `AGENT_PROFILES`:

```
"You are a creative visionary. Generate novel ideas, think outside the box, and
explore unconventional approaches. Use analogies and lateral thinking."
```

`src/kernel/state/topology-defaults.ts:300-301` — `temperature: 0.8`, `tools: []`,
`model: 'auto'` (overridden by profile to the explicit openrouter model via
`normalizeAgentIdentity`, `topology-defaults.ts:104-105`).

**VERIFIED:** The curated profile (name/role/avatar/model/specializations) is merged into
the topology node config by `normalizeAgentIdentity()` at `topology-defaults.ts:91-119`.
So at runtime `resolveAgent('agent-creative')` returns
`provider: 'openrouter'`, `model: 'openrouter/meta-llama/llama-3.3-70b-instruct'`,
`specializations: ['Ideation','Narrative','Brand']`, `avatar: {emoji:'🎨', color:'#a855f7'}`.
(`agent-service.ts:337-390`, `agent-identity.ts:62-143`).

## Lens

**N/A.** No lens is assigned. `normalizeAgentIdentity` sets `next.lensIds = []` when the
profile has no lens (`topology-defaults.ts:106`). The preset `LENS_LIBRARY`
(`lens-library.ts`) contains 12 lenses (`lens:critical`, `second-order`, `security`,
`economic`, `multi-stakeholder`, `meta-consensus`, `meta-dissent`, `meta-uncertainty`,
`optimistic`, `long-term`, `meta-meta`, `meta-...`) — there is **no** creativity/brand/
narrative lens. So `agent-creative` does not gain a cognitive lens perspective.
(AGENTS.md claim of "15 lenses" is stale; the library file currently defines 12.
`lens-library.ts:10-312`.)

## Model / provider detail

- Provider slug `openrouter` → resolved by `provider-default-models.ts` to a real endpoint.
- Model `openrouter/meta-llama/llama-3.3-70b-instruct` is an **instruct** (non-reasoning)
  70B model. With `temperature: 0.8` the node is tuned for open-ended generation.
- If the openrouter key is missing/unfunded, routing falls back via
  `ChatExecutor` (`chat-executor.ts:201-232`) — but the pinned model is explicit, so a
  `model` request of `openrouter/meta-llama/...` is sent as-is; the failure path is the
  generic 402/timeout behaviour (see `10_PROBLEMS_AND_LIMITATIONS.md`).

## Where used (UI surfaces that render this agent)

- **AgentsPanel** family (`src/components/AgentsPanel/`): `AgentCard` shows
  `identity.specializations.join(' · ')` (`AgentCard.tsx:68-77`); `AgentIdentityEditor`
  edits specializations + lensIds (`AgentIdentityEditor.tsx:83-133`);
  `AgentDetailPanel`, `AgentStatsDashboard`, `AgentComparison`, `EloLeaderboard`,
  `LiveActivityStream`, `AgentGroupsSection`, `AgentPolicySection`, `AgentWizard`.
- **DebateAnalytics**, **DashboardPanel / AgentLiveBoard**, **AgentComparisonPanel**,
  **ForumPanel / AuthorBadge**, **DirectorPanel / AgentIdentityChip**,
  **DebateRuntimePanel / AgentControlPanel** — all consume `resolveAgentIdentity(id)`
  (`agent-identity.ts`).
- **RoomPanel** (Invocation): human picks any registered agent from `agentService.getAgents()`
  (`phase21-invocation.ts` → `AgentResolverDirectory`, `phase21-invocation.ts:44-58`).

## Related agents (same "Creative" group in prompt-audit)

`prompt-audit-service.ts:21-24` groups `agent-creative`, `agent-designer`, `agent-content`,
`agent-ux` under the **Creative** audit category. `agent-ux` is also under Creative
(profile says UX specializations `['UX','Prototyping','Design Systems']`,
`agent-profiles.ts:158-160`).

## Systems that can invoke `agent-creative`

1. **Debate runtime** — any debate whose participant list includes `agent-creative`
   (manual UI or invocation-delegated).
2. **ConversationCore / Director** — via `ChatExecutor` with `metadata.agentId='agent-creative'`
   (`chat-executor.ts:121`), or a `TurnProposal.participantId='agent-creative'`
   (`conversation-execution-engine.ts:40`).
3. **Invocation Engine** — human selects it in RoomPanel; `AgentResolverDirectory` exposes
   it with its specializations (`phase21-invocation.ts:47-56`); `resolveAgents` can also
   match it by expertise (`invocation-engine-service.ts:158-173`).
4. **AgentService groups** — `createGroup`/`executeGroup` can include it
   (`agent-service.ts:667-762`).
5. **Mission Router topology** — the default `router` node fans out to `agent-creative`
   via edge `e-router-creative` (`topology-defaults.ts:478`); the LLM router decides.

## Systems that CANNOT (currently) target it specifically

- **Lens engine** — no lens assigned (see above).
- **Persona selector** — `persona-selector.ts` chooses a debate persona by **topic
  keywords**, never by agent specialization (`persona-selector.ts:243-290`). So "Creative
  Visionary" is NOT used to pick the persona; the topic drives it.
- **Cognitive event stream** — `agent-creative` emits `COGNITIVE_STEP_COMPLETED` like any
  node; no agent-specific cognitive event exists.
