<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: LLM-мост (адаптеры crews/council/graph/frontier)

> Раздел: **Компоненты и сервисы** · Статус: verified · Теги: компоненты, llm, адаптеры, мост, crews, council

Источники: `src/kernel/services/llm-bridge/llm-task-executor.ts`, `src/kernel/contracts/provider-adapter.ts`

## Назначение

Связывать прикладные подсистемы (экипажи, совет, графы, фронтир, личности) с LLM: единый мост исполняет их задачи через клиента провайдеров.

## Возможности

- Исполнение задач экипажа (`LlmCrewExecutor implements ICrewTaskExecutor`), включая опциональный tool-loop через `toolRunner` + гейтинг `toolCheck`.
- LLM-порт для совета (`LlmCouncilPort implements ICouncilLlmPort`: `draftStance`/`judgeRound` с JSON-парсингом и fallback на `'draw'`), для графа (`LlmGraphPort implements IGraphLlmPort`), исполнитель фронтира (`LlmFrontierExecutor implements IFrontierExecutor`), порт личности (`LlmPersonaPort`).
- Общие опции моста `LlmBridgeOptions` (модель per-agent/deфолт, temperature 0.5, maxTokens 1024, `cacheScope` B-20).

## Реализация

- Единственный файл `src/kernel/services/llm-bridge/llm-task-executor.ts` (266 ст.), 6 классов. Все вызовы идут через `ILLMClientService.chat` (не routerService); system-буфер урезается до 6000, user — до 12000 символов.
- **DI:** единого токена `llmBridge` нет — адаптеры собираются инлайн в фазах: `phase23-crew` (LlmCrewExecutor), `phase24-council` (LlmCouncilPort), `phase25-graph` (LlmGraphPort), `phase26-persona` (LlmPersonaPort), `phase31-frontier` (LlmFrontierExecutor).

## Связи

- Провайдеры — [Компонент: рантайм провайдеров](./comp-provider-runtime.md); маршрутизация — [Компонент: роутинг и провайдеры](./comp-routing.md); роли — [Компонент: агенты, роли и навыки](./comp-agents-roles-skills.md); экипажи/совет — [Компонент: экипажи и совет](./comp-crews-councils.md).
- Панель: [Панель: Режиссёр](./panel-director.md) (Director/совет).

## Проверка работоспособности

- Тест: `llm-persona-port.test.ts` (5 кейсов: JSON-парсинг, non-JSON fallback, пустые данные).
- **Пробел:** нет тестов на `LlmCrewExecutor`, `LlmCouncilPort`, `LlmGraphPort`, `LlmFrontierExecutor`.

## Состояние

- Реализовано; подтверждено чтением кода, тест — только на persona-port.
- **Риски:** echo-fallback при сбое LLM (молчаливый «успех»); жёсткие обрезки (риск потери контекста); наивный JSON-парсинг (`indexOf('{')`/`lastIndexOf('}')`); `LlmGraphPort` игнорирует scope (кэш не скоуплен).

---

## Связанные материалы

- [Компонент: рантайм провайдеров](./comp-provider-runtime.md)
- [Компонент: роутинг и провайдеры](./comp-routing.md)
- [Компонент: агенты, роли и навыки](./comp-agents-roles-skills.md)
- [Компонент: экипажи и совет](./comp-crews-councils.md)
- [Панель: Режиссёр](./panel-director.md)
- [Разработчикам: структура и ворота](./for-developers.md)

[← Все материалы](./README.md)
