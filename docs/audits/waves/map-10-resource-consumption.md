# Карта использования ресурсов — Resource Consumption Map

## SuperAgents OS (`egilyad/ai-os-new`)

> **Версия проекта:** commit `e08ab8e` (Oct 31, 2026, ветка `main`)
> **Дата анализа:** 2026-10-31
> **Метод:** статический анализ кода + чтение `route-imports.ts`, `kernel/instances/`, `kernel/bootstrap*.ts`, `kernel/service-registration/phase*.ts`, `usePolling` hook, поиск `setInterval`/`eventBus.on`/cleanup-паттернов
> **Парные документы:** «Карта готовности панелей» + «Карта функциональной ценности» + «Карта технического состояния»
> **ВАЖНО:** **измеренной нагрузки нет** — приложение не запускалось. Везде ниже это **потенциальная** нагрузка и **паттерны** (что код объявляет), а не реальные цифры heap/CPU/network. Каждый раздел явно разделяет эти понятия.

---

## 1. Исполнительное резюме

SuperAgents OS — браузерное приложение с **ленивой загрузкой 209 панелей** (из 268) через `React.lazy`, **407 lazyService-синглтонов** ядра, **549 регистрациями сервисов** в 81 phase-файле, и **8-tier** последовательной инициализацией при старте. В фоне постоянно работают **15+ сервисов с `setInterval`** (heartbeat, cleanup, snapshot, monitor). 79 панелей используют polling (в основном 5–15 сек), `usePolling` корректно авто-паузится при скрытой вкладке.

**Сводные метрики ресурсопотребления (потенциальные):**

| Метрика                             |                                                                                 Значение | Тип                         |
| ----------------------------------- | ---------------------------------------------------------------------------------------: | --------------------------- |
| Lazy-загружаемых панелей            |                                                                            **209 / 268** | POTENTIAL — благо           |
| Eager-импортов в route-imports      |                              **3** (ErrorBoundary, Skeleton, TECHNIQUE_PANEL_COMPONENTS) | POTENTIAL — минимум         |
| lazyService-синглтонов ядра         |                                                                                  **407** | POTENTIAL — все lazy        |
| Service registrations (phases)      |                                                                 **549** в 81 phase-файле | POTENTIAL                   |
| Init tiers                          |                                                                  **8** (Tier 0 → Tier 7) | ARCHITECTURE                |
| Background `setInterval` в сервисах |                                                           **39** (15+ активных таймеров) | POTENTIAL — фон             |
| `usePolling` в компонентах          |                                                                           **79** вызовов | POTENTIAL — polls           |
| `eventBus.on` в компонентах         |                                                              **97** подписок в 46 файлах | POTENTIAL — subs            |
| Всего `eventBus.*` вызовов          |                                                                                  **997** | POTENTIAL                   |
| `useEffect` в компонентах           |                                                                                  **461** | POTENTIAL                   |
| `useEffect` с cleanup               |                                                                             **77** (17%) | PATTERN — внимание          |
| Тяжёлых библиотек в use             | framer-motion **165 файлов**, React Flow 6, vis-network 5, Monaco 2, TipTap 2, Mermaid 1 | POTENTIAL                   |
| Web Workers                         |                                                **2** (`sandbox.worker`, `memory.worker`) | ARCHITECTURE                |
| Zustand stores                      |                                                                                   **53** | POTENTIAL — in-memory state |

**Главный вывод:** архитектура **по умолчанию ленивая** — 209/268 панелей не грузятся, пока пользователь не откроет маршрут. lazyService гарантирует, что 407 сервисов не инстанцируются, пока не запросят. **Главные ресурсные риски:**

1. **165 файлов импортируют framer-motion** — либа тяжёлая, тащится в каждый chunk
2. **39 background `setInterval`** в сервисах — работают, даже когда панель закрыта
3. **79 polling-панелей** — при открытой вкладке каждый тик = re-render + возможно DB query
4. **Только 17% useEffect имеют cleanup** — потенциальные subscription leaks (но многие useEffect one-shot, не все требуют cleanup)
5. **549 service registrations** — если все Tier 7 («*») инстанцируются при старте, это много

**Resource Health: 6.5/10** — ленивая архитектура хорошая, но фоновые таймеры и polling могут накапливаться. **Реально измерить невозможно без runtime.**

---

## 2. Методология: 7 вопросов + разделение POTENTIAL vs MEASURED

### 2.1. Семь вопросов (из задания)

| #   | Вопрос                                                     | Что анализируем                                                              |
| --- | ---------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 1   | Какие панели загружаются одновременно?                     | Активный маршрут + layout + persistent panels                                |
| 2   | Какие сервисы постоянно работают?                          | `setInterval` в сервисах, ILifecycle.start(), background timers              |
| 3   | Где создаются лишние подписки?                             | `eventBus.on` без cleanup, дублирующие подписки на одно событие              |
| 4   | Какие компоненты используют много памяти?                  | Тяжёлые импорты (Monaco, Mermaid, React Flow), large state, in-memory caches |
| 5   | Где повторяются запросы?                                   | Polling одной и той же data из разных панелей, overlapping fetches           |
| 6   | Какие процессы можно запускать лениво?                     | Eager imports, Tier 7 services, panels без lazy                              |
| 7   | Какие панели можно выгружать при отсутствии использования? | Cleanup-pattern, unload-on-route-change feasibility                          |

### 2.2. Разделение POTENTIAL vs MEASURED (явно требовалось)

| Тип           | Что это                                                                        | Как получено                        |
| ------------- | ------------------------------------------------------------------------------ | ----------------------------------- |
| **POTENTIAL** | Что код **может** потреблять — статический анализ импортов, таймеров, подписок | `grep`, `find`, чтение исходников   |
| **PATTERN**   | Какой **паттерн** используется — lazy vs eager, cleanup vs no-cleanup          | анализ `useEffect`, `route-imports` |
| **EVIDENCE**  | **Доказательство паттерна** — например, `usePolling` auto-pauses on hidden tab | чтение реализации                   |
| **MEASURED**  | Реальные цифры heap/CPU/network в runtime                                      | **НЕТ** — приложение не запускалось |

> **Везде ниже, где написано «потребляет X» — это POTENTIAL.** Где написано «доказано, что Y» — это EVIDENCE из кода. Где нет данных — явно отмечено UNKNOWN.

