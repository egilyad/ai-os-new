# N3 Judging Audit — Consensus confidence vs Evaluator overall vs factuality/evidence (без кода)

> Дата: 2026-09-07. Scope: Debate Engine judging `Consensus confidence` + `Evaluator overall` + `factuality/evidence` (J-1 two universes). Тип: **forensic GAP audit, НИКАКОЙ код не менять**, не создавать второй runtime, не трогать Council migration/SSOT.

---

## GAP Register — Judging (9 + Evidence 8 + Topology 3 already N2, but Judging focus 9 here)

### Consensus confidence (DebateConsensusEngine)

| GAP | Title | File:line | Current path | Status | Class | P |
|-----|-------|-----------|--------------|--------|-------|---|
| **J-C1** | Consensus evaluate isolated from Evaluator | `debate-consensus:61 evaluate(claims) → hash 62 + findAgreements 70 cosine FNV 0.6 147 + findConflicts 71 isContradictory 238 + calculateConfidence 87 (agreement+avgConf)/2 -0.3*unresolved + argTechBonus 89` → `ConsensusResult 87` | Working but never reads `Claim.citations/evidence` preserved `gatherClaims:28` but ignored `calculateConfidence 205`, never reads `evaluator.overall` | dead/unwired documented-only | architecture/quality | **P0** J-1 half |
| **J-C2** | argTechBonus fire-and-forget | `debate-consensus:56 setArgTechBonus` + `argtech-consensus-bridge:17 computeArgTechBonus Dung grounded + Toulmin avg` + `phase-handler:93 void applyArgTechToConsensus(...).catch` | N1 wired but `void` swallow, `bonus null→x` hash, `catch{}` lost if `>12` cap throw `argtech:142` | working but frag. | architecture/runtime | **P0** AT-1 live-but-racy |
| **J-C3** | Early-exit hard-coded 0.85 | `pipeline-builder:285 if interim.confidence>=0.85 EARLY_EXIT 286` + `policyEngine.evaluate 323` not per `StrategyGraph.convergenceThreshold 22 0.8/0.85/0.9` `registry:122` | Hard-coded `0.85` shared, `contradictionDensity/unresolved/evidenceScore` ignored | working but hard-coded | quality/architecture | **P2** J-9 |

### Evaluator overall

| GAP | Title | File:line | Class | P |
|-----|-------|-----------|-------|---|
| **J-E1** | Two scoring universes no correlation | `consensus confidence 205` vs `evaluator overall 147 0.05*count+0.3*persuasion+0.1*factuality+0.15*rebuttal+0.2*steelman+0.2*preference` — `qualityCollector` only records both `SCORE_CHANGED prior:0 160` + `consensus` as events, never `getMetrics:331` read in `llm-caller:92` or `consensus` | architecture | **P0** J-1 |
| **J-E2** | WeightedJudge scoreArguments trivial | `weighted-judge-evaluator:65 scoreArguments avgConf → overall=avgConf, rebuttal 0.5, coherence 0.6` placeholder, real tally `tallyWinner 28` only via `facade conclude` outside `IConsensusEngine` | capability/architecture | **P1** J-2 |
| **J-E3** | CouncilAware global thread-local hack | `council-aware-evaluator:21 isCouncilModeForCurrentCall globalThis.__currentDebateSessionId + getSession(sid).topology.nodes[0].config.councilMode 28` set `phase-handler:101` clear `253` — fragile concurrent, only `nodes[0]` | architecture/runtime | **P0** J-3 |
| **J-E4** | BlindEvaluation exclusive lossy | `blind-evaluation:51 evaluateBlindly 52 scoreClaimBlind 31 → overall 0.4*argQuality+0.2*rebut+0.2*persuas+0.2*factuality 102` forces `coherence:0 115 steelman:0 118`, branch `phase-handler:113 if(blindEval) 103` exclusive `else 173` discards chain | quality/architecture | **P1** J-4 |
| **J-E5** | BayesianJudge ephemeral | `bayesian-judge:15 logistic reset 18, update 25, getAdjustedScore 50` per debate `reset 94`, no persistence, no `getAllBeliefs` persist | runtime/quality | **P1** J-5 |
| **J-E6** | Scoring only on completed | `phase-handler:59 if(to==='completed'|'failed'|'cancelled')` but scoring only `if(to==='completed') 74` — `failed/cancelled/paused` no scores | capability | **P1** J-6 |
| **J-E7** | Evaluator ignores FactCheck+Provenance+Consensus | `DebateEvaluator 67` never `FactCheck.getForArgument`, `Provenance.trace`, `Consensus.getConfidenceGraph 114` — factuality now `0.6*avgConf+0.4*verified` (N2) but still heuristic | architecture | **P1** J-7 |
| **J-E8** | QualityCollector record-only no feedback | `quality-impact-collector:137 record + finalize 159 Welch pValue 56` + `phase-handler:160 SCORE_CHANGED prior:0` not real delta, never `getMetrics` read to bias next `buildDebateCallContext` | quality/architecture | **P2** J-8 |

### Factuality/evidence (from N2, still Judging)

| GAP | Title | P |
|-----|-------|---|
| **J-F1** | FactCheckService sampled unlink — `checkArgument` fire-and-forget `void` `post-processor:231` after persist, `buildDebateSystemContent 580 getForArgument round-1` warning if `round>1`, `shouldCheck sampled 0.2 84` → 80% never checked, `overallScore 128` never fed to `Consesus` | **P0** B-08 |
| **J-F2** | ProvenanceService never called from debate pipeline (only `council-service:212`) | **P1** B-06 |

