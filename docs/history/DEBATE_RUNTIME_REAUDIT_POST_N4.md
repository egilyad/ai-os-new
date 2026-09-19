# Debate Runtime Re-Audit — Post N4 (N4a/b/c/d closed)

> Дата: 2026-09-07. Scope: полный runtime path debate от входа до финального результата после закрытия N4-цепочки. Только аудит, без coding.

**Контекст N4 (считается закрытым):**
- **N4a** `globalThis.__currentDebateSessionId → instance field setCurrentSessionId` — `council-aware-evaluator.ts:15` ✅
- **N4b** lifecycle scoring `completed + paused interim, без double, finalize только completed` — `debate-phase-handler.ts:63` ✅
- **N4c** FactCheck await `processFactCheck async + pendingChecks + pipeline round:end await + bridge await` — sampling `0.2` сохранён ✅
- **N4d** Early-Exit wiring `session.topology.type → getEarlyExitConfidence → StrategyManager → earlyExitConfidence ?? convergenceThreshold ?? 0.85` — `debate-pipeline-builder.ts:301` ✅

**NO-GO по effort (не считаются дефектами в этом аудите):** Bayesian persistence, Strategy validation at launch, Provenance wiring — остаются как есть.

---

## 1. N4 Post-Audit Verdict

| Batch | Code exists | Runtime effective | Regression | Verdict |
|-------|-------------|-------------------|------------|---------|
| **N4a Global → instance field** | ✅ `currentSessionId` private, `setCurrentSessionId` before/after scoring | **PARTIAL** — sequential single session ✅, concurrent 2×completed ❌ race on singleton | Dead comment `// also patch globalThis` `phase3:655` остался, `nodes[0].config.councilMode` только (TS-1) | **PASS sequential, RUNTIME-PENDING concurrent** |
| **N4b Lifecycle scoring** | ✅ outer `isCompleted\|\|isPaused\|\|isFailed` + `shouldScore=isCompleted\|\|isPaused` + `finalizeSession` only completed | **YES** — `paused` interim scores persisted, `completed` scores+finalizes, `failed/cancelled` no scores | `enabledTechniques:[]` hardcoded vs SyncManager real techniques → double finalize (handler fire-and-forget + SyncManager await) | **PASS with degraded payload** |
| **N4c FactCheck await** | ✅ `pendingChecks` dedup, `async processFactCheck` 5s bounded, `pipeline round:end await`, `bridge await`, `_syncSessionImpl await` | **PARTIAL** — pipeline path YES (awaited, 20% sampled), bridge path **DEAD** (см. R-GAP-03) | `awaitPending` defined never called, 2 separate `DebatePostProcessor` instances | **PASS pipeline, FAIL bridge** |
| **N4d Early-Exit wiring** | ✅ `getEarlyExitConfidence` reverse-map + StrategyManager lookup + double-null-safe fallback | **YES** — no remaining hardcoded `if >=0.85`, all paths fallback `0.85` | `TOPOLOGY_TO_STRATEGY` only 5 entries, `earlyExitConfidence` never set in builtins (reads via `convergenceThreshold` fallback) | **PASS** |

**Overall N4:** 🟢 **PASS** — цепочка здоровее: `ArgTech→Consensus`, `Evidence→FactCheck→factuality`, `Consensus↔Evaluator correlation`, `lifecycle-aware scoring`, `awaited FactCheck`, `strategy-aware early-exit`. Один критический остаток: **R-GAP-03** (bridge processedArgIds) — negates resumption path N4c.

---

## 2. GAP Registry — Post N4

### P1 — Высокий приоритет

#### R-GAP-01 — CouncilAware singleton race (concurrent multi-debate)
- **Evidence:** `council-aware-evaluator.ts:15` `private currentSessionId`, `debate-phase-handler.ts:112` `setCurrentSessionId(sessionId)` sync loop, `phase3:544` singleton DI. 2 concurrent `phase-handler` calls share field → last writer wins.
- **Runtime impact:** Wrong evaluator strategy (weighted vs standard) for one session → corrupted scores.
- **Severity:** P1 (P0 architecture per prior audits, downgraded — single-active-session enforced, multi-debate rare)
- **Confidence:** HIGH
- **Affected path:** `completed` scoring, council topologies only
- **Recommendation:** Thread `sessionId` through `IDebateEvaluator.scoreArguments(sessionId, ...)` OR `AsyncLocalStorage` (browser unavailable) — **architecture change**
- **Effort:** HIGH
- **GO/NO-GO:** **NO-GO** — architecture-level, deferred
- **Relation N4:** N4a partial close, documented RUNTIME-PENDING