---

## 3. Что загружается при старте приложения

### 3.1. Eager-загружаемое (сразу при `main.tsx`)

`src/App.tsx` (минимальный, 17 строк):

```tsx
const App: React.FC = () => (
  <ResponsiveShell>
    <AppLayout />
    <CommandPalette />
  </ResponsiveShell>
);
```

**Eager-загружаемые модули:**

| Модуль                              | Зачем                        | Оценка                           |
| ----------------------------------- | ---------------------------- | -------------------------------- |
| `AppLayout`                         | Layout, Sidebar, routes      | 🟢 обязательно                   |
| `ResponsiveShell`                   | Адаптивность                 | 🟢 обязательно                   |
| `CommandPalette`                    | Cmd+K palette                | 🟡 можно lazy                    |
| `ErrorBoundary` (Common)            | Error catching               | 🟢 обязательно                   |
| `PanelSkeleton`                     | Loading fallback             | 🟢 обязательно                   |
| `TECHNIQUE_PANEL_COMPONENTS` bundle | 62 technique panels registry | 🟡 **можно lazy** — сейчас eager |

**Eager бандл:** layout + sidebar + route registry (4 файла `route-registry-*.ts`) + i18n + 3 shared components + TECHNIQUE_PANEL_COMPONENTS. Оценка ~150–200 KB JS (POTENTIAL, не измерено).

### 3.2. Bootstrap ядра (8 tiers, последовательно)

`src/kernel/bootstrap.ts` + `bootstrap-phases.ts` — 8 tiers инициализации:

| Tier       | Сервисы                                                                                                                                                                                                                     | Когда                    |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| **Tier 0** | `configService`, `logger`                                                                                                                                                                                                   | no deps, first           |
| **Tier 1** | `routerConfigManager`, `eventSourcingService`, `keyService`, `pricingService`                                                                                                                                               | depends on config        |
| **Tier 2** | `budgetService`, `keyStateStore`, `rotationService`, `keyVault`                                                                                                                                                             | depends on keyService    |
| **Tier 3** | `providerRuntimeService`, `healthScoreService`, `probeService`                                                                                                                                                              | depends on keyStateStore |
| **Tier 4** | `groupManagerService`, `cacheService`, `policyService`                                                                                                                                                                      | depends on probeService  |
| **Tier 5** | `debateService`, `orchestrator`, `agentService`, `chatService`, `memoryOrchestrator`, `memoryService`, `advisorService`, `debateKnowledgeSync`, `contributionService`, `cognitiveIntelligenceService`, `pressureMapService` | application services     |
| **Tier 6** | `memoryMcpServer`, `sessionMemoryService`, `workflowDistiller`, `embeddingService`                                                                                                                                          | MCP + session            |
| **Tier 7** | `*` (everything else)                                                                                                                                                                                                       | remaining                |

**CRITICAL_SERVICES** (must init): `kernel`, `configService`, `keyService`, `pricingService`.

**Анализ:**

- Tier 0–6 — **обязательны при старте** (≈24 сервиса). POTENTIAL memory footprint: значительный, но не измерено.
- Tier 7 = `'*'` — **все остальные сервисы инстанцируются при старте**. Это ~525 сервисов (549 − 24). **POTENTIAL risk:** если Tier 7 инстанцирует всё, startup может быть тяжёлым.
- lazyService **proxy** — сервис не создаётся, пока не попросят. Но `LifecycleManager.startAll()` может вызвать `.start()` на всех зарегистрированных. **Это UNKNOWN** — зависит от того, что `startAll()` реально делает.

### 3.3. Панели, загружаемые одновременно (на активном маршруте)

При открытии маршрута `/chat`:

| Что грузится                                                                                              | Тип                                  | Статус                  |
| --------------------------------------------------------------------------------------------------------- | ------------------------------------ | ----------------------- |
| `AppLayout` + Sidebar + Topbar                                                                            | eager                                | 🟢 всегда               |
| `route-registry` (4 файла)                                                                                | eager                                | 🟢 всегда               |
| `ChatPanel.tsx` (609 строк) + subtree                                                                     | lazy on demand                       | 🟢 при открытии /chat   |
| `ChatSidebar`, `ChatInputArea`, `ChatHeader`, `ChatMessagesSection`, `MarkdownRenderer`, `MermaidDiagram` | статические импорты внутри ChatPanel | 🟡 тянутся за ChatPanel |
| `MessageSearchPanel` (663 строки)                                                                         | conditional render                   | 🟡 при открытии поиска  |
| `ChatExportOverlay`                                                                                       | conditional render                   | 🟡 при экспорте         |

**При открытии `/debate`:** DebateArena + (lazy) DebatePanel + 9 подкомпонентов + framer-motion (165 файлов потенциально, но tree-shaking должен уменьшить).

**Simultaneous load: обычно 1 панель + layout + shared services.** Это **хорошо** — lazy-loading делает свою работу.

---

## 4. Сервисы, работающие постоянно (background)

### 4.1. Background `setInterval` в ядре (POTENTIAL — постоянно)

**39 `setInterval` в `src/kernel/services/`**, 15+ активных фоновых процессов:

| Сервис                                      | Что делает           |                Интервал | Стопается?            |
| ------------------------------------------- | -------------------- | ----------------------: | --------------------- |
| `agent-health-monitor`                      | heartbeat агентов    | `HEARTBEAT_INTERVAL_MS` | 🟢 probably on stop() |
| `logger-service`                            | flush persist buffer |         30 000 ms (30s) | 🟢 `persistTimer`     |
| `runtime-intelligence/diagnostic-service`   | auto-diagnostics     |                       ? | 🟢 `autoInterval`     |
| `runtime-intelligence/pressure-map-service` | refresh pressure     |                       ? | 🟢 `refreshInterval`  |
| `truth-consistency-monitor`                 | check truth          |                       ? | 🟢 `checkTimer`       |
| `chat-executor`                             | stale detection      |                       ? | 🟢 `_staleTimer`      |
| `metrics-service`                           | cleanup old metrics  |                       ? | 🟢 `cleanupInterval`  |
| `metrics-service`                           | capture metrics      |                       ? | 🟢 `captureInterval`  |
| `advisor-service`                           | periodic suggestions |                       ? | 🟢 `periodicInterval` |
| `blackboard-service`                        | evict expired        |               30 000 ms | 🟢 `cleanupTimer`     |
| `orchestration-service`                     | heap log             |                5 000 ms | 🟡 `if (DEBUG)` gated |
| `monitoring-service`                        | snapshot             |                       ? | 🟢 `snapshotInterval` |
| `cache-service`                             | evict expired        |               60 000 ms | 🟢 `evictionTimer`    |
| `rotation-service`                          | tick rotation        |               60 000 ms | 🟢 `monitorInterval`  |
| `topology-manager`                          | check topology       |                       ? | 🟢 `checkInterval`    |

