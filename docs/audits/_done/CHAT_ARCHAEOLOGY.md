# CHAT_ARCHAEOLOGY.md — карта существующей Chat-системы SuperAgents OS

> Этап 1 (AUDIT). Код не менялся. Только исследование.
> Дата: 2026-09-17. Ветка: `fix-debate-text-truncation`.
> Маршруты: `/chat`, `/chat-sessions`, `/session-hub`.

---

## 1. UI — панели и роуты

Роутинг generic: `src/routes.tsx:211-252` итерирует `NAV_SECTIONS`, путь по умолчанию `/${id}` (`:224`).
Секция чата: `src/route-registry-core.ts:60-86` (`section-chat`).
Маппинг: `src/route-imports.ts:279-281`.

| Route | Компонент | Файл |
|---|---|---|
| `/chat` | `ChatPanel` | `src/components/ChatPanel/ChatPanel.tsx:22` |
| `/chat-sessions` | `ChatSessionsManagerPanel` | `src/components/ChatSessionsManagerPanel.tsx:108` |
| `/session-hub` | `SessionHubPanel` | `src/components/SessionHubPanel.tsx:119` |

Состав `ChatPanel/`: `ChatPanel.tsx`, `ChatSidebar.tsx`, `ChatHeader.tsx`, `ChatMessagesSection.tsx`,
`ChatInputArea.tsx`, `ChatSystemPromptSection.tsx`, `ChatSearchBar.tsx`, `ChatStatusToast.tsx`,
`ChatExportOverlay.tsx`, `MessageSearchPanel` (slide-over), `chat-panel-utils.ts`.

### 1.1 Выбор provider/key/model в `/chat`

- Активные ключи: `useKeyList()` → `src/stores/useKeyStore.ts:218-222` (только `status==='active'`).
- Локальный стейт выбора (НЕ в сторе): `ChatPanel.tsx:80-88`
  `selectedKeys: string[]`, `selectedModel: string`, `selectedModelPerKey: Record<keyId, model>`.
- Дефолты: `globalDefaults` из `settingsService` (`chatDefaultProvider/Model/KeyId`,
  `src/kernel/services/settings-service.ts:218-223`, типы `src/kernel/contracts/settings.ts:50-52`);
  fallback `key.availableModels?.[0] || DEFAULT_MODELS[provider]`
  (`DEFAULT_MODELS` — `src/components/ChatPanel/chat-panel-utils.ts:11-16`).
- Рендер: `ChatInputArea.tsx:68-120` (key pills, **мультиселект**), `:122-183` (model `<select>` на каждый ключ,
  `models = k.availableModels || []`).
- Отправка: `ChatPanel.tsx:175-187` —
  `sendMessage(selectedKeys.map(id => ({provider:'auto', model:selectedModelPerKey[id]||selectedModel, keyId:id})), text)`.
  Фан-аут по целям: `src/stores/chat/chat-send-message.ts:242-251` (по одному `chat:send` на цель).

### 1.2 Переключение key/model — новая беседа НЕ создаётся

- `ChatPanel.tsx:393-399` смена ключа → `switchKey(ids[0])`; `:400-414` смена модели → `switchModel(provider, m)`.
- `switchModel` (`src/stores/chat/store.ts:497-552`): пишет `currentProvider/currentModel` на **активную**
  сессию в Dexie + zustand, дописывает `system`-entry `🔄 Switched to provider/model`. `createSession` не вызывается.
- `switchKey` (`store.ts:554-593`): аналогично для `currentKeyId`.
- Возврат к сессии восстанавливает выбор: `ChatPanel.tsx:106-120` + `getSessionConfig` (`store.ts:595-605`).
- Новая беседа — только явный `handleNewChat` (`:244-254` → `createSession + setActiveSessionId`).

### 1.3 `ChatSessionsManagerPanel` и `SessionHubPanel`

