# Комплексный аудит репозитория `egilyad/ai-os-new` (SuperAgents OS)

| Параметр | Значение |
|---|---|
| Репозиторий | https://github.com/egilyad/ai-os-new/ |
| Дата аудита | 2026-09-25 |
| Проанализированный коммит | `934c27a` — «fix: break last 2 kernel circular deps» |
| Версия проекта | 4.5.0 (SPA «SuperAgents OS») |
| Стек | React 19.2 · TypeScript 6.0 (strict) · Vite 8 · Zustand 4 · Dexie 4 (IndexedDB) · TipTap 3 · Monaco · @xyflow/react · framer-motion · zod 4 |
| Объём кодовой базы | ~392 000 LOC TS в `src/` (ядро 1474 файла, UI 987 компонентов), 366 тест-файлов / 2794 кейса |
| Метод | Статический анализ кода: 12 параллельных направлений аудита, каждая находка подтверждена файлом:строкой и цитатой кода |
| Всего находок | **114** (1 критическая, 13 высоких, 40 средних, 42 низких, 18 информационных; ~107 уникальных первопричин — часть находок пересекается между направлениями) |

---

## 1. Резюме для руководства (Executive Summary)

**SuperAgents OS** — зрелый клиентский SPA с архитектурой «ядро-сервисов + UI-панели», в котором весь стек LLM-взаимодействия (адаптеры 15+ провайдеров, стриминг SSE, ретраи, бюджетирование) исполняется в браузере. Средневзвешенная зрелость по 12 направлениям — **6.7 / 10**. Это крепкий инженерный продукт с несколькими по-настоящему образцовыми подсистемами и с концентрированным набором дефектов, почти все из которых локализуемы и устранимы.

**Сильные стороны** (подтверждены всеми аудиторами независимо):

- **Сетевой/стриминговый слой LLM — лучший фрагмент кодовой базы (8/10)**: собственный HTTP-клиент с merged-AbortSignal (с задокументированным обходом GC-бага Chrome), SSE-парсер с idle-timeout и лимитом буфера 10 МБ, декораторы Retry (backoff+jitter, уважение Retry-After) и CircuitBreaker, семафор на 50 запросов, реестр in-flight с cancelAll под memory pressure.
- **Архитектурная дисциплина (8/10)**: слои «UI → kernel → DAL» защищены автоматически в CI (dependency-cruiser + madge), фактически 0 импортов dexie из UI и 0 импортов UI из ядра, целенаправленная работа по разрыву циклических зависимостей в свежих коммитах.
- **Таймерная гигиена и жизненный цикл (7–8/10)**: системный unsubs-паттерн в 50+ сервисах, симметричные start/destroy, tiered bootstrap, HMR-dispose, crash-recovery.
- **Инфраструктура**: hardened Docker (non-root, cap_drop, read_only, healthcheck), code splitting на 266 lazy-чанков, CSP без unsafe-eval, AST-песочница кода без eval, timing-safe auth на sync-server.

**Главные риски** (детали в разделе 3 и по аудитам):

1. **CI фактически не запускается** — опечатка `branches: ain, master]` (потерян `[`) в триггерах push/PR; весь сильный пайплайн (typecheck, lint, тесты, coverage, madge, npm audit, e2e) гоняется только вручную. *Критическая, но 1-строчная фикс.*
2. **API-ключи всех LLM-провайдеров лежат в IndexedDB в plaintext «by design»** — готовый AES-GCM KeyVault написан, но намеренно не подключён к bootstrap; миграция ключей не удаляет legacy-копии из localStorage. Для приложения-«кошелька» ключей это центральный риск.
3. **Три функциональных дефекта данных/кэша**: битая схема индексов `memories` (`etadata.source]` — 124 вхождения, индексы пусты, все запросы с пост-фильтрацией в JS), CacheService, стирающий сам себя через собственное событие инвалидации, и тяжёлый flush кэша каждые 2 с.
4. **Код-редактор сломан в проде**: Monaco грузится с cdn.jsdelivr.net (дефолт `@monaco-editor/react` без `loader.config`), который блокируется собственным CSP проекта.
5. **Исходники публикуются на GitHub Pages**: hidden-sourcemaps остаются в `dist/` и уходят в Pages-артефакт, вопреки намерению «never served to clients».

Позитивная рамка: **ни одна из находок не является системной архитектурной ошибкой** — 80% исправлений точечные (конфиги, порядок условий, флаги, отсутствующие таймауты). Наибольшие вложения потребуются в тестирование (5/10) и шифрование ключей.

---

## 2. Сводные оценки по 12 направлениям

| # | Аудит | Оценка | Крит | Выс | Сред | Низк | Инфо | Ключевой вывод |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|---|
| 1 | Безопасность (Security Core) | **6/10** | 0 | 2 | 4 | 3 | 2 | Периметр сильный, но ключи в plaintext, CSP-конфиги разъехались |
| 2 | Жизненный цикл и состояние | **7/10** | 0 | 0 | 2 | 4 | 2 | Зрелый каркас start/stop; retry после сбоя bootstrap сломан |
| 3 | Стриминг, таймеры и отмена | **8/10** | 0 | 0 | 2 | 3 | 2 | Образцовый SSE/Abort-слой; Groq без таймаутов, autonomy не отменяем |
| 4 | UX, производительность и утечки UI | **7/10** | 0 | 0 | 3 | 4 | 1 | 256 lazy-чанков, виртуализация горячих списков; анимации без reduced-motion |
| 5 | Архитектура и зависимости | **8/10** | 0 | 1 | 2 | 3 | 2 | Инструментальные гейты слоёв в CI; Monaco-CDN против своего CSP |
| 6 | Обработка ошибок и логирование | **7/10** | 0 | 0 | 3 | 3 | 2 | Retry/CircuitBreaker образцовые; логгер не санитизирует meta |
| 7 | Сеть и API-контракты | **7/10** | 0 | 2 | 6 | 3 | 1 | LLM-стек отличный; fetch без таймаутов в 7 панелях, сломан TLS в cors-proxy |
| 8 | Хранение данных и кэширование | **6/10** | 0 | 3 | 5 | 3 | 1 | 43 версии Dexie с zod-хуками; битые индексы, самоочистка кэша |
| 9 | Тестирование и покрытие | **5/10** | 1 | 2 | 2 | 4 | 1 | 2794 кейса, но CI не запускается и сетевое ядро LLM не покрыто |
| 10 | Конфигурация и окружение | **7/10** | 0 | 0 | 5 | 4 | 0 | Единый .env.example, fail-fast на сервере; моки включены в проде |
| 11 | Доступность и i18n | **6/10** | 0 | 0 | 3 | 5 | 1 | Паритет локалей 3604×2, aria-покрытие; статичный lang, контраст 4.12:1 |
| 12 | Сборка и деплой | **6/10** | 0 | 3 | 3 | 3 | 3 | Hardened Docker, lazy-чанки; sourcemaps утекают, substring-баг manualChunks |
| | **Итого** | **6.7/10** | **1** | **13** | **40** | **42** | **18** | |

**Распределение находок по severity:** Критических — 1, Высоких — 13, Средних — 40, Низких — 42, Инфо — 18.

---

## 3. Топ-10 приоритетных дефектов (кросс-аудитовый рейтинг)

