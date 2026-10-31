# Карта отложенных проблем (Deferred / Known Issues)

> Авторота: результат серии аудитов (data-integrity, race/lifecycle, types/contracts, performance, UX, build/deploy, logic, SSoT/state-consistency, a11y, resilience, dependencies).
> Статус: все пункты **отложены** (требуют аккуратного рефакторинга, сигнатурных изменений или проверки регрессий).
> Формат каждого пункта: контекст → проблема → митигация.

---

## 1. Data Integrity / Persistence

### 1.1. CheckpointStore — lost update при конкурентном persist

- **Файл:** `src/kernel/services/event-sourcing/checkpoint-store.ts:182-208`
- **Проблема:** `persistQueued` сбрасывается до `save()` resolve → два `save()` в полёте; поздний завершившийся пишет стый префикс.
- **Митигация:** единый сериализованный writer (как `KeyStateStore.persist`) + dirty-флаг.

### 1.2. LocalSecretStore — неатомарная запись значения + индекса

- **Файл:** `src/kernel/services/local-secret-store.ts:40-58`
- **Проблема:** `set`/`delete` пишут значение и индекс отдельными KV-записями; краш между ними → расхождение.
- **Митигация:** единый KV-ключ (index+values вместе) или транзакция.

### 1.3. CacheService — TTL-eviction не persists; slice(-500) расходится с памятью

- **Файл:** `src/kernel/services/cache-service.ts:139-144,148,177-184`
- **Проблема:** evictExpired удаляет из памяти, но не зовёт persist; персист хранит только 500.
- **Митигация:** dirty-флаг при eviction; персист всей карты (или инвариант лимита в обоих местах).

### 1.4. CacheService — ключ не учитывает sampling-параметры

- **Файл:** `src/kernel/services/cache-service.ts:195-207`
- **Проблема:** `generateKey(messages, model)` игнорирует temperature/maxTokens/stopSequences → коллизии кэша.
- **Митигация:** включить полный набор опций в хэш (как `CacheDecorator.hash`).

### 1.5. Буфер событий EventRecorder — WAL теряет события (300 последних, truncation)

- **Файл:** `src/kernel/services/event-sourcing/event-recorder.ts:567-578,205-213`
- **Проблема:** WAL капует 300 событий, `sanitizePayloadForWal` режет контент до 100 символов — восстановление неполное.
- **Митигация:** принять как crash-aid, либо увеличить кап/не резать.

---

## 2. Race Conditions / Lifecycle

### 2.1. DebateEngine — resume-during-pause молча теряется

- **Файл:** `src/kernel/services/debate-runtime/debate-engine.ts:638-672,369-374`
- **Проблема:** `pauseSession` не убирает id из `runningSessions`; resume в окне teardown → `startSession` no-op.
- **Митигация:** пер-сессионная карта run-промисов + `await` перед `startSession`; трактовать `phase==='paused'` как re-entrant-intent.

### 2.2. AutoDebateService — `_pendingPromise` не присваивается; destroy не ждёт

- **Файл:** `src/kernel/services/debate-runtime/auto-debate/auto-debate-service.ts:174-175,702-711`
- **Проблема:** `_pendingPromise` всегда null; runAutoDebate игнорирует `_abortController` для main-debate.
- **Митигация:** использовать общий abort; await in-flight при destroy.

### 2.3. MemoryEngine — worker-publish fire-and-forget вне tx rollback

- **Файл:** `src/kernel/services/memory-engine.ts:471-493,546-568`
- **Проблема:** при откате транзакции кэш/repo откатываются, но worker уже содержит запись (dangling).
- **Митигация:** публиковать в worker внутри `tx.onCommit`; при rollback — компенсирующий worker `remove`.

### 2.4. MemoryOrchestrator.summarizeRecent — нет mutex

- **Файл:** `src/kernel/services/memory-orchestrator.ts:158-205`
- **Проблема:** перекрывающиеся вызовы дают дубли сводок и гонку `MAX_SUMMARIES`-pruning.
- **Митигация:** single-flight + cooldown/excess pruning атомарно под `withLock`.

### 2.5. SchedulerService — destroy не отменяет in-flight; ручной trigger обходит гвард

- **Файл:** `src/kernel/services/scheduler-service.ts:255-336`
- **Проблема:** `trigger()` вызывает `runSchedule` напрямую (двойной запуск при интервальном sweep); `runCount` RMW теряет апдейт.
- **Митигация:** per-schedule single-flight; послеарный инкремент runCount.

### 2.6. MemoryWorkerClient — timeout-иница против позднего ответа

- **Файл:** `src/kernel/services/memory/memory-worker-client.ts:48-74`
- **Проблема:** `ensure()` может вернуться до инициализации (worker не null, но DB не готова).
- **Митигация:** гейтить на `isDbReady`/`workerInitPromise` (частично исправлено; проверить полноту).

