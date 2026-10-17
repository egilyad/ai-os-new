<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Панели: Симуляция и контрфакты

> Раздел: **Панели** · Статус: documented · Теги: панель, симуляция, контрфакт, инструкция

Источники: `src/i18n/translations/en/nav.ts`, `src/components/SimulationPanel/SimulationPanel.tsx`, `src/components/WhatIfPanel/WhatIfPanel`

## Назначение

Моделирование «а что если» и разбор причин. Метки — `nav.*`.

## Инструменты

- **Simulation Lab** — лаборатория симуляций.
- **Counterfactual** — контрфактический анализ.
- **Causal Debugger** — причинная отладка.
- **What-If** — сценарные прикидки.
- **Topology Templates** — шаблоны топологий.

## Где менять

Компоненты: `SimulationPanel`, `CounterfactualPanel`, `CausalDebugger`, `WhatIfPanel`, `TopologyGalleryPanel`. Наблюдаемость — [Панель: Наблюдаемость (логи, трейсы, здоровье)](./panel-observability.md).

---

## Связанные материалы

- [Панели: Планирование и миссии](./panel-planning.md)
- [Панели: Теневые прогоны и стратегия](./panel-shadow.md)
- [Панель: Наблюдаемость (логи, трейсы, здоровье)](./panel-observability.md)
- [Зона 19: прогнозы и симуляции](./zone-19.md)

---

## Связи с кодом (авто)

Цепочка «панель → маршрут → компонент → тесты» собрана из реестра маршрутов.

- Панель `what-if` → маршрут `/what-if`
  - Компонент: `src/components/WhatIfPanel/WhatIfPanel`
  - Тесты: `src/components/WhatIfPanel/WhatIfPanel.test.tsx`
- Панель `causal-debugger` → маршрут `/causal-debugger`
  - Компонент: `src/components/CausalDebugger/CausalDebugger`
  - Тесты: — (рядом с компонентом не найдены)
- Панель `counterfactual` → маршрут `/counterfactual`
  - Компонент: `src/components/CounterfactualPanel/CounterfactualPanel`
  - Тесты: — (рядом с компонентом не найдены)
- Панель `topology-templates` → маршрут `/topology-templates`
  - Компонент: `src/components/TopologyGalleryPanel`
  - Тесты: — (рядом с компонентом не найдены)
- Панель `simulation` → маршрут `/simulation`
  - Компонент: `src/components/SimulationPanel/SimulationPanel`
  - Тесты: `src/components/SimulationPanel/SimulationPanel.test.tsx`

См. также: [Каталог панелей](./panels-catalog.md) · [Каталог компонентов OS](./dev-component-catalog.md).

[← Все материалы](./README.md)
