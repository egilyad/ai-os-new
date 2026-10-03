# Аудит замкнутости контуров и труб — `egilyad/ai-os-new`

**Цель:** `https://github.com/egilyad/ai-os-new`
**Дата аудита:** 2026-10-04
**Вопрос:** «Проверь все ли контуры и трубы до конца замкнуты и доведены до полностью рабочего состояния»
**Связь с предыдущими отчётами:** `CRITICAL_BUGS_AUDIT.md` (баги безопасности), `TESTS_AND_CI_AUDIT.md` (тесты и CI). Этот отчёт — **проверка end-to-end полноты всех пайплайнов**: от точки входа до точки записи, без разрывов.

---

## Краткое резюме

**НЕТ, контуры и трубы НЕ замкнуты до конца.** Из **35 аудированных пайплайнов**:
- **17 полностью замкнуты** и работают end-to-end
- **18 имеют разрывы** той или иной степени критичности

Из 18 разорванных:
- **4 CRITICAL** — пайплайн фактически **мёртв на entry point** (нет точки входа в production)
- **9 HIGH** — пайплайн работает частично, ключевые ветки отсутствуют
- **5 MEDIUM** — пайплайн работает, но с потерей данных или silent-failure
- **~40 BLOCKED-RUNTIME / PROVIDER-PENDING маркеров** в коде — явные признания незавершённости

Самые серьёзные разрывы:

1. **Compromise webhook pipeline полностью мёртв** — `compromise-webhook-service.ts:138` `onWebhookRequest()` не имеет ни одного HTTP-entry-point в production. GitHub Secret Scanning и Sentry alerts никогда не дойдут до приложения. Автоматическое обнаружение скомпрометированных ключей не работает.

2. **External secrets pipeline имеет ZERO провайдеров** — `phase2-infrastructure.ts:127-130` конструирует `new ExternalSecretsService({ database, eventBus })` БЕЗ `storeFactories`. UI в Settings → Advanced → External Secrets — нерабочий. AWS/GCP/Vault/Doppler — ни один не подключён.

3. **CodeSandboxService зарегистрирован, но никогда не разрешается** — `phase58-code-sandbox.ts:18` регистрирует сервис в DI-контейнере, но `grep` подтверждает: ни один файл не разрешает `codeSandboxService`. Это dead code. Реальный sandbox (`SandboxService` + `sandbox.worker.ts`) — отдельная параллельная реализация.

4. **6 из 10 tool kinds возвращают фейковую строку** — `tool-executor.ts:462-464` `else` ветка возвращает `Output for ${tool.name}: Successful execution.` для `t-read-file`, `t-list-files`, `t-summarize`, `t-translate`, `t-web-search`, `t-api-call`. LLM-агент получает fabrication вместо реальных данных и галлюцинирует поверх.

5. **Cost manager полностью отключён от BudgetService** — клиентский `CostManagerDecorator` считает стоимость в in-memory `records[]`, никогда не вызывает серверный `/api/companies/:id/costs`. Серверный `BudgetService.recordSpend` вызывается только в race-executor path с hardcoded ценой. Settings → Costs показывает неполные данные.

6. **Budget gate отсутствует на `/api/runs/:id/execute`** — единственный endpoint, где тратятся реальные деньги (внешние адаптеры), не вызывает `isOverBudget()`. Бюджет можно обойти.

7. **Runs могут навсегда остаться в статусе `running`** — `POST /api/companies/:id/runs` стартует run, но если follow-up `POST /api/runs/:id/execute` не прибудет — run остался `running` навсегда. Нет reaper'а.

8. **3 LLM-decorator'а никогда не инстанцируются** — `SemanticRouterDecorator`, `CanaryRouterDecorator`, `CompressRouteDecorator` экспортируются, unit-тестируются, но в production-chain (`adapter-factory.ts:248-288`) НЕ включены. Архитектурные возможности, которыеadvertise'ся — не работают.

9. **KeyVault намеренно отключён** — `key-vault.ts:32-36` комментарий: *«Vault is intentionally NOT wired into the app's bootstrap. API keys are stored in IndexedDB in plaintext by design»*. При этом `key-migration.ts:120-131` требует `!securityService.isLocked()` для шифрования — что никогда не выполняется. Migration — perpetual no-op, запускается на каждом bootstrap, ничего не делает.

10. **Telegram service — stub** — `telegram-service.ts:40-46` `bridgeMessage()` только логирует, никогда не POST'ит в Telegram API. Пользователь видит "bot set" success, но сообщения не доставляются.

11. **8 фаз из 64 помечены BLOCKED-RUNTIME / PROVIDER-PENDING** — `phase54-hybrid-rag`, `phase55-tool-catalog`, `phase57-deploy-bundle`, `phase58-code-sandbox`, `phase59-browser-harness`, `phase60-mcp-harness`, `phase61-eval-scorers`, `phase64-agent-adapter`. Реальные провайдеры не подключены — fallback'и на stubs.

---

# ЧАСТЬ 1. CRITICAL разрывы (пайплайн мёртв)

## P-CRIT-1. Compromise webhook pipeline — нет HTTP entry point

**Ожидаемый пайплайн:**
```
External GitHub/Sentry advisory
  → HTTP endpoint (server receiver)
  → compromise-webhook-service.ts:138 onWebhookRequest()
  → verifySignature()
  → handleGitHubPayload() / handleSentryPayload()
  → emit COMPROMISE_SIGNAL
  → key-service.ts:313-321 subscriber
  → compromiseKey()
  → circuit breaker trips
  → user notified
```

**Разрыв:** `grep` по `/server` и `/src` для `onWebhookRequest` callers возвращает **только test-file**. Frontend — Vite SPA, нет HTTP-сервера, нет Express-route, нет service-worker handler. `onWebhookRequest()` **unreachable в production**.

**Файлы:**
- `src/kernel/services/compromise-webhook-service.ts:138-192` — `onWebhookRequest()` определён, никем не вызывается
- `src/kernel/services/key-service.ts:311-323` — подписка на `COMPROMISE_SIGNAL` работает
- `src/kernel/services/key-service.ts:209-211` — `manuallyCompromise()` — единственный рабочий entry (ручной клик в UI)

**Impact:**
- GitHub Secret Scanning alerts → игнорируются
- Sentry alerts → игнорируются
- Скомпрометированные ключи **никогда** не помечаются автоматически
- Весь webhook-pipeline — dead code

**Фикс:**
Либо развернуть server-side webhook receiver (в `server/sync-server.mjs`) который вызывает `compromiseWebhookService.onWebhookRequest`, либо удалить сервис и задокументировать, что compromise detection — manual-only.

---

## P-CRIT-2. External secrets pipeline — ZERO провайдеров

**Ожидаемый пайплайн:**
```
User configures AWS/GCP/Vault/Doppler in Settings → Advanced
  → external-secrets-service.ts:98-128 getSecret()
  → backends.get(activeBackend).get(ref)
  → return value
  → inject as ApiKey
```

**Разрыв:** `phase2-infrastructure.ts:127-130` конструирует `new ExternalSecretsService({ database, eventBus })` **БЕЗ `storeFactories`**. Без `storeFactories`:
- `init()` (line 47-51) skip'ает local backend
- `activateBackend()` (line 73-96) всегда возвращает `false` — `factory = this.deps.storeFactories?.[type]` = `undefined`

UI в `AdvancedTab.tsx:285` вызывает `externalSecretsService.activateBackend(b.type, ...)`, но всегда получает `false` — пользователь не видит ошибки, просто silent failure.

**Файлы:**
- `src/kernel/services/external-secrets-service.ts:30` — `backends: Map` пуст
- `src/kernel/service-registration/phase2-infrastructure.ts:127-130` — нет `storeFactories`
- `src/components/SettingsPanel/AdvancedTab.tsx:285` — UI вызывает activate, получает false

**Impact:**
- AWS Secrets Manager, GCP Secret Manager, HashiCorp Vault, Doppler — **ни один** не работает
- Весь Settings → Advanced → External Secrets UI — нерабочий
- Пользователь не может fetch'нуть секреты из внешних vault'ов

