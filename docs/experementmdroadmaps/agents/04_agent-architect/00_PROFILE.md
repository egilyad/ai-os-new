# 00 — PROFILE: `agent-architect`

> VERIFIED from source unless marked [INFERRED] / [OPINION].

## Identity (VERIFIED — `src/kernel/state/agent-profiles.ts:52-61`)

- **Node id:** `agent-architect` (this IS the system agent; it is a topology node, not a standalone service).
- **Display name:** Marcus Hale
- **Base role:** System Architect
- **Avatar:** emoji `🏗️`, color `#8b5cf6`
- **Provider / model:** `groq` / `llama-3.3-70b-versatile`
- **Specializations:** Distributed Systems, Event-Driven, Scalability

## Topology node (VERIFIED — `src/kernel/state/topology-defaults.ts:183-193`)

- Type `agent`, label "System Architect".
- Config: `roleName: 'System Architect'`, `prompt: 'You are a senior system architect. Focus on scalability, modularity, and clean architecture patterns. Evaluate trade-offs between monolith, microservices, and serverless.'`, `temperature: 0.2`, `tools: CODER_TOOLS`, `model: 'auto'`.
  - **Note:** the node uses `prompt`, NOT `systemPrompt`. `AgentService.resolveAgent` (`agent-service.ts:345-350`) falls back to `prompt` when `systemPrompt` is absent, so the architect text is what gets surfaced as the system prompt in conversations/debates.
- **Edges (VERIFIED — `topology-defaults.ts`):**
  - `e-router-architect` (:467): `router → agent-architect` (trigger `data_flow`).
  - `e-architect-agg` (:519): `agent-architect → aggregator` (trigger `on_success`).
  - [INFERRED] In the default workforce topology the router can dispatch to the architect, and its output feeds the aggregator.

## Lens (VERIFIED — none assigned)

- The node config carries **no `lensIds`**. The lens library contains lenses _applicable to_ `architecture` taskType (e.g. `lens:security` — `lens-library.ts:82` declares `taskTypes: ['architecture','review','deploy']`), but **none is bound to this agent.** So `agent-architect` currently operates without any lens.

## Where used / surfaced (VERIFIED)

- **Agent roster:** `AgentService.getAgents()` (`agent-service.ts:306`) enumerates it from the active topology.
- **UI identity:** resolved through `resolveAgentIdentity` (`agent-identity.ts:62`) which reads `agentService.resolveAgent` + `agentAvatarService`.
- **Debate / Conversation / Invocation:** selectable as a participant (see 04/05/06).
- **Related agents:** peers in the technical cluster — `agent-security`, `agent-devops`, `agent-database`, `agent-perf`, `agent-network` (all same `router→…→aggregator` pattern).
- **Distinct from:** the `architectureReviewService` (`architecture-review-service.ts:99`) + `ArchitectureReview.tsx` route `arch-review` (`nav.architecture_review`). That is a **static code analyzer**, NOT this agent (see 03/10).

## Systems that can invoke it (VERIFIED)

- Human via **RoomPanel** (Invocation Engine, `phase21-invocation.ts`) — manual policy `Manual Room Chat (human-selected agent)` matches `source: 'human-mention'` and lets a human pick ANY registered agent including `agent-architect` (`room-invocation-e2e.integration.test.tsx:247-282`).
- Debate runtime as an explicit/router-selected participant.
- ConversationCore / Director scenario participant.
- Agent groups (`AgentService.executeGroup`).
