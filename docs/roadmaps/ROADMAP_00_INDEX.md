# SuperAgents OS — Пакет дорожных карт и рекомендаций

> Подготовлено на основе глубокого исследования кодовой базы `ai-os-new` (v4.5.0).
> Дата: 2026-10-31. Язык: русский.

## Что это за проект

**SuperAgents OS** — браузерная «когнитивная ОС» для оркестрации распределённого
интеллекта. Это не чат-бот, а операционная система: несколько LLM-провайдеров,
роли агентов, дебаты моделей, память, инструменты, когнитивные конвейеры и
диагностика — всё в одном локальном браузерном окружении. Данные хранятся локально
(IndexedDB/Dexie), сервера нет.

### Ключевые цифры (из кода и аудитов)

| Метрика                                       | Значение                                                  |
| --------------------------------------------- | --------------------------------------------------------- |
| Версия                                        | v4.5.0                                                    |
| Файлов всего                                  | ~1000+                                                    |
| Контрактов (интерфейсов в `kernel/contracts`) | ~1156 экспортов                                           |
| Сервисов (`kernel/services`)                  | 352 (71 подпапка)                                         |
| LLM-адаптеров                                 | ~26 провайдеров (7 «нативных» + OpenAI-совместимые)       |
| Декораторов LLM                               | 13                                                        |
| UI-панелей                                    | ~200 (в т.ч. 58 «техник» дебатов)                         |
| Zustand-сторов                                | ~22                                                       |
| Событий EventBus                              | ~198 имён (Zod-схемы)                                     |
| Вики-документов (`docs/wiki`)                 | 287                                                       |
| Стратегий дебатов                             | 33 встроенные + 13 enum                                   |
| Техник качества дебатов                       | 75–77                                                     |
| Тестов                                        | ~580+ (kernel ~370, llm ~27, components ~166, stores ~14) |

### Принципы архитектуры

1. **Events First** — всё общение через типизированный EventBus (`src/kernel/events/event-registry.ts`).
2. **No Globals in Kernel** — только DI-инъекция через контейнер (`container.ts`).
3. **Зависимости** — UI → Application → Kernel → Infrastructure (kernel никогда не импортирует UI).
4. **Контракты на границах** — интерфейсы в `kernel/contracts/`, реализации в `kernel/services/`.
5. **Нет циклических зависимостей** — сервисы зависят от контрактов, не друг от друга.

---

## Состав пакета

### Общие / стратегические

| Файл                    | Содержание                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------- |
| `ROADMAP_00_INDEX.md`   | Этот файл: индекс + сводный роадмап проекта по фазам                                                    |
| `NEW_COMPONENTS.md`     | Ранжированный список **новых компонентов**, которые логично писать (с обоснованием от текущего кода)    |
| `ANALOGS_COMPARISON.md` | Сравнение с аналогами (AutoGen, CrewAI, LangGraph, MetaGPT, Swarm, Letta, OpenAI Agents SDK, n8n и др.) |
| `RESEARCH_TOPICS.md`    | Исследовательские темы и эксперименты                                                                   |

### По компонентам (подробные роадмапы)

| Файл                                       | Компонент / подсистема                                                     |
| ------------------------------------------ | -------------------------------------------------------------------------- |
| `ROADMAP_01_LLM_LAYER.md`                  | LLM-слой: адаптеры, декораторы, реестр, HTTP/SSE, эмбеддинги               |
| `ROADMAP_02_DEBATE_RUNTIME.md`             | Движок дебатов: runtime, техники, стратегии, rivals                        |
| `ROADMAP_03_AGENTS_ORCHESTRATION.md`       | Агенты, роли, Council/Crew/Forum/Graph/Director, когнитивная оркестрация   |
| `ROADMAP_04_MEMORY_KNOWLEDGE.md`           | Память (7 типов), RAG, WikiBrain, knowledge-generator, crystal-vault       |
| `ROADMAP_05_TOOLS_SANDBOX_MCP_BROWSER.md`  | Инструменты, tool-pipeline, песочница, MCP, browser/computer-use           |
| `ROADMAP_06_OBSERVABILITY_DIAGNOSTICS.md`  | Наблюдаемость, timeline, трейсы, диагностика, советник, ELO, eval          |
| `ROADMAP_07_SECURITY_KEYS_TRUST.md`        | Ключи, секреты, permissions, trust/governance, аудит, PII                  |
| `ROADMAP_08_KERNEL_EVENTS_STATE_DI.md`     | EventBus, DI-контейнер, состояние, персистентность, event-sourcing, крипто |
| `ROADMAP_09_UI_PANELS_STORES.md`           | Панели UI, сторы, хуки, маршруты, i18n, визуализация                       |
| `ROADMAP_10_INFRA_CI_SERVER_GENERATORS.md` | Сервер, CLI, Docker, CI, скрипты-генераторы вики                           |
| `ROADMAP_11_PARITY_RIVALS_ANALOGS.md`      | Фреймворк «Rivals»/parity и поддержание паритета с аналогами               |

