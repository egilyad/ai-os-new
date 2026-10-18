<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: персоны и строитель (persona, builder)

> Раздел: **Компоненты и сервисы** · Статус: documented · Теги: компоненты, персоны, билдер, контекст

Источники: `src/kernel/services/persona/persona-service.ts`, `src/kernel/services/persona/lt-memory-service.ts`, `src/kernel/services/persona/shared-context-service.ts`, `src/kernel/services/builder/builder-agent-service.ts`

## Назначение

Давать агентам устойчивую личность (персону) и общий контекст, а также строить/дорабатывать агентов и артефакты «строителем».

## Возможности

- Персоны (`PersonaService`), долговременная память персоны (`LtMemoryService`), общий контекст (`SharedContextService`).
- Агент-строитель (`BuilderAgentService`) — создание и правка через агента.

## Реализация

- `persona/`: `persona-service.ts`, `lt-memory-service.ts`, `shared-context-service.ts`, демо-сид.
- `builder/`: `builder-agent-service.ts` (`BuilderAgentService`).

## Связи

- Память — [Компонент: память и знания](./comp-memory.md); роли — [Компонент: агенты, роли и навыки](./comp-agents-roles-skills.md).
- Панели: [Панели: Персоны агентов](./panel-persona.md), [Панель: Конструктор агентов](./panel-builder.md), [Панели: Агенты — маркетплейс и протокол](./panel-agents-market.md).

## Проверка работоспособности

- Ручная: создать персону, задать общий контекст, собрать агента строителем.
- В каталогах `persona/` и `builder/` выделенных тестов не найдено.

## Состояние

- Реализовано; подтверждено чтением кода, без автотестов.

---

## Связанные материалы

- [Панели: Персоны агентов](./panel-persona.md)
- [Панель: Конструктор агентов](./panel-builder.md)
- [Панели: Агенты — маркетплейс и протокол](./panel-agents-market.md)
- [Компонент: память и знания](./comp-memory.md)
- [Компонент: агенты, роли и навыки](./comp-agents-roles-skills.md)

[← Все материалы](./README.md)
