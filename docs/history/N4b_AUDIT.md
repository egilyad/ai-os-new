# N4b Audit — Lifecycle Scoring `completed / early-exit / paused / cancelled / failed` (без кода)

> Дата: 2026-09-07. Scope: где именно `scoreArguments` + `DEBATE_AGENT_SCORED` + `qualityCollector.record` + `finalizeSession` вызываются для каждого терминального `phase`. Тип: **forensic, без кода**, не создавать второй runtime.

---

## 1) Summary — Scoring Gate Single-Phase

All scoring (`evaluator.scoreArguments`/`blindEval` + `bayesianJudge` + `stanceDrift` + `DEBATE_AGENT_SCORED` + `qualityCollector.record` + N3 correlation) is **exclusively** inside `debate-phase-handler:77` `if (to === 'completed')` `77` → `completed` only.

```ts
// :62 emits for completed|failed|cancelled but :77 gates scoring
if (to === 'completed' || to === 'failed' || to === 'cancelled') emit ...
  if (to === 'completed') { // :77 — ONLY path
    memoryExtractor.extractFromTimeline -> extractClaims
    evaluator.scoreArguments / blindEval.evaluateBlindly
    DEBATE_AGENT_SCORED
    qualityCollector.record SCORE_CHANGED
    N3 correlation
  }
if (to==='failed'||to==='cancelled') { /* no scoring needed */ } // :318
```

`QualityCollector.finalizeSession() 159` requires `sessionBuffers` populated by `record 137` — **never called from `DebateEngine` pipeline**. Only path is `debate-sync-manager:894` `finalizeSession` inside `_finalizeInternal:811`.

---

## 2) GAP Register per Lifecycle State

| State | File:line | `scoreArguments` + `DEBATE_AGENT_SCORED`? | `qualityCollector.record`? | `finalizeSession`? | Status | Class | P |
|-------|-----------|--------------------------------------------|----------------------------|--------------------|--------|-------|---|
| **completed (Engine-only)** | `phase-handler:77` → `pipeline-builder:consensusAndFinalize:444` `transition('completed')` | **YES** working | **YES** `SCORE_CHANGED prior:0` + `judging-correlation delta:0` | **NO** — `DebateEngine.startSession 420` never calls `finalizeSession`; only `SyncManager 902` does | Dead/unwired for `finalizeSession` on Engine path; documented `N4_AUDIT:14 Q-01` | architecture/quality (stale `QualityPanel`) | **P0** if loop promised |
| **completed (SyncManager)** | `sync-manager:_startEngineWithFinalize:478` `.then -> _finalizeInternal:811` | **YES** | **YES** | **YES** but `judgeScore` omitted (`sessionData.judgeScore ??0` at `collector:178`) → `avgJudgeScoreDelta` meaningless `pValue 256` always `none` | Working but degraded — `finalizeSession` fires, but `judgeScore=0` | quality/capability | **P1** |
| **early-exit confidence >=0.85** | `pipeline-builder:285 if interim.confidence>=0.85 earlyExit=true emit EARLY_EXIT 286 break` → `Pipeline:31 earlyExit` | Via `completed` (pipeline continues `consensusAndFinalize 372` → `completed 444` → scoring **does** fire) — not skipped; but `DEBATE_ROUND_EARLY_EXIT` abort after caller may skip scoring | **YES (via completed)** | **YES (via completed)** | Working (accidental) — relies on pipeline continuing; if caller aborts after `EARLY_EXIT`, no scoring. No dedicated `interim` path. | architecture — hidden coupling, duplicate `evaluate` | **P1** fragile |
| **early-exit allErrored (budget/paused or providers failed)** | `pipeline-builder:256 if event.allErrored → transition(paused/failed) 261 emit PAUSED 263 earlyExit=true break 355` → `DebatePipeline earlyExit 363` skip `consensusAndFinalize` | **NO** (breaks before `273` interim) | **NO** except per-arg `ARGUMENT_FEATURE` at `llm-caller:555` | **NO** — `SyncManager:483 if paused sync+return` skips `finalizeInternal`; `failed` via `catch 347 transition failed` also no scoring | Dead/unwired — `J-6` correctly flagged, `QualityCollector` misses | architecture/capability/UX | **P0** quality |
| **paused (manual / policy / budget)** | `debate-engine:596 pauseSession 616 transition('paused') 624 emit PAUSED` ; `pipeline-builder:327 policyEngine pauseSession` ; `state-machine:40 paused:{RESUME}` | **NO** — `phase-handler` has no `if(to==='paused')` branch (`62` only completed/failed/cancelled) | **NO** | **NO** — correctly **not** `finalizeSession` (paused ≠ finalized), but **missing interim persisted scoring** | Dead for scoring, correct for finalize guard — `paused` correctly excluded from `TERMINAL_STATES 71` and `SyncManager finalize`. Gap is lack of `interim` scoring (persisted `record` without `finalize`) | architecture/quality/runtime (resume needs interim) | **P0** scoring / **P0 not finalized** |
| **cancelled** | `debate-engine-cancel:89 cancelDebateSession 178 transition('cancelled') 183 emit CANCELLED → phase-handler 62 emit, 302 skip saveSnapshot, 318 no scoring` | **NO** | **NO** except `ARGUMENT_FEATURE` | **NO** — correctly not finalized (`SyncManager:831` guard). `QualityCollector` buffers leak until `destroy:129` or `finalizeSession:328 delete` — cancel never deletes → leak until GC `cleanupStaleSessions:195` 30m | Working as intended — cancelled is abort, not scoring event. Unwired buffers intentional cleanup, not GAP unless interim required | architecture/UX | **P2** |
| **failed** | `pipeline-builder:261 transition('failed')` ; `engine:394 timeout cancelSession` ; `catch:347 transition('failed')` ; `phase-handler:62 emit FAILED, 302 skip saveSnapshot, 318 no scoring` | **NO** | **NO** | **NO** — correctly not finalized via `qualityCollector`. `getActiveSessions:689` excludes `failed`. | Working as intended — `failed` = infrastructure error, scoring would be noisy (avgOverall on 0 claims `N3` fallback `0`). If partial args exist, could do interim, but spec says score only on `completed`. | capability/quality / runtime (provider outage) | **P2** (or **P1** if “score partial failed for debugging” required) |