**ChatSessionsManagerPanel** (`src/components/ChatSessionsManagerPanel.tsx`):
- Данные: тот же `useChatStore` (`sessions/activeSessionId/isLoaded`, `:111-113`) + линки через
  `sessionManagerService.getLinked/link` (`:130-144,205-220`).
- Секции: rename, pin, archive/unarchive, delete, Details (`currentProvider/currentModel`, `:470-481`),
  tags, folder, Linked Sessions, последние 5 сообщений.
- Открытие: клик по списку — только `setActiveSessionId` in-place (`:265`);
  кнопка `Open in Chat` — `navigate('/chat?session=<id>')` (`:411-415`).

**SessionHubPanel** (`src/components/SessionHubPanel.tsx`):
- Мержит `useChatStore.sessions` (`:122`) + `useDebateSessionStore.sessions` (`:123`) в `SessionItem{type:'chat'|'debate'}`.
- `handleOpen` (`:207-213`): chat → `/chat?session=<id>`; debate → `/debate?mode=runtime&sessionId=<id>`.
  Linked chip (`:466-473`) — аналогично.
- ⚠️ **`/chat?session=<id>` — write-only/dead**: в `ChatPanel/*` **ноль** использований
  `useSearchParams/useLocation/useParams`; `useChatStoreHydration.ts:124-135` всегда ставит
  `activeSessionId = cleaned[0].id`, игнорируя query. Открытие из менеджера/хаба сессию не переключает.
  (Контраст: `DebatePanel.tsx:54`, `DebateArena.tsx:13` `useSearchParams` используют.)

### 1.4 Мёртвый UI

- В самих chat-панелях нет `ComingSoon/TODO/FIXME/stub` (только i18n `placeholder=` и тестовые моки).
- `ComingSoonPanel` к chat-роутам не привязан (`route-imports.ts:236,272-474`).
- Мок: `src/llm/mock/mock-adapter.ts` (`mock-model-v1/v2`), к Chat UI не подключён.

---

## 2. Stores

`src/stores/chat/`: `store.ts` (Zustand `useChatStore`), `types.ts`, `chat-send-message.ts`
(`sendMessage`), `chat-event-handlers.ts` (`MESSAGE_RESPONSE`/`STREAM_*` → zustand),
`store-helpers.ts`, `service-deps.ts` (DI-граница), `hydration.ts` (Dexie liveQuery + debounced persist),
`hooks.ts`.

### 2.1 Shape (`src/stores/chat/types.ts:61-70`)

` sessions: ChatSession[]`, `activeSessionId: string`, `activeRequestIds: Set<string>`,
`deletedIds`, `deletedAtTimestamps`, `isLoaded, hasMoreSessions, systemPrompt`.

`ChatSession` (`types.ts:31-47`, зеркало в `src/kernel/contracts/storage/session-store.ts`):
`id, title, history: ChatEntry[], createdAt, updatedAt, version?, tags?, folder?, isArchived?, isPinned?,
summary?, linkedDebateId?, currentProvider?, currentModel?, currentKeyId?`.
**Поля `agentId` нет.**

`ChatEntry` (`types.ts:20-29`):
`id, requestId?, role: 'user'|'system'|'assistant', text, responses: ChatResponse[], timestamp,
parentId?, recalledMemories?`.

### 2.2 Ключевые actions (`types.ts:72-108`, impl `store.ts`)

`sendMessage(targets:{provider,model,keyId?}[], text, ...)` (`chat-send-message.ts:29-285`),
`switchModel` (`store.ts:497-552`), `switchKey` (`:554-593`), `getSessionConfig` (`:595-605`),
`setActiveSessionId, createSession, deleteSession, forkSession, renameSession, archive/unarchive,
tag, moveToFolder, pin, importSessions, editEntry, clearHistory, cancelSending/cancelMessage, loadMoreSessions`.

