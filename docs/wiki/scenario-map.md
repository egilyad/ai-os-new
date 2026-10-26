<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Карта сценариев: проверенные пути выполнения

> Раздел: **Руководство** · Статус: documented · Теги: руководство, аудит, сценарии, проверка

Источники: `src/kernel/services/debate-runtime/debate-sync-manager.ts`, `src/kernel/services/debate-runtime/debate-engine.ts`, `src/kernel/services/debate-runtime/debate-conclusion-engine.ts`, `src/stores/chat/chat-send-message.ts`, `src/components/SimulationPanel/SimulationPanel.tsx`

## Что это

«Карта сценариев» — это **проверенная карта** того, как реальные пользовательские задачи проходят через SuperAgents OS. В отличие от статьи «Путь идеи», здесь описаны **фактические цепочки выполнения с опорой на код и статусы проверки**: что реально работает, что работает с ограничениями, а что не проверено.

## Метки проверки

| Метка | Значение |
|---|---|
| **[V]** | Реализация подтверждена чтением кода |
| **[T]** | Есть тест, результат известен |
| **[R]** | Сценарий фактически выполнен |
| **[SA]** | Статический анализ (проблема/особенность в коде) |
| **[H]** | Гипотеза, требует проверки |
| **[NV]** | Не проверено в текущих условиях |

> ⚠️ Аудит **не полон**: проверены ключевые пути, остальные — в разделе «Открытые вопросы». Не называй непроверенную часть «зелёной».

---

## Общая карта

```mermaid
flowchart LR
    U["Пользователь"] --> UI["Панель/UI"]
    UI --> A["Действие"]
    A --> S["Сервис ядра"]
    S --> O["Оркестратор"]
    O --> LLM["LLM / Провайдер"]
    LLM --> R["Результат"]
    R --> P["Сохранение (Dexie/localStorage)"]
    P --> Back["Возврат в UI"]
    Back --> U
```

---

## Каталог сценариев

| # | Сценарий | Статус | Краткая цепочка |
|---|---|---|---|
| 1 | Дебаты: идея → вердикт | [V] | UI → startDebate → preflight → resolveStrategyConfig → createSession → startSession → pipeline → verdict → saveVerdict |
| 2 | Чат → ответ с контекстом из памяти | [V] | Chat → ragOnChat → memoryService.searchAdvanced → [RECALLED CONTEXT] → LLM → ответ |
| 3 | Симуляция: создать мир с агентами | [V] | SimulationPanel → worldStateService.create → engine → tick |
| 4 | Дебаты: восстановление после reload | [V] | engine._restoreOrphanedSessions (zombie 5 мин) + restoreSession + init:loadActiveSession + governor.rehydrate |
| 5 | Агент: создать и выполнить задачу | [SA] | AgentFactory.create → resolve → execute (LLM→tools→memory→persist→observe) |
| 6 | RAG: загрузить источник и найти | [V] | knowledgeService.addSource + chunkText + retrieve; KnowledgePanel теперь вызывает retrieve при поиске (≥3 симв.) |
| 7 | Wiki-Brain интеграция | [NV] | нет подтверждённой связки |

---

## Подробные цепочки

### 1. Дебаты (идея → вердикт) [V]

Пользователь → **DebatePanel** → `debateService.startDebate(topic, participants, strategy)`
→ **DebateSyncManager.startDebate**:
- preflight (≥2 участника, ≥1 ключ, debate-провайдер);
- `resolveStrategyConfig` (strategy → топология + quality);
- `_initEngineSession` → `DebateEngine.createSession`.

Затем **DebateEngine.startSession** (distributed-lock → `buildPipeline().run()`):
- pipeline: preflight → setupExecutor → roundLoop → consensusAndFinalize;
- вердикт: `validateAndSaveVerdict` → `store.saveVerdict` (Dexie `debateVerdicts`).

Возврат в UI через события `DEBATE_UPDATED`, `DEBATE_VERDICT_GENERATED`.

**Граница автоматизации:** всё от клика до вердикта автоматизировано; выбор стратегии и участников — ручной.

### 2. Чат с контекстом из памяти [V]

Пользователь → **Chat** → **chat-send-message**:
- если `CONFIG.featureFlags.memory.ragOnChat` — `memoryService.searchAdvanced` (scoped по сессии, при <2 — глобальный поиск);
- формируется `[RECALLED CONTEXT]`-префикс;
- при `autoStore` — сообщение сохраняется в память.

**Ограничение:** контекст из памяти — только текст; нет гарантий релевантности без оценки качества.

### 3. Симуляция [V]

