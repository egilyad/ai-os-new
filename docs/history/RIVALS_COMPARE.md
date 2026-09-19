# Сравнение 1-к-1 с 10 мультиагентными проектами + что дописываем

Дата: 2026-09-05. Формат: проект → его фирменная фишка → было у нас →
дописываем в Фазе F. Без проверок до финала.

## 1. LangGraph (LangChain)
- **У них:** Pregel super-steps (параллельный fan-out независимых нод),
  threads (`thread_id` + `checkpoint_ns`), `interrupt()` + `Command(resume=)`,
  Studio/LangSmith, вложенные сабграфы, Send API (динамический fan-out).
- **Было у нас:** синхронный драйвер (ветки по очереди), run без threads,
  сабграфов и Send нет (`GRAPH_WAVE3.md`).
- **Дописываем (F.1):** волновое параллельное исполнение готовых нод
  (`Promise.all` + детерминированный merge), kind `subgraph` (граф-в-графе,
  глубина ≤2), Send-конвенция (`state['send:<nodeId>']`), threads
  (`startThread/postToThread`, таблица `threads`). `approve(runId, state)` уже
  был аналогом `Command(resume=)`.

## 2. AutoGen (Microsoft)
- **У них:** ConversableAgent (send/receive/auto-reply), GroupChat +
  Manager с выбором спикера (auto/round_robin/manual), human input modes,
  исполнение кода, nested chats (цепочки с саммари).
- **Было у нас:** ConversationCore/Director (сценарные), Room-инвокации —
  но нет менеджера группового чата с выбором спикера и вложенных чатов.
- **Дописываем (F.2):** `GroupChatService` (создать чат, auto/round_robin/
  manual спикер, maxRounds, стоп-фразы, ходы через LLM-мост, таблица
  `groupChats`), nested chats (цепочка чатов с авто-саммари между ними).

## 3. OpenAI Agents SDK / Swarm
- **У них:** лёгкие handoffs между агентами (с фильтрами входа),
  input/output guardrails с tripwire, function tools со строгими схемами,
  tracing/step-рантайм.
- **Было у нас:** handoff-таблица Фазы A (кросс-рантайм), guardrails только
  soft (outputSchema-retry в crew). Агентных handoff-цепочек и tripwire нет.
- **Дописываем (F.2):** `GuardrailService` (именованные валидаторы
  contains/regex/length, tripwire: block/flag, события), handoff-цепочки
  агент→агент с фильтром контекста (поверх таблицы `handoffs`).

## 4. Letta (ex-MemGPT)
- **У них:** редактируемые core-блоки (human/persona с лимитами),
  archival/recall с эмбеддинг-поиском, агентные memory-инструменты
  (`core_memory_append/replace`, `archival_insert/search`), sleep-time compute.
- **Было у нас:** tiers core/recall/archival + Person distill, но нет
  редактируемых блоков с лимитами и вызываемых агентом memory-функций.
- **Дописываем (F.2):** `MemoryBlocksService` (блоки human/persona/system
  с char-лимитами, append/replace, таблица `memoryBlocks`) + регистрация
  memory-инструментов в ToolRunner (`memory.append/search/recall`).

## 5. MetaGPT
- **У них:** SOP-пайплайны ролей (PM→Architect→Engineer→QA) с артефактами
  (PRD/design/tasks/code), шина подписок ролей на типы сообщений,
  executable feedback (написал→запустил→починил).
- **Было у нас:** code-review-council шаблон, forum-подписки — но нет SOP
  как first-class и подписок ролей на артефакты.
- **Дописываем (F.3):** `SopService` (SOP-дефиниции: фазы→роли→артефакты,
  запуск как связанная серия crew-ранов; подписки ролей на артефакты через
  EventBus + таблица запусков `agentLoops`).

## 6. AutoGPT
- **У них:** автономный goal-цикл (think→plan→act→criticize до готовности),
  реестр команд + плагины, файловый workspace.
- **Было у нас:** graph+reflection по шагам, но нет зацикленного драйвера
  цели с самокритикой и лимитом итераций.
- **Дописываем (F.3):** `AutonomyService.runGoal()` (plan→act→critique через
  ToolRunner+LLM, стоп по done/stuck/maxIters, чекпоинты в `agentLoops`).

## 7. BabyAGI
- **У них:** тройка «создание задач → приоритизация → исполнение» с
  векторной памятью результатов, очередь задач.
- **Было у нас:** forge предлагает задачи разово, живой очереди нет.
- **Дописываем (F.3):** `AutonomyService.runTaskQueue()` (вариант лупа:
  create→prioritize→execute, очередь в состоянии loop-записи).

## 8. SuperAGI
- **У них:** маркет приложений, очередь/шедулинг ранов, toolkits (наборы
  инструментов), аналитика агентов, векторная БД.
- **Было у нас:** SkillMarket, scheduler-мост, метрики — но нет очереди
  ранов с конкурентностью и toolkits как устанавливаемых наборов.
- **Дописываем (F.3):** `RunQueueService` (enqueue crew/graph-ранов,
  concurrency cap, таблица `runQueue`) + `ToolkitService`-минимум
  (именованные наборы tool-префиксов, gate поверх ToolRunner).

## 9. Semantic Kernel (Microsoft)
- **У них:** Kernel + plugins (native/semantic функции), planners
  (sequential / function-calling / stepwise с ask-user), filters/middleware
  pipeline, connectors.
- **Было у нас:** `runWithTools` ≈ function-calling, декораторы ≈ фильтры
  местами, но нет явных планировщиков и middleware-цепочки.
- **Дописываем (F.3):** `PlannerService` (стратегии sequential /
  function-calling / stepwise с human-паузой) + `FilterPipeline`
  (pre/post хуки: audit, policy, trim — компонуемые).

## 10. CAMEL
- **У них:** role-playing диады (AI User ↔ AI Assistant, inception prompts),
  кооперативные цепочки, симуляции обществ, генерация данных.
- **Было у нас:** council-дебаты и groupchat (F.2), но нет диад
  «пользователь↔ассистент» с inception-промптами и терминацией.
- **Дописываем (F.3):** `DyadService` (две роли, inception-промпты,
  лимит ходов/токенов, терминальные фразы, авто-саммари, `agentLoops`).

## Карта реализации (Фаза F, Dexie v33)
- Таблицы: `agentLoops` (autonomy/SOP/dyad-раны), `groupChats`,
  `memoryBlocks`, `runQueue`, `threads`.
- События: `loop:*`, `groupchat:*`, `guardrail:*`, `block:*`, `sop:*`,
  `queue:*`, `plan:*`, `dyad:*` (~10).
- Сервисы: graph-апгрейд (в существующем файле) + `GroupChatService`,
  `GuardrailService`, `MemoryBlocksService`, `SopService`,
  `AutonomyService`, `RunQueueService` (+toolkits), `PlannerService`
  (+filters), `DyadService` → `phase33-rivals`.
- UI: таб `rivals` во FleetPanel (loops/chats/queue).
