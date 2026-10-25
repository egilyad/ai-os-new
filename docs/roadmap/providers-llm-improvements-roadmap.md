# Roadmap улучшений «Провайдеры / LLM-конвейер»

> **Источник:** аудит `docs/audits/providers-llm-audit.md` (P1–P9).
> **Ветка:** `ai-os-new-fix-debate-text-truncation`.

---

## Sprint 1 (P0) — быстрые фиксы

| Задача | ID | Сложность |
|---|---|---|
| Вынести списки провайдеров (`PRIORITY`, `SUPPORTED_PROVIDERS`) в конфиг/реестр | P1/P2 | средняя |
| Авто-wiring или явная документация трёх декораторов (semantic/canary/compress) | P3 | низкая |

## Sprint 2 (P1) — средние

| Задача | ID | Сложность |
|---|---|---|
| Переименовать/пометить кэш как «хэш-приближение» | P7 | низкая |
| Idle-эвикция состояния circuit breaker | P9 | средняя |
| Unit-тесты на `RouterRankingService`/`ProviderAdapterRegistry` | P8 | средняя |

## Sprint 3 (P2) — архитектура

| Задача | ID | Сложность |
|---|---|---|
| Подключить `KeyVault` (шифрование ключей) | P4 | высокая |
| Единый источник решения роутинга (убрать shadow-дублирование) | P5 | высокая |
| Реализовать/подключить batch-пути | P6 | средняя |

---

## Ссылки

- Реестр дефектов — `docs/audits/providers-llm-audit.md`.
- Вики: `comp-provider-runtime`, `comp-llm-pipeline`, `comp-llm-adapters`, `comp-routing`, `comp-key-management`, `comp-budget-pricing`.
