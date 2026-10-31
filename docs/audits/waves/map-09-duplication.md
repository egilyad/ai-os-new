# Карта функционального дублирования — Duplication Map

## SuperAgents OS (`egilyad/ai-os-new`)

> **Версия проекта:** commit `e08ab8e` (Oct 31, 2026, ветка `main`)
> **Дата анализа:** 2026-10-31
> **Метод:** статический анализ: группировка панелей по именам, поиск дубликатов файлов (`find -name | uniq -d`), анализ `IMemoryStore` реализаций, поиск параллельных контрактов и сервисов
> **Парные документы:** «Карта готовности панелей» + «Карта функциональной ценности» + «Карта технического состояния» + «Карта использования ресурсов»
> **Главный результат:** найдено **7 категорий дублирования**, **28 кандидатов на объединение** + **12 — сохранить независимость**.

---

## 1. Исполнительное резюме

В проекте **много преднамеренного и непреднамеренного дублирования**. Часть — архитектурное разделение (8 типов памяти = 8 разных `IMemoryStore` реализаций), часть — research-параллельные реализации (19 `rivals/` подкаталогов = ~175 файлов параллельных сервисов), часть — настоящая избыточность (5 budget-панелей, 4 health-панели, 4 provider-UI, 97 компонентов с дублирующим `const [error, setError]` паттерном).

**Сводные находки:**

| Категория дублирования            |                                                              Кол-во элементов | Главный экземпляр                                                                                                                                     | Риск             |
| --------------------------------- | ----------------------------------------------------------------------------: | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| Budget-панели (UI overlap)        |                                                                         **7** | AnalyticsPanel + 4 budget + CostsPanel + KeyUsageAnalytics                                                                                            | 🟡 MED           |
| Health-панели (UI overlap)        |                                                                         **4** | HealthPanel, SystemHealth, DocsHealth, HealthSla                                                                                                      | 🟡 MED           |
| Provider-UI (4 точки входа)       |                                                                         **4** | ProviderManager, ProviderDashboard, ProviderMarketplace, OpenRouterPanel                                                                              | 🟡 MED           |
| Memory-панели                     |                                                                        **6+** | MemoryPanel, MemoryCenter, FederatedMemory, MemoryTransfer, KnowledgePanel, WikiBrain                                                                 | 🟡 MED           |
| Marketplace-панели                |                                                                         **4** | AgentMarketplace, PersonaMarketplace, ProviderMarketplace, RivalsCatalog                                                                              | 🟡 LOW           |
| Hub-панели                        |                                                                         **6** | CommunityHub, LearnHub, MemoryCenter, ProviderDashboard, SessionHub, DebatesManager                                                                   | 🟡 LOW           |
| 62 TechniquePanels (uniform)      |                                                                        **62** | `TechniquePanels/*.tsx` (diff = 4 строки)                                                                                                             | 🟡 MED           |
| `rivals/` subdir (parallel impl)  |                                                 **19 каталогов, ~175 файлов** | `rivals/`, `rivals2/`…`rivals20/`                                                                                                                     | 🔴 HIGH          |
| 8 `IMemoryStore` impl             |                                                                         **8** | working/procedural/semantic/episodic/social/service-backed/spatial/emotional                                                                          | 🟢 architectural |
| 6 memory-сервисов верхнего уровня |                                                                         **6** | memory-engine, memory-orchestrator, memory-transfer, federated-memory, session-memory, project-memory                                                 | 🟡 MED           |
| 10 memory-contract файлов         |                                                                        **10** | memory-store/memory-transfer/memory/federated-memory/project-memory/session-memory                                                                    | 🟡 MED           |
| 16 key-management файлов          |                                                                        **16** | key-alerts/analytics/diagnostics/fingerprints/health/lifecycle/metrics/models/pool-selector/quotas/registry-utils/registry/service/status/types/vault | 🟢 LOW (modular) |
| 14 router-related файлов          |                                                                        **14** | provider-router, route-rules, router-config-manager, … 12 router-*                                                                                    | 🟡 MED           |
| 5 health-related contracts        |                                                                         **5** | agent-health, health-check, health-sla, health, probe                                                                                                 | 🟡 MED           |
| 5 health-related services         |                                                                         **5** | agent-health-monitor, health-sla-service, monitoring-service, probe-service, router-latency-monitor                                                   | 🟡 MED           |
| Дубликаты файлов в rivals/        |                                                                     **7 пар** | cache-service×3, project-service×2, policy-service×2, persona-service×2, n8n-service×2, blackboard-service×2, assistant-service×2                     | 🔴 HIGH          |
| Error-handling паттерн            | **97 файлов** с `const [error, setError]` + **26** с `useAutoClearError` hook | 🟡 MED (нужна стандартизация)                                                                                                                         |
| 2 cache-сервиса                   |                                                                         **2** | cache-service.ts + gemini-cache-service.ts                                                                                                            | 🟡 LOW           |

**Главные кандидаты на объединение:**

1. **5 budget + 4 health + 4 provider panels** → таб-hub'ы (3 вместо 13)
2. **62 TechniquePanels** → 1 каталог
3. **97 ручных `setError`** → 1 `useAutoClearError` hook
4. **6 memory-сервисов верхнего уровня** → `MemoryOrchestrator` как single entry
5. **19 `rivals/` подкаталогов** → **переместить в `experimental/` или удалить**, оставить только live

**Главные кандидаты СОХРАНИТЬ НЕЗАВИСИМЫМИ:**

1. **8 типов памяти** (`IMemoryStore` implementations) — архитектурно разные (semantic vs episodic vs emotional…)
2. _*14 router-* файлов_* — decomposition одного сложного домена (scoring, ranking, fallback, recording…)
3. **16 key-management файлов** — fine-grained separation of concerns
4. **LLM adapters (12 файлов)** — по одному на провайдера, обязательно