**Фикс:**
Либо реализовать `storeFactories` хотя бы для одного провайдера (local encrypted vault first), либо удалить UI и сервис.

---

## P-CRIT-3. CodeSandboxService — registered, never resolved

**Ожидаемый пайплайн:**
```
Agent emits code-sandbox tool-call
  → tool-executor.ts execute()
  → resolves codeSandboxService from container
  → code-sandbox-service.ts runWithTimeout()
  → delegate (real E2B / AST interpreter)
  → artifact with stdout/stderr/exitCode
```

**Разрыв (двойной):**

1. **`phase58-code-sandbox.ts:18`** регистрирует `codeSandboxService` в DI-контейнере, но `grep` подтверждает: **ни один файл не разрешает `codeSandboxService` из контейнера**. Сервис — dead code.

2. **`code-sandbox-service.ts:138`** — fallback delegate:
   ```ts
   const exec: Delegate = this.delegate ?? (async (_id, lang, c) =>
       `stub artifact (${lang}, ${c.length} chars) — BLOCKED-RUNTIME: real E2B not wired`);
   ```
   Реальный sandbox worker (`sandbox.worker.ts` + `sandbox-interpreter.ts`, 1907-line meriyah AST interpreter) существует, но обёрнут в `SandboxService` (`sandbox-service.ts:113-229`), **НЕ** в `CodeSandboxService`. Это две параллельные реализации.

3. **`sandbox-service.ts:17-18`** — `codeExecutionEnabled = DEV || VITE_SANDBOX_ENABLED==='true'`. В production Docker (где `VITE_SANDBOX_ENABLED=false` по умолчанию) — `execute()` throw'ает.

**Файлы:**
- `src/kernel/services/sandbox/code-sandbox-service.ts:138` — BLOCKED-RUNTIME stub
- `src/kernel/services/sandbox/sandbox-service.ts:113-229` — реальная реализация, separate
- `src/kernel/service-registration/phase58-code-sandbox.ts:18` — orphaned registration
- `.env.example:13-15` — `VITE_SANDBOX_ENABLED=false`

**Impact:**
- Agent-generated code **никогда не выполняется в production** (если только operator не поставит `VITE_SANDBOX_ENABLED=true`)
- `t-code` tool (`tool-executor.ts:436-438`) вызывает `sandboxService.execute` → throw в prod
- CodeSandboxService — мёртвая инфраструктура

**Фикс:**
Wire `CodeSandboxService.setExecutor()` к `SandboxService.execute` в `phase58-code-sandbox.ts`, ИЛИ удалить `CodeSandboxService` как dead code. Документировать, что AST-sandbox не требует `unsafe-eval` (см. `TESTS_AND_CI_AUDIT.md` L-14).

---

## P-CRIT-4. 6 из 10 tool kinds возвращают фейковый результат

**Ожидаемый пайплайн:**
```
LLM emits tool-call (e.g. t-read-file)
  → tool-executor.ts:386-506 execute()
  → dispatch by toolId
  → real implementation (filesystem/HTTP/LLM)
  → result injected back into LLM context
```

**Разрыв:** `tool-executor.ts:462-464` — `else` ветка:
```ts
} else {
    resultData = `Output for ${tool.name}: Successful execution.`;
}
```

**6 tools с `enabled: true`, но без реализации:**
| Tool ID | Description (из кода) | Реальность |
|---|---|---|
| `t-read-file` | "Reads a file from the attached workspace and returns its content." | Возвращает фейк |
| `t-list-files` | "Lists files and directories in the attached workspace." | Возвращает фейк |
| `t-summarize` | "Summarizes a long text into key points using LLM." | Возвращает фейк |
| `t-translate` | "Translates text between languages using LLM." | Возвращает фейк |
| `t-web-search` | "Searches the web using DuckDuckGo and returns results." | Возвращает фейк |
| `t-api-call` | "Makes an HTTP request to a specified API endpoint." | Возвращает фейк |

**Файлы:**
- `src/kernel/services/tool-executor.ts:210-256` — определения tools с `enabled: true`
- `src/kernel/services/tool-executor.ts:462-464` — `else` ветка возвращает fabrication

**Impact:**
- LLM-агент, вызывающий эти tools, получает fabrication `"Successful execution"` вместо реальных данных
- LLM галлюцинирует follow-up reasoning поверх fabrication
- Пользователь видит правдоподобный, но **полностью выдуманный** результат работы агента
- Это **тихий и опасный** failure mode — выглядит как успех

**Фикс:**
1. Реализовать каждый `else if` branch для 6 tools
2. **Или** убрать эти 6 tools из `getEnabledTools()` пока не реализованы
3. **Минимум** — вернуть явную ошибку `toolError(toolId, 'not implemented')` вместо fabrication

---

# ЧАСТЬ 2. HIGH разрывы (пайплайн работает частично)

## P-HIGH-1. Budget gate отсутствует на `/api/runs/:id/execute`

**Пайплайн:**
```
POST /api/runs/:id/execute
  → getRun()
  → check status=running
  → getAdapter()
  → validateConfig()
  → adapter.execute()    ← здесь тратятся деньги
  → parseStdout()
  → appendRunEvent()
  → finishRun()
```

**Разрыв:** `server/sync-server.mjs:1035-1056` — `isOverBudget(companyId, agentId)` **НЕ вызывается** перед `adapter.execute()`. Gate enforced на:
- `POST /api/companies/:id/heartbeat` (line 364) ✅
- `POST /api/companies/:id/runs` (line 754) ✅
- `heartbeat-loop.mjs:68` ✅
- `POST /api/runs/:id/execute` ❌ **НЕТ**

**Файл:** `server/sync-server.mjs:1035-1056`

**Impact:**
- Agent с исчерпанным бюджетом может выполнить run через `POST /api/runs/:id/execute`
- Тратятся tokens/credits — budget cap молча bypass'ится
- Это единственный endpoint, где вызываются внешние адаптеры (http/process)

**Фикс:**
```js
const gate = isOverBudget(run.companyId, run.agentId || null);
if (gate.over) {
    writeJson(res, 402, { error: 'budget exhausted', scope: gate.scope, budget: gate.status });
    return;
}
```
Между line 1028 и 1035.

---

## P-HIGH-2. `decideApproval` — non-atomic side-effects (подтверждает C-5)

**Пайплайн:**
```
POST /api/approvals/:id/decide
  → decideApproval()
  → a.status = 'approved' (in memory)
  → enqueueWakeup()           ← пишет wakeups.json
  → addAgent()                ← пишет companies.json
  → setAgentStatus()          ← пишет companies.json (reassign)
  → logActivity()             ← пишет activity.json
  → saveApprovals(all)        ← пишет approvals.json (ПОСЛЕДНИЙ)
```

**Разрыв:** Side-effects (lines 734, 741, 753-754, 762) выполняются **ДО** persist'а approval-status (line 774). Crash между ними → approval остаётся `pending` на диске, side-effects уже применены → restart → повторный approve → дубликаты.

**Дополнительные разрывы:**
- `setAgentStatus` (line 695) НЕ валидирует `status` против `AGENT_STATUS`
- `override → reassign` (lines 755-764) устанавливает `agent.managerId` БЕЗ `createsCycle()` check → возможен cycle в escalation chain

**Файл:** `server/company-store.mjs:707-777`

**Impact:**
- Дубликаты агентов на crash-replay
- Дубликаты wakeup'ов → двойной heartbeat → двойной расход бюджета
- Manager-chain cycles ломают `getEscalationChain`
- Corruption ledger'а

**Фикс:**
1. Persist `a.status = 'approved'` + `a.executedAt = null` в `approvals.json` **ПЕРВЫМ**
2. Затем side-effects
3. Записать `a.executedAgentId` / `a.executedAt` как marker
4. На старте сервера — recovery-проход для `approved` + `executedAt: null`
5. Добавить `createsCycle` check на line 760
6. Валидировать `status` в `setAgentStatus`

---

## P-HIGH-3. Runs могут навсегда остаться `running`

