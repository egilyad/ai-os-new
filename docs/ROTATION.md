# Rotation — как Шас сейчас выбирает ключ и модель

> Дата: 2026-09-09. Этап T1.1. Только механика, без кода. Прочитано по факту, не по памяти.

## 0. Главное открытие
Словом «ротация» названы **три разные вещи**:
1. **Per-request выбор ключа** — pool-selector (round-robin / least-usage / random) + router scoring. Это то, что Evgeny имеет в виду под «ротацией».
2. **RotationService** (`phase2`, `rotation-service.ts`) — это TTL-ротация секретов (истёк TTL → `adapter.rotateKey` → старый в `inactive`), тикает раз в 60с. К per-request выбору **отношения не имеет**.
3. **Session-affinity** — привязка сессии к `keyId` (`router-ranking.ts:94-145`): если bound-ключ здоров (`health>=75`, без circuit/rate/auth флагов) — используется только он.

## 1. Выбор ключа: pool-selector
`key-management/key-pool-selector.ts:65-91` (делегация из `key-service.ts:755`):
1. Пул = `status==='active'` + тот же provider, минус `isKeyQuotaExhausted` (concurrent-лимит + дневные requests/tokens).
2. Стратегия: `strategies[provider] || 'round-robin'` — round-robin (`index=(idx+1)%len`), least-usage (min `usageToday.requests`), random (SeededRng/Mulberry32).
3. `selectWithBurst` (`:149-174`): сначала primary; если всё исчерпано — берёт самый успешный (`successCount desc`) ключ из той же группы через `groupManager`.

## 2. Выбор провайдера: router scoring
`router-ranking.ts:80-583` (вход — `getRankedProviders`):
1. Session-affinity short-circuit — bound keyId.
2. Фильтр: скип при `circuitOpen/rateLimited/authFailed` или `health<75`; пусто → grace `health>=25`.
3. Policy-фильтр (`policyService.checkAgentPolicy`).
4. Скоринг: `reliability/TTFT/TPS/stability/reputation + exploration(UCB) + keyReputation + affinity + priority − cost − latency − budget`, `score>0`, sort desc. Возвращает ВЕСЬ ранжированный список.
5. Для дебатов отдельно: `router-debate-selector.ts` — 1 ключ на провайдера, сортировка хардкодом `PRIORITY=[groq,gemini,openrouter,nvidia,…]`, `slice(0,count)`.

## 3. Per-path: кто что решает
| Путь | Провайдер | Ключ | Модель |
|------|-----------|------|--------|
| **Debate** | `debate-query-engine.resolveProvider`: participant.provider → cached map → model-совместимый ключ → `getDebateProviders(5)` → `getRankedProviders('performance')` → brute-force | Внутри выбранного провайдера — pool-selector | `pickBestModelForDebate`: requested (если compatible) → `DEBATE_MODEL_PRIORITY[provider]` → `availableModels` → skip-модели. Preflight-проба перед стартом |
| **Teams** | Нет роутера | **Random active key** (`role-team-service.ts:462-464`), без quota/health/backoff/policy | Хардкод `providerDefaults` (gemini/groq/openrouter/nvidia) иначе `gpt-3.5-turbo` |
| **Chat** | `chat-executor`: `auto/race` → `router.getRankedProviders('content')`, берут `ranked[0]`; явный провайдер — без роутинга | Внутри `LLMClientService.chat` → `selectWithBurst ?? selectFromPool` в момент отправки | `req.model \|\| 'default'` — строка уходит в адаптер verbatim; fallback-цикл: 429 → `resolveWithFallback` + exclude, ошибка → `getDowngradedModel` retry, глубина 3 |
| **Probe** | — | `probe-service.probeKey`: `model \|\| DEFAULT \|\| availableModels[0]` | `PROVDER_DEFAULTS` + `PROBE_FALLBACKS`, таймаут 15с, классификация ready/degraded/limited/broken |

## 4. Скипы и восстановление
- Скип ключа: circuit/rate/auth флаги `keyStateStore`, `health<75`, backoff, quota, policy, score=0 — пишется в `skipped[]` со stage.
- `keyStateStore`: 401/402/403 → `authFailed`, 429/quota → `rateLimited`; вес роутинга `health>=75?1:>=50?0.5:>=25?0.25:>=10?0.1:0` (halved при `consecutiveErrors>3`); восстановление медленное (`RECOVERY_RATE_PER_MIN`, `rateLimited` снимается через 30 мин).
- Backoff: `1000ms → 120000ms` doubling (`config-registry.ts:165-166`).

## 5. Найденные дыры (кандидаты в работу T1–T2, НЕ чинить сейчас)
1. **UI `keyId` в чатах ключ НЕ пинит** (`chat-executor.ts:254` — `req.keyId` только для логов/событий, `apiKeyOverride` не пробрасывается). Привязка чата к ключу (T2) потребует проброса override в `llmClient.sendMessage`.
2. **Teams вообще без роутера/health/fallback** — random key, single attempt. Привязка (T1.3) и так его перепишет частично.
3. **Ошибки чатов мапятся не на тот ключ**: `handleProviderError(keyId||currentProvider)` берёт UI-`keyId`, а не реально использованный pool-ключ — per-key статистика врёт.
4. **`auto`/`default` модели резолвятся внутри адаптеров**, не в роутере — единый список «что реально уйдёт» собрать нельзя без чтения адаптеров.
5. Живые веса скоринга могут ехать из DB (`RouterConfigManager`) поверх `config-registry` — какой профиль активен, не проверено.

**STOP — T1.1 done. Дальше T1.2 (панель ротации) — нужен GO.**
