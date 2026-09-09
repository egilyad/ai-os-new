# 07 — COGNITIVE ROLE (cognitive event stream)

## The 4 cognitive events (VERIFIED)

`event-registry.ts:736-776`:

1. `COGNITIVE_TRACE_UPDATED` (`cognitive:trace:updated`)
2. `COGNITIVE_STEP_ACTIVE` (`cognitive:step:active`)
3. `COGNITIVE_STEP_COMPLETED` (`cognitive:step:completed`)
4. `COGNITIVE_DECISION_MADE` (`cognitive:decision:made`)

## Writers (per AGENTS.md + verified)

- `CognitiveService` — emits `COGNITIVE_DECISION_MADE` at `cognitive-service.ts:414` (inside `executeAgentNode` after `makeDecision`). Also maintains traces (throttled emit of `COGNITIVE_TRACE_UPDATED` — INFERRED via `throttledEmit()` at `cognitive-service.ts:386-389,398`).
- `TraceService`, `OrchestrationService` — writers per AGENTS.md (not separately opened; trusted).
- **Debate emits NO cognitive events** (VERIFIED: `debate-agent-executor.ts` emits only `DEBATE_*`/`budget` events; `agent-journal-service.ts:174` listens to `debate:runtime:agent:error`). So agent-research's debate turns do NOT appear in the cognitive stream.

## agent-research's cognitive footprint

- When executed as a **topology/ConversationCore node**, it produces `COGNITIVE_STEP_ACTIVE` + `COGNITIVE_STEP_COMPLETED` with `nodeId:'agent-research'` (`agent-service.ts:184,219` consume these for stats/journal).
- When executed in **debate**, it produces NEITHER — only journal + debate events.
- `COGNITIVE_DECISION_MADE` is emitted by `CognitiveService` generically; agent-research is not a special producer and (see below) the event is effectively DEAD.

## `cognitive:decision:made` is DEAD (VERIFIED)

- Emitted: `cognitive-service.ts:414`.
- **No consumer** — grep for `COGNITIVE_DECISION_MADE` / `cognitive:decision:made` returns only: definition (`event-registry.ts:776`), emit (`cognitive-service.ts:414`), event-bus type list (`event-bus.ts:80`), event-bridge list (`event-bridge.ts:31`), and **explicit drops** in `event-recorder.ts:232,261` (not persisted). So any decision made "by/about" agent-research via this event is invisible to UI and not recorded.

## Display / integration recommendation (display-only, no new producer)

- Surface agent-research's `COGNITIVE_STEP_COMPLETED` (already emitted) in a per-agent cognitive timeline in `AgentDetailPanel` — reusing `LiveActivityStream` patterns (`LiveActivityStream.tsx:19,68`). Zero new events needed.
- Do NOT build a new cognitive producer for this agent; instead fix the DEAD `cognitive:decision:made` consumer gap system-wide if decision visibility is desired (out of scope for one agent).
