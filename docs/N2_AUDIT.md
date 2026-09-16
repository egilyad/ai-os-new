# N2 Evidence Audit — Claim/Fact → Evidence → Debate Argument → Consensus/Evaluator/Provenance (без кода)

> Дата: 2026-09-07. Scope: Debate Engine evidence path `Claim.evidence/citations` + `FactPacket sources` + `Provenance` + `RAG/FactCheck` + `Consensus/Evaluator` + `pipeline`. Тип: **forensic GAP audit, НИКАКОЙ код не менять**, не создавать второй runtime, не трогать Council migration/SSOT.

---

## GAP Register — 20 GAPs

### Claim Shape (8)

| GAP | Title | File:line | Current path | Status | Class | P |
|-----|-------|-----------|--------------|--------|-------|---|
| **A-01** | Claim.evidence/citations unwired in runtime | `contracts/debate-runtime:173` `Claim{evidence?,citations?}` → `consensus:28 gatherClaims` | `pipeline-builder:203 estimateConfidence → recordStep type:'claim' confidence → Memory.chains → gatherClaims extracts step.content only, hardcodes speaker:agentId role:'' 34-35, loses evidence/citations` | dead/unwired | architecture/quality | **P0** |
| **A-02** | ReasoningStep.type='evidence' dead | `contracts/debate-runtime:213` `type:'claim'|'evidence'|'rebuttal'|'synthesis'` + `pipeline-builder:207` always `type:'claim'` → `gatherClaims 27` filters `type==='claim'` only | Dead type, `memory-extractor:118` would map `evidence` but never produced | dead | architecture | **P1** |
| **A-03** | DebateMemory recordClaim dead store | `debate-memory:185 recordClaim()/getClaimsForTopic()` never called from Engine/Pipeline/LlmCaller (grep 0) → `claims[] stays []` | Dead store | architecture | **P2** |
| **A-04** | FactPacket → Claim heuristic incomplete | `council-to-debate-mapper:76` `facts→confidence 0.9/0.2/0.5 + evidence sources[0] + citations sources` ; `messages→confidence 0.6` | Working but heuristic, whisper `channel/toId` dropped vs comment `preserved` false | capability/quality | **P1** |
| **A-05** | CouncilMessage body→DebateArgument lossy | `mapper:87` `channel/toId` discarded, double-blind alias not applied | Unwired | architecture/UX | **P2** |
| **A-06** | DebateArgument vs Claim confidence duality | `pipeline-builder:203 estimateConfidence` vs `memory-extractor:118 0.5/0.6/0.7` vs `governor/claim-extractor:10` hedging list fork | Inconsistent | quality/runtime | **P1** |
| **A-07** | gatherClaims drops citations/evidence & role | `debate-consensus:15` `loops steps type==='claim' → new Claim{id,text,agentId,round,confidence,speaker:agentId,role:''}` strips evidence/citations/embedding | Lossy | architecture | **P0** |
| **A-08** | estimateConfidence duplicated thresholds | `debate-llm-utils:70` vs `claim-extractor:10` hedging regex differ | Fork | quality | **P3** |

### Evidence Population (8)

| GAP | Title | File:line | Class | P |
|-----|-------|-----------|-------|---|
| **B-01** | buildDebateCallContext evidence not injected as citations | `debate-llm-caller:45` `recentSteps 71` + `allSteps slice(-50) 90` + `FactCheck isQ fact-checking round>1 575` else absent; `RAGRetriever injectMemoryIntoDebate 1269` after all prompts | capability/quality | **P1** |
| **B-02** | DebateMemory coherence ignores evidence | `debate-memory:117 recordStep coherence 240` `consistent/confidence >= prev*0.5` only, `trimContent 254` wipes 8 | quality | **P2** |
| **B-03** | DebateConsensusEngine evidence agnostic | `debate-consensus:61` `evaluate` cosine 0.6 + negation/antonym + `calculateConfidence 193` `(agreement+avgClaimConf)/2 -0.3*unresolved` — no `citations`/`evidence`, `argTechBonus` dead unless caller sets `void` swallow `phase-handler:93` | capability | **P1** |
| **B-04** | DebateEvaluator factuality heuristic | `debate-evaluator:67` `factuality = min(1, avgConf + (chain.length>0?0.1:0)) 92` — `EvidenceTriangulation` registered `phase3:503` but never injected into evaluator | quality | **P0** |
| **B-05** | BlindEvaluationService detached | `blind-evaluation:51 evaluateBlindly` ignores `getChain` arg `55`, `coherence:0 115` + `steelmanQuality:0 118` — exclusive `if(blindEval) 103` vs standard `else 173` discards chain | quality | **P1** |
| **B-06** | ProvenanceService unwired from debate | `trust/provenance-service:37 addNode/link/trace` only `council-service:212` + `asset-service:55`, zero from `debate-llm-caller/memory/consensus/phase-handler/post-processor` | architecture/capability | **P1** |
| **B-07** | RAGRetriever low-fidelity late | `debate-rag-retriever:27` `retrieveRelevantDebates threshold 0.3 topK 3` + `simpleEmbedText 64-dim TF 171` `MAX_CHUNKS 200` + `injectMemoryIntoDebate 1269` `<external_data>DO NOT TRUST` | quality/capability | **P2** |
| **B-08** | FactCheckService sampled unlink | `fact-check-service:90` `checkArgument` fire-and-forget `void` `post-processor:231` via `_syncSessionImpl 708` after persist, `buildDebateSystemContent 580 getForArgument` reads previous round `round-1` warning `574 if round>1`, `shouldCheck sampled 0.2 84` → 80% never checked, `overallScore 128` never fed to `factuality` | architecture/quality | **P0** |

