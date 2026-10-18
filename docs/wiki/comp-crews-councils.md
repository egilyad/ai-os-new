<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: экипажи и совет

> Раздел: **Компоненты и сервисы** · Статус: documented · Теги: компоненты, экипажи, совет, мультиагентность

Источники: `src/kernel/services/crew/crew-service.ts`, `src/kernel/services/crew/agent-forge-service.ts`, `src/kernel/services/council/council-service.ts`, `src/kernel/services/council/council-service-facade.ts`, `src/kernel/services/council/council-aware-evaluator.ts`, `src/kernel/services/council/weighted-judge-evaluator.ts`

## Назначение

Собирать группы агентов (экипажи) и «совет» судей, которые сообща решают задачу и оценивают результаты.

## Возможности

- Экипажи: состав, шаблоны, кузница агентов (`AgentForgeService`).
- Совет: фасад `CouncilServiceFacade` над `CouncilService`, оценка с учётом совета (`CouncilAwareEvaluator`), взвешенное голосование судей (`WeightedJudgeEvaluator`), миграция советов.

## Реализация

- `crew/`: `crew-service.ts` (`CrewService`), `agent-forge-service.ts` (`AgentForgeService`), `crew-templates.ts`, демо-сид.
- `council/`: `council-service.ts`, `council-service-facade.ts`, `council-aware-evaluator.ts`, `weighted-judge-evaluator.ts`, `council-migration-service.ts`, `council-lenses.ts`, `council-to-debate-mapper.ts`.

## Связи

- Роли агентов — [Компонент: агенты, роли и навыки](./comp-agents-roles-skills.md); вызовы LLM — [Компонент: LLM-мост (адаптеры crews/council/graph/frontier)](./comp-llm-bridge.md); дебаты — [Компонент: рантайм дебатов](./comp-debate-runtime.md).
- Панели: [Панель: Режиссёр](./panel-director.md), [Панель: Синтез мнений](./panel-synthesis.md), [Панель: Флот (Fleet Console)](./panel-fleet.md); состояние — [Компонент: слой состояния (Zustand-сторы)](./comp-state-stores.md).

## Проверка работоспособности

- Тесты: `crew/crews-demo-seed.test.ts`, `council/council-demo-seed.test.ts` (демо-уровень).
- Ручная: собрать экипаж/совет в Director и прогнать задачу.

## Состояние

- Реализовано; подтверждено кодом и демо-тестами.

---

## Связанные материалы

- [Панель: Режиссёр](./panel-director.md)
- [Панель: Синтез мнений](./panel-synthesis.md)
- [Панель: Флот (Fleet Console)](./panel-fleet.md)
- [Компонент: агенты, роли и навыки](./comp-agents-roles-skills.md)
- [Компонент: LLM-мост (адаптеры crews/council/graph/frontier)](./comp-llm-bridge.md)

[← Все материалы](./README.md)
