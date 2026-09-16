# Phase F — Паритет с 10 проектами (DONE, без проверок)

Дата: 2026-09-05. Сравнения 1-к-1: `RIVALS_COMPARE.md`. Проверки — на финал.

## Что сделано

### F.1 LangGraph-паритет (граф-апгрейд, существующий файл)
- Волновой параллелизм: super-step выполняет все готовые ноды через
  `Promise.all`, merge детерминированный (порядок волны). Чекпоинт + decision
  + событие на каждую ноду как раньше.
- Kind `subgraph`: граф-в-графе (inputKeys/outputKey, глубина ≤2, честная
  ошибка если child встал на HITL).
- Send-конвенция: `state['send:<nodeId>'] = [...]` — динамический fan-out.
- Threads: `startThread/postToThread/listThreads` (таблица `threads`).
- **Попутный фикс:** approved human-ноды больше не встают на паузу повторно
  (`_approved:<id>` флаг; раньше `approve()` зацикливал human-узлы).

### F.2 AutoGen / Swarm / Letta
- `GroupChatService`: auto/round_robin/manual спикер, maxRounds, стоп-фразы,
  ходы через LLM-мост (cacheScope), `summarize`, nested chats с саммари.
- `GuardrailService`: contains/regex/min/maxLength, tripwire block/flag,
  событие `guardrail:hit`.
- `MemoryBlocksService`: human/persona/system блоки с char-лимитами
  (append отказывает при переполнении, set режет с маркером), `corePrompt()`;
  `memory.append/recall` зарегистрированы в ToolRunner.

### F.3 MetaGPT / AutoGPT / BabyAGI / SuperAGI / SK / CAMEL
- `SopService`: SOP-дефиниции + `runSop` (фазы→артефакты, встроенный
  software-crew: PRD→Design→Tasks→Code→QA), события `sop:phase`.
- `AutonomyService`: `runGoal` (plan→act→critique, DONE/stuck-детект,
  maxIters) и `runTaskQueue` (BabyAGI create→prioritize→execute).
- `RunQueueService`: очередь crew/graph-ранов (concurrency ≤4) + toolkits
  (префиксные паки поверх ToolRunner).
- `PlannerService`: sequential / function_calling / stepwise (+`planStep`),
  фильтры audit/policy(trim секретов)/trim.
- `DyadService`: CAMEL-диада с inception-промптами, `<TASK_DONE>`,
  лимит ходов, саммари в loop-лог.

### Wiring
- Dexie **v33** additive (agentLoops, groupChats, memoryBlocks, runQueue,
  threads), `RivalRepository` (DAL `rival`), `phase33-rivals` (8 сервисов),
  8 событий, lazy-сервисы, `stores/rivalStore.ts`, таб `rivals` во FleetPanel
  (+i18n en/ru).

## Отложено на финальную проверку
- typecheck/build/tests/lint по rival-срезу, e2e
  thread→wave→subgraph→chat→guardrail→block→sop→goal→queue→dyad→store.

## Дальше — финальная проверка всего вместе, когда скажешь.
