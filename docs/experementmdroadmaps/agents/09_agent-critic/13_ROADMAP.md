# 13_ROADMAP — Phased plan (Philosophy A: wire-first, reuse everything)

Each: task · existing code/service · proposed UI · deps · effort · risk · expected result.

## Phase 0 — Foundations (no backend)

- **P0.1 Bind `lens:critical` to agent-critic.** Existing: `lens-library.ts:11-41`, `normalizeAgentIdentity` `topology-defaults.ts:106`. UI: none. Deps: none. Effort: S. Risk: Low. Result: critic auto-applies critical questions.
- **P0.2 Critic badge + "Audit" action on AgentCard.** Existing: `RoomPanel.tsx:127-141`. UI: `AgentCard` chip. Deps: RoomPanel. Effort: S–M. Risk: Low. Result: one-click critique entry.
- **P0.3 Specialization chips → Invocation pre-fill.** Existing: `agent-identity.ts:34`. UI: `AgentDetailPanel`. Deps: RoomPanel. Effort: S. Risk: Low. Result: specializations become actions.

## Phase 1 — Cognitive parity

- **P1.1 Emit `COGNITIVE_STEP_COMPLETED` from debate critique turns.** Existing: `event-registry.ts:763`, `debate-runtime`. UI: `LiveActivityStream` already consumes. Deps: debate-runtime. Effort: M. Risk: Low–Med. Result: critic debate work counted in stats/journal/memory.
- **P1.2 Revive `COGNITIVE_DECISION_MADE` for critique findings.** Existing: `event-registry.ts:776`. UI: `LiveActivityStream`. Deps: none. Effort: S–M. Risk: Low. Result: queryable reject-decisions.

## Phase 2 — Structured critique

- **P2.1 `CRITIQUE`/`REVIEW` turn type in ConversationCore.** Existing: `TurnProposal`, `HybridPolicy`, `directorStore`. UI: Director "Critique" lane. Deps: none. Effort: M–L. Risk: Med. Result: scenarios can route critique turns to the critic.
- **P2.2 `CritiqueResult` schema + critic returns it.** Existing: `turn:complete` payload. UI: render structured critique. Deps: P2.1. Effort: M. Risk: Med (JSON reliability). Result: parseable critiques.

## Phase 3 — Memory & routing

- **P3.1 Critique memory store + ledger UI.** Existing: `~16 memory stores`, `memory-engine.ts:181`. UI: `AgentDetailPanel` ledger. Deps: P2.2. Effort: M. Risk: Low–Med. Result: continuity & fallacy count.
- **P3.2 Specialization-based critic routing.** Existing: `ResolvedAgent.specializations` `agent-service.ts:385`. UI: none. Deps: P2.1. Effort: M. Risk: Low. Result: auto-select critic for review turns.

## Phase 4 — Debate & cross-runtime gate

- **P4.1 `red-team` debate role + critique lane.** Existing: `persona-selector.ts`, `debate-runtime`. UI: `DebateRuntimePanel`. Deps: P0.1. Effort: M. Risk: Med. Result: purpose-built devil's-advocate rounds.
- **P4.2 ReviewGate across runtimes (B1).** Existing: Invocation Engine, `directorController`. UI: gate indicator. Deps: P2–P3. Effort: XL. Risk: High. Result: system-wide QA layer.

**Expected end state:** `agent-critic` is an operational Standing Critique Officer — invoked in ≤3 clicks, structured, persisted, queryable, and visible across debate/conversation/memory/UI — built entirely on reused infrastructure.
