<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Сквозной контур: инструменты и песочница

> Раздел: **Компоненты и сервисы** · Статус: verified · Теги: компоненты, контур, инструменты, tool-calling, песочница, MCP

Источники: `src/components/ToolsPanel/ToolsPanel.tsx`, `src/kernel/services/parity/tool-runner-service.ts`, `src/kernel/services/tool-executor.ts`, `src/kernel/services/ops/tool-governance-service.ts`, `src/kernel/services/ops/sandbox-broker-service.ts`, `src/kernel/services/sandbox/code-sandbox-service.ts`, `src/kernel/workers/sandbox.worker.ts`, `src/kernel/workers/sandbox-interpreter.ts`, `src/kernel/services/tool-loop-detector.ts`, `src/kernel/services/tool-repair-service.ts`, `src/kernel/services/mcp-service.ts`, `src/kernel/service-registration/phase58-code-sandbox.ts`

## Назначение

Показать вызов инструментов как **сквозной контур**: от запроса агента/чата до выполнения в песочнице или через MCP — с политиками, защитой от циклов и точками обрыва.

## Возможности

- Цикл tool-calling: модель предлагает вызовы → рантайм исполняет → результаты возвращаются модели.
- Реестр инструментов: `workspace.*`, `http.fetch`, `knowledge.search`, `mcp.call`.
- Управление: политики (ToolGovernance), брокер песочницы (подтверждения), защита от зацикливания и ремонт вызовов.
- Изоляция: код — в Web Worker ([Компонент: каталог инструментов, способности и политики](./comp-tool-capability.md), ADR-002).

## Сквозной поток (по шагам)

1. **UI/агент.** [Панели: Интеграции (MCP, коннекторы, навыки, инструменты, вебхуки)](./panel-integrations.md) → `ToolsPanel.tsx` или агент/чат запускает `ToolRunnerService.runWithTools(prompt, opts)`.
2. **Подготовка.** Системное и пользовательское сообщения, набор `toolDefs` из реестра, лимит раундов (1–5, по умолчанию 3).
3. **Раунд LLM.** `llm.chat(messages, { tools: toolDefs, cacheScope })`; если `toolCalls` пуст — ответ финальный, цикл завершён.
4. **Исполнение вызова.** `callTool(agentId, name, args, link)`:
   - **Гейт политики:** `governance.check(agentId, 'tool:<name>')` ([Компонент: политики, секреты и вебхуки](./comp-policy-security.md));
   - выполнение инструмента (workspace/http/knowledge/MCP);
   - событие `TOOL_EXECUTED` (и на успехе, и на ошибке).
5. **Возврат результата.** Результат (обрезанный ~6000) кладётся в сообщение `role: 'tool'`, цикл продолжается.
6. **MCP.** Инструмент `mcp.call` → `MCPService.callTool(serverId, tool, args)`; серверы — [Компонент: инструменты, MCP и sandbox](./comp-tools-mcp.md), события `mcp:updated`, `mcp:harness:proxy`.
7. **Песочница.** Исполнение кода — `CodeSandboxService` (phase58-code-sandbox.ts) → `runWithTimeout` → `sandbox.worker.ts`/`sandbox-interpreter.ts`; событие `codeexec:sandbox:done`.
8. **Защита.** `ToolLoopDetector` (защита от зацикливания), `ToolRepairService` (ремонт неудачных вызовов), `SandboxBrokerService.approve` (тикеты на доступ).

## Обрывы цепочки (что происходит при ошибке)

- **Политика запрещает.** `governance.check` = false → вызов не исполняется, результат-ошибка уходит модели как `role:'tool'`.
- **Инструмент бросил исключение.** Ошибка ловится и передаётся модели строкой `ERROR: ...` (цикл не падает).
- **Нет MCP-моста.** `mcp.call` бросает «MCP bridge not configured».
- **Сеть.** `http.fetch` блокирует приватные хосты (httpGuard) и обрывается по таймауту 15с (`AbortController`).
- **Зацикливание.** `ToolLoopDetector` сигнализирует о петле; `ToolRepairService` пытается починить вызов.
- **Лимит раундов.** Достигнут `maxRounds` → возвращается последний вывод.

## Данные, события, восстановление

- **События:** `tool:execution:start/success/error`, `tool:executed`, `tool:group`; песочница `codeexec:sandbox:done`, `ops:sandbox`; MCP `mcp:updated`, `mcp:harness:proxy/reconnected`; ремонт вызовов — `ToolRepairService`.
- **Связь с моделями:** вызовы LLM идут через роутер/адаптеры ([Компонент: рантайм провайдеров](./comp-provider-runtime.md)), как в [Сквозной контур: чат](./comp-flow-chat.md).
- **Знания как инструмент:** `knowledge.search` — мост к [Сквозной контур: знания и RAG](./comp-flow-knowledge.md).

## Реализация

- Запуск цикла: `src/kernel/services/parity/tool-runner-service.ts`.
- Исполнитель/реестр: `src/kernel/services/tool-executor.ts`.
- Управление: `ops/tool-governance-service.ts`, `ops/sandbox-broker-service.ts`, `tool-loop-detector.ts`, `tool-repair-service.ts`.
- Песочница: `src/kernel/services/sandbox/code-sandbox-service.ts`, `src/kernel/workers/sandbox.worker.ts`, `sandbox-interpreter.ts`, DI — `phase58-code-sandbox.ts`.
- MCP: `src/kernel/services/mcp-service.ts`.

## Связи

- Инструменты и MCP — [Компонент: инструменты, MCP и sandbox](./comp-tools-mcp.md); способности/песочница — [Компонент: каталог инструментов, способности и политики](./comp-tool-capability.md); политики — [Компонент: политики, секреты и вебхуки](./comp-policy-security.md).
- Чат и знания как потребители — [Сквозной контур: чат](./comp-flow-chat.md), [Сквозной контур: знания и RAG](./comp-flow-knowledge.md).

## Проверка работоспособности

- Тесты: `src/kernel/services/parity/tool-runner-service.test.ts`, `src/kernel/services/tool-executor.test.ts`, `src/kernel/services/sandbox/code-sandbox-service.test.ts`, `src/kernel/workers/sandbox-interpreter.test.ts`, `src/kernel/services/file-toolset.test.ts`, `src/kernel/services/interop/mcp-harness-service.test.ts`, `src/components/ToolsPanel/ToolsPanel.test.tsx`, `src/components/MCPPanel/MCPPanel.test.tsx`.

## Состояние

- Подтверждено чтением кода; цикл вызова, исполнитель, песочница и MCP покрыты тестами.

---

## Связанные материалы

- [Компонент: инструменты, MCP и sandbox](./comp-tools-mcp.md)
- [Компонент: каталог инструментов, способности и политики](./comp-tool-capability.md)
- [Компонент: политики, секреты и вебхуки](./comp-policy-security.md)
- [Сквозной контур: чат](./comp-flow-chat.md)
- [Сквозной контур: знания и RAG](./comp-flow-knowledge.md)

[← Все материалы](./README.md)
