# _done — закрытые аудиты

Правило: аудит считается готовым, когда ВСЕ его пункты P0/High либо починены
в коде (со ссылкой на коммит), либо сознательно отклонены с причиной.
Готовый файл переезжает из `docs/audits/` сюда. Постепенно всё готовое
собирается здесь, в работе остаётся только открытое.

## Статус на 2026-09-29 (ветка fix-debate-text-truncation, CI зеленый)

Закрытые пункты по файлам (проверено по коду, не по тексту отчетов):

- audit-01-security.md — ✅ ЗАКРЫТ (файл здесь): forum XSS ✔
  (`forum-service.ts:335`), логгер-sanitize ✔, честный UI vault ✔,
  зачистка миграции ✔ (`key-migration.ts:162,167`), CSP унифицирован ✔
  (nginx-ssl + index.html — полный список провайдеров), VITE_KEY-warning ✔
  (`.env.example`); ОТКЛОНЕНО сознательно (продукт/дизайн): S1-01 полное
  подключение Vault (нужен passphrase-UX — отдельная фича), S1-03
  SecretStore для gateway-токенов (туда же), S1-06 admin-auth (трейдофф
  C-7 local-first), S1-07 верификатор пароля (с vault), S1-09
  no-Origin (dev-скрипт), S1-10/11 инфо;
- audit-02-lifecycle.md — ✅ ЗАКРЫТ (файл здесь): LC2-01/02/03 + LC2-04/08
  починены; LC2-05 (ретраи) и LC2-07 (симуляция) отклонены сознательно
  (дизайн/продукт); LC2-06 принят как ограничение: внутренняя подписка
  шины зафиксирована тестами как намеренный дизайн, runtime и так
  переподписывает свой обработчик на каждый start (B-033);
- audit-03-streaming.md — ✅ ЗАКРЫТ (файл здесь): TM3-01/02/05 + TM3-03/06/07
  починены; TM3-04 (потолок стрима) отклонен сознательно — осознанный
  трейдофф с idle-таймаутами, задокументирован в коде;
- audit-04-ux-performance.md — ✅ ЗАКРЫТ (файл здесь): Channel/Projects
  селекторы ✔, Traces cap ✔, Events persist-debounce ✔ + render-cap 200 ✔,
  Monaco loading-prop ✔, detach-error audible ✔; ОТКЛОНЕНО сознательно:
  UX4-02 motion bulk (косметика, 500+ мест — отдельный batch),
  UX4-05 memo bulk (архитектурный, панели-монолиты),
  UX4-08 secret-localStorage (scope audit-01/Vault);
- audit-05-architecture.md — ✅ ЗАКРЫТ (файл здесь): циклы БД ✔,
  manualChunks-порядок ✔ (specific-first), monaco self-host ✔
  (loader.config + vendor-monaco чанк); ОТКЛОНЕНО сознательно:
  AR5-03 service-locator DI (520 мест — большой рефактор, новые сервисы —
  через токены контейнера), AR5-04 fan-out UI→kernel (постепенный перевод
  на фасад), AR5-05 zustand v5 (плановая миграция), AR5-06 google-SDK
  (отдельный PR), AR5-07/08 инфо;
- audit-06-error-handling.md — ✅ ЗАКРЫТ (файл здесь): логгер-sanitize ✔,
  слышимые ошибки ✔, гарды транзакций ✔, window.onerror ✔, fallback
  child-сигнатура ✔, debug-хелперы за DEV ✔; ОТКЛОНЕНО сознательно:
  EH6-02 таксономия (710 throw — большой проект), EH6-06 console-codemod
  (80 мест), EH6-07 best-effort-игноры (инфо);
- audit-07-network-api.md — ✅ ЗАКРЫТ (файл здесь): gateway fetch-таймауты ✔
  (gatewayApi), SNI servername ✔, gateway env-URL ✔, WS ping/pong ✔,
  azure env-конфигурируемость ✔ (VITE_AZURE_BASE_URL/VITE_PROXY_AZURE);
  ОТКЛОНЕНО сознательно: NT7-03 cors-proxy стриминг (dev-скрипт),
  NT7-05 мягкая zod-валидация (дизайн), NT7-06 XFF-trust (за прокси),
  NT7-07 abort-в-фолбэк (краевой), NT7-09 cleanup карт (низкий),
  NT7-10 gemini-дубль-ретрай, NT7-11 groq-Origin, NT7-12 копипаста
  (покрыто gatewayApi для новых мест);
