# D2.2 — ArgTech Real Integration — Minimal Implementation Plan (PRE-RUNTIME, без кода)

> Источник: `D1` GAP-01 (0 callers), §5 `argtech-service.ts:50` Dung/Toulmin/Brier/Kialo `F doc/code-only`, `phase39-debateplus:36` isolated. Ограничение: **не создавать второй runtime, не подменять DebateEngine, один canonical point.**

## Цель

Определить canonical integration point и сделать минимальный настоящий wire `Arguments → ArgTech → Consensus` без декоративной интеграции (свойства ArgTech → judging → verdict), часть `PRE-RUNTIME` (static), часть `RUNTIME-PENDING` (live LLM).

## Точные файлы

| Слой | Файл | Что |
|------|------|-----|
| **Existing ArgTech** | `src/kernel/services/debateplus/argtech-service.ts:50` | `groundedExtension:110`, `preferredExtensions:137` (дубликат 137 vs 173 — фиксить), `createToulmin:210`, `forecast:250 Brier`, `plantThesis:276`, `treeScore:322` — KV `dung/*|toulmin/*|brier/*|claimtree/*` |
| **Debate consensus** | `src/kernel/services/debate-runtime/debate-consensus.ts:53` | `DebateConsensusEngine.evaluate` (FNV cosine 0.6) + `calculateConfidence:194` |
| **Debate evaluator** | `src/kernel/services/debate-runtime/debate-evaluator.ts:67` | `scoreArguments` heuristic steelman/rebuttal |
| **Council judging** | `src/kernel/services/council/council-service.ts:334` | `conclude` weighted tally `tally.set(winnerId, +weight)` — сюда можно `treeScore`/`Brier` |
| **Graph delegation** | `src/kernel/services/graph/graph-service.ts:475` | Council node already delegates — не трогать |
| **Wire point PRE-RUNTIME** | `src/kernel/services/debate-runtime/debate-consensus.ts` OR `debate-engine.ts:49` | После `arguments` собраны → вызвать `ArgTechService` → `Dung attack/support → grounded` + `Toulmin completeness` + `Brier forecast` → передать `confidence/treeScore` в `consensus`/`conclude` |
| **Wire point RUNTIME-PENDING** | `src/kernel/services/debateplus/argtech-service.ts:250 Kialo` | Live `treeScore` + `Brier resolveClaim` needs real `claimtree/*` with >12 args — оставить `RUNTIME-PENDING` |

## Границы изменений

- **ВНЕ:** Не создавать `ArgTechEngine v2`, не дублировать `Argument` model (`council-types FactPacket` vs `debate Types Argument`), не трогать `Provenance` (D2.3).
- **Только wiring + fix duplicate:** Удалить второй `preferredExtensions:173` dead code, вынести `lens helper` если нужно (GAP-11), добавить вызовы `argTech` в `DebateConsensusEngine`/`CouncilService.conclude` (1–2 вызова, не 4 сервиса в конце).
- **Kernel untouched:** `EventBus` 10 council +30 debate events уже — новые `DUNG_ATTACK:106` etc уже есть, не добавлять.
- **Contracts:** `debateplus.ts:27 IArgTechService` остаётся, `IArgTechService` не расширять без нужды.

## Шаги (без кода сейчас)

1. **Pre-runtime static:** Fix `preferredExtensions` duplicate, определить `canonical point` = `DebateConsensusEngine.evaluate` получает `Dung grounded` + `Toulmin completeness` → `confidence` (сейчас `confidence=(agreement+avgClaimConf)/2 -0.3*unresolved` → добавить `+0.1*argTechBonus`).
2. **Council static:** `CouncilService.conclude` после `tally` → optional `brierScore = argTech.resolveClaim` (если `claimtree` есть) → `summary` добавить `Brier` (не влияет на winner пока — doc).
3. **Runtime-pending:** Live `Kialo treeScore` + `Brier forecast` live calibration → после сильного ПК с `claimtree/*` >12, `treeScore:322` влияет на `confidence`.
4. **DOC:** Пометить ArgTech `experimental/doc` until wired (GAP-01 pre-runtime).

## MARK

- **CLOSED static:** Duplicate fixed, `D1` wire point documented, `Dung→Toulmin→Brier` static path described, no second runtime.
- **RUNTIME-PENDING:** Real `Dung grounded/preferred on real claimtree`, `Kialo treeScore → verdict`, `Brier live` → strong PC + LLM.
