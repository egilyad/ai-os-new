# Аудит: память агентов, история действий, управление командой

- Дата: 2026-10-14. Этап 1 — разведка БЕЗ изменения кода (код не менялся, коммитов нет).
- Метод: три параллельных read-only прохода по репозиторию + точечная верификация ключевых утверждений grep'ом.
- Принцип: FIX PIPES AND JUNCTIONS, DON'T SHUFFLE FILES — сначала существующее, ничего нового без доказанной нужды.
- Условные метки: `SVC` — вызывается программно через сервис; `UI` — только через панель/руками; `MISS` — отсутствует.

---

## 1. Память агентов — что есть

### 1.1. Живое ядро: `DebateMemory` (heap, per-session)

`src/kernel/services/debate-runtime/debate-memory.ts:112-143` — `claims[]`, `steps[]`, `chains: Map<agentId, ReasoningChain[]>`, капы `MAX_STEPS=5000 / MAX_CLAIMS=1000 / MAX_CHAINS_PER_AGENT=100 / MAX_STEPS_PER_CHAIN=50`.

- `trimContent(keepCount)` (`:166-183`) затирает `content=''` у шагов старше последних N. Вызывается с `8` после каждого `round:end` (`debate-pipeline-builder.ts:260`) — **до** сохранения снапшота, т.е. в `debateSessions.memory` уже лежит обрезанное.
- `toJSON/restoreFrom/destroy` (`:217-238`) — сериализация есть, но сама по себе reload не переживает: восстановление только через `DebatePersistenceManager.restoreSession` (`debate-persistence-manager.ts:407-413`, silent catch).
- `getWinningStrategies()` (`:204`) требует `coherence > 0.7 && conclusion`. **В живом потоке `conclusion` никто не ставит** (`recordStep` только проверяет `!lastChain.conclusion`, `:123`) → в практике всегда `[]` → `buildPersonaMemory()` (`:84-110`, гейт `>=3` шагов в `debate-llm-prompt-context.ts:1317`) почти всегда возвращает `''`. Персона-память из победных стратегий фактически мертва.
- Тесты (`debate-memory.test.ts`): `toJSON→restoreFrom` — только in-memory, без Dexie/reload. Тест `MAX_CLAIMS` (`:203-210`) ассёртит не ту коллекцию (`getAllSteps` вместо claims) — проходит вакуоусно.

### 1.2. Межсессионное: индекс вердиктов, RAG, кристаллы

| Механизм | Файл | Хранение | Ключ | Переживает reload | Потребитель в промпте |
|---|---|---|---|---|---|
| `CrossDebateMemory` (саммари вердиктов, `content.slice(0,500)`, топ-5 по keywords) | `cross-debate-memory.ts:18-264` | `keyValue:cross_debate_memory_index` (в шапке заявлена несуществующая таблица `crossDebateMemory` — в `dexie-schema.ts` её нет) | `sessionId` | да | **НЕТ — call-site не найден** (только тест со стабом) |
| `DebateRAGRetriever` (top-3, threshold 0.3, `<external_data>`) | `debate-rag-retriever.ts:27-111` | `debate-embeddings` через `store.config` | topic-match | — | да, каждый ход (`debate-llm-prompt-context.ts:1327-1340`), ошибки глотаются |
| `DebateEmbeddingPipeline` (200 чанков/сессия) | `debate-embedding-pipeline.ts:36-207` | должен писать в store, но **зарегистрирован без store** (`phase3-debate-runtime.ts:220-222`), у `processMemoryUnits` **нет вызовов** | `sessionId` | нет (индекс, вероятно, пуст) | RAG ищет по пустому |
| `CrystalVault` + `CrystalDebateBridge` (предложение+валидация по `DEBATE_VERDICT_GENERATED`) | `crystal-vault/crystal-vault-service.ts`, `crystal-debate-bridge.ts:16-95` | Dexie `crystals` | `crystalId/originId` | да | **НЕТ — чтения в промпт не найдено** |
| `DebateMemoryExtractor` (классификация `agent:responded` для скоринга) | `debate-memory-extractor.ts:71-153` | ничего не хранит | — | — | только скоринг/логи (`debate-phase-handler.ts:94-133`) |

