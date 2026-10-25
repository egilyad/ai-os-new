<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: адаптер OpenRouter

> Раздел: **Компоненты и сервисы** · Статус: documented · Теги: компоненты, llm, адаптер, openrouter

Источники: `src/llm/openrouter/openrouter-adapter.ts`, `src/llm/openrouter/openrouter-types.ts`

## Назначение

Ходить через агрегатор OpenRouter к множеству моделей одним ключом.

## Возможности

- `OpenRouterAdapter` (`BaseLLMAdapter`, НЕ OpenAiCompatible): baseURL по умолчанию `/proxy/openrouter/api/v1` (прокси); модель всегда передаётся вызовом (free-модели — в `free-tiers.ts`).
- Streaming: SSE `parseSSEStream`, склейка chunked `delta.tool_calls` по `index`, capper `max_tokens=16384`.
- `rotateKey` — **есть** (`POST /keys`, таймаут 15 с); `checkHealth` через `refreshModelCache` (TTL 5 мин); `getAvailableModels` с пер-key кэшем.
- Схема ответа `OpenRouterResponseSchema` (zod); `sanitizeModel` (regex).

## Реализация

- `src/llm/openrouter/openrouter-adapter.ts`, `src/llm/openrouter/openrouter-types.ts`.

## Связи

- Зонтик — [Компонент: адаптеры провайдеров LLM](./comp-llm-adapters.md); родственные — [Компонент: адаптер OpenAI-совместимых провайдеров (DeepSeek, Kimi, MiniMax, Qwen, Cerebras)](./comp-adapter-openai-compatible.md), [Компонент: адаптер Groq](./comp-adapter-groq.md).
- Панели: [Провайдеры и маршрутизация](./providers.md), [Панель: Провайдеры и ключи](./panel-providers.md).

## Проверка работоспособности

- Тест: `openrouter-adapter.test.ts` (3 теста: склейка `delta.tool_calls`, параллельные tool_calls, plain text) — покрыт streaming-путь.
- Ручная: выбрать провайдера OpenRouter в Providers и отправить сообщение.

## Состояние

- Реализовано; streaming-путь покрыт тестом, batch/health/rotateKey — чтением кода.

---

## Связанные материалы

- [Компонент: адаптеры провайдеров LLM](./comp-llm-adapters.md)
- [Компонент: адаптер OpenAI-совместимых провайдеров (DeepSeek, Kimi, MiniMax, Qwen, Cerebras)](./comp-adapter-openai-compatible.md)
- [Компонент: адаптер Groq](./comp-adapter-groq.md)
- [Провайдеры и маршрутизация](./providers.md)
- [Панель: Провайдеры и ключи](./panel-providers.md)

[← Все материалы](./README.md)
