# CURRENT_CHAT_FAILURES.md — конкретные разрывы Chat-системы

> Этап 1 (AUDIT). Код не менялся. Основание: `docs/new/CHAT_ARCHAEOLOGY.md`.
> Легенда: 🔴 сломано · 🟡 частично/риск · 🟢 работает.

---

## A. Что уже работает 🟢

1. **Беседа не привязана к key/model в сторе.** `activeSessionId` отделён от
   `currentProvider/currentModel/currentKeyId` (`src/stores/chat/types.ts:31-47,61-70`).
2. **`switchModel`/`switchKey` не создают новую беседу** (`src/stores/chat/store.ts:497-593`);
   история не форкается и не очищается.
3. **Полная send-цепочка существует и замкнута**: UI → store → `chat:send` → `ChatExecutor` →
   `LLMClientService` → adapter → API → `chat:response`/`STREAM_*` → zustand → Dexie
   (файлы/строки — CHAT_ARCHAEOLOGY §3.3).
4. **Per-response execution metadata** (`provider/model/keyId/...` на каждый ответ,
   `src/kernel/types/chat-types.ts:9-26`).
5. **Ошибка провайдера беседу не уничтожает**: только `status:error/cancelled/timeout`,
   юзер-сообщение уже в Dexie (write-through, `chat-send-message.ts:204-227`).
6. **Retry/fallback/downgrade/race/circuit-breaker** в `chat-executor.ts` + декораторах `src/llm/decorators/`.
7. **Key/health/discovery**: `key-health.ts`, `key-models.ts` (`refreshModels`), fleet-саммари,
   runtime-gating (`key-service.ts:694-706`).

---

## B. Что работает частично 🟡

1. **Persistence ассистента — delayed/lossy.** `STREAM_END` в Dexie не пишет
   (`chat-event-handlers.ts:94-125`); только 1s debounced flush (`hydration.ts:178-187`).
   Крэш <1s после ответа = потеря хвоста. Бэкап `beforeunload` → localStorage есть
   (`hydration.ts:194-212`), но это костыль, не гарантия.
2. **Reload → open.** Активной всегда становится самая свежая сессия (`hydration.ts:128-135`),
   `activeSessionId` не персистится; `cleanupOrphanLoading` (`:13-29`) переводит оборванные
   `loading/streaming → error`; мерж in-memory ↔ Dexie (`:154-168`) может дублировать/затирать.
3. **Модели ключа.** Центрального каталога нет — 3-tier fallback
   (`provider-default-models.ts` → `key-models.ts FALLBACK_MODELS` → live `refreshModels`).
   В Chat UI список = `key.availableModels || []` — если discovery не запускался, список пуст/устарел;
   кнопка ручного `refreshModels` только в KeyTable (`OverviewTab:66`, `ToolsTab:52`).
4. **Мультиселект ключей** в Chat (`ChatInputArea:68-120`) рассылает одно сообщение на N ключей,
   но `switchKey`/`getSessionConfig` работают только с `selectedKeys[0]`/`currentKeyId` —
   N-1 ответов висят вне session-конфига.

---

## C. Что существует, но не подключено 🔴

1. **Agent attach к ChatPanel-беседе.** Бэкенд-шов есть (`ChatExecutor` прокидывает
   `metadata.agentId`, гейтит `checkAgentPolicy`, `STREAM_END` несёт `agentId`;
   `ChatExecutionEngine + resolveAgent` инжектят persona+model для Director/Debate).
   Но: `ChatSession` без `agentId`, `sendMessage targets` без агента, в `ChatPanel` нет picker'а,
   `chat-send-message.ts:242-251` `agentId` не ставит. Итог: режим `Provider+Key+Model+Agent` в чате невозможен.
2. **`ConversationOrchestrator`** (`services/conversation-orchestrator.ts:13`) — ни одного `register(...)`;
   только `new` в director/debate-оркестраторе и тестах.
