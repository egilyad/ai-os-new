# Спецификация: Единый embedding-слой и RAG-стандарт

> Статус: готово к реализации. Приоритет: P1. Связано: `ROADMAP_01` §P1, `ROADMAP_04` §P1.

---

## 1. Проблема (факты из кода)

- Три разных механизма поиска без общего интерфейса:
  1. BM25/Orama (`src/kernel/services/rag/bm25-service.ts`), Web Worker, limit 10k;
  2. провайдерские эмбеддинги (`src/llm/embeddings/embedding-client.ts`, OpenAI-совместимый `/embeddings`);
  3. офлайн hash-фолбэк (384 dims) в memory.
- `ProviderEmbeddingService` (timeout 30с): сбой провайдера **глобально отключает** provider-векторы до перезагрузки.
- `MemoryService`/`RagService`/WikiBrain/дебатный RAG используют разные пути; единого источника правды нет; лимиты рассинхронизированы (1000 vs 10000).
- Семантический кэш в `cache-decorator` использует НЕ эмбеддинги, а FNV-1a-аппроксимацию.

## 2. Цель

- Ввести единые интерфейсы `IEmbeddingProvider` и `IRetrievalProvider`; централизовать выбор бэкенда и fallback; устранить рассинхрон лимитов.

## 3. Интерфейсы (в `src/kernel/contracts/`)

### 3.1 `IEmbeddingProvider`

```ts
interface EmbeddingRequest {
  baseUrl?: string;
  apiKey?: string;
  model: string;
  texts: string[];
  dimensions?: number;
  signal?: AbortSignal;
}
interface EmbeddingResult {
  vectors: number[][];
  dimensions: number;
  provider: string;
}
interface IEmbeddingProvider {
  id: string; // 'provider' | 'offline-hash' | 'local-transformers'
  embed(req: EmbeddingRequest): Promise<EmbeddingResult>;
  supports(providerId: string, model: string): boolean;
}
```

### 3.2 `embedding-service.ts` (новый)

- Выбор бэкенда по приоритету: провайдерский → local (Transformers.js Web Worker) → офлайн-hash.
- **Fallback при сбое**: один провайдер не должен отключать всё — переключаться на следующий бэкенд для запроса.
- Кэш результатов по `hash(texts)+model` (LRU).
- Единая нормализация (L2) и проверка размерности.
- Матрица «пространств»: hash и provider не смешиваются в одном пространстве (сохранить), но сам выбор — централизован.

### 3.3 `IRetrievalProvider`

```ts
interface RetrievalQuery {
  text: string;
  topK: number;
  filters?: Record<string, unknown>;
  vector?: number[];
}
interface RetrievalHit {
  id: string;
  score: number;
  text: string;
  meta?: Record<string, unknown>;
}
interface IRetrievalProvider {
  id: string;
  query(q: RetrievalQuery): Promise<RetrievalHit[]>;
  index(units: Unit[]): Promise<void>;
}
```

- Реализации: `bm25`, `vector`, `hybrid` (RRF k=60), `wiki-brain`.

## 4. Миграция потребителей

- `MemoryService`, `RagService`, `KnowledgeService`, WikiBrain, дебатный RAG → ходят только через `IEmbeddingProvider`/`IRetrievalProvider`.
- `MemoryOrchestrator` — единые лимиты (конфиг `memory.limits.{maxUnits,workerCap}`).

## 5. Новый локальный бэкенд (опция P2)

- Transformers.js-модель в Web Worker (как `memory.worker.ts`) для полностью офлайн-эмбеддингов. Требует выбора модели (напр. all-MiniLM-L6-v2) и кэша весов.

## 6. Тесты

- `embedding-service`: выбор бэкенда, fallback при сбое провайдера, нормализация, кэш.
- `IRetrievalProvider`: bm25/vector/hybrid согласованность; лимиты.
- Миграция: существующие пути (memory/rag/wiki/debate) не сломаны (характеризационные тесты).

## 7. Definition of Done

- `IEmbeddingProvider` + `embedding-service` работают; сбой провайдера не отключает всё глобально.
- Все потребители переведены на интерфейсы; лимиты в конфиге.
- Тесты зелёные.