**EVIDENCE:** все 15+ таймеров имеют **именованные ссылки** (`this.xxxTimer`), что позволяет cleanup. Это **хороший паттерн**.

**POTENTIAL risk:** эти таймеры **работают, даже если ни одна панель не открыта**. После `bootstrap.start()` они тикают, пока приложение живо. На single-page app это нормально, но **15+ одновременных интервалов** — это фоновая CPU/IO нагрузка.

### 4.2. `MemoryWatchdog` — встроенный мониторинг

`src/kernel/utils/memory-watchdog.ts` — логирует heap каждые 5 сек, warns при growth > 100 MB или absolute > 200 MB. **EVIDENCE:** проект **сам осознаёт** resource pressure и мониторит его.

### 4.3. ILifecycle-сервисы (325 шт.)

**325 сервисов имеют `async init()`/`start()`** — это значит, что при `LifecycleManager.startAll()` они могут запускать фоновую работу. **POTENTIAL** — но реальные метрики UNKNOWN.

---

## 5. Подписки: где создаются лишние

### 5.1. Распределение `eventBus.on` по компонентам

**97 подписок в 46 файлах компонентов** (всего 997 eventBus-вызовов во всём src).

**Топ-15 подписчиков:**

| Файл                                     | `eventBus.on` count |
| ---------------------------------------- | ------------------: |
| `DebateRuntimePanel.tsx`                 |                   6 |
| `KeyTable/SandboxTab.tsx`                |                   5 |
| `SchedulerPanel.tsx`                     |                   4 |
| `ProviderMarketplace.tsx`                |                   4 |
| `ArgumentGraphPanel.tsx`                 |                   4 |
| `SREAgentPanel.tsx`                      |                   3 |
| `ProviderManager/QuickTestSection.tsx`   |                   3 |
| `ProviderManager/ProviderTableRow.tsx`   |                   3 |
| `ProviderManager/OpenRouterKeyTable.tsx` |                   3 |
| `ProviderManager/GroqKeyTable.tsx`       |                   3 |
| `NvidiaEnterprise/NvidiaKeyTable.tsx`    |                   3 |
| `LiveCognition/MissionControl.tsx`       |                   3 |
| `KnowledgeGenPanel.tsx`                  |                   3 |
| `KeyTable/OverviewTab.tsx`               |                   3 |
| `JunctionPanel.tsx`                      |                   3 |

### 5.2. Подписки на высокочастотные события (POTENTIAL — hot path)

**Подписки на `EVENTS.MESSAGE_RESPONSE`** (эммитится на каждый ответ LLM, может быть 10+ в секунду при стриминге):

| Файл                                       | Подписка                                               |
| ------------------------------------------ | ------------------------------------------------------ |
| `KeyTable/SandboxTab.tsx`                  | `eventBus.on(EVENTS.MESSAGE_RESPONSE, ...)`            |
| `KeyTable/OverviewTab.tsx`                 | `EVENTS.MESSAGE_RESPONSE`                              |
| `AquariumPanel/hooks/useAquariumEngine.ts` | `eventBus.on(EVENTS.MESSAGE_RESPONSE, handleResponse)` |
| `ProviderManager/QuickTestSection.tsx`     | `eventBus.on(EVENTS.MESSAGE_RESPONSE, ...)`            |
| `ProviderManager/GroqKeyTable.tsx`         | `eventBus.on(EVENTS.MESSAGE_RESPONSE, ...)`            |
| `ProviderManager/OpenRouterKeyTable.tsx`   | `eventBus.on(EVENTS.MESSAGE_RESPONSE, ...)`            |
| `ProviderManager/ProviderTableRow.tsx`     | `eventBus.on(EVENTS.MESSAGE_RESPONSE, ...)`            |

**POTENTIAL risk:** **7+ панелей подписаны на `MESSAGE_RESPONSE`**. Если все 7 открыты одновременно (маловероятно, но возможно через split-view), каждый LLM-ответ триггерит 7 обработчиков. **Не измерено.**

**Подписки на `EVENTS.TRACE_UPDATED`** (эммитится на каждый шаг агента):

| Файл             | Подписка                                 |
| ---------------- | ---------------------------------------- |
| `TasksPanel.tsx` | `eventBus.on(EVENTS.TRACE_UPDATED, ...)` |

### 5.3. Cleanup-паттерны (PATTERN analysis)

**461 `useEffect` в компонентах, только 77 с cleanup (17%).**

**EVIDENCE — хорошо:** `usePolling` hook **сам управляет cleanup** (см. `src/components/Common/usePolling.ts`): `clearInterval` в `stop()`, `document.removeEventListener('visibilitychange', ...)`. Все 79 polling-панелей наследуют этот cleanup.

**EVIDENCE — требует проверки:** из 461 `useEffect` без cleanup — многие one-shot (fetch on mount), но **те, что подписываются на eventBus без cleanup, — leak**. Примеры для ревью:

| Случай                                                           | Риск                                                      |
| ---------------------------------------------------------------- | --------------------------------------------------------- |
| `eventBus.on(...)` в `useEffect` без `return () => unsub()`      | 🔴 leak — подписка остаётся после unmount                 |
| `setInterval` в `useEffect` без `return () => clearInterval(id)` | 🔴 leak — таймер тикает вечно                             |
| `fetch()` в `useEffect` без abort                                | 🟡 stale state update после unmount (не leak, но warning) |

**Top-15 подписчиков все используют `const unsub = eventBus.on(...)` паттерн с `return () => unsub()`** (проверено в `TasksPanel.tsx:363` — `const unsub = eventBus.on(EVENTS.TRACE_UPDATED, ...)` + cleanup). **EVIDENCE:** основные панели корректно чистят подписки.

