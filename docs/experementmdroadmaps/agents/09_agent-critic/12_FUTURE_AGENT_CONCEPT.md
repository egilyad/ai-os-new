# 12_FUTURE_AGENT_CONCEPT — Realized concept from EXISTING capabilities

> A concrete, buildable concept that uses ONLY capabilities already present in the repo (no new framework).

## Concept: "Greta, the Standing Critique Officer"

A first-class **review role** for `agent-critic` realized entirely by composing existing pieces:

### The realized capability stack (all VERIFIED to exist today)

1. **Identity** — `agent-critic` already has a skeptical system prompt + 0.1 temperature + pinned nvidia model (`topology-defaults.ts:245-255`, `agent-profiles.ts:102-111`).
2. **Lens** — `lens:critical` already exists with the exact critical questions (`lens-library.ts:11-41`); just needs `lensIds` binding (1-line change, see Q1).
3. **Invocation** — Room already lets a human invoke `agent-critic` with `mode` + `task` (`RoomPanel.tsx:127-141`); the Invocation Engine already turns that into a Director scenario (`phase21-invocation.ts:89-108`).
4. **Cognitive trace** — `COGNITIVE_STEP_COMPLETED` already carries `nodeId:'agent-critic'` during topology runs (`orchestration-service.ts:414`); `LiveActivityStream` already renders it (`LiveActivityStream.tsx:122`).
5. **Memory/journal** — already written on the same event (`memory-engine.ts:181`, `agent-journal-service.ts:150`).
6. **Decision event** — `COGNITIVE_DECISION_MADE` already defined and ready to carry "I reject claim X" (`event-registry.ts:776`).

### The realized behavior (what changes minimally)

- The critic is **auto-applied** the `lens:critical` questions whenever it runs (Q1).
- A Room "Audit this" deep-link (Q2/Q5) creates a Director scenario with the critic as the sole `CRITIQUE` turn (M1), returning a **structured `CritiqueResult`** (M2).
- The critique result is persisted to a critique memory store (M3) and emitted as `COGNITIVE_DECISION_MADE` (Q4), so it shows in `LiveActivityStream` and the `AgentDetailPanel` ledger (M3/UI).
- In debates, a `red-team` role (M4) lets the critic attack the leading argument, with its output surfaced in a dedicated "Critique" lane.

### Why this is "realized from existing capabilities"

No new service, no new bus, no new DB table beyond what's proposed. Everything is **wiring + one schema object + UI chips**. The critic stops being a prompt-shaped persona and becomes an _operational review officer_ — purely by reusing the lens engine, the Invocation Engine, ConversationCore's turn model, and the four cognitive events.

### Success metric

A human can, in ≤3 clicks from any artifact, get a structured, persisted, queryable critique from Greta — and see it reflected in her stats, memory ledger, and the live activity stream — without any new architectural primitive.
