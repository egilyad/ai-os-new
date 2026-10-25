# Аудит подсистемы «Память/Знания» — реестр дефектов и рисков

> **Ветка:** `ai-os-new-fix-debate-text-truncation`.
> **Метод:** чтение кода/grep (без запуска тестов), 2026-10. Статусы: `[V]` — подтверждено кодом; `[SA]` — статический анализ.

---

## 0. Карта подтверждённых фактов

- Единый движок: `MemoryService` (`memory-engine.ts`, ~1081 ст.); 7 «магазинов» = метки типа в одной таблице `memories` (Dexie).
- Поиск: семантический (Web Worker/Orama) + keyword; `recall` с Ebbinghaus-recency.
- Эмбеддинги: провайдерские (`/embeddings`, opt-in) + офлайн-hash-фолбэк (384 dims). Пространства `hash`/`provider` не сравниваются.
- RAG: гибрид `HybridRetrievalService` (BM25 ∪ vector, RRF k=60) + линейный `KnowledgeService` (token-overlap).
- WikiBrain: отдельная БД `aios-wiki-brain`, собственный embedder; в `memories` не пишет.
- Тесты есть: `memory-engine.test.ts`, `memory-search-utils.test.ts`, `service-backed-memory.test.ts`, `provider-embedding-service.test.ts`, `retention.test.ts`, `memory-access-tracker.test.ts`, `workflow-distiller.test.ts`, `memory-summarizer.test.ts`, `memory-mcp-server.test.ts`, `rag/hybrid-retrieval-service.test.ts`, `wiki-brain/*`.

---

## 1. Дефекты и риски

| ID | Суть | Статус | Доказательство |
|---|---|---|---|
| M1 | Запись присутствует в 3-4 местах (Dexie + `MemoryRepository.cache` + `MemoryCache` + воркер) с разными лимитами (1000 vs 10000) | [V] | `memory-repository.ts`, `memory-cache.ts:15,64-85`, `memory.worker.ts:22-23` |
| M2 | `MemoryRepository.enforceLimit` урезает только кэш, не БД — после перезагрузки «видимое» окно сдвигается | [V] | `memory-repository.ts:221` (B10-166) |
| M3 | `searchAdvanced` подкапотный лимит `Math.max(limit*10, 100)` — дорого при limit=1 | [V] | `memory-engine.ts:942` |
| M4 | Provider-векторы невидимы для hash-запросов и наоборот; запросы по пространству частичны | [V] | `memory-engine.ts:878-881`, `memory-vector-space.ts:101-112` |
| M5 | Глобальный флаг `providerEmbeddingsDisabled`: один сбой провайдера отключает provider-векторы до перезагрузки/настройки | [V] | `memory-engine.ts:83,235` |
| M6 | Дублирующие поля в `MemoryEntry`: `vector`, `embedding`, `metadata.vectorData` | [V] | `memory-types.ts:32,64` |
| M7 | Две независимые RAG-линии для дебатов (`DebateRAGRetriever` vs `CrossDebateMemoryService`) без общего источника | [V] | `debate-rag-retriever.ts`, `cross-debate-memory.ts` |
| M8 | Смешение пространств в одной записи при реинициализации воркера (detectSpace 384=hash) | [SA] | `memory-vector-space.ts:18-39` |
| M9 | WikiBrain вне основной памяти: отдельная БД + embedder, нет единого векторного пространства; знания не попадают в `memories` | [V] | `wiki-brain/*` |
| M10 | `KnowledgeService.retrieve` — линейный O(N_chunks), динамический embedding каждого чанка, нет постоянного индекса | [V] | `knowledge-service.ts` |
| M11 | URL-ингest best-effort: при сети/CORS источник регистрируется с пустым содержимым | [V] | `knowledge-service.ts:117-122` |
| M12 | Кросс-дебат-память по keyword-overlap без embeddings — чувствительна к синонимам | [V] | `cross-debate-memory.ts:9` |
| M13 | Бюджет токенов `WikiBrainContextProvider` считается эвристикой `Math.ceil(len/4)`, не реальной токенизацией | [V] | `wiki-context-provider.ts:28` |

---

## 2. Рекомендуемые приоритеты

- **P0 (быстрые/безопасные):**
  - M6 — консолидировать поле вектора в `metadata.vectorData` (одна точка истины).
  - M5 — заменить глобальный флаг на per-provider cooldown/retry, чтобы один сбой не отключал всё.
  - M13 — использовать реальный tokenizer для бюджета (или консервативный множитель).
- **P1 (средние):**
  - M3 — оптимизировать `searchAdvanced` (не поднимать до 100 при limit=1).
  - M4 — добавить явный выбор пространства/двухпространственный поиск.
  - M10 — добавить индекс поверх `knowledgeSources` (труд. BM25/векторный).
  - M2 — перенести enforceLimit и на БД (или документировать поведение).
- **P2 (крупные):**
  - M9 — единое векторное пространство памяти + WikiBrain (или явный мост).
  - M7 — свести две RAG-линии дебатов к одному источнику.

Подробный план — `docs/roadmap/memory-improvements-roadmap.md`.
