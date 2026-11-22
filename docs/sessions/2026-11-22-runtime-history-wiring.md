# 2026-11-22 — runtime-history-wiring

Статус: done

## Цель сессии

Замкнуть цепочку: run проекта → история запуска → provenance в Universal Graph, без ручного вызова сервисов.

## Что сделано (файлы + коммиты)

- `src/kernel/services/agent-project-runtime.ts` — опциональные зависимости `history` и `provenanceLink`; после успешного и после неудачного `completeRun()` пишется `RunHistoryRecord` (узел = агент, вход = задача, выход = результат или причина отказа) и вызывается `link(run.id, projectId)`.
- `src/kernel/service-registration/phase66-projects.ts` — зависимости передаются из DI (`runHistoryService`, `runProvenanceLinkService`).
- `src/kernel/services/agent-project-runtime.test.ts` — 2 теста: сохранение истории и вызов link после успеха; запись причины отказа после провала.
- Единый роадмап — отмечено, что link вызывается из рантайма.

## Принятые решения (+ почему; кандидат в ADR?)

- Писать историю в самом рантайме, а не в оркестраторе: у рантайма есть и `projectId`, и `run.id`; у оркестратора — только `plan.id`, и это другое пространство идентификаторов.
- Fail-soft: ошибки `save()`/`link()` логируются предупреждением и не меняют результат задачи — наблюдаемость не должна ломать исполнение.
- Для неудачных run артефакты не создаются: причина фиксируется в шаге (`output.error`) и в графе как отдельный узел.

## Обнаруженные проблемы / гипотезы

- Факт: `RunHistoryService` и `RunProvenanceLinkService` теперь имеют два производителя — оркестратор (missionId) и project runtime (project run id). Оба пишут в один индекс, ключи не конфликтуют, но семантика `runId` теперь смешанная.
- Гипотеза: нужен единый префикс в `runId` (`mission-…` vs `project-run-…`) для легкой фильтрации; отложено.
- `listFailures()` всё ещё не подключён к CommandPalette/Wiki-Brain.

## Результаты проверок (typecheck/lint/test — что запускалось)

- `vitest run agent-project-runtime.test.ts` — 17/17 passed.
- ESLint на трёх изменённых TS-файлах — без замечаний.
- Полный typecheck/E2E не запускались локально — оставить CI.

## Следующий логический шаг

Подключить `listFailures()` к CommandPalette (или отдельной панели истории запусков), затем вернуться к UX-фазе единого роадмапа.

---

## Факты (авто, из checkpoint.mjs)

- Ветка: main @ 4348ff3
- Изменённых файлов: 3
  - M src/kernel/service-registration/phase66-projects.ts
  - M src/kernel/services/agent-project-runtime.test.ts
  - M src/kernel/services/agent-project-runtime.ts
- Diff stat:
  - .../service-registration/phase66-projects.ts | 2 +
  - src/kernel/services/agent-project-runtime.test.ts | 52 +++++++++++++
  - src/kernel/services/agent-project-runtime.ts | 85 ++++++++++++++++++++++
  - 3 files changed, 139 insertions(+)
- Последние коммиты:
  - 4348ff3 feat(graph): link run provenance into project graph
  - 6a4b52a feat(history): persist artifact provenance and search failures
  - cd5fd2c feat(computer): enforce ACI command policy in computer loop
  - 136da12 test(e2e): cover two-agent run and history after reload
  - 99954f5 feat(sandbox): add ACI observation truncation and command policy