---

## 3. Types / Contracts / Mismatches

### 3.1. Системный `as never` на записях AGEMS/Dexie (слой без валидации)

- **Файлы:** `src/kernel/services/agems-approval|budget|meeting|task`, `task-work-product`, `task-trigger`, `agent-execution`, `telegram`, `n8n`, `AgentDetailPanel`, `TaskDetailModal`
- **Проблема:** `as never` минует Generic и Zod-хуки → структурно неверные строки сохраняются, читатели получают phantom-поля.
- **Митигация:** заменить на реальный тип строки + добавить `creating/updating`-хуки для таблиц.

### 3.2. Импорт ключей: частичный `stats` → ключ молча не сохраняется

- **Файл:** `src/kernel/services/key-management/key-registry-utils.ts:127-143`
- **Проблема:** `buildImportKeys` пропускает частичный `stats`; провал `ApiKeySchema` → хук `creating` молча отклоняет ключ.
- **Митигация:** нормализовать `stats` дефолтами перед записью.

### 3.3. Dexie `updating`-хуки ломают вложенные патчи (dotted-path)

- **Файл:** `src/kernel/services/dexie-schema.ts`
- **Проблема:** `{ ...obj, ...mods }` с `'metadata.timestamp'`-патчами создаёт битый объект → запись отклоняется.
- **Митигация:** `Dexie.applyUpdate(obj, mods)` или валидировать только top-level патчи.

### 3.4. Нетипизированные `as never` в сторах

- **Файлы:** `src/stores/assistant-store.ts:156`, `src/stores/activeDebateStore.ts:29,31`
- **Проблема:** `setGovernorState(state as never)` через `Set<string>`/`ClaimGraph` в `unknown`-поле; сериализация сломается.
- **Митигация:** конкретный сериализуемый DTO (заменить `Set` на `string[]`).

### 3.5. Nvidia NIM — стриминг не накапливает tool_calls

- **Файл:** `src/llm/nvidia/nvidia-nim-adapter.ts:150-174`
- **Проблема:** стримированный агентский ход теряет tool-вызовы (функциональный пробел).
- **Митигация:** накапливать streamed tool_calls как openai/gemini.

---

## 4. Performance

### 4.1. Write-путь памяти — O(n²) (structuredClone/unshift/sort на каждый store)

- **Файлы:** `src/kernel/services/memory-engine.ts:453-529`, `memory/memory-cache.ts:64-67`, `memory-repository.ts:143-230`
- **Проблема:** deep-clone всего кэша + O(n) unshift + O(n log n) сортировка на каждую запись.
- **Митигация:** клонировать только на rollback; deque; сортировать только при превышении лимита.

### 4.2. `debateCallLlm` — пересборка контекста на каждую ретраю

- **Файл:** `src/kernel/services/debate-runtime/debate-llm-caller.ts:253,378-391`
- **Проблема:** `buildDebateCallContext` (включая сетевые verifyClaims без кэша) на каждой итерации фейловера.
- **Митигация:** собрать контекст один раз до цикла ретраев.

### 4.3. `syncSessions` — перезапись каждой сессии + version bump

- **Файл:** `src/kernel/services/storage/dexie-storage.ts:409-417`
- **Проблема:** за 1с-флаш переписываются все сессии (get+put+version++) → write-амплификация и liveQuery-петля.
- **Митигация:** диф против персистнутого; bulkPut только изменённых; не бампать нетронутые.

### 4.4. Embedding-батчинг отсутствует (1 HTTP на чанк)

- **Файлы:** `src/kernel/services/parity/knowledge-service.ts:171-181`, `rag/hybrid-retrieval-service.ts:151-157`
- **Проблема:** последовательные `embed([chunk])`.
- **Митигация:** один `embed(texts[])` с назначением по индексу.

### 4.5. VisGraph — полный teardown + 200 physics-итераций на любое изменение

- **Файл:** `src/components/**/VisGraph.tsx:49-106`
- **Проблема:** `new Network(...)` заново при смене ref.
- **Митигация:** `net.setData` + `setOptions({physics:{stabilization:{iterations:0}}})`.

### 4.6. ChatSidebar — подписка на весь sessions (ре-рендер ~60fps)

- **Файл:** `src/components/ChatPanel/ChatSidebar.tsx:30`
- **Проблема:** каждый флаш стрима ре-рендерит sidebar + `groupSessions`.
- **Митигация:** узкий селектор на метаданные.

### 4.7. event-recorder — копия `[...events]` на событие (частично исправлено)

- **Файл:** `src/kernel/services/event-sourcing/event-recorder.ts:548`
- **Проблема:** O(n) на событие при bursts (fix перенесён в debounce; доп. проверить).
- **Митигация:** копировать раз на окно.

