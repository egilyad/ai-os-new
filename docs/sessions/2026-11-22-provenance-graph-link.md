# 2026-11-22 — provenance-graph-link

Статус: done

## Цель сессии

Связать сохранённую provenance с Universal Graph: рёбра «утверждение → источник» и узлы отказов.

## Что сделано (файлы + коммиты)

- `src/kernel/services/project-graph/run-provenance-link-service.ts` — `link(runId, projectId)` создаёт узлы `run-artifact` и `run-source`, рёбра по типу provenance (`computed→derived_from`, `parsed→cites`, `digitized→evidence_for`, `hypothesis→supports`) и узлы `run-failure` для отказов.
- `src/kernel/service-registration/phase90-ledger.ts` — сервис зарегистрирован в DI с зависимостями `runHistoryService` и `projectGraphService`.
- `src/kernel/services/project-graph/run-provenance-link-service.test.ts` — 2 теста; тест добавлен в `test:stable`.
- Единый роадмап — пункт provenance обновлён.

## Принятые решения (+ почему; кандидат в ADR?)

- Отдельный сервис linking, а не вызовы из оркестратора: у оркестратора нет `projectId`, а граф — проектная сущность. Вызывающий код решает, когда связать запуск с проектом.
- Дедупликация узлов/рёбер переиспользует `upsertNode`/`link` ProjectGraphService (ссылка `run-artifact:<runId>:<nodeId>`).
- Отказы попадают в граф как отдельные `note`-узлы, а не как рёбра: причина фиксируется, но семантически не привязывается к источникам без дополнительного контекста.

## Обнаруженные проблемы / гипотезы

- Факт: `RunProvenanceLinkService` пока не вызывается продакшн-кодом — он зарегистрирован в DI, но интеграция в `agent-project-runtime` (где есть `projectId` и `runId`) — следующий шаг.
- Гипотеза: автоматический вызов `link()` после `completeRun()` даст граф без ручных действий; нужно только не ломать existing run-трассу.
- Поиск отказов пока доступен только через `RunHistoryService.listFailures()`; CommandPalette/Wiki-Brain не подключены.

## Результаты проверок (typecheck/lint/test — что запускалось)

- `vitest run` нового теста — 2/2 passed.
- ESLint на трёх изменённых TS-файлах — без замечаний.
- Полный typecheck/E2E не запускались локально — оставить CI.

## Следующий логический шаг

Вызвать `runProvenanceLinkService.link()` из `agent-project-runtime` после завершения run с проектом; подключить `listFailures()` к CommandPalette; затем UX-фаза роадмапа.

---

## Факты (авто, из checkpoint.mjs)

- Ветка: main @ 6a4b52a
- Изменённых файлов: 4
  - M package.json
  - M src/kernel/service-registration/phase90-ledger.ts
  - ?? src/kernel/services/project-graph/run-provenance-link-service.test.ts
  - ?? src/kernel/services/project-graph/run-provenance-link-service.ts
- Diff stat:
  - package.json | 4 ++--
  - src/kernel/service-registration/phase90-ledger.ts | 11 +++++++++++
  - 2 files changed, 13 insertions(+), 2 deletions(-)
- Последние коммиты:
  - 6a4b52a feat(history): persist artifact provenance and search failures
  - cd5fd2c feat(computer): enforce ACI command policy in computer loop
  - 136da12 test(e2e): cover two-agent run and history after reload
  - 99954f5 feat(sandbox): add ACI observation truncation and command policy
  - db1db99 feat(orchestrator): persist run history keyed by runId
