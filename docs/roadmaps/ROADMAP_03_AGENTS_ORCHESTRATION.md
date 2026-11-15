# Роадмап: Агенты и когнитивная оркестрация

> Область кода: `src/kernel/services/` → agent-diversity, cognitive-intelligence, council,
> crew, director, forum, graph, lemma, persona, simulation, topology, meta, invocation;
> `kernel/agents/`; панели AgentsPanel/RolesPanel/CouncilPanel/CrewPanel/DirectorPanel/ForumPanel и др.

## Что есть сегодня

- **Агенты**: `AgentService` — реестр агентов, спавн, топологии (переживают перезагрузку).
  15 встроенных агентов + пользовательские. 4 внешних каркаса перенесены:
  opencode (код), hermes (навыки), deepseek-harness (воронка), openclaw (рой).
- **Роли**: `role-library.ts` — ~25 ролей (Генератор идей, Критик, Аналитик, Юрист, …)
  с systemPrompt, температурой, capabilities, recommendedModel.
- **Council** (совет): фазы proposal→debate→consensus, слепое судейство.
- **Crew**: команды CrewAI-стиля (роли+задачи+процессы sequential/hierarchical).
- **Forum**: асинхронные персистентные ветки.
- **Graph**: граф состояний (LangGraph-стиль).
- **Director**: «режиссёр» разговоров/сессий.
- **CognitiveService / OrchestrationService**: когнитивные конвейеры, давление, what-if.
- **Agent-diversity**: кластеризация, разнообразие рассуждений, семантическое расстояние.
- **Persona**: personality/voice-дистилляция, долгосрочная память, PPR-recall.
- **Simulation**: мир состояния, параллельные тики, AgentAct-порт.
- **Invocation**: вызовы агентов, live-feed, затраты.
- **Meta**: meta-агент (предложения улучшений).

### Пробелы

- Нет единого источника задач (Dexie + in-memory автономки + очереди — рассинхрон).
- RBAC нет (single-user); governance fail-open.
- CognitiveService/OrchestrationService — без unit-тестов.
- LlmCrewExecutor/CouncilPort/GraphPort — без тестов.
- Автономность (autonomy) и «супервизия» флота — read-only (FleetMonitor без restart).

---

## Роадмап

### P0 — Заделка

- [ ] Unit-тесты на CognitiveService / OrchestrationService / cognitive-intelligence.
- [ ] Unit-тесты на LlmCrewExecutor / LlmCouncilPort / LlmGraphPort / LlmFrontierExecutor.
- [ ] Устранить «echo-fallback» при сбое LLM в LlmCrewExecutor (сейчас молчаливый успех).

### P1 — Единая модель агентов и задач

- [ ] Ввести **единый `IAgentRuntime`**, объединяющий Council/Crew/Forum/Graph/Director
      поверх общего цикла «LLM → tool calls → execute → LLM» (уже есть `tool-loop.ts`).
- [ ] **Единый реестр задач** (сейчас три места: Dexie, in-memory автономки, очереди) —
      общий `TaskQueue` + планировщик (`SchedulerService`).
- [ ] Реализовать **супервизию флота**: FleetMonitor → операции (restart/retry/change profile)
      через approvals с аудитом (см. roadmap-notes).

### P2 — Автономия и качество

- [ ] Довести **autonomy** до продукта: режимы «read-only → guarded → workspace → full» уже есть
      — добавить человеческий супервизор-оверлей.
- [ ] Применить **agent-diversity** на практике: выбирать разнородных агентов для дебата/совета.
- [ ] **Persona-marketplace**: реестр персон, шаринг, версионирование.

### P3 — Федерация и мультиклиентность

- [ ] Довести Interop/Federation до мультиtenant (пиры, безопасный handoff).
- [ ] A2A-протокол (см. `ROADMAP_11`).

### P4 — Исследования

- [ ] Измерить пользу «совета»/«дебатов агентов» против одного агента на eval-наборах.
- [ ] Когнитивные метрики давления/внимания — сопоставить с реальным качеством ответов.

---

## Критерии «готово»

- Один `IAgentRuntime` + один реестр задач.
- Супервизор флота с операциями через approvals и аудитом.
- Покрытие тестами когнитивной оркестрации и LLM-моста.
