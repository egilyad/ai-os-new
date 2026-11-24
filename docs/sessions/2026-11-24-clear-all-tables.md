# 2026-11-24 — clear-all-tables

Статус: done

## Цель сессии

Ре-аудит P2-2: `clearAllData` очищал только 16 из ~131 таблицы Dexie.

## Что сделано (файлы + коммиты)

- `key-service.ts` — `clearAllData` теперь очищает все таблицы через `db.tables.map(t => t.clear())` внутри одной транзакции.
- Тест в `key-service.test.ts`: запись в `notifications` (не входила в старый список) удаляется после `clearAllData`; 15/15 в файле.

## Принятые решения (+ почему; кандидат в ADR?)

- Явный список заменён перечислением таблиц — новые таблицы автоматически попадают в очистку.
- Все очистки остаются в одной `rw`-транзакции на всех таблицах.
- Ошибка по-прежнему логируется, после чего эмитится `CLEAR_DATA`.

## Обнаруженные проблемы / гипотезы

- Факт: тест проверяет одну «новую» таблицу; полный перечень таблиц не перебирается.
- Гипотеза: для JUnit-отчёта можно добавить проверку `db.tables.every(count===0)` — отдельный шаг.
- ESLint: 0 ошибок; 15 тестов зелёные.

## Результаты проверок (typecheck/lint/test — что запускалось)

- `vitest run key-service.test.ts` — 15/15; ESLint — 0 замечаний.
- Полный typecheck/E2E не запускались локально — оставить CI.

## Следующий логический шаг

P2-3: unhandled promise в memory worker — уже частично закрыт (.catch добавлены); проверить оставшиеся fire-and-forget.

---

## Факты (авто, из checkpoint.mjs)

- Ветка: main @ f89235d
- Изменённых файлов: 2
  - M src/kernel/services/key-management/key-service.test.ts
  - M src/kernel/services/key-management/key-service.ts
- Diff stat:
  - .../services/key-management/key-service.test.ts | 19 +++++++++++++++++++
  - src/kernel/services/key-management/key-service.ts | 19 +------------------
  - 2 files changed, 20 insertions(+), 18 deletions(-)
- Последние коммиты:
  - f89235d feat(sse): support Last-Event-ID replay and tenant filtering
  - 02545ff refactor(groq): route requests through shared HTTP stack
  - f270e38 feat(budget): wire persistent hard-stop into LLM decorators
  - dff5566 fix(rate-limit): share global bucket across tabs
  - e01ebf8 fix(snapshot): restore live state after replay stops
