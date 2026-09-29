# Аудит репозитория ai-os-new (SuperAgents OS)

**Репозиторий:** https://github.com/egilyad/ai-os-new
**Версия аудита:** по коммиту `934c27a` («fix: break last 2 kernel circular deps»)
**Дата:** 26.09.2026
**Масштаб:** ~2 659 файлов TS/TSX, ~430 000 строк кода, 367 тестовых файлов, ~513 DI-сервисов, 211 маршрутов/панелей
**Стек:** React 19 · TypeScript 6 · Vite 8 · Zustand 4 · Dexie 4 (IndexedDB) · Zod 4 · DOMPurify · framer-motion · Vitest 4 · Playwright · GitHub Actions CI

**Методика:** статический анализ исходного кода с верификацией каждой находки по конкретным файлам и строкам (указаны в формате `файл:строка`). Уровни серьёзности: 🔴 Critical · 🟠 High · 🟡 Medium · 🔵 Low · ⚪ Info. Ключевые находки перепроверены вручную.

---

## Сводка по 12 аудитам

| # | Аудит | Оценка | Критичные проблемы |
|---|-------|:------:|--------------------|
| 1 | Безопасность | **6/10** | Ключи API в plaintext при ложном заявлении об шифровании; CSP блокирует половину провайдеров |
| 2 | Жизненный цикл и состояние | **7/10** | `SystemBootstrap.init()` не идемпотентен; «застревание» после неудачного бутстрапа |
| 3 | Стриминг, таймеры, отмена | **7.5/10** | Семафор не учитывает отмену ожидающих; stall-таймаут стрима по умолчанию выключен |
| 4 | UX, производительность, утечки UI | **7/10** | Ре-рендер сайдбара чата на каждом rAF во время стриминга; анимация width вместо transform |
| 5 | Архитектура и зависимости | **7.5/10** | 513 сервисов в 94 phase-файлах; 3 параллельных HTTP-стека; 9 МБ документационного балласта |
| 6 | Обработка ошибок и логирование | **6.5/10** | 454 «комментарий-только» catch; персистентность логгера не подключена; дубли глобальных хендлеров |
| 7 | Сеть и API | **7/10** | Groq-адресат обходит общий HTTP-слой (до 12 повторов); валидация ответов носит рекомендательный характер |
| 8 | Хранение данных и кэширование | **6/10** | Тест схемы зафиксирован на v35 при реальной v43; несбрасываемые таблицы; «семантический» кэш на FNV-хэше |
| 9 | Тестирование и покрытие | **5.5/10** | Ядро сети (llm-http-client) не покрыто тестами; e2e = 4 smoke-проверки; синтаксическая ошибка в панели = сборка не гонялась |
| 10 | Конфигурация и окружение | **6.5/10** | 4 несовпадающих определения CSP; мёртвые переменные окружения; лимит ворнингов линтера — 5 200 |
| 11 | Доступность и i18n | **6/10** | Нет плюрализации (критично для русского); гонка загрузки локали; диалоги без фокус-трапа |
| 12 | Сборка и деплой | **7/10** | 4 ГБ heap для сборки; нет brotli/прекомпресса; отсутствие Cache-Control для index.html |

**Общая оценка: 6.6/10** — зрелая, глубоко проработанная система с выдающейся инженерной культурой документирования инцидентов (метки B-03, G-03, H-09… прямо в коде), но с рядом системных рисков в безопасности хранения ключей, целостности CSP и полноте тестового покрытия сетевого ядра.

---

## Аудит 1. Безопасность (Security Core)

**Цель:** недопущение компрометации данных и системы.

### Находки

**🟠 [S-1] API-ключи хранятся в plaintext, при этом UI заявляет обратное**
`src/kernel/services/key-management/key-vault.ts:29-37`:
```ts
// NOTE: Vault is intentionally NOT wired into the app's bootstrap.
// See key-registry.ts:619: "Vault system removed — keys stored as plaintext".
// API keys are stored in IndexedDB in plaintext by design.
```
Полноценное AES-GCM + PBKDF2 хранилище (100k итераций, случайный IV) реализовано, но не подключено к бутстрапу: `SecurityService.initialize(password)` не вызывается нигде вне тестов, поэтому `encrypt()` всегда возвращает `null`. При этом `src/components/SettingsPanel/SettingsPanel.tsx:356` сообщает пользователю: *«Keys are stored encrypted via KeyVault + Dexie apiKeys»* — заявление фактически ложно. Любой успешный XSS выкачивает все ключи провайдеров. Это проблема доверия/комплаенса, а не просто криптографии.

**🟠 [S-2] CSP блокирует 10+ провайдеров, которым приложение звонит напрямую**
`index.html:19` (meta CSP) содержит `connect-src` без `api.deepseek.com`, `api.moonshot.ai`, `api.minimax.io`, `dashscope-intl.aliyuncs.com`, `api.mistral.ai`, `api.cohere.com`, `api.perplexity.ai` и др. При этом адаптеры дозваниваются напрямую: `src/llm/deepseek/deepseek-adapter.ts:23` — `super('deepseek', 'https://api.deepseek.com/v1', false); // C-01: no /proxy/deepseek route` (аналогично together/fireworks/mistral/cohere/huggingface/perplexity/qwen/kimi/minimax в `adapter-factory.ts:127-208`). Meta-CSP и заголовок CSP применяются как пересечение → в проде запросы к DeepSeek/Kimi/MiniMax/Perplexity и другим будут заблокированы браузером. Проверено: `api.deepseek.com` есть в `docker/nginx.conf`, но отсутствует в `index.html` и `docker/nginx-ssl.conf`.

**🟡 [S-3] Monaco-редактор грузится с CDN, который CSP блокирует**
`src/components/Editors/CodeEditor.tsx:2` — `import Editor from '@monaco-editor/react'` без `loader.config(...)` нигде в репозитории. `@monaco-editor/react` v4 по умолчанию тянет monaco с `cdn.jsdelivr.net`, но CSP — `script-src 'self' 'wasm-unsafe-eval'` → редактор не загрузится в проде. При этом `monaco-editor@^0.52.2` (~5 МБ) лежит в зависимостях неиспользуемым.

**🟡 [S-4] Forum renderBody не экранирует кавычки → инъекция в атрибут**
`src/kernel/services/forum/forum-service.ts:327-337` — ручное экранирование `&`, `<`, `>` без `"`:
```ts
const escaped = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
return escaped.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" …');
```
Пост вида `[x](http://e.com/" onmouseover="alert(1)")` даёт `<a href="http://e.com/" onmouseover="alert(1)">`. Рендерится сырьём через `dangerouslySetInnerHTML` в `ForumPanel/TopicView.tsx:137`, а авторами постов могут быть агенты (LLM-вывод). `javascript:`-схема заблокирована, CSP режет inline-хендлеры, но до полного XSS — один рефакторинг.

**🟡 [S-5] Bearer-секрет Company Gateway в localStorage, 7 панелей**
`src/components/ApprovalsPanel.tsx:27-28,106-113`: `localStorage.setItem('companyGateway.secret', secret)` + `Authorization: Bearer` на задаваемый пользователем URL (по умолчанию `http://localhost:3001`). Тот же паттерн в `CompaniesPanel`, `CostsPanel`, `AdaptersPanel`, `IssuesPanel`, `PortabilityPanel`, `RunsPanel`. Плюс `webhookSecret` в localStorage (`kernel/services/config-registry.ts:312-319`).

