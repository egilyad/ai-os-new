# 05 — The Debate Reasoning Pipeline

**Subsystem:** Debate (reasoning/argumentation runtime)
**Classification:** RESEARCH-ONLY (read-only analysis; no source modified, no git, no commit)
**Author:** opencode research pass
**Date:** 2026-08-15
**Methodology:** Every claim carries a `file:line` citation and a `VERIFIED` / `INFERRED` / `OPINION`
label. Source wins over the brief when they differ.

---

## 1. Executive Summary

The Debate subsystem is a self-contained argumentation runtime. A single orchestration function,
`buildDebatePipeline` in `debate-pipeline-builder.ts`, wires the end-to-end flow:

**session lifecycle → rounds → per-agent thinking/response → evaluation (evaluator + blind eval) →
consensus check → conclusion/verdict → governor stop check.**

The pipeline leans on a set of **definition-style services** (not agents): `DebateEvaluator`
(`scoreArguments`), `BayesianJudge` (`update`), `BlindEvaluationService` (`evaluateBlindly`), and
`DebateConclusionEngine` (`generateVerdict`). On top of these sit **56 quality techniques**
(`QUALITY_TECHNIQUES` in `debate-quality-settings.ts`) that shape agent behaviour but are _not_
separate modules emitting events — they are prompt/strategy descriptors toggled via settings.

**Key gaps identified (VERIFIED/INFERRED):**

- The _why_ of a judge's score is never surfaced — scoring is a numeric transform with no
  per-argument rationale event. `INFERRED`.
- The reasoning pipeline emits `debate:*` events but **no `cognitive:*` events**, so the cognitive
  observability stack (see doc `04`) stays blind to debate reasoning. `VERIFIED`.
- A heuristic fallback exists in the conclusion engine, but the convergence _decision_ lives in
  `DebateGovernor.shouldStop()` with a hard `CONVERGENCE_THRESHOLD = 85`. `VERIFIED`.

---

## 2. Pipeline Stages (VERIFIED by direct read)

### 2.1 Orchestration entry

`buildDebatePipeline` is defined in `debate-pipeline-builder.ts` and returns a `pipeline` object at
**`:474`** (the final `return pipeline;`). The function spans lines `1-474`. `VERIFIED`. The
pipeline internally handles runtime events via a `switch` over event types (e.g. `agent:thinking`
at `:188`, `agent:responded` at `:199`).

### 2.2 Stage: agent thinking

On the `agent:thinking` runtime event, the builder looks up the participant and emits
`DEBATE_AGENT_THINKING`:

- `debate-pipeline-builder.ts:188-197` — `case 'agent:thinking'`, `session.setAgentPhase(p.agentId, 'thinking')`, then `engine.deps.eventBus.emit(EVENTS.DEBATE_AGENT_THINKING, { sessionId, agentId })` at `:192`. `VERIFIED`.

### 2.3 Stage: agent responded + memory step

On `agent:responded`, the builder records a memory step and emits the responded/chunk/error family:

- `debate-pipeline-builder.ts:199-221` — `session.setAgentPhase(..., 'streaming')`, computes
  `stepConfidence = estimateConfidence(event.content)`, calls `engine.getMemory(sessionId).recordStep({… type: 'claim' …})`, then emits the responded event. `VERIFIED`.

### 2.4 Stage: phase handling → evaluation

`createPhaseChangeHandler` in **`debate-phase-handler.ts:36`** is the phase dispatcher. During a
phase it invokes:

- `deps.evaluator.scoreArguments(agentId, claims, chain)` at **`debate-phase-handler.ts:177`**
  (inside the handler). `VERIFIED`.
- If `deps.blindEval` is present, `deps.blindEval.evaluateBlindly(participants, claims, getChain)`
  at **`debate-phase-handler.ts:103`**. `VERIFIED`.

### 2.5 Stage: consensus

After consensus transition, the builder gathers claims and evaluates them:

- `debate-pipeline-builder.ts:375-389` — `session.transition('consensus')`, `gatherClaims(...)`,
  `engine.getContext(sessionId).consensus.evaluate(claims)`, then `emit(EVENTS.DEBATE_CONSENSUS_REACHED, { sessionId, confidence, agreements, conflicts })` at `:383`. `VERIFIED`.