---

## 2. Методология: 6 типов дублирования

| #   | Тип                                     | Что ищем           | Признак                                    |
| --- | --------------------------------------- | ------------------ | ------------------------------------------ |
| 1   | **Панели с похожими функциями**         | UI-дубликаты       | похожие имена, overlap в функциональности  |
| 2   | **Повторяющиеся сервисы**               | Сервис-дубликаты   | одно имя файла в разных каталогах          |
| 3   | **Дублирующиеся механизмы**             | Pattern-дубликаты  | `setError`, `useEffect`, `polling`         |
| 4   | **Несколько реализаций одной задачи**   | Parallel impl      | несколько классов с одинаковым интерфейсом |
| 5   | **Повторяющиеся интерфейсы**            | Contract-дубликаты | несколько `IXxx` для одного концепта       |
| 6   | **Параллельные источники одних данных** | Source-дубликаты   | несколько сервисов читают один источник    |

**Классификация результата:**

- 🟢 **KEEP INDEPENDENT** — дублирование преднамеренное (архитектурное, modular, plugin-pattern)
- 🟡 **MERGE CANDIDATE** — стоит объединить в общий сервис/панель
- 🔴 **DUPLICATE / REMOVE** — настоящая избыточность, удалить или переместить в experimental

---

## 3. Панели с похожими функциями (UI overlap)

### 3.1. Budget-домен — 7 панелей 🔴 DUPLICATE

| Панель                              | Строк | Что делает                        | Дублирует?                  |
| ----------------------------------- | ----: | --------------------------------- | --------------------------- |
| `BudgetPanel.tsx`                   |   179 | Бюджет setting + spend view       | — (главная)                 |
| `BudgetPanel/`                      | (dir) | Тоже Budget                       | 🔴 duplicate route          |
| `BudgetAlertsPanel.tsx`             |   322 | Alerts при превышении budget      | 🟡 subset of Budget         |
| `CostOptimizationPanel.tsx`         |   339 | Cost optimization recommendations | 🟡 overlap с SRE            |
| `CostAnalyticsPanel.tsx`            |   453 | Analytics стоимости               | 🟡 overlap с AnalyticsPanel |
| `CostsPanel.tsx`                    |   203 | Траты компаний (gateway)          | 🟡 overlap с Budget         |
| `AnalyticsPanel/AnalyticsPanel.tsx` |     — | Аналитика общая                   | 🟡 включает cost-analytics  |
| `KeyUsageAnalyticsPanel.tsx`        |   297 | Usage per key                     | 🟡 subset of analytics      |

**Verdict:** 🔴 **MERGE в 1 `BudgetHub`** с табами: Overview / Spend / Alerts / Optimization / Per-Key / Companies. **Сэкономит 6 маршрутов в навигации.**

### 3.2. Health-домен — 4 панели 🟡 MERGE

| Панель                        | Что показывает                                      | Дублирует?                                  |
| ----------------------------- | --------------------------------------------------- | ------------------------------------------- |
| `HealthPanel.tsx` (530 строк) | Vitals + kernel services + probe + timeline + score | — (главная)                                 |
| `SystemHealthPanel.tsx` (219) | Системное здоровье                                  | 🟡 subset                                   |
| `DocsHealthPanel.tsx` (218)   | Документация health                                 | 🟢 другое (но UI-паттерн тот же)            |
| `HealthSlaPanel.tsx` (441)    | SLA-метрики                                         | 🟡 `@deprecated MOCK` (см. Tech Health Map) |

**Verdict:** 🟡 **MERGE SystemHealth + HealthSla в HealthPanel** с табами. DocsHealth оставить отдельной (другой домен). **HealthSlaPanel — удалить** (`@deprecated MOCK`).

### 3.3. Provider-домен — 4 точки входа 🔴 DUPLICATE

| Панель                                   | Что делает                                 | Дублирует?                                           |
| ---------------------------------------- | ------------------------------------------ | ---------------------------------------------------- |
| `ProviderManager/` (1765 строк, 4 views) | Keys + models + rotation + routing + pools | — (главная)                                          |
| `ProviderDashboard.tsx` (670)            | Дашборд провайдеров                        | 🟡 subset (overview)                                 |
| `ProviderMarketplace.tsx` (347)          | Маркетплейс провайдеров                    | 🟢 другое (discover)                                 |
| `OpenRouterPanel.tsx` (29 строк!)        | Микро-обёртка                              | 🔴 **полный дубликат**, делегирует в ProviderManager |

**Verdict:** 🔴 **Удалить `OpenRouterPanel`** (29 строк, явный дубликат). `ProviderDashboard` MERGE в ProviderManager как «Overview» таб. `ProviderMarketplace` — оставить отдельной (discover vs manage — разные задачи).

### 3.4. Memory-домен — 6+ панелей 🟡 MERGE PARTIAL

| Панель                           | Что делает                      | Дублирует?                |
| -------------------------------- | ------------------------------- | ------------------------- |
| `MemoryPanel/`                   | BM25 + semantic search, chunks  | — (главная)               |
| `MemoryCenterPanel/`             | Хаб памяти                      | 🟡 overlap (hub)          |
| `FederatedMemoryPanel.tsx` (517) | Federated memory (experimental) | 🟢 другое (federation)    |
| `MemoryTransferPanel.tsx`        | Transfer memory                 | 🟢 другое (export/import) |
| `KnowledgePanel/`                | RAG documents                   | 🟢 другое (knowledge)     |
| `WikiBrainPanel/`                | RAG по wiki                     | 🟢 другое (wiki)          |

