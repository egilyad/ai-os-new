# 16 — Debate Quality & Evaluation Layer (RESEARCH-ONLY)

> Read-only research document. No source modified, no git/commit.
> Repo root: `C:\Users\egily\Desktop\ai-os-new`
> Confidence labels: **VERIFIED** = confirmed by Read/Grep on actual source; **INFERRED** = deduced; **OPINION** = assessor judgement.
> Important: `DebateEvaluator`, `BayesianJudge`, and `BlindEvaluationService` are **scoring SERVICES**, NOT debate participants/agents. The debate "agents" are LLM participants; these services judge their output post-hoc.

---

## 1. The scoring / judging layer (services, not agents)

### 1.1 `DebateEvaluator` — `debate-evaluator.ts`

- Class `DebateEvaluator implements IDebateEvaluator` at `debate-evaluator.ts:64`. Constructor takes optional `IDpoStrategySampler` (`:65`) — DPO strategy sampling is an _input_, not a participant.
- Core method `scoreArguments(agentId, claims, chain): AgentScore` at `:67`. It computes `argumentCount`, `avgConfidence` (`:68-71`) and `rebuttals` via regex heuristics for however/nevertheless/on-the-other-hand etc. (`:73-84`, including RU patterns `однако`/`тем не менее` at `:82-83`). Returns an `AgentScore`.
- This is a pure function over claims/reasoning chains — it never speaks in the debate. **VERIFIED scoring SERVICE.**

### 1.2 `BayesianJudge` — `bayesian-judge.ts`

- Class `BayesianJudge implements IBayesianJudge` at `bayesian-judge.ts:15`. Bayesian belief updating: prior `0.5` (`:21`), `update(agentId, argumentStrength)` at `:25` maps strength `(-1..1)` → likelihood via logistic `strengthToLikelihood` (`:9-13`) and computes posterior.
- It maintains `beliefs: Map<agentId, {posterior, updates}>` (`:16`). It is a belief tracker, not a speaker. **VERIFIED scoring SERVICE.**

### 1.3 `BlindEvaluationService` — `blind-evaluation-service.ts`

- Class `BlindEvaluationService implements IBlindEvaluationService` at `blind-evaluation-service.ts:51`.
- Consumed in `debate-phase-handler.ts:101-119`: if `deps.blindEval` present, `blindEval.evaluateBlindly(participantIds, claims, getChain)` (`:103`) is called and the returned per-agent blind scores (`overall/argumentQuality/rebuttalStrength/coherence/persuasiveness/factuality`, `:110-118`) are attached to participants. This is invoked inside the phase handler's evaluation block (around `:95` bayesian reset, `:101` blind eval). **VERIFIED scoring SERVICE, wired into the phase pipeline.**

### 1.4 How they are composed

- `debate-phase-handler.ts` is the integration point: Bayesian (`:95-99`) + Blind (`:101-119`) run after a round. `DebateEvaluator.scoreArguments` is the claim-level scorer. `debate-engine-types.ts:131` carries `blindEval?: IBlindEvaluationService` and `:33` imports the contract — confirming these are injectable dependencies, not agents.

---

## 2. The 40+ quality-technique modules (representative inventory)

`debate-runtime/` contains far more than 40 discrete quality/analysis modules. Representative sample (file:line = definition/class location, VERIFIED via directory listing + spot reads):