**Пайплайн:**
```
POST /api/companies/:id/runs
  → startRun() (status='running')
  → return run.id
  → [ожидается] POST /api/runs/:id/execute
  → adapter.execute()
  → finishRun() (status='done'|'error')
```

**Разрыв:** Если follow-up `POST /api/runs/:id/execute` **не прибудет** (client crash, network drop, forgot) — run остаётся `running` навсегда. **Нет sweep/stale-run reaper'а** нигде в codebase.

**Файлы:**
- `server/sync-server.mjs:762-775` — `POST /api/companies/:id/runs` стартует run
- `server/company-store.mjs:526-545` — `startRun` создаёт `status: 'running'`
- НЕТ reaper'а нигде

**Impact:**
- `GET /api/companies/:id/runs?status=running` возвращает ever-growing list phantom runs
- `MAX_RUNS=5000` cap evicts real history
- Metrics dashboards показывают inflated "in-flight" counts
- CLI `cmdRun --watch` (`cli/superagents.mjs:152`) находит первый pending wakeup, но run никогда не finishes → timeout 90s

**Фикс:**
Добавить `reapStaleRuns()` шаг в `processPendingWakeups` (или отдельный `setInterval`), который вызывает `finishRun(id, 'error', 'timeout')` для run'ов с `createdAt` старше N минут.

---

## P-HIGH-4. Cost manager полностью отключён от BudgetService

**Ожидаемый пайплайн:**
```
LLM response
  → parse usage (inputTokens, outputTokens)
  → compute cost (per-model pricing)
  → recordCost (server-side /api/companies/:id/costs)
  → budgetStatus updates
  → isOverBudget fires
  → 402 on next heartbeat/run
```

**Разрыв (параллельные вселенные):**

**Клиентская сторона:**
- `CostManagerDecorator` (`src/llm/decorators/cost-manager.ts`) — считает cost из `FALLBACK_PRICING` (line 45-48: `$0.002/1K input, $0.008/1K output`)
- Хранит в in-memory `records[]` (line 201-207)
- Проверяет budget **локально** (line 83-115)
- **НЕТ серверного вызова**

**Серверная сторона:**
- `BudgetService.recordSpend` вызывается из `chat-executor.ts:766` **только в race-executor path**
- С hardcoded ценой `(response.tokens || 0) * 0.000002`
- Non-race path (line 490) вызывает `keyService.recordUsage`, **НЕ** `budgetService.recordSpend`

**Файлы:**
- `src/llm/decorators/cost-manager.ts:45-48` — FALLBACK_PRICING hardcoded
- `src/llm/decorators/cost-manager.ts:201-207` — in-memory records, no server call
- `src/kernel/services/chat-executor.ts:766` — server call только в race path
- `src/kernel/services/chat-executor.ts:490` — non-race path пропускает recordSpend
- `src/llm/registry/adapter-factory.ts:280-281` — CostManager wired с `{ logCosts: true }` только, без pricing/budget

**Impact:**
- Settings → Costs panel читает из `BudgetService` → показывает **неполные** данные (missing non-race requests)
- `CostManagerDecorator`'s accurate per-model calculations — **невидимы** пользователю
- Budget alerts могут не сработать, потому что большинство requests bypass'ит `recordSpend`
- Cost-manager decorator в production делает только debug-логи

