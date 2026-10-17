<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Панели: Агенты — маркетплейс и протокол

> Раздел: **Панели** · Статус: documented · Теги: панель, агенты, маркетплейс, протокол, инструкция

Источники: `src/i18n/translations/en/nav.ts`, `src/components/AgentMarketplacePanel`, `src/components/AgentComparisonPanel`

## Назначение

Каталог, сравнение и взаимодействие агентов. Метки — `nav.*`.

## Инструменты

- **Agent Marketplace** — магазин агентов.
- **Agent Comparison** — сравнение агентов.
- **Agent Protocol** — протокол взаимодействия агентов.
- **Team Collaboration** — командная работа.
- **Template Sharing** — обмен шаблонами.

## Где менять

Компоненты: `AgentMarketplacePanel`, `AgentComparisonPanel`, `AgentProtocolPanel`, `CollaborationPanel`, `TemplateSharingPanel`. Агенты — [Агенты: устройство и управление](./agents.md), персоны — [Панели: Персоны агентов](./panel-persona.md).

---

## Связанные материалы

- [Агенты: устройство и управление](./agents.md)
- [Панель: Флот (Fleet Console)](./panel-fleet.md)
- [Панели: Персоны агентов](./panel-persona.md)

---

## Связи с кодом (авто)

Цепочка «панель → маршрут → компонент → тесты» собрана из реестра маршрутов.

- Панель `agent-marketplace` → маршрут `/agent-marketplace`
  - Компонент: `src/components/AgentMarketplacePanel`
  - Тесты: — (рядом с компонентом не найдены)
- Панель `agent-comparison` → маршрут `/agent-comparison`
  - Компонент: `src/components/AgentComparisonPanel`
  - Тесты: — (рядом с компонентом не найдены)
- Панель `agent-protocol` → маршрут `/agent-protocol`
  - Компонент: `src/components/AgentProtocolPanel`
  - Тесты: — (рядом с компонентом не найдены)
- Панель `template-sharing` → маршрут `/template-sharing`
  - Компонент: `src/components/TemplateSharingPanel`
  - Тесты: — (рядом с компонентом не найдены)
- Панель `team-collaboration` → маршрут `/team-collaboration`
  - Компонент: `src/components/CollaborationPanel`
  - Тесты: — (рядом с компонентом не найдены)

См. также: [Каталог панелей](./panels-catalog.md) · [Каталог компонентов OS](./dev-component-catalog.md).

[← Все материалы](./README.md)