### 4.8. key-state-store — полный пересчёт на каждую маршрутизацию

- **Файл:** `src/kernel/services/key-state-store.ts:566-578`
- **Проблема:** `getForRouting` запускает applyRecovery на каждый ключ + сортировка.
- **Митигация:** кэш снапшотов + dirty-набор.

### 4.9. key-registry — инвалидация frozen snapshot → повторные deep-clones

- **Файл:** `src/kernel/services/key-management/key-registry.ts:823-825,65-83`
- **Проблема:** каждая мутация ломает `#frozenSnapshot` → следующий getKeys ре-клонирует всё.
- **Митигация:** клонировать только изменённый ключ / version-счётчик.

### 4.10. custom-metrics — полный JSON-rewrite 10k на каждый computeValue

- **Файл:** `src/kernel/services/custom-metrics-service.ts:203-210`
- **Проблема:** parse+stringify всей истории на каждый метрический расчёт.
- **Митигация:** in-memory буфер + инкрементальный персист.

### 4.11. blackboard — полный скан+сортировка на каждое read

- **Файл:** `src/kernel/services/blackboard-service.ts:62-76`
- **Проблема:** O(n log n) на вызов.
- **Митигация:** индексы по visibility/agent; сортировать только при необходимости.

### 4.12. usage-tracker — O(n) скан 10k на каждый запрос квоты

- **Файл:** `src/kernel/services/usage-tracker.ts:130-158`
- **Проблема:** фильтр + два reduce на каждый запрос.
- **Митигация:** бегущие 30-дневные агрегаты per-provider.

### 4.13. wiki-graph — последовательные DB-round-trip на страницу/соседа

- **Файл:** `src/kernel/services/wiki-brain/wiki-graph.service.ts:61-119`
- **Проблема:** `for...await` на каждый элемент; louvain без cap итераций.
- **Митигация:** `Promise.all`/батч; max-iteration guard.

### 4.14. SchedulerService.save — перезапись всей расписания без debounce

- **Файл:** `src/kernel/services/scheduler-service.ts:508-521`
- **Проблема:** полный rewrite на каждую мутацию/запуск.
- **Митигация:** per-schedule / dirty-флаг.

### 4.15. ProbeService — ре-пробинг всех ключей последовательно, без TTL

- **Файл:** `src/kernel/services/probe-service.ts:458-517`
- **Проблема:** полный цикл с 500мс dwell, без свежести.
- **Митигация:** скипать свежие, шерить in-flight, параллелить.

### 4.16. workspace readFile — без кэша

- **Файл:** `src/kernel/services/workspace-service.ts:171-204`
- **Проблема:** перечитывание с диска при каждом tool-вызове.
- **Митигация:** LRU по `path+lastModified`.

### 4.17. memory worker search_semantic — O(n·hits) через entries.find

- **Файл:** `src/kernel/workers/memory.worker.ts:210-217`
- **Проблема:** линейный скан на каждый hit.
- **Митигация:** Map `id→entry`.

### 4.18. serializeSessionsWithBudget — O(n²) stringify при trim

- **Файл:** `src/stores/chat/hydration.ts:22-42`
- **Проблема:** полный JSON.stringify на каждой итерации.
- **Митигация:** байтовый дельту.

### 4.19. updateEntryInSession — копия всего массива на чанк (многостримный случай)

- **Файл:** `src/stores/chat/chat-event-handlers.ts:88-101`
- **Проблема:** O(N×(S+H)) при N стримах.
- **Митигация:** батч апдейтов на сессию за один проход.

---

## 5. UX / Correctness

### 5.1. DebateRuntimePanel — stale-выбор сессии (selectedId из prefs без валидации)

- **Файл:** `src/components/DebateRuntimePanel/DebateRuntimePanel.tsx:60-66,325,428`
- **Проблема:** выбранная завершённая сессия исчезает, панель пуста, pref остаётся висячим.
- **Митигация:** очищать selectedId; фолбэк на первую сессию.

### 5.2. channel-store — ошибка не очищается после успешной загрузки

- **Файл:** `src/stores/channel-store.ts:53-119`
- **Проблема:** баннер ошибки висит вечно после одного сбоя.
- **Митигация:** сбрасывать error на success + reset loading в refresh.

### 5.3. Вложенные интерактивные элементы перехватывают клавиатуру

- **Файлы:** `AgentsTable.tsx:49`, `AgentCard.tsx:56-61`, `ToolCard.tsx:54-59`
- **Проблема:** Enter/Space на внутренних кнопках открывают карточку.
- **Митигация:** `if (e.target !== e.currentTarget) return;`.

### 5.4. TaskDetailModal / ArgumentGraphPanel — нет Escape/focus trap

