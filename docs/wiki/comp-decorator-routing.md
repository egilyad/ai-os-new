<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: декораторы маршрутизации LLM

> Раздел: **Компоненты и сервисы** · Статус: verified · Теги: компоненты, llm, декораторы, маршрутизация, canary

Источники: `src/llm/decorators/semantic-router.ts`, `src/llm/decorators/canary-router.ts`, `src/llm/decorators/priority-queue.ts`, `src/llm/decorators/logging-decorator.ts`

## Назначение

Выбирать, куда и в каком порядке отправлять запрос, и логировать это.

## Возможности

- `SemanticRouterDecorator` — маршрут по смыслу запроса.
- `CanaryRouterDecorator` — канареечное распределение трафика.
- `PriorityQueueDecorator` — приоритеты запросов.
- `LoggingDecorator` — наблюдаемость вызовов.

## Реализация

- `src/llm/decorators/semantic-router.ts`, `canary-router.ts`, `priority-queue.ts`, `logging-decorator.ts`.

## Связи

- Конвейер — [Компонент: LLM-конвейер и декораторы](./comp-llm-pipeline.md); маршрут — [Компонент: роутинг и провайдеры](./comp-routing.md); наблюдаемость — [Компонент: наблюдаемость (метрики, трейсы, мониторинг)](./comp-observability.md).

## Проверка работоспособности

- Тесты: `semantic-router.test.ts`, `canary-router.test.ts`, `priority-queue.test.ts`, `logging-decorator.test.ts`.

## Состояние

- Реализовано; покрыто тестами.

---

## Связанные материалы

- [Компонент: LLM-конвейер и декораторы](./comp-llm-pipeline.md)
- [Компонент: роутинг и провайдеры](./comp-routing.md)
- [Компонент: адаптеры провайдеров LLM](./comp-llm-adapters.md)
- [Компонент: рантайм провайдеров](./comp-provider-runtime.md)
- [Компонент: наблюдаемость (метрики, трейсы, мониторинг)](./comp-observability.md)

[← Все материалы](./README.md)