#### R-GAP-02 — `finalizeSession` double call + degraded payload
- **Evidence:** `debate-phase-handler.ts:303` `void finalizeSession(sessionId,{enabledTechniques:[], strategy:'debate', ...})` fire-and-forget, `debate-sync-manager.ts:893` `await finalizeSession(sessionId,{enabledTechniques: realTechniques, strategy: session.strategy, ...})` — both on `completed`. Phase-handler passes `[]` + literal `'debate'`, SyncManager passes real values.
- **Runtime impact:** Collector double-counts session, first call with empty techniques corrupts `frequencyInBestRounds`/`pValue` metrics. Fire-and-forget not awaited → may race `destroy()`.
- **Severity:** P1
- **Confidence:** HIGH
- **Affected path:** `completed` finalize, QualityCollector metrics
- **Recommendation:** Remove `finalizeSession` from phase-handler, keep only SyncManager path (already has real techniques). Or make handler payload derive from `qualitySettings`.
- **Effort:** LOW (delete 8 lines)
- **GO/NO-GO:** **GO candidate** — next narrow batch
- **Relation N4:** N4b introduced `finalizeSession` in handler to fix Q-01, but SyncManager already had it

#### R-GAP-03 — Bridge `processFactCheck` dead due to shared `processedArgIds`
- **Evidence:** `debate-session-bridge.ts:160` `processGovernorFeeding(newArgs)` adds all `newArgs` ids to `processedArgIds`, then `162` `await processFactCheck(newArgs)` checks `if(processedArgIds.has(arg.id)) continue` → skips all. `debate-post-processor.ts:223` single Set for both methods.
- **Runtime impact:** Resumption/human-arg path never fact-checks → `getForArgument` always null → `factuality` always fallback. Negates N4c for bridge path.
- **Severity:** P1
- **Confidence:** HIGH (confirmed by subagent trace)
- **Affected path:** `mergeAndProcessSession` → resumption, human args
- **Recommendation:** Separate `processedArgIds` per method (`processedFactCheckIds` vs `processedGovernorIds`) OR clear set between calls OR check `argumentResults.has` not `processedArgIds`.
- **Effort:** VERY LOW (2 lines)
- **GO/NO-GO:** **GO candidate — highest leverage** (1-line fix restores N4c resumption)
- **Relation N4:** N4c directly — pipeline path works, bridge path dead

#### R-GAP-04 — `awaitPending` dead code
- **Evidence:** `fact-check-service.ts:167` `async awaitPending(ids, timeoutMs)` defined, `grep awaitPending` — only definition, never called. Intended for pre-scoring await but actual await is `processFactCheck`'s `allSettled`.
- **Runtime impact:** None currently (dead code), but indicates incomplete N4c design — callers expecting `awaitPending` get no effect.
- **Severity:** P2 (dead code, not bug)
- **Confidence:** HIGH
- **Affected path:** FactCheckService API surface
- **Recommendation:** Wire `awaitPending` OR remove method. If kept, call from phase-handler before `evaluator.scoreArguments` for cases where FactCheck triggered outside pipeline.
- **Effort:** LOW
- **GO/NO-GO:** NO-GO — cleanup, not urgent
- **Relation N4:** N4c

### P2 — Средний приоритет

#### R-GAP-05 — Triple-diverged `MAX_TOKENS` / `maxTokens` defaults
- **Evidence:** `debate-sync-manager.ts:38` `1024`, `config-registry` `500`, `debate-session-persistence.ts:137` `4096`, `DebatesManagerPanel:214` `4096`, `debate-session-store:121` `hardcode 4096`. 5 sources, 3 values.
- **Runtime impact:** Same debate gets different token limits depending on creation path (Panel vs Manager vs persistence restore) → budget `incrementRound` caps differ → early `budgetSkipped → paused` on one path but not another.
- **Severity:** P2
- **Confidence:** HIGH
- **Affected path:** Entry → Budget → pipeline `round:start` budget increment
- **Recommendation:** Single `DEFAULT_MAX_TOKENS` const in `config-registry`, all consumers import it.
- **Effort:** LOW
- **GO/NO-GO:** GO candidate — config unification batch
- **Relation N4:** None (pre-existing wiring divergence)

