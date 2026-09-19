# N4d Audit — Highest-Leverage GAP After N4a/b/c

> Дата: 2026-09-07. Scope: systematic audit of 6 remaining GAP areas after N4 cycle. Ранжировано по leverage (effort × impact).

---

## Результаты аудита

### 1. CouncilAware Concurrency — P0 architecture

| Aspect | Status |
|--------|--------|
| Isolation | Instance field `currentSessionId` on singleton `CouncilAwareEvaluator` |
| Race exists? | YES — two concurrent `phase-handler` calls share singleton field |
| AsyncLocalStorage | NOT used, RUNTIME-PENDING across 6+ audit docs |
| Practical exposure | Low today (single-active-session enforced by SyncManager) → LIVE with multi-debate (Phase 2) |
| Fix | Thread `sessionId` through `IDebateEvaluator` contract, or `AsyncLocalStorage` (browser `async_hooks` unavailable) |

**Leverage:** HIGH impact, HIGH effort (contract change + all evaluator callers). Architecture-level, not a quick fix.

---

### 2. Bayesian Persistence — P1 reliability

| Aspect | Status |
|--------|--------|
| Storage | Pure in-memory `Map<string, {posterior, updates}>` |
| Persists to Dexie? | NO — `DebateSessionSnapshot` has no Bayesian fields |
| Survives pause/resume? | NO — `bayesianJudge` missing from `restoreSession` deps (`debate-persistence-manager.ts:419-424`) |
| Survives page refresh? | NO — full data loss |
| Reset behavior | `bayesianJudge.reset()` called on every scoring pass — wipes posteriors before snapshot |

**3 concrete gaps:**
1. `restoreSession` deps omit `bayesianJudge` → Bayesian scoring silently disabled on resume
2. No serialization of `beliefs` Map → no persistence path exists
3. `reset()` on every scoring pass → even if persisted, would be wiped immediately

**Leverage:** HIGH impact (resume without Bayesian = different scoring behavior), MEDIUM effort (add beliefs to snapshot + skip reset on resume + serialize/deserialize).

---

### 3. Early-Exit Threshold — P2 configurability (effort: LOW)

| Aspect | Status |
|--------|--------|
| DSL defines | `convergenceThreshold` (0-1), `earlyExitConfidence` (0-1) per strategy |
| Strategies set values | `round_robin`: 0.85, `moderated`: 0.8, `cross_examination`: 0.9, `open_forum`: 0.9 |
| UI exposes editor | YES (`PrimitiveInspector.tsx:96`) |
| Registry validates | YES (0-1 range, `debate-strategy-registry.ts:122-127`) |
| Pipeline builder reads? | **NO** — hardcoded `0.85` at line 298 |
| Governor reads? | **NO** — `private readonly CONVERGENCE_THRESHOLD = 85` (line 14) |
| Inconsistency | Governor: 85 (0-100), Pipeline: 0.85 (0-1), StopConditions: 80 (0-100) |

**The gap:** Schema + validation + UI all exist and work. The pipeline builder simply never reads the strategy definition.

**Leverage:** MEDIUM impact (cross_examination should exit at 0.9, not 0.85 — premature termination), **VERY LOW effort** (read `strategy.convergenceThreshold ?? 0.85` in pipeline builder, ~3 lines).

---

### 4. Evidence-Aware Coherence — P2 scoring accuracy

| Aspect | Status |
|--------|--------|
| What coherence measures | Confidence monotonicity: `confidence[i] >= confidence[i-1] * 0.5` |
| Evidence/citations affect coherence? | **NO** — `ReasoningStep` has no evidence fields |
| Fabricated evidence detected? | **NO** — stable confidence trajectory = perfect coherence regardless of evidence |
| Factuality × coherence coupling | Independent — neither feeds into the other |
| Weight in overall | Coherence via persuasiveness (0.3), factuality standalone (0.1) |

**Attack scenario:** Agent fabricates citations with stable confidence → coherence 1.0, factuality low but weight only 0.1.

**Leverage:** MEDIUM impact (scoring accuracy), HIGH effort (needs `ReasoningStep.evidence` field, new coherence algorithm, contract changes across extractor/evaluator/blind/weighted).

---

### 5. Strategy Validation — P2 robustness

| Aspect | Status |
|--------|--------|
| DSL validation | Thorough (`StrategyRegistry.validate()` — cycles, agents, edges, thresholds) |
| Topology validation | Thorough (`DebateTopologyService.validate()` — structure, type-specific checks) |
| Wired to launch? | **NO** — neither DSL nor topology validation called from `startDebate()` |
| Strategy string validated? | NO — any string accepted |
| maxRounds bounds? | NO — only budget fallback for 0 (caps at 20) |
| 0 participants? | Caught at API/preflight, but `createSession()` in DB accepts empty array |

**Leverage:** LOW impact (budget system provides safety net for rounds, API catches 0 participants), LOW effort (call `topologyService.validate()` + `strategyRegistry.validate()` at launch, ~10 lines).

---

### 6. Provenance Chain — P3 explainability

| Aspect | Status |
|--------|--------|
| Infrastructure | Complete (ProvenanceService + Dexie persistence + ProvenancePanel SVG) |
| Debate runtime → provenance? | **ZERO** — no nodes/links created for debate arguments, claims, rebuttals |
| Council → provenance? | Only `submitFact` (D2.3 wired) |
| `conclude` → trace? | NOT implemented (D2.3 plan says it should) |
| SandboxBroker → provenance? | `sandboxLevelFor()` exists but never called |

**Leverage:** LOW-MEDIUM impact (explainability, nice-to-have), MEDIUM effort (inject `IProvenanceService` into phase handler, record key transitions).

---

## Рекомендация: highest-leverage GAP

### GO-кандидат: **Early-Exit Threshold wiring (GAP 3)**

| Factor | Assessment |
|--------|-----------|
| Effort | **VERY LOW** — read strategy definition in pipeline builder (~3-5 lines) |
| Risk | **VERY LOW** — additive, backward-compatible (`?? 0.85` fallback) |
| Impact | **MEDIUM** — cross_examination stops prematurely at 0.85 instead of 0.9 |
| Tests needed | NO (runtime-pending, static verification only) |
| Breaking changes | NONE — strategy DSL already defines the values |

**Implementation sketch:**
```typescript
// debate-pipeline-builder.ts:298
// Before:
if (interim.confidence >= 0.85)
// After:
const earlyExitThreshold = session.strategyDef?.earlyExitConfidence ?? 0.85;
if (interim.confidence >= earlyExitThreshold)
```

### NO-GO candidates (too expensive for current cycle):

| GAP | Why NO-GO |
|-----|-----------|
| CouncilAware concurrency | Contract change + all callers — architecture-level |
| Bayesian persistence | Snapshot schema change + reset logic + serialize — MEDIUM effort |
| Evidence-aware coherence | New ReasoningStep field + algorithm — HIGH effort |
| Strategy validation at launch | Low effort but low impact (safety net exists) |
| Provenance wiring | Medium effort, low impact (nice-to-have) |

**STOP — жду вердикта: GO на early-exit wiring, или другой GAP?**
