# Phase D — Evals & Frontier (DONE, без проверок)

Дата: 2026-09-05. Проверки отложены на финал.

Аддитивный **Frontier-слой** — EvalDatasetService (LLM-промпты) и все
рантаймы не тронуты.

## Что сделано

### D.1 Evaluation (Волна 12)
- `services/frontier/eval-service.ts` — бенчмарки (`createBenchmark`,
  кейсы task + `expectContains` + maxScore), `runBenchmark` через
  `IFrontierExecutor` (офлайн-echo по умолчанию), `listRuns`.
- Comparison mode: `compare()` — A/B прогон (второй executor опционален),
  winner + delta, событие `eval:compared`.
- Red-team: `redTeam(target, attacks)` — эвристика refusal-маркеров
  (blocked/unclear/bypassed) + записи для будущего hardening.
- Capability Matrix: `capabilityMatrix()` — статический реестр всех фаз
  (teams/debate/orchestration/memory/governance/interop/meta/trust/eval/frontier
  со статусами done + ref на phase23–31). События `eval:run/redteam`.

### D.2 Frontier выборочно (Волна 13)
- Simulations (13.37): `simulation-service.ts` — deterministic round-симы
  society/economy/org (трейты + hash-настроение, лог 500),
  `step()` покадрово. Нормы cross-model society (13.40): `addNorm`,
  `recordAdherence` (±adherence, violations).
- Long-horizon orgs (13.39): `charterOrg/heartbeat/dissolve` — ledger
  до 1000 записей, жизнь днями/неделями без демонов. Событие `eval:org`.
- Intent OS (13.41): `planIntent()` — keyword-планировщик
  (research/code/debate/content/plan → crew/council/graph/forge шаги),
  первый шаг материализуется в реальный граф при wired-делегате.
  Событие `eval:intent`.
- Multimodal (13.38): реестр `vision/audio/video → agentId`
  (first-class записи, wiring моделей — отдельная интеграция).

### Wiring
- Dexie **v31** additive (8 таблиц), `FrontierRepository` (DAL `frontier`),
  `phase31-frontier` (3 сервиса, intent→реальный Graph),
  5 событий `eval:*`, lazy-сервисы, `stores/frontierStore.ts`.

## Отложено на финальную проверку
- typecheck/build/tests/lint по frontier-срезу, e2e
  benchmark→run→compare→redteam→matrix→sim→norm→org→intent→store.

## Оба роадмапа написаны полностью
Волны 1–5 + Фазы A–D: Dexie v23→v31, фазы 23–31, ~70 событий,
10 доков. Дальше — **финальная проверка всего вместе**, когда скажешь.
