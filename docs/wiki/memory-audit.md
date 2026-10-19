<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Память: что есть и чего нет (аудит)

> Раздел: **Знания и память** · Статус: verified · Теги: память, аудит, RAG, граф, гэпы

Источники: `src/kernel/services/memory-engine.ts`, `src/kernel/services/memory/sleep-engine.ts`, `src/kernel/services/rag/hybrid-retrieval-service.ts`, `src/kernel/services/persona/lt-memory-service.ts`, `src/kernel/services/persona/ppr-recall.ts`, `src/kernel/services/persona/associative-context.ts`, `src/kernel/contracts/memory-store.ts`, `src/kernel/services/memory/service-backed-memory.ts`, `src/kernel/services/memory/memory-search-utils.ts`, `src/kernel/services/memory/memory-mcp-server.ts`, `src/kernel/services/memory/memory-summarizer.ts`, `src/kernel/services/memory/memory-access-tracker.ts`, `src/kernel/services/session-memory-service.ts`, `src/kernel/services/memory/workflow-distiller.ts`, `src/kernel/contracts/session-memory.ts`, `src/kernel/services/llm-bridge/llm-task-executor.ts`, `src/kernel/services/tool-executor.ts`, `src/kernel/service-registration/phase33-rivals.ts`, `src/kernel/services/crystal-vault/crystal-vault-service.ts`

## Назначение

Сверка memory-подсистемы с референсным стеком агентной памяти (Mem0, Letta/MemGPT, Zep/Graphiti, Cognee, HippoRAG, Reflexion, Voyager, MIRIX и др.): что реально работает, что является витриной, чего нет. Проверено чтением кода, а не документации.

## Легенда

- **Работает** — сквозной путь в рантайме.
- **Частично** — код/типы есть, но заглушка, не подключено или эвристика.
- **Нет** — отсутствует.

Рамка системы: браузерная ОС на Dexie/IndexedDB, без сервера; «semantic» здесь — лексические хэш-векторы, настоящей векторной БД нет; MCP — только клиент.

## Универсальные слои

| Референс | Статус | Что в системе |
| --- | --- | --- |
| Mem0 (extract-and-update) | Частично | Единый сервис: upsert с детерминированным SHA-256 ID (дедуп = update). Извлечения фактов из диалогов нет — только regex по дебатам. |
| Letta / MemGPT (core/recall/archival) | Частично | Тиры core/recall/archival, promote/forget, графовые связи и BFS-соседи. Но это не OS-иерархия с блоками под инструментами; память доступна агенту как memory.append/recall/remember/search/link/related. |
| Zep / Graphiti (temporal KG) | Частично | validFrom/validTo/observedAt есть у связей памяти (MemoryLink) и рёбер провенанса, с asOf-обходом; графы дебатов и знаний — снапшоты. |
| Cognee (graph + provenance) | Частично | Provenance силён только у кристаллов (evidence, originKind, modelIds). У документов и памяти — тонко. |
| LangMem (semantic/episodic/procedural) | Частично | Классы-сторы есть, но не инстанцируются (мёртвый код). LangGraph не используется. |
| LlamaIndex Memory (blocks) | Частично | Сервис блоков памяти (block:set) есть, но минимальный. |
| OpenMemory (локальная персистентность) | Работает | Dexie/IndexedDB: таблицы memories, ltMemories, cogMemories, memoryBlocks, skills, crystals. |

## Граф и темпоральность

| Тема | Статус | Что в системе |
| --- | --- | --- |
| Temporal graph (Graphiti) | Частично | Связи памяти и рёбра провенанса темпоральны и персистентны; claim-рёбра дебатов темпоральны и пересобираются из сохранённых аргументов при загрузке; граф знаний — снапшот. |
| HippoRAG (PPR associative recall) | Работает | Personalized PageRank (associativeRecall) по темпоральным связям: агенту как memory.related и в основном чат-контексте (buildAssociativeContext при memory.ragOnChat). Сиды — keyword-recall, поэтому нужны записанные памяти и связи. |
| Provenance (Cognee) | Частично | Только кристаллы. |
| ChatDB (SQL/symbolic) | Частично | Типизированные фильтры (store/timeRange/importanceMin/tags/agentId/sessionId) + substring. SQL/DSL нет. |