### 1.3. Параллельные стеки памяти (одни данные — разные владельцы)

Всё персистентно (Dexie), всё keyed по `ownerId/scope/agentId`, **ничего не wired в дебатный промпт**:
`ltMemories/personaProfiles/voices/depths/sharedContexts/goals` (`dexie-schema.ts:1117-1124`, `persona-types.ts`), `cogMemories/memPolicies` (`:1330-1332`), `memoryBlocks` (`:1712`, только если caller позовёт `corePrompt()`), `scopedMem` (`:1817`), `agentMemory` (`:1836`, `agems-agent.ts:130-139`), глобальные `memories` (`:353-364`, `MemoryRepository`, `MAX_ENTRIES=1000`, индексы только `source/type/timestamp` — выборки по `agentId/sessionId` из metadata без индекса).

Дубли контрактов: `IMemoryEngine` объявлен дважды (`contracts/memory.ts:29-70`).

**Вывод контура:** долговременных хранилищ много, переживающих reload — хватает; но дебат живёт heap-памятью сессии + обрезанным снапшотом, персоналия не работает (нет `conclusion`), RAG ищет по пустому индексу, вердиктный индекс и кристаллы пишутся, но никем не читаются. Один и тот же текст дебата лежит в 5 местах с разной обрезкой (`debateSessions.arguments`, `.memory`, timeline-localStorage, embeddings, cross-index, crystals) — единого источника правды нет; minimal-save fallback (`memory='{}'`) может тихо стереть память.

---

## 2. История действий — путь исполнения и где он рвётся

### 2.1. Шина событий — lossy и in-memory

`src/kernel/events/event-bus.ts:54` (синглтон `:537`), реестр `event-registry.ts:30` (~2600 событий). Контракт (`:226-239`): **fire-and-forget + LOSSY**, асинхронная FIFO без гарантии порядка. Дропы (Zod-валидация, `MAX_PENDING 5000`, рекурсия >1000) уходят в in-memory DLQ на 1000 (`:76-78`), replay-буфер **удалён** (`:80-82`). Перезагрузка = потеря всего, что не продублировано в Dexie. Отдельный персистентный `dead-letter-queue-service.ts` (`super_agents_dlq`, кап 500, retry/remove) — для задач, не для шины.

Имена есть на всё: `tool:execution:start/success/error` (`:847-858`), `TOOL_EXECUTED {agentId,tool,ok,latencyMs}` (`:1875`), `invocation:requested/accepted/rejected/executing/done` (`:1438-1494`), `debate:runtime:agent:thinking/chunk/responded/...` (`:603-653`), `crew/task/graph/project/computer/chat/cognitive` — полный словарь в реестре.

### 2.2. Путь по этапам

