# Отчёт сабагента: Фреймворк Rivals / parity

## 1. rivals/ (ядро, фаза F) — РЕАЛЬНО работает

8 сервисов + 5 демо-сидов + 6 тестов. Все зарегистрированы в DI (phase33-rivals.ts) с реальными зависимостями (RivalRepository Dexie, eventBus, llmClientService, toolRunnerService, dal).

| Сервис                                                                                                               | Эмулирует       | Что реально                                                                            | Тесты                       |
| -------------------------------------------------------------------------------------------------------------------- | --------------- | -------------------------------------------------------------------------------------- | --------------------------- |
| GroupChatService                                                                                                     | AutoGen         | выбор спикера (auto/round_robin/manual), ходы LLM, ос, вложенные чаты                  | demo-seed                   |
| GuardrailService                                                                                                     | Swarm           | валидаторы contains/regex/minLength/maxLength, block/flag, персист правил              | guardrail-service.test.ts ✔ |
| MemoryBlocksService                                                                                                  | Letta           | блоки persona/human/system, corePrompt(); регистрирует инструменты памяти в ToolRunner | —                           |
| SopService                                                                                                           | MetaGPT         | фазы роль+артефакт+инструкция; встроенный software-crew SOP                            | demo-seed ✔                 |
| AutonomyService                                                                                                      | AutoGPT+BabyAGI | runGoal (plan→act→critique), runTaskQueue, чекпоинты                                   | demo-seed ✔                 |
| RunQueueService                                                                                                      | SuperAGI        | очередь crew/graph/eval с concurrency-волнами, тулкиты                                 | demo-seed ✔                 |
| PlannerService                                                                                                       | Semantic Kernel | стратегии sequential/function_calling/stepwise/plan_and_execute, фильтры               | —                           |
| DyadService                                                                                                          | CAMEL           | пригласительные промпты AI-user↔AI-assistant, остановка по <TASK_DONE>                 | demo-seed ✔                 |
| Вывод: ядро реальное и связанное. LLM-внешний: без llmClientService — offline-echo ([echo], NEXT: continue working). |

## 2. rivals2..20 — обзор

19 подкаталогов, 164 сервис-файла, 0 юнит-тестов (кроме rivals20/live-backends.test.ts). Все реализованы (классы с LLM/DAL/EventBus) и зарегистрированы (phase34..59), но доступны только как демо через RivalLabs. Статус: реальный код, но демо/экспериментальный, без тестов.

- rivals2 (G): Aider, LlamaIndex-RAG, ReAct, OpenHands, SWE-agent, Roo modes, Mem0, Composio, Eliza, loaders.
- rivals3 (H): BotRouter, CodePlan, Langflow FlowApi, dataset, docstore, typedagent, dialogue, prototype, reasoning, session-state.
- rivals4 (I): Copilot, Bedrock, Salesforce CXF/Agentforce, Kore, Campaign, Employee, CodeAgent, Assistant, Gum.
- rivals5 (J): AppBuilder, IDE, PromptHub, Ontology, ACL, WorkQueue, Writer, Computer-use, Search, CodeExec (E2B честный: тикеты валидируются, ждут делегата).
- rivals6 (K): n8n, Make, Zapier, Temporal, Asset (dbt), Sensor, Voice, Support, Verify, Deck.
- rivals7 (L/M): Atom, Decision, ErrorInbox, ForumPlus, Meter, Polis, Reflexion, SelfConsistency, SOAR, Tree-of-Thought.
- rivals9 (N): DSH, Genspark, Manus, OpenClaw.
- rivals10 (P): A2A spec, Assist, CacheRegistry, DeepResearch, Dotprompt, LiveBridge, Notebook, QuotaGuard, StudioPack, VertexSearch.
- rivals11 (Q): NetLogo, Mesa, Bonsai, Chainlit, Gradio, Chart, GraphViz, Malmo, Gym.
- rivals12 (R): ALife, AlphaCode, Constitutional, Curiosity, NeuroSymbolic, Quantum, Smallville, Swarm, Voyager, WorldModel.
- rivals13: bizpacks, dust-bulk, paperclip-agents.
- rivals14 (T): AgentView, CacheControl, ClaudeCode, DynamicWorkflow, FilesApi, MCP-Deep, Project, Routine.
- rivals15 (V): AgencyRU, Analitik, Chemist, Evolab, Gigastudio, Heisenberg, LocalTriple, Maestro, Metabolic, Ruslan.
- rivals16: AI-Scientist, Cognitae, CogTeam, 8-Stage, Helix, Ideator, LAteNT, SciAgents, Sparks, Syn.
- rivals17 (W): Blackboard, Cognee, Concepts, DOLORES, Episteme, MetaCtrl, Metan, RCK, SecondBrain, STORM.
- rivals18 (X): Darwin, DeepResearch-2, Delphi, Fishbowl, Meta-KB, Parliamentary, PolicyDebate, Qyvaria, Research-OS, Socratic.
- rivals19 (Y): Continue, Crush, Goose, gpt-engineer, gpt-pilot, Pi, Tabby, Void, Warp, Whale, Zed.
- rivals20 (Z): codex-services (Codex/GeminiCLI/Kilo), infra-services (Helicone/Portkey/LiteLLM/Langfuse), interpreter-services (Interpreter/Mini-SWE). 1 тест.
  Многие файлы очень тонкие (10–40 строк) — демо-эмуляции; другие полноценные (Aider/132, Rag/147, Reflexion/142, Manus/177).

