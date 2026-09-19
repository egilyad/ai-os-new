# N2 Post-Implementation Audit — Evidence Population (без второго scoring)

> Дата: 2026-09-07. Scope: один узкий batch `Claim.citations/evidence` → `gatherClaims` → `factuality min(1, avgConf*0.6 + citationsVerified*0.4)` via `FactCheckService` verified, existing path. Без Council migration, без нового EvidenceService, без второго runtime.

---

## 1) Файлы изменены

| Файл | Что |
|------|-----|
| `debate-runtime/debate-consensus:15 gatherClaims` | `+ maybe.evidence/citations` + `role` preservation: `maybe = step as {evidence?,citations?,source?,role?}`, `evidence: maybe.evidence ?? maybe.source`, `citations: maybe.citations`, `role: participant.role ?? step.role ?? ''` — A-01 + A-07 closed, no loss `source/reference, confidence, claim relation, role, timestamp/round` if existing |
| `debate-runtime/debate-evaluator:64` | `+factCheckService?: getter` + `getFactCheck()` lazy, `factuality = citationsVerified !== null ? min(1, avgConf*0.6 + citationsVerified*0.4) : min(1, avgConf + (chain.length>0?0.1:0))` — before: `min(1, avgConf+0.1)` heuristic only |
| `service-registration/phase3:223` | `debateEvaluator: new DebateEvaluator(DpoSampler, () => c.get('factCheckService'))` lazy getter — existing path, not new runtime |

**Не изменены:** `FactCheckService` (existing `checkArgument`/`getForArgument`/`getAll`/`overallScore verified/total 128`), `DebateMemory` `ReasoningStep` type, `EvidenceService` not created, Council SSOT, `J-1/J-3` etc.

---

## 2) Какой существующий путь теперь реально вызывается

```
Claim (content + confidence via estimateConfidence 203 + recordStep type:'claim' 207)
  ↓ DebateMemory.chains → gatherClaims:15 now preserves evidence/citations/role (was stripped)
  ↓ DebateMemoryExtractor.extractClaims → Claim[] with evidence/citations intact
  ↓ DebatePhaseHandler:91 if(deps.evaluator) → claims → for p: chain = getMemory.getChain → evaluator.scoreArguments(agentId, claims, chain)
  ↓ DebateEvaluator.scoreArguments: claims.filter agentId → avgConfidence + chain coherence + rebuttals → citationsVerified via FactCheckService.getForArgument(cl.id) per claim (verified overallScore) → avg → factuality = 0.6*avgConf +0.4*citationsVerified (if has verified data) else fallback 0.1
  ↓ overall → rankParticipants → DEBATE_AGENT_SCORED + qualityCollector + Consensus confidence (argTechBonus still D2.2)
```

**Before N2:** `gatherClaims` stripped `evidence/citations/role` → `evaluator.factuality` never saw `citationsVerified` → `B-04` dead. **After N2:** same `gatherClaims` preserves, `evaluator` reads `FactCheckService` verified ratio — **existing path now actually passes evidence**.

---

## 3) Что именно проходит от Claim до Consensus/Evaluator

- `Claim.text` + `confidence` (avgConf) → `Consensus` `agreementScore` (FNV cosine) + `avgClaimConfidence` → `confidence`
- `Claim.citations: string[]` (from `FactPacket sources` via mapper `sources→citations` or `mineClaims evidenceHint`) → preserved in `gatherClaims` → available to `Consensus` (still not weighted in `calculateConfidence 205` — intentionally not in N2, only `Evaluator` factuality)
- `Claim.evidence: string` (first source or `evidenceHint`) → preserved
- `Claim.speaker: participant.agentId` + `role` → preserved (was `role:''` hard-coded, now `participant.role`)
- `Claim.round/timestamp` → preserved via `step.round ?? currentRound` + `step.timestamp`

**No loss:** `source/reference, confidence, claim relation, role, timestamp/round` if existing in `ReasoningStep` (via `maybe` cast) — preserved.

---

## 4) Какие evidence/citation поля сохраняются

- `citations: string[]` (e.g., `https://...` or `Source: ...`) — from `FactCheckService` not directly, but `Claim.citations` set via `mineClaims` or `FactPacket sources` mapper `sources→citations` `82` — now `gatherClaims` keeps `maybe.citations`.
- `evidence: string` (first citation or `evidenceHint` `Search evidence for: ... 89`) — `maybe.evidence ?? maybe.source`.
- Both survive `gatherClaims` → `Consensus` (currently not used in `calculateConfidence` — intentional N2 scope: only `Evaluator factuality`) → `Evaluator` via `FactCheckService` (not via `Claim.citations` directly, but via `overallScore`).

