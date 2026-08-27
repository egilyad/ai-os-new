# 00_PROFILE — `agent-network` (Nadia Volkov, Network Engineer)

> Research-only deep-dive. No source modified.

## Canonical identity (VERIFIED)

- **Node id:** `agent-network` — `src/kernel/state/agent-profiles.ts:22-31` (key in `AGENT_PROFILES` Record).
- **First / last name:** Nadia Volkov — `agent-profiles.ts:23-24`.
- **Display name:** `Nadia Volkov` — `agent-profiles.ts:25`.
- **Base role:** `Network Engineer` — `agent-profiles.ts:26`.
- **Avatar:** emoji `🌐`, color `#06b6d4` — `agent-profiles.ts:27`.
- **Provider:** `groq` — `agent-profiles.ts:28`.
- **Model:** `llama-3.3-70b-versatile` — `agent-profiles.ts:29`.
- **Specializations:** `['TCP/IP', 'SDN', 'Latency Optimization']` — `agent-profiles.ts:30`.

## Identity applied to the topology node (VERIFIED)

- The default topology defines node `agent-network` (`src/kernel/state/topology-defaults.ts:145-155`) with:
  - `label: 'Network Engineer'`, `roleName: 'Network Engineer'`
  - `prompt: 'You are a network engineer. Evaluate communication protocols, topology design, and data flow. Focus on latency, throughput, and fault tolerance.'` — `topology-defaults.ts:150`
  - `temperature: 0.2`, `tools: []`, `model: 'auto'` (overridden below)
- `normalizeAgentIdentity()` (`topology-defaults.ts:91-119`) copies the curated profile onto the node config: `displayName`, `firstName`, `lastName`, `baseRole`, `specializations`, `avatar`, `provider`, **and `model`**. So the node's effective model is **`llama-3.3-70b-versatile`** (groq), NOT `'auto'` — `topology-defaults.ts:96-106`.
- The node is listed in the comment block "3 dynamic agents (no fixed provider/model)" at `topology-defaults.ts:143`, but that comment is MISLEADING: the profile supplies a fixed groq model. The data wins.

## Persona / system prompt (VERIFIED)

- The behavioral "persona" is the node `prompt` from `topology-defaults.ts:150` (network engineer, protocols/topology/data-flow, latency/throughput/fault-tolerance), temperature `0.2`.
- The curated profile fields (specializations, avatar, name) are **identity/display metadata**, not part of the LLM system prompt. There is no separate "persona" object for this agent.
- Specializations (`TCP/IP`, `SDN`, `Latency Optimization`) are **not** woven into the system prompt and are **not** used by the debate persona selector (see 04_DEBATE_ROLE). They are used for: (a) UI display, (b) invocation-by-expertise matching (`invocation-engine-service.ts:171-173`).

## Lens (VERIFIED)

- **No networking-specific lens exists.** The lens library (`src/kernel/services/lens-engine/lens-library.ts`) contains 11 lenses: `critical, second-order, security, economic, multi-stakeholder, meta-consensus, meta-dissent, meta-uncertainty, optimistic, long-term, meta-meta`.
- `normalizeAgentIdentity` sets `lensIds: []` for nodes without an explicit `lensIds` (`topology-defaults.ts:106`), so `agent-network` has **zero lenses attached**. `agent-identity.ts:116-124` resolves lens names from these ids.

## Where used in the system (VERIFIED)

- The node participates in the **default topology graph**:
  - Incoming edge `e-router-network`: `router → agent-network` (`topology-defaults.ts:471`) — the Mission Router can route tasks to it.
  - Outgoing edge `e-network-agg`: `agent-network → aggregator` (`topology-defaults.ts:523`) — its output flows to the Synthesis Aggregator.
- Resolved everywhere via `AgentService.getAgents()` / `resolveAgent()` (`agent-service.ts:306,337`), which reads the active topology node.
- Rendered in UI through `resolveAgentIdentity()` (`agent-identity.ts:62`) and `AgentAvatar` (`src/components/AgentsPanel/AgentAvatar.tsx:47` deterministic fallback; canonical emoji/color from node config).
- Consumed by: Debate (participant), ConversationCore/Director (participant), Invocation (human-invoked), Forum `AuthorBadge`, Director `AgentIdentityChip`, Dashboard `AgentLiveBoard`, Debate `AgentControlPanel` (per AGENTS.md UI list).

## Related agents (INFERRED)

- **`router`** (Mission Router) — upstream dispatcher that may route network tasks to it (`topology-defaults.ts:471`).
- **`aggregator`** (Synthesis Aggregator) — downstream consumer of its output (`topology-defaults.ts:523`).
- **`agent-architect`** (System Architect, distributed systems / scalability) and **`agent-security`** (Security Engineer, Zero Trust) — natural collaboration partners for network design + security trade-offs.
- **`agent-devops`** (Kubernetes/observability) — operational counterpart for latency/throughput concerns.
- No seeded agent group (`AgentService.groups`) or team currently includes `agent-network` (VERIFIED by inspecting `agent-service.ts` — groups are user-created, none seeded).

## Systems that can invoke it (VERIFIED)

1. **Debate runtime** — when configured as a participant (pro/con/neutral). Side is a user/debate-config choice; not derived from specialization.
2. **ConversationCore / Director** — as a scenario participant (`conversation-director-service.ts`, `ChatExecutionEngine` resolves the persona+model).
3. **Invocation Engine / RoomPanel** — a human can pick `agent-network` from the agent dropdown and invoke it in `chat` / `debate` / `director-scenario` mode (`RoomPanel.tsx:89-95,121-141`; `phase21-invocation.ts:125-144` seeds the `Manual Room Chat (human-selected agent)` policy that permits any registered agent for `source: 'human-mention'`).
4. **Topology orchestrator / auto-spawn** — `AgentService.spawnAgent` / `executeGroup` can run it as a node (`agent-service.ts:392,688`).

## Summary table

| Field           | Value                             | Source                                   |
| --------------- | --------------------------------- | ---------------------------------------- |
| node id         | `agent-network`                   | agent-profiles.ts:22                     |
| name            | Nadia Volkov                      | agent-profiles.ts:23-25                  |
| role            | Network Engineer                  | agent-profiles.ts:26                     |
| avatar          | 🌐 #06b6d4                        | agent-profiles.ts:27                     |
| provider/model  | groq / llama-3.3-70b-versatile    | agent-profiles.ts:28-29                  |
| specializations | TCP/IP, SDN, Latency Optimization | agent-profiles.ts:30                     |
| system prompt   | network-engineer prompt           | topology-defaults.ts:150                 |
| temp / tools    | 0.2 / none                        | topology-defaults.ts:151-152             |
| lens            | none                              | topology-defaults.ts:106                 |
| debate side     | not auto-assigned                 | debate-prompt-builder / persona-selector |
