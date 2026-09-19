# 19 — ROADMAP: COGNITIVE-FIRST (Debate Subsystem)

> Research-only document. Read-only analysis. No source changes, no git, no commit.
> Every claim carries a `file:line` citation and a label VERIFIED / INFERRED / OPINION.
> This roadmap prioritizes the **reasoning-observability layer** before any new backend.
> Explicit rule (per task + `22_DEBATE_DO_NOT_BUILD_YET.md`): **do NOT recommend new
> engines.** Bridge and surface _existing_ events only.

## Why cognitive-first

The Debate backend already emits a reasoning stream (`cognitive:*` events) and already runs
scoring/judging services, but that intelligence is invisible in the UI and is actively
dropped before it can be stored or bridged. The highest-leverage, lowest-risk work is to
_expose_ what already exists, not to build more.

---

## Phase 0 — Bridge debate ⇄ cognitive (display-only) + fix the dropped decision event

**Goals:** Stop throwing away the reasoning signal; make it visible in Debate.

### 0.1 — `cognitive:*` events are produced but dropped before storage/bridge

- **Producer exists (VERIFIED):** `cognitive-service.ts:414` emits
  `EVENTS.COGNITIVE_DECISION_MADE`.
- **Dropped by recorder (VERIFIED):** `event-recorder.ts:229-232` and `:258-261` explicitly
  `return` (skip) `cognitive:trace:updated`, `cognitive:step:active`,
  `cognitive:step:completed`, `cognitive:decision:made`.
- **Dropped by bridge (VERIFIED):** `event-bridge.ts:27-34` defines `SKIP_COGNITIVE_EVENTS`
  and returns before dispatching them to the kernel registry.
- **No Debate consumer (VERIFIED):** No Debate panel subscribes to `cognitive:*`
  (only `topologyTraceStore.ts:29-51` subscribes, and that is a topology view, not Debate).
- **Fix (display-only):** Decide a policy — either (a) stop excluding `cognitive:*` from the
  recorder so they persist, or (b) add a Debate-side join store that subscribes live without
  changing recorder/bridge exclusions. **No new engine.** Recommended: (b) first (zero risk
  to existing recorder), then revisit recorder exclusion as a deliberate decision.
- **Effort:** S (store subscription) + S (policy decision on recorder).
- **Risk:** Low for (b); M for changing recorder exclusions (affects WAL/Dexie size — see
  `AGENTS.md` runtime-hardening where streaming-event filtering was added to prevent OOM).
- **Expected impact:** The reasoning stream becomes observable in Debate for the first time.

### 0.2 — Surface `cognitive:decision:made` in the timeline

- **Gap (VERIFIED):** Although emitted (`cognitive-service.ts:414`), it is excluded
  (`event-recorder.ts:232,261`; `event-bridge.ts:31`) and has no Debate renderer. The
  "dead" claim in SHARED context is _partially_ wrong: it is not dead at the producer, it is
  dead at the _consumer/storage_ layer. Corrected here per source-over-text rule.
- **Fix:** Render `cognitive:decision:made` as a decision node in the cognitive overlay
  (Phase 1/4 of sibling roadmaps). No new event, no new engine.
- **Effort:** S.
- **Risk:** Low.
- **Expected impact:** Users see discrete decisions, not just steps.

**Phase 0 rollup:** Effort S; Risk Low–M; Impact = unlocks every later cognitive phase.

---

## Phase 1 — Reasoning Trace UI (Design C / 08 + 12_COGNITIVE_STREAM_UX)

**Goals:** A dedicated cognitive timeline overlay showing steps, traces, and decisions.

### 1.1 — Cognitive step/trace overlay

- **Existing subscription pattern (VERIFIED):** `topologyTraceStore.ts:29-51` already
  subscribes to `cognitive:step:active` / `cognitive:step:completed`. Reuse this exact
  pattern for a Debate-side `cognitiveTraceStore`.