- **Файлы:** `TasksPanel/TaskDetailModal.tsx:99`, `ArgumentGraphPanel/ArgumentGraphPanel.tsx:241-270`
- **Проблема:** фокус уходит за модалку.
- **Митигация:** FocusScope + Escape + restore.

### 5.5. ChatHistoryEntry — редактирование только мышью

- **Файл:** `src/components/ChatPanel/ChatHistoryEntry.tsx:174-215`
- **Проблема:** нет tabIndex/role/keyboard.
- **Митигация:** role="button" + Enter/Space.

### 5.6. UsageHeatmap — одинаковые цвета (нет по-дневных данных)

- **Файл:** `src/components/UsageHeatmap/UsageHeatmap.tsx:89-107`
- **Проблема:** обманчивый плоский паттерн.
- **Митигация:** убрать ряд недели или дать реальные данные.

### 5.7. debateLiveStore — хвост вместо начала при стриме >10k

- **Файл:** `src/stores/debateLiveStore.ts:250`
- **Проблема:** начало длинного аргумента исчезает.
- **Митигация:** `slice(0, 10240)`.

### 5.8. Сырые строки вместо i18n

- **Файлы:** `AgentCard.tsx:199,211`, `WorkspacePanel`, `WorkflowPanel`
- **Проблема:** хардкод англ./рус. строк в локализованном UI.
- **Митигация:** использовать `t()`.

---

## 6. Build / Deploy / Config

### 6.1. nginx — нет `/proxy/mercury` → Mercury 403 в Docker

- **Файлы:** `docker/nginx.conf`, `docker/nginx-ssl.conf`
- **Проблема:** провайдер Mercury работает только в dev (Vite-прокси); в Docker — deny all.
- **Митигация:** добавить location + `PROXY_MERCURY` + CSP connect-src.

### 6.2. Quickstart-gateway — SYNC_HOST=127.0.0.1; нет сборки

- **Файл:** `docker-compose.quickstart.yml`
- **Проблема:** порт недоступен с хоста; host node_modules (win32) не работает в Linux/alpine.
- **Митигация:** `SYNC_HOST: 0.0.0.0`; отдельная build-стадия с `npm ci`.

### 6.3. Дефолтные Groq-модели — невалидные id

- **Файлы:** `src/kernel/services/config-registry.ts:95-96`, `settings-service.ts:102`
- **Проблема:** llama-4-deverick/scout отсутствуют в проде → 400/404 по умолчанию.
- **Митигация:** брать из `PROVIDER_DEFAULT_MODELS.groq`.

### 6.4. settings-service — self-loop downgrade

- **Файл:** `src/kernel/services/settings-service.ts:112`
- **Проблема:** `'gemini-3.1-flash-lite': ['gemini-3.1-flash-lite']`.
- **Митигация:** направить на реальную fallback-модель.

### 6.5. extract-models-catalog — хардкод sibling-пути

- **Файл:** `scripts/extract-models-catalog.mjs:50`
- **Проблема:** каталог расходится per-machine.
- **Митигация:** env + graceful degrade.

### 6.6. Dockerfile — libstdc++ vs libc6-compat

- **Файл:** `Dockerfile:26-29`
- **Проблема:** комментарий и реальная установка расходятся; sql.js native-биндинги могут упасть.
- **Митигация:** установить libstdc++.

### 6.7. buildId молча 'dev'

- **Файл:** `src/kernel/services/config-registry.ts:5-8`
- **Проблема:** без `VITE_BUILD_ID` прод-сборка несёт buildId 'dev'.
- **Митигация:** assert в prod-сборке.

### 6.8. ConfigService без event bus

- **Файл:** `src/kernel/service-registration/phase5-routing-llm.ts:87-90`
- **Проблема:** конфиг не «живой» (нет SETTINGS_UPDATED-подписки).
- **Митигация:** передать bus.

### 6.9. .npmrc audit=false против npm audit в CI

- **Файл:** `.npmrc:14`
- **Проблема:** расхождение.
- **Митигация:** убрать audit=false.

---

## 7. General Logic

### 7.1. StakeholderMapper — язык игнорируется (обе ветки идентичны)

- **Файл:** `src/kernel/services/debate-runtime/stakeholder-mapper.ts:269-293`
- **Митигация:** в Russian-ветке вывести русские строки.

### 7.2. findBestConstraint — инвертированный тип ответа

- **Файл:** `src/kernel/services/debate-runtime/debate-argument-graph-service.ts:406-408`
- **Митигация:** `hasAdversarialLanguage(...) ? 'attacks' : 'supports'`.

### 7.3. compression.ts — маркеры вне бюджета; perMsg=0; drop-system no-op