**🟡 [S-6] Импорт ключей без zod-валидации**
`src/stores/useKeyStore.ts:156-158` — `JSON.parse` без схемы и лимита размера, несмотря на то что `ApiKeySchema` уже экспортируется из `src/types/schemas.ts`.

**🔵 [S-7] Отладочные хелперы в проде без гейта DEV** — `src/main.tsx` в конце файла цепляет `w.__getState`, `w.__checkConsistency`, `w.__probeAll` без `import.meta.env.DEV`.

**🔵 [S-8] e2e-job CI без `permissions:`** (`.github/workflows/ci.yml:269-273`) — остальные джобы пинят `contents: read`, этот наследует дефолтные права токена.

**⚪ [S-9] Аутентификации в SPA нет — осознанно.** Приложение локальное; граница доверия — sync-сервер, где аутентификация реализована корректно (см. позитив). Документировано предупреждение о plaintext-HTTP для дефолтного docker-профиля (`docker/nginx.conf:4-7`).

**⚪ [S-10] Утечек секретов в git-истории не найдено** — сканирование 200 ревизий по паттернам `sk-`, `AIza`, `gsk_`, `nvapi-`, `hf_` нашло только сами детекторы. `.gitignore` корректно исключает `.env`, `api-keys-backup.json`, скрипты массового импорта.

### Позитивные практики
- **Песочница — настоящая защита в глубину:** LLM-код исполняется через AST-интерпретатор meriyah, а не `eval`/`new Function` (`kernel/workers/sandbox.worker.ts:7-9`); блоклист ~40 запрещённых идентификаторов, шаг-лимит 2M, таймаут, опт-ин в проде.
- **CodeRunner:** sandboxed iframe (`allow-scripts` без `allow-same-origin`), blob:-URL, per-frame CSP `default-src 'none'`, проверка origin в postMessage, подтверждение пользователем.
- **cors-proxy — не open relay:** обязательный `CORS_ORIGIN` с отказом на `*`, allowlist доменов, защита от DNS-rebinding (подключение по резолвнутому IP), срез credential-заголовков.
- **Sync-сервер:** fail-fast на `SYNC_SECRET`, timing-safe сравнение токенов, rate-limit, лимит тела 256 КБ.
- **Редакция ключей в логах:** `sanitize.ts` с 9 паттернами провайдерных ключей встроен в logging-decorator.
- **SSRF-защита tool-fetch:** https-only, блок приватных IP, per-tool allowlist, анти-промпт-инжекшн обёртка вывода.

---

## Аудит 2. Жизненный цикл и состояние (Lifecycle & State)

**Цель:** стабильность и предсказуемость.

### Находки

**🟠 [L-1] `SystemBootstrap.init()` не идемпотентен при конкурентном вызове**
`src/kernel/bootstrap.ts:68-69, 145, 157`:
```ts
async init(): Promise<BootstrapReport> {
    if (this.isStarted) return this.getReport();  // isStarted ставится ТОЛЬКО после завершения init
```
Два конкурентных `init()` (гонка `RuntimeManager.start()` с прямым вызовом в тестах/HMR) оба пройдут проверку и выполнят `registerMigratedServices()` дважды → дублирование фабрик, два `MemoryWatchdog` с 5-секундными интервалами, двойное событие `RUNTIME_READY`. Митигируется только `startPromise` у RuntimeManager, который защищает одного вызывающего. Показательно, что `Kernel.init()` реализует правильный паттерн promise-caching (`kernel.ts:83-100`) — бутстрапу стоит его повторить.

**🟡 [L-2] Неудачный бутстрап — тупик: `isStarted = true` на пути ошибки**
`bootstrap.ts:143-147` — при провале критичного сервиса `isStarted=true` фиксируется, повторный `init()` возвращает устаревший отчёт о провале. `RuntimeManager.restart()` существует, но не вызывается нигде; частично инициализированные сервисы остаются в контейнере (rollback не выполняется) → сессия «кирпич» до перезагрузки страницы.

**🟡 [L-3] Мёртвый второй глобальный `unhandledrejection`-хендлер**
`runtime.ts:47-53` регистрируется первым (через импорт в `main.tsx:6`) и безусловно вызывает `event.preventDefault()`; хендлер в `main.tsx:22-31` с проверкой `if (event.defaultPrevented) return` — мёртвый код. Итог: необработанные rejection-ы логируются, но никогда не показываются пользователю.

**🟡 [L-4] `RuntimeManager.restart()` молча убьёт модульные подписки сторов**
`runtime.ts:162-165` — `clearAllSubscriptions()` удаляет подписки, созданные при импорте модулей (`stores/chat/store.ts:36`, `topologyTraceStore.ts:28-68`), и не воссоздаёт их → после рестарта стриминг чата и трассировка умерли бы без ошибок. Сегодня латентно (restart не вызывается), но это ловушка.

**🟡 [L-5] MemoryWatchdog «форсирует GC» аллокацией 64 МБ под давлением памяти**
`bootstrap.ts:465-471` — при heap ≥1.5 ГБ колбэк выделяет ещё 64 МБ и отменяет **все** in-flight LLM-запросы, включая здоровые стримы пользователя. Приём «аллокация провоцирует mark-sweep» — фольклор; спайк может добить вкладку до OOM.

**🔵 [L-6] `_unsubByCb` в EventBus перезаписывается** (`event-bus.ts:188, 213-217`) — один колбэк на двух событиях портит учёт отписок (сам сплайс корректен); лимита на слушателей нет, только warn при 5000 суммарно.

**🔵 [L-7] `debate-session-store` грузит ВСЕ сессии без лимита** (`index.ts:169-177` — `liveQuery(... toArray())` без `limit()`); авто-чистки старых сессий нет нигде.

**🔵 [L-8] `topologyTraceStore` держит always-on 30-сек интервал** (`topologyTraceStore.ts:70-81`), тогда как `debateLiveStore` уже переведён на ленивые интервалы (фикс FA-06) — непоследовательность.

**🔵 [L-9] Мojibake в пользовательских строках ядра** — `kernel.ts:129, 412`: `'Kernel state load failed вЂ” reset to defaults'` — битый UTF-8 виден пользователю в нотификациях.

**⚪ [L-10] Путь logout/reset-all отсутствует** — приемлемо для однопользовательского локального приложения, но станет проблемой при мультиаккаунте.

### Позитивные практики
- **Многослойный shutdown:** RuntimeManager → bootstrapper → LifecycleManager (LIFO, таймаут 5с/сервис, пропуск незавершённых) → `container.clear()` → `clearAllSubscriptions()`; флаги `shutdownInitiated` против гонок старта/остановки.
- **Кастомное ESLint-правило** `eslint/rule-mandatory-lifecycle.mjs`: сервис ядра с `eventBus.on`/`setTimeout`/`AbortController` обязан иметь `destroy()` — статическая профилактика именно того класса утечек, который ищут аудиты.
- **EventBus промышленного уровня:** per-listener try/catch, wildcard, backpressure с dead-letter очередью (cap 1000), Zod-валидация, `getSubscriptionStats()` для диагностики утечек.
- **Восстановление после сбоя:** прерванные крэшем дебаты помечаются `failed` на бутстрапе; HMR-дисциплина (`import.meta.hot.dispose` → `runtime.shutdown()`).

