# 2026-11-24 — hotbugs-boot-and-container

Статус: done

## Цель сессии

Разобрать аудиты из `C:\Users\evgeny\Desktop\HotBugs` и исправить быстрые подтверждённые баги в нашем репозитории.

## Что сделано (файлы + коммиты)

- `src/kernel/runtime.ts` — удалён собственный `unhandledrejection`-хендлер с `preventDefault()`: теперь единственный обработчик в `main.tsx` эмитит `EVENTS.NOTIFICATION`.
- `src/main.tsx` — проверяет результат `runtime.start()` и показывает экран «System failed to initialize» при `phase === 'error'`.
- `src/kernel/services/database-service.ts` — `destroy()` пишет `ai_os_clean_shutdown`, убирая ложный «possible crash» при каждом старте.
- `src/kernel/container.ts` — `register()`, `registerFactory()`, `registerTransient()` сбрасывают `failedFactories` для того же id.
- Тесты: 1 новый в `runtime.test.ts`, 1 в `container.test.ts`; boot-smoke зелёный.
- Единый роадмап — раздел hot-фиксов.

## Принятые решения (+ почему; кандидат в ADR?)

- Исправлены только findings с высокой уверенностью и точечным fix; крупные рефакторинги (authz, fencing token, WAL) не трогались.
- Boot-ошибка показывается только при `phase === 'error'`, degraded-режим не ломает запуск приложения.
- `clean_shutdown` пишется в `ssrSafeStorage` с try/catch — недоступность storage не должна ломать shutdown.

## Обнаруженные проблемы / гипотезы

- Факт: аудиты сделаны по другому снимку (`C:\Users\deda donik\...`), но три из четырёх findings подтвердились в нашем коде по тем же местам.
- Гипотеза: следующий приоритет — `cross-tab-lock-service.destroy()` не релизит лок и `key-state-store.persistNow()` возвращается раньше грязной записи.
- Большая часть аудита (authz/CASM/SSRF/tenant-scope) требует продуктовых решений и отдельного цикла.

## Результаты проверок (typecheck/lint/test — что запускалось)

- `vitest run runtime.test.ts container.test.ts boot-smoke.test.ts` — зелёные.
- ESLint на шести файлах — без замечаний.
- Полный typecheck/E2E не запускались локально — оставить CI.

## Следующий логический шаг

Fencing token в cross-tab lock, `persistNow()` с циклом `while (_persistDirty)` и `destroy()` с освобождением локов.

---

## Факты (авто, из checkpoint.mjs)

- Ветка: main @ 426b19a
- Изменённых файлов: 6
  - M src/kernel/container.test.ts
  - M src/kernel/container.ts
  - M src/kernel/runtime.test.ts
  - M src/kernel/runtime.ts
  - M src/kernel/services/database-service.ts
  - M src/main.tsx
- Diff stat:
  - src/kernel/container.test.ts | 9 +++++++++
  - src/kernel/container.ts | 3 +++
  - src/kernel/runtime.test.ts | 8 ++++++++
  - src/kernel/runtime.ts | 16 ----------------
  - src/kernel/services/database-service.ts | 8 ++++++++
  - src/main.tsx | 5 ++++-
  - 6 files changed, 32 insertions(+), 17 deletions(-)
- Последние коммиты:
  - 426b19a docs: add backup and restore guide
  - e089be9 feat(onboarding): enable local mock demo provider
  - ed7fa93 ci: gate mirrored agent skills with SkillEvaluator
  - 2cb21f6 docs: record skill quality uplift to grade A
  - b2b31cc docs: record SkillEvaluator pilot results
