# 2026-11-24 — persistent-budget-guard

Статус: done

## Цель сессии

Ре-аудит P1-9: hard-stop бюджета был только in-memory и сбрасывался при перезагрузке.

## Что сделано (файлы + коммиты)

- `CostManagerConfig.budgetGuard` — асинхронная проверка персистентного бюджета перед запросом; при `blocked` выбрасывается `LLMError` 402 с причиной.
- `AdapterFactory.setBudgetGuard()` и `ProviderAdapterRegistry.setBudgetGuard()` — передача гейта в decorator.
- `phase1-foundation.ts` — гейт подключён к `agemsBudgetService.checkPlatformBudget('default')`.
- Тест «блокирует запрос по персистентному бюджету»; 7 тестов в пакете зелёные.

## Принятые решения (+ почему; кандидат в ADR?)

- Per-request проверка, а не разовая: бюджет может быть изменён внешне между запросами.
- Guard опциональный — владельцы адаптеров без DI продолжают работать с локальным бюджетом.
- Причина блокировки пробрасывается в LLMError, чтобы UI показывал конкретный лимит.

## Обнаруженные проблемы / гипотезы

- Факт: guard подключён только для адаптеров, созданных после `setBudgetGuard()`; кэшированные адаптеры не пересобираются.
- Гипотеза: если guard нужен для уже созданных адаптеров — добавить инвалидацию кэша в `setBudgetGuard`.
- ESLint: 0 ошибок, 2 предсуществующих предупреждения о слоях в provider-adapter-registry.

## Результаты проверок (typecheck/lint/test — что запускалось)

- `vitest run cost-manager.test.ts boot-smoke.test.ts` — 7/7; ESLint — 0 ошибок.
- Полный typecheck/E2E не запускались локально — оставить CI.

## Следующий логический шаг

P1-12: Groq обходит LLM-стек через `groq-sdk`; затем P2-1 (SSE Last-Event-ID).

---

## Факты (авто, из checkpoint.mjs)

- Ветка: main @ dff5566
- Изменённых файлов: 5
  - M src/kernel/service-registration/phase1-foundation.ts
  - M src/kernel/services/provider-adapter-registry.ts
  - M src/llm/decorators/cost-manager.test.ts
  - M src/llm/decorators/cost-manager.ts
  - M src/llm/registry/adapter-factory.ts
- Diff stat:
  - src/kernel/service-registration/phase1-foundation.ts | 2 ++
  - src/kernel/services/provider-adapter-registry.ts | 4 ++++
  - src/llm/decorators/cost-manager.test.ts | 18 ++++++++++++++++++
  - src/llm/decorators/cost-manager.ts | 11 +++++++++++
  - src/llm/registry/adapter-factory.ts | 10 +++++++++-
  - 5 files changed, 44 insertions(+), 1 deletion(-)
- Последние коммиты:
  - dff5566 fix(rate-limit): share global bucket across tabs
  - e01ebf8 fix(snapshot): restore live state after replay stops
  - 94da4db feat(validation): extend Zod hooks to ops tables
  - cad7454 fix(lock): add fencing tokens and fail-closed chat sends
  - feb984d fix(reaudit): secure secrets, init flags, batch aborts
