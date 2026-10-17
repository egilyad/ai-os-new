<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Панели: Связи, происхождение, очередь

> Раздел: **Панели** · Статус: verified · Теги: панель, связи, происхождение, очередь, инструкция

Источники: `src/i18n/translations/en/analytics.ts`, `src/components/JunctionPanel/JunctionPanel.tsx`, `src/components/ProvenancePanel/ProvenancePanel.tsx`, `src/components/InsightBusPanel/InsightBusPanel.tsx`

## Назначение

Связи между знаниями, происхождение данных и очередь выполнения. Ключи `junctions.*`, `provenance.*`.

## Junction Engine

Движок связей: всего связей, поиск новых (detect), подтверждение (verified); источники связей — кристаллы и дебаты. Есть сид-демо.

## Provenance Graph

Граф происхождения: откуда пришли данные и как они связаны.

## Insight Bus и очередь

`Insight Bus` — шина инсайтов (метки `nav.*`), `Run Queue` — очередь прогонов.

## Где менять

Компоненты: `JunctionPanel`, `ProvenancePanel`, `InsightBusPanel`, `RunQueuePanel`. Кристаллы — [Панели: Линзы и кристаллы](./panel-lenses-crystals.md).

---

## Связанные материалы

- [Панели: Линзы и кристаллы](./panel-lenses-crystals.md)
- [Панель: Генератор знаний](./panel-knowledge-generator.md)
- [Панель: Задачи и пайплайны](./panel-tasks.md)

[← Все материалы](./README.md)
