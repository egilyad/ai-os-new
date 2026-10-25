# Аудит подсистемы «Провайдеры / LLM-конвейер» — реестр дефектов и рисков

> **Ветка:** `ai-os-new-fix-debate-text-truncation`.
> **Метод:** чтение кода/grep (без запуска тестов), 2026-10. Статусы: `[V]` — подтверждено кодом; `[SA]` — статический анализ; `[NV]` — не проверено.

---

## 0. Карта подтверждённых фактов

- Единый источник правды роутинга: `RouterService` (`provider-router.ts`, 527 ст.) → `RouterRankingService` (608), `RouterFallbackResolver`, `RouterDebateSelector`.
- Адаптеры: `ProviderAdapterRegistry` → `AdapterFactory` (410 ст., нанизывание декораторов). Интерфейс `IProviderAdapter` (`sendMessage/streamMessage/batch/checkHealth/rotateKey`).
- Декораторы (порядок в `AdapterFactory.create()`): `Base → RateLimit → Retry → CircuitBreaker → PriorityQueue → CostManager → Cache → Logging`. Вне цепочки: `SemanticRouter`, `CanaryRouter`, `CompressRoute`.
- Ключи: `KeyService` (1098 ст.), `KeyVault` (AES-GCM+PBKDF2 600k) — **не подключён**, ключи plaintext.
- Бюджет: `BudgetService` (629 ст.), `CostManagerDecorator` (311). Ошибки: `LLMError/AuthError/RetryableError/SafetyError/ModelValidationError`; HTTP-таймаут 120с, семафор 50.

---

## 1. Дефекты и риски

| ID | Суть | Статус | Доказательство |
|---|---|---|---|
| P1 | Жёсткий `PRIORITY`-список провайдеров в дебатах (`router-debate-selector.ts:148-161`): gemini→groq→openrouter→nvidia→…; новый провайдер требует правки кода | [V] | `router-debate-selector.ts:148-161` |
| P2 | Жёсткий `SUPPORTED_PROVIDERS` и дублирование имён в switch `AdapterFactory.create` | [V] | `adapter-factory.ts:57-84,110-258` |
| P3 | Три декоратора (semantic-router/canary/compress-route) вне дефолтной цепочки — «почти-мёртвые» без явной композиции | [V] | `adapter-factory.ts:263-268` |
| P4 | `KeyVault` не подключён — ключи хранятся plaintext в IndexedDB; шифрование — только инфраструктура | [SA] | `key-vault.ts:34-39`, `key-service.ts:399-413` |
| P5 | Дублирование роутинга: `RouterRankingService` vs `KeyStateStore` (shadow-сравнение в live-режиме) | [V] | `router-ranking.ts:563-577` |
| P6 | Batch-пути отключены в `PriorityQueueDecorator` — `batchSendMessage` не реализует ни один адаптер | [V] | `priority-queue.ts:89-91,141-143`, `base-decorator.ts:64-76` |
| P7 | «Семантический» кэш — не семантический (FNV-хэш, 128-dim), прямо помечен в коде | [V] | `cache-decorator.ts:10-12,27-28` |
| P8 | Нет отдельных unit-тестов для `ProviderAdapterRegistry`, `RouterRankingService`, `RouterFallbackResolver`, `RouterDebateSelector` | [NV] | отсутствие `*.test.ts` |
| P9 | CircuitBreaker per-key state не имеет idle-эвикции — потенциальный рост map при простоящих ключах | [SA] | `circuit-breaker.ts` |

---

## 2. Рекомендуемые приоритеты

- **P0 (быстрые/безопасные):**
  - P1/P2 — вынести списки провайдеров в конфиг/реестр (не хардкодить в коде).
  - P3 — либо авто-wiring трёх декораторов через конфиг, либо явно задокументировать как опциональные.
- **P1 (средние):**
  - P7 — переименовать/пометить кэш как «хэш-приближение», а не семантический.
  - P9 — добавить idle-эвикцию состояния circuit breaker.
  - P8 — добавить unit-тесты на `RouterRankingService`/`ProviderAdapterRegistry`.
- **P2 (крупные):**
  - P4 — подключить `KeyVault` (шифрование ключей).
  - P5 — устранить дублирование роутинга (единый источник решения).
  - P6 — реализовать/подключить batch-пути.

Подробный план — `docs/roadmap/providers-llm-improvements-roadmap.md`.