| Этап | Источник | Событие | Durable-запись | Связки | Разрыв |
|---|---|---|---|---|---|
| S0 задача создана | `project-service.ts:128`, `agems-task-service.ts:8-28`, crew-types | `project:task:created/status`, `crew:task:*` | `projectTasks/crewTasks/agemsTasks` (Dexie) | `taskId=task-{ts}-{rand}`, `assigneeId` | нет счётчика попыток; задачи автономки — in-memory Map |
| S1 запуск агента | `invocation-engine-service.ts:42-174` (requested→accepted→executing→done) | `invocation:*` полный цикл | `invocations` + `invocationCosts` (Dexie) | `invId`, `sessionRef→debate/room`, `policyRef` | **нет `failed/cancelled`** (только `rejected`); `owner` дебата — только в Map; feed инвокаций in-memory (300/500) |
| S2 вызов LLM | `chat-executor.ts`, `conversation-execution-engine.ts`, `debate-llm-caller.ts:197` (retry 3, итераций ≤50) | `chat:stream:*`, `debate:agent:chunk` | **нет строки запроса** (только `sessions.history`, traces, costs). Текст промпта не хранится | `requestId/traceId/agentId/invocationId` в metadata | отмена/429-фолбэк — только события, попыток нигде нет |
| S3a запрос vs исполнение тулзов | `ToolService.execute()` (`tool-executor.ts:392`) / `ToolRunner.callTool/runWithTools` (`parity/tool-runner-service.ts:155/184`, rounds ≤5) / `ComputerUseLoopService.run` (turns ≤30, `claim()` до цикла) / gateway/MCP | `TOOL_EXECUTION_START/SUCCESS/ERROR`, `TOOL_EXECUTED`, `COMPUTER_ACT` | **только `ToolService`** → KV `super_agents_tools` (последние 200). Остальные — только события. `AgentFactory` пишет урезанный `agent-run/{id}/{ts}` (task 300/output 2000 симв.) | `ToolExecution.id=exec-{Date.now()}` **без runId/taskId/agentId**; `TOOL_EXECUTED` без привязки к рану | **join «запрос↔исполнение» отсутствует**; denied/NOT_IMPLEMENTED/`executor_error` durable-следа не оставляют |
| S3b HITL/claim | `agems-approval-service.ts:45-85` (PENDING→APPROVED/REJECTED/EXPIRED→CONSUMED, claim ровно раз) + `approval-execution-bridge-service.ts:54-86` (исполняет **только human-approved**) | `delegates.onResolved` | `approvalRequests` (Dexie, TTL 24ч) | binding agent+tool+task | мост виден только через `TOOL_EXECUTED` |
| S4 результат→финал | `AgentProjectRuntime.runTask` → `updateTaskStatus(completed/failed)`; дебаты: `pipeline-builder.ts:205-227` (responded→memory+timeline+event), `round:end→trimContent(8)`; `sync-manager.ts:622-853` (upsert→DEBATE_ARGUMENT→finalize→history+snapshot) | `runtime:agent:event`, `DEBATE_ARGUMENT/UPDATED`, finalize-события | задача: `ProjectTask.result: string`. **ProjectRun не пишется вообще** (`startRun/completeRun` не вызываются рантаймом), **`toolCalls` — константная `[]`** (`agent-project-runtime.ts:85,122,142,184,195`, верифицировано). Дебаты: снапшот+timeline | `runId=run-*` мёртв без записи; `argumentId` ad-hoc (`-r{round}-{i}` vs `-{agentId}-{i}`) — `debate:fact:checked` не джойнится | финал есть, путь к нему — нет |
| S4b хранение дебатов | `dexie-storage.ts:525` (optimistic version, конфликт→событие), `session-manager-service.ts:26,397` | `DEBATE_SESSION_CONFLICT` | **история = макс. 5 completed**; `cancelled/failed` финализируются, но **в историю не попадают** (`:439`, `sync-manager.ts:755-778`); restore при старте — **только `paused`**, зомби >5мин → `failed` (`debate-engine.ts:212-231`, верифицировано) | `sessionId`, `sessionLinks` (chat↔debate) | вердикт-кэш (50) и карты движка — memory-only → после reload `not_found` |

### 2.3. Обрезки живого текста (несколько независимых)

`DebateMemory.trimContent(8)` каждый раунд; промпт видит последние 6 (`llm-caller.ts:29`) по 800 симв. (`:126`); `debateLiveStore` режет content 2000/стрим 10240/события 500/раунды 200; `Timeline.persist` — последние 500 (100 при квоте) в localStorage; чат — 200 записей (`stores/chat/types.ts:3`), бэкап при выгрузке деградирует до 5 сессий >4.5МБ; traces — 20–30; timeline-сервис — 5000 **in-memory only**; invocation feed/log — 300/500 in-memory.

### 2.4. UI показывает не то, что сохранено

`DebateLivePanel/SpeakerNode` и `useDebateLiveStore` — чистый in-memory (стирается при финализации `sync-manager.ts:793`); `DebateReplayPanel` — `engine.getTimeline`, **после reload пуст**; `EventsTimeline` — in-memory, теряется; `ToolsPanel` — durable-последние-200, но вызовы `ToolRunner` там **невидимы**; `ToolsPanel.exportTools` — только 50. Панель ≠ сохранность — verified.

