# 2026-11-22 — persistent-run-history

Статус: done

## Цель сессии

Связать оркестратор с постоянной историей запуска по одному `runId` (P1 единого роадмапа): итог и шаги должны переживать перезагрузку, а replay — только читать историю.

## Что сделано (файлы + коммиты)

- `src/kernel/contracts/run-history.ts` — контракт `IRunHistoryService`, запись `RunHistoryRecord` (runId, goal, status, steps, artifacts, времена).
- `src/kernel/services/orchestrator/run-history-service.ts` — реализация поверх `database.getKv/setKv`, индекс запусков, лимиты 200 запусков / 200 шагов / 2000 символов контента, fail-soft при ошибке хранилища.
- `src/kernel/services/orchestrator/orchestrator-service.ts` — опциональный 6-й аргумент `history`; шаги собираются во время прогона и сохраняются одной записью по `plan.id`.
- `src/kernel/service-registration/{phase87-orchestrator,phase90-ledger}.ts` — сервис зарегистрирован в DI и подключён к оркестратору.
- `src/kernel/services/orchestrator/run-history-service.test.ts` (3 теста) и расширяет `mission-run.integration.test.ts` (5-й тест: история доступна после сериализации).
- `package.json` — оба теста добавлены в `test:stable`/`test:coverage`.

## Принятые решения (+ почему; кандидат в ADR?)

- История пишется один раз в конце прогона, а не на каждом шаге: горячий путь executor'а остаётся синхронным, а запись — одной транзакцией KV. Для crash-recovery посередине прогона потребуется отдельная достройка.
- Один владелец переходов состояния остаётся оркестратор; `RunHistoryService` — только запись, `ExecutionReplayService` — только чтение. Кандидат в ADR подтверждён фактической реализацией.
- Идентификатор записи — `plan.id` (missionId), который и является `runId` для сквозного сценария; отдельный `ledgerId` остался внутренним для `MissionLedgerService`.

## Обнаруженные проблемы / гипотезы

- Исправлен предсуществующий баг: `executePlan()` обнулял `this.cancellation` в начале, из-за чего тест `cooperative cancel stops the mission with a reason` (`orchestrator-service.test.ts:157`) падал на `main`. Сброс убран, добавлен явный `clearCancellation()` для повторного использования сервиса.
- Факт: `MissionLedgerService.finish()` удаляет ledger из памяти — для постоянной истории он больше не является источником, его заменил `RunHistoryService`.
- Гипотеза: `RunHistoryRecord` пока не имеет публичного UI-панели; чтение истории доступно через DI `runHistoryService` (`get`/`list`).

## Результаты проверок (typecheck/lint/test — что запускалось)

- `vitest run` трёх файлов (оркестратор, история, интеграция) — 21/21 passed.
- ESLint на семи изменённых TS-файлах — без замечаний.
- Полный typecheck и сборка не запускались локально — оставить CI.

## Следующий логический шаг

Добавить Playwright-E2E для первого запуска/таймаута/отмены/чтения истории после перезагрузки и публичную панель просмотра истории запусков; затем перейти к P0-быстрым победам из gap-каталога (A3/I1+I2/A4).

---

## Факты (авто, из checkpoint.mjs)

- Ветка: main @ 326fbe7
- Изменённых файлов: 8
  - M package.json
  - M src/kernel/service-registration/phase87-orchestrator.ts
  - M src/kernel/service-registration/phase90-ledger.ts
  - M src/kernel/services/orchestrator/mission-run.integration.test.ts
  - M src/kernel/services/orchestrator/orchestrator-service.ts
  - ?? src/kernel/contracts/run-history.ts
  - ?? src/kernel/services/orchestrator/run-history-service.test.ts
  - ?? src/kernel/services/orchestrator/run-history-service.ts
- Diff stat:
  - package.json | 4 +--
  - .../service-registration/phase87-orchestrator.ts | 2 ++
  - src/kernel/service-registration/phase90-ledger.ts | 6 ++++
  - .../orchestrator/mission-run.integration.test.ts | 33 ++++++++++++++++++--
  - .../services/orchestrator/orchestrator-service.ts | 36 +++++++++++++++++++++-
  - 5 files changed, 76 insertions(+), 5 deletions(-)
- Последние коммиты:
  - 326fbe7 test(orchestrator): cover two-agent mission run by runId
  - 75ec5f4 test(keys): cover vault path and sync P0 status docs
  - 787f2f0 feat(chat): ttl cache for model auto-refresh
  - 4fb3ab4 feat(chat): pending switch indicator while sending
  - a9abd99 feat(chat): unified llm error advice in diagnostics
