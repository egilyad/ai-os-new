# 01_IDENTITY — `agent-doc-historian`

How the agent is resolved into a UI-ready identity, and the single source-of-truth rule.

## VERIFIED

- **Single source of identity**: the topology node, surfaced through `IAgentResolver` (`AgentService`). There is exactly ONE registry. `src/kernel/services/agent-identity.ts:1-12` documents this contract explicitly.
- `resolveAgentIdentity(id, deps)` (`agent-identity.ts:62-144`) builds an `AgentIdentityView` from `resolver.resolveAgent(id)`, the `lens-engine` (for lens names), and `agentAvatarService` (deterministic emoji+color). It **never throws** (`:79-100` null-safe).
- `AgentService.resolveAgent(id)` (`src/kernel/services/agent-service.ts:337-390`) returns: `id`, `name` (node label `Historian Agent`), `role`, `systemPrompt` (topology prompt), `model` (`undefined` when node model is `'auto'`), `displayName`, `firstName`, `lastName`, `baseRole`, `specializations` (from node config), `lensIds`, `provider`, `avatar`.
- For `agent-doc-historian`, the node config has **no** `firstName`/`lastName`/`displayName`/`avatar`/`lensIds` keys (`topology-defaults.ts:433-443`). Therefore `resolveAgent` returns `firstName/lastName/avatar/lensIds` as `undefined` (`:379-388`). The human-friendly `Oscar Vilhelm` / 📚 / `#6366f1` come ONLY from `AGENT_PROFILES`, surfaced when `resolveAgent` is fed the profile-augmented config.
- `agent-identity.ts` obtains `agentService` and `agentAvatarService` via `src/kernel/instances/services-core.ts` and `services-extras.ts` (`:17-18`).
- Provider display name: `PROVIDER_DISPLAY_NAMES['openrouter']` resolves to a human label via `resolveAgentIdentity` (`:126-127`). VERIFIED `openrouter` is a valid key (provider-default-models).
- `avatar` resolution precedence (`agent-identity.ts:102-114`): `cfgAvatar.url` → `cfgAvatar.emoji` → deterministic fallback glyph (`🤖`, `#64748b`). The historian's emoji/color are set in `AGENT_PROFILES.avatar` (`:257`); the topology node has no `avatar` key, so the node-side `cfgAvatar` is `undefined` and the identity view falls back to a deterministic glyph **unless** `resolveAgent` merges profile data. **INFERRED**: profile data is the de-facto carrier of the emoji/color.

## INFERRED

- Consumers that call `resolveAgentIdentity('agent-doc-historian')` (Director, Debate, Chat, Workflows — see `agent-identity.ts:10`) all get a consistent view because they share `agentService`. This is the design intent.
- `specializations` returned by `resolveAgent` come from node `config.specializations`, which is absent on the topology node (`:385` → `[]`). The profile `specializations: ['Changelog','Context','Lineage']` are NOT auto-merged into the node config. **VERIFIED GAP**: as a bare topology node, `resolveAgent` yields `specializations: []`; the profile array is only visible where `AGENT_PROFILES` is read directly (e.g. `getAgents()` mapping in `AgentService` if it merges profiles — but `getAgents()` at `:306-329` reads only `node.config.roleName` and topology, NOT `AGENT_PROFILES`).

## OPINION

- The split means `agent-doc-historian`'s specializations are effectively invisible to the runtime resolver. If any routing logic ever keys off `resolveAgent().specializations`, the historian would look unspecialized.
