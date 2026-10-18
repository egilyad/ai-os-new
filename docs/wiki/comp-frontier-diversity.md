<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: фронтир и разнообразие агентов

> Раздел: **Компоненты и сервисы** · Статус: documented · Теги: компоненты, фронтир, разнообразие, эксперименты

Источники: `src/kernel/services/frontier/eval-service.ts`, `src/kernel/services/frontier/frontier-ops-service.ts`, `src/kernel/services/frontier/simulation-service.ts`, `src/kernel/services/frontier/capability-matrix.ts`, `src/kernel/services/agent-diversity/diversity-scorer.ts`, `src/kernel/services/agent-diversity/clustering.ts`

## Назначение

Искать «фронтир» — лучшие конфигурации агентов — и измерять разнообразие/влияние участников, чтобы не вырождаться в однообразие.

## Возможности

- Фронтир: оценка (`EvalService`), операции (`FrontierOpsService`, `capability-matrix`), симуляция (`SimulationService`).
- Разнообразие: скоринг (`DiversityScorer`), кластеризация (`clustering.ts`), семантическая дистанция (`semantic-distance.ts`), отслеживание влияния (`influence-tracker.ts`), паттерны рассуждений (`reasoning-patterns.ts`).

## Реализация

- `frontier/`: `eval-service.ts`, `frontier-ops-service.ts`, `simulation-service.ts`, `capability-matrix.ts`, демо-сид.
- `agent-diversity/`: `diversity-scorer.ts`, `clustering.ts`, `semantic-distance.ts`, `influence-tracker.ts`, `reasoning-patterns.ts`, `index.ts`, `types.ts`.

## Связи

- Оценка/рейтинг — [Компонент: оценка и рейтинг (eval, elo)](./comp-eval-elo.md); симуляция — [Компонент: симуляция, компьютер и parity](./comp-simulation-world.md); агенты — [Компонент: агенты, роли и навыки](./comp-agents-roles-skills.md).
- Панели: [Панель: Датасеты оценки](./panel-eval.md), [Панели: Симуляция и контрфакты](./panel-simulation.md), [Панели: Аналитика, затраты и ключи](./panel-analytics.md), [Панель: Флот (Fleet Console)](./panel-fleet.md).

## Проверка работоспособности

- Ручная: запустить эксперимент фронтира и посмотреть распределение вариантов.
- В каталогах `frontier/` и `agent-diversity/` выделенных тестов не найдено.

## Состояние

- Реализовано; подтверждено чтением кода, без автотестов.

---

## Связанные материалы

- [Панель: Датасеты оценки](./panel-eval.md)
- [Панели: Симуляция и контрфакты](./panel-simulation.md)
- [Панели: Аналитика, затраты и ключи](./panel-analytics.md)
- [Панель: Флот (Fleet Console)](./panel-fleet.md)
- [Компонент: оценка и рейтинг (eval, elo)](./comp-eval-elo.md)

[← Все материалы](./README.md)
