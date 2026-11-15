# Роадмап: Память и знания (memory, RAG, WikiBrain, knowledge-generator)

> Область кода: `src/kernel/services/` → memory/, memory-center/, rag/, wiki-brain/,
> knowledge-generator/, crystal-vault/, synthesis/, research-adapters/;
> панели MemoryPanel/MemoryCenterPanel/KnowledgePanel/WikiBrainPanel/CrystalVaultPanel и др.

## Что есть сегодня

### Память (`memory/`, 28 файлов)

- Единый `MemoryService` (~1081 стр.) — все записи в одной Dexie-таблице `memories`;
  7 «магазинов» = метки типа: working, episodic, semantic, procedural, emotional, social, spatial.
- Web Worker `memory.worker.ts` (Orama, limit 10k) для поиска вне основного потока.
- `MemoryOrchestrator`: sleep-engine, дворец памяти, summarization, workflow-distiller.
- `MemoryWatchdog` — давление heap → очистка кэшей.

### Поиск / RAG (`rag/`)

- `bm25-service.ts` (Orama, k1=1.2, b=0.75), `hybrid-retrieval-service.ts` (RRF k=60),
  `reranker-service.ts`.
- Две линии: гибридный BM25+vector и линейный `KnowledgeService` (чанкинг ≤600 символов,
  200 чанков/источник).
- Дебатный RAG (`[RECALLED CONTEXT]`), WikiBrain — отдельная БД вне общего векторного пространства.

### Эмбеддинги

- `ProviderEmbeddingService` (timeout 30с) — провайдерские `/embeddings`, + офлайн hash-фолбэк (384 dims).
- Пространства hash/provider не смешиваются.

### WikiBrain (`wiki-brain/`, 21 файл)

- Персональная Wiki: ingest, query, lint, graph (Louvain), index, search-adapters, vault-sync, Dexie-хранилище.

### Knowledge-generator / Crystal-vault / Synthesis

- `knowledge-generator/` (4), `crystal-vault/` (5), `synthesis/` (4) — генерация знаний, «кристаллы», синтез мульти-перспективного консенсуса.

---

## Пробелы и риски (критично)

1. **Тройное дублирование**: Dexie + repo-кэш + MemoryCache + воркер — с рассинхроном лимитов (1000 vs 10000). Единого источника правды нет.
2. **Provider-векторы глобально отключаются** при одном сбое провайдера (до перезагрузки).
3. **`searchAdvanced` дорогой**, O(N)-сканы, write-путь O(n²).
4. Два RAG-пути (гибридный + KnowledgeService) конкурируют.
5. Embedding-клиент и офлайн-хэш — два разных мира без общего интерфейса.

---

## Роадмап

### P0 — Заделка и единый источник правды

- [ ] Устранить дублирование: одна таблица `memories` + один кэш-слой + один воркер; лимиты вывести в конфиг.
- [ ] `MemoryService` сделать единственным владельцем записи (пишет в Dexie), остальное — read-only кэши.
- [ ] Изолировать сбой провайдера эмбеддингов (fallback на офлайн-хэш без глобального отключения).

### P1 — Единый embedding-слой

- [ ] Ввести `IEmbeddingProvider` (см. `ROADMAP_01`) и `embedding-service.ts`;
      `MemoryService`/`RagService` ходят только через него.
- [ ] Перевести дебатный RAG и WikiBrain на общий поисковый интерфейс.

### P2 — Продуктовые функции

- [ ] **Sleep-engine** в продукт: фоновое «переваривание» памяти, дедупликация, summarization, забывание по Ebbinghaus (есть зачатки).
- [ ] **Память «дворец» / раскладка по комнатам** — довести до UX.
- [ ] **Федеративная память** (FederatedMemoryPanel) — шаринг знаний между инстансами.
- [ ] **Семантические связи/граф знаний** — поверх WikiBrain graph (Louvain) сделать навигацию «знаний».
- [ ] **Knowledge-generator**: из сырых источников → сущности → связи → «кристаллы» (проверенные факты) → синтез.

### P3 — Качество и масштабируемость

- [ ] Оптимизировать O(N)/O(n²)-пути (индексы, батчинг, worker-пайплайн).
- [ ] Ввести «recall-перезапись» (W8-012/013/014/015) и дедупликацию.
- [ ] Метаданные источников (provenance) — для доверия к знаниям.

### P4 — Исследования

- [ ] Бенчмарк памяти: hit-rate RAG, качество recall, влияние summarization.
- [ ] Сравнить офлайн-хэш vs провайдерские эмбеддинги на реальном корпусе.

---

## Критерии «готово»

- Один источник правды памяти; лимиты в конфиге; нет глобального отключения при сбое провайдера.
- Единый `IEmbeddingProvider`.
- Sleep-engine и граф знаний доступны в UI.

---

## Уточнения по коду (после глубокого изучения, 2026-10)

- **Три независимых контура** без общего слоя: `MemoryService` (Dexie + Orama-worker), `WikiBrain` (отдельная БД `aios-wiki-brain` + BM25/provider), `RAG/HybridRetrievalService` (парити-чанки + BM25/vector). У каждого — свои копии `cosineSimilarity`/BM25/токенизатора.
- **7 магазинов** = `ServiceBackedMemoryStore` (обёртки над одним `MemoryService`, фильтр по `metadata.type`), а отдельные классы `WorkingMemoryStore/EpisodicMemoryStore/...` — **мёртвый код** (не инстанцируются). Лимиты мёртвого слоя (100/10k/100k) не согласованы.
- **Рассинхронизация лимитов**: API/кэш = 1000, worker = 10000, Dexie-БД = фактически безлимит (`MemoryRepository.enforceLimit` режет только кэш). `getCapabilities().maxEntries`=1000, а worker оперирует 10k.
- **Поиск**: `search()` при готовом worker → Orama/BM25; `search_semantic` → `VectorSpace.match` — **O(N)** скан (нет ANN-индекса); `keywordFilterSearch`/`recall` — O(N). `searchAdvanced` тянет `max(limit*10,100)`.
- **Эмбеддинги**: `ProviderEmbeddingService` (через `IEmbeddingPort`, регистрация `'embeddingService'`), включён по конфигу (default off); при сбое → `providerEmbeddingsDisabled=true` → hash-фолбэк (384 dims). Выбор бэкенда в `MemoryService.deps.getEmbedder()`.
- **SleepEngine/суммаризация фактически не запускаются** в рантайме: `memoryOrchestrator.start()` нигде не вызывается (ночная консолидация/`summarizeRecent` не работают); микро-консолидация — только через `orchestrator.store()`.
- **→ Полная спецификация единого слоя: `SPEC_02_EMBEDDING_STANDARD.md`.**
