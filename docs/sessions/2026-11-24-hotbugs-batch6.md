# 2026-11-24 — hotbugs-batch6

Статус: done

## Цель сессии

Шестой пакет hot-фиксов: тот же env-фикс для process-адаптера gateway.

## Что сделано (файлы + коммиты)

- `server/adapters.mjs` — `processAdapter.validateConfig` проверяет бинарник по `ADAPTERS_PROCESS_ALLOWLIST` (по умолчанию только `node`); `spawn` получает whitelist env вместо полного `process.env`; `node` резолвится в `process.execPath`.
- `server/tests/process-adapter.test.mjs` — 2 теста (whitelist, отсутствие `SYNC_SECRET`); добавлен в `test:server`.

## Принятые решения (+ почему; кандидат в ADR?)

- Список бинарников настраивается env, но по умолчанию минимален — включение `npm`/`npx` теперь осознанный выбор оператора.
- Env whitelist повторяет code-runner sidecar: единая политика для двух точек исполнения.
- `node -e` остаётся доступным: изоляция достигается ограничением env и cwd, а не запретом JS.

## Обнаруженные проблемы / гипотезы

- Факт: общий bearer по-прежнему даёт доступ ко всем адаптерам gateway — tenant-скоупинг HTTP отдельный контур.
- Гипотеза: имеет смысл вынести `PROCESS_ENV_ALLOWLIST` в общий `server/process-env.mjs`, чтобы две точки не расходились; сейчас дублирование небольшое и контролируемое.
- CSAM/privacy требуют продуктового решения и внешнего сервиса.

## Результаты проверок (typecheck/lint/test — что запускалось)

- `node --test server/tests/process-adapter.test.mjs` — 2/2; ESLint — без замечаний.
- Полный typecheck/E2E не запускались локально — оставить CI.

## Следующий логический шаг

Tenant-скоупинг HTTP API (`/api/runs`, `/api/approvals/:id/decide`, `/api/companies/:id/export`) — уже продуктовый контур.

---

## Факты (авто, из checkpoint.mjs)

- Ветка: main @ f615d5e
- Изменённых файлов: 3
  - M package.json
  - M server/adapters.mjs
  - ?? server/tests/process-adapter.test.mjs
- Diff stat:
  - package.json | 2 +-
  - server/adapters.mjs | 31 ++++++++++++++++++++++++++++++-
  - 2 files changed, 31 insertions(+), 2 deletions(-)
- Последние коммиты:
  - f615d5e fix(server): isolate code-runner env and restrict binaries
  - 09c83d4 fix(audit): bridge dead letters, isolate WAL, gate governance
  - 027f8ed fix(authz): deny implicit system calls, gate AUTOPILOT, secure pairing
  - 1db567a fix(races): release locks, await dirty writes, sanitize logs
  - 5ace75b fix(boot): restore failure UI and clear stale factory errors
