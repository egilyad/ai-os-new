# N1 Audit — ArgTech Minimal Wiring → Consensus (без второго runtime)

> Дата: 2026-09-07. Scope: один узкий batch `Claims → ArgTech (Dung+Toulmin) → ArgTech bonus → DebateConsensusEngine → Consensus confidence → QualityCollector → early-exit`. Без Council migration, без Dexie, без SSOT cutover, без нового consensus/evaluator/runtime.

---

## 1) Точный data flow ArgTech → Consensus

```
DebateSession (deliberating → consensus)
  ↓ DebateMemory.getChain(agentId) → ReasoningChain.steps type:claim → gatherClaims:15 (Claim{id, text, agentId, round, confidence, speaker, role})
  ↓ DebateMemoryExtractor.extractFromTimeline(sessionId, tl) → extracted.units → extractClaims(units)
  ↓ [N1] debate-phase-handler:89 if(deps.evaluator && deps.argTech) → require('../debateplus/argtech-consensus-bridge').applyArgTechToConsensus(evaluator as DebateConsensusEngine, argTech) — fire-and-forget bounded
  ↓ argtech-consensus-bridge.computeArgTechBonus(argTech): Dung groundedExtension() + Toulmin toulmin/* KV avg completeness → bonus -0.2..0.2 clamped
  ↓ DebateConsensusEngine.setArgTechBonus(bonus) → lastClaimsHash = null (cache invalidated) 56
  ↓ evaluate(claims): hash = claims→confidence + |b:bonus → findAgreements (FNV cosine ≥0.6) + findConflicts (negation/antonym) → calculateConfidence = (agreementScore+avgClaimConf)/2 -0.3*unresolvedRate+0.1*resolvedBonus → + argTechBonus (clamped 0..1) 85
  ↓ ConsensusResult {agreements, conflicts, unresolved, confidence, contradictionDensity} → DebatePhaseHandler emits? (not yet, but confidence used for early-exit 285 if interim.confidence>=0.85 + policyEngine 323)
  ↓ qualityCollector.record SCORE_CHANGED 148/214
```

**Files:** `debate-consensus:52` `argTechBonus: number|null` + `setArgTechBonus:57` + `evaluate 62` `+ argTechBonus`, `argtech-consensus-bridge:17 computeArgTechBonus` + `50 applyArgTechToConsensus`, `debate-phase-handler:91` wiring `if(deps.argTech) void apply...catch`, `debate-engine-types:40 argTech?: IArgTechService`, `phase3:532` `evaluator: councilAwareEvaluator ?? standard` + `argTech: try get argTechService` + `debate-engine:280` `argTech: this.deps.argTech` passed to handler.

---

## 2) Какие ArgTech методы реально вызываются

| Method | Called? | Where | Evidence |
|--------|---------|-------|----------|
| `addDungArgument / addDungAttack` | ✅ via external `CouncilService`/`FleetPanel mineClaims` (not N1) | `argtech-service:94` KV `dung/args` | Not in N1 path, but `groundedExtension` reads them |
| `groundedExtension()` | ✅ | `bridge:22` `await argTech.groundedExtension()` | Dung grounded non-empty → +0.04 |
| `preferredExtensions()` | ❌ (cap >12) | Not called in N1 | RUNTIME-PENDING Kialo live >12 |
| `createToulmin` / `Toulmin completeness` | ✅ via `toulmin/*` KV read | `bridge:30` `dal.kv.list('toulmin/')` → valid `completeness 0..1` → avg | ToulminBonus |
| `forecast / resolveClaim` Brier | ❌ | `bridge:42` Brier live pending comment | Not in N1 |
| `plantThesis / branchClaim / treeScore` Kialo | ❌ | `bridge:9` Kialo live >12 pending | Not in N1 |

**Real in N1:** `groundedExtension` + `toulmin/*` list (via `dal.kv.list` inside bridge, not exposed `IArgTechService` but via `as unknown` private dal access) — **2 methods**.

---

## 3) Dung/Toulmin contribution (bounded deterministic, no double count)

- **Dung:** `groundedExtension().length>0 → +0.04` `bridge:27` — deterministic (empty→0, non-empty→+0.04), bounded `+0.04`.
- **Toulmin:** `toulminBonus: avgCompleteness 0..1 → (avg-0.5)*0.12 → -0.06..+0.06` `bridge:30` — checks `valid = typeof completeness 0..1 && gaps array` `valid.length` → `avg` → bounded, deterministic via KV persisted `createToulmin 204` `completeness Math.round(...*100)/100`.
- **Sum:** `bonus = Dung 0.04 + Toulmin -0.06..+0.06 → -0.02..+0.10` → final clamp `Math.max(-0.2, min(0.2, bonus)) 46` via `setArgTechBonus 57` clamp `-0.2..0.2` + `evaluate 85` `clamp 0..1` confidence. **No double count:** Dung and Toulmin independent signals (structure vs completeness), sum bounded, not per-claim double.