| Приоритет | ID | Severity | Дефект | Где |
|---|---|---|---|---|
| **P0-1** | TS9-01 | Критический | CI-триггеры push/PR не срабатывают: `branches: ain, master]` без `[` | `.github/workflows/ci.yml:9,11` |
| **P0-2** | ST8-03 | Высокий | CacheService стирает сам себя: подписан на `CACHE_INVALIDATED`, который эмитит при каждом eviction/replace | `src/kernel/services/cache-service.ts:64` |
| **P0-3** | BD12-01 | Высокий | hidden-sourcemaps остаются в `dist/` и публикуются на GH Pages — исходники доступны публично | `ci.yml:348–351`, `vite.config.ts:49` |
| **P0-4** | NT7-01 | Высокий | 7 gateway-панелей: `fetch` без таймаута/AbortSignal — запрос может висеть вечно | `src/components/CompaniesPanel.tsx:43` (+6) |
| **P0-5** | AR5-01 + BD12-03 | Высокий | Monaco с CDN блокируется собственным CSP — редактор не работает в проде; dep `monaco-editor` — мёртвый | `CodeEditor.tsx:2`, `nginx.conf:37` |
| **P0-6** | S1-02 | Высокий | Миграция ключей не удаляет legacy-plaintext-копии из localStorage и sqlite-блоба | `src/kernel/dal/key-migration.ts:92` |
| **P1-1** | S1-01 + ST8-01 | Высокий | API-ключи всех провайдеров в IndexedDB plaintext; готовый AES-GCM KeyVault не подключён | `key-vault.ts:25` |
| **P1-2** | ST8-02 | Высокий | Битая схема индексов `memories`: `etadata.source]` вместо `metadata.*` (124 вхождения) — индексы пусты | `src/kernel/services/dexie-schema.ts:349` |
| **P1-3** | NT7-02 | Высокий | cors-proxy соединяется с https-целями по «голому» IP без SNI → `ERR_TLS_CERT_ALTNAME_INVALID`, прокси системно неработоспособен | `scripts/cors-proxy.mjs:165` |
| **P1-4** | BD12-02 + AR5-02 | Высокий | `id.includes('react')` в manualChunks перехватывает @xyflow/react, @tiptap/*, @react-aria/* — vendor-ветки мертвы | `vite.config.ts:57–87` |

*Полный реестр из 114 находок — в таблицах разделов 4.1–4.12; расширенные детали с кодом — в приложениях `audit-01…12.md`.*

---
## 4. Детальные результаты по аудитам

### 4.1 Аудит 1: Безопасность (Security Core) — 6/10

**Обоснование оценки:** сильная периметровая работа (CSP без unsafe-eval, AST-песочница без eval, SSRF-защита прокси, timing-safe auth sync-server), но провайдерские API-ключи лежат в IndexedDB в открытом виде «by design», legacy-копии ключей остаются в localStorage, CSP-конфиги разъехались между dev/prod, админ-команды не имеют авторизации.

**Сводка находок:**

| ID | Severity | Находка | Файл:строка |
|----|----------|---------|-------------|
| S1-01 | Высокий | Провайдерские API-ключи хранятся в IndexedDB в plaintext «by design» — vault отключён от bootstrap | `src/kernel/services/key-management/key-vault.ts:32` |
| S1-02 | Высокий | Миграция ключей не удаляет legacy-plaintext-копии из localStorage и sqlite-блоба | `src/kernel/dal/key-migration.ts:92` |
| S1-03 | Средний | Секреты интеграций (company gateway и др.) в localStorage в открытом виде, 7+ панелей | `src/components/CompaniesPanel.tsx:92` |
| S1-04 | Средний | CSP-дрейф: connect-src в index.html и nginx-ssl.conf не содержит 15 провайдеров из nginx.conf — блокировка вызовов в SSL-проде | `docker/nginx-ssl.conf:47` |
| S1-05 | Средний | Markdown-рендер форума не экранирует `"`, возможен выход из атрибута href (смягчается CSP) | `src/kernel/services/forum/forum-service.ts:328` |
| S1-06 | Средний | AdminService: команды (reset/restart/settings) без авторизации — admin-токен удалён (C-7) | `src/kernel/services/admin-service.ts:475` |
| S1-07 | Низкий | KeyVault.unlock()/SecurityService.initialize() принимают любой пароль без верификации (нет контрольного значения) | `src/kernel/services/key-management/key-vault.ts:44` |
| S1-08 | Низкий | .env.example документирует паттерн VITE_KEY_* — Vite инлайнит VITE_* в клиентский бандл | `.env.example:52` |
| S1-09 | Низкий | cors-proxy: запросы без Origin-заголовка проходят origin-проверку | `scripts/cors-proxy.mjs:102` |
| S1-10 | Инфо | X-XSS-Protection deprecated; Trusted Types не включены | `docker/nginx.conf:27` |
| S1-11 | Инфо | PromptSecurityService — regex-эвристика инъекций, легко обходится; подключена в chat-пайплайне | `src/kernel/services/chat-executor.ts:154` |

**Ключевые детали:**

- **S1-01 (Высокий).** Код прямо документирует решение: `key-vault.ts:32-36` — «*Vault is intentionally NOT wired into the app's bootstrap… API keys are stored in IndexedDB in plaintext by design*»; рантайм-подтверждение в `key-service.ts:411`: «*Vault unlock failure is non-fatal — keys will be stored as plaintext*». Ключи пишутся через `keyStore.bulkPut()` без шифрования. Любой XSS, вредоносное расширение или физический доступ получают все ключи всех провайдеров — для SPA-«кошелька» это центральный риск. Рекомендация: вернуть vault в bootstrap (реализация AES-GCM + PBKDF2 уже готова), шифровать ключ на записи, master key — в non-extractable WebCrypto или через passphrase-разблокировку.
- **S1-02 (Высокий).** В `key-migration.ts` нет ни одного `removeItem`/удаления KV-записи: после `bulkPut` plaintext-ключи продолжают лежать в `localStorage['super_agents_api_keys']` и в `sqlite_db_blob`; флаг `keys:migrated:v12` гарантирует, что повторной попытки не будет. Даже после внедрения шифрования старые копии останутся в двух легкодоступных местах. Рекомендация: идемпотентно удалять legacy-источники после успешной миграции.
- **S1-05 (Средний).** `renderBody()` экранирует `& < >`, но не `"`; класс URL `[^)\s]+` допускает кавычку → пост `[x](http://a.com/"onmouseover="alert(1))` рендерится через `dangerouslySetInnerHTML` (`TopicView.tsx:137`) с выходом из атрибута href. Посты пишут и агенты (контент LLM попадает в innerHTML). Inline-обработчики режутся CSP, но политика сломается при её ослаблении. Рекомендация: добавить `.replace(/"/g, '&quot;')` и/или пропускать HTML через DOMPurify.

**Проверено, проблем не обнаружено:** сырой `eval()`/`new Function()`/`document.write` в prod-коде отсутствуют; `dangerouslySetInnerHTML` — только 3 места, 2 из них санитизированы (DOMPurify, esc()); `safe-json.ts` фильтрует `__proto__/constructor/prototype`; SQL/NoSQL-инъекции неприменимы (IndexedDB + JSON-файлы); sync-server — обязательный SYNC_SECRET fail-fast, `timingSafeEqual`, rate-limit, WS verifyClient; SSRF-защита cors-proxy с DNS-resolve против TOCTOU; sandbox-воркер — AST-интерпретатор с запрещёнными идентификаторами, gate `VITE_SANDBOX_ENABLED`.

**Положительные практики:** CSP без unsafe-eval с обоснованием каждого элемента в конфиге; DOMPurify для подсветки кода чата; санитизация секретов в логах/событиях (`sanitize.ts` — редакция sk-/AIza-/nvapi-ключей, переиспользуется в EventBus и LLMHttpClient); экспорт plaintext-ключей блокируется при залоченном vault.

---

### 4.2 Аудит 2: Жизненный цикл и состояние (Lifecycle & State) — 7/10

**Обоснование оценки:** зрелый каркас — RuntimeManager с guard'ами start/shutdown, LifecycleManager с tiered-init и таймаутами destroy, idempotent-регистрации, системный unsubs-паттерн; минусы — сломанный retry после частично упавшего bootstrap, дыры в учёте подписок EventBus, двойной destroy при перерегистрации.

**Сводка находок:**

| ID | Severity | Находка | Файл:строка |
|----|----------|---------|-------------|
| LC2-01 | Средний | После неудачного initServices() флаг isStarted=true — повторный start() возвращает stale-отчёт, реинициализации нет | `src/kernel/bootstrap.ts:145` |
| LC2-02 | Средний | EventBus.on(): `_unsubByCb` keyed по callback — один обработчик на два события затирает unsub другого | `src/kernel/events/event-bus.ts:188` |
| LC2-03 | Низкий | Container.register() перезаписывает инстанс молча и дублирует id в registrationOrder → двойной destroy при clear() | `src/kernel/container.ts:45` |
| LC2-04 | Низкий | MemoryWatchdog-pressure callback выделяет 64MB ArrayBuffer как «GC hint» — увеличивает пик под давлением памяти | `src/kernel/bootstrap.ts:467` |
| LC2-05 | Низкий | tryInit ретраит (4 попытки, до 7 с задержек) в критическом пути bootstrap — упавший сервис замедляет старт всех tier'ов | `src/kernel/services/lifecycle-manager.ts:121` |
| LC2-06 | Низкий | Внутренний слушатель EVENTBUS_BACKPRESSURE удаляется при clearAllSubscriptions() и не восстанавливается после restart | `src/kernel/events/event-bus.ts:99` |
| LC2-07 | Инфо | deploy-service / model-distillation-service симулируют прогресс через setInterval с фейковыми URL example.com — mock-логика в prod-коде | `src/kernel/services/deploy-service.ts:292` |
| LC2-08 | Инфо | Console-хелперы `window.__getState/__checkConsistency/__probeAll` регистрируются безусловно, в т.ч. в проде | `src/main.tsx:154` |

**Ключевые детали:**

- **LC2-01 (Средний).** `bootstrap.ts:143-147`: при `!servicesOk` ставится `this.isStarted = true`, при этом RuntimeManager (`runtime.ts:98-101`) явно рассчитан на retry — он сбрасывает `initialized` и `startPromise`. Итог: после провала критического сервиса повторный `start()` мгновенно возвращает старый отчёт с `phase='failed'` — система остаётся в деградации без шанса восстановиться. Рекомендация: не ставить `isStarted=true` при неудаче (или сбрасывать статусы lifecycle в начале init).
- **LC2-02 (Средний).** `_unsubByCb.set(callback, unsub)` — ключ по функции-обработчику, а не по паре (event, callback). Паттерн `bus.on(A,h); bus.on(B,h)` затирает первый unsub; при рестартах возможен «вечный» подписчик, держащий ссылку на уничтоженный сервис. Рекомендация: составной ключ `event → Set<callback>`.

**Проверено, проблем не обнаружено:** пары init/destroy симметричны у всех spot-check сервисов (probe, scheduler, chat-executor, admin) — есть кастомное ESLint-правило `rule-mandatory-lifecycle.mjs`; unsubs снимаются в destroy во всех 8 проверенных хранилищах; HMR dispose → `runtime.shutdown()`; zustand-сторы с liveQuery имеют `__cleanupKeyStore` + `import.meta.hot.dispose`; startPromise-guard и ожидание старта при shutdown (BR-02/BR-03); прерванные дебейты помечаются failed на старте (crash-recovery).

**Положительные практики:** tiered bootstrap с `checkDependencies()`; контейнер с детектом circular-dependency, кэшем упавших фабрик и LIFO-destroy (таймаут 5 с); EventBus с backpressure (MAX_PENDING 5000), dead-letter sink, идемпотентным emitOnce; MemoryWatchdog с отзывчивыми мерами (сброс кэшей, `cancelAll()` у LLMHttpClient); HMR-гигиена.

---

### 4.3 Аудит 3: Потоки, таймеры и отмена (Streaming, Timers & Abort) — 8/10

**Обоснование оценки:** образцовый слой стриминга — собственный SSE-парсер (idle-timeout/abort/лимит буфера 10 МБ/cancel-race), HTTP-клиент с merged-AbortSignal, inflight-реестром и cancel под memory pressure; провайдерские адаптеры повсеместно прокидывают signal. Слабые места точечные: Groq без слоёв таймаутов, autonomy-пайплайн не отменяем, worker-timeout не останавливает интерпретатор.

**Сводка находок:**

| ID | Severity | Находка | Файл:строка |
|----|----------|---------|-------------|
| TM3-01 | Средний | Groq-адаптер (groq-sdk) без HTTP/idle-таймаута — «тихое» зависание стрима при stall провайдера | `src/llm/groq/groq-adapter.ts:143` |
| TM3-02 | Средний | AutonomyRunner.runGoal: последовательное выполнение задач без AbortSignal/таймаута — нельзя отменить | `src/kernel/services/autonomy-runner.ts:70` |
| TM3-03 | Низкий | sandbox.worker.ts: Promise.race-таймаут не останавливает runSandboxCode; setTimeout не очищается после race | `src/kernel/workers/sandbox.worker.ts:61` |
| TM3-04 | Низкий | streamPost разоружает connection-таймаут после заголовков — общего потолка на тело стрима нет; защита только per-адаптерными idle-timeout | `src/llm/http/llm-http-client.ts:452` |
| TM3-05 | Низкий | Stale-reaper прерывает запросы «голым» abort() без reason — маскируется как user-cancel | `src/kernel/services/chat-executor.ts:49` |
| TM3-06 | Инфо | countdownInterval в debateLiveStore тикает каждую секунду, пока не очищены все коллекции | `src/stores/debateLiveStore.ts:197` |
| TM3-07 | Инфо | Promise.race-таймаут destroy() не очищает setTimeout при успешном завершении | `src/kernel/services/lifecycle-manager.ts:87` |

**Ключевые детали:**

- **TM3-01 (Средний).** Groq — единственный провайдер через SDK, а не через `LLMHttpClient` + `parseSSEStream`: ни connection-, ни idle-таймаута (`groq-adapter.ts:143-146`). У всех остальных idle-таймауты есть: 30 с (openrouter/openai-compatible/cloudflare), 90 с (NVIDIA), 15 с (Gemini). При stall-соединении `for await` висит неограниченно. Рекомендация: обернуть в таймаут + idle-guard либо перевести Groq на общий SSE-путь.
- **TM3-02 (Средний).** `runGoal` выполняет N задач × до 3 LLM-раундов как монолитный цикл без сигнала отмены и чекпоинтов — закрытие панели не останавливает работу, при падении контейнера задачи остаются 'active'. Рекомендация: принимать `AbortSignal`, проверять в начале итерации, передавать в `runPrompt`.

**Проверено, проблем не обнаружено:** у всех `setInterval` в ~20 сервисах ядра и 45+ панелях найдены парные clearInterval/destroy; единственный `getReader()` — в sse-parser.ts, cancel/releaseLock покрыты; все адаптеры прокидывают signal в fetch; `new WebSocket`/`EventSource` в `src/` отсутствуют; backpressure чат-стримов — rAF-флеш и hot-events мимо defer-очереди.

**Положительные практики:** SSE-парсер с синхронным `controller.error()` при abort (фикс «4-минутного зависания»), MAX_BUFFER_SIZE 10 МБ, cancel с 5-секундной страховкой; merged-signal без AbortSignal.any с задокументированным обходом Chrome GC-бага; ExecutionGovernor с полной очисткой слушателей; терминальные мета-чанки (finish_reason/usage) во всех адаптерах; удалённый replay-буфер STREAM_END (утечка до 100 МБ) с объяснением в коде.

---

### 4.4 Аудит 4: UX, производительность и утечки в UI — 7/10

**Обоснование оценки:** образцовый route-level code-splitting (256 lazy-чанков) и виртуализация самых горячих списков, но точечные whole-store подписки, отсутствие reduced-motion при сотнях бесконечных анимаций и немемоизированные панели-монолиты (до 1169 строк).

**Метрики:** 786 не-тестовых компонентов (194K LOC); `React.lazy` — 198 (route-imports.ts) + 58 (technique-panels); useMemo — 275, useCallback — 419, React.memo — только 23 файла; framer-motion — 527 `motion.*` в 166 файлах; `prefers-reduced-motion` — 2 вхождения; whole-store подписки — 3 из 151 zustand-вызовов; 31 addEventListener ↔ 31 removeEventListener.

**Сводка находок:**

| ID | Severity | Находка | Файл:строка |
|----|----------|---------|-------------|
| UX4-01 | Средний | Подписка на весь zustand-стор: ChannelPanel перерисовывается на каждое сообщение/любое поле | `src/components/ChannelPanel/ChannelPanel.tsx:42` |
| UX4-02 | Средний | `repeat: Infinity`-анимации без viewport-гейтинга; `prefers-reduced-motion` почти не поддержан (2 refs на 527 motion-использований) | `src/components/DashboardPanel/AgentLiveBoard.tsx:151` |
| UX4-03 | Средний | TracesPanel: до 200 трейсов полным `.map` внутри AnimatePresence, каждый элемент — motion.div | `src/components/TracesPanel/TracesPanel.tsx:394` |
| UX4-04 | Низкий | EventsTimeline: 500 событий целиком + JSON.stringify всего массива на каждое новое событие | `src/components/EventsTimeline/EventsTimeline.tsx:74` |
| UX4-05 | Низкий | React.memo лишь в 23 из 786 компонентов; панели-монолиты (PolicyPanel 1169, FleetPanel 1119 строк) не мемоизированы | `src/components/PolicyPanel/PolicyPanel.tsx:1` |
| UX4-06 | Низкий | Искусственная 100ms-задержка перед монтированием Monaco вместо `loading`-пропа | `src/components/Editors/CodeEditor.tsx:36` |
| UX4-07 | Низкий | `.catch(() => {})` на пользовательских действиях — сбой не показывается в UI (UX-аспект EH6-03) | `src/components/ChatPanel/ChatPanel.tsx:491` |
| UX4-08 | Инфо | Секрет company-gateway в localStorage в 4+ панелях (разбор в security-аудите, S1-03) | `src/components/ApprovalsPanel.tsx:109` |

**Ключевые детали:**

- **UX4-01 (Средний).** `const { channels, order, selectedId, messages, ... } = useChannelStore();` — без селектора: дописывание любого стримингового сообщения перерисовывает всю панель. Аналогично ProjectsPanel.tsx:30 и useBulkImport.ts. Рекомендация: атомарные селекторы / `useShallow`.
- **UX4-02 (Средний).** 527 `motion.*`, из них заметная доля `repeat: Infinity` (пульсации, «аквариумы»), viewport-гейтинг `whileInView` — 0 вхождений, `useReducedMotion` — 2 на весь код. Декоративные анимации гоняют композитор постоянно, в т.ч. офскрин. Рекомендация: `useReducedMotion()`-гейт + `whileInView`/CSS `animation-play-state`.

**Проверено, проблем не обнаружено:** localStorage-доступ не встречается в теле рендера (только ленивые `useState(() => ...)`-инициализаторы с try/catch); тяжёлый JS-парсинг (meriyah) — в воркерах и через динамический import; утечек обработчиков не найдено.

**Положительные практики:** eagerly импортируются только ErrorBoundary/Skeleton, всё остальное — по lazy-чанку с PanelSkeleton; виртуализация (`useVirtualizer`, overscan 5) чата и логов; 148 селекторных zustand-подписок против 3 whole-store; хук `useVisibilityInterval` ставит опросы на паузу при скрытом табе (6 использований); ModalShell восстанавливает `document.body.style.overflow`.

---
### 4.5 Аудит 5: Архитектура и зависимости (Architecture & Dependencies) — 8/10

**Обоснование оценки:** образцовая для SPA дисциплина слоёв — dependency-cruiser + madge в CI, ноль dexie-импортов в UI, ноль UI-импортов в kernel, свежие коммиты о разрыве циклов; минус — конфликт Monaco-CDN со своим же CSP, порядок правил manualChunks, связность через service-locator (520 импортов instances).

**Метрики:** ~430K LOC TS (kernel 204K, components 194K); импортов UI → kernel — 1137, kernel → UI — 0; 23 runtime-зависимости; явных уязвимых пакетов (axios/lodash/moment/request) нет; лицензии — MIT-совместимые, copyleft (GPL/AGPL) не обнаружено.

**Сводка находок:**

| ID | Severity | Находка | Файл:строка |
|----|----------|---------|-------------|
| AR5-01 | Высокий | monaco-editor в deps не импортируется; @monaco-editor/react без `loader.config` грузит Monaco с CDN, который блокируется собственным CSP `script-src 'self'` → редактор не работает в prod | `package.json:27`, `src/components/Editors/CodeEditor.tsx:2` |
| AR5-02 | Средний | В manualChunks условие `id.includes('react')` стоит первым и перехватывает @tiptap/react, @tanstack/react-virtual, @react-aria — ветки vendor-tiptap/vendor-aria частично мертвы | `vite.config.ts:58` |
| AR5-03 | Средний | Service-locator связность: 520 импортов `kernel/instances` в 390 файлах мимо DI-контейнера — скрытые зависимости, тяжело мокать | `src/hooks/useRealAgents.ts:2` |
| AR5-04 | Низкий | 1137 прямых импортов UI → недра kernel мимо фасада kernel/index.ts; depcruise глубину не ограничивает | `src/components/PolicyPanel/PolicyPanel.tsx:27` |
| AR5-05 | Низкий | zustand 4.5.7 при вышедшей v5 — v4 в maintenance-режиме; миграция механическая | `package.json:33` |
| AR5-06 | Низкий | @google/generative-ai 0.24.1 — SDK официально deprecated в пользу @google/genai | `package.json:12` |
| AR5-07 | Инфо | lucide-react 1.14.0 — неожиданный 1.x мажор; tree-shaking сохранён именованными импортами | `package-lock.json:7469` |
| AR5-08 | Инфо | Ручной фасад kernel/index.ts (311 строк, 91 export) без автогенерации/CI-проверки полноты | `src/kernel/index.ts:1-3` |

**Ключевые детали:**

- **AR5-01 (Высокий).** `@monaco-editor/react` v4 по умолчанию грузит Monaco с cdn.jsdelivr.net через свой loader; `loader.config(...)` в src/ не вызывается (0 вхождений), dep `monaco-editor` не импортируется ни одним файлом (0 вхождений `from 'monaco-editor'`), а CSP (dev-мета и nginx) разрешает скрипты только с 'self'. Итог: панель Editors в продакшене зависает на «Loading editor...». Рекомендация: self-host (`loader.config({ monaco })` + бандл ~2 МБ в отдельный чанк, либо vite-plugin-monaco-editor с worker-ассетами), либо убрать dep.
- **AR5-03 (Средний).** При наличии полноценного DI-контейнера 520 импортов-синглтонов из `kernel/instances` создают скрытые зависимости, невидимые depcruise-правилам; тесты требуют моков модулей (коммит 240f942 «add rootLogger to debate-session-store test mock»). Рекомендация: instances — только как композиционный корень, новые сервисы — через токены контейнера.

**Проверено, проблем не обнаружено:** 0 импортов dexie в src/components; 0 runtime-импортов kernel → components/stores; доступ к БД только через DAL-фасад («ЗАКОН 2»); barrel-циклы предотвращены by design (внутренние импорты kernel — прямые).

**Положительные практики:** архитектурные гейты в CI (`check:circular-kernel` madge падает при циклах; `check:deps` depcruise — базовая линия 0 violations на 1418 модулях / 5074 deps); правила no-react-in-kernel и no-ui-in-kernel; строгий TS (strict + noUncheckedIndexedAccess + noUnusedLocals); `sideEffects`-whitelist; коммиты 6390e33/934c27a — целенаправленный вынос leaf-модулей против циклов.

---

### 4.6 Аудит 6: Обработка ошибок и логирование (Error Handling & Logging) — 7/10

**Обоснование оценки:** сильная LLM-специфика (typed errors, backoff с jitter и Retry-After, circuit breaker, изоляция подписчиков EventBus, глобальный unhandledrejection), но центральный логгер не санитизирует meta перед записью в консоль и IndexedDB, в kernel нет таксономии ошибок (710 голых `throw new Error`), 8+ содержательных сбоев гасятся молча.

**Метрики:** `console.*` — 80 refs / 44 файла против `logger.*` — 40 refs / 4 файла; catch-блоков — 2143, полностью пустых — **0** (229 оформлены с поясняющим комментарием — след lint-дисциплины); `.catch(() => {})` — 60 (≈50 из них — легитимное подавление unhandled rejection при отмене стрима); `throw new Error` в kernel — 710; кастомных классов ошибок — 7; в src/llm — 46 типизированных throw против 21 generic.

**Сводка находок:**

| ID | Severity | Находка | Файл:строка |
|----|----------|---------|-------------|
| EH6-01 | Средний | LoggerService.formatMeta не санитизирует meta: секреты могут попасть в консоль и персистентный буфер `logger:buffer` (IndexedDB, запись каждые 30 с) | `src/kernel/services/logger-service.ts:206` |
| EH6-02 | Средний | 710 `throw new Error` в kernel без кодов при 7 кастомных классах — нет таксономии ошибок для UI/ретраев | `src/kernel/errors.ts:1` |
| EH6-03 | Средний | Содержательные `.catch(() => {})`: switchKey/switchModel, загрузка задач, снапшоты совета — сбои не видны ни пользователю, ни логам | `src/components/ChatPanel/ChatPanel.tsx:491` |
| EH6-04 | Низкий | Нет `window.onerror`: глобально ловятся только promise-реджекты; синхронные исключения вне React-дерева не репортятся | `src/main.tsx:17` |
| EH6-05 | Низкий | FALLBACK_LOGGER.child() возвращает `this` — имя сервиса теряется до init логгера | `src/shared/utils/logger.ts:39` |
| EH6-06 | Низкий | Прямые console.* — 80 refs в 44 файлах (2:1 к logger), в обход уровней/буфера/редакции секретов | `src/main.tsx:57` (пример зоны) |
| EH6-07 | Инфо | `catch { /* ignore */ }` гасит сбой персистенции настройки в ~30 техник-панелях | `src/components/TechniquePanels/CriticPanel.tsx:162` |
| EH6-08 | Инфо | Debug-хелперы window.__getState/__probeAll не обёрнуты в `import.meta.env.DEV` и попадают в prod-бандл | `src/main.tsx:154` |

**Ключевые детали:**

- **EH6-01 (Средний).** Санитайзер `sanitize.ts` (9 паттернов API-ключей + SENSITIVE_KEY_RE) подключён только в 7 файлах LLM-слоя, но LoggerService в `formatMeta()` его не применяет: один `LOGGER.error('X', 'cfg', { cfg: config })` — и секреты оседают в персистентном буфере, который выгружается через `exportLogs`. Рекомендация: прогонять meta/error через `sanitizeObject` в `log()` + тест «ключ в meta не попадает в getBuffer()».
- **EH6-02 (Средний).** В src/llm таксономия есть (RetryableError с statusCode/retryAfter), в остальном kernel — 710 throw без machine-readable кодов: UI не может программно различать «нет ключа» / «битые данные» / «баг», сообщения не локализуются. Рекомендация: KernelError с полем `code`, внедрять на границах сервисов начиная с DAL и KeyService.

**Положительные практики:** LoggerService — 4 уровня, кольцевой буфер 500, traceId/correlationId, exportLogs в 3 форматах, runtime setLogLevel; глобальный unhandledrejection с UX-уведомлением и HMR-dispose; EventBus изолирует каждый подписчик (per-callback try/catch) + dead-letter; RetryDecorator — backoff ×2 с full-jitter, потолок 30 с, уважение Retry-After, отказ от ретрая 429/401/403; CircuitBreaker с осознанной политикой статусов (порог 5xx=2, 4xx не открывают контур); lint-дисциплина — 0 пустых catch, 229 с комментариями.

---

### 4.7 Аудит 7: Сеть и API-контракты (Network & API Contract) — 7/10

**Обоснование оценки:** сильный централизованный LLM-стек (таймауты, ретраи, circuit breaker, rate-limiter, robust SSE-парсер, deny-by-default nginx-прокси), но ~10 необработанных `fetch` без таймаутов в панелях, сломанное TLS-соединение по IP в cors-proxy, мёртвый контракт `/proxy/azure`, WS-сервер без ping/pong.

**Метрики:** `fetch(` — 50 в 31 файле; с `AbortSignal.timeout` — 20; без сигнала — 7 (все в gateway-панелях); EventSource/WebSocket-клиентов в src/ — 0; `res.ok` обрабатывается во всех проверенных kernel-сервисах.

**Сводка находок:**

| ID | Severity | Находка | Файл:строка |
|----|----------|---------|-------------|
| NT7-01 | Высокий | 7 fetch-вызовов в UI-панелях без таймаута/AbortSignal — запрос к gateway может висеть вечно | `src/components/CompaniesPanel.tsx:43` (+6 файлов) |
| NT7-02 | Высокий | cors-proxy соединяется с https-целями по «голому» IP без servername — TLS SNI/проверка сертификата падает (`ERR_TLS_CERT_ALTNAME_INVALID`), `/proxy/fetch` системно 502 | `scripts/cors-proxy.mjs:165` |
| NT7-03 | Средний | cors-proxy: нет таймаута на исходящий запрос, ответ буферизуется целиком (до 100 МБ) — стриминг невозможен | `scripts/cors-proxy.mjs:178` |
| NT7-04 | Средний | Провайдер `azure` направлен на `/proxy/azure`, которого нет ни в vite, ни в nginx (catch-all 403) | `src/llm/registry/adapter-factory.ts:197` |
| NT7-05 | Средний | zod-валидация ответа провайдера не блокирующая: safeParse-fail → warn и «trust as-is» сырых данных | `src/llm/openai-compatible/openai-compatible-adapter.ts:79` |
| NT7-06 | Средний | sync-server доверяет spoofable X-Forwarded-For для rate-limit; WS без серверного ping/pong — полуоткрытые соединения не выявляются | `server/sync-server.mjs:71` |
| NT7-07 | Средний | tool-executor: AbortError/timeout попадает в прокси-фолбэк вместо немедленной выброски отмены | `src/kernel/services/tool-executor.ts:558` |
| NT7-08 | Средний | Gateway-панели дефолтят на `http://localhost:3001` — в Docker-проде блокируется mixed-content и CSP | `src/components/CompaniesPanel.tsx:27` |
| NT7-09 | Низкий | sync-server: Map rateLimits/wsRateLimits никогда не чистятся — утечка на спуфнутых IP | `server/sync-server.mjs:64` |
| NT7-10 | Низкий | gemini `with429Retry` — второй параллельный механизм ретрая поверх RetryDecorator, sleep без учёта AbortSignal | `src/llm/gemini/gemini-adapter.ts:20` |
| NT7-11 | Низкий | Хардкод `Origin: 'http://localhost:5173'` для groq | `src/llm/openai-compatible/openai-compatible-adapter.ts:61` |
| NT7-12 | Инфо | fetchJson-обёртка скопирована в 7 панелей вместо общего API-клиента | `src/components/CostsPanel.tsx:38` |

**Ключевые детали:**

- **NT7-02 (Высокий).** Анти-DNS-rebinding фикс подменяет хост на резолвнутый IP (`targetForConnection = protocol//ip/path`), но не передаёт `servername` в https.request: TLS проверяет сертификат против IP, у публичных API нет IP-SAN → любой https-таргет из allowlist возвращает 502, фолбэк `/proxy/fetch` в tool-executor системно неработоспособен для https. Рекомендация: `servername: parsed.hostname` + нормализация `::ffff:`-адресов в isPrivateIP.
- **NT7-01 (Высокий).** `fetchJson` в 7 панелях: `const r = await fetch(url, { headers });` — при зависании sync-gateway промис висит бессрочно, кнопки остаются в loading. Контраст: kernel-сервисы используют `AbortSignal.timeout` (20 вхождений). Рекомендация: единый gateway-клиент с `AbortSignal.any([userSignal, AbortSignal.timeout(10_000)])`.
- **NT7-05 (Средний).** `const safe = parsed.success ? parsed.data : data;` — контракт ответа провайдера фактически не соблюдается: расхождение со схемой деградирует в `content: ''`, `tokens: 0` без явной ошибки. Рекомендация: критичные поля (отсутствие `choices[0]`) → LLMError, вариативные — опциональными в схеме.

**Положительные практики:** LLMHttpClient — таймаут 120 с, ручной merge сигналов, Retry-After-парсер, семафор 50, реестр in-flight; RetryDecorator с отказом ретраить стрим после первых чанков; nginx — deny-by-default для неизвестных `/proxy/*`, `proxy_buffering off` + `proxy_read_timeout 120s` для стриминга, `proxy_ssl_verify on`; cors-proxy — allowlist, resolve-проверка против DNS-rebinding, зачистка Authorization/Cookie; sync-server — обязательный SYNC_SECRET, timingSafeEqual, WS-auth через Sec-WebSocket-Protocol; версионирование API провайдеров корректно (`/v1`, `/v1beta`).

---

### 4.8 Аудит 8: Хранение данных и кэширование (Data Storage & Caching) — 6/10

**Обоснование оценки:** зрелый Dexie-слой (43 версии схемы, zod-хуки записи, валидация импорта) и качественный CacheService (TTL/LRU/stampede-защита) обесценены тремя серьёзными дефектами: plaintext-ключи, битая схема индексов `memories` и самоочистка кэша через собственное событие.

**Метрики:** IndexedDB (Dexie, БД `super_agents_os_v4`, версии 5→43, 39 `version()`), localStorage — 116 использований в 45 файлах, in-memory кэши; upgrade-хуков — 4 из 39 версий; QuotaExceededError обрабатывается в 3 точках; BroadcastChannel для кросс-табовой синхронизации circuit-breaker/rate-limit.

**Сводка находок:**

| ID | Severity | Находка | Файл:строка |
|----|----------|---------|-------------|
| ST8-01 | Высокий | API-ключи в IndexedDB plaintext «by design» — AES-GCM KeyVault готов, но не подключён (= S1-01) | `src/kernel/services/key-management/key-vault.ts:25` |
| ST8-02 | Высокий | Битая схема индексов `memories`: `'id, content, etadata.source], etadata.type], ...'` — несуществующие ключ-пути, 124 вхождения `etadata` | `src/kernel/services/dexie-schema.ts:349` |
| ST8-03 | Высокий | CacheService подписан на CACHE_INVALIDATED, который сам эмитит при eviction/replace — после заполнения кэш стирается целиком при каждой записи | `src/kernel/services/cache-service.ts:64` |
| ST8-04 | Средний | Токены gateway (SYNC_SECRET) и webhook-secret в localStorage plaintext (= S1-03) | `src/components/CompaniesPanel.tsx:91` |
| ST8-05 | Средний | Legacy «шифрование» XOR+base64 с захардкоженным salt — security theater, дублировано в двух адаптерах | `src/kernel/services/storage/local-storage-adapter.ts:5` |
| ST8-06 | Средний | Snapshot дебатов сериализуется в localStorage без ограничения размера — риск QuotaExceeded при 5 МБ, исключение глотается | `src/kernel/services/debate-runtime/debate-engine.ts:184` |
| ST8-07 | Средний | 37 из 39 версий Dexie — только stores(), история версий 1–4 утрачена, откат со старых сборок невозможен | `src/kernel/services/dexie-schema.ts:348` |
| ST8-08 | Средний | QuotaExceededError обрабатывается лишь в 3 точках; BucketStorageAdapter.setItem только логает потерю данных | `src/kernel/services/storage-adapter.ts:129` |
| ST8-09 | Низкий | Запросы по битым индексам (`where('etadata.timestamp]')`) с обязательной пост-фильтрацией в JS — деградация O(n) | `src/kernel/dal/memory-repository.ts:189` |
| ST8-10 | Низкий | 116 обращений к localStorage в 45 файлах, часть напрямую мимо LocalStorageAdapter — нет единой точки квоты/санитизации | `src/components/CompaniesPanel.tsx:32` |
| ST8-11 | Низкий | flush() кэша перезаписывает весь массив (до 500 записей с полными ответами LLM) каждые 2 с активности | `src/kernel/services/cache-service.ts:101` |
| ST8-12 | Инфо | sessionStorage не используется вовсе (0 вхождений) — черновики и временные данные идут в localStorage бессрочно | `src/components/ForumPanel/PostComposer.tsx:35` |

**Ключевые детали:**

- **ST8-02 (Высокий).** `memories: 'id, content, etadata.source], etadata.type], etadata.timestamp]'` — опечатка `etadata` вместо `metadata` и висячие `]` без открывающих `[`; дефект воспроизведён во всех версиях схемы (v5…v43). Весь код ходит по этим именам: `db.memories.where('etadata.timestamp]')`, `orderBy('etadata.timestamp]')`; ключ-путь не совпадает с полем данных (`metadata.*`), поэтому индексы пусты, а разработчики вынуждены пост-фильтровать коллекции в JS (`dexie-storage.ts:149-158`). Возможен SyntaxError при апгрейде в реальном браузере. Рекомендация: новая версия схемы с корректными индексами `[metadata.source+metadata.type]` + обновление всех точек запроса.
- **ST8-03 (Высокий).** `set()` при вытеснении/перезаписи эмитит `CACHE_INVALIDATED`, собственный обработчик которого вызывает `clear()` — вся карта, включая только что записанный ключ, и счётчики hits/misses сбрасываются. Стационарный режим кэша — «всегда пуст», LRU и метрики hit-rate теряют смысл, каждое заполнение заново греет промпты провайдеров (реальные деньги). Рекомендация: не эмитить глобальное событие из `set()` либо фильтровать по `payload.section`.

**Положительные практики:** zod-хуки `creating`/`updating` на таблицах Dexie отклоняют невалидные записи до записи в БД (редкая для браузерных приложений практика); `validateJsonArray` с zod-валидацией каждой записи при импорте; CacheService с дедупликацией in-flight (anti-stampede) и EMA hit-rate; кросс-табовая синхронизация через BroadcastChannel с fallback; атомарная запись серверной БД (tmp+rename) с writeQueue.

---
### 4.9 Аудит 9: Тестирование и покрытие (Testing & Coverage) — 5/10

**Обоснование оценки:** 366 тест-файлов / 2794 кейса / 43K тест-LOC (~10% от 430K) с качественными моками и антифлаг-гигиеной, но покрытие официально замеряется только по 5 «удобным» директориям (порог 30%), сетевое ядро LLM не покрыто вовсе, e2e — 4 smoke-теста, а CI-триггер сломан опечаткой.

**Метрики:** тест-файлов — 366 (kernel 236, components 106, stores 14, llm 5, hooks 3); кейсов — 2794; тест-LOC — 43 184 из 429 951 (≈10%); `vi.mock` — 315 в 118 файлах; снепшотов — 0; it.skip — 1; test.only/xit/xdescribe — 0; пустых тестов/тестов без assert — не обнаружено.

**Сводка находок:**

| ID | Severity | Находка | Файл:строка |
|----|----------|---------|-------------|
| TS9-01 | **Критический** | CI: `branches: ain, master]` — потеряна `[`, push/PR-триггеры не срабатывают, suite гоняется только через workflow_dispatch | `.github/workflows/ci.yml:9,11` |
| TS9-02 | Высокий | Coverage.include ограничен 5 директориями (stores, hooks, kernel/events, kernel/workers, container) — 90%+ кодовой базы вне метрики, порог 30% на «удобном» срезе | `vitest.config.ts:25` |
| TS9-03 | Высокий | 0 unit-тестов сетевого ядра LLM: llm-http-client, retry-decorator, circuit-breaker, rate-limit-decorator, adapter-factory; 14 из 15 адаптеров без тестов | `src/llm/http/llm-http-client.ts:1` |
| TS9-04 | Средний | e2e — 1 файл, 4 smoke-теста (видимость текста), 0 сценариев с данными/действиями на 786 компонентов | `e2e/basic-flow.spec.ts:9` |
| TS9-05 | Средний | Покрытие по каталогам: компоненты 106/786 (~13%), kernel/services 187/692 (~27%), llm 5/50 | — |
| TS9-06 | Низкий | it.skip с Promise-конструктор анти-паттерном (reject вместо done-семантики) | `src/kernel/services/ChatService.test.ts:14` |
| TS9-07 | Низкий | src/tests/setup.ts не подключён ни к одному конфигу — мёртвый, с top-level `await runtime.start()` | `src/tests/setup.ts:39` |
| TS9-08 | Низкий | src/test_map.ts — мусорный `export class Test {}` без единой ссылки | `src/test_map.ts:1` |
| TS9-09 | Низкий | 8 реальных sleep в 7 тест-файлах + 7 waitFor с хардкод-таймаутами ≥4 c — источник флаки | `src/kernel/services/debate-runtime/debate-orchestrator.test.ts:116` |
| TS9-10 | Инфо | Playwright webServer = `vite preview` — e2e требует предварительного build без понятной ошибки | `e2e/playwright.config.ts:12` |

**Ключевые детали:**

- **TS9-01 (Критический).** `cat -A` подтверждает отсутствие `[` в YAML-скаляре `ain, master]` — фильтр веток не матчит ни одну реальную ветку, поэтому 9 джоб (quality/build/test/coverage/security-audit/circular-check/dep-graph/e2e/deploy) не запускаются на push и PR; защита main держится только на ручном dispatch. Сам набор джоб при этом сильный. Рекомендация: восстановить `[main, master]` + branch protection с обязательными checks.
- **TS9-02 (Высокий).** Комментарий в конфиге честно признаёт: «broad include of all of src would report ~4%». Порог 30% выполняется на срезе, дающем ~46%, — dashboard-цифра вводит в заблуждение, регрессии в непокрытых зонах невидимы. Рекомендация: честный all-src отчёт без gate + инкрементальный подъём порогов.

**Положительные практики:** 9 CI-джоб с bundle-size gate 30 МБ и security-audit; DAL-тест-харнесс с createTestDb и clearAll() в beforeEach; `vi.hoisted` для hoist-safe моков; нулевая терпимость к анти-флагам (0 test.only/снепшотов на 366 файлов); крупные кейсы проверяют поведение (container.test — 382 строки, budget-service.test — 644 строки с граничными случаями).

---

### 4.10 Аудит 10: Конфигурация и окружение (Configuration & Environment) — 7/10

**Обоснование оценки:** единый самодокументированный .env.example, fail-fast валидация серверных env, секреты не закоммичены, dependabot настроен — но мёртвые build-args, VITE_BUILD_ID не инжектится, клиентский env без схемы валидации, stage-контур отсутствует.

**Сводка находок:**

| ID | Severity | Находка | Файл:строка |
|----|----------|---------|-------------|
| CF10-01 | Средний | VITE_BUILD_ID не инжектится ни в CI, ни в Docker — в проде всегда `buildId: 'dev'` | `ci.yml:87–90`, `config-registry.ts:5–8` |
| CF10-02 | Средний | GH Pages деплой собирается без VITE_BASE_PATH — на project pages сломаются пути ассетов | `ci.yml:87–90`, `.env.example:9–11` |
| CF10-03 | Средний | `featureFlags.mockServices.enabled: true` по умолчанию + двойной дефолт `?? true` в DemoGate — мок-панели включены в проде | `config-registry.ts:288–290`, `DemoGate.tsx:18` |
| CF10-04 | Средний | Мёртвые build-args VITE_DISABLE_TELEMETRY / VITE_LOG_LEVEL — 0 использований в src | `Dockerfile:50–51`, `docker-compose.yml:36–37` |
| CF10-05 | Средний | VITE_DEBUG_MEMORY/VITE_DEBUG_KEYS через `as unknown as`, не описаны в .env.example; клиентский env без zod-схемы | `src/main.tsx:35` |
| CF10-06 | Низкий | Все 29 GitHub Actions пиннуты по мутабельным тегам (@v4), не по SHA — supply-chain вектор при `id-token: write` у deploy | `ci.yml:25` |
| CF10-07 | Низкий | `npm ci --legacy-peer-deps` как постоянная норма (peer-конфликт madge×typescript 6) — глушит все будущие peer-конфликты | `Dockerfile:35–37`, `ci.yml:42` |
| CF10-08 | Низкий | CSP поддерживается в трёх местах и разошлась: 20 vs 16 vs 8 connect-src хостов (= S1-04) | `vite.config.ts:115`, `nginx.conf:37`, `index.html:19` |
| CF10-09 | Низкий | Stage-окружения нет: только dev (Vite) и prod (GH Pages + docker-профили) | `docker-compose.yml:77–104` |

**Ключевые детали:**

- **CF10-01/CF10-02 (Средние).** `.env.example` декларирует «Build ID (injected at CI build time)» и «Set to /repo-name/ when deploying to GitHub Pages», но `rg VITE_BUILD_ID .github/ Dockerfile docker-compose.yml` — 0 совпадений: каждый прод-билд сообщает `buildId: 'dev'`, а project-pages-деплой получит 404 на `/assets/*`. Рекомендация: `VITE_BUILD_ID: ${{ github.sha }}` в CI, VITE_BASE_PATH — через repository variable + smoke-проверка в build-джобе.
- **CF10-03 (Средний).** Мок-панели (DemoGate/DemoBadge) показываются в прод-сборке по двойному дефолту `?? true` — пользователь прод-деплоя видит демо-данные как полноценные панели. Рекомендация: дефолт `false` + явное включение.

**Положительные практики:** ни один реальный .env не закоммичен (`git ls-files` проверен); fail-fast на сервере (SYNC_SECRET обязателен, CORS_ORIGIN с явным запретом `*` как open-relay); entrypoint.sh проверяет TLS-сертификаты на старте; наименьшие привилегии в CI — у каждой джобы свой `permissions: contents: read`; dependabot с осмысленным ignore-листом (GHSA-qwww-vcr4-c8h2 задокументирован); трёхслойная нормализация прокси-конфигурации (vite ≡ entrypoint ≡ nginx) с catch-all deny.

---

### 4.11 Аудит 11: Доступность и интернационализация (Accessibility & i18n) — 6/10

**Обоснование оценки:** сильная база — собственный i18n с parity-тестом (3604 ключа × 2 локали), lazy-загрузка локалей, skip-nav, focus-visible, high-contrast-темы, 898 aria-атрибутов — но статичный `lang="en"`, провал контраста muted-текста (4.12:1), мёртвый механизм defaultValue, полное отсутствие RTL.

**Метрики:** 898 aria-атрибутов в 255 файлах, 214 role= в 155 файлах, 33 aria-live, 118 onKeyDown в 85 файлах; Intl — в 2 файлах против 410 × `toFixed()` в 220 файлах; RTL — 0 вхождений `dir=`; `TranslationKey = string` — без типизации.

**Сводка находок:**

| ID | Severity | Находка | Файл:строка |
|----|----------|---------|-------------|
| AI11-01 | Средний | `document.documentElement.lang` не переключается при смене языка; `lang="en"` статичен (WCAG 3.1.1) — скринридер озвучивает русский текст по английским правилам | `index.html:2`, `useTranslation.ts:15–25` |
| AI11-02 | Средний | Контраст `--text-muted #71717a` на `#09090b` = **4.12:1** < AA 4.5:1 при активных кеглях 0.7–0.75rem | `src/styles/variables.css:4,10,191–193` |
| AI11-03 | Средний | `t(key, {defaultValue})` не поддерживается движком i18n — 17 вызовов в 4 компонентах молча игнорируют фолбэк, пользователь видит сырой ключ | `translations/index.ts:31–60`, `GovernancePanel.tsx:23` |
| AI11-04 | Низкий | Недостижимые русские фолбэки `t(key) \|\| 'Русский'` — t() при промахе возвращает непустой ключ (9 мест) | `src/components/DebateQualityPanel.tsx:270` |
| AI11-05 | Низкий | Тяжёлые RU-строки в ядре мимо i18n + `DEFAULT_DEBATE_LANGUAGE='Russian'` захардкожен | `stance-drift-tracker.ts:183`, `config-registry.ts:367` |
| AI11-06 | Низкий | TranslationKey = string — опечатка в ключе компилируется, ловится только dev-варнингом | `translations/index.ts:3` |
| AI11-07 | Низкий | Intl в 2 файлах против 410 × toFixed() и 170 × toLocale* — числа без привязки к активной локали | `format-cost.ts:4–11` |
| AI11-08 | Низкий | RTL не поддерживается архитектурно: 0 установок dir=, стили без logical properties | `AppLayout.tsx:179–195` |
| AI11-09 | Инфо | Модалки без aria-labelledby/aria-label — скринридер объявляет «диалог» без имени | `src/components/ModalShell.tsx:33–36` |

**Ключевые детали:**

- **AI11-02 (Средний).** Расчёт относительной светимости: #71717a на #09090b = 4.12:1 (для сравнения: text-main 19.06:1, светлая тема muted 4.55:1 — впритык). Вторичный текст — подписи, метаданные, hints — активно используется с `--text-xs: 0.7rem` (11.2px). Рекомендация: поднять до #8b8b96 (~5.3:1) + CI-скрипт проверки контраста пар токенов (аналог scripts/tokenize-colors.mjs).
- **AI11-03 (Средний).** `getTranslation(locale, key, params?)` интерполирует `{k}`, но `params.defaultValue` не читается ни в одной точке src/i18n — react-i18next-привычка создаёт мёртвый контракт. Фикс тривиален: `if (!localeText && !enText && params?.defaultValue) return params.defaultValue`.

**Положительные практики:** parity-тест локалей под CI-защитой (3604 ключа 1:1, 19 файлов); ленивая загрузка локалей через dynamic import — русские строки не попадают в начальный бандл для en-пользователей; warn-once на отсутствующий ключ с указанием промахнувшейся локали; skip-nav с переходом на `<main id="main-content">`; глобальный `:focus-visible` и `@media (prefers-reduced-motion: reduce)` в CSS; полноценная high-contrast тема отдельными токенами; FocusScope (@react-aria) в модалках; все 9 `<img>` с alt.

---

### 4.12 Аудит 12: Производительность сборки и деплоя (Build & Deploy Performance) — 6/10

**Обоснование оценки:** образцовый code splitting (~266 lazy-компонентов), продуманный manualChunks, hidden-sourcemaps с upload-скриптом, immutable-кэш и hardened Docker — но три «мёртвые» ветки manualChunks из-за substring-сравнения, утечка .map-файлов на GH Pages, Monaco под CSP-блок, дублирование сборки в CI без таймаутов.

**Сводка находок:**

| ID | Severity | Находка | Файл:строка |
|----|----------|---------|-------------|
| BD12-01 | Высокий | hidden-`.map` файлы остаются в `dist/` и публикуются на GH Pages — исходники ~392K LOC доступны публично, вопреки намерению P1.27 «never served to clients» | `ci.yml:348–351`, `vite.config.ts:49` |
| BD12-02 | Высокий | `id.includes('react')` перехватывает @xyflow/react, @tiptap/*, @react-aria/*, lucide-react, @tanstack/react-virtual — vendor-xyflow/vendor-tiptap/vendor-aria недостижимы, vendor-react раздут (= AR5-02) | `vite.config.ts:57–87` |
| BD12-03 | Высокий | Monaco грузится с cdn.jsdelivr.net (дефолт), но прод-CSP разрешает только script-src 'self' — CodeEditor не работает в проде (= AR5-01); dep monaco-editor (~80 МБ в node_modules) не импортируется вовсе | `CodeEditor.tsx:2`, `nginx.conf:37` |
| BD12-04 | Средний | e2e-джоба повторно выполняет полную `npm run build` при существующем артефакте — двойная сборка на пайплайн | `ci.yml:304–307` |
| BD12-05 | Средний | Ни одна из 7 джоб CI не имеет timeout-minutes (дефолт GitHub — 360 мин) | `ci.yml:19–356` |
| BD12-06 | Средний | Двойная загрузка Google Fonts: `<link>` в HTML + `@import` в CSS (разные наборы весов, @import render-blocking) | `index.html:7–12`, `variables.css:1` |
| BD12-07 | Низкий | Для index.html не задан Cache-Control — эвристическое кэширование после деплоя может давать белый экран | `docker/nginx.conf:41–43` |
| BD12-08 | Низкий | Только gzip, без brotli (потеря ~15–20% на текстовых ассетах) | `docker/nginx.conf:10–14` |
| BD12-09 | Низкий | node_modules-кэш дублируется в 6 джобах; при промахе — 6 параллельных npm ci в lockstep | `ci.yml:33–42` |
| BD12-10 | Инфо | Линт-гейт заморожен на 5200 предупреждений (~5k — fa-02 raw colors) — «boiling frog» | `ci.yml:58` |
| BD12-11 | Инфо | Сборка требует --max-old-space-size=4096 (build), 6144 для тестов — параметр масштаба, следить за CI-временем | `package.json:15–17` |
| BD12-12 | Инфо | Docker build без BuildKit cache-mount для npm-кэша | `Dockerfile:34–37` |

**Ключевые детали:**

- **BD12-01 (Высокий).** `sourcemap: 'hidden'` лишь убирает комментарий `//# sourceMappingURL` — сами *.map генерируются в dist/; deploy-джоба загружает их в Sentry, но не удаляет, а `upload-pages-artifact` с `path: dist/` упаковывает всё, включая карты. Итог: исходники скачиваются с `<pages-url>/assets/<chunk>.map` любым желающим; заодно в 2–3 раза раздувается артефакт и искажается bundle-size gate. Рекомендация: `rm -rf dist/**/*.map` после upload-sourcemaps перед Upload Pages.
- **BD12-02 (Высокий).** Путь `node_modules/@xyflow/react/...` содержит подстроку 'react' и уходит в vendor-react раньше проверки `@xyflow` — графовая библиотека грузится в критическом пути до первого рендера, хотя нужна 6 панелям. Рекомендация: точные сегменты (`node_modules/react/`, `node_modules/react-dom/`) и вынос xyflow/tiptap-проверок до react-проверки.

**Положительные практики:** 198 React.lazy в route-imports.ts + 58 в technique-panels (всего 266), тяжёлые редакторы изолированы в lazy-панель; `sideEffects`-whitelist для корректного tree-shaking; sourcemap-стратегия с graceful no-op без креденшелов; nginx — immutable 30d на хэшированные ассеты, HTTP/2, TLSv1.2/1.3, HSTS; Docker — multi-stage, non-root 8080, HEALTHCHECK, cap_drop ALL, read_only, лимиты 512M/1CPU, ротация логов — эталонный прод-профиль; гейтинг деплоя deploy needs [build, e2e]; concurrency cancel-in-progress.

---
## 5. Сквозные темы (cross-cutting findings)

Несколько первопричин проявляются сразу в нескольких направлениях аудита — исправление одной закрывает до 5 находок:

1. **«Vault написан, но выключен»** — S1-01, S1-02, ST8-01, ST8-04, S1-07. Единое решение: подключить готовый KeyVault в bootstrap + идемпотентная зачистка legacy-копий + верификатор пароля. Закрывает самую тяжёлую зону риска проекта.
2. **CSP в трёх несинхронизированных источниках** — S1-04, CF10-08 + усугубляет BD12-03 и S1-05 (защита атрибутивной XSS держится только на CSP). Единое решение: кодогенерация CSP из одного списка провайдеров на build-time + CI-тест равенства наборов хостов.
3. **Substring-матчинг в manualChunks** — AR5-02, BD12-02. Порядок условий + точные сегменты путей.
4. **Monaco/CDN/CSP** — AR5-01, BD12-03, UX4-06 (искусственная задержка перед монтированием). Одно архитектурное решение (self-host через `loader.config({ monaco })`) закрывает все три.
5. **Секреты и окружение клиента** — S1-08, CF10-05: паттерн VITE_KEY_* в .env.example провоцирует попадание ключей в бандл, рабочие debug-флаги не документированы, zod-схемы env нет. Решение: `src/env.ts` с zod-схемой + удаление секции VITE_KEY_*.
6. **Тихие сбои в UI** — EH6-03, UX4-07, EH6-07: содержательные `.catch(() => {})` в панелях. Решение: единый хук/обёртка с `showStatus`/`rootLogger.warn`.
7. **Debug-хелперы и mock-сервисы в проде** — LC2-08, EH6-08, CF10-03, LC2-07: `window.__*` без DEV-гейта и `mockServices.enabled: true` по умолчанию. Решение: `import.meta.env.DEV`-гейт + дефолт false.

## 6. План устранения (приоритизированный roadmap)

### P0 — немедленно (1–3 дня, точечные фиксы)

| # | Действие | Закрывает | Оценка трудозатрат |
|---|---|---|---|
| 1 | Восстановить `[main, master]` в триггерах CI + включить branch protection | TS9-01 (критическая) | 5 минут |
| 2 | Убрать самосброс кэша: не эмитить CACHE_INVALIDATED из set() или фильтровать по section | ST8-03 | 30 минут |
| 3 | `rm -rf dist/**/*.map` после upload-sourcemaps в deploy-джобе | BD12-01 | 15 минут |
| 4 | Единый gateway-клиент с `AbortSignal.timeout(10_000)` вместо 7 копий fetchJson | NT7-01, NT7-12 | 2–4 часа |
| 5 | Удалить legacy-plaintext-копии ключей после миграции (идемпотентно) | S1-02 | 1–2 часа |
| 6 | `servername` в cors-proxy https.request + нормализация `::ffff:` | NT7-02 | 30 минут |
| 7 | timeout-minutes для всех джоб CI | BD12-05 | 15 минут |
| 8 | Исправить порядок условий manualChunks (точные сегменты) | BD12-02, AR5-02 | 1 час |

### P1 — ближайшие 2–4 недели

1. **Решение по Monaco** (AR5-01/BD12-03): self-host + `loader.config({ monaco })`, либо explicit CDN в CSP, либо замена редактора; убрать мёртвый dep.
2. **Миграция схемы `memories`** (ST8-02/ST8-09): версия 44 с корректными индексами `[metadata.*]`, обновить все `where/orderBy`, smoke-тест на реальном браузере.
3. **Подключить KeyVault** (S1-01/ST8-01): passphrase-разблокировка, шифрование на записи, верификатор пароля (S1-07), пометка риска в UI.
4. **Кодогенерация CSP** (S1-04/CF10-08) из единого списка провайдеров.
5. **Санитизация meta в LoggerService** (EH6-01) + тест.
6. **Prod-дефолты** (CF10-01/02/03): VITE_BUILD_ID из github.sha, VITE_BASE_PATH через variable, mockServices = false.
7. **Тесты сетевого ядра LLM** (TS9-03): таблицы сценариев для RetryDecorator/CircuitBreaker/LLMHttpClient — модули чистые и легко мокаются.
8. **Bootstrap-retry** (LC2-01) и `_unsubByCb` по составному ключу (LC2-02).
9. **Groq на общий SSE-путь** или idle-guard (TM3-01); AbortSignal в AutonomyRunner (TM3-02).
10. **Контраст --text-muted → #8b8b96** + CI-скрипт проверки контраста (AI11-02); `documentElement.lang` (AI11-01); поддержка defaultValue в getTranslation (AI11-03).

### P2 — квартал (системные улучшения)

- **Расширение тестового покрытия**: честный all-src coverage-отчёт, инкрементальный подъём порогов, e2e-сценарии «ключ → health-check → чат → persistence» (TS9-02/04/05).
- **Таксономия ошибок kernel**: KernelError с `code` на границах DAL/KeyService, постепенная замена 710 голых throw (EH6-02).
- **Миграции зависимостей**: zustand 5 (AR5-05), `@google/genai` вместо deprecated `@google/generative-ai` (AR5-06), пин Actions по SHA (CF10-06), отказ от `--legacy-peer-deps` через overrides (CF10-07).
- **DI-дисциплина**: постепенный перевод новых сервисов на токены контейнера вместо 520 импортов instances (AR5-03/04).
- **UX-перф**: useReducedMotion-гейты и viewport-гейтинг для 527 motion-использований (UX4-02), виртуализация TracesPanel (UX4-03), memo для панелей-монолитов (UX4-05).
- **Инфраструктура**: brotli/прегенерация .br (BD12-08), Cache-Control no-cache для index.html (BD12-07), e2e на артефакте build-джобы (BD12-04), stage-контур (CF10-09), самостоятельный шрифт-хостинг (BD12-06).
- **i18n**: типизация ключей union-типом из ru/index.ts (AI11-06), централизованное Intl-форматирование чисел/дат (AI11-07), перевод RU-шаблонов ядра в словари (AI11-05).

## 7. Методология и ограничения

**Метод.** Статический анализ репозитория на коммите `934c27a` без запуска приложения, тестов и сборки (node_modules не устанавливался). Аудит выполнялся по 12 заданным направлениям четырьмя параллельными трассировками с независимой проверкой; каждая находка подтверждена конкретным файлом:строкой и цитатой кода, значимые сечения проверялись количественно (rg/wc-метрики в тексте разделов). Кросс-проверка независимых агентов подтвердила дублирующиеся дефекты (Monaco, manualChunks, plaintext-ключи, секреты в localStorage найдены независимо в 2–3 трассировках), что повышает достоверность.

**Ограничения.**

- Не проводилось динамическое тестирование (запуск в браузере, нагрузочные замеры, сканирование зависимостей `npm audit` на момент аудита) — оценки производительности основаны на анализе кода и статических метрик.
- Актуальность версий зависимостей (deprecated-статус @google/generative-ai, zustand v5, known CVE) оценивалась на дату аудита по доступным знаниям и требует подтверждения `npm audit`/`outdated` в вашем окружении.
- Часть находок пересекается между направлениями (в отчёте помечено «= ID»): 114 находок соответствуют ~107 уникальным первопричинам.
- Кросс-аудитовые приоритеты в разделе 3 упорядочены по сочетанию «влияние × стоимость исправления» и являются рекомендацией, а не обязательным порядком работ.

**Итоговая оценка зрелости по направлениям:** Безопасность 6/10 · Жизненный цикл 7/10 · Стриминг и отмена 8/10 · UX и производительность UI 7/10 · Архитектура и зависимости 8/10 · Ошибки и логирование 7/10 · Сеть и API 7/10 · Хранение и кэш 6/10 · Тестирование 5/10 · Конфигурация 7/10 · Доступность и i18n 6/10 · Сборка и деплой 6/10 — **средняя 6.7/10**.
