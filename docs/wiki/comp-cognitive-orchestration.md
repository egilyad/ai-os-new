<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: когнитивные трассы и оркестрация топологий

> Раздел: **Компоненты и сервисы** · Статус: documented · Теги: компоненты, когнитивные, топологии, оркестрация

Источники: `src/kernel/services/cognitive-service.ts`, `src/kernel/services/orchestration-service.ts`, `src/kernel/services/cognitive-intelligence/cognitive-intelligence-service.ts`

## Назначение

Исполнять когнитивные процессы и топологии: прогонять узлы (шаги) через цепочки провайдеров, фиксировать решения и монтировать графы (DAG) рабочих процессов.

## Возможности

- Когнитивные шаги: активный/завершённый, запись решения, вычисление confidence/score.
- Оркестрация: монтирование/управление топологиями, исполнение узлов, enable/disable, статистика.
- Когнитивная разведка: анализ метрик (диагностика, давление, what-if) в подкаталоге `cognitive-intelligence/`.

## Реализация

- `CognitiveService` (`cognitive-service.ts`): события `cognitive:trace:updated`, `cognitive:step:active`, `cognitive:step:completed`, `cognitive:decision:made`, а также `request:incoming/completed`.
- `OrchestrationService` (`orchestration-service.ts`): исполнение DAG-топологий, `system:topology:mounted`.
- `cognitive-intelligence/cognitive-intelligence-service.ts` + `cognitive-diagnostics.ts`, `cognitive-metrics.ts`, `cognitive-pressure.ts`, `cognitive-whatif.ts`.

## Связи

- Узлы исполняются через провайдеров ([Компонент: роутинг и провайдеры](./comp-routing.md)).
- Роли агентов, исполняющие шаги — [Компонент: агенты, роли и навыки](./comp-agents-roles-skills.md).
- Панели: [Панель: Обзор (Dashboard)](./panel-dashboard.md), [Панель: База знаний (RAG)](./panel-knowledge.md).

## Проверка работоспособности

- Ручная: запустить топологию в панели и проследить `cognitive:step:*` в ленте событий.
- **Тестов нет:** для `cognitive-service.ts` и `orchestration-service.ts` автотесты не найдены.

## Состояние

- Реализовано; подтверждено только чтением кода (тестов нет).

---

## Связанные материалы

- [Архитектура и связи](./architecture.md)
- [Панель: Обзор (Dashboard)](./panel-dashboard.md)
- [Панель: База знаний (RAG)](./panel-knowledge.md)
- [Компонент: роутинг и провайдеры](./comp-routing.md)
- [Компонент: агенты, роли и навыки](./comp-agents-roles-skills.md)

[← Все материалы](./README.md)
