<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: память и знания

> Раздел: **Компоненты и сервисы** · Статус: verified · Теги: компоненты, память, поиск, RAG, эмбеддинги

Источники: `src/kernel/services/memory-engine.ts`, `src/kernel/services/memory-orchestrator.ts`, `src/kernel/services/memory/provider-embedding-service.ts`, `src/kernel/workers/memory.worker.ts`, `src/kernel/workers/memory-vector-space.ts`, `src/kernel/services/rag/hybrid-retrieval-service.ts`, `src/kernel/services/rag/bm25-service.ts`, `src/kernel/services/parity/knowledge-service.ts`, `src/kernel/dal/memory-repository.ts`, `src/kernel/services/memory-engine.test.ts`

## Назначение

Семантическая и полнотекстовая память и знания: хранить заметки/факты/события и находить нужное по смыслу, а не только по подстроке.

## Возможности

- **Один движок** `MemoryService` на все типы; 7 «магазинов» (working/episodic/semantic/procedural/emotional/social/spatial) — фактические метки типа в одной Dexie-таблице `memories`.
- Режимы поиска: `semantic` (векторный через Web Worker/Orama), `keyword`/fulltext, `auto`; `recall` с Ebbinghaus-recency-реранком.
- Эмбеддинги: **провайдерские** (OpenAI-совместимый `/embeddings`, опционально по флагу `services.memory.providerEmbeddings.enabled`; L2-нормализация, кэш) с **офлайн-фолбэком** hash-эмбеддинга (384 dims, word-hashing). Пространства `'hash'` и `'provider'` не сравниваются между собой.
- Авто-сохранение когнитивных событий (`COGNITIVE_STEP_COMPLETED` → decision), TTL-прунинг (по умолчанию 30 суток), quality-gate от мусора.
- RAG: гибридный поиск (BM25 ∪ vector, RRF k=60) через `HybridRetrievalService`; `KnowledgeService` — линейный обход источников с token-overlap-ранжированием.

## Реализация

- `MemoryService implements IMemoryEngine` (`memory-engine.ts`, ~1081 ст.): `store/upsert/search/recall/searchAdvanced/prune`; параллельная запись в Dexie + кэш + воркер; deterministic `computeMemoryId`.
- Воркер `memory.worker.ts` + `memory-vector-space.ts` (Orama-индекс, hash/provider пространства, limit 10k).
- `ProviderEmbeddingService` + `EmbeddingClient` (`POST {baseUrl}/embeddings`, таймаут 30 c); backfill-переэмбеддинг.
- `MemoryOrchestrator` — 7 store-типов, sleep-engine, палац, summarization.
- RAG: `rag/bm25-service.ts` (k1=1.2, b=0.75), `rag/hybrid-retrieval-service.ts` (RRF k=60, веса 0.5/0.5, reranker), `parity/knowledge-service.ts` (чанкинг ≤600 символов, лимит 200 чанков/источник).
- Персистентность: Dexie `memories`, `knowledgeSources`; отдельная БД WikiBrain `aios-wiki-brain`.

## Связи

- Персистентность — [Компонент: персистентность (Dexie и storage-адаптеры)](./comp-persistence.md); сторы — [Каталог сторов](./dev-store-catalog.md); RAG/кристаллы — [Компонент: генерация знаний и RAG](./comp-knowledge-rag.md); сквозной контур знаний — [Сквозной контур: знания и RAG](./comp-flow-knowledge.md).
- Панели: [Знания и память](./memory.md) (обзор), [Панель: Дворец памяти](./panel-memory-palace.md), [Панель: База знаний (RAG)](./panel-knowledge.md).
- ADR по стратегии поиска — `docs/004-hybrid-search-strategy.md` (см. [Реестр архитектурных решений (ADR)](./dev-adr.md)).

## Проверка работоспособности

- Тесты: `memory-engine.test.ts`, `memory-search-utils.test.ts`, `service-backed-memory.test.ts`, `provider-embedding-service.test.ts`, `retention.test.ts`, `memory-access-tracker.test.ts`, `workflow-distiller.test.ts`, `memory-summarizer.test.ts`, `memory-mcp-server.test.ts`, `rag/hybrid-retrieval-service.test.ts`, `wiki-brain/*`.
- Ручная: добавить запись, искать в режимах semantic/fulltext.

## Состояние

- Реализовано; ключевые сервисы покрыты тестами (проверка 2026-10).
- **Известные риски (подробно — `docs/audits/memory-audit.md`):** тройное дублирование записи (Dexie + repo-кэш + MemoryCache + воркер) с рассинхроном лимитов (1000 vs 10000); один сбой провайдера глобально отключает provider-векторы до перезагрузки; `searchAdvanced` дорогой при малом limit; две независимые RAG-линии для дебатов; WikiBrain вне общего векторного пространства.

---

## Связанные материалы

- [Знания и память](./memory.md)
- [Компонент: генерация знаний и RAG](./comp-knowledge-rag.md)
- [Сквозной контур: знания и RAG](./comp-flow-knowledge.md)
- [Панель: Дворец памяти](./panel-memory-palace.md)
- [Панель: База знаний (RAG)](./panel-knowledge.md)
- [Компонент: персистентность (Dexie и storage-адаптеры)](./comp-persistence.md)
- [Каталог сторов](./dev-store-catalog.md)

[← Все материалы](./README.md)
