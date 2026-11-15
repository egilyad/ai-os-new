# Роадмап: LLM-слой (адаптеры, декораторы, реестр, HTTP/SSE, эмбеддинги)

> Область кода: `src/llm/`. Статус: «как есть» зафиксирован из кода (2026-10).

## Что есть сегодня

### 1. Провайдеры (`src/llm/adapters/` — фактически подпапки)

Единый базовый класс `BaseLLMAdapter` (`core/base-adapter.ts`) реализует публичный
контракт (`sendMessage/streamMessage/checkHealth/getAvailableModels/destroy`) и
делегирует в `doSendMessage/doStreamMessage`. Строит OpenAI-совместимый JSON-body
(маппинг `toolCalls→tool_calls`, `finishReason→SafetyError` и т.д.).

| Адаптер                                  | Тип                          | Особенности                                                                                                                                       |
| ---------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gemini (`gemini/`)                       | нативный                     | `:generateContent` + `:streamGenerateContent?alt=sse`, встроенный ретрай 429, отдельные мапперы                                                   |
| OpenRouter (`openrouter/`)               | нативный                     | через `/proxy/openrouter/api/v1`, `rotateKey`, reasoning-аккумулятор                                                                              |
| Anthropic (`anthropic/`)                 | нативный                     | Computer Use (`computer_20250124`), inline-изображения ≤5MB                                                                                       |
| OpenAI-compatible (`openai-compatible/`) | универсальный                | от него построены openai/together/fireworks/blackbox/scaleway/cometapi/github/mistral/cohere/azure/huggingface/perplexity/ollama/lmstudio/mercury |
| DeepSeek, Kimi, MiniMax, Qwen            | наследники OpenAI-compatible | суффикс `:thinking`, reasoning_effort                                                                                                             |
| Groq (`groq/`)                           | нативный (SDK)               | trimMessagesForGroq, idle-таймер 30s                                                                                                              |
| NVIDIA NIM (`nvidia/`)                   | нативный                     | через `/proxy/nvidia`                                                                                                                             |
| Cerebras, Cloudflare                     | нативный/наследник           | free-tier, Cloudflare: `data.result.response`                                                                                                     |
| Gemini Computer Use (`gemini-computer/`) | нативный                     | Interactions API, `previous_interaction_id`, нормализация координат                                                                               |
| Mock (`mock/`)                           | тестовый                     | echo/preset/lorem/error                                                                                                                           |

Также: `free-tiers.ts` (реестр бесплатных тарифов), `catalog/models-catalog.ts`
(автогенерация из models.dev).

### 2. Декораторы (`src/llm/decorators/`) — 13 шт.

Все наследуют `BaseDecorator` и образуют «луковицу» вокруг реального адаптера.
Стандартная цепочка (порядок из `adapter-factory.ts`):
`адаптер → RateLimit → Retry → CircuitBreaker → PriorityQueue → CostManager → Cache → Logging`.
Дополнительно написаны, но **не подключаются** по умолчанию: SemanticRouter,
CanaryRouter, CompressRoute.

| Декоратор      | Что даёт                                                                                        |
| -------------- | ----------------------------------------------------------------------------------------------- |
| Logging        | время, токены, чанки, sanitize-ошибки                                                           |
| Cache          | TTL-кэш + приближённый семантический кэш (FNV-1a 128D + cosine, порог 0.85), защита от stampede |
| Fallback       | основной+запасной провайдер, `keyForFallback` (не утекает ключ)                                 |
| CircuitBreaker | closed/open/half-open по-ключевой, crossTab-синхронизация                                       |
| Retry          | экспоненциальный backoff + джиттер, кап 30s (не ретраит 429/401/403)                            |
| RateLimit      | token bucket (глобальный + по `provider+key`)                                                   |
| PriorityQueue  | high/normal/low, maxConcurrency 4, анти-голодание                                               |
| SemanticRouter | маршрутизация по сложности запроса (быстрый/мощный провайдер)                                   |
| CanaryRouter   | A/B между таргетами + «липкая сессия», статистика                                               |
| CompressRoute  | автосжатие сообщений при >maxTokens (truncate/drop-system)                                      |
| CostManager    | подсчёт стоимости на клиенте, бюджеты день/неделя/месяц, block/downgrade                        |