- **Файл:** `src/llm/utils/compression.ts:27-44,78`
- **Митигация:** вычитать длину маркера; `Math.max(1, perMsg)`.

### 7.4. format-cost / tokenEstimate — негатив/0-divisor

- **Файлы:** `src/shared/utils/format-cost.ts:23`, `src/kernel/utils/tokenEstimate.ts:3`
- **Митигация:** защита от негатива/0.

### 7.5. memory-watchdog — документация 500 vs код 200

- **Файл:** `src/kernel/utils/memory-watchdog.ts:40`
- **Митигация:** выровнять.

### 7.6. provider-fleet-health — даунгрейды только для ready

- **Файл:** `src/kernel/utils/provider-fleet-health.ts:79-84`
- **Митигация:** применять к любому non-broken.

---

## 8. Single Source of Truth / State Consistency

### 8.1. DebateSyncManager._entries / activeDebateStore держат терминальные сессии

- **Файл:** `src/kernel/services/debate-runtime/debate-sync-manager.ts:780-959`
- **Проблема:** рост `_entries`, isEngineActive() не падает, stale-проекции.
- **Митигация:** удалять из `_entries` + `activeDebateStore.clearSession` при finalize.

### 8.2. Тема — тройной mirror без sync

- **Файлы:** `AppLayout.tsx:52-70`, `CommandPalette.tsx:130-135`, `InstalledProvidersView.tsx:62`, `uiPreferencesStore.theme`, `settingsService.theme`
- **Проблема:** переключение через один путь не обновляет остальные; на reload — неверная тема.
- **Митигация:** `settingsService` единственный источник; все тогглы через один setTheme; подписка обновляет shared state.

### 8.3. Дебат-выбор — 4 стора без sync; URL sessionId не парсится

- **Файлы:** `activeDebateStore`, `useDebateSessionStore`, `uiPreferencesStore.debateSelectedId`, `DebateRuntimePanel.tsx:60-66`
- **Проблема:** «Open» из SessionHub показывает другой дебат.
- **Митигация:** единый источник + sync из URL на mount.

### 8.4. Provider/ключ-состояние — 4 проекции с конфликтом статусов

- **Файлы:** `key-state-store`, `key-registry`, `provider-tracker`, `provider-runtime/provider-state`
- **Проблема:** `status`/`reputation`/`reliability` расходятся; applyRecovery считает без персиста.
- **Митигация:** один авторитетный владелец per-key; персистить вычисленный вес.

### 8.5. Sidebar pinned/collapsed — дубль + не персистентен

- **Файлы:** `Sidebar.tsx:44-45`, `sidebar-utils.ts`, `uiPreferencesStore`, `AppLayout.tsx:47,195`
- **Митигация:** выбрать один источник; hoist isSidebarCollapsed.

### 8.6. graphStore.activeRunId можe dangle

- **Файл:** `src/stores/graphStore.ts:53-62`
- **Митигация:** валидировать выбор после refresh.

### 8.7. KeyStateStore — общий KV-ключ (last-writer-wins между вкладками)

- **Файл:** `src/kernel/services/key-state-store.ts:135-156`
- **Митигация:** пер-ключевые keys/rev.

---

## 9. Accessibility

### 9.1. Интерактивные div/span без клавиатуры (~25 мест)

- **Файлы:** `ChannelPanel.tsx:330,339,346-349,387`, `ProjectsPanel.tsx:234`, `SopPanel.tsx:143,163`, `RunQueuePanel.tsx:139`, `AutonomyPanel.tsx:141`, `SteelmanPanel.tsx:118`, `CouncilPanel.tsx:112`, `DyadPanel.tsx:129`, `GroupChatPanel.tsx:244,268`, `ChatDock.tsx:62`, `TaskDetailModal.tsx:137`
- **Митигация:** нативный button или role="button"+tabIndex+keys.

### 9.2. Модалки: PromptLibraryPanel / NodeDetailSidebar / ModalShell / KeyboardShortcutsModal

- **Файлы:** `PromptLibraryPanel.tsx:495-653`, `KnowledgePanel/NodeDetailSidebar.tsx:70-71`, `ModalShell.tsx:36`, `Common/KeyboardShortcutsModal.tsx:194`
- **Проблема:** нет dialog-семантики / имени / Escape / restore (частично).
- **Митигация:** role="dialog"+aria-modal+aria-labelledby+FocusScope+Escape.

### 9.3. useFocusTrap — silent failure без focusables

- **Файл:** `src/hooks/useFocusTrap.ts:15-34`
- **Митигация:** fallback на `ref.current.focus()`.

### 9.4. Цвет-только индикаторы

- **Файлы:** `AgentAvatar.tsx:130`, `status-vocabulary.tsx:165-187`, `UsageHeatmap.tsx:66-106`, `AuditLogView.tsx:8-12`
- **Митигация:** aria-label/visually-hidden; role="progressbar".

