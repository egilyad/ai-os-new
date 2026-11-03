# Спецификация: Единый MetricsService (метрический слой)

> Статус: готово к реализации. Приоритет: P1. Связано: `ROADMAP_06`, `ROADMAP_01` (репутация), `NEW_COMPONENTS №8`.

---

## 1. Проблема (факты из кода)

- Метрики разбросаны по сервисам: `percentile.ts` (utils), counters в key-аналитике, health-сервисы, budget-аналитика, cost-manager. Единого «дома» нет.
- Панели (AnalyticsPanel, KeyUsageAnalyticsPanel, DashboardPanel, MetricsPanel) читают разрозненные источники.
- Прогон для «репутации провайдеров» и eval-хаба требует консолидированных данных.

## 2. Цель

- Единый `MetricsService` (counters, histograms, gauges, percentiles) с персистентностью, retention и подпиской на изменения; панели читают его.

## 3. Контракт (в `src/kernel/contracts/metrics.ts`)

```ts
interface MetricPoint {
  ts: number;
  value: number;
  tags?: Record<string, string>;
}
interface IHistogram {
  count: number;
  sum: number;
  min: number;
  max: number;
  percentiles: Record<string, number>;
}
interface IMetricsService {
  inc(name: string, by?: number, tags?: Record<string, string>): void;
  record(name: string, value: number, tags?: Record<string, string>): void; // histogram
  gauge(name: string, value: number, tags?: Record<string, string>): void;
  snapshot(name?: string): Record<string, MetricSeries>; // для панелей
  subscribe(
    namePattern: string,
    cb: (series: MetricSeries) => void,
  ): () => void;
  flush(): Promise<void>; // в Dexie
}
```

- `MetricSeries = { name, kind: 'counter'|'histogram'|'gauge', points: MetricPoint[], summary: IHistogram }`.
- Теги: `provider`, `model`, `keyId`, `agentId`, `strategy`, `panel`.

## 4. Реализация

- Файл: `src/kernel/services/ops/metrics-service.ts`; регистрация в DI (фаза Tier2).
- Персистентность: запись в Dexie (`metrics` таблица) батчами (буфер, flush по таймеру/объёму); retention (срез по возрасту).
- Percentiles: pre-compute (p50/p90/p99) при flush; хранить агрегаты.
- События: `metrics:update` (throttled) для реактивных панелей.

## 5. Стандартные серии (первые)

- `llm.request.{latency,tokens_in,tokens_out,cost,retries}` (tags: provider/model/key).
- `llm.error.{status,kind}` (circuit open / rate limited / timeout / auth).
- `provider.health`, `provider.reputation` (EMA — из trust).
- `memory.{writes,reads,search_latency,hit_rate}`.
- `debate.{rounds,agents,verdict_confidence,duration}`.
- `tool.{calls,success,latency}` (tags: tool).
- `agent.{steps,handoffs}`.

## 6. Потребители

- Panels: AnalyticsPanel (перевести на MetricsService), DashboardPanel, KeyUsageAnalyticsPanel, RouterTraceView.
- Eval-хаб (SPEC_04) и репутация провайдеров (ROADMAP_01 P1) читают через него.
- OTel-экспорт (опция P2): экспортёр серий в JSON/OTel-формат.

## 7. Тесты

- inc/record/gauge, percentiles, теги, батч-flush, retention, подписка.

## 8. Definition of Done

- MetricsService в DI; панели читают его; батч-flush + retention работают; события/metric-панели обновляются.