#### R-GAP-06 — `DebateSession` missing `maxRounds` / `strategy` contract fields
- **Evidence:** `debate-runtime.ts:62` `readonly maxRounds?: number` on `IDebateSession` — class has no getter (only `topology.maxRounds`). `debate-types.ts:251` `strategy: DebateSessionStrategy` on legacy `DebateSession` — neither `IDebateSession` nor class has it. Pipeline reads `session.topology.type` and reverse-maps; `restoreInternalState()` cannot restore participants/strategy.
- **Runtime impact:** Strategy/mode lost at runtime, `DebateBudget` workaround via `topology.maxRounds`, `TOPOLOGY_TO_STRATEGY` lossy (see R-GAP-07).
- **Severity:** P2
- **Confidence:** HIGH
- **Affected path:** Entry → Session → Pipeline → Persistence restore
- **Recommendation:** Add `strategy` + `maxRounds` to `IDebateSession` OR document `topology.type` as SSOT and deprecate `strategy` contract.
- **Effort:** MEDIUM (contract + class + persistence)
- **GO/NO-GO:** NO-GO — contract change, needs design
- **Relation N4:** N4d workaround (reverse-map) masks this drift

#### R-GAP-07 — Lossy `TOPOLOGY_TO_STRATEGY` / `STRATEGY_MAP` (5 entries)
- **Evidence:** `debate-session-persistence.ts:10` maps 5 types, fallback `round_robin` with warn. `phase3:656` same 5 entries. All other strategies (`socratic`, `cross_examination`, `moderated`, `free_for_all`, `tournament`, etc.) collapse to `roundtable` → `round_robin` → `0.85`. 12 strategy values → 5 topology types.
- **Runtime impact:** `cross_examination` (0.9) and `moderated` (0.8) would be mis-resolved if stored via `DebatesManagerPanel` path. N4d partially fixes pipeline read but persistence still lossy.
- **Severity:** P2
- **Confidence:** HIGH
- **Affected path:** Persistence round-trip, N4d lookup
- **Recommendation:** Store `strategy` explicitly in snapshot extra (not derived from topology), OR expand maps to 12 entries.
- **Effort:** LOW
- **GO/NO-GO:** NO-GO — persistence schema, needs migration
- **Relation N4:** N4d mitigates runtime but not persistence

#### R-GAP-08 — `earlyExitConfidence` vs `convergenceThreshold` duplication
- **Evidence:** `debate-strategy-dsl.ts:62-63` both optional on `DebateGraphPrimitive`. `debate-strategy-registry.ts:122` validates only `convergenceThreshold` (0-1), `earlyExitConfidence` no validation. `debate-strategy-definitions.ts` all 4 thresholds use `convergenceThreshold`, none set `earlyExitConfidence`. `PrimitiveInspector.tsx:96` edits only `convergenceThreshold`. `phase3:660` reads `earlyExitConfidence` first then `convergenceThreshold` fallback.
- **Runtime impact:** None currently (fallback works), but UI cannot set primary field, validation gap allows `earlyExitConfidence: 5`.
- **Severity:** P2
- **Confidence:** HIGH
- **Affected path:** Strategy DSL → Registry → Panel → Pipeline
- **Recommendation:** Validate `earlyExitConfidence` (0-1), add to UI, set it in builtins, deprecate `convergenceThreshold` alias.
- **Effort:** LOW
- **GO/NO-GO:** NO-GO — DSL cleanup, not urgent
- **Relation N4:** N4d introduced `earlyExitConfidence` priority

#### R-GAP-09 — `TOPOLOGY_TO_STRATEGY` triple-duplicated `0.85` fallbacks
- **Evidence:** `0.85` in `phase3:664,673` + `pipeline-builder:302` + `debate-strategy-definitions:22`. No `DEFAULT_EARLY_EXIT_CONFIDENCE` const.
- **Runtime impact:** Change requires 3-file edit, risk of drift.
- **Severity:** P2
- **Confidence:** HIGH
- **Affected path:** Strategy → Pipeline
- **Recommendation:** Export `DEFAULT_EARLY_EXIT_CONFIDENCE = 0.85` from `debate-strategy-dsl.ts`, import in both files.
- **Effort:** VERY LOW
- **GO/NO-GO:** GO candidate — tech debt, 2-line fix
- **Relation N4:** N4d

#### R-GAP-10 — `DebateSessionSnapshot.participants` never populated
- **Evidence:** `debate-runtime.ts:111` `participants?: ReadonlyArray<ParticipantConfig>` optional in contract, `debate-session.ts:220 snapshot()` omits `participants` entirely (only `agentStates`/`arguments`). Consumers expect participants via `SnapshotBridgeContext` external.
- **Runtime impact:** Snapshot cannot standalone restore session — participants lost if `SnapshotBridgeContext` not provided (zombie restore uses `[]`). `restoreInternalState` never restores participants (readonly ctor arg).
- **Severity:** P2
- **Confidence:** HIGH
- **Affected path:** Persistence → Restore
- **Recommendation:** Emit `participants` in snapshot OR document externalization and fix `restoreInternalState` to re-attach via `bridgeCtx`.
- **Effort:** LOW
- **GO/NO-GO:** NO-GO — persistence contract, needs design
- **Relation N4:** None

