# 11_OPPORTUNITIES — Quick Wins, Medium, Big Ideas for `agent-ux`

Each item: **ID | Description | User value | Technical reuse | Effort | Risk | Dependencies | Existing infra | Why now**.

## 5 QUICK WINS (UI/Config only, no new backend)

**Q1 — UX-Review scenario template**

- Desc: Curated Director scenario (agent-ux → agent-designer → agent-ux) seeded as a Library preset.
- Value: One-click usability review of any product description.
- Reuse: `ScenarioEditor`, `scenario-repository.create`, `DirectorPanel/LibraryTab`.
- Effort: Low | Risk: Low | Deps: none | Infra: B5.3 scenario editor | Why now: agent already works in Director; only packaging missing.

**Q2 — "Run UX Review" quick action on AgentCard**

- Desc: Button on `AgentCard`/`AgentDetailPanel` opening DirectorPanel with Q1 preset.
- Value: Discoverability of agent-ux's real use.
- Reuse: `AgentCard.tsx`, `scenario-repository`.
- Effort: Low | Risk: Low | Deps: Q1 | Infra: AgentsPanel | Why now: zero backend risk.

**Q3 — UX `ux_researcher` persona variant**

- Desc: Add one `PersonaVariant` to `persona-selector.ts` triggering on usability/accessibility/interview keywords.
- Value: agent-ux reasons like a UX researcher in debates instead of a mismatched generic persona.
- Reuse: `persona-selector.ts:3-241` (exact extension point).
- Effort: Low | Risk: Low | Deps: none | Infra: debate-runtime | Why now: 11 variants already exist; adding 1 is trivial and high-impact (fixes P5).

**Q4 — Specialization chips → Invocation prefill**

- Desc: Clicking a specialization on `AgentCard` prefills RoomPanel invocation request.
- Value: Faster, guided invocation.
- Reuse: `RoomPanel` picker, `AgentCard` (already renders specs).
- Effort: Low | Risk: Low | Deps: none | Infra: Invocation Engine | Why now: UI-only.

**Q5 — Expertise-match suggestion policy**

- Desc: Add an `invocationPolicies` entry with `match.expertise` for UX keywords that _suggests_ (not auto-runs) `agent-ux` in Room.
- Value: Humans discover the right agent for UX topics.
- Reuse: `contracts/invocation.ts` `match.expertise`, `phase21-invocation.ts` policy model.
- Effort: Low | Risk: Low | Deps: none | Infra: Invocation Engine D2 | Why now: policy model already supports it (fixes P9).

## 5 MEDIUM (small backend additions, reuse engines)

**M1 — UX Lens**

- Desc: Add `lens:ux` (heuristics/usability questions) to `lens-library.ts`; assign to agent-ux `lensIds`.
- Value: Reusable UX perspective across Synthesis/Debate/Review.
- Reuse: `lens-engine`, `LENS_LIBRARY` (11 lenses pattern).
- Effort: Medium | Risk: Low | Deps: none | Infra: Module 1 Lenses | Why now: lens engine stable; fixes P1 partially.

**M2 — Usability heuristic scorer (debate decorator)**

- Desc: Post-process debate arguments with Nielsen-10 scoring for UX relevance.
- Value: Quantified usability dimension in debates.
- Reuse: `lens-engine`/`junction-engine` scoring, `debate-runtime`.
- Effort: Medium | Risk: Med | Deps: M1 | Infra: debate-runtime | Why now: complements Q3.

**M3 — UX memory namespace + pre-turn recall**

- Desc: Write UX findings to `MemoryService` tagged `agent:agent-ux`; recall before each run.
- Value: Continuity; agent improves across sessions (fixes P6/P8).
- Reuse: `memory-engine.ts`, `memory-repository`, `memory-quality-gate`.
- Effort: Medium | Risk: Med | Deps: none | Infra: Memory engine | Why now: memory infra mature.

**M4 — Revive `COGNITIVE_DECISION_MADE` for UX decisions**

- Desc: When a UX decision tool runs, emit via existing `COGNITIVE_DECISION_MADE` schema.
- Value: Surfaces agent-ux reasoning in cognitive stream (fixes P4).
- Reuse: `event-registry.ts:776`, `cognitive-service.ts:414`.
- Effort: Medium | Risk: Low | Deps: M1/M2 | Infra: cognitive events | Why now: dead event, free win.

**M5 — UX outcome KPIs in stats**

- Desc: Extend `AgentStats`/journal with domain counters (# usability issues, severity).
- Value: Measure agent-ux business value (fixes P10).
- Reuse: `agent-service.ts:15-23`, `agent-journal-service.ts`.
- Effort: Medium | Risk: Low | Deps: none | Infra: stats/journal | Why now: additive.

## 3 BIG IDEAS

**B1 — "User Advocate" standing role in debates**

- Desc: Make agent-ux the permanent end-user voice across product/policy debates via Q3 + M2.
- Value: Every debate gets a consistent usability/accessibility perspective.
- Reuse: debate-runtime, persona-selector, lens-engine.
- Effort: High | Risk: Med | Deps: Q3,M1,M2 | Infra: debate | Why now: differentiates the agent meaningfully.

**B2 — Interview/Research synthesis pipeline**

- Desc: A directed ConversationCore flow where agent-ux takes raw interview notes → insight map → crystal/forum post.
- Value: Turns messy research into structured, shareable knowledge.
- Reuse: ConversationDirector (B3/B5), CrystalVault (Module 2), Forum (Module 6), KnowledgeGenerator (Module 5).
- Effort: High | Risk: Med | Deps: Q1,M3 | Infra: Cognitive modules | Why now: all modules exist; agent-ux is the natural orchestrator.

**B3 — Persistent User-Persona Memory**

- Desc: agent-ux maintains evolving user personas across sessions, feeding debates/reviews.
- Value: Continuity of "who the user is" (fixes P8) — the heart of UX research.
- Reuse: federated-memory-service, memory-engine, invocation history.
- Effort: High | Risk: Med | Deps: M3 | Infra: memory | Why now: highest-leverage differentiator.

**[OPINION]** Prioritize Q1-Q5 + M1 immediately (low risk, high clarity); B-items after the medium layer lands.