**Фикс:**
1. В `chat-executor.ts` non-race success path (около line 490) вызвать `this.deps.budgetService?.recordSpend(agentId, currentProvider, computedCost)` используя `PricingService` rates
2. **Или** удалить `CostManagerDecorator` из chain (он duplicates budget logic без persist'а)

---

## P-HIGH-5. 3 LLM-decorator'а никогда не инстанцируются

**Ожидаемый пайплайн (из архитектуры):**
```
adapter-factory.ts
  → rate-limit → retry → circuit-breaker → priority-queue
  → semantic-router → canary → compress → logging → cost-manager
  → base adapter
```

**Разрыв:** Реальная chain в `adapter-factory.ts:248-288`:
```
rate-limit → retry → circuit-breaker → priority-queue → cost-manager → cache → logging
```

**3 decorator'а exported + unit-tested, но NEVER instantiated в production:**
| Decorator | File | Что должен делать |
|---|---|---|
| `SemanticRouterDecorator` | `src/llm/decorators/semantic-router.ts:43` | Маршрутизация по семантике запроса |
| `CanaryRouterDecorator` | `src/llm/decorators/canary-router.ts:49` | Canary-деплой новых моделей |
| `CompressRouteDecorator` | `src/llm/decorators/compress-route.ts:21` | Сжатие промптов |

Также: `FallbackDecorator` используется только через `createWithFallback()`, который **никогда не вызывается** runtime'ом.

**Файлы:**
- `src/llm/index.ts:22-29` — экспорт
- `src/llm/decorators/{semantic-router,canary-router,compress-route,fallback-decorator}.test.ts` — unit-тесты есть
- `src/llm/registry/adapter-factory.ts:248-288` — реальная chain без них

**Impact:**
- Semantic routing, canary deploys, prompt compression — **dead features**
- Архитектурные возможности, которые advertise'ся — не работают
- Поддерживаем code + tests для неработающего функционала (maintenance burden)

**Фикс:**
Либо wire decorators в chain (с конфигурацией enable/disable), либо удалить их вместе с тестами и задокументировать как "future work".

---

## P-HIGH-6. Telegram service — stub

**Ожидаемый пайплайн:**
```
Agent triggers notification
  → telegram-service.ts bridgeMessage()
  → POST https://api.telegram.org/bot${bot.botToken}/sendMessage
  → message delivered to Telegram chat
```

**Разрыв:** `telegram-service.ts:40-46`:
```ts
async bridgeMessage(...) {
    LOGGER.info('Telegram', 'bridge send', { ... });
    // Stub: in prod would POST to https://api.telegram.org/bot${bot.botToken}/sendMessage
    return;
}
```

Только логирует, никогда не POST'ит. Line 16 comment: *«Real polling/webhook to be added with MTProto/Telethon-style sessionString»*.

**Файл:** `src/kernel/services/telegram-service.ts:40-46`

**Impact:**
- Пользователь настраивает Telegram bot для agent → видит "bot set" success
- Сообщения **никогда** не доставляются
- Тихий failure — пользователь не знает, что bot не работает

**Фикс:**
Либо реализовать POST в Telegram API, либо удалить сервис и UI.

---

## P-HIGH-7. Memory-pressure cancellation не работает для стримов (подтверждает H-5)

**Пайплайн:**
```
bootstrap.ts:91-99 MemoryWatchdog start
  → memory-watchdog.ts:100-117 heap > absoluteThresholdMB
  → bootstrap.ts:467-484 pressure callback
  → LLMHttpClient.cancelAll()
  → abort each controller in _inflight
```

**Разрыв:** `llm-http-client.ts:469-480` — `streamPost` в `finally`:
- Вызывает `done()` (line 473) → **удаляет entry из `_inflight`**
- Вызывает `releaseSlot()` (line 479)
- **НА headers-received time**, не на stream-completion

Caller дальше читает `res.body` секунды/минуты. В этот момент request **невидим** для `cancelAll()`/`cancelLongestRunning()` — `controller.abort()` не вызывается.

**Файл:** `src/llm/http/llm-http-client.ts:469-480`

**Impact:**
- `cancelAll()` и `cancelLongestRunning()` iterate `_inflight`, который больше не содержит active streams
- **In-flight SSE streams нельзя отменить** при memory pressure
- OOM cascade продолжается, пока streams не закончатся естественно или tab не упадёт

**Фикс:**
Возвращать из `streamPost` handle `{ response, release: () => { done(); releaseSlot(); } }`. Documentировать, что все 5 callers обязаны вызвать `release()` в `finally` вокруг body-consumption.

---

## P-HIGH-8. L-18 confirmed — chunkBuffers leak on cancel

**Пайплайн:**
```
chat-executor.ts:334-340 onChunk → emit STREAM_CHUNK
  → chat-event-handlers.ts:184-193 subscriber buffers into chunkBuffers Map
  → scheduleChunkFlush (rAF-batched)
  → flushChunkBuffers → set() zustand → React render
```

**Разрыв:** `store.ts:95-148` `cancelSending` очищает `activeRequestIds` и emit'ит `CANCEL_MESSAGE`, но **НЕ** вызывает `chunkBuffers.delete(requestId)`. `chunkBuffers` Map — module-private to `chat-event-handlers.ts`, не экспортирован.

Cleanup полагается на последующий `MESSAGE_RESPONSE` с `status: 'cancelled'` (`chat-event-handlers.ts:159-162` вызывает `chunkBuffers.delete`). Но:
1. Если `CANCEL_MESSAGE` приходит в `ChatExecutor` после того, как request уже terminated → `cancelRequest` no-op → `MESSAGE_RESPONSE(cancelled)` НЕ emit'ится → buffer leaks
2. Если chunk был buffered между cancel-click и rAF flush → flush append'ит chunk к уже `cancelled` response

**Файлы:**
- `src/stores/chat/store.ts:95-148` — `cancelSending`
- `src/stores/chat/chat-event-handlers.ts:64-100` — `flushChunkBuffers`

**Impact:**
- Cancelled streams могут получить ещё один buffered chunk, append'нутый к response content
- Leaked `chunkBuffers` entries накапливаются через cancel/retry cycles (small memory leak)

**Фикс:**
Экспортировать `clearChunkBuffer(requestId)` из `chat-event-handlers.ts` и вызывать из `cancelSending` для каждого cancelled requestId.

---

## P-HIGH-9. KeyVault намеренно отключён → key-migration deadlock

**Пайплайн (ожидаемый):**
```
bootstrap
  → securityService.initialize(password)
  → key-vault.ts unlock(password)
  → key-migration.ts:120-131 encrypt plaintext keys
  → mark done: true
  → never run again
```

**Разрыв (двойной):**

1. **Vault disabled:** `key-vault.ts:32-36` комментарий: *«Vault is intentionally NOT wired into the app's bootstrap. API keys are stored in IndexedDB in plaintext by design»*. `SecurityService.initialize()` вызывается только из `security.test.ts`.

2. **Migration deadlock:** `key-migration.ts:120-131` требует `!securityService.isLocked()` для шифрования. Но vault никогда не unlock'ается → `isLocked()` всегда `true` → encryption branch unreachable → `skippedCount > 0` для каждого plaintext key → migration никогда не marks `done: true` → `runOnce` запускается на каждом bootstrap, re-read'ит те же plaintext keys, re-skip'ает их. **Perpetual no-op.**

**Файлы:**
- `src/kernel/services/key-management/key-vault.ts:32-36` — disabled by design
- `src/kernel/security.ts:29` — `initialize()` только в tests
- `src/kernel/services/key-management/key-migration.ts:120-131` — deadlock
- `src/components/SettingsPanel/SettingsPanel.tsx:380` — UI признаёт: *«passphrase encryption via KeyVault is not wired up yet — do not use on shared machines»*

**Impact:**
- API keys в IndexedDB plaintext (подтверждает C-1)
- Migration — perpetual no-op, тратит CPU на каждом bootstrap
- Пользователь видит предупреждение в Settings, но encryption никогда не включается

**Фикс:**
Либо wire vault (UI unlock screen + `securityService.initialize(password)` в bootstrap), либо удалить encryption branch из `runOnce` и хранить plaintext keys напрямую с `done: true`. Удалить ложную документацию в `DocumentationPanel/doc-content-data.tsx:157`.

---

# ЧАСТЬ 3. MEDIUM разрывы (работает с потерями)

## P-MED-1. `db_changed` broadcast bypasses SSE clients

**Пайплайн:** PUT /api/db → atomic write → broadcast `db_changed` → все табы re-fetch.

**Разрыв:** `server/sync-server.mjs:282-287` использует raw `for (const client of wss.clients) { client.send(msg) }` — только WS-клиенты. SSE-клиенты (`sseClients` Set, обслуживаемые `broadcastLive`) **пропущены**.

**Файл:** `server/sync-server.mjs:282-287`

**Impact:** Frontend tab, подключенный через `/api/live-events` (SSE), никогда не узнает, что другой tab PUT'нул новый shared DB snapshot → его local Dexie view diverges до manual refresh.

**Фикс:** Заменить lines 282-287 на `broadcastLive('db_changed', {})`.

---

## P-MED-2. `commentApproval` не broadcast'ит

**Пайплайн:** POST /api/approvals/:id/comments → commentApproval → ??? → return.

**Разрыв:** `server/sync-server.mjs:846-868` — `commentApproval` вызывается, response возвращается, но `broadcastLive` **НЕ вызывается**. Каждый другой mutating approval route (request line 819, decide line 887) broadcast'ит.

**Файл:** `server/sync-server.mjs:846-868`

**Impact:** Live approval dashboards не видят новые комментарии в real time → users must refresh.

**Фикс:** `broadcastLive('approval_commented', { approvalId, companyId: approval.companyId })` после line 862.

---

## P-MED-3. `checkoutIssue` нарушает `ISSUE_TRANSITIONS` matrix

**Пайплайн:** checkoutIssue → status → in_progress.

**Разрыв:** `ISSUE_TRANSITIONS.backlog = ['todo', 'cancelled']` — нет прямого `in_progress`. Но `checkoutIssue` (line 431-433) ставит `in_progress` из `backlog`/`todo`/`blocked`, bypass'я matrix. `setIssueStatus('in_progress'…)` из `backlog` правильно throw'ит `TRANSITION`, но checkout молча делает эквивалентный переход.

**Файл:** `server/company-store.mjs:431-433` vs `server/company-store.mjs:329-337`

**Impact:** Inconsistent state machine; issue boards могут показывать `in_progress` issues, которых "не должно быть" по matrix; future audit против matrix даст false positives.

**Фикс:** Либо добавить `in_progress` в `ISSUE_TRANSITIONS.backlog`, либо route `checkoutIssue` через `setIssueStatus`.

---

## P-MED-4. Pending wakeups никогда не garbage-collect'ятся

**Пайплайн:** enqueueWakeup → status=pending → process → ackWakeup → status=done/error → ???

**Разрыв:** Все wakeups (pending + done + error) накапливаются в `wakeups.json` до 5000-cap, который evict'ит oldest. Если producer enqueues быстрее, чем heartbeat-loop drain'ит (10/15s = 40/min), pending wakeups в head of queue evict'ятся `splice(0, all.length - 5000)` даже не будучи acked — **silent data loss**. Нет time-based cleanup для `done`/`error` wakeups.

**Файл:** `server/company-store.mjs:205-208` (enqueueWakeup cap=5000)

**Impact:**
- Under load: enqueued wakeups silently исчезают перед processing
- CLI `cmdRun --watch` (`cli/superagents.mjs:152`) hits `wakeup lost` failure → exit 1

**Фикс:**
- Evict по status (keep pending forever, drop acked >7d old)
- **Или** поднять cap
- **Или** backpressure (reject POST /api/wakeups с 503 когда queue >threshold)

---

## P-MED-5. `writeJsonAtomic` не чистит tmp file при rename failure

**Пайплайн:** writeJsonAtomic → writeFileSync(tmp) → renameSync(tmp, file).

**Разрыв:** `server/company-store.mjs:36-41` — если `writeFileSync` succeeds, но `renameSync` throw'ит (EXDEV cross-device, EPERM) → tmp file orphaned. Нет `finally { fs.unlinkSync(tmp).catch(()=>{}) }`.

**Файл:** `server/company-store.mjs:36-41`

**Impact:**
- Со временем `data/*.json.tmp.*` files накапливаются
- С 8 JSON stores и частыми writes — тысячи файлов
- `cli/superagents.mjs db-backup` (line 111) copy'ит их всех

**Фикс:**
```js
try { fs.renameSync(tmp, file); }
catch (e) { try { fs.unlinkSync(tmp); } catch {} throw e; }
```

---

## P-MED-6. `startHeartbeatLoop` return value discarded

**Пайплайн:** `startHeartbeatLoop()` → returns `{ stop() }` → ???

**Разрыв:** `server/sync-server.mjs:1182` вызывает `startHeartbeatLoop({ onEvent })`, но return value не сохраняется. `stop()` метод (line 149-154) **unreachable**.

**Файл:** `server/sync-server.mjs:1182` + `server/heartbeat-loop.mjs:149-154`

**Impact:**
- `SIGINT`/`SIGTERM` в `run-dev.mjs` kill'ит spawned process abruptly mid-tick
- Long-running `appendRunEvent` может быть cut mid-write → run с half-written event list

**Фикс:**
```js
const heartbeatLoop = startHeartbeatLoop({ onEvent });
process.on('SIGTERM', () => { heartbeatLoop.stop(); server.close(); });
process.on('SIGINT', () => { heartbeatLoop.stop(); server.close(); });
```

---

## P-MED-7. Key cleanup gap — circuit breaker state для deleted keys

**Пайплайн:** removeKey → health.cleanupKey + lifecycle.cleanupKey → ??? (circuit breaker state не чистится).

**Разрыв:** `key-service.ts:537-557` `removeKey` НЕ вызывает `providerAdapterRegistry.invalidateCache(provider)` или `resetCircuitBreaker(provider)`. `AdapterFactory.states` map (`circuit-breaker.ts:49`) retains per-key circuit state (keyed by apiKey hash) для deleted key **навсегда**.

**Файл:** `src/kernel/services/key-management/key-service.ts:537-557`

**Impact:**
- Stale circuit-breaker state для deleted keys накапливается в adapter's `states` Map
- Memory grows при многократном add/remove keys

**Фикс:**
В `removeKey`, после `registry.removeKey`, вызвать `this.deps.providerAdapterRegistry?.invalidateCache(key.provider)` если других keys для этого провайдера не осталось.

---

## P-MED-8. Cross-tab lock — нет `beforeunload` release

**Пайплайн:** acquire → heartbeat → release (на正常 unload?) → ???.

**Разрыв:** `cross-tab-lock-service.ts` `DistributedLockService` НЕ регистрирует `beforeunload` listener. `destroy()` (line 287-303) только notify'ит listeners и clear'ит timer — НЕ вызывает `db.keyValue.delete(key)` для held locks. Lock persist'ит в Dexie до тех пор, пока другой tab не detect'ит expiry (TTL 30s).

**Файл:** `src/kernel/services/cross-tab-lock-service.ts:123-203, 287-303`

**Impact:**
- После close tab'а, resource, который он locked (например `chat:{sessionId}`), недоступен другим tab'ам до 30s
- Users видят "Failed to acquire chat lock" warnings

**Фикс:**
Регистрировать `beforeunload` в constructor, который вызывает `release()` на каждом held lock (best-effort, fire-and-forget).

---

# ЧАСТЬ 4. LOW разрывы

## P-LOW-1. Dead-letter queue никогда не опрашивается

**Пайплайн:** event emit → 0 subscribers → push to DLQ → ???.

**Разрыв:** `event-bus.ts:76-78, 326-331` — DLQ существует (`MAX_DEAD_LETTER=1000`), но `drainDeadLetterQueue()` не опрашивается никаким supervisor'ом. Dropped events накапливаются до cap, затем silently shift out.

**Файл:** `src/kernel/services/event-bus-service.ts` (event-bus.ts)

**Impact:** Dropped events теряются перманентно.

**Фикс:** Либо periodic poll с alerting, либо удалить DLQ (не использовать).

---

## P-LOW-2. Logger message string не sanitized

**Пайлвайн:** LOGGER.info/warn/error → message + meta → sanitize(meta) → buffer → console + IndexedDB.

**Разрыв:** `logger-service.ts:122-143` — `entry.message` это raw string от caller'а. Sanitization (`sanitizeObject`) применяется только к `meta`. Если caller interpolates секрет в message (`LOGGER.info('X', `key=${apiKey}`)`) — секрет попадает в buffer и IndexedDB.

**Файл:** `src/kernel/services/logger-service.ts:122-143`

**Impact:** Secret leak в logs/IndexedDB при неосторожном использовании.

**Фикс:** Применять `sanitizeObject(message)` перед storing, ИЛИ документировать, что callers не должны interpol'ировать секреты в messages.

---

## P-LOW-3. Prompt security — sync/async mismatch

**Пайплайн:** prompt-security-service.scan() → ensureLoaded() → rules → verdict.

**Разрыв:** `prompt-security-service.ts:219-223` — `scan()` sync, но `ensureLoaded()` async fire-and-forget. Первый scan runs против `DEFAULT_CONFIG` пока `_doLoad` не завершится. User-saved config (custom rules, blockOnScore) не применяется к самому первому LLM call после reload.

**Файл:** `src/kernel/services/prompt-security-service.ts:219-223`

**Impact:** Первый prompt после reload может пройти с default rules вместо user-configured.

**Фикс:** Await `ensureLoaded()` в chat-executor init, ИЛИ pre-load config синхронно в constructor.

---

## P-LOW-4. Dexie v1-v4 users orphaned

**Пайплайн:** Old user с DB `super_agents_os` → открывает app → новый DB `super_agents_os_v4` → старая DB orphaned.

**Разрыв:** `dexie-schema.ts` объявляет versions 5-43 под DB name `super_agents_os_v4` (line 346). Пользователи со старым DB name (`super_agents_os`) получают fresh DB at v5+; их старые данные не мигрируются. `key-migration.ts` (`runOnce`) handles это для keys specifically (reads localStorage + sqlite blob + Dexie), но другие tables (sessions, memories, notes) — **потеряны**.

**Файл:** `src/kernel/services/dexie-schema.ts:346` + `src/kernel/services/key-management/key-migration.ts`

**Impact:** Старые пользователи теряют sessions/memories/notes (но не keys).

**Фикс:** Либо migration script для old DB, либо явное warning пользователю.

---

## P-LOW-5. i18n async load race

**Пайплайн:** app load → `loadLocale(DEFAULT_LOCALE)` (async) → useTranslation hook → `t()` (sync) → ???.

**Разрыв:** `translations/index.ts:7-17` — `loadLocale` async, `t()` sync. На first render `_loaded[locale]` может быть пустым → returns raw key до тех пор, пока dynamic import не resolve'ится. Subscription в `useTranslation` re-render'ит только на language change, не на locale-load completion.

**Файл:** `src/i18n/translations/index.ts:7-17, 43` + `src/i18n/useTranslation.ts:18-29`

**Impact:** На first render после reload пользователь может увидеть raw i18n keys (например `chat.placeholder`) вместо перевода.

**Фикс:** После `loadLocale` resolve, emit "translations-loaded" event, который `useTranslation` слушает и triggers re-render.

---

## P-LOW-6. `consumeAutocycleSlot` не откатывает на later failure

**Пайплайн:** consumeAutocycleSlot → increment count → persist → process wakeup → ??? (failure).

**Разрыв:** `server/heartbeat-loop.mjs:22-40` — autocycle count incremented и persisted (line 67 of `autocycle-guard.mjs`) **ДО** processing wakeup. Если processing later fails (budget exhausted, company not found), count остаётся incremented — failed attempts consume daily quota.

**Файл:** `server/heartbeat-loop.mjs:22-40` + `server/autocycle-guard.mjs:56-69`

**Impact:** С `AUTOCYCLE_MAX_ITERATIONS=10` default, 10 consecutive failures (например budget exceeded) lock company out на rest of day, хотя никакой real work не произошёл.

**Фикс:** Либо `releaseAutocycleSlot(companyId)` на failure path (новая function, decrement count), либо consume slot **после** `heartbeatCompany` success.

---

## P-LOW-7. `cmdRun --watch` fetches full wakeup list каждые 2s

**Пайплайн:** cmdRun → enqueue wakeup → poll GET /api/wakeups → find by id.

**Разрыв:** `cli/superagents.mjs:151-152` — `GET /api/wakeups` returns full list (до 5000 entries) каждый poll iteration, затем `.find()` client-side. С 90s deadline и 2s interval — до 46 full-list fetches.

**Файл:** `cli/superagents.mjs:151-152`

**Impact:** Wasteful bandwidth (до ~460KB per `--watch`).

**Фикс:** Server-side `?id=<wakeupId>` filter или `GET /api/wakeups/:id` endpoint.

---

## P-LOW-8. `cmdDoctor` не проверяет `autocycle-guard.mjs`

**Пайплайн:** cmdDoctor → check syntax of SERVER_FILES → all green.

**Разрыв:** `cli/superagents.mjs:12` — `SERVER_FILES` array содержит 4 файла, но **НЕ** `server/autocycle-guard.mjs` (который imported by `heartbeat-loop.mjs`). Syntax error в autocycle-guard crash'нет server, но проходит `doctor`.

**Файл:** `cli/superagents.mjs:12`

**Impact:** False-positive "all green" от doctor.

**Фикс:** Добавить `'server/autocycle-guard.mjs'` в array.

---

# ЧАСТЬ 5. State leaks и orphaned exports

## State leaks (unbounded growth)

| Leak | File:line | Notes |
|---|---|---|
| `rateLimits` Map | `server/sync-server.mjs:65` | Grows unbounded — IP→entry persist forever после first request. Under sustained attack с многих IPs, memory grows. |
| `wsRateLimits` Map | `server/sync-server.mjs:181` | Same issue — entries never expire. |
| `chunkBuffers` Map | `src/stores/chat/chat-event-handlers.ts:64` | Leaked entries накапливаются через cancel/retry cycles (P-HIGH-8). |
| `AdapterFactory.states` Map | `src/llm/decorators/circuit-breaker.ts:49` | Per-key circuit state для deleted keys (P-MED-7). |
| Dead-letter queue | `src/kernel/services/event-bus-service.ts:76-78` | Dropped events до 1000, затем silently shift out (P-LOW-1). |

**Не leaks (verified safe):**
- `sseClients` Set — properly cleaned на `req.on('close')` (line 323).
- Dead-tcp reaper `setInterval` — harmless, ping/pong only.
- `writeQueue` Promise chain — each link resolves и GC'd.

## Orphaned exports (defined, never called from production)

| Export | File:line | Status |
|---|---|---|
| `autocycleUsage` | `server/autocycle-guard.mjs:49` | **Truly orphaned** — нет callers (даже internal). |
| `processPendingWakeups` | `server/heartbeat-loop.mjs:16` | API-orphaned — только `startHeartbeatLoop` internal. |
| `deleteCompany` | `server/company-store.mjs:840` | API-orphaned — нет HTTP DELETE route. |
| `setAgentStatus` | `server/company-store.mjs:695` | API-orphaned — только `decideApproval` internal. |
| `redactSecrets` | `server/company-store.mjs:788` | API-orphaned — только `exportCompany` internal. |
| `evaluateGate` | `server/company-store.mjs:489` | API-orphaned — только `setIssueStatus` internal. |
| `monthKey` / `monthSpend` | `server/company-store.mjs:250, 284` | API-orphaned — internal only. |
| `isAutocycleEnabled` / `maxIterations` | `server/autocycle-guard.mjs:16, 20` | API-orphaned — internal only. |
| `CodeSandboxService` | `src/kernel/service-registration/phase58-code-sandbox.ts:18` | **Registered, never resolved** (P-CRIT-3). |
| `SemanticRouterDecorator` | `src/llm/decorators/semantic-router.ts:43` | Tested, never instantiated (P-HIGH-5). |
| `CanaryRouterDecorator` | `src/llm/decorators/canary-router.ts:49` | Tested, never instantiated (P-HIGH-5). |
| `CompressRouteDecorator` | `src/llm/decorators/compress-route.ts:21` | Tested, never instantiated (P-HIGH-5). |
| `FallbackDecorator` | `src/llm/decorators/fallback-decorator.ts` | Only via `createWithFallback()`, never called. |
| `KeyVault` | `src/kernel/services/key-management/key-vault.ts:38` | "Intentionally NOT wired" (P-HIGH-9). |
| `ComingSoonPanel` | `src/components/ComingSoonPanel.tsx:10` | 0 production imports. |
| `TelegramService.bridgeMessage` | `src/kernel/services/telegram-service.ts:40` | Stub — logs only (P-HIGH-6). |
| `CompromiseWebhookService.onWebhookRequest` | `src/kernel/services/compromise-webhook-service.ts:138` | No HTTP entry point (P-CRIT-1). |
| `ExternalSecretsService` backends | `src/kernel/services/external-secrets-service.ts:30` | 0 backends registered (P-CRIT-2). |
| 6 tool kinds в `ToolService` | `src/kernel/services/tool-executor.ts:462-464` | `else` branch возвращает fabrication (P-CRIT-4). |

---

# ЧАСТЬ 6. BLOCKED-RUNTIME / PROVIDER-PENDING — явные признания незавершённости

**8 из 64 phase-files** в `src/kernel/service-registration/` содержат BLOCKED-RUNTIME или PROVIDER-PENDING маркеры:

| Phase | Service | Что отсутствует | User-visible impact |
|---|---|---|---|
| `phase54-hybrid-rag.ts` | HybridRetrievalService | Real provider embed/rerank | Vector search использует hash-embedder (384-bit) вместо real embeddings; reranker — stub |
| `phase55-tool-catalog.ts` | ToolCatalogService | MCP tools offline | MCP tools помечены PROVIDER-PENDING когда server offline |
| `phase57-deploy-bundle.ts` | DeployBundleService | Real zip/filesystem/cloud push | Deploy возвращает stub artifact, не real bundle |
| `phase58-code-sandbox.ts` | CodeSandboxService | Real E2B execution | Stub artifact, sandbox мёртв (P-CRIT-3) |
| `phase59-browser-harness.ts` | BrowserHarnessService | Real browser execution | Handoff artifact только, real browser не wired |
| `phase60-mcp-harness.ts` | McpHarnessService | Real MCP servers | Returns handoff когда no servers connected |
| `phase61-eval-scorers.ts` | LlmJudgeService | Real LLM judge | Stub heuristic (token_f1), PROVIDER-PENDING |
| `phase64-agent-adapter.ts` | AgentActAdapterService | Real LLM agents | Stub deterministic act (idle/move) |

Дополнительно (не в phase-files):
- `src/kernel/services/sandbox/code-sandbox-service.ts:138` — `BLOCKED-RUNTIME: real E2B not wired`
- `src/kernel/services/eval/llm-judge-service.ts:6,26,37` — stub heuristic
- `src/kernel/services/interop/mcp-harness-service.ts:62-63` — handoff only
- `src/kernel/services/browser/browser-harness-service.ts:134` — handoff only
- `src/kernel/services/rag/reranker-service.ts:55-64` — `PROVIDER-PENDING (BLOCKED-RUNTIME)`
- `src/kernel/services/deploy/deploy-bundle-service.ts:5,98,150` — no real zip/cloud
- `src/kernel/services/simulation/agent-act-adapter-service.ts:5` — stub fallback
- `src/kernel/services/simulation/simulation-engine-service.ts:5` — stub if not wired
- `src/kernel/services/rivals20/interpreter-services.ts:42` — fallback when sandbox not wired
- `src/kernel/services/telegram-service.ts:16,40-46` — stub
- `src/kernel/services/key-management/key-vault.ts:32-36` — intentionally not wired
- `src/llm/core/base-adapter.ts:142,147` — `not implemented` для checkHealth/getAvailableModels base

---

# ЧАСТЬ 7. Полностью замкнутые пайплайны (верифицировано)

Эти пайплайны проверены end-to-end и работают корректно:

| # | Пайплайн | Файлы | Статус |
|---|---|---|---|
| 1 | Bootstrap | `main.tsx` → `runtime.ts` → `bootstrap.ts` → `kernel.ts` | ✅ Closed |
| 2 | HTTP API → company-store | `sync-server.mjs` → `company-store.mjs` | ✅ Closed |
| 3 | Heartbeat loop | `heartbeat-loop.mjs` → `company-store.mjs` | ✅ Closed |
| 4 | autocycle-guard daily reset | `autocycle-guard.mjs` | ✅ Closed |
| 5 | Event bus subscribe/unsubscribe | `event-bus.ts` | ✅ Closed (с DLQ caveat) |
| 6 | Logger (console + IndexedDB) | `logger-service.ts` | ✅ Closed (с message caveat) |
| 7 | Theme init | `theme-init.ts` | ✅ Closed (trivial) |
| 8 | Routing + 404 + Suspense | `routes.tsx` + `route-imports.ts` | ✅ Closed |
| 9 | Circuit breaker recovery | `circuit-breaker.ts` | ✅ Closed (auto-recovery works) |
| 10 | Rate limit refill | `rate-limit-decorator.ts` | ✅ Closed (math correct) |
| 11 | Cross-tab lock acquire/heartbeat | `cross-tab-lock-service.ts` | ✅ Closed (без beforeunload) |
| 12 | Key survive reload | `bootstrap-key-init.ts` | ✅ Closed |
| 13 | Chat send → LLM → render | `chat-send-message.ts` → `chat-executor.ts` | ✅ Closed (с decorator caveats) |
| 14 | SSE parser robustness | `sse-parser.ts` | ✅ Closed |
| 15 | Adapter execution (echo/http/process) | `adapters.mjs` | ✅ Closed |
| 16 | CLI roundtrip (onboard/doctor/run/configure) | `superagents.mjs` | ✅ Closed (с minor caveats) |
| 17 | atomic-write (tmp + rename) | `company-store.mjs:36-41` | ✅ Closed (без tmp cleanup) |

---

# ЧАСТЬ 8. Приоритезированный план исправлений

## P0 — критичные разрывы (пайплайн мёртв)

1. **P-CRIT-1**: Deploy server-side webhook receiver для `compromiseWebhookService.onWebhookRequest` в `server/sync-server.mjs` (или удалить сервис).
2. **P-CRIT-2**: Зарегистрировать хотя бы один `storeFactories` в `phase2-infrastructure.ts:127-130` (local encrypted vault first) ИЛИ удалить Settings → Advanced → External Secrets UI.
3. **P-CRIT-3**: Wire `CodeSandboxService.setExecutor()` к `SandboxService.execute` в `phase58-code-sandbox.ts`, ИЛИ удалить `CodeSandboxService` как dead code.
4. **P-CRIT-4**: Реализовать 6 tool kinds (`t-read-file`, `t-list-files`, `t-summarize`, `t-translate`, `t-web-search`, `t-api-call`) ИЛИ убрать их из `getEnabledTools()` ИЛИ возвращать явную ошибку вместо fabrication.

## P1 — высокие разрывы (частично работает)

5. **P-HIGH-1**: Добавить `isOverBudget` gate на `POST /api/runs/:id/execute` (`sync-server.mjs:1035`).
6. **P-HIGH-2**: Reorder `decideApproval` — persist approval status ПЕРВЫМ, затем side-effects + `createsCycle` check на reassign.
7. **P-HIGH-3**: Добавить `reapStaleRuns()` в `processPendingWakeups` для run'ов старше N минут.
8. **P-HIGH-4**: Wire `CostManagerDecorator` → `BudgetService.recordSpend` (или удалить decorator).
9. **P-HIGH-5**: Decision — wire `SemanticRouter`/`CanaryRouter`/`CompressRoute`/`Fallback` в production chain, ИЛИ удалить.
10. **P-HIGH-6**: Реализовать `telegram-service.bridgeMessage` POST в Telegram API ИЛИ удалить сервис.
11. **P-HIGH-7**: Вернуть `release` handle из `streamPost`, держать `_inflight` entry до конца body.
12. **P-HIGH-8**: Экспортировать `clearChunkBuffer` из `chat-event-handlers.ts`, вызывать из `cancelSending`.
13. **P-HIGH-9**: Decision — wire `KeyVault` в bootstrap с UI unlock screen, ИЛИ удалить encryption branch из `key-migration.ts` + удалить ложную документацию.

## P2 — средние разрывы

14. **P-MED-1**: Заменить raw `wss.clients` loop на `broadcastLive('db_changed', {})` в `sync-server.mjs:282-287`.
15. **P-MED-2**: Добавить `broadcastLive('approval_commented', ...)` после `commentApproval`.
16. **P-MED-3**: Либо добавить `in_progress` в `ISSUE_TRANSITIONS.backlog`, либо route `checkoutIssue` через `setIssueStatus`.
17. **P-MED-4**: Evict wakeups по status (keep pending forever, drop acked >7d) ИЛИ backpressure.
18. **P-MED-5**: `try/catch/finally` в `writeJsonAtomic` для tmp cleanup.
19. **P-MED-6**: Сохранить `heartbeatLoop` handle, вызвать `stop()` из `SIGTERM`/`SIGINT` handler.
20. **P-MED-7**: Вызывать `providerAdapterRegistry.invalidateCache(provider)` в `removeKey` когда других keys для провайдера не осталось.
21. **P-MED-8**: Регистрировать `beforeunload` в `DistributedLockService` constructor.

## P3 — низкие разрывы

22. **P-LOW-1**: Decision — periodic DLQ poll с alerting, ИЛИ удалить DLQ.
23. **P-LOW-2**: Sanitize `entry.message` в `logger-service.ts:122-143`.
24. **P-LOW-3**: Await `ensureLoaded()` в chat-executor init.
25. **P-LOW-4**: Migration script для old DB name ИЛИ warning пользователю.
26. **P-LOW-5**: Emit "translations-loaded" event после `loadLocale` resolve.
27. **P-LOW-6**: `releaseAutocycleSlot` на failure path ИЛИ consume slot после success.
28. **P-LOW-7**: `?id=<wakeupId>` filter на `GET /api/wakeups` ИЛИ `GET /api/wakeups/:id` endpoint.
29. **P-LOW-8**: Добавить `'server/autocycle-guard.mjs'` в `SERVER_FILES` array.

---

# Приложение A. Сводная таблица всех разрывов

| ID | Severity | Пайплайн | Разрыв |
|---|---|---|---|
| P-CRIT-1 | CRITICAL | Compromise webhook | Нет HTTP entry point |
| P-CRIT-2 | CRITICAL | External secrets | 0 providers wired |
| P-CRIT-3 | CRITICAL | Code sandbox | Service registered, never resolved; production-gated off |
| P-CRIT-4 | CRITICAL | Tool execution | 6/10 tools return fabrication |
| P-HIGH-1 | HIGH | Budget gate | Missing on /api/runs/:id/execute |
| P-HIGH-2 | HIGH | Approval side-effects | Non-atomic (C-5 confirmed) |
| P-HIGH-3 | HIGH | Run lifecycle | No stale-run reaper |
| P-HIGH-4 | HIGH | Cost attribution | Client decorator disconnected from server BudgetService |
| P-HIGH-5 | HIGH | LLM decorator chain | 3-4 decorators never instantiated |
| P-HIGH-6 | HIGH | Telegram notifications | Stub, no actual send |
| P-HIGH-7 | HIGH | Memory-pressure cancel | streamPost invisible (H-5 confirmed) |
| P-HIGH-8 | HIGH | SSE chunk buffering | chunkBuffers leak on cancel (L-18 confirmed) |
| P-HIGH-9 | HIGH | Key encryption | KeyVault disabled + migration deadlock |
| P-MED-1 | MEDIUM | WS/SSE sync | db_changed skips SSE |
| P-MED-2 | MEDIUM | Approval comments | No broadcastLive |
| P-MED-3 | MEDIUM | Issue state machine | checkoutIssue bypasses ISSUE_TRANSITIONS |
| P-MED-4 | MEDIUM | Wakeup GC | No time-based cleanup, cap-eviction drops pending |
| P-MED-5 | MEDIUM | File atomicity | No tmp cleanup on rename failure |
| P-MED-6 | MEDIUM | Heartbeat shutdown | stop() unreachable |
| P-MED-7 | MEDIUM | Key cleanup | Circuit breaker state for deleted keys |
| P-MED-8 | MEDIUM | Cross-tab lock | No beforeunload release |
| P-LOW-1 | LOW | Event bus DLQ | Never polled |
| P-LOW-2 | LOW | Logger | Message string not sanitized |
| P-LOW-3 | LOW | Prompt security | Sync/async mismatch on first call |
| P-LOW-4 | LOW | Dexie migration | v1-v4 users orphaned |
| P-LOW-5 | LOW | i18n | Async load race on first render |
| P-LOW-6 | LOW | Autocycle guard | No rollback on failure |
| P-LOW-7 | LOW | CLI watch | Fetches full wakeup list per poll |
| P-LOW-8 | LOW | CLI doctor | Omits autocycle-guard.mjs |

---

# Приложение B. Полный список BLOCKED-RUNTIME / PROVIDER-PENDING маркеров

| File:line | Marker | Что отсутствует |
|---|---|---|
| `src/kernel/contracts/deploy-bundle.ts:6-7,37` | BLOCKED-RUNTIME / PROVIDER-PENDING | Real zip/filesystem/cloud push |
| `src/kernel/contracts/mcp-harness.ts:5` | BLOCKED-RUNTIME | Real MCP servers |
| `src/kernel/contracts/code-sandbox.ts:6` | BLOCKED-RUNTIME | Real E2B execution |
| `src/kernel/contracts/eval-scorer.ts:6` | PROVIDER-PENDING | Real LLM judge |
| `src/kernel/contracts/browser-harness.ts:5` | BLOCKED-RUNTIME | Real browser execution |
| `src/kernel/contracts/tool-catalog.ts:6` | PROVIDER-PENDING | MCP tools offline |
| `src/kernel/contracts/hybrid-retrieval.ts:5,38` | PROVIDER-PENDING / BLOCKED-RUNTIME | Real embed/rerank |
| `src/kernel/contracts/simulation-engine.ts:5` | PROVIDER-PENDING | Real LLM agents |
| `src/kernel/services/deploy/deploy-bundle-service.ts:5,98,150` | BLOCKED-RUNTIME | Real zip/cloud |
| `src/kernel/services/eval/llm-judge-service.ts:5-6,26,37,45` | BLOCKED-RUNTIME / PROVIDER-PENDING | Real LLM judge |
| `src/kernel/services/interop/mcp-harness-service.ts:6,62-63` | BLOCKED-RUNTIME | Real MCP servers |
| `src/kernel/services/rag/hybrid-retrieval-service.ts:7` | PROVIDER-PENDING | Provider embed |
| `src/kernel/services/rag/bm25-service.ts:6` | (clear) | Fully local |
| `src/kernel/services/rag/reranker-service.ts:6,55-64` | PROVIDER-PENDING / BLOCKED-RUNTIME | Real reranker |
| `src/kernel/services/browser/browser-harness-service.ts:5,134` | BLOCKED-RUNTIME | Real browser |
| `src/kernel/services/simulation/agent-act-adapter-service.ts:5` | PROVIDER-PENDING | Real LLM |
| `src/kernel/services/simulation/simulation-engine-service.ts:5` | PROVIDER-PENDING | Real LLM agents |
| `src/kernel/services/rivals20/interpreter-services.ts:42` | (fallback) | Sandbox not wired |
| `src/kernel/services/sandbox/code-sandbox-service.ts:6,138` | BLOCKED-RUNTIME | Real E2B |
| `src/kernel/services/telegram-service.ts:16,40-46` | (stub) | Real Telegram API |
| `src/kernel/services/key-management/key-vault.ts:32-36` | (intentional) | Vault wiring |
| `src/llm/core/base-adapter.ts:142,147` | `not implemented` | checkHealth/getAvailableModels base |
| `src/components/SettingsPanel/SettingsPanel.tsx:380` | (admits) | KeyVault not wired |
| `src/kernel/service-registration/phase54-hybrid-rag.ts:10-11,31` | PROVIDER-PENDING / BLOCKED-RUNTIME | Provider embed/rerank |
| `src/kernel/service-registration/phase55-tool-catalog.ts:8` | PROVIDER-PENDING | MCP tools offline |
| `src/kernel/service-registration/phase57-deploy-bundle.ts:7` | BLOCKED-RUNTIME | Real zip/cloud |
| `src/kernel/service-registration/phase58-code-sandbox.ts:7` | BLOCKED-RUNTIME | Real E2B |
| `src/kernel/service-registration/phase59-browser-harness.ts:7` | BLOCKED-RUNTIME | Real browser |
| `src/kernel/service-registration/phase60-mcp-harness.ts:7` | BLOCKED-RUNTIME | Real MCP servers |
| `src/kernel/service-registration/phase61-eval-scorers.ts:6,8` | PROVIDER-PENDING / BLOCKED-RUNTIME | Real LLM judge |
| `src/kernel/service-registration/phase64-agent-adapter.ts:5,8` | PROVIDER-PENDING | Real LLM |

---

# Приложение C. Методология

Аудит выполнен как end-to-end tracing каждого пайплайна:
- **Прямое чтение** server-modules (`sync-server.mjs`, `company-store.mjs`, `heartbeat-loop.mjs`, `autocycle-guard.mjs`, `adapters.mjs`, `run-dev.mjs`) и CLI (`superagents.mjs`).
- **Cross-reference** frontend kernel (`runtime.ts`, `bootstrap.ts`, `kernel.ts`, `container.ts`), chat pipeline (`chat-send-message.ts`, `chat-executor.ts`, `chat-event-handlers.ts`, `store.ts`), LLM (`adapter-factory.ts`, `llm-http-client.ts`, decorators), services (`tool-executor.ts`, `code-sandbox-service.ts`, `sandbox-service.ts`, `key-service.ts`, `key-vault.ts`, `key-migration.ts`, `external-secrets-service.ts`, `compromise-webhook-service.ts`, `telegram-service.ts`, `n8n-service.ts`, `cross-tab-lock-service.ts`, `event-bus-service.ts`, `logger-service.ts`, `prompt-security-service.ts`).
- **Grep-поиск** маркеров: `BLOCKED-RUNTIME`, `PROVIDER-PENDING`, `not wired`, `not implemented`, `stub`, `TODO`, `FIXME`, `coming soon` — найдено **58 instances** в production code (не tests, не translations).
- **Параллельные суб-аудиты**: server-pipelines + frontend-pipelines (cross-cutting audit превысил лимит turns, частично покрыт другими двумя).
- **Orphaned-exports analysis**: grep для каждого exported symbol, поиск callers в codebase.

Ограничения:
- Не запускался runtime-tracing (только static analysis).
- Cross-cutting audit (3-й subagent) не завершился — часть findings о service-registration completeness не верифицирована независимо.
- Не проверялось, какие из 64 phase-files регистрируют реально используемые сервисы vs dead-code (кроме 8 с BLOCKED markers).

---

**Конец отчёта.**

**Всего найдено: 4 CRITICAL, 9 HIGH, 8 MEDIUM, 8 LOW = 29 разрывов** в 35 аудированных пайплайнах + ~40 BLOCKED-RUNTIME/PROVIDER-PENDING маркеров в коде.

**Вердикт:** **Контуры и трубы НЕ замкнуты до конца.** Production-состояние — частично рабочее: основные chat→LLM→render и sync pipelines функционируют, но 4 пайплайна полностью мёртвы (compromise webhook, external secrets, code sandbox, 6 tool kinds), 9 работают с критическими потерями (cost attribution, budget gate, decorator chain, memory-pressure cancel, key encryption). ~40 явных BLOCKED-RUNTIME маркеров подтверждают, что проект находится в состоянии "advanced prototype", а не "production-ready".

**Топ-3 действия для максимального leverage:**
1. **P-CRIT-4** — реализовать 6 tool kinds или убрать их из `getEnabledTools()` (agent'ы сейчас галлюцинируют поверх fabrication).
2. **P-HIGH-1 + P-HIGH-4** — закрыть budget gate на `/api/runs/:id/execute` и wire CostManager → BudgetService (сейчас бюджет можно обойти, cost data неполные).
3. **P-CRIT-1 + P-CRIT-2** — decision: либо развернуть server-side receivers для compromise webhook и external secrets, либо удалить эти сервисы и UI (сейчас они — dead code, вводящий пользователей в заблуждение).
