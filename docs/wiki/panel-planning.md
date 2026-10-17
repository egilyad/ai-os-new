<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Панели: Планирование и миссии

> Раздел: **Панели** · Статус: documented · Теги: панель, планирование, миссия, инструкция

Источники: `src/i18n/translations/en/nav.ts`, `src/components/PlannerPanel/`, `src/components/MetaAgentPanel/MetaAgentPanel.tsx`

## Назначение

Планирование действий и живое исполнение миссий. Метки — `nav.*`.

## Инструменты

- **Planner** — планирование шагов.
- **Minimax Planner** — планирование по принципу минимакса.
- **Meta Agent** — мета-агент (управление агентами).
- **Scratchpad** — черновик промежуточных рассуждений.
- **Mission Control** — живое исполнение миссий.

## Где менять

Компоненты: `PlannerPanel`, `MinimaxPlannerPanel`, `MetaAgentPanel`, `ScratchpadPanel`, `LiveCognition/MissionControl`. Автономия — [Панель: Автономия](./panel-autonomy.md).

---

## Связанные материалы

- [Агенты: устройство и управление](./agents.md)
- [Панель: Автономия](./panel-autonomy.md)
- [Панели: Симуляция и контрфакты](./panel-simulation.md)

---

## Связи с кодом (авто)

Цепочка «панель → маршрут → компонент → тесты» собрана из реестра маршрутов.

- Панель `planner` → маршрут `/planner`
  - Компонент: `src/components/PlannerPanel/PlannerPanel`
  - Тесты: `src/components/PlannerPanel/PlannerPanel.test.tsx`
- Панель `scratchpad` → маршрут `/scratchpad`
  - Компонент: `src/components/ScratchpadPanel/ScratchpadPanel`
  - Тесты: `src/components/ScratchpadPanel/ScratchpadPanel.test.tsx`
- Панель `minimax-planner` → маршрут `/minimax-planner`
  - Компонент: `src/components/MinimaxPlannerPanel/MinimaxPlannerPanel`
  - Тесты: `src/components/MinimaxPlannerPanel/MinimaxPlannerPanel.test.tsx`
- Панель `mission` → маршрут `/mission`
  - Компонент: `src/components/LiveCognition/MissionControl`
  - Тесты: — (рядом с компонентом не найдены)
- Панель `meta-agent` → маршрут `/meta-agent`
  - Компонент: `src/components/MetaAgentPanel/MetaAgentPanel`
  - Тесты: `src/components/MetaAgentPanel/MetaAgentPanel.test.tsx`

См. также: [Каталог панелей](./panels-catalog.md) · [Каталог компонентов OS](./dev-component-catalog.md).

[← Все материалы](./README.md)
