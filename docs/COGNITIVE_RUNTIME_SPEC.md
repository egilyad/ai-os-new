# 🧠 Cognitive Runtime Specification (CRS)

> **"Formal Definition of the Decision-Centric Event Stream"**

## 1. The Decision Atom

В SuperAgents OS каждое значимое действие ИИ упаковано в контейнер `CognitiveStep`.

```typescript
interface CognitiveStep {
  traceId: string; // ID родительской трассы
  nodeId: string; // ID узла в топологии DSL
  status: 'active' | 'done' | 'error';
  output: string; // Результат работы узла
  duration: number; // Время выполнения (мс)
  timestamp: number; // Время создания
}
```

## 2. Event Topology (Реальная шина событий)

`EventBus` — это хребет системы. Все сервисы используют следующие события:

### 2.1 События жизненного цикла запроса

| Тип события                | Источник     | Описание                          |
| -------------------------- | ------------ | --------------------------------- |
| `chat:send`                | UI           | Отправка сообщения пользователем. |
| `cognitive:step:active`    | Orchestrator | Узел начал выполнение.            |
| `cognitive:step:completed` | Orchestrator | Узел успешно завершил работу.     |
| `request:completed`        | Orchestrator | Вся цепочка (трасса) завершена.   |

### 2.2 Системные и фоновые события

| Тип события          | Источник       | Описание                                |
| -------------------- | -------------- | --------------------------------------- |
| `memory:updated`     | MemoryService  | Индексация нового фрагмента в Orama.    |
| `advisor:suggestion` | AdvisorService | Предложение по оптимизации топологии.   |
| `kernel:updated`     | Kernel         | Обновление метрик здоровья провайдеров. |

## 3. Intelligence DSL (IS-DSL)

Топология определяется как направленный граф (DAG).

- **Nodes**: `agent`, `router`, `guardrail`, `tool`.
- **Edges**: Связи с триггерами (`on_success`, `on_error`, `data_flow`).

## 4. Execution Sandbox

- **Thread Isolation**: All agent tools and scripts run in `Worker` threads.
- **Capability API**: Workers request OS features (storage, tools) via `postMessage` requests.
- **Blackboard**: Nodes can read/write to `data.blackboard` to share state across the topology.
- **MCP**: Standardized access to external context servers via Model Context Protocol.

## 5. State Persistence (Memory Mesh)

Память хранится в **IndexedDB (Dexie)** с двумя поисковыми индексами.

### 5.1 Orama (Full-Text BM25)

- **Где**: В Web Worker `memory.worker.ts` (отдельный поток).
- **Схема**: `id`, `content`, `metadata` (source, type, timestamp, importance).
- **Поиск**: `search()` с term и boost по content.
- **Особенность**: Orama не импортируется в main bundle — только в worker.

### 5.2 Transformers.js (Semantic Embeddings)

- **Модель**: `Xenova/all-MiniLM-L6-v2` (384-dim), quantized, ~80MB ONNX.
- **Где**: Тот же Web Worker, загружается по `enable_semantic`.
- **Генерация**: `pipeline('feature-extraction')` с pooling='mean', normalize=true.
- **Поиск**: Cosine similarity между query embedding и всеми кэшированными векторами.
- **Синхронизация**: Вектор сохраняется в Dexie асинхронно (`backfillVector`).

### 5.3 Режимы поиска

| Режим      | Метод                        | Когда используется  |
| ---------- | ---------------------------- | ------------------- |
| `semantic` | Cosine similarity            | Semantic toggle ON  |
| `fulltext` | Orama BM25                   | Semantic toggle OFF |
| `auto`     | Semantic → Orama → substring | По умолчанию        |

---

**Revision:** 4.5.0 (Multi-Agent Dialectic Arena — 25 agents, 13 base strategies + 33 built-in presets, metrics layer)
