<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: LLM-мост (адаптеры crews/council/graph/frontier)

> Раздел: **Компоненты и сервисы** · Статус: documented · Теги: компоненты, llm, адаптеры, мост

Источники: `src/kernel/services/llm-bridge/llm-task-executor.ts`

## Назначение

Связывать прикладные подсистемы (экипажи, совет, графы, фронтир) с LLM: единый мост исполняет их задачи через провайдеров.

## Возможности

- Исполнение задач экипажа (`LlmCrewExecutor implements ICrewTaskExecutor`).
- LLM-порт для совета (`LlmCouncilPort implements ICouncilLlmPort`), для графа (`LlmGraphPort implements IGraphLlmPort`), исполнитель фронтира (`LlmFrontierExecutor implements IFrontierExecutor`).
- Общие опции моста `LlmBridgeOptions`.

## Реализация

- Единственный файл `src/kernel/services/llm-bridge/llm-task-executor.ts` с четырьмя классами-адаптерами. Это тонкий слой: сами вызовы идут через роутинг/провайдеров.

## Связи

- Провайдеры — [Компонент: рантайм провайдеров](./comp-provider-runtime.md); маршрутизация — [Компонент: роутинг и провайдеры](./comp-routing.md); роли — [Компонент: агенты, роли и навыки](./comp-agents-roles-skills.md).
- Панель: [Панель: Режиссёр](./panel-director.md) (Director/совет).

## Проверка работоспособности

- **Тестов нет:** для `llm-task-executor.ts` выделенный тест не найден.
- Ручная: запустить экипаж/совет и убедиться, что задачи доходят до провайдера.

## Состояние

- Реализовано; подтверждено чтением кода, без автотестов.

---

## Связанные материалы

- [Компонент: рантайм провайдеров](./comp-provider-runtime.md)
- [Компонент: роутинг и провайдеры](./comp-routing.md)
- [Компонент: агенты, роли и навыки](./comp-agents-roles-skills.md)
- [Панель: Режиссёр](./panel-director.md)
- [Разработчикам: структура и ворота](./for-developers.md)

[← Все материалы](./README.md)