Альтернатива декораторам — `MiddlewarePipeline` (`core/middleware-pipeline.ts`) с
ValidationMiddleware / ModerationMiddleware / LoggingMiddleware.

### 3. HTTP и SSE (`src/llm/http/`)

- `llm-http-client.ts`: глобальный семафор на 50 конкурентных запросов, реестр
  in-flight (для `cancelAll()`), таймауты (60s дефолт, 120s у провайдеров),
  маппинг статусов → AuthError/RetryableError/LLMError.
- `sse-parser.ts`: аккумулятор многострочных SSE-событий, буфер-кап 10MB,
  idle-таймер, корректный abort (синхронный `controller.error()`).

### 4. Реестр (`registry/adapter-factory.ts`)

- `SUPPORTED_PROVIDERS` — 26+ слогов. `create(provider)` — кэширующая фабрика + накрутка декораторов.
- `createWithFallback(primary, fallback, keyResolver)` — мемоизация.
- `invalidateCache/resetCircuitBreaker/syncCircuitBreakerState/syncRateLimitState`.

### 5. Эмбеддинги (`embeddings/`)

- `embedding-client.ts`: транспортный клиент к OpenAI-совместимому `/embeddings`
  (таймаут 30s, L2-нормализация, Matryoshka `dimensions`).
- Внимание: семантический кэш в `cache-decorator` использует НЕ этот клиент, а
  локальную FNV-1a аппроксимацию.

---

## Пробелы и риски

1. **SemanticRouter / CanaryRouter / CompressRoute не подключены** — готовый функционал простаивает.
2. **Кэш в стриме без in-flight dedup** (W6-039): потенциальный stampede на streamMessage.
3. **Жёсткий список провайдеров** в дебатах (`PRIORITY`/`SUPPORTED_PROVIDERS`) — новый провайдер требует правки кода.
4. **Эмбеддинги**: провайдерский клиент и локальная хэш-аппроксимация — два разных мира;
   единого API для «офлайн vs онлайн» эмбеддингов нет.
5. **Нет «серверного» mode**: весь LLM-трафик из браузера (CORS/прокси-флаги).
6. **Семантический кэш — не настоящие эмбеддинги** (FNV-хэш) — низкая точность.
7. Модельный каталог (`models-catalog.ts`) генерируется из models.dev — нет автообновления и проверки «свежести».

---

## Роадмап

### P0 — Заделка (сразу)

- [ ] Подключить `SemanticRouter` в стандартную цепочку (за флагом, но включённым по умолчанию на дефолтном сценарии).
- [ ] Добавить in-flight dedup для `CacheDecorator.streamMessage` (по аналогии с `#inFlight` в non-stream).
- [ ] Сделать список провайдеров дебатов data-driven (убрать `PRIORITY`/`SUPPORTED_PROVIDERS` из кода в конфиг/каталог).

### P1 — Единый контракт эмбеддингов

- [ ] Ввести интерфейс `IEmbeddingProvider` (в `kernel/contracts`), реализовать:
  - провайдерский (`EmbeddingClient`, уже есть),
  - офлайн-хэш-фолбэк (уже есть в memory),
  - (новое) локальный embedding через Transformers.js-модель в Web Worker.
- [ ] Дать единый сервис `embedding-service.ts`, который сам выбирает бэкенд и следит за размерностью (сейчас пространства hash/provider не смешиваются — это норм, но надо централизовать).

### P1 — Кэш и бюджет

- [ ] Переписать семантический кэш на настоящие эмбеддинги (когда появится единый `IEmbeddingProvider`) или явно задокументировать аппроксимацию.
- [ ] `CostManager`: добавить серверный/дурабельный ledger (сейчас это не ledger), учёт по паре `provider+key+model`.
- [ ] Добавить «репутацию провайдеров» (общая метрика успешности/латентности/стоимости) — пригодится и для роутера, и для дебатов.

### P2 — Новые провайдеры и функции