### 2.5. Тесты пути

Покрыты островами: `event-bus(.test, -deadletter, -registry)`, `tool-executor.test`, `computer-use-loop(.vertical).test` + `agems-approval.test:75-87` (claim-once), `approval-execution-bridge.test`, `chat-executor.test:213-424` (cancel/429→события, не строки), дебатные `orchestrator/migration/prodregression` (порядок ходов, in-memory timeline), `session-manager-service.test:261-350`, `projects-e2e.integration.test.ts:77,169` (проект end-to-end **без ассёртов tool-trail**). **Сквозного `task→run→tool→verdict` durable-теста не найдено.**

---

## 3. Управление агентами — что менеджер может уже сегодня

Всё ниже — `SVC` (вызывается из JS через `kernel/instances/*` + `defaultContainer.get`), auth-границы нет (single-user local-first, `policy-service.ts:111`, `admin-service.ts:473` — admin-токен удалён сознательно):

- **Агенты:** `resolveAgent/spawnAgent/updateAgent/deleteAgent/toggle/activate/pause/archive/restart/signal` (`agent-service.ts:516-808`), родители/дети/delegate (`:699-759`); топология переживает ребут (`super_agents_agent_topology`, `:177-311`).
- **Задачи:** `agemsTaskService.create/list/updateStatus/claimTask(ttl 60s)/release/delete` (Dexie) + `autonomyOrchestrator.assignTask/startTask/...` + `autonomyRunner.runGoal` + `runQueue/execution-queue/task-handoff`. Единого источника нет (Dexie vs in-memory Map vs transient queue).
- **Провайдеры/модели:** `RouterService` — SINGLE SOURCE (`provider-router.ts:112-124`); `updateConfig/setProfile/setFallbackChain/...` callable; `policyService.checkAgentPolicy` enforced на всех путях (`chat-executor.ts:125-145`); `provider-adapter-registry` (circuits/rate). Риск: session-affinity ветка (`router-ranking.ts:94-144`) коротит до policy/budget-проверок — проверить.
- **Ключи:** `keyService.getKeys/addKey/removeKey/recordUsage` — **плейнтекст**; `key-vault.ts:31-42` intentionally NOT wired, IndexedDB plaintext by design; device-key в localStorage. Санитайзеры есть точечно (admin `getProviders` режет ключи, WAL redact, import `[REDACTED]`), но на service-слое `getKeys` отдаёт секреты.
- **Разрешения:** durable HITL (AGEMS approvals, §2.2 S3b) + computer-use (`requireApproval` default, `computer-use-loop-service.ts:90-134`, пресеты 5/10/15/30) + `policyService` + `tool-executor` AST/FORBIDDEN/rateLimit/https-only/`DO NOT TRUST`. **Флагов `ADAPTERS_ALLOW_*` и `require_confirmation` в коде нет** (ближайшее — `requireApproval/computerMode/allowedToolNames`).
- **Жизненный цикл:** `execution-governor` (таймауты, `cancelTree`, `drain`), `lifecycle-manager` (init/start/shutdown, retries 3), `agent-health-monitor` (heartbeat 60с, авто-restart после 3×unhealthy), дебаты `stopDebateInternal`, breaker/decorator'ы адаптеров. **Sidecar start/stop — только `scripts/sidecar-ctl.py`, сервиса в ядре нет.**
- **Мониторинг/уведомления:** `monitoring-service` (снапшот каждые 30с), `admin-service.getSystemHealth`, DLQ-сервис (`super_agents_dlq`, 500, retry/remove), `NOTIFICATION` шина + webhook; бейджи — UI-only (`useNotificationStore`).
- **Гарды циклов:** retryMax 3, autonomy maxRounds 3, дебаты 1–10 (дефолт 5), computer preset-caps, `CONSUMED` single-use, task-locks TTL, `event-bus` idempotency-cache, B-16 same-owner guard. Глобального loop-budget оркестратора нет; unbounded-провайдеры default-allow с warn-once.
- **Аудит/откат:** `admin-service` audit (`super_agents_admin_audit_log`, 5000) — **не логирует ключи/политики/роутер/апрувы**; `config-history` (50 версий, commit/rollback глобального CONFIG, используется time-machine); `agent-config-revision-service` (версийность per-agent, но **`rollback` только возвращает снапшот + событие — применять должен caller, вызовов применения не найдено**); `agems-audit-service` (таблица `auditLogs` есть, **`log()` не вызывается никем** — верифицировать при внедрении).