| Module                     | File                                     | Role (INFERRED from name + partial read)          |
| -------------------------- | ---------------------------------------- | ------------------------------------------------- |
| Bias profiler              | `bias-profiler.ts`                       | detects rhetorical/cognitive bias                 |
| Blind evaluation           | `blind-evaluation-service.ts:51`         | anonymous scoring (§1.3)                          |
| Calibration service        | `calibration-service.ts`                 | confidence calibration                            |
| Bayesian judge             | `bayesian-judge.ts:15`                   | belief update (§1.2)                              |
| Causal graph builder       | `causal-graph-builder.ts`                | causality extraction                              |
| Concept blender            | `concept-blender.ts:114`                 | blend frameworks on deadlock                      |
| Best-of-n                  | `best-of-n.ts`                           | n-best selection                                  |
| BOP service                | `debate-bop-service.ts`                  | benefit-of-the-doubt                              |
| Consistency service        | `debate-consistency-service.ts`          | self-consistency checks                           |
| Credibility service        | `debate-credibility-service.ts`          | source credibility                                |
| Duplicate detection        | `debate-duplicate-detection.ts`          | `isDuplicateArgument` exported (`index.ts:54`)    |
| Embedding pipeline         | `debate-embedding-pipeline.ts`           | semantic vectors                                  |
| Entanglement engine        | `debate-entanglement-engine.ts`          | claim entanglement                                |
| Minimax planner            | `debate-minimax-planner.ts`              | game-theoretic planning                           |
| Meta-agent controller      | `debate-meta-agent-controller.ts`        | meta orchestration                                |
| Metrics                    | `debate-metrics.ts`                      | graph/activity/quality metrics (`index.ts:46-51`) |
| Policy engine              | `debate-policy-engine.ts`                | debate policy                                     |
| Prompt quality gates       | `debate-prompt-quality-gates.ts`         | pre-send quality gates                            |
| Rhetorical device selector | `rhetorical-device-selector.ts`          | style selection                                   |
| Steelman service           | `debate-steelman-service.ts`             | strongest-version rewriting                       |
| Strategist                 | `debate-strategist.ts`                   | strategy choice                                   |
| Vulnerability service      | `debate-vulnerability-service.ts`        | find weak points                                  |
| Expert witness service     | `expert-witness-service.ts`              | invoked expert                                    |
| Frame tracker              | `frame-tracker.ts`                       | framing tracking                                  |
| GoT deliberation           | `got-deliberation.ts`                    | graph-of-thought                                  |
| Incentive detector         | `incentive-detector.ts`                  | incentive analysis                                |
| Justification enforcer     | `justification-enforcer.ts`              | require justification                             |
| Level tracker              | `level-tracker.ts`                       | argumentation level                               |
| Logical-form extractor     | `logical-form-extractor.ts`              | formal logic                                      |
| Narrative builder          | `narrative-builder.ts`                   | narrative synthesis                               |
| Outcome forecaster         | `outcome-forecaster.ts`                  | predict outcome                                   |
| Persona drift detector     | `persona-drift-detector.ts`              | persona stability                                 |
| Persona mixer              | `persona-mixer.ts`                       | blend personas                                    |
| Persona selector           | `persona-selector.ts`                    | pick persona                                      |
| Similarity monitor         | `similarity-monitor.ts`                  | near-duplicate monitor                            |
| Stakeholder mapper         | `stakeholder-mapper.ts`                  | stakeholder analysis                              |
| Stance drift tracker       | `stance-drift-tracker.ts`                | stance consistency                                |
| Insight bus                | `insight-bus.ts`                         | insight propagation                               |
| Scratchpad service         | `scratchpad-service.ts`                  | working memory                                    |
| Belief mining              | `debate-belief-mining-service.ts`        | belief extraction                                 |
| Shadow opponent            | `debate-shadow-opponent-service.ts`      | adversarial shadow                                |
| Adversarial source         | `debate-adversarial-source-service.ts`   | adversarial evidence                              |
| RTOM service               | `debate-rtom-service.ts`                 | real-time ops mgmt                                |
| Strategist (manager)       | `debate-strategy-manager.ts`             | strategy versioning (`index.ts:75`)               |
| Conclusion engine          | `debate-conclusion-engine.ts:60`         | verdict generation (§4)                           |
| Consensus engine           | `debate-consensus.ts`                    | consensus scoring (§3)                            |
| Governor                   | `debate-governor/debate-governor.ts:196` | stop/convergence (§3)                             |

That is 46+ named technique modules — comfortably exceeds the "40+" claim. **VERIFIED count ≥ 40.**

---

## 3. Consensus quality

- `debate-governor/debate-governor.ts:14` defines `private readonly CONVERGENCE_THRESHOLD = 85`.
- `shouldStop()` at `:196-211`: stops when `phase !== 'active'`; never before round 2 (`:199`); stops at `maxRounds` (`:200`); on no novel claims (`:201`); on convergence plateau (`:202`); or when critical contradictions resolved AND `>5` claims (`:203-208`).
- `isConvergencePlateau()` uses `CONVERGENCE_THRESHOLD` at `:187`: `recent.every(s => s > 85)` AND `max-min < 10` (`:187-189`). So convergence = sustained score > 85 with < 10 variance.
- `DebateConsensusEngine` (`debate-consensus.ts`, exported `index.ts:5`) is the dedicated consensus scorer; `debate-consensus.test.ts` exists (regression-covered).
- **VERIFIED:** consensus quality is a numeric plateau threshold (85) on a convergence score series, with a separate consensus engine.

