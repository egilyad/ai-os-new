# Сравнение 1-к-1, третья десятка + что дописываем

Дата: 2026-09-05. Фаза H. Без проверок до финала.

## 1. Agno (ex-Phidata)
- **У них:** reasoning-модели (think-блок перед ответом), Teams поверх
  участников, Knowledge с умным чанкингом, Evals, сессии.
- **Было у нас:** toolRunner без явного think-шага, роутинг команд без
  team-обёртки, чанкинг фиксированный.
- **Дописываем (H.1):** `ReasoningService` (JSON think: goal/steps/risks +
  fallback), `agenticChunk` в LoaderService (LLM-пропозиции, fallback —
  обычный сплит), team-прогон через coordination route (уже есть).

## 2. Google ADK
- **У них:** Session/State/Memory сервисы со скопами (app/user/session),
  Sequential/Parallel/Loop-агенты, колбэки, eval-наборы.
- **Было у нас:** state per-run в графе, autonomy-цикл, волновой параллелизм —
  но нет скопленного session state и явных Parallel/Loop-раннеров.
- **Дописываем (H.1):** `SessionStateService` (kv: `ssession/*/suser/*/sapp/*`,
  deltas, события), `ParallelAgents` (fan-out N промптов + merge),
  `LoopAgent` (повтор до условия/max, поверх autonomy-паттерна).

## 3. Dify
- **У них:** датасеты (retrieval top_k/threshold/rerank), annotation replies
  (проверенные QA отвечают первыми), сад провайдеров, marketplace tools.
- **Было у нас:** плоские knowledge-источники без датасетов и аннотаций.
- **Дописываем (H.1):** `DatasetService` (коллекции source ids + retrieval
  config в kv, аннотации QA с приоритетом, rerank как второй проход overlap).

## 4. Langflow
- **У них:** flows-as-API (токен → запуск по HTTP), tracing прогонов
  компонентов, версионирование.
- **Было у нас:** runGraph только изнутри, внешних токенов нет.
- **Дописываем (H.1):** `FlowApiService` (токены в kv → graphId, invoke по
  токену через GraphService, trace-лог в loop-записи).

## 5. Flowise
- **У них:** chatflows/agentflows, document stores на чатбота, стриминг,
  API-ключи, feedback сообщений (thumbs).
- **Было у нас:** document stores без привязки к чатам, фидбека нет.
- **Дописываем (H.2):** `DocStoreService` (именованные сторы поверх
  knowledgeSources, привязка chatId, feedback thumbs в kv + событие).

## 6. Pydantic AI
- **У них:** deps-инъекция (типизированный контекст рана), валидаторы
  результата (pydantic), evals, Logfire-спаны.
- **Было у нас:** Zod уже в проекте, но раннер с deps и валидацией выхода нет.
- **Дописываем (H.2):** `TypedAgentService` (define: system + zod-схема +
  deps → run: подстановка deps в промпт, validate+retry до 2 раз, спаны в
  Timeline через события).

## 7. TaskWeaver
- **У них:** code-first планирование (план = вызовы плагинов), пул плагинов
  с автовыбором, верификация кода исполнителем.
- **Было у нас:** planner + toolRunner рядом, но не связаны планом-вызовами.
- **Дописываем (H.2):** `CodePlanService` (план как plugin-call лист через
  LLM JSON, исполнение по toolRunner, verify + replan до 3 кругов).

## 8. Rasa
- **У них:** NLU (intents/entities по примерам), stories/rules, forms+slots
  (slot-filling loop), каналы.
- **Было у нас:** intent-планировщик keyword-based, слотов и сториз нет.
- **Дописываем (H.3):** `DialogueService` (боты в kv: intents с примерами →
  overlap-классификация, slots required + fill-loop с вопросами, stories как
  скрипты, события).

## 9. Botpress
- **У них:** autonomous nodes (LLM выбирает следующую ноду), KB-ноды,
  HITL-ноды, аналитика по нодам.
- **Было у нас:** gate-условия вместо LLM-роутинга, аналитики нод нет.
- **Дописываем (H.3):** `BotRouterService` (LLM-выбор следующей ноды из
  кандидатов, KB-ответ через RagService, счётчики нод в kv + событие).

## 10. Voiceflow
- **У них:** быстрый прототип (шаримая ссылка), CMS-слоты контента,
  воронки аналитики.
- **Было у нас:** экспорт транскриптов ad-hoc, CMS и воронок нет.
- **Дописываем (H.3):** `PrototypeService` (CMS-слоты в kv, funnel-счётчики
  step→step, export транскрипта рана в share-JSON).

## Карта реализации (Фаза H, без новых Dexie-таблиц)
- Всё на kv (`datasets/`, `flowapi/`, `docstore/`, `feedback/`, `bots/`,
  `cms/`, `funnel/`, `ssession/|suser/|sapp/`) + существующие таблицы.
- События: `reason:*`, `session:*`, `dataset:*`, `flowapi:*`, `docstore:*`,
  `typed:*`, `codeplan:*`, `dialogue:*`, `botroute:*`, `proto:*` (~10).
- Сервисы: reasoning/loader-dop/adk/datasets/flowapi, docstore/typedagent/
  codeplan, dialogue/botrouter/prototype → phase35.
- UI: кнопки в табе `rivals` (RAG уже есть; + dataset/answer, prototype export).