#### R-GAP-11 — `restoreSession` missing deps (bayesianJudge, blindEval, qualityCollector, argTech)
- **Evidence:** `debate-persistence-manager.ts:416` `createPhaseChangeHandler` for restored session passes only `eventBus/debateStore/memoryExtractor/evaluator` — missing `bayesianJudge/blindEval/qualityCollector/argTech` vs `debate-engine:280` which wires all.
- **Runtime impact:** Restored (resumed) sessions score without Bayesian adjustment, without blind eval, without quality correlation, without ArgTech bonus — different scoring behavior vs fresh session.
- **Severity:** P2
- **Confidence:** HIGH
- **Affected path:** Pause → Resume → Scoring
- **Recommendation:** Pass all deps in `restoreSession` (same as `createSessionWithId`).
- **Effort:** LOW (4 lines)
- **GO/NO-GO:** GO candidate — resume correctness
- **Relation N4:** N4a/b/c all wired in engine path but not restore path

#### R-GAP-12 — UI/Runtime/Strategy triple divergence (3 creation paths)
- **Evidence:** `DebatesManagerPanel:210` creates DB row only (no runtime, `participants=[]`, `strategy='round_robin'` hardcoded). `DebateRuntimePanel/CreateSessionForm:232` calls `startTopologyDebate(topology, topic, participants, undefined)` — `config=undefined` → `DEFAULT_CONFIG`, no `maxRounds`/`qualitySettings`. `DebatePanel/TopicStep:221` calls `startDebate(topic, participants, strategy, maxRounds, {debateTemperature, qualitySettings})` — fully wired.
- **Runtime impact:** Same topic via different UI produces different debate behavior (different maxRounds, temperature, quality flags, topology edges). `DebatesManagerPanel` sessions never start runtime (appear in list but `pause/resume` no-ops until orphan restore).
- **Severity:** P2
- **Confidence:** HIGH
- **Affected path:** Entry (all UIs) → SyncManager → Engine
- **Recommendation:** Unify creation paths OR document each UI's scope. Wire `CreateSessionForm` to pass `maxRounds`/`qualitySettings`.
- **Effort:** MEDIUM
- **GO/NO-GO:** NO-GO — UX scope, needs product decision
- **Relation N4:** None

### P3 — Низкий приоритет / Tech debt

#### R-GAP-13 — `TopicStep` temperature prop dead
- **Evidence:** `TopicStep.tsx:18` declares `debateTemperature/onTemperatureChange` but never renders input. `DebatePanel:221` holds state `debateTemperature=5` and passes to `startDebate`.
- **Severity:** P3
- **GO/NO-GO:** NO-GO

#### R-GAP-14 — `DebateSession` extra methods not in contract (`onPhaseChange`, `send`, `setQualitySettings`)
- **Evidence:** Class adds 3 public methods, contract lacks them — Hyrum's law reliance via cast.
- **Severity:** P3
- **GO/NO-GO:** NO-GO

#### R-GAP-15 — `failedProviders` getter missing (asymmetric with `failedModels`)
- **Evidence:** `IDebateSession` has `hasProviderFailed`/`markProviderFailed` but no `get failedProviders()`, snapshot always emits `Array.from(_failedProviders)`.
- **Severity:** P3
- **GO/NO-GO:** NO-GO

#### R-GAP-16 — Early-exit no `unresolved>0` / `evidenceScore` guard
- **Evidence:** `pipeline-builder:302` exits on `confidence >= threshold` alone, without checking `unresolved.length` or evidence maturity. Can exit before evidence produced (round 1).
- **Severity:** P3 (P2 per N2_AUDIT, downgraded — rare, confidence already requires `claims.length>1`)
- **GO/NO-GO:** NO-GO

#### R-GAP-17 — `blindEval` throw path no fallback to standard evaluator
- **Evidence:** `debate-phase-handler.ts:187` `catch` logs warn but does not fallback → scoring lost for that batch.
- **Severity:** P3
- **GO/NO-GO:** NO-GO

