# 2026-11-22 — run-history-provenance

Статус: done

## Цель сессии

Первые два пункта исследовательского бэклога: provenance-классификация артефактов и поиск по неудачным запускам (failed findings).

## Что сделано (файлы + коммиты)

- `src/kernel/contracts/run-history.ts` — `RunHistoryProvenance` (`computed/parsed/digitized/hypothesis`), поле `provenance` у `RunHistoryArtifact`, `RunHistoryFailure` и метод `listFailures(query)`.
- `src/kernel/services/orchestrator/run-history-service.ts` — `listFailures()` собирает отказы из всех запусков, фильтрует по подстроке причины, сортирует по времени.
- `src/kernel/services/orchestrator/orchestrator-service.ts` — при сохранении истории переносит `meta.provenance` артефакта в постоянную запись.
- `src/kernel/services/orchestrator/run-history-service.test.ts` — тест поиска отказов; `mission-run.integration.test.ts` — проверка сохранения provenance.
- Единый роадмап (`New folder (8)`) — оба пункта помечены как выполненные.

## Принятые решения (+ почему; кандидат в ADR?)

- Provenance берётся только из четырёх разрешённых значений; другие значения молча игнорируются — контракт не ломается при произвольном `meta`.
- Failed findings ищутся по `output.error` шагов, без отдельного хранилища: причина уже сохранялась в `RunHistoryStep`, нового контура не нужно.
- Поиск — простой case-insensitive substring (без BM25); для первого шага достаточно, интеграцию с Wiki-Brain оставить следующим этапом.

## Обнаруженные проблемы / гипотезы

- B1 (декларативные HITL interrupts) уже реализован: `HitlInterruptService` + контракт `hitl-interrupt.ts` + phase91. Gap-отчёт устарел по нескольким пунктам — перед реализацией всегда сверять с кодом.
- Гипотеза: для полноценного «передачи опыта» отказы нужно связывать с похожими задачами через эмбеддинги — текущий substring-поиск этого не даёт.
- Рёбра графа «утверждение → источник» пока не построены: provenance сохранена, но в Universal Graph не попала.

## Результаты проверок (typecheck/lint/test — что запускалось)

- `vitest run` трёх файлов истории/оркестратора — 22/22 passed.
- ESLint на пяти изменённых TS-файлах — без замечаний.
- Полный typecheck/E2E не запускались локально — оставить CI.

## Следующий логический шаг

Связать `provenance` с Universal Graph (рёбра «утверждение → источник») и добавить поиск отказов в Wiki-Brain/CommandPalette; затем вернуться к UX-фазе единого роадмапа.

---

## Факты (авто, из checkpoint.mjs)

- Ветка: main @ cd5fd2c
- Изменённых файлов: 5
  - M src/kernel/contracts/run-history.ts
  - M src/kernel/services/orchestrator/mission-run.integration.test.ts
  - M src/kernel/services/orchestrator/orchestrator-service.ts
  - M src/kernel/services/orchestrator/run-history-service.test.ts
  - M src/kernel/services/orchestrator/run-history-service.ts
- Diff stat:
  - src/kernel/contracts/run-history.ts | 11 +++++++++
  - .../orchestrator/mission-run.integration.test.ts | 2 ++
  - .../services/orchestrator/orchestrator-service.ts | 21 ++++++++++++-----
  - .../orchestrator/run-history-service.test.ts | 22 ++++++++++++++++++
  - .../services/orchestrator/run-history-service.ts | 26 +++++++++++++++++++++-
  - 5 files changed, 75 insertions(+), 7 deletions(-)
- Последние коммиты:
  - cd5fd2c feat(computer): enforce ACI command policy in computer loop
  - 136da12 test(e2e): cover two-agent run and history after reload
  - 99954f5 feat(sandbox): add ACI observation truncation and command policy
  - db1db99 feat(orchestrator): persist run history keyed by runId
  - 326fbe7 test(orchestrator): cover two-agent mission run by runId
