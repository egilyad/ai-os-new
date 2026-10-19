// Wiki article: honest audit of the memory subsystem versus a reference
// agent-memory stack (Mem0, Letta/MemGPT, Zep/Graphiti, Cognee, HippoRAG,
// Reflexion, Voyager, MIRIX, ...). Verified against code, not docs.

import type { WikiArticle } from './wiki-types';

export const MEMORY_AUDIT_ARTICLES: WikiArticle[] = [
    {
        slug: 'memory-audit',
        title: 'Память: что есть и чего нет (аудит)',
        section: 'memory',
        tags: ['память', 'аудит', 'RAG', 'граф', 'гэпы'],
        freshness: 'verified',
        sources: [
            'src/kernel/services/memory-engine.ts',
            'src/kernel/services/memory/sleep-engine.ts',
            'src/kernel/services/rag/hybrid-retrieval-service.ts',
            'src/kernel/services/persona/lt-memory-service.ts',
            'src/kernel/services/crystal-vault/crystal-vault-service.ts',
        ],
        related: [
            'memory',
            'comp-memory',
            'comp-knowledge-rag',
            'comp-flow-knowledge',
            'dev-status-debt',
            'dev-status-docs',
            'comp-consistency',
            'comp-persistence',
        ],
        body: `## Назначение

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
| Letta / MemGPT (core/recall/archival) | Частично | Тиры core/recall/archival, promote/forget, графовые связи и BFS-соседи. Но это не OS-иерархия с блоками под инструментами; агентского memory.* tool нет. |
| Zep / Graphiti (temporal KG) | Нет | Полей валидности во времени (validFrom/validTo/observedAt) нет нигде. Графы снапшотные. |
| Cognee (graph + provenance) | Частично | Provenance силён только у кристаллов (evidence, originKind, modelIds). У документов и памяти — тонко. |
| LangMem (semantic/episodic/procedural) | Частично | Классы-сторы есть, но не инстанцируются (мёртвый код). LangGraph не используется. |
| LlamaIndex Memory (blocks) | Частично | Сервис блоков памяти (block:set) есть, но минимальный. |
| OpenMemory (локальная персистентность) | Работает | Dexie/IndexedDB: таблицы memories, ltMemories, cogMemories, memoryBlocks, skills, crystals. |

## Граф и темпоральность

| Тема | Статус | Что в системе |
| --- | --- | --- |
| Temporal graph (Graphiti) | Нет | Только createdAt/timestamp-снапшоты. |
| HippoRAG (PPR associative recall) | Частично | Multi-hop BFS есть, PageRank/PersonalizedPageRank нет, в retrieval не подключено. |
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
| LightMem/SleepGate (sleep) | Частично | sleep-engine помечен deprecated MOCK, consolidate() возвращает нули. |
| PowerMem (hybrid+decay+distill) | Частично | Hybrid есть и подключён в агентный RAG (RagService); decay — только TTL (30 дней), без кривой; дистилляция слабая. |

## Мультиагентная память

| Подход | Статус | Что в системе |
| --- | --- | --- |
| Shared message pool (MetaGPT) | Работает | Blackboard (в памяти, TTL, visibility) + персистентный blackboard (bb/board). |
| Namespaces / scopes | Частично | Метаданные owner/agent/role/session есть, но основной движок их не форсит. |
| MCP memory server | Нет | Только MCP-клиент; сервера памяти нет. Внутренний поиск — лишь knowledge.search. |
| Role-based ACL | Частично | ACL фильтрует Knowledge/Workspace; основная память ACL не проверяет. |
| Handoff memory | Работает | Персист в kv task_handoffs_v1 (что/кому/контекст/результат). Полей «почему/ограничения» нет. |
| CrewAI shared memory | Частично | Blackboard + shared-context-service. |
| MIRIX (6 типов) | Частично | Классы emotional/social/spatial есть, но не инстанцируются — по факту нет. |

## Специализированные для coding agents

Ни одной из систем (Claude-Mem, Memorix, engram, Remnic, Memov, Puppyone) нет. Роль ручной памяти играют AGENTS.md и docs/SESSION_LOG.md. Есть project-memory-service (решения/issues/context), персистентный через KV базы ([[comp-persistence]]); без БД работает в памяти и теряется при перезагрузке.

## Что реально работает

- Единая memory-служба на Dexie + BM25/полнотекст ([[comp-memory]]); при старте лениво включается semantic-режим (хэш-векторы).
- RAG дебатов: персистентные чанки, поиск, инъекция в промпт; при первом обращении чанки перечитываются из хранилища (rehydration), поэтому память прошлых дебатов доступна после перезагрузки ([[comp-flow-knowledge]]).
- Кристаллы знаний: жизненный цикл, версии, provenance ([[comp-knowledge-rag]]).
- Hybrid retrieval (BM25 ∪ vector → RRF → rerank) подключён в агентный RAG-цикл RagService с fallback на token-retrieve.
- Skills-библиотека, blackboard, Reflexion, task-handoff, ACL (частично).

## Чего нет

- Темпоральность графа (валидность факта во времени).
- Реальные эмбеддинги (везде лексические хэши) и векторная БД/ANN.
- MCP-сервер памяти, ACL и namespaces в основной памяти.
- Ebbinghaus-decay с кривой, self-editing памяти, workflow-дистилляция.
- Session-memory coding-агентов.

Также: 6+ специализированных сторов (working/episodic/semantic/procedural/emotional/social/spatial) — мёртвые классы; sleep-консолидация MOCK; «граф знаний» — эвристика и визуализация с синтетическими рёбрами; knowledge-generator — шаблонная симуляция, не LLM.

## Связи

- Обзор домена — [[memory]]; компонент — [[comp-memory]]; RAG — [[comp-knowledge-rag]].
- Расхождения вынесены в технический долг — [[dev-status-debt]] и состояние документации — [[dev-status-docs]].
- Персистентность — [[comp-persistence]]; история правок области — [[zone-4]].`,
    },
];
