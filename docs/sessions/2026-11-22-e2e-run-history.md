# 2026-11-22 — e2e-run-history

Статус: done

## Цель сессии

Закрыть пользовательский слой сквозного сценария: Playwright-E2E «первый запуск → два агента → результат → история после перезагрузки».

## Что сделано (файлы + коммиты)

- `e2e/run-history.spec.ts` — один тест на проверенных селекторах из `data-chat.spec.ts` и `data-debate.spec.ts`: seed ключа, stub OpenRouter, живой дебат с двумя агентами и 2 раундами, ожидание маркера `-PATH-42`, перезагрузка и проверка темы в истории.
- `.github/workflows/ci.yml` — спек добавлен в матрицу `debate` (job timeout 40 мин).

## Принятые решения (+ почему; кандидат в ADR?)

- E2E написан на готовых селекторах, которые уже проходят в CI, чтобы снизить риск флаков; новый сценарий не изобретает собственную навигацию.
- Тест не проверяет `runId` напрямую (нет публичного UI) — проверяет пользовательский критерий «итог виден после перезагрузки». runId покрыт vitest-интеграцией.
- Запуск браузера локально не производился по правилу слабого ПК; проверена только компиляция/discovery.

## Обнаруженные проблемы / гипотезы

- A3 (алгебра терминации) и A4 (жёсткий бюджет) уже реализованы в текущем baseline: `TerminationService` (phase89) и `CostManagerDecorator.onExceeded='block'`. Gap-отчёт отстаёт от кода — не дублировать.
- I2 (`checkCommand`) по-прежнему не подключён к месту фактического выполнения shell-команд; серверный `.mjs`-адаптер уже имеет собственную политику (`server/code-runner-policy.mjs`), поэтому прямое подключение TS-модуля потребовало бы портирования или клиентской проверки.
- Гипотеза: живой дебат сохраняется в историю только после завершения всех раундов — тест использует 2 раунда и длинный таймаут.

## Результаты проверок (typecheck/lint/test — что запускалось)

- `node ./node_modules/@playwright/test/cli.js test --list --config=e2e/playwright.config.ts e2e/run-history.spec.ts` — 1 тест обнаружен, компиляция OK.
- Полный E2E-прогон не запускался локально — оставить CI.

## Следующий логический шаг

Дождаться результата E2E в CI; затем подключить `checkCommand()` к computer-use loop (с проверкой только для terminal-намерения, чтобы не блокировать ввод текста) и перейти к B1 (HITL interrupts).

---

## Факты (авто, из checkpoint.mjs)

- Ветка: main @ 99954f5
- Изменённых файлов: 2
  - M .github/workflows/ci.yml
  - ?? e2e/run-history.spec.ts
- Diff stat:
  - .github/workflows/ci.yml | 2 +-
  - 1 file changed, 1 insertion(+), 1 deletion(-)
- Последние коммиты:
  - 99954f5 feat(sandbox): add ACI observation truncation and command policy
  - db1db99 feat(orchestrator): persist run history keyed by runId
  - 326fbe7 test(orchestrator): cover two-agent mission run by runId
  - 75ec5f4 test(keys): cover vault path and sync P0 status docs
  - 787f2f0 feat(chat): ttl cache for model auto-refresh
