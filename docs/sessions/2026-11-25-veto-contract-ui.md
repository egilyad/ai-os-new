# 2026-11-25 — veto-contract-ui

Статус: done

## Цель сессии

Завершить veto-vertical slice: общий контракт и видимость срабатываний в ExceptionsPanel.

## Что сделано (файлы + коммиты)

- `kernel/contracts/veto-gate.ts` — `IVetoGate`, `VetoGateMatch`, `VetoSurface`; чат и ассистент теперь используют один контракт, `VetoGateService implements IVetoGate`.
- `ExceptionsPanel` подписан на `chat:veto` через `eventBus`, показывает счётчик срабатываний рядом с каждым шаблоном. Чистая функция `addVetoCount` покрыта тестом.
- Тест добавлен в `test:stable`/`test:coverage`.

## Принятые решения (+ почему; кандидат в ADR?)

- UI читает событие напрямую, а не `realtimeMetricsService`: панель не зависит от того, какой экземпляр метрик зарегистрирован в контейнере.
- Счётчик хранится в компоненте и обновляется event-driven — без polling и без записи в БД.
- Общий контракт в `kernel/contracts` устраняет дублирование интерфейса в двух deps.

## Обнаруженные проблемы / гипотезы

- Факт: ESLint выдаёт 4 старых warning про raw color literals в `ExceptionsPanel.tsx`; errors 0.
- Гипотеза: следующий MVP-пункт отчёта — единые конфигурации линз/исключений в Dexie с версионированием и экспортом.

## Результаты проверок (typecheck/lint/test — что запускалось)

- `vitest run veto-counts.test.ts veto-gate-service.test.ts` — 2/2; ESLint — 0 errors (4 pre-existing warnings).
- Полный typecheck/E2E не запускались локально — оставить CI.

## Следующий логический шаг

Проверить в CI `test:stable` целиком и, если зелёный, перейти к конфигурациям/экспорту линз и исключений.

---

## Факты (авто, из checkpoint.mjs)

- Ветка: main @ c78f16f
- Изменённых файлов: 8
  - M package.json
  - M src/components/ExceptionsPanel/ExceptionsPanel.tsx
  - M src/kernel/contracts/chat.ts
  - M src/kernel/services/assistant/assistant-service.ts
  - M src/kernel/services/veto-gate-service.ts
  - ?? src/components/ExceptionsPanel/veto-counts.test.ts
  - ?? src/components/ExceptionsPanel/veto-counts.ts
  - ?? src/kernel/contracts/veto-gate.ts
- Diff stat:
  - package.json | 4 ++--
  - src/components/ExceptionsPanel/ExceptionsPanel.tsx | 16 +++++++++++++++-
  - src/kernel/contracts/chat.ts | 13 ++-----------
  - src/kernel/services/assistant/assistant-service.ts | 13 ++-----------
  - src/kernel/services/veto-gate-service.ts | 14 +++++---------
  - 5 files changed, 26 insertions(+), 34 deletions(-)
- Последние коммиты:
  - c78f16f feat(veto): check assistant output before publishing
  - b4f5b6c feat(metrics): count veto triggers per surface and template
  - 3049f70 feat(veto): emit chat:veto event for blocked responses
  - 5894184 feat(veto): post-check assistant output against exception templates
  - ee56306 feat(lenses): unify stack compilation between UI and runtime
