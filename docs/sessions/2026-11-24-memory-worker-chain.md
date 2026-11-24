# 2026-11-24 — memory-worker-chain

Статус: done

## Цель сессии

Ре-аудит P2-3: unhandled promise в memory worker.

## Что сделано (файлы + коммиты)

- `memory.worker.ts` — цепочка обработки сообщений получила `.catch`: ошибка одного сообщения логируется и не отравляет последующие; оба `oramaRemove` уже имели `.catch` (закрыто ранее).

## Принятые решения (+ почему; кандидат в ADR?)

- `.catch` на цепочке возвращает resolved promise — worker продолжает обрабатывать сообщения после ошибки.
- Ошибка логируется в консоль worker'а; воркерный протокол не расширялся.

## Обнаруженные проблемы / гипотезы

- Факт: по репозиторию есть ещё ~90 `void promise(...)` без `.catch` в других сервисах — это отдельный аудит, не P2-3.
- Гипотеза: для системных фоновых задач нужен общий `voidSafe()` хелпер с логированием; задача на будущее.
- ESLint: 0 ошибок; отдельный юнит-тест воркера отсутствует.

## Результаты проверок (typecheck/lint/test — что запускалось)

- ESLint на `memory.worker.ts` — без замечаний.
- Полный typecheck/E2E не запускались локально — оставить CI.

## Следующий логический шаг

Закрыть оставшиеся продуктовые пункты ре-аудита (P0-3 SSRF в Python sidecar, P0-9 токены, P0-7 mutations) — требуют изменений API/конфигурации.

---

## Факты (авто, из checkpoint.mjs)

- Ветка: main @ 03e8648
- Изменённых файлов: 1
  - M src/kernel/workers/memory.worker.ts
- Diff stat:
  - src/kernel/workers/memory.worker.ts | 4 +++-
  - 1 file changed, 3 insertions(+), 1 deletion(-)
- Последние коммиты:
  - 03e8648 fix(data): clear every Dexie table in clearAllData
  - f89235d feat(sse): support Last-Event-ID replay and tenant filtering
  - 02545ff refactor(groq): route requests through shared HTTP stack
  - f270e38 feat(budget): wire persistent hard-stop into LLM decorators
  - dff5566 fix(rate-limit): share global bucket across tabs
