# DEBATE ENGINE GAP AUDIT (без реализации) — ArgTech + Evidence + Judging приоритет

> Дата: 2026-09-07. Scope: Debate Engine (DebateConsensusEngine + DebateEvaluator + CouncilAwareEvaluator + ArgTech + Evidence/Provenance + Judging + Topology/Strategies). Тип: **forensic GAP audit, НИКАКОЙ код не менять**, не создавать второй runtime, не трогать Council migration/SSOT, no big build/runtime.

---

## GAP Register (26 GAPs)

### ArgTech wiring (7)

| GAP | Title | File:line | Current path | Classification | P | Status |
|-----|-------|-----------|--------------|----------------|---|--------|
| **AT-1** | ArgTech bridge unwired (0 callers) | `argtech-consensus-bridge:17` + `debate-consensus:56 setArgTechBonus` vs 0 invocation in `phase-handler`, `pipeline-builder`, `engine` | `Claim[] → ConsensusEngine.evaluate` never sees Dung/Toulmin/Brier (bonus null) → `confidence` without ArgTech | architecture/runtime-dependent | **P0** | dead/unwired |
| **AT-2** | Toulmin bonus stub | `bridge:36` skip Toulmin `toulmin/*` KV | `createToulmin 174` completeness 0-1 write-only TLR, not read by bridge | capability | **P1** | documented-only |
| **AT-3** | Brier live calibration pending | `argtech:213 forecast` + `223 resolveClaim` Brier | `bridge:42` skip Brier live pending, no `happened` ground truth | runtime-dependent | **P1** | capability |
| **AT-4** | Kialo tree orphaned | `plantThesis 239, branchClaim 253, treeScore 285` `claimtree/*` | No UI, no phase-handler mapping, no `treeScore→consensus` | capability/UX | **P1** | dead |
| **AT-5** | Dung events never consumed | `argtech:106 DUNG_ATTACK` + `event-registry:2125` defines, 0 listeners | Emitted but never `argumentGraphService`/`DebateGovernor` | architecture | **P1** | dead telemetry |
| **AT-6** | preferredExtensions cap 12 brute force | `argtech:142` `if ids>12 throw` `2^n` `164` | Intentional cap, no heuristic approx | capability/quality | **P1** | documented |
| **AT-7** | mineClaims LLM fallback unwired in pipeline | `argtech:66 CLAIM_HINT` + LLM chat `71` | Never called from `debate-llm-caller:88` or `debate-memory-extractor`, only `FleetPanel:288` demo | runtime-dependent | **P2** | working but unused |

### Evidence (7)

| GAP | Title | File:line | Classification | P |
|-----|-------|-----------|---------------|---|
| **EV-1** | Evidence field never populated in runtime | `Claim.evidence/citations 173` empty end-to-end, `debate-llm-caller:96` no extractCitations | capability/architecture | **P0** |
| **EV-2** | FactPacket island (Council) | `council-types:61 FactPacket sources` + `council-service:212 provenance` working, but `debate:0 FactPacket import`, `council-to-debate-mapper:75` comment only | architecture | **P0** |
| **EV-3** | ProvenanceService never called from Debate pipeline | `trust/provenance-service:26 addNode/link/trace` only `council-service:212` + `asset-service:55`, zero from `debate-llm-caller/memory/consensus/phase-handler/post-processor` | architecture/runtime | **P1** |
| **EV-4** | RAGRetriever evidence-agnostic | `debate-rag-retriever:27 retrieveRelevantDebates 34` + `injectMemory 1269` summary `Found N chunks` no `citations[]`, no provenance linkage | quality/runtime | **P2** |
| **EV-5** | FactCheckService sampled unlink | `fact-check-service:63` `checkArgument 98` `sampled 0.2 84`, `overallScore 128` never fed to `DebateEvaluator.factuality 92` nor `BlindEvaluation 96` nor `Consensus calculateConfidence 205` | quality/architecture | **P1** |
| **EV-6** | Evidence flow drops fidelity | `debate-llm-caller:203 estimateConfidence` → `recordStep:204` single `confidence` → `gatherClaims 27` copies confidence → `Consensus evaluate 61` never weights `evidence/citations` | architecture | **P1** |
| **EV-7** | Confidence vs provenance duality | `ReasoningStep.confidence` LLM self-reported, not `Provenance.trace` calibrated | quality | **P2** |