---

## Аудит 3. Потоковая передача, таймеры и отмена (Streaming, Timers & Abort)

**Цель:** эффективность и отзывчивость при асинхронных данных.

### Находки

**🟠 [T-1] Семафор LLM-клиента не отбрасывает отменённые ожидающие; очередь не ограничена**
`src/llm/http/llm-http-client.ts:34-52, 195`:
```ts
return new Promise((resolve) => { LLMHttpClient._waitingQueue.push(resolve); });
```
`acquireSlot()` игнорирует `AbortSignal` вызывающего: запрос, отменённый в очереди (лимит 50 in-flight), всё равно получит слот, соберёт fetch и мгновенно абортнётся — впустую потратив ход слота. При всплесках (дебат на 16 агентов против `cancelAll()` по memory pressure) очередь растёт неограниченно.

**🟡 [T-2] После заголовков стрим остаётся без stall-защиты по умолчанию**
`llm-http-client.ts:452-454` — `disarm()` снимает connection-таймаут (корректно для длинных генераций), но единственная защита от «провайдер перестал слать байты» — опциональный `idleTimeoutMs` в `parseSSEStream`, по умолчанию `0` (выключен, `sse-parser.ts:26`). Передаёт его только `openai-compatible-adapter.ts:156`. Остальные адаптеры висят вечно на мёртвом стриме.

**🟡 [T-3] Нет глобального `window.onerror`/`'error'`-слушателя**
Регистрируются только `unhandledrejection` (дважды — см. L-3). Синхронный throw внутри `setTimeout`, воркера или DOM-хендлера вне ErrorBoundary теряется без следа.

**🟡 [T-4] Внутренний AbortError неотличим от пользовательской отмены на уровне стора**
`llm-http-client.ts:172-187` маппит любой non-Error throw в голый `AbortError`; `chat-event-handlers.ts:229-258` помечает такие записи `status:'error'` с сырым текстом `Aborted` вместо `cancelled`. Причина отмены (например, `'Cancelled under memory pressure'`) нигде не читается.

**🟡 [T-5] Утечка body-reader при ошибках потребителя** — `sse-parser.ts:188-201`: fire-and-forget `bodyReader.cancel()` осознанно оставляет reader несёттлённым; при повторных массовых отменах ридеры накапливаются без счётчика/телеметрии.

**🔵 [T-6] Утечка module-level Maps при потере терминального события** — `chunkBuffers`/`requestEntryMap` в `chat-event-handlers.ts` чистятся только по терминальным событиям; шина — fire-and-forget (документированный B-03), потеря `MESSAGE_RESPONSE` = утечка записи навсегда.

**🔵 [T-7] `useSystemStatus` — два постоянных интервала на каждый смонтированный потребитель** (30с + 1с, `useSystemStatus.ts:52, 68-71`), не зависящие от visibility; десятки wakeups/мин на панель.

**🔵 [T-8] Дублирующие visibility-утилиты с разной семантикой** — `hooks/useVisibilityInterval.ts` (останавливает интервал) vs `utils/visibility-interval.ts` (продолжает тикать, пропуская колбэк) — второй не экономит пробуждения CPU.

### Позитивные практики
- **SSE-парсер закалён против всех классических сбоев:** cap буфера 10 МБ (H-09), мультистрочный `data:` по спецификации, idle-таймаут (L9-02), синхронный `controller.error()` при аборте (G-03 — фикс реального 4-минутного зависания), `releaseLock` в finally, собственный тест-файл.
- **Отмена проведена насквозь:** UI → `CANCEL_MESSAGE` → `chat-executor` → `controller.abort()` → `signal` доходит до `fetch`; 10-минутный TTL-свипер зависших запросов; `destroy()` абортит всё in-flight.
- **Таймаут-композиция обходит GC-баг `AbortSignal.any()`** с документацией (manual controller + `{once:true}`).
- **rAF-циклы** (PerfOverlay, Aquarium, useBreakpoint) корректно отменяются; framer-motion сам чистит за собой.
- **Кастомный ESLint-фоrc** парности `setInterval`/`clearInterval` в сервисах ядра — выборочно проверено, все пары на месте.

---

## Аудит 4. UX, производительность и утечки в UI (UX, Performance & Leaks)

**Цель:** плавность работы.

### Находки

**🟠 [U-1] Стриминг чата ре-рендерит всех подписчиков `s.sessions` на каждом rAF**
`src/stores/chat/hooks.ts:12`: `export const useSessions = () => useChatStore(s => s.sessions);`
`chat-event-handlers.ts:72-85` заменяет всё дерево `sessions` при каждом rAF-флаше (~60 Гц во время стрима). `useSessions()` потребляют 5 постоянно видимых компонентов (ChatSidebar, ChatSessionsManagerPanel, SessionHubPanel, ChatAdminPanel, ChatDock) — сайдбар перегруппировывается и перерисовывается до 60 раз/сек, пока пользователь читает сообщения. rAF-коалесинг смягчает удар, но нужен per-session селектор или `subscribeWithSelector`.

**🟠 [U-2] Три из топ-10 крупнейших панелей без мемоизации вообще**
`PolicyPanel.tsx` (1169 строк), `FleetPanel.tsx` (1119), `AquariumPanel.tsx` (886) — ноль `useMemo|useCallback|memo`. FleetPanel рендерит 19 `.map()`-списков; любое обновление по событиям перерисовывает каждую строку.

**🟡 [U-3] Подписки на весь стор без селектора** — `ChannelPanel.tsx:42`, `ProjectsPanel.tsx:30`, `useBulkImport.ts:24` деструктурируют весь стор, включая растущие массивы `messages`/`events` — каждый аппенд ре-рендерит панель целиком.

**🟡 [U-4] Виртуализация только в 2 местах из ~211 маршрутов** — `LogsPanel.tsx:65` и `ChatMessagesSection.tsx:54` используют `useVirtualizer`; `AuditLogView.tsx:280` мапит до 200 строк сырым `.map()`; `@tanstack/react-virtual` подключён именно в 2 файлах.

**🟡 [U-5] Ни одного общего debounce/throttle — 15 компонентов катят его вручную** на `setTimeout` (CodeEditor, MemoryPanel, OverviewTab…). Утилиты `useDebounce` в проекте нет.

**🟡 [U-6] 75 файлов с голым `setInterval`; только 32 через visibility-aware `usePolling`** — ~40 Technique-панелей опрашивают каждые 15с даже в скрытой вкладке (утечек нет — очистка корректная — но CPU/сеть тратятся в фоне).

**🟡 [U-7] framer-motion анимирует layout-свойства (width/height) в ≥12 местах, `will-change` не используется**
`TasksPanel.tsx:718`: `animate={{ width: \`${task.progress}%\` }}` — прогресс-бар дёргает layout каждый кадр; также анимация сайдбара `width: 320` (ChatPanel.tsx:515), collapse `height: 0 → 'auto'` (HistoryItem.tsx:261, MatchDetail.tsx:17, MCPServerCard.tsx:170). 163 файла импортируют framer-motion (527 использований `motion.*`) — крупнейшая анимационная поверхность приложения.

