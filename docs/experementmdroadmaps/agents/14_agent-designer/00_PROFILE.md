# 00_PROFILE — `agent-designer` (Kai Mendez)

> Research-only deep-dive. Status labels: **VERIFIED** (source read directly), **INFERRED** (derived from surrounding code), **OPINION** (recommendation/speculation).

## Canonical Identity

| Field           | Value                           | Evidence                                                                     |
| --------------- | ------------------------------- | ---------------------------------------------------------------------------- |
| Node id         | `agent-designer`                | `agent-profiles.ts:152`                                                      |
| Display name    | Kai Mendez                      | `agent-profiles.ts:155`                                                      |
| First / Last    | Kai / Mendez                    | `agent-profiles.ts:153-154`                                                  |
| Base role       | Product Designer                | `agent-profiles.ts:156` (and topology `roleName` `topology-defaults.ts:311`) |
| Avatar          | 🎨 `#ec4899`                    | `agent-profiles.ts:157`                                                      |
| Provider        | `groq`                          | `agent-profiles.ts:158`                                                      |
| Model           | `llama-3.3-70b-versatile`       | `agent-profiles.ts:159`                                                      |
| Specializations | UX, Prototyping, Design Systems | `agent-profiles.ts:160`                                                      |
| Lens            | **NONE** (`lensIds: []`)        | `topology-defaults.ts:106` (only defaulted to `[]`; no assignment)           |

## Runtime identity (after topology build)

`normalizeAgentIdentity()` (`topology-defaults.ts:91-119`) copies the curated profile onto the
node config at startup, so at runtime the node carries: `displayName`, `firstName`, `lastName`,
`baseRole`, `specializations`, `avatar`, `provider='groq'`, `model='llama-3.3-70b-versatile'`.
The **system prompt is NOT overwritten** by the profile — it stays the hardcoded topology prompt
(`topology-defaults.ts:312-313`):

> "You are a product designer. Focus on user-centered design, interaction patterns, and visual
> hierarchy. Consider accessibility, consistency, and emotional impact." — `temperature: 0.5`,
> `tools: []`, `model: 'auto'` (overridden to groq/llama-3.3-70b-versatile by normalize).

**VERIFIED:** the profile model (groq/llama-3.3-70b-versatile) wins over `assignModelsToAgents`
because `normalizeAgentIdentity` runs last in the compose chain (`topology-defaults.ts:121-123`).

## Graph placement (topology)

- In-edge: `e-router-designer` `router → agent-designer` trigger `data_flow` (`topology-defaults.ts:479`)
- Out-edge: `e-designer-agg` `agent-designer → aggregator` trigger `on_success` (`topology-defaults.ts:531`)
- **INFERRED:** designer is reached through the semantic router and feeds the synthesis aggregator; it is a
  leaf contributor, not a coordinator.

## Prompt-audit grouping

Grouped as `'Creative'` alongside `agent-creative`, `agent-content`, `agent-ux`
(`prompt-audit-service.ts:22`). Used only for prompt-quality reporting, not behavior.

## Where used (UI surface)

Resolved identically for all 25 agents through `agentService.resolveAgent`
(`agent-service.ts:337`) → `resolveAgentIdentity` (`agent-identity.ts:62-144`) → `AgentAvatar`
(`AgentAvatar.tsx:47` reads `AGENT_PROFILES`-derived avatar). Surfaces:

- `AgentsPanel` — `AgentCard` (shows specializations `AgentCard.tsx:68-78`, provider/model `:164-169`),
  `AgentDetailPanel`, `AgentIdentityEditor`, `AgentWizard`, `AgentStatsDashboard`.
- `DebateAnalytics`, `DashboardPanel/AgentLiveBoard`, `AgentComparisonPanel`.
- `ForumPanel/AuthorBadge`, `DirectorPanel/AgentIdentityChip`, `DebateRuntimePanel/AgentControlPanel`.

**VERIFIED:** every consumer is generic — `agent-designer` is NOT special-cased in any UI file
(only 5 repo references total; none in UI components specifically).

## Related agents

- **Creative cluster** (same audit group): `agent-creative`, `agent-content`, `agent-ux`.
- **Graph neighbors:** `router` (source), `aggregator` (sink).
- **Role template** (unlinked): a generic `Product Designer` ROLE exists in `role-service.ts:221`
  but the node has no `roleId` binding.

## Systems that can invoke it

- **Debate** — as a participant (persona from node prompt + generic `persona-selector` variants).
- **ConversationCore / Director** — `resolveAgent` resolves it for scenario turns (`agent-service.ts:337`).
- **Invocation Engine (Room)** — human picks it; `DEFAULT_ROOM_POLICY` matches `human-mention` only
  and resolves the target from the human's pick (`phase21-invocation.ts:125-144`).
- **Manual spawn / groups** — `AgentService.spawnAgent` / `createGroup` (`agent-service.ts:392,667`).
- **NOT agent-initiated:** `allowAgentInitiatedInvocation:false` (`phase21-invocation.ts:137`).