**Verdict:** 🟡 `MemoryCenterPanel` должен быть **entry point hub** (обзор всех memory-сервисов), а не дубликат MemoryPanel. Остальные — **сохранить независимыми** (разные источники данных).

### 3.5. Marketplace-домен — 4 панели 🟢 KEEP

| Панель                              | Что делает              |
| ----------------------------------- | ----------------------- |
| `AgentMarketplacePanel.tsx` (102)   | Маркетплейс агентов     |
| `PersonaMarketplacePanel.tsx` (259) | Маркетплейс персон      |
| `ProviderMarketplace.tsx` (347)     | Маркетплейс провайдеров |
| `RivalsCatalogPanel.tsx` (85)       | Каталог вариантов       |

**Verdict:** 🟢 **KEEP INDEPENDENT** — разные домены (agents vs personas vs providers). UI-паттерн одинаковый — можно вынести `MarketplaceLayout` shared-компонент, но панели оставить.

### 3.6. Hub-домен — 6 панелей 🟡 PARTIAL MERGE

| Панель                          |                                          Строк | Что делает |
| ------------------------------- | ---------------------------------------------: | ---------- |
| `CommunityHubPanel.tsx` (310)   |                                      Community |
| `LearnHubPanel.tsx` (67)        | Hub: Tutorials + Docs + Patterns + DecisionLog |
| `MemoryCenterPanel/`            |                                     Hub памяти |
| `ProviderDashboard.tsx` (670)   |                          Dashboard провайдеров |
| `SessionHubPanel.tsx` (564)     |                                     Хаб сессий |
| `DebatesManagerPanel.tsx` (714) |                               Менеджер дебатов |

**Verdict:** 🟡 Hub-паттерн повторяется. `LearnHubPanel` (67 строк) — тонкая обёртка над 4 отдельными панелями. Если они уже доступны в навигации отдельно — `LearnHubPanel` дублирует. Остальные — самостоятельные.

### 3.7. 62 TechniquePanels — 🟡 MERGE (один шаблон)

**Все 62 файла в `TechniquePanels/*.tsx` — 234 строки, идентичны кроме:**

- `TECHNIQUE_ID` (humor/critic/steelman/…)
- `CATEGORY` (P0/P1/P2)
- `mode` FocusSection (`arguments` vs `agents`)

```bash
$ diff <(sed -E 's/humor|Humor/XXX/g' HumorPanel.tsx) \
       <(sed -E 's/critic|Critic/XXX/g' CriticPanel.tsx) | wc -l
4
```

**Verdict:** 🟡 **MERGE в 1 `<TechniquePanel techniqueId="humor" />` generic-компонент + 1 каталог-страницу.** Сэкономит ~14 500 LOC и 61 маршрут.

### 3.8. DebateReplay — 5 файлов, это decomposition 🟢 KEEP

`DebateReplayControls.tsx` (207) + `DebateReplayEventDetail.tsx` (88) + `DebateReplaySidebar.tsx` (112) + `DebateReplayTimeline.tsx` (199) + `DebateReplayLiveControls.tsx` (50) + `DebateReplayPanel.tsx` (328) + `DebateReplayTypes.ts`.

**Verdict:** 🟢 **KEEP INDEPENDENT** — это decomposition одной панели на 6 под-компонентов. Не дублирование.

---

## 4. Повторяющиеся сервисы — `rivals/` parallel implementations 🔴 HIGH

### 4.1. 19 `rivals/` подкаталогов — главная находка

```
src/kernel/services/
├── rivals/     19 files
├── rivals2/    10 files
├── rivals3/    10 files
├── rivals4/    11 files
├── rivals5/    10 files
├── rivals6/    10 files
├── rivals7/    10 files
├── rivals9/     4 files
├── rivals10/  10 files
├── rivals11/   9 files
├── rivals12/  10 files
├── rivals13/   3 files
├── rivals14/   8 files
├── rivals15/  10 files
├── rivals16/  10 files
├── rivals17/  10 files
├── rivals18/  10 files
├── rivals19/  11 files
├── rivals20/   4 files
TOTAL:        ~175 files
```

Каждый `rivalsN/` каталог содержит **параллельные реализации** схожих концептов: `cache-service.ts`, `project-service.ts`, `policy-service.ts`, `persona-service.ts`, `n8n-service.ts`, `blackboard-service.ts`, `assistant-service.ts`.

### 4.2. Дубликаты файлов (то же имя, разные каталоги) 🔴

| Файл-дубликат           | Где                                                     | Размер      |
| ----------------------- | ------------------------------------------------------- | ----------- |
| `cache-service.ts`      | `services/` (337) + `rivals10/` (97) + `rivals14/` (34) | **3 копии** |
| `project-service.ts`    | `services/` (263) + `rivals14/` (23)                    | 2 копии     |
| `policy-service.ts`     | `services/` (565) + `rivals18/` (15)                    | 2 копии     |
| `persona-service.ts`    | `services/` (468) + `persona/` (200)                    | 2 копии     |
| `n8n-service.ts`        | `services/` (101) + `rivals6/` (151)                    | 2 копии     |
| `blackboard-service.ts` | `services/` (108) + `rivals17/` (19)                    | 2 копии     |
| `assistant-service.ts`  | `services/` (489) + `rivals4/` (115)                    | 2 копии     |

**Проверка содержимого (cache-service):**

- `services/cache-service.ts` (337 строк) — `CacheService implements ICacheService`, LLM response cache
- `rivals10/cache-service.ts` (97 строк) — `CacheRegistryService implements ICacheRegistryService`, Gemini context-cache manager
- `rivals14/cache-service.ts` (34 строки) — отдельная stub

