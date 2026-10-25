# Аудиты подсистем — указатель

> Аудиты выполены по единой схеме: чтение кода/grep (валидация) → глубинные wiki-статьи → реестр дефектов/рисков → roadmap. Ветка `ai-os-new-fix-debate-text-truncation`, 2026-10.

| Подсистема | Аудит | Roadmap | Вики |
|---|---|---|---|
| Дебаты | [debate-audit.md](./debate-audit.md) | [debate-improvements-roadmap.md](../roadmap/debate-improvements-roadmap.md) | `comp-debate-runtime`, `comp-debate-techniques`, `comp-flow-debate` |
| Память/Знания | [memory-audit.md](./memory-audit.md) | [memory-improvements-roadmap.md](../roadmap/memory-improvements-roadmap.md) | `comp-memory`, `comp-knowledge-rag`, `memory` |
| Агенты/Совет | [agents-council-audit.md](./agents-council-audit.md) | [agents-council-improvements-roadmap.md](../roadmap/agents-council-improvements-roadmap.md) | `comp-agents-roles-skills`, `comp-crews-councils` |
| Провайдеры/LLM | [providers-llm-audit.md](./providers-llm-audit.md) | [providers-llm-improvements-roadmap.md](../roadmap/providers-llm-improvements-roadmap.md) | `comp-provider-runtime`, `comp-llm-pipeline`, `comp-routing` |
| События/Storage | [events-storage-audit.md](./events-storage-audit.md) | [events-storage-improvements-roadmap.md](../roadmap/events-storage-improvements-roadmap.md) | `comp-event-sourcing`, `comp-storage-timeline`, `comp-graph-eventbridge` |
| Когнитивные/Симуляция | [cognitive-simulation-audit.md](./cognitive-simulation-audit.md) | [cognitive-simulation-improvements-roadmap.md](../roadmap/cognitive-simulation-improvements-roadmap.md) | `comp-cognitive-orchestration`, `comp-simulation-world`, `comp-time-travel` |
| Флот/Governance | [fleet-governance-audit.md](./fleet-governance-audit.md) | [fleet-governance-improvements-roadmap.md](../roadmap/fleet-governance-improvements-roadmap.md) | `comp-fleet-governance` |
| Адаптеры | [adapters-audit.md](./adapters-audit.md) | [adapters-improvements-roadmap.md](../roadmap/adapters-improvements-roadmap.md) | `comp-adapter-*` |
| Утилиты | [utils-audit.md](./utils-audit.md) | [utils-improvements-roadmap.md](../roadmap/utils-improvements-roadmap.md) | `comp-util-*` |
| LLM-мост / Invocation | [llm-bridge-invocation-audit.md](./llm-bridge-invocation-audit.md) | [llm-bridge-invocation-improvements-roadmap.md](../roadmap/llm-bridge-invocation-improvements-roadmap.md) | `comp-llm-bridge`, `comp-invocation-meta` |

## Ключевые подтверждённые дефекты (сводно)

- **Debates:** `startDebate` всегда roundtable (исправлено), 33 DSL без runtime, mode-policies не применяются, 8+ стабов.
- **Память:** тройное дублирование записи, глобальный offline-флаг провайдера, `searchAdvanced` дорогой.
- **Агенты:** двойная таллировка совета, crew без LLM по умолчанию (EchoExecutor).
- **Провайдеры:** жёсткие списки `PRIORITY`/`SUPPORTED_PROVIDERS`, Vault не подключён, дублирование роутинга.
- **События:** лог ограничен 1000, таймлайн не персистентен, одна проекция.
- **Когнитивные:** `makeDecision`→`alts[0]`, `CausalTimeline.getTrace` пустой.
- **Флот:** Governance fail-open, дефолтные политики не исполняются, деплой статичен.
- **Адаптеры:** нет тестов у 4 адаптеров, Cloudflare/Nvidia теряют toolCalls.
- **Утилиты:** 4 орфана (constant-time, persist-then-emit, provider-fleet-health, debate-analysis).
- **Мост:** echo-fallback, наивный JSON-парсинг, ProjectInvocationBridge-заглушка.