### 9.5. SVG-графики недоступны

- **Файлы:** `shared/charts/DonutChart.tsx`, `BarChart.tsx`, `RadarChart.tsx`
- **Митигация:** role="img"+aria-label+скрытая таблица данных.

### 9.6. ELO Leaderboard — div-таблица, кликабельные строки

- **Файл:** `src/components/AgentsPanel/EloLeaderboard.tsx:129-279`
- **Митигация:** реальный table + кнопка-экспандер.

### 9.7. Tasks Kanban / PermissionMatrix / InstalledProvidersView — drag-only

- **Файлы:** `TasksPanel.tsx:529-535`, `PermissionMatrix.tsx:442-688`, `InstalledProvidersView.tsx:557-580`
- **Митигация:** клавиатурные альтернативы; 44px цели.

### 9.8. Tab-списки без roving tabindex

- **Файлы:** `ToolInspectorPanel.tsx:174-210`, `SettingsPanel.tsx:599`, `ProviderManagerView.tsx:257`
- **Митигация:** ArrowLeft/Right; референс — `ProviderManagerContainer.tsx:152-162`.

### 9.9. aria-describedby почти не используется; touch-цели <44px

- **Митигация:** подключить к ошибкам; увеличить hit-области.

---

## 10. Resilience / Fault Tolerance

### 10.1. RunQueue — застрявшие 'running'-строки не восстанавливаются

- **Файл:** `src/kernel/services/rivals/runqueue-service.ts:118-145`
- **Проблема:** краш mid-wave → элементы навсегда в 'running'.
- **Митигация:** reconciliation на init/drain (queued+failed+DLQ).

### 10.2. RunQueue — гвард per-instance → двойное исполнение между вкладками

- **Файл:** `src/kernel/services/rivals/runqueue-service.ts:70-88`
- **Митигация:** атомарный CAS queued→running с lease.

### 10.3. Scheduler — SCHEDULE_COMPLETED до реального запуска

- **Файл:** `src/kernel/services/scheduler-service.ts:291-344`
- **Митигация:** эмитить completed после разрешения; не сдвигать nextRun при фейле.

### 10.4. GoogleGenAI — глотает ошибки в пустой контент

- **Файл:** `src/kernel/services/google-genai-service.ts:214-282,291-347`
- **Митигация:** не глотать; явный timeout; retry/breaker.

### 10.5. Probe — сбрасывает circuit-breaker при пробе

- **Файл:** `src/kernel/services/probe-service.ts:207,415`
- **Митигация:** не сбрасывать; пропускать открытые circuit.

### 10.6. WikiIngestService.runLoop — unhandled rejection убивает воркер

- **Файл:** `src/kernel/services/wiki-brain/wiki-ingest.service.ts:123-158`
- **Митигация:** try/catch всего цикла; mark failed + backoff.

### 10.7. EmbeddingClient — нет retry/backoff

- **Файл:** `src/llm/embeddings/embedding-client.ts:53-109`
- **Митигация:** ограниченный retry + honor Retry-After.

### 10.8. Stream interruption — нет resume

- **Файлы:** `src/llm/decorators/retry-decorator.ts:133-166`, `fallback-decorator.ts:141-143`
- **Митигация:** типизированный StreamInterruptedError + реплей частичного контента.

### 10.9. Circuit-breaker — open без fallback; hasAnyOpenCircuit

- **Файл:** `src/llm/decorators/circuit-breaker.ts:186-194,94-99`
- **Митигация:** вторичный ключ/провайдер; per-key-изоляция.

### 10.10. GroupManager.syncExistingKeys — fire-and-forget без catch

- **Файл:** `src/kernel/services/group-manager.ts:103,360-447`
- **Митигация:** изоляция per-key + .catch().

### 10.11. ExecutionQueue — watchdog не абортит; DLQ без replay

- **Файл:** `src/kernel/services/execution-queue.ts:96-188`
- **Митигация:** AbortSignal + bounded retry/replay.

### 10.12. CircuitBreaker.batchSendMessage — гейтит батч по первому ключу

- **Файл:** `src/llm/decorators/circuit-breaker.ts:409-423`
- **Митигация:** split per key.

---

## 11. Dependencies / Third-Party

### 11.1. `npm audit` — не выполнен (таймаут); обязателен в CI

- **Действие:** прогонять `npm audit --omit=dev --audit-level=high` в CI.

### 11.2. Бандл раздут: mermaid (~117MB), monaco-editor (~94MB), vis-network (~80MB)

- **Действие:** ленивая загрузка (dynamic import) этих пакетов; проверить, не в главном ли чанке.

### 11.3. Устаревшие мажорные версии (отложить)