### 5.4. Дублирующие подписки (POTENTIAL waste)

**Проблема:** несколькоpanels подписываются на **одно и то же событие** для получения **одних и тех же данных**. Пример: 4 панели `ProviderManager/*` (QuickTestSection, GroqKeyTable, OpenRouterKeyTable, ProviderTableRow) — все подписаны на `MESSAGE_RESPONSE` для обновления своих stats.

**Альтернатива:** подписка через Zustand store (`useKeyStore`), который сам подписан на eventBus один раз и раздаёт state через selectors. Это **уже используется** (см. `useKeyStore`, `useChatStore`, `useSystemStatus`).

**EVIDENCE:** проект **знает** паттерн store-as-single-subscriber, но не все панели им пользуются — некоторые подписываются напрямую.

---

## 6. Компоненты с тяжёлой memory-нагрузкой

### 6.1. Тяжёлые библиотеки в импортах (POTENTIAL)

| Библиотека                   |   Файлов используют | Типичный размер             | Риск                                               |
| ---------------------------- | ------------------: | --------------------------- | -------------------------------------------------- |
| **framer-motion**            |             **165** | ~50 KB gzip                 | 🟡 **широко** — тащится в каждый chunk с анимацией |
| React Flow (`@xyflow/react`) |                   6 | ~80 KB gzip                 | 🟡 только BuilderPanel и визуализации              |
| vis-network                  |                   5 | ~200 KB gzip                | 🟡 NavGraph, GraphWorkbench                        |
| Monaco editor                |                   2 | ~3 MB (!), но lazy-loadable | 🟢 только Monaco-using panels                      |
| TipTap                       |                   2 | ~100 KB gzip                | 🟢 ограниченное использование                      |
| Mermaid                      |                   1 | ~500 KB gzip                | 🟢 только MarkdownRenderer                         |
| Orama (BM25)                 | через memory.worker | ~100 KB                     | 🟢 в Web Worker                                    |
| Transformers.js              | через memory.worker | ~10 MB модель               | 🟡 **модель тащится в worker**                     |
| Dexie                        |           pervasive | ~30 KB gzip                 | 🟢 стандарт                                        |

**POTENTIAL risk — framer-motion:** 165 файлов импортируют `motion` или `AnimatePresence`. Даже с tree-shaking, **каждый chunk с framer-motion платит ~30–50 KB**. Если пользователь открывает 5 панелей с анимациями, это 5 chunks с framer-motion.

**EVIDENCE — Monaco lazy:** Monaco editor грузится только когда нужен (через `@monaco-editor/react` который сам lazy).

### 6.2. Web Workers (изоляция CPU-heavy)

**2 worker-файла:**

| Worker                             | Зачем                                | Загрузка CPU                 |
| ---------------------------------- | ------------------------------------ | ---------------------------- |
| `kernel/workers/sandbox.worker.ts` | Sandbox code execution (eval-banned) | 🟢 изолирован                |
| `kernel/workers/memory.worker.ts`  | BM25 index + embeddings              | 🟡 тяжёлая (Transformers.js) |

**EVIDENCE:** CPU-heavy работа вынесена в workers — **хороший паттерн**, не блокирует main thread.

### 6.3. In-memory Zustand stores (53 файла)

**53 store-файла в `src/stores/`.** Все state в памяти (в браузере), персистентность через сервисы (Dexie).

**Top stores по объёму потенциального state:**

| Store                                         | Что хранит                     | Риск                                           |
| --------------------------------------------- | ------------------------------ | ---------------------------------------------- |
| `useChatStore`                                | Все сессии, все сообщения      | 🟡 может быть большой при долгом использовании |
| `useKeyStore`                                 | Все ключи + stats + reputation | 🟢 ограничено                                  |
| `debateLiveStore`                             | Live events debate             | 🟡 растёт с длиной debate                      |
| `debate-session-store`                        | All sessions                   | 🟡                                             |
| `useSystemStatus`                             | Health vitals                  | 🟢 маленький                                   |
| `topologyTraceStore`                          | Trace steps                    | 🟡 может расти                                 |
| `directorStore`, `crewStore`, `councilStore`  | Director/crew/council state    | 🟢 ограничено                                  |
| `personaStore`, `trustStore`, `frontierStore` | Persona/trust/frontier         | 🟢                                             |

**POTENTIAL risk:** `useChatStore` и `debateLiveStore` могут расти без bounds. **Не измерено.**

### 6.4. Кэши в сервисах (in-memory)

| Сервис               | Что кэширует       | Eviction               |
| -------------------- | ------------------ | ---------------------- |
| `cache-service`      | LLM responses      | 🟢 60s `evictionTimer` |
| `blackboard-service` | blackboard entries | 🟢 30s `cleanupTimer`  |
| `metrics-service`    | metrics            | 🟢 cleanup interval    |
| `monitoring-service` | snapshots          | 🟢 interval            |

**EVIDENCE:** все major caches имеют **auto-eviction**. Это **хороший паттерн**.

---

## 7. Повторяющиеся запросы (polling duplication)

### 7.1. Polling panels — 79 вызовов `usePolling`

**Распределение интервалов:**

|        Интервал | Кол-во панелей | Примеры                                                                                                                   |
| --------------: | -------------: | ------------------------------------------------------------------------------------------------------------------------- |
| 15 000 ms (15s) |          **9** | GuardiansPanel, SessionBindingsPanel, DiagnosticPanel, BudgetAlertsPanel, RotationView, DebateSystemResearch, PromptAudit |
| 10 000 ms (10s) |              5 | (various)                                                                                                                 |
|   5 000 ms (5s) |          **5** | SREAgentPanel, GroqSpeedDashboard, PricingPanel, DebateReplayPanel                                                        |
| 30 000 ms (30s) |              1 | BudgetPanel                                                                                                               |
| 60 000 ms (60s) |              1 | RotationsPanel                                                                                                            |
|   3 000 ms (3s) |              1 | (various)                                                                                                                 |
|   2 000 ms (2s) |              1 | TutorialPanel                                                                                                             |
| 1 500 ms (1.5s) |              1 | AudiencePanel                                                                                                             |
|      **300 ms** |          **1** | **GeminiLivePanel** ⚠                                                                                                     |