**Verdict:** 🔴 **rivalsN — research/experimental implementations**. Каждая `rivalsN` = «попытка №N» переопределить сервис. **Должны быть:**

- Перемещены в `src/experimental/rivals/` или `src/research/`
- Или удалены, если не используются (нужна проверка импортов)
- Оставлены в `services/` только canonical версии

**POTENTIAL waste:** ~175 файлов × средний 100 строк = **~17 500 LOC research-кода в основной кодовой базе**.

### 4.3. `rivals20/` — инфраструктурные сервисы

```
rivals20/codex-services.ts
rivals20/infra-services.ts
rivals20/interpreter-services.ts
rivals20/live-backends.test.ts
```

Включает `LangfuseService`, `LangsmithService` (заглушка), `WhaleService` и т.д. — **3-5 параллельных observability-backend реализаций**.

**Verdict:** 🔴 **Дублирование observability-backends.** Оставить 1 canonical (Langfuse если используется), остальные — experimental.

---

## 5. Несколько реализаций одной задачи

### 5.1. 8 `IMemoryStore` реализаций 🟢 KEEP (architectural)

Все реализуют `IMemoryStore`:

| Реализация                 | Строк | Тип памяти                |
| -------------------------- | ----: | ------------------------- |
| `working-memory.ts`        |   101 | Рабочая (контекст)        |
| `procedural-memory.ts`     |    84 | Процедурная (skills)      |
| `semantic-memory.ts`       |   122 | Семантическая (meaning)   |
| `episodic-memory.ts`       |   109 | Эпизодическая (events)    |
| `social-memory.ts`         |    81 | Социальная (relations)    |
| `service-backed-memory.ts` |   177 | Bridge к внешнему сервису |
| `spatial-memory.ts`        |   113 | Пространственная          |
| `emotional-memory.ts`      |    99 | Эмоциональная             |

**Verdict:** 🟢 **KEEP INDEPENDENT** — это **архитектурное** разделение по типам памяти (когнитивная психология). Каждая — отдельный cognitive memory system. **Не дублирование.**

### 5.2. 6 memory-сервисов верхнего уровня 🟡 MERGE (single entry)

| Сервис                        | Строк | Зачем                               |
| ----------------------------- | ----: | ----------------------------------- |
| `memory-engine.ts`            | 1 088 | Главный движок (BM25 + semantic)    |
| `memory-orchestrator.ts`      |   224 | Оркестратор (включает sub-services) |
| `memory-transfer-service.ts`  |   359 | Export/import                       |
| `federated-memory-service.ts` |   257 | Federated sync                      |
| `session-memory-service.ts`   |   205 | Session-scoped memory               |
| `project-memory-service.ts`   |   225 | Project-scoped memory               |

**Verdict:** 🟡 `memory-orchestrator` должен быть **single entry point** для внешних потребителей. Сейчас панели могут импортировать `memory-engine` напрямую (хотя в компонентах `memoryEngine.*` = 0 вызовов, всё через hooks — **это уже правильно**). Внутренняя структура — многослойная, но **внешний API должен быть 1 точка**.

### 5.3. LLM Adapters (12 файлов) 🟢 KEEP (plugin pattern)

12 адаптеров: gemini, openrouter, groq, nvidia, openai-compatible, anthropic, cloudflare, kimi, qwen, deepseek, minimax, mock.

**Verdict:** 🟢 **KEEP INDEPENDENT** — plugin pattern, по одному адаптеру на провайдера. Это правильно.

### 5.4. Router — 14 файлов decomposition 🟢 KEEP

`provider-router.ts` + `route-rules.ts` + 11 `router-*.ts` (config-manager, debate-selector, decision-recorder, fallback-resolver, latency-monitor, ranking, request-classifier, scoring, services, types) + `smart-routing-service.ts` + `routing-experiments-service.ts`.

**Verdict:** 🟢 **KEEP INDEPENDENT** — decomposition сложного домена (роутинг) на подзадачи: classification → scoring → ranking → fallback → recording → monitoring. **Не дублирование, а слои.**

### 5.5. Key-management — 16 файлов 🟢 KEEP (modular)

`key-alerts.ts`, `key-analytics.ts`, `key-diagnostics.ts`, `key-fingerprints.ts`, `key-health.ts`, `key-lifecycle.ts`, `key-metrics-handler.ts`, `key-models.ts`, `key-pool-selector.ts`, `key-quotas.ts`, `key-registry-utils.ts`, `key-registry.ts`, `key-service.ts` (1 098), `key-status.ts`, `key-types.ts`, `key-vault.ts`.

**Verdict:** 🟢 **KEEP INDEPENDENT** — fine-grained separation of concerns (alerts / analytics / diagnostics / health / lifecycle / metrics / pool / quotas / registry / vault — **разные responsibilities**). Barrel-экспорт через `key-management/index.ts`.

---

## 6. Повторяющиеся интерфейсы (contracts)

### 6.1. Memory-related contracts — 10 файлов 🟡 MERGE

| Файл                                                                          | Строк | Кол-во interfaces |
| ----------------------------------------------------------------------------- | ----: | ----------------: |
| `memory-store.ts`                                                             |    69 |                 4 |
| `memory-transfer.ts`                                                          |    27 |                 3 |
| `memory.ts`                                                                   |    52 |                 3 |
| `federated-memory.ts`                                                         |    46 |                 4 |
| `session-memory.ts`                                                           |    40 |                 3 |
| `project-memory.ts`                                                           |    25 |                 1 |
| (также в `meta.ts`, `persona.ts`, `viz/memory-graph.ts`, `debate-runtime.ts`) |     — |                 — |

**Verdict:** 🟡 **MERGE в 1 `contracts/memory/index.ts`** barrel с под-экспортами. Сейчас 10 файлов с перекрывающимися `IMemory*` интерфейсами — сложно найти canonical.