### Pipeline (6)

| GAP | Title | File:line | Class | P |
|-----|-------|-----------|-------|---|
| **C-01** | pipeline-builder records evidence-less steps, trims aggressively | `pipeline-builder:199` `estimateConfidence → recordStep type:'claim'` no evidence, `trimContent(8) 254` wipes after round → `getAllSteps slice(-50)` empty | architecture/quality | **P1** |
| **C-02** | consensusAndFinalize re-gathers from stale memory | `pipeline-builder:370` `gatherClaims` before verdict, `keyArguments` from `conclusionEngine` not `evaluate` → `saveVerdict` stores summary only | architecture | **P2** |
| **C-03** | phase-handler scoring fork blind vs evaluator + global hack | `phase-handler:76` `on completed → extractFromTimeline → extractClaims → if blindEval 103 vs else 173` + `global __currentDebateSessionId 101` race if two sessions complete concurrently | architecture/quality + UX | **P0** |
| **C-04** | qualityCollector evidence recording but no feedback | `debate-llm-prompt-context:92` `qualityCollector.record` `SERVICE_EXECUTED` etc, `phase-handler:160` `SCORE_CHANGED prior:0` not real prior, never reads `getMetrics` to bias next round | quality | **P2** |
| **C-05** | early-exit on interim confidence before evidence mature | `pipeline-builder:273` `if interim.confidence>=0.85 earlyExit` — no `unresolved>0` or `evidenceScore` check, evidence needs `round>1` but loop exits early | quality | **P2** |
| **C-06** | post-pipeline sync re-processes but evidence services duplicated, not awaited | `debate-session-bridge:136 mergeAndProcessSession` `post-processor:181 processGovernorFeeding + processFactCheck void` `debate-sync-manager:705` debounced 16ms → may prompt with empty `getForArgument` | architecture/runtime | **P2** |

---

## Priority

| Priority | GAPs | Pre-runtime (static) vs Runtime-pending |
|----------|------|-----------------------------------------|
| **P0** | A-01, A-07, B-04, B-08, C-03 (5) | **Pre:** Populate `Claim.citations/evidence` from `mineClaims` or `FactCheck` before `recordStep`, preserve `evidence` via `gatherClaims`, make `factuality` read `FactCheckService.getForArgument` + `Provenance` link, fix `scoring fork` to include `citationsVerified` axis. **Runtime:** Brier live, `FactCheck` LLM verify `sampled 0.2` → `factuality`. |
| **P1** | A-02/04/06, B-01/03/05/06, C-01 (10) | **Pre:** `ReasoningStep.type:'evidence'` produce via `type:evidence` when `evidenceHint` present, `Council FactPacket island` bridge via mapper already D4.3 fix but need Debate `evidence` path, `B-01` inject citations as structured `citations[]` not opaque `<external_data>`, `B-06` wire `ProvenanceService addNode/link` from `debate-llm-caller/memory` (no new table), `B-05` preserve `coherence/steelman` in blind path via `getChain`. **Runtime:** `RAG` provenance linkage needs real retrieval. |
| **P2** | A-03/05, B-02/07, C-02/04/05/06 (7) | **Pre:** Dead store `recordClaim` remove or wire, `CouncilMessage channel/toId` preserve via `Timeline payload`, `trimContent 8` less aggressive, `qualityCollector` feedback loop design. **Runtime:** `early-exit 0.85` per strategy tuning. |

---

## Recommended next narrow batch (без Council migration, без второго runtime)

**Batch N2 — Evidence population (capability, enables 3 other GAPs):**

- **Goal:** Fill `A-01` `Claim.citations/evidence` from `mineClaims` or `FactCheck` before `DebateMemory.recordStep`, preserve via `gatherClaims` `A-07`, make `B-04` `factuality` read `FactCheck` + `Provenance` (not `avgConf+0.1`), fix `C-03` scoring fork to include `citationsVerified` axis.
- **Files:** `debate-llm-caller:88` after `buildDebateCallContext` → `mineClaims(text)` → `Claim.citations`, `fact-check-service:98` `checkArgument` → `Claim.evidence`, `gatherClaims 27` preserve `evidence/citations`, `debate-evaluator:92` factuality `min(1, avgConf*0.6 + citationsVerified*0.4)` (example), `debate-consensus:193` confidence `+ evidenceScore` (not `argTechBonus` double).
- **Effect:** Enables `B-05` factuality, `B-06` confidence weighting, `J-7` factuality, `EV-1` consensus evidence-aware.

**Do NOT do now:** `J-1` correlation refactor (needs design), `J-3 AsyncLocalStorage` (needs runtime), `TS-1` councilMode flag migration (already D4.4a).

---

## Expected effect (N2)

- `Consensus confidence` gains `evidenceScore` (citations count) + `factuality` → `contradictionDensity` weighted by evidence, `QualityCollector` attribution visible.
- No new runtime, no Dexie, no `council*` touch.

---

## RUNTIME-PENDING (не делать на слабом ПК)

- `FactCheck LLM verify` `sampled 0.2` → `factuality` (needs provider)
- `Provenance` graph depth `trace(decisionId, depth)` needs real `addNode/link` from debate pipeline (needs `ProvenanceService` wiring with `IProvenanceService` from `trust` — already D2.3 for Council, now for Debate)
- `RAG` provenance linkage needs real embedding `simpleEmbedText` vs vector DB

---

## STOP — жду GO на N2 Evidence (один конкретный batch) — по одному.

С богом — audit без реализации, только GAPs.