**⚠ GeminiLivePanel — 300ms polling** — **3.3 запроса в секунду**. POTENTIAL: если панель открыта, это 200 fetches/мин. **Не измерено**, но это **самый агрессивный poll в проекте**.

### 7.2. Дублирование polling одной и той же data (POTENTIAL)

**Пример:** провайдер stats.

| Панель                             | Что polled                   |    Интервал |
| ---------------------------------- | ---------------------------- | ----------: |
| `ProviderDashboard`                | `usePolling(() => { ... })`  | (из топ-20) |
| `GroqSpeedDashboard`               | `usePolling(load, 5000)`     |          5s |
| `RotationView`                     | `usePolling(refresh, 15000)` |         15s |
| `ProviderManager/ProviderTableRow` | (subscribes events)          |           — |
| `ProviderManager/QuickTestSection` | (subscribes events)          |           — |

**POTENTIAL:** если пользователь открывает `ProviderDashboard` + `GroqSpeedDashboard` одновременно (split-view), оба poll раз в 5s → 2 fetches каждые 5s на ту же data. **Не измерено.**

### 7.3. Дублирование вызовов сервисов (static analysis)

| Сервис             | Кол-во вызовов в компонентах | Распределение                          |
| ------------------ | ---------------------------: | -------------------------------------- |
| `eventBus.*`       |                      **248** | pervasive (нормально)                  |
| `keyService.*`     |                           78 | 6+ provider panels — POTENTIAL overlap |
| `advisorService.*` |                           25 | SRE + Budget                           |
| `debateEngine.*`   |                           26 | debate panels                          |
| `budgetService.*`  |                           18 | budget panels                          |
| `memoryEngine.*`   |                            0 | через hooks (хорошо!)                  |

**EVIDENCE — хорошо:** `memoryEngine` не вызывается из компонентов напрямую (0 calls), только через hooks — значит, **один subscription point** в hook. Это **правильный паттерн**.

**POTENTIAL — внимание:** `keyService` вызывается из 78 мест в компонентах — если каждый вызов идёт в IndexedDB, это 78 точек доступа. Но `useKeyStore` (Zustand) должен агрегировать.

---

## 8. Что можно запускать лениво (lazy candidates)

### 8.1. Уже lazy — 209 панелей

`src/route-imports.ts` — **209 `React.lazy()` из 268 панелей** (78%). Все основные панели (ChatPanel, ProviderManager, DebateArena, MemoryPanel, HealthPanel, SREAgentPanel, BuilderPanel и т.д.) — lazy.

**EVIDENCE:** архитектура последовательно ленивая.

### 8.2. НЕ lazy — кандидаты на ленивость

| Что сейчас eager                    | Почему                                    | Можно ли lazy?                                                                              |
| ----------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------- |
| `TECHNIQUE_PANEL_COMPONENTS` bundle | Импортируется в `route-imports.ts` сверху | 🟡 **ДА** — сами technique panels lazy внутри bundle, но bundle registry можно грузить lazy |
| `CommandPalette`                    | Импортируется в `App.tsx` напрямую        | 🟡 **ДА** — Cmd+K не нужен сразу                                                            |
| `AppLayout`                         | В `App.tsx`                               | 🔴 НЕТ — нужен всегда                                                                       |
| `ResponsiveShell`                   | В `App.tsx`                               | 🔴 НЕТ — нужен всегда                                                                       |
| `route-registry-*.ts` (4 файла)     | Импортируются в `AppLayout`               | 🟡 частично — иконки можно lazy                                                             |
| Sidebar                             | В `AppLayout`                             | 🟡 можно lazy-prefetch                                                                      |

### 8.3. Сервисы Tier 7 (`*` — all remaining)

**Проблема:** `INIT_TIERS[7] = ['*']` — означает «все остальные сервисы». Если `LifecycleManager.startAll()` инстанцирует все 525 remaining сервисов при старте — это **большая startup-нагрузка**.

**EVIDENCE:** lazyService создаёт proxy, не сам сервис — инстанциация происходит при первом обращении. **НО** если `startAll()` вызывает `.start()` на всех, тогда стартуют **background timers** всех 39+ сервисов с `setInterval`.

**UNKNOWN:** не ясно из статического анализа, вызывает ли `startAll()` только CRITICAL_SERVICES или все. **Требует runtime-проверки.**

### 8.4. Phase-by-phase registration (81 phase file)

**549 service registrations** разбиты на 81 phase-файл (`phase0-event-bridge.ts` → `phase81-wiki-brain.ts`). Это **готовая инфраструктура для ленивой регистрации** — но сейчас все phase-файлы импортируются в `service-registration/index.ts` eagerly.

**POTENTIAL optimization:** динамический `import('./phase75-provider-embeddings')` только когда открывается соответствующая панель.

---

## 9. Какие панели можно выгружать при отсутствии использования

### 9.1. Текущий механизм выгрузки

**React.lazy + Suspense + ErrorBoundary** — когда пользователь уходит с маршрута, React unmount'ит компонент, garbage collector очищает state.

**ОДНАКО:**

1. **Сервисы ядра не выгружаются** — 407 lazyService-синглтонов живут вечно после первого обращения. Даже если панель закрыта, сервис остаётся.
2. **Background timers не останавливаются** — 15+ `setInterval` тикают, пока приложение живо.
3. **eventBus subscriptions** — если панель корректно делает cleanup в `useEffect`, подписка снимается. Если нет — остаётся (см. §5.3).
4. **Zustand stores** — state переживает unmount компонента. `useChatStore` хранит все сессии, даже если ChatPanel закрыт.

### 9.2. Cleanup-статус по топ-15 polling panels

| Панель                     | usePolling cleanup?  | eventBus cleanup? | Verdict                         |
| -------------------------- | -------------------- | ----------------- | ------------------------------- |
| `SREAgentPanel`            | 🟢 auto (usePolling) | 🟢 yes            | 🟢 выгружается корректно        |
| `BudgetPanel`              | 🟢 auto              | 🟡 check          | 🟢 вероятно ОК                  |
| `AudiencePanel` (1500ms)   | 🟢 auto              | 🟡 check          | 🟢 вероятно ОК                  |
| `GeminiLivePanel` (300ms!) | 🟢 auto              | 🟡 check          | 🟡 poll частый, но cleanup есть |
| `DebateReplayPanel`        | 🟢 auto              | 🟡 check          | 🟢 вероятно ОК                  |
| `GroqSpeedDashboard`       | 🟢 auto              | 🟡 check          | 🟢 вероятно ОК                  |
| `DiagnosticPanel`          | 🟢 auto              | 🟡 check          | 🟢 вероятно ОК                  |
| `PerformanceProfilerPanel` | 🟢 auto              | 🟡 check          | 🟢 вероятно ОК                  |