- `typescript 7`, `zustand 5`, `vitest 5`, `framer-motion 14`, `@testing-library/jest-dom 7` — требуют API-миграции.

### 11.4. Безопасные minor/patch обновления (рекомендуется)

- `react 19.3.x`, `react-router-dom 7.18.5`, `dexie 4.4.7`, `vis-network 10.1.4`, `meriyah 7.4.1`, `groq-sdk 1.6.0`, `lucide-react 1.65.0`, `@tanstack/react-virtual`, `@react-aria/focus`, `eslint 10.14`.

### 11.5. Лицензии

- `license-checker` в CI перед релизом (все ключевые пакеты MIT).

---

## 12. Security / Secrets

### 12.1. KeyVault fail-open + deviceKey в plaintext (W2-005 / W4-019 / W7-CRY-001)

- **Файл:** `src/kernel/services/key-management/key-service.ts:399-413`, `src/kernel/services/key-management/key-vault.ts:40-79`
- **Проблема:** master-key AES-GCM выводится из случайного device-ключа, который хранится в plaintext в localStorage (`key-vault:device-key`). При доступе к профилю/файловой системе (XSS, расширение, кража профиля) ключ дешифрования лежит рядом с шифротекстом → шифрование-at-rest сводится к обфускации. Плюс fail-open: при залоченном vault `encryptAllKeys`/`decryptAllKeys` возвращают ключи без изменений.
- **Митигация:** выводить master-key из passphrase пользователя (промпт при bootstrap), убрать fallback на device-key, добавить UI-экран первого запуска/миграции. Требует продуктового решения — **отложено**.

### 12.2. API-ключи и внешние секреты в plaintext в IndexedDB (W5-002 / W4-084)

- **Файл:** `src/kernel/services/storage/dexie-storage.ts` (apiKeys), `src/kernel/services/local-secret-store.ts:8-15`, `src/kernel/services/key-management/key-registry.ts` (doSaveKeysWithSnapshot)
- **Проблема:** пока vault не завязан на passphrase, ключи хранятся расшифрованными (или под легко-доставаемым ключом). `LocalSecretStore` пишет секреты в plaintext в Dexie `keyValue`.
- **Митигация:** активна только после 12.1 — маршрутизировать `LocalSecretStore.set()` и `addKey` через `KeyVault.encryptKey()`. **Отложено** вместе с 12.1.

### 12.3. Multi-tenant IDOR / общий SYNC_SECRET; WS cross-tenant leak (W2-009 / W3-025 / W8-003)

- **Файл:** `server/sync-server.mjs`, `server/company-store.mjs`, `server/write-queue.mjs`
- **Проблема:** единый `SYNC_SECRET` для всех тенантов + broadcast-записи без tenant-скоупа → риск доступа одного tenant к данным другого; WS без maxPayload и O(кол-во) broadcast.
- **Митигация:** пер-tenant секреты/токены, скоупинг записей по tenantId, maxPayload + лимит фан-аута. Серверная переработка — **отложено**.

### 12.4. `browser-use-service.test.ts` — завышенное ожидание (pre-existing)

- **Файл:** `src/kernel/services/browser/browser-use-service.test.ts:101`
- **Проблема:** тест «unreachable sidecar» ожидает `/is it running/`, а код выдаёт сообщение с `npm run browser:sidecar` (без «is it running»). Уже падал до правок sidecar; требует решения: обновить ожидание или текст ошибки.
- **Митигация:** уточнить ожидание/сообщение. **Отложено** (не влияет на прод-функционал).

---

## 13. Отложено — крупные рефакторинги / нужна проверка поведения

> Пункты, которые НЕ трогаем «вслепую» (без локального прогона тестов/typecheck):
> требуют структурных изменений или тонкой семантики, где регресс дороже выгоды.

### 13.1. W6-019 — cross-session потеря сообщений (per-session изоляция)

- **Файл:** `src/stores/chat/chat-send-message.ts`, `chat-event-handlers.ts`, `store.ts`
- **Проблема:** `isAnySending()` глобальный (`activeRequestIds.size > 0`) — сессия B ждёт, пока сессия A шлёт; перекрытие очередей → потеря/задержка сообщений.
- **Митигация:** привязка requestId → sessionId и гейт только по своей сессии. **Отложено.**

### 13.2. W6-018 — feature-flag UI: `as unknown as Record<string, boolean>` (type lie)

- **Файл:** `src/components/SettingsPanel/GeneralTab.tsx:408-529`
- **Проблема:** `CONFIG.featureFlags` вложенный, а читается плоским `featureFlags['memory.enabled'] ?? true` — тумблеры показывают дефолт вместо реального значения; `setFeatureFlags(safeClone(CONFIG.featureFlags) as ...)` шлёт вложенный объект туда, где ждут плоский.
- **Митигация:** хелперы dotted-path get/set + разобраться с получателем `setFeatureFlags`. **Отложено** (нужна проверка потребителей).