**Duplicate counting avoided:** `citationsVerified` is `avg of per-claim verified overallScore` (verified/total), not `citations.length` sum — each claim counted once, `scores[]` per claim, not per citation string.

---

## 5) Точная формула factuality и источник каждого входа

```ts
avgConfidence = claims.filter(c.agentId===agentId).reduce(s=>s+confidence)/count
citationsVerified = 
  if FactCheckService exists:
    per-claim: getForArgument(cl.id)?.overallScore (verified/total per claim, from FactCheckService 128: verified/total)
    avg = scores.reduce(a+b)/scores.length
    else if no per-clam data but getAll().length>0 and verified>0: avg = all.reduce(a+b.overallScore)/all.length
    else null
factuality = citationsVerified !== null
  ? min(1, avgConfidence*0.6 + citationsVerified*0.4)  // existing data allows verified measure
  : min(1, avgConfidence + (chain.length>0?0.1:0))     // fallback heuristic, no fictitious metric
```

- `avgConfidence` — from `Claim.confidence` (LLM `estimateConfidence` 203, not heuristic 0.5-0.7 fork)
- `citationsVerified` — **VERIFIED citations**, not `citations.length` (via `FactCheckService` `overallScore = verified/total 128`, where `verified` = `verdict==='verified'` `130`)
- `chain.length>0?0.1:0` — fallback only when `FactCheck` has no verified data — **no arbitrary fallback 0.4**.

---

## 6) Fallback при отсутствии evidence/FactCheck

- `citationsVerified === null` (no `FactCheckService` or `getAll 0` or `verified 0`) → `factuality = min(1, avgConf + (chain.length>0?0.1:0))` old heuristic — **existing behavior preserved**, no `+0.4` fictitious.
- `Claim.citations undefined` → `gatherClaims` keeps `undefined` (no `|| []` forcing) — `Evaluator` then sees `null` via `FactCheck` miss → fallback.
- Deterministic + bounded `min(1, ...)` + `Math.round(overall*100)/100 126`.

---

## 7) Отсутствие второго runtime/scoring path

| Check | Evidence | Result |
|-------|----------|--------|
| `IDebateEvaluator` | `WeightedJudgeEvaluator implements IDebateEvaluator` (one interface, councilMode via `topology.nodes[0].config.councilMode` 30) + `DebateEvaluator` same `IDebateEvaluator` | ✅ one evaluator interface, two strategies selectable per session (already D4.4a) |
| `IConsensusEngine` | `DebateConsensusEngine setArgTechBonus` existing `56` (N1) — not `CouncilConsensusEngine` | ✅ one consensus |
| `EvidenceService` | Not created — `FactCheckService` existing `fact-check-service:63` reused via getter, no new `EvidenceService` | ✅ |
| `Council` | Not touched | ✅ |
| `Debug` | No new `Evidence runtime` — `mineClaims` + `FactCheck` existing `argtech-service:66` + `fact-check-service:90` reused | ✅ |

---

## 8) Тесты/fixtures

- **Existing:** `debate-evaluator` no direct test for `factuality` with `FactCheck`, but `D4.4a CouncilAwareEvaluator getSession` tested via `simulation-engine-service.test` councilMode flag.
- **N2 static fixtures (prepare, RUNTIME-PENDING for vitest on strong PC):** `Claim[]` with `citations: ['https://...']` + `FactCheckService` mock `getForArgument → {overallScore: 0.8}` → `factuality = 0.6*avgConf +0.4*0.8` vs `null` baseline `avgConf+0.1`. `argtech-service:66` `mineClaims` heuristic `CLAIM_HINT` already tested via `FleetPanel:288` demo.
- **No new tests added in N2** per GO `existing cache/hash invalidation` — static verification only.

---

## 9) Что осталось RUNTIME-PENDING

- `FactCheck LLM verify` `sampled 0.2` → `citationsVerified` needs provider `groq/gemini/openrouter` `getCachedApiKey 155` — strong PC `FactCheckService.checkArgument` LLM `sendMessage` 199.
- `Provenance` graph depth `trace(decisionId, depth)` needs real `addNode/link` from debate pipeline (needs `ProvenanceService` wiring with `IProvenanceService` — already D2.3 for Council, now for Debate `evidence` → `provenanceNodes/Edges`).
- `RAG` provenance linkage needs real embedding `simpleEmbedText` vs vector DB.

---

## GO / NO-GO

### 🟢 PASS — N2 Evidence population — `Claim.citations/evidence` now real via `mineClaims/FactCheck` → `gatherClaims` preserved → `citationsVerified` (verified, not length) → `factuality min(1, 0.6*avgConf+0.4*verified)` bounded deterministic, fallback preserved, no second scoring, no new runtime, no Council migration.

**STOP — жду вердикта перед N3.**
