# N3 Post-Implementation Audit — Judging Correlation (без global, без третьего score)

> Дата: 2026-09-07. Scope: один узкий batch N3 correlation `Consensus confidence ↔ Evaluator overall + factuality/evidence` via `QualityCollector` existing canonical boundary. Без нового score, без нового ConsensusEngine/Evaluator/runtime.

---

## 1) Точный data flow `Consensus → correlation ← Evaluator`

```
DebateSession (completed → phase-handler onPhaseChange sessionId, session, deps, getters)
  ↓ memoryExtractor.extractFromTimeline(sessionId, tl) → extracted.units → extractClaims(units) → Claim[] (text/confidence/speaker/role + evidence/citations preserved N2)
  ↓ Branch 1: if(deps.evaluator) → for p in participants: chain = getMemory.getChain(p.agentId) → score = evaluator.scoreArguments(p.agentId, claims, chain) → bayesianJudge.update → driftPenalty → DEBATE_AGENT_SCORED (overall, factuality now 0.6*avgConf+0.4*verified via getFactCheck)
  ↓ Branch 2: same claims → consensusEngine.evaluate(claims) [N1 argTechBonus + N3 create new if deps.consensusEngine missing] → ConsensusResult {confidence, contradictionDensity, agreements, conflicts, unresolved}
  ↓ N3: if(deps.qualityCollector) → consensusForCorrelation = (deps.consensusEngine ?? new DebateConsensusEngine()).evaluate(claims) → qualityCollector.record({id: sessionId-judging-correlation, techniqueId:'judging-correlation', eventType:'SCORE_CHANGED', payload:{prior:consensus.confidence, posterior:consensus.confidence, delta:0, dimension:'consensus-evaluator-correlation', consensusConfidence, contradictionDensity, unresolvedCount}})
```

**Files:** `debate-phase-handler:89` `if(deps.evaluator) 92` branch `blindEval vs standard 113/173` → `scoreArguments 181` → `qualityCollector.record SCORE_CHANGED 228` + `debate-consensus:61 evaluate` + `debate-evaluator:67 scoreArguments` + `quality-impact-collector:137 record`.

**Existing metrics reused:** `QualityCollector.getMetrics 331` / `getAttribution 487` already intended for attribution/correlation — N3 uses `record` with `techniqueId:'judging-correlation'` (existing `QualityImpactCollector` `record` 137), not new store.

---

## 2) Какие ArgTech методы реально вызываются (N1)

- `groundedExtension()` → `+0.04` if non-empty `bridge:22` — **called** via `applyArgTechToConsensus` fire-and-forget `phase-handler:93` before evaluate.
- `toulmin/*` KV `list('toulmin/')` → avg completeness `0..1` → `+ (avg-0.5)*0.12 -0.06..+0.06` `bridge:30` — **called** (valid `completeness 0..1` check `validCount`).
- `preferredExtensions` cap `>12` throw, `forecast/resolveClaim` Brier live pending `42`, `plantThesis/branchClaim/treeScore` Kialo live `>12` pending `9` — **not called** in N3.

---

## 3) Dung/Toulmin contribution

- **Dung:** `grounded non-empty → +0.04` deterministic, bounded `+0.04`.
- **Toulmin:** `avgCompleteness 0..1 → (avg-0.5)*0.12 → -0.06..+0.06` deterministic via `Math.round(completeness*100)/100 232`, `validCount` check `typeof completeness 0..1 && gaps array`.
- **Sum:** `-0.06..+0.10` → final clamp `Math.max(-0.2, min(0.2, bonus)) 46` via `setArgTechBonus 57` + `evaluate 85` `clamp 0..1` confidence. **No double count:** Dung and Toulmin independent, sum bounded -0.2..0.2, not per-claim loop.

---

## 4) Fallback при отсутствии данных

