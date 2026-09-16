# Model Defaults POST Audit — Groq/Nvidia Aug-2026 EOL

> Дата: 2026-09-09. Scope: только дефолтные model IDs, без логики роутинга/контрактов.

## Причина
- Groq: `llama-3.3-70b-versatile`, `llama-3.1-8b-instant` → `404 model_not_found` (decommissioned 16.08.2026, замена — Llama 4 Scout/Maverick, gpt-oss).
- Nvidia NIM hosted: `meta/llama-3.1-8b-instruct`, `meta/llama-3.3-70b-instruct` → `410 Gone, EOL 26.08.2026`.
- OpenRouter 402 — баланс, ID не трогали. Gemini 503 — транзиент, ID не трогали.

## Изменения (6 файлов, только значения)
| File | Было | Стало |
|------|------|-------|
| `utils/provider-default-models.ts` | groq `llama-3.3-70b-versatile`, nvidia `meta/llama-3.1-8b-instruct`, preferred старые списки | groq/nvidia `meta-llama/llama-4-maverick-17b-128e-instruct` / `meta/llama-4-maverick-17b-128e-instruct`, preferred `[maverick, scout]` |
| `services/probe-service.ts` | PROVDER_DEFAULTS + PROBE_FALLBACKS старые | Maverick default, Scout fallback |
| `services/debate-runtime/debate-query-engine.ts` | DEBATE_MODEL_PRIORITY groq/nvidia старые | Maverick + Scout |
| `services/role-team-service.ts` | providerDefaults старые | Maverick |
| `services/config-registry.ts` | medium `llama-3.3-70b-versatile`, default `llama-3.1-8b-instant` | medium Maverick, default Scout |
| `services/key-management/key-models.ts` | Groq/NVIDIA dropdown старые | Maverick + Scout |

## Guard-совместимость (проверено статически)
- `isModelCompatibleWithProvider`: `meta-llama/*` не матчится правилом `meta/` (там `meta/` со слэшем) → идёт в priority-list check → `p===groq` ✅; `meta/*` → `p===nvidia` ✅.
- `LARGE_MODEL_PATTERNS` (70b/120b) новые ID не матчат → короткие таймауты, ок.
- `fact-check-service.ts:219-224` уже читает `PROVIDER_DEFAULT_MODELS.groq` → чинится автоматически.

## Не тронуто (осознанно)
- Pricing maps (история), agent-profiles (персоны), route-rules, cost-optimization, tests, chat stores, topology-defaults, settings-service, insight-engine, agent-generator, workflow-types, chat-panel-utils — косметика/история, отдельным batch при необходимости.
- OpenRouter ID (`meta-llama/llama-3.1-8b-instruct` — это openrouter-slug, не Groq ID) и Gemini ID — живые.

## Verification
- Static ✅ (значения, guards, SSOT-цепочка).
- Runtime ⏳ NEEDS: debate start с 2 участниками → смотреть `agent:responded` вместо `agent:error 404/410`; probe-service `2+2` на groq/nvidia.

**STOP — жду вердикта.**
