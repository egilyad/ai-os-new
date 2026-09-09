# 11 — OPPORTUNITIES: `agent-architect`

Each: ID · Description · User value · Technical reuse · Effort · Risk · Deps · Existing infra · Why now.

## 5 QUICK WINS (days)

- **Q1 — Architect→ArchitectureReview bridge button.** "Ask System Architect" in `ArchitectureReview.tsx` pre-fills RoomPanel (target=`agent-architect`, mode=chat, task=scan findings).
  - Value: connects the static scan to a real reasoning agent. Reuse: Invocation Engine + RoomPanel + `ArchitectureReview.tsx`. Effort: S. Risk: low. Deps: none new. Infra: `phase21-invocation.ts`, RoomPanel. Why now: the two "architecture" concepts already confuse users.
- **Q2 — Journal filter chip.** `AgentJournalPanel` filter by `agentId=agent-architect`.
  - Value: see Marcus Hale's design history at a glance. Reuse: `agent-journal-service.list()`. Effort: S. Risk: low. Deps: none. Infra: `agent-journal-service.ts:130`. Why now: data already collected, just not surfaced.
- **Q3 — Bind `lens:security` (or new `lens:architecture`) to the node.** Set `lensIds` on the `agent-architect` topology node.
  - Value: architect speaks through a consistent architecture lens. Reuse: `lens-engine`, `agent-identity.ts:116`. Effort: S. Risk: low. Deps: none. Infra: `lens-library.ts:82`. Why now: lens infra already supports `architecture` taskType.
- **Q4 — Persona badge in debate UI.** Show resolved `PersonaSelector` variant per agent in `DebateRuntimePanel/AgentControlPanel`.
  - Value: transparency on why the architect "sounded like a technologist". Reuse: `persona-selector.ts` output. Effort: S. Risk: low. Deps: none. Infra: `persona-selector.ts:292`. Why now: cheap UX clarity.
- **Q5 — Architecture quick-invoke shortcut.** RoomPanel "Review architecture" preset (target pre-selected, mode chat).
  - Value: one-click expert access. Reuse: RoomPanel + Invocation policy. Effort: S. Risk: low. Deps: none. Infra: `phase21-invocation.ts:125`. Why now: invocation already works end-to-end.

## 5 MEDIUM (1–2 sprints)

- **M1 — Topic→agent specialization router.** When a debate/invocation topic scores high on architecture keywords, prefer `agent-architect` and attach architecture persona/lens.
  - Value: the right expert actually shows up. Reuse: `PersonaSelector` scoring + `agentService.resolveAgent` specializations. Effort: M. Risk: med (routing fairness). Deps: router service. Infra: `persona-selector.ts:243`, `agent-service.ts:337`. Why now: specializations are currently dead.
- **M2 — Agent→persona affinity.** Map `agent-architect` specializations to a dedicated `architect` persona variant instead of generic pool.
  - Value: architect identity preserved in debate. Reuse: `PersonaSelector` variant registry. Effort: M. Risk: low. Deps: none. Infra: `persona-selector.ts:3`. Why now: complements M1.
- **M3 — Memory recall injection.** Prepend last N architect journal entries into its system prompt on invocation.
  - Value: continuity of design reasoning. Reuse: `agent-journal-service.list()`. Effort: M. Risk: low. Deps: none. Infra: `agent-journal-service.ts`. Why now: memory exists, unused for recall.
- **M4 — Trade-off card UI.** Render architect monolith/microservices/serverless outputs as structured cards.
  - Value: decisions become comparable/actionable. Reuse: `SynthesisZonesView` styling. Effort: M. Risk: low. Deps: parsing. Infra: `components/SynthesisPanel`. Why now: architect output is currently flat text.
- **M5 — Topology-aware context injection.** Inject current `AuditorTopology` summary into architect prompts.
  - Value: reasons about the _real_ system. Reuse: `topology-defaults.ts`, `agentService` topology access. Effort: M. Risk: med (context size). Deps: none. Infra: `topology-defaults.ts:459`. Why now: topology already in memory.

## 3 BIG IDEAS

- **B1 — "Architecture Decision Record" (ADR) agent role.** Elevate `agent-architect` to produce structured ADRs (context/options/decision/consequences) persisted as Crystals (`crystalVault`) and linked from `ArchitectureReview`. Reuse: Crystals + Generator + Invocation. Effort: L. Risk: med. Deps: crystal bridge. Infra: `crystal-vault-service`, `knowledge-generator-service`.
- **B2 — Unified "Architecture" surface.** Merge the static `ArchitectureReview` panel and the `agent-architect` agent into one experience: scan → ask architect → ADR → crystal. Kills the duplicate "architecture" confusion (problem #4). Reuse: existing panels + Invocation. Effort: L. Risk: med (UX merge). Deps: none. Infra: `ArchitectureReview.tsx`, RoomPanel, Crystals.
- **B3 — Self-improving architect via cognitive decisions.** Make `cognitive:decision:made` live for the architect (trade-off conclusions), feed them to `advisor-service` + `memory-engine` so future invocations cite past decisions. Reuse: `orchestration-service` emit + consumers. Effort: L. Risk: med. Deps: none. Infra: `event-registry.ts:776`, `advisor-service.ts:119`.
