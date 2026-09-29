# _done — закрытые аудиты

Правило: аудит считается готовым, когда ВСЕ его пункты P0/High либо починены
в коде (со ссылкой на коммит), либо сознательно отклонены с причиной.
Готовый файл переезжает из `docs/audits/` сюда. Постепенно всё готовое
собирается здесь, в работе остаётся только открытое.

## Статус на 2026-09-29 (ветка fix-debate-text-truncation, CI зеленый)

Закрытые пункты по файлам (проверено по коду, не по тексту отчетов):

- audit-01-security.md — forum XSS ✔, логгер-sanitize ✔, честный UI vault ✔,
  зачистка миграции ✔, CSP унифицирован ✔; ОТКРЫТО: полное подключение Vault,
  контраст/певью Decision (дизайн);
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
- audit-09-testing.md — моки rootLogger ✔, очередь чата ✔, http-client ✔,
  circuit/retry/rate-limit/fallback/pq/semantic/canary/compress/logging/
  cost-manager/factory/adapter тесты ✔; ОТКРЫТО: расширение гейта на services/;
- audit-10-config-env.md — BUILD_ID ✔, мертвые vars ✔; ОТКРЫТО: BASE_PATH
  (рискованно для e2e), mockServices (wontfix — витрина);
- audit-11-a11y-i18n.md — lang ✔, defaultValue ✔; ОТКРЫТО: контраст (дизайн),
  bulk i18n-заглушки;
- audit-12-build-deploy.md — sourcemaps rm ✔, manualChunks ✔, double-build ✔,
  timeout-minutes ✔, Dockerfile LABEL ✔, read_only conf.d ✔, dead files ✔;
  ОТКРЫТО: monaco (см. audit-05), BASE_PATH (см. audit-10).

Первый файл переехал. Ближайший кандидат: audit-09
(проверить расширение гейта на services/).