3. **`ChatExecutionEngine`** — без DI-токена (только `new` в `phase20:38`).
4. **`chat:summary:created`** (`chat-summarizer-service:158`) — подписчиков нет.
5. **`chat:model:select`** (эмиттит только `AquariumPanel:801`), **`chat:target:start`**
   (только `SandboxTab:195`) — подписчиков нет (dead).

---

## D. Что подключено неправильно 🔴

1. **Dead deep-link `/chat?session=<id>`.** Эмиттеры: `ChatSessionsManagerPanel:412`,
   `SessionHubPanel:209,470`, `DebateRuntimePanel:440`. Потребителей **ноль**: `ChatPanel/*` не читает
   query вообще; `hydration.ts:124-135` игнорирует URL. «Open in Chat» молча открывает не ту сессию
   (всегда most-recent). Тот же класс бага, что был с `sessionId` в дебатах (уже чинен в `5ff060a`
   для классики — здесь аналогичный фикс нужен для чата).
2. **Вторые потребители `chat:send`** — `cognitive-service.ts:229`, `message-index-service.ts:87`
   подписаны на то же событие, что `ChatExecutor:34`. Двойное исполнение/побочки не покрыты тестами.
3. **`🔄 Switched to …` system-entry** (`store.ts:520-526,565-571`) **загрязняет историю**,
   которая потом целиком скармливается следующей модели (`chat-send-message.ts:139-167`).
   Служебное событие должно жить в метаданных, не в `history[]`.

---

## E. Legacy / dead / mock (зафиксировано, не удалять)

1. `RolesPanel/TeamChat.tsx:1-481` — полностью локальный мок тим-чата (без EventBus/DI/LLM).
2. `~33 ComingSoonPanel debate-стаба` схлопнуты в `ExperimentalPanel` (`route-imports.ts:430-432`); к чату не относятся.
3. `PatternsPanel:34,52,93-94` `notifyComingSoon`; `ModuleInfo:224` ComingSoon-fallback.
4. `llm/core/base-adapter.ts:126,131` — `checkHealth/getAvailableModels not implemented` (501).
5. `AGENT_PROFILES` (`kernel/state/agent-profiles.ts:1-20`) — помечен LEGACY DUPLICATE,
   каноника `AGENT_REGISTRY` в `src/kernel/agents/`.
6. Дубли экспорта: `utils/chat-export.ts` vs `ChatExportPanel/chat-export-types.ts` vs `ChatExportOverlay.tsx`.
7. 4 механизма key-хранения, активен один (`key-vault.ts`, plaintext by design); остальные —
   legacy-migration (`security.ts`), `virtual-key-service` (btoa-маска, не граница), `crystal-vault` (другой домен).

---

## F. Где теряется session/conversation identity 🔴

1. **Deep-link** (D.1): identity из URL теряется полностью.
2. **Reload** (B.2): `activeSessionId` не персистится → открывается most-recent, исходный контекст «теряется»
   с точки зрения пользователя (данные целы в Dexie, но выбор сброшен).
3. **Мерж при гидрации** (`hydration.ts:154-168`): гонка in-memory ↔ Dexie может затереть свежее.
4. `ConversationSession` (director) vs `ChatSession` (chat) — разные сущности с похожим именем;
   смешение в коде = риск привязать чат к чужой identity (архитектурная ловушка, не активный баг).

---

## G. Где key/model ошибочно часть identity 🟡

Прямой формулы `conversationId = provider+key+model` **нет** — identity чистая.
Остаточные coupling-точки (все поправимы без редизайна):
1. `ChatPanel:393-414` — смена UI-селектора сразу мутирует сессию (`switchKey/switchModel`).
2. `store.ts:528-551,573-592` — селекция пишется в `current*` активной сессии + system-entry в историю (D.3).
3. `ChatSessionsManagerPanel:470-481` показывает `currentProvider/currentModel` как свойство беседы
   (это дефолт продолжения, не identity — в UI это не различено).