Тесты менеджмента: approvals/HITL/claim, computer-loop, agent-service (resolve/persist), config-history/registry, health-monitor, router/policy/keys/budget, execution-governor/queue/lifecycle, browser-use/sidecar-ctl, autonomy/task-handoff, B-16. **Нет тестов:** `budget hardStop реально блокирует`, `admin audit покрывает все мутации`, `auditLogs пишутся`.

---

## 4. Связность: собирается ли полный след одного выполнения

**Частично.** Что джойнится: `projectId→taskId` (таски), `invocationId→sessionRef→debate/room`, `sessionId→arguments/memory/timeline/verdict` (внутри дебата), `approval binding`. Что **не** джойнится: `toolCalls→run` (пусто/нет записи), `TOOL_EXECUTED→invocation/session`, `COMPUTER_ACT→agent/result`, `argumentId` (два формата), `SyncEntry.owner` (не персистентен), попытки/ретраи (нигде), `cancelled/failed`-сессии (вне истории). Полный след `проект→задача→ран→агент→тулзы→ошибки→конфиг→финал` **после reload не восстанавливается**.

---

## 5. Матрица

| Компонент | Исполнение | События | Хранение | Связь | UI | Тесты | Проблема |
|---|---|---|---|---|---|---|---|
| DebateMemory | record/trim(8) | `agent:responded` | heap + `debateSessions.memory` | sessionId | DebatePanel/live | in-mem round-trip | trim до save; persona мертва (нет conclusion) |
| debateTimeline | record | — | localStorage 500/100 | sessionId | Replay (in-mem!) | — | Replay пуст после reload |
| crossDebateMemory | indexVerdict | VERDICT_GENERATED | keyValue (дока врёт про таблицу) | sessionId | — | stub-store | нет потребителя |
| DebateRAG | retrieve/inject | — | embeddings без store | topic | — | — | индекс, вероятно, пуст |
| crystals | bridge on verdict | VERDICT_GENERATED | crystals Dexie | originId | — | — | пишут, не читают |
| persona-стеки (lt/cog/scoped/blocks/agent) | DAL | — | Dexie да | ownerId/scope | Settings? | dal-тесты | не wired в дебаты |
| EventBus | emit lossy | реестр ~2600 | нет (DLQ in-mem 1000) | — | EventsTimeline (in-mem) | bus/registry/DLQ | reload всё теряет |
| ToolService | execute | start/success/error | KV посл. 200 | exec-id без связей | ToolsPanel | executor | единственный durable-писатель |
| ToolRunner/computer/browser | run/callTool | TOOL_EXECUTED/COMPUTER_ACT | нет | ticketId | — | loop/bridge | args/results transient |
| AgentProjectRuntime | runTask | runtime:agent:event | нет (`toolCalls=[]`) | taskId | AgentTasksPanel | runtime | ProjectRun не пишется |
| invocations | invoke | requested…done | invocations Dexie | invocationId/sessionRef | store (feed in-mem) | store | нет failed/cancelled/счётчиков |
| AGEMS approvals | request/resolve/claim | delegates | approvalRequests Dexie | binding | Approvals | approval/claim | ок; мост только human |
| debateSessions | snapshot/restore | DEBATE_* | Dexie; история 5 completed | sessionId/links | DebatePanel/stores | session | cancelled/failed вне истории; restore только paused |
| chat sessions | send/stream | chat:stream:* | sessions 200 | sessionId | ChatPanel | chat/executor | бэкап деградирует |
| traces/cognitive | record | cognitive:trace:* | traces-таблицы, капы 20–30 | traceId | TracesPanel | trace | активные шаги in-mem |
| admin audit / config-history / agent-revisions / agems-audit | log/commit/rollback | NOTIFICATION | audit 5000 / config 50 / rev per-agent / auditLogs | — | Settings? | config/revision | ключи/политики/апрувы не логируются; agems.log без вызовов; rollback ревизий не применяется |