### 6.2. Health-related contracts — 5 файлов 🟡 MERGE

`agent-health.ts`, `health-check.ts`, `health-sla.ts`, `health.ts`, `probe.ts`.

**Verdict:** 🟡 **MERGE в 1 `contracts/health.ts`** (или `contracts/health/index.ts`). 5 файлов для одного домена «health» — избыточно.

### 6.3. Routing-related contracts — 3 файла 🟡 PARTIAL

`routing-experiments.ts`, `routing-policy.ts`, `smart-routing.ts` + `routing/` subdir.

**Verdict:** 🟡 **PARTIAL MERGE** — `smart-routing.ts` и `routing-policy.ts` могут быть объединены. `routing-experiments.ts` оставить (research).

### 6.4. Cache contracts — 2 файла 🟡 KEEP (different)

`cache.ts` (ICacheService) + `gemini-cache.ts` (ICacheRegistryService).

**Verdict:** 🟢 **KEEP INDEPENDENT** — `ICacheService` = generic LLM cache; `ICacheRegistryService` = Gemini-specific context-cache. Разные контракты.

### 6.5. Contracts barrel `index.ts` — 1 241 строка

`src/kernel/contracts/index.ts` — barrel-экспорт из всех contract-файлов. 1 241 строка = **огромный barrel**, но это **не дублирование**, а удобный single-entry.

---

## 7. Параллельные источники одних данных

### 7.1. Keys data — 4 источника 🟡 ARCHITECTURE

| Источник        | Роль                  | Где используется             |
| --------------- | --------------------- | ---------------------------- |
| `keyService`    | CRUD keys             | 78 calls в components        |
| `keyStateStore` | In-memory state       | useKeyStore hook             |
| `keyVault`      | Encrypted storage     | (legacy / future)            |
| `keyRegistry`   | Registry of providers | key-registry.ts (942 строки) |

**47 вызовов `keyService.getKeys/getAll/list` в kernel services** — много параллельных readers.

**Verdict:** 🟡 **ARCHITECTURE** — это **слои** (vault = storage, registry = metadata, stateStore = cache, service = API). Но **47 callers в kernel** — стоит централизовать через 1 `keyAggregator`. Сейчас каждый service лезет к keyService напрямую.

### 7.2. Memory data — параллельные sources 🟡 PARTIAL

8 `IMemoryStore` реализаций + 6 top-level memory services + MemoryPanel UI. Все читают/пишут memory, но **через разные типы** (episodic vs semantic vs emotional…).

**Verdict:** 🟢 **ARCHITECTURE** — разные типы памяти = разные источники. Это правильно.

### 7.3. Provider health — 3 источника 🟡 OVERLAP

| Источник                    | Что                 |
| --------------------------- | ------------------- |
| `probeService`              | Active probe        |
| `agent-health-monitor`      | Heartbeat           |
| `monitoring-service`        | Snapshot monitoring |
| `router-latency-monitor`    | Latency tracking    |
| `truth-consistency-monitor` | Truth consistency   |

**5+ мониторинг-сервисов** — каждый со своим `setInterval`, каждый генерит events.

**Verdict:** 🟡 **POTENTIAL OVERLAP.** HealthPanel (530 строк) должен агрегировать все 5 в single UI. Сейчас они работают параллельно, могут давать **conflicting signals**.

### 7.4. Storage adapters — 3 файла 🟢 KEEP

`storage-adapter.ts` (interface), `dexie-storage.ts` (IndexedDB impl), `local-storage-adapter.ts` (localStorage impl).

**Verdict:** 🟢 **KEEP INDEPENDENT** — 3 разных storage backend. Это plugin pattern.

---

## 8. Дублирующиеся механизмы (patterns)

### 8.1. Error handling — 2 конкурирующих паттерна 🟡 STANDARDIZE

| Паттерн                                                  | Где        | Кол-во |
| -------------------------------------------------------- | ---------- | -----: |
| `const [error, setError] = useState<string\|null>(null)` | components | **97** |
| `useAutoClearError` hook                                 | components | **26** |

**Verdict:** 🟡 **STANDARDIZE на `useAutoClearError` hook.** 97 ручных `setError` — дублирование логики auto-clear, dismiss timer. Hook существует, но используется только в 26 файлах. **Migration: 97 → 1 hook usage.**

### 8.2. Polling — 1 canonical ✅

`usePolling` hook используется в **79 местах**, без альтернативы. **0 manual `setInterval` in `useEffect`** в components.

**Verdict:** 🟢 **EXCELLENT** — единый паттерн polling. Это лучший result по дублированию в проекте.

### 8.3. Subscriptions — 1 canonical, но обходят 🟡 STANDARDIZE

`eventBus.on(event, handler)` возвращает `unsub`. Топ-15 подписчиков используют `const unsub = eventBus.on(...); return () => unsub();`.

**НО:** 97 прямых подписок в components vs ~50 через Zustand stores. **Стоит centralize через stores.**

**Verdict:** 🟡 **POTENTIAL centralization.** Pattern canonical, но применяется непоследовательно.

### 8.4. Loading state — duplicating 🟡

В `TasksPanel` (903 строки) — **11 `useState`** для loading/error/data/etc. То же в других больших панелях.

**Verdict:** 🟡 **STANDARDIZE на `useAsyncData` hook** (load + loading + error + data в одном). Сейчас каждый пишет свой.

### 8.5. Demo seeding — duplicating 🟢 LOW

`seedChatDemo`, `seedTasksDemo`, `seedCrystalsDemo`, `seedSynthesisDemo`, `seedDebatesDemo`, `memory-demo-seed.ts`, `generator-demo-seed.ts` — по одному seed-файлу на домен.