---

## Подготовка к старту и спецификации (добавлено после глубокого изучения + веб-исследований)

> Эти документы — «карта подготовки»: фиксируют baseline, риски, конвенции и готовые к
> реализации ТЗ для топ-приоритетов. Они снижают риск старта и облегчают работу после начала.

| Файл                                | Назначение                                                                    |
| ----------------------------------- | ----------------------------------------------------------------------------- |
| `PREP_00_BASELINE.md`               | Точка старта: команды, состояние тестов/CI, карты проекта, definition of done |
| `PREP_01_RISKS.md`                  | Реестр рисков (технические/продуктовые/процессные) + контрмеры                |
| `PREP_02_CONVENTIONS_CHEATSHEET.md` | Конвенции разработки (DI, события, панели, сторы, тесты)                      |
| `SPEC_01_CRYPTO_VAULT.md`           | ТЗ: зашифрованное хранилище ключей + passphrase-UI (P0)                       |
| `SPEC_02_EMBEDDING_STANDARD.md`     | ТЗ: единый IEmbeddingProvider + RAG-стандарт (P1)                             |
| `SPEC_03_METRICS_SERVICE.md`        | ТЗ: единый MetricsService (P1)                                                |
| `SPEC_04_EVAL_HUB.md`               | ТЗ: платформа оценки (датасеты/траектории/CI) (P1)                            |
| `SPEC_05_AGENT_RUNTIME.md`          | ТЗ: единый IAgentRuntime-фасад (P1)                                           |
| `SPEC_06_PLUGIN_SYSTEM.md`          | ТЗ: плагинная система + изоляция (P2)                                         |
| `SPEC_07_DEBATE_DSL_INTERPRETER.md` | ТЗ: интерпретатор DSL-стратегий дебатов (P1)                                  |
| `SPEC_08_AUTHORIZATION_LAYER.md`    | ТЗ: единый слой авторизации (default deny) (P0)                               |
| `SPEC_09_A2A_FEDERATION.md`         | ТЗ: A2A-интеграция и Федерация (P2)                                           |
| `SPEC_10_TEAM_SERVER_MODE.md`       | ТЗ: командный/серверный режим (multi-user, tenant) (P3)                       |
| `SPEC_11_INFRA_CI_HARDENING.md`     | ТЗ: закалка CI/инфраструктуры (P1)                                            |
| `SPEC_12_AGENT_SECURITY_OWASP.md`   | ТЗ: безопасность агентов (карта OWASP) (P0/P1)                                |
| `REF_01_EVENT_REGISTRY_DOMAINS.md`  | Справочник: доменный каталог всех событий EventBus                            |
| `REF_02_STRATEGIES_INVENTORY.md`    | Справочник: полный инвентарь 33 встроенных стратегий                          |

**Рекомендуемый порядок старта:** SPEC_01 → SPEC_02 → SPEC_08 → SPEC_03 → (затем по приоритету P1).
**Быстрый вход в контекст:** REF_01 (события), REF_02 (стратегии), PREP_02 (конвенции).

---

## Сводный роадмап проекта (по фазам)

> Детали по каждой теме — в соответствующих файлах. Здесь — скелет выполнения.

### Фаза 0 — «Фундамент» (приоритет P0, безопасность + честность системы)

Порядок: сначала заделать то, что система сама признаёт критическим.

1. **Секреты**: перевести ключи с plaintext в IndexedDB на зашифрованный storage с
   passphrase-UI (см. `dev-status-critical`). Убрать `KeyVault fail-open`.
2. **RBAC/авторизация**: ввести единую модель прав агентов (сейчас single-user,
   но «fail-open» в GovernanceService — риск при появлении мультиклиентности).
3. **Единый источник правды памяти**: устранить тройное дублирование
   (Dexie + repo-кэш + MemoryCache + воркер) и рассинхрон лимитов (1000 vs 10000).
4. **Восстановить битые ссылки документации**: `docs/audits/*` (debate/cognitive/
   providers/fleet/audit-wave*) — файлы, на которые ссылаются, отсутствуют.
