# 2026-11-24 — hotbugs-batch2

Статус: done

## Цель сессии

Второй пакет hot-фиксов по аудитам `HotBugs`: гонки, идемпотентность, утечка секретов и dotted-path в Dexie.

## Что сделано (файлы + коммиты)

- `cross-tab-lock-service.ts` — `destroy()` стал async и вызывает `_releaseAllOwned()`; лок больше не висит 120 с после HMR/shutdown.
- `key-state-store.ts` — `persistNow()` циклится, пока есть грязное состояние или идёт запись.
- `logger-service.ts` — `meta` проходит через `sanitizeObject` до попадания в буфер/IndexedDB/exportLogs.
- `event-bus.ts` — `emitOnce` ставит ключ идемпотентности **после** `emit()`, а не до.
- `schema-hooks.ts` — новый `applyMods()` корректно применяет dotted-path (`metadata.timestamp`) перед Zod-валидацией вместо литерального поля с точкой.
- `session-write-guard.ts` — при `version=0` используется `updatedAt`; комментарий в документе теперь соответствует коду.
- Тесты: обновлены `cross-tab-lock-service.test.ts`, `session-write-guard.test.ts`; добавлен `schema-hooks.test.ts`. Новые пути в `test:stable`.
- Единый роадмап — дополнен раздел hot-фиксов.

## Принятые решения (+ почему; кандидат в ADR?)

- `Dexie.applyUpdate` отсутствует в установленной версии dexie — реализован собственный `applyMods` с `structuredClone` и fallback на spread.
- `emitOnce` по-прежнему не знает, было ли событие дропнуто (emit возвращает void) — но теперь дроп не отравляет кэш на 30 с.
- `persistNow()` не добавлял таймаут: бесконечный цикл возможен только при постоянном притоке мутаций, что и есть корректным поведением «дождаться консистентности».

## Обнаруженные проблемы / гипотезы

- Факт: `applyMods` копирует объект через `structuredClone` — для не-plain/class-записей есть fallback на spread, но вложенные объекты тогда останутся общими.
- Гипотеза: следующий приоритет — `permission-middleware` fail-open, `AUTOPILOT` без admin-гейта и pairing-код из `Math.random()`.
- Остальные findings аудита требуют продуктовых решений (authz-модель, CSAM, tenant-scope HTTP).

## Результаты проверок (typecheck/lint/test — что запускалось)

- `vitest run` 8 файлов — 98/98; ESLint на девяти файлах — 0 замечаний.
- Полный typecheck/E2E не запускались локально — оставить CI.

## Следующий логический шаг

Третий пакет: default-deny в permission middleware, admin-гейт AUTOPILOT, безопасный pairing-код.

---

## Факты (авто, из checkpoint.mjs)

- Ветка: main @ 5ace75b
- Изменённых файлов: 10
  - M package.json
  - M src/kernel/events/event-bus.ts
  - M src/kernel/services/cross-tab-lock-service.test.ts
  - M src/kernel/services/cross-tab-lock-service.ts
  - M src/kernel/services/dexie/schema-hooks.ts
  - M src/kernel/services/key-state-store.ts
  - M src/kernel/services/logger-service.ts
  - M src/kernel/utils/session-write-guard.test.ts
  - M src/kernel/utils/session-write-guard.ts
  - ?? src/kernel/services/dexie/schema-hooks.test.ts
- Diff stat:
  - package.json | 4 +-
  - src/kernel/events/event-bus.ts | 2 +-
  - src/kernel/services/cross-tab-lock-service.test.ts | 3 +-
  - src/kernel/services/cross-tab-lock-service.ts | 13 +---
  - src/kernel/services/dexie/schema-hooks.ts | 74 +++++++++++++++-------
  - src/kernel/services/key-state-store.ts | 6 +-
  - src/kernel/services/logger-service.ts | 2 +-
  - src/kernel/utils/session-write-guard.test.ts | 7 ++
  - src/kernel/utils/session-write-guard.ts | 14 ++--
  - 9 files changed, 79 insertions(+), 46 deletions(-)
- Последние коммиты:
  - 5ace75b fix(boot): restore failure UI and clear stale factory errors
  - 426b19a docs: add backup and restore guide
  - e089be9 feat(onboarding): enable local mock demo provider
  - ed7fa93 ci: gate mirrored agent skills with SkillEvaluator
  - 2cb21f6 docs: record skill quality uplift to grade A
