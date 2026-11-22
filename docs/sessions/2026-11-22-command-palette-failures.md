# 2026-11-22 — command-palette-failures

Статус: done

## Цель сессии

Сделать отказы запусков доступными пользователю через CommandPalette, не добавляя новую панель в навигацию (роадмап запрещает новые панели до разгрузки).

## Что сделано (файлы + коммиты)

- `src/kernel/instances/services-extras.ts` — экспорт `runHistoryService` через `lazyService`.
- `src/i18n/translations/{ru,en}/common.ts` — ключ `palette.section.failures`.
- `src/components/CommandPalette.tsx` — при открытии палитры загружаются `listFailures()` (до 30 записей); каждая запись — элемент с причиной отказа, секцией «Отказы запусков» и переходом в `/diagnostics`.
- Единый роадмап — пункт failed findings обновлён.

## Принятые решения (+ почему; кандидат в ADR?)

- Новых маршрутов и панелей нет: используется существующий канал CommandPalette + маршрут `/diagnostics`. Это соблюдает ограничение роадмапа по разгрузке навигации.
- Загрузка отказов ленивая (только когда палитра открыта) и отменяемая через `cancelled`-флаг — не влияет на старт приложения.
- Ошибка загрузки отказов молча игнорируется: палитра должна работать даже при недоступном хранилище.

## Обнаруженные проблемы / гипотезы

- Факт: переход ведёт в `/diagnostics`, но эта панель пока не читает конкретный отказ из параметров — пользователь видит общую диагностику, а не карточку отказа.
- Гипотеза: можно передавать `?failure=<runId>:<nodeId>` и подсвечивать запись; потребует правки diagnostics-панели.
- ESLint показывает 4 предупреждения в `CommandPalette.tsx` (raw colors / fast refresh) — все предсуществующие, новых нет.

## Результаты проверок (typecheck/lint/test — что запускалось)

- `vitest run src/i18n/i18n-keys.test.ts` — 4/4 passed (симметрия RU/EN).
- ESLint на четырёх изменённых файлах — 0 ошибок (4 предсуществующих предупреждения).
- Полный typecheck/E2E не запускались локально — оставить CI.

## Следующий логический шаг

Передать конкретный отказ в `/diagnostics` через query-параметр; затем вернуться к UX-фазе единого роадмапа (overview-хабы, уведомления, a11y-ядро).

---

## Факты (авто, из checkpoint.mjs)

- Ветка: main @ 016b320
- Изменённых файлов: 4
  - M src/components/CommandPalette.tsx
  - M src/i18n/translations/en/common.ts
  - M src/i18n/translations/ru/common.ts
  - M src/kernel/instances/services-extras.ts
- Diff stat:
  - src/components/CommandPalette.tsx | 31 ++++++++++++++++++++++++++++---
  - src/i18n/translations/en/common.ts | 1 +
  - src/i18n/translations/ru/common.ts | 1 +
  - src/kernel/instances/services-extras.ts | 2 ++
  - 4 files changed, 32 insertions(+), 3 deletions(-)
- Последние коммиты:
  - 016b320 feat(runtime): persist project runs and link provenance
  - 4348ff3 feat(graph): link run provenance into project graph
  - 6a4b52a feat(history): persist artifact provenance and search failures
  - cd5fd2c feat(computer): enforce ACI command policy in computer loop
  - 136da12 test(e2e): cover two-agent run and history after reload
