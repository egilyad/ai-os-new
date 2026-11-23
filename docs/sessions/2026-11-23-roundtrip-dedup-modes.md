# 2026-11-23 — roundtrip-dedup-modes

Статус: done

## Цель сессии

Закрыть оговорку round-trip пилота: дедупликация по id и режимы merge/replace.

## Что сделано (файлы + коммиты)

- `src/kernel/utils/roundtrip.ts` — `ImportMode` и `mergeById(existing, incoming, mode)`; merge сохраняет существующие записи и добавляет новые с дедупликацией, replace берёт только входящие.
- `src/components/MemoryPanel/MemoryHeader.tsx` — селектор режима импорта.
- `src/components/MemoryPanel/MemoryPanel.tsx` — `mergeById` перед `storeBatch`, при replace сначала `memoryService.clear()`.
- RU/EN: `memory.import_mode/merge/replace`.
- Тесты: 1 новый в `roundtrip.test.ts` (5 всего) и 1 в `MemoryPanel.test.tsx` (14 всего).
- Единый роадмап — Э3.1 обновлена.

## Принятые решения (+ почему; кандидат в ADR?)

- Дедупликация выполняется до записи в сервис: не зависит от того, как `storeBatch` обрабатывает повторные id.
- Replace очищает индекс явно — иначе старые записи останутся даже при «только входящие».
- Внутри входящего списка последняя запись с тем же id побеждает.

## Обнаруженные проблемы / гипотезы

- Факт: при replace очистка и запись не атомарны — сбой между ними оставит пустой индекс.
- Гипотеза: нужна транзакция в `memoryService` для полной замены; отдельная задача.
- ESLint: 0 ошибок, 9 предсуществующих предупреждений.

## Результаты проверок (typecheck/lint/test — что запускалось)

- `vitest run roundtrip.test.ts MemoryPanel.test.tsx` — 19/19; `i18n-keys.test.ts` — 4/4.
- ESLint на семи файлах — 0 ошибок.
- Полный typecheck/E2E не запускались локально — оставить CI.

## Следующий логический шаг

Перенести оболочку round-trip на ProviderManager и RolesPanel, затем на остальные панели с экспортом.

---

## Факты (авто, из checkpoint.mjs)

- Ветка: main @ 5327806
- Изменённых файлов: 7
  - M src/components/MemoryPanel/MemoryHeader.tsx
  - M src/components/MemoryPanel/MemoryPanel.test.tsx
  - M src/components/MemoryPanel/MemoryPanel.tsx
  - M src/i18n/translations/en/memory.ts
  - M src/i18n/translations/ru/memory.ts
  - M src/kernel/utils/roundtrip.test.ts
  - M src/kernel/utils/roundtrip.ts
- Diff stat:
  - src/components/MemoryPanel/MemoryHeader.tsx | 21 +++++++++++++++-
  - src/components/MemoryPanel/MemoryPanel.test.tsx | 33 +++++++++++++++++++++++++
  - src/components/MemoryPanel/MemoryPanel.tsx | 14 +++++++++--
  - src/i18n/translations/en/memory.ts | 3 +++
  - src/i18n/translations/ru/memory.ts | 3 +++
  - src/kernel/utils/roundtrip.test.ts | 28 ++++++++++++++++++++-
  - src/kernel/utils/roundtrip.ts | 18 ++++++++++++++
  - 7 files changed, 116 insertions(+), 4 deletions(-)
- Последние коммиты:
  - 5327806 feat(memory): add versioned export and validated import
  - a51c8b5 feat(roundtrip): add versioned export envelope
  - b5ba418 fix(a11y): restore focus-visible ring over panel styles
  - d873f94 feat(dashboard): embed five overview hubs
  - af9c8cd feat(overview): add five-hub aggregation service