**Одна беседа на несколько целей — да:** `chat-send-message.ts:169-178` создаёт **один** `ChatEntry`
с `responses: targets.map(...)` (по одному `loading`-ответу на цель); история (`currentHistory`, `:65-67`,
`MAX_HISTORY=200`, `types.ts:3`) всегда от `activeSessionId`; `switchModel/switchKey` историю не форкают.

---

## 3. Services, contracts, runtime-цепочка

### 3.1 Services (`src/kernel/services/`)

| Сервис | DI | Роль |
|---|---|---|
| `chat-executor.ts` — `ChatExecutor` | ✅ `chatService`, `phase6-high-level.ts:103-128` | Подписка `SEND_MESSAGE` (`:30-41`), `executeRequest` (`:98-666`), race (`:668-782`), fallback/downgrade, `STREAM_*` + `MESSAGE_RESPONSE` |
| `llm-client-service.ts` — `LLMClientService` | ✅ `phase5-routing-llm.ts:167-178` | Резолв adapter+key (`selectWithBurst/selectFromPool`), `chat`/`sendMessage`, `onChunk`-стриминг |
| `provider-adapter-registry.ts` | ✅ | `getAdapter` → `AdapterFactory` |
| `provider-runtime/provider-service.ts` | ✅ `providerRuntimeService` | Инстансы/сессии/бюджет (per-request `createSession` удалён, см. `chat-executor.ts:509-511` C-69) |
| `conversation-director-service.ts` + `conversation-execution-engine.ts` (`ChatExecutionEngine`) | ✅ `conversationDirectorService`, `phase20-director.ts:33-46` (движок inline, без отдельного токена; ест `chatService`) | Director/Debate-терны через тот же `chatExecutor` |
| `chat-summarizer-service.ts`, `chat-bookmarks-service.ts` | ✅ (side-фичи, не в send path) | Саммари, букмарки/fork/rewind |
| `conversation-orchestrator.ts` | ❌ **orphan** — нет `register(...)`; только `new` в `conversation-director-service.ts:147`, `conversation-backed-debate-orchestrator.ts:86`, тестах | — |
| `ChatExecutionEngine` | ❌ без токена (только `new` в `phase20:38`) | — |

⚠️ `ChatExecutor.init()` (подписка `SEND/CANCEL`) не привязан к lifecycle (`phase6` — bare `register`);
Tier5 содержит `chatService`, но `LifecycleManager` инитит только `init+destroy`-записи. В проде靠
первый `lazyService('chatService')` (`instances/services-core.ts:71`) + lazy-триггер bootstrap —
вызов `init()` на этом пути **проверить**.

### 3.2 Contracts

- Сообщения/LLM: `src/kernel/types/chat-types.ts:9-50` (`ChatResponse` с `provider,model,keyId,content,
  latency,status,tokens?,ttft?,tps?,cost?,strategy?,finishReason?`; `QueuedRequest` с `messages: ChatMessage[]`);
  `src/kernel/types/llm-types.ts:15-29,54-77,98-134` (`ChatMessage`, `ProviderResponse`, `SendMessageOptions`);
  `src/kernel/contracts/provider-adapter.ts:61-145` (`IProviderAdapter{sendMessage,streamMessage?...}`);
  `src/kernel/contracts/chat.ts:6-155` (`ChatServiceDeps`).
- Сессии: `src/kernel/contracts/storage/session-store.ts:3-46` (канонический `ChatSession`/`ChatEntry`, `SessionStore` CRUD).
- События: `src/kernel/types/event-map.ts`, `src/kernel/events/event-registry.ts:198-225`
  (`SEND_MESSAGE`/`CHAT_SEND_MESSAGE='chat:send'`, `CANCEL_MESSAGE`, `MESSAGE_RESPONSE='chat:response'`),
  фасад `src/kernel/events/chat-events.ts:3-14`.
- ⚠️ `src/kernel/contracts/conversation/*` (`ConversationSession`, turns, orchestrator, director…) —
  **другой домен** (director live-run), не 1:1 с chat-сессией. Путать нельзя.