**🟡 [U-8] `prefers-reduced-motion` не применяется к framer-motion** — CSS его уважает (`base.css:286-290`), но `MotionConfig`/`useReducedMotion` не используются нигде; настройка `reducedMotion` существует в ядре (`kernel/contracts/settings.ts:7`) и не подключена к анимационному слою. Все 527 анимаций играют для motion-чувствительных пользователей.

**🔵 [U-9] Подписки на горячие события без коалесинга** — `AuditLogView.tsx:31` переполливает `getAuditLog(200)` на **каждый** `EVENTS.NOTIFICATION` (а это событие всех тостов).

**⚪ [U-10] `zustand/shallow` не используется нигде** — сейчас безопасно (селекторы возвращают примитивы/стабильные ссылки), но хрупко при появлении вычисляемых объектов.

### Позитивные практики
- **rAF-коалесинг токенов стрима** (`chat-event-handlers.ts:58-96`): буфер Map + один флеш на кадр — прямо фиксирует «сотни ре-рендеров в секунду».
- **Виртуализированный лог чата** с динамическими измерениями и scroll-to-bottom.
- **Мемоизированный горячий путь чата:** ResponseCard, ChatHistoryEntry, MarkdownRenderer — `React.memo`; LRU-кэш подсветки.
- **198 ленивых `React.lazy` панелей** + 62 ленивых technique-панелей.
- **Дисциплина слушателей:** 65 `addEventListener` против 67 `removeEventListener`, пары сходятся; EventBus-подписки собираются в массивы unsubs.

---

## Аудит 5. Архитектура и зависимости (Architecture & Dependencies)

**Цель:** поддерживаемость и масштабируемость.

### Находки

**🟠 [A-1] Статус циклических зависимостей не подтверждаем локально; документация противоречит коду**
Два последних коммита: `6390e33` и `934c27a` — «break (last 2) kernel circular deps», а `docs/DEBT_REPORT.md:33` всё ещё заявляет «Циклические зависимости: **19 циклов**» при заголовке «Статус: Все закрыто ✅». `check:circular-kernel` (madge) — CI-гейт, HEAD должен проходить, но документ рассинхронизирован.

**🟠 [A-2] 513 сервисов в 94 phase-файлах (7 469 строк) — распухание регистрации**
`src/kernel/service-registration/phase1-foundation.ts:88-170` и далее до `phase67-channels.ts`. Организовано аккуратно (нумерованные фазы, ленивые фабрики), но бюджета на число сервисов и линии депрекации нет; `container.ts` сам по себе чистый (216 строк).

**🟡 [A-3] Компоненты обходят DI-контейнер модульными синглтонами**
102 файла компонентов импортируют сервисы напрямую; `agems-task-service.ts:63` экспортирует `new AgemsTaskService()` синглтоном, потребляемым панелями. Второй стиль — `runtime.getService()`. Синглтоны не переопределяемы в тестах (ломает контракт A-04); правило depcruiser против прямых импортов `services/` из UI отсутствует.

**🟡 [A-4] Три параллельных HTTP-стека для провайдеров**
`groq-sdk` (собственные retry/timeout), `@google/generative-ai` (внутри ядра! `google-genai-service.ts`) и собственный `LLMHttpClient`+`sse-parser` (8+ адаптеров). Плюс vendорный SDK, deprecated вверх по потоку (`@google/generative-ai` → `@google/genai`).

**🟡 [A-5] docs/ — 9.0 МБ, 788 markdown-файлов; 5.2 МБ истории и 2.0 МБ аудитов в репозитории**
`docs/junk/` — ~1.1 МБ паст console-дампов с названиями `errorrrrrrrrrrrr.md`, `errrrro3r.md` (карантин с политикой удаления объявлен, но удаление не выполнено). Каждый цикл аудита добавляет вес — поисковая нагрузка и maintenance растут.

**🔵 [A-6] Мёртвые файлы:** `src/test_map.ts` (2 строки, пустой класс), `scripts/seed.ts.disabled`, `scripts/debug-regex.cjs`.

**🔵 [A-7] Подозрительные пины версий:** `lucide-react@^1.14.0` (в публичном реестре lucide-react — линия 0.x; форк или опечатка — требует проверки supply-chain), `zustand@^4.5.7` (существует v5), отсутствует поле `license` в package.json (файл LICENSE = MIT).

**⚪ [A-8] Слои на границах чистые** — компоненты не импортируют DAL, сторы не импортируют компоненты, ядро не знает про React/zustand; depcruiser с 4 правилами — CI-гейт («0 violations, 1418 modules, 5074 deps»).

**⚪ [A-9] God-файлы — god-данные, а не god-логика:** `dexie-schema.ts` (3 750 строк, 43 версии схемы, ~130 таблиц), `event-registry.ts` (2 651, 547 типизированных событий с Zod) — приемлемые каталоги-реестры; настоящие UI-god-файлы — PolicyPanel/FleetPanel (см. U-2).

### Позитивные практики
- madge (circular) и dependency-cruiser (layering) — жёсткие CI-гейты; карта зависимостей документирована (`DEPENDENCY_MAP.md`).
- DI с ленивыми фабриками, `override()` только для фабрик — тестируемо.
- Реестр 547 событий с Zod-схемами — единый источник правды.
- `sideEffects` whitelist в package.json — безопасный tree-shaking.

---

## Аудит 6. Обработка ошибок и логирование (Error Handling & Logging)

**Цель:** быстрая диагностика и предотвращение каскадных сбоев.

### Находки

**🟠 [E-1] 454 catch-блока, состоящих только из комментария**
Например, `bootstrap.ts:186-198` — три `catch { /* ignore */ }` вокруг destroy-вызовов. Коммит `f66c1e3` «eslint rivals15-20 catch batch, best-effort comments» показывает, что это массовые механические правки ради линтера. Реальные сбои (init, persist) неотличимы от намеренных no-op; нет ни счётчиков, ни выборки, ни breadcrumb-ов.

**🟡 [E-2] Персистентность LoggerService — мёртвый код**
`kernel/services/logger-service.ts:32-38` — `init(deps)` с таймером флаша каждые 30с никогда не вызывается в проде → логи не переживают перезагрузку, `destroy()`-флаш — no-op, логика восстановления не испытана. Подключить или удалить.

**🟡 [E-3] Пользователь видит сырые строки ошибок провайдеров без i18n**
`ChatPanel/ResponseCard.tsx:338-340` рендерит `res.error` как есть (`HTTP 429: ...`, `openai request timed out after 120000ms`). i18n-namespace ошибок покрывает только 9 ключей (error boundary + 404); RU-переводов ошибок LLM нет вообще.

**🟡 [E-4] Два ErrorBoundary, один не смонтирован**
`GlobalErrorBoundary.tsx` существует, но в дереве отсутствует; используется `Common/ErrorBoundary.tsx` (хороший: i18n, события, reset без перезагрузки). Покрытие 164-компонентного дерева panel-level границами несистемно.

**🟡 [E-5] Валидация EventBus порождает NOTIFICATION на каждый невалидный ивент** (`event-bus.ts:246-264`) — болтливый продюсер заспамит нотификации; дедупа нет; dead-letter очередь никто в рантайме не дренирует.