**EVIDENCE:** `usePolling` hook **гарантированно чистит interval** при unmount + при visibility hidden. Это **хорошо** — 79 polling panels не утекают.

### 9.3. Кандидаты на агрессивную выгрузку (POTENTIAL)

| Панель                                              | Почему                | Рекомендация                                                          |
| --------------------------------------------------- | --------------------- | --------------------------------------------------------------------- |
| `AquariumPanel` (experimental, framer-motion heavy) | Decorative, не core   | 🟡 unload on route change + remount on visit                          |
| `FederatedMemoryPanel` (experimental)               | Rarely used           | 🟡 prefetch low priority                                              |
| 62 TechniquePanels                                  | Uniform, конфигурация | 🟡 **объединить в 1 catalog** (см. Feature Value Map) — меньше chunks |
| `TimeMachinePanel`                                  | Situative             | 🟡 OK as is (lazy)                                                    |
| `DeployPanel` (782 строки)                          | Heavy, rare           | 🟡 prefetch on BuilderPanel hover                                     |

### 9.4. Prefetch strategy (POTENTIAL)

Сейчас lazy-loading **реактивный** — грузится при открытии маршрута. Возможна **проактивная prefetch**:

- На hover по Sidebar-элементу → prefetch chunk
- После загрузки ChatPanel → prefetch DebateArena + ProviderManager (вероятно следующие)
- В idle время → prefetch топ-10 частых панелей

**Сейчас этого нет** (POTENTIAL optimization, не реализовано).

---

## 10. Сводная карта ресурсов по разделам

| Раздел             |    Lazy panels |                                                          Polling |              Subscriptions | Heavy libs                                | Риск             |
| ------------------ | -------------: | ---------------------------------------------------------------: | -------------------------: | ----------------------------------------- | ---------------- |
| Чат                |            4/4 |                                                                0 |                        ~10 | framer-motion, Mermaid (via Markdown)     | 🟢 LOW           |
| Дебаты             |          14/14 |                                              1 (DebateReplay 5s) |     ~20 (DebateRuntime 6!) | framer-motion, React Flow (ArgumentGraph) | 🟡 MED           |
| Техники            | 62/62 (bundle) |                                                                0 |                         ~5 | framer-motion                             | 🟢 LOW           |
| Агенты             |          12/12 |                                                                0 |                        ~10 | framer-motion                             | 🟢 LOW           |
| Диагностика        |          17/17 |                 3 (Diagnostic, PressureMap, PerformanceProfiler) |                        ~10 | vis-network (DependencyMap)               | 🟡 MED           |
| Бюджет AI          |            8/8 | 4 (Budget 30s, BudgetAlerts 15s, CostAnalytics, PricingPanel 5s) |                         ~5 | —                                         | 🟡 MED (overlap) |
| Панель (Dashboard) |         ~21/21 |                                            1 (ProviderDashboard) |                         ~5 | framer-motion                             | 🟢 LOW           |
| AI провайдеры      |           ~6/6 |            3 (GroqSpeed 5s, RotationView 15s, ProviderDashboard) | ~15 (4 KeyTables × 3 subs) | —                                         | 🟡 MED (overlap) |
| SRE                |            1/1 |                                                  1 (SREAgent 5s) |                          3 | —                                         | 🟢 LOW           |
| Знания             |           ~5/5 |                                                                0 |                         ~5 | Orama (worker)                            | 🟢 LOW           |
| Системная память   |           ~6/6 |                                                                0 |                         ~3 | Transformers.js (worker)                  | 🟡 MED (model)   |
| Интеграции         |         ~10/10 |                                                                0 |                         ~5 | —                                         | 🟢 LOW           |
| Лаборатория        |           ~6/6 |                                                                0 |                         ~3 | framer-motion (Aquarium heavy)            | 🟡 MED           |
| Остальное          |         ~15/15 |                                   1 (GeminiLivePanel **300ms**!) |                        ~10 | Monaco (2 panels)                         | 🟡 MED           |

---

## 11. Потенциальная vs измеренная нагрузка — сводка

| Что                     | POTENTIAL (статика)                  | EVIDENCE (паттерн)                               | MEASURED (runtime) |
| ----------------------- | ------------------------------------ | ------------------------------------------------ | ------------------ |
| Стартовый бандл         | ~150–200 KB eager JS                 | 🟢 минимальный eager                             | ❌ не измерено     |
| Bootstrap время         | 8 tiers × ~24 сервиса + Tier 7 = 525 | lazyService proxy задерживает инстанциацию       | ❌ не измерено     |
| Background CPU          | 15+ `setInterval` постоянно          | 🟢 все с именованными timer refs для cleanup     | ❌ не измерено     |
| Memory framer-motion    | 165 файлов, ~50 KB per chunk         | 🟢 tree-shaking должен уменьшить                 | ❌ не измерено     |
| Memory Monaco           | 2 панели, ~3 MB                      | 🟢 lazy через @monaco-editor/react               | ❌ не измерено     |
| Memory Transformers.js  | через memory.worker                  | 🟡 модель ~10 MB в worker                        | ❌ не измерено     |
| Polling load            | 79 polls, 9×15s, 5×5s, 1×300ms       | 🟢 usePolling auto-pauses on hidden              | ❌ не измерено     |
| Subscriptions leak risk | 461 useEffect, 77 с cleanup (17%)    | 🟡 основные панели корректны, но 84% need review | ❌ не измерено     |
| Stores memory           | 53 Zustand stores                    | 🟡 useChatStore может расти без bounds           | ❌ не измерено     |
| Caches                  | 4+ major caches                      | 🟢 все с auto-eviction                           | ❌ не измерено     |
| Service duplication     | keyService 78 calls, eventBus 248    | 🟢 useKeyStore агрегирует                        | ❌ не измерено     |
| Web Workers CPU         | 2 workers (sandbox, memory)          | 🟢 изолированы от main thread                    | ❌ не измерено     |

