# SuperAgents OS — Documentation Map

> Multi-Agent Cognitive OS. v4.5.0

## What This Is

A runtime for structured multi-agent reasoning — debates, argument graphs, cognitive diversity enforcement, and post-hoc interpretation. Not a chatbot platform. Not an agent framework. A **cognitive orchestration system** where agents produce structured reasoning traces that are measured, interpreted, and fed back into the system.

## How to Navigate

| File                          | What You'll Find                                                                                                                           |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `00-overview.md`              | Entry point — what the system is, why it exists, what problems it solves                                                                   |
| `01-system-architecture.md`   | Service architecture, two debate engines, governor, interpretation layer, dependency graph                                                 |
| `02-core-concepts.md`         | Agents, debates, claims graphs — the fundamental primitives                                                                                |
| `03-cognitive-layers.md`      | 5-layer stack: generation → control → diversity → measurement → interpretation                                                             |
| `04-behavior-modifiers.md`    | Archetypes, constraints, temperature — the "physics" of the system                                                                         |
| `05-metrics-system.md`        | Graph metrics, activity metrics, quality metrics — what is measured and why                                                                |
| `06-interpretation-engine.md` | DebateInterpreter — disagreement peak, trajectory changers, insights generation                                                            |
| `07-ui-layer.md`              | Full UI inventory (120+ panels): infrastructure, provider management, health, analytics, tools, memory, agents, chat, debate visualization |
| `08-data-flow.md`             | End-to-end pipeline: user input → debate → metrics → interpretation → UI                                                                   |
| `09-design-principles.md`     | Core architectural rules that govern the system                                                                                            |
| `10-experiments-framework.md` | How to run debates, compare runs, measure improvement                                                                                      |

## Auto-Healing Pipeline

When `docs` drift from code, the system detects and repairs the gap:

```
ConsistencyChecker.checkDocs() → mismatch detected
  → ConsistencyHealingPipeline.analyze() → healing plan
  → Documentation Debate (5 agents) → fixed content
  → ConsistencyChecker re-run → drift verified closed
```

## Start Here

- **New to the system**: `00-overview.md` → `02-core-concepts.md` → `01-system-architecture.md`
- **Debugging a debate**: `08-data-flow.md` → `03-cognitive-layers.md` → `05-metrics-system.md`
- **Extending the system**: `09-design-principles.md` → `01-system-architecture.md` → `04-behavior-modifiers.md`
- **Understanding metrics**: `05-metrics-system.md` → `06-interpretation-engine.md`

## Related Resources

- `src/kernel/DEPENDENCY_MAP.md` — full DI injection graph
- `docs/events.md` — event catalog with payloads
- `docs/01-system-architecture.md` — high-level architecture diagram
- `AGENTS.md` — development guide and session history

## Русская Документация

| Файл                             | Описание                                                                             |
| -------------------------------- | ------------------------------------------------------------------------------------ |
| `00-overview_RU.md`              | Введение — что такое система, зачем она нужна                                        |
| `01-system-architecture_RU.md`   | Архитектура, два движка дебатов, управляющий, интерпретация                          |
| `02-core-concepts_RU.md`         | Агенты, дебаты, граф утверждений — базовые примитивы                                 |
| `03-cognitive-layers_RU.md`      | 5 когнитивных слоёв: генерация → контроль → разнообразие → измерение → интерпретация |
| `04-behavior-modifiers_RU.md`    | Архетипы, ограничения, температура — "физика" системы                                |
| `05-metrics-system_RU.md`        | Метрики графа, активности, качества                                                  |
| `06-interpretation-engine_RU.md` | DebateInterpreter — пик несогласия, смены траектории                                 |
| `07-ui-layer_RU.md`              | Все 120+ UI-панелей: описание, поведение, событийная карта                           |
| `08-data-flow_RU.md`             | Сквозной конвейер: ввод → дебаты → метрики → интерпретация → UI                      |
| `09-design-principles_RU.md`     | Ключевые архитектурные правила                                                       |
| `10-experiments-framework_RU.md` | Как запускать дебаты, сравнивать прогоны                                             |
| `SERVICES_RU.md`                 | Все 88+ DI-сервисов ядра: назначение, события, lifecycle                             |
| `SYSTEM_MANIFEST_RU.md`          | Манифест системы                                                                     |