**🔵 [E-6] `logger.child()` сбрасывает `seq` в 0 при общем буфере** (`logger-service.ts:84-86`) — дубликаты seq ломают сортировку по `lastSeq`.

**🔵 [E-7] Console не запрещён: 79 прямых `console.*` вне логгера** (53 error, 17 warn, 8 log); правила `no-console` в eslint.config нет. Плюс второй параллельный логгер `FALLBACK_LOGGER` (`shared/utils/logger.ts:26-53`) пишет весь debug прямо в консоль без уровней — его используют все декораторы `src/llm`.

**🔵 [E-8] Мёртвая таксономия ошибок** — `kernel/contracts/errors.ts:39-48` объявляет `KernelErrorUnion` с гардами, которые ничего не бросает — дрейф между документированными и реальными формами ошибок.

**⚪ [E-9] Логирование чувствительных данных — в целом чисто** — `SENSITIVE_KEY_RE`, sanitizeObject на DEV-полезной нагрузке событий, хешированные id ключей в circuit breaker, тела ошибок провайдеров срезаны до 200-500 символов. Остаточный риск: `logging-decorator.ts:35` логирует `sanitizeError(e.message)` без среза.

### Позитивные практики
- **Слоёная таксономия ошибок LLM:** `LLMError → AuthError / RetryableError(+retryAfter) / SafetyError(+finishReason) / ModelValidationError` — точные решения retry/circuit вместо парсинга строк.
- **TraceId/correlationId** пронизывают логи и события; dead-letter записи содержат event/reason/at для посмертного разбора.
- **Буфер лога ограничен** (500 записей), форматтер тримит meta до 200 символов; переключение уровня в рантайме.
- **Регрессионные тесты на критичной инфраструктуре ошибок** (event-bus, dead-letter, container, sse-parser) с narrative-комментариями по ID аудитов.

---

## Аудит 7. Сеть и API (Network & API Contract)

**Цель:** надёжность взаимодействия с бэкендом.

### Находки

**🟠 [N-1] Groq-адаптер обходит общий HTTP-слой: SDK с собственными retry/timeout + `dangerouslyAllowBrowser`**
`src/llm/groq/groq-adapter.ts:40-45`:
```ts
return new Groq({ apiKey, timeout: 120000, maxRetries: 2, dangerouslyAllowBrowser: true });
```
Три независимых слоя повтора: SDK (2), RetryDecorator (3), Gemini `with429Retry`. Худший случай для транзиентного 5xx на Groq: (1+3)×(1+2) = **12 вызовов** API. Нормализация ошибок продублирована с openai-compatible — риск расхождения копипасты.

**🟡 [N-2] Таймер таймаута никогда не снимается для POST/GET**
Только `streamPost()` вызывает `disarm()`; каждый `post()`/`get()` оставляет висящий 60-120с `setTimeout`, удерживающий замыкание AbortController — тысячи мёртвых таймеров при тысячах запросов.

**🟡 [N-3] Асимметрия классификации 5xx между POST и GET** — POST: `≥500 → RetryableError` (`:248-258`); GET: любой `!ok → LLMError` (`:333-359`). Спасает только duck-typing statusCode в RetryDecorator.

**🟡 [N-4] Валидация ответов провайдеров носит рекомендательный характер**
`openai-compatible-adapter.ts:79-85`: при провале `safeParse` — warn и **работа с невалидированными данными** (`const safe = parsed.success ? parsed.data : data`). Gemini маппит сырой JSON без схемы. Контраст: в Dexie write-хуки zod реально **отклоняют** запись.

**🟡 [N-5] cors-proxy буферизует весь ответ целиком** (`cors-proxy.mjs:187-205`) — до 100 МБ в памяти, запись только по `end`; SSE через этот прокси невозможен. Сейчас используется только как fallback tool-fetch, но форма open-relay-хазарда.

**🟡 [N-6] WS sync-сервера без ping/pong и maxPayload** (`sync-server.mjs:1068-1142`) — half-open TCP-соединения живут вечно; дефолт ws maxPayload = 100 МиБ. Митигируется отсутствием message-хендлера (клиенты только читают broadcast). Плюс rate-limit-карты по IP никогда не чистятся → утечка на интернет-деплое.

**🔵 [N-7] Три разные реализации таймаутов** — ручной контроллер LLMHttpClient (120с), `groq-sdk timeout` , `AbortSignal.timeout(15000)` в openrouter (`:263`).

**🔵 [N-8] Мёртвый спуфинг Origin** — `openai-compatible-adapter.ts:59-61` подставляет `Origin: http://localhost:5173` для groq, но Origin — forbidden header (молча игнорируется fetch), и роут к Groq всё равно уходит в GroqAdapter. Недостижимый код.

**🔵 [N-9] Идемпотентность-ключей нет нигде** — ни у LLM POST-ов, ни у `PUT /api/db` (только CAS на уровне Dexie-сессии).

**⚪ [N-10] WebSocket-клиента в SPA не существует** (0 вхождений `new WebSocket`) — серверный broadcast-слой не имеет first-party потребителя; панели Company Gateway поллят fetch-ом.

### Позитивные практики
- **Центральный LLMHttpClient:** семафор 50, реестр in-flight с `cancelLongestRunning()`/`cancelAll()`, парсинг `Retry-After` (и delta-seconds, и HTTP-date), гигиена `res.body?.cancel()` на всех ошибочных путях.
- **Статусная классификация точна:** 401/403→AuthError, 429→RetryableError+Retry-After, ≥500→retryable, каждый путь закрывает тело ответа.
- **Кэш-ключ криптографически полон:** SHA-256 над полной семантикой запроса + SHA-256(apiKey) — нет утечек между ключами, нет сырого ключа; LRU + TTL + защита от stampede.
- **nginx в проде стриминг-корректен и закрыт по умолчанию:** `proxy_buffering off`, deny-all на неизвестные `/proxy/*`, `proxy_ssl_verify on`.
- **WS-апгрейд с аутентификацией сделан правильно:** origin до токена (без оракула), `timingSafeEqual`, токен в subprotocol, `?token=` явно запрещён.

---

## Аудит 8. Хранение данных и кэширование (Data Storage & Caching)

**Цель:** целостность и безопасность данных.

### Находки

**🔴 [D-1] `CachePanel.tsx` не компилируется — синтаксическая ошибка в прод-ветке** *(проверено вручную)*
`src/components/CachePanel.tsx:41`:
```ts
const odelFilter, setModelFilter] = useState('');
```
Пропущено `[m` — жёсткая синтаксическая ошибка в файле, входящем в `route-imports.ts`. `tsc -b`/vite build обязаны падать — значит, сборочные гейты CI не гонялись на последнем изменении этого файла. Единственный UI для `cacheService.invalidate(model)` сейчас нешиппуем.

**🟠 [D-2] Дрейф версии схемы: прод на v43, тест зафиксирован на v35** *(проверено вручную)*
`dexie-schema.ts:1878` — `this.version(43).stores({...})`; `dexie-schema-versioning.test.ts:23,67` — `expect(db.verno).toBe(35)`. Юнит-сьют не может быть зелёным против этой схемы — статическое доказательство того, что тестовые гейты прогонялись давно или выборочно.