---

## 3) finalizeSession Call-Site Forensics

| Caller | File:line | When | `sessionBuffers` Source | `getMetrics/getAttribution` Update? |
|--------|-----------|------|-------------------------|--------------------------------------|
| **Engine pipeline** | `engine:420 buildPipeline.run → pipeline:47+82` | `startSession` (queued→…→completed) | `phase-handler:161/229/267` + `llm-caller:555` | **Never** — `quality-impact-collector:159` not invoked → `aggregatedMetrics 108` stale |
| **SyncManager (completed)** | `sync-manager:902` inside `_finalizeInternal:811` after `finalizeDebateState:862` | `.then` of `engine.startSession` if phase not `paused/cancelled/failed` `483` → `finalizeInternal` | Same buffers | **Yes** — `groupByTechnique 419`, `Welch pValue 56`, `lastTouch 451`, `persistAllMetrics 570`, emits `DEBATE_QUALITY_IMPACT_COMPUTED` |
| **SyncManager (paused)** | `483 early sync` | `engine.startSession` resolves `paused` | Same | **No** — correct: `paused≠finalized`, `_finalizeInternal` not reached |
| **PhaseHandler** | `—` | — | — | **Never** — no import, `N4_AUDIT:26` recommends adding `finalizeSession(sessionId, {judgeScore: avgOverall})` after scoring block |

---

## 4) Verdict — `paused` should NOT be treated as finalized

**Current behavior is correct for `finalizeSession` but wrong for interim scoring:**

* **Not finalized:** ✅ `debate-state-machine:71` `TERMINAL_STATES` excludes `paused`; `engine:689 getActiveSessions` keeps `paused` alive; `SyncManager:483` skips `finalizeInternal`; `SyncManager:831` skips `finalizeSession` for terminal only. `paused→queued` via `RESUME` `251` is valid. Treating `paused` as `completed` would corrupt `QualityCollector` leaderboard (frequencyInBestRounds expects only finished sessions).
* **Missing interim `record`:** ❌ `pauseSession:596` does not `qualityCollector.record` nor `scoreArguments`. UI `QualityPanel` shows `none`. Resume `resumeSession:630 startSession(true) skipAgents:149` re-enters `roundLoop` with no scores from first half. Correct fix per `N4_AUDIT:26` is **interim, persisted scoring without `finalizeSession`**: shared `finalizeScoring(claims)` guarded by `claims.length>0` called on `completed` **and** `paused`/`earlyExit` (budget), but `finalizeSession` called **only** on `completed` (or final `resume→completed`).

---

## 5) Architecture Classification

* `completed Engine-only missing finalizeSession` → `architecture` (two runtime paths divergence) + `quality` (stale `QualityPanel`) **P0 if loop promised**
* `early-exit confidence` → `architecture` (fragile implicit continuation) **P1**
* `early-exit paused` / `paused` → `architecture/capability/quality/UX` — dead scoring, not `documented-only` (N4 explicitly flags `J-6` **P0 quality**, `Q-01` **P0**) — interim persisted scoring vs finalized must be split
* `cancelled/failed` → `capability/quality` — dead/unwired is *intentional*; only becomes GAP if “score partial” required **P2**
* `judgeScore not propagated` (both completed paths) → `quality` bug — `record prior:0` + `SyncManager:894` missing `judgeScore` → `avgJudgeScoreDelta` meaningless **P1**
* `setCurrentSessionId` singleton race → `runtime-dependent` — `phase-handler:102` `globalThis` → instance field N4a fixed, still pending `AsyncLocalStorage` **P0 architecture/runtime**

---

## Recommended next narrow batch (без Council migration, без второго runtime)

**N4b — Lifecycle scoring split (one batch, 2 small wiring, no new runtime):**

1. **Extract `finalizeScoring(claims)` shared** — `evaluator/bayesian/blindEval/qualityCollector + N3 correlation` out of `if(to==='completed') 77` to reusable `finalizeScoring(sessionId, claims)` guarded by `claims.length>0` called on `completed` **and** `earlyExit`/`paused` (budget) — but `finalizeSession` still **only** on `completed` (or final `resume→completed`).
2. **Add `qualityCollector.finalizeSession(sessionId, {judgeScore: avgOverall})` after scoring block** (mirrors `sync-manager:902`) for Engine-only `completed` path — no new runtime.

**Expected effect:** `paused`/`earlyExit` get `overall/factuality` + `correlation` + persisted `record` (not finalized), `completed` gets `finalizeSession` → `QualityPanel` shows `aggregatedMetrics` for all terminal states, `early-exit` no longer hidden coupling.

**STOP — жду GO на N4b (one concrete batch).**