## Таксономия docs

| Папка | Статус | Назначение |
|---|---|---|
| `wiki/` | 🟢 ACTIVE | Полная документация системы (вики; генерируется из корпуса `src/components/WikiPanel`) |
| `active/` | 🟢 ACTIVE | Актуальная документация, которой пользуемся |
| `reference/` | 🔵 REFERENCE | Справочники, контракты, описания |
| `audits/` | 🟡 AUDITS | Результаты проверок, храним как историю |
| `roadmap/` | 🟣 ROADMAP | Планы и архитектурные направления |
| `history/` | 🟠 HISTORY | Старое с исторической ценностью |
| `superseded/` | ⚪ SUPERSEDED | Заменённое другим документом |
| `demos/` | 🟢 ACTIVE | Демонстрации со скриншотами реального интерфейса (`npm run gen:demos`) |
| `new/` | 🗑 DRAFTS | Черновики; в основном вне git, в инвентарь не входят |

Правила категорий, статусов и языков зафиксированы в стандарте — см.
`entity-model.json` и статью [`wiki/docs-standard.md`](./wiki/docs-standard.md).
Актуальные аудиты (2026-09-18) — в `audits/`.

## Индексы и портал

Машинно-читаемые артефакты (для людей и агентов) и точки входа:

| Артефакт | Что это |
|---|---|
| [`manifest.json`](./manifest.json) | Индекс сущностей: разделы, статьи, панели (регенерируется из кода) |
| [`graph.json`](./graph.json) | Граф знаний: узлы и рёбра между статьями, панелями, кодом и тестами |
| [`inventory.json`](./inventory.json) | Инвентарь всех документов `docs/**` (категория, язык, размер, hash) |
| [`entity-model.json`](./entity-model.json) | Стандарт документации (карточка сущности, статусы, источники истины) |
| [`wiki/docs-index.md`](./wiki/docs-index.md) | Карта документации — единый вход во всё вышеперечисленное |
| [`wiki/dev-checks.md`](./wiki/dev-checks.md) | Проверки и показатели; отчёт о полноте |
| [`demos/README.md`](./demos/README.md) | 5 демонстраций (чат, дебаты, провайдеры, память, диагностика) со скриншотами |

Портал: статическая вики публикуется на GitHub Pages под `/wiki/`
(`npm run gen:wiki-site`). Проверки состояния — `npm run docs:health`.

## Архитектурные решения (ADR)

Пять принятых решений в корне `docs/` (входят в `DOC_FILES` панели Docs Health и в статью
[`wiki/dev-adr.md`](./wiki/dev-adr.md)):

| ID | Решение | Статус |
|---|---|---|
| [`001`](./001-event-driven-architecture.md) | Event-Driven Architecture | Accepted (v1.0) |
| [`002`](./002-worker-sandboxing.md) | Worker Sandboxing (Web Workers) | Accepted (v1.0) |
| [`003`](./003-dexie-as-primary-storage.md) | Dexie.js (IndexedDB) as Primary Storage | Accepted (v1.0) |
| [`004`](./004-hybrid-search-strategy.md) | Hybrid Search Strategy | Accepted (v2.0) |
| [`005`](./005-mcp-integration.md) | MCP Integration | Accepted (v3.0) |

Смежные документы корня: [`COMPANY_GATEWAY.md`](./COMPANY_GATEWAY.md) (серверный срез M1–M9),
[`DEV_QUICKSTART.md`](./DEV_QUICKSTART.md) (быстрый старт разработчика),
[`NAVIGATION_MAP.md`](./NAVIGATION_MAP.md) (раскладка меню).
Живая карта панелей — [`wiki/panels-catalog.md`](./wiki/panels-catalog.md) и [`manifest.json`](./manifest.json).