**🟠 [D-3] Несбрасываемые таблицы: auditLog, traces, sessions**
`ops-repository.ts:55-57` (`auditLog.put` без капа), `trace-repository.ts:27-29`, `session-repository.ts` (MAX_SESSIONS=500 ограничивает только кэш в памяти, не таблицу). Чтения пагинированы, записи никогда не чистятся. Контраст: eventLog (cap 1000, prune в транзакции) и memory (MAX_ENTRIES + prune) сделаны правильно.

**🟡 [D-4] Sync «последняя запись побеждает» целым блобом** (`sync-server.mjs:262-297`) — атомарно (tmp+rename) и сериализовано через writeQueue, но без вектора версий/мержа: два клиента, пушащие IndexedDB-снапшоты, молча затирают друг друга.

**🟡 [D-5] «Семантический» кэш — FNV-хэш-аппроксимация** (`cache-decorator.ts:10-12, 68-92`) — честно помечен CONTRACT-C8 «Do NOT market this as semantic», но при `similarityThreshold=0.85` косинусная близость word-fingerprint даёт ложные попадания для перефразировок с **разными** ответами; TTL 60с; стриминговый кэш-хит фабрикует токены сплитом по пробелам.

**🟡 [D-6] Квота localStorage: стратегия только в одном адаптере** — `ssr-storage.ts:16-26` глотает сбои `setItem` молча (потери настроек без сигнала); `local-storage-adapter.ts:45-49` — единственный, кто ретроуит QuotaExceededError.

**🔵 [D-7] «Обфускация» = XOR с захардкоженным солью** (`local-storage-adapter.ts:3-17`, prefix `xob:`, salt `a1b2c3d4e5f6g7h8`) — security theater; допустимо только как legacy-миграция.

**🔵 [D-8] Одно-членный bracket-индекс** `memories: '[metadata.source], ...'` (`dexie-schema.ts:350`) — легален, но не-идиоматичен (документированная форма — точечная).

### Позитивные практики
- **Дисциплина миграций:** 39 `.version()` вызовов с реальными `upgrade(tx)`-транзакциями (бэкфиллы через `modify`), `validateMigrations()` вызывается, отдельный тест «версии возрастают, таблицы между соседними версиями не дропаются».
- **Zod write-хуки Dexie отклоняют невалидные записи** (`dexie-schema.ts:1889-1903`) — валидация там, где она имеет цену.
- **Кросс-табличная синхронизация tab-ов:** BroadcastChannel + storage-event fallback, heartbeat, подрезка стейл-табов, инвалидация circuit-breaker между вкладками.
- **Бэкап/экспорт:** ExportImportPanel, osSnapshots, экспорт ключей требует явного `encryptFn`-решения.
- **Все 27+ репозиториев в одном DAL**, `indexedDB.open` вне Dexie не встречается.

---

## Аудит 9. Тестирование и покрытие (Testing & Coverage)

**Цель:** уверенность в рефакторинге.

### Инвентарь (измерено)

| Область | тест-файлов | исходников | покрытие файлами |
|---|---|---|---|
| src/kernel | 236 | 1237 | 19% |
| src/components | 105 | 786 | 13% |
| src/stores | 14 | 38 | 37% |
| src/llm | **5** | 45 | **11%** |
| src/hooks | 3 | 12 | 25% |
| **итого** | **366** | **2659** | **14%** |

### Находки

**🔴 [T9-1] Сетевое ядро не покрыто тестами**
`src/llm/http/` — только `sse-parser.test.ts`. **`llm-http-client.test.ts` не существует**: композиция таймаутов, статусная классификация, семафор, отмена in-flight — всё невифицировано. 5 тест-файлов на 45 файлов `src/llm`; контракт-тестов с фикстурами провайдеров нет (gemini-тест мокает сам LLMHttpClient); `mock-adapter.ts` не используется ни одним тестом.

**🔴 [T9-2] В сьюте есть заведомо падающий ассерт (D-2)** — `dexie-schema-versioning.test.ts:23,67` ждёт v35 при реальной v43.

**🟡 [T9-3] Coverage-пороги применены к «стабильному подмножеству»**
`vitest.config.ts:25-42`: include только stores/hooks/events/workers/container, пороги 30/20/30/30 с честным комментарием, что по всему проекту ~4%. Kernel/services (1237 файлов, включая key-management и dexie-schema) и весь `src/llm` вне любого coverage-гейта.

**🟡 [T9-4] e2e = 1 спека, 4 smoke-проверки** (`e2e/basic-flow.spec.ts:8-25`: дашборд виден, страницы ключей/агентов открываются, textbox чата есть). Нет стриминг-флоу, нет персистентности через перезагрузку, нет visual regression, нет axe/a11y, нет нагрузочных тестов.

**🟡 [T9-5] Playwright config рассинхронизирован с CI** — конфиг без `projects` (дефолт = chromium+firefox+webkit), CI ставит только chromium; `reuseExistingServer: true` может молча тестировать устаревший дев-сервер.

**🟡 [T9-6] Мокается весь сервисный слой чата** — `chat/store.test.ts:76-100` заменяет eventBus, runtime, governor, memory, workspace; реальный путь `chat-send-message → ChatService → adapter` без интеграционного теста; единственный тест ChatService содержит `it.skip(`.

**⚪ [T9-7] `vi.mock` 346 раз в 123 файлах** — мокирование обильное, но скоупится через `vi.hoisted`; `fake-indexeddb` лишь в 7 файлах.

### Позитивные практики
- **Качественные поведенческие сьюты:** `useKeyStore.test.ts` — 21 тест с импортом мусорных payload-ов (дубликаты, `null`, `'not-an-object'` → count=2); `cache-decorator.test.ts` — pre-computed similarity как guard валидности теста, LRU через счётчики refetch, изоляция cacheScope; `container.test.ts` — семантика DI, не smoke.
- **CI-матрица из 8 джобов:** typecheck (с объяснением, почему голый `--noEmit` — false-green), lint-бюджет, тесты, scoped-coverage, `npm audit`, madge, depcruiser, e2e, bundle-size.
- **en↔ru паритет i18n-ключей — падающий тест** (`i18n-keys.test.ts`).
- Окружение тестов: jsdom + `fake-indexeddb/auto` + Worker-stub + полифилы; осознанные таймауты под GH-раннеры.

---

## Аудит 10. Конфигурация и окружение (Configuration & Environment)

**Цель:** гибкость и простота развертывания.

### Находки

**🟠 [C-1] Четыре расходящихся определения CSP (dev/prod)**
`index.html:19` ≠ `vite.config.ts:109-117` ≠ `docker/nginx.conf:37` ≠ `docker/nginx-ssl.conf:47,68`. Комментарий в index.html требует «держать синхронно с nginx.conf» — уже рассинхронизировано (последствие — S-2). Единственного источника правды и теста паритета нет.

**🟡 [C-2] Мёртвые build-args: `VITE_DISABLE_TELEMETRY`, `VITE_LOG_LEVEL` нигде не читаются**
`Dockerfile:57-58` и `docker-compose.yml:37-38` передают их, но grep по src/scripts/server даёт ноль использований. Оператор думает, что конфигурирует логирование/телеметрию — не конфигурирует. Аналогично `.env.example:43-50` рекламирует `VITE_KEY_*` (ноль чтений в коде;prefix VITE_ = попадание в бандл — опасная приманка).

