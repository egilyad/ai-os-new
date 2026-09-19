# 00_PROFILE — `agent-critic`

> Research-only deep-dive. No source changes. Verified against repo on 2026-08-15.

## Identity (VERIFIED — `src/kernel/state/agent-profiles.ts:102-111`)

| Field           | Value                                       | Source                                            |
| --------------- | ------------------------------------------- | ------------------------------------------------- |
| Node id         | `agent-critic`                              | `agent-profiles.ts:102` (key of `AGENT_PROFILES`) |
| First name      | Greta                                       | `agent-profiles.ts:103`                           |
| Last name       | Lindqvist                                   | `agent-profiles.ts:104`                           |
| Display name    | Greta Lindqvist                             | `agent-profiles.ts:105`                           |
| Base role       | Critical Auditor                            | `agent-profiles.ts:106`                           |
| Avatar          | 🔍 `#ec4899`                                | `agent-profiles.ts:107`                           |
| Provider        | `nvidia`                                    | `agent-profiles.ts:108`                           |
| Model           | `meta/llama-3.3-70b-instruct`               | `agent-profiles.ts:109`                           |
| Specializations | Critical Analysis, Fallacy Detection, Logic | `agent-profiles.ts:110`                           |

## Persona / system prompt (VERIFIED — `src/kernel/state/topology-defaults.ts:245-255`)

The topology node carries its own `prompt` (distinct from the profile):

- `roleName`: Critical Auditor
- `prompt`: "You are a critical auditor. Find weaknesses, edge cases, and logical fallacies. Leave no assumption unchecked. Provide concrete improvement suggestions." (`topology-defaults.ts:250`)
- `temperature`: 0.1 (very low — deliberately deterministic/skeptical)
- `tools`: `SECURITY_TOOLS`
- `model`: `'auto'` in the node definition, **overridden** by the profile during `normalizeAgentIdentity` (`topology-defaults.ts:96-106`) → effectively `meta/llama-3.3-70b-instruct` on `nvidia`.

**Important nuance (VERIFIED):** Although the node sets `model: 'auto'`, `normalizeAgentIdentity` copies `profile.model` over the node's model (`topology-defaults.ts:105`). So at runtime the critic's effective model is the profile's `meta/llama-3.3-70b-instruct`, not `auto`. This is the only mechanism that injects the profile's provider/model into runtime behavior.

## Role in `role-service.ts` (VERIFIED — `src/kernel/services/role-service.ts:141-152`)

A built-in role `r-critic` ("Critical Auditor") exists with:

- `baseTemperature`: 0.1
- `systemPrompt` overlapping the topology prompt
- `capabilities: []` (empty), `permissions: DEFAULT_ROLE_PERMISSIONS.analytical`

The role and the agent node are **two separate registries**; the topology node is the deployed identity, the role is a template. There is no code linking `r-critic` → `agent-critic` automatically.

## Lens (VERIFIED / INFERRED)

- A `lens:critical` ("Critical Lens") exists in `src/kernel/services/lens-engine/lens-library.ts:11-41` with questions about hidden assumptions, counterexamples, data that would change the conclusion.
- **It is NOT bound to `agent-critic`.** Grep for `lensIds` across `agent-profiles.ts` returns **zero** matches (`lensIds` is never set on any profile). `normalizeAgentIdentity` sets `lensIds = []` for every agent (`topology-defaults.ts:106, 111`).
- **Conclusion:** the "Critical Analysis / Fallacy Detection / Logic" specialization and the `lens:critical` are independent, unconnected assets. Nothing auto-applies the critical lens when the critic runs.

## Avatar resolution (VERIFIED — `src/components/AgentsPanel/AgentAvatar.tsx:47-54`)

- `getAgentAvatar(id)` is a **deterministic fallback** (hash → emoji/color from fixed lists) used only when no canonical avatar is supplied.
- For `agent-critic`, the canonical `avatar` (`🔍 #ec4899`) comes from the profile via `normalizeAgentIdentity` (`topology-defaults.ts:103`), so the fallback is **not** used for this agent. `AgentIdentityView.avatar` (`agent-identity.ts:102-114`) prefers `cfgAvatar` (profile) over the hash fallback.

## Where the agent is used (VERIFIED)

- **Default topology node** (`topology-defaults.ts:245-255`) with edges `router → agent-critic → aggregator` (`topology-defaults.ts:473, 525`). So in a standard topology run, the critic is a first-class participant after the router.
- **AgentsPanel** — listed via `AgentService.getAgents()` (`agent-service.ts:306-329`), rendered as `AgentCard`.
- **DirectorPanel ParticipantsField** — generic participant picker; can select `agent-critic`.
- **RoomPanel** — listed in the human agent-picker (`RoomPanel.tsx:89-95`); any human can invoke it.
- **prompt-audit-service** groups it as `'Analytical'` (`prompt-audit-service.ts:25`) — UI grouping only.
- No special-cased UI component exists that is _exclusive_ to `agent-critic`.

## Related agents (VERIFIED)

- Analytical cluster (same `prompt-audit` group, `prompt-audit-service.ts:25-29`): `agent-data`, `agent-research`, `agent-risk`, `agent-ethics`, `agent-critic`.
- Topology neighbors: `router` (incoming) and `aggregator` (outgoing) (`topology-defaults.ts:473, 525`).

## Systems that can invoke it (VERIFIED / INFERRED)

| System                      | Can invoke?              | Evidence                                                                 |
| --------------------------- | ------------------------ | ------------------------------------------------------------------------ |
| Topology runtime (default)  | Yes (automatic)          | `topology-defaults.ts:245-255,473,525`                                   |
| Debate (manual participant) | Yes (human-selected)     | agent is a registered agent node; debate participants chosen by user     |
| ConversationCore / Director | Yes (manual)             | `agentService.resolveAgent('agent-critic')` works; Director participants |
| Invocation Engine / Room    | Yes (human-selected)     | `RoomPanel.tsx:89-141`; `phase21-invocation.ts:43-57`                    |
| Auto-spawn / auto-clone     | Yes (clone of any agent) | `agent-service.ts:614-665` clones an existing agent config               |
| Cognitive event trigger     | No automatic trigger     | no expertise-match auto-invoke wired for this agent                      |
| Scheduler                   | Not wired                | no scheduler→agent-critic specific binding found                         |
