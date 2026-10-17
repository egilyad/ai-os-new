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

---

## Связи с кодом (авто)

Цепочка «панель → маршрут → компонент → тесты» собрана из реестра маршрутов.

- Панель `junctions` → маршрут `/junctions`
  - Компонент: `src/components/JunctionPanel/JunctionPanel`
  - Тесты: `src/components/JunctionPanel/JunctionPanel.test.tsx`
- Панель `run-queue` → маршрут `/run-queue`
  - Компонент: `src/components/RunQueuePanel/RunQueuePanel`
  - Тесты: `src/components/RunQueuePanel/RunQueuePanel.test.tsx`
- Панель `insight-bus` → маршрут `/insight-bus`
  - Компонент: `src/components/InsightBusPanel/InsightBusPanel`
  - Тесты: `src/components/InsightBusPanel/InsightBusPanel.test.tsx`
- Панель `provenance` → маршрут `/provenance`
  - Компонент: `src/components/ProvenancePanel/ProvenancePanel`
  - Тесты: `src/components/ProvenancePanel/ProvenancePanel.test.tsx`

См. также: [Каталог панелей](./panels-catalog.md) · [Каталог компонентов OS](./dev-component-catalog.md).

[← Все материалы](./README.md)
