# 00_PROFILE — `agent-quality` (Noah Ferreira)

> Status legend used throughout this research set: **VERIFIED** (read in source), **INFERRED** (derived from source), **OPINION** (recommendation/judgement).

## Identity (VERIFIED — `src/kernel/state/agent-profiles.ts:132-141`)

- **Node id:** `agent-quality` (this id IS the system agent; it is a topology node, not a separate registry — `agent-service.ts:337` `resolveAgent` resolves from topology nodes only).
- **First / last name:** Noah Ferreira
- **Display name:** Noah Ferreira
- **Base role:** Quality Engineer
- **Avatar:** emoji `🎯`, color `#10b981`
- **Provider:** `groq`
- **Model (profile):** `llama-3.1-8b-instant`
- **Specializations:** `Test Automation`, `QA`, `Coverage`

## Topology binding (VERIFIED — `src/kernel/state/topology-defaults.ts:280-291`)

- Declared as a node of type `agent`, label `Quality Engineer`.
- Node `config.prompt`: "You are a quality engineer. Design testing strategies, identify coverage gaps, enforce quality gates. Consider unit, integration, e2e, and property-based testing."
- Node `config.temperature`: `0.2`
- Node `config.tools`: `CODER_TOOLS`
- Node `config.model`: **`'auto'`** (⚠️ this overrides the profile model at runtime — see 00/10/11).

## Graph edges (VERIFIED — `topology-defaults.ts`)

- `e-router-quality` (`router` → `agent-quality`, trigger `data_flow`) — `topology-defaults.ts:477`
- `e-quality-agg` (`agent-quality` → `aggregator`, trigger `on_success`) — `topology-defaults.ts:529`

## Lens (VERIFIED — NONE)

- `agent-profiles.ts` entry carries **no `lensIds`**; `resolveAgent` (`agent-service.ts:386`) returns `lensIds: []`.
- `src/kernel/services/lens-engine/lens-library.ts` defines **15 lenses**; **none** is a QA / test / coverage lens. Closest analytical lenses: `lens:critical`, `lens:security`, `lens:meta-meta`. So `agent-quality` is lens-less and its QA specialization is never amplified by a lens.

## Avatar resolution (VERIFIED)

- `AgentAvatar.tsx:47` `getAgentAvatar` reads `AGENT_PROFILES` → emoji `🎯`, color `#10b981`.
- `AgentIdentityView` (`agent-identity.ts:129-143`) builds from `resolveAgent` + `agentAvatarService`.

## Where it is used / referenced (VERIFIED)

- AgentsPanel (card/detail/wizard/avatar/compare/leaderboard) — renders all topology agents, so `agent-quality` appears there.
- Debate: selectable as a participant (`debate-runtime`); see 04.
- ConversationCore / Director: resolvable participant via `agentService.resolveAgent` (`agent-service.ts:337`).
- Invocation: human-pickable in RoomPanel via `AgentResolverDirectory` (`phase21-invocation.ts:44-57`).
- Default topology wiring: router can hand off to it; it aggregates onward.

## Related agents (INFERRED)

- Same "Engineering" neighbourhood in topology: `agent-critic` (Critical Auditor), `agent-data` (Data Scientist), `agent-research` (Research Analyst), `agent-designer`/`agent-ux`/`agent-creative`/`agent-content`. No explicit team/group is seeded for `agent-quality` (no `AgentGroup` seed references it — `agent-service.ts` groups loaded from KV, default empty).

## Systems that can invoke it (VERIFIED)

- Human via AgentsPanel (spawn/run), Debate UI participant picker, RoomPanel (Invocation, policy `human-mention`), Director scenario participants, and indirectly via the default topology `router`→`agent-quality` edge during autonomous runs.