- **Schemas exist (VERIFIED):** `event-registry.ts:737-776` defines
  `COGNITIVE_TRACE_UPDATED`, `COGNITIVE_STEP_ACTIVE`, `COGNITIVE_STEP_COMPLETED`,
  `COGNITIVE_DECISION_MADE`. No schema work needed.
- **Fix:** New store + a toggle component overlaying steps on the debate timeline
  (ties to Phase 4 of `18_ROADMAP_UX_FIRST.md`).
- **Effort:** M.
- **Risk:** Low (pure consumer).
- **Expected impact:** Reasoning becomes first-class, not buried in logs.

### 1.2 — Per-agent reasoning thread

- **Gap (INFERRED):** `cognitive:*` payloads carry `nodeId`/`traceId` (implied by
  `topologyTraceStore.ts:29-51` shape), but no Debate view groups them per agent. The
  `debateLiveStore` already has per-agent `agentEvents` (`10_DESIGN_E.md:17`) — join the two.
- **Fix:** Group cognitive steps by agent alongside the live stream.
- **Effort:** M.
- **Risk:** Low.
- **Expected impact:** "What was agent X thinking" is answerable per participant.

**Phase 1 rollup:** Effort M; Risk Low; Impact = transparency foundation.

---

## Phase 2 — Judge-Scoring Transparency (surface existing evaluators)

**Goals:** Show _why_ the judge scored the way it did, using scoring services that already
exist — **no new judge agent** (see `22_DEBATE_DO_NOT_BUILD_YET.md` item (b)).

### 2.1 — Inventory of existing scoring services (VERIFIED, do not rebuild)

- `debate-evaluator.ts`, `bayesian-judge.ts`, `best-of-n.ts`, `blind-evaluation-service.ts`,
  `calibration-service.ts`, `debate-credibility-service.ts`, `debate-consistency-service.ts`,
  `debate-conclusion-engine.ts`, `debate-finalizer.ts` all exist in `debate-runtime/`.
- **Gap:** Their per-argument rationale is computed but not surfaced in any panel.
- **Fix:** Expose the existing evaluator output (per-argument score + rationale) in the
  result/cognitive view. Read-only use of the services.
- **Effort:** M.
- **Risk:** Low.
- **Expected impact:** Verdicts become explainable, not opaque numbers.

### 2.2 — Confidence/calibration overlay

- **Verified source (VERIFIED):** `debateLiveStore` exposes `confidence`
  (`10_DESIGN_E.md:17`); `calibration-service.ts` exists.
- **Fix:** Plot per-agent calibration next to their arguments.
- **Effort:** S–M.
- **Risk:** Low.
- **Expected impact:** Users gauge how much to trust each agent.

**Phase 2 rollup:** Effort M; Risk Low; Impact = trust in verdicts.

---

## Phase 3 — Consensus/Quality Correlation to Downstream

**Goals:** Connect the cognitive/verdict signal to the modules that already consume it.

### 3.1 — Verified downstream consumers (VERIFIED)

- Crystal auto-propose from verdicts (`crystal-debate-bridge`, `AGENTS.md` Module 2).
- Forum case study on `debate:verdict:generated` (`AGENTS.md` Module 6).
- These already fire; the cognitive layer's job is to enrich the payload they receive.
- **Fix:** Attach the cognitive rationale (Phase 1/2 output) to the verdict event payload so
  downstream modules get _why_, not just _what_.
- **Effort:** M (payload enrichment; no new bridge).
- **Risk:** Low–M (payload shape change must remain backward-compatible).
- **Expected impact:** Crystals/Forum entries carry reasoning provenance.

### 3.2 — Do NOT add new downstream sinks yet

- **Discipline (VERIFIED/INFERRED):** Research/KnowledgeGen/Scheduler/Workflow integrations
  are missing or broken (see `18_ROADMAP_UX_FIRST.md` Phase 3.2). Do not grow the cognitive
  router to them until contracts are fixed (`22_DEBATE_DO_NOT_BUILD_YET.md` items (e)(g)(h)).