---

## Current data paths

- **Consensus path:** `ReasoningStep type:claim → gatherClaims 15 → Claim{id,text,agentId,round,confidence,speaker,role,evidence/citations (N2 preserved)} → ConsensusEngine.evaluate → findAgreements FNV cosine 0.6 147 + findConflicts negation/antonym 238 → calculateConfidence (agreement+avgConf)/2 - penalty + argTechBonus 89 → ConsensusResult confidence 0..1 + contradictionDensity 85 → pipeline early-exit 285 (0.85 hard) → qualityCollector record`
- **Evaluator path:** `same Claim[] + ReasoningChain → BlindEvaluationService evaluateBlindly 51 (if blindEval present) → scoreClaimBlind len+evidence+rebuttal+structure+numbers+conf 31 → overall 102 (coherence 0) vs else DebateEvaluator scoreArguments 67 avgConf + rebuttals regex 84 + coherence chain 88 + persuasiveness 91 + factuality 0.6*avgConf+0.4*verified (N2) + steelman 12 + DpoSampler 97 → overall 114 → BayesianJudge update 132 + driftPenalty 138 → DEBATE_AGENT_SCORED 150/218 → qualityCollector SCORE_CHANGED prior:0`
- **No link:** `consensus.confidence` never inputs `evaluator.overall` and vice versa; `qualityCollector getMetrics 331` never read in `llm-caller 92` or `consensus`; `rankParticipants 170` never called in handler.

---

## Classification

- **Architecture:** J-C1, J-E1, J-E3, J-3 (two universes, global hack), A-01/A-07 evidence drop (N2 fixed), B-06 Provenance unwired
- **Capability:** J-E2 weighted trivial, J-E4 blind lossy, J-E5 ephemeral, J-E6 only completed
- **Quality:** J-C3 early-exit hard-coded, J-E8 record-only, J-F1 sampled, B-04/05
- **UX:** Ranking not explainable (no `citationsVerified` axis in UI), tie-break undefined
- **Runtime-dependent:** J-E3 concurrent, J-E5 reset, J-F1 sampled LLM verify 0.2

---

## Priority

| Priority | GAPs | Pre-runtime (static) vs Runtime-pending |
|----------|------|-----------------------------------------|
| **P0** | J-C1, J-E1, J-E3, J-F1 (4) | **Pre:** Wire `consensus.confidence ↔ evaluator.overall` via `qualityCollector` read or `ConsensusResult` as input to `scoreArguments` (one call, no new runtime), replace `global` with `AsyncLocalStorage` or `sessionId` param, make `FactCheckService.checkArgument` blocking for `citationsVerified` when `citationsVerified` needed (not sampled). **Runtime:** Brier live, FactCheck LLM verify sampled 0.2→verified. |
| **P1** | J-C2, J-E2/4/5/6/7, J-F2 + B-05/06 (8) | **Pre:** Toulmin valid check bounded (already N1), Kialo >12 heuristic, `Provenance addNode/link` from `debate-llm-caller/memory` (no new table), `Bayesian` persist `getAllBeliefs` to `keyValue`, scoring on `failed` via `phase-handler` guard. **Runtime:** `FactCheck LLM` 0.2→verified, `RAG` provenance linkage. |
| **P2** | J-C3, J-E8 + B-02/07, C-05 (5) | **Pre:** `QualityCollector` feedback loop design (read `getMetrics` to bias next `buildDebateCallContext`), `early-exit 0.85` per `StrategyGraph.convergenceThreshold` | **Runtime:** `early-exit` per strategy tuning. |

---

## Recommended next narrow batch (без Council migration, без второго runtime)

**Batch N3 — Judging correlation (J-1, highest architectural leverage, 1 call, no new runtime):**

- **Goal:** Make `J-1` live: `consensus.confidence` ↔ `evaluator.overall` mutual input via existing `QualityCollector` or direct `ConsensusResult` as `scoreArguments` extra param.
- **Files:** `debate-consensus:61` already `confidence` + `contradictionDensity` available, `debate-evaluator:67` `scoreArguments` + `qualityCollector:137` `record` + `phase-handler:91` already sets `__currentDebateSessionId` + `evaluator` call.
- **Effect:** `consensus.confidence` (with `argTechBonus` N1 + `evidence` N2) informs `evaluator.factuality` or `overall`; `evaluator.overall` informs `consensus` early-exit threshold — one evaluation universe, not two.
- **RUNTIME-PENDING:** Brier live, Kialo >12, `FactCheck` LLM 0.2.

**Do NOT do now:** `J-E3 AsyncLocalStorage` (needs runtime), `J-F1` sampled 0.2→all (needs provider), `TS-1` councilMode already D4.4a.

---

## Expected effect (N3)

- `Consensus confidence` (with ArgTech + evidence) and `Evaluator overall` (with `citationsVerified` N2) become correlated → `qualityCollector` attribution shows `consensus↔evaluator` delta → `early-exit` uses correlated confidence, not isolated 0.85.

---

## RUNTIME-PENDING (не делать на слабом ПК)

- `FactCheck LLM verify` `sampled 0.2` → `citationsVerified` needs provider `groq/gemini`.
- `Provenance` graph depth `trace(decisionId, depth)` needs real `addNode/link` from debate pipeline.
- `BayesianJudge` persistence `getAllBeliefs` → `keyValue`.

---

## STOP — жду GO на N3 Judging correlation (один конкретный batch) — по одному.

С богом — audit без реализации, только GAPs.