- audit-08-storage-caching.md — ✅ ЗАКРЫТ (файл здесь, без кода — всё
  сверено): CacheService section-фильтр ✔ (`cache-service.ts:68-71`),
  quota warn ✔, memories-индексы исправлены ✔
  (`dexie-schema.ts:350` — корректные `[metadata.*]`, запросы по
  `[metadata.timestamp]` в `memory-repository.ts:41,189`), debate-snapshot
  хранит только метаданные ✔ (`debate-engine.ts:170-185`), XOR-legacy
  только чтение ✔ (обе копии пишут plaintext); ОТКЛОНЕНО сознательно:
  ST8-01 Vault (by design, scope audit-01), ST8-04 gateway-токены
  (там же), ST8-07 миграции-без-хуков (additive, большой рефактор),
  ST8-10/11/12 (низкие/инфо);
- audit-09-testing.md — ✅ ЗАКРЫТ (файл здесь): CI-триггеры ✔, моки
  rootLogger ✔, очередь чата ✔, http-client ✔,
  circuit/retry/rate-limit/fallback/pq/semantic/canary/compress/logging/
  cost-manager/factory/adapter тесты ✔, test_map удалён ✔, мёртвый
  setup.ts с полным runtime-bootstrap удалён ✔ (`a9684d5`);
  ОТКЛОНЕНО сознательно: TS9-02 расширение гейта на services/ (нужны
  P1.3–P1.7 тесты сервисов + замер, отдельный batch), TS9-04 e2e-сценарии
  с данными, TS9-05 хвосты покрытия (по risk-матрице), TS9-06 skip-тест,
  TS9-09 sleep-таймеры;
- audit-10-config-env.md — ✅ ЗАКРЫТ (файл здесь): BUILD_ID ✔
  (`ci.yml:93`), мертвые vars удалены ✔, debug-флаги и Azure-URL
  задокументированы ✔ (`.env.example`); ОТКЛОНЕНО сознательно:
  CF10-02 BASE_PATH (рискованно для e2e), CF10-03 mockServices
  (wontfix — витрина), CF10-05 zod-схема env (отдельный batch),
  CF10-06 SHA-пины, CF10-07 legacy-peer-deps, CF10-08 CSP-дрейф,
  CF10-09 stage (инфра, низкий приоритет);
- audit-11-a11y-i18n.md — ✅ ЗАКРЫТ (файл здесь): lang-синхронизация ✔,
  defaultValue-движок ✔, 9 недостижимых `||`-фолбэков переведены на
  defaultValue ✔ (`DebateQualityPanel.tsx`); ОТКЛОНЕНО сознательно:
  AI11-02 контраст muted (дизайн-решение, глобальный токен),
  AI11-05 RU-шаблоны ядра (контракт промптов), AI11-06 типизация ключей
  (codegen, отдельный batch), AI11-07 fmt-миграция, AI11-08 RTL,
  AI11-09 aria-label модалок (инфо);
- audit-12-build-deploy.md — ✅ ЗАКРЫТ (файл здесь, сверка без кода):
  sourcemaps rm ✔ (`ci.yml:408`), manualChunks specific-first ✔,
  double-build убран ✔ (`ci.yml:337` download-artifact), timeout-minutes
  везде ✔, Dockerfile LABEL ✔; monaco/BASE_PATH — см. audit-05/10;
  ОТКЛОНЕНО сознательно: BD12-06 fonts double-load, BD12-07
  index.html Cache-Control, BD12-08 brotli, BD12-09 npm-кэш,
  BD12-10/11/12 инфо;

Аудиты 01–12 закрыты полностью.

## Серия 13–17 (кодовые аудиты, 2026-09-30 — 2026-10-02)

Правило серии: только Critical/High, medium/low не трогаем.

