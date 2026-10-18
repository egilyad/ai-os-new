<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: вызовы (invocation) и мета-агент

> Раздел: **Компоненты и сервисы** · Статус: documented · Теги: компоненты, invocation, мета-агент, учёт

Источники: `src/kernel/services/invocation/invocation-engine-service.ts`, `src/kernel/services/invocation/invocation-repository.ts`, `src/kernel/services/invocation/invocation-cost-tracker.ts`, `src/kernel/services/meta/meta-agent-service.ts`, `src/kernel/services/meta/strategy-service.ts`

## Назначение

Фиксировать каждый вызов агента/инструмента (учёт, повтор) и управлять ими на мета-уровне: стратегии и «мета-агент», который рулит другими.

## Возможности

- Движок вызовов (`InvocationEngineService`), хранилище (`InvocationRepository`), учёт стоимости (`InvocationCostTracker`).
- Мета-агент (`MetaAgentService`), стратегии (`StrategyService`), когнитивная память (`CogMemoryService`).

## Реализация

- `invocation/`: `invocation-engine-service.ts`, `invocation-repository.ts`, `invocation-cost-tracker.ts`.
- `meta/`: `meta-agent-service.ts`, `strategy-service.ts`, `cog-memory-service.ts`.

## Связи

- Расходы — [Компонент: бюджет, цены и расход](./comp-budget-pricing.md); агенты — [Компонент: агенты, роли и навыки](./comp-agents-roles-skills.md).
- Панели: [Панель: Настройки](./panel-settings.md), [Панели: Аналитика, затраты и ключи](./panel-analytics.md); состояние — [Компонент: слой состояния (Zustand-сторы)](./comp-state-stores.md) (`invocationStore`).

## Проверка работоспособности

- Тест: `src/stores/invocationStore.test.ts` (слой состояния); в самих каталогах `invocation/`/`meta/` выделенных тестов не найдено.

## Состояние

- Реализовано; подтверждено чтением кода и тестом стора.

---

## Связанные материалы

- [Панель: Настройки](./panel-settings.md)
- [Панели: Аналитика, затраты и ключи](./panel-analytics.md)
- [Компонент: бюджет, цены и расход](./comp-budget-pricing.md)
- [Компонент: агенты, роли и навыки](./comp-agents-roles-skills.md)
- [Компонент: слой состояния (Zustand-сторы)](./comp-state-stores.md)

[← Все материалы](./README.md)
