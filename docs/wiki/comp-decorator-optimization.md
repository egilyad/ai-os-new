<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: декораторы экономии LLM

> Раздел: **Компоненты и сервисы** · Статус: verified · Теги: компоненты, llm, декораторы, экономия, кэш

Источники: `src/llm/decorators/cost-manager.ts`, `src/llm/decorators/compress-route.ts`, `src/llm/decorators/cache-decorator.ts`

## Назначение

Снижать стоимость и объём трафика, не теряя качества.

## Возможности

- `CostManagerDecorator` — учёт/контроль расходов.
- `CompressRouteDecorator` — сжатие промптов перед отправкой.
- `CacheDecorator` — кэширование ответов.

## Реализация

- `src/llm/decorators/cost-manager.ts`, `compress-route.ts`, `cache-decorator.ts`.
- Сжатие опирается на `src/llm/utils/compression.ts` (`compressText`, `compressMessages`, `getCompressionStats`).

## Связи

- Конвейер — [Компонент: LLM-конвейер и декораторы](./comp-llm-pipeline.md); бюджет — [Компонент: бюджет, цены и расход](./comp-budget-pricing.md); адаптеры — [Компонент: адаптеры провайдеров LLM](./comp-llm-adapters.md).

## Проверка работоспособности

- Тесты: `cost-manager.test.ts`, `compress-route.test.ts`, `cache-decorator.test.ts`.

## Состояние

- Реализовано; покрыто тестами.

---

## Связанные материалы

- [Компонент: LLM-конвейер и декораторы](./comp-llm-pipeline.md)
- [Компонент: бюджет, цены и расход](./comp-budget-pricing.md)
- [Компонент: адаптеры провайдеров LLM](./comp-llm-adapters.md)
- [Компонент: рантайм провайдеров](./comp-provider-runtime.md)
- [Разработчикам: структура и ворота](./for-developers.md)

[← Все материалы](./README.md)