**SimulationPanel** → `worldStateService.create({name, rooms, agentIds})` → **SimulationEngineService.step/run** → мир + tick.

**Ограничение:** если агенты не созданы — работает `StubActPort` (демо, без ИИ). Выбор агентов — через пикер (добавлен).

### 4. Восстановление после reload [V]

**DebateEngine.start** → `_restoreOrphanedSessions`:
- active/deliberating старше 5 мин → **failed** (zombie);
- active/deliberating моложе 5 мин → **paused** → `restoreSession`;
- paused → `restoreSession`.

**DebateSyncManager.init** → `loadActiveSession` + `governor.rehydrate(loaded.arguments)` (перестройка графа claims).

**Статус:** [V] — цепочка подтверждена чтением кода (engine.ts:205-235, sync-manager.ts:207-219). Формальное исполнение/тест по этому пути — не запускались.

### 5. Агент: создать и выполнить задачу [SA]

**AgentFactory.create** → resolver (роль/политика) → `agent-def/<id>` в DAL → событие `AGENT_CREATED`.
**AgentFactory.execute** → resolve → LLM → tools → memory → **persist** → observe.

**Статус:** [SA] — логика прочитана (agent-factory.ts), реальное выполнение не проверялось.

### 6. RAG: загрузить источник и найти [SA]

**addSource** (вызов из `assistant-wiring.ts`) → best-effort fetch (URL/CORS) → `chunkText` (~600 симв. на чанк) → событие `KNOWLEDGE_ADDED`.
**retrieve** → ранжирование по пересечению токенов (или cos, если embedder).

**Сейчас (исправлено):** KnowledgePanel вызывает `retrieve` при поиске (≥3 симв.) и показывает «Результаты RAG». [V] — путь подтверждён кодом; реальное выполнение с данными не проверялось.

---

## Карта передачи данных

| Переход | Что передаётся | Кто пишет | Кто читает | Источник истины | Статус |
|---|---|---|---|---|---|
| UI → SyncManager | topic, participants, strategy | UI | SyncManager | — | [V] |
| SyncManager → Engine | topology, config | SyncManager | Engine | — | [V] |
| Engine → Pipeline | события раунда | Orchestrator | Pipeline | — | [V] |
| Pipeline → Verdict | claims | Pipeline | ConclusionEngine | — | [V] |
| Verdict → Dexie | verdict record | saveVerdict | — | debateVerdicts | [V] |
| Chat → Memory | текст | chat-send-message | memoryService | memories | [V] |
| Simulation → World | agentIds | SimulationPanel | worldStateService | sim:world:* | [V] |

---

## Диагностика разрывов

| Симптом | Где искать | Как проверить | Возможная причина | Следующий шаг |
|---|---|---|---|---|
| Дебат «завис» | pipeline-builder | логи событий | ошибка провайдера | см. лог / retry |
| Нет вердикта | conclusion-engine | `debateVerdicts` | LLM-verdict не прошёл | fallback heuristic |
| Чат не подтянул память | chat-send-message | флаг `ragOnChat` | флаг выключен | включить |
| Пустая симуляция | SimulationPanel | show | нет агентов | Demo seed |

---

## Известные ограничения

- **[NV]** Аудит не полон; метки проставлены только по проверенным цепочкам.
- **[SA]** Выполнение агента требует реальной проверки (провайдер/ключи).
- **[V]** RAG-бэкенд подключён к панели знаний (retrieve при поиске); реальное выполнение с данными не проверялось.
- **[SA]** Wiki-Brain / Junction / Forum-интеграции не подтверждены как единый поток.

---

## Маршруты (инструкции)

1. **Проверить идею:** Дебаты → стратегия → вердикт.
2. **Собрать справку:** Чат (с флагом памяти) → «найди по источнику».
3. **Смоделировать:** Симуляция → создать мир → tick.

---

## Дата и границы аудита

- Дата проверки: 2026-10.
- Исследованы: дебаты (sync-manager/engine/conclusion), чат→память, симуляция, восстановление после reload, AgentFactory, RAG-addSource/retrieve.
- Запущены: чтение кода; **полные тесты не запускались** (ограничения окружения).
- Остались непроверенными: реальное выполнение агента (провайдер), реальный RAG-поиск из панели, Wiki-Brain.

---

## Связанные материалы

- [Путь идеи: от мысли до результата](./idea-path.md)
- [Возможности ОС](./capabilities.md)
- [Дебаты: режимы и механика](./debates.md)
- [Знания и память](./memory.md)
- [Агенты: устройство и управление](./agents.md)

[← Все материалы](./README.md)
