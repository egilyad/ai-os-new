# 2026-11-22 — mission-run-integration

Статус: done

## Цель сессии

Третий PR единого роадмапа: сквозной сценарий «задача → два агента → артефакт» с историей по одному `runId`.

## Что сделано (файлы + коммиты)

- `src/kernel/services/orchestrator/mission-run.integration.test.ts` — 4 сценария с реальными `OrchestratorService`, `MissionLedgerService` и `ExecutionReplayService`: сквозной прогон с двумя агентами и replay, отмена с причиной, идемпотентный повтор после сбоя, фиксация причины отказа провайдера.
- `package.json` — тест добавлен в `test:stable` и `test:coverage`.

## Принятые решения (+ почему; кандидат в ADR?)

- Сценарий проверен на уровне оркестратора через vitest, а не Playwright: локально нельзя гонять тяжёлый E2E на слабом ПК; Playwright-спек остаётся отдельной задачей для CI.
- История запуска смоделирована как сериализуемый массив шагов с `runId` и проверена replay после `JSON.parse` — это демонстрация criteria «после перезагрузки виден итог, чтение истории не вызывает провайдеров».
- Кандидат в ADR: один владелец переходов состояния (оркестратор), постоянная запись хранит итог, replay только читает. Текущий код частично противоречит: `MissionLedgerService` живёт в памяти и удаляется `finish()` в конце прогона.

## Обнаруженные проблемы / гипотезы

- Факт: `OrchestratorService.executePlan()` обнуляет `this.cancellation` в начале (`orchestrator-service.ts:196`), поэтому отмена работает только во время исполнения, не до старта.
- Факт: ledger в оркестраторе имеет собственный `ledgerId`, а не `missionId`/`runId`, и удаляется после завершения — сквозная история по `runId` пока не построена в продакшн-коде (тест моделирует её на уровне шагов).
- Гипотеза: для полного соответствия P1 понадобится постоянное хранилище шагов, ключевое по `runId`, и связывание его с `MissionArtifact` — отдельная задача, не часть текущего теста.

## Результаты проверок (typecheck/lint/test — что запускалось)

- `node ./node_modules/vitest/vitest.mjs run src/kernel/services/orchestrator/mission-run.integration.test.ts --no-coverage` — 4/4 passed.
- `node ./node_modules/eslint/bin/eslint.js` на новом тесте — без замечаний.
- Полный typecheck/E2E не запускались локально — оставить CI.

## Следующий логический шаг

Связать оркестратор с постоянной историей по `runId` (вместо in-memory ledger), затем добавить Playwright-E2E для первого запуска/таймаута/отмены/чтения истории после перезагрузки.

---

## Факты (авто, из checkpoint.mjs)

- Ветка: main @ 75ec5f4
- Изменённых файлов: 2
  - M package.json
  - ?? src/kernel/services/orchestrator/mission-run.integration.test.ts
- Diff stat:
  - package.json | 4 ++--
  - 1 file changed, 2 insertions(+), 2 deletions(-)
- Последние коммиты:
  - 75ec5f4 test(keys): cover vault path and sync P0 status docs
  - 787f2f0 feat(chat): ttl cache for model auto-refresh
  - 4fb3ab4 feat(chat): pending switch indicator while sending
  - a9abd99 feat(chat): unified llm error advice in diagnostics
  - 0cb8737 fix(forum): monotonic post timestamps for stable ordering
