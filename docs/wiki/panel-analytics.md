<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Панели: Аналитика, затраты и ключи

> Раздел: **Панели** · Статус: verified · Теги: панель, аналитика, затраты, ключи, метрики, инструкция

Источники: `src/i18n/translations/en/analytics.ts`, `src/components/AnalyticsPanel/AnalyticsPanel.tsx`, `src/components/CostAnalyticsPanel/`, `src/components/KeyUsageAnalyticsPanel/`

## Назначение

Сводная аналитика: метрики LLM, затраты и использование ключей. Ключи `analytics.*`, `cost_analytics.*`, `keyUsage.*`.

## Метрики LLM

EWMA-латентность, TTFT, cache hit rate, доля ошибок (429 / 5xx / timeout / прочие), fallback rate и здоровье. Таблица LLM и полный отчёт. Разбор решений: единственное / ничья / разброс / потери.

## Затраты

Общая стоимость, прогноз до конца месяца, тренд и аномалии; разбивка по провайдеру, модели и агенту; периоды 7 / 30 / 60 дней. Если данных нет — так и написано.

## Использование ключей

Всего и активных ключей, запросы, токены, стоимость, средняя латентность, тренд и разбивка по строкам (запросы / токены / латентность / ошибки).

## Где менять

Компоненты: `AnalyticsPanel`, `CostAnalyticsPanel`, `KeyUsageAnalyticsPanel`. Бюджеты и алерты — [Панель: Бюджет и затраты](./panel-budget.md).

---

## Связанные материалы

- [Панель: Бюджет и затраты](./panel-budget.md)
- [Панель: Наблюдаемость (логи, трейсы, здоровье)](./panel-observability.md)
- [Каталог компонентов OS](./dev-component-catalog.md)

---

## Связи с кодом (авто)

Цепочка «панель → маршрут → компонент → тесты» собрана из реестра маршрутов.

- Панель `analytics` → маршрут `/analytics`
  - Компонент: `src/components/AnalyticsPanel/AnalyticsPanel`
  - Тесты: `src/components/AnalyticsPanel/AnalyticsPanel.test.tsx`
- Панель `cost-analytics` → маршрут `/cost-analytics`
  - Компонент: `src/components/CostAnalyticsPanel`
  - Тесты: — (рядом с компонентом не найдены)
- Панель `key-usage-analytics` → маршрут `/key-usage-analytics`
  - Компонент: `src/components/KeyUsageAnalyticsPanel`
  - Тесты: — (рядом с компонентом не найдены)

См. также: [Каталог панелей](./panels-catalog.md) · [Каталог компонентов OS](./dev-component-catalog.md).

[← Все материалы](./README.md)
