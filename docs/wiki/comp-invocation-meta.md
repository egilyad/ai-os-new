<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: вызовы (invocation) и мета-агент

> Раздел: **Компоненты и сервисы** · Статус: verified · Теги: компоненты, invocation, мета-агент, учёт, стратегии

Источники: `src/kernel/services/invocation/invocation-engine-service.ts`, `src/kernel/services/invocation/invocation-repository.ts`, `src/kernel/services/invocation/invocation-cost-tracker.ts`, `src/kernel/services/meta/meta-agent-service.ts`, `src/kernel/services/meta/strategy-service.ts`, `src/kernel/services/meta/cog-memory-service.ts`, `src/kernel/services/project-invocation-bridge.ts`

## Назначение

Фиксировать каждый вызов агента/инструмента (учёт, повтор) и управлять ими на мета-уровне: стратегии и «мета-агент», который предлагает улучшения.

## Возможности

- Движок вызовов (`InvocationEngineService`: `invoke` → Invocation, гейтинг политиками+бюджетом, событие `INVOCATION_REQUESTED`), хранилище (`InvocationRepository`), учёт стоимости (`InvocationCostTracker`).
- Мета-агент (`MetaAgentService`: `analyze` → ImprovementProposal, `accept/apply/reject`, события `META_PROPOSED/META_APPLIED`), стратегии (`StrategyService`), когнитивная память (`CogMemoryService`).
- Мост в проекты (`ProjectInvocationBridge`).

## Реализация

- `invocation/`: `invocation-engine-service.ts`, `invocation-repository.ts`, `invocation-cost-tracker.ts` (DI: `phase21-invocation`, `phase22-cost-tracker`).
- `meta/`: `meta-agent-service.ts`, `strategy-service.ts`, `cog-memory-service.ts` (DI: `phase29-meta`).
- `project-invocation-bridge.ts` (DI: `phase66-projects`).

## Связи

- Расходы — [Компонент: бюджет, цены и расход](./comp-budget-pricing.md); агенты — [Компонент: агенты, роли и навыки](./comp-agents-roles-skills.md).
- Панели: [Панель: Настройки](./panel-settings.md), [Панели: Аналитика, затраты и ключи](./panel-analytics.md); состояние — [Компонент: слой состояния (Zustand-сторы)](./comp-state-stores.md) (`invocationStore`).

## Проверка работоспособности

- Тесты: `src/stores/invocationStore.test.ts` (состояние), `project-invocation-bridge.test.ts` (3 кейса).
- **Пробел:** нет юнит-тестов на ядро `InvocationEngineService`, `InvocationRepository`, `MetaAgentService`, `StrategyService`, `CogMemoryService`, `InvocationCostTracker`.

## Состояние

- Реализовано; подтверждено чтением кода, тесты — на сторе и project-bridge.
- **Риски:** `ProjectInvocationBridge` — заглушка (возвращает фиксированную строку, `filesChanged=[]`, `success:true` всегда); история `invocations` в RAM (не персистентна); MetaAgentService — детерминированные эвристики без LLM.

---

## Связанные материалы

- [Панель: Настройки](./panel-settings.md)
- [Панели: Аналитика, затраты и ключи](./panel-analytics.md)
- [Компонент: бюджет, цены и расход](./comp-budget-pricing.md)
- [Компонент: агенты, роли и навыки](./comp-agents-roles-skills.md)
- [Компонент: слой состояния (Zustand-сторы)](./comp-state-stores.md)

[← Все материалы](./README.md)