**Главный вывод:** **ВСЕ цифры — POTENTIAL, ничего не измерено.** Архитектура хорошая (lazy везде, cleanup паттерны, auto-eviction), но **реальную нагрузку можно получить только через Chrome DevTools Performance + Memory tabs** при реальном использовании.

**MemoryWatchdog** (`src/kernel/utils/memory-watchdog.ts`) — встроенный мониторинг heap (5s interval, warns at +100 MB growth или >200 MB absolute). **Это единственный измерительный инструмент в проекте**, но его выводы идут в logger, не в UI.

---

## 12. Рекомендации по оптимизации ресурсов

### Быстрые победы (high-ROI, low-effort)

1. **Снизить `GeminiLivePanel` polling с 300ms до 1000ms+** — сейчас 3.3 fetches/sec, это **самый дорогой poll в проекте**. Если panel должна быть real-time, использовать WebSocket / SSE вместо polling.
2. **Prefetch топ-5 likely-next panels** на hover по Sidebar — ChatPanel → DebateArena + ProviderManager + MemoryPanel. React.lazy + `import()` в `onMouseEnter`.
3. **Lazy-load `TECHNIQUE_PANEL_COMPONENTS` bundle** — сейчас eager в `route-imports.ts`, но нужен только при открытии `/techniques/*` маршрута.
4. **Lazy-load `CommandPalette`** в `App.tsx` — нужен только при Cmd+K, можно prefetch после idle.
5. **Аудит 461 `useEffect` без cleanup** — найти те, что подписываются на eventBus/setInterval без cleanup, добавить cleanup. ~50–100 wahrscheinlich-leak эффектов.

### Среднесрочные (квартал)

6. **Объединить 5 budget panels + 4 health panels + 4 provider UIs** в табов-хабы (см. Feature Value Map §6.2) — меньше одновременно открытых polling panels.
7. **Внедрить cache layer для polling** — если 2 панели poll одну data, debounce через shared Zustand selector. Пример: `useKeyStore` уже это делает для keys — распространить на `budgetService`, `advisorService`.
8. **Centralize subscriptions через stores** — убрать прямые `eventBus.on` из компонентов (97 подписок), заменить на store selectors.
9. **Service registration lazy-by-phase** — `import('./phase75-provider-embeddings')` только при открытии соответствующей панели. Сейчас все 81 phase-файла импортируются eagerly.
10. **RFC: выгрузка сервисов** — сейчас lazyService singleton живёт вечно после первого обращения. Для rarely-used сервисов (FederatedMemory, Aquarium, CrystalVault) — рассмотреть `idleTimeout` eviction.

### Стратегические

11. **Runtime observability dashboard** — `MemoryWatchdog` уже собирает heap data, вывести это в UI-панель (HealthPanel или отдельная ResourceMonitorPanel). Сейчас данные только в логах.
12. **Bundle analyzer** — `vite-bundle-visualizer` в CI, отслеживать chunk sizes. С 165 framer-motion файлов легко получить fat chunks.
13. **Service worker for caching** — LLM responses cacheable через service worker (offline support + меньше повторных fetch).
14. **Web Worker для MarkdownRenderer** — Mermaid rendering тяжёлый, вынести в worker.
15. **Измерить startup time** — добавить `performance.mark` в `bootstrap.ts` на каждом tier, писать в logger. Сейчас 8 tiers инициализируются последовательно, но время не трекается.

---

## 13. Итоговый вердикт по ресурсам

| Метрика                    |   Оценка   | Комментарий                                                          |
| -------------------------- | :--------: | -------------------------------------------------------------------- |
| Lazy-loading охват         |  **9/10**  | 209/268 панелей lazy, только 3 eager                                 |
| Bootstrap архитектура      |  **8/10**  | 8 tiers, явный порядок, CRITICAL_SERVICES определены                 |
| Cleanup паттерны           |  **7/10**  | usePolling корректный, но 84% useEffect без cleanup (нужен аудит)    |
| Background timers          |  **6/10**  | 15+ постоянно работающих, но все с cleanup refs                      |
| Polling discipline         |  **6/10**  | 79 polls, один 300ms (агрессивный), остальное разумное               |
| Memory hygiene             |  **7/10**  | Caches с eviction, MemoryWatchdog, но stores без bounds              |
| Subscription discipline    |  **6/10**  | 97 подписок в компонентах, 7+ на MESSAGE_RESPONSE — стоит centralize |
| Web Worker usage           |  **8/10**  | 2 workers для CPU-heavy (sandbox, memory)                            |
| Prefetch strategy          |  **3/10**  | нет proactive prefetch, только reactive lazy                         |
| Измерение ресурсов         |  **4/10**  | только MemoryWatchdog в логах, нет UI dashboard                      |
| **Overall Resource Score** | **6.5/10** | архитектура хорошая, измерений мало                                  |

**Сильные стороны:**

- 78% панелей lazy-loaded
- 407 lazyService singletons — все proxy, не eager
- 8-tier bootstrap с явным порядком
- `usePolling` auto-pauses на hidden tab — **это редкая и хорошая практика**
- 2 Web Workers изолируют CPU-heavy
- MemoryWatchdog встроен
- Все major caches с auto-eviction
- Cleanup refs у всех background timers

**Слабые стороны:**

- 165 файлов с framer-motion — потенциально fat chunks
- 1 панель с polling 300ms (GeminiLivePanel)
- 84% `useEffect` без cleanup (нужен аудит на leaks)
- 97 прямых `eventBus.on` в компонентах вместо store selectors
- Нет proactive prefetch
- Нет runtime resource dashboard в UI
- Tier 7 = `'*'` — все remaining сервисы регистрируются eagerly
- Все 81 phase-файла импортируются в `index.ts` eagerly

**Главный риск:** **измеренная нагрузка неизвестна.** Архитектура выглядит хорошо, но без runtime profiling нельзя сказать, **реально ли** 15 background timers проблемны, **реально ли** 300ms polling роняет CPU, **реально ли** stores растут без bounds.

**Рекомендация №1:** добавить runtime observability в UI (расширить `HealthPanel` или создать `ResourceMonitorPanel`) — вывести heap, eventBus throughput, active subscriptions, polling count. Сейчас есть `MemoryWatchdog` в логах, нужно в UI.