- [ ] **Стриминг reasoning/thinking** унифицировать (сейчас у каждого адаптера свой парсер) — единый `ReasoningAccumulator`.
- [ ] Поддержка **tool-choice/structured-output** (JSON-schema) на уровне `BaseLLMAdapter` (для многих провайдеров это `response_format`).
- [ ] **Провайдер-агрегатор**: виртуальный «логический провайдер», который объединяет несколько ключей одного провайдера (уже есть KeyPool — довести до уровня адаптера).
- [ ] **Мультимодальность**: вход изображений/аудио для провайдеров, которые это поддерживают (Anthropic уже умеет inline-картинки; Gemini — тоже).

### P3 — Платформа

- [ ] **Каталог моделей: автообновление** из models.dev по расписанию + валидация «живых» моделей через health-check.
- [ ] **Прокси-режим**: единый HTTP-клиент с перенаправлением через собственный sync-server (чтобы не зависеть от public CORS).

### P4 — Исследования

- [ ] Сравнение точности кэша: FNV-аппроксимация vs настоящие эмбеддинги (метрика hit/miss и ложных срабатываний).
- [ ] Измерить эффект SemanticRouter на стоимость/латентность (A/B через CanaryRouter).

---

## Критерии «готово» (definition of done)

- Все 13 декораторов подключены и покрыты тестами; SemanticRouter/CanaryRouter/CompressRoute — в проде.
- Единый `IEmbeddingProvider` + сервис выбора бэкенда.
- Нет `PRIORITY`/`SUPPORTED_PROVIDERS` в коде — всё в конфиге.
- Вновь добавленный провайдер подключается без правки ядра (только конфиг + опциональный адаптер).

---

## Уточнения по коду и лучшим практикам (после глубокого изучения + веб-исследования)

### Факты из кода (2026-10)

- `AdapterFactory.create()` собирает цепочку: `адаптер → RateLimit → Retry → CircuitBreaker → PriorityQueue → CostManager → Cache → Logging`. `SemanticRouter/CanaryRouter/CompressRoute` написаны, но **не авто-подключаются**.
- `MiddlewarePipeline` (`core/middleware-pipeline.ts`) — альтернативный механизм (Validation/Moderation/LoggingMiddleware).
- `EmbeddingClient` (embeddings/) — транспорт к `/embeddings`; семантический кэш в `cache-decorator` использует **не** его, а FNV-1a-аппроксимацию.
- HTTP: семафор на 50 конкурентных, реестр in-flight, таймауты 60/120s, маппинг статусов.
- SSE: аккумулятор, буфер 10MB, idle-таймер, корректный abort.

### Лучшие практики маршрутизации (из исследования: RouteLLM, Semantic Router, LiteLLM, GPTCache)

1. **Семантический кэш — первым** (дешёвый хит). Порог схожести калибровать по **false-positive rate** (ложный hit дороже вызова). Пропускать при `temperature>0` (стохастика). Использовать эмбеддинги (SPEC_02) вместо FNV.
2. **SemanticRouter** (Aurelio-паттерн): `fit(X,y)→confidence_threshold`, Chain (быстрый сначала, медленный при неуверенности). Калибровать порог на нашем трафике.
3. **RouteLLM-подход**: порог «сильная модель» калибруется по целевому проценту вызовов сильной модели (кривая стоимость↔качество), а не вручную.
4. **LiteLLM-классы ошибок**: раздельные fallback для `context_window` (→ модель с большим окном), `content_policy` (→ другой провайдер), rate-limit/5xx (→ cooldown `allowed_fails`/`cooldown_time`). Переиспользовать `classifyLlmError`.
5. **Pre-call checks**: фильтрация кандидатов по размеру контекста/vision-возможностям до вызова.
6. **Traffic mirroring** (silent A/B): дублировать долю трафика на сильную модель для оффлайн-оценки качества роутера (без влияния на латентность).
7. **Декоратор-гигиена**: каждый декоратор измерим индивидуально (какой % времени/стоимости добавляет), чтобы роутер/UCB1 не дублировались внутри декораторов; держать выключенные под фиче-флагом.
8. **Метрики роутинга**: экономия $, p50/p95 латентность, «сильная-модель call rate», hit-rate кэша, false-positive rate, % успешных с fallback. → в `MetricsService` (SPEC_03).
