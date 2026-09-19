# N4 Audit — Следующий GAP после N1/N2/N3 (без кода)

> Дата: 2026-09-07. Scope: что осталось P0 после `N1 ArgTech→Consensus` + `N2 Evidence→Evaluator` + `N3 Judging correlation via QualityCollector`. Тип: **forensic, без кода**, не создавать второй runtime, не трогать Council migration/SSOT.

---

## GAP Register — Remaining P0 (следующий narrow batch)

| GAP | Title | File:line | Current path | Status | Class | P |
|-----|-------|-----------|--------------|--------|-------|---|
| **J-3** | Global thread-local hack for CouncilMode | `debate-phase-handler:102` `globalThis.__currentDebateSessionId = sessionId` + `290 delete` → `council-aware-evaluator:24` `global + getSession(sid).topology.nodes[0].config.councilMode` | Single global slot, racy if two sessions complete concurrently (last writer wins), only `nodes[0]` checked, `topology.metadata councilMode` ignored | working but fragile | architecture/runtime | **P0** |
| **B-08** | FactCheck sampled async gap | `fact-check-service:66 level='sampled' 67 checkInterval 0.2 84 shouldCheck RNG chance 0.2 → 80% miss` + `post-processor:223 void checkArgument catch` fire-and-forget + `llm-prompt-context:575 getForArgument round-1` warning `round>1` | Pipeline: `debate-session-bridge:161 → postProcessor.processFactCheck(newArgs) void` per round → next round prompt reads cached only → `N2 factuality` sees `citationsVerified=null` often → fallback heuristic, `QualityCollector signal factCheckWarnings 0` | working but sampled+async = ~10-15% effective | capability/quality | **P0** |
| **J-6** | Scoring only on completed | `phase-handler:77 if(to==='completed') 74` only `completed` gets `evaluator/bayesian/blindEval/qualityCollector + N3 correlation 253`, `failed/cancelled/paused` no scores, `pipeline-builder:285 interim confidence >=0.85 earlyExit 286` → `earlyExit true → skip consensusAndFinalize scoring` | `roundLoop` computes `gatherClaims → consensus.evaluate` for early-exit but `phase-handler` scoring gated on `completed` → early-exit/`paused` never `DEBATE_AGENT_SCORED` → `QualityCollector` misses | architecture | **P0** quality |
| **Q-01** | finalizeSession never auto-called from DebateEngine | `quality-impact-collector:159 finalizeSession` requires `sessionBuffers`, `record 137` at `phase-handler:160,228` + `llm-caller:555` etc, only auto-call `debate-sync-manager:903 finalizeSession` for sync manager path, `DebateEngine` pipeline never calls `finalizeSession` | `QualityCollector` collects but `getMetrics 331` stale, `getAttribution 487` never updates, UI `QualityPanel` shows `none` | architecture | **P0** if loop promised |

**Other P1/P2 (not next batch):** `J-1 two universes` partially via N3 correlation but still `consensus.confidence` vs `evaluator.overall` disjoint inputs; `TS-1 councilMode fragmented`, `EV-2 FactPacket island`, `EV-3 Provenance never called from debate` etc — lower priority than P0 above.

---

## Recommended next narrow batch (без Council migration, без второго runtime)

**Batch N4 — Fix P0 trio via existing canonical boundaries (one batch, 3 small wiring, no new runtime):**

1. **J-3 Global → explicit param** — replace `globalThis.__currentDebateSessionId` with `sessionId` param to `scoreArguments` or `CouncilAwareEvaluator.getEvaluator(sessionId)` getter already exists via `getSession` lazy `topology.nodes[0].config.councilMode` — make `PhaseHandler` call `getEvaluator = isCouncilMode(sessionId) ? weighted : standard` directly, not via global. **Files:** `council-aware-evaluator:21` remove global, `phase-handler:102` pass `sessionId` explicitly, `debate-engine-types:100` `getEvaluator(sessionId)` optional.
2. **B-08 FactCheck sampled → blocking for citationsVerified** — make `N2 factuality` path `getFactCheck()` await pending `checkArgument` when `citationsVerified` needed: change `shouldCheck` default `sampled 0.2 → 1.0` for Debate (or at least for `factuality` path), make `processFactCheck` await `Promise.all` with timeout 2s (bounded, not fire-and-forget), so `buildDebateSystemContent getForArgument` sees verified data next round, not `undefined`.
3. **J-6 + Q-01 Scoring on early-exit/paused** — move `evaluator/bayesian/blindEval/qualityCollector + N3 correlation` out of `if(to==='completed') 74` to shared `finalizeScoring(claims)` called on `completed` **and** `earlyExit`/`paused` (guarded by `claims.length>0`), and add `qualityCollector.finalizeSession(sessionId, {judgeScore: avgOverall})` after scoring block (mirrors `debate-sync-manager:903`), no new runtime.

**Effect:** `FactCheck verified` actually reaches `evaluator.factuality` (not heuristic fallback), `CouncilAware` no race, early-exit debates get `overall/factuality` + `correlation` + `QualityCollector` metrics → `QualityPanel` shows data, no new `EvidenceService`.

**Files (3 small wiring):** `debate-phase-handler:77` guard, `council-aware-evaluator:21` remove global, `fact-check-service:66` level default, `quality-impact-collector:159` finalize call.

---

## Expected effect (N4)

- `J-3` race eliminated → concurrent debates isolated.
- `B-08` 80% miss → ~100% for Debate (or 1.0 for factuality path) → `citationsVerified` not null → `factuality =0.6*avgConf+0.4*verified` deterministic, not fallback.
- `J-6/Q-01` early-exit/paused get `overall/factuality` + `correlation` + `finalizeSession` → `QualityPanel` shows `aggregatedMetrics` + `attributionLeaderboard` for all terminal states, not just happy path.

---

## RUNTIME-PENDING (не делать на слабом ПК)

- `FactCheck LLM verify` needs provider `groq/gemini` `getCachedApiKey 155` — strong PC `checkArgument` LLM `sendMessage 199` (sampled 0.2 → verified).
- `Provenance` graph `trace(decisionId)` needs real `addNode/link` from debate pipeline (needs `ProvenanceService` wiring).
- `RAG` provenance linkage needs real embedding `simpleEmbedText` vs vector DB.
- `Brier live` `happened` ground truth, `Kialo >12` brute.

---

## STOP — жду GO на N4 (один конкретный batch 3 wiring, без второго runtime) — по одному.

С богом — audit без реализации, только GAPs.
