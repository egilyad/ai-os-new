# 2026-11-25 — veto-metrics-collector

Статус: done

## Цель сессии

Подключить событие `chat:veto` к метрикам ядра.

## Что сделано (файлы + коммиты)

- `MetricsCollector` подписан на `VETO_TRIGGERED`: инкрементирует `veto.triggered{surface=...}` и `veto.by_template{template=...}`.
- Тест `metrics-collector.test.ts` расширен; файл добавлен в `test:stable` и `test:coverage`.

## Принятые решения (+ почему; кандидат в ADR?)

- Счётчик по шаблону отдельный: позволяет видеть, какое именно исключение чаще всего блокирует ответы.
- Метрики идут через существующий `IMetricsService`, без нового хранилища.

## Обнаруженные проблемы / гипотезы

- Факт: дашборд пока не отображает новые метрики — нужно добавить панель в UI.
- Гипотеза: пост-проверка ассистента (не чата) тоже должна эмитить `chat:veto` с surface `assistant`.

## Результаты проверок (typecheck/lint/test — что запускалось)

- `vitest run metrics-collector.test.ts` — зелёный; ESLint — 0 замечаний.
- Полный typecheck/E2E не запускались локально — оставить CI.

## Следующий логический шаг

Пост-проверка в ассистенте с surface `assistant` + отображение счётчика veto в дашборде/панели исключений.

---

## Факты (авто, из checkpoint.mjs)

- Ветка: main @ 3049f70
- Изменённых файлов: 3
  - M package.json
  - M src/kernel/services/ops/metrics-collector.test.ts
  - M src/kernel/services/ops/metrics-collector.ts
- Diff stat:
  - package.json | 4 ++--
  - src/kernel/services/ops/metrics-collector.test.ts | 16 ++++++++++++++++
  - src/kernel/services/ops/metrics-collector.ts | 12 ++++++++++++
  - 3 files changed, 30 insertions(+), 2 deletions(-)
- Последние коммиты:
  - 3049f70 feat(veto): emit chat:veto event for blocked responses
  - 5894184 feat(veto): post-check assistant output against exception templates
  - ee56306 feat(lenses): unify stack compilation between UI and runtime
  - af99c96 fix(skills): remove scanner-triggering command literals
  - eba3138 fix(secrets): move webhook secret to session storage
