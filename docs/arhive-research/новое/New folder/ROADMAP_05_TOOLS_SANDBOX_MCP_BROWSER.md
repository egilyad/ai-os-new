# Роадмап: Инструменты, песочница, MCP, Browser/Computer-use

> Область кода: `src/kernel/services/` → tools/, tool-pipeline/, tool-loop/, sandbox/,
> browser/, computer/, interop/, capability-trust/; панели ToolsPanel/MCPPanel/ConnectorsPanel и др.

## Что есть сегодня

### Инструменты (`tool/`)

- `ToolService` (~870 стр., 10 дефолтных инструментов): t-search, t-code, t-web, t-mcp,
  t-read-file, t-list-files, t-summarize, t-translate, t-web-search, t-api-call.
- Безопасность: только https:, блок private IP (в т.ч. после редиректа), allowlist
  (`t-web` deny-all), AST-валидация через meriyah (блок eval/Function/fetch/import/with),
  обёртка `<external_data>`, per-tool rate-limit, история ≤200.
- `tool-pipeline/`: водопад pre/exec/post middleware, permission-gate, approval, availability.
- `tool-loop/`: общий цикл «LLM → tool calls → execute → LLM».
- `tool-exposure-service.ts`: единая поверхность «что видит модель» (каталог+runner).

### Песочница (`sandbox/`)

- `code-sandbox-service.ts`: Web Worker, ≤10 исполнений, политика, таймаут, артефакты.
- `sandbox-interpreter.ts` — интерпретатор кода.
- **Важно**: код исполняется **только в DEV или `VITE_SANDBOX_ENABLED==='true'`**.

### MCP (`interop/`)

- `MCPService`: дефолтные mcp-local-files (localhost:3001), mcp-github (3002); MAX_RETRIES=5;
  протокол 2025-03-26.
- Встроенный `MemoryMcpServer` (mcp-memory).
- Interop: A2A, coordination, federation, gateway, MCP-harness, translation.

### Browser / Computer-use

- `browser/`: browser-use + browser-harness (автоматизация браузера).
- `computer/`: CUA-цикл «LLM→действие→скриншот→LLM» (sidecar executor). Sidecar: loopback-биндинг, Bearer, SSRF-allowlist.

---

## Пробелы и риски

1. **SandboxService — без тестов**; интерпретатор кода потенциально опасен (нужна глубокая аудиторская проверка).
2. `ToolApprovalLayer` есть, но «approval»-поток не везде замкнут.
3. **Генерация изображений** заявлена в списке инструментов, но **не реализована**.
4. **Картинки из sidecar** (скриншоты как доказательства) — заявлены, не реализованы.
5. Непонятно покрытие AST-валидации — нужно больше тестов на обход функции (evasion).

---

## Роадмап

### P0 — Безопасность

- [ ] Полное покрытие тестами `SandboxService` и `sandbox-interpreter` (включая evasion-кейсы).
- [ ] Аудит AST-валидации (meriyah): массивы evasion-тестов (полиморфизм, прототипы, Proxy, etc.).
- [ ] Проверить, что песочница в проде закрыта (feature-flag проверяется на серверной стороне, а не только в bundle).

### P1 — Довести до продукта

- [ ] **Генерация изображений** (tool-реализация): через провайдеров с image-моделями (или локальную модель).
- [ ] **Скриншоты из sidecar** как доказательства: вложения + vision-вход.
- [ ] Замкнуть approval-поток для всех инструментов с побочными действиями (web/computer/api).

### P2 — Платформа

- [ ] **Плагинные инструменты**: реестр + манифест + sandbox для сторонних плагинов (см. `NEW_COMPONENTS.md`).
- [ ] **MCP-каталог**: обнаружение, версионирование, здоровье серверов, метрики.

### P4 — Исследования

- [ ] Оценка безопасности/точности browser-use и computer-use (сколько действий выполняется корректно).

---

## Критерии «готово»

- Sandbox покрыт тестами (включая evasion).
- Генерация изображений и скриншоты-sidecar работают.
- Approval-поток замкнут для всех «опасных» инструментов.
