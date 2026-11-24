# 2026-11-24 — groq-shared-http-stack

Статус: done

## Цель сессии

Ре-аудит P1-12: `GroqAdapter` обходил LLM-стек через `groq-sdk`.

## Что сделано (файлы + коммиты)

- `groq-adapter.ts` — адаптер стал наследником `OpenAiCompatibleAdapter` и ходит через общий `LLMHttpClient` + `/proxy/groq`; прямой `groq-sdk` убран.
- Wiki-статья `GroqAdapter` обновлена под новую реализацию.
- Тест `groq-adapter.test.ts`; вместе с фабрикой 10/10.

## Принятые решения (+ почему; кандидат в ADR?)

- OpenAI-совместимый протокол Groq полностью покрывается общим адаптером — отдельный SDK не давал уникальных возможностей.
- Запросы идут через прокси, поэтому применяются те же SSRF-guard, timeout и decorator'ы, что и у остальных провайдеров.
- Старый `trimMessagesForGroq` удалён: усечение есть в `buildRequestBody` общего адаптера.

## Обнаруженные проблемы / гипотезы

- Факт: зависимость `groq-sdk` осталась в `package.json`/lockfile — удаление требует пересборки lockfile, оставлено на отдельный шаг.
- Гипотеза: поведение streaming может отличаться от SDK-версии — нужна проверка в e2e/CI.
- ESLint: 0 ошибок; 10 тестов зелёные.

## Результаты проверок (typecheck/lint/test — что запускалось)

- `vitest run groq-adapter.test.ts adapter-factory.test.ts` — 10/10; ESLint — 0 замечаний.
- Полный typecheck/E2E не запускались локально — оставить CI.

## Следующий логический шаг

P2-1: SSE без `Last-Event-ID`/resume; затем P2-2 (`clearAllData` чистит 16 из 131 таблицы).

---

## Факты (авто, из checkpoint.mjs)

- Ветка: main @ f270e38
- Изменённых файлов: 3
  - M src/components/WikiPanel/wiki-components.ts
  - M src/llm/groq/groq-adapter.ts
  - ?? src/llm/groq/groq-adapter.test.ts
- Diff stat:
  - src/components/WikiPanel/wiki-components.ts | 6 +-
  - src/llm/groq/groq-adapter.ts | 315 ++--------------------------
  - 2 files changed, 15 insertions(+), 306 deletions(-)
- Последние коммиты:
  - f270e38 feat(budget): wire persistent hard-stop into LLM decorators
  - dff5566 fix(rate-limit): share global bucket across tabs
  - e01ebf8 fix(snapshot): restore live state after replay stops
  - 94da4db feat(validation): extend Zod hooks to ops tables
  - cad7454 fix(lock): add fencing tokens and fail-closed chat sends