### Judging (9)

| GAP | Title | File:line | Classification | P |
|-----|-------|-----------|---------------|---|
| **J-1** | Two scoring universes, no correlation | `Consensus confidence 205` (agreementScore+avgClaimConf/2 - conflictPenalty) vs `Evaluator overall 114` (`0.05*argCount+0.3*persuasion+0.1*factuality+0.15*rebuttal+0.2*steelman+0.2*preference`) — `qualityCollector` only records both, not mutual input | architecture | **P0** |
| **J-2** | WeightedJudgeEvaluator scoreArguments trivial | `weighted-judge-evaluator:65` `overall=avgConf, rebuttal 0.5, coherence 0.6` placeholder, real tally `tallyWinner 28` only via facade `conclude` outside `IConsensusEngine` | capability/architecture | **P1** |
| **J-3** | CouncilAwareEvaluator global thread-local hack | `council-aware-evaluator:21` `globalThis.__currentDebateSessionId` + `phase-handler:91` set/clear `242` — fragile concurrent/async, only `nodes[0].config.councilMode` check | architecture/runtime | **P0** |
| **J-4** | BlindEvaluationService lossy | `blind-evaluation:51` `scoreClaimBlind 31` forces `coherence:0, steelmanQuality:0 115` — exclusive `if(blindEval) 103` vs standard `else 173` discards chain | quality | **P1** |
| **J-5** | BayesianJudge ephemeral | `bayesian-judge:15` logistic `reset 94` per debate, no persistence, no UI for `posterior` | runtime/quality | **P1** |
| **J-6** | Scoring only on completed | `phase-handler:59` `if(to==='completed') 74` — `failed/cancelled/paused` get no scores | capability | **P1** |
| **J-7** | Evaluator ignores FactCheck+Provenance+Consensus | `DebateEvaluator 67` never `FactCheck.getForArgument` nor `Provenance.trace` nor `Consensus.getConfidenceGraph 114` — factuality `avgConf+0.1` heuristic | architecture | **P1** |
| **J-8** | QualityCollector record-only, no feedback | `quality-impact-collector:105 record 137` + `finalizeSession 159` Welch p-value, but `debate-llm-caller:92` never reads `getMetrics/getAttribution` to bias next round | quality/architecture | **P2** |
| **J-9** | Consensus early-exit hard-coded 0.85 | `pipeline-builder:285 if(interim.confidence>=0.85) EARLY_EXIT` + `policyEngine.evaluate 323` not per `convergenceThreshold 0.85` per strategy | quality | **P2** |

### Topology/Strategies (3, lower priority)

| GAP | Title | P |
|-----|-------|---|
| **TS-1** | CouncilMode detection fragmented (`nodes[0].config.councilMode` vs `topology.metadata` vs `topology.type council`) | **P1** architecture |
| **TS-2** | Strategy primitives not validated vs Evaluator/Consensus compatibility | **P2** quality |
| **TS-3** | Fingerprinting/Strategist injected but not scored (`strategy-fingerprint` regex only) | **P2** quality |

---

## Priority

