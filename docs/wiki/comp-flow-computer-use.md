<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Сквозной контур: computer-use

> Раздел: **Компоненты и сервисы** · Статус: verified · Теги: компоненты, контур, computer-use, CUA, песочница, адаптеры

Источники: `src/kernel/services/computer/computer-use-loop-service.ts`, `src/kernel/services/computer/sidecar-computer-executor.ts`, `src/kernel/services/rivals5/computer-service.ts`, `src/llm/anthropic/anthropic-adapter.ts`, `src/llm/gemini-computer/gemini-computer-adapter.ts`, `src/kernel/service-registration/phase71-computer-use-loop.ts`, `src/components/SimulationPanel/SimulationPanel.tsx`, `src/components/AquariumPanel/AquariumPanel.tsx`

## Назначение

Показать computer-use (управление «компьютером» агентом) как **сквозной контур**: от запуска до многошагового цикла «действие → скриншот → действие» — с обязательными подтверждениями и точками обрыва.

## Возможности

- Многошаговый CUA-цикл: **LLM → computer action → screenshot → LLM** (Phase 71, «блок B»).
- Апрув по политике: `BLOCKED` / `REQUIRES_APPROVAL` / `FREE` и лимит ходов по пресету.
- Отдельные адаптеры под формат компьютерных действий (`AnthropicAdapter` tool_use, `GeminiComputerAdapter`).
- Изоляция исполнителя (sidecar) и durable-трасса действий.

## Сквозной поток (по шагам)

1. **Запуск.** UI ([Панели: Симуляция и контрфакты](./panel-simulation.md), AquariumPanel) или агент вызывает `ComputerUseLoopService.requestAndRun(opts)`.
2. **Политика.** `resolveComputerMode(policy)` читает `toolOverrides['computer.use']` / `executeMode`: `BLOCKED` | `REQUIRES_APPROVAL` | `FREE`. При `REQUIRES_APPROVAL` создаётся `ApprovalRequest`, и запуск ждёт подтверждения.
3. **Старт после апрува.** `runApproved` → `claim` → `run(opts)`.
4. **Цикл.** На каждом ходе — `llm.sendMessage` с компьютерным инструментом; ответ возвращает действие, исполняется, публикуется `COMPUTER_ACT` (`computer:act`), затем захват скриншота (лимит ~3.5M символов) и передача обратно модели.
5. **Адаптеры.** Формат вызова зависит от провайдера: `AnthropicAdapter` (tool_use), `GeminiComputerAdapter` ('gemini-computer'); см. [Компонент: адаптеры провайдеров LLM](./comp-llm-adapters.md).
6. **Лимит ходов.** `presetTurnsCap(policy)` — максимум 30, по умолчанию 10, по пресету ([Компонент: политики, секреты и вебхуки](./comp-policy-security.md)).
7. **Трасса.** Действие пишется в durable-трассу через `ToolService.recordExternalExecution`; события `COMPUTER_HANDOFF`, а также `aquarium:screenshot:captured`.

## Обрывы цепочки (что происходит при ошибке)

- **Политика `BLOCKED`.** Цикл не запускается вовсе.
- **`REQUIRES_APPROVAL` без подтверждения.** Запуск не происходит — ждёт `claim`; тайм-аут/отказ оставляет действие невыполненным.
- **Нет адаптера под провайдера.** Вызов модели падает (см. [Сквозной контур: чат](./comp-flow-chat.md) про отказоустойчивость).
- **Лимит ходов/скриншота.** Достигнут `turnsCap` → цикл останавливается; слишком большой скриншот обрезается по лимиту.

## Данные, события, восстановление

- **События:** `COMPUTER_ACT` (`computer:act`), `COMPUTER_HANDOFF` (`computer:handoff`), `aquarium:screenshot:captured`.
- **Трасса:** durable-записи внешних исполнений (`recordExternalExecution`); см. [Компонент: персистентность (Dexie и storage-адаптеры)](./comp-persistence.md).
- **Потребители:** панель Simulation/Aquarium и агенты; [Компонент: симуляция, компьютер и parity](./comp-simulation-world.md).

## Реализация

- Цикл: `src/kernel/services/computer/computer-use-loop-service.ts`.
- Исполнитель (sidecar): `src/kernel/services/computer/sidecar-computer-executor.ts`; сервис-обёртка — `src/kernel/services/rivals5/computer-service.ts`.
- Адаптеры: `src/llm/anthropic/anthropic-adapter.ts`, `src/llm/gemini-computer/gemini-computer-adapter.ts`.
- DI: `src/kernel/service-registration/phase71-computer-use-loop.ts`.

## Связи

- Симуляция и мир — [Компонент: симуляция, компьютер и parity](./comp-simulation-world.md); адаптеры — [Компонент: адаптеры провайдеров LLM](./comp-llm-adapters.md).
- Песочница/способности — [Компонент: каталог инструментов, способности и политики](./comp-tool-capability.md); политики и апрувы — [Компонент: политики, секреты и вебхуки](./comp-policy-security.md); общий цикл инструментов — [Сквозной контур: инструменты и песочница](./comp-flow-tools.md).

## Проверка работоспособности

- Тесты: `src/kernel/service-registration/phase71-computer-use-loop.test.ts`, `src/llm/gemini-computer/gemini-computer-adapter.test.ts`, `src/llm/anthropic/anthropic-adapter.test.ts`, `src/components/SimulationPanel/SimulationPanel.test.tsx`, `src/components/AquariumPanel/AquariumPanel.test.tsx`.

## Состояние

- Подтверждено чтением кода; цикл и адаптеры покрыты тестами; апрув-гейтинг — обязательная часть пути.

---

## Связанные материалы

- [Компонент: симуляция, компьютер и parity](./comp-simulation-world.md)
- [Компонент: адаптеры провайдеров LLM](./comp-llm-adapters.md)
- [Компонент: каталог инструментов, способности и политики](./comp-tool-capability.md)
- [Компонент: политики, секреты и вебхуки](./comp-policy-security.md)
- [Сквозной контур: инструменты и песочница](./comp-flow-tools.md)

[← Все материалы](./README.md)