## 3. parity/ — что реально

- ToolRunnerService (643): реальный исполнитель (workspace.list/read/search, http.fetch с SSRF-guard isPrivateIP, time.now, math.calc, knowledge.search, mcp.call, debate.start/verdict/status); runWithTools через tool-loop; гейтинг ToolGovernance + pipeline pre/post + durable trail. Имеет тесты.
- KnowledgeService (194): реальный RAG (чанкинг, токен-оверлап, бленд эмбеддингов, ParityRepository, URL-ingest).
- TrainingService (125): реальный аналог CrewAI train/replay/test (TrainGuides, guideFor, replayCrew/testCrew).
- DefaultEmbeddingService (35): детерминированный hash-эмбеддинг (384-dim, L2, офлайн) — намеренная заглушка до подключения реального embedder.

## 4. rivals-catalog.ts — несоответствие

Описывает только 4 группы (rivals/rivals2/rivals3/rivals5) и 12 сервисов. Реально 19 подкаталогов/~172 сервиса. Каталог — устаревший статический срез (RivalsCatalogPanel рендерит его).

## 5. Панели

- RivalsHub (380): живой операционный хаб ядра (loops, group-chats, SOP, очереди, тулкиты, memory-блоки, dyad) через lazyService.
- RivalLabsPanel + RivalServiceCard (~150 карточек G–Z): демо/пробная поверхность (Run-кнопка, динамический диспатч).
- RivalsCatalogPanel (85): чистый статический рендер каталога.

## 6. Сводка

| Блок                                                                                                                                                                                                                                                                                              | Файлов   | Статус                      | Тесты |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | --------------------------- | ----- |
| rivals/ (ядро F)                                                                                                                                                                                                                                                                                  | 8        | реально, связано            | 6     |
| parity/                                                                                                                                                                                                                                                                                           | 4        | реально                     | 1     |
| rivals2..20                                                                                                                                                                                                                                                                                       | 164      | реальный код, демо/эмуляции | 1     |
| rivals-catalog.ts                                                                                                                                                                                                                                                                                 | 4 группы | устаревший срез             | —     |
| Дублирование: 19 подкаталогов ~175 файлов (риск HIGH); повторы имён (cache-service ×3, project/policy/persona/n8n/blackboard/assistant-service ×2); аудит рекомендует вынести в src/experimental/rivals/ или удалить.                                                                             |
| Связь: rivals-сервисы построены поверх тех же границ (ILLMClientService, IToolRunnerService, IEventBus, DAL, IWorkspaceService) как аддитивные parity-слои — переиспользуют примитивы, не переписывают. ROADMAP_11 (фазы F→Z) выполнен как экспериментальный/демо-опрос, не продакшен-интеграция. |
