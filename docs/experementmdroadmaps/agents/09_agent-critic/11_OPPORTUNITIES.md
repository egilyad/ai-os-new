# 11_OPPORTUNITIES — 5 Quick Wins + 5 Medium + 3 Big Ideas

> Each: ID, Description, User value, Technical reuse, Effort, Risk, Dependencies, Existing infra, Why now.

## 5 QUICK WINS (Effort: S–M)

### Q1 — Bind `lens:critical` to the critic

- **Desc:** Set `lensIds:['lens:critical']` on `agent-critic` in `AGENT_PROFILES` so the lens engine auto-applies it.
- **User value:** The critic's output gains structured critical questions; consistency across runs.
- **Reuse:** `lens-library.ts:11-41`, `agent-identity.ts:116-124`, `normalizeAgentIdentity` (`topology-defaults.ts:106`).
- **Effort:** S (1-line profile edit + lens resolution already wired).
- **Risk:** Low (lens is `stackable`, non-destructive).
- **Deps:** none. **Infra:** existing lens engine. **Why now:** trivial, closes orphaned-lens problem (#2).

### Q2 — Critic badge + "Audit" action on AgentCard

- **Desc:** Detect `specializations` including `Critical Analysis` and render a "Critique" chip that deep-links Room pre-filled.
- **User value:** One-click critique entry point; makes the agent's purpose discoverable.
- **Reuse:** `RoomPanel.tsx:127-141` invocation request shape; `AgentCard` component.
- **Effort:** S–M. **Risk:** Low (UI only). **Deps:** RoomPanel. **Infra:** Invocation Engine. **Why now:** cheap UX win, no backend.

### Q3 — Emit `COGNITIVE_STEP_COMPLETED` from debate critique turns

- **Desc:** In debate, when a participant is `agent-critic`, emit the existing cognitive event so stats/journal/memory capture it.
- **User value:** Critic's debate work becomes visible in analytics & memory.
- **Reuse:** `event-registry.ts:763`, `agent-service.ts:184`, `agent-journal-service.ts:150`.
- **Effort:** M. **Risk:** Low–Med (event volume). **Deps:** debate-runtime. **Infra:** EventBus. **Why now:** fixes problem #3 directly.

### Q4 — Revive `COGNITIVE_DECISION_MADE` for critique findings

- **Desc:** When the critic flags a fallacy, emit the already-defined `COGNITIVE_DECISION_MADE` (`event-registry.ts:776`).
- **User value:** Queryable "Greta rejected claim X" decisions; first-class audit trail.
- **Reuse:** existing event; `CognitiveDecisionSchema`. **Effort:** S–M. **Risk:** Low. **Deps:** none. **Infra:** EventBus. **Why now:** event is dead; critic is the natural producer.

### Q5 — Specialization chips as Invocation pre-fills

- **Desc:** In `AgentDetailPanel`, render specializations as buttons that open Room with `task` + `mode` preset.
- **User value:** Turns static profile text into actions.
- **Reuse:** `RoomPanel.tsx` request builder; `agent-identity.ts:34`. **Effort:** S. **Risk:** Low. **Deps:** RoomPanel. **Infra:** Invocation. **Why now:** zero backend.

## 5 MEDIUM (Effort: M–L)

### M1 — `CRITIQUE`/`REVIEW` turn type in ConversationCore

- **Desc:** Add objective type so Director can route critique turns to the critic and render a "Critique" lane.
- **User value:** Structured post-hoc / pairwise review inside scenarios.
- **Reuse:** `TurnProposal` (`contracts/conversation/turn`), `HybridPolicy`, `directorStore.ts`. **Effort:** M–L. **Risk:** Med (schema change). **Deps:** DirectorService. **Infra:** ConversationCore. **Why now:** enables scenarios #1–3 in `05`.

### M2 — Structured critique object + schema

- **Desc:** Define `CritiqueResult { claim, fallacyType?, severity, counterEvidence, recommendation }`; have the critic return it (prompt-constrained JSON).
- **User value:** Downstream (aggregator, forum, memory) can parse & act on critiques.
- **Reuse:** `turn:complete` payload (`event-registry.ts` conversation:*), memory stores. **Effort:** M. **Risk:** Med (LLM JSON reliability). **Deps:** M1. **Infra:** existing payloads. **Why now:** unblocks structured reuse (problem #9).

### M3 — Critique memory store + ledger UI

- **Desc:** New typed memory store keyed by fallacy/topic; show "N fallacies flagged" in `AgentDetailPanel`.
- **User value:** Continuity & accountability for the critic's findings.
- **Reuse:** `~16 memory stores` pattern, `memory-engine.ts:181`. **Effort:** M. **Risk:** Low–Med. **Deps:** M2. **Infra:** Dexie stores. **Why now:** closes problem #8 memory gap.

### M4 — `red-team` debate role

- **Desc:** Add a debate role where the critic attacks the leading argument; wire `lens:critical` into its prompt.
- **User value:** Purpose-built devil's-advocate rounds.
- **Reuse:** `persona-selector.ts` variants, `debate-runtime`. **Effort:** M. **Risk:** Med. **Deps:** Q1. **Infra:** debate. **Why now:** natural fit (problem #4).

### M5 — Critique routing by specialization

- **Desc:** When any scenario/debate needs a review, auto-pick the agent whose `specializations` include `Critical Analysis`.
- **User value:** System self-selects the right critic instead of manual pick.
- **Reuse:** `ResolvedAgent.specializations` (`agent-service.ts:385`), `AgentResolverDirectory` (`phase21-invocation.ts:47`). **Effort:** M. **Risk:** Low. **Deps:** Q1. **Infra:** resolver. **Why now:** leverages existing specialization data.

## 3 BIG IDEAS (Effort: L–XL)

### B1 — Critic as a cross-runtime "Review Gate"

- **Desc:** A reusable ReviewGate that, after any agent output (debate argument, scenario turn, generated artifact), invokes `agent-critic` to gate quality before progression.
- **User value:** System-wide quality assurance; fewer flawed outputs reaching synthesis/forum.
- **Reuse:** Invocation Engine (`phase21-invocation.ts`), Director pause/resume (`directorController`), `conversation:*` events. **Effort:** XL. **Risk:** High (latency, loops). **Deps:** M1,M2,M4. **Infra:** all runtimes. **Why now:** ties every opportunity into one QA layer.

### B2 — Fallacy/Logic Verification Engine (structured)

- **Desc:** Move beyond prompt-only: a `CriticVerifier` that post-processes the critic's output with a rule/classifier layer (formal-fallacy patterns, claim–evidence consistency) producing machine-checkable verdicts.
- **User value:** Real "Fallacy Detection" — not just a prompt, but verified.
- **Reuse:** `agent-journal-service` schema, `CognitiveDecisionSchema`, memory stores. **Effort:** XL. **Risk:** High (NLP accuracy). **Deps:** M2. **Infra:** new small verifier svc. **Why now:** resolves the core fiction (problem #1).

### B3 — Critic Knowledge Graph (claims ↔ fallacies ↔ sources)

- **Desc:** Persist every critique as a node linking claim→fallacy→source argument→debate/conversation; surface as a "Critique Graph" panel.
- **User value:** Organizational memory of _why_ positions were rejected; powerful for research/crystal.
- **Reuse:** Junction Engine (`junction-engine-service`), Crystal Vault, memory stores. **Effort:** XL. **Risk:** Med–High. **Deps:** M2,M3. **Infra:** Junction/Crystal. **Why now:** compounds value of Modules 2–3.
