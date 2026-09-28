# _done — закрытые аудиты

Правило: аудит считается готовым, когда ВСЕ его пункты P0/High либо починены
в коде (со ссылкой на коммит), либо сознательно отклонены с причиной.
Готовый файл переезжает из `docs/audits/` сюда. Постепенно всё готовое
собирается здесь, в работе остаётся только открытое.

## Статус на 2026-09-28 (ветка fix-debate-text-truncation)

| Аудит | Статус | Что закрыто |
|---|---|---|
| audit-01-security.md | открыт | forum XSS ✔, логгер-sanitize ✔, честный UI vault ✔, зачистка миграции ✔; остальное открыто |
| audit-02-lifecycle.md | открыт | execution-queue destroy-флаг ✔; остальное открыто |
| audit-03-streaming.md | открыт | groq idle-timeout ✔, chat finishReason ✔, emitOnce-контракт ✔; остальное открыто |
| audit-04-ux-performance.md | открыт | — |
| audit-05-architecture.md | открыт | циклы БД ✔, manualChunks ✔; остальное открыто |
| audit-06-error-handling.md | открыт | логгер-sanitize ✔; остальное открыто |
| audit-07-network-api.md | открыт | cors-proxy SNI ✔, gateway fetch-таймауты ✔; остальное открыто |
| audit-08-storage-caching.md | открыт | CacheService section-фильтр ✔; остальное открыто |
| audit-09-testing.md | открыт | моки rootLogger ✔, очередь чата ✔; остальное открыто |
| audit-10-config-env.md | открыт | sourcemaps rm ✔; остальное открыто |
| audit-11-a11y-i18n.md | открыт | — |
| audit-12-build-deploy.md | открыт | Dockerfile LABEL ✔, read_only conf.d ✔, manualChunks ✔; остальное открыто |
| ai-os-new-audit-report.md | открыт | частично (см. выше) |
| ai-os-new_Комплексный_аудит_2026-09-25.md | открыт | частично (см. выше) |
| ai-os-new-audit-report (1).md | открыт | частично: XSS ✔, кэш ✔, логгер ✔, finishReason ✔, debate-state ✔, docker ✔, router ✔, groq ✔, очередь ✔ |

Ни один файл пока не закрыт целиком — поэтому папка почти пустая. Это нормально:
переезд — только по факту 100% готовности.