---

## Приложение A. Все метрики в цифрах

| Метрика                             |            Значение | Тип          | Источник                                    |
| ----------------------------------- | ------------------: | ------------ | ------------------------------------------- |
| Lazy panels                         |             209/268 | POTENTIAL    | `route-imports.ts` (`grep -c "React.lazy"`) |
| Eager imports                       |                   3 | POTENTIAL    | `route-imports.ts`                          |
| lazyService singletons              |                 407 | POTENTIAL    | `kernel/instances/*.ts`                     |
| Service registrations               |                 549 | POTENTIAL    | `service-registration/*.ts`                 |
| Init tiers                          |                   8 | ARCHITECTURE | `bootstrap-phases.ts`                       |
| Background `setInterval` (services) |     39 (15+ active) | POTENTIAL    | `grep setInterval src/kernel/services`      |
| `usePolling` calls                  |                  79 | POTENTIAL    | `grep usePolling src/components`            |
| Polling interval 300ms              | 1 (GeminiLivePanel) | POTENTIAL    | grep                                        |
| Polling interval 1500ms             |   1 (AudiencePanel) | POTENTIAL    | grep                                        |
| Polling interval 15s                |            9 panels | POTENTIAL    | grep                                        |
| `eventBus.on` in components         |                  97 | POTENTIAL    | grep                                        |
| Files with subscriptions            |                  46 | PATTERN      | grep                                        |
| Total `eventBus.*` calls            |                 997 | POTENTIAL    | grep                                        |
| `useEffect` total                   |                 461 | POTENTIAL    | grep                                        |
| `useEffect` with cleanup            |            77 (17%) | PATTERN      | grep                                        |
| framer-motion importers             |                 165 | POTENTIAL    | grep                                        |
| React Flow importers                |                   6 | POTENTIAL    | grep                                        |
| vis-network importers               |                   5 | POTENTIAL    | grep                                        |
| Monaco importers                    |                   2 | POTENTIAL    | grep                                        |
| TipTap importers                    |                   2 | POTENTIAL    | grep                                        |
| Mermaid importers                   |                   1 | POTENTIAL    | grep                                        |
| Web Workers                         |                   2 | ARCHITECTURE | `find src -name "*.worker.ts"`              |
| Zustand stores                      |                  53 | POTENTIAL    | `ls src/stores`                             |
| ILifecycle services                 |                 325 | POTENTIAL    | grep                                        |
| Service phase files                 |                  81 | ARCHITECTURE | `ls service-registration`                   |
| `keyService` calls in components    |                  78 | POTENTIAL    | grep                                        |
| `eventBus` calls in components      |                 248 | POTENTIAL    | grep                                        |
| `MESSAGE_RESPONSE` subscribers      |                  7+ | POTENTIAL    | grep                                        |
| `MemoryWatchdog`                    |                   1 | EVIDENCE     | `kernel/utils/memory-watchdog.ts`           |
| `usePolling` auto-pause on hidden   |              ✅ yes | EVIDENCE     | `Common/usePolling.ts`                      |
| Cache eviction timers               |                  4+ | EVIDENCE     | services                                    |

---

## Приложение B. Источники и метод

| Что                       | Где                                    | Как проверено                                                                                           |
| ------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Lazy imports              | `src/route-imports.ts`                 | `grep -cE "React.lazy\|lazy\("`                                                                         |
| Eager imports             | `src/route-imports.ts`                 | `grep -E "^import.*from '\./components"`                                                                |
| Singleton pattern         | `src/kernel/instances/*.ts`            | `grep -rE "lazyService<"`                                                                               |
| Bootstrap tiers           | `src/kernel/bootstrap-phases.ts`       | чтение `INIT_TIERS`, `CRITICAL_SERVICES`                                                                |
| Service registrations     | `src/kernel/service-registration/*.ts` | `grep -rE "register\("`                                                                                 |
| Background timers         | `src/kernel/services/*.ts`             | `grep -rE "setInterval\("`                                                                              |
| Polling                   | `src/components/**`                    | `grep -rE "usePolling\("`                                                                               |
| Subscriptions             | `src/components/**`                    | `grep -rE "eventBus\.on\("`                                                                             |
| Cleanup patterns          | `src/components/**`                    | `grep -rE "return \(\) =>.*clear"`                                                                      |
| Heavy libs                | `src/**`                               | `grep -rlE "from 'framer-motion'\|@xyflow/react\|vis-network\|@monaco-editor\|@tiptap\|from 'mermaid'"` |
| Web Workers               | `src/**`                               | `find -name "*.worker.ts"`                                                                              |
| Stores                    | `src/stores/`                          | `ls`                                                                                                    |
| Service duplication       | `src/components/**`                    | `grep -rE "keyService\.\|memoryEngine\.\|debateEngine\.\|eventBus\.\|budgetService\."`                  |
| Memory watchdog           | `src/kernel/utils/memory-watchdog.ts`  | полное чтение                                                                                           |
| usePolling implementation | `src/components/Common/usePolling.ts`  | полное чтение                                                                                           |

---

## Сверка с аудитами (волны 2–8)

Дополнительные факты по ресурсам из волн аудитов:

- W6-032: `costHistory` count-cap занижал monthlySpend (исправлено → time-retention) — меньше записи/пересчёта.
- W8-015: `LtMemoryService.recall` грузит всё и пишет `lastAccessedAt` на каждый вызов — O(n) записей.
- W8-012/014: HybridRetrievalService/VectorSpace — O(N)/O(NxD)-скан на запрос, unbounded vectorCache.
- W8-013: SemanticMemoryStore + 4 store — cap+sort-per-write.
- W8-016: LLMHttpClient — один глобальный 50-слотный семафор без per-tenant fairness.
- W8-018: ChatExecutor activeRequests без лимита.
- W6-013: `AbortSignal.any()` утечка (исправлено → ручной контроллер).
- W6-023: ReDoS-гвард (исправлено) — защита от главного потока.

---

_Отчёт сгенерирован 2026-10-31 на основе коммита `e08ab8e`. Все оценки — статический анализ; **реальная нагрузка НЕ измерена**, приложение не запускалось. Парные отчёты: «Карта готовности панелей» (качество), «Карта функциональной ценности» (зачем нужно), «Карта технического состояния» (здоровье кода)._
