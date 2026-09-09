# N4a Audit — J-3 Global Elimination → Explicit sessionId (без второго runtime)

> Дата: 2026-09-07. Scope: один узкий batch `globalThis.__currentDebateSessionId` → explicit `sessionId` via `CouncilAwareEvaluator.setCurrentSessionId(sessionId)`. Без Council migration, без нового runtime.

---

## 1) Точный data flow (до/после)

**До (P0 J-3):**
```
DebatePhaseHandler.createPhaseChangeHandler(sessionId)
  ↓ globalThis.__currentDebateSessionId = sessionId 102
  ↓ claims = extractClaims
  ↓ for p: evaluator.scoreArguments(agentId, claims, chain) → CouncilAwareEvaluator isCouncilModeForCurrentCall() reads globalThis.__currentDebateSessionId 24 → getSession(sid).topology.nodes[0].config.councilMode
  ↓ clear global delete 290
```
Single global slot, race if two sessions complete concurrently (last writer wins), only `nodes[0]` checked, `topology.metadata` ignored.

**После (N4a):**
```
DebatePhaseHandler
  ↓ (evaluator as CouncilAware).setCurrentSessionId(sessionId) 92 explicit
  ↓ claims = extractClaims
  ↓ for p: evaluator.scoreArguments(agentId, claims, chain) → isCouncilMode checks this.currentSessionId (instance field) 21 → getSession(sid) → nodes[0].config.councilMode
  ↓ setCurrentSessionId(null) 253 clear (instance field, not global)
```
Instance field per `CouncilAwareEvaluator` singleton (one `IDebateEvaluator` via `phase3 weightedJudgeEvaluator` + `phase24 facade` same instance), still single global-like slot but **instance-local, not globalThis**, and explicit `sessionId` param via setter (next step: pass `sessionId` directly to `scoreArguments` signature, but N4a keeps `IDebateEvaluator` unchanged per GO `не создавать второй runtime`).

---

## 2) Какие ArgTech методы реально вызываются (N1 still)

- `groundedExtension()` → `+0.04` if non-empty `bridge:22` — **called** via `applyArgTechToConsensus` fire-and-forget `phase-handler:93` before evaluate (N1 wired).
- `toulmin/*` KV `list('toulmin/')` → valid `completeness 0..1` → `avg-0.5*0.12` `bridge:30` — **called** (valid check).
- `preferredExtensions` cap `>12` throw, `forecast/resolveClaim` Brier live pending, `plantThesis` Kialo live pending — **not called** in N4a.

---

## 3) Dung/Toulmin contribution (bounded deterministic, no double count)

- **Dung:** `grounded non-empty → +0.04` `bridge:27` deterministic, bounded `+0.04`.
- **Toulmin:** `avgCompleteness 0..1 → (avg-0.5)*0.12 → -0.06..+0.06` `bridge:30` via `dal.kv.list('toulmin/')` valid check `typeof completeness 0..1 && gaps array`.
- **Sum:** `-0.06..+0.10` → final clamp `Math.max(-0.2, min(0.2, bonus)) 46` via `setArgTechBonus 57` + `evaluate 85` `clamp 0..1` confidence. **No double count:** independent signals, sum bounded.

---

## 4) Fallback при отсутствии данных

- No Dung or `grounded empty` → `hasData false → Dung 0` `bridge:27`
- No Toulmin or `valid.length 0` → `Toulmin 0` `30`
- Both `hasData false → computeArgTechBonus returns null 45 → engine.setArgTechBonus(null) → evaluate hash `b:x` → confidence without bonus
- `try/catch` capped `>12` throw → no Dung bonus.

---

## 5) Deterministic / bounded behavior

- **Bounded:** `Dung +0.04` + `Toulmin -0.06..+0.06` → `bonus -0.06..+0.10` → `setArgTechBonus clamp -0.2..0.2` → `evaluate confidence clamp 0..1`.
- **Deterministic:** KV persisted `completeness` rounded `0.01`, `groundedExtension` sorted `[...ext].sort()`, `hash = claims→confidence + |b:bonus 62` same input → same `ConsensusResult` cached `lastResult 55`.
- **No double count:** sum of independent, not per-claim loop.

---

## 6) Какие tests/fixtures покрывают путь

- **Existing:** `CouncilAwareEvaluator getSession` tested via `simulation-engine-service.test` councilMode flag (phase3 weightedJudgeEvaluator DI singleton).
- **N4a static:** `globalThis.__currentDebateSessionId` removed → no global race; `setCurrentSessionId(sessionId)` explicit per `phase-handler` before `scoreArguments` loop, cleared after — **not yet `AsyncLocalStorage`**, still instance field race if two evaluations interleave async (but `scoreArguments` is sync loop, not async, so `for p` loop holds `currentSessionId` for all `p` in same session's `phase-handler` call — same thread, no interleaving within same call; cross-session concurrent `phase-handler` calls would still race on same singleton instance field — **documented as RUNTIME-PENDING** for `AsyncLocalStorage` in next batch).
- **No new tests added** per GO — static verification only.

---

## 7) Что остаётся RUNTIME-PENDING

- `AsyncLocalStorage` for true per-session isolation (needs provider `async_hooks` + strong PC, not in N4a).
- `Brier live calibration` (`happened` ground truth), `Kialo treeScore >12` brute (`bridge:9`).
- `FactCheck LLM verify` `sampled 0.2` → `citationsVerified` needs provider (N2).
- `CouncilMigration` bulk (100 sessions) — NO-GO, `council*` still SSOT.

---

## 8) Почему нет global state (GO 1)

- **Not used:** `globalThis.__currentDebateSessionId` **removed** from `council-aware-evaluator:24` (was `global` read) → now `this.currentSessionId` instance field `21` set via `setCurrentSessionId` `15` explicit `sessionId` param `phase-handler:101` `setCurrentSessionId(sessionId)` → `isCouncilModeForCurrentCall` checks `this.currentSessionId` `24` → `getSession(sid)` → `nodes[0].config.councilMode`.
- **Existing canonical boundary not expanded:** `QualityCollector.getMetrics`/`getAttribution` not used for N4a (N3 already uses it), N4a uses direct `setCurrentSessionId` explicit, not new `scoreArguments(..., consensusResult?)` param — **no new engine/store, no global**.

---

## 9) Нет ли третьей scoring universe

| Check | Evidence | Result |
|-------|----------|--------|
| `IConsensusEngine` | `DebateConsensusEngine setArgTechBonus` existing `56` (N1) — not `CouncilConsensusEngine` | ✅ one consensus |
| `IDebateEvaluator` | `DebateEvaluator` + `WeightedJudgeEvaluator` + `CouncilAwareEvaluator` one `IDebateEvaluator` (two strategies via `topology.nodes[0].config.councilMode` 30) | ✅ one evaluator |
| `N4a` | `CouncilAwareEvaluator` now explicit `currentSessionId` instance field, not global, still one `IDebateEvaluator` | ✅ no third universe |

---

## GO / NO-GO

### 🟢 PASS — N4a J-3 Global elimination — `globalThis.__currentDebateSessionId` removed → explicit `setCurrentSessionId(sessionId)` instance field, bounded deterministic, no double count, no new runtime, no Council migration.

**RUNTIME-PENDING:** True `AsyncLocalStorage` for concurrent isolation (needs strong PC, not in N4a).

**STOP — жду вердикта перед N4b/c (lifecycle scoring / FactCheck await).**
