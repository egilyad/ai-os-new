# 15_DO_NOT_BUILD_YET — Ideas to AVOID for `agent-ux`

> Guardrails. **[OPINION]** unless tagged. The repo's discipline (AGENTS.md: events-first, no new buses/adapters, no globals in kernel) makes most of these violations.

## D1 — Do NOT create a bespoke "UXAgentService" class

- Why avoid: `agent-ux` is a **topology node**, not a service. A dedicated service would duplicate `AgentService` and violate the shared-infra model. **[VERIFIED]** (agents are nodes; `AgentService` is the single resolver, `agent-service.ts:71`).
- Instead: extend via lens / persona / memory-tag / scenario (Roadmap A).

## D2 — Do NOT add a new event bus or "ux-events" channel

- Why avoid: duplicates the EventBus; breaks the event-sourcing audit trail. **[VERIFIED]** (`event-registry.ts` is the single source; events-first rule).
- Instead: reuse `COGNITIVE_*` / `INVOCATION_*` / `DEBATE_*` / `CONVERSATION_*` events.

## D3 — Do NOT give agent-ux autonomous self-invocation

- Why avoid: Invocation authority = human (D6); agents never self-invoke. **[VERIFIED]** (`phase21-invocation.ts:137 allowAgentInitiatedInvocation:false`).
- Instead: expertise-match _suggestion_ only (Q5).

## D4 — Do NOT spin up 25 mini-frameworks (one per agent)

- Why avoid: The prompt explicitly warns against "25 mini-frameworks." Each agent must stay a node + profile; differentiation comes from shared extension points (lenses, personas, scenarios, memory tags). **[OPINION]** but aligned with AGENTS.md.
- Instead: if a capability (e.g., UX lens) proves broadly useful, generalize it, don't fork per-agent.

## D5 — Do NOT hardcode UX heuristics into the executor

- Why avoid: couples domain logic to the LLM execution hot path (see 14-B risk). **[VERIFIED]** executor is generic (`chat-executor.ts`, `debate-agent-executor.ts`).
- Instead: lens + persona + memory, kept out of the executor core.

## D6 — Do NOT upgrade agent-ux to a huge model by default

- Why avoid: `llama-3.1-8b-instant` is a deliberate cost/latency choice; silently switching to a 70B model raises cost and may break the small/fast UX-review UX. **[OPINION]**
- Instead: expose model choice in `AgentIdentityEditor` (already exists) and let the human pick per task.

## D7 — Do NOT build a standalone UX "app" / route

- Why avoid: there is no agent-specific route need; the agent is reachable via AgentsPanel, DirectorPanel, RoomPanel, Debate. A new route fragments navigation. **[OPINION]**
- Instead: surface UX affordances inside existing panels (09 UI_UX).

## D8 — Do NOT persist UX findings in a new Dexie table

- Why avoid: schema already at v20; a 21st table for one agent violates "no agent-specific storage." **[VERIFIED]** (Dexie versioning discipline, AGENTS.md P2.19).
- Instead: tag generic `MemoryEntry` with `agent:agent-ux` (M3).

## Bottom line

Every "do not build" item is a violation of an existing, verified discipline. The right move is **extension, not invention**. **[OPINION]**
