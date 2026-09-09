# 00_PROFILE — `agent-ux` (Theo Nakamura)

> RESEARCH-ONLY deep-dive. No source changes. All claims tagged **[VERIFIED]** (read from source), **[INFERRED]** (derived from shared infra), or **[OPINION]** (recommendation/assumption).

## Identity (canonical, source of truth = topology node + `AGENT_PROFILES`)

| Field           | Value                                                                                                                                                     | Evidence                                                                                                                             |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Node ID         | `agent-ux`                                                                                                                                                | `src/kernel/state/agent-profiles.ts:172`, `src/kernel/state/topology-defaults.ts:331`                                                |
| Display name    | Theo Nakamura                                                                                                                                             | `agent-profiles.ts:175`                                                                                                              |
| First / Last    | Theo / Nakamura                                                                                                                                           | `agent-profiles.ts:173-174`                                                                                                          |
| Base role       | UX Researcher                                                                                                                                             | `agent-profiles.ts:176`                                                                                                              |
| Avatar          | 🔍 `#06b6d4`                                                                                                                                              | `agent-profiles.ts:177`                                                                                                              |
| Provider        | `groq`                                                                                                                                                    | `agent-profiles.ts:178`                                                                                                              |
| Model           | `llama-3.1-8b-instant` (8B, small/fast)                                                                                                                   | `agent-profiles.ts:179`                                                                                                              |
| Specializations | User Research, Usability, Interviews                                                                                                                      | `agent-profiles.ts:180`                                                                                                              |
| Lens            | **NONE** — no `lensIds` assigned; lens library has no UX/research lens                                                                                    | `lens-engine/lens-library.ts:1-313` (11 lenses, none UX/research); `topology-defaults.ts:106` sets `lensIds: []` for profiled agents |
| System prompt   | "You are a UX researcher. Analyze user behavior, identify pain points, and propose evidence-based improvements. Use heuristics and usability principles." | `topology-defaults.ts:334-340`                                                                                                       |
| temperature     | 0.35 (low — conservative)                                                                                                                                 | `topology-defaults.ts:337`                                                                                                           |
| tools           | `SEARCH_TOOLS`                                                                                                                                            | `topology-defaults.ts:338`                                                                                                           |
| model in node   | node declares `model:'auto'` but `normalizeAgentIdentity` **overrides** with `profile.model` → `llama-3.1-8b-instant`                                     | `topology-defaults.ts:96-105`                                                                                                        |

## Where the identity comes from (the merge pipeline)

`AGENT_PROFILES['agent-ux']` (`agent-profiles.ts:172-181`) is NOT the runtime identity by itself. At topology build time, `normalizeAgentIdentity()` (`topology-defaults.ts:91-119`) copies `displayName, firstName, lastName, baseRole, specializations, avatar, provider, model, lensIds` from the profile into the **node config**. So the live agent node `agent-ux` carries the 🔍/`#06b6d4` avatar and the `groq`/`llama-3.1-8b-instant` model. `resolveAgentIdentity()` (`agent-identity.ts:62-144`) then reads the node (via `agentService.resolveAgent`) and surfaces `avatar`, `specializations`, `providerName`, etc. to the UI.

**[VERIFIED]** The avatar shown for `agent-ux` is 🔍/`#06b6d4` (from `profile.avatar`, merged at `topology-defaults.ts:103`), NOT the hash-derived fallback in `AgentAvatar.tsx:47` (which is only used when a node has no curated profile, see `topology-defaults.ts:112-115`).

## Topological wiring (how it receives work)

- Incoming edge: `e-router-ux` router → `agent-ux` (`trigger: 'data_flow'`) — `topology-defaults.ts:481`
- Outgoing edge: `e-ux-agg` `agent-ux` → aggregator (`trigger: 'on_success'`) — `topology-defaults.ts:533`
- So in the default multi-agent topology, `agent-ux` is an ordinary middle-stage agent: it receives router output, runs its UX-researcher prompt, and passes results to the aggregator.

## Prompt-audit grouping

`prompt-audit-service.ts:24` groups `agent-ux` under `'Creative'` for prompt-quality auditing (alongside `agent-creative`, `agent-designer`, `agent-content`). **[VERIFIED]** This is a cosmetic grouping only — it has no effect on behavior or model selection.

## Systems that can invoke `agent-ux`

| System                           | How                                                                                                            | Evidence                                                                      |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Debate runtime                   | Added as a participant; speaks via `debate-agent-executor` with node system prompt + `PersonaSelector` overlay | `debate-runtime/debate-agent-executor.ts:38-117`, `persona-selector.ts:1-309` |
| ConversationCore / Director      | As a `TurnProposal.participantId` in a scenario                                                                | `conversation-director-service.ts` (B3), `conversation-orchestrator.ts:55-60` |
| Invocation Engine (RoomPanel)    | Human picks any registered agent; `AgentResolverDirectory` wraps `agentService`                                | `phase21-invocation.ts:43-58,151-167`; RoomPanel human picker                 |
| AgentService groups / auto-spawn | `executeGroup`, `evaluateAutoSpawn`                                                                            | `agent-service.ts:614-665, 688-762`                                           |
| Orchestrator (topology)          | `orchestrator.execute` routes work to the node                                                                 | `agent-service.ts:48-57`                                                      |

## Related agents (same topology cohort)

- Creative cluster (per prompt-audit): `agent-creative`, `agent-designer`, `agent-content`, `agent-ux`
- Knowledge/cognitive peers used in the same pipelines: `agent-research`, `agent-data`, `agent-critic`, `agent-ethics`
- Router/aggregator siblings that feed/consume `agent-ux` in the default topology.

## Bottom line

`agent-ux` is a **pure topology node + curated profile**. There is **no bespoke source code** that specifically targets `agent-ux` beyond the two static data definitions (`agent-profiles.ts`, `topology-defaults.ts`) and the prompt-audit group key. Every capability it has is shared infrastructure that any agent node gets. **[VERIFIED]** (grep for `agent-ux` returns only `topology-defaults.ts` ×3, `agent-profiles.ts` ×1, `prompt-audit-service.ts` ×1).