---

## 4. Conclusion / verdict engine

- `debate-conclusion-engine.ts:60` `generateVerdict(snapshot, timeline): DebateVerdict` extracts key arguments (`:62`), determines conclusion type + stance result (`:63-64`), builds summary + reasoning (`:65-66`).
- Confidence heuristic at `:76-79`: `min(0.95, 0.5 + (round/(round+3))*0.3)` if tokens > 0 else `0.3`.
- Heuristic fallback verdict also generated in `debate-sync-manager.ts:620-639` on governor-stop/cancel (so UI never shows empty messages) — this is a _fallback_, not the LLM verdict path.
- **VERIFIED:** verdict = LLM-generated via conclusion engine, with a heuristic fallback for early stop/cancel.

---

## 5. `DebateQualityPanel` current capability

- `DebateQualityPanel.tsx` exists (component presence VERIFIED). It consumes the per-agent quality scores described in §1 (overall/argumentQuality/rebuttalStrength/coherence/persuasiveness/factuality from `blind-evaluation-service.ts:110-118`) and likely `debate-metrics` outputs.
- **INFERRED (panel internals not fully read):** the panel displays aggregate scores but, per the gaps below, does not show _why_ a score was assigned.

---

## 6. Gaps (research findings)

1. **No per-argument rationale surfaced to UI (OPINION/INFERRED).** `DebateEvaluator.scoreArguments` (`debate-evaluator.ts:67`) produces an `AgentScore` but the regex-based sub-signals (rebuttal detection `:73-84`) are not exposed as human-readable justifications. The UI shows a number, not the evidence.
2. **No explanation of judge scoring (OPINION).** `BayesianJudge.update` (`:25`) updates a posterior silently; `BlindEvaluationService.evaluateBlindly` (`:103`) returns numeric sub-scores with no natural-language rationale. Users cannot audit _why_ agent X scored 0.7.
3. **Quality not correlated to downstream (INFERRED).** Quality scores are not fed into `CrystalDebateBridge` (which keys only on `verdict.confidence`, `crystal-debate-bridge.ts:80`) or Forum/Analytics. A high blind-eval loser may still crystallize if its verdict confidence is high.
4. **No human-in-the-loop quality gate (OPINION).** No integration blocks verdict publication / crystal formation on a human quality approval. `debate-human-service.ts` exists (human inject/override) but is not wired as a _quality approval gate_ before `DEBATE_VERDICT_GENERATED`.

---

## 7. Recommendations (reuse existing services — no new engine)

- **R1 — Surface rationale:** extend `AgentScore` (contract) with an optional `rationale: string[]` populated from `DebateEvaluator`'s existing regex signals (`debate-evaluator.ts:73-84`); render in `DebateQualityPanel`. Reuses the scorer; only adds explanation fields. EFFORT S, RISK low.
- **R2 — Judge explainability:** have `BlindEvaluationService` emit a short `reasoning` string per sub-score (it already computes the components at `:110-118`); persist alongside the score. EFFORT S, RISK low.
- **R3 — Quality→Crystal correlation:** in `CrystalDebateBridge.onVerdict` (`crystal-debate-bridge.ts:44-94`), pass the best/worst `AgentScore` into the crystal `elaboration`/`evidence` so crystallized knowledge carries quality context. Reuses bridge + evaluator. EFFORT M, RISK low.
- **R4 — Human quality gate:** add an optional `requireHumanQualityApproval` flag in `debate-phase-handler.ts` evaluation block (`:101-119`) that, when set, emits a `debate:verdict:pending` event and only emits `DEBATE_VERDICT_GENERATED` after a human ack via `debate-human-service.ts`. Reuses human service; no new bus. EFFORT M, RISK med.
- **R5 — Consensus transparency:** expose `CONVERGENCE_THRESHOLD` (`:14`) and the convergence series to `DebateQualityPanel` / analytics so users see the 85 threshold and current plateau. EFFORT S, RISK low.

_End of document 16._