- No Dung args or `grounded empty` → `hasData false → Dung bonus 0` `bridge:27`
- No Toulmin cards or `valid.length 0` → `Toulmin bonus 0` `30`
- Both `hasData false → computeArgTechBonus returns null 45 → engine.setArgTechBonus(null) → evaluate hash `b:x` → `confidence` without bonus (existing `calculateConfidence` only)
- `try/catch` capped `>12` `142` throw → no Dung bonus, `catch{}`.
- Deterministic `null` fallback, cache invalidated only when `bonus !== null` (`setArgTechBonus 57` `lastClaimsHash=null` when not null).

---

## 5) Deterministic / bounded behavior

- **Bounded:** `Dung +0.04` + `Toulmin -0.06..+0.06` → `bonus -0.06..+0.10` → `setArgTechBonus clamp -0.2..0.2` → `evaluate confidence clamp 0..1 209` → deterministic.
- **Deterministic:** KV persisted `completeness` rounded `0.01`, `groundedExtension` sorted `[...ext].sort() 134`, `hash = claims→confidence + |b:bonus 62` same input → same `ConsensusResult` cached `lastResult 55` (skip O(n²)).
- **No double count:** sum of independent Dung/Toulmin, not per-claim loop.

---

## 6) Какие tests/fixtures покрывают путь

- **Existing:** `debate-consensus:52` `argTechBonus` + `setArgTechBonus` cache invalidate — no test yet, but `D4.4a CouncilAwareEvaluator getSession` tested via `simulation-engine-service.test` councilMode flag.
- **N1 static fixture:** `Claim[]` with `citations verified` + `dung/args 2` + `toulmin 0.8 → bonus 0.076 → confidence +0.076` vs `null` baseline — `vitest` `RUNTIME-PENDING` сильного ПК.
- **N3 static:** `Consensus confidence` + `Evaluator overall` + `factuality` all `QualityCollector.record` with `techniqueId:'judging-correlation'` `payload {consensusConfidence, contradictionDensity, unresolvedCount}` — `getMetrics 331` / `getAttribution 487` can read, no new test added per GO.

---

## 7) Что остаётся RUNTIME-PENDING

- `Brier live calibration` (`forecast/resolveClaim` needs `happened` ground truth) — `bridge:42` not applied.
- `Kialo treeScore >12 brute` (`preferredExtensions` cap) — `bridge:9` RUNTIME-PENDING.
- `FactCheck LLM verify` `sampled 0.2` → `citationsVerified` needs provider `groq/gemini` `getCachedApiKey 155` — strong PC.
- `Provenance` graph depth `trace(decisionId, depth)` needs real `addNode/link` from debate pipeline (needs `ProvenanceService` wiring).
- `CouncilMigration` bulk (100 sessions) — NO-GO, `council*` still SSOT, `DebateStore` secondary.

---

## 8) Почему нет global state

- **Not used:** `__currentDebateSessionId` global thread-local hack `J-E3` `globalThis.__currentDebateSessionId` set `phase-handler:101` only for `CouncilAwareEvaluator isCouncilMode` (`council-aware-evaluator:21` `global + getSession(sid).topology.nodes[0].config.councilMode`). **N3 correlation does NOT use it** — uses direct `deps.qualityCollector` + local `consensusEngine.evaluate(claims)` (or `deps.consensusEngine` if provided) — **existing canonical boundary `QualityCollector.getMetrics/getAttribution`**, not new global.
- **Explicit param alternative:** `scoreArguments(..., consensusResult?)` not needed — N3 keeps `scoreArguments` signature `269 IDebateEvaluator` unchanged, correlation via `QualityCollector.record` with `consensusConfidence` payload, not new `scoreArguments` param.

---

## 9) Нет ли третьей scoring universe

| Check | Evidence | Result |
|-------|----------|--------|
| `IConsensusEngine` | `DebateConsensusEngine setArgTechBonus` existing `56` (N1) — not `CouncilConsensusEngine` | ✅ one consensus |
| `IDebateEvaluator` | `DebateEvaluator` + `WeightedJudgeEvaluator` + `CouncilAwareEvaluator` one `IDebateEvaluator` (two strategies via `topology.nodes[0].config.councilMode` 30) | ✅ one evaluator |
| `N3` | `QualityCollector.record techniqueId:'judging-correlation' dimension:'consensus-evaluator-correlation'` — **attribution, not new score** `prior:consensusConfidence posterior:consensusConfidence delta:0` — no `new magical score 0.83` | ✅ correlation, not third universe |
| `Factuality` | `Evaluator.factuality ← FactCheck verified ratio` (N2) separate signal, not recalculated in N3 | ✅ separate, not double-count |

---

## GO / NO-GO

### 🟢 PASS — N3 Judging correlation — `Consensus confidence ↔ Evaluator overall + factuality` attribution via `QualityCollector` existing canonical boundary, no global, no new score/engine/runtime, deterministic bounded, fallback `null` → existing confidence.

**STOP — жду вердикта перед N4.**
