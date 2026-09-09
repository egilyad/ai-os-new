# 00_PROFILE — `agent-lead` (Victor Soto)

> RESEARCH-ONLY deep-dive. No source changes. All claims tagged VERIFIED / INFERRED / OPINION with `file:line`.

## Identity (VERIFIED)

| Field           | Value                                 | Source                                      |
| --------------- | ------------------------------------- | ------------------------------------------- |
| Node id         | `agent-lead`                          | `src/kernel/state/topology-defaults.ts:369` |
| Display name    | Victor Soto                           | `src/kernel/state/agent-profiles.ts:205`    |
| First / Last    | Victor / Soto                         | `agent-profiles.ts:203-204`                 |
| Base role       | Team Lead                             | `agent-profiles.ts:206`                     |
| Avatar          | emoji `⚡`, color `#f59e0b`           | `agent-profiles.ts:207`                     |
| Provider        | `nvidia`                              | `agent-profiles.ts:208`                     |
| Model           | `meta/llama-3.3-70b-instruct`         | `agent-profiles.ts:209`                     |
| Specializations | Mentoring, Coordination, Architecture | `agent-profiles.ts:210`                     |

## Topology placement (VERIFIED)

- `agent-lead` is a **topology node** (`type:'agent'`) in `AuditorTopology` (`topology-defaults.ts:369-378`), one of 25 curated agents (`AGENT_PROFILES` count = 25: `agent-profiles.ts:21`).
- `normalizeAgentIdentity` (`:91-118`) overlays `AGENT_PROFILES['agent-lead']` onto the node config at boot, so the node carries `displayName`, `provider:'nvidia'`, `model:'meta/llama-3.3-70b-instruct'`, avatar, specializations. **Note:** the node's own `config.model` is `'auto'` (`:377`) but is overwritten by the profile to the explicit nvidia model.
- Edges: `e-router-lead` router → agent-lead (`topology-defaults.ts:484`); `e-lead-agg` agent-lead → aggregator (`topology-defaults.ts:536`).
- Node `prompt` (the acted system prompt): _"You are a technical team lead. Guide development, mentor team members, unblock obstacles, and ensure code quality. Balance technical excellence with delivery velocity."_ (`topology-defaults.ts:374`). `temperature:0.25`, `tools: CODER_TOOLS`.

## Persona (INFERRED)

`agent-lead` is **generic infra** — there is no lead-specific behavior anywhere in the kernel. The node is identical in machinery to the other 24 agents; only the label, prompt, avatar, provider/model, and specializations differ. The "Team Lead" framing exists only in (a) the system prompt text, (b) the displayed role, and (c) the `prompt-audit-service` grouping (see below). No coordinator/manager orchestration logic keys on this agent.

## Avatar resolution (VERIFIED)

- UI: `AgentCard` calls `resolveAgentIdentity(agent.id)` (`AgentCard.tsx:23`) → `agent-identity.ts:62` → `agentAvatarService.generate` falls back to hash, but the node config avatar (`⚡`/`#f59e0b`) is preferred (`agent-identity.ts:102-114`). So the card shows `⚡` `#f59e0b`, NOT the hash glyph.
- `AgentAvatar.getAgentAvatar` (`AgentAvatar.tsx:47`) is a hash fallback used only when no identity emoji/color is passed.

## Where used (VERIFIED — per AGENTS.md, confirmed by file presence)

- AgentsPanel: `AgentsPanelView`, `AgentCard`, `AgentDetailPanel`, `AgentIdentityEditor`, `AgentWizard`, `AgentAvatar` (`src/components/AgentsPanel/`).
- Consumed/embedded in: DebateAnalytics, DashboardPanel/AgentLiveBoard, AgentComparisonPanel, ForumPanel/AuthorBadge, DirectorPanel/AgentIdentityChip, DebateRuntimePanel/AgentControlPanel (AGENTS.md "SHARED SYSTEM CONTEXT").
- `prompt-audit-service` groups `agent-lead` under `'Management'` (`prompt-audit-service.ts:20`), alongside `agent-pm`, `agent-po`.

## Related agents (VERIFIED)

- Same `Management` audit group: `agent-pm` (Dana Whitfield), `agent-po` (Sofia Romano) (`prompt-audit-service.ts:18-20`).
- Topology peers: router, aggregator, 24 other specialized agents (`topology-defaults.ts:121-456`).
- In debates/rooms/groups agent-lead is a peer of any selected agent set.

## Systems that can invoke it (VERIFIED / INFERRED)

| System                          | Can invoke agent-lead?                                 | Source                                        |
| ------------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| AgentService (topology execute) | Yes — it is a topology node                            | `agent-service.ts:764 executeSingleNode`      |
| Debate runtime                  | Yes — if added as participant                          | `debate-agent-executor.ts:45 findParticipant` |
| ConversationCore / Director     | Yes — via `resolveAgent` for turns                     | `agent-service.ts:337` (comment `:331-336`)   |
| Invocation Engine (Room)        | Yes — human picks any agent                            | `phase21-invocation.ts:43-58` + RoomPanel     |
| Groups / executeGroup           | Yes — add to a group                                   | `agent-service.ts:667-762`                    |
| Auto-spawn clones               | Only as a source to clone, never auto-promoted to lead | `agent-service.ts:640-651`                    |

## Lens (VERIFIED — NONE)

`agent-lead` has **no `lensIds`**. `normalizeAgentIdentity` sets `lensIds:[]` when undefined (`topology-defaults.ts:106`). `resolveAgentIdentity` returns empty `lensNames` (`agent-identity.ts:116-124`). The `LENS_LIBRARY` (`lens-library.ts`) contains no leadership/architecture/coordination lens — relevant lenses are `lens:security` (architecture domain) and `lens:meta-consensus` / `lens:meta-dissent` (consensus), but none are bound to this agent. **So agent-lead currently runs "lens-less".**