#### R-GAP-18 — Triple GC policy divergence
- **Evidence:** `pipeline trimContent(8)` vs `persistence-manager PRUNE_KEEP_ROUNDS=3` vs `sync-manager truncateArguments keepRounds=2` vs `HEAP_HIGH_MB=150`/`CRITICAL=300`/`MINIMAL=50`. 4 policies, 3 keep values.
- **Severity:** P3
- **GO/NO-GO:** NO-GO

---

## 3. Closed GAPs (N4 + earlier)

| GAP | Когда закрыт | Evidence |
|-----|--------------|----------|
| Global session state (`globalThis`) | N4a | `council-aware-evaluator.ts:15` instance field |
| Scoring only on `completed` (no `paused` interim) | N4b | `debate-phase-handler.ts:63,86` |
| `finalizeSession` missing on Engine path (Q-01) | N4b | `debate-phase-handler.ts:303` |
| Fire-and-forget FactCheck race (factuality always 0) | N4c | `fact-check-service.ts:72` pendingChecks + `debate-post-processor:224` async + `pipeline:267` await |
| Hardcoded `0.85` early-exit threshold | N4d | `debate-pipeline-builder.ts:301` + `phase3:654` reverse-map + StrategyManager |
| Council → Debate ID mismatch / lenses / blind / facts / judge / sources | D4.3 | `debate-engine:264` `createSessionWithId` + mapper + facade |
| Council `setArgTechBonus` bridge | N1 | `debate-consensus: setArgTechBonus` |
| Evidence population (`Claim.citations/evidence`) | N2 | `debate-consensus: gatherClaims` preserved |
| Judging correlation (`judging-correlation`) | N3 | `debate-phase-handler:263` qualityCollector record |
| No `paused` scoring → `QualityCollector` misses sessions | N4b | J-6 closed |

---

## 4. NO-GO List (не трогать до отдельного решения)

| # | GAP | Причина NO-GO |
|---|-----|---------------|
| 1 | Bayesian persistence (Map → Dexie, survive pause/refresh) | P1 но HIGH effort — snapshot schema + reset logic + serialize |
| 2 | Strategy validation at launch (DSL/topology `validate()` wiring) | P2 но safety net exists (preflight + budget fallback) |
| 3 | Provenance wiring (debate runtime → provenance graph) | P3 — explainability, infrastructure ready but not wired |
| 4 | CouncilAware `AsyncLocalStorage` isolation | P0 arch — browser `async_hooks` unavailable |
| 5 | Evidence-aware coherence (confidence → evidence) | P2 но HIGH effort — new `ReasoningStep` field + algorithm |
| 6 | UI/Runtime/Strategy unification (3 creation paths) | P2 — product decision needed |
| 7 | `TOPOLOGY_TO_STRATEGY` lossy 5→12 expansion + persistence | P2 — schema migration |
| 8 | `earlyExitConfidence` DSL duplication cleanup | P2 — not urgent, fallback works |
| 9 | Contract `strategy`/`mode`/`maxRounds` addition | P2 — contract design needed |

---

## 5. Recommended Next Stage

### GO candidates (узкие, низкая цена, без архитектурного раздувания)

| Priority | GAP | Effort | Impact | Scope |
|----------|-----|--------|--------|-------|
| **1** | **R-GAP-03** `processedArgIds` шарит Set → bridge FactCheck dead | VERY LOW | HIGH (restores N4c resumption) | 1 file, 2 lines |
| **2** | **R-GAP-02** double `finalizeSession` + `enabledTechniques:[]` | LOW | HIGH (metrics correctness) | 1 file, 8 lines |
| **3** | **R-GAP-09** triple `0.85` → `DEFAULT_EARLY_EXIT_CONFIDENCE` const | VERY LOW | LOW (tech debt) | 3 files |
| **4** | **R-GAP-11** `restoreSession` missing 4 deps | LOW | MEDIUM (resume correctness) | 1 file, 4 lines |
| **5** | **R-GAP-05** `MAX_TOKENS` 5→1 const unification | LOW | MEDIUM (budget consistency) | 3 files |

**Рекомендация:** Следующий coding batch — **только R-GAP-03** (bridge FactCheck dead). Это прямой дефект N4c, фиксится разделением `processedArgIds` на два Set, восстанавливает resumption path без единого нового runtime. После — POST-аудит → STOP.

**Альтернатива (если R-GAP-03 считается частью N4c и уже «закрыт»):** R-GAP-02 (double finalize) — следующий по leverage.

**Не рекомендовано сейчас:** R-GAP-01 (singleton race) — архитектура, R-GAP-06/07 (contract/persistence) — дизайн, R-GAP-12 (UI unification) — продукт.

---

**STOP — жду вердикта.**