### 3.3 Полная цепочка одного сообщения (файл:строка)

1. **UI**: `ChatPanel.tsx:28,175-184` → `sendMessage(targets, text)`; `ChatInputArea:386-415` собирает ключи/модель.
2. **Store/сборка контекста**: `chat-send-message.ts:33` → `currentHistory` (`:65-67`) → memory RAG + workspace (`:94-129`) →
   `sanitize` (`:131-137`) → **сериализация истории в `messages: ChatMessage[]`** (`:139-167`, все prior `done`-ответы
   независимо от provider/model) → optimistic write-through `sStore.syncSessions` **до** emit (`:204-227`) →
   zustand-append (`:229-236`) → `requestEntryMap` (`:238-240`) → `emit SEND_MESSAGE` на каждую цель (`:242-251`).
3. **Service**: `chat-executor.ts:30-41` подписка → `handleMessage` (`:63-71`) → prompt join + policy (`:119-151`) →
   security scan (`:154-180,260-296`) → auto-route (`:201-232`) → cache (`:300-328`) → `STREAM_START` (`:364-369,401-406`) →
   `llmClient.sendMessage(..., onChunk → STREAM_CHUNK)` (`:372,407,330-337,413-420`) →
   `MESSAGE_RESPONSE{provider:currentProvider, model:effectiveModel, keyId, tokens, tps, finishReason}` (`:471-484`) →
   `keyService.recordUsage` + cache set (`:486-507`) → `STREAM_END` (`:513-523`) / `emitError` (`:784-802`,
   оба `MESSAGE_RESPONSE error` + `STREAM_ERROR`).
4. **Runtime**: `llm-client-service.ts:35-44` резолв provider/adapter/model/apiKey → `:63-81` streaming-агрегация
   или `:117-128` `adapter.sendMessage`.
5. **Provider/Adapter/API**: `provider-adapter-registry.ts:55-65` → `llm/registry/adapter-factory.ts:100-224`
   (`SUPPORTED_PROVIDERS`, `adapter-factory.ts:55-80`: gemini, openrouter, nvidia, groq, openai, together,
   fireworks, deepseek, mistral, cohere, azure, huggingface, cerebras, cloudflare, perplexity, blackbox,
   scaleway, cometapi, github, ollama, lmstudio, kimi, minimax, qwen) + декораторы
   `RateLimit→Retry→CircuitBreaker→PriorityQueue→CostManager→Cache→Logging` (`:229-269`) →
   `base-adapter.ts:85-103` → HTTPS API → `ProviderResponse` (`llm-types.ts:54-77`).
6. **Response→UI**: `chat-event-handlers.ts:28-56` (`MESSAGE_RESPONSE` merge), `:60-74` (`STREAM_START`),
   `:77-91` (`STREAM_CHUNK`), `:94-125` (`STREAM_END → done`), `:128-157` (`STREAM_ERROR`).
7. **Persistence**: только стор (см. §5): write-through юзера + 1s debounced flush всего остального.

### 3.4 Per-message execution metadata — ЕСТЬ, per-response

Хранится в `ChatEntry.responses: ChatResponse[]` (персистится в Dexie-блобе сессии).
Поля: `provider, model, keyId, content, latency, status, tokens?, ttft?, tps?, cost?, strategy?,
finishReason?, timestamp?` (`kernel/types/chat-types.ts:9-26`).
Пишется при создании (`chat-send-message.ts:169-178`) и дополняется в `chat-executor.ts:472-484`
(⚠️ `provider:currentProvider` — может отличаться после auto-route/fallback/race; `model:effectiveModel` —
после downgrade `:645-651`). Отдельной execution-log таблицы нет — история запрашивается сканом
`session.history[].responses[]`. На уровне сессии только дефолты `currentProvider/currentModel/currentKeyId`.

---

## 4. Provider / Key / Model registries

