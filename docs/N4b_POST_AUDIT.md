# N4b Post-Audit — Lifecycle Scoring `completed / paused` (без второго runtime)

> Дата: 2026-09-07. Scope: один узкий batch `runScoring(claims)` общий scoring path + `completed` finalize, `paused` interim persist без finalize. Без нового runtime/store/evaluator.

---

## 1) Общий scoring path (один, не копия по состояниям)

**До:** All scoring exclusively `if (to === 'completed') 77` — `paused`/`early-exit allErrored` no scores, `QualityCollector.finalizeSession` never from `DebateEngine` (only `SyncManager:902`).

**После:** `debate-phase-handler:62` outer `if (isCompleted || isFailedOrCancelled || isPaused)` + inner `shouldScore = isCompleted || isPaused 85`:

```
completed → scoring + finalizeSession (Engine-only path was missing Q-01)
paused → interim scoring + persisted record (techniqueId judging-correlation-interim), without finalize
early-exit confidence >=0.85 → pipeline continues to completed (so scoring via completed, not duplicate)
failed/cancelled → unchanged (no scoring, as spec)
```

**Files:** `debate-phase-handler:62` outer gate + `77 shouldScore` + `253 correlation` (`techniqueId judging-correlation-interim` for paused) + `296 finalizeSession` only `isCompleted`.

---

## 2) `completed` → scoring + `finalizeSession`

- `completed` → `memoryExtractor.extractFromTimeline → extractClaims → evaluator.scoreArguments / blindEval + bayesianJudge + driftPenalty → DEBATE_AGENT_SCORED → qualityCollector.record SCORE_CHANGED + N3 correlation judging-correlation` (existing, теперь общий)
- `+ finalizeSession(sessionId, {enabledTechniques:[], topic: snap.topic, strategy:'debate', participantCount, roundCount: session.round, totalTokens: snap.totalTokens, durationMs: Date.now()-snap.startedAt})` — mirrors `SyncManager:902` (was missing Q-01 on Engine-only path), best-effort `void ...catch`.
- `saveSnapshot` still skipped for `completed` (existing DEFENSE `316`, maps destroyed) — unchanged.

---

## 3) `paused` → interim scoring/persistence, без finalize

- `paused` → same `runScoring(claims)` guarded `claims.length>0` via `shouldScore` (existing `extracted.units` may be empty → `extractClaims` empty → loop no scores, but `record` still best-effort) + `qualityCollector.record` with `techniqueId judging-correlation-interim` (not `judging-correlation`) — **persisted `record`, not `finalizeSession`**.
- `finalizeSession` **только** `isCompleted` — `paused` never calls it (проверено: `if (isCompleted && deps.qualityCollector) 296`).
- `saveSnapshot` for `paused` still runs (existing `316` only skips `failed/cancelled/completed`) — auto-checkpoint persists interim state, good for resume `startSession(true) skipAgents`.
- `cancelled/failed` не менять — `shouldScore false`, `318 no scoring needed` unchanged.

---

## 4) Исключён двойной scoring при `early-exit → completed`

- `early-exit confidence` branch `pipeline-builder:285` (`interim.confidence>=0.85 → earlyExit=true → break`) → `Pipeline:31 earlyExit` → **pipeline continues** `consensusAndFinalize:372 → transition('completed'):444` → `phase-handler:62 completed` → scoring **once** via completed (not duplicate interim + final, since interim `consensus.evaluate` in `roundLoop` is `ConsensusResult` for early-exit decision, not `DEBATE_AGENT_SCORED`).
- `early-exit allErrored → paused/failed` branch `256` breaks before interim `273` → `paused` interim scoring via new `shouldScore` (once), not via `completed` (since never reaches `completed`) — no double.
- `paused → resume → completed` → interim scoring (paused) + final scoring (completed) — intended (interim + final), not double: `techniqueId` differs (`judging-correlation-interim` vs `judging-correlation`), `finalizeSession` only on final `completed`.

---

## 5) Никаких новых runtime/store/evaluator

| Check | Evidence | Result |
|-------|----------|--------|
| `IDebateEvaluator` | Same `DebateEvaluator` + `WeightedJudge` + `CouncilAware` via `topology.config.councilMode` (D4.4a) | ✅ one evaluator |
| `IConsensusEngine` | `setArgTechBonus` existing (N1) | ✅ one consensus |
| `QualityCollector` | `record` existing + `finalizeSession` existing `159` (now called on Engine-only `completed`, was only `SyncManager`) | ✅ no new store |
| `Paused` emit | `DEBATE_SESSION_PAUSED` still via `engine.pauseSession:624` (not duplicated in handler — handler skips emit for paused `68`) | ✅ no double emit |
| `Council` | Not touched | ✅ |

---

## 6) Статические проверки

- Outer gate `isCompleted || isFailedOrCancelled || isPaused 66` + emit only `!isPaused 68` — `paused` no `COMPLETED/CANCELLED` duplicate.
- `shouldScore = isCompleted || isPaused 85` — `failed/cancelled` unchanged.
- `finalizeSession` signature `enabledTechniques/topic/strategy/participantCount/roundCount/totalTokens/durationMs` matches `collector:159` (was `{judgeScore}` mismatch fixed).
- Imports resolve, `phase3` registration untouched.

**Verdict:** 🟢 PASS static — один scoring path `runScoring(claims)` для `completed` (+finalize) и `paused` (interim, без finalize), `early-exit` via `completed` без double, `cancelled/failed` unchanged.

**RUNTIME-PENDING:** Real `pause → resume → completed` flow (`saveSnapshot` + `restoreSession` + `skipAgents`) + `QualityPanel` shows `aggregatedMetrics` for `paused` interim on strong PC.

**STOP — жду вердикта.**
