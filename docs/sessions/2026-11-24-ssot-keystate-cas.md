# 2026-11-24 — ssot-keystate-cas

Статус: done

## Цель сессии

Э3.3 / 8.7: устранить last-writer-wins в `KeyStateStore` между вкладками.

## Что сделано (файлы + коммиты)

- `src/kernel/services/key-state-store.ts` — при наличии `getKvCas`/`setKvCas` запись идёт через CAS: читается текущая версия, состояния сливаются по `updatedAt`, конфликт ретраится до 3 раз; fallback — обычный `setKv`.
- `src/kernel/services/key-management/key-state-store.test.ts` — тест CAS-merge; 6/6.
- Единый роадмап — Э3.3 обновлена.

## Принятые решения (+ почему; кандидат в ADR?)

- Слияние по `updatedAt` сохраняет более свежее состояние другой вкладки вместо слепой перезаписи.
- CAS опционален в зависимостях: тесты и внешние consumer'ы без CAS продолжают работать через `setKv`.
- После трёх конфликтов делается fallback, а не бесконечный retry — счётчик истекших попыток логируется.

## Обнаруженные проблемы / гипотезы

- Факт: `update()` всегда перезаписывает `updatedAt` через `Date.now()` даже если патч его содержит — в тесте пришлось использовать будущую метку удалённой вкладки.
- Гипотеза: лучше явно разделить `localUpdatedAt` и `remoteUpdatedAt`; сейчас достаточно монотонного времени.
- 8.3/8.4 (debate selection, provider projections) остаются в Э3.3.

## Результаты проверок (typecheck/lint/test — что запускалось)

- `vitest run key-state-store.test.ts` — 6/6; ESLint — 0 ошибок.
- Полный typecheck/E2E не запускались локально — оставить CI.

## Следующий логический шаг

8.3/8.4: один источник для выбора дебата и provider/ключ-состояния.

---

## Факты (авто, из checkpoint.mjs)

- Ветка: main @ 2aef03f
- Изменённых файлов: 2
  - M src/kernel/services/key-management/key-state-store.test.ts
  - M src/kernel/services/key-state-store.ts
- Diff stat:
  - .../key-management/key-state-store.test.ts | 29 ++++++++++++++++++++++
  - src/kernel/services/key-state-store.ts | 23 ++++++++++++++++-
  - 2 files changed, 51 insertions(+), 1 deletion(-)
- Последние коммиты:
  - 2aef03f refactor(settings): unify theme preference storage
  - d8e9b5c fix(server): scope HTTP API to company bearer
  - 66463ba fix(gateway): whitelist process adapter binaries and env
  - f615d5e fix(server): isolate code-runner env and restrict binaries
  - 09c83d4 fix(audit): bridge dead letters, isolate WAL, gate governance