- **Provider registry**: `src/kernel/services/provider-adapter-registry.ts:11` (in-memory Map → `AdapterFactory`);
  `hasAdapter/getAllProviders/getProviderRuntimeStatus/resetCircuitBreaker/clearAllCaches` (`:67-121`).
- **Key registry**: `src/kernel/services/key-management/key-registry.ts:50` (`keys`, `#keyMap`; `loadKeys:222`
  ← `dexie.apiKeys`; `saveKeys:568` → `vault.encryptAllKeys + keyStore.bulkPut`).
  Фасад `key-service.ts:81` (`KeyRegistry+KeyHealth+KeyQuotas+KeyAnalytics+KeyModels+KeyPoolSelector…`).
  Dexie: `dexie-storage.ts:65-109` (`DexieKeyStore`, таблица `apiKeys`).
  UI-обёртка: `src/stores/useKeyStore.ts:38`, live-зеркало `src/stores/key-store-init.ts:29-73`.
- **Model registry — ЦЕНТРАЛЬНОГО КАТАЛОГА НЕТ. 3-tier fallback:**
  1. `src/kernel/utils/provider-default-models.ts` (`PROVIDER_DEFAULT_MODELS`, `PREFERRED`, `DISPLAY_NAMES`);
  2. `src/kernel/services/key-management/key-models.ts:18-35` (`FALLBACK_MODELS`, хардкод);
  3. Live discovery `key-models.ts:44-78` (`refreshModels`: `adapter.getAvailableModels(key)` → `modifyKey(availableModels)`, иначе fallback; ошибка → `updateKeyStatus`).
- **Как UI узнаёт модели ключа**: `AddKeyModal.tsx:153-165` (`verifyKey` + `getAvailableModels` → `DefaultModelStep`);
  Chat берёт `key.availableModels?.[0] || DEFAULT_MODELS[provider]` (`ChatPanel.tsx:71-79`, `ChatInputArea.tsx:86-94,135`).
  Ручное обновление: `KeyTable/OverviewTab.tsx:66`, `ToolsTab.tsx:52` (`refreshModels`).
- **Health/capability**: `key-health.ts:137-244` (`checkHealth`: `adapter.checkHealth` или fallback URL + таймаут;
  `checkAllHealth` sequential + 5min failure cache); fleet-саммари
  `src/kernel/utils/provider-fleet-health.ts:39-87` (`ready/degraded/broken/no_adapter/unconfigured`);
  runtime-gating `key-service.ts:694-706` (circuit/rate-limit → `getProviderRuntimeStatus`).
- **Параллельных key-хранилищ — 4 механизма** (активен только №1):
  1. `key-vault.ts:38` (`KeyVault`, AES-GCM+PBKDF2) — **сознательно NOT wired, plaintext by design** (`:29-37`),
     auto-unlock device-ключом из localStorage (`key-service.ts:399-413`);
  2. Legacy `SecurityService` (`src/kernel/security.ts:17`) — только миграция (`dal/key-migration.ts:120-121`,
     `bootstrap-key-init.ts:20-23`), в теле сервиса не вызывается;
  3. `virtual-key-service.ts:36` (`vk_*` → realKeyId, `setKv('virtual_keys')`, только `btoa`-маскировка — не граница безопасности);
  4. `crystal-vault-service.ts:30` — другой домен (memory-crystals), к API-ключам отношения не имеет.

---

## 5. Persistence

- **Dexie**: `src/kernel/services/dexie-schema.ts:165-170` (`SuperAgentsDB`: `sessions: Table<ChatSession>` `:169`,
  `apiKeys` `:168`, …; индекс `sessions: 'id,title,updatedAt'` `:302`).
  Контракт `contracts/storage/session-store.ts:34-42`; impl `dexie-storage.ts:262-362`
  (`put` с version CAS `:267-277`, `syncSessions` `:328-341`, `listSessions orderBy(updatedAt).reverse()` `:283-290`).
