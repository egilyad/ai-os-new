# 2026-11-24 — sse-resume

Статус: done

## Цель сессии

Ре-аудит P2-1: SSE не поддерживал `Last-Event-ID` и терял события при reconnect.

## Что сделано (файлы + коммиты)

- `server/sync-server.mjs` — буфер последних 200 событий с монотонным id; каждая запись SSE сопровождается `id:`; при подключении с `Last-Event-ID` события после него переотправляются, tenant-фильтр применяется и к replay. Если id нет в буфере — отправляется `resync_required`.
- SSE-клиенты теперь сохраняют `companyId` из company-токена — компания видит только свои события.
- `server/sse-replay.mjs` + `server/tests/sse-replay.test.mjs` — чистая логика и 3 теста; путь в `test:server`.

## Принятые решения (+ почему; кандидат в ADR?)

- Буфер in-memory на 200 событий: дисковый WAL для SSE был бы избыточен; при промахе клиент получает явный resync-сигнал.
- Id монотонный на процесс; после рестарта сервера старый Last-Event-ID не найдётся → resync, это ожидаемо.
- Tenant-фильтр вынесен в общий `clientMayReceive` и используется и для live, и для replay.

## Обнаруженные проблемы / гипотезы

- Факт: буфер живёт в памяти и не делится между инстансами сервера.
- Гипотеза: для production multi-instance нужен общий event log (SQLite/Redis) — отдельный контур.
- ESLint: 0 ошибок; 3 теста зелёные.

## Результаты проверок (typecheck/lint/test — что запускалось)

- `node --test server/tests/sse-replay.test.mjs` — 3/3; ESLint — 0 замечаний.
- Полный typecheck/E2E не запускались локально — оставить CI.

## Следующий логический шаг

P2-2: `clearAllData` чистит только 16 из 131 таблицы; затем P2-3 (unhandled promise в memory worker — уже частично закрыто).

---

## Факты (авто, из checkpoint.mjs)

- Ветка: main @ 02545ff
- Изменённых файлов: 4
  - M package.json
  - M server/sync-server.mjs
  - ?? server/sse-replay.mjs
  - ?? server/tests/sse-replay.test.mjs
- Diff stat:
  - package.json | 2 +-
  - server/sync-server.mjs | 35 ++++++++++++++++++++++++++++++++---
  - 2 files changed, 33 insertions(+), 4 deletions(-)
- Последние коммиты:
  - 02545ff refactor(groq): route requests through shared HTTP stack
  - f270e38 feat(budget): wire persistent hard-stop into LLM decorators
  - dff5566 fix(rate-limit): share global bucket across tabs
  - e01ebf8 fix(snapshot): restore live state after replay stops
  - 94da4db feat(validation): extend Zod hooks to ops tables