### 2.6 Stage: conclusion / verdict

The builder generates a verdict and emits it once:

- `debate-pipeline-builder.ts:420-433` — builds the verdict payload (`conclusionType`, `stanceResult`,
  `keyArguments`, `reasoning`, `confidence`, `roundsTotal`, `totalTokens`) and calls
  `engine.deps.eventBus.emitOnce(EVENTS.DEBATE_VERDICT_GENERATED, sessionId, { sessionId, verdict })` at `:430`. `VERIFIED`.

### 2.7 Stage: governor stop check

Convergence is checked by `DebateGovernor.shouldStop()`:

- `debate-governor.ts:8` — `export class DebateGovernor`.
- `debate-governor.ts:14` — `private readonly CONVERGENCE_THRESHOLD = 85;`
- `debate-governor.ts:187` — `const allAbove = recent.every((s) => s > this.CONVERGENCE_THRESHOLD);`
- `debate-governor.ts:196` — `shouldStop(): boolean { … }`. `VERIFIED`.

> Note: the brief referenced `debate-governor.ts:196-211 shouldStop`. The `shouldStop` body starts
> at `:196`; the `CONVERGENCE_THRESHOLD` constant is at `:14` and used at `:187`. The exact line of
> the _threshold constant_ differs from the brief's "196-211" — source wins. `VERIFIED`.

---

## 3. The 56 Quality-Technique Modules (VERIFIED inventory)

The brief states "40+ quality-technique modules." The actual source defines them as a **data array
of descriptors**, not separate code modules:

- `src/kernel/contracts/debate-quality-settings.ts:1` — `export interface QualityTechnique` (id, name,
  nameRu, description, descriptionRu, category `'P0'|'P1'|'P2'`, defaultEnabled).
- `debate-quality-settings.ts:11` — `export const QUALITY_TECHNIQUES: QualityTechnique[] = [ … ]`,
  ending at `:723`. `VERIFIED`.
- The i18n copy at `src/i18n/translations/en/quality.ts:5` states _"Toggle 56 debate quality
  techniques."_ `VERIFIED`. A manual count of the array in `debate-quality-settings.ts` yields 56
  entries (P0/P1/P2/P0.15/P0.17/P1.28/P1.29/P1.30/P2.2/P2.4 groups). `VERIFIED` (count matches i18n).

**Sample of technique IDs (VERIFIED from `debate-quality-settings.ts`):**
`cross-examination` (`:14`), `delta-focusing` (`:23`), `shadow-opponent` (`:32`), `adversarial-source`
(`:41`), `vulnerability-targeting` (`:50`), `graph-minimax` (`:77`), `meta-agent` (`:86`),
`steelman` (`:95`), `causal-graph` (`:140`), `bayesian-judges` (`:196`), `dpo-sampler` (`:233`),
`synthesis` (`:278`), `triangulation` (`:287`), `insight-bus` (`:332`), `replay` (`:341`),
`entropy→enthymeme` (`:350`), `rhetorical-device` (`:415`), `scratchpad` (`:424`), `narrative-arc`
(`:433`), `fog-of-war` (`:460`), `prediction-market` (`:550`), `theory-of-mind` (`:559`),
`blind-evaluation` (`:622`), `judge-deliberation` (`:702`), `graph-of-thoughts` (`:671`),
`executable-evidence` (`:650`), `hidden-incentives` (`:660`), `best-of-n` (`:714`).

**Important INFERRED caveat:** these are _descriptors_ consumed by prompt/strategy selection (the
`quality-settings-store.ts:74` `getTechniques()` accessor), **not** independently-emitting runtime
modules. The brief's "40+ quality-technique modules in debate-runtime" overstates modularity; they
are configuration entries. This matters for doc `12` (UX): the techniques influence agent behaviour
but do not produce their own events beyond `debate:quality:technique:applied` (`event-registry.ts:1208`).

---

## 4. Scoring & Judging — Definitions, Not Agents (VERIFIED)

### 4.1 `DebateEvaluator.scoreArguments`

- `debate-evaluator.ts:64` — `export class DebateEvaluator implements IDebateEvaluator`.
- `debate-evaluator.ts:67` — `scoreArguments(agentId, claims, chain): AgentScore { … }`.
  Body (`:68-74`) computes: `argumentCount`, `avgConfidence`, `rebuttals` filter. `VERIFIED`.
