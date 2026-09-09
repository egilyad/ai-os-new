# 01 — CURRENT STATE: what `agent-architect` ACTUALLY does now

> Honest, shared-infra view. `agent-architect` is a **topology node**; it has no private machinery. Everything below is shared infra reused by all 25 agents.

## Registration / creation (VERIFIED)

- Seed-defined in `agent-profiles.ts:52` and `topology-defaults.ts:183`. Loaded into the active `AuditorTopology` (`topology-defaults.ts:459`, 25 agents) at boot.
- Behavioral service `AgentService` registered in `phase4-agents-roles.ts:86` [per AGENTS.md], class `agent-service.ts:71` implements `IAgentResolver`.
- No agent-specific service, controller, or store exists for it.

## Persona / prompts (VERIFIED)

- Static prompt text only (`topology-defaults.ts:188`): senior system architect, scalability/modularity/clean-architecture, monolith vs microservices vs serverless trade-offs.
- `temperature: 0.2`, tools `CODER_TOOLS`, `model: 'auto'` → resolved to the profile provider/model (`groq`/`llama-3.3-70b-versatile`) at execution time via `resolveAgent` (`agent-service.ts:351-353`).
- Editable through `AgentIdentityEditor.tsx` (writes back into the topology node config).

## Selection / calls (VERIFIED + INFERRED)

- **Debate:** participant is added either by human choice or router dispatch. The _persona_ actually spoken in a debate comes from `PersonaSelector` (`persona-selector.ts:292`), which chooses a generic variant (cautious_scientist / technologist / strategist / …) by **topic keywords**, NOT by agent identity. [INFERRED] So the architect's "System Architect" identity is partly shadowed by a topic-matched generic persona layered on top of its system prompt.
- **ConversationCore / Director:** resolved 1:1 by `participantId` via `agentService.resolveAgent` (the Director's execution engine speaks _as_ the named agent — `agent-service.ts:337` doc comment :331-336).
- **Invocation:** `RoomPanel` human-picks it; `AgentResolverDirectory` (`phase21-invocation.ts:44`) wraps `agentService`; `resolveAgents` rejects unknown ids.

## Services in/out (VERIFIED)

- **In:** none agent-private. Shares `AgentService`, `agent-identity`, `AgentResolverDirectory`, `architectureReviewService` (but the latter does NOT use this agent — see 03/10).
- **Out / events:** emits NO agent-specific events. Its only footprint is generic:
  - `COGNITIVE_STEP_ACTIVE` + `COGNITIVE_STEP_COMPLETED` (`orchestration-service.ts:355,414`) carrying `nodeId: 'agent-architect'`.
  - Debate emits `debate:argument`, `debate:verdict:generated`, etc. — but these are session-scoped, not agent-scoped.
- **Stats:** `AgentService` consumes `COGNITIVE_STEP_COMPLETED` (`:184`) → per-node `AgentStats` (calls/tokens/latency/errors/cost), persisted to Dexie KV (`STATS_KEY` :68).
- **Journal:** `agent-journal-service.ts:130,150` records per `nodeId` from the same two events.

## Cognitive-stream participation (VERIFIED)

- Visible ONLY through `COGNITIVE_STEP_COMPLETED` stats/journal. `cognitive:decision:made` exists (`event-registry.ts:776`) but is **dead at consumer** [per AGENTS.md]. Debate emits NO cognitive events. So the architect's reasoning is invisible beyond "a step completed".

## Memory / context (VERIFIED)

- No agent-private memory. Generic `agent-journal-service` writes per-node journal entries (Dexie KV `agent_journal_v1`). ~16 memory stores exist in the system but are not architect-bound [per AGENTS.md]. No continuity of prior architect reasoning across sessions beyond the generic journal.

## UI (VERIFIED)

- Listed in `AgentsPanelView` / `AgentCard` (avatar 🏗️, name "System Architect", role, live status, stats).
- `AgentDetailPanel`, `AgentIdentityEditor` (edit persona), `AgentStatsDashboard`, `AgentObservabilityTab`, `LiveActivityStream`, `EloLeaderboard`, `AgentJournalPanel` all render it generically.
- Used as an identity chip in `DirectorPanel`, `DebateRuntimePanel/AgentControlPanel`, `ForumPanel/AuthorBadge`, `AgentComparisonPanel`, `DashboardPanel/AgentLiveBoard` [per AGENTS.md].

## Settings (VERIFIED)

- Editable: model, temperature, tools, prompt, lifecycle (pause/resume via `AgentService.toggleAgent` :460), groups. No architect-specific settings.

## Honest summary

`agent-architect` is a **well-described persona with zero bespoke machinery**. Its specializations (Distributed Systems / Event-Driven / Scalability) are decorative text — nothing routes to it specifically because of them, and nothing surfaces its architectural reasoning beyond generic step-completion stats.