- **Effort:** none (explicit non-goal).
- **Risk:** avoided.
- **Expected impact:** Scope discipline; no half-wired features.

**Phase 3 rollup:** Effort M; Risk Low; Impact = reasoning provenance flows downstream.

---

## Phase 4 — Research → Debate Workspace (Design D / 09)

**Goals:** Let a research question seed a debate and pull the debate's conclusions back.

### 4.1 — Workspace shell (reuse verified pattern)

- **Pattern (VERIFIED):** `DirectorPanel` decomposes into Configure/Library/Run tabs
  (`AGENTS.md` B5.1) — reuse for a Debate Workspace tab shell.
- **Gap:** The _bridge_ from Research module → Debate is missing (no producer found in
  source; INFERRED). So Phase 4 is _shell + manual seed_ only, not auto-bridge.
- **Fix:** Workspace tab where a user pastes/selects a research question and launches a
  debate via the existing `startDebate` (`debate-sync-manager.ts:200`). Pull conclusions
  back from `SESSION_VERDICT` (cached at `debate-sync-manager.ts:182-184`).
- **Effort:** M (shell) + deferred auto-bridge.
- **Risk:** Low for manual; M for auto-bridge (needs Research module API stability).
- **Expected impact:** Debate is framed by a question and yields a citable conclusion.

### 4.2 — Defer auto Research bridge

- **Condition (OPINION/INFERRED):** Build the auto-bridge only after the Research module
  exposes a stable query API (see `22_DEBATE_DO_NOT_BUILD_YET.md` item (h)).
- **Effort:** deferred.
- **Risk:** avoided now.
- **Expected impact:** No broken promise.

**Phase 4 rollup:** Effort M; Risk Low–M; Impact = closes the research↔debate loop manually.

---

## Phase 5 — Cognitive-Aware Replay

**Goals:** Replay that includes the reasoning stream, not just chat.

### 5.1 — Replay reads cognitive overlay alongside timeline

- **Depends on:** Phase 1 (cognitive store) + `18_ROADMAP_UX_FIRST.md` Phase 1 (unified
  Dexie replay).
- **Fix:** When replaying, overlay `cognitive:*` steps on the same scrubber. Since cognitive
  events are dropped by the recorder today (Phase 0.1), this phase _requires_ the Phase 0.1
  decision to persist them (recorder policy change) — otherwise replay has no cognitive data.
- **Effort:** M.
- **Risk:** M (blocked on recorder policy from Phase 0.1).
- **Expected impact:** "Replay the reasoning, not just the words."

### 5.2 — Decision-marker scrubbing

- **Fix:** Click a `cognitive:decision:made` node to jump the scrubber there.
- **Effort:** S.
- **Risk:** Low.
- **Expected impact:** Fast analytical navigation of past debates.

**Phase 5 rollup:** Effort M; Risk M (blocked on Phase 0.1 recorder decision); Impact = the
reasoning archive becomes queryable.

---

## Cross-phase risk summary

- **No new engine anywhere** — every phase consumes `cognitive:*` (already emitted) or
  existing scoring services. This is the core discipline of the cognitive-first strategy.
- **Only real risk:** Phase 0.1's recorder-exclusion policy (changing it touches the OOM-hardened
  WAL filter from `AGENTS.md`) and Phase 5's dependency on that decision.
- **Quickest payoff:** Phase 0 (S, Low risk) exposes the stream; Phase 2 (M) makes verdicts
  explainable with zero new backend.

_Labels: VERIFIED = confirmed via Read/Grep; INFERRED = reasoned from verified neighbors;
OPINION = prioritization. Source corrected the SHARED "cognitive:decision:made dead" claim:
it IS emitted (`cognitive-service.ts:414`) but dropped by recorder/bridge and has no Debate
consumer — so it is "dead at the consumer," not "dead at the producer."_
