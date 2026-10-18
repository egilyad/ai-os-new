<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: адаптер Anthropic (Claude)

> Раздел: **Компоненты и сервисы** · Статус: verified · Теги: компоненты, llm, адаптер, anthropic, claude

Источники: `src/llm/anthropic/anthropic-adapter.ts`

## Назначение

Обслуживать API Anthropic (Claude), включая инструменты и режим computer-use.

## Возможности

- `AnthropicAdapter` (`BaseLLMAdapter`); базовый URL `ANTHROPIC_API_BASE`, версия `ANTHROPIC_VERSION = '2023-06-01'`.
- Computer-use: `ANTHROPIC_COMPUTER_BETA = 'computer-use-2025-01-24'`, тип `computer_20250124`.
- Модель по умолчанию `ANTHROPIC_DEFAULT_MODEL = 'claude-sonnet-4-20250514'`.
- Маппинг: `normalizeFinishReason`, `mapTools`, `mapToolChoice`, `toAnthropicMessages`, `parseAnthropicResponse`, `extractToolCalls`, `extractText`.

## Реализация

- `src/llm/anthropic/anthropic-adapter.ts`.

## Связи

- Зонтик — [Компонент: адаптеры провайдеров LLM](./comp-llm-adapters.md); родственный computer-use адаптер — [Компонент: адаптер Gemini Computer Use](./comp-adapter-gemini-computer.md).
- Панели: [Провайдеры и маршрутизация](./providers.md), [Панель: Провайдеры и ключи](./panel-providers.md).

## Проверка работоспособности

- Тест: `src/llm/anthropic/anthropic-adapter.test.ts`.

## Состояние

- Реализовано; покрыто тестом.

---

## Связанные материалы

- [Компонент: адаптеры провайдеров LLM](./comp-llm-adapters.md)
- [Компонент: LLM-конвейер и декораторы](./comp-llm-pipeline.md)
- [Компонент: адаптер Gemini Computer Use](./comp-adapter-gemini-computer.md)
- [Провайдеры и маршрутизация](./providers.md)
- [Панель: Провайдеры и ключи](./panel-providers.md)

[← Все материалы](./README.md)