- **Кто пишет**: юзер — write-through на уровне стора **до** emit (`chat-send-message.ts:204-227`,
  ошибка persist → throw + `Failed to save message`); ассистент — **только in-memory**
  (`chat-event-handlers.ts:76-125`, ни одного `sStore.put/sync` на `STREAM_END`); долговечность ассистента —
  1s debounced flush подписки (`hydration.ts:178-187` → `flush:47-69` → `syncSessions`).
  Плюс прямые записи: `createSession` (`store.ts:252-273`), `editEntry:177-183`, `clearHistory:235`,
  `forkSession:364`, `importSessions:483`, `switchModel:532`, `switchKey:577`.
- **Зависимость от монтирования — ЧАСТИЧНО ДА**: `useChatStoreHydration()` смонтирован один раз в
  `AppLayout.tsx:159`; без него нет автозагрузки (`liveQuery ... limit(100)`, `hydration.ts:116-117`),
  нет 1s-flush, нет `visibilitychange`/`beforeunload`-бэкапа в localStorage
  (`super_agents_chat_sessions_backup`, `:194-212`, restore `:91-108`). Прямые `put/syncSessions` работают headless.

---

## 6. Agent-интеграция

- Ядро: `AgentService` (`agent-service.ts:71`, `resolveAgent:337-390`), `AgentFactory`
  (`capability/agent-factory.ts:13-62`), контракт `ResolvedAgent` (`contracts/conversation/agent-resolver.ts:13-57`),
  персоны `AGENT_PROFILES` (`kernel/state/agent-profiles.ts:23-566`, 25 EN + 28 RU)
  — ⚠️ файл помечен **LEGACY DUPLICATE**, каноника — `AGENT_REGISTRY` в `src/kernel/agents/`.
- Мост в chat-runtime: `ChatExecutionEngine` (`conversation-execution-engine.ts:23-143`) строит
  `QueuedRequest{provider:'auto', model: agent?.model ?? 'default', messages:[persona?, prompt],
  options.metadata:{agentId, sessionId, …}}` (`:40,70-91,127-128,137`) — доказательство persona+model-инжекта
  для Director/Debate-тёрнов.
- `ChatExecutor` уже прокидывает `options.metadata.agentId/invocationId` (`:121,520-522`), гейтит
  `policyService.checkAgentPolicy(agentId,provider,model)` (`:128-141`, 403 `PolicyError`), `agentId` в `STREAM_END`.
- **Прицепить Agent к существующей ChatPanel-беседе — НЕЛЬЗЯ (UI/session binding отсутствует):**
  `ChatSession` без `agentId`, `sendMessage targets` только `{provider,model,keyId}`,
  `chat-send-message.ts:242-251` `metadata.agentId` не ставит, в `ChatPanel.tsx:177-183` нет agent picker'а.
  Параллельные чаты (`TeamChat.tsx` — локальный мок; `GroupChatPanel` + `rivals/groupchat-service.ts`;
  `conversation-director-service.ts`) к активной ChatPanel-сессии не привязаны.
- Смена модели при аттаче: контракта detach нет (аттача нет). Единственные гарды —
  in-flight запрет (`store.ts:497-505` `Cannot switch model while a message is being sent`) и context-window
  warning (`:514-519`); pinned-model passthrough (`agent-resolver.ts:32-36`: пусто/`auto`/`default` = route runtime);
  Director-тёрны **игнорируют** `ChatSession.currentModel`, Chat-тёрны игнорируют agent pin.

---

## 7. События (EventBus)

Источник: `src/kernel/events/event-registry.ts` (реэкспорт `event-names.ts:7`), фасад `chat-events.ts:3-14`.