## Рефлексия и опыт

| Тема | Статус | Что в системе |
| --- | --- | --- |
| Reflexion | Работает | Self-reflection + retry, уроки в DAL kv per task-kind. |
| Generative Agents (episodic+reflection+planning) | Частично | Reflection и планирование есть, episodic-стор мёртв. |
| ExpeL (rules of thumb) | Частично | Фактически это reflexion-уроки; отдельных «правил» нет. |
| AWM (workflow memory) | Нет | Повторно используемых workflow-процедур нет. |
| Voyager (skill library) | Частично | Навыки реально персистятся (skills + Dexie), но procedural-стор мёртв. |

## Консолидация и самообучение

| Тема | Статус | Что в системе |
| --- | --- | --- |
| A-MEM (самопереписывание заметок) | Нет | — |
| Memory-R1 (RL add/update/delete) | Нет | — |
| Hindsight (multi-strategy + fusion) | Работает | Hybrid retrieval (BM25 ∪ vector → RRF) подключён в RagService с fallback на KnowledgeService.retrieve. Эмбеддер — хэш, реранкер — stub. |
| LightMem/SleepGate (sleep) | Работает | sleep-engine: микро/ночная консолидация мёржит дубли, забывает по Ebbinghaus-retention и в ночном проходе делает LLM-summary mesh-памяти (MemorySummarizer; без LLM — пропуск). |
| PowerMem (hybrid+decay+distill) | Частично | Hybrid подключён в агентный RAG; decay — TTL (30 дней) + Ebbinghaus-кривая в recall (half-life 15–30 дней по важности); дистилляция слабая. |

## Мультиагентная память

