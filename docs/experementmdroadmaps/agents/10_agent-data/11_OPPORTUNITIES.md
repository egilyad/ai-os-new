# 11_OPPORTUNITIES — Wins for `agent-data`

Each: ID, Description, User value, Technical reuse, Effort, Risk, Dependencies, Existing infra, Why now.

## 5 QUICK WINS (≤1-2 days each)

**Q1 — Fix journal display name to "Sam Okafor"**

- Desc: At write time in `agent-journal-service.ts:135,161`, resolve `displayName` via `agentService.resolveAgent(nodeId)` / `resolveAgentIdentity`.
- Value: Journal stops showing cryptic ids; human-readable history.
- Reuse: `agent-identity.ts:62 resolveAgentIdentity`.
- Effort: S. Risk: Low (display only). Deps: none. Infra: existing identity resolver. Why now: trivial, high-visibility polish.

**Q2 — Expose "Ask by expertise" in RoomPanel**

- Desc: Add control building `target.expertise:['Statistics','Forecasting']`; engine already matches (invocation-engine-service.ts:167-173).
- Value: Proves specialization→agent routing; users find Sam for quant questions.
- Reuse: InvocationEngine match path (exists, UI-hidden). Effort: S. Risk: Low. Deps: none. Infra: phase21. Why now: closes verified gap #7.

**Q3 — Add "Statistics/ML/Forecasting" quick-ask buttons in AgentDetailPanel**

- Desc: Buttons open RoomPanel invocation pre-targeted to `agent-data`, mode `chat`, with a seeded task template.
- Value: Turns static profile into actionable entry points.
- Reuse: `RoomPanel` + `invocationEngine`. Effort: S. Risk: Low. Deps: none. Infra: existing UI. Why now: zero backend change.

**Q4 — Tag memory writes with `agentId`**

- Desc: In `memory-engine.ts:181` extraction, set `agentId = nodeId`.
- Value: Enables per-agent memory recall (foundation for continuity).
- Reuse: `MemoryStoreQuery.agentId` already supported. Effort: S. Risk: Low (additive field). Deps: none. Infra: memory-orchestrator. Why now: unblocks Q-medium memory tab.

**Q5 — Agent activity timeline tab**

- Desc: In `AgentDetailPanel`, subscribe to `COGNITIVE_STEP_COMPLETED` filtered by `nodeId==='agent-data'`; reuse `LiveActivityStream`.
- Value: Users see Sam "thinking" live; builds trust.
- Reuse: `LiveActivityStream.tsx`, EventBus. Effort: S-M. Risk: Low. Deps: none. Infra: cognitive events already fire. Why now: instrumentation exists, only UI missing.

## 5 MEDIUM (≤1-2 weeks each)

**M1 — Specialization-aware debate persona**

- Desc: Add a declarative `specialization→variant` affinity in `persona-selector.ts`; boost `cautious_scientist` when agent has Statistics/ML.
- Value: Sam consistently argues as the evidence/statistics voice, not topic-roulette.
- Reuse: existing `PersonaSelector` + `ARGUMENT_STRATEGY_INSTRUCTIONS`. Effort: M. Risk: Med (persona tuning). Deps: none. Infra: persona-selector. Why now: fixes problem #1.

**M2 — Agent memory tab (recall)**

- Desc: After Q4, add Memory tab querying `memoryOrchestrator.query({agentId:'agent-data'})`.
- Value: Persistent, personalized context surfaced to users.
- Reuse: memory-orchestrator API. Effort: M. Risk: Low-Med. Deps: Q4. Infra: 7 typed stores. Why now: completes continuity story.

**M3 — Inject recent memories into Sam's system prompt**

- Desc: `resolveAgent` optionally returns last-K episodic memories; `debate-api.ts`/`ConversationOrchestrator` prepend them.
- Value: Sam recalls prior debates/analyses → coherent long-term behavior.
- Reuse: memory query + resolveAgent. Effort: M. Risk: Med (prompt length). Deps: Q4,M2. Infra: resolveAgent. Why now: differentiates Sam from generic clone.

**M4 — "Data/Statistics" lens + assign to agent-data**

- Desc: Add `lens:statistical` to `lens-library.ts`; set `lensIds:['lens:statistical']` for agent-data in `normalizeAgentIdentity` (or via identity editor).
- Value: Lens-driven quantified-uncertainty transform unique to Sam.
- Reuse: lens-engine + LENS_LIBRARY. Effort: M. Risk: Low. Deps: none. Infra: lens-engine (phase). Why now: lensIds already plumbed but empty.

**M5 — Repair/repurpose `cognitive:decision:made`**

- Desc: Either add a consumer logging decisions to AgentJournal with `agentId`, or drop the emit. For Sam, log "statistical decisions".
- Value: Removes dead code / adds decision audit trail.
- Reuse: AgentJournal + cognitive event. Effort: M. Risk: Low. Deps: none. Infra: cognitive-service. Why now: dead event is a latent bug.

## 3 BIG IDEAS

**B1 — Resident Data Scientist (auto-invoked quant reviewer)**

- Desc: Subscribe Sam (via Invocation expertise policy `expertise:statistics→agent-data`) to debate/forum streams; auto-inject a statistical-critique turn when claims lack CI/p-values.
- Value: Every debate/forum gains a real skeptical quant without manual invocation.
- Reuse: Invocation engine + EventBus + debate-api. Effort: L. Risk: Med (auto-invoke governance, D6). Deps: Q2,M1. Infra: phase21 + EventBus. Why now: D2/D7 policy model already supports it.

**B2 — Skill Graph from specializations**

- Desc: Promote `specializations` into a queryable capability index (router + invocation consult it); "who can forecast?" → agent-data.
- Value: Content-aware routing; agents selected by ability, not hardcoded edges.
- Reuse: invocation match + router. Effort: L. Risk: Med. Deps: M1. Infra: AgentService.resolveAgent. Why now: specializations already structured data, currently wasted.

**B3 — Lens-driven quantified uncertainty layer**

- Desc: Every Sam output passes through `lens:statistical` (B1/M4) producing explicit confidence intervals + caveats, stored as Crystal (phase14) "Quantified Uncertainty" artifacts.
- Value: Turns Sam's answers into reusable, auditable knowledge crystals.
- Reuse: lens-engine + crystal-vault (phase14) + knowledge-generator (phase17). Effort: L. Risk: Med. Deps: M4. Infra: phase14/17. Why now: cognitive modules already exist; Sam is the natural bridge.