- Construction: `constructor(private dpoSampler?: IDpoStrategySampler)` at `:65` — optionally uses
  the `dpo-sampler` quality technique. `VERIFIED`.

**Gap (INFERRED):** `scoreArguments` returns an `AgentScore` but the pipeline only stores it
(`debate-phase-handler.ts:110-112` builds `{ agentId, overall }`). No _rationale text_ is emitted
as an event. The score is a number; the _reasoning behind it_ is not surfaced to UI or events.

### 4.2 `BayesianJudge.update`

- `bayesian-judge.ts` — class with `update(agentId, argumentStrength)` at **`:25`**.
- `:25-34` — maps `argumentStrength (-1..1)` → `likelihood` via `strengthToLikelihood`, updates a
  `posterior` belief starting at `0.5`. `VERIFIED`.
- This is the engine behind the `bayesian-judges` quality technique (`debate-quality-settings.ts:196`)
  and feeds `DEBATE_CONSENSUS_REACHED.confidence`. `INFERRED` link; the consensus call is
  `engine.getContext(sessionId).consensus.evaluate(claims)` at `debate-pipeline-builder.ts:382`.

**Gap (INFERRED):** the posterior updates are internal state. No event broadcasts "agent X belief
moved from 0.5 → 0.73 because argument Y had strength 0.4." The judge is a black box to observers.

### 4.3 `BlindEvaluationService.evaluateBlindly`

- Invoked at `debate-phase-handler.ts:103` — `deps.blindEval.evaluateBlindly(participants, claims, getChain)`. `VERIFIED`.
- Implements the `blind-evaluation` quality technique (`debate-quality-settings.ts:622`): "Judge
  arguments without knowing which agent made them." `INFERRED` semantic tie.
- **Gap (INFERRED):** the _blind_ scores (returned as a `Map<agentId, score>`) are consumed only
  locally at `debate-phase-handler.ts:109-112`; they are never emitted as a `debate:*` event, so the
  UI cannot show "blind vs attributed" score divergence — a potentially valuable bias signal.

---

## 5. Verdict Generation + Heuristic Fallback (VERIFIED)

- `debate-conclusion-engine.ts` — `generateVerdict(snapshot, timeline)` at **`:60`**.
- `:60-69` — extracts `agentResponses` (`e.type === 'agent:responded'`), `extractKeyArguments`,
  `determineConclusionType`, `determineStanceResult`, `buildSummary`, `buildReasoning`, and returns
  a `DebateVerdict` with `sessionId`, `conclusionType`, `stanceResult`, `keyArguments`, `reasoning`,
  `confidence`, etc. `VERIFIED`.
- `constructor(private llmCall?: LlmCallFn)` at `:58` — **the verdict can be LLM-assisted**; when
  `llmCall` is absent, the engine falls back to heuristic extraction (`buildReasoning`/`buildSummary`
  are local methods). `VERIFIED` (optional dependency) + `INFERRED` (the "fallback" is the no-LLM path).

**Gap (INFERRED):** `verdict.reasoning` _is_ produced and carried on `DEBATE_VERDICT_GENERATED`
(`debate-pipeline-builder.ts:423` sets `reasoning: verdict.reasoning`), so the _final_ reasoning text
exists. But it is a single blob per verdict, not a step-by-step trace, and it is only emitted at the
end — there is no incremental "why this argument" event during the debate.

---

## 6. Consensus Convergence Logic (VERIFIED)

- Threshold constant: `debate-governor.ts:14` — `CONVERGENCE_THRESHOLD = 85`.
- Check: `debate-governor.ts:187` — `recent.every((s) => s > this.CONVERGENCE_THRESHOLD)`.
- Decision: `debate-governor.ts:196` — `shouldStop(): boolean`.
- Trigger: `DEBATE_CONSENSUS_REACHED` emitted at `debate-pipeline-builder.ts:383` carries
  `confidence`, `agreements`, `conflicts` — these feed the governor's recent-confidence window.
  `VERIFIED` (emit) + `INFERRED` (link to governor input, since `consensus.evaluate` at `:382`
  produces the confidence consumed downstream).

