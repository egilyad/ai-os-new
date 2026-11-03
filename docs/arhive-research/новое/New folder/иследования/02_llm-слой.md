# Отчёт сабагента: LLM-слой (`src/llm/`)

Все пути относительно `src/llm/`. В `core/types.ts` `LLMProviderAdapter = IProviderAdapter` (из kernel/contracts/provider-adapter).

## 1. adapters/ — провайдеры

Каждый — подпапка; наследуют `BaseLLMAdapter` (`core/base-adapter.ts`): публичный контракт (sendMessage/streamMessage/checkHealth/getAvailableModels/destroy) + абстрактные doSendMessage/doStreamMessage; строит OpenAI-совместимый JSON-body; `finishReason` SAFETY/RECITATION → SafetyError.

| Провайдер           | Файл                                             | Тип            | Особенности                                                                                                                                        |
| ------------------- | ------------------------------------------------ | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gemini              | `gemini/gemini-adapter.ts`                       | нативный       | `:generateContent` + `:streamGenerateContent?alt=sse`; retry 429; валидация моделей; мапперы                                                       |
| OpenRouter          | `openrouter/openrouter-adapter.ts`               | нативный       | через `/proxy/openrouter/api/v1`; rotateKey; reasoning-аккумулятор; max_tokens 16384                                                               |
| Anthropic           | `anthropic/anthropic-adapter.ts`                 | нативный       | Computer Use (`computer_20250124`); `x-api-key`; inline-изображения ≤5MB; SSE-парсер                                                               |
| OpenAI-compatible   | `openai-compatible/openai-compatible-adapter.ts` | универсальный  | от него: openai/together/fireworks/blackbox/scaleway/cometapi/github/mistral/cohere/azure/huggingface/perplexity/ollama/lmstudio/mercury (пол 256) |
| DeepSeek            | `deepseek/`                                      | наследник      | `deepseek-reasoner/:thinking`, reasoning_effort: medium, reasoning_content, предупреждение ~900K                                                   |
| Kimi                | `kimi/`                                          | наследник      | `:thinking` → kimi-k2-thinking                                                                                                                     |
| MiniMax             | `minimax/`                                       | наследник      | api.minimax.io/v1, дефолт MiniMax-M1                                                                                                               |
| Qwen                | `qwen/`                                          | наследник      | DashScope OpenAI-compat; `:thinking` enable_thinking                                                                                               |
| Groq                | `groq/groq-adapter.ts`                           | нативный (SDK) | SDK dangerouslyAllowBrowser; trimMessagesForGroq; idle-таймер 30s; нормализация ошибок                                                             |
| NVIDIA NIM          | `nvidia/`                                        | нативный       | `/proxy/nvidia`; Zod; omitFields cachedContent                                                                                                     |
| Cerebras            | `cerebras/`                                      | наследник      | api.cerebras.ai/v1; getFreeTier                                                                                                                    |
| Cloudflare          | `cloudflare/`                                    | нативный       | ключ {account_id}:{api_token}; data.result.response; getFreeTier                                                                                   |
| Gemini Computer Use | `gemini-computer/`                               | нативный       | Interactions API; previous_interaction_id; нормализация координат; require_confirmation → блок                                                     |
| Mock                | `mock/mock-adapter.ts`                           | тестовый       | echo/preset/lorem/error                                                                                                                            |

Дополнительно: `free-tiers.ts` (реестр бесплатных тарифов), `catalog/models-catalog.ts` (автогенерация из models.dev).

## 2. decorators/ — 13 шт.

Все от `BaseDecorator`; образуют «луковицу». Стандартная цепочка: адаптер → RateLimit → Retry → CircuitBreaker → PriorityQueue → CostManager → Cache → Logging.

| Декоратор      | Что даёт                                                                                |
| -------------- | --------------------------------------------------------------------------------------- |
| Logging        | время, токены, чанки, sanitize                                                          |
| Cache          | TTL + семантический кэш (FNV-1a 128D + cosine 0.85), защита от stampede, LRU            |
| Fallback       | основной+запасной; keyForFallback (не утекает ключ); в стриме только до чанков          |
| CircuitBreaker | closed/open/half-open по-ключевой; crossTab-синхронизация                               |
| Retry          | экспоненциальный backoff + джиттер (кап 30s); не ретраит 429/401/403/abort/после чанков |
| RateLimit      | token bucket (глобальный + по provider+key)                                             |
| PriorityQueue  | high/normal/low; maxConcurrency 4; анти-голодание                                       |
| SemanticRouter | маршрутизация по сложности (не в цепочке по умолчанию)                                  |
| CanaryRouter   | A/B с весами; липкая сессия; статистика (не по умолчанию)                               |
| CompressRoute  | автосжатие при >maxTokens (truncate/drop-system) (не по умолчанию)                      |
| CostManager    | подсчёт стоимости, бюджеты день/неделя/месяц, block/downgrade                           |

Формат `MiddlewarePipeline` (`core/middleware-pipeline.ts`): ValidationMiddleware / ModerationMiddleware / LoggingMiddleware.

## 3. http/

- `llm-http-client.ts`: семафор на 50 конкурентных; реестр in-flight (cancelAll); таймауты 60s/120s; маппинг статусов → AuthError/RetryableError/LLMError; streamPost → StreamHandle.
- `sse-parser.ts`: аккумулятор многострочных SSE; буфер 10MB; idle-таймер; корректный abort (синхронный controller.error к bodyReader.cancel).

## 4. registry/

- `adapter-factory.ts`: SUPPORTED_PROVIDERS (26+); create(provider) — кэширующая фабрика + декораторы; createWithFallback (мемоизация); invalidateCache/resetCircuitBreaker/sync*.

## 5. embeddings/

- `embedding-client.ts`: транспорт к `/embeddings` (таймаут 30s, L2, Matryoshka dimensions). Семантический кэш использует FNV, не этот клиент.

## 6. core/

- `types.ts`, `base-adapter.ts`, `base-decorator.ts`, `errors.ts` (LLMError/RetryableError/SafetyError/ModelValidationError/AuthError), `request-builder.ts`, `flyweight.ts` (LLMFlyweightConfig), `middleware-pipeline.ts`.