---

## 6. План внедрения (предложение, НЕ реализация — ждёт согласования)

Порядок по приоритету из ТЗ (история → память → операции → менеджер → цикл):

1. **Durable tool-trail.** Расширить `ToolExecution` полями `runId/taskId/agentId/invocationId/sessionId`; единый sink, в который пишут `ToolRunner`, computer-loop и gateway (переиспользовать `eventLog`/`super_agents_tools`, новую таблицу — только если не хватит). Denied/ошибки — тоже строки, не только success. Приёмка: join `task→toolCalls→results` после reload.
2. **ProjectRun по-настоящему.** Заполнять `toolCalls`, вызывать `startRun/completeRun`, счётчик `attempts`. Приёмка: ран виден в Dexie со статусом и тулзами.
3. **Стабильные связки.** Единый формат `argumentId`; `sessionRef` везде; `owner` персистентно; `cancelled/failed`-сессии — в историю с пометкой (отдельно от completed-5). Приёмка: след собирается одним запросом по `taskId`.
4. **Память после истории.** Ставить `conclusion` в цепочки (оживить persona); `trimContent` — после save, не до; подключить store к embedding-pipeline ИЛИ выключить RAG честно; решить судьбу дублей (cross-index vs crystals vs persona-стеки) одним контрактом; `restoreSession` — для всех не-терминальных, не только paused. Приёмка: reload-тест `save→destroy→restore→prompt содержит старое`.
5. **Менеджер-наблюдатель (read-only сначала).** Сервис поверх существующих SVC: здоровье, свежие ошибки (DLQ+feed), stuck-инвокации, протухшие approvals. Без прав на запись на этом этапе.
6. **Разрешённые операции.** Минимальный набор через существующие SVC: `restartAgent`, повтор failed-таска, смена fallback-профиля роутера, `retry` DLQ. Каждая — через approvals (CONSUMED) + запись в admin audit. Приёмка: 9 сквозных сценариев из §7, включая блокировку без разрешения.
7. **Аудит/откат.** Дописать ключи/политики/роутер/апрувы в admin audit; подключить вызовы `agemsAuditService.log`; заставить `rollback` ревизий применяться (или удалить). Приёмка: каждое изменение конфига находится в журнале с actor+diff.
8. **Замкнутый цикл + e2e.** Менеджер: обнаружил → разрешённое действие → проверка → отчёт в журнал → эскалация человеку при неуспехе. Начать с одной команды и 3–4 операций.

Риски: шина останется lossy — менеджер обязан гидрироваться из Dexie, не из событий; рост записей (капы: tool-trail как у `super_agents_tools`, 200–500); session-affinity в роутере проверить до выдачи менеджеру прав на провайдеры; ключи — до отдельного решения по шифрованию менеджеру их не показывать (только fingerprint'ы).

## 7. Сквозные сценарии приёмки (из ТЗ, без изменений)

1. Вася запускает задачу и вызывает инструмент. 2. История сохраняет запрос, исполнение и результат. 3. Страница перезагружается. 4. История восстанавливается в правильном порядке. 5. Менахель обнаруживает инжектированную ошибку. 6. Выполняет разрешённое восстановление. 7. Система проверяет устранение. 8. Журнал хранит действия менахеля. 9. Операция без разрешения блокируется.

## 8. Оговорка о достоверности

Находки собраны read-only проходами с привязкой `файл:строка`; три критических утверждения перепроверены вручную (`conclusion` не ставится в живом потоке; restore только `paused`; `toolCalls: []`). Утверждения вида «вызовов не найдено» — по grep на момент аудита; перед внедрением каждый такой пункт перепроверить. Код не менялся.
