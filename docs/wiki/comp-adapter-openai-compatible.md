<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: адаптер OpenAI-совместимых провайдеров (DeepSeek, Kimi, MiniMax, Qwen, Cerebras)

> Раздел: **Компоненты и сервисы** · Статус: verified · Теги: компоненты, llm, адаптер, openai, deepseek, kimi, qwen

Источники: `src/llm/openai-compatible/openai-compatible-adapter.ts`, `src/llm/openai-compatible/openai-compatible-types.ts`, `src/llm/deepseek/deepseek-adapter.ts`, `src/llm/kimi/kimi-adapter.ts`, `src/llm/minimax/minimax-adapter.ts`, `src/llm/qwen/qwen-adapter.ts`, `src/llm/cerebras/cerebras-adapter.ts`

## Назначение

Одна реализация на весь класс провайдеров, говорящих на OpenAI-совместимом протоколе; конкретные вендоры — тонкие наследники с дефолтами.

## Возможности

- `OpenAiCompatibleAdapter` (`BaseLLMAdapter`) + схема ответа `OpenAiCompatibleResponseSchema`.
- Наследники с моделями по умолчанию: DeepSeek (`deepseek-chat`, `deepseek-reasoner`), Kimi (`kimi-k2`, `kimi-k2-thinking`), MiniMax (`MiniMax-M1`), Qwen (`qwen3-max`), Cerebras.

## Реализация

- База: `src/llm/openai-compatible/openai-compatible-adapter.ts`, `...-types.ts`.
- Вендоры: `deepseek/deepseek-adapter.ts`, `kimi/kimi-adapter.ts`, `minimax/minimax-adapter.ts`, `qwen/qwen-adapter.ts`, `cerebras/cerebras-adapter.ts`.

## Связи

- Зонтик — [Компонент: адаптеры провайдеров LLM](./comp-llm-adapters.md); родственные адаптеры — [Компонент: адаптер Groq](./comp-adapter-groq.md), [Компонент: адаптер OpenRouter](./comp-adapter-openrouter.md).
- Панели: [Провайдеры и маршрутизация](./providers.md), [Панель: Провайдеры и ключи](./panel-providers.md).

## Проверка работоспособности

- Тест базового класса: `src/llm/openai-compatible/openai-compatible-adapter.test.ts`.

## Состояние

- База реализована и покрыта тестом; вендорные наследники подтверждены чтением кода.

---

## Связанные материалы

- [Компонент: адаптеры провайдеров LLM](./comp-llm-adapters.md)
- [Компонент: адаптер Groq](./comp-adapter-groq.md)
- [Компонент: адаптер OpenRouter](./comp-adapter-openrouter.md)
- [Провайдеры и маршрутизация](./providers.md)
- [Панель: Провайдеры и ключи](./panel-providers.md)

[← Все материалы](./README.md)
