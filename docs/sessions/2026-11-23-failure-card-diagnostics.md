# 2026-11-23 — failure-card-diagnostics

Статус: done

## Цель сессии

Довести сценарий отказа до конкретной карточки: из CommandPalette в диагностику с причиной конкретного запуска.

## Что сделано (файлы + коммиты)

- `src/components/CommandPalette.tsx` — элемент отказа теперь ведёт в `diagnostics?failure=<runId>:<nodeId>`.
- `src/components/DiagnosticPanel.tsx` — читает параметр `failure`, загружает запись через `runHistoryService.get()`, находит шаг с `output.error` и показывает карточку (узел, причина, runId, время).
- Единый роадмап — уточнён переход в диагностику с карточкой причины.

## Принятые решения (+ почему; кандидат в ADR?)

- Идентификатор отказа кодируется в URL как `runId:nodeId` — без нового состояния/хранилища, ссылка может быть скопирована и открыта заново.
- Загрузка отменяемая (`cancelled`-флаг), ошибка чтения истории не ломает панель.
- Цвета карточки используют `var(--error)` вместо raw-литералов, чтобы не добавлять предупреждения линтера.

## Обнаруженные проблемы / гипотезы

- Факт: `DiagnosticPanel` не имеет юнит-тестов; проверка ограничилась линтером. Покрытие через E2E — следующий шаг.
- Гипотеза: карточка должна показывать не только причину, но и шаги до отказа (контекст) — потребует передачи большего объёма данных через историю.
- ESLint: 9 предупреждений — все предсуществующие (raw colors / fast refresh), новых нет.

## Результаты проверок (typecheck/lint/test — что запускалось)

- ESLint на двух компонентах — 0 ошибок.
- Полный typecheck/E2E не запускались локально — оставить CI.

## Следующий логический шаг

Вернуться к UX-фазе единого роадмапа: overview-хабы (agents/memory/debates/providers/background), уведомления по EventBus, a11y-ядро.

---

## Факты (авто, из checkpoint.mjs)

- Ветка: main @ ebb9355
- Изменённых файлов: 2
  - M src/components/CommandPalette.tsx
  - M src/components/DiagnosticPanel.tsx
- Diff stat:
  - src/components/CommandPalette.tsx | 2 +-
  - src/components/DiagnosticPanel.tsx | 73 ++++++++++++++++++++++++++++++++++++--
  - 2 files changed, 72 insertions(+), 3 deletions(-)
- Последние коммиты:
  - ebb9355 feat(palette): surface failed runs from run history
  - 016b320 feat(runtime): persist project runs and link provenance
  - 4348ff3 feat(graph): link run provenance into project graph
  - 6a4b52a feat(history): persist artifact provenance and search failures
  - cd5fd2c feat(computer): enforce ACI command policy in computer loop
