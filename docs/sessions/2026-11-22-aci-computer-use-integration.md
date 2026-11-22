# 2026-11-22 — aci-computer-use-integration

Статус: done

## Цель сессии

Подключить `checkCommand()` (I2) к месту фактического выполнения computer-действий, не ломая обычный ввод текста. Плюс перенести отобранные исследовательские идеи в единый роадмап.

## Что сделано (файлы + коммиты)

- `C:\Users\evgeny\Desktop\New folder (8)\UNITED_ROADMAP_SuperAgents_OS.md` — добавлен раздел 9 «Исследовательский бэклог» (provenance-классификация, failed findings как ценность, аудит по 6 модулям Nebius) и явный отказ от agent-desktop/целых систем/установки плагинов.
- `src/kernel/services/sandbox/aci-policy.ts` — `terminalCommandFromInput()` извлекает команду только при явном terminal-намерении (`terminal: true`, `shell: true` или `target` с terminal/shell/console/cmd/powershell).
- `src/kernel/services/computer/computer-use-loop-service.ts` — проверка перед `executor.execute()`: при отказе политика возвращает tool-сообщение с причиной и продолжает цикл, не считая вызов.
- Тесты: 2 новых в `aci-policy.test.ts`, 2 в `computer-use-loop-service.test.ts`.

## Принятые решения (+ почему; кандидат в ADR?)

- Явное terminal-намерение обязательно: проверять любой текст действия `type` было бы ошибкой — агент печатает не только в терминал. Это убирает ложные срабатывания.
- Отказ — мягкий (tool-сообщение + продолжение цикла), а не жёсткий сброс: агент видит причину и может скорректировать действие.
- Исследовательские идеи занесены в роадмап как отдельный трек после Фаз 0–3, без смены текущего курса.

## Обнаруженные проблемы / гипотезы

- Факт: серверный `.mjs`-адаптер `processAdapter` имеет собственную политику (`server/code-runner-policy.mjs`) — TS-политика к нему не применена; это осознанно, без дублирования.
- Гипотеза: computer-use loop получает terminal-флаг не от всех провайдеров — при его отсутствии проверка не сработает. Для полного покрытия нужно, чтобы адаптер выставлял `terminal: true` при работе в терминале.
- Источники из `New folder (9)` носят promotional-характер; цифры и звёзды не проверены по первоисточникам.

## Результаты проверок (typecheck/lint/test — что запускалось)

- `vitest run` ACI + computer-use loop — 37/37 passed.
- ESLint на четырёх изменённых TS-файлах — без замечаний.
- Полный typecheck/E2E не запускались локально — оставить CI.

## Следующий логический шаг

B1 (декларативные HITL interrupts с типизированным resume) и проверка уже реализованного в `debate-runtime/interrupt-queue.ts`, чтобы не дублировать. Затем — возврат к provenance/failed findings по исследовательскому бэклогу.

---

## Факты (авто, из checkpoint.mjs)

- Ветка: main @ 136da12
- Изменённых файлов: 4
  - M src/kernel/services/computer/computer-use-loop-service.test.ts
  - M src/kernel/services/computer/computer-use-loop-service.ts
  - M src/kernel/services/sandbox/aci-policy.test.ts
  - M src/kernel/services/sandbox/aci-policy.ts
- Diff stat:
  - .../computer/computer-use-loop-service.test.ts | 54 ++++++++++++++++++++++
  - .../services/computer/computer-use-loop-service.ts | 14 ++++++
  - src/kernel/services/sandbox/aci-policy.test.ts | 22 ++++++++-
  - src/kernel/services/sandbox/aci-policy.ts | 16 +++++++
  - 4 files changed, 105 insertions(+), 1 deletion(-)
- Последние коммиты:
  - 136da12 test(e2e): cover two-agent run and history after reload
  - 99954f5 feat(sandbox): add ACI observation truncation and command policy
  - db1db99 feat(orchestrator): persist run history keyed by runId
  - 326fbe7 test(orchestrator): cover two-agent mission run by runId
  - 75ec5f4 test(keys): cover vault path and sync P0 status docs
