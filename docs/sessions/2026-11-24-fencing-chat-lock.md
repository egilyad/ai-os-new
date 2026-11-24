# 2026-11-24 — fencing-chat-lock

Статус: done

## Цель сессии

Ре-аудит P0-5/P0-6: fencing token в distributed lock и fail-open в chat-send.

## Что сделано (файлы + коммиты)

- `contracts/cross-tab-lock.ts` — `LockAcquisition.fencingToken` и `IDistributedLock.isFenceValid()`.
- `cross-tab-lock-service.ts` — монотонный токен при acquire/takeover, проверка в `heartbeat`/`release`, новый `isFenceValid()`; legacy-записи получают токен 1.
- `chat-send-message.ts` — при недоступном локе отправка отменяется с ошибкой пользователю; перед записью проверяется `isFenceValid`, потеря гейта даёт `CANCELLED`.
- Тесты: новый fencing-тест в `cross-tab-lock-service.test.ts`, обновлён `store.test.ts` (мок + ожидание отмены).
- Единый роадмап — обновлён.

## Принятые решения (+ почему; кандидат в ADR?)

- Токен инкрементируется только при новом acquire/takeover; повторный acquire тем же владельцем сохраняет токен.
- Fail-closed в чате: тихий вывод без лока был источником last-writer-wins, теперь пользователь видит понятную ошибку.
- Fence проверяется перед записью в БД и стор, а не только при освобождении лока.

## Обнаруженные проблемы / гипотезы

- Факт: legacy-записи без fencingToken трактуются как токен 1 — первый же takeover их заменит.
- Гипотеза: стоит проверить остальные consumer'ы distributed lock на использование `isFenceValid` перед записью (debate/config/keys).
- ESLint: 0 ошибок, 2 предсуществующих предупреждения в chat-send-message.

## Результаты проверок (typecheck/lint/test — что запускалось)

- `vitest run cross-tab-lock-service.test.ts stores/chat` — 3 + 40 тестов зелёные.
- ESLint на пяти файлах — 0 ошибок.
- Полный typecheck/E2E не запускались локально — оставить CI.

## Следующий логический шаг

P1-8: Zod-хуки покрывают только ~23 из 131 таблицы; затем P1-10 (SnapshotService replay).

---

## Факты (авто, из checkpoint.mjs)

- Ветка: main @ feb984d
- Изменённых файлов: 5
  - M src/kernel/contracts/cross-tab-lock.ts
  - M src/kernel/services/cross-tab-lock-service.test.ts
  - M src/kernel/services/cross-tab-lock-service.ts
  - M src/stores/chat/chat-send-message.ts
  - M src/stores/chat/store.test.ts
- Diff stat:
  - src/kernel/contracts/cross-tab-lock.ts | 3 ++
  - src/kernel/services/cross-tab-lock-service.test.ts | 14 ++++++
  - src/kernel/services/cross-tab-lock-service.ts | 50 +++++++++++++++++-----
  - src/stores/chat/chat-send-message.ts | 15 +++++--
  - src/stores/chat/store.test.ts | 15 ++++---
  - 5 files changed, 76 insertions(+), 21 deletions(-)
- Последние коммиты:
  - feb984d fix(reaudit): secure secrets, init flags, batch aborts
  - 8687325 refactor(keystate): merge writes with CAS across tabs
  - 2aef03f refactor(settings): unify theme preference storage
  - d8e9b5c fix(server): scope HTTP API to company bearer
  - 66463ba fix(gateway): whitelist process adapter binaries and env
