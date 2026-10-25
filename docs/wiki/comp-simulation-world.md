<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: симуляция, компьютер и parity

> Раздел: **Компоненты и сервисы** · Статус: verified · Теги: компоненты, симуляция, компьютер, parity

Источники: `src/kernel/services/simulation/simulation-engine-service.ts`, `src/kernel/services/simulation/world-state-service.ts`, `src/kernel/services/computer/computer-use-loop-service.ts`, `src/kernel/services/computer/sidecar-computer-executor.ts`, `src/kernel/services/parity/knowledge-service.ts`, `src/kernel/services/parity/tool-runner-service.ts`

## Назначение

Прогонять «мир» с агентами (симуляция), давать агенту управлять компьютером и проверять паритет с внешними рантаймами.

## Возможности

- Симуляция: движок (`SimulationEngineService`), состояние мира (`WorldStateService`), адаптер действий агента (`AgentActAdapterService`).
- Computer-use: цикл управления (`ComputerUseLoopService`), исполнитель-сайдкар (`SidecarComputerExecutor`).
- Parity: знание, запуск инструментов и обучение (`KnowledgeService`, `ToolRunnerService`, `TrainingService`, `DefaultEmbeddingService`).

## Реализация

- `simulation/`: `simulation-engine-service.ts` (`SimulationEngineService`, ~125 ст.: параллельные тики `Promise.all`, run/step), `world-state-service.ts` (`WorldStateService`, ~140 ст.: миры/комнаты/отношения/глобальные часы, moveAgent/tick, валидация координат 0..1000), `agent-act-adapter-service.ts` (`AgentActAdapterService`, ~93 ст.: IAgentActPort через IAgentFactory).
- `computer/`: `computer-use-loop-service.ts`, `sidecar-computer-executor.ts`.
- `parity/`: `knowledge-service.ts`, `tool-runner-service.ts`, `training-service.ts`, `default-embedding-service.ts`.
- **Важно:** по умолчанию движок симуляции использует `StubActPort` (детерминированный хэш, без LLM); реальный адаптер подключается вручную через `setActPort` (в UI). Дополнительно `SimulationService` (frontier) — детерминированные симуляции «социумов» без LLM.

## Связи

- Инструменты/песочница — [Компонент: инструменты, MCP и sandbox](./comp-tools-mcp.md); дебаты/фронтир — [Компонент: рантайм дебатов](./comp-debate-runtime.md), [Компонент: фронтир и разнообразие агентов](./comp-frontier-diversity.md).
- Панели: [Панели: Симуляция и контрфакты](./panel-simulation.md), [Панель: Песочница сравнения моделей](./panel-playground.md), [Панель: Хранители (Guardians)](./panel-guardians.md), [Панели: Инфраструктура и платформа](./panel-infra-meta.md).

## Проверка работоспособности

- Тесты: `simulation/simulation-engine-service.test.ts` (parallel step, run N ticks, custom actPort), `world-state-service.test.ts` (create/get/tick/moveAgent/валидация), `agent-act-adapter-service.test.ts` (stub fallback, парсинг move/talk), `computer/computer-use-loop-service.test.ts`, `parity/tool-runner-service.test.ts`.
- Ручная: запустить симуляцию, дать агенту действие в мире.

## Состояние

- Реализовано; симуляция, computer-use и parity покрыты тестами.
- **Риск (подробно — `docs/audits/cognitive-simulation-audit.md`):** без реального LLM-агента движок молча работает на `StubActPort`/stub fallback («PROVIDER-PENDING»).

---

## Связанные материалы

- [Панели: Симуляция и контрфакты](./panel-simulation.md)
- [Панель: Песочница сравнения моделей](./panel-playground.md)
- [Панель: Хранители (Guardians)](./panel-guardians.md)
- [Панели: Инфраструктура и платформа](./panel-infra-meta.md)
- [Компонент: инструменты, MCP и sandbox](./comp-tools-mcp.md)

[← Все материалы](./README.md)
