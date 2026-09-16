# Phase H — Паритет с третьей десяткой (DONE, без проверок)

Дата: 2026-09-05. Сравнения 1-к-1: `RIVALS3_COMPARE.md`. Проверки — на финал.

## Что сделано

### H.1 Agno / Google ADK / Dify / Langflow
- `ReasoningService` — think-блок (goal/steps/risks JSON + fallback),
  событие `reason:thought`; потребляется autonomy/planner/react.
- `SessionStateService` — скопы app/user/session в DAL kv + deltas,
  `runParallel` (fan-out ≤6 + merge), `runLoop` (до стоп-фразы/max).
- `DatasetService` — коллекции source ids + topK/threshold в kv,
  annotation-QA с приоритетом, rerank вторым проходом.
- `FlowApiService` — токены → graphId в kv, invoke через реальный
  GraphService (пауза честно возвращается текстом), revoke.
- `LoaderService.agenticChunk` — LLM-пропозиции с fallback-сплитом.

### H.2 Flowise / Pydantic AI / TaskWeaver
- `DocStoreService` — именованные сторы поверх knowledgeSources,
  привязка chatId, thumbs-фидбек в kv.
- `TypedAgentService` — define (system + JSON-схема) + run с deps-подстановкой,
  мини-компилятор JSON-schema→Zod, validate+retry, событие `typed:valid`.
- `CodePlanService` — план как plugin-call лист по ToolRunner-пулу,
  verify + replan до 3–5 кругов.

### H.3 Rasa / Botpress / Voiceflow
- `DialogueService` — боты в kv (intents+examples → overlap-NLU, slots с
  fill-loop, stories-трекинг), сессии эфемерно, события ходов.
- `BotRouterService` — LLM-выбор следующей ноды из кандидатов
  (rotation-fallback), счётчики нод в kv, KB-ответ через RagService.
- `PrototypeService` — CMS-слоты, funnel-счётчики step→step, share-JSON
  экспорт транскриптов.

### Wiring
- **Без смены Dexie** (всё на kv + существующие таблицы) — v34 остаётся max.
- `phase35-rivals3` (10 сервисов), 8 событий, lazy-сервисы.
  (`_test-harness` не тронут — новых таблиц нет.)

## Отложено на финальную проверку
- typecheck/build/tests/lint по rivals3-срезу, e2e
  think→session→dataset→flowapi→docstore→typed→codeplan→dialogue→botroute→proto.

## Дальше — финальная проверка всего вместе, когда скажешь.