**🟡 [C-3] Линт-гейт пропускает 5 200 ворнингов** (`ci.yml:58`: `--max-warnings 5200`) — полмиллиона строк предупреждений (включая no-restricted-imports) закреплены как норма.

**🟡 [C-4] Pre-commit хук отключён** — `.husky/pre-commit.disabled` (внутри lint-staged + typecheck); активен только commitlint. Конфиг lint-staged в package.json мёртв; всё переносится на удалённый CI.

**🟡 [C-5] Установка требует `--legacy-peer-deps` повсюду** — 8 мест в CI + Dockerfile (madge@8 хочет TS ^5.4.4 против пина ~6.0.2). Workaround несущий, но не задокументирован в engines.

**🟡 [C-6] Валидации env при старте нет** — ни zod-схемы для `import.meta.env`; опечатка переменной молча падает в дефолт (например, `http://localhost:3002/fetch` в прод-сборке).

**🔵 [C-7] `npm audit` пиннут на critical с бессрочным исключением** react-router (обоснование корректное — client-only SPA, но `high` теперь проходит молча, без даты пересмотра).

**🔵 [C-8] Устаревшие комментарии о безопасности** — `nginx.conf:29-32` утверждает, что песочница использует `new Function()` (она использует его явно НЕ — `sandbox.worker.ts:7-9`); `.env.example:13-15` всё ещё предупреждает про unsafe-eval для воркера.

**🔵 [C-9] `vite preview` слушает все интерфейсы** (`host: true`, `vite.config.ts:180-183`) — при том что docker-compose дев-порты корректно пиннуты на 127.0.0.1.

**⚪ [C-10] Feature-flag фреймворка нет** — флаги = env-гейт `VITE_SANDBOX_ENABLED`, канарейка LLM-роутинга (`canary-router.ts`), A/B дебейтов («experiments framework» — рантайм-эксперименты, не release-флаги). Для SPA такого масштаба — приемлемо, но осознанно.

### Позитивные практики
- `.env.example` образцовый: назначение каждой переменной, команды генерации секретов, fail-closed дефолты.
- `SYNC_SECRET` и `CORS_ORIGIN` fail-fast с отказом на `*`.
- CI: `tsc -b --noEmit` с документированной защитой от false-green; `npm run build` (с типчеком) — путь для CI/ship.
- Docker: multi-stage, nginx-unprivileged (non-root), `read_only: true`, `cap_drop: ALL`, `no-new-privileges`, tmpfs, лимиты ресурсов, fail-close при отсутствии TLS-сертификатов.

---

## Аудит 11. Доступность и интернационализация (Accessibility & i18n)

**Цель:** инклюзивность и глобальная доступность.

### Находки

**🟠 [I-1] Плюрализации нет — реальный дефект для русской локали**
`src/i18n/translations/index.ts:39-58` — простая замена `{param}`; `rg 'PluralRules|plural' src/i18n` — ноль. Русский требует 3 формы (1 комментарий / 2 комментария / 5 комментариев) — все счётные строки либо криво сформулированы, либо неправильны. Бонус-баг: `text.replace('{k}', ...)` заменяет только **первое** вхождение плейсхолдера.

**🟠 [I-2] Гонка загрузки локали: нет ре-рендера после завершения async `loadLocale`**
`useTranslation.ts:13-19` — `setLanguage(l); loadLocale(l);` без ожидания и без триггера перерисовки; при холодном кэше первый рендер может показать сырые ключи (`nav.fleet_crews`), которые висят до случайного следующего стейт-апдейта.

**🟡 [I-3] Фокус-трапы: три конкурирующих паттерна, дыры в покрытии**
`useFocusTrap` используется ровно 2 компонентами; эталонный `ModalShell` (portal + FocusScope + Escape + aria-modal + scroll-lock)采纳 8 файлами; `ProviderDetailModal.tsx:44-68` — Escape+aria-modal, но **без удержания фокуса**; `AgentsPanel/AgentWizard.tsx` — многошаговый оверлей вообще без `role="dialog"`, aria-modal, Escape и фокус-скоупа.

**🟡 [I-4] 17 файлов компонентов с хардкодом кириллицы вне i18n**
`DebatePanel/HistoryArgumentRow.tsx:94` — `title={expanded ? 'Свернуть' : 'Развернуть'}`; смешение языков в `SimulationPanel.tsx:170,204`; ad-hoc en/ru объекты в TopicSuggesterPanel — мимо CI-гейта паритета.

**🟡 [I-5] Пробел разметки форм: 499 `<input>` против 255 `<label>` + 405 `aria-label`**
`SettingsPanel.tsx:383` — placeholder-only поля, включая password-инпут без aria-label и autocomplete-хинта (в соседней строке того же файла — правильно через обёртку `<label>`).

**🟡 [I-6] Стриминг чата не анонсируется скринридерам**
33 `aria-live` в проекте, но `ChatMessagesSection.tsx` (виртуализированный контейнер сообщений) без `aria-live`/`role="log"`; новые токены ассистента молчаливы для SR. `role="log"` — 3 вхождения на весь репозиторий.

**🔵 [I-7] 18 icon-only кнопок с `title` вместо `aria-label`** (`DowngradeMapSection.tsx:48`) — title не надёжное accessible name и не i18n-ится.

**🔵 [I-8] RTL-поддержки нет** (`dir` не устанавливается нигде) — приемлемо для en/ru, но инфраструктурной точки расширения нет.

**🔵 [I-9] Контраст не аудирован по токенам** — есть dedicated high-contrast тема (7 тем всего), но базовые палитры без документированных WCAG-коэффициентов: например, `--text-muted: #7a9a7a` на `#162316` (тема nature) ≈ 2.9:1 — вероятно, провал AA. Плюс **679 файлов компонентов с сырым hex/rgba** при явном запрете в `styles/tokens.ts:6-8` — хардкоды не адаптируются к темам.

### Позитивные практики
- `ModalShell` — образцовая модалка (portal, FocusScope contain/restore/autoFocus, Escape, aria-modal, блокировка скролла).
- Skip-to-content + landmarks в AppLayout; aria-поверхность велика и здорова: 932 `aria-*` (aria-label 399, aria-hidden 341); 65 `role="switch"` все как `<button role="switch" aria-checked>` — клавиатурно доступны; все 8 `<img>` с alt.
- en↔ru паритет ключей — CI-гейт; отсутствующие ключи с DEV-варном (FX-02); локали код-сплиттятся.
- `prefers-reduced-motion` уважается в CSS; тема применяется pre-React без FOUC; CommandPalette — полноценная клавиатурная навигация.

---

## Аудит 12. Производительность сборки и деплоя (Build & Deploy Performance)

**Цель:** ускорение цикла разработки.

### Находки

**🟠 [B-1] `build:skip-typecheck` шиппит нетипизированный артефакт под console.warn**
`package.json:17` — скрипт существует как одно-командная ловушка; CI его не потребляет (хорошо), но локально/в deploy-скриптах сломанные типы могут доехать до GitHub Pages.