4. Мультиселект (`selectedKeys[]`) vs сингл `currentKeyId` (B.4).

---

## H. Где persistence разорван 🔴

1. **Ассистент пишется только дебаунсом** (B.1) — окно потери до ~1s + крэш.
2. **`STREAM_ERROR` затирает частичный контент**: `chat-event-handlers.ts:141-148` ставит `content:''` —
   уже пришедший префикс стрима выбрасывается. Должно оставаться как partial + error-флаг.
3. **Зависимость от монтирования**: без `useChatStoreHydration` (смонтирован в `AppLayout:159` —
   ок, но хрупко: один unmount/рефакт layout = нет flush, нет liveQuery, нет бэкапа).
4. Сессии сверх `liveQuery limit(100)` (`hydration.ts:116-117`) не гидратируются в стор
   (в Dexie лежат, в UI невидимы до `loadMoreSessions`).

---

## I. Где Agent integration не доходит до runtime 🔴

См. C.1. Дополнительно: `TeamChat` (мок), `GroupChatPanel` + `rivals/groupchat-service.ts`,
`conversation-director-service.ts` — параллельные чаты, к активной ChatPanel-сессии не привязаны.
Полиси-гейт `checkAgentPolicy(agentId,provider,model)` (`chat-executor.ts:128-141`, 403) уже стоит
на всех путях — при добавлении аттача упрёмся в него первым (это и есть «правильная точка контракта»).

---

## J. Где UI врёт относительно runtime 🟡

1. Deep-link открывает не ту сессию (D.1) — самое заметное.
2. `ChatSessionsManagerPanel` Details показывает `currentProvider/currentModel` как состояние беседы,
   хотя фактический провайдер ответа может отличаться (auto-route/fallback/race/downgrade меняют
   `currentProvider/effectiveModel` уже в executor'е, `chat-executor.ts:472-484,645-651,731-743`).
   Истина — только per-response (`history[].responses[]`), в UI менеджера её нет.
3. Модель в селекторе (`availableModels`) может врать, если discovery не запускался (B.3).
4. Тесты `ChatPanel.test.tsx:91-99` мокают несуществующие имена событий
   (`chat:select_model`/`chat:start_with_target`) — зелёные тесты проверяют не тот контракт (contract drift).
   Плюс `ChatService.test.ts:14 it.skip`, `directorControls.test.ts:110 controls.skip()`.

---

## Приоритет фиксов (для Этапа 2 — DESIGN)

| # | Разрыв | Характер |
|---|---|---|
| 1 | `/chat?session=` deep-link (D.1/F.1) | Один хендлер в ChatPanel по образцу дебатного `5ff060a`: history → Dexie `loadSession` |
| 2 | `STREAM_ERROR` wipe partial (H.2) | 3 строки в `chat-event-handlers.ts:141-148`: сохранить префикс + error-флаг |
| 3 | Ассистент только дебаунсом (H.1) | Писать в Dexie на `STREAM_END`/`MESSAGE_RESPONSE(done)` напрямую, дебаунс оставить как safety-net |
| 4 | `activeSessionId` не персистится (F.2/B.2) | Сохранять в KV/Dexie, восстанавливать при гидрации |
| 5 | `🔄 Switched` в истории (D.3) | Вынести в метаданные/отдельный лог, не кормить моделям |
| 6 | `ChatExecutor.init()` вне lifecycle (C) | `registerWithLifecycle` или явный init в bootstrap Tier5 |
| 7 | Двойные потребители `chat:send` (D.2) | Развести каналы либо задокументировать идемпотентность |
| 8 | Agent attach (C.1/I) | Отдельный дизайн: `agentId?` в session+targets+metadata, picker в ChatPanel, detaч-контракт, policy-гейт уже есть |
| 9 | Contract drift тестов (J.4) | Починить имена событий, раскипать/удалить skip'ы |
| 10 | B.3/B.4/J.2/J.3 | UX-доработки второго эшелона (discovery при открытии чата, per-response truth в менеджере) |
