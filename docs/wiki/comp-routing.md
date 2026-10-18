<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: роутинг и провайдеры

> Раздел: **Компоненты и сервисы** · Статус: verified · Теги: компоненты, роутинг, провайдеры, стратегии

Источники: `src/kernel/services/provider-router.ts`, `src/kernel/services/router-types.ts`, `src/kernel/services/router-scoring.ts`, `src/kernel/services/provider-adapter-registry.ts`, `src/kernel/services/provider-tracker.ts`, `src/kernel/services/router-config-manager.ts`, `src/kernel/services/llm-client-service.ts`

## Назначение

Для каждого LLM-запроса выбрать оптимальный провайдер/ключ с учётом качества, стоимости, латентности, надёжности и политик — и объяснить решение.

## Возможности

- **9 стратегий** (`RoutingStrategy`): `broadcast`, `performance`, `reliability`, `latency`, `auto`, `race`, `cost`, `free_first`, `content`.
- Скоринг из компонентов: базовый скор + `stabilityBonus`, `reputationBonus`, `keyReputationBonus`, `affinityBonus`, `priorityBonus`, `explorationBonus` и штрафы `costPenalty`, `latencyPenalty`, `budgetPenalty`.
- A/B-тесты, сессионная аффинити, нормализация весов, A/B-профили весов.
- Полная трассировка решения (`system:decision`) со списком пропущенных ключей и причиной.

## Реализация

- `RouterService` (`provider-router.ts`, ~475 строк); опирается на `RouterConfigManager`, `route-rules`, `router-request-classifier`, `RouterDecisionRecorder`, `RouterLatencyMonitor`, `RouterRankingService`, `RouterFallbackResolver`, `RouterDebateSelector`.
- `router-types.ts`: `SkippedKeyEntry.stage` ∈ `status/policy/quota/score/budget/unavailable/circuit/ratelimit/backoff/normalization/exclusion`; `DecisionOrigin` = `live/simulation/replay`.
- Скоринг: `router-scoring.ts` (`normalizeWeights`, `calculateProviderScore`, `getContentAffinity`, `estimateRequestCost`), сборка компонентов — в `router-rankings.ts`.
- `ProviderAdapterRegistry` (`provider-adapter-registry.ts`) — кеш адаптеров, pair-ключ provider+model, fallback key-resolver.
- `ProviderTracker` — EMA latency/TPS/error rate после каждого вызова (`ALPHA=0.15`).
- `LLMClientService` (`llm-client-service.ts`) — высокоуровневый клиент: `chat`, `getAdapter`, `getApiKey`.

## Неточности и пробелы

- В конфиге стратегия называется `freeFirst`, а в типе — `free_first` (расхождение ключа).
- **`WarmupService` отсутствует в коде** (в `SERVICES_RU.md` описан ошибочно).
- `HealthSlaService` помечен `@deprecated MOCK` — симулированный бэкенд.
- `ProbeService` (`probe-service.ts`): `PROBE_TIMEOUT = 15000` мс, не более 2 моделей за пробу, отменяется при heap > 180 МБ.

## Связи

- Ключи и их состояние — [Компонент: управление ключами провайдеров](./comp-key-management.md); деньги/лимиты — [Компонент: бюджет, цены и расход](./comp-budget-pricing.md); ограничения — [Компонент: политики, секреты и вебхуки](./comp-policy-security.md).
- Результат решения потребляют [Компонент: консистентность и дрейф](./comp-consistency.md) (TruthConsistencyMonitor) и Visualization-панели.

## Проверка работоспособности

- `llm-client-service.test.ts` (13 кейсов: провайдер по умолчанию/явный, отсутствие адаптера/ключа, override, streaming).
- `RouterService.latency.test.ts`, `router-services.test.ts` (classifyRequest, scoring, DowngradeStrategy), `provider-adapter-registry.test.ts`, `provider-stack.e2e.test.ts`.
- **Тестов нет:** `provider-router`, `router-rankings`, `router-config-manager`, `provider-tracker`, `probe-service`.

## Состояние

- Ядро роутинга подтверждено кодом и тестами (частями).
- Неточные имена из старой описи исправлены выше; прогрев провайдеров — не реализован.

---

## Связанные материалы

- [Компонент: управление ключами провайдеров](./comp-key-management.md)
- [Компонент: бюджет, цены и расход](./comp-budget-pricing.md)
- [Компонент: политики, секреты и вебхуки](./comp-policy-security.md)
- [Панель: Провайдеры и ключи](./panel-providers.md)
- [Панели: Умная маршрутизация](./panel-routing.md)

[← Все материалы](./README.md)