**Valid Toulmin result:** persisted `toulmin/${id} {completeness: number 0..1, gaps: string[]}` `argtech:232` with `completeness: Math.round(...*100)/100` — valid if `0<=c<=1` and `gaps` array, else skip `validCount 0 → no Toulmin bonus`.

---

## 4) Fallback при отсутствии данных

- No Dung args or `grounded empty` → `hasData false → Dung bonus 0` `bridge:27`
- No Toulmin cards or `valid.length 0` → `Toulmin bonus 0` `bridge:30`
- If both `hasData false` → `computeArgTechBonus returns null 45` → `applyArgTechToConsensus: bonus null → engine.setArgTechBonus(null) → evaluate hash `b:x` → `confidence` without bonus (existing `calculateConfidence` only)
- `try/catch` capped `>12` Dung `142` throw → no Dung bonus, `catch` → `0`
- `dal.kv.list` not available → Toulmin `0` `30`

**Deterministic:** no data → `null` → `confidence` unchanged, cache invalidated only when `bonus !== null` (`setArgTechBonus 57` `lastClaimsHash=null` when bonus not null).

---

## 5) Deterministic / bounded behavior

- **Bounded:** `Dung +0.04` + `Toulmin -0.06..+0.06` → `bonus -0.06..+0.10` → `setArgTechBonus clamp -0.2..0.2` → `evaluate confidence clamp 0..1 209` → deterministic.
- **Deterministic:** KV persisted `completeness` rounded `0.01` steps, `groundedExtension` sorted `[...ext].sort() 134`, `hash = claims→confidence + |b:bonus 62` same input → same `ConsensusResult` object cached `lastResult` `55` (skip O(n²) recomputation). No `Math.random` in bonus.
- **No double count:** `bonus` sum of independent Dung/Toulmin, not per-claim loop.

---

## 6) Какие tests/fixtures покрывают путь

- **Existing:** `debate-consensus:52` `argTechBonus` + `setArgTechBonus` cache invalidate — no test yet, but `D4.4a CouncilAwareEvaluator` `getSession` lazy `topology.config.councilMode` tested via `simulation-engine-service.test` councilMode flag.
- **N1 static fixtures (prepare, RUNTIME-PENDING for vitest on strong PC):** `Claim[]` fixture `2 claims` + `dung/args 2` + `toulmin card completeness 0.8` → `computeArgTechBonus → 0.04 + (0.8-0.5)*0.12=0.036 → 0.076` → `evaluate → confidence +0.076` vs `null` baseline. `argtech-service:174` `createToulmin` already emits `TOULMIN_CARD` + persists `toulmin/${id}` with gaps.
- **No new tests added in N1** per GO `existing setArgTechBonus/cache not duplicated` — static verification only.

---

## 7) Что остаётся RUNTIME-PENDING

- `Brier live calibration` (`forecast/resolveClaim` needs `happened` ground truth) — `bridge:42` not applied in N1.
- `Kialo treeScore >12 brute` (`preferredExtensions` cap 12 `142` throw) — `bridge:9` RUNTIME-PENDING.
- `FactCheckService` sampled `0.2` unlink, `RAG` provenance — not in N1.
- `CouncilMigration` bulk (100 sessions) — NO-GO, `council*` still SSOT, `DebateStore` secondary (dual-write as before).

---

## 8) Подтверждение, что второго runtime/pipeline не создано (GO 8)

| Check | Evidence | Result |
|-------|----------|--------|
| `IDebateEvaluator` | `WeightedJudgeEvaluator implements IDebateEvaluator` (one interface, `councilMode` via `topology.nodes[0].config.councilMode` 30) | ✅ one evaluator |
| `IConsensusEngine` | `DebateConsensusEngine setArgTechBonus` existing `56` (not `CouncilConsensusEngine`) | ✅ one consensus |
| `Provenance` | `IProvenanceService` wave10 reused `council-service:212` not duplicated | ✅ |
| `EventBus` | `DUNG_ATTACK 106` + `TOULMIN_CARD 205` etc already `event-registry:2125` no new bus | ✅ |
| `DebateEngine` | `argTech?: IArgTechService` additive `engine-types:40` + `phase3 argTech: try get argTechService` + `debate-engine:280 argTech: this.deps.argTech` passed to handler — no second engine | ✅ |

---

## GO / NO-GO

### 🟢 PASS — N1 ArgTech minimal wiring — `Claims → ArgTech (Dung grounded + Toulmin valid completeness) → bounded bonus -0.2..0.2 → DebateConsensusEngine confidence` closed existing wire, no new mechanism, no heuristic `+0.02..0.1` without mapping, no second consensus/evaluator/runtime, no Council migration, no Dexie tables, no SSOT cutover.

**STOP — жду вердикта перед N2 Evidence.**
