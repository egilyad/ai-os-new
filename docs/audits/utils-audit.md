# Аудит подсистемы «Утилиты/Инфраструктура» — реестр дефектов и рисков

> **Ветка:** `ai-os-new-fix-debate-text-truncation`.
> **Метод:** чтение кода/grep (без запуска тестов), 2026-10. Статусы: `[V]` — подтверждено кодом; `[SA]` — статический анализ; `[NV]` — не проверено.

---

## 1. Орфаны (файл есть, но в src НЕ импортируется)

| Утилита | Функции | Статус |
|---|---|---|
| `utils/constant-time.ts` | `constantTimeEqual` | [V] орфан |
| `utils/persist-then-emit.ts` | `persistThenEmit`, `Outbox` | [V] орфан |
| `utils/provider-fleet-health.ts` | `summarizeProviderFleet`, `summarizeAllProviders` | [V] орфан |
| `utils/debate-analysis.ts` | `detectFallacies`, `analyzeDebate`, `FALLACY_LABELS` | [V] орфан |

## 2. Отсутствующие файлы (не существуют)

- `utils/memory.ts` (нет `currentHeapMB` — есть `MemoryWatchdog.currentMB()` и `probe-service.ts:409`).
- `utils/persistence-helpers.ts`.
- `services/observability/`.
- `services/seed*`.

## 3. Непокрытые тестами утилиты

`embedding.ts`, `seedable-rng.ts`, `memory-tracker.ts`, `memory-watchdog.ts`, `compute-memory-id.ts`, `safe-json.ts`, `with-transaction.ts`, `provider-default-models.ts`, `provider-fleet-health.ts`, `persist-then-emit.ts`, `constant-time.ts`, `debate-analysis.ts`, `topic-suggestions.ts`, `tokenEstimate.ts`, `probe-service.ts`, `ssr-storage.ts`.

Есть тесты только: `network.test.ts`, `llm-http-client.test.ts`, `memory-vector-space.test.ts`.

## 4. Прочие риски

- `probe-service.ts` — единственный сервис в этих 5 темах без теста, несмотря на критичность (health-проверка ключей).
- Wiki-статьи не отражали орфанность и отсутствие тестов (исправлено в `wiki-components.ts`).

---

## 5. Рекомендуемые приоритеты

- **P0:** убрать/задокументировать 4 орфана (constant-time, persist-then-emit, provider-fleet-health, debate-analysis) — либо подключить, либо пометить как неиспользуемые.
- **P1:** добавить тесты на `probe-service`, `seedable-rng`, `tokenEstimate`, `provider-default-models`.
- **P2:** при необходимости подключить `Outbox`/`provider-fleet-health`/`debate-analysis` в реальные потоки.

Подробный план — `docs/roadmap/utils-improvements-roadmap.md`.
