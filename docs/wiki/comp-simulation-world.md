<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: симуляция, компьютер и parity

> Раздел: **Компоненты и сервисы** · Статус: documented · Теги: компоненты, симуляция, компьютер, parity

Источники: `src/kernel/services/simulation/simulation-engine-service.ts`, `src/kernel/services/simulation/world-state-service.ts`, `src/kernel/services/computer/computer-use-loop-service.ts`, `src/kernel/services/computer/sidecar-computer-executor.ts`, `src/kernel/services/parity/knowledge-service.ts`, `src/kernel/services/parity/tool-runner-service.ts`

## Назначение

Прогонять «мир» с агентами (симуляция), давать агенту управлять компьютером и проверять паритет с внешними рантаймами.

## Возможности

- Симуляция: движок (`SimulationEngineService`), состояние мира (`WorldStateService`), адаптер действий агента (`AgentActAdapterService`).
- Computer-use: цикл управления (`ComputerUseLoopService`), исполнитель-сайдкар (`SidecarComputerExecutor`).
- Parity: знание, запуск инструментов и обучение (`KnowledgeService`, `ToolRunnerService`, `TrainingService`, `DefaultEmbeddingService`).

## Реализация

- `simulation/`: `simulation-engine-service.ts`, `world-state-service.ts`, `agent-act-adapter-service.ts`.
- `computer/`: `computer-use-loop-service.ts`, `sidecar-computer-executor.ts`.
- `parity/`: `knowledge-service.ts`, `tool-runner-service.ts`, `training-service.ts`, `default-embedding-service.ts`.

## Связи

- Инструменты/песочница — [Компонент: инструменты, MCP и sandbox](./comp-tools-mcp.md); дебаты/фронтир — [Компонент: рантайм дебатов](./comp-debate-runtime.md), [Компонент: фронтир и разнообразие агентов](./comp-frontier-diversity.md).
- Панели: [Панели: Симуляция и контрфакты](./panel-simulation.md), [Панель: Песочница сравнения моделей](./panel-playground.md), [Панель: Хранители (Guardians)](./panel-guardians.md), [Панели: Инфраструктура и платформа](./panel-infra-meta.md).

## Проверка работоспособности

- Ручная: запустить симуляцию, дать агенту действие в мире.
- В каталогах `simulation/`, `computer/`, `parity/` выделенных тестов не найдено.

## Состояние

- Реализовано; подтверждено чтением кода, без автотестов.

---

## Связанные материалы

- [Панели: Симуляция и контрфакты](./panel-simulation.md)
- [Панель: Песочница сравнения моделей](./panel-playground.md)
- [Панель: Хранители (Guardians)](./panel-guardians.md)
- [Панели: Инфраструктура и платформа](./panel-infra-meta.md)
- [Компонент: инструменты, MCP и sandbox](./comp-tools-mcp.md)

[← Все материалы](./README.md)
