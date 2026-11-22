# 2026-11-22 — aci-sandbox-policy

Статус: done

## Цель сессии

P0-быстрая победа I1/I2 из gap-каталога: ACI-политика песочницы (усечение observation с NOTE и блоклист интерактивных команд).

## Что сделано (файлы + коммиты)

- `src/kernel/services/sandbox/aci-policy.ts` — `truncateObservation()` (head+tail, elision NOTE, лимит 4000 по умолчанию) и `checkCommand()` (базовый блоклист vim/nano/emacs/tail -f/less/watch + пользовательский blocklist + allowRegex с override).
- `src/kernel/services/sandbox-service.ts` — строковый результат воркера проходит через `truncateObservation`; I1-inline в `execute()`.
- `src/kernel/services/sandbox/aci-policy.test.ts` (8 тестов) и новый тест в `sandbox-service.test.ts`.
- `package.json` — тест ACI добавлен в `test:stable`/`test:coverage`.

## Принятые решения (+ почему; кандидат в ADR?)

- ACI-политика выделена в чистый модуль без зависимостей: её можно переиспользовать в tool-executor и агентном цикле, не трогая воркер.
- `allowRegex` имеет приоритет над блоклистом (семантика `block_unless_regex` из SWE-agent) — это позволяет явно разрешить нужную интерактивную команду.
- Усечение применяется только к строковым результатам `execute()`, чтобы не менять форму остальных типов.

## Обнаруженные проблемы / гипотезы

- Гипотеза из gap-отчёта (I1/I2) подтвердилась: в `sandbox-service.ts` не было elision-NOTE и блоклиста команд; существующее усечение в `tool-executor.ts:167` — только для KV-trail и без подсказки агенту.
- Гипотеза из gap-отчёта (A3) опровергнута для текущего baseline: `TerminationService` с 7 предикатами и AND/OR уже реализован (`src/kernel/services/termination/termination-service.ts`, phase89). Не дублировать.
- I2 пока не подключён к месту фактического выполнения shell-команд — модуль готов к интеграции, но вызов `checkCommand()` ещё нигде не производится.

## Результаты проверок (typecheck/lint/test — что запускалось)

- `vitest run` ACI + sandbox-service — 19/19 passed.
- ESLint на четырёх изменённых TS-файлах — без замечаний.
- Полный typecheck/E2E не запускались локально — оставить CI.

## Следующий логический шаг

Подключить `checkCommand()` к месту выполнения shell-команд (computer-use/sidecar или tool-executor), затем A4 (hard cost-budget cap, прерывающий запуск) и B1 (HITL interrupts).

---

## Факты (авто, из checkpoint.mjs)

- Ветка: main @ db1db99
- Изменённых файлов: 5
  - M package.json
  - M src/kernel/services/sandbox-service.test.ts
  - M src/kernel/services/sandbox-service.ts
  - ?? src/kernel/services/sandbox/aci-policy.test.ts
  - ?? src/kernel/services/sandbox/aci-policy.ts
- Diff stat:
  - package.json | 4 ++--
  - src/kernel/services/sandbox-service.test.ts | 8 ++++++++
  - src/kernel/services/sandbox-service.ts | 4 +++-
  - 3 files changed, 13 insertions(+), 3 deletions(-)
- Последние коммиты:
  - db1db99 feat(orchestrator): persist run history keyed by runId
  - 326fbe7 test(orchestrator): cover two-agent mission run by runId
  - 75ec5f4 test(keys): cover vault path and sync P0 status docs
  - 787f2f0 feat(chat): ttl cache for model auto-refresh
  - 4fb3ab4 feat(chat): pending switch indicator while sending