### 13.3. W6-014 — singleton `ArgumentGraphService` (cross-session clobber)

- **Файл:** `src/kernel/services/debate-runtime/debate-argument-graph-service.ts:156-220`
- **Проблема:** DI-singleton; `build()` зовёт `clear()` → конкурентные дебаты затирают граф друг друга.
- **Митигация:** per-session `Map<sessionId, GraphState>`. **Отложено.**

### 13.4. W6-015 — CacheDecorator in-flight timeout не абортит inner

- **Файл:** `src/llm/decorators/cache-decorator.ts:259-279`
- **Проблема:** 120s-таймаут не прерывает внутренний вызов → кэш-stampede + orphaned HTTP-слот.
- **Митигация:** cache-owned `AbortController`, abort при timeout. **Отложено.**

### 13.5. W6-036 — `--ignore-scripts` для `npm ci` (CI + Dockerfile)

- **Файл:** `.github/workflows/ci.yml:46..494`, `Dockerfile:34`
- **Проблема:** supply-chain RCE через postinstall транзитивных зависимостей; но `--ignore-scripts` может сломать сборку, если нужный пакет получает бинарь через postinstall (не проверено локально).
- **Митигация:** добавить флаг ТОЛЬКО после проверки полной сборки (build + e2e). **Отложено.**

### 13.6. W6-007/W6-008/W6-009 — fencing token / Idempotency-Key / duplicate runs

- **Файл:** `llm-http-client.ts`, `execution-queue.ts`, `server/adapters.mjs`
- **Проблема:** нет fencing-токена у локов, нет `Idempotency-Key` на LLM-постах, дубль-запуск run.
- **Митигация:** сквозные изменения транспорта/очередей. **Отложено.**

### 13.7. W7-UGC-009 — CSAM/PhotoDNA-модерация изображений

- **Файл:** image-пайплайн (нет)
- **Проблема:** текстовый блоклист есть; модерация изображений (CSAM/PhotoDNA) отсутствует.
- **Митигация:** внешний сервис модерации. **Отложено** (внешняя зависимость).

### 13.8. W6-039 — streamMessage без in-flight dedup (cache stampede)

- **Файл:** `src/llm/decorators/cache-decorator.ts:345-496`
- **Проблема:** `sendMessage` имеет `#inFlight`, а `streamMessage` нет → параллельные идентичные стримы дублируют вызов провайдера.
- **Митигация:** `#inFlightStream` Map: ожидать сиблинга и переиграть из кэша; требует обёртки большого блока стрима. **Отложено** (нужна проверка без регресса).

---

## Карты системной разведки (10)

Не «баги», а сквозные срезы системы для приоритизации и документации. Лежат в `docs/audits/waves/`:

| Карта                       | Файл                                                    | Назначение               |
| --------------------------- | ------------------------------------------------------- | ------------------------ |
| Requirements                | `docs/audits/waves/map-01-requirements.md`              | требования и их покрытие |
| Feature Value               | `docs/audits/waves/map-02-feature-value.md`             | ценность фич             |
| Technical Health            | `docs/audits/waves/map-03-technical-health.md`          | техздоровье              |
| Observability & Diagnostics | `docs/audits/waves/map-04-observability-diagnostics.md` | наблюдаемость            |
| Dead & Abandoned            | `docs/audits/waves/map-05-dead-abandoned.md`            | мёртвый/заброшенный код  |
| Capability Gap              | `docs/audits/waves/map-06-capability-gap.md`            | пробелы возможностей     |
| Opportunity                 | `docs/audits/waves/map-07-opportunity.md`               | возможности              |
| Capability Accessibility    | `docs/audits/waves/map-08-capability-accessibility.md`  | доступность возможностей |
| Duplication                 | `docs/audits/waves/map-09-duplication.md`               | дублирование             |
| Resource Consumption        | `docs/audits/waves/map-10-resource-consumption.md`      | потребление ресурсов     |

---

## Сводка

| Категория                               | Кол-во отложенных |
| --------------------------------------- | ----------------- |
| Data Integrity / Persistence            | 5                 |
| Race Conditions / Lifecycle             | 6                 |
| Types / Contracts                       | 5                 |
| Performance                             | 19                |
| UX / Correctness                        | 8                 |
| Build / Deploy / Config                 | 9                 |
| General Logic                           | 6                 |
| SSoT / State Consistency                | 7                 |
| Accessibility                           | 9                 |
| Resilience / Fault Tolerance            | 12                |
| Dependencies                            | 5                 |
| Security / Secrets                      | 4                 |
| Deferred refactors (needs verification) | 7                 |
| **Итого**                               | **91**            |
