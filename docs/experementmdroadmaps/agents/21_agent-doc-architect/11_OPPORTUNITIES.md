# 11_OPPORTUNITIES — `agent-doc-architect`

> High-value, low-risk enhancements. Each cites the problem it resolves (see 10) and the infra it reuses.

## O1 — Grant grounding tools (fixes P1) — HIGH VALUE

- Add `SEARCH_TOOLS` (and optionally `CODER_TOOLS`) to the `agent-doc-architect` node config at `topology-defaults.ts:404`. Reuses existing tool sets already used by `agent-architect`/`agent-risk`.
- Impact: makes the "traceable to source" promise real; enables accurate doc architecture.

## O2 — Documentation/Taxonomy lens + link (fixes P2) — MEDIUM

- Add `lens:documentation-architecture` and `lens:taxonomy` to `lens-engine/lens-library.ts` (mirror the 11 existing lenses). Set `lensIds` in `normalizeAgentIdentity` for the doc cluster (`topology-defaults.ts:106`).
- Impact: doc-architect gains cognitive-lens augmentation; specializations become actionable.

## O3 — Route doc-architecture tasks to it (fixes P3/P8) — MEDIUM

- Extend the Mission Router or seed an expertise-match `invocationPolicy` (`phase21-invocation.ts`) so tasks classified as documentation/architecture/taxonomy are suggested/routed to doc-architect.
- Impact: the agent becomes active by default, not only on manual pick.

## O4 — Debate observability bridge (fixes P4) — MEDIUM

- Emit a `conversation:`-style or `COGNITIVE_STEP_COMPLETED` bridge from debate turns (or have `debate-meta-agent-controller` emit cognitive steps). Reuses the existing cognitive consumers; makes doc-architect debate activity visible in stats/journal/health.
- Note: must respect "Debate emits NO cognitive events" constraint decision — propose a _new_ lightweight bridge event, not changing debate's core contract.

## O5 — Doc cluster pipeline (fixes P5) — HIGH

- Turn `consistency-checker.runDocumentationDebate` (`consistency-checker.ts:491`) from a textual template into a **real** multi-agent flow: architect → auditor → simplifier → historian → checker, reusing ConversationCore/Director or a Debate. The agent ids already exist.
- Impact: the doc cluster becomes a coordinated unit instead of 5孤岛.

## O6 — Documents store + `document:*` events (fixes P6) — HIGH

- Add a `documents` Dexie table + 5 `document:*` events (mirror Crystal's 5-event pattern, per `agent-writer/14_ALTERNATIVE_ROADMAP.md:19`). doc-architect persists its architecture/taxonomy output, versioned.
- Impact: doc output becomes durable, reviewable, and linkable to crystals/forum.

## O7 — Director scenario "Doc Architecture from spec" (fixes P3) — LOW

- Author a `ConversationScenario`: `agent-architect` designs → `agent-doc-architect` structures → `agent-doc-simplifier` simplifies. All participants exist; only a scenario definition + Run UI selection needed (per `agent-writer/05_CONVERSATION_ROLE.md:16`).

## O8 — RoomPanel doc templates (fixes P3) — LOW

- When doc-architect is selected in RoomPanel (`RoomPanel.tsx`), pre-fill the Task textarea with a documentation-architecture template and default Mode=`chat`. Reuses existing UI.

## O9 — Subscribe to `knowledge:crystal:formed` (fixes P6/P3) — MEDIUM

- Have doc-architect (or a thin bridge) propose doc-structure updates when a crystal forms, reviewed by `agent-doc-auditor`. Reuses Forum/Knowledge event bridges already present for other modules.

## Prioritization (OPINION)

O1 (tools) > O6 (documents store) > O5 (pipeline) > O2/O3 > O4 > O7/O8/O9. Tools + persistence unlock every later opportunity; without them, the agent stays a ghost.
