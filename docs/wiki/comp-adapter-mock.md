<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: MockAdapter

> Раздел: **Компоненты и сервисы** · Статус: documented · Теги: компоненты, llm, адаптер, mock, тесты

Источники: `src/llm/mock/mock-adapter.ts`

## Назначение

Давать детерминированные ответы без сети — для тестов, офлайн-режима и демо.

## Возможности

- `MockAdapter` — **реализует `LLMProviderAdapter` напрямую** (НЕ наследует `BaseLLMAdapter`): журнали echo (по умолчанию, `"{role} {content}"`), preset (фикс. строка), lorem (3×Lorem ipsum), error (бросает `LLMError(500)`).
- Симулирует латентность (`simulateLatencyMs`), токены, health; псевдо-streaming по словам с проверкой `signal.aborted`.
- Дефолтные модели: `mock-model-v1/v2`.

## Реализация

- `src/llm/mock/mock-adapter.ts`.

## Связи

- Зонтик — [Компонент: адаптеры провайдеров LLM](./comp-llm-adapters.md); родственный — [Компонент: адаптер Cloudflare](./comp-adapter-cloudflare.md).
- Для разработчиков — [Разработчикам: структура и ворота](./for-developers.md), [Каталог компонентов OS](./dev-component-catalog.md).

## Проверка работоспособности

- Отдельного `mock-adapter.test.ts` нет; используется косвенно в `adapter-factory.test.ts` (как mock-провайдер).
- Ручная: выбрать Mock в Providers — ответы детерминированные, без сети.

## Состояние

- Реализовано; подтверждено чтением кода.
- **Замечание:** т.к. MockAdapter не наследует `BaseLLMAdapter`, он не получает общую обёртку ошибок (`LLMError`/AbortError) — двойной источник истины для `sendMessage`/`streamMessage`.

---

## Связанные материалы

- [Компонент: адаптеры провайдеров LLM](./comp-llm-adapters.md)
- [Компонент: адаптер Cloudflare](./comp-adapter-cloudflare.md)
- [Разработчикам: структура и ворота](./for-developers.md)
- [Каталог компонентов OS](./dev-component-catalog.md)
- [Панель: Провайдеры и ключи](./panel-providers.md)

[← Все материалы](./README.md)
