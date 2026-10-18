<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: адаптер OpenRouter

> Раздел: **Компоненты и сервисы** · Статус: documented · Теги: компоненты, llm, адаптер, openrouter

Источники: `src/llm/openrouter/openrouter-adapter.ts`, `src/llm/openrouter/openrouter-types.ts`

## Назначение

Ходить через агрегатор OpenRouter к множеству моделей одним ключом.

## Возможности

- `OpenRouterAdapter` (`BaseLLMAdapter`); схема ответа `OpenRouterResponseSchema` (zod).

## Реализация

- `src/llm/openrouter/openrouter-adapter.ts`, `src/llm/openrouter/openrouter-types.ts`.

## Связи

- Зонтик — [Компонент: адаптеры провайдеров LLM](./comp-llm-adapters.md); родственные — [Компонент: адаптер OpenAI-совместимых провайдеров (DeepSeek, Kimi, MiniMax, Qwen, Cerebras)](./comp-adapter-openai-compatible.md), [Компонент: адаптер Groq](./comp-adapter-groq.md).
- Панели: [Провайдеры и маршрутизация](./providers.md), [Панель: Провайдеры и ключи](./panel-providers.md).

## Проверка работоспособности

- Подтверждено чтением кода (отдельного тест-файла нет); схема ответа валидируется zod.

## Состояние

- Реализовано; автотестом не покрыто.

---

## Связанные материалы

- [Компонент: адаптеры провайдеров LLM](./comp-llm-adapters.md)
- [Компонент: адаптер OpenAI-совместимых провайдеров (DeepSeek, Kimi, MiniMax, Qwen, Cerebras)](./comp-adapter-openai-compatible.md)
- [Компонент: адаптер Groq](./comp-adapter-groq.md)
- [Провайдеры и маршрутизация](./providers.md)
- [Панель: Провайдеры и ключи](./panel-providers.md)

[← Все материалы](./README.md)
