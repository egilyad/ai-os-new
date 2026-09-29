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
- audit-04-ux-performance.md — Channel/Projects селекторы ✔, Traces cap ✔;
  ОТКРЫТО: motion bulk (косметика, отложено);
- audit-05-architecture.md — циклы БД ✔, manualChunks ✔; ОТКРЫТО: monaco
  self-host (нужен браузер), service-locator DI (большой рефактор);
- audit-06-error-handling.md — логгер-sanitize ✔, слышимые ошибки ✔, гарды
  транзакций ✔; ОТКРЫТО: таксономия ошибок (большая);
- audit-07-network-api.md — gateway fetch-таймауты ✔, SNI ✔, gateway env ✔;
  ОТКРЫТО: Azure-конфигурируемость (продуктовое решение);
- audit-08-storage-caching.md — CacheService section-фильтр ✔, quota warn ✔;
  ОТКРЫТО: Vault по дизайну (см. audit-01);
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

Первый файл переехал. Ближайший кандидат: audit-12
(monaco + BASE_PATH).