| Событие | Registry | Эмиттеры | Подписчики |
|---|---|---|---|
| `chat:send` | `198-221` | `chat-send-message.ts:243`, `QuickTestSection:55`, `ProviderTableRow:140`, `OpenRouterKeyTable:65`, `GroqKeyTable:64`, `NvidiaKeyTable:71`, `admin-service.ts:375` | `chat-executor.ts:34`, `cognitive-service.ts:229` ⚠️ (второй потребитель SEND — риск двойного исполнения), `message-index-service.ts:87` |
| `chat:cancel` | `222-223` | `store.ts:104,137,164,229`, provider-таблицы | `chat-executor.ts:37` |
| `chat:response` | `224-225` | `chat-executor.ts` (13 точек) | `chat-event-handlers.ts:28`, `conversation-execution-engine.ts:127`, `key-registry.ts:118`, provider-панели, e2e |
| `chat:stream:start/chunk/end/error` | `239-339` | `chat-executor.ts:364,401 / 331,414 / 513 / 796` (+`probe-service.ts:385`) | `chat-event-handlers.ts:60,77,94,128`, `agent-service.ts:219` (stats), `budget-service:193`, `provider-tracker:81`, `trace-service:323` … |
| `chat:model:select` | `226-230` | только `AquariumPanel:801` | **нет — dead** |
| `chat:target:start` | `231-238` | только `SandboxTab:195` | **нет — dead** |
| `chat:summary:created` | `340-343` | `chat-summarizer-service:158` | нет |
| `chat:forked/rewound/bookmark:*` | `1047-1051` | `chat-bookmarks-service`, `cross-tab-state.ts:359` | `cross-tab-state:173`, `message-index-service:95`, `BookmarksPanel:52` |
| `session:deleted/binding:expired` | `1029,184-195` | `session-manager-service:324` / — | `debate-sync-manager:232` / — |

Chat session created/updated событий **нет** — сессии живут в Zustand+Dexie, не в EventBus
(есть только `debate:runtime:session:*`, `research:session:updated`, `director conversation:*`).

---

## 8. DI-регистрации и тесты

Реестр: `service-registration/index.ts:72-147` → `bootstrap.ts:64-66,210-328` (tiers, `bootstrap-phases.ts:35-62`;
Tier5 включает `chatService, agentService, orchestrator`).
Зарегистрировано: `chatService` (`phase6:103-128`), `chatSummarizerService` (`phase6:250-257`),
`chatBookmarksService` (`phase2:45`), `sessionManagerService` (`phase1:223`), `channelService`,
`groupChatService` (`phase33:48`), `scenarioRepository/directorRepository/conversationDirectorService`
(`phase20:23-46`), `agentService` (`phase4:87-98`), `agentFactory` (`phase53:18`).

Тесты: `ChatService.test.ts` (часть `it.skip`), `ChatService.autoRouting.test.ts:85-251`,
`chat-executor.test.ts:1-532`, `chat-bookmarks-service.test.ts`, `stores/chat/store.test.ts:1-626`
(очередь, cap 200, `switchModel` `:560`, persist-failure), `useChatStore.test.ts`,
conversation-`*` (orchestrator, policies, execution-engine: persona+model, context-propagation, director),
UI: `ChatPanel.test.tsx:91-99` (мокает **неправильные** имена `chat:select_model`/`chat:start_with_target`
вместо реальных `chat:model:select`/`chat:target:start` — contract drift), `ChatSessionsManagerPanel.test.tsx`,
`ChatAdminPanel`, `GroupChatPanel`.

---

## 9. Ключевой вывод археологии

Базовая Poe-модель («беседа живёт, key/model — параметры продолжения») в сторе **уже реализована**:
`activeSessionId` отделён от `currentProvider/currentModel/currentKeyId`, `switch*` не форкают историю,
`sendMessage` шлёт ту же историю на любую цель, per-response `provider/model/keyId` сохраняются.
Разрывы — на краях: dead deep-link `/chat?session=`, lossy persistence ассистента (1s flush, wipe partial на
ошибке, `activeSessionId` не персистится), отсутствие agent-binding в ChatPanel, мёртвые события,
orphan-оркестратор, `ChatExecutor.init()` вне lifecycle, contract drift в тестах.

Детализация разрывов — в `CURRENT_CHAT_FAILURES.md`.
