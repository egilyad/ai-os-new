<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: инструменты, MCP и sandbox

> Раздел: **Компоненты и сервисы** · Статус: verified · Теги: компоненты, инструменты, MCP, sandbox

Источники: `src/kernel/services/tool-executor.ts`, `src/kernel/services/mcp-service.ts`, `src/kernel/services/mcp-service.local.test.ts`, `src/kernel/services/memory/memory-mcp-server.ts`, `src/kernel/services/sandbox-service.ts`, `src/kernel/services/tool-executor.test.ts`

## Назначение

Дать агентам и пользователю безопасно вызывать внешние возможности: HTTP-инструменты, внешний код, MCP-серверы — с изоляцией, лимитами и журналом исполнения.

## Возможности

- Регистрация/включение инструментов, выполнение с таймаутом и rate-limit, история исполнений, durable-трейл (вход/выход + связь с агентом).
- MCP: подключение серверов, обнаружение ресурсов/инструментов, JSON-RPC вызовы с ретраями.
- Встроенный MCP-сервер памяти (resources stats/entries, tools search/store/recall/delete/stats/associated) — работает в процессе, без HTTP.
- Sandbox: запуск кода в Web Worker с ограничением доступных инструментов.

## Реализация

- `ToolService` (`tool-executor.ts`, ~870 строк): 10 дефолтных инструментов (`t-search`, `t-code`, `t-web`, `t-mcp`, `t-read-file`, `t-list-files`, `t-summarize`, `t-translate`, `t-web-search`, `t-api-call`). Безопасность: только `https:`, блок private IP (в т.ч. после редиректа), allowlist доменов (`t-web` по умолчанию deny-all), AST-валидация кода через **meriyah** (блок `eval/Function/fetch/import`, `with`, computed-template-доступ), обёртка внешних данных `<external_data>…</external_data>` (защита от prompt injection), per-tool rate-limit (окно 60000 мс). История ≤ `CONFIG.services.toolExecutor.maxHistory ?? 200`. **P-CRIT-4:** нереализованный инструмент бросает `Tool <name> is not implemented`, а не имитирует успех.
- `MCPService` (`mcp-service.ts`): дефолтные серверы `mcp-local-files` (localhost:3001), `mcp-github` (localhost:3002). `localhost` может `http`, остальные — `https`; блок private IP; служебные схемы URI; таймаут `safeFetchTimeoutMs ?? 5000`; ретраи `MAX_RETRIES = 5` с экспоненциальным backoff + jitter; протокол `2025-03-26`; санитизация внешних строк. Локальные (in-process) серверы: `registerLocalServer(id, name, handler)` — JSON-RPC идёт в handler, `memory://` URI, не персистится.
- `MemoryMcpServer` (`services/memory/memory-mcp-server.ts`, phase 72): реализует `initialize`/`resources/*`/`tools/*` над `memoryService` (+ `ltMemoryService` для PPR), подключается к `MCPService` как `mcp-memory`.
- `SandboxService` (`sandbox-service.ts`): worker `src/kernel/workers/sandbox.worker.ts`, до `MAX_TOOL_EXECUTIONS = 10`, только `allowedTools`; **исполнение кода включено только в DEV или при `VITE_SANDBOX_ENABLED === 'true'`**.

## Связи

- Политики ограничивают вызовы ([Компонент: политики, секреты и вебхуки](./comp-policy-security.md)); ключи/секреты — [Компонент: шифрование at-rest (SecurityService)](./comp-security-crypto.md).
- Панели: [Панели: Интеграции (MCP, коннекторы, навыки, инструменты, вебхуки)](./panel-integrations.md) (MCP/инструменты), [Панель: Песочница сравнения моделей](./panel-playground.md).

## Проверка работоспособности

- `tool-executor.test.ts`: fail-loud для нереализованных, deny-all `t-web`, история для unknown/disabled, durable-трейл с персистом и границей 200.
- `mcp-service.local.test.ts`: локальный сервер регистрируется connected, `listTools`/`readResource` идут через handler, unregister. `memory-mcp-server.test.ts`: initialize, tools/resources, namespace-фильтр search, store-санитизация.
- **Тестов нет:** `SandboxService` (у sandbox есть отдельный `code-sandbox-service.test.ts` — это другой класс).

## Состояние

- ToolService и MCP (клиент + встроенный сервер памяти) подтверждены тестами; sandbox — только кодом.

---

## Связанные материалы

- [Компонент: политики, секреты и вебхуки](./comp-policy-security.md)
- [Компонент: шифрование at-rest (SecurityService)](./comp-security-crypto.md)
- [Панели: Интеграции (MCP, коннекторы, навыки, инструменты, вебхуки)](./panel-integrations.md)
- [Панель: Песочница сравнения моделей](./panel-playground.md)

[← Все материалы](./README.md)