**Verdict:** 🟢 **OK** — каждый домен имеет свой demo-seed. Это **не дублирование**, а **per-domain feature**.

---

## 9. Кандидаты на объединение — полный список

| #   | Что                                                                                                       | Сейчас                                    | Рекомендация                                                  | Выгода                          |
| --- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------- | ------------------------------- |
| 1   | **5 budget panels**                                                                                       | 5 маршрутов                               | MERGE в `BudgetHub` с табами                                  | -4 маршрута, unified UX         |
| 2   | **3 health panels** (System + SLA + Health)                                                               | 3 маршрута                                | MERGE в `HealthPanel` с табами; удалить HealthSlaPanel (MOCK) | -2 маршрута, remove deprecated  |
| 3   | **`OpenRouterPanel`**                                                                                     | 29 строк дубликат                         | DELETE                                                        | -1 маршрут, -29 LOC             |
| 4   | **`ProviderDashboard`**                                                                                   | 670 строк overlap                         | MERGE в ProviderManager как «Overview» таб                    | -1 маршрут                      |
| 5   | **62 TechniquePanels**                                                                                    | 62 × 234 строк                            | MERGE в 1 `<TechniquePanel id="…" />` + 1 catalog             | **-14 500 LOC, -61 маршрут**    |
| 6   | **6 memory top-level services**                                                                           | 6 entry points                            | MERGE на `MemoryOrchestrator` как single API                  | упростит consumer API           |
| 7   | **10 memory contracts**                                                                                   | 10 файлов                                 | MERGE в `contracts/memory/index.ts` barrel                    | -10 файлов, +1                  |
| 8   | **5 health contracts**                                                                                    | 5 файлов                                  | MERGE в `contracts/health.ts`                                 | -5 файлов, +1                   |
| 9   | **19 `rivals/` subdirs**                                                                                  | ~175 файлов                               | MOVE в `src/experimental/rivals/` или DELETE unused           | **-175 файлов в main codebase** |
| 10  | **7 duplicate service files** (cache×3, project×2, policy×2, persona×2, n8n×2, blackboard×2, assistant×2) | 7 пар                                     | KEEP canonical в `services/`, MOVE rest в experimental        | -10-15 файлов                   |
| 11  | **`SocialLeaderboardPanel`**                                                                              | 34 строки обёртка                         | DELETE (EloLeaderboard уже в AgentsPanel)                     | -1 маршрут                      |
| 12  | **`LearnHubPanel`**                                                                                       | 67 строк hub                              | Если 4 ребёнка в навигации — DELETE; иначе KEEP               | -1 маршрут                      |
| 13  | **97 ручных setError**                                                                                    | 97 файлов                                 | MIGRATE на `useAutoClearError` hook                           | consistency, -1000 LOC          |
| 14  | **`BudgetPanel/` дубликат**                                                                               | dir + .tsx same name                      | DELETE one                                                    | -1 dup                          |
| 15  | **`rivals20/` observability backends**                                                                    | 3-5 parallel (Langfuse, Langsmith, Whale) | KEEP 1, MOVE rest в experimental                              | -3-4 файлов                     |
| 16  | **`AssistantPanel` + `Assistant/`**                                                                       | dir + standalone                          | MERGE в `Assistant/AssistantPanel`                            | consistency                     |
| 17  | **`AgentJournalPanel` dir + .tsx**                                                                        | 2 entry points                            | DELETE standalone .tsx                                        | -1 dup                          |
| 18  | **`DecisionLogPanel` dir + .tsx**                                                                         | 2 entry points                            | DELETE standalone .tsx                                        | -1 dup                          |
| 19  | **`KeyNotesPanel` dir + .tsx**                                                                            | 2 entry points                            | DELETE standalone .tsx                                        | -1 dup                          |
| 20  | **5 monitoring services** (probe, agent-health, monitoring, router-latency, truth-consistency)            | 5 параллельных                            | Centralize через `HealthAggregator`                           | consistency                     |

---

## 10. Кандидаты СОХРАНИТЬ НЕЗАВИСИМЫМИ

| #   | Что                                                                                                      | Почему                                                                            |
| --- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| 1   | **8 `IMemoryStore` impl** (working/procedural/semantic/episodic/social/service-backed/spatial/emotional) | Архитектурное разделение по типам памяти (когнитивная психология)                 |
| 2   | **12 LLM adapters**                                                                                      | Plugin pattern, по одному на провайдера                                           |
| 3   | _*14 router-* файлов_*                                                                                   | Decomposition сложного домена (scoring, ranking, fallback, recording)             |
| 4   | **16 key-management файлов**                                                                             | Fine-grained SoC (alerts/diagnostics/health/lifecycle/pool/quotas/registry/vault) |
| 5   | **3 storage adapters**                                                                                   | Plugin pattern (dexie/local-storage/adapter-interface)                            |
| 6   | **4 marketplace panels**                                                                                 | Разные домены (agents/personas/providers/catalog)                                 |
| 7   | **5 debate-replay files**                                                                                | Decomposition одной панели                                                        |
| 8   | **8 zone-audit docs**                                                                                    | Исторические записи (см. Tech Health Map)                                         |
| 9   | **2 cache services** (`cache-service` + `gemini-cache-service`)                                          | Разные контракты (`ICacheService` vs `ICacheRegistryService`)                     |
| 10  | **3 routing contracts** (`routing-experiments` + `routing-policy` + `smart-routing`)                     | Разные уровни (experiments/research, policy/rules, smart/heuristic)               |
| 11  | **Demo seeds (по одному на домен)**                                                                      | Per-domain feature, не дублирование                                               |
| 12  | **3 storage layers** (`vault`/`registry`/`stateStore`)                                                   | Слои архитектуры                                                                  |