| Priority | GAPs | Pre-runtime (static) vs Runtime-pending |
|----------|------|-----------------------------------------|
| **P0** | AT-1, EV-1, EV-2, J-1, J-3 (5) | **Pre:** Wire `argtechBridge→Consensus` (one call), populate `Claim.citations/evidence` from `mineClaims` or `FactCheck`, bridge Council `FactPacket sources` via mapper (already D4.3 fix) but need Debate Runtime `evidence` path, correlate `consensus.confidence ↔ evaluator.overall` via `qualityCollector` read, replace `global` with `AsyncLocalStorage` or `sessionId` param. **Runtime:** Brier live needs `happened` source. |
| **P1** | AT-2/3/4/5/6, EV-3/4/5/6, J-2/4/5/6/7, TS-1 (15) | **Pre:** Toulmin `toulmin/*` KV read in bridge, Kialo UI stub → `treeScore` doc, Dung events → `argumentGraphService` wiring plan, `FactCheck overallScore → factuality` mapping, `Blind` chain preservation, `Bayesian` persist `getAllBeliefs` to `keyValue`, scoring on `failed` via `phase-handler` guard. **Runtime:** `Brier resolveClaim` live, `FactCheck` LLM verify, `RAG` provenance linkage needs real retrieval. |
| **P2** | AT-7, EV-7, J-8/9, TS-2/3 (6) | **Pre:** `mineClaims` call from `debate-memory-extractor`, `confidence` calibration via `Provenance` depth, `QualityCollector` feedback loop design. **Runtime:** `early-exit 0.85` per strategy tuning. |

---

## Recommended next narrow batch (без Council migration, без второго runtime)

**Batch N1 — ArgTech minimal wiring (highest architectural leverage, 1 call, no new runtime):**

- **Goal:** Make `AT-1` live: `argtech-consensus-bridge → DebateConsensusEngine` actually influences `confidence`.
- **Files:** `argtech-consensus-bridge:17` add `Toulmin` KV read (1 line), `debate-consensus:56` already `setArgTechBonus` hook, `debate-phase-handler:89` set `__currentDebateSessionId` already for `CouncilAware` but reuse for `argTechBonus` — add `applyArgTechToConsensus` call in `phase-handler` before `evaluate`.
- **Effect:** `Dung grounded +0.04` + `Toulmin completeness *0.1` → `confidence +0.02..0.1` → `ConsensusResult` → `qualityCollector` → `early-exit` threshold.
- **RUNTIME-PENDING:** Brier live, Kialo >12.

**Batch N2 — Evidence population (capability, enables 3 other GAPs):**

- **Goal:** Fill `EV-1` `Claim.citations/evidence` from `FactCheck + mineClaims + RAG`.
- **Files:** `debate-llm-caller:88` after `buildDebateCallContext` → `mineClaims(text)` → `Claim.citations = evidenceHint`, `fact-check-service:98` `checkArgument` → `Claim.evidence = checkResult.verdict`, `gatherClaims 27` preserve `evidence/citations`.
- **Effect:** Enables `EV-5` factuality, `EV-6` confidence weighting, `J-7` factuality.

**Do NOT do now:** `J-1` correlation refactor (needs design), `J-3` `AsyncLocalStorage` (needs runtime), `TS-1` councilMode flag migration (already D4.4a).

---

## Expected effect (N1)

- `Consensus confidence` gains `+0.04` Dung + `0.03` Toulmin when argtech data exists → `contradictionDensity` unchanged but `confidence` reflects argument structure → `qualityCollector` attribution visible in `FleetPanel` (already `qualityCollector.record` in `phase-handler:148`).
- No new runtime, no Dexie, no `council*` touch.

---

## RUNTIME-PENDING (не делать на слабом ПК)

- `Brier live calibration` (needs `happened` ground truth, strong PC LLM `resolveClaim`)
- `Kialo treeScore >12` brute → heuristic approx (needs real claim tree)
- `FactCheck LLM verify` `sampled 0.2` → `factuality` (needs provider)
- `BayesianJudge` persistence `getAllBeliefs` → `keyValue`

---

## STOP — жду GO на N1 (ArgTech minimal wiring) или N2 (Evidence) — по одному.

С богом — audit без реализации, только GAPs.