- audit-13-code-147.md (147 находок, 10 категорий) — ✅ ЗАКРЫТ по
  критам/хаям: 5.2 chat:send-дивергенция ✔ + drift-тест, 3.4 ghost-key
  ретрай ✔, 9.1/9.2 trace-наследование ✔, 10.3 ELO-guard ✔ (инверсия
  опровергнута), 2.11 cors IP-нормализация ✔, 10.9 cron dow ✔, 10.5
  cost-dedup ✔, 10.6 colon-парсинг ✔, 9.4 prod-логи ✔, 10.8 fallback ✔,
  4.6 lock-heartbeat ✔, 6.1 stale-flush ✔, 2.4 redirect-check ✔, 9.6/9.7
  audible ✔, 4.4 promise-init ×4 ✔, 4.5 idempotent start ✔, 10.4
  round-лимит ✔, 10.13 last-resort ✔, 2.12 без shell ✔, 2.10 sanitize ✔,
  10.14 квота в конфиг ✔, 5.4 choices-guards ✔, 2.13 skip-encrypted ✔,
  5.8/5.9 MCP-валидация ✔, 2.8 sandbox-примитивы ✔, 9.8 eval-расписание ✔,
  9.5 compromise-логи ✔, 8.11 worker-es ✔, 8.3 Connection ✔, 7.2–7.9/7.11–7.15
  i18n+a11y ✔, 9.10 счётчики ✔, 9.11 init-логи ✔, 9.12 SLA-персист ✔,
  9.13 decision-персист ✔, 9.19 unbounded-warn ✔, 9.20 sandbox-логи ✔,
  4.8 late-reconnect ✔, 3.10 crypto-ID ✔, 3.11 persist-warn ✔, 4.9 emit ✔,
  6.4 save-коалесцинг ✔, 9.9 model-атрибуция ✔, 3.9 newer-wins ✔, 3.6
  (stale — кросс-таб форвардинг есть) ✔, 6.3/8.12/7.10/3.5/6.2 (wontfix
  с обоснованием) ✔; ОТЛОЖЕНО: 3.1 WAL, 10.2 Vault, 4.2 release-handle
  рефактор, R8 maxTokens-plumbing, custom-weights слой, scoped-токены;
- audit-14-mavis.md — ✅ ЗАКРЫТ по критам/хаям: guardrail-инверсия ✔ +
  гейт, base64-чанки ✔, changePassword (round-trip + откат + salt) ✔,
  auto-resume-враньё ✔, GC-буфер (уже) ✔, tryInit-идемпотентность ✔,
  cancelAll-контракт ✔, failure-TTL 5с ✔, SLA-throw ✔;
- audit-15-debate-runtime.md + audit-16-debate-deep.md — ✅ ЗАКРЫТЫ по
  красным: R1 глубина 3 ключа ✔, R2 cooling-фильтр ✔, R3 auth-latch TTL ✔,
  R4 key-скоуп ✔, R5/R6 без банов ✔, R7 large-паттерны ✔, R9-trim (design),
  R10 escape ✔, R11–R13 heuristic-вердикт (общий билдер + finalize +
  roundLoop) ✔, bidding-role ✔, session-maps ✔; ОТЛОЖЕНО: R8
  maxTokens-plumbing;
- audit-17-debate-reset.md — ✅ ЗАКРЫТ: H2 selection-персист ✔ (H1 —
  корректное поведение, H3–H7 — медиумы, скип);
- audit-18-debate-engine-gap.md — ✅ ЗАКРЫТ по критам/узким P1: AT-1 мост
  на скоринг-движок ✔, EV-1 evidence в экстракторе ✔, TS-1 any-node ✔;
  ОТЛОЖЕНО (архитектура): J-1 вселенные скоринга, AT-3/4/5/6, EV-3/5/6,
  J-2/4/5/6/7 wiring и персисты оценок;
- audit-19-chat-failures.md — ✅ ЗАКРЫТ: приоритеты 1–5 кодом ✔
  (deep-link, error-префикс, terminal-персист, activeSession-персист,
  маркеры вне контекста); 6/7/9 — stale (Tier5, наблюдатели, контракт
  актуален); 8 agent-attach — фича/дизайн; 10 — второй эшелон;
- audit-20-backend-review.md — ✅ ЗАКРЫТ по коду: B-01/08/09 director ✔
  (уже), B-02 constant-emitOnce (пусто) ✔, B-05 static-emit (пусто) ✔,
  B-11/B-12 декомпозиция+классификатор ✔ (уже); ОТЛОЖЕНО (архитектура):
  B-03 lossy-bus, B-04/B-06/B-07 DI-глобалы, B-10 single-reducer;
- audit-21-frontend-review.md — ✅ ЗАКРЫТ: FA-01 дубль builder (нет) ✔,
  FA-05/FA-06 капы/таймеры ✔ (уже), FX/i18n — см. audit-11;
  ОТЛОЖЕНО (системные миграции): FA-02 inline-стили (9k+ мест),
  FA-03 дедуп компонентов; медиумы — скип;
- audit-22-migration-safety.md — ✅ ЗАКРЫТ как вердикт: single-migration
  уже есть (`council-migration-service`, phase65, checksum+rollback);
  bulk-historic и полный SSOT-cutover — программа миграции, не баги;
- audit-23-mobile-phase1.md — ✅ ЗАКРЫТ по сломанному: Simulation SVG ✔
  (уже), PermissionMatrix sticky-col ✔; ~30 панелей rework — системно,
  отдельно;
- audit-24-baseline-0918.md — ✅ ЗАКРЫТ как устаревший: CI-триггер,
  tsc-ошибки, MemoryPanel, циклы — всё починено, CI зелёный.