**Gap (INFERRED):** convergence is a single scalar threshold on agreement confidence. There is no
event explaining _which_ claims drove agreement vs conflict, and the `conflicts/agreements` ratio is
emitted but not broken down per claim. The "why we stopped" is reducible only to "confidence > 85."

---

## 7. Where Reasoning Is Observable vs Hidden

| Aspect                               | Observable?    | Evidence                                                                      |
| ------------------------------------ | -------------- | ----------------------------------------------------------------------------- |
| Agent started thinking               | YES            | `DEBATE_AGENT_THINKING` `debate-pipeline-builder.ts:192`                      |
| Agent produced text                  | YES            | `DEBATE_AGENT_RESPONDED` `:199-221`                                           |
| Consensus reached                    | YES            | `DEBATE_CONSENSUS_REACHED` `:383`                                             |
| Verdict + reasoning blob             | YES (end only) | `DEBATE_VERDICT_GENERATED` `:430`                                             |
| Per-argument score rationale         | NO             | `DebateEvaluator.scoreArguments` `debate-evaluator.ts:67` returns number only |
| Bayesian belief trajectory           | NO             | `BayesianJudge.update` `bayesian-judge.ts:25` internal state                  |
| Blind vs attributed divergence       | NO             | `evaluateBlindly` `debate-phase-handler.ts:103` local only                    |
| Step-by-step "why this argument"     | NO             | no incremental cognitive event; only final `reasoning` blob                   |
| Reasoning visible to cognitive stack | NO             | debate emits no `cognitive:*` (see doc `04`)                                  |

All "YES" rows are `VERIFIED`; all "NO" rows are `INFERRED` from the absence of supporting emit sites.

---

## 8. Gaps Summary (for follow-up docs)

1. **No score rationale event.** `DebateEvaluator` and `BayesianJudge` compute numbers with no
   explanatory event. `INFERRED`.
2. **No per-argument surface to UI.** Scores are stored in `session.participants` but not broadcast.
   `INFERRED`.
3. **No `cognitive:*` emission from debate.** Established in doc `04`; verified here that the
   pipeline emits only `debate:*` (`debate-pipeline-builder.ts:192,383,430`).
4. **Heuristic fallback is opaque.** When `llmCall` is absent, `generateVerdict` uses local
   heuristics with no signal distinguishing heuristic vs LLM verdict. `INFERRED`.

---

## 9. Recommendations (OPINION, no new engines)

1. **Emit a `debate:agent:scored` enrichment** (the event exists at `event-registry.ts:656`) carrying
   both the numeric `overall` and a short `rationale` string derived from `DebateEvaluator`. Reuses an
   existing event name; no new engine.
2. **Bridge debate→cognitive** per doc `04` §7 so the cognitive trace UI can show debate steps.
3. **Expose Bayesian trajectory** by having `BayesianJudge.update` optionally emit a lightweight
   `debate:runtime:agent:scored` delta (belief before/after + driver claim id). Reuses existing event.
4. **Tag verdicts with provenance** (`heuristic` vs `llm`) on `DEBATE_VERDICT_GENERATED` without
   changing the schema semantics — add an optional `method` field. OPINION.

---

## 10. Citations Appendix (VERIFIED)

| Claim              | Citation                                                                                                               |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Pipeline builder   | `debate-pipeline-builder.ts:474` (return), `:188` (thinking), `:199` (responded), `:383` (consensus), `:430` (verdict) |
| Phase handler      | `debate-phase-handler.ts:36` (createPhaseChangeHandler), `:177` (scoreArguments), `:103` (evaluateBlindly)             |
| DebateEvaluator    | `debate-evaluator.ts:64` (class), `:67` (scoreArguments), `:65` (ctor)                                                 |
| BayesianJudge      | `bayesian-judge.ts:25` (update), `:20-34` (belief logic)                                                               |
| Conclusion engine  | `debate-conclusion-engine.ts:58` (ctor), `:60` (generateVerdict)                                                       |
| Governor threshold | `debate-governor.ts:14` (CONVERGENCE_THRESHOLD=85), `:187`, `:196` (shouldStop)                                        |
| Quality techniques | `debate-quality-settings.ts:11-723`; count confirmed by `i18n/translations/en/quality.ts:5` ("56")                     |
| Debate events      | `event-registry.ts:597,601,605,609,626,656,826,1208`                                                                   |
