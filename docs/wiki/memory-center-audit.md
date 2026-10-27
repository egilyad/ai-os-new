# Memory Center — аудит памяти SuperAgents OS

> Статус: **проверено по коду** (Dexie-схема, сервисы, сторы).
> Источник истины: `src/kernel/services/dexie-schema.ts`, `src/kernel/services/*`, `src/stores/*`.

## 1. Физическое хранилище (главное)

Вся основная память системы живёт в **одной базе IndexedDB** через Dexie: `super_agents_os_v4` (класс `SuperAgentsDB`). Плюс отдельные лёгкие механизмы (localStorage/SSR). Это ключевой вывод: **единое физическое хранилище**, десятки таблиц, но множество логических «владельцев».

## 2. Карта категорий → таблиц → владельцев

### 🗣️ История общения / чаты
- Таблицы: `sessions` (ChatSession), `keyValue` (служебное).
- Сервисы: `chat-executor.ts`, `useChatStore.ts`, `session-memory-service.ts`.

### ⚔️ Дебаты
- Таблицы: `debateSessions`, `debateVerdicts`, `debateTimeline`, `debateOverrides`, `sessionLinks`, `eventLog`.
- Сервисы: `debate-engine.ts`, `debate-sync-manager.ts`, `debate-memory.ts`, `cross-debate-memory.ts`.

### 🤖 Агенты
- Таблицы: `agentMemory`, `agentExecutions`, `agentMetrics`, `agentConfigRevisions`, `agentSkills`, `agentTools`, `agentResponsibilities`, `agentApiKeys`, `agentBudgets`, `agentRepositories`.
- Сервисы: `agent-service.ts`, `agent-journal-service.ts`, `agent-health-monitor.ts`.

### 🧠 Знания / Wiki / Wiki-Brain
- Таблицы: `memories` (MemoryEntry), `ltMemories` (LongTermMemory), `memoryLinks`, `knowledgePackages`, `knowledgeSources`.
- Отдельные Dexie-хранилища Wiki-Brain: `src/kernel/services/wiki-brain/store.dexie.ts`.
- Сервисы: `memory-engine.ts`, `memory-orchestrator.ts`, `project-knowledge-service.ts` (ассистент).

### 🔬 Исследования / знаниевая фабрика
- Таблицы: `crystals`, `crystalVersions`, `junctions`, `synthSessions`, `synthPerspectives`, `genJobs`, `forumTopics`, `forumPosts`, `forumVotes`, `forumSubs`, `scenarios`, `improvements`, `strategies`, `decompositions`, `counterfactuals`, `simulations`, `evalRuns`, `benchmarks`.
- Сервисы: `crystal-vault/`, `junction-engine/`, `synthesis/`, `knowledge-generator/`, `research-engine-service.ts`, `hypothesis-service.ts`, `research-report-service.ts`.

### ⚙️ Конфигурация
- Таблица: `keyValue` (KV-хранилище).
- Сервисы: `config-service.ts`, `settings-service.ts`, `admin-service.ts` (auditLog).

### 📋 Выполнение / задачи / проекты
- Таблицы: `agemsTasks`, `taskComments`, `taskLabels`, `taskWorkProducts`, `taskTriggers`, `projects`, `projectTasks`, `projectRuns`, `projectFiles`, `projectArtifacts`, `projectAssignments`, `runQueue`, `agentLoops`, `groupChats`, `memoryBlocks`, `traces`, `cognitiveTraces`, `eventLog`.
- Сервисы: `agems-task-service.ts`, `project-service.ts`, `agent-project-runtime.ts`, `runqueue-service.ts`, `cognitive-service.ts`.

### 🛰️ Флот / governance / parity
- Таблицы: `crews`, `crewTasks`, `councilSessions`, `councilMessages`, `councilVotes`, `graphs`, `graphRuns`, `graphCheckpoints`, `graphDecisions`, `invocations`, `invocationPolicies`, `invocationCosts`, `directorSessions`, `workflows`, `a2aAgents`, `fedPeers`, `handoffs`, `collabContracts`, `marketListings`, `marketBids`, `capabilities`, `trustScores`, `policyRules`, `govRoles`, `provenanceNodes`, `provenanceEdges`, `osSnapshots`, `auditLogs`, `auditLog`, `notifications`, `mcpServers`, `toolGrants`, `skillManifests`, `sandboxTickets`, `hierarchyNodes`, `missionWatches`, `mobileSessions`, `extensions`, `bundles`, `surfaces`.

### 👤 Пользователь / ключи
- Таблицы: `apiKeys`, `notes`, `personaProfiles`, `voices`, `personaDepths`, `sharedContexts`, `contextEntries`, `goals`, `cogMemories`, `memPolicies`, `healthSignals`, `scopedMem`, `trainGuides`, `orgs`, `intents`, `modalCaps`, `societyNorms`, `redFindings`.
- Сервисы: `key-management/`, `key-state-store.ts`, `persona-service.ts`.

## 3. Механизмы поиска

- **MemoryEngine** (`memory-engine.ts`): гибридный поиск — BM25 (Orama) + семантические эмбеддинги (Transformers.js). Индексирует `memories`.
- **Wiki-Brain** (`wiki-brain/`): собственный Dexie-стор + семантический смысловой поиск статей.
- **MessageSearchPanel**: `messageIndex` (индекс сообщений чата).
- **Knowledge**: `project-knowledge-service.ts` — контекст для ассистента.
- Остальные таблицы — **без общего семантического индекса** (точечные запросы по ключам).

## 4. Пробелы интеграции

- Нет **единого реестра источников памяти** (общий каталог «что где лежит»).
- Нет **общей карты происхождения** (откуда запись, кто создал, кто читает).
- **Ассистент**: использует `project-knowledge-service` (статическая база о системе), но его **долговременная память/история действий** отдельно не показана и не агрегируется.
- **localStorage/SSR** (`local-storage-adapter.ts`, `ssr-storage.ts`) — вне Dexie, не учтены в единой карте.
- Нет **общего семантического поиска** по всем таблицам — только по `memories` и Wiki-Brain.

## 5. Дубликаты / риски

- `auditLog` и `auditLogs` — две таблицы аудита (AGEMS vs ядро) — вероятный дубликат.
- `eventLog` (EventRecorder) и `traces`/`cognitiveTraces` — перекрывающиеся журналы событий.
- `sessions` (чат) и `directorSessions` (разговорные сессии директора) — разные типы сессий.
- `memories` и `ltMemories` — кратковременная vs долговременная память.
- `keyValue` используется и конфигом, и служебными состояниями — нет разделения по назначению.

## 6. Рекомендации по Memory Center

1. **Memory Registry**: каталог источников (таблица → владелец → API → статус), без копирования данных.
2. **Overview**: карта категорий с честными счётчиками (из реальных API, не фиктивными).
3. **Storage Map**: таблица «владелец / хранилище / читатели / писатели / поиск».
4. **Explorer**: переходы к оригиналам (через существующие панели/роуты).
5. **Search**: агрегация существующих поисков (MemoryEngine + Wiki-Brain + messageIndex), не новый движок.
6. **Health & Gaps**: недоступные источники, дубликаты (`auditLog` vs `auditLogs`), пробелы.

## 7. Проверить дополнительно

- Реальные API чтения/записи каждого сервиса (контракты).
- Подтверждённое поведение восстановления после перезапуска (персистентность).
- Тестовое покрытие по каждой таблице.
- Какие сервисы реально «владеют» данными (а не только пишут).
