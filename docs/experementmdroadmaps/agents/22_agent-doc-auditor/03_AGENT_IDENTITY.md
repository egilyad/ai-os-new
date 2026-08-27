# 03_AGENT_IDENTITY — Identity Resolution for `agent-doc-auditor`

**VERIFIED.** `resolveAgentIdentity(id, deps)` (`src/kernel/services/agent-identity.ts:62-144`) is the single seam that turns a topology node into a UI-ready `AgentIdentityView`. Doc-auditor is resolved through it with no special branch.

## Resolution pipeline

1. `resolver ?? agentService` (`:66`) → defaults to the singleton `agentService` (`instances/services-core.ts:60`).
2. `resolver.resolveAgent(id)` (`:82`) → calls `agentService.resolveAgent('agent-doc-auditor')` (see `02_AGENT_SERVICE.md`, `00_PROFILE.md`). This is where the curated `nvidia`/`meta-llama-3.3-70b-instruct` + `🔍 #ec4899` + specializations come from.
3. **Avatar** (`:102-114`): prefers `resolved.avatar` (emoji+color+optional url) from the normalized profile; falls back to deterministic `agentAvatarService.generate(id)`; finally to `NEUTRAL_AVATAR` (`🤖 #64748b`).
4. **Lenses** (`:116-124`): `lensIds = resolved.lensIds ?? []`. For doc-auditor `lensIds === []` (profile has none, `topology-defaults.ts:106`), so `lensNames` is empty — no lens engine lookup occurs.
5. **Provider name** (`:126-127`): `PROVIDER_DISPLAY_NAMES[provider]` → `"NVIDIA"` (from `utils/provider-default-models`).

## Resulting `AgentIdentityView` for doc-auditor

| Field                   | Value                                           |
| ----------------------- | ----------------------------------------------- |
| id                      | `agent-doc-auditor`                             |
| displayName             | `Felix Moreau`                                  |
| firstName/lastName      | `Felix` / `Moreau`                              |
| baseRole                | `Documentation Auditor`                         |
| specializations         | `['Compliance','Review','Accuracy']`            |
| lensIds / lensNames     | `[]` / `[]`                                     |
| model                   | `meta/llama-3.3-70b-instruct`                   |
| provider / providerName | `nvidia` / `NVIDIA`                             |
| avatar                  | `{ emoji:'🔍', color:'#ec4899' }`               |
| systemPrompt            | the auditor prompt (`topology-defaults.ts:414`) |

## Graceful degradation

**VERIFIED.** The function never throws (`:58-100`): if `resolver`/`lensEngine` are unavailable it degrades — `displayName` falls back to the id, lens names fall back to ids, avatar to the deterministic glyph. For doc-auditor this path is not normally hit because `agentService` is always present.

## INFERRED

Because `resolveAgentIdentity` is the _only_ identity seam used by "Director, Debate, Chat, Workflows" (per the module doc-comment `agent-identity.ts:1-12`), doc-auditor presents identically across all those subsystems — its identity is never re-derived elsewhere.

## OPINION

Centralizing identity in one resolver is why adding/removing doc-auditor (or any agent) requires zero per-subsystem code. The cost is that any doc-auditor-specific visual or behavioral tweak must be expressed as data (profile/topology), not logic.
