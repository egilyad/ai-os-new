<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: когнитивные трассы и оркестрация топологий

> Раздел: **Компоненты и сервисы** · Статус: verified · Теги: компоненты, когнитивные, топологии, оркестрация, метрики

Источники: `src/kernel/services/cognitive-service.ts`, `src/kernel/services/orchestration-service.ts`, `src/kernel/services/cognitive-intelligence/cognitive-intelligence-service.ts`, `src/kernel/services/cognitive-intelligence/cognitive-metrics.ts`, `src/kernel/services/cognitive-intelligence/cognitive-pressure.ts`, `src/kernel/services/cognitive-intelligence/cognitive-diagnostics.ts`, `src/kernel/services/cognitive-intelligence/cognitive-whatif.ts`

## Назначение

Исполнять когнитивные процессы и топологии: прогонять узлы (шаги) через цепочки провайдеров, фиксировать решения и монтировать графы (DAG) рабочих процессов.

## Возможности

- Когнитивные шаги: активный/завершённый, запись решения, вычисление confidence/score.
- Оркестрация: монтирование/управление топологиями, исполнение узлов, enable/disable, статистика.
- Когнитивная разведка: анализ метрик (диагностика, давление, what-if) в подкаталоге `cognitive-intelligence/`.

## Реализация

- `CognitiveService` (`cognitive-service.ts`, ~626 ст.): слушает `SEND_MESSAGE`/cognitive-события, `executeAgentNode` (buildPrompt → evaluateAlternatives → makeDecision → executeWithFallback), жёсткие OOM-лимиты (MAX_TRACES=30, MAX_STEPS=20, buffer 8k, throttle 500 мс).
- `OrchestrationService` (`orchestration-service.ts`, ~700 ст.): обход топологии (router/agent/guardrail/tool узлы), валидация, параллельные ветки батчами по 3 (`PARALLEL_LIMIT=3`), rate-limit, lifecycle.
- `cognitive-intelligence/cognitive-intelligence-service.ts` + `cognitive-metrics.ts` (debateQuality/сontradictionDensity/consensusConfidence/…), `cognitive-pressure.ts` (complexity 0.35 + contention 0.25 + memoryPressure 0.25 + …), `cognitive-diagnostics.ts` (issue-типы, health), `cognitive-whatif.ts` (simulateTopologyChange/ParticipantChange).
- **Важно:** когнитивная разведка питается только событиями **дебатов** (не памяти).

## Связи

- Узлы исполняются через провайдеров ([Компонент: роутинг и провайдеры](./comp-routing.md)).
- Роли агентов, исполняющие шаги — [Компонент: агенты, роли и навыки](./comp-agents-roles-skills.md).
- Данные для метрик/давления приходят из [Компонент: рантайм дебатов](./comp-debate-runtime.md).
- Панели: [Панель: Обзор (Dashboard)](./panel-dashboard.md), [Панель: База знаний (RAG)](./panel-knowledge.md).

## Проверка работоспособности

- Ручная: запустить топологию в панели и проследить `cognitive:step:*` в ленте событий.
- **Пробел:** нет unit-тестов на `CognitiveService`, `OrchestrationService`, `cognitive-intelligence/*`.

## Состояние

- Реализовано; подтверждено чтением кода (тестов на ядро нет).
- **Риски (подробно — `docs/audits/cognitive-simulation-audit.md`):** `makeDecision` всегда возвращает `alts[0]` (селекция фактически в routerService); метрики считаются по последнему окну 8k (могут занижаться).

---

## Связанные материалы

- [Архитектура и связи](./architecture.md)
- [Панель: Обзор (Dashboard)](./panel-dashboard.md)
- [Панель: База знаний (RAG)](./panel-knowledge.md)
- [Компонент: роутинг и провайдеры](./comp-routing.md)
- [Компонент: агенты, роли и навыки](./comp-agents-roles-skills.md)
- [Компонент: рантайм дебатов](./comp-debate-runtime.md)

[← Все материалы](./README.md)