---

## 11. Сводная матрица дублирования

| Категория                   |                   Кол-во элементов | Главный экземпляр  | Verdict                               |
| --------------------------- | ---------------------------------: | ------------------ | ------------------------------------- |
| Budget-панели               |                                  7 | BudgetPanel        | 🔴 MERGE в BudgetHub                  |
| Health-панели               |                                  4 | HealthPanel        | 🟡 MERGE (DocsHealth keep)            |
| Provider-UI                 |                                  4 | ProviderManager    | 🔴 DELETE OpenRouter, MERGE Dashboard |
| Memory-панели               |                                  6 | MemoryPanel        | 🟡 MemoryCenter = hub, rest KEEP      |
| Marketplace                 |                                  4 | —                  | 🟢 KEEP (different domains)           |
| Hub-панели                  |                                  6 | —                  | 🟡 LearnHub = thin wrapper            |
| Technique-панели            |                                 62 | (uniform)          | 🟡 MERGE в 1 generic + catalog        |
| Debate-replay files         |                                  5 | —                  | 🟢 KEEP (decomposition)               |
| **`rivals/` subdirs**       |               **19 (~175 файлов)** | —                  | 🔴 MOVE в experimental                |
| Duplicate service files     |                              7 пар | —                  | 🔴 KEEP canonical, rest experimental  |
| 8 `IMemoryStore` impl       |                                  8 | —                  | 🟢 KEEP (architectural)               |
| 6 memory top-level services |                                  6 | MemoryOrchestrator | 🟡 MERGE на single API                |
| 10 memory contracts         |                                 10 | —                  | 🟡 MERGE в barrel                     |
| 5 health contracts          |                                  5 | —                  | 🟡 MERGE                              |
| 5 health services           |                                  5 | —                  | 🟡 Centralize via HealthAggregator    |
| 16 key-management files     |                                 16 | —                  | 🟢 KEEP (modular)                     |
| 14 router-* files           |                                 14 | —                  | 🟢 KEEP (decomposition)               |
| 12 LLM adapters             |                                 12 | —                  | 🟢 KEEP (plugin pattern)              |
| 3 storage adapters          |                                  3 | —                  | 🟢 KEEP (plugin pattern)              |
| 2 cache services            |                                  2 | —                  | 🟢 KEEP (different contracts)         |
| Error-handling patterns     | 97 setError + 26 useAutoClearError | useAutoClearError  | 🟡 STANDARDIZE                        |
| Polling patterns            |            79 usePolling, 0 manual | usePolling         | 🟢 EXCELLENT                          |
| Subscription patterns       |         97 direct + ~50 via stores | store selector     | 🟡 CENTRALIZE                         |

---

## 12. Рекомендации

### 🔴 P0 — критическое дублирование (сократить немедленно)

1. **`rivals/` 19 подкаталогов (~175 файлов) → переместить в `src/experimental/rivals/`** или удалить неиспользуемые. Это **17 500 LOC** в основной кодовой базе, которые затрудняют поиск canonical-версии сервиса. Каждый, кто ищет `cache-service.ts`, находит 3 копии.

2. **7 пар дубликатов файлов (cache×3, project×2, policy×2, persona×2, n8n×2, blackboard×2, assistant×2) → оставить canonical в `services/`, остальные в experimental**.

3. **62 TechniquePanels → 1 generic `<TechniquePanel techniqueId="humor" />` + 1 catalog**. Сэкономит **~14 500 LOC и 61 маршрут**.

### 🟡 P1 — важное дублирование (оптимизировать в квартал)

4. **5 budget panels → `BudgetHub`** с табами: Overview / Spend / Alerts / Optimization / Per-Key / Companies.

5. **3 health panels (System + SLA + Health) → `HealthPanel`** с табами. `HealthSlaPanel` удалить (`@deprecated MOCK`).

6. **`OpenRouterPanel` (29 строк) → DELETE** — полный дубликат.

7. **`ProviderDashboard` → MERGE в `ProviderManager`** как «Overview» таб.

8. **97 ручных `setError` → MIGRATE на `useAutoClearError` hook**. Hook существует, используется в 26 файлах, нужно распространить.

9. **10 memory contracts → 1 barrel `contracts/memory/index.ts`**.

10. **5 health contracts → 1 `contracts/health.ts`**.

11. **4 standalone `.tsx` с дубликатом в директории** (`AgentJournalPanel`, `DecisionLogPanel`, `KeyNotesPanel`, `AssistantPanel`) → удалить standalone версии.

### 🟢 P2 — стандартизация (постоянно)

12. **Centralize eventBus subscriptions через Zustand stores** — 97 прямых подписок в компонентах заменить на store selectors.

13. **Standardize async-data pattern** — `useAsyncData` hook (load + loading + error + data) для замены 11-`useState` паттерна в больших панелях.

14. **HealthAggregator service** — centralize 5 monitoring services (probe + agent-health + monitoring + router-latency + truth-consistency) в один consumer-facing API.

15. **MemoryOrchestrator как single API entry** — все consumers должны идти через orchestrator, не через memory-engine напрямую.

### 🟢 KEEP INDEPENDENT — не трогать

16. **8 `IMemoryStore` impl** — архитектурное разделение по типам памяти.
17. **12 LLM adapters** — plugin pattern.
18. _*14 router-* файлов_* — decomposition.
19. **16 key-management файлов** — modular SoC.
20. **3 storage adapters** — plugin pattern.
21. **4 marketplace panels** — разные домены.
22. **5 debate-replay files** — decomposition.

---

## 13. Итоговый вердикт по дублированию

