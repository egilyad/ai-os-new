# N4c Audit — FactCheck Await Existing (без `0.2 → 1.0`)

> Дата: 2026-09-07. Scope: await existing fact-checks before scoring, sampling unchanged (`0.2`). Никаких новых runtime/store/evaluator.

---

## 1) Проблема

**До:** `processFactCheck` fire-and-forget (`void checkArgument(arg).catch(...)`) — fact-checks started but never awaited. By the time scoring runs (`debate-evaluator.ts:67 getForArgument`), results aren't available → `factuality = 0` always.

**Два call site:**
- `debate-session-bridge.ts:161` — resumption path (`mergeAndProcessSession`)
- Pipeline builder round loop — NOT called (gap!)

---

## 2) Исправление

### 2a. `FactCheckService.checkArgument` — pending tracking

**File:** `fact-check-service.ts:100-161`

- Added `pendingChecks = new Map<string, Promise<ArgumentFactCheck | null>>()` (line 28)
- `checkArgument`: if `pendingChecks.has(arg.id)` → return existing promise (dedup, line 106-107)
- Wraps check in promise, stores in `pendingChecks`, cleans up on `finally` (line 157-158)
- Added `awaitPending(argumentIds, timeoutMs=2000)` — awaits `Promise.allSettled` + timeout race (line 167-178)

### 2b. `DebatePostProcessor.processFactCheck` — now async, awaits checks

**File:** `debate-post-processor.ts:223-247`

- Changed from `void checkArgument(arg).catch(...)` (fire-and-forget) to `async processFactCheck` that:
  - Collects all `checkArgument` promises in parallel
  - Awaits `Promise.race([Promise.allSettled(pending), setTimeout(5000)])` — bounded total
  - Sampling policy unchanged (`shouldCheck()` still uses `0.2`)

### 2c. Pipeline builder round loop — fact-checks at `round:end`

**File:** `debate-pipeline-builder.ts:259-267`

- Added `engine.deps.postProcessor?.processFactCheck(roundArgs)` at `round:end` case
- Filters `session.arguments` by `round === event.round` → only this round's args
- Awaited — ensures fact-checks complete before next round's scoring

### 2d. `PipelineEngineDeps` — added `postProcessor`

**File:** `debate-pipeline-builder.ts:52`

- `readonly postProcessor?: DebatePostProcessor` — optional, backward-compatible

### 2e. `DebateEngineDeps` — added `postProcessor`

**File:** `debate-engine-types.ts:140-141`

- `postProcessor?: import('./debate-post-processor').DebatePostProcessor`

### 2f. Engine construction — passes `postProcessor`

**File:** `phase3-debate-runtime.ts:653-654`

- `postProcessor: new DebatePostProcessor({ factCheckService: c.get<FactCheckService>('factCheckService') })`
- Lightweight separate instance (round loop path ≠ syncManager path, no shared state needed)

### 2g. `mergeAndProcessSession` — now async, awaits `processFactCheck`

**File:** `debate-session-bridge.ts:136-166`

- Changed from sync to `async function`
- `await postProcessor.processFactCheck(newArgs)` (line 162)

### 2h. `_syncSessionImpl` — awaits `mergeAndProcessSession`

**File:** `debate-sync-manager.ts:709`

- `const { session, newArgs } = await mergeAndProcessSession(...)` (was sync call)

---

## 3) Флоу

```
Round N ends → pipeline builder round:end
  → processFactCheck(roundArgs) [async, awaited, bounded 5s total]
    → checkArgument(arg) × N [parallel, each bounded by internal timeout]
      → getForArgument(arg.id) returns completed result
  → Round N+1 scoring: evaluator.scoreArguments → factuality = 0.6*avgConf + 0.4*verifiedRatio ✅

Resumption: mergeAndProcessSession [async]
  → processFactCheck(newArgs) [awaited]
    → same as above
  → syncManager: upsertSession → scoring path
```

---

## 4) Sampling policy — unchanged

- `FactCheckService.shouldCheck()` still returns `Math.random() < this.checkInterval` (default `0.2`)
- `0.2 → 1.0` explicitly **NO GO** per user instruction
- Only change: await existing checks instead of fire-and-forget

---

## 5) Статические проверки

| Check | Evidence | Result |
|-------|----------|--------|
| `processFactCheck` async | `debate-post-processor.ts:224 async processFactCheck` | ✅ |
| `mergeAndProcessSession` async | `debate-session-bridge.ts:136 async function` | ✅ |
| `_syncSessionImpl` awaits | `debate-sync-manager.ts:709 await mergeAndProcessSession` | ✅ |
| Pipeline builder awaits | `debate-pipeline-builder.ts:265 await engine.deps.postProcessor.processFactCheck` | ✅ |
| `postProcessor` in deps | `debate-engine-types.ts:141` + `phase3-debate-runtime.ts:654` | ✅ |
| Pending dedup | `fact-check-service.ts:106-107 pendingChecks.get` | ✅ |
| Timeout bounded | `5000ms total` (postProcessor) + `2000ms per-awaitPending` | ✅ |
| Sampling unchanged | `shouldCheck()` untouched | ✅ |

**Verdict:** 🟢 PASS static — fact-checks now awaited before scoring, sampling `0.2` unchanged, no new runtime/store/evaluator.

**RUNTIME-PENDING:** Real LLM fact-check completion + `factuality > 0` on strong PC.

**STOP — жду вердикта.**