| Подход | Статус | Что в системе |
| --- | --- | --- |
| Shared message pool (MetaGPT) | Работает | Blackboard (в памяти, TTL, visibility) + персистентный blackboard (bb/board). |
| Namespaces / scopes | Работает | Метаданные agent/role/session/chat/type пишутся; searchAdvanced/recall фильтруют по ним (+ timeRange/importance/tags). Основной чат-recall общий. |
| MCP memory server | Работает | Встроенный in-process MCP-сервер: resources stats/entries/entry, tools search/store/recall/delete/stats/associated; подключён к MCPService локальным транспортом (memory://). |
| Role-based ACL | Частично | ACL фильтрует Knowledge/Workspace; память фильтруется по metadata (searchAdvanced/t-search), но roleId не форсится автоматически. |
| Handoff memory | Работает | Персист в kv task_handoffs_v1 (что/кому/контекст/результат). Полей «почему/ограничения» нет. |
| CrewAI shared memory | Частично | Blackboard + shared-context-service. |
| MIRIX (6 типов) | Частично | Классы emotional/social/spatial есть, но не инстанцируются — по факту нет. |

## Специализированные для coding agents

Готовых систем (Claude-Mem, Memorix, engram, Remnic, Memov, Puppyone) нет. Роль ручной памяти играют AGENTS.md и docs/SESSION_LOG.md. Есть project-memory-service (решения/issues/context), персистентный через KV базы ([Компонент: персистентность (Dexie и storage-адаптеры)](./comp-persistence.md)); без БД работает в памяти и теряется при перезагрузке. Плюс появился sessionMemoryService — персистентный скретчпад сессии (objective/файлы/команды/решения/issues/заметки): первый вопрос чата автоматически становится objective, остальное агент пишет через tools `session.remember`/`session.recall`; авто-захвата файлов и команд инструментами пока нет.

## Что реально работает

- Единая memory-служба на Dexie + BM25/полнотекст ([Компонент: память и знания](./comp-memory.md)); при старте лениво включается semantic-режим (хэш-векторы).
- RAG дебатов: персистентные чанки, поиск, инъекция в промпт; при первом обращении чанки перечитываются из хранилища (rehydration), поэтому память прошлых дебатов доступна после перезагрузки ([Сквозной контур: знания и RAG](./comp-flow-knowledge.md)).
- Кристаллы знаний: жизненный цикл, версии, provenance ([Компонент: генерация знаний и RAG](./comp-knowledge-rag.md)).
- Hybrid retrieval (BM25 ∪ vector → RRF → rerank) подключён в агентный RAG-цикл RagService с fallback на token-retrieve.
- Ассоциативный recall (PPR/HippoRAG) встроен в основной чат-контекст: keyword-сиды → Personalized PageRank по действующим связям памяти (buildAssociativeContext).
- Консолидация «сна» (микро/ночная) мёржит дубли и забывает низкозначимые по Ebbinghaus-кривой (recall тоже ранжируется с учётом кривой); recall помечает `lastAccessed` с debounce, поэтому повторные обращения реально замедляют забывание; ночной проход делает LLM-summary mesh-памяти (MemorySummarizer, кулдаун 6 ч, ≤5 сводок), и последние 2 сводки подмешиваются в контекст чата.
- Namespaces памяти: metadata-фильтры (agent/role/session/chat/source/type/timeRange/importance/tags) в searchAdvanced/recall и scope-параметры tool t-search ([Компонент: каталог инструментов, способности и политики](./comp-tool-capability.md)).
- Встроенный MCP-сервер памяти: JSON-RPC initialize/resources/tools над memoryService; MCPService подключает его локально (memory://, без сети и персистенции).
- LLM-порт персоны/памяти (LlmPersonaPort): LtMemoryService.summarize и PersonaService.distillStyle идут через llmClientService, при отсутствии LLM — эвристический fallback.
- Session-memory coding-агентов ([Компонент: память и знания](./comp-memory.md)): KV-персистентный скретчпад на сессию — objective, файлы, команды, решения, issues, заметки; дедуп и лимиты по типам, контекст-блок для промпта; tools `session.remember`/`session.recall`.
- Self-editing LT-памяти агента: tools `memory.forget`/`memory.promote`/`memory.demote`/`memory.edit` с проверкой `ownerId === 'agent'` (чужие записи не трогаются, правка текста эмитит memory:updated); mesh-память агенту недоступна.
- Workflow-дистилляция (Voyager-style): WorkflowDistiller сворачивает скретчпад сессии в упорядоченный workflow (LLM при наличии, иначе эвристика из команд/решений), сохраняет его как agent-owned LT-память (tier core, тег workflow) и регистрирует in-memory SOP; tool `workflow.distill`.
- Skills-библиотека, blackboard, Reflexion, task-handoff, ACL (частично).

## Чего нет

- Темпоральность большинства графов: она есть у связей памяти, рёбер провенанса и claim-рёбер дебатов (последние пересобираются из аргументов при загрузке сессии); граф знаний остаётся снапшотным.
- Реальные эмбеддинги (везде лексические хэши) и векторная БД/ANN.
- Автоматический ACL-scoping (роль/сессия) в основном recall и внешний MCP-транспорт (HTTP) для встроенного сервера памяти.

Также: 6+ специализированных сторов (working/episodic/semantic/procedural/emotional/social/spatial) — мёртвые классы; LLM-суммаризация работает только в ночной консолидации mesh и в LT/персоне; «граф знаний» — эвристика и визуализация с синтетическими рёбрами; knowledge-generator — шаблонная симуляция, не LLM.

## Связи

- Обзор домена — [Знания и память](./memory.md); компонент — [Компонент: память и знания](./comp-memory.md); RAG — [Компонент: генерация знаний и RAG](./comp-knowledge-rag.md).
- Расхождения вынесены в технический долг — [Технический долг](./dev-status-debt.md) и состояние документации — [Документация](./dev-status-docs.md).
- Персистентность — [Компонент: персистентность (Dexie и storage-адаптеры)](./comp-persistence.md); история правок области — [Зона 4: память и знания](./zone-4.md).

---

## Связанные материалы

- [Знания и память](./memory.md)
- [Компонент: память и знания](./comp-memory.md)
- [Компонент: генерация знаний и RAG](./comp-knowledge-rag.md)
- [Сквозной контур: знания и RAG](./comp-flow-knowledge.md)
- [Технический долг](./dev-status-debt.md)
- [Документация](./dev-status-docs.md)
- [Компонент: консистентность и дрейф](./comp-consistency.md)
- [Компонент: персистентность (Dexie и storage-адаптеры)](./comp-persistence.md)

[← Все материалы](./README.md)