**🟡 [B-2] Сборке нужен 4 ГБ heap, тестам — 6 ГБ**
`--max-old-space-size=4096` для tsc и vite; `NODE_OPTIONS=6144` в CI для тестов; coverage ограничен 5 директориями, потому что полный прогон с coverage — OOM. Профиль памяти — системный запах TS6+430K LOC со strict-флагами.

**🟡 [B-3] Нет Cache-Control для index.html → риск stale-HTML после деплоя**
`nginx.conf:41-43` — SPA-fallback без `location = /index.html { add_header Cache-Control "no-cache" }`; хэшированные ассеты получают `expires 30d immutable`, но HTML кэшируется эвристически → после деплоя пользователи могут застрять на старом index.html, ссылающемся на удалённые чанки (белый экран до жёсткого refresh).

**🟡 [B-4] Компрессия только gzip on-the-fly** — нет `gzip_static`/`brotli_static`, Vite не эмитит `.gz/.br`; для многомегабайтного vendor-чанка — заметные потери TTFB.

**🟡 [B-5] framer-motion импортируют 40+ компонентов, включая ранние панели** — чанк `vendor-motion` выделяется, но full-build вместо `LazyMotion`/`m`-сплита.

**🔵 [B-6] Нет bundle-анализа и бюджетов** — ни visualizer, ни `build:analyze`; в CI только не-блокирующий warning при 30 МБ.

**🔵 [B-7] manualChunks не покрывает часть тяжёлых либ** — `groq-sdk`, `@google/generative-ai`, `@tanstack/react-virtual` остаются в entry-графе («keep other node_modules in the entry chunk», `vite.config.ts:94`).

**🔵 [B-8] Стратегия деплоя — только upload dist на GitHub Pages** (`ci.yml:312-356`): ни staging, ни blue-green/canary (канарейка есть лишь для LLM-роутинга), ни rollback-инструментария.

**⚪ [B-9] e2e — 4 smoke-теста, `retries: 1`, `reuseExistingServer: true`.**

### Позитивные практики
- **Route-level code splitting образцовый:** 198 `React.lazy` панелей + 62 technique-панелей; vendor-* manualChunks для xyflow/tiptap/orama/meriyah/xyflow; `sideEffects` защищает CSS/workers от tree-shaking.
- **tsconfig project references + incremental** (`tsc -b` с tsBuildInfoFile) — инкрементальный типчек; строгие флаги (strict, noUncheckedIndexedAccess, noUnusedLocals).
- **CI: 8 параллельных джобов**, concurrency cancel-in-progress, кэши npm/node/Playwright-браузеров, retention 7 дней.
- **Docker:** multi-stage, HEALTHCHECK, non-root nginx, .dockerignore без .env; **sourcemaps `hidden`** + upload только из CI-секретов.

---

## Топ-15 приоритетных действий (консолидированно)

| Приоритет | Действие | Закрывает | Оценка усилий |
|:---:|----------|-----------|:---:|
| 1 | Исправить синтаксическую ошибку `CachePanel.tsx:41` и выяснить, почему сборочные гейты её пропустили | D-1, T9-2 | 5 мин |
| 2 | Синхронизировать схему-тест с v43 (или сделать ожидаемую версию динамической) и перегнать юнит-сьют | D-2, T9-2 | 1 ч |
| 3 | Унифицировать CSP в один генерируемый источник (build-time инъекция в index.html + оба nginx); добавить хосты прямых провайдеров | S-2, C-1 | 1 день |
| 4 | Подключить KeyVault/SecurityService к бутстрапу (или удалить мёртвый код и честно задокументировать plaintext-риск, исправив ложный текст в SettingsPanel) | S-1, D-вопрос доверия | 2-4 дня |
| 5 | Добавить `llm-http-client.test.ts` + контракт-тесты адаптеров на фикстурах | T9-1 | 3-5 дней |
| 6 | Идемпотентный guard для `SystemBootstrap.init()` (promise-caching по образцу Kernel.init) + rollback частичного init | L-1, L-2 | 1 день |
| 7 | Abort-aware семафор (выброс отменённых из очереди) + cap очереди; дефолтный `idleTimeoutMs` для всех адаптеров | T-1, T-2 | 1 день |
| 8 | Починить forum `renderBody` (экранировать `"` или прогнать через DOMPurify) + регрессионный тест на attribute-injection | S-4 | 2 ч |
| 9 | Мемоизация/изоляция стриминг-ре-рендеров: per-session селекторы для ChatSidebar/ChatDock + subscribeWithSelector | U-1, U-3 | 2-3 дня |
| 10 | Плюрализация через `Intl.PluralRules` + фикс first-occurrence интерполяции + ре-рендер после `loadLocale` | I-1, I-2 | 1-2 дня |
| 11 | Дедуп глобальных хендлеров: один `unhandledrejection` + добавить `window.onerror`; почистить 454 best-effort catch хотя бы до debug-breadcrumb | L-3, T-3, E-1 | 2-3 дня |
| 12 | Monaco: `loader.config({ monaco })` из установленного пакета или удалить dep | S-3, B-вопрос | 1 ч |
| 13 | `Cache-Control: no-cache` для index.html в обоих nginx; brotli_static прек compression | B-3, B-4 | 2 ч |
| 14 | Кап/prune для auditLog/traces/sessions; ping/pong + maxPayload для sync-server WS; чистка rate-limit карт | D-3, N-6 | 1-2 дня |
| 15 | Расширить e2e до критичных флоу (стриминг, персистентность, дебаты) + `projects` в Playwright по установленным браузерам | T9-4, T9-5 | 3-5 дней |

Быстрые победы уборки: удалить `docs/junk` (1.1 МБ), `src/test_map.ts`, `scripts/seed.ts.disabled`, `debug-regex.cjs`, мёртвые env-переменные (`VITE_LOG_LEVEL`, `VITE_DISABLE_TELEMETRY`, `VITE_KEY_*`), битые UTF-8 строки в kernel.ts, включить pre-commit хук.

---

## Общий вывод

**Сильные стороны.** Это необычно зрелый проект для одиночной/небольшой команды: DI-контейнер с детекцией циклов, EventBus с backpressure и dead-letter, песочница на AST-интерпретаторе вместо eval, многослойный shutdown, инцидент-ориентированная культура (каждый харденинг помечен ID аудита с объяснением «почему»), CI с 8 джобами и жёсткими архитектурными гейтами. Слоистость на главных границах (UI→DAL, kernel→React) реально чистая и проверяется автоматически.

**Системные слабости.** (1) **Разрыв между заявленным и фактическим**: UI обещает шифрование ключей — его нет; DEBT_REPORT объявляет 19 циклов — коммиты говорят «последние 2 закрыты»; env-переменные документированы — код их не читает; SettingsPanel утверждает encryption — vault не подключён. (2) **Гейты выполняются выборочно**: синтаксическая ошибка в прод-ветке и v43-против-v35 доказывают, что build/тесты не гонялись на последних изменениях. (3) **Сетевое ядро — наименее протестированная часть** при том, что это самое критичное. (4) **Четыре несинхронных CSP** — центральный пример отсутствия единого источника правды для конфигурации.

**Рекомендуемая последовательность:** сначала восстановить доверие к гейтам (пункты 1-2 топ-15), затем безопасность (3-4, 8), затем тестовое ядро (5), затем UX/жизненный цикл (6-7, 9-11) — остальное по мере итераций.
