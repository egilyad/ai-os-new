# Экономика: токены и стоимость (Cost / Token Economy)

> **Карта 17 из «супер-карт»** · дата генерации: 2026-10-31
> **Формат:** скелет — наполняется из аудитов/фактов. Парные: карты 1–10 + wave-аудиты.
> **Покрывает исходные идеи списков:** Стоимость сценариев в токенах/деньгах; топ-дорогие операции; кэширование; дешёвые модели; фоновые расходы; «невидимые» повторы.

---

## Назначение

Стоимость сценариев в токенах/деньгах; топ-дорогие операции; кэширование; дешёвые модели; фоновые расходы; «невидимые» повторы.

## Методология

Анализ вызовов LLM/API + карты: Cost/Token Economy, Cost Awareness, LLM Cost, Intelligence Cost.

## Что уже есть (факты из аудитов)

- W2-012 / W4-030: `CostManagerDecorator` работает в logging-only режиме ({ logCosts: true }) — block/downgrade не активны.
- W4-031: в чате нет pre-call budget-gate (`canUseProvider(estimatedCost)`/`canUseGlobal`); providerBudgets дефолт `{}` = unbounded.
- W4-032: `AgemsBudgetService.checkPlatformBudget` — hard-stop только через ручную UI-кнопку, не подключён к `STREAM_END`.
- W5-018: budget-gating на float-сравнении; W5-019: захардкожена цена per-token; W5-020: `recordSpend` принимал NaN/Infinity (исправлено).
- W5-021/022/024: `recordSpend` — только пост-хок леджер, без enforcement; `block_usage` — декларативно; нет cost-attribution для tool/agentic-loop.
- W6-031/032: cost-optimization period «мёртв»; `costHistory` count-cap занижал monthlySpend (исправлено → time-retention).
- W6-038: budget-exceeded маскировался под 429 → fallback/ретраи (исправлено → 402).

## Пробелы / риски

- Бюджет не блокирует дорогие вызовы до выполнения (post-hoc).
- Правильная стоимость не атрибутируется на tool-calls/агентов.
- Перемножение ретраев × фолбэков × кэш-таймаутов = неконтролируемый расход.
- Нет кэш-попаданий/промпт-кэша; дорогая модель на тривиальных задачах.

## Рекомендации

1. Pre-call budget-gate (оценка стоимости до вызова).
2. Атрибуция стоимости на request/tool/agent (recordSpend с enforcement).
3. Промпт/ответ-кэш + маршрутизация дешёвых задач на дешёвые модели.
4. Честные цены из pricing-сервиса (не hardcode).
5. Экспонировать стоимость сценария в UI.

---

## Источники-доноры

- `map-10-resource-consumption`
- `audit-wave4`
- `audit-wave6`