| Тип дублирования                                                               | Объём         | Оценка  | Действие                    |
| ------------------------------------------------------------------------------ | ------------- | :-----: | --------------------------- |
| **Architectural** (8 memory stores, 12 adapters, 14 router-files, 16 key-mgmt) | ~30 элементов | 🟢 9/10 | KEEP — правильно            |
| **Decomposition** (debate-replay 5 файлов, debate-strategy 33 файла в одном)   | ~40 элементов | 🟢 8/10 | KEEP — правильно            |
| **Plugin pattern** (storage adapters, LLM adapters)                            | 15 элементов  | 🟢 9/10 | KEEP — правильно            |
| **UI overlap** (budget 5, health 4, provider 4)                                | 13 элементов  | 🟡 5/10 | MERGE в hub'ы               |
| **Uniform-generated** (62 TechniquePanels)                                     | 62 элемента   | 🟡 4/10 | MERGE в 1 generic           |
| **Research parallel** (`rivals/` 19 subdirs)                                   | ~175 файлов   | 🔴 3/10 | MOVE в experimental         |
| **Duplicate files** (7 пар)                                                    | 7 пар         | 🔴 3/10 | KEEP canonical              |
| **Pattern duplication** (97 setError, 97 eventBus.on)                          | 194 элемента  | 🟡 5/10 | STANDARDIZE на hooks/stores |

**Overall Duplication Score: 5.5/10** — много архитектурно правильного «дублирования» (memory types, adapters, modular services), но **реальная избыточность** в `rivals/` (175 файлов), UI overlap (13 панелей), 62 uniform technique panels и pattern-duplication (97 setError) — требует cleanup.

**Потенциальная экономия от cleanup:**

- ~17 500 LOC (rivals moved out)
- ~14 500 LOC (technique panels merged)
- ~1 000 LOC (setError → hook)
- ~10 маршрутов навигации (budget/health/provider/technique consolidation)
- **Итого: ~33 000 LOC и 10+ маршрутов** можно убрать без потери функциональности.

---

## Приложение A. Все найденные дубликаты в цифрах

| Метрика                            |         Значение | Тип                        |
| ---------------------------------- | ---------------: | -------------------------- |
| Budget-связанных панелей           |                7 | UI overlap                 |
| Health-панелей                     |                4 | UI overlap                 |
| Provider-UI точек входа            |                4 | UI overlap                 |
| Memory-панелей                     |                6 | UI overlap                 |
| Marketplace-панелей                |                4 | KEEP                       |
| Hub-панелей                        |                6 | UI overlap                 |
| Technique-панелей (uniform)        |               62 | MERGE candidate            |
| `rivals/` подкаталогов             | 19 (~175 файлов) | research parallel          |
| Дубликатов файлов (то же имя)      |            7 пар | DUPLICATE                  |
| `IMemoryStore` реализаций          |                8 | architectural              |
| Memory-сервисов верхнего уровня    |                6 | MERGE candidate            |
| Memory-contract файлов             |               10 | MERGE candidate            |
| Health-contract файлов             |                5 | MERGE candidate            |
| Health-сервисов                    |                5 | centralize candidate       |
| Key-management файлов              |               16 | KEEP (modular)             |
| Router-related файлов              |               14 | KEEP (decomposition)       |
| LLM adapters                       |               12 | KEEP (plugin)              |
| Storage adapters                   |                3 | KEEP (plugin)              |
| Cache services                     |                2 | KEEP (different contracts) |
| Файлов с `const [error, setError]` |               97 | STANDARDIZE                |
| Файлов с `useAutoClearError`       |               26 | canonical pattern          |
| Файлов с `usePolling`              |               79 | canonical pattern          |
| Файлов с `eventBus.on` (direct)    |               46 | centralize candidate       |
| Маршрутов навигации (всего)        |              268 | —                          |
| Кандидатов на MERGE/DELETE         |         20 групп | —                          |
| Кандидатов на KEEP INDEPENDENT     |         12 групп | —                          |

---

## Приложение B. Источники и метод

| Что                        | Где                           | Как проверено                                  |
| -------------------------- | ----------------------------- | ---------------------------------------------- |
| Панели по группам          | `ls src/components/`          | `grep -iE "budget\|health\|provider\|…"`       |
| Дубликаты файлов           | `src/kernel/services/`        | `find -name                                    | sed | sort | uniq -d` |
| `rivals/` подкаталоги      | `src/kernel/services/`        | `ls \| grep rivals`                            |
| `IMemoryStore` impl        | `src/kernel/services/memory/` | `grep -rl "implements IMemoryStore"`           |
| Memory contracts           | `src/kernel/contracts/`       | `ls \| grep -i memory`                         |
| Health contracts           | `src/kernel/contracts/`       | `ls \| grep -i health`                         |
| Error pattern              | `src/components/`             | `grep -rE "const \[error, setError\]"`         |
| Service duplication        | `src/kernel/services/`        | `find -name "*-service.ts" \| sort \| uniq -c` |
| Polling pattern            | `src/components/`             | `grep -rE "usePolling\("`                      |
| Subscription pattern       | `src/components/`             | `grep -rE "eventBus\.on\("`                    |
| Technique panel uniformity | `TechniquePanels/`            | `diff` после sed-нормализации                  |
| Key management modularity  | `key-management/`             | `ls`                                           |
| Router decomposition       | `services/`                   | `ls \| grep router`                            |

---

_Отчёт сгенерирован 2026-10-31 на основе коммита `e08ab8e`. Анализ статический; runtime-использование дублирующих панелей/сервисов не проверялось. Парные отчёты: «Карта готовности панелей», «Карта функциональной ценности», «Карта технического состояния», «Карта использования ресурсов»._