5. **Завершить unit-тесты** на «голые» модули: CognitiveService/OrchestrationService,
   LlmCrewExecutor/CouncilPort/GraphPort, AuditService/GovernanceService/FleetMonitor/
   ToolGovernance, SandboxService, service-helper.

### Фаза 1 — «Внутренняя непротиворечивость» (P1)

1. Движок дебатов: **реализовать интерпретатор DSL-стратегий** — сейчас
   `startDebate` всегда строит roundtable, `strategy` игнорируется (заявлено 33,
   реально работают ~3 enum и 5 топологий).
2. Unify роутинга: убрать дублирование `RouterRankingService` vs `KeyStateStore`.
3. Убрать жёсткий список провайдеров в дебатах (`PRIORITY`/`SUPPORTED_PROVIDERS`) —
   сделать data-driven.
4. Включить в цепочку декораторов по умолчанию: SemanticRouter, CanaryRouter,
   CompressRoute (сейчас написаны, но не подключены).
5. Исправить кэш-декоратор: `streamMessage` без in-flight dedup (W6-039).

### Фаза 2 — «Продуктовые возможности» (P2, новые компоненты)

См. `NEW_COMPONENTS.md` — топ: плагинная система, база знаний/embedding-пайплайн,
eval-платформа, единый интерфейс «Чат/Crew/Council/Forum», экспорт/импорт данных,
автономный супервизор флота.

### Фаза 3 — «Платформа и расширяемость» (P3)

1. Плагинная архитектура (манифесты, sandbox для сторонних плагинов).
2. Мультиклиентность / федерация (Federation/Interop уже есть — довести до мультиtenant).
3. Серверный режим (опциональный) для командной работы.

### Фаза 4 — «Исследования» (P4, опционально)

См. `RESEARCH_TOPICS.md` — оценка качества дебатов (ELO/метрики), аблации техник,
мультиагентные протоколы (A2A), память во сне (sleep-engine), и т.д.

---

## Как пользоваться

- Начните с **Фазы 0** — это закрытие уже известных дыр, даёт максимальный эффект на единицу времени.
- Выберите компонент из раздела «По компонентам» — по нему есть отдельный роадмап с
  конкретными файлами, слотами для кода и критериями «готово».
- Новые крупные функции — из `NEW_COMPONENTS.md`; они ранжированы по ценности и простоте.

## Полное дерево всех документов пакета

```
New folder/
├── ROADMAP_00_INDEX.md
├── ROADMAP_01_LLM_LAYER.md
├── ROADMAP_02_DEBATE_RUNTIME.md
├── ROADMAP_03_AGENTS_ORCHESTRATION.md
├── ROADMAP_04_MEMORY_KNOWLEDGE.md
├── ROADMAP_05_TOOLS_SANDBOX_MCP_BROWSER.md
├── ROADMAP_06_OBSERVABILITY_DIAGNOSTICS.md
├── ROADMAP_07_SECURITY_KEYS_TRUST.md
├── ROADMAP_08_KERNEL_EVENTS_STATE_DI.md
├── ROADMAP_09_UI_PANELS_STORES.md
├── ROADMAP_10_INFRA_CI_SERVER_GENERATORS.md
├── ROADMAP_11_PARITY_RIVALS_ANALOGS.md
├── NEW_COMPONENTS.md
├── ANALOGS_COMPARISON.md
├── RESEARCH_TOPICS.md
├── PREP_00_BASELINE.md
├── PREP_01_RISKS.md
├── PREP_02_CONVENTIONS_CHEATSHEET.md
├── SPEC_01_CRYPTO_VAULT.md
├── SPEC_02_EMBEDDING_STANDARD.md
├── SPEC_03_METRICS_SERVICE.md
├── SPEC_04_EVAL_HUB.md
├── SPEC_05_AGENT_RUNTIME.md
├── SPEC_06_PLUGIN_SYSTEM.md
├── SPEC_07_DEBATE_DSL_INTERPRETER.md
├── SPEC_08_AUTHORIZATION_LAYER.md
├── SPEC_09_A2A_FEDERATION.md
├── SPEC_10_TEAM_SERVER_MODE.md
├── SPEC_11_INFRA_CI_HARDENING.md
├── SPEC_12_AGENT_SECURITY_OWASP.md
├── REF_01_EVENT_REGISTRY_DOMAINS.md
└── REF_02_STRATEGIES_INVENTORY.md
```
