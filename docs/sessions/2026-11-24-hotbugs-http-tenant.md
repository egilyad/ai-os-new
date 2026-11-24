# 2026-11-24 — hotbugs-http-tenant

Статус: done

## Цель сессии

Tenant-скоупинг HTTP API — закрыть кросс-tenant доступ к runs, approvals и export при общем `SYNC_SECRET`.

## Что сделано (файлы + коммиты)

- `server/http-tenant.mjs` — `resolveCompanyFromBearer(token, lookup)` и `canAccessCompany(bound, companyId)`.
- `server/sync-server.mjs` — `hasAuth()` принимает `companyId:secret` и связывает запрос с компанией; проверка `canAccessCompany` добавлена на `/api/runs/:id`, `/api/runs/:id/execute`, `/api/companies/:id/runs`, `/api/companies/:id/approvals`, `/api/approvals/:id`, `/comments`, `/decide`, `/api/companies/:id/activity`, `/export`.
- `server/tests/http-tenant.test.mjs` — 2 теста; добавлен в `test:server`.
- Единый роадмап — обновлён раздел hot-фиксов.

## Принятые решения (+ почему; кандидат в ADR?)

- Легаси-общий `SYNC_SECRET` остаётся глобальным admin-ключом — обратная совместимость; company-токен даёт график с жёсткой границей.
- Для ID-based эндпоинтов проверка идёт **до** мутации (comments/decide), чтобы чужой запрос не оставлял сайд-эффект.
- Хелперы вынесены в чистый модуль — их можно тестировать без запуска сервера.

## Обнаруженные проблемы / гипотезы

- Факт: не все company-пути перекрыты (например, issues/costs/budget) — они используют общийbearer и остаются админскими; нужно решить, считать ли их tenant-bound.
- 403 вместо 404 раскрывает существование чужого ID; для жёсткой изоляции можно вернуть 404, но это ломает диагностику.

## Результаты проверок (typecheck/lint/test — что запускалось)

- `node --test server/tests/http-tenant.test.mjs` — 2/2; полный server-набор — 83/83.
- ESLint на трёх файлах — без замечаний.
- Полный typecheck/E2E не запускались локально — оставить CI.

## Следующий логический шаг

Доработать оставшиеся company-пути (issues/costs/budget) и вернуть единый 404/403 контракт; затем можно вернуться к аудиту Agent/Crew mutations.

---

## Факты (авто, из checkpoint.mjs)

- Ветка: main @ 66463ba
- Изменённых файлов: 4
  - M package.json
  - M server/sync-server.mjs
  - ?? server/http-tenant.mjs
  - ?? server/tests/http-tenant.test.mjs
- Diff stat:
  - package.json | 2 +-
  - server/sync-server.mjs | 70 +++++++++++++++++++++++++++++++++++++++++++++++++-
  - 2 files changed, 70 insertions(+), 2 deletions(-)
- Последние коммиты:
  - 66463ba fix(gateway): whitelist process adapter binaries and env
  - f615d5e fix(server): isolate code-runner env and restrict binaries
  - 09c83d4 fix(audit): bridge dead letters, isolate WAL, gate governance
  - 027f8ed fix(authz): deny implicit system calls, gate AUTOPILOT, secure pairing
  - 1db567a fix(races): release locks, await dirty writes, sanitize logs
