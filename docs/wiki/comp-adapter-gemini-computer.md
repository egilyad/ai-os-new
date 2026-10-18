<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: адаптер Gemini Computer Use

> Раздел: **Компоненты и сервисы** · Статус: verified · Теги: компоненты, llm, адаптер, gemini, computer-use

Источники: `src/llm/gemini-computer/gemini-computer-adapter.ts`

## Назначение

Давать моделям управлять «компьютером»: действия, шаги и результаты вызовов — через Gemini Computer Use.

## Возможности

- `GeminiComputerAdapter` (`BaseLLMAdapter`); база `GEMINI_COMPUTER_API_BASE`, модель по умолчанию `GEMINI_COMPUTER_DEFAULT_MODEL = 'gemini-3.5-flash'`.
- Нормализация действий: `mapGeminiActionName`, `denormalizeArgs`.
- Сборка входа: `buildFirstInput`, `buildFunctionResults`, `extractSteps`.

## Реализация

- `src/llm/gemini-computer/gemini-computer-adapter.ts`.

## Связи

- Зонтик — [Компонент: адаптеры провайдеров LLM](./comp-llm-adapters.md); родственный — [Компонент: адаптер Gemini](./comp-adapter-gemini.md); сценарии computer-use — [Компонент: симуляция, компьютер и parity](./comp-simulation-world.md).
- Панель: [Панель: Провайдеры и ключи](./panel-providers.md).

## Проверка работоспособности

- Тест: `src/llm/gemini-computer/gemini-computer-adapter.test.ts`.

## Состояние

- Реализовано; покрыто тестом.

---

## Связанные материалы

- [Компонент: адаптеры провайдеров LLM](./comp-llm-adapters.md)
- [Компонент: адаптер Gemini](./comp-adapter-gemini.md)
- [Компонент: адаптер Anthropic (Claude)](./comp-adapter-anthropic.md)
- [Компонент: симуляция, компьютер и parity](./comp-simulation-world.md)
- [Панель: Провайдеры и ключи](./panel-providers.md)

[← Все материалы](./README.md)
