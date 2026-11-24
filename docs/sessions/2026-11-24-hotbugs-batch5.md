# 2026-11-24 — hotbugs-batch5

Статус: done

## Цель сессии

Пятый пакет hot-фиксов: устранение RCE и утечки секретов в code-runner sidecar.

## Что сделано (файлы + коммиты)

- `server/code-runner-sidecar.mjs` — allowlist сведён к `node` (npm/npx удалены); дочерний процесс получает только whitelist env (`PATH`, `SystemRoot`, `TEMP`, `TMP`, `PATHEXT`, `CI`, `NODE_ENV`) вместо полного `process.env`; токен обязателен в production или при не-loopback хосте.
- `server/tests/code-runner-sidecar.test.mjs` — тесты на отказ npm/npx и отсутствие `SYNC_SECRET` в дочернем процессе; тест добавлен в `test:server`.

## Принятые решения (+ почему; кандидат в ADR?)

- `node -e` по-прежнему позволяет произвольный JS внутри изолированного cwd — это допустимая модель code-runner; недопустимо наследование секретов сервера.
- Токен обязателен только в проде/не-loopback, чтобы не ломать локальный запуск и существующие тесты.
- Env whitelist Include системные переменные Windows, без которых `node.exe` может не запуститься.

## Обнаруженные проблемы / гипотезы

- Факт: `checkCommandPolicy` блокирует `|` в аргументах — тест на env пришлось переписать без `||`; это ограничение политики, не баг.
- Гипотеза: process-адаптер gateway (`server/adapters.mjs`) имеет ту же проблему с полным env — отдельный фикс.
- Остальные пункты аудита (tenant-scope HTTP, CSAM) требуют продуктовых решений.

## Результаты проверок (typecheck/lint/test — что запускалось)

- `node --test server/tests/code-runner-sidecar.test.mjs` — 7/7.
- ESLint на двух файлах — без замечаний.
- Полный typecheck/E2E не запускались локально — оставить CI.

## Следующий логический шаг

Process-адаптер gateway: убрать полный env и включить whitelist бинарников; затем tenant-скоупинг HTTP API.

---

## Факты (авто, из checkpoint.mjs)

- Ветка: main @ 09c83d4
- Изменённых файлов: 3
  - M package.json
  - M server/code-runner-sidecar.mjs
  - M server/tests/code-runner-sidecar.test.mjs
- Diff stat:
  - package.json | 2 +-
  - server/code-runner-sidecar.mjs | 33 ++++++++++++++++++++++---------
  - server/tests/code-runner-sidecar.test.mjs | 23 ++++++++++++++++++++-
  - 3 files changed, 47 insertions(+), 11 deletions(-)
- Последние коммиты:
  - 09c83d4 fix(audit): bridge dead letters, isolate WAL, gate governance
  - 027f8ed fix(authz): deny implicit system calls, gate AUTOPILOT, secure pairing
  - 1db567a fix(races): release locks, await dirty writes, sanitize logs
  - 5ace75b fix(boot): restore failure UI and clear stale factory errors
  - 426b19a docs: add backup and restore guide
