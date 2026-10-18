<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: лаборатория вариантов (rivals)

> Раздел: **Компоненты и сервисы** · Статус: documented · Теги: компоненты, rivals, эксперименты, интеграции

Источники: `src/kernel/services/rivals/planner-service.ts`, `src/kernel/services/rivals2/integrations-service.ts`, `src/kernel/services/rivals2/aider-service.ts`, `src/kernel/services/rivals2/swe-service.ts`, `src/kernel/services/rivals3/codeplan-service.ts`

## Назначение

Набор «конкурентов» — альтернативных реализаций и внешних агентов (Aider, SWE-agent, React-режимы и т.п.), с которыми систему сравнивают и у которых заимствуют ходы.

## Возможности

- Планировщики и адаптеры внешних инструментов, режимы, память с областью видимости, загрузчики.
- Серия каталогов `rivals/`, `rivals2..20/` — по подсистемам (интеграции, код-план, персонажи, RAG и др.).

## Реализация

- `rivals/`: `planner-service.ts` (`PlannerService`).
- `rivals2/`: `integrations-service.ts` (`IntegrationsService`), `aider-service.ts`, `swe-service.ts`, `react-service.ts`, `rag-service.ts`, `character-service.ts`, `modes-service.ts`, `loader-service.ts`, `runtime-service.ts`, `scopedmem-service.ts`.
- `rivals3/`: `codeplan-service.ts`; далее до `rivals20/` — отдельные тематические сервисы.

## Связи

- Внешние интеграции — [Компонент: интеграции и интероперабельность](./comp-integrations-interop.md); A/B и качество — [Панель: A/B-тест промптов](./panel-ab-testing.md), [Панель: Влияние техник](./panel-quality-impact.md).
- Панели: [Панели: Агенты — маркетплейс и протокол](./panel-agents-market.md), [Панель: Датасеты оценки](./panel-eval.md), [Панели: Аналитика, затраты и ключи](./panel-analytics.md).

## Проверка работоспособности

- Ручная: сравнить результаты «конкурента» и основного пути в Evaluation/Market.
- В каталогах серии `rivals*` выделенных тестов не найдено.

## Состояние

- Реализовано как исследовательская лаборатория; подтверждено чтением кода, без автотестов.

---

## Связанные материалы

- [Панели: Агенты — маркетплейс и протокол](./panel-agents-market.md)
- [Панель: A/B-тест промптов](./panel-ab-testing.md)
- [Панель: Датасеты оценки](./panel-eval.md)
- [Компонент: интеграции и интероперабельность](./comp-integrations-interop.md)
- [Панели: Аналитика, затраты и ключи](./panel-analytics.md)

[← Все материалы](./README.md)
