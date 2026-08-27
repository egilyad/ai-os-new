# 11_OPPORTUNITIES — `agent-writer`

Each: ID | Description | User value | Technical reuse | Effort | Risk | Dependencies | Existing infra | Why now.

## 5 QUICK WINS (UI/Config only, days)

- **Q1 — "Document" action in RoomPanel.**
  Description: Add a `mode:'document'` quick button gated by `human-mention` policy; reuses chat delegate.
  User value: One-click "Clara, write the doc" from the room.
  Reuse: `phase21-invaction.ts` invocation flow, RoomPanel pickers, `ChatExecutor`.
  Effort: S (1-2d). Risk: Low. Deps: none. Infra: InvocationEngine + RoomPanel.
  Why now: RoomPanel already supports chat/debate/scenario; document is a trivial 4th mode.

- **Q2 — Specialization-aware pre-select in RoomPanel.**
  Description: When task text matches doc keywords, pre-select Clara via `InvocationEngineService.matches` expertise.
  User value: Users don't have to know which agent writes docs.
  Reuse: `matches()` already inspects `match.expertise`; policy `match.expertise:['Documentation']`.
  Effort: S. Risk: Low. Deps: Q1 policy. Infra: phase21-invocation.
  Why now: Policy model already supports expertise matching (AGENTS.md pending design question).

- **Q3 — Documentation activity strip in AgentCard.**
  Description: Surface `COGNITIVE_STEP_COMPLETED` (nodeId filter) + `getStats` for Clara.
  User value: See her output volume/cost at a glance.
  Reuse: `AgentService.getStats` (`agent-service.ts:292`), event bus.
  Effort: S. Risk: Low. Deps: none. Infra: AgentCard, stats.
  Why now: Data already exists; only display wiring.

- **Q4 — Fix `COGNITIVE_DECISION_MADE` consumer (enables doc decisions later).**
  Description: Wire a consumer for the dead event.
  User value: Future doc-decisions become visible.
  Reuse: event-registry `:776`; other consumers as template.
  Effort: S-M. Risk: Low. Deps: none. Infra: cognitive events.
  Why now: Currently dead; blocks any doc-decision feature.

- **Q5 — Doc-expertise persona variant in `PersonaSelector`.**
  Description: Add `documentation_expert` variant + doc trigger keywords so Clara is used as a doc judge in debates.
  User value: Debates about specs/APIs get a real doc voice.
  Reuse: `persona-selector.ts` `triggerKeywords`/`VARIANTS` pattern.
  Effort: S. Risk: Low. Deps: none. Infra: PersonaSelector.
  Why now: Pure additive branch; generic fallback preserved.

## 5 MEDIUM (service + storage, 1-3 weeks)

- **M1 — Doc-source tool for grounding.**
  Description: Give writer a tool to read source/docs/crystals before writing.
  User value: Accurate, non-fabricated docs.
  Reuse: node `tools` field (`topology-defaults.ts:390`); existing tool framework.
  Effort: M. Risk: Med (tool sandboxing). Deps: none. Infra: tool system, `CrystalRepository`.
  Why now: Core quality blocker (problem #2).

- **M2 — `documents` Dexie store + repository.**
  Description: Persist/version writer outputs (additive schema bump).
  User value: Docs survive, are editable/versioned, reusable.
  Reuse: `crystal-repository.ts`/`scenario-repository.ts` DAL pattern; `schema-types.ts`.
  Effort: M. Risk: Med (schema versioning, P2.19). Deps: none. Infra: Dexie vN, DAL.
  Why now: Follows established additive-versioning convention.

- **M3 — Post-debate auto-doc on `DEBATE_CONSENSUS`.**
  Description: Event bridge debate→writer (like Forum/phase18 bridge).
  User value: Debates produce artifacts automatically.
  Reuse: `DEBATE_CONSENSUS` payload (`event-registry.ts:793`); ConversationCore delegate.
  Effort: M. Risk: Med. Deps: M2 optional. Infra: event bridge pattern (phase18).
  Why now: Bridge pattern already proven for Forum.

- **M4 — Documentation lens.**
  Description: Add `lens:documentation` to `lens-library.ts` so writer can be invoked through it.
  User value: Lens-driven doc analysis/QA.
  Reuse: `lens-library.ts` registerLens pattern (11 existing).
  Effort: M. Risk: Low. Deps: none. Infra: LensEngine.
  Why now: All 11 lenses are analytical; a doc lens fills a real gap.

- **M5 — Documentation team/group + routing rule.**
  Description: Define an `AgentGroup` of the 6 doc agents; route doc tasks to the group, not a single node.
  User value: Removes redundancy/confusion among 6 doc agents.
  Reuse: `AgentService` groups (`agent-service.ts:27-35`), router.
  Effort: M. Risk: Med (routing logic). Deps: none. Infra: AgentGroup, router.
  Why now: Problem #7 — six overlapping agents, no coordination.

## 3 BIG IDEAS

- **B1 — "Doc-as-a-Product" pipeline.**
  Description: Writer + doc-* agents form a pipeline: architect structures → writer drafts → simplifier clarifies → auditor verifies → historian versions. Orchestrated via Director scenarios.
  User value: End-to-end published documentation from a single brief.
  Reuse: DirectorService scenarios (B3/B5), ConversationCore, all 6 doc agents already exist.
  Effort: L. Risk: Med-High. Deps: M2, M5. Infra: Director + 6 agents + documents store.
  Why now: All building blocks exist; only orchestration is missing.

- **B2 — Living Documentation that self-updates from crystals/code.**
  Description: Writer subscribes to `knowledge:crystal:formed` / code-change events and proposes doc updates, reviewed by doc-auditor.
  User value: Docs stop drifting from reality.
  Reuse: Crystal events (`AGENTS.md` Module 2), `knowledge-generator` event bridge, Invocation.
  Effort: L. Risk: High. Deps: M1, M2. Infra: event bridges, Crystal Vault.
  Why now: Crystal Vault + Generator already emit events; writer is the natural consumer.

- **B3 — Agent-written docs as first-class Knowledge artifacts (Crystal-like).**
  Description: Treat a produced document as a `crystal`-equivalent knowledge object with consensus/versioning/forum announcement.
  User value: Docs gain the same trust/versioning as crystals.
  Reuse: CrystalVault schema/events, Forum announcement bridge.
  Effort: L. Risk: High. Deps: M2. Infra: Crystal Vault, Forum.
  Why now: Reuses the entire Knowledge subsystem rather than inventing a doc subsystem.
