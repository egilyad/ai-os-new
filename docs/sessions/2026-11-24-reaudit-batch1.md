# 2026-11-24 — reaudit-batch1

Статус: done

## Цель сессии

Первый пакет фиксов по ре-аудиту `ai-os-new-reaudit-2026-11-24.md`.

## Что сделано (файлы + коммиты)

- `src/kernel/utils/secret-storage.ts` — секреты `browserUse.token` / `companyGateway.secret` читаются из sessionStorage с миграцией legacy-значений из localStorage; обычные настройки остаются в localStorage.
- `browser-use-service.ts` и `sidecar-computer-executor.ts` используют `readSecret`.
- `key-service.ts` — `_initialized` выставляется только после завершения `initializeOnce()`.
- `dead-letter-queue-service.ts` — флаг инициализации после успешной загрузки.
- `batch-processor-service.ts` — таймаут задачи вызывает `abort()`; `aborts` — карта по jobId вместо общего `currentAbort`.
- `memory.worker.ts` — все fire-and-forget `oramaRemove` получили `.catch`.
- `secret-storage.test.ts` — 3 теста; путь в `test:stable`.

## Принятые решения (+ почему; кандидат в ADR?)

- Legacy-секреты не теряются: при первом чтении переносятся в sessionStorage и удаляются из localStorage.
- `AbortController` теперь пер-заданию — параллельные job не перезаписывают друг друга.
- Инициализация больше не сообщает «готово» до завершения всех await.

## Обнаруженные проблемы / гипотезы

- Факт: ре-аудит сделан по другой копии репозитория; часть статусов там уже отражает наши правки, но P0-3/P0-5/P0-6/P1-8/P1-10 остаются открытыми.
- Гипотеза: fencing token в distributed lock — следующий приоритет из P0; P0-3 (SSRF в Python sidecar) требует правки docker-конфигурации.
- ESLint: 0 ошибок; 24 теста в пакете зелёные.

## Результаты проверок (typecheck/lint/test — что запускалось)

- `vitest run secret-storage key-service key-state-store boot-smoke` — 24/24; ESLint — 0 замечаний.
- Полный typecheck/E2E не запускались локально — оставить CI.

## Следующий логический шаг

Fencing token в distributed lock и fail-open chat-send; затем P1-8 (Zod-хуки на 131 таблицу).

---

## Факты (авто, из checkpoint.mjs)

- Ветка: main @ 8687325
- Изменённых файлов: 9
  - M package.json
  - M src/kernel/services/batch-processor-service.ts
  - M src/kernel/services/browser/browser-use-service.ts
  - M src/kernel/services/computer/sidecar-computer-executor.ts
  - M src/kernel/services/dead-letter-queue-service.ts
  - M src/kernel/services/key-management/key-service.ts
  - M src/kernel/workers/memory.worker.ts
  - ?? src/kernel/utils/secret-storage.test.ts
  - ?? src/kernel/utils/secret-storage.ts
- Diff stat:
  - package.json | 4 ++--
  - src/kernel/services/batch-processor-service.ts | 20 ++++++++++++--------
  - src/kernel/services/browser/browser-use-service.ts | 5 +++--
  - .../services/computer/sidecar-computer-executor.ts | 5 +++--
  - src/kernel/services/dead-letter-queue-service.ts | 2 +-
  - src/kernel/services/key-management/key-service.ts | 4 ++++
  - src/kernel/workers/memory.worker.ts | 12 ++++++++++--
  - 7 files changed, 35 insertions(+), 17 deletions(-)
- Последние коммиты:
  - 8687325 refactor(keystate): merge writes with CAS across tabs
  - 2aef03f refactor(settings): unify theme preference storage
  - d8e9b5c fix(server): scope HTTP API to company bearer
  - 66463ba fix(gateway): whitelist process adapter binaries and env
  - f615d5e fix(server): isolate code-runner env and restrict binaries
