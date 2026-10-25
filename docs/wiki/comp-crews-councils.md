<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: экипажи и совет

> Раздел: **Компоненты и сервисы** · Статус: verified · Теги: компоненты, экипажи, совет, мультиагентность, линзы

Источники: `src/kernel/services/crew/crew-service.ts`, `src/kernel/services/crew/agent-forge-service.ts`, `src/kernel/services/council/council-service.ts`, `src/kernel/services/council/council-service-facade.ts`, `src/kernel/services/council/council-aware-evaluator.ts`, `src/kernel/services/council/weighted-judge-evaluator.ts`, `src/kernel/services/council/council-lenses.ts`, `src/kernel/services/council/council-to-debate-mapper.ts`

## Назначение

Собирать группы агентов (экипажи) и «совет» судей, которые сообща решают задачу и оценивают результаты.

## Возможности

- Экипажи (CrewAI-парадигма): роли+задачи+процесс (sequential/hierarchical/consensual); кузница агентов (`AgentForgeService`).
- Совет: фасад `CouncilServiceFacade` над `CouncilService`, линзы/полярности, оценка с учётом совета (`CouncilAwareEvaluator`), взвешенное голосование судей (`WeightedJudgeEvaluator`).

## Реализация

- `crew/`: `crew-service.ts` (`CrewService`, процессы 360-452; **ИИ-исполнитель по умолчанию — `EchoExecutor`** (без LLM), реальный `LlmCrewExecutor` подключается при наличии `llmClientService`), `agent-forge-service.ts`, `crew-templates.ts`.
- `council/`: `council-service.ts` (фазы proposal→факты→дебаты→консенсус), `council-service-facade.ts`, `council-aware-evaluator.ts`, `weighted-judge-evaluator.ts`, `council-lenses.ts` (14 линз, 4 пары полярностей), `council-to-debate-mapper.ts` (чистый маппер; вызывается в фасаде при createSession), `council-migration-service.ts`.
- Совет вызывает LLM через порт `ICouncilLlmPort.draftStance/judgeRound` (`LlmCouncilPort`).

## Связи

- Роли агентов — [Компонент: агенты, роли и навыки](./comp-agents-roles-skills.md); вызовы LLM — [Компонент: LLM-мост (адаптеры crews/council/graph/frontier)](./comp-llm-bridge.md); дебаты — [Компонент: рантайм дебатов](./comp-debate-runtime.md) (mapper/оценка).
- Панели: [Панель: Режиссёр](./panel-director.md), [Панель: Синтез мнений](./panel-synthesis.md), [Панель: Флот (Fleet Console)](./panel-fleet.md); состояние — [Компонент: слой состояния (Zustand-сторы)](./comp-state-stores.md).

## Проверка работоспособности

- Тесты: `crew/crews-demo-seed.test.ts`, `council/council-demo-seed.test.ts` (демо-уровень).
- Пробел: нет прямых тестов на `CouncilServiceFacade`, `WeightedJudgeEvaluator`, `CouncilAwareEvaluator`, `council-to-debate-mapper`, `LlmCrewExecutor`, сборку `buildParticipantPrompt`.

## Состояние

- Реализовано; подтверждено кодом и демо-тестами (проверка 2026-10).
- **Риски:** двойная таллировка совета (старая `CouncilService` vs canonical `WeightedJudgeEvaluator` через фасад) — риск расхождения; дефолт `EchoExecutor` в crews без провайдера («работают», но не думают); обновления дебатов не проталкиваются обратно из фасада. Подробно — `docs/audits/agents-council-audit.md`.

---

## Связанные материалы

- [Панель: Режиссёр](./panel-director.md)
- [Панель: Синтез мнений](./panel-synthesis.md)
- [Панель: Флот (Fleet Console)](./panel-fleet.md)
- [Компонент: агенты, роли и навыки](./comp-agents-roles-skills.md)
- [Компонент: LLM-мост (адаптеры crews/council/graph/frontier)](./comp-llm-bridge.md)
- [Компонент: рантайм дебатов](./comp-debate-runtime.md)

[← Все материалы](./README.md)
